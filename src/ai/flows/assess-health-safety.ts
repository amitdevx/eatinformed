
'use server';
/**
 * @fileOverview An AI agent that assesses the health and safety of food ingredients.
 * Migrated from Genkit/Gemini to NVIDIA NIM using deepseek-ai/deepseek-v4-pro.
 */

import { nimClient, parseNIMResponse } from '@/ai/nim';
import {
  AssessHealthSafetyInput,
  AssessHealthSafetyOutput,
  AssessHealthSafetyOutputSchema,
} from './assess-health-safety-types';

export async function assessHealthSafety(input: AssessHealthSafetyInput): Promise<AssessHealthSafetyOutput> {
  if (!nimClient) {
    console.error("AI system not initialized. Check NVIDIA_API_KEY.");
    return {
      rating: 0,
      pros: [],
      cons: [],
      warnings: ["AI functionality is currently offline. The server administrator needs to configure the NVIDIA_API_KEY."],
      ingredientAnalysis: [],
      dietaryInfo: {
        allergens: [],
        suitability: [],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: "AI system is offline; dietary analysis is not available.",
      },
    };
  }

  // Handle case where no ingredients were extracted
  if (!input.ingredients || input.ingredients.trim() === '') {
    return {
      rating: 0,
      pros: [],
      cons: [],
      warnings: ["Unable to evaluate due to missing or unreadable label. Please upload a clear image."],
      ingredientAnalysis: [],
      dietaryInfo: {
        allergens: [],
        suitability: [],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: "Could not perform dietary analysis because no ingredients were found.",
      },
    };
  }

  // Validate input length to prevent abuse (max 10,000 characters for ingredients list)
  const maxIngredientsLength = 10000;
  if (input.ingredients.length > maxIngredientsLength) {
    return {
      rating: 0,
      pros: [],
      cons: [],
      warnings: ["The ingredients list is too long to process. Please provide a shorter list."],
      ingredientAnalysis: [],
      dietaryInfo: {
        allergens: [],
        suitability: [],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: "Could not perform dietary analysis due to input length limitations.",
      },
    };
  }

  const systemPrompt = `You are a clinical nutritionist. Analyze the ingredient list and return a health assessment.

RULES:
1. rating: A number from 1 (very unhealthy) to 5 (very healthy). Base it on processing level (NOVA classification), synthetic additives, sugar content, fat quality, and nutrient density.
2. pros: 2-4 distinct positive health aspects of the ingredients.
3. cons: 2-4 distinct negative health aspects or concerning ingredients.
4. warnings: Only include warnings for critical health risks, banned substances, or extremely high sodium/sugar/trans fat levels. Use an empty array if none.
5. ingredientAnalysis: For EACH ingredient, provide its name, a short scientific description, its purpose in the product, and whether it is a common allergen or controversial.
6. dietaryInfo: Identify all common allergens (gluten, dairy, soy, peanuts, tree nuts, eggs, fish, shellfish, sesame). Determine if the product is suitable for vegetarians, vegans, and gluten-free diets.

CRITICAL: Your entire response must be ONLY a single raw JSON object. Do NOT include any text, explanation, or markdown before or after the JSON. Start your response with { and end with }.

Output this exact JSON structure with real analysis values:
{
  "rating": 3,
  "pros": ["Contains natural ingredients", "Good source of protein"],
  "cons": ["High in sodium", "Contains artificial preservatives"],
  "warnings": [],
  "ingredientAnalysis": [
    {
      "ingredient": "Salt",
      "description": "Sodium chloride, a mineral used for flavor and preservation.",
      "purpose": "Enhances flavor and acts as a preservative.",
      "isAllergen": false,
      "isControversial": false
    }
  ],
  "dietaryInfo": {
    "allergens": ["Gluten", "Dairy"],
    "suitability": ["Not suitable for vegans"],
    "isVegetarian": true,
    "isVegan": false,
    "isGlutenFree": false,
    "summary": "Contains dairy and gluten. Suitable for vegetarians but not vegans."
  }
}

Remember: Output ONLY the raw JSON object. Start with { and end with }.`;

  const userPrompt = `Analyze these ingredients:\n"${input.ingredients}"`;

  try {
    // Build request options
    const requestOptions: any = {
      model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.2,
      top_p: 0.9,
    };

    let rawContent: string | null = null;
    try {
      const response = await nimClient.chat.completions.create(requestOptions);
      const choice = response.choices?.[0]?.message as any;
      rawContent = choice?.content || choice?.reasoning_content;
    } catch (err: any) {
      console.warn("DEBUG: Assessment call failed:", err.message);
      throw err;
    }

    if (!rawContent) {
      throw new Error('The AI model failed to provide an assessment.');
    }

    // parseNIMResponse now throws on failure with descriptive context
    const parsed = parseNIMResponse(rawContent);

    // Validate with Zod schema
    const output = AssessHealthSafetyOutputSchema.parse(parsed);

    // Post-validation safety: clamp rating
    if (output.rating > 5) output.rating = 5;
    if (output.rating < 0) output.rating = 0;

    return output;
  } catch (error: any) {
    console.error("Error in assessHealthSafety (NIM):", error.message || error);
    let warningMessage = "The AI model failed to provide an assessment due to an unexpected error.";
    if (error.message) {
      if (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable')) {
        warningMessage = "The AI analysis service is temporarily overloaded. Please wait a moment and try again.";
      } else if (error.message.toLowerCase().includes('deadline exceeded') || error.message.toLowerCase().includes('timeout')) {
        warningMessage = "The analysis took too long to complete. Please try again.";
      } else if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        warningMessage = "Too many requests. Please wait a moment and try again.";
      }
    }
    
    return {
      rating: 0,
      pros: [],
      cons: [],
      warnings: [warningMessage],
      ingredientAnalysis: [],
      dietaryInfo: {
        allergens: [],
        suitability: [],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: "Could not perform dietary analysis because the AI service is unavailable.",
      },
    };
  }
}
