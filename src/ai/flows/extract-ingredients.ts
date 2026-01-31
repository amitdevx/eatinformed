
'use server';
/**
 * @fileOverview Extracts ingredient lists and nutritional information from an image of a food label using OCR.
 */

import {ai} from '@/ai/genkit';
import {Flow} from 'genkit';
import { ExtractIngredientsInput, ExtractIngredientsInputSchema, ExtractIngredientsOutput, ExtractIngredientsOutputSchema } from './extract-ingredients-types';


export async function extractIngredients(input: ExtractIngredientsInput): Promise<ExtractIngredientsOutput> {
  if (!ai) {
    console.error("AI system not initialized. Check GOOGLE_API_KEY.");
    return {
      ingredients: [],
      nutrition: { rawText: "AI system is offline. The administrator needs to configure the GOOGLE_API_KEY.", nutrients: [] },
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
  
  const prompt = ai.definePrompt({
    name: 'extractIngredientsPrompt',
    input: {schema: ExtractIngredientsInputSchema},
    output: {schema: ExtractIngredientsOutputSchema},
    prompt: `You are an expert Optical Character Recognition (OCR) system specializing in food labels. Your task is to extract the ingredients list and nutritional information from the provided image.

Analyze the image carefully and return the data in the specified JSON format.

1.  **Ingredients**: Identify and transcribe the complete list of ingredients into the \`ingredients\` array.
2.  **Nutritional Information**:
    - **rawText**: Transcribe the ENTIRE nutritional facts panel into a single, formatted string, preserving line breaks. This is for display purposes.
    - **servingSizeLabel**: Extract the text that defines the serving size, e.g., "Serving size: 250mL".
    - **nutrients**: Parse the nutritional table into a structured array. For each row in the table (e.g., Energy, Protein, Fat), create a JSON object with keys "nutrient", "perServing", and "per100mL". Include the units (like kJ, g, mg) in the string values. If a value is missing for a nutrient, omit the corresponding key.
3.  **Status**: Based on your analysis, set the status:
    - 'success' if you found either ingredients or nutritional information.
    - 'no_data' if the image is clear but contains no discernible food label text.
    - 'unreadable' if the image is too blurry, poorly lit, or otherwise impossible to read.

If a section is not found, return empty values for it, but adhere to the schema.

Image to analyze: {{media url=image}}`,
  });

  const extractIngredientsFlow: Flow<typeof ExtractIngredientsInputSchema, typeof ExtractIngredientsOutputSchema> = ai.defineFlow(
    {
      name: 'extractIngredientsFlow',
      inputSchema: ExtractIngredientsInputSchema,
      outputSchema: ExtractIngredientsOutputSchema,
    },
    async (input: ExtractIngredientsInput) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI model failed to provide an output.');
      }
      // A simple check to refine status if model returns success but no data
      if (output.status === 'success' && output.ingredients.length === 0 && (!output.nutrition || (!output.nutrition.rawText && (!output.nutrition.nutrients || output.nutrition.nutrients.length === 0)))) {
          output.status = 'no_data';
      }

      return output;
    }
  );

  try {
    return await extractIngredientsFlow(input);
  } catch (error: any) {
    console.error("Error in extractIngredientsFlow:", error);
    let errorMessage = 'The AI model failed to process the image due to an unexpected error.';
    if (error.message) {
        if (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable')) {
            errorMessage = "The AI service is temporarily overloaded. Please wait a moment and try again.";
        } else if (error.message.toLowerCase().includes('deadline exceeded')) {
            errorMessage = "The analysis took too long to complete. Please try again.";
        }
    }
    return {
      ingredients: [],
      nutrition: { rawText: errorMessage, nutrients: [] },
      status: 'unreadable',
    };
  }
}
