'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Activity } from 'lucide-react';

export interface NutrientItem {
  nutrient: string;
  perServing?: string;
  per100mL?: string;
}

interface NutritionChartProps {
  data: NutrientItem[];
  servingSizeLabel?: string;
}

// Reference Daily Values (FDA/WHO standard, 2,000 kcal diet)
// ponytail: normalizing to % DV solves multi-unit scale distortion (kcal vs g vs mg)
interface NutrientDef {
  key: string;
  label: string;
  dailyValue: number; // in base units
  baseUnit: string;
  aliases: string[];
}

const NUTRIENT_DEFS: NutrientDef[] = [
  { key: 'energy', label: 'Calories', dailyValue: 2000, baseUnit: 'kcal', aliases: ['energy', 'calories', 'calorie', 'kcal', 'energy (kcal)', 'energy (kj)'] },
  { key: 'protein', label: 'Protein', dailyValue: 50, baseUnit: 'g', aliases: ['protein', 'proteins', 'total protein'] },
  { key: 'carbohydrate', label: 'Carbs', dailyValue: 275, baseUnit: 'g', aliases: ['carbohydrate', 'carbohydrates', 'total carbohydrate', 'total carbohydrates', 'carbs'] },
  { key: 'sugars', label: 'Total Sugars', dailyValue: 50, baseUnit: 'g', aliases: ['total sugars', 'sugars', 'sugar', 'total sugar'] },
  { key: 'added_sugars', label: 'Added Sugars', dailyValue: 50, baseUnit: 'g', aliases: ['added sugars', 'added sugar', 'incl. added sugars'] },
  { key: 'fiber', label: 'Dietary Fiber', dailyValue: 28, baseUnit: 'g', aliases: ['dietary fiber', 'fiber', 'fibre', 'dietary fibre'] },
  { key: 'fat', label: 'Total Fat', dailyValue: 78, baseUnit: 'g', aliases: ['total fat', 'fat', 'fats', 'total lipids'] },
  { key: 'saturated_fat', label: 'Saturated Fat', dailyValue: 20, baseUnit: 'g', aliases: ['saturated fat', 'saturated fats', 'saturated fatty acids', 'saturates'] },
  { key: 'trans_fat', label: 'Trans Fat', dailyValue: 2, baseUnit: 'g', aliases: ['trans fat', 'trans fats', 'trans fatty acids'] },
  { key: 'sodium', label: 'Sodium', dailyValue: 2300, baseUnit: 'mg', aliases: ['sodium', 'salt', 'na'] },
];

// ponytail: parse European decimals, ranges, trace amounts, and units cleanly
function parseNutrientAmount(raw: string | undefined, def: NutrientDef): { amount: number; display: string } {
  if (!raw || raw.toLowerCase() === 'n/a' || raw === 'nil' || raw === 'nd') {
    return { amount: 0, display: '0 ' + def.baseUnit };
  }

  const trimmed = raw.trim();
  const normalized = trimmed.replace(/,/g, '.');

  // Handle range (e.g., "10 - 15g" -> upper bound 15)
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  let num = 0;
  if (rangeMatch) {
    num = parseFloat(rangeMatch[2]);
  } else {
    // Extract first number
    const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    num = numMatch ? parseFloat(numMatch[1]) : 0;
  }

  if (isNaN(num)) num = 0;

  // Handle unit conversions
  if (def.key === 'energy' && /kj\b/i.test(normalized)) {
    // 1 kcal ~ 4.184 kJ
    num = Number((num / 4.184).toFixed(1));
  } else if (def.key === 'sodium') {
    if (/\bg\b/i.test(normalized) && !/mg/i.test(normalized)) {
      num = num * 1000; // grams to mg
    } else if (/salt/i.test(normalized)) {
      // 1g salt ~ 400mg sodium
      num = num * 400;
    }
  }

  return {
    amount: Number(num.toFixed(1)),
    display: `${Number(num.toFixed(1))}${def.baseUnit}`,
  };
}

export default function NutritionChart({ data, servingSizeLabel }: NutritionChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Find matching items using aliases
  const chartData = NUTRIENT_DEFS.map(def => {
    const matched = data.find(item => {
      const name = item.nutrient.trim().toLowerCase();
      return def.aliases.some(alias => name === alias || name.startsWith(alias + ' '));
    });

    if (!matched) return null;

    const servingParsed = parseNutrientAmount(matched.perServing, def);
    const per100Parsed = parseNutrientAmount(matched.per100mL, def);

    // Calculate % Daily Value (capped at 150% for sensible chart scaling)
    const servingPct = Number(Math.min(150, (servingParsed.amount / def.dailyValue) * 100).toFixed(1));
    const per100Pct = Number(Math.min(150, (per100Parsed.amount / def.dailyValue) * 100).toFixed(1));

    return {
      name: def.label,
      servingPct,
      per100Pct,
      servingRaw: servingParsed.display,
      per100Raw: per100Parsed.display,
      dailyValue: `${def.dailyValue}${def.baseUnit}`,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  if (chartData.length === 0) {
    return null;
  }

  // ponytail: use alphanumeric keys for chartConfig to avoid invalid CSS variables
  const chartConfig = {
    servingPct: {
      label: servingSizeLabel ? `Serving (${servingSizeLabel.replace(/Serving size: /i, '')})` : 'Per Serving',
      color: 'hsl(var(--primary))',
    },
    per100Pct: {
      label: 'Per 100g/mL',
      color: 'hsl(var(--accent))',
    },
  } satisfies ChartConfig;

  return (
    <Card className="mt-6 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Nutritional Profile (% Daily Value)
        </CardTitle>
        <CardDescription>
          Comparison of key nutrients as % of standard Daily Value (based on a 2,000 kcal diet).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ponytail: ChartContainer already has ResponsiveContainer internally; do NOT nest another */}
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              domain={[0, 'dataMax + 10']}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.85)', fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name, props) => {
                    const isServing = name === 'servingPct' || name === 'Per Serving';
                    const raw = isServing ? props?.payload?.servingRaw : props?.payload?.per100Raw;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{value}% DV</span>
                        <span className="text-xs text-white/60">({raw})</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="servingPct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="per100Pct" fill="hsl(var(--accent))" fillOpacity={0.7} radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
