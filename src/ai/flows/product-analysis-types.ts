import { z } from 'zod';

// ponytail: safely coerce nulls from LLM outputs to empty string or undefined
const nullToEmptyString = z.string().nullable().optional().transform((v) => v ?? '');
const nullToUndefinedString = z.string().nullable().optional().transform((v) => v ?? undefined);

export const ProductAnalysisOutputSchema = z.object({
  productName: nullToEmptyString,
  brand: nullToEmptyString,
  novaGroup: z.number().int().min(1).max(4).nullable().optional().transform((v) => v ?? null),
  ingredients: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  nutrition: z.object({
    rawText: nullToEmptyString,
    servingSizeLabel: nullToUndefinedString,
    nutrients: z.array(z.object({
      nutrient: z.string(),
      perServing: nullToUndefinedString,
      per100mL: nullToUndefinedString,
      per100g: nullToUndefinedString,
    })).nullable().optional().transform((v) => v ?? []),
  }).nullable().optional().transform((v) => v ?? { rawText: '', servingSizeLabel: undefined, nutrients: [] }),
  rating: z.number().min(0).max(5).nullable().optional().transform((v) => v ?? null),
  pros: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  cons: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  warnings: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  ingredientAnalysis: z.array(z.object({
    ingredient: z.string(),
    description: nullToEmptyString,
    purpose: nullToEmptyString,
    isAllergen: z.boolean().nullable().optional().transform((v) => v ?? null),
    isControversial: z.boolean().nullable().optional().transform((v) => v ?? null),
  })).nullable().optional().transform((v) => v ?? []),
  dietaryInfo: z.object({
    allergens: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    suitability: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    isVegetarian: z.boolean().nullable().optional().transform((v) => v ?? null),
    isVegan: z.boolean().nullable().optional().transform((v) => v ?? null),
    isGlutenFree: z.boolean().nullable().optional().transform((v) => v ?? null),
    summary: nullToEmptyString,
  }).nullable().optional().transform((v) => v ?? {
    allergens: [],
    suitability: [],
    isVegetarian: null,
    isVegan: null,
    isGlutenFree: null,
    summary: '',
  }),
  status: z.enum(['success', 'no_data', 'unreadable']),
});

export type ProductAnalysisOutput = z.infer<typeof ProductAnalysisOutputSchema>;
