import { ProductAnalysisOutput } from '../types';

export interface SampleProduct {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  novaGroup: number;
  data: ProductAnalysisOutput;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'sample-yogurt',
    title: 'Greek Yogurt',
    subtitle: 'Chobani Plain Non-Fat',
    badge: 'NOVA 1 (Unprocessed)',
    novaGroup: 1,
    data: {
      status: 'success',
      productName: 'Plain Greek Yogurt (0% Milkfat)',
      brand: 'Chobani',
      novaGroup: 1,
      rating: 4.8,
      ingredients: [
        'Cultured Pasteurized Nonfat Milk',
        'Live and Active Cultures (S. Thermophilus, L. Bulgaricus, L. Acidophilus, Bifidus, L. Casei)',
      ],
      nutrition: {
        rawText: 'Per 170g serving: Calories 100, Total Fat 0g, Sodium 65mg, Total Carb 6g, Sugars 4g, Protein 17g, Calcium 250mg',
        servingSizeLabel: '1 Container (170g)',
        nutrients: [
          { nutrient: 'Calories', perServing: '100 kcal', per100mL: '59 kcal' },
          { nutrient: 'Total Fat', perServing: '0g', per100mL: '0g' },
          { nutrient: 'Saturated Fat', perServing: '0g', per100mL: '0g' },
          { nutrient: 'Sodium', perServing: '65mg', per100mL: '38mg' },
          { nutrient: 'Total Carbohydrate', perServing: '6g', per100mL: '3.5g' },
          { nutrient: 'Total Sugars', perServing: '4g', per100mL: '2.4g' },
          { nutrient: 'Protein', perServing: '17g', per100mL: '10g' },
          { nutrient: 'Calcium', perServing: '250mg', per100mL: '147mg' },
        ],
      },
      pros: [
        'Excellent high-quality protein content (17g per serving)',
        'Contains gut-friendly active probiotic bacterial cultures',
        'Zero added sugars, zero saturated fat, and low sodium',
        'NOVA 1 whole food with clean, minimal two-ingredient composition',
      ],
      cons: [
        'Naturally contains dairy lactose (unsuitable for strict lactose intolerance or vegan diets)',
      ],
      warnings: [],
      ingredientAnalysis: [
        {
          ingredient: 'Cultured Pasteurized Nonfat Milk',
          description: 'Skim milk pasteurized and fermented with live cultures',
          purpose: 'Primary protein and calcium base',
          isAllergen: true,
          isControversial: false,
        },
        {
          ingredient: 'Live & Active Probiotic Cultures',
          description: 'Beneficial lactic acid bacteria that ferment lactose into lactic acid',
          purpose: 'Digestive support and yogurt acidification',
          isAllergen: false,
          isControversial: false,
        },
      ],
      dietaryInfo: {
        allergens: ['Milk / Dairy'],
        suitability: ['Vegetarian', 'Gluten-Free', 'High-Protein', 'Keto-Friendly'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        summary: 'Nutrient-dense clean staple suitable for vegetarians and gluten-free diets.',
      },
    },
  },
  {
    id: 'sample-granola',
    title: 'Oats & Honey Granola',
    subtitle: 'KIND Healthy Grains',
    badge: 'NOVA 3 (Processed)',
    novaGroup: 3,
    data: {
      status: 'success',
      productName: 'Oats & Honey Granola with Toasted Coconut',
      brand: 'KIND',
      novaGroup: 3,
      rating: 3.6,
      ingredients: [
        'Whole Grain Oats',
        'Cane Sugar',
        'Canola Oil',
        'Oat Flour',
        'Honey',
        'Toasted Coconut',
        'Brown Rice Syrup',
        'Sea Salt',
      ],
      nutrition: {
        rawText: 'Per 65g serving: Calories 260, Total Fat 7g, Saturated Fat 1.5g, Sodium 115mg, Total Carb 44g, Sugars 12g, Protein 5g',
        servingSizeLabel: '2/3 Cup (65g)',
        nutrients: [
          { nutrient: 'Calories', perServing: '260 kcal', per100mL: '400 kcal' },
          { nutrient: 'Total Fat', perServing: '7g', per100mL: '10.8g' },
          { nutrient: 'Saturated Fat', perServing: '1.5g', per100mL: '2.3g' },
          { nutrient: 'Sodium', perServing: '115mg', per100mL: '177mg' },
          { nutrient: 'Total Carbohydrate', perServing: '44g', per100mL: '67.7g' },
          { nutrient: 'Total Sugars', perServing: '12g', per100mL: '18.5g' },
          { nutrient: 'Dietary Fiber', perServing: '4g', per100mL: '6.2g' },
          { nutrient: 'Protein', perServing: '5g', per100mL: '7.7g' },
        ],
      },
      pros: [
        'Made with 100% whole grain oats rich in beta-glucan soluble fiber',
        'Contains no artificial flavors, colors, or hydrogenated oils',
        'Provides 5g of plant-based protein per serving',
      ],
      cons: [
        'Contains 12g of sugars per serving from cane sugar and brown rice syrup',
        'Moderate calorie density from canola oil and added sweeteners',
      ],
      warnings: [],
      ingredientAnalysis: [
        {
          ingredient: 'Whole Grain Oats',
          description: 'Minimally processed oat groats providing soluble beta-glucan fiber',
          purpose: 'Primary grain base and fiber source',
          isAllergen: false,
          isControversial: false,
        },
        {
          ingredient: 'Cane Sugar',
          description: 'Refined sucrose derived from sugar cane',
          purpose: 'Sweetener and contributes to crisp baked texture',
          isAllergen: false,
          isControversial: false,
        },
      ],
      dietaryInfo: {
        allergens: ['Tree Nuts (Coconut)'],
        suitability: ['Vegetarian', 'Dairy-Free'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        summary: 'Heart-healthy whole grain base with moderate added sugar content.',
      },
    },
  },
  {
    id: 'sample-chips',
    title: 'Classic Potato Chips',
    subtitle: 'Lays Classic',
    badge: 'NOVA 4 (Ultra-Processed)',
    novaGroup: 4,
    data: {
      status: 'success',
      productName: 'Classic Potato Chips',
      brand: 'Lays',
      novaGroup: 4,
      rating: 1.9,
      ingredients: [
        'Potatoes',
        'Vegetable Oil (Canola, Corn, Soybean, and/or Sunflower Oil)',
        'Salt',
      ],
      nutrition: {
        rawText: 'Per 28g serving: Calories 160, Total Fat 10g, Saturated Fat 1.5g, Sodium 170mg, Total Carb 15g, Sugars 1g, Protein 2g',
        servingSizeLabel: 'About 15 chips (28g)',
        nutrients: [
          { nutrient: 'Calories', perServing: '160 kcal', per100mL: '571 kcal' },
          { nutrient: 'Total Fat', perServing: '10g', per100mL: '35.7g' },
          { nutrient: 'Saturated Fat', perServing: '1.5g', per100mL: '5.4g' },
          { nutrient: 'Sodium', perServing: '170mg', per100mL: '607mg' },
          { nutrient: 'Total Carbohydrate', perServing: '15g', per100mL: '53.6g' },
          { nutrient: 'Total Sugars', perServing: '1g', per100mL: '3.6g' },
          { nutrient: 'Protein', perServing: '2g', per100mL: '7.1g' },
        ],
      },
      pros: [
        'Simple three-ingredient formulation with no artificial food colors or MSG',
        'Naturally gluten-free and suitable for vegan diets',
      ],
      cons: [
        'Very high fat content (35% by weight) from industrial deep-frying oils',
        'Elevated sodium content (607mg per 100g) promoting high blood pressure',
        'High glycemic index with low satiety factor',
      ],
      warnings: [
        'High sodium and saturated fat density. Recommended to consume in strict moderation.',
      ],
      ingredientAnalysis: [
        {
          ingredient: 'Potatoes',
          description: 'Sliced white potatoes providing starch and potassium',
          purpose: 'Primary vegetable base',
          isAllergen: false,
          isControversial: false,
        },
        {
          ingredient: 'Vegetable Oil Blend',
          description: 'Refined vegetable oils subjected to high heat frying',
          purpose: 'Cooking medium contributing fat and crispness',
          isAllergen: true,
          isControversial: true,
        },
        {
          ingredient: 'Salt',
          description: 'Refined sodium chloride',
          purpose: 'Flavor enhancer and preservative',
          isAllergen: false,
          isControversial: false,
        },
      ],
      dietaryInfo: {
        allergens: ['Soy (in some oil blends)'],
        suitability: ['Vegan', 'Vegetarian', 'Gluten-Free'],
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        summary: 'High-fat snack formulation best consumed sparingly.',
      },
    },
  },
];
