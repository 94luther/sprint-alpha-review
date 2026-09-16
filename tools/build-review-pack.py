"""Build the packs a reviewer can actually read.

The first pack held six files, which was sixteen percent of the engine. A reviewer
asked what the goal was and could not browse the repository, and the honest answer
to "does it contain everything" was no. So this builds two, and prints the real
percentage on the front of each so nobody has to guess again.

  MONEY  every file that can move a thebe, with its tests. The review that matters.
  FULL   every TypeScript file in the engine.

Staff email addresses are redacted on the way out, the same as the public mirror.

Run:  python tools/build-review-pack.py
"""

import io
import os
import re

BRIEF = """# Sprint delivery engine, review pack: {label}

A customer facing delivery platform for Gaborone, Botswana. One app, many kinds of
shop, the way Checkers Sixty60 works: a shop has a KIND and each kind carries its
own rules. A pharmacy needs a pharmacist, a bottle store needs a licence and
trading hours, a pet shop needs neither.

TypeScript on NestJS. 271 tests passing, tsc clean.
Public copy: https://github.com/94luther/sprint-alpha-review

**This pack holds {n} files, which is {pct} percent of the engine's code.** {coverage}

## What I want from you

Attack it. I am not looking for encouragement, I am looking for what is wrong.
In the order of what would cost me most:

1. **Money.** Can any path take a payment twice, take the wrong amount, pay a
   merchant what they are not owed, or lose a thebe to rounding? Money is whole
   integers everywhere on purpose. Tell me where that breaks.
2. **The two money models.** settlement.ts pays a merchant one hundred percent of
   the goods and gives the platform only the delivery fee. A separate ledger
   splits the same order 75 / 18 / 7. They disagree by a quarter of every basket.
   Only the first pays anybody today. Which should win, and what breaks either way?
3. **The regulator gate.** Pharmacy is blocked in code until the medicines
   regulator answers in writing. Can that be got around by seed data, by a caller,
   or by a screen? One test says it cannot. Is the test wrong?
4. **Credit and limits.** corporate.ts lets a company order on account. Can an
   account be pushed past its limit by concurrent orders, by refunds, or by a race?
5. **Anything a passing test is defending that should not exist.** A single note
   cash rule capped every order at 200 pula for weeks while thirteen tests passed
   over it. Two tests had to change with the contract the day this was written.

Do not tell me the code is clean. Tell me the failure, the input that causes it,
and what it costs.

## Context that is not in the code

- No merchant has signed anything. Every shop name and price is invented.
- No payment rail is switched on. Cash and on account are the only live ones, and
  every other rail refuses by name rather than pretending to work.
- This is one person's project. There is no team and no production deployment.
- Money is thebe as whole integers. One hundred thebe is one pula.

"""

STAFF = re.compile(r'[A-Za-z0-9._%+-]+@sprintcouriers\.co\.bw')


def all_ts(root='api/src'):
    out = []
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for f in sorted(files):
            if f.endswith('.ts'):
                out.append(os.path.join(base, f).replace('\\', '/'))
    return sorted(out)


def build(out_name, paths, label, coverage, total_bytes):
    body, size, kept = [], 0, []
    for p in paths:
        if not os.path.exists(p):
            continue
        s = STAFF.sub('office@example.com', io.open(p, encoding='utf-8').read())
        size += len(s)
        kept.append(p)
        body.append('\n---\n\n## %s\n\n```typescript\n%s\n```\n' % (p, s.rstrip()))
    head = BRIEF.format(label=label, n=len(kept),
                        pct=round(size / total_bytes * 100), coverage=coverage)
    io.open(out_name, 'w', encoding='utf-8', newline='\n').write(head + ''.join(body))
    n = os.path.getsize(out_name)
    leaks = STAFF.findall(io.open(out_name, encoding='utf-8').read())
    print('  %-24s %3d files  %7d bytes  about %2d thousand words  staff emails: %d'
          % (out_name, len(kept), n, n // 6 // 1000, len(leaks)))
    return len(leaks)


def main():
    every = all_ts()
    total = sum(len(io.open(p, encoding='utf-8').read()) for p in every)

    money = [
        'api/src/orders/payments.ts',
        'api/src/orders/commission.ts',
        'api/src/orders/cash.ts',
        'api/src/orders/settlement.ts',
        'api/src/orders/corporate.ts',
        'api/src/orders/till.ts',
        'api/src/orders/liquor.ts',
        'api/src/catalog/verticals.ts',
        'api/src/orders/state_machine.ts',
        'api/src/orders/orders.service.ts',
        'api/src/data-store/repositories/ledger.repo.ts',
        'api/src/orders/money_models.test.ts',
        'api/src/orders/payments.test.ts',
        'api/src/orders/cash.test.ts',
        'api/src/orders/commission.test.ts',
        'api/src/orders/settlement.test.ts',
        'api/src/orders/corporate.test.ts',
        # Added after checking rather than assuming: these nine also touch money.
        # parcel.ts prices a parcel, simulator.service.ts is the ONLY caller of the
        # 75/18 ledger split that contradicts settlement, and seed.ts decides what
        # every amount starts as.
        'api/src/orders/parcel.ts',
        'api/src/simulator/simulator.service.ts',
        'api/src/data-store/seed.ts',
        'api/src/data-store/interfaces.ts',
        'api/src/data-store/repositories/couriers.repo.ts',
        'api/src/data-store/repositories/postgres.repo.stub.ts',
        'api/src/catalog/catalog.service.ts',
        'api/src/dispatch/dispatch.service.ts',
        'api/src/ops/ops.service.ts',
        'api/src/orders/tracking.ts',
    ]

    leaks = 0
    leaks += build('REVIEW-PACK-MONEY.md', money, 'everything that can move money',
                   'It is every file that can move a thebe, with its tests beside it.', total)
    leaks += build('REVIEW-PACK-FULL.md', every, 'the whole engine',
                   'It is every TypeScript file in the engine, source and tests.', total)

    if leaks:
        print('\n  A PACK STILL HOLDS A STAFF EMAIL. Do not send it.')
        return 1
    print('  both packs are clean')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
