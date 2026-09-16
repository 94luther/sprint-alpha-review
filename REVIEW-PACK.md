# Sprint delivery engine, review pack

A customer facing delivery platform for Gaborone, Botswana. One app, many kinds of
shop, the way Checkers Sixty60 works: a shop has a KIND, and each kind carries its
own rules. A pharmacy needs a pharmacist, a bottle store needs a licence and
trading hours, a pet shop needs neither.

Written in TypeScript on NestJS. 271 tests passing, tsc clean.
Public copy: https://github.com/94luther/sprint-alpha-review

## What I want from you

Attack it. I am not looking for encouragement, I am looking for what is wrong.
In order of what would cost me most:

1. **Money.** Can any path take a payment twice, take the wrong amount, pay a
   merchant what they are not owed, or lose a thebe to rounding? Money is whole
   integers everywhere on purpose. Tell me where that breaks.
2. **The two money models.** settlement.ts pays a merchant 100 percent of the
   goods and gives the platform only the delivery fee. A separate ledger splits
   the same order 75 / 18 / 7. They disagree by a quarter of every basket. Only
   the first pays anybody today. Which should win, and what breaks either way?
3. **The regulator gate.** Pharmacy is blocked in code until the medicines
   regulator answers in writing. Can that block be got around by seed data, a
   caller, or a screen? One test says it cannot. Is the test wrong?
4. **The cash rules.** Botswana's largest note is P200 and there is a P1000 cap
   for the rider's safety. Until yesterday a single note tender capped every
   order at P200 and nobody noticed for weeks, because thirteen tests passed over
   it. What else is like that in here?
5. **Anything a test is defending that should not exist.** Two tests had to change
   yesterday because they encoded a simplification as a fact.

Do not tell me the code is clean. Tell me the failure, the input that causes it,
and what it costs.

## Context that is not in the code

- No merchant has signed anything. Every shop name and price is invented.
- No payment rail is switched on. Cash and on account are the only live ones, and
  every other rail refuses by name rather than pretending.
- This is a personal project, not a company system. There is no team.


---

## api/src/catalog/verticals.ts

_Shop kinds and their rules. Pharmacy is blocked in code until the regulator answers._

```typescript
/**
 * Verticals: one app, many kinds of shop.
 *
 * The Sixty60 move, which Luther brought back on 15 September 2026: they did not
 * build seven apps. They built one and taught it that a shop has a KIND, and that
 * each kind carries its own rules. A pharmacy needs a pharmacist. A bottle store
 * needs a licence and trading hours. A pet shop needs neither.
 *
 * The rules are written here, in one place, rather than scattered through screens,
 * because a screen can be redesigned by anybody and a rule must not be. Two of them
 * are law, not preference:
 *
 *   - PHARMACY IS BLOCKED IN CODE. Brick 8 is still open: BoMRA has not answered in
 *     writing whether a licensed courier may carry a sealed, pharmacist dispensed
 *     prescription, and nothing public was found on whether they licence online
 *     pharmacy at all. Until that letter exists this vertical cannot be listed, and
 *     removing the block requires editing this file and saying why in the commit.
 *   - LIQUOR DEFERS TO THE EXISTING ENGINE. orders/liquor.ts already holds the
 *     licence, the trading hours and a sixty day expiry warning. Nothing here
 *     re-implements any of that; this file only says that liquor HAS those gates.
 *
 * Adding a shop type is now a row in VERTICALS, not a new codebase.
 */

export type Vertical =
  | 'food'
  | 'grocery'
  | 'liquor'
  | 'pharmacy'
  | 'pet'
  | 'hardware'
  | 'baby'
  | 'parcel';

export interface VerticalRules {
  /** what a customer sees above the row of shops */
  label: string;
  /** where the row sits on the home page, lowest first */
  order: number;
  /** the rider checks identity at the door */
  ageRestricted: boolean;
  /** the merchant must have a licence on file before it may be listed */
  licenceRequired: boolean;
  /** handover only inside the merchant's licensed hours, judged on arrival */
  tradingHours: boolean;
  /** the item must be dispensed and sealed by a pharmacist before collection */
  prescription: boolean;
  /** a cold box is required where the item is flagged */
  coldChain: boolean;
  /**
   * A named external thing that must exist before this vertical may go live at
   * all. Null means nothing outside this building is in the way.
   */
  blockedBy: string | null;
}

export const VERTICALS: Record<Vertical, VerticalRules> = {
  food: {
    label: 'Restaurants',
    order: 1,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: false,
    blockedBy: null,
  },
  grocery: {
    label: 'Groceries',
    order: 2,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: true, // frozen and chilled baskets travel in a cold box
    blockedBy: null,
  },
  pet: {
    label: 'Pet and vet',
    order: 3,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: false,
    blockedBy: null,
  },
  hardware: {
    label: 'Hardware and home',
    order: 4,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: false,
    blockedBy: null,
  },
  baby: {
    label: 'Baby and kids',
    order: 5,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: false,
    blockedBy: null,
  },
  parcel: {
    label: 'Send a parcel',
    order: 6,
    ageRestricted: false,
    licenceRequired: false,
    tradingHours: false,
    prescription: false,
    coldChain: false,
    blockedBy: null,
  },
  liquor: {
    label: 'Liquor',
    order: 7,
    ageRestricted: true,
    licenceRequired: true,
    tradingHours: true,
    prescription: false,
    coldChain: false,
    blockedBy: null, // the gates are built; a merchant licence is a merchant problem
  },
  pharmacy: {
    label: 'Pharmacy',
    order: 8,
    ageRestricted: true,
    licenceRequired: true,
    tradingHours: false,
    prescription: true,
    coldChain: true,
    blockedBy:
      "BoMRA's written answer on carrying a sealed, pharmacist dispensed prescription (brick 8)",
  },
};

/** Every vertical, in the order the home page draws them. */
export function allVerticals(): Vertical[] {
  return (Object.keys(VERTICALS) as Vertical[]).sort(
    (a, b) => VERTICALS[a].order - VERTICALS[b].order,
  );
}

export function isVertical(v: string): v is Vertical {
  return Object.prototype.hasOwnProperty.call(VERTICALS, v);
}

export function rulesFor(v: Vertical): VerticalRules {
  return VERTICALS[v];
}

/** The gates a rider or a screen must honour for this kind of shop. */
export function gatesFor(v: Vertical): string[] {
  const r = VERTICALS[v];
  const gates: string[] = [];
  if (r.ageRestricted) gates.push('identity checked at the door');
  if (r.licenceRequired) gates.push('merchant licence on file');
  if (r.tradingHours) gates.push('handover inside licensed hours');
  if (r.prescription) gates.push('pharmacist dispensed and sealed');
  if (r.coldChain) gates.push('cold box where flagged');
  return gates;
}

export interface ListingVerdict {
  listable: boolean;
  reason: string | null;
}

/**
 * May a shop of this kind appear in the app at all?
 *
 * This answers the question ABOUT THE VERTICAL, not about one merchant's paperwork.
 * A merchant missing its own liquor licence is caught later by orders/liquor.ts at
 * handover, which is where it belongs, because a licence can lapse between the
 * listing and the door.
 */
export function mayList(v: Vertical): ListingVerdict {
  const r = VERTICALS[v];
  if (r.blockedBy) return { listable: false, reason: r.blockedBy };
  return { listable: true, reason: null };
}

export interface MerchantLike {
  id: string;
  type: string;
  [k: string]: unknown;
}

export interface VerticalSection<T extends MerchantLike> {
  vertical: Vertical;
  label: string;
  gates: string[];
  merchants: T[];
}

/**
 * Group merchants into the rows the home page draws.
 *
 * Empty rows are dropped, so a vertical with no signed merchant never shows the
 * customer an empty shelf. Blocked verticals are dropped even when a merchant
 * exists, which is the point: seed data must never be able to put a pharmacy in
 * front of a customer before BoMRA has answered.
 *
 * A merchant whose type is not a known vertical is returned in `unplaced` rather
 * than silently dropped, because a shop that exists and is invisible is the worst
 * of the three outcomes and somebody has to see it.
 */
export function groupByVertical<T extends MerchantLike>(
  merchants: T[],
): { sections: VerticalSection<T>[]; unplaced: T[]; blocked: Vertical[] } {
  const unplaced: T[] = [];
  const bucket = new Map<Vertical, T[]>();

  for (const m of merchants) {
    if (!isVertical(m.type)) {
      unplaced.push(m);
      continue;
    }
    const list = bucket.get(m.type) ?? [];
    list.push(m);
    bucket.set(m.type, list);
  }

  const sections: VerticalSection<T>[] = [];
  const blocked: Vertical[] = [];

  for (const v of allVerticals()) {
    const found = bucket.get(v);
    if (!found || found.length === 0) continue;
    if (!mayList(v).listable) {
      blocked.push(v);
      continue;
    }
    sections.push({
      vertical: v,
      label: VERTICALS[v].label,
      gates: gatesFor(v),
      merchants: found,
    });
  }

  return { sections, unplaced, blocked };
}
```

---

## api/src/orders/payments.ts

_Taking money and never taking it twice._

```typescript
/**
 * Payments: taking the money, and never taking it twice.
 *
 * Phase 2 of the plan Luther approved on 15 September 2026. What is deliberately
 * NOT here: a working connection to Orange Money. That needs merchant credentials
 * and a merchant rate, and the emails asking all three networks for both are
 * queued for Monday morning. Writing a connector that pretends to succeed without
 * them would be the worst thing in this file, so the adapter REFUSES instead: an
 * unconfigured rail throws, loudly, by name. A payment system that silently does
 * nothing is how money goes missing.
 *
 * What IS here, and is real and tested:
 *
 *   - Idempotency. A customer with a bad signal taps Pay three times. Three taps,
 *     one charge. This is the single most expensive bug in any payment system and
 *     it is solved by the key, not by hoping the button disables in time.
 *   - A state machine that cannot go backwards. Captured money cannot become
 *     pending again; a failed payment cannot be captured; a refund cannot exceed
 *     what was taken.
 *   - The cost of each rail, so the merchant's net is computed from what actually
 *     arrives rather than from what the customer typed. Settlement already exists
 *     in settlement.ts and consumes this.
 *   - Which rails can refund at all. Cash cannot be refunded through a phone, and
 *     pretending otherwise puts a rider at somebody's door with an argument.
 *
 * Money is in thebe, as whole integers, exactly as cash.ts has it. Never floats.
 * Two pula is 200, and 0.1 + 0.2 is a bug waiting in a currency you can spend.
 */

import type { Rail } from './settlement';

export const THEBE = 100;

export class PaymentError extends Error {}

/** A rail cannot be used until this is false. */
export interface RailSpec {
  label: string;
  /** the customer does something on their own phone before it completes */
  needsCustomerAction: boolean;
  /** money can be sent back down this rail by software */
  refundable: boolean;
  /** what the rail takes, in basis points of the amount (100 bp = 1 percent) */
  costBp: number;
  /** a flat charge per transaction, in thebe, on top of costBp */
  costFlatThebe: number;
  /** below this the rail is not worth offering */
  minThebe: number;
  /** above this the rail refuses or the risk is not ours to take */
  maxThebe: number;
  /**
   * The named thing that must exist before this rail may be switched on. Null
   * means it works today. Every non-null value here is somebody's reply, not a
   * piece of code.
   */
  blockedBy: string | null;
}

/**
 * The costs below are PLACEHOLDERS and are marked as such by blockedBy. Not one
 * of them is a rate anybody has quoted Sprint. They exist so the maths can be
 * tested; they must be replaced with the real merchant rate the day it arrives,
 * and the test named 'no rail claims a real rate' fails if that is forgotten.
 */
export const RAILS: Record<Rail, RailSpec> = {
  cash: {
    label: 'Cash at the door',
    needsCustomerAction: false,
    refundable: false, // a rider cannot un-take cash; this goes through settlement
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 0,
    maxThebe: 100000, // P1000, the cap cash.ts already enforces
    blockedBy: null,
  },
  orange_money: {
    label: 'Orange Money',
    needsCustomerAction: true, // the customer approves on their handset
    refundable: true,
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 100,
    maxThebe: 500000,
    blockedBy: 'Orange Money merchant credentials and rate (email queued Monday 10:05)',
  },
  myzaka: {
    label: 'MyZaka',
    needsCustomerAction: true,
    refundable: true,
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 100,
    maxThebe: 500000,
    blockedBy: 'Mascom MyZaka merchant credentials and rate (email queued Monday 10:35)',
  },
  smega: {
    label: 'Smega',
    needsCustomerAction: true,
    refundable: true,
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 100,
    maxThebe: 500000,
    blockedBy: 'BTC Smega merchant credentials and rate (email queued Monday 11:05)',
  },
  card: {
    label: 'Card',
    needsCustomerAction: true,
    refundable: true,
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 100,
    maxThebe: 2000000,
    blockedBy: 'A card gateway chosen and signed: DPO or Tingg',
  },
  account: {
    label: 'On account',
    needsCustomerAction: false,
    refundable: true,
    costBp: 0,
    costFlatThebe: 0,
    minThebe: 0,
    maxThebe: 10000000,
    blockedBy: null, // corporate.ts already governs who may do this
  },
};

export function railsAvailableToday(): Rail[] {
  return (Object.keys(RAILS) as Rail[]).filter((r) => RAILS[r].blockedBy === null);
}

export function railsWaitingOnSomebody(): { rail: Rail; blockedBy: string }[] {
  return (Object.keys(RAILS) as Rail[])
    .filter((r) => RAILS[r].blockedBy !== null)
    .map((r) => ({ rail: r, blockedBy: RAILS[r].blockedBy as string }));
}

/** What the rail takes off the top, in thebe, rounded to a whole thebe. */
export function railCost(rail: Rail, amountThebe: number): number {
  const spec = RAILS[rail];
  if (amountThebe < 0) throw new PaymentError('An amount cannot be negative.');
  return Math.round((amountThebe * spec.costBp) / 10000) + spec.costFlatThebe;
}

/** What actually lands, after the rail has taken its cut. */
export function netOf(rail: Rail, amountThebe: number): number {
  return amountThebe - railCost(rail, amountThebe);
}

export function pula(thebe: number): string {
  const sign = thebe < 0 ? '-' : '';
  const n = Math.abs(thebe);
  return sign + 'P' + Math.floor(n / THEBE) + '.' + String(n % THEBE).padStart(2, '0');
}

/* ------------------------------------------------------------------ the states */

export type PaymentState =
  | 'created'
  | 'awaiting_customer'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'refunded';

const MOVES: Record<PaymentState, PaymentState[]> = {
  created: ['awaiting_customer', 'captured', 'failed', 'cancelled'],
  awaiting_customer: ['captured', 'failed', 'cancelled'],
  captured: ['refunded'],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function canMove(from: PaymentState, to: PaymentState): boolean {
  return MOVES[from].includes(to);
}

export function isFinal(s: PaymentState): boolean {
  return MOVES[s].length === 0;
}

export interface Payment {
  /** the idempotency key: the same key is always the same payment */
  key: string;
  order_id: string;
  rail: Rail;
  amount_thebe: number;
  state: PaymentState;
  /** what the rail took, known only once captured */
  cost_thebe: number;
  refunded_thebe: number;
  /** set when the rail names its own reference, so a dispute can be traced */
  rail_ref: string | null;
  says: string;
}

/* ------------------------------------------------------- taking the money once */

export interface TakeRequest {
  key: string;
  order_id: string;
  rail: Rail;
  amount_thebe: number;
}

/**
 * The book of payments. Deliberately an interface: the real one is Postgres, the
 * one in the tests is a Map, and neither the state machine nor the idempotency
 * rule should care which it is.
 */
export interface PaymentBook {
  get(key: string): Payment | undefined;
  put(p: Payment): void;
}

export class MemoryBook implements PaymentBook {
  private readonly m = new Map<string, Payment>();
  get(key: string) {
    return this.m.get(key);
  }
  put(p: Payment) {
    this.m.set(p.key, p);
  }
  all(): Payment[] {
    return [...this.m.values()];
  }
}

/**
 * Start a payment, or hand back the one this key already started.
 *
 * The rule that matters: the SAME key with DIFFERENT details is a bug in the
 * caller, not a second payment, and it throws rather than quietly charging
 * again. A retried tap sends identical details and gets the identical payment
 * back, which is the whole point.
 */
export function take(book: PaymentBook, req: TakeRequest): Payment {
  if (!req.key) throw new PaymentError('A payment needs an idempotency key.');
  if (!Number.isInteger(req.amount_thebe)) {
    throw new PaymentError('Money is whole thebe. ' + req.amount_thebe + ' is not.');
  }
  if (req.amount_thebe <= 0) throw new PaymentError('An amount must be more than nothing.');

  const existing = book.get(req.key);
  if (existing) {
    if (
      existing.order_id !== req.order_id ||
      existing.rail !== req.rail ||
      existing.amount_thebe !== req.amount_thebe
    ) {
      throw new PaymentError(
        'This key has already been used for a different payment. Refusing to charge again.',
      );
    }
    return existing; // the retried tap
  }

  const spec = RAILS[req.rail];
  if (spec.blockedBy) {
    throw new PaymentError(spec.label + ' is not switched on yet: ' + spec.blockedBy);
  }
  if (req.amount_thebe < spec.minThebe) {
    throw new PaymentError(spec.label + ' does not take amounts under ' + pula(spec.minThebe) + '.');
  }
  if (req.amount_thebe > spec.maxThebe) {
    throw new PaymentError(spec.label + ' does not take amounts over ' + pula(spec.maxThebe) + '.');
  }

  const p: Payment = {
    key: req.key,
    order_id: req.order_id,
    rail: req.rail,
    amount_thebe: req.amount_thebe,
    state: spec.needsCustomerAction ? 'awaiting_customer' : 'created',
    cost_thebe: 0,
    refunded_thebe: 0,
    rail_ref: null,
    says: spec.needsCustomerAction
      ? 'Approve ' + pula(req.amount_thebe) + ' on your phone.'
      : pula(req.amount_thebe) + ' due at the door.',
  };
  book.put(p);
  return p;
}

export function move(
  book: PaymentBook,
  key: string,
  to: PaymentState,
  railRef?: string,
): Payment {
  const p = book.get(key);
  if (!p) throw new PaymentError('No payment with that key.');
  if (!canMove(p.state, to)) {
    throw new PaymentError('A payment cannot go from ' + p.state + ' to ' + to + '.');
  }
  p.state = to;
  if (railRef) p.rail_ref = railRef;
  if (to === 'captured') {
    p.cost_thebe = railCost(p.rail, p.amount_thebe);
    p.says = pula(p.amount_thebe) + ' received.';
  }
  if (to === 'failed') p.says = 'That payment did not go through. Nothing was taken.';
  if (to === 'cancelled') p.says = 'Payment cancelled. Nothing was taken.';
  book.put(p);
  return p;
}

export function refund(book: PaymentBook, key: string, amountThebe: number): Payment {
  const p = book.get(key);
  if (!p) throw new PaymentError('No payment with that key.');
  if (p.state !== 'captured') throw new PaymentError('Only money actually taken can be sent back.');
  if (!RAILS[p.rail].refundable) {
    throw new PaymentError(
      RAILS[p.rail].label + ' cannot be refunded by software. This one goes through settlement.',
    );
  }
  if (!Number.isInteger(amountThebe) || amountThebe <= 0) {
    throw new PaymentError('A refund must be a whole amount of thebe, more than nothing.');
  }
  if (p.refunded_thebe + amountThebe > p.amount_thebe) {
    throw new PaymentError('That is more than was taken.');
  }
  p.refunded_thebe += amountThebe;
  if (p.refunded_thebe === p.amount_thebe) p.state = 'refunded';
  p.says = pula(p.refunded_thebe) + ' sent back.';
  book.put(p);
  return p;
}

/* ------------------------------------------------- the rail itself, unconfigured */

export interface RailAdapter {
  rail: Rail;
  charge(p: Payment): Promise<{ ok: boolean; ref?: string; says: string }>;
}

/**
 * The Orange Money connector, deliberately inert.
 *
 * Orange holds over seven in ten of Botswana's mobile money and publishes a real
 * web payment API, so this is the rail that matters. It cannot be written blind:
 * it needs a merchant id, a secret and the notification URL Orange calls back on.
 * Until those exist this throws by name rather than returning a cheerful false
 * success, because a payment layer that appears to work and takes nothing is
 * worse than one that plainly refuses.
 */
export class UnconfiguredRail implements RailAdapter {
  constructor(public readonly rail: Rail) {}
  async charge(): Promise<{ ok: boolean; says: string }> {
    const spec = RAILS[this.rail];
    throw new PaymentError(
      spec.label + ' has no credentials on this machine. Waiting on: ' + (spec.blockedBy ?? 'nothing'),
    );
  }
}
```

---

## api/src/orders/commission.ts

_What the platform earns on a basket. An unagreed rate earns zero._

```typescript
/**
 * Commission: what Sprint earns on the basket, not just on the drop.
 *
 * Asked for by Luther on 15 September 2026, after checking the settlement rules
 * turned up that there was no commission anywhere in the engine at all. Sprint's
 * whole upside was a flat delivery fee, so a merchant sending P50,000 a month paid
 * exactly the same as one sending P5,000 at the same order count. Wanzy and
 * Sixty60 both earn on the basket. It is the number a supermarket deal turns on,
 * and there was no field for it.
 *
 * Three mistakes this codebase has already made are deliberately designed out:
 *
 *   - INVENTED NUMBERS THAT HARDEN INTO POLICY. The 75 and 18 percent split in
 *     ledger.repo.ts was nobody's decision. So a rate here is worth nothing until
 *     `agreed` is true, and an unagreed rate earns ZERO rather than a guess.
 *   - A RATE WITH NO PROVENANCE. Every set of terms must say where the number came
 *     from, in writing, or it cannot be agreed.
 *   - MONEY AS A FLOAT. Rates are basis points as whole integers. 1500 is fifteen
 *     percent. There is no 0.15 anywhere in this file.
 *
 * And one thing is left deliberately undone: no rate is set for any merchant here.
 * Nobody has signed anything. The rates in a negotiation belong to Luther and
 * Barbara, and this file's job is to hold them correctly once they exist.
 */

export class CommissionError extends Error {}

/** 10,000 basis points is one hundred percent. 1500 is fifteen. */
export const BP = 10000;

/**
 * A rate this high is almost certainly a typo, not a deal. The cap is a guard
 * against a fat finger, not a commercial opinion: an override is possible, it
 * just has to be deliberate.
 */
export const SANITY_CAP_BP = 3500;

export interface MerchantTerms {
  merchant_id: string;
  merchant_name: string;
  /** basis points of the GOODS, never of the delivery fee */
  commission_bp: number;
  /** true only when the merchant has signed and Barbara has countersigned */
  agreed: boolean;
  /** the day it was agreed, or null while it is still a proposal */
  agreed_on: string | null;
  /** where the number came from. A rate with no source cannot be agreed. */
  source: string;
  /** set deliberately when a rate above the sanity cap is genuinely the deal */
  allowAboveCap?: boolean;
}

export function checkTerms(t: MerchantTerms): void {
  if (!Number.isInteger(t.commission_bp)) {
    throw new CommissionError('A commission rate is whole basis points. 1500 is fifteen percent.');
  }
  if (t.commission_bp < 0) throw new CommissionError('A commission rate cannot be less than nothing.');
  if (t.commission_bp > BP) throw new CommissionError('A commission rate cannot be more than the whole basket.');
  if (t.commission_bp > SANITY_CAP_BP && !t.allowAboveCap) {
    throw new CommissionError(
      `${pct(t.commission_bp)} is above the ${pct(SANITY_CAP_BP)} sanity cap. If that really is the deal, say so deliberately.`,
    );
  }
  if (t.agreed && !t.source.trim()) {
    throw new CommissionError('A rate cannot be agreed without saying where it came from.');
  }
  if (t.agreed && !t.agreed_on) {
    throw new CommissionError('An agreed rate needs the day it was agreed.');
  }
}

export function pct(bp: number): string {
  const whole = Math.floor(bp / 100);
  const rest = bp % 100;
  return rest === 0 ? `${whole} percent` : `${whole}.${String(rest).padStart(2, '0')} percent`;
}

export interface CommissionVerdict {
  /** thebe Sprint earns on these goods. Zero whenever the rate is not agreed. */
  thebe: number;
  earned: boolean;
  says: string;
}

/**
 * What Sprint earns on the goods of one order.
 *
 * An unagreed rate earns nothing. That is the whole safety of this file: a rate
 * typed in during a negotiation cannot start taking money from a merchant because
 * somebody forgot it was only a proposal.
 */
export function commissionOn(goodsThebe: number, terms: MerchantTerms | null): CommissionVerdict {
  if (!terms) {
    return { thebe: 0, earned: false, says: 'No terms on file for this merchant, so nothing is taken.' };
  }
  checkTerms(terms);
  if (!Number.isInteger(goodsThebe) || goodsThebe < 0) {
    throw new CommissionError('Goods are whole thebe, and cannot be less than nothing.');
  }
  if (!terms.agreed) {
    return {
      thebe: 0,
      earned: false,
      says: `${pct(terms.commission_bp)} is proposed for ${terms.merchant_name} and not agreed, so nothing is taken.`,
    };
  }
  const thebe = Math.round((goodsThebe * terms.commission_bp) / BP);
  return {
    thebe,
    earned: true,
    says: `${pct(terms.commission_bp)} of the goods, agreed ${terms.agreed_on}`,
  };
}

/** What the merchant is left with after Sprint's share of the goods. */
export function merchantNets(goodsThebe: number, terms: MerchantTerms | null): number {
  return goodsThebe - commissionOn(goodsThebe, terms).thebe;
}

/* ------------------------------------------------------------------ the deal */

export interface RateOption {
  bp: number;
  label: string;
  sprint_earns_thebe: number;
  merchant_keeps_thebe: number;
}

/**
 * What a month of this merchant's baskets would earn at each rate being
 * discussed, so a negotiation is done against arithmetic instead of a feeling.
 *
 * The delivery fees are passed in separately and deliberately: they are earned
 * whatever the commission is, and adding them to the commission column is how a
 * rate ends up looking better than it is.
 */
export function whatRatesWouldEarn(
  monthlyGoodsThebe: number,
  rates: number[] = [500, 1000, 1500, 2000, 2500],
): RateOption[] {
  if (!Number.isInteger(monthlyGoodsThebe) || monthlyGoodsThebe < 0) {
    throw new CommissionError('A month of goods is whole thebe, and cannot be less than nothing.');
  }
  return rates
    .filter((bp) => Number.isInteger(bp) && bp >= 0 && bp <= BP)
    .sort((a, b) => a - b)
    .map((bp) => {
      const earns = Math.round((monthlyGoodsThebe * bp) / BP);
      return {
        bp,
        label: pct(bp),
        sprint_earns_thebe: earns,
        merchant_keeps_thebe: monthlyGoodsThebe - earns,
      };
    });
}

/**
 * The question nobody could answer before this file existed: at this merchant's
 * volume, is the commission or the delivery fee the bigger line? If the fee wins,
 * the rate is too low to be worth arguing about and the conversation should be
 * about volume instead.
 */
export function whichEarnsMore(
  monthlyGoodsThebe: number,
  monthlyDeliveryFeesThebe: number,
  terms: MerchantTerms | null,
): { commission: number; fees: number; bigger: 'commission' | 'fees' | 'level'; says: string } {
  const commission = commissionOn(monthlyGoodsThebe, terms).thebe;
  const fees = monthlyDeliveryFeesThebe;
  const bigger = commission === fees ? 'level' : commission > fees ? 'commission' : 'fees';
  return {
    commission,
    fees,
    bigger,
    says:
      bigger === 'fees'
        ? 'The delivery fees earn more than the commission here, so volume matters more than the rate.'
        : bigger === 'commission'
          ? 'The commission earns more than the delivery fees here, so the rate is the thing to negotiate.'
          : 'The commission and the delivery fees earn the same here.',
  };
}
```

---

## api/src/orders/cash.ts

_Botswana cash. The largest note is P200._

```typescript
/**
 * Brick 18, the cash half. CashSure.
 *
 * Cash is most of this market and it is where the money leaks. The industry figure for cash
 * reconciliation loss is one and a half to three percent of revenue, and Sprint has never measured
 * its own. The director question "what is leaking unbilled" has no answer today, and it cannot have
 * one until every cash order is counted against what the rider actually carried.
 *
 * Four things make that possible, and none of them needs a payment provider to answer first:
 *
 *   1. A CAP. Above a certain order value, cash is simply not offered. A rider carrying eight
 *      hundred pula of other people's change is a target, and a loss nobody can prove.
 *   2. THE NOTE THE CUSTOMER WILL PAY WITH, asked at checkout, so the rider leaves with the right
 *      change instead of standing at a gate unable to complete the sale.
 *   3. A FLOAT worked out from the orders actually assigned, not a habit.
 *   4. A COUNT at the end of the shift, against what the orders say should be there, with the
 *      difference named rather than absorbed.
 *
 * Every amount here is in thebe, the smallest unit, because money held in a decimal is money that
 * quietly disappears in rounding. One pula is 100 thebe.
 */

/**
 * Botswana notes in circulation, in thebe, biggest first. P200, P100, P50, P20, P10.
 * There is no P500 note, which is worth knowing before somebody builds a screen offering one.
 * Coins are ignored: nobody pays a courier in coins.
 */
export const NOTES = [20000, 10000, 5000, 2000, 1000] as const;
export const THEBE = 100;

/** Above this, cash is not offered. A rider should never carry more change than this implies. */
export const CASH_CAP_THEBE = 100000; // P1000

/** A shift float above this needs a supervisor to hand it out and sign for it. */
export const FLOAT_SIGNOFF_THEBE = 50000; // P500

/** Under this, a shortfall at count up is written off rather than argued. Finance may change it. */
export const WRITE_OFF_THEBE = 500; // P5

export class CashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CashError';
  }
}

export function pula(thebe: number): string {
  return `P${(thebe / THEBE).toFixed(2)}`;
}

/** May this order be paid in cash at all. */
export function cashAllowed(totalThebe: number): { allowed: boolean; says: string } {
  if (!Number.isInteger(totalThebe) || totalThebe <= 0) {
    throw new CashError('An order total must be a whole number of thebe before cash can be offered.');
  }
  if (totalThebe > CASH_CAP_THEBE) {
    return {
      allowed: false,
      says: `Orders over ${pula(CASH_CAP_THEBE)} cannot be paid in cash. Please choose another way to pay.`,
    };
  }
  return { allowed: true, says: 'You can pay the rider in cash' };
}

/** The notes a customer could sensibly hand over for this total, biggest first. */
export function payableWith(totalThebe: number): number[] {
  return NOTES.filter((n) => n >= totalThebe || n >= smallestCovering(totalThebe));
}

function smallestCovering(totalThebe: number): number {
  const fits = NOTES.filter((n) => n >= totalThebe);
  return fits.length ? Math.min(...fits) : Math.max(...NOTES);
}

/**
 * What the rider must carry for this order. Asked at checkout, because a rider who arrives without
 * change either loses the sale or rounds it in somebody's favour, and both are a leak.
 */
/**
 * The notes a customer would actually hand over to make exactly this amount,
 * biggest first. Null when no combination of Botswana notes makes it.
 *
 * Every note is a multiple of P10 and P10 itself is a note, so an amount is
 * payable exactly when it is a whole number of P10 and at least P10. Greedy is
 * correct here: 200, 100, 50, 20, 10 is a canonical set, so taking the biggest
 * note that fits never paints you into a corner.
 */
export function notesFor(amountThebe: number): number[] | null {
  if (!Number.isInteger(amountThebe) || amountThebe < 0) return null;
  if (amountThebe === 0) return [];
  const smallest = Math.min(...NOTES);
  if (amountThebe % smallest !== 0) return null;
  const out: number[] = [];
  let left = amountThebe;
  for (const n of [...NOTES].sort((a, b) => b - a)) {
    while (left >= n) {
      out.push(n);
      left -= n;
    }
  }
  return left === 0 ? out : null;
}

/** Can a person physically hand this over? */
export function canBeHandedOver(amountThebe: number): boolean {
  return notesFor(amountThebe) !== null;
}

/** 'two P200s and a P100', for a screen or a rider to read. */
export function saysNotes(amountThebe: number): string {
  const ns = notesFor(amountThebe);
  if (!ns || ns.length === 0) return 'nothing';
  const counted = new Map<number, number>();
  for (const n of ns) counted.set(n, (counted.get(n) ?? 0) + 1);
  const parts = [...counted.entries()].map(([note, times]) =>
    times === 1 ? 'a ' + pula(note) : times + ' x ' + pula(note),
  );
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

/**
 * Three amounts a customer might realistically hand over for this total: the
 * least they can assemble that covers it, and two rounder amounts above it.
 * This replaces the old single note list, which could not cover anything over
 * P200 and so made cash unusable for a normal hardware or grocery basket.
 */
export function tendersFor(totalThebe: number): number[] {
  const check = cashAllowed(totalThebe);
  if (!check.allowed) return [];
  const smallest = Math.min(...NOTES);
  const least = Math.ceil(totalThebe / smallest) * smallest;
  const out = new Set<number>();
  if (canBeHandedOver(least)) out.add(least);
  for (const step of [5000, 10000, 20000]) {
    const rounded = Math.ceil(totalThebe / step) * step;
    if (rounded !== least && canBeHandedOver(rounded) && rounded <= CASH_CAP_THEBE) {
      out.add(rounded);
    }
  }
  return [...out].sort((a, b) => a - b).slice(0, 3);
}

export function changeFor(totalThebe: number, payingWithThebe: number): {
  change: number;
  says: string;
  riderNeeds: number;
  /** what the customer physically hands the rider, for the screen and the run sheet */
  handingOver: string;
} {
  const check = cashAllowed(totalThebe);
  if (!check.allowed) throw new CashError(check.says);
  /* Anything a customer can actually assemble from notes. It used to be a single
     note, which capped every cash order at P200 and made cash useless for a normal
     basket. P500 is fine, handed over as two P200s and a P100. P75 is not, because
     no combination of Botswana notes makes it. */
  if (!canBeHandedOver(payingWithThebe)) {
    throw new CashError(
      `${pula(payingWithThebe)} is not an amount anyone can hand over. The smallest note is ${pula(Math.min(...NOTES))}.`,
    );
  }
  if (payingWithThebe < totalThebe) {
    throw new CashError(
      `${pula(payingWithThebe)} does not cover ${pula(totalThebe)}. Hand over more.`,
    );
  }
  const change = payingWithThebe - totalThebe;
  return {
    change,
    riderNeeds: change,
    says: change === 0
      ? 'No change needed, the customer has it exactly'
      : `Your rider will bring ${pula(change)} change`,
    handingOver: saysNotes(payingWithThebe),
  };
}

export interface CashOrder {
  order_id: string;
  total: number;
  paying_with: number;
}

/** What a rider must leave the branch with, given the cash orders actually on their run. */
export function floatFor(orders: CashOrder[]): {
  float: number;
  needs_signoff: boolean;
  says: string;
  per_order: Array<{ order_id: string; change: number }>;
} {
  const per_order = orders.map((o) => ({
    order_id: o.order_id,
    change: changeFor(o.total, o.paying_with).change,
  }));
  const float = per_order.reduce((a, b) => a + b.change, 0);
  const needs_signoff = float > FLOAT_SIGNOFF_THEBE;
  return {
    float,
    needs_signoff,
    per_order,
    says: needs_signoff
      ? `${pula(float)} float, which needs a supervisor to hand it over and sign`
      : `${pula(float)} float for ${orders.length} cash order${orders.length === 1 ? '' : 's'}`,
  };
}

export interface Reconciliation {
  expected: number;
  counted: number;
  difference: number;
  /** Positive means the rider has more than they should, negative means short. */
  short: boolean;
  within_write_off: boolean;
  says: string;
}

/**
 * End of shift. What the orders say should be in the bag, against what is actually in it.
 * This is the number that has never been measured, and the only way the leak becomes visible.
 */
export function reconcile(
  floatOut: number,
  orders: CashOrder[],
  countedIn: number,
): Reconciliation {
  if (!Number.isInteger(countedIn) || countedIn < 0) {
    throw new CashError('The counted amount must be a whole number of thebe. Count it again.');
  }
  const collected = orders.reduce((a, o) => a + o.paying_with, 0);
  const givenOut = orders.reduce((a, o) => a + changeFor(o.total, o.paying_with).change, 0);
  const expected = floatOut + collected - givenOut;
  const difference = countedIn - expected;
  const within = Math.abs(difference) <= WRITE_OFF_THEBE;
  return {
    expected,
    counted: countedIn,
    difference,
    short: difference < 0,
    within_write_off: within,
    says:
      difference === 0
        ? 'Balanced exactly'
        : within
          ? `${pula(Math.abs(difference))} ${difference < 0 ? 'short' : 'over'}, inside the write off, closed`
          : `${pula(Math.abs(difference))} ${difference < 0 ? 'SHORT' : 'OVER'}, this one needs a person to look at it`,
  };
}

/** The photograph rule, so a disputed cash handover has something behind it. */
export function needsCashPhoto(totalThebe: number): boolean {
  return totalThebe >= 20000; // P200 and up
}
```

---

## api/src/orders/settlement.ts

_Who is paid when a delivery goes wrong._

```typescript
/**
 * Brick 19. Merchants paid the same day.
 *
 * Both council seats said settlement speed is existential: a merchant paid tomorrow leaves for a
 * platform that pays today. They also said it is impossible without brick 15, the fault model,
 * because the moment money moves on its own somebody must already have decided who carries a loss.
 *
 * So this file turns the fault on each order into arithmetic. At the end of a day every completed
 * order has a fault of merchant, customer, sprint, rider or none already attached by the person who
 * was there, and the payout file falls out of that without anybody reading an order history.
 *
 * **Status: the RULES here are brick 15's, which Barbara has not agreed yet.** The mechanism is
 * real and tested; the percentages and the deduction rules are the proposal in docs/FAULT_MODEL.md.
 * Nothing may actually pay a merchant until she signs it, and `readyToPay()` refuses while the model
 * is unagreed rather than quietly running on a draft.
 *
 * **One thing the council did not know.** MyZaka has no automatic settlement to a bank account at
 * all. Their own contract has the merchant emptying an electronic wallet by hand. So on that rail a
 * same day payout has to be funded from Sprint's own account and reconciled afterwards, and this
 * file marks those lines rather than pretending the money moved.
 */

import { Fault } from './state_machine';

/** Money is in thebe throughout. A decimal is how money quietly disappears. */
import { commissionOn, type MerchantTerms } from './commission';

export type Rail = 'cash' | 'orange_money' | 'myzaka' | 'smega' | 'card' | 'account';

/**
 * Three different things, and conflating them would mislead finance badly.
 *   SELF_SETTLING: the rail moves money to the merchant itself. Nothing to fund.
 *   IN_HAND: the rider physically collected it, so Sprint holds the notes and simply transfers them.
 *   WALLET: the money sits in an electronic wallet that somebody at Sprint must empty by hand, per
 *           Mascom's own MyZakaPay contract clause 3.3.6. THIS is the one that has to be funded from
 *           Sprint's own bank account on the day and reconciled afterwards.
 */
const SELF_SETTLING: Rail[] = ['card', 'account'];
const IN_HAND: Rail[] = ['cash'];
const WALLET: Rail[] = ['orange_money', 'myzaka', 'smega'];

export interface SettleableOrder {
  order_id: string;
  merchant_id: string;
  merchant_name: string;
  /** What the customer paid for the goods, in thebe. Excludes the delivery fee. */
  goods: number;
  /** The delivery fee, which is Sprint's, not the merchant's. */
  delivery_fee: number;
  rail: Rail;
  /** 'none' when it completed normally. Anything else means something went wrong. */
  fault: Fault;
  /** Did the goods actually reach the customer. */
  delivered: boolean;
  /** Perishable or dispensed goods cannot go back on a shelf. */
  perishable: boolean;
}

export interface PayoutLine {
  merchant_id: string;
  merchant_name: string;
  orders: number;
  /** What the merchant is owed for goods that reached a customer. */
  goods: number;
  /** Deducted because the merchant caused a failure. Never a penalty, only real cost. */
  deductions: number;
  /** Paid to the merchant for goods that came back but cannot be resold. */
  perishable_loss: number;
  net: number;
  rail: Rail;
  /** True when Sprint must fund this from its own account because the rail does not settle itself. */
  funded_by_sprint: boolean;
  says: string;
}

export interface Payout {
  day: string;
  lines: PayoutLine[];
  total: number;
  funded_by_sprint: number;
  /** Sprint's own take for the day: delivery fees earned, less what it carried for its own failures. */
  sprint_delivery_fees: number;
  sprint_absorbed: number;
  agreed: boolean;
  says: string;
}

export class SettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettlementError';
  }
}

export function pula(thebe: number): string {
  return `P${(thebe / 100).toFixed(2)}`;
}

/**
 * What one order settles to. The fault decides it, exactly as the table in docs/FAULT_MODEL.md says.
 */
export function settleOne(o: SettleableOrder, terms: MerchantTerms | null = null): {
  merchant: number;
  perishable_loss: number;
  sprint_fee: number;
  sprint_absorbs: number;
  /** Sprint's share of the GOODS. Zero unless the merchant's rate is agreed. */
  commission: number;
  says: string;
} {
  if (o.goods < 0 || o.delivery_fee < 0) throw new SettlementError('An order cannot have a negative amount on it.');

  if (o.delivered) {
    // It arrived. The merchant is paid for the goods and Sprint keeps the delivery fee, whatever
    // went wrong on the way, because the customer got what they ordered.
    /* Commission is earned only on a delivery that happened, and only on the
       goods. An unagreed rate earns zero, so a rate typed in during a negotiation
       cannot start taking money from a merchant because somebody forgot it was
       still a proposal. See commission.ts. */
    const cut = commissionOn(o.goods, terms);
    return {
      merchant: o.goods - cut.thebe,
      perishable_loss: 0,
      sprint_fee: o.delivery_fee,
      sprint_absorbs: 0,
      commission: cut.thebe,
      says: cut.earned ? `Delivered. ${cut.says}` : 'Delivered, paid in full',
    };
  }

  switch (o.fault) {
    case 'merchant':
      // The shop could not supply. They are paid nothing and carry any perishable loss themselves.
      return { merchant: 0, perishable_loss: 0, sprint_fee: 0, sprint_absorbs: 0, commission: 0, says: 'The shop could not supply it, nothing is owed' };

    case 'customer':
      // Wrong address, nobody home, failed identity check. The customer keeps paying the delivery
      // fee, and a perishable that cannot be resold is the merchant's real loss, so it is paid.
      return {
        merchant: 0,
        perishable_loss: o.perishable ? o.goods : 0,
        sprint_fee: o.delivery_fee,
        sprint_absorbs: 0,
        commission: 0,   // nothing was delivered, so nothing is earned on the basket
        says: o.perishable
          ? 'The customer caused it and the goods cannot be resold, so the shop is covered'
          : 'The customer caused it, the goods go back, the delivery fee stands',
      };

    case 'rider':
    case 'sprint':
      // Sprint could not do what it sold. The customer is refunded, the merchant is covered for
      // anything that cannot be resold, and Sprint carries it.
      return {
        merchant: 0,
        perishable_loss: o.perishable ? o.goods : 0,
        sprint_fee: 0,
        sprint_absorbs: (o.perishable ? o.goods : 0) + o.delivery_fee,
        commission: 0,   // nothing was delivered, so nothing is earned on the basket
        says: 'Sprint could not deliver it, so Sprint carries the cost',
      };

    case 'none':
    default:
      // Nobody is at fault. Flood, accident, roadblock. Nobody profits and nobody is punished.
      return {
        merchant: 0,
        perishable_loss: o.perishable ? o.goods : 0,
        sprint_fee: 0,
        sprint_absorbs: o.perishable ? o.goods : 0,
        commission: 0,   // nothing was delivered, so nothing is earned on the basket
        says: 'Nobody was at fault, the goods that cannot be resold are covered',
      };
  }
}

/**
 * The day's payout, grouped by merchant. `agreed` is whether Barbara has signed the fault model;
 * false produces the file but marks it not payable, so nobody pays out on a draft by accident.
 */
export function dayPayout(day: string, orders: SettleableOrder[], agreed: boolean): Payout {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new SettlementError('A payout needs a day, as 2026-09-13.');

  const byMerchant = new Map<string, PayoutLine>();
  let fees = 0, absorbed = 0;

  for (const o of orders) {
    const s = settleOne(o);
    fees += s.sprint_fee;
    absorbed += s.sprint_absorbs;

    const line = byMerchant.get(o.merchant_id) ?? {
      merchant_id: o.merchant_id,
      merchant_name: o.merchant_name,
      orders: 0, goods: 0, deductions: 0, perishable_loss: 0, net: 0,
      rail: o.rail,
      funded_by_sprint: WALLET.includes(o.rail),
      says: '',
    };
    line.orders += 1;
    line.goods += s.merchant;
    line.perishable_loss += s.perishable_loss;
    if (!o.delivered && o.fault === 'merchant') line.deductions += 0; // nothing owed, nothing deducted
    byMerchant.set(o.merchant_id, line);
  }

  const lines = [...byMerchant.values()].map((l) => {
    l.net = l.goods + l.perishable_loss - l.deductions;
    l.says = l.funded_by_sprint
      ? `${pula(l.net)} to ${l.merchant_name}, funded from Sprint's own account because ${railName(l.rail)} leaves the money in a wallet somebody must empty by hand`
      : IN_HAND.includes(l.rail)
        ? `${pula(l.net)} to ${l.merchant_name}, out of the cash the rider already collected`
        : `${pula(l.net)} to ${l.merchant_name} on ${railName(l.rail)}`;
    return l;
  }).sort((a, b) => b.net - a.net);

  const total = lines.reduce((a, l) => a + l.net, 0);
  const funded = lines.filter((l) => l.funded_by_sprint).reduce((a, l) => a + l.net, 0);

  return {
    day, lines, total,
    funded_by_sprint: funded,
    sprint_delivery_fees: fees,
    sprint_absorbed: absorbed,
    agreed,
    says: agreed
      ? `${pula(total)} to ${lines.length} merchant${lines.length === 1 ? '' : 's'} for ${day}`
      : `${pula(total)} worked out for ${day}, NOT PAYABLE until the fault model is agreed`,
  };
}

function railName(r: Rail): string {
  return { cash: 'cash', orange_money: 'Orange Money', myzaka: 'MyZaka', smega: 'Smega', card: 'card', account: 'account' }[r];
}

/** The gate. Nothing pays a merchant while the rules behind it are still a proposal. */
export function readyToPay(p: Payout): { ready: boolean; says: string } {
  if (!p.agreed) {
    return { ready: false, says: 'The fault model is still a proposal, so nothing can be paid out yet. Barbara has it.' };
  }
  if (p.total < 0) {
    return { ready: false, says: 'The day works out to less than nothing, which means something is wrong. A person must look.' };
  }
  return { ready: true, says: p.says };
}

/** The file finance actually opens. Plain CSV, because that is what a bank upload takes. */
export function payoutCsv(p: Payout): string {
  const head = 'day,merchant_id,merchant_name,orders,goods_pula,perishable_pula,net_pula,rail,funded_by_sprint';
  const rows = p.lines.map((l) =>
    [p.day, l.merchant_id, `"${l.merchant_name.replace(/"/g, '""')}"`, l.orders,
     (l.goods / 100).toFixed(2), (l.perishable_loss / 100).toFixed(2), (l.net / 100).toFixed(2),
     l.rail, l.funded_by_sprint ? 'yes' : 'no'].join(','));
  const foot = `${p.day},TOTAL,"",${p.lines.reduce((a, l) => a + l.orders, 0)},,,${(p.total / 100).toFixed(2)},,`;
  return [head, ...rows, foot].join('\n') + '\n';
}
```

---

## api/src/orders/money_models.test.ts

_Two money models here disagree by a quarter of every basket._

```typescript
/**
 * Two money models live in this codebase and they disagree. This file holds that
 * fact still so nobody has to rediscover it.
 *
 * Found 15 September 2026 while checking the settlement rules, after the P200
 * cash ceiling had already shown that a number can sit under passing tests for
 * weeks and still be wrong.
 *
 *   settlement.ts        pays a merchant 100 percent of the goods on a delivered
 *                        order, and Sprint keeps only the delivery fee.
 *   ledger.repo.ts       splits the same order 75 percent merchant, 18 percent
 *                        courier, the remainder to Sprint.
 *
 * Only the first one decides what anybody is paid. The second feeds the
 * simulator and nothing else. Neither is policy: docs/FAULT_MODEL.md still says
 * "Status: proposed. Not yet agreed by Barbara."
 *
 * These tests do not pick a winner. That is Barbara's decision and Luther's.
 * They make sure the disagreement cannot be forgotten, cannot drift, and cannot
 * quietly become the thing that pays real merchants.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settleOne, dayPayout, readyToPay, type SettleableOrder } from './settlement';
import { SIMULATOR_SPLIT } from '../data-store/repositories/ledger.repo';

const order = (over: Partial<SettleableOrder> = {}): SettleableOrder => ({
  order_id: 'SPR-1',
  merchant_id: 'M1',
  merchant_name: 'Broadhurst Hardware',
  goods: 20000, // P200
  delivery_fee: 2500, // P25
  rail: 'cash',
  fault: 'none',
  delivered: true,
  perishable: false,
  ...over,
});

test('SETTLEMENT TAKES NO COMMISSION: a delivered order pays the merchant every thebe of the goods', () => {
  const s = settleOne(order());
  assert.equal(s.merchant, 20000, 'the merchant is paid the goods in full');
  assert.equal(s.sprint_fee, 2500, 'Sprint keeps only the delivery fee');
  assert.equal(s.merchant + s.sprint_fee, 22500);
});

test('so Sprint earns the delivery fee and nothing else on the basket', () => {
  const s = settleOne(order({ goods: 500000 })); // a P5000 basket
  assert.equal(s.sprint_fee, 2500, 'a twenty five times bigger basket earns Sprint the same P25');
  assert.equal(s.merchant, 500000);
});

test('THE OTHER MODEL DISAGREES, and it is marked as not agreed', () => {
  assert.equal(SIMULATOR_SPLIT.agreed, false, 'this became policy without anybody saying so');
  assert.equal(SIMULATOR_SPLIT.merchant, 0.75);
  assert.equal(SIMULATOR_SPLIT.courier, 0.18);
  assert.match(SIMULATOR_SPLIT.contradicts, /100 percent/);
});

test('the two models really do disagree, by a quarter of every basket', () => {
  const o = order();
  const bySettlement = settleOne(o).merchant;
  const byLedger = Math.round(o.goods * SIMULATOR_SPLIT.merchant);
  assert.notEqual(bySettlement, byLedger);
  assert.equal(bySettlement - byLedger, 5000, 'P50 on a P200 basket, every time');
});

test('nothing can be paid to anybody until Barbara agrees the fault model', () => {
  const day = dayPayout('2026-09-15', [order()], false);
  const verdict = readyToPay(day);
  assert.equal(verdict.ready, false);
  assert.match(verdict.says, /still a proposal|Barbara/);
});

test('and the day total says so on its face, not in a footnote', () => {
  const day = dayPayout('2026-09-15', [order()], false);
  assert.match(day.says, /NOT PAYABLE/);
});

test('even once agreed, the day only pays what the rules worked out', () => {
  const agreed = dayPayout('2026-09-15', [order()], true);
  assert.equal(readyToPay(agreed).ready, true);
  assert.equal(agreed.total, 20000, 'the merchant is owed the goods in full, no commission taken');
});

test('a fault that is nobody s does not quietly punish the merchant', () => {
  const s = settleOne(order({ delivered: false, fault: 'none', perishable: true }));
  assert.equal(s.perishable_loss, 20000, 'goods that cannot go back on a shelf are covered');
  assert.equal(s.sprint_fee, 0, 'Sprint does not charge for a delivery that did not happen');
});

test('when Sprint is at fault, Sprint carries it, including the fee it did not earn', () => {
  const s = settleOne(order({ delivered: false, fault: 'sprint', perishable: true }));
  assert.equal(s.sprint_absorbs, 20000 + 2500);
  assert.equal(s.merchant, 0);
});
```
