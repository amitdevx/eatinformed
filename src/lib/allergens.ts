// Whole-word label matching only. No match is not evidence of allergy safety.
const aliases: Record<string, string[]> = {
  milk: ['milk', 'whey', 'casein', 'caseinate', 'butter', 'cream'],
  egg: ['egg', 'eggs', 'albumen'],
  peanut: ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  'tree nut': ['almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 'hazelnut', 'hazelnuts', 'pistachio', 'pistachios'],
  soy: ['soy', 'soya', 'soybean', 'soybeans'],
  wheat: ['wheat', 'semolina', 'durum', 'spelt'],
  fish: ['fish', 'anchovy', 'anchovies', 'salmon', 'tuna'],
  shellfish: ['shrimp', 'prawn', 'prawns', 'crab', 'lobster'],
  sesame: ['sesame', 'tahini'],
};

export function preferenceWarnings(ingredients: string[], preferences: string[]): string[] {
  const tokens = new Set(ingredients.join(' ').normalize('NFKC').toLowerCase().split(/[^\p{L}\p{N}]+/u));
  return preferences.flatMap(preference => {
    const matches = (aliases[preference] || [preference]).filter(alias => tokens.has(alias));
    return matches.length ? [`Your ${preference} preference: possible ingredient match (${matches.join(', ')}). Check the label and manufacturer; this is not an allergy-safety assessment.`] : [];
  });
}
