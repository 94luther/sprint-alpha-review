/**
 * The seven findings an outside review raised on 16 September 2026 that were real
 * and open, each held still by a test that fails on the old code.
 *
 * The reviewer's own reproduction numbers are used as the cases on purpose: a P0
 * or P400 funding swing, two lines of 100.4 thebe showing P1.00 each against a
 * total of P2.01, a P20 item quoted without its P25 delivery. If its evidence and
 * this fix ever disagree, they disagree on the same figures and somebody can tell
 * which is wrong.
 *
 * It read the public snapshot, not the live engine, and said so. Four of its P1s
 * had already been fixed hours after that copy was taken. These seven had not.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayPayout, payoutCsv, settleOne, SettlementError, type SettleableOrder } from './settlement';
import { statement, endOfDay, CorporateError, type CorporateAccount, type CorporateOrder } from './corporate';

const order = (over: Partial<SettleableOrder> = {}): SettleableOrder => ({
  order_id: 'SPR-1',
  merchant_id: 'M1',
  merchant_name: 'Broadhurst Hardware',
  goods: 20000,
  delivery_fee: 2500,
  rail: 'cash',
  fault: 'none',
  delivered: true,
  perishable: false,
  ...over,
});

/* ---------------------------------------------------- 4. mixed rails */

test('FUNDING NO LONGER DEPENDS ON WHICH ORDER CAME FIRST', () => {
  const cash = order({ order_id: 'a', rail: 'cash' });
  const wallet = order({ order_id: 'b', rail: 'myzaka' });

  const cashFirst = dayPayout('2026-09-16', [cash, wallet], true);
  const walletFirst = dayPayout('2026-09-16', [wallet, cash], true);

  assert.equal(
    cashFirst.funded_by_sprint,
    walletFirst.funded_by_sprint,
    'the same two orders funded differently depending on their order',
  );
  assert.equal(cashFirst.funded_by_sprint, 20000, 'only the wallet order is funded from Sprint, P200');
  assert.equal(cashFirst.total, walletFirst.total);
});

test('a merchant paid two ways gets one line per way, not one line that lies', () => {
  const day = dayPayout('2026-09-16', [
    order({ order_id: 'a', rail: 'cash' }),
    order({ order_id: 'b', rail: 'myzaka' }),
  ], true);
  assert.equal(day.lines.length, 2, 'two rails collapsed into one line');
  assert.deepEqual(day.lines.map((l) => l.rail).sort(), ['cash', 'myzaka']);
});

/* ------------------------------------------ 6a. money is whole thebe */

test('a fraction of a thebe never reaches a payout', () => {
  assert.throws(() => settleOne(order({ goods: 100.4 })), /whole thebe/);
  assert.throws(() => settleOne(order({ delivery_fee: 2500.5 })), /whole thebe/);
  assert.throws(() => settleOne(order({ goods: Infinity })), /real amounts/);
  assert.throws(() => settleOne(order({ goods: NaN })), /real amounts/);
});

test('the reviewer case: two lines of 100.4 thebe are refused rather than exported as P1.00 each', () => {
  assert.throws(() => dayPayout('2026-09-16', [
    order({ order_id: 'a', merchant_id: 'M1', goods: 100.4 }),
    order({ order_id: 'b', merchant_id: 'M2', goods: 100.4 }),
  ], true), SettlementError);
});

/* -------------------------------------- 6b. the same order twice */

test('THE SAME ORDER TWICE IN A BATCH IS REFUSED, not paid twice', () => {
  const o = order();
  assert.throws(() => dayPayout('2026-09-16', [o, o], true), /twice/);
});

test('two different orders from the same merchant on the same rail still add up', () => {
  const day = dayPayout('2026-09-16', [
    order({ order_id: 'a' }),
    order({ order_id: 'b' }),
  ], true);
  assert.equal(day.total, 40000, 'two real orders should be P400');
  assert.equal(day.lines.length, 1);
});

/* ------------------------------------------- 7. the export carries the warning */

test('AN UNAPPROVED PAYOUT CANNOT BE EXPORTED FOR PAYMENT', () => {
  const day = dayPayout('2026-09-16', [order()], false);
  assert.throws(() => payoutCsv(day), /not agreed/);
});

test('a draft can be looked at, and says on its first line that it is not payable', () => {
  const day = dayPayout('2026-09-16', [order()], false);
  const csv = payoutCsv(day, true);
  assert.match(csv.split('\n')[0], /DRAFT, NOT PAYABLE/);
});

test('an approved payout exports clean, with no warning line in the way', () => {
  const csv = payoutCsv(dayPayout('2026-09-16', [order()], true));
  assert.doesNotMatch(csv.split('\n')[0], /DRAFT/);
});

test('approved and unapproved are no longer byte for byte identical', () => {
  const approved = payoutCsv(dayPayout('2026-09-16', [order()], true));
  const draft = payoutCsv(dayPayout('2026-09-16', [order()], false), true);
  assert.notEqual(approved, draft, 'the warning disappeared at the moment it mattered');
});

/* -------------------------------------- 8. the end of a statement period */

const account = {
  id: 'A1',
  company: 'Broadhurst Hardware',
  active: true,
  cost_centres: [{ code: 'OPS', name: 'Operations' }],
  credit_limit: 1000000,
  payment_terms_days: 30,
} as unknown as CorporateAccount;

const acctOrder = (id: string, at: string, amount = 2000): CorporateOrder => ({
  order_id: id, account_id: 'A1', cost_centre: 'OPS', amount,
  placed_at: at, description: 'goods',
});

test('AN ORDER AT NOON ON THE LAST DAY IS IN THAT MONTH', () => {
  const book = [acctOrder('o1', '2026-09-30T12:00:00Z')];
  const s = statement(account, book, '2026-09-01', '2026-09-30');
  assert.equal(s.lines.reduce((a, l) => a + l.total, 0), 2000, 'the last day of the month was dropped');
});

test('an order on a shared boundary belongs to exactly one period, never both', () => {
  const book = [acctOrder('o1', '2026-10-01T00:00:00Z')];
  const september = statement(account, book, '2026-09-01', '2026-09-30');
  const october = statement(account, book, '2026-10-01', '2026-10-31');
  const inSep = september.lines.reduce((a, l) => a + l.total, 0);
  const inOct = october.lines.reduce((a, l) => a + l.total, 0);
  assert.equal(inSep + inOct, 2000, 'an order was counted in both months or in neither');
  assert.equal(inSep, 0);
});

test('the last millisecond of the month is covered, not left in a gap', () => {
  const book = [acctOrder('o1', '2026-09-30T23:59:59.999Z')];
  const s = statement(account, book, '2026-09-01', '2026-09-30');
  assert.equal(s.lines.reduce((a, l) => a + l.total, 0), 2000);
});

test('a date that is not a date is refused rather than silently treated as nothing', () => {
  assert.throws(() => endOfDay('not a date'), CorporateError);
});
