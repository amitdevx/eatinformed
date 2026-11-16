import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { NextRequest } from 'next/server';
import { quotaStatus } from '../src/lib/quota';
import { authenticate, readJson } from '../src/lib/request';
import { validateImagePayload } from '../src/lib/image-validation';
import { parseNIMResponse } from '../src/ai/nim';
import { ProductAnalysisOutputSchema } from '../src/ai/flows/product-analysis-types';
import { POST } from '../src/app/api/scan/route';

test('rolling quota expires each event independently at 7200 seconds', () => {
  const now = 10_000_000;
  const events = [0, 1000, 2000, 3000].map((delta, i) => ({ id: String(i), at: now - 7200000 + delta }));
  assert.equal(quotaStatus(events, true, now - 1).remaining, 0);
  assert.equal(quotaStatus(events, true, now).remaining, 1);
  assert.equal(quotaStatus(events, true, now + 1000).remaining, 2);
  assert.equal(quotaStatus(events, false, now).limit, 50);
});
test('malformed and truncated JSON is never repaired into success', () => {
  for (const raw of ['', '{"ingredients":["milk"', '{"rating":2,}', '<think>{"status":"success"}', 'prefix {"status":"success"}', '[]']) assert.throws(() => parseNIMResponse(raw));
  assert.deepEqual(parseNIMResponse('```json\n{"status":"no_data"}\n```'), { status: 'no_data' });
});
test('unknown remains null; strings and invalid assessment ranges fail', () => {
  const result = ProductAnalysisOutputSchema.parse({ status: 'success', ingredients: ['oats'] });
  assert.equal(result.rating, null); assert.equal(result.novaGroup, null); assert.equal(result.dietaryInfo.isVegan, null);
  for (const data of [{ rating: '' }, { rating: 6 }, { novaGroup: 1.5 }, { dietaryInfo: { isVegan: 'false' } }, { ingredientAnalysis: [{ ingredient: 'oats', isAllergen: 'false' }] }]) assert.equal(ProductAnalysisOutputSchema.safeParse({ status: 'success', ...data }).success, false);
  assert.equal(ProductAnalysisOutputSchema.safeParse({ ingredients: ['oats'] }).success, false);
});
test('decoder accepts real pixels, rejects MIME mismatch, damaged data and oversized dimensions', async () => {
  const jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: 'white' } }).jpeg().toBuffer();
  assert.equal((await validateImagePayload(`data:image/jpeg;base64,${jpeg.toString('base64')}`)).valid, true);
  assert.equal((await validateImagePayload(`data:image/png;base64,${jpeg.toString('base64')}`)).valid, false);
  assert.equal((await validateImagePayload(`data:image/jpeg;base64,${jpeg.subarray(0, 150).toString('base64')}`)).valid, false);
  assert.equal((await validateImagePayload('data:image/jpeg;base64,%%%%')).valid, false);
  const huge = await sharp({ create: { width: 6001, height: 1, channels: 3, background: 'white' } }).png().toBuffer();
  assert.equal((await validateImagePayload(`data:image/png;base64,${huge.toString('base64')}`)).valid, false);
});
test('body limits work without Content-Length', async () => {
  const req = new NextRequest('http://localhost/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: 'x'.repeat(100) }) });
  await assert.rejects(readJson(req, 20), { status: 413 });
});
test('missing auth and public test headers never grant access', async () => {
  await assert.rejects(authenticate(new NextRequest('http://localhost/api/scan')), { status: 401 });
  const response = await POST(new NextRequest('http://localhost/api/scan', { method: 'POST', headers: { 'x-eatinformed-client': 'test', 'content-type': 'application/json' }, body: '{}' }));
  assert.equal(response.status, 401);
});
test('missing Admin configuration fails closed for forged legacy guest token', async () => {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) return;
  await assert.rejects(authenticate(new NextRequest('http://localhost/api/scan', { headers: { authorization: 'Bearer guest_public_signed_token' } })), { status: 503 });
});

import { preferenceWarnings } from '../src/lib/allergens';
test('allergen aliases use whole words and never promise safety', () => {
  assert.equal(preferenceWarnings(['nutmeg', 'coconut', 'eggplant'], ['egg', 'tree nut']).length, 0);
  assert.equal(preferenceWarnings(['whey powder', 'groundnuts'], ['milk', 'peanut']).length, 2);
});

import { parseServiceAccount } from '../src/lib/firebase-credentials';
test('service-account serialization supports escaped PEM, camel case and double-encoded JSON', () => {
  const source = { project_id: 'demo-test', client_email: 'test@example.test', private_key: 'line1\\nline2' };
  assert.equal(parseServiceAccount(JSON.stringify(source)).privateKey, 'line1\nline2');
  assert.equal(parseServiceAccount(JSON.stringify(JSON.stringify(source))).projectId, 'demo-test');
  assert.equal(parseServiceAccount(JSON.stringify({ projectId: source.project_id, clientEmail: source.client_email, privateKey: source.private_key })).clientEmail, source.client_email);
  assert.throws(() => parseServiceAccount('{}'));
  assert.throws(() => parseServiceAccount('not json'));
});
