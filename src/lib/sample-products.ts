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
    badgeColor: 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400',
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
    badgeColor: 'border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-400',
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
          ingredient: 'Cane Sugar',
          description: 'Refined cane sucrose contributing rapid carbohydrates',
          purpose: 'Sweetener and crisp baked texture',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Canola Oil',
          description: 'Plant-derived cooking oil low in saturated fat',
          purpose: 'Crisping and texture',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Oat Flour',
          description: 'Milled whole oats providing cluster structure',
          purpose: 'Baking binder',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Honey',
          description: 'Natural sweetener with aromatic notes',
          purpose: 'Taste and binding',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Toasted Coconut',
          description: 'Dried toasted coconut flakes',
          purpose: 'Flavor and crispness',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Brown Rice Syrup',
          description: 'Malted brown rice glucose syrup',
          purpose: 'Cluster binding and sweetness',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Sea Salt',
          description: 'Marine sodium chloride',
          purpose: 'Seasoning and taste balance',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Natural Vitamin E',
          description: 'Mixed tocopherols antioxidant',
          purpose: 'Fat freshness preservation',
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
    badgeColor: 'border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-400',
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
          ingredient: 'Corn',
          description: 'Primary whole-grain milled corn providing bulk carbohydrates and structural matrix',
          purpose: 'Base tortilla structure',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Vegetable Oil (Corn, Canola, and/or Sunflower Oil)',
          description: 'Refined industrial vegetable oil blend high in omega-6 polyunsaturated fatty acids',
          purpose: 'High-temperature frying medium and lipid texture base',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Maltodextrin',
          description: 'Rapidly absorbed polysaccharide with a high glycemic index (85-105)',
          purpose: 'Seasoning carrier and mouthfeel texturizer',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Salt',
          description: 'Refined crystalline sodium chloride contributing to elevated sodium load',
          purpose: 'Flavor enhancement and taste preservation',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Cheddar Cheese (Milk, Cheese Cultures, Salt, Enzymes)',
          description: 'Dehydrated cheese powder containing concentrated dairy proteins and fats',
          purpose: 'Savory cheese flavor',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Whey',
          description: 'Concentrated dairy liquid byproduct rich in lactose and whey proteins',
          purpose: 'Surface browning and flavor binding',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Monosodium Glutamate (MSG)',
          description: 'Sodium salt of glutamic acid, an excitatory umami neurotransmitter',
          purpose: 'Intense savory taste and hyper-palatability enhancement',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Buttermilk',
          description: 'Dehydrated cultured dairy powder providing natural lactic acidity',
          purpose: 'Tangy dairy seasoning profile',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Romano Cheese',
          description: 'Aged hard Italian cheese solids from cows milk',
          purpose: 'Pungent sharp savory notes',
          isAllergen: true,
          isControversial: false
        },
        {
          ingredient: 'Onion Powder',
          description: 'Dehydrated and ground allium cepa bulb',
          purpose: 'Savory aromatic seasoning',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Corn Starch',
          description: 'Refined carbohydrate polymer extracted from corn endosperm',
          purpose: 'Anti-caking agent and seasoning adhesion',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Natural and Artificial Flavors',
          description: 'Proprietary synthetic and concentrated aromatic compounds',
          purpose: 'Enhanced aroma and amplified savory taste',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Dextrose',
          description: 'Simple d-glucose monosaccharide contributing to palatability',
          purpose: 'Sweetness balancing and crust caramelization',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Spices',
          description: 'Proprietary culinary spice blend including paprika and pepper',
          purpose: 'Warm flavor and visual speckling',
          isAllergen: false,
          isControversial: false
        },
        {
          ingredient: 'Artificial Color (Yellow 6, Yellow 5, Red 40)',
          description: 'Synthetic petroleum-derived azo food dyes subject to EU warning label requirements',
          purpose: 'Cosmetic neon cheese coloration',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Disodium Inosinate',
          description: 'Purine nucleotide additive that synergistically boosts umami receptors 4-8x alongside MSG',
          purpose: 'Synthetic savory flavor multiplier',
          isAllergen: false,
          isControversial: true
        },
        {
          ingredient: 'Disodium Guanylate',
          description: 'Guanosine nucleotide flavor enhancer paired with MSG to amplify savory perception',
          purpose: 'Synthetic umami multiplier',
          isAllergen: false,
          isControversial: true
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
