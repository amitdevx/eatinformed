
'use server';
/**
 * @fileOverview An AI agent that assesses the health and safety of food ingredients.
 */

import {ai} from '@/ai/genkit';
import {Flow} from 'genkit';
import {
  AssessHealthSafetyInput,
  AssessHealthSafetyInputSchema,
  AssessHealthSafetyOutput,
  AssessHealthSafetyOutputSchema,
} from './assess-health-safety-types';

export async function assessHealthSafety(input: AssessHealthSafetyInput): Promise<AssessHealthSafetyOutput> {
   if (!ai) {
    console.error("AI system not initialized. Check GOOGLE_API_KEY.");
    // Return a specific error structure if AI is offline
    return {
      rating: 0,
      pros: [],
      cons: [],
      warnings: ["AI functionality is currently offline. The server administrator needs to configure the GOOGLE_API_KEY."],
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

  const prompt = ai.definePrompt({
    name: 'assessHealthSafetyPrompt',
    input: {schema: AssessHealthSafetyInputSchema},
    output: {schema: AssessHealthSafetyOutputSchema},
    prompt: `You are a world-class nutritionist and food safety expert. Your task is to analyze the following list of food ingredients and provide a concise, objective, and non-overlapping health and safety assessment. Your analysis must be grounded in established nutritional science and presented with the authority and trustworthiness of a professional expert. Prioritize factual accuracy and clarity for the user.

Ingredients list:
"{{ingredients}}"

Based on the ingredients, perform the following actions and return the result in the specified JSON format:

1.  **Detailed Ingredient Analysis:** For each ingredient, provide a detailed analysis.
    - **ingredient**: The name of the ingredient.
    - **description**: A simple, clear description of what the ingredient is.
    - **purpose**: Explain why the ingredient is used in the product.
    - **isAllergen**: Flag if it's a common allergen (e.g., gluten, soy, nuts).
    - **isControversial**: Flag if it's a controversial ingredient (e.g., MSG, high-fructose corn syrup, artificial dyes).
2.  **Health Rating (1-5):** Provide an overall health score from 1 (very unhealthy) to 5 (very healthy). Consider factors like processing level, presence of whole foods, additives, sugar content, etc.
3.  **Pros:** List 2-4 distinct positive aspects. Focus on healthy, natural, or beneficial ingredients. Do not simply state the absence of a negative as a positive (e.g., instead of "Low in sugar", focus on "Made with whole grains"). Ensure these are genuine benefits.
4.  **Cons:** List 2-4 distinct negative aspects that are separate from the 'Pros'. Focus on artificial additives, high sugar/sodium indicators, unhealthy fats, or heavily processed components. Ensure these are genuine drawbacks.
5.  **Warnings:** This section is for CRITICAL alerts only. List only ingredients that are banned in major regions (e.g., certain food dyes in the EU), are part of a major scientific controversy regarding health dangers, or pose a significant, non-obvious risk (e.g., high saturated fat for heart conditions). Do not use this section for common allergens or generally unhealthy items; those belong in 'Cons' or dietary information. If there are no such critical warnings, return an empty array.
6.  **Dietary Information:** Based on the ingredients, analyze for common dietary concerns. If the label explicitly states a status (e.g., "Certified Gluten-Free"), trust it. Otherwise, infer based on the ingredients.
    - **allergens:** Identify and list common allergens such as Gluten, Dairy, Soy, Peanuts, Tree Nuts, Fish, Shellfish. Do not list an allergen if a "-free" version is specified (e.g. "soy lecithin" is an allergen, but if the label also says "soy-free", do not list it).
    - **suitability:** Create a list of statements explaining why the product is NOT suitable for certain groups. For example: "Not suitable for vegans" if it contains honey or gelatin. "Not suitable for lactose intolerant individuals" if it contains milk. "Not suitable for people on low-sodium diets" if sodium is high. If there are no specific suitability issues, return an empty array.
    - **isVegetarian:** Determine if the product is vegetarian (contains no meat, poultry, or fish).
    - **isVegan:** Determine if the product is vegan (contains no animal products, including dairy, eggs, or honey).
    - **isGlutenFree:** Determine if the product is gluten-free (contains no wheat, barley, rye, or their derivatives).
    - **summary:** Provide a brief, human-readable summary of the key dietary points. For example: "Contains Dairy and Soy. Suitable for vegetarians but not vegans." If no specific concerns are found, state that.


Your analysis must be objective and based on general nutritional science. Be concise, clear, and ensure the 'Pros' and 'Cons' provide a balanced view without contradicting each other.`,
     config: {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
         {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
         {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
         {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    },
  });

  const assessHealthSafetyFlow: Flow<typeof AssessHealthSafetyInputSchema, typeof AssessHealthSafetyOutputSchema> = ai.defineFlow(
    {
      name: 'assessHealthSafetyFlow',
      inputSchema: AssessHealthSafetyInputSchema,
      outputSchema: AssessHealthSafetyOutputSchema,
    },
    async (input: AssessHealthSafetyInput) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('The AI model failed to provide an assessment.');
      }
      return output;
    }
  );

  try {
    return await assessHealthSafetyFlow(input);
  } catch (error: any) {
    console.error("Error in assessHealthSafetyFlow:", error);
    let warningMessage = "The AI model failed to provide an assessment due to an unexpected error.";
    if (error.message) {
        if (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable')) {
            warningMessage = "The AI analysis service is temporarily overloaded. Please wait a moment and try again.";
        } else if (error.message.toLowerCase().includes('deadline exceeded')) {
            warningMessage = "The analysis took too long to complete. Please try again.";
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
