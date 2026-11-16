// EatInformed Mobile Types

export interface NutrientItem {
  nutrient: string;
  perServing?: string;
  per100mL?: string;
}

export interface NutritionData {
  rawText: string;
  servingSizeLabel?: string;
  nutrients?: NutrientItem[];
}

export interface IngredientAnalysisItem {
  ingredient: string;
  description: string;
  purpose: string;
  isAllergen: boolean;
  isControversial: boolean;
}

export interface DietaryInfo {
  allergens: string[];
  suitability: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  summary: string;
}

export type ProductAnalysisOutput = import('../../../src/ai/flows/product-analysis-types').ProductAnalysisOutput & { scanId?: string };

export interface HistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  brand: string;
  rating: number | null;
  novaGroup?: number | null;
  data: ProductAnalysisOutput;
  imagePreviewUrl?: string | null;
}

export interface UserSession {
  uid: string;
  email: string | null;
  name: string;
  isAnonymous: boolean;
}
