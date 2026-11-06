import type { ProductAnalysisOutput } from '@/ai/flows/product-analysis-types';

export type { ProductAnalysisOutput };

export interface NutrientItem {
  nutrient: string;
  perServing?: string;
  per100mL?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  isAnonymous?: boolean;
  createdAt?: unknown;
}

export interface HistoryItem {
  id: string;
  productName: string;
  brand?: string;
  rating: number;
  novaGroup?: number;
  timestamp: number;
  data: ProductAnalysisOutput;
  imagePreviewUrl?: string | null;
}
