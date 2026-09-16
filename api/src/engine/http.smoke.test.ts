/**
 * The second check: boot the real app and call it over real HTTP.
 *
 * Written 16 September 2026, the hour the unwired-module finder first read zero.
 * A guard that reads zero is either a healthy system or a blind one, and the
 * number alone cannot tell you which. That finder asked one question: is this
 * module imported by anything? Now that the answer is yes everywhere, it can only
 * ever report a regression, never a new kind of fault.
 *
 * This asks a question it never could. It starts AppModule on a real port and
 * makes real requests, so it fails on things no import check can see:
 *
 *   - a controller written and never registered in app.module
 *   - a route path that is a typo
 *   - a guard left off an endpoint that moves money
 *   - a role check that lets the wrong person through
 *   - the app not booting at all
 *
 * No new dependency was added to test this. There is no @nestjs/testing and no
 * supertest here, and adding either to run a smoke test would put two packages in
 * the tree of a payment system for the sake of convenience. Node boots the app
 * and Node's own fetch calls it.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as jwt from 'jsonwebtoken';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-anywhere-real';
process.env.DEMO_MASTER_KEY =
  process.env.DEMO_MASTER_KEY || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

let app: any;
let base = '';

const tokenFor = (role: string) =>
  jwt.sign({ sub: 'u-' + role, role, name: role }, process.env.JWT_SECRET as string, { expiresIn: '5m' });

async function call(
  path: string,
  opts: { method?: string; role?: string; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.role) headers.Authorization = 'Bearer ' + tokenFor(opts.role);
  const res = await fetch(base + path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

before(async () => {
  app = await NestFactory.create(AppModule, { logger: false, cors: false });
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  base = url.replace('[::1]', '127.0.0.1');
});

after(async () => {
  if (app) await app.close();
});

/* ------------------------------------------------- the app boots at all */

test('THE APP BOOTS AND ANSWERS. Nothing below means anything if this fails', async () => {
  const r = await call('/engine/coverage');
  assert.equal(r.status, 200, 'the app did not answer on a public route');
});

/* ---------------------------------------------- the routes really exist */

test('every engine route is registered, so none is a controller nobody wired up', async () => {
  const routes: Array<[string, string, string]> = [
    ['GET', '/engine/coverage', 'public'],
    ['GET', '/engine/parcel/quote?kg=2&zone=1', 'customer'],
    ['GET', '/engine/parcel/ladder?zone=1', 'customer'],
    ['POST', '/engine/tracking/panels', 'customer'],
    ['POST', '/engine/handover/requirement', 'courier'],
    ['POST', '/engine/handover/code', 'courier'],
    ['POST', '/engine/liquor/handover', 'courier'],
    ['POST', '/engine/outbox/sync', 'courier'],
    ['POST', '/engine/till/state', 'ops'],
    ['POST', '/engine/board', 'ops'],
    ['POST', '/engine/account/order', 'ops'],
    ['POST', '/engine/account/cancel', 'ops'],
    ['POST', '/engine/account/statement', 'ops'],
  ];
  for (const [method, path, role] of routes) {
    const r = await call(path, {
      method,
      role: role === 'public' ? undefined : role,
      body: method === 'POST' ? {} : undefined,
    });
    assert.notEqual(r.status, 404, `${method} ${path} is not registered`);
  }
});

/* ------------------------------------------------- the guards are on */

test('AN ENDPOINT THAT MOVES MONEY CANNOT BE REACHED WITHOUT A TOKEN', async () => {
  for (const path of ['/engine/account/order', '/engine/account/cancel', '/engine/board']) {
    const r = await call(path, { method: 'POST', body: {} });
    assert.equal(r.status, 401, `${path} answered without a token`);
  }
});

test('a parcel price needs a token, because it is a customer thing and not a public one', async () => {
  const r = await call('/engine/parcel/quote?kg=2&zone=1');
  assert.equal(r.status, 401);
});

test('coverage needs no token, because it is a public claim', async () => {
  const r = await call('/engine/coverage');
  assert.equal(r.status, 200);
  assert.ok(r.body.offices > 0);
});

/* ------------------------------------------- the right person, not just any */

test('A CUSTOMER CANNOT SEE THE OPS BOARD, or move money on a company account', async () => {
  const board = await call('/engine/board', { method: 'POST', role: 'customer', body: {} });
  assert.equal(board.status, 403, 'a customer token opened the ops board');

  const order = await call('/engine/account/order', { method: 'POST', role: 'customer', body: {} });
  assert.equal(order.status, 403, 'a customer token reached a company account');
});

test('a customer cannot ask what to do at a door, and a rider cannot open the board', async () => {
  const door = await call('/engine/handover/code', { method: 'POST', role: 'customer' });
  assert.equal(door.status, 403);

  const board = await call('/engine/board', { method: 'POST', role: 'courier', body: {} });
  assert.equal(board.status, 403);
});

test('ops can reach the board, so the guard refuses the wrong person rather than everybody', async () => {
  const r = await call('/engine/board', { method: 'POST', role: 'ops', body: { live: [], done: [] } });
  assert.ok(r.status === 200 || r.status === 201, 'ops was refused its own board, status ' + r.status);
  assert.ok(typeof r.body.the_one_thing === 'string');
});

/* --------------------------------------- a rule still holds over HTTP */

test('THE RULE HOLDS OVER HTTP: a parcel zone outside the contract is refused, not priced', async () => {
  const good = await call('/engine/parcel/quote?kg=2&zone=1', { role: 'customer' });
  assert.equal(good.status, 200);

  const bad = await call('/engine/parcel/quote?kg=2&zone=gaborone', { role: 'customer' });
  assert.equal(bad.status, 400, 'an invented zone was priced');
  assert.match(String(bad.body?.message), /not in the contract/);
});

test('the credit limit refuses over HTTP as well as in the module', async () => {
  const account = {
    company: 'Broadhurst Hardware',
    active: true,
    cost_centres: [{ code: 'OPS', name: 'Operations' }],
    credit_limit: 100000,
  };
  const book: any[] = [];
  const first = await call('/engine/account/order', {
    method: 'POST', role: 'ops',
    body: { book, account, account_id: 'A1', amount_thebe: 60000, cost_centre: 'OPS', order_id: 'o1' },
  });
  assert.ok(first.status === 200 || first.status === 201, 'the first order was refused');

  // the caller holds the book, so send it back with the first order in it
  const withFirst = [first.body.order];
  const second = await call('/engine/account/order', {
    method: 'POST', role: 'ops',
    body: { book: withFirst, account, account_id: 'A1', amount_thebe: 60000, cost_centre: 'OPS', order_id: 'o2' },
  });
  assert.equal(second.status, 403, 'the limit did not hold over HTTP');
  assert.match(String(second.body?.message), /past its limit/);
});

/* ------------------------------------------ the older routes still answer */

test('the routes that existed before tonight still answer, so nothing was broken adding a module', async () => {
  const orders = await call('/orders/does-not-exist', { role: 'customer' });
  assert.notEqual(orders.status, 404, 'the orders controller stopped being registered');

  const ops = await call('/ops/state', { role: 'ops' });
  assert.notEqual(ops.status, 404, 'the ops controller stopped being registered');

  const catalog = await call('/catalog');
  assert.notEqual(catalog.status, 404, 'the catalog controller stopped being registered');
});
