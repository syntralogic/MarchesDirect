import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideInvitation } from './invitation';

test('invitation: once per visit, never after a choice, postponed while typing', () => {
  assert.equal(decideInvitation({ alreadyShown: false, acted: false, fieldActive: false }), 'show');
  assert.equal(decideInvitation({ alreadyShown: true, acted: false, fieldActive: false }), 'never');
  assert.equal(decideInvitation({ alreadyShown: false, acted: true, fieldActive: false }), 'never');
  assert.equal(decideInvitation({ alreadyShown: false, acted: false, fieldActive: true }), 'postpone');
  assert.equal(decideInvitation({ alreadyShown: false, acted: true, fieldActive: true }), 'never');
});
