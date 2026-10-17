import { type ProductAnalysisOutput } from '@/ai/flows/product-analysis-types';

export interface SampleProduct {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  data: ProductAnalysisOutput;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'sample-yogurt',
    title: 'Greek Yogurt',
    subtitle: 'Chobani Plain Non-Fat',
    badge: 'NOVA 1 • Unprocessed',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    data: {
      status: 'success',
      productName: 'Plain Greek Yogurt (0% Milkfat)',
      brand: 'Chobani',
      novaGroup: 1,
      rating: 4.8,
      ingredients: [
        'Cultured Pasteurized Nonfat Milk',
        'Live and Active Cultures (S. Thermophilus, L. Bulgaricus, L. Acidophilus, Bifidus, L. Casei)'
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
          { nutrient: 'Calcium', perServing: '250mg', per100mL: '147mg' }
        ]
      },
      pros: [
        'Excellent high-quality protein content (17g per serving)',
        'Contains gut-friendly active probiotic bacterial cultures',
        'Zero added sugars, zero saturated fat, and low sodium',
        'NOVA 1 whole food with clean, minimal two-ingredient composition'
      ],
      cons: [
        'Naturally contains dairy lactose (unsuitable for strict lactose intolerance or vegan diets)'
      ],
      warnings: [],
      ingredientAnalysis: [
        {
          ingredient: 'Cultured Pasteurized Nonfat Milk',
          description: 'Skim milk pasteurized and fermented with live cultures',
          purpose: 'Primary protein and calcium base',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Live & Active Probiotic Cultures',
          description: 'Beneficial lactic acid bacteria that ferment lactose into lactic acid',
          purpose: 'Digestive support and yogurt acidification',
          isAllergen: false,
          isControversial: false
        }
      ],
      dietaryInfo: {
        allergens: ['Milk / Dairy'],
        suitability: ['Vegetarian', 'Gluten-Free', 'High-Protein', 'Keto-Friendly'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        summary: 'Nutrient-dense clean staple suitable for vegetarians and gluten-free diets.'
      }
    }
  },
  {
    id: 'sample-granola',
    title: 'Oats & Honey Granola',
    subtitle: 'KIND Healthy Grains',
    badge: 'NOVA 3 • Processed',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
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
        'Natural Vitamin E'
      ],
      nutrition: {
        rawText: 'Per 65g serving: Calories 260, Total Fat 6g, Saturated Fat 1.5g, Sodium 75mg, Total Carb 47g, Fiber 5g, Total Sugars 12g, Added Sugars 11g, Protein 6g',
        servingSizeLabel: '1/2 Cup (65g)',
        nutrients: [
          { nutrient: 'Calories', perServing: '260 kcal', per100mL: '400 kcal' },
          { nutrient: 'Total Fat', perServing: '6g', per100mL: '9.2g' },
          { nutrient: 'Saturated Fat', perServing: '1.5g', per100mL: '2.3g' },
          { nutrient: 'Sodium', perServing: '75mg', per100mL: '115mg' },
          { nutrient: 'Total Carbohydrate', perServing: '47g', per100mL: '72g' },
          { nutrient: 'Dietary Fiber', perServing: '5g', per100mL: '7.7g' },
          { nutrient: 'Total Sugars', perServing: '12g', per100mL: '18.5g' },
          { nutrient: 'Added Sugars', perServing: '11g', per100mL: '16.9g' },
          { nutrient: 'Protein', perServing: '6g', per100mL: '9.2g' }
        ]
      },
      pros: [
        'Wholesome 100% whole grain oats provide 5g sustained dietary fiber',
        'Low sodium formulation (75mg per serving)',
        'Free from artificial sweeteners and synthetic food colorings'
      ],
      cons: [
        'Relatively high in added sugars (11g per serving, 22% of Daily Value)',
        'Calorically dense (260 kcal per modest 1/2 cup portion)'
      ],
      warnings: [
        'High sugar density: consuming large bowls can spike blood glucose levels.'
      ],
      ingredientAnalysis: [
        {
          ingredient: 'Whole Grain Oats',
          description: 'Unrefined oat groats rich in beta-glucan soluble fiber',
          purpose: 'Complex carbohydrate base',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Cane Sugar & Brown Rice Syrup',
          description: 'Refined caloric sweeteners',
          purpose: 'Flavor and cluster binding',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Canola Oil',
          description: 'Plant-derived cooking oil',
          purpose: 'Crisping and texture',
          isAllergen: false,
          isControversial: false
        }
      ],
      dietaryInfo: {
        allergens: ['Tree Nuts (Coconut)'],
        suitability: ['Vegetarian', 'Gluten-Free (Certified Oats)'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        summary: 'Wholesome grain snack with solid fiber, though portion control is advised due to sugar content.'
      }
    }
  },
  {
    id: 'sample-chips',
    title: 'Nacho Cheese Chips',
    subtitle: 'Doritos Flavored Tortilla',
    badge: 'NOVA 4 • Ultra-Processed',
    badgeColor: 'border-red-500/30 bg-red-500/10 text-red-400',
    data: {
      status: 'success',
      productName: 'Nacho Cheese Flavored Tortilla Chips',
      brand: 'Doritos',
      novaGroup: 4,
      rating: 1.6,
      ingredients: [
        'Corn',
        'Vegetable Oil (Corn, Canola, and/or Sunflower Oil)',
        'Maltodextrin',
        'Salt',
        'Cheddar Cheese (Milk, Cheese Cultures, Salt, Enzymes)',
        'Whey',
        'Monosodium Glutamate (MSG)',
        'Buttermilk',
        'Romano Cheese',
        'Onion Powder',
        'Corn Starch',
        'Natural and Artificial Flavors',
        'Dextrose',
        'Spices',
        'Artificial Color (Yellow 6, Yellow 5, Red 40)',
        'Disodium Inosinate',
        'Disodium Guanylate'
      ],
      nutrition: {
        rawText: 'Per 28g serving (12 chips): Calories 150, Total Fat 8g, Saturated Fat 1g, Sodium 210mg, Total Carb 18g, Fiber 1g, Total Sugars 1g, Protein 2g',
        servingSizeLabel: 'About 12 chips (28g)',
        nutrients: [
          { nutrient: 'Calories', perServing: '150 kcal', per100mL: '536 kcal' },
          { nutrient: 'Total Fat', perServing: '8g', per100mL: '28.6g' },
          { nutrient: 'Saturated Fat', perServing: '1g', per100mL: '3.6g' },
          { nutrient: 'Sodium', perServing: '210mg', per100mL: '750mg' },
          { nutrient: 'Total Carbohydrate', perServing: '18g', per100mL: '64.3g' },
          { nutrient: 'Dietary Fiber', perServing: '1g', per100mL: '3.6g' },
          { nutrient: 'Total Sugars', perServing: '1g', per100mL: '3.6g' },
          { nutrient: 'Protein', perServing: '2g', per100mL: '7.1g' }
        ]
      },
      pros: [
        'Moderate portion calorie count if strictly limited to 12 chips'
      ],
      cons: [
        'Ultra-processed formulation with extensive cosmetic and hyper-palatability additives',
        'Contains synthetic petroleum-derived dyes (Yellow 5, Yellow 6, Red 40)',
        'Contains synthetic 5\'-ribonucleotide flavor enhancers (Disodium Inosinate & Disodium Guanylate)',
        'High sodium concentration (750mg per 100g)'
      ],
      warnings: [
        'Contains artificial colorants linked to behavioral hyperactivity concerns in sensitive individuals.',
        'Hyper-palatable seasoning profile engineered to override satiety signals.'
      ],
      ingredientAnalysis: [
        {
          ingredient: 'Monosodium Glutamate (MSG)',
          description: 'Sodium salt of glutamic acid, an umami neurotransmitter',
          purpose: 'Flavor enhancer to increase palatability',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Artificial Color (Yellow 6, Yellow 5, Red 40)',
          description: 'Azo dye synthetic colorants derived from petroleum',
          purpose: 'Cosmetic appearance / vibrant cheese coloring',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Disodium Inosinate & Disodium Guanylate',
          description: 'Nucleotide food additives that synergize with MSG',
          purpose: 'Umami flavor multiplier',
          isAllergen: false,
          isControversial: false
        }
      ],
      dietaryInfo: {
        allergens: ['Milk / Dairy'],
        suitability: ['Non-Vegetarian (Contains animal enzymes in cheese)', 'Non-Vegan'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: 'Ultra-processed snack containing synthetic dyes, flavor enhancers, and dairy allergens.'
      }
    }
  }
];
