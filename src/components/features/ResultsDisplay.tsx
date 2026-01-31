'use client';

import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import type { ExtractIngredientsOutput } from '@/ai/flows/extract-ingredients-types';
import type { AssessHealthSafetyOutput } from '@/ai/flows/assess-health-safety-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, ListChecks, FileText, ClipboardX, ShieldAlert, CheckCircle, XCircle, Share2, Download, Copy, Twitter } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NutritionChart from './NutritionChart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { SITE_URL } from '@/lib/constants';

interface ResultsDisplayProps {
  ingredientsData: ExtractIngredientsOutput | null;
  assessmentData: AssessHealthSafetyOutput | null;
  imagePreviewUrl?: string | null; 
}

const ResultSection = ({ title, icon, children, hidden = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, hidden?: boolean }) => {
  if (hidden) return null;
  return (
    <div className="py-4">
      <h3 className="text-xl font-bold flex items-center mb-4 text-foreground/90">
        {icon}
        <span className="ml-3">{title}</span>
      </h3>
      <div className="pl-10 text-base text-muted-foreground">{children}</div>
    </div>
  );
};

const BulletList = ({ items, variant }: { items: string[], variant: 'pros' | 'cons' | 'warnings' | 'suitability' }) => {
  const iconMap = {
    pros: <CheckCircle className="h-5 w-5 text-green-500" />,
    cons: <XCircle className="h-5 w-5 text-red-500" />,
    warnings: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    suitability: <XCircle className="h-5 w-5 text-muted-foreground" />,
  };
  
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <div className="mr-3 mt-0.5 shrink-0">{iconMap[variant]}</div>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    focusable="false"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    {...props}
  >
    <path
      fill="currentColor"
      d="M380.9 97.1C346.6 62.8 298.7 44 249.9 44c-104.7 0-190 85.3-190 190 0 33.6 8.7 65.4 24.8 93.6L44.8 464.1l102.7-27.1c27.1 15.3 57.9 24.2 89.8 24.2 104.7 0 190-85.3 190-190 0-48.8-18.8-96.7-52.8-131zM249.9 414c-28.7 0-56.3-9.7-80.3-26.8l-5.7-3.4-59.9 15.8 16.1-58.6-3.8-6c-18.2-28.7-29.1-62.5-29.1-98.4 0-82.8 67.2-150 150-150 40.8 0 79.2 16.1 108.3 45.2 29.1 29.1 45.2 67.5 45.2 108.3.1 82.8-67.1 150-149.9 150zm74.6-96.6c-3.9-2-22.9-11.3-26.5-12.6-3.6-1.3-6.2-2-8.8 2-2.6 4-10 12.6-12.3 15.2-2.3 2.6-4.5 2.9-8.4 1-3.9-1.9-16.4-6.1-31.2-19.2-11.5-10.1-19.5-22.6-21.8-26.5-2.3-4-0.2-6.1 1.8-8.1 1.8-1.8 3.9-4.5 5.9-6.8 2-2.3 2.6-3.9 3.9-6.5 1.3-2.6 0.7-4.9-0.3-6.8-1-1.9-8.8-21.1-12-28.9-3.1-7.8-6.3-6.7-8.8-6.8-2.3-0.1-4.9-0.1-7.5-0.1-2.6 0-6.8 1-10.5 4.9-3.7 3.9-14.2 13.9-14.2 33.9 0 20 14.5 39.3 16.5 41.8 2 2.6 28.7 46.2 69.8 61.1 9.8 3.6 18.6 5.8 25.1 7.5 9.7 2.5 18.6 2.2 25.6 1.3 7.8-0.9 22.9-9.4 26.2-18.5 3.3-9.1 3.3-17.1 2.3-18.5-1-1.4-3.6-2.3-7.5-4.3z"
    ></path>
  </svg>
);

export default function ResultsDisplay({ ingredientsData, assessmentData, imagePreviewUrl }: ResultsDisplayProps) {
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const generateSummaryText = useCallback(() => {
    if (!assessmentData) return '';
    const { rating, pros, cons } = assessmentData;
    const url = typeof window !== "undefined" ? window.location.origin : SITE_URL;
    // A concise summary formatted for social media, especially Twitter.
    let summary = `This product scored ${rating.toFixed(1)}/5 on EatInformed.`;
    if (pros.length > 0) {
      summary += `\n👍 Pro: ${pros[0]}`;
    }
    if (cons.length > 0) {
      summary += `\n👎 Con: ${cons[0]}`;
    }
    summary += `\n\nCheck your food's score: ${url}`;
    return summary;
  }, [assessmentData]);

  const handleDownloadImage = async () => {
    if (!resultsCardRef.current) return;
    try {
      const canvas = await html2canvas(resultsCardRef.current, {
        backgroundColor: '#0F172A',
        useCORS: true, 
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'eatinformed-results.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description: 'Could not create an image of the results.',
      });
    }
  };

  const handleCopySummary = useCallback(() => {
    const summary = generateSummaryText();
    navigator.clipboard.writeText(summary).then(() => {
      toast({ title: 'Copied to Clipboard!', description: 'Results summary has been copied.' });
    }).catch(err => {
      console.error('Failed to copy text:', err);
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy summary to clipboard.' });
    });
  }, [generateSummaryText, toast]);

  const handleShare = useCallback(async (platform: 'twitter' | 'whatsapp') => {
    const summaryText = generateSummaryText();
    const title = 'My Food Scan Results from EatInformed';

    // Advanced Share (Image + Text) using Web Share API
    if (navigator.share && resultsCardRef.current) {
      try {
        const canvas = await html2canvas(resultsCardRef.current, {
          backgroundColor: '#0F172A',
          useCORS: true,
        });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (blob) {
          const file = new File([blob], 'eatinformed-results.png', { type: 'image/png' });
          // Check if the browser can share this file
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              text: summaryText,
              files: [file],
            });
            return; // Exit after successful advanced share
          }
        }
      } catch (error: any) {
        // If user cancels the share dialog, it's not an error. Otherwise, log it and fall back.
        if (error.name !== 'AbortError') {
          console.error('Error using Web Share API with image, falling back:', error);
        } else {
          // User cancelled, so we don't proceed to the fallback.
          return;
        }
      }
    }

    // Fallback to simple text sharing
    const text = encodeURIComponent(summaryText);
    let shareUrl = '';

    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${text}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }, [generateSummaryText]);

  if (!assessmentData) {
    return null;
  }

  const isZeroRatingScenario = assessmentData.rating === 0;
  const dietInfo = assessmentData.dietaryInfo;
  const nutrition = ingredientsData?.nutrition;
  const hasStructuredNutrition = nutrition?.nutrients && nutrition.nutrients.length > 0;

  const renderStars = (rating: number) => {
    const totalStars = 5;
    return (
      <div className="flex items-center gap-1">
        {[...Array(totalStars)].map((_, index) => (
          <Star
            key={index}
            className={`h-8 w-8 ${index < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
        <span className="ml-3 text-3xl font-bold">{rating > 0 ? `${rating.toFixed(1)}/5` : 'N/A'}</span>
      </div>
    );
  };

  return (
    <Card ref={resultsCardRef} className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30 mt-8">
      <CardHeader className="text-center p-8">
        {imagePreviewUrl && (
          <div className="mb-6 flex justify-center">
            <Image 
              src={imagePreviewUrl} 
              alt="Scanned product label"
              width={240}
              height={240}
              className="max-h-60 w-auto rounded-lg border-2 border-white/10 object-contain"
            />
          </div>
        )}
        <CardTitle as="h2" className="text-4xl font-black">
            {isZeroRatingScenario ? "Analysis Incomplete" : "Analysis Complete"}
        </CardTitle>
        <div className="mt-6 flex flex-col items-center gap-2">
         {renderStars(assessmentData.rating)}
         <p className="text-muted-foreground text-lg">Health Rating</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-8">
        <Separator className="bg-white/10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ResultSection title="Dietary Suitability" icon={<ClipboardX className="h-6 w-6 text-primary" />} hidden={!dietInfo?.suitability || dietInfo.suitability.length === 0}>
                <BulletList items={dietInfo?.suitability || []} variant="suitability" />
            </ResultSection>

            <ResultSection title="Warnings" icon={<AlertTriangle className="h-6 w-6 text-yellow-400" />} hidden={!assessmentData.warnings || assessmentData.warnings.length === 0 || (isZeroRatingScenario && assessmentData.warnings[0]?.includes('Unable to evaluate'))}>
                <BulletList items={assessmentData.warnings} variant="warnings" />
            </ResultSection>

            <ResultSection title="Pros" icon={<ThumbsUp className="h-6 w-6 text-green-500" />} hidden={!assessmentData.pros || assessmentData.pros.length === 0 || isZeroRatingScenario}>
               <BulletList items={assessmentData.pros} variant="pros" />
            </ResultSection>

            <ResultSection title="Cons" icon={<ThumbsDown className="h-6 w-6 text-red-500" />} hidden={!assessmentData.cons || assessmentData.cons.length === 0 || isZeroRatingScenario}>
              <BulletList items={assessmentData.cons} variant="cons" />
            </ResultSection>
        </div>
        
        <Separator className="bg-white/10" />

        <ResultSection title="Allergen Information" icon={<ShieldAlert className="h-6 w-6 text-primary" />} hidden={!dietInfo?.allergens || dietInfo.allergens.length === 0}>
           <p className="font-medium text-lg text-yellow-300">Contains or may contain: {dietInfo?.allergens?.join(', ')}.</p>
        </ResultSection>
        
        <Separator className="bg-white/10" />

        <ResultSection title="Ingredient Analysis" icon={<ListChecks className="h-6 w-6 text-primary" />} hidden={!assessmentData.ingredientAnalysis || assessmentData.ingredientAnalysis.length === 0}>
          <Accordion type="single" collapsible className="w-full">
            {assessmentData.ingredientAnalysis.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-base font-medium hover:no-underline">
                  <div className="flex items-center">
                    {item.isAllergen && <ShieldAlert className="h-5 w-5 text-yellow-400 mr-2" />}
                    {item.isControversial && <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />}
                    <span>{item.ingredient}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm space-y-2 pl-4 border-l-2 border-primary/20 ml-2">
                  <p><span className="font-semibold text-foreground/80">What it is:</span> {item.description}</p>
                  <p><span className="font-semibold text-foreground/80">Why it&apos;s here:</span> {item.purpose}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ResultSection>
        
        <Separator className="bg-white/10" />
        
        <ResultSection title="Nutritional Information" icon={<FileText className="h-6 w-6 text-primary" />} hidden={!nutrition || (!hasStructuredNutrition && !nutrition.rawText)}>
          {hasStructuredNutrition ? (
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/10">
                    <TableHead className="font-bold text-lg text-white">Nutrient</TableHead>
                    <TableHead className="text-right font-bold text-lg text-white">{nutrition.servingSizeLabel ? `Per ${nutrition.servingSizeLabel.split(':')[1]?.trim() || 'Serving'}` : 'Per Serving'}</TableHead>
                    <TableHead className="text-right font-bold text-lg text-white">Per 100mL/g</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nutrition.nutrients?.map((item, index) => (
                    <TableRow key={index} className="border-b-0">
                      <TableCell className="font-medium">{item.nutrient}</TableCell>
                      <TableCell className="text-right">{item.perServing ?? 'N/A'}</TableCell>
                      <TableCell className="text-right">{item.per100mL ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{nutrition?.rawText}</p>
          )}
          {hasStructuredNutrition && <NutritionChart data={nutrition.nutrients!} servingSizeLabel={nutrition.servingSizeLabel} />}
        </ResultSection>
      
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-4 p-8">
        <div className="flex space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <Share2 className="mr-2 h-4 w-4" /> Share Results
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleDownloadImage}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download as Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopySummary}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Summary</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  <Twitter className="mr-2 h-4 w-4" />
                  <span>Share on X (Twitter)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  <span>Share on WhatsApp</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground/60 px-4 text-center mt-4">
          Disclaimer: Information provided by EatInformed is for general guidance only and not a substitute for professional medical or nutritional advice. Always consult with a qualified healthcare provider for any health concerns or before making any decisions related to your health or diet. Ingredient data and regulations can change; verify critical information with product packaging and official sources.
        </p>
        <div className="w-full h-24 bg-white/5 rounded-md flex items-center justify-center text-muted-foreground/50 text-sm mt-6 border border-white/10">
            [ Placeholder for Non-Intrusive Ad ]
        </div>
      </CardFooter>
    </Card>
  );
}