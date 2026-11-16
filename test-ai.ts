import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
config({ path: '.env.local' });
async function main() {
  if (!process.argv[2]) throw new Error('Usage: npx tsx test-ai.ts path/to/label.jpg');
  const { validateImagePayload } = await import('./src/lib/image-validation');
  const { analyzeProduct } = await import('./src/ai/flows/product-analysis');
  const bytes = await readFile(process.argv[2]);
  const image = await validateImagePayload(`data:image/jpeg;base64,${bytes.toString('base64')}`);
  if (!image.valid) throw new Error(image.error);
  const started = Date.now();
  const result = await analyzeProduct(image.normalized!);
  console.log(JSON.stringify({ status: result.status, durationMs: Date.now() - started, result }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Live test failed'); process.exitCode = 1; });
