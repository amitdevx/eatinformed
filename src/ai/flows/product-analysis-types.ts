
import { z } from 'zod';

export const ProductAnalysisOutputSchema = z.object({
  productName: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  novaGroup: z.coerce.number().min(1).max(4).optional().default(4),
  ingredients: z.array(z.string()).default([]),
  nutrition: z.object({
    rawText: z.string().default(''),
    servingSizeLabel: z.string().optional(),
    nutrients: z.array(z.object({
      nutrient: z.string(),
      perServing: z.string().optional(),
      per100mL: z.string().optional(),
    })).optional().default([]),
  }).default({ rawText: '', nutrients: [] }),
  rating: z.coerce.number().min(0).max(5).default(0),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  ingredientAnalysis: z.array(z.object({
    ingredient: z.string(),
    description: z.string().default(''),
    purpose: z.string().default(''),
    isAllergen: z.coerce.boolean().default(false),
    isControversial: z.coerce.boolean().default(false),
  })).default([]),
  dietaryInfo: z.object({
    allergens: z.array(z.string()).default([]),
    suitability: z.array(z.string()).default([]),
    isVegetarian: z.coerce.boolean().default(false),
    isVegan: z.coerce.boolean().default(false),
    isGlutenFree: z.coerce.boolean().default(false),
    summary: z.string().default(''),
  }).default({
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
