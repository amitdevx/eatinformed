
'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { nimClient, parseNIMResponse } from '@/ai/nim';
import { ProductAnalysisOutput, ProductAnalysisOutputSchema } from './product-analysis-types';

/**
 * Two-step product analysis pipeline:
 * Step 1: Vision model performs focused OCR — extracts ALL ingredients and ALL nutrients
 * Step 2: Text reasoning model performs deep health analysis on the extracted data
 * 
 * GRACEFUL DEGRADATION: If step 2 fails (timeout, etc.), step 1 data is still returned
 * with a basic auto-generated analysis so the user always sees something useful.
 */
export async function analyzeProduct(image: string): Promise<ProductAnalysisOutput> {
  console.log("DEBUG: analyzeProduct started. API Key present:", !!process.env.NVIDIA_API_KEY);

  // ponytail: protect server action against unauthenticated exploitation in production
  if (adminAuth) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie && process.env.NODE_ENV === 'production') {
      return makeErrorResult('unreadable', "Authentication required. Please sign in to scan products.");
    }
    if (sessionCookie) {
      const claims = await adminAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
      if (!claims && process.env.NODE_ENV === 'production') {
        return makeErrorResult('unreadable', "Your session has expired. Please log in again.");
      }
    }
  }

  if (!nimClient) {
    console.error("CRITICAL: NVIDIA_API_KEY is missing or nimClient failed to initialize.");
    return makeErrorResult('unreadable', "AI System Offline: Please check server configuration (NVIDIA_API_KEY).");
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 1: Vision OCR — Extract raw text data from the image
  // Uses the vision model ONLY for reading text (its strength)
  // ══════════════════════════════════════════════════════════════
  let productName = '';
  let brand = '';
  let ingredients: string[] = [];
  let allergenAdvice = '';
  let nutritionRaw = '';
  let servingSize = '';
  let nutrients: any[] = [];

  try {
    console.log("DEBUG: Step 1 — OCR extraction starting...");

    const ocrPrompt = `You are a precision OCR system for food product labels. Your ONLY job is to read and extract ALL text data from this food label image.

EXTRACTION REQUIREMENTS:
1. PRODUCT NAME & BRAND: Extract the prominent product name and brand name if visible on the packaging.
2. INGREDIENTS: Extract the COMPLETE ingredients list. List EVERY single ingredient as a separate item. Break apart compound ingredients (e.g., "Seasoning" contains sub-ingredients — list the main item AND each sub-ingredient separately). Do NOT skip any ingredient.
3. NUTRITION TABLE: Extract EVERY row from the nutritional information table. For each nutrient, capture the nutrient name, the "per 100g" value, and the "%RDA per serve" or "per serving" value. Do NOT skip any row.
4. SERVING SIZE: Extract the exact serving size text from the label.
5. ALLERGEN ADVICE: Extract any allergen warnings verbatim.

CRITICAL: Output ONLY a raw JSON object. No text before or after. Start with { and end with }.

{
  "productName": "Classic Potato Chips",
  "brand": "Lays",
  "ingredients": ["Potato", "Edible Vegetable Oil (Palmolein Oil)", "Sugar", "Iodised Salt", "Milk Solids"],
  "allergenAdvice": "Contains Soy, Milk. May Contain Sulphite",
  "nutrition": {
    "rawText": "NUTRITIONAL INFORMATION Per 100g: Energy 537 kcal...",
    "servingSizeLabel": "20g",
    "nutrients": [
      { "nutrient": "Energy", "perServing": "107kcal", "per100mL": "537kcal" },
      { "nutrient": "Protein", "perServing": "1.3g", "per100mL": "6.7g" },
      { "nutrient": "Carbohydrate", "perServing": "10.6g", "per100mL": "53.0g" },
      { "nutrient": "Total Sugars", "perServing": "0.7g", "per100mL": "3.4g" },
      { "nutrient": "Total Fat", "perServing": "6.6g", "per100mL": "33.1g" },
      { "nutrient": "Saturated Fat", "perServing": "3.0g", "per100mL": "14.9g" },
      { "nutrient": "Sodium", "perServing": "129mg", "per100mL": "643mg" }
    ]
  },
  "status": "success"
}

IMPORTANT: The example above is just a format guide. You MUST extract the ACTUAL values from the image. Extract ALL nutrients — do not stop at 2 or 3. A typical label has 7-12 nutrient rows.`;

    const ocrResponse = await nimClient.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ocrPrompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.05,
      top_p: 0.95,
    });

    const ocrRaw = ocrResponse.choices?.[0]?.message?.content;
    if (!ocrRaw) {
      throw new Error('Vision model returned empty response during OCR step.');
    }

    console.log(`DEBUG: OCR Response (first 200 chars): ${ocrRaw.substring(0, 200)}...`);
    const ocrData = parseNIMResponse(ocrRaw);

    // Extract data with fallbacks
    productName = typeof ocrData.productName === 'string' ? ocrData.productName.trim() : '';
    brand = typeof ocrData.brand === 'string' ? ocrData.brand.trim() : '';
    ingredients = Array.isArray(ocrData.ingredients) ? ocrData.ingredients : [];
    allergenAdvice = ocrData.allergenAdvice || '';
    nutritionRaw = ocrData.nutrition?.rawText || '';
    servingSize = ocrData.nutrition?.servingSizeLabel || '';
    nutrients = Array.isArray(ocrData.nutrition?.nutrients) ? ocrData.nutrition.nutrients : [];

    console.log(`DEBUG: OCR extracted ${ingredients.length} ingredients, ${nutrients.length} nutrients.`);

    // Check if OCR got meaningful data
    if (ingredients.length === 0 && nutrients.length === 0 && nutritionRaw.length < 10) {
      const ocrStatus = ocrData.status || 'unreadable';
      return makeErrorResult(
        ocrStatus === 'no_data' ? 'no_data' : 'unreadable',
        "Could not read any ingredient or nutrition data from the image."
      );
    }

  } catch (ocrError: any) {
    console.error("Step 1 (OCR) failed:", ocrError.message || ocrError);
    const msg = ocrError.message?.toLowerCase() || '';
    if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('deadline')) {
      return makeErrorResult('unreadable', "The AI service took too long to respond. Please try again.");
    }
    return makeErrorResult('unreadable', ocrError.message || "Failed to read the label image.");
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Deep Health Analysis — Analyze the extracted data
  // Uses a text reasoning model (no image processing needed)
  // GRACEFUL: If this fails, we still return OCR data with basic analysis
  // ══════════════════════════════════════════════════════════════
  let analysisData: any = null;

  try {
    console.log("DEBUG: Step 2 — Health analysis starting...");

    const ingredientsList = ingredients.join(', ');
    const nutrientsSummary = nutrients.map((n: any) =>
      `${n.nutrient}: ${n.per100mL || n.perServing || 'N/A'}`
    ).join(', ');

    const analysisPrompt = `You are a clinical nutritionist. Analyze this food product and return a JSON health assessment.

PRODUCT DATA:
- Ingredients: ${ingredientsList}
- Allergen Advice: ${allergenAdvice}
- Nutritional Values (per 100g): ${nutrientsSummary}
- Serving Size: ${servingSize}

REQUIREMENTS:
1. rating: Score 1.0-5.0 based on nutritional quality, additives, and whole food content.
2. novaGroup: Integer 1-4 representing the NOVA food processing classification:
   1 = Unprocessed/Minimally processed (whole foods, plain oats, milk, fruit)
   2 = Processed culinary ingredients (oils, butter, sugar, salt)
   3 = Processed foods (canned veggies, simple cheeses, fresh breads)
   4 = Ultra-processed foods (industrial formulations with emulsifiers, colors, flavors)
3. pros: 3-5 positive health aspects.
4. cons: 3-5 negative health concerns.
5. warnings: Only critical risks (high sodium, trans fats, banned substances). Empty array if none.
6. ingredientAnalysis: For EVERY ingredient (${ingredients.length} total), include: ingredient name, description (one concise sentence), purpose, isAllergen (boolean), isControversial (boolean).
7. dietaryInfo: allergens list, suitability notes, isVegetarian, isVegan, isGlutenFree (all booleans), summary.

Output ONLY a raw JSON object. Start with { and end with }.

{
  "rating": 2.0,
  "novaGroup": 4,
  "pros": ["No artificial colors", "Contains potassium from potatoes"],
  "cons": ["Ultra-processed (NOVA 4)", "High saturated fat"],
  "warnings": ["High sodium: 643mg per 100g exceeds recommended limits"],
  "ingredientAnalysis": [
    {
      "ingredient": "Potato",
      "description": "A starchy root vegetable rich in potassium and vitamin C.",
      "purpose": "Base ingredient providing carbohydrates and structure.",
      "isAllergen": false,
      "isControversial": false
    }
  ],
  "dietaryInfo": {
    "allergens": ["Soy", "Milk"],
    "suitability": ["Not suitable for vegans due to milk solids and cheese powder"],
    "isVegetarian": true,
    "isVegan": false,
    "isGlutenFree": true,
    "summary": "Contains dairy and soy. Suitable for vegetarians but not vegans."
  }
}`;

    const analysisResponse = await nimClient.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a clinical nutritionist. Output only raw JSON. No markdown.' },
        { role: 'user', content: analysisPrompt },
      ],
      max_tokens: 8192,
      temperature: 0.2,
      top_p: 0.9,
      response_format: { type: 'json_object' },
    });

    const analysisRaw = analysisResponse.choices?.[0]?.message?.content;
    if (analysisRaw) {
      console.log(`DEBUG: Analysis Response (first 200 chars): ${analysisRaw.substring(0, 200)}...`);
      analysisData = parseNIMResponse(analysisRaw);
    }

  } catch (analysisError: any) {
    // Step 2 failed but Step 1 has good data — DON'T throw, degrade gracefully
    console.warn("DEBUG: Step 2 (Analysis) failed, using OCR data with basic analysis:", analysisError.message);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Merge OCR data + Analysis into final output
  // If analysis failed, generate basic fallback data from OCR
  // ══════════════════════════════════════════════════════════════
  const hasAnalysis = analysisData !== null;

  // Parse allergens from allergenAdvice text if analysis didn't provide them
  const allergenList = allergenAdvice
    ? allergenAdvice
        .replace(/contains\s*/gi, '')
        .replace(/may contain\s*/gi, ', May contain: ')
        .split(/[,.]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];

  const mergedResult = {
    // From OCR (Step 1)
    productName: productName || 'Packaged Food Item',
    brand: brand || '',
    novaGroup: hasAnalysis && typeof analysisData.novaGroup === 'number' ? analysisData.novaGroup : 4,
    ingredients: ingredients,
    nutrition: {
      rawText: nutritionRaw,
      servingSizeLabel: servingSize || undefined,
      nutrients: nutrients,
    },
    // From Analysis (Step 2) — with fallbacks if analysis failed
    rating: hasAnalysis ? (analysisData.rating ?? 2.5) : 2.5,
    pros: hasAnalysis && Array.isArray(analysisData.pros) ? analysisData.pros : ['Ingredients successfully extracted from label'],
    cons: hasAnalysis && Array.isArray(analysisData.cons) ? analysisData.cons : ['Detailed health analysis could not be completed — please try again'],
    warnings: hasAnalysis && Array.isArray(analysisData.warnings) ? analysisData.warnings : [],
    ingredientAnalysis: hasAnalysis && Array.isArray(analysisData.ingredientAnalysis)
      ? analysisData.ingredientAnalysis
      : ingredients.map(ing => ({
          ingredient: ing,
          description: 'Analysis pending.',
          purpose: 'Analysis pending.',
          isAllergen: false,
          isControversial: false,
        })),
    dietaryInfo: hasAnalysis && analysisData.dietaryInfo
      ? analysisData.dietaryInfo
      : {
          allergens: allergenList,
          suitability: [],
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          summary: allergenAdvice || 'Detailed dietary analysis could not be completed.',
        },
    status: 'success' as const,
  };

  // Validate through Zod
  let output;
  try {
    output = ProductAnalysisOutputSchema.parse(mergedResult);
  } catch (zodError: any) {
    console.error("DEBUG: Zod Validation Issues:", JSON.stringify(zodError.issues, null, 2));
    console.error("DEBUG: Merged Result:", JSON.stringify(mergedResult, null, 2));
    // Even if Zod fails, try to return OCR data
    return makeErrorResult('unreadable', 'Data validation failed. Please try again.');
  }

  // ponytail: clamp rating between 0 and 5.0; don't overwrite genuine ratings
  if (output.status === 'success') {
    if (isNaN(output.rating) || output.rating === null || output.rating === undefined) {
      output.rating = 2.5;
    } else {
      output.rating = Math.max(0, Math.min(5.0, Number(output.rating.toFixed(1))));
    }
  }

  console.log(`DEBUG: Final output — ${output.ingredients.length} ingredients, ${output.nutrition.nutrients?.length || 0} nutrients, rating: ${output.rating}, analysis: ${hasAnalysis ? 'full' : 'fallback'}`);
  return output;
}

/** Helper to create a consistent error result */
function makeErrorResult(status: 'unreadable' | 'no_data', errorMessage: string): ProductAnalysisOutput {
  return {
    productName: '',
    brand: '',
    novaGroup: 4,
    ingredients: [],
    nutrition: { rawText: `Error: ${errorMessage}`, nutrients: [] },
    rating: 0,
    pros: [],
    cons: [],
    warnings: ["We encountered an issue analyzing this image. Please try again with a clearer photo."],
    ingredientAnalysis: [],
    dietaryInfo: {
      allergens: [],
      suitability: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      summary: "",
    },
    status: status,
  };
}
