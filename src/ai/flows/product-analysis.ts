'use server';

import sharp from 'sharp';
import { callNimWithFallback, isNimConfigured, parseNIMResponse } from '@/ai/nim';
import { ProductAnalysisOutput, ProductAnalysisOutputSchema } from './product-analysis-types';

const VISION_MODELS = [
  'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'meta/llama-3.2-90b-vision-instruct',
  'meta/llama-3.2-11b-vision-instruct',
];

const REASONING_MODELS = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'meta/llama-3.3-70b-instruct',
];

/**
 * Optimizes food label images for optical character recognition.
 * ponytail: auto-orients portrait mobile photos via EXIF and keeps small ingredient text sharp.
 */
export async function optimizeImageForOCR(dataUri: string): Promise<string> {
  try {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const resized = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF tag so mobile portrait photos aren't sideways
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .sharpen()
      .jpeg({ quality: 88 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString('base64')}`;
  } catch (err) {
    console.warn('Sharp image optimization fallback:', err);
    return dataUri;
  }
}

/**
 * High-reliability, single-pass food label analysis pipeline with conditional reasoning fallback.
 */
export async function analyzeProduct(image: string): Promise<ProductAnalysisOutput> {
  if (!isNimConfigured()) {
    return makeErrorResult('unreadable', 'AI System Offline: NVIDIA_API_KEY is missing on the server.');
  }

  const optimizedImage = await optimizeImageForOCR(image);

  let ocrData: any = null;
  try {
    const ocrPrompt = `You are a precision food label OCR and clinical nutrition analyzer. Read ALL text from this food label image and return a single raw JSON object:
{
  "productName": "Product Name",
  "brand": "Brand Name",
  "novaGroup": 4,
  "rating": 2.0,
  "ingredients": ["Ingredient 1", "Ingredient 2"],
  "allergenAdvice": "Contains Milk, Soy",
  "pros": ["2-4 specific nutritional pros based on these exact ingredients"],
  "cons": ["2-4 specific nutritional cons or additive concerns"],
  "warnings": ["Critical health warnings if any, else empty array"],
  "ingredientAnalysis": [
    {
      "ingredient": "Ingredient 1",
      "description": "Concise 1-sentence scientific description.",
      "purpose": "Role in product.",
      "isAllergen": false,
      "isControversial": false
    }
  ],
  "dietaryInfo": {
    "allergens": ["Milk"],
    "suitability": ["Vegetarian"],
    "isVegetarian": true,
    "isVegan": false,
    "isGlutenFree": true,
    "summary": "1-sentence dietary summary."
  },
  "nutrition": {
    "rawText": "Full nutrition panel text",
    "servingSizeLabel": "Serving size",
    "nutrients": [
      { "nutrient": "Calories", "perServing": "150 kcal", "per100mL": "500 kcal" }
    ]
  },
  "status": "success"
}`;

    const ocrRaw = await callNimWithFallback(
      VISION_MODELS,
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: ocrPrompt },
            { type: 'image_url', image_url: { url: optimizedImage } },
          ],
        },
      ],
      { max_tokens: 3800, temperature: 0.05 }
    );

    ocrData = parseNIMResponse(ocrRaw);
  } catch (ocrError: any) {
    return makeErrorResult('unreadable', ocrError.message || 'Failed to read the food label image.');
  }

  const ingredients: string[] = Array.isArray(ocrData?.ingredients) ? ocrData.ingredients : [];
  const nutrients: any[] = Array.isArray(ocrData?.nutrition?.nutrients) ? ocrData.nutrition.nutrients : [];
  const nutritionRaw: string = ocrData?.nutrition?.rawText || '';

  if (ingredients.length === 0 && nutrients.length === 0 && nutritionRaw.length < 10) {
    return makeErrorResult(
      ocrData?.status === 'no_data' ? 'no_data' : 'unreadable',
      'No readable ingredient list or nutrition table was found in the photo. Please frame the label closely in good lighting.'
    );
  }

  // ponytail: Only execute Step 2 if Step 1 vision model did not provide complete pros and ingredient breakdown
  const hasCompleteStep1Analysis =
    typeof ocrData.rating === 'number' &&
    typeof ocrData.novaGroup === 'number' &&
    Array.isArray(ocrData.pros) &&
    ocrData.pros.length > 0 &&
    Array.isArray(ocrData.ingredientAnalysis) &&
    ocrData.ingredientAnalysis.length > 0;

  let analysisData: any = hasCompleteStep1Analysis ? ocrData : null;

  if (!analysisData && ingredients.length > 0) {
    try {
      const analysisPrompt = `Analyze this food product as a clinical nutritionist and return ONLY a raw JSON object:
Ingredients: ${ingredients.join(', ')}
Nutrition: ${nutrients.map((n: any) => `${n.nutrient}: ${n.perServing || n.per100mL}`).join(', ')}

Required JSON keys: rating (1.0-5.0), novaGroup (1-4), pros (string[]), cons (string[]), warnings (string[]), ingredientAnalysis ({ingredient, description, purpose, isAllergen, isControversial}[]), dietaryInfo ({allergens, suitability, isVegetarian, isVegan, isGlutenFree, summary}).`;

      const analysisRaw = await callNimWithFallback(
        REASONING_MODELS,
        [
          { role: 'system', content: 'Return only valid raw JSON starting with { and ending with }.' },
          { role: 'user', content: analysisPrompt },
        ],
        { max_tokens: 3800, temperature: 0.15 }
      );
      analysisData = parseNIMResponse(analysisRaw);
    } catch (err: any) {
      console.warn('Step 2 reasoning fallback used:', err.message);
    }
  }

  const rawBrand = (ocrData.brand || '').trim();
  const brand = /^(unknown|n\/a|none|not visible|null|undefined|generic)$/i.test(rawBrand) ? '' : rawBrand;

  // ponytail: ensure complete ingredientAnalysis array matches all declared ingredients
  let finalIngredientAnalysis = Array.isArray(analysisData?.ingredientAnalysis)
    ? [...analysisData.ingredientAnalysis]
    : [];

  if (ingredients.length > 0 && finalIngredientAnalysis.length < ingredients.length) {
    const existingNames = new Set(
      finalIngredientAnalysis.map((a: any) => (a.ingredient || '').toLowerCase().trim())
    );
    for (const ing of ingredients) {
      const norm = ing.toLowerCase().trim();
      const alreadyPresent = Array.from(existingNames).some(
        (existing) => existing && (existing === norm || norm.includes(existing) || existing.includes(norm))
      );
      if (!alreadyPresent) {
        const isSugar = /sugar|syrup|honey|dextrose|fructose|maltose|sucrose/i.test(ing);
        const isOil = /\boil\b|fat|butter|shortening|palm/i.test(ing);
        const isSalt = /\bsalt\b|sodium/i.test(ing);
        finalIngredientAnalysis.push({
          ingredient: ing,
          description: isSugar
            ? 'Caloric sweetener used for taste, texture, and browning.'
            : isOil
            ? 'Culinary or processing lipid used for mouthfeel and texture.'
            : isSalt
            ? 'Mineral seasoning used for flavor and preservation.'
            : 'Declared food ingredient extracted from product packaging label.',
          purpose: isSugar
            ? 'Sweetener'
            : isOil
            ? 'Lipid / Texture'
            : isSalt
            ? 'Seasoning'
            : 'Formulation Ingredient',
          isAllergen: /milk|dairy|whey|casein|soy|wheat|gluten|peanut|nut|coconut|egg|fish|sesame/i.test(ing),
          isControversial: /artificial|dye|red 40|yellow 5|yellow 6|msg|monosodium|high-fructose|bha|bht|tbhq|carrageenan|polysorbate/i.test(ing),
        });
      }
    }
  }

  const merged = {
    productName: ocrData.productName?.trim() || 'Scanned Food Product',
    brand,
    novaGroup: analysisData?.novaGroup ?? ocrData.novaGroup ?? 4,
    ingredients,
    nutrition: {
      rawText: nutritionRaw,
      servingSizeLabel: ocrData.nutrition?.servingSizeLabel || undefined,
      nutrients,
    },
    rating: Math.max(0, Math.min(5, Number(analysisData?.rating ?? ocrData.rating ?? 2.5))),
    pros: Array.isArray(analysisData?.pros) ? analysisData.pros : [],
    cons: Array.isArray(analysisData?.cons) ? analysisData.cons : [],
    warnings: Array.isArray(analysisData?.warnings) ? analysisData.warnings : [],
    ingredientAnalysis: finalIngredientAnalysis.length > 0
      ? finalIngredientAnalysis
      : ingredients.map((ing) => ({
          ingredient: ing,
          description: 'Extracted from product packaging.',
          purpose: 'Declared food ingredient.',
          isAllergen: false,
          isControversial: false,
        })),
    dietaryInfo: analysisData?.dietaryInfo || {
      allergens: [],
      suitability: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      summary: ocrData.allergenAdvice || '',
    },
    status: 'success' as const,
  };

  return ProductAnalysisOutputSchema.parse(merged);
}

// ponytail: surface exact error message to clients rather than masking it
function makeErrorResult(status: 'unreadable' | 'no_data', errorMessage: string): ProductAnalysisOutput {
  return {
    productName: '',
    brand: '',
    novaGroup: 4,
    ingredients: [],
    nutrition: { rawText: errorMessage, nutrients: [] },
    rating: 0,
    pros: [],
    cons: [],
    warnings: [errorMessage],
    ingredientAnalysis: [],
    dietaryInfo: {
      allergens: [],
      suitability: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      summary: '',
    },
    status,
  };
}
