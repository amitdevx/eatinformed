
'use server';
/**
 * @fileOverview Extracts ingredient lists and nutritional information from an image of a food label using OCR.
 * Migrated from Genkit/Gemini to NVIDIA NIM using meta/llama-3.2-90b-vision-instruct.
 */

import { nimClient, parseNIMResponse } from '@/ai/nim';
import { ExtractIngredientsInput, ExtractIngredientsOutput, ExtractIngredientsOutputSchema } from './extract-ingredients-types';


export async function extractIngredients(input: ExtractIngredientsInput): Promise<ExtractIngredientsOutput> {
  if (!nimClient) {
    console.error("AI system not initialized. Check NVIDIA_API_KEY.");
    return {
      ingredients: [],
      nutrition: { rawText: "AI system is offline. The administrator needs to configure the NVIDIA_API_KEY.", nutrients: [] },
      status: 'unreadable',
    };
  }

  // Validate the image input is a proper data URI
  if (!input.image || typeof input.image !== 'string') {
    return {
      ingredients: [],
      nutrition: { rawText: "Invalid image input provided.", nutrients: [] },
      status: 'unreadable',
    };
  }

  // Check for valid data URI format
  const dataUriPattern = /^data:image\/(png|jpeg|webp|gif);base64,/i;
  if (!dataUriPattern.test(input.image)) {
    return {
      ingredients: [],
      nutrition: { rawText: "Invalid image format. Please provide a valid image.", nutrients: [] },
      status: 'unreadable',
    };
  }

  // Validate reasonable image size (max ~10MB base64 encoded)
  const maxBase64Length = 10 * 1024 * 1024 * 1.37; // ~10MB with base64 overhead
  if (input.image.length > maxBase64Length) {
    return {
      ingredients: [],
      nutrition: { rawText: "Image file is too large. Please use a smaller image.", nutrients: [] },
      status: 'unreadable',
    };
  }

  const systemPrompt = `You are a food label OCR API. Extract ingredients and nutrition data from the image.

RULES:
1. ingredients: List every single ingredient found on the label as separate strings.
2. nutrition.rawText: Transcribe the entire nutritional information panel exactly as written.
3. nutrition.nutrients: Parse the nutrition table into structured objects with nutrient name, per-serving value, and per-100g/mL value.
4. status: Use "success" if any ingredient or nutrition data was found. Use "no_data" if the label is clear but contains no food data. Use "unreadable" if the image is too blurry or dark to read.

CRITICAL: Your entire response must be ONLY a single raw JSON object. Do NOT include any text, explanation, or markdown before or after the JSON. Start your response with { and end with }.

Output this exact JSON structure with real values extracted from the image:
{
  "ingredients": ["ingredient1", "ingredient2"],
  "nutrition": {
    "rawText": "Full transcription of the nutritional panel with line breaks...",
    "servingSizeLabel": "Serving size info from the label",
    "nutrients": [
      { "nutrient": "Energy", "perServing": "775kJ", "per100mL": "310kJ" }
    ]
  },
  "status": "success"
}

Remember: Output ONLY the raw JSON object. Start with { and end with }.`;

  try {
    const response = await nimClient.chat.completions.create({
      model: 'meta/llama-3.2-90b-vision-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            {
              type: 'image_url',
              image_url: {
                url: input.image,
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.1,
      top_p: 0.9,
    });

    const rawContent = response.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('The AI model failed to provide an output.');
    }

    // parseNIMResponse now throws on failure with descriptive context
    const parsed = parseNIMResponse(rawContent);

    // Validate with Zod schema
    const output = ExtractIngredientsOutputSchema.parse(parsed);

    // Refine status if model returns success but no actual data
    if (
      output.status === 'success' &&
      output.ingredients.length === 0 &&
      (!output.nutrition || (!output.nutrition.rawText && (!output.nutrition.nutrients || output.nutrition.nutrients.length === 0)))
    ) {
      output.status = 'no_data';
    }

    return output;
  } catch (error: any) {
    console.error("Error in extractIngredients (NIM):", error.message || error);
    let errorMessage = 'The AI model failed to process the image due to an unexpected error.';
    if (error.message) {
      if (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable')) {
        errorMessage = "The AI service is temporarily overloaded. Please wait a moment and try again.";
      } else if (error.message.toLowerCase().includes('deadline exceeded') || error.message.toLowerCase().includes('timeout')) {
        errorMessage = "The analysis took too long to complete. Please try again.";
      } else if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      }
    }
    return {
      ingredients: [],
      nutrition: { rawText: errorMessage, nutrients: [] },
      status: 'unreadable',
    };
  }
}
