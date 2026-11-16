import test from 'node:test';
import assert from 'node:assert/strict';
import { isNavigationLink } from '../mobile/src/navigation/links';

test('auth-session callback cannot push an Auth screen into the app navigator', () => {
  for (const url of ['eatinformed://auth/callback', 'eatinformed://auth/callback#state=test&code=one-use', 'eatinformed://auth/callback?error=cancelled']) {
    assert.equal(isNavigationLink(url), false);
  }
  for (const url of ['eatinformed://home', 'eatinformed://profile', 'eatinformed://auth', 'https://eatinformed.amitdevx.tech/guide']) {
    assert.equal(isNavigationLink(url), true);
  }
});
