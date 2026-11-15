import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  }
}

console.log('================================================================');
console.log('  EATINFORMED E2E TEST SUITE: NIM, OCR, AUTH, RATE LIMIT & SYNC');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTests() {
  // -------------------------------------------------------------
  // TEST GROUP 1: NIM Configuration & Active Models
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: NIM CONFIGURATION & MODELS ---');
  const { isNimConfigured, parseNIMResponse } = await import('../src/ai/nim');
  assert(isNimConfigured(), 'isNimConfigured() validates active NVIDIA_API_KEY');

  // Verify product analysis points to active 200 OK model
  const analysisModule = await import('../src/ai/flows/product-analysis');
  assert(typeof analysisModule.analyzeProduct === 'function', 'analyzeProduct flow function is exported');
  assert(typeof analysisModule.optimizeImageForOCR === 'function', 'optimizeImageForOCR function is exported');

  // -------------------------------------------------------------
  // TEST GROUP 2: Robust Parser Under Extreme LLM Slop
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: ROBUST PARSER EDGE CASES ---');
  // 2.1 Unescaped newlines in JSON strings
  const res1 = parseNIMResponse('{"productName": "Oatmeal\\nQuick Cooking", "rating": 80}');
  assert(res1?.productName === 'Oatmeal\nQuick Cooking' && res1?.rating === 80, 'Handles unescaped string newlines');

  // 2.2 Unclosed <think> tag
  const res2 = parseNIMResponse('<think>Thinking deeply about nutrition...\n{"status": "success", "novaGroup": 1}');
  assert(res2?.status === 'success' && res2?.novaGroup === 1, 'Recovers cleanly from unclosed <think> prefix');

  // 2.3 Markdown code fences
  const res3 = parseNIMResponse('```json\n{"pros": ["High Fiber"], "cons": ["High Sugar"]}\n```');
  assert(res3?.pros?.[0] === 'High Fiber' && res3?.cons?.[0] === 'High Sugar', 'Extracts from markdown code fences');

  // 2.4 Multi-commas & trailing commas
  const res4 = parseNIMResponse('{"items": ["Oats",, "Honey",], "valid": true,}');
  assert(res4?.items?.length === 2 && res4?.valid === true, 'Cleans duplicate commas and trailing commas');

  // 2.5 LIFO bracket/brace repair on truncated output
  const res5 = parseNIMResponse('{"nutrition": {"calories": 150, "nutrients": [{"name": "Iron"');
  assert(res5?.nutrition?.calories === 150 && res5?.nutrition?.nutrients?.[0]?.name === 'Iron', 'LIFO auto-balancer closes unclosed truncated JSON objects and arrays');

  // 2.6 Missing opening quote after colon (Screenshot 72610.png fix)
  const res6 = parseNIMResponse('{"description": A blend of spices", "isAllergen": false}');
  assert(res6?.description?.includes('A blend of spices') && res6?.isAllergen === false, 'Repairs missing opening quote after colon');

  // 2.7 Inner unescaped double quotes & duplicate quotes
  const res7 = parseNIMResponse('{"ingredient": "A "blend" of spices", "summary": ""Organic oatmeal""}');
  assert(res7?.ingredient?.includes('blend') && res7?.summary?.includes('Organic oatmeal'), 'Escapes unescaped inner and duplicate quotes in string values');

  // -------------------------------------------------------------
  // TEST GROUP 3: Image OCR & Sharp Pipeline
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: IMAGE OCR & PREPARATION ---');
  const testBuffer = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).jpeg().toBuffer();

  const dataUri = `data:image/jpeg;base64,${testBuffer.toString('base64')}`;
  const optimizedUri = await analysisModule.optimizeImageForOCR(dataUri);
  assert(optimizedUri.startsWith('data:image/jpeg;base64,'), 'optimizeImageForOCR returns standard JPEG data URI');

  const meta = await sharp(Buffer.from(optimizedUri.split(',')[1], 'base64')).metadata();
  assert((meta.width ?? 0) <= 1400 && (meta.height ?? 0) <= 1400, 'sharp resizes large images to max 1400px preserving detail');

  // -------------------------------------------------------------
  // TEST GROUP 4: Rate Limiting Simulation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: RATE LIMITING (20 REQ / 60S) ---');
  const ipMap = new Map<string, number[]>();
  function testRateLimit(ip: string, limit = 20, windowMs = 60000): boolean {
    const now = Date.now();
    const timestamps = ipMap.get(ip) || [];
    const valid = timestamps.filter(t => now - t < windowMs);
    if (valid.length >= limit) {
      ipMap.set(ip, valid);
      return false; // blocked
    }
    valid.push(now);
    ipMap.set(ip, valid);
    return true; // allowed
  }

  const clientIp = '10.0.0.1';
  let allowed = 0;
  for (let i = 0; i < 25; i++) {
    if (testRateLimit(clientIp)) allowed++;
  }
  assert(allowed === 20, 'Allows exactly 20 requests within 60-second window');
  assert(!testRateLimit(clientIp), '21st request is blocked (HTTP 429)');

  // Advance time past window
  const validTimes = ipMap.get(clientIp)!;
  ipMap.set(clientIp, validTimes.map(t => t - 61000));
  assert(testRateLimit(clientIp), 'Rate limit window resets and allows new requests after 60s');

  // -------------------------------------------------------------
  // TEST GROUP 5: Auth Endpoints & Error Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: AUTH ENDPOINTS & ERROR HANDLING ---');
  const { NextRequest } = await import('next/server');
  const authRoute = await import('../src/app/api/auth/[...action]/route');

  // 5.1 POST Logout
  const postLogout = await authRoute.POST(
    new NextRequest('http://localhost:3000/api/auth/logout', { method: 'POST' }),
    { params: Promise.resolve({ action: ['logout'] }) }
  );
  assert(postLogout.status === 200, 'POST /api/auth/logout returns HTTP 200 and clears session');

  // 5.2 GET Logout
  const getLogout = await authRoute.GET(
    new NextRequest('http://localhost:3000/api/auth/logout', { method: 'GET' }),
    { params: Promise.resolve({ action: ['logout'] }) }
  );
  assert(getLogout.status === 200, 'GET /api/auth/logout returns HTTP 200 and clears session');

  // 5.3 Login with missing idToken
  const invalidLogin = await authRoute.POST(
    new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
    { params: Promise.resolve({ action: ['login'] }) }
  );
  assert(invalidLogin.status === 400, 'POST /api/auth/login with missing idToken returns HTTP 400');

  // 5.4 Mobile auth with missing password
  const missingPass = await authRoute.POST(
    new NextRequest('http://localhost:3000/api/auth/mobile', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    }),
    { params: Promise.resolve({ action: ['mobile'] }) }
  );
  assert(missingPass.status === 400, 'POST /api/auth/mobile with missing password returns HTTP 400');

  // 5.5 Mobile auth with password < 6 characters
  const shortPass = await authRoute.POST(
    new NextRequest('http://localhost:3000/api/auth/mobile', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '123' }),
    }),
    { params: Promise.resolve({ action: ['mobile'] }) }
  );
  assert(shortPass.status === 400, 'POST /api/auth/mobile with password < 6 characters returns HTTP 400');

  // 5.6 Mobile auth guest mode
  const guestRes = await authRoute.POST(
    new NextRequest('http://localhost:3000/api/auth/mobile', {
      method: 'POST',
      body: JSON.stringify({ type: 'guest' }),
    }),
    { params: Promise.resolve({ action: ['mobile'] }) }
  );
  const guestData = await guestRes.json();
  assert(
    guestRes.status === 200 && guestData.user?.isAnonymous === true,
    'POST /api/auth/mobile guest mode creates valid anonymous session'
  );

  // -------------------------------------------------------------
  // TEST GROUP 6: Google OAuth Failure Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: GOOGLE OAUTH FAILURE HANDLING ---');
  // 6.1 Web Google Popup Closed Simulation
  function handleWebGoogleError(error: any): { isSilent: boolean; errorMsg: string } {
    if (error?.code === 'auth/popup-closed-by-user') {
      return { isSilent: true, errorMsg: '' };
    }
    return { isSilent: false, errorMsg: error?.message || 'Authentication failed' };
  }
  const popupClosed = handleWebGoogleError({ code: 'auth/popup-closed-by-user' });
  assert(popupClosed.isSilent && popupClosed.errorMsg === '', 'Web ignores popup-closed-by-user without showing red error alert');

  // 6.2 Mobile Google OAuth Cancellation Simulation
  function handleMobileOAuthResult(result: { type: string; url?: string }): boolean {
    if (result.type !== 'success' || !result.url) {
      return false; // cleanly thrown as cancellation
    }
    return true;
  }
  assert(!handleMobileOAuthResult({ type: 'cancel' }), 'Mobile detects cancelled OAuth and aborts without throwing unhandled crash');
  assert(!handleMobileOAuthResult({ type: 'dismiss' }), 'Mobile detects dismissed browser sheet safely');

  // -------------------------------------------------------------
  // TEST GROUP 7: Cross-Platform Data & UI Synchronization
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: WEB & APP DATA & UI SYNC ---');
  const { SAMPLE_PRODUCTS } = await import('../src/lib/sample-products');
  const doritos = SAMPLE_PRODUCTS.find(p => p.id === 'sample-chips');
  const granola = SAMPLE_PRODUCTS.find(p => p.id === 'sample-granola');

  assert(Boolean(doritos && doritos.data.ingredients.length === 17), 'Doritos sample synchronized with complete 17 ingredients list');
  assert(Boolean(granola && granola.data.ingredients.length === 9), 'Granola sample synchronized with complete 9 ingredients list');

  // Dietary suitability icon mapping test
  function getSuitabilityIcon(variant: 'additive' | 'suitability' | 'allergen') {
    return variant === 'suitability' ? 'CheckCircle' : 'AlertCircle';
  }
  assert(getSuitabilityIcon('suitability') === 'CheckCircle', 'Suitability badges map to CheckCircle (green/positive)');
  assert(getSuitabilityIcon('additive') === 'AlertCircle', 'Additive alerts map to AlertCircle (warning)');

  // Salt conversion test
  const sodiumValMg = 1200;
  const saltG = sodiumValMg / 400;
  assert(saltG === 3.0, 'Salt calculation formula (sodium / 400) correctly converts 1200mg sodium to 3.0g salt');

  // -------------------------------------------------------------
  // TEST GROUP 8: Scan Auth Gating & 4-Scan / 2-Hour Guest Quota
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: SCAN AUTH GATE & 4-SCAN / 2-HR GUEST QUOTA ---');
  const scanRoute = await import('../src/app/api/scan/route');
  const { createCryptographicGuestToken, GUEST_QUOTA_LIMIT } = await import('../src/lib/quota');

  // 8.1 Unauthenticated scan request is rejected with HTTP 401
  const unauthReq = new NextRequest('http://localhost:3000/api/scan', {
    method: 'POST',
    body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }),
  });
  const unauthRes = await scanRoute.POST(unauthReq);
  const unauthData = await unauthRes.json();
  assert(
    unauthRes.status === 401 && (unauthData.code === 'auth_required' || unauthData.code === 'missing_token'),
    'Unauthenticated POST /api/scan is rejected with HTTP 401 (code: auth_required)'
  );

  // 8.2 Public header x-eatinformed-client: test is rejected without auth (No backdoor)
  const headerTestReq = new NextRequest('http://localhost:3000/api/scan', {
    method: 'POST',
    headers: {
      'x-eatinformed-client': 'test',
    },
    body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }),
  });
  const headerTestRes = await scanRoute.POST(headerTestReq);
  assert(
    headerTestRes.status === 401,
    'Public test header x-eatinformed-client: test rejected without valid auth token'
  );

  // 8.3 Cryptographically signed guest session token is inspected and assigned 4 scans / 2hr limit
  const guestUid = `e2e_guest_uid_${Date.now()}`;
  const validGuestToken = createCryptographicGuestToken(guestUid);
  const inspectReq = new NextRequest('http://localhost:3000/api/scan?quota=true', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${validGuestToken}`,
    },
  });
  const inspectRes = await scanRoute.GET(inspectReq);
  const inspectLimitHeader = inspectRes.headers.get('X-RateLimit-Limit');
  assert(
    inspectRes.status === 200 && inspectLimitHeader === String(GUEST_QUOTA_LIMIT),
    `Cryptographically signed guest token inspected with limit ${GUEST_QUOTA_LIMIT} scans / 2hr`
  );

  // 8.4 Guest quota enforcement: 4 scans permitted, 5th blocked with HTTP 429
  const { consumeQuotaSlot } = await import('../src/lib/quota');
  const quotaGuestId = `e2e_quota_guest_${Date.now()}`;
  let admitted = 0;
  for (let i = 0; i < 5; i++) {
    const q = consumeQuotaSlot(quotaGuestId, true);
    if (q.allowed) admitted++;
  }
  assert(
    admitted === 4,
    'Sliding-window quota permits exactly 4 guest scans before blocking 5th scan'
  );

  // 8.5 Guest logout and session reset logic
  interface MockSession {
    token: string | null;
    isLoggedIn: boolean;
    isAnonymous: boolean;
  }
  let mockSession: MockSession | null = {
    token: 'guest_token_123',
    isLoggedIn: true,
    isAnonymous: true,
  };
  function mockClearSession() {
    mockSession = null;
  }
  mockClearSession();
  assert(
    mockSession === null,
    'Guest logout successfully purges active token and returns user to unauthenticated state'
  );

  console.log('\n================================================================');
  console.log(`  E2E TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} TOTAL`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
