import { ProductAnalysisOutput } from '../types';

export const STRESS_TEST_PRODUCTS: { id: string; name: string; data: ProductAnalysisOutput }[] = [
  {
    id: 'stress-extreme-lengths',
    name: 'Stress Test: Extreme String Lengths',
    data: {
      status: 'success',
      productName: 'SUPER-ORGANIC-WHOLE-GRAIN-MULTIVITAMIN-ENRICHED-ARTISANAL-GLUTEN-FREE-NON-GMO-PLANT-BASED-CALCIUM-FORTIFIED-BEVERAGE-PREPARATION',
      brand: 'GLOBAL-INDUSTRIAL-FOOD-LABORATORIES-PHARMACEUTICAL-HOLDINGS-INTERNATIONAL-LTD',
      novaGroup: 4,
      rating: 1.2,
      ingredients: [
        'Hydroxypolyoxyethylenecarboxymethylcellulose-sodium-sesquicarbonate-polyoxypropylene-monostearate-diisostearyl-malate-cyclopentasiloxane-trimethylsiloxysilicate',
        'Deoxyribonucleic-acid-fortified-isolated-soy-protein-isolate-monohydrate-hydrolyzed-collagen-peptide-complex',
        'Monosodium-glutamate-and-disodium-5-ribonucleotide-flavor-enhancement-admixture-grade-E621-E635',
      ],
      nutrition: {
        rawText: 'Extreme nutritional facts panel with dense line breaks and unformatted raw tables.',
        servingSizeLabel: '1 Mega-Container / 946mL (32 fl oz)',
        nutrients: [
          { nutrient: 'Very-Long-Nutrient-Name-High-Density-Lipoprotein-Cholesterol-Carrier', perServing: '3500mg', per100mL: '370mg' },
          { nutrient: 'Total-Industrial-Hydrogenated-Trans-Fatty-Acid-Triglyceride-Complex', perServing: '18.5g', per100mL: '2.0g' },
          { nutrient: 'Added-High-Fructose-Corn-Sweetener-Syrup-Equivalent-Solids', perServing: '78g', per100mL: '8.2g' },
        ],
      },
      pros: [
        'Contains trace calcium carbonate fortification compounds',
      ],
      cons: [
        'Extreme sodium density exceeding 150% recommended daily intake values in a single commercial packaging unit',
        'Formulated with complex industrial synthetic stabilizers and artificial colorants',
      ],
      warnings: [
        'CRITICAL SODIUM HAZARD: 3,500mg sodium in single package exceeds maximum recommended adult daily intake limits.',
      ],
      ingredientAnalysis: [
        {
          ingredient: 'Hydroxypolyoxyethylenecarboxymethylcellulose-sodium-sesquicarbonate-polyoxypropylene-monostearate-diisostearyl-malate-cyclopentasiloxane-trimethylsiloxysilicate',
          description: 'Synthetic high-molecular-weight industrial stabilizing polymer.',
          purpose: 'Texture control and emulsification.',
          isAllergen: false,
          isControversial: true,
        },
      ],
      dietaryInfo: {
        allergens: ['Soy (Isolate)', 'Sulfites (Processing Trace)'],
        suitability: ['Not suitable for low-sodium diets'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        summary: 'Ultra-processed food formulation with extreme sodium density.',
      },
    },
  },
  {
    id: 'stress-empty-fields',
    name: 'Stress Test: Minimal/Empty Fields',
    data: {
      status: 'success',
      productName: '',
      brand: '',
      novaGroup: 2,
      rating: 0,
      ingredients: [],
      nutrition: {
        rawText: '',
        servingSizeLabel: undefined,
        nutrients: [],
      },
      pros: [],
      cons: [],
      warnings: [],
      ingredientAnalysis: [],
      dietaryInfo: {
        allergens: [],
        suitability: [],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        summary: '',
      },
    },
  },
];
