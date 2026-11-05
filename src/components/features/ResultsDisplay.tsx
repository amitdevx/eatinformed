'use client';

import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { type ProductAnalysisOutput } from '@/ai/flows/product-analysis-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, ListChecks, FileText, ClipboardX, ShieldAlert, CheckCircle, XCircle, Share2, Download, Copy, Twitter } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NutritionChart from './NutritionChart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { SITE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResultsDisplayProps {
  data?: ProductAnalysisOutput | null;
  ingredientsData?: ProductAnalysisOutput | null; // legacy alias
  assessmentData?: ProductAnalysisOutput | null;  // legacy alias
  imagePreviewUrl?: string | null; 
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const ResultSection = ({ title, icon, children, hidden = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, hidden?: boolean }) => {
  if (hidden) return null;
  return (
    <motion.div variants={itemVariants} className="py-4 bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
      <h3 className="text-xl font-bold flex items-center mb-4 text-foreground/90">
        <div className="p-2 bg-primary/10 rounded-full mr-3">
          {icon}
        </div>
        <span>{title}</span>
      </h3>
      <div className="text-base text-muted-foreground">{children}</div>
    </motion.div>
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

const novaColors: Record<number, string> = {
  1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  2: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  3: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  4: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const novaLabels: Record<number, string> = {
  1: "NOVA 1: Minimally Processed",
  2: "NOVA 2: Processed Culinary Ingredient",
  3: "NOVA 3: Processed Food",
  4: "NOVA 4: Ultra-Processed",
};

export default function ResultsDisplay(props: ResultsDisplayProps) {
  const analysisData = props.data || props.assessmentData || props.ingredientsData;
  const { imagePreviewUrl } = props;
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // ponytail: truncate pro/con so social tweet stays well within 280-char limit
  const generateSummaryText = useCallback(() => {
    if (!analysisData) return '';
    const { rating, pros, cons } = analysisData;
    const url = typeof window !== "undefined" ? window.location.origin : SITE_URL;
    const scoreStr = typeof rating === 'number' && !isNaN(rating) ? `${rating.toFixed(1)}/5` : 'N/A';
    const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len - 1) + '...' : s;
    let summary = `This product scored ${scoreStr} on EatInformed.`;
    if (pros && pros.length > 0) {
      summary += `\n👍 Pro: ${truncate(pros[0], 65)}`;
    }
    if (cons && cons.length > 0) {
      summary += `\n👎 Con: ${truncate(cons[0], 65)}`;
    }
    summary += `\n\nCheck your food's score: ${url}`;
    return summary;
  }, [analysisData]);

  // ponytail: strip backdropFilter on cloned doc so html2canvas doesn't render black boxes
  const captureCardCanvas = async () => {
    if (!resultsCardRef.current) return null;
    return await html2canvas(resultsCardRef.current, {
      backgroundColor: '#0F172A',
      useCORS: true,
      scale: 1.5,
      logging: false,
      onclone: (clonedDoc) => {
        const elements = clonedDoc.querySelectorAll<HTMLElement>('*');
        elements.forEach((el) => {
          if (el.style) {
            el.style.backdropFilter = 'none';
            // @ts-ignore
            el.style.webkitBackdropFilter = 'none';
          }
        });
      },
    });
  };

  const handleDownloadImage = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
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

  // ponytail: instant markdown report export for notes/notion
  const handleCopyMarkdown = useCallback(() => {
    if (!analysisData) return;
    const { productName, brand, rating, novaGroup, pros, cons, warnings, ingredients } = analysisData;
    let md = `# ${productName || 'EatInformed Food Analysis'}\n`;
    if (brand) md += `**Brand**: ${brand}\n`;
    md += `**Score**: ${rating.toFixed(1)}/5\n`;
    if (novaGroup && novaLabels[novaGroup]) md += `**Processing**: ${novaLabels[novaGroup]}\n\n`;
    if (pros && pros.length > 0) md += `### Pros\n` + pros.map(p => `- ${p}`).join('\n') + '\n\n';
    if (cons && cons.length > 0) md += `### Cons\n` + cons.map(c => `- ${c}`).join('\n') + '\n\n';
    if (warnings && warnings.length > 0) md += `### Warnings\n` + warnings.map(w => `- ⚠️ ${w}`).join('\n') + '\n\n';
    if (ingredients && ingredients.length > 0) md += `### Ingredients\n` + ingredients.join(', ') + '\n';
    navigator.clipboard.writeText(md).then(() => {
      toast({ title: 'Report Copied!', description: 'Full Markdown report copied to clipboard.' });
    });
  }, [analysisData, toast]);

  // ponytail: instant ingredients list export
  const handleCopyIngredients = useCallback(() => {
    if (!analysisData?.ingredients?.length) return;
    navigator.clipboard.writeText(analysisData.ingredients.join(', ')).then(() => {
      toast({ title: 'Ingredients Copied!', description: 'Ingredients list copied to clipboard.' });
    });
  }, [analysisData, toast]);

  const handleShare = useCallback(async (platform: 'twitter' | 'whatsapp') => {
    const summaryText = generateSummaryText();
    const title = 'My Food Scan Results from EatInformed';

    // Advanced Share (Image + Text) using Web Share API
    if (navigator.share && resultsCardRef.current) {
      try {
        const canvas = await captureCardCanvas();
        const blob = canvas ? await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')) : null;
        
        if (blob) {
          const file = new File([blob], 'eatinformed-results.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              text: summaryText,
              files: [file],
            });
            return;
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error using Web Share API with image, falling back:', error);
        } else {
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

  if (!analysisData) {
    return null;
  }

  const isZeroRatingScenario = analysisData.rating === 0;
  const dietInfo = analysisData.dietaryInfo;
  const nutrition = analysisData.nutrition;
  const hasStructuredNutrition = nutrition?.nutrients && nutrition.nutrients.length > 0;

  const renderStars = (rating: number) => {
    const totalStars = 5;
    const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    return (
      <div className="flex items-center gap-1">
        {[...Array(totalStars)].map((_, index) => (
          <Star
            key={index}
            className={`h-8 w-8 ${index < Math.round(validRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
        <span className="ml-3 text-3xl font-bold text-foreground">{validRating > 0 ? `${validRating.toFixed(1)}/5` : 'N/A'}</span>
      </div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <Card ref={resultsCardRef} className="w-full max-w-4xl mx-auto bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl mt-8">
        <CardHeader className="text-center p-8">
          {imagePreviewUrl && (
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
              <Image 
                src={imagePreviewUrl} 
                alt="Scanned product label"
                width={240}
                height={240}
                className="max-h-60 w-auto rounded-xl border-2 border-primary/20 shadow-lg object-contain bg-black/40"
              />
            </motion.div>
          )}
          <motion.div variants={itemVariants}>
            {analysisData.brand && (
              <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-1 block">
                {analysisData.brand}
              </span>
            )}
            <CardTitle className="text-3xl sm:text-4xl font-black drop-shadow-md">
                {analysisData.productName || (isZeroRatingScenario ? "Analysis Incomplete" : "Analysis Complete")}
            </CardTitle>
            <div className="mt-6 flex flex-col items-center gap-3 bg-black/20 p-5 rounded-3xl border border-white/5 w-fit mx-auto">
             {renderStars(analysisData.rating)}
             <p className="text-primary font-medium tracking-wide uppercase text-xs">Health Rating</p>
             {analysisData.novaGroup && (
               <Badge 
                 variant="outline" 
                 className={cn("px-3 py-1 font-semibold text-xs border rounded-full mt-1", novaColors[analysisData.novaGroup] || "text-gray-300")}
               >
                 {novaLabels[analysisData.novaGroup] || `NOVA ${analysisData.novaGroup}`}
               </Badge>
             )}
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6 px-4 md:px-8">
          
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultSection title="Dietary Suitability" icon={<ClipboardX className="h-6 w-6 text-primary" />} hidden={!dietInfo?.suitability || dietInfo.suitability.length === 0}>
                  <BulletList items={dietInfo?.suitability || []} variant="suitability" />
              </ResultSection>

              <ResultSection title="Warnings" icon={<AlertTriangle className="h-6 w-6 text-yellow-400" />} hidden={!analysisData.warnings || analysisData.warnings.length === 0 || (isZeroRatingScenario && analysisData.warnings[0]?.includes('Unable to evaluate'))}>
                  <BulletList items={analysisData.warnings} variant="warnings" />
              </ResultSection>

              <ResultSection title="Pros" icon={<ThumbsUp className="h-6 w-6 text-green-500" />} hidden={!analysisData.pros || analysisData.pros.length === 0 || isZeroRatingScenario}>
                 <BulletList items={analysisData.pros} variant="pros" />
              </ResultSection>

              <ResultSection title="Cons" icon={<ThumbsDown className="h-6 w-6 text-red-500" />} hidden={!analysisData.cons || analysisData.cons.length === 0 || isZeroRatingScenario}>
                <BulletList items={analysisData.cons} variant="cons" />
              </ResultSection>
          </motion.div>
          
          <ResultSection title="Allergen Information" icon={<ShieldAlert className="h-6 w-6 text-primary" />} hidden={!dietInfo?.allergens || dietInfo.allergens.length === 0}>
             <p className="font-medium text-lg text-yellow-400 bg-yellow-400/10 p-4 rounded-xl border border-yellow-400/20">
               Contains or may contain: <span className="font-bold">{dietInfo?.allergens?.join(', ')}</span>.
             </p>
          </ResultSection>
          
          <ResultSection title="Ingredient Analysis" icon={<ListChecks className="h-6 w-6 text-primary" />} hidden={!analysisData.ingredientAnalysis || analysisData.ingredientAnalysis.length === 0}>
            <Accordion type="single" collapsible className="w-full bg-black/20 rounded-xl border border-white/5 p-2">
              {analysisData.ingredientAnalysis.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b-white/5 last:border-0">
                  <AccordionTrigger className="text-base font-medium hover:no-underline px-4 rounded-lg hover:bg-white/5">
                    <div className="flex items-center">
                      {item.isAllergen && <ShieldAlert className="h-5 w-5 text-yellow-400 mr-2 shrink-0" />}
                      {item.isControversial && <AlertTriangle className="h-5 w-5 text-orange-500 mr-2 shrink-0" />}
                      <span className="text-left">{item.ingredient}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm space-y-3 p-4 bg-black/40 rounded-lg mt-1 border border-white/5">
                    <p><span className="font-semibold text-primary">What it is:</span> {item.description}</p>
                    <p><span className="font-semibold text-primary">Why it&apos;s here:</span> {item.purpose}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ResultSection>
          
          <ResultSection title="Nutritional Information" icon={<FileText className="h-6 w-6 text-primary" />} hidden={!nutrition || (!hasStructuredNutrition && !nutrition.rawText)}>
            {hasStructuredNutrition ? (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-b-white/10">
                      <TableHead className="font-bold text-lg text-white">Nutrient</TableHead>
                      <TableHead className="text-right font-bold text-lg text-white">{nutrition.servingSizeLabel ? `Per ${nutrition.servingSizeLabel.replace(/Serving size: /i, '') || 'Serving'}` : 'Per Serving'}</TableHead>
                      <TableHead className="text-right font-bold text-lg text-white">Per 100g/mL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutrition.nutrients?.map((item, index) => (
                      <TableRow key={index} className="border-b-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium">{item.nutrient}</TableCell>
                        <TableCell className="text-right">{item.perServing ?? 'N/A'}</TableCell>
                        <TableCell className="text-right">{item.per100mL ?? 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{nutrition?.rawText}</p>
              </div>
            )}
            {hasStructuredNutrition && (
              <div className="mt-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <NutritionChart data={nutrition.nutrients!} servingSizeLabel={nutrition.servingSizeLabel} />
              </div>
            )}
          </ResultSection>
        
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-6 p-8 bg-black/20 rounded-b-xl border-t border-white/5">
          <motion.div variants={itemVariants} className="flex space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-primary/50 hover:bg-primary/10">
                    <Share2 className="mr-2 h-4 w-4" /> Share Results
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
                  <DropdownMenuItem onClick={handleDownloadImage} className="hover:bg-white/10">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download as Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopySummary} className="hover:bg-white/10">
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy Summary</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyMarkdown} className="hover:bg-white/10">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Copy Markdown Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyIngredients} className="hover:bg-white/10">
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span>Copy Ingredients List</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => handleShare('twitter')} className="hover:bg-white/10">
                    <Twitter className="mr-2 h-4 w-4" />
                    <span>Share on X (Twitter)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="hover:bg-white/10">
                    <WhatsAppIcon className="mr-2 h-4 w-4" />
                    <span>Share on WhatsApp</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </motion.div>
          <motion.p variants={itemVariants} className="text-xs text-muted-foreground/60 px-4 text-center">
            Disclaimer: Information provided by EatInformed is for general guidance only and not a substitute for professional medical or nutritional advice. Always consult with a qualified healthcare provider for any health concerns or before making any decisions related to your health or diet.
          </motion.p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}