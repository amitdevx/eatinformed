'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthForm } from '@/components/features/AuthForm';
import { analyzeProduct } from '@/ai/flows/product-analysis';
import { type ProductAnalysisOutput } from '@/ai/flows/product-analysis-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UploadCloud, Camera, RefreshCw, AlertCircle, ScanLine, History, Trash2, Sparkles } from 'lucide-react';
import ResultsDisplay from '@/components/features/ResultsDisplay';
import { SAMPLE_PRODUCTS, type SampleProduct } from '@/lib/sample-products';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// ponytail: lightweight client-side scan history item (zero backend DB bloat)
interface HistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  brand: string;
  rating: number;
  novaGroup?: number;
  data: ProductAnalysisOutput;
  imagePreviewUrl?: string | null;
}

const LOADING_STEPS = [
  'Detecting packaging & label text with Vision AI...',
  'Extracting ingredients & nutrition facts table...',
  'Cross-referencing food additives with safety standards...',
  'Computing NOVA processing classification & balance...',
  'Finalizing comprehensive health assessment...'
];

export function CheckPageClient() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [openAuthModal, setOpenAuthModal] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>(LOADING_STEPS[0]);
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(16);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<ProductAnalysisOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);

  // Pre-warm /api/scan on mount so serverless runtime & sharp are warm before the user clicks Analyze
  useEffect(() => {
    fetch('/api/scan', { method: 'GET' }).catch(() => null);
  }, []);

  // Automatically load sample product if requested via query param
  useEffect(() => {
    const sampleParam = searchParams.get('sample');
    if (sampleParam) {
      const found = SAMPLE_PRODUCTS.find((p) => p.id === sampleParam);
      if (found) {
        setAnalysisData(found.data);
        setImagePreviewUrl(null);
        setError(null);
      }
    }
  }, [searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeTabRef = useRef('upload');

  // Load scan history from localStorage on initial client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eatinformed_history');
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load scan history from localStorage:', e);
    }
  }, []);

  // Save scan to history
  const saveToHistory = useCallback((data: ProductAnalysisOutput, previewUrl: string | null) => {
    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        productName: data.productName || 'Scanned Food Product',
        brand: data.brand || '',
        rating: data.rating,
        novaGroup: data.novaGroup,
        data,
        imagePreviewUrl: previewUrl,
      };

      // ponytail: only deduplicate by name for specific branded items; never erase unnamed scans
      const isGenericName = (name: string) =>
        !name || /^(scanned food product|packaged food item|food product)$/i.test(name.trim());

      setRecentScans((prev) => {
        const filtered = prev.filter((item) => {
          if (isGenericName(newItem.productName)) {
            return item.id !== newItem.id;
          }
          return item.productName.toLowerCase() !== newItem.productName.toLowerCase();
        });
        const updated = [newItem, ...filtered].slice(0, 6);
        try {
          localStorage.setItem('eatinformed_history', JSON.stringify(updated));
        } catch (e) {
          console.warn('localStorage quota reached, omitting preview image:', e);
          const fallback = updated.map(item => ({ ...item, imagePreviewUrl: null }));
          localStorage.setItem('eatinformed_history', JSON.stringify(fallback));
        }
        return updated;
      });
    } catch (err) {
      console.warn('Could not save to scan history:', err);
    }
  }, []);

  // Monotonic asymptotic progress ticker during AI analysis (never loops)
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setEtaSeconds(16);
      return;
    }

    const startTime = Date.now();
    const ESTIMATED_MS = 16000;
    setProgress(5);
    setLoadingStep(LOADING_STEPS[0]);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const targetProgress = Math.min(95, Math.floor((1 - Math.exp(-elapsed / (ESTIMATED_MS * 0.45))) * 95));
      setProgress((prev) => Math.max(prev, targetProgress));

      const stepIdx = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor((targetProgress / 95) * LOADING_STEPS.length)
      );
      setLoadingStep(LOADING_STEPS[stepIdx]);

      const remaining = Math.max(1, Math.ceil((ESTIMATED_MS - elapsed) / 1000));
      setEtaSeconds(remaining);
    }, 150);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Function to stop the camera stream and release resources
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCameraPermission(null);
  }, []);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);
  
  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access. Please use the upload option.',
        });
        return;
    }
    
    // Prefer the rear-facing camera for scanning product labels on mobile
    const videoConstraints = {
      video: { facingMode: 'environment' }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
      // ponytail: prevent camera hardware leak if user switched tabs while permission dialog was open
      if (activeTabRef.current !== 'camera') {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (err) {
      console.warn('Failed to get rear camera, trying default camera:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (activeTabRef.current !== 'camera') {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (fallbackErr) {
        console.error('Error accessing any camera:', fallbackErr);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Could not access camera. Please enable permissions in your browser settings.',
        });
      }
    }
  }, [toast]);
  
  const handleTabChange = useCallback((value: string) => {
    activeTabRef.current = value;
    if (value === 'camera' && hasCameraPermission === null) {
      getCameraPermission();
    } else if (value !== 'camera' && streamRef.current) {
      stopCameraStream();
    }
  }, [getCameraPermission, hasCameraPermission, stopCameraStream]);

  const resizeAndCompressImage = (dataUri: string, callback: (resizedUri: string) => void) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.95));
      } else {
        callback(dataUri);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load image for compression');
      callback(dataUri);
    };
    img.src = dataUri;
  };

  const processFile = (file: File | null | undefined) => {
    if (file) {
      const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!acceptedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PNG, JPG, or WEBP image.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        resizeAndCompressImage(dataUri, (compressedUri) => {
          setImagePreviewUrl(compressedUri);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        toast({
          variant: 'destructive',
          title: 'Camera Initializing',
          description: 'Please wait a moment for the camera feed to activate before capturing.',
        });
        return;
      }
      
      const MAX_DIM = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.95);
        setImagePreviewUrl(dataUri);
        stopCameraStream();
      }
    }
  };

  const handleScan = useCallback(async (photoDataUri: string) => {
    // Restrict scanning to authenticated or guest sessions
    if (!user) {
      setOpenAuthModal(true);
      toast({
        title: 'Authentication Required',
        description: 'Please sign in or continue as Guest to analyze food labels.',
      });
      return;
    }

    // ponytail: release camera hardware stream immediately so it doesn't run in the background during scan
    stopCameraStream();
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    
    let lastResult: ProductAnalysisOutput | null = null;
    let lastError: any = null;

    // Transparently retry up to 2 attempts on transient cold-start or network glitches before failing
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await analyzeProduct(photoDataUri);
        if (result.status === 'success') {
          setProgress(100);
          setAnalysisData(result);
          saveToHistory(result, photoDataUri);
          setIsLoading(false);
          return;
        }
        lastResult = result;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (e: any) {
        lastError = e;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    if (lastResult) {
      const detail = lastResult.warnings?.[0] || lastResult.nutrition?.rawText;
      if (lastResult.status === 'unreadable') {
        setError(detail || 'The image was unreadable. Please upload or capture a clearer photo of the product label.');
      } else if (lastResult.status === 'no_data') {
        setError(detail || "We couldn't find any ingredient or nutrition text on the label. Please try a different image.");
      } else {
        setError(detail || 'Analysis could not be completed for this image.');
      }
    } else {
      console.error('Scan failed:', lastError);
      setError('An unexpected error occurred during analysis. The AI service may be temporarily unavailable. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: lastError?.message || 'Could not process the image.',
      });
    }
    setIsLoading(false);
  }, [user, toast, saveToHistory, stopCameraStream]);
  
  const handleReset = () => {
    stopCameraStream();
    setImagePreviewUrl(null);
    setAnalysisData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sample: SampleProduct) => {
    setError(null);
    setImagePreviewUrl(null);
    setAnalysisData(sample.data);
    toast({
      title: `Loaded ${sample.title}`,
      description: 'Demo product analysis loaded instantly.',
    });
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setError(null);
    setImagePreviewUrl(item.imagePreviewUrl || null);
    setAnalysisData(item.data);
    toast({
      title: `Restored ${item.productName}`,
      description: 'Loaded from your recent scan history.',
    });
  };

  const handleClearHistory = () => {
    setRecentScans([]);
    try {
      localStorage.removeItem('eatinformed_history');
    } catch (e) {
      console.warn('Failed to clear scan history:', e);
    }
    toast({
      title: 'History Cleared',
      description: 'Local scan history has been cleared.',
    });
  };

  if (analysisData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ResultsDisplay data={analysisData} imagePreviewUrl={imagePreviewUrl} />
        <div className="text-center mt-10 mb-8">
          <Button onClick={handleReset} size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-xs sm:text-sm font-semibold px-7 py-3 transition-all active:scale-[0.98]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Another Product
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full bg-card border border-border shadow-sm rounded-3xl p-6 sm:p-8">
          <CardHeader className="text-center p-0 mb-6">
            <CardTitle className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center justify-center gap-2">
                <ScanLine className="h-6 w-6 text-primary"/>
                Scan a Product
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {imagePreviewUrl ? "Confirm the image is clear, then start the analysis." : "Upload a clear image of a food label or use your camera to get an instant health analysis."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center space-y-6 py-12"
              >
                <div className="h-14 w-14 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-1.5 max-w-sm px-4">
                  <p className="text-base font-semibold text-foreground transition-all duration-300">{loadingStep}</p>
                  <p className="text-xs text-muted-foreground">Analyzing food label with NVIDIA vision & nutrition reasoning models.</p>
                </div>
                <div className="w-full max-w-xs space-y-2 px-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                    <span>{progress}%</span>
                    <span>{progress >= 95 ? 'Wrapping up...' : `~${etaSeconds}s remaining`}</span>
                  </div>
                </div>
              </motion.div>
            ) : imagePreviewUrl ? (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-6 py-6"
              >
                <p className="font-semibold text-lg text-foreground">Is this image clear?</p>
                <motion.div whileHover={{ scale: 1.05 }} className="relative rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20">
                  <Image 
                    src={imagePreviewUrl} 
                    alt="Selected food label preview" 
                    width={240}
                    height={240}
                    className="max-h-60 w-auto object-contain bg-black/40"
                  />
                </motion.div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  A clear photo of the ingredients list & nutrition facts provides the most accurate results.
                </p>
                <div className="flex w-full justify-center space-x-4 pt-4">
                  <Button variant="outline" onClick={handleReset} className="rounded-full border-border bg-card hover:bg-muted text-foreground text-xs font-semibold px-5 py-2">
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try Again
                  </Button>
                  <Button onClick={() => handleScan(imagePreviewUrl!)} className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-5 py-2">
                    <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                    Analyze Label
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Tabs defaultValue="upload" className="w-full" onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border rounded-full p-1 max-w-xs mx-auto mb-6">
                    <TabsTrigger value="upload" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground text-xs font-semibold py-1.5 transition-all">
                      <UploadCloud className="mr-1.5 h-4 w-4"/> Upload
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground text-xs font-semibold py-1.5 transition-all">
                      <Camera className="mr-1.5 h-4 w-4" /> Camera
                    </TabsTrigger>
                  </TabsList>
                  <div className="mt-8">
                    <TabsContent value="upload" className="m-0">
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className={cn(
                            "flex flex-col items-center justify-center space-y-3 p-8 sm:p-10 border-2 border-dashed rounded-2xl transition-all duration-200",
                            isDragging ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30 bg-muted/20"
                          )}
                        >
                            <div className="p-3 rounded-full bg-muted text-foreground mb-1">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <div className="text-center">
                              <Label htmlFor="file-upload" className="text-sm font-semibold text-foreground cursor-pointer hover:underline block">
                                  Click to upload label image
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">or drag and drop into frame</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground px-2 py-0.5 bg-muted rounded-full">PNG, JPG, or WEBP</p>
                            <Input
                                id="file-upload"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="camera" className="m-0">
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-black shadow-inner">
                        <video ref={videoRef} className="w-full aspect-video object-cover" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* ponytail: viewfinder frame guide overlay */}
                        {hasCameraPermission === true && (
                          <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-primary/40 rounded-xl flex flex-col justify-between p-3">
                            <div className="flex justify-between items-start">
                              <div className="w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl" />
                              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/70 text-white/90 border border-white/10 backdrop-blur-sm">
                                Align Label In Frame
                              </span>
                              <div className="w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr" />
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl" />
                              <div className="w-5 h-5 border-b-2 border-r-2 border-primary rounded-br" />
                            </div>
                          </div>
                        )}

                        {hasCameraPermission === false && (
                            <div className="p-6">
                              <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Camera Access Required</AlertTitle>
                                  <AlertDescription>
                                    Please allow camera access in your browser settings to scan with your camera.
                                  </AlertDescription>
                              </Alert>
                            </div>
                        )}
                         {hasCameraPermission === true && (
                             <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <Button onClick={handleCapture} size="lg" className="rounded-full shadow-lg shadow-black/50 backdrop-blur-md bg-primary/90 hover:bg-primary border border-white/20 hover:scale-105 transition-transform">
                                    <Camera className="mr-2 h-5 w-5" /> Capture Label
                                </Button>
                             </div>
                         )}
                         {hasCameraPermission === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-sm text-white/80">Requesting camera access...</p>
                            </div>
                         )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                {/* 1-click sample demo labels */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-1.5 justify-center mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Or try an instant sample label</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_PRODUCTS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        className="flex flex-col items-start p-3 rounded-2xl border border-border bg-muted/30 hover:bg-muted/80 transition-all text-left group"
                      >
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {sample.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {sample.subtitle}
                        </span>
                        <span className={cn("text-[10px] mt-2 px-2 py-0.5 rounded-full border font-semibold", sample.badgeColor)}>
                          {sample.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-semibold">Analysis Notice</AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground mt-0.5">{error}</AlertDescription>
                  </Alert>
                </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Instant local scan history */}
      {recentScans.length > 0 && !imagePreviewUrl && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Scans</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {recentScans.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentScans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => handleSelectHistoryItem(scan)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/60 transition-all text-left group"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {scan.productName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {scan.brand ? `${scan.brand} - ` : ''}{new Date(scan.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {scan.novaGroup && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                      NOVA {scan.novaGroup}
                    </span>
                  )}
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                    scan.rating >= 4 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" :
                    scan.rating >= 2.5 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25" :
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  )}>
                    {scan.rating.toFixed(1)} / 5
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Auth Gate Dialog for unauthenticated scans */}
      <Dialog open={openAuthModal} onOpenChange={setOpenAuthModal}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Authentication Required</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sign in with Google, Email, or Guest Mode to analyze food labels and track nutrition.
            </DialogDescription>
          </DialogHeader>
          <AuthForm
            initialTab="login"
            onAuthSuccess={() => {
              setOpenAuthModal(false);
              if (imagePreviewUrl) {
                handleScan(imagePreviewUrl);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
