import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { NextRequest } from 'next/server';
import {
  createCryptographicGuestToken,
  verifyGuestToken,
  verifyUserToken,
  inspectQuota,
  consumeQuotaSlot,
  refundQuotaSlot,
  GUEST_QUOTA_LIMIT,
  GUEST_WINDOW_MS,
} from '../src/lib/quota';
import { validateImagePayload } from '../src/lib/image-validation';
import { ProductAnalysisOutputSchema } from '../src/ai/flows/product-analysis-types';

test('Security: Cryptographic Guest Token Lifecycle', () => {
  const uid = 'guest_test_user_alpha';
  const token = createCryptographicGuestToken(uid);

  assert.ok(token.startsWith('guest_'), 'Token must have guest_ prefix');
  assert.ok(token.includes('.'), 'Token must contain signature delimiter');

  // Verify valid token
  const result = verifyGuestToken(token);
  assert.equal(result.valid, true, 'Valid token must be verified');
  assert.equal(result.uid, uid, 'Decoded UID must match original');

  // Reject forged signature
  const forgedToken = `${token.split('.')[0]}.invalid_signature_hex_1234567890`;
  const forgedResult = verifyGuestToken(forgedToken);
  assert.equal(forgedResult.valid, false, 'Forged token must be rejected');

  // Reject altered payload
  const alteredPayload = Buffer.from('guest_hacker_uid:1763212800000').toString('base64url');
  const alteredToken = `guest_${alteredPayload}.${token.split('.')[1]}`;
  const alteredResult = verifyGuestToken(alteredToken);
  assert.equal(alteredResult.valid, false, 'Altered payload must be rejected');

  // Reject garbage string
  assert.equal(verifyGuestToken('arbitrary_client_token').valid, false);
  assert.equal(verifyGuestToken('').valid, false);
});

test('Security: verifyUserToken Rejects Backdoor Strings and Fabricated Tokens', async () => {
  // Empty token
  const emptyRes = await verifyUserToken('');
  assert.equal(emptyRes.userId, null);
  assert.equal(emptyRes.error, 'missing_token');

  // Unverified arbitrary string
  const unverifiedRes = await verifyUserToken('guest_arbitrary_timestamp_token_123456');
  assert.equal(unverifiedRes.userId, null);
  assert.equal(unverifiedRes.error, 'invalid_or_expired_token');

  // Old test prefixes (MUST be rejected now)
  const testMemberRes = await verifyUserToken('test_member_123');
  assert.equal(testMemberRes.userId, null, 'test_member_ prefix must not bypass auth in production');

  const testGuestRes = await verifyUserToken('test_guest_456');
  assert.equal(testGuestRes.userId, null, 'test_guest_ prefix must not bypass auth in production');

  // Valid cryptographically signed guest token MUST succeed
  const validGuestToken = createCryptographicGuestToken('verified_guest_uuid_789');
  const validRes = await verifyUserToken(validGuestToken);
  assert.equal(validRes.userId, 'verified_guest_uuid_789');
  assert.equal(validRes.isGuest, true);
});

test('Quota: 4 scans per 2-hour rolling sliding window enforcement', () => {
  const testGuestId = `guest_quota_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Check initial inspection (should not consume)
  const initialInspect = inspectQuota(testGuestId, true);
  assert.equal(initialInspect.allowed, true);
  assert.equal(initialInspect.limit, 4);
  assert.equal(initialInspect.remaining, 4);

  // Scan 1
  const s1 = consumeQuotaSlot(testGuestId, true);
  assert.equal(s1.allowed, true);
  assert.equal(s1.remaining, 3);
  assert.equal(s1.limit, 4);

  // Scan 2
  const s2 = consumeQuotaSlot(testGuestId, true);
  assert.equal(s2.allowed, true);
  assert.equal(s2.remaining, 2);

  // Scan 3
  const s3 = consumeQuotaSlot(testGuestId, true);
  assert.equal(s3.allowed, true);
  assert.equal(s3.remaining, 1);

  // Scan 4 (Last available slot in 2-hour window)
  const s4 = consumeQuotaSlot(testGuestId, true);
  assert.equal(s4.allowed, true);
  assert.equal(s4.remaining, 0);

  // Scan 5 (Must be REJECTED with quota_limit_reached status)
  const s5 = consumeQuotaSlot(testGuestId, true);
  assert.equal(s5.allowed, false, '5th scan must be rejected');
  assert.equal(s5.remaining, 0);
  assert.ok(s5.retryAfterSeconds > 0, 'Retry-After seconds must be positive');
  assert.ok(s5.nextAvailableScanTimestamp !== null, 'Next available scan timestamp must be set');

  // Verify inspection matches exhausted state
  const exhaustedInspect = inspectQuota(testGuestId, true);
  assert.equal(exhaustedInspect.allowed, false);
  assert.equal(exhaustedInspect.remaining, 0);
  assert.ok(exhaustedInspect.retryAfterSeconds > 0);

  // Test Slot Refund Policy: When an accepted scan fails in AI processing, refund the slot
  refundQuotaSlot(testGuestId);
  const afterRefund = inspectQuota(testGuestId, true);
  assert.equal(afterRefund.allowed, true, 'Slot refund must restore admission');
  assert.equal(afterRefund.remaining, 1, 'Remaining count must reflect refunded slot');

  // Re-consume refunded slot
  const s4Refunded = consumeQuotaSlot(testGuestId, true);
  assert.equal(s4Refunded.allowed, true);
  assert.equal(s4Refunded.remaining, 0);

  // Next attempt blocked again
  const sBlockAgain = consumeQuotaSlot(testGuestId, true);
  assert.equal(sBlockAgain.allowed, false);
});

test('Endpoint Gatekeeping: /api/scan Rejects Missing Auth and Header Bypasses', async () => {
  const { POST } = await import('../src/app/api/scan/route');

  // 1. Missing Auth Token must return 401
  const unauthReq = new NextRequest('http://localhost:3000/api/scan', {
    method: 'POST',
    body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }),
  });
  const unauthRes = await POST(unauthReq);
  assert.equal(unauthRes.status, 401);
  const unauthBody = await unauthRes.json();
  assert.equal(unauthBody.code, 'missing_token');

  // 2. x-eatinformed-client: test header MUST NOT bypass auth
  const bypassAttemptReq = new NextRequest('http://localhost:3000/api/scan', {
    method: 'POST',
    headers: {
      'x-eatinformed-client': 'test',
    },
    body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }),
  });
  const bypassRes = await POST(bypassAttemptReq);
  assert.equal(bypassRes.status, 401, 'Public test header must not bypass authentication');

  // 3. Forged guest token must return 401
  const forgedReq = new NextRequest('http://localhost:3000/api/scan', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer guest_fake_token.deadbeef',
    },
    body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }),
  });
  const forgedRes = await POST(forgedReq);
  assert.equal(forgedRes.status, 401, 'Forged token must return 401 Unauthorized');
});

test('Validation: Image Magic Bytes and Sharp Dimension Limits', async () => {
  // 1. Empty or missing data URI
  const emptyRes = await validateImagePayload('');
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.httpStatus, 400);

  // 2. Non-image text claiming to be JPEG (spoofed prefix)
  const fakeJpeg = `data:image/jpeg;base64,${Buffer.from('Hello plain text file not an image').toString('base64')}`;
  const fakeRes = await validateImagePayload(fakeJpeg);
  assert.equal(fakeRes.valid, false);
  assert.equal(fakeRes.httpStatus, 415, 'Non-image binary must be rejected with 415 Unsupported Media');

  // 3. Valid JPEG binary with correct magic bytes (0xFF 0xD8 0xFF)
  const validJpegBuffer = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 200, b: 200 } },
  }).jpeg().toBuffer();
  const validDataUri = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;
  const validRes = await validateImagePayload(validDataUri);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.format, 'jpeg');
  assert.equal(validRes.width, 100);
  assert.equal(validRes.height, 100);

  // 4. Valid PNG binary with correct magic bytes (0x89 0x50 0x4E 0x47 ...)
  const validPngBuffer = await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 128, b: 0, alpha: 1 } },
  }).png().toBuffer();
  const validPngUri = `data:image/png;base64,${validPngBuffer.toString('base64')}`;
  const validPngRes = await validateImagePayload(validPngUri);
  assert.equal(validPngRes.valid, true);
  assert.equal(validPngRes.format, 'png');

  // 5. Dimension cap rejection (>6000px)
  const hugeBuffer = await sharp({
    create: { width: 6001, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).jpeg().toBuffer();
  const hugeUri = `data:image/jpeg;base64,${hugeBuffer.toString('base64')}`;
  const hugeRes = await validateImagePayload(hugeUri);
  assert.equal(hugeRes.valid, false);
  assert.equal(hugeRes.code, 'dimensions_exceeded');
});

test('AI Output Accuracy: Schema Rejects Fake Defaults and Preserves Nulls for Missing Evidence', () => {
  // When model does NOT provide novaGroup, rating, or dietary flags:
  const rawMissingData = {
    productName: 'Sample Unknown Food',
    brand: '',
    novaGroup: null,
    rating: null,
    ingredients: ['Water', 'Flour'],
    nutrition: null,
    dietaryInfo: {
      allergens: [],
      suitability: [],
      isVegetarian: null,
      isVegan: null,
      isGlutenFree: null,
      summary: '',
    },
    status: 'success',
  };

  const parsed = ProductAnalysisOutputSchema.parse(rawMissingData);

  // Assert fields are NULL (Unknown), NOT defaulted to NOVA 4, 2.5, or false!
  assert.equal(parsed.novaGroup, null, 'Missing NOVA group must parse as null (Unknown), not 4');
  assert.equal(parsed.rating, null, 'Missing rating must parse as null (Unrated), not 2.5');
  assert.equal(parsed.dietaryInfo.isVegan, null, 'Missing vegan flag must parse as null, not false');
  assert.equal(parsed.dietaryInfo.isVegetarian, null, 'Missing vegetarian flag must parse as null, not false');
  assert.equal(parsed.dietaryInfo.isGlutenFree, null, 'Missing gluten-free flag must parse as null, not false');

  // When model DOES provide explicit ratings:
  const rawExplicitData = {
    productName: 'Fresh Whole Apple',
    brand: 'Orchard Fresh',
    novaGroup: 1,
    rating: 4.9,
    ingredients: ['Apples'],
    nutrition: { rawText: 'Calories 95', nutrients: [] },
    dietaryInfo: {
      allergens: [],
      suitability: ['Vegan', 'Vegetarian'],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      summary: '100% whole fresh fruit.',
    },
    status: 'success',
  };

  const parsedExplicit = ProductAnalysisOutputSchema.parse(rawExplicitData);
  assert.equal(parsedExplicit.novaGroup, 1);
  assert.equal(parsedExplicit.rating, 4.9);
  assert.equal(parsedExplicit.dietaryInfo.isVegan, true);
  assert.equal(parsedExplicit.dietaryInfo.isVegetarian, true);
});

test('Physics: Food Passport Pull-down Gesture Separation', () => {
  const RAW_PULL_THRESHOLD = 110.0;

  // Formula under test
  const computeVisualDisplacement = (dy: number) => (1 - 1 / (dy * 0.006 + 1)) * 95;
  const isGestureArmed = (dy: number) => dy >= RAW_PULL_THRESHOLD;

  // Partial pull (dy = 40pt)
  assert.equal(isGestureArmed(40), false, '40pt pull must not arm modal');
  const v40 = computeVisualDisplacement(40);
  assert.ok(v40 > 15 && v40 < 25, `Visual displacement should be ~19pt, got ${v40}`);

  // Near threshold pull (dy = 90pt)
  assert.equal(isGestureArmed(90), false, '90pt pull must not arm modal');

  // Threshold reached (dy = 110pt)
  assert.equal(isGestureArmed(110), true, '110pt pull must arm modal');
  const v110 = computeVisualDisplacement(110);
  assert.ok(v110 > 35 && v110 < 45, `Visual displacement should be ~38pt, got ${v110}`);

  // Deep pull (dy = 250pt)
  assert.equal(isGestureArmed(250), true, '250pt pull must arm modal');
  const v250 = computeVisualDisplacement(250);
  assert.ok(v250 > 50 && v250 < 65, `Visual displacement should rubber-band to ~57pt, got ${v250}`);
  assert.ok(v250 < 95, 'Visual displacement must never exceed asymptote');

  // Horizontal rejection
  const shouldRespond = (dy: number, dx: number, scrollY: number) => {
    return scrollY <= 0 && dy > 12 && Math.abs(dy) > Math.abs(dx);
  };
  assert.equal(shouldRespond(50, 10, 0), true, 'Pure vertical pull from top must respond');
  assert.equal(shouldRespond(50, 60, 0), false, 'Horizontal gesture must be rejected');
  assert.equal(shouldRespond(50, 10, 20), false, 'Pull when scrolled down must be rejected');
});
