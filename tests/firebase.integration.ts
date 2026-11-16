import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '../src/lib/firebase-admin';
import { authenticate } from '../src/lib/request';
import { ScanStore } from '../src/lib/quota';
import { createScanHandler } from '../src/lib/scan-service';
import { ProductAnalysisOutputSchema } from '../src/ai/flows/product-analysis-types';
import { POST as authPost } from '../src/app/api/auth/[...action]/route';
import { GET as historyGet, DELETE as historyDelete } from '../src/app/api/history/route';
import { PATCH as profilePatch } from '../src/app/api/profile/route';
import { ApiError } from '../src/lib/api-error';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.GCLOUD_PROJECT?.startsWith('demo-')) throw new Error('Integration tests require isolated demo emulators.');
const origin = 'http://localhost';
function req(path: string, token?: string, body?: unknown, method = 'POST', extra: Record<string,string> = {}) {
  return new NextRequest(origin + path, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function login(member = false) {
  const result = await authPost(req('/api/auth/mobile', undefined, member ? { type: 'signUp', email: `${randomUUID()}@example.test`, password: 'test-password-123' } : { type: 'guest' }), { params: Promise.resolve({ action: ['mobile'] }) });
  assert.equal(result.status, 200, JSON.stringify(await result.clone().json()));
  return await result.json();
}
function alter(token: string, patch: Record<string, unknown>) {
  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url').toString()), ...patch })).toString('base64url');
  return parts.join('.');
}
test('Firebase identities, invalid/expired/wrong-project tokens, disabled account and distinct session cookies', async () => {
  const guest = await login(), member = await login(true);
  assert.deepEqual(await authenticate(req('/api/scan', guest.token)), { uid: guest.user.uid, isGuest: true });
  assert.equal((await authenticate(req('/api/scan', member.token))).isGuest, false);
  for (const token of ['', 'guest_forged', 'test_member', alter(member.token, { exp: 1 }), alter(member.token, { aud: 'another-project' })]) await assert.rejects(authenticate(req('/api/scan', token || ' ')), { status: 401 });
  const session = await adminAuth!.createSessionCookie(member.token, { expiresIn: 86400000 });
  assert.equal((await authenticate(req('/api/scan', undefined, undefined, 'GET', { cookie: `session=${session}` }))).uid, member.user.uid);
  await assert.rejects(authenticate(req('/api/scan', session)), { status: 401 });
  await assert.rejects(authenticate(req('/api/scan', undefined, undefined, 'GET', { cookie: `session=${member.token}` })), { status: 401 });
  await adminAuth!.updateUser(member.user.uid, { disabled: true });
  await assert.rejects(authenticate(req('/api/scan', member.token)), { status: 401 });
  await assert.rejects(authenticate(req('/api/scan', undefined, undefined, 'GET', { cookie: `session=${session}` })), { status: 401 });
});
test('revoked tokens are rejected and refresh preserves guest UID', async () => {
  const guest = await login();
  const refreshed = await authPost(req('/api/auth/mobile', undefined, { type: 'refresh', refreshToken: guest.refreshToken }), { params: Promise.resolve({ action: ['mobile'] }) });
  assert.equal((await refreshed.json()).user.uid, guest.user.uid);
  await adminAuth!.updateUser(guest.user.uid, { tokensValidAfterTime: new Date(Date.now() + 10000).toISOString() } as any);
  await adminAuth!.revokeRefreshTokens(guest.user.uid);
  const oldAuth = alter(guest.token, { auth_time: 1 });
  await assert.rejects(authenticate(req('/api/scan', oldAuth)), { status: 401 });
});
test('real Firestore admission admits exactly one concurrent final slot across store instances', async () => {
  const guest = await login(), identity = { uid: guest.user.uid, isGuest: true };
  const first = new ScanStore(adminDb!), second = new ScanStore(adminDb!);
  for (let i=0; i<3; i++) assert.equal((await first.reserve(identity, randomUUID(), 'image')).status, 202);
  const results = await Promise.all(Array.from({length:8}, (_,i) => (i%2 ? first : second).reserve(identity, randomUUID(), 'image')));
  assert.equal(results.filter(r => r.status === 202).length, 1);
  assert.equal((await new ScanStore(adminDb!).inspect(identity)).remaining, 0);
  const script = `import {adminDb} from './src/lib/firebase-admin'; import {ScanStore} from './src/lib/quota'; new ScanStore(adminDb!).inspect(${JSON.stringify(identity)}).then(q=>{console.log(q.remaining);process.exit()});`;
  assert.equal(execFileSync(process.execPath, ['--import','tsx','--eval', script], { encoding: 'utf8', env: process.env }).trim(), '0');
});
test('route validation, headers, idempotency, persistence, deletion and account isolation', async () => {
  const guest = await login(), other = await login();
  let calls = 0;
  // Deterministic fixture models extracted evidence, not live AI accuracy.
  const fixture = ProductAnalysisOutputSchema.parse({ status: 'success', productName: 'Test oats label', ingredients: ['oats'], nutrition: { rawText: 'Energy 150 kcal per serving', nutrients: [{ nutrient: 'Energy', perServing: '150 kcal' }] } });
  const handler = createScanHandler(async () => { calls++; return fixture; });
  const jpeg = await sharp({create:{width:64,height:64,channels:3,background:'white'}}).jpeg().toBuffer();
  const image = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  const key = randomUUID(), headers = { 'idempotency-key': key, 'x-eatinformed-client': 'test' };
  const invalid = await handler(req('/api/scan', guest.token, { image: 'invalid' }, 'POST', headers));
  assert.equal(invalid.status, 415); assert.equal((await new ScanStore(adminDb!).inspect({uid:guest.user.uid,isGuest:true})).remaining,4);
  const first = await handler(req('/api/scan',guest.token,{image},'POST',headers));
  assert.equal(first.status,200); const data=await first.json(); assert.equal(data.rating,null);
  const replay=await handler(req('/api/scan',guest.token,{image},'POST',headers));
  assert.equal((await replay.json()).idempotentReplay,true); assert.equal(calls,1);
  const ownerHistory=await historyGet(req('/api/history',guest.token,undefined,'GET'));
  assert.equal((await ownerHistory.json()).totalScans,1);
  const otherHistory=await historyGet(req('/api/history',other.token,undefined,'GET')); assert.equal((await otherHistory.json()).items.length,0);
  assert.equal((await historyDelete(req(`/api/history?id=${data.scanId}`,other.token,undefined,'DELETE'))).status,404);
  assert.equal((await historyDelete(req(`/api/history?id=${data.scanId}`,guest.token,undefined,'DELETE'))).status,200);
  assert.equal((await handler(req('/api/scan',guest.token,{image},'POST',headers))).status,410);
  assert.equal((await handler(req('/api/scan',guest.token,{image},'POST',{...headers,origin:'https://attacker.test'}))).status,403);
});
test('payload-bound pending keys, exact failure accounting, rolling time and account upgrade',async()=>{
  const identity={uid:randomUUID(),isGuest:true}; let now=10_000_000; const store=new ScanStore(adminDb!,()=>now);
  const key=randomUUID(); await store.reserve(identity,key,'a');
  await assert.rejects(store.reserve(identity,key,'b'),{code:'idempotency_conflict'});
  await assert.rejects(store.reserve(identity,key,'a'),{code:'scan_in_progress'});
  await store.finish(identity,key,{status:'error',error:'Provider unavailable'},503);
  assert.equal((await store.reserve(identity,key,'a')).status,503);
  assert.equal((await store.inspect(identity)).remaining,3);
  assert.equal((await store.inspect({...identity,isGuest:false})).remaining,49);
  now+=7200000; assert.equal((await store.inspect(identity)).remaining,4);
});
test('provider error remains 503, never unreadable; profile handles enforce ownership', async()=>{
  const guest=await login(); const jpeg=await sharp({create:{width:32,height:32,channels:3,background:'white'}}).jpeg().toBuffer();
  const response=await createScanHandler(async()=>{throw new ApiError(503,'provider_authentication','Service unavailable');})(req('/api/scan',guest.token,{image:`data:image/jpeg;base64,${jpeg.toString('base64')}`},'POST',{'idempotency-key':randomUUID()}));
  assert.equal(response.status,503); assert.equal((await response.json()).code,'provider_authentication');
  const other=await login(),handle='h'+randomUUID().replaceAll('-','').slice(0,12);
  assert.equal((await profilePatch(req('/api/profile',guest.token,{handle},'PATCH'))).status,200);
  assert.equal((await profilePatch(req('/api/profile',other.token,{handle},'PATCH'))).status,409);
  assert.equal((await profilePatch(req('/api/profile',other.token,{uid:guest.user.uid,name:'intruder'},'PATCH'))).status,400);
});
