import test from 'node:test';
import assert from 'node:assert/strict';
import { awaitScanResponse } from '../mobile/src/api/scan-request';
const pending = { response: { status: 409, data: { code: 'scan_in_progress' } } };

test('a network retry waits for the original pending scan and returns its final error', async () => {
  let calls = 0, now = 0;
  const terminal = { response: { status: 502, data: { code: 'invalid_ai_output' } } };
  await assert.rejects(awaitScanResponse(async () => {
    calls++;
    if (calls === 1) throw new Error('Network Error');
    if (calls === 2) throw pending;
    throw terminal;
  }, { now: () => now, sleep: async ms => { now += ms; } }), error => error === terminal);
  assert.equal(calls, 3);
});
test('pending operation can complete successfully without creating another operation', async () => {
  let calls = 0, now = 0;
  const result = await awaitScanResponse(async () => {
    if (++calls < 3) throw pending;
    return 'completed';
  }, { now: () => now, sleep: async ms => { now += ms; } });
  assert.equal(result, 'completed');
  assert.equal(calls, 3);
});
test('conflicting keys and authentication errors are terminal', async () => {
  for (const status of [401, 403, 409, 429]) {
    let calls = 0;
    const failure = { response: { status, data: { code: 'idempotency_conflict' } } };
    await assert.rejects(awaitScanResponse(async () => { calls++; throw failure; }), error => error === failure);
    assert.equal(calls, 1);
  }
});
test('pending polling obeys its overall deadline', async () => {
  let calls = 0, now = 0;
  await assert.rejects(awaitScanResponse(async () => { calls++; throw pending; }, {
    budgetMs: 4000, now: () => now, sleep: async ms => { now += ms; },
  }), error => error === pending);
  assert.equal(calls, 3);
  assert.equal(now, 3000);
});
