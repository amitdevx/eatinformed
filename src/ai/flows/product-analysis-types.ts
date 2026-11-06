import { z } from 'zod';

// ponytail: safely coerce nulls from LLM outputs to empty string or undefined
const nullToEmptyString = z.string().nullable().optional().transform((v) => v ?? '');
const nullToUndefinedString = z.string().nullable().optional().transform((v) => v ?? undefined);

export const ProductAnalysisOutputSchema = z.object({
  productName: nullToEmptyString,
  brand: nullToEmptyString,
  novaGroup: z.coerce.number().min(1).max(4).nullable().optional().transform((v) => v ?? 4),
  ingredients: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  nutrition: z.object({
    rawText: nullToEmptyString,
    servingSizeLabel: nullToUndefinedString,
    nutrients: z.array(z.object({
      nutrient: z.string(),
      perServing: nullToUndefinedString,
      per100mL: nullToUndefinedString,
    })).nullable().optional().transform((v) => v ?? []),
  }).nullable().optional().transform((v) => v ?? { rawText: '', servingSizeLabel: undefined, nutrients: [] }),
  rating: z.coerce.number().min(0).max(5).nullable().optional().transform((v) => v ?? 0),
  pros: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  cons: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  warnings: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
  ingredientAnalysis: z.array(z.object({
    ingredient: z.string(),
    description: nullToEmptyString,
    purpose: nullToEmptyString,
    isAllergen: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
    isControversial: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
  })).nullable().optional().transform((v) => v ?? []),
  dietaryInfo: z.object({
    allergens: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    suitability: z.array(z.string()).nullable().optional().transform((v) => v ?? []),
    isVegetarian: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
    isVegan: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
    isGlutenFree: z.coerce.boolean().nullable().optional().transform((v) => v ?? false),
    summary: nullToEmptyString,
  }).nullable().optional().transform((v) => v ?? {
    allergens: [],
    suitability: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    summary: '',
  }),
  status: z.enum(['success', 'no_data', 'unreadable']).default('success'),
});

export type ProductAnalysisOutput = z.infer<typeof ProductAnalysisOutputSchema>;
