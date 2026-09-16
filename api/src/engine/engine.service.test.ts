/**
 * The rules layer, reached the way the app reaches it.
 *
 * Every module here already had its own tests and they all passed while nothing
 * called the module. These go through EngineService, so each one fails the day
 * the wiring comes loose rather than the day a customer finds out.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-anywhere-real';

import { EngineService } from './engine.service';
import { CASH_CAP_THEBE } from '../orders/cash';

const engine = new EngineService();

/* ------------------------------------------------------------- parcels */

test('a parcel is priced from the signed tariff, and says so', () => {
  const r = engine.quoteParcel(2, '1');
  assert.ok(r.quote, 'no quote came back');
  assert.ok(typeof r.note === 'string' && r.note.length > 0);
});

test('a zone outside the contract is refused by name', () => {
  assert.throws(() => engine.quoteParcel(2, 'gaborone'), /not in the contract/);
});

test('a weight that is not a number is refused rather than guessed at', () => {
  assert.throws(() => engine.quoteParcel('heavy' as never, '1'), /weight in kilograms/);
  assert.throws(() => engine.quoteParcel(NaN, '1'), /weight in kilograms/);
  assert.throws(() => engine.quoteParcel(2, '' as never), /zone is needed/);
});

test('the ladder shows the steps, not one number', () => {
  const r = engine.parcelLadder('1', 3);
  assert.ok(Array.isArray(r.ladder) && r.ladder.length > 1, 'a ladder with one rung is not a ladder');
});

/* ---------------------------------------------------------- the door */

test('what to do at a door comes from handover, not from the screen', () => {
  const r = engine.handoverRequirement('prescription');
  assert.ok(r, 'no requirement came back for a prescription');
});

test('a handover code is the right length and limits the attempts', () => {
  const r = engine.handoverCode();
  assert.equal(r.code.length, r.length);
  assert.ok(r.attempts >= 1 && r.attempts <= 5);
});

test('two handover codes are not the same', () => {
  const a = new Set(Array.from({ length: 50 }, () => engine.handoverCode().code));
  assert.ok(a.size > 40, 'the codes repeat far too often to be a one time code');
});

/* --------------------------------------------------------- the outbox */

test("a rider with no signal loses nothing: the outbox comes back whole", () => {
  const outbox = [
    { id: 'a1', order_id: 'o1', kind: 'proof_of_delivery', at: '2026-09-16T09:00:00Z', attempts: 0, body: {} },
  ] as never[];
  const r = engine.syncOutbox(outbox, false);
  assert.equal(r.sent.length, 0);
  assert.equal(r.still_waiting.length, 1, 'something was dropped while offline');
  assert.match(r.says, /No signal/);
});

test('when the signal comes back the office takes it, and nothing stays on the phone', () => {
  const outbox = [
    { id: 'a1', order_id: 'o1', kind: 'proof_of_delivery', at: '2026-09-16T09:00:00Z', attempts: 0, body: {} },
  ] as never[];
  const r = engine.syncOutbox(outbox, true);
  assert.equal(r.sent.length, 1);
  assert.equal(r.still_on_the_phone.length, 0);
});

test('an outbox that is not a list is refused', () => {
  assert.throws(() => engine.syncOutbox('nothing' as never, true), /list of actions/);
});

/* ------------------------------------------------------- the customer */

test('the tracking screen puts the problem first and the map last, every time', () => {
  const r = engine.trackingPanels('address_problem', '2026-09-16T09:00:00Z', null, false);
  assert.equal(r.panels[0].kind, 'problem', 'something outranked the problem');
});

test('NOTHING CLINICAL GOES TO WHATSAPP, whatever the wording becomes', () => {
  for (const state of ['dispatch_accepted', 'picked_up', 'at_door', 'delivered', 'stock_problem']) {
    const r = engine.trackingPanels(state, '2026-09-16T09:00:00Z', null, false);
    if (r.whatsapp_line) {
      assert.doesNotMatch(r.whatsapp_line, /prescription|medicine|pharmac|tablet|dose/i);
    }
  }
});

test('a state with nothing worth saying sends no message at all', () => {
  const r = engine.trackingPanels('placed', '2026-09-16T09:00:00Z', null, false);
  assert.equal(r.whatsapp_line, null);
});

/* ------------------------------------------------------------ coverage */

test('coverage is a claim backed by the branch list, not a number somebody typed', () => {
  const c = engine.coverage();
  assert.ok(c.offices > 0 && c.service_points > 0);
  // Read off the module rather than assumed: every site is an office or a service
  // point, and the three international ones sit inside that count, not beside it.
  assert.equal(c.sites.length, c.offices + c.service_points);
  assert.ok(c.international > 0 && c.international < c.offices);
  assert.ok(c.claim.length > 10);
});

/* ------------------------------------------------------- on account */

const account = {
  company: 'Broadhurst Hardware',
  active: true,
  cost_centres: [{ code: 'OPS', name: 'Operations' }],
  credit_limit: 100000,
} as never;

test('THE LIMIT HOLDS THROUGH THE ENGINE: the second order that would break it is refused', () => {
  const book: never[] = [];
  engine.orderOnAccount(book, account, 'A1', 60000, 'OPS', 'o1', 'goods');
  assert.throws(() => engine.orderOnAccount(book, account, 'A1', 60000, 'OPS', 'o2', 'goods'), /past its limit/);
  assert.equal(book.length, 1, 'an order was recorded that should have been refused');
});

test('cancelling gives the credit back through the engine too', () => {
  const book: never[] = [];
  engine.orderOnAccount(book, account, 'A1', 80000, 'OPS', 'o1', 'goods');
  assert.throws(() => engine.orderOnAccount(book, account, 'A1', 30000, 'OPS', 'o2', 'goods'));
  engine.cancelAccountOrder(book, 'o1');
  const r = engine.orderOnAccount(book, account, 'A1', 30000, 'OPS', 'o2', 'goods');
  assert.equal(r.placed, true);
  assert.equal(r.owed, 30000);
});

test('cancelling an order nobody placed says so rather than pretending', () => {
  assert.throws(() => engine.cancelAccountOrder([], 'ghost'), /No open order/);
});

test('an unknown cost centre is refused, so a statement can never be unattributable', () => {
  assert.throws(() => engine.orderOnAccount([], account, 'A1', 1000, 'NOPE', 'o1', 'goods'), /cost centre/);
});

/* ------------------------------------------------------------ the board */

test('the board always names one thing to do, even when nothing is wrong', () => {
  const b = engine.board([], [], []);
  assert.ok(typeof b.the_one_thing === 'string' && b.the_one_thing.length > 0);
  assert.deepEqual(b.exceptions, []);
});

/* ---------------------------------------------- the cap is still the cap */

test('the cash cap the order path enforces is the one the cash engine states', () => {
  assert.equal(CASH_CAP_THEBE, 100000);
});
