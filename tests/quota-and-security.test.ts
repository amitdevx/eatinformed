import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCryptographicGuestToken,
  verifyGuestToken,
  inspectQuota,
  consumeQuotaSlot,
  refundQuotaSlot,
  GUEST_QUOTA_LIMIT,
  GUEST_WINDOW_MS,
} from '../src/lib/quota';

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

test('Quota: 4 scans per 2-hour rolling sliding window enforcement', () => {
  const testGuestId = `guest_quota_test_${Date.now()}`;

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
