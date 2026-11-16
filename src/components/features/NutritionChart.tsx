 'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
interface NutrientItem { nutrient: string; perServing?: string; per100g?: string; per100mL?: string }
export default function NutritionChart({ data, servingSizeLabel }: { data: NutrientItem[]; servingSizeLabel?: string }) {
  const values = data.flatMap(item => {
    if (!/^(protein|total fat|fat|carbohydrates?|total carbohydrates?|dietary fib(?:er|re)|fib(?:er|re))$/i.test(item.nutrient.trim())) return [];
    const match = item.perServing?.trim().match(/^(\d+(?:[.,]\d+)?)\s*g$/i);
    return match ? [{ name: item.nutrient, grams: Number(match[1].replace(',', '.')) }] : [];
  });
  if (!values.length) return null;
  return <section className="mt-6 rounded-2xl border p-4 min-w-0">
    <h3 className="font-semibold">Label amounts per serving</h3>
    <p className="text-sm text-muted-foreground">{servingSizeLabel || 'Serving size not specified'}. Only explicit gram values are charted; missing amounts remain unknown.</p>
    <div className="h-64 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={values} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" unit=" g" /><YAxis type="category" dataKey="name" width={100} /><Tooltip formatter={value => `${value} g`} /><Bar dataKey="grams" fill="hsl(var(--primary))" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
  </section>;
}
