/**
 * The test that was missing under everything: place an order THROUGH THE SERVICE
 * and check that a rule held. Every module test proves a function; this proves
 * the app calls it. Written 16 September 2026, the night the finder showed ten
 * tested modules that nothing imported.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DEMO_MASTER_KEY = process.env.DEMO_MASTER_KEY || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-anywhere-real';

import { OrdersService } from './orders.service';

function merchant(type: string) {
  return {
    id: 'M1', name: 'Broadhurst Hardware', type, age_restricted: false,
    heroImage: '', rating: 4.5, ratingCount: 10, etaMinLow: 20, etaMinHigh: 40,
    deliveryFee: 25, promo: null, status: 'open',
    items: [{ id: 'i1', name: 'LED bulbs, 4 pack', price_bwp: 99, photo: '', description: '' }],
  };
}

function build(type = 'hardware') {
  const orders: any[] = [];
  const idem: { key: string; order_id: string }[] = [];
  let flushed = 0;
  const ordersRepo = {
    findByIdempotency: (u: string, k: string) => {
      const r = idem.find((x) => x.key === u + ':' + k);
      return r ? orders.find((o) => o.id === r.order_id) : undefined;
    },
    create: (o: any) => { orders.push(o); },
    saveIdempotency: (u: string, k: string, id: string) => { idem.push({ key: u + ':' + k, order_id: id }); },
    findById: (id: string) => orders.find((o) => o.id === id),
  };
  const merchantsRepo = { findById: (id: string) => (id === 'M1' ? merchant(type) : undefined) };
  const couriersRepo = { findById: () => undefined };
  const outboxRepo = { append: () => {} };
  const store = { flush: () => { flushed += 1; }, state: {} };
  const svc = new OrdersService(ordersRepo as any, merchantsRepo as any, couriersRepo as any, outboxRepo as any, store as any);
  return { svc, orders, flushedCount: () => flushed };
}

const dto = (over: Record<string, unknown> = {}) => ({
  merchant_id: 'M1',
  items: [{ item_id: 'i1', qty: 1 }],
  payment_method: 'cash',
  address: 'Plot 22418, Block 9, blue gate',
  ...over,
});

test('THE APP OBEYS THE RULE: a pharmacy cannot take an order through the API', () => {
  const { svc, orders } = build('pharmacy');
  assert.throws(() => svc.create('u1', dto() as any, 'key-1'), /cannot take orders yet/);
  assert.equal(orders.length, 0, 'an order was stored for a shop that is not open');
});

test('a rail that is not switched on refuses by name, the same as the screen', () => {
  const { svc, orders } = build();
  assert.throws(() => svc.create('u1', dto({ payment_method: 'orange_money' }) as any, 'key-1'), /not switched on yet/);
  assert.equal(orders.length, 0);
});

test('cash above the P1000 cap is refused before a rider is put at risk', () => {
  const { svc, orders } = build();
  // 11 x P99 = P1089
  assert.throws(() => svc.create('u1', dto({ items: [{ item_id: 'i1', qty: 11 }] }) as any, 'key-1'));
  assert.equal(orders.length, 0);
});

test('a quantity that is not a whole number places nothing', () => {
  const { svc, orders } = build();
  assert.throws(() => svc.create('u1', dto({ items: [{ item_id: 'i1', qty: 2.5 }] }) as any, 'key-1'), /whole number/);
  assert.throws(() => svc.create('u1', dto({ items: [{ item_id: 'i1', qty: Infinity }] }) as any, 'key-2'), /whole number/);
  assert.equal(orders.length, 0);
});

test('a good order is written to disk before the customer is told, and a retry is the same order', () => {
  const { svc, orders, flushedCount } = build();
  const a = svc.create('u1', dto() as any, 'key-1');
  assert.equal(flushedCount(), 1, 'the order was returned before it reached disk');
  const b = svc.create('u1', dto() as any, 'key-1');
  assert.equal(a.id, b.id, 'a retried key placed a second order');
  assert.equal(orders.length, 1);
  assert.equal(flushedCount(), 1, 'a retry should not write again');
});
