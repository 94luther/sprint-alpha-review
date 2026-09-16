# Sprint delivery engine, review copy

A customer facing delivery platform for Gaborone, Botswana. One app, many kinds of
shop, in the way Checkers Sixty60 works: a shop has a KIND, and each kind carries
its own rules.

**This copy exists to be read and criticised.** It is a redacted mirror of a
private repository. Staff email addresses have been replaced with
`office@example.com`, phone hashes in the demo data are hashes of invented
numbers, and there are no secrets: every `.env` is excluded and the two keys that
once lived in the private history were rotated on 15 September 2026.

## Where the interesting parts are

| Path | What to attack |
| --- | --- |
| `api/src/catalog/verticals.ts` | Shop kinds and their rules. Pharmacy is blocked IN CODE until the regulator answers, and a test proves seed data cannot put one in front of a customer. |
| `api/src/orders/payments.ts` | Taking money and never taking it twice. Idempotency by key, a state machine that cannot go backwards, and rails that refuse rather than pretend when they have no credentials. |
| `api/src/orders/commission.ts` | What the platform earns on a basket. An unagreed rate earns zero, on purpose. |
| `api/src/orders/cash.ts` | Botswana cash. The largest note is P200, so a single note tender capped every order at P200 until 15 September. |
| `api/src/orders/settlement.ts` | Who is paid when a delivery goes wrong. |
| `api/src/orders/money_models.test.ts` | Two money models in this codebase disagree by a quarter of every basket. The tests hold that fact still rather than hide it. |

## Running the tests

```
cd api
npm install
npx tsc -p tsconfig.json --noEmit
node --test --require ts-node/register src/**/*.test.ts
```

271 tests were passing at the time this copy was taken.

## What it is honest about

Nothing here has a signed merchant, an agreed commission rate, or a live payment
rail. Every shop name and price is invented. The blocked things say who they are
waiting on, by name, rather than pretending to work.
