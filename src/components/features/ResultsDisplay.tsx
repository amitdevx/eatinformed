'use client';

import { useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { type ProductAnalysisOutput } from '@/ai/flows/product-analysis-types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, AlertTriangle, ListChecks, FileText, CheckCircle, XCircle, Share2, Download, Copy, Twitter } from 'lucide-react';
import { Button } from '../ui/button';
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
  ingredientsData?: ProductAnalysisOutput | null;
  assessmentData?: ProductAnalysisOutput | null;
  imagePreviewUrl?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 28 } },
};

const ResultSection = ({
  title,
  icon,
  children,
  hidden = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hidden?: boolean;
}) => {
  if (hidden) return null;
  return (
    <motion.div variants={itemVariants} className="py-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-base font-semibold flex items-center mb-3 text-foreground">
        <div className="p-2 bg-primary/10 rounded-xl mr-3 text-primary shrink-0">
          {icon}
        </div>
        <span>{title}</span>
      </h3>
      <div className="text-xs sm:text-sm text-foreground/90">{children}</div>
    </motion.div>
  );
};

const BulletList = ({
  items,
  variant,
}: {
  items: string[];
  variant: 'pros' | 'cons' | 'warnings' | 'suitability';
}) => {
  const iconMap = {
    pros: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    cons: <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    warnings: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    suitability: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  };

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
          <div className="mt-0.5 shrink-0">{iconMap[variant]}</div>
          <span className="leading-relaxed">{item}</span>
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
    />
  </svg>
);

const novaColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  2: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
  3: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  4: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
};

const novaLabels: Record<number, string> = {
  1: 'NOVA 1: Whole Food',
  2: 'NOVA 2: Culinary Base',
  3: 'NOVA 3: Processed Food',
  4: 'NOVA 4: Ultra-Processed',
};

export default function ResultsDisplay(props: ResultsDisplayProps) {
  const analysisData = props.data || props.assessmentData || props.ingredientsData;
  const { imagePreviewUrl } = props;
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generateSummaryText = useCallback(() => {
    if (!analysisData) return '';
    const { rating, pros, cons } = analysisData;
    const url = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
    const scoreStr = typeof rating === 'number' && !isNaN(rating) ? `${rating.toFixed(1)}/5` : 'N/A';
    const truncate = (s: string, len: number) => (s.length > len ? s.slice(0, len - 1) + '...' : s);
    const pro = pros && pros.length > 0 ? `Pro: ${truncate(pros[0], 60)}` : '';
    const con = cons && cons.length > 0 ? `Con: ${truncate(cons[0], 60)}` : '';

    return `Food Analysis: ${analysisData.productName || 'Scanned Product'} - Health Score: ${scoreStr}. ${pro} ${con} Analyzed with EatInformed: ${url}`;
  }, [analysisData]);

  const mergedIngredientAnalysis = useMemo(() => {
    const rawList = analysisData?.ingredientAnalysis || [];
    const ingStrings = analysisData?.ingredients || [];
    if (!ingStrings.length) return rawList;

    const matched = new Set<number>();
    return ingStrings.map((ing) => {
      const norm = ing.toLowerCase().trim();
      const existingIdx = rawList.findIndex(
        (item, idx) =>
          !matched.has(idx) &&
          item?.ingredient &&
          (item.ingredient.toLowerCase().trim() === norm ||
            norm.includes(item.ingredient.toLowerCase().trim()) ||
            item.ingredient.toLowerCase().trim().includes(norm))
      );
      if (existingIdx !== -1) {
        matched.add(existingIdx);
        return rawList[existingIdx];
      }
      const isSweetener = /sugar|syrup|honey|dextrose|fructose|maltose|sucrose/i.test(ing);
      const isOil = /\boil\b|fat|butter|shortening|palm/i.test(ing);
      const isSalt = /\bsalt\b|sodium/i.test(ing);
      return {
        ingredient: ing,
        description: isSweetener
          ? 'Caloric sweetener contributing to product sweetness and texture.'
          : isOil
          ? 'Dietary lipid used for moisture, cooking, or mouthfeel.'
          : isSalt
          ? 'Sodium mineral seasoning used for flavor and preservation.'
          : 'Declared food ingredient extracted from packaging label.',
        purpose: isSweetener
          ? 'Sweetener'
          : isOil
          ? 'Lipid / Texture Base'
          : isSalt
          ? 'Seasoning & Preservative'
          : 'Formulation Ingredient',
        isAllergen: /milk|dairy|whey|casein|soy|wheat|gluten|peanut|nut|coconut|egg|fish|sesame/i.test(ing),
        isControversial: /artificial|dye|red 40|yellow 5|yellow 6|msg|monosodium|high-fructose|bha|bht|tbhq|carrageenan|polysorbate/i.test(ing),
      };
    });
  }, [analysisData?.ingredientAnalysis, analysisData?.ingredients]);

  const captureCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!resultsCardRef.current) return null;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return await html2canvas(resultsCardRef.current, {
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: isDark ? '#161618' : '#ffffff',
    });
  };

  const handleDownloadImage = useCallback(async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `eatinformed-${(analysisData?.productName || 'result').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = imageUri;
      link.click();
      toast({ title: 'Report Saved', description: 'Analysis card downloaded.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export image.' });
    }
  }, [analysisData, toast]);

  const handleCopySummary = useCallback(() => {
    const summaryText = generateSummaryText();
    navigator.clipboard.writeText(summaryText).then(() => {
      toast({ title: 'Copied', description: 'Summary copied to clipboard.' });
    });
  }, [generateSummaryText, toast]);

  const handleCopyMarkdown = useCallback(() => {
    if (!analysisData) return;
    const md = `# EatInformed Food Analysis Report: ${analysisData.productName || 'Product'}\n\n**Brand:** ${analysisData.brand || 'N/A'}\n**Rating:** ${analysisData.rating}/5.0\n**NOVA Group:** ${analysisData.novaGroup}\n\n## Ingredients\n${analysisData.ingredients.map((ing) => `- ${ing}`).join('\n')}\n`;
    navigator.clipboard.writeText(md).then(() => {
      toast({ title: 'Copied', description: 'Markdown report copied.' });
    });
  }, [analysisData, toast]);

  const handleCopyIngredients = useCallback(() => {
    if (!analysisData?.ingredients?.length) return;
    navigator.clipboard.writeText(analysisData.ingredients.join(', ')).then(() => {
      toast({ title: 'Copied', description: 'Ingredients list copied.' });
    });
  }, [analysisData, toast]);

  const handleShare = useCallback(
    async (platform: 'twitter' | 'whatsapp') => {
      const summaryText = generateSummaryText();
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
    },
    [generateSummaryText]
  );

  if (!analysisData) {
    return null;
  }

  const isZeroRatingScenario = analysisData.rating === 0;
  const dietInfo = analysisData.dietaryInfo;
  const nutrition = analysisData.nutrition;
  const hasStructuredNutrition = nutrition?.nutrients && nutrition.nutrients.length > 0;

  const renderStars = (rating: number) => {
    const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = validRating >= index;
          return (
            <Star
              key={index}
              className={cn(
                'h-5 w-5',
                isFilled ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
              )}
            />
          );
        })}
        <span className="ml-2 text-2xl font-bold text-foreground">
          {validRating > 0 ? `${validRating.toFixed(1)} / 5.0` : 'N/A'}
        </span>
      </div>
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <Card ref={resultsCardRef} className="w-full max-w-3xl mx-auto bg-card border-border shadow-sm rounded-3xl mt-6">
        <CardHeader className="text-center p-6 sm:p-8 border-b border-border">
          {imagePreviewUrl && (
            <motion.div variants={itemVariants} className="mb-5 flex justify-center">
              <Image
                src={imagePreviewUrl}
                alt="Scanned product label"
                width={200}
                height={200}
                className="max-h-52 w-auto rounded-2xl border border-border shadow-sm object-contain bg-muted"
              />
            </motion.div>
          )}
          <motion.div variants={itemVariants}>
            {analysisData.brand && (
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-1 block">
                {analysisData.brand}
              </span>
            )}
            <CardTitle className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              {analysisData.productName || (isZeroRatingScenario ? 'Analysis Incomplete' : 'Product Analysis')}
            </CardTitle>
            <div className="mt-4 flex flex-col items-center gap-2 bg-muted/40 p-4 rounded-2xl border border-border w-fit mx-auto">
              {renderStars(analysisData.rating)}
              {analysisData.novaGroup && (
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3 py-0.5 font-semibold text-xs border rounded-full mt-0.5',
                    novaColors[analysisData.novaGroup] || 'text-muted-foreground'
                  )}
                >
                  {novaLabels[analysisData.novaGroup] || `NOVA ${analysisData.novaGroup}`}
                </Badge>
              )}
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ResultSection
              title="Dietary Compatibility"
              icon={<ListChecks className="h-4 w-4" />}
              hidden={!dietInfo || (!dietInfo.suitability?.length && !dietInfo.isVegetarian && !dietInfo.isVegan && !dietInfo.isGlutenFree && !dietInfo.summary)}
            >
              <div className="space-y-3">
                {(dietInfo?.isVegetarian || dietInfo?.isVegan || dietInfo?.isGlutenFree) && (
                  <div className="flex flex-wrap gap-1.5">
                    {dietInfo?.isVegetarian && (
                      <Badge variant="outline" className="text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Vegetarian
                      </Badge>
                    )}
                    {dietInfo?.isVegan && (
                      <Badge variant="outline" className="text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Vegan
                      </Badge>
                    )}
                    {dietInfo?.isGlutenFree && (
                      <Badge variant="outline" className="text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Gluten-Free
                      </Badge>
                    )}
                  </div>
                )}
                {dietInfo?.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dietInfo.summary}
                  </p>
                )}
                {dietInfo?.suitability && dietInfo.suitability.length > 0 && (
                  <BulletList items={dietInfo.suitability} variant="suitability" />
                )}
              </div>
            </ResultSection>

            <ResultSection
              title="Health Alerts"
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              hidden={
                !analysisData.warnings ||
                analysisData.warnings.length === 0 ||
                (isZeroRatingScenario && analysisData.warnings[0]?.includes('Unable to evaluate'))
              }
            >
              <BulletList items={analysisData.warnings} variant="warnings" />
            </ResultSection>

            <ResultSection
              title="Key Benefits"
              icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
              hidden={!analysisData.pros || analysisData.pros.length === 0 || isZeroRatingScenario}
            >
              <BulletList items={analysisData.pros} variant="pros" />
            </ResultSection>

            <ResultSection
              title="Things to Note"
              icon={<XCircle className="h-4 w-4 text-rose-500" />}
              hidden={!analysisData.cons || analysisData.cons.length === 0 || isZeroRatingScenario}
            >
              <BulletList items={analysisData.cons} variant="cons" />
            </ResultSection>
          </motion.div>

          <ResultSection
            title="Allergen Notice"
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            hidden={!dietInfo?.allergens || dietInfo.allergens.length === 0}
          >
            <p className="font-medium text-xs sm:text-sm text-foreground bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
              Contains: <span className="font-semibold">{dietInfo?.allergens?.join(', ')}</span>
            </p>
          </ResultSection>

          <ResultSection
            title="Ingredient Deconstruction"
            icon={<ListChecks className="h-4 w-4" />}
            hidden={!mergedIngredientAnalysis || mergedIngredientAnalysis.length === 0}
          >
            <Accordion type="single" collapsible className="w-full bg-muted/30 rounded-2xl border border-border p-2">
              {mergedIngredientAnalysis.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b-border last:border-0">
                  <AccordionTrigger className="text-xs sm:text-sm font-medium hover:no-underline px-3 py-2.5 rounded-xl hover:bg-muted/60 text-foreground">
                    <div className="flex items-center justify-between w-full pr-3 gap-2">
                      <span className="text-left font-medium">{item.ingredient}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isAllergen && (
                          <Badge variant="outline" className="text-[10px] border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Allergen
                          </Badge>
                        )}
                        {item.isControversial && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Additive Alert
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs space-y-2 p-3 bg-card rounded-xl mt-1 border border-border">
                    <p>
                      <span className="font-semibold text-foreground">What it is:</span> {item.description}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Purpose:</span> {item.purpose}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ResultSection>

          <ResultSection
            title="Nutritional Panel"
            icon={<FileText className="h-4 w-4" />}
            hidden={!nutrition || (!hasStructuredNutrition && !nutrition.rawText)}
          >
            {hasStructuredNutrition ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="border-b-border">
                      <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">Nutrient</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-foreground uppercase tracking-wider">
                        {nutrition.servingSizeLabel
                          ? `Per ${nutrition.servingSizeLabel.replace(/Serving size: /i, '') || 'Serving'}`
                          : 'Per Serving'}
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs text-foreground uppercase tracking-wider">Per 100g/mL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutrition.nutrients?.map((item, index) => (
                      <TableRow key={index} className="border-b-border hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-xs sm:text-sm text-foreground">{item.nutrient}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground">{item.perServing ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground">{item.per100mL ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{nutrition?.rawText}</p>
              </div>
            )}
            {hasStructuredNutrition && (
              <div className="mt-6">
                <NutritionChart data={nutrition.nutrients!} servingSizeLabel={nutrition.servingSizeLabel} />
              </div>
            )}
          </ResultSection>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4 p-6 sm:p-8 bg-muted/20 rounded-b-3xl border-t border-border">
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full text-xs font-semibold border-border bg-card hover:bg-muted">
                  <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border text-foreground rounded-2xl p-1.5">
                <DropdownMenuItem onClick={handleDownloadImage} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <Download className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span>Download Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopySummary} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <Copy className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span>Copy Summary</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyMarkdown} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <FileText className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span>Copy Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyIngredients} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <ListChecks className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span>Copy Ingredients</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <Twitter className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span>Share on X</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer hover:bg-muted rounded-xl text-xs">
                  <WhatsAppIcon className="mr-2 h-3.5 w-3.5 shrink-0 align-middle inline-block" />
                  <span>Share on WhatsApp</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
          <motion.p variants={itemVariants} className="text-[11px] text-muted-foreground/70 px-4 text-center max-w-lg leading-relaxed">
            Information provided by EatInformed is for general consumer transparency. Always verify critical packaging details on physical containers.
          </motion.p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
