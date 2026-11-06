'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';

export interface NutrientItem {
  nutrient: string;
  perServing?: string;
  per100mL?: string;
}

interface NutritionChartProps {
  data: NutrientItem[];
  servingSizeLabel?: string;
}

interface NutrientDef {
  key: string;
  label: string;
  dailyValue: number;
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

function parseNutrientAmount(raw: string | undefined, def: NutrientDef): { amount: number; display: string } {
  if (!raw || /^(n\/a|nil|nd|-)$/i.test(raw.trim())) {
    return { amount: 0, display: '0 ' + def.baseUnit };
  }

  // ponytail: remove thousands-separator commas (e.g. "1,250mg" -> "1250mg") before converting decimal commas
  const normalized = raw
    .trim()
    .replace(/(\d),(\d{3})\b/g, '$1$2')
    .replace(/,/g, '.');

  // ponytail: if Energy has both kcal and kJ (e.g. "418 kJ / 100 kcal"), prefer the explicit kcal number
  if (def.key === 'energy') {
    const kcalMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kcal\b/i);
    if (kcalMatch) {
      const kcal = Number(parseFloat(kcalMatch[1]).toFixed(1));
      return { amount: kcal, display: `${kcal}kcal` };
    }
    const kjMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kj\b/i);
    if (kjMatch) {
      const kcal = Number((parseFloat(kjMatch[1]) / 4.184).toFixed(1));
      return { amount: kcal, display: `${kcal}kcal` };
    }
  }

  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  let num = rangeMatch ? parseFloat(rangeMatch[2]) : numMatch ? parseFloat(numMatch[1]) : 0;
  if (isNaN(num)) num = 0;

  if (def.key === 'sodium') {
    if (/\bg\b/i.test(normalized) && !/mg/i.test(normalized)) {
      num = num * 1000;
    } else if (/salt/i.test(normalized)) {
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

  const chartData = NUTRIENT_DEFS.map((def) => {
    const matched = data.find((item) => {
      const name = item.nutrient.trim().toLowerCase();
      return def.aliases.some((alias) => name === alias || name.startsWith(alias + ' '));
    });

    if (!matched) return null;

    const servingParsed = parseNutrientAmount(matched.perServing, def);
    const per100Parsed = parseNutrientAmount(matched.per100mL, def);

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

  const chartConfig = {
    servingPct: {
      label: servingSizeLabel ? `Serving (${servingSizeLabel.replace(/Serving size: /i, '')})` : 'Per Serving',
      color: 'hsl(var(--primary))',
    },
    per100Pct: {
      label: 'Per 100g/mL',
      color: 'hsl(var(--muted-foreground))',
    },
  } satisfies ChartConfig;

  return (
    <Card className="mt-6 border border-border bg-card shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <BarChart3 className="h-4 w-4 text-primary shrink-0" />
          Nutritional Profile (% Daily Value)
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Comparison of key nutrients as % of standard Daily Value (based on a 2,000 kcal diet).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[380px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              domain={[0, 'dataMax + 10']}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name, props) => {
                    const isServing = name === 'servingPct' || name === 'Per Serving';
                    const raw = isServing ? props?.payload?.servingRaw : props?.payload?.per100Raw;
                    return (
                      <div className="flex items-center gap-2 text-foreground">
                        <span className="font-bold text-xs">{value}% DV</span>
                        <span className="text-[11px] text-muted-foreground">({raw})</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar isAnimationActive={false} dataKey="servingPct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={11} />
            <Bar isAnimationActive={false} dataKey="per100Pct" fill="hsl(var(--muted-foreground))" fillOpacity={0.6} radius={[0, 4, 4, 0]} barSize={11} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
