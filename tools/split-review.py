"""Split the whole engine into packs a reviewer cannot silently truncate.

The full pack is fifty five thousand words. Most reviewers will quietly cut that
down and review whatever fits without saying so, which is worse than sending a
short pack, because you believe you sent everything.

So the engine goes out in numbered parts of about ten thousand words each. Every
part carries the same brief, says which number it is out of how many, and LISTS
ITS OWN FILES BY NAME, so the reviewer can be asked to confirm how many of them
it actually read. If that number does not match, the review is of a different
codebase and you find out in one question instead of never.

Files are kept in directory order so related code stays together, and a file is
never split across two parts.

Run:  python tools/split-review.py
"""

import io
import os
import re

PACK_WORDS = 10000
PACK_BYTES = PACK_WORDS * 6
STAFF = re.compile(r'[A-Za-z0-9._%+-]+@sprintcouriers\.co\.bw')

BRIEF = """# Sprint delivery engine, part {i} of {total}

A customer facing delivery platform for Gaborone, Botswana. One app, many kinds of
shop, the way Checkers Sixty60 works: a shop has a KIND and each kind carries its
own rules. A pharmacy needs a pharmacist, a bottle store needs a licence and
trading hours, a pet shop needs neither.

TypeScript on NestJS. 271 tests passing, tsc clean.
Public copy: https://github.com/94luther/sprint-alpha-review

**This is part {i} of {total}.** The engine is split so that nothing gets silently
cut. Review only what is in THIS file. If something here clearly depends on code
you cannot see, say so rather than guessing at it.

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
   over it.

Do not tell me the code is clean. Tell me the failure, the input that causes it,
and what it costs.

## Context that is not in the code

- No merchant has signed anything. Every shop name and price is invented.
- No payment rail is switched on. Cash and on account are the only live ones, and
  every other rail refuses by name rather than pretending to work.
- This is one person's project. There is no team and no production deployment.
- Money is thebe as whole integers. One hundred thebe is one pula.

## The {n} files in THIS part

**When you answer, tell me how many of these you actually read.**

{manifest}

"""


def all_ts(root='api/src'):
    out = []
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for f in sorted(files):
            if f.endswith('.ts'):
                out.append(os.path.join(base, f).replace('\\', '/'))
    return sorted(out)


def main():
    every = all_ts()
    if not every:
        print('  no source found')
        return 1
    total_bytes = sum(os.path.getsize(f) for f in every)

    groups, cur, cur_size = [], [], 0
    for f in every:
        n = os.path.getsize(f)
        if cur and cur_size + n > PACK_BYTES:
            groups.append(cur)
            cur, cur_size = [], 0
        cur.append(f)
        cur_size += n
    if cur:
        groups.append(cur)

    # clear any parts from a previous, differently sized run
    for old in os.listdir('.'):
        if re.match(r'^REVIEW-\d\d-of-\d\d\.md$', old):
            os.remove(old)

    made, leaks = [], 0
    for i, files in enumerate(groups, 1):
        name = 'REVIEW-%02d-of-%02d.md' % (i, len(groups))
        body = []
        for f in files:
            src = STAFF.sub('office@example.com', io.open(f, encoding='utf-8').read())
            body.append('\n---\n\n## %s\n\n```typescript\n%s\n```\n' % (f, src.rstrip()))
        manifest = '\n'.join('%d. `%s`' % (k, f) for k, f in enumerate(files, 1))
        head = BRIEF.format(i=i, total=len(groups), n=len(files), manifest=manifest)
        io.open(name, 'w', encoding='utf-8', newline='\n').write(head + ''.join(body))
        leaks += len(STAFF.findall(io.open(name, encoding='utf-8').read()))
        made.append((name, len(files), os.path.getsize(name)))

    for name, nfiles, nbytes in made:
        print('  %-22s %2d files  %6d bytes  about %2d thousand words'
              % (name, nfiles, nbytes, nbytes // 6 // 1000))

    covered = sum(n for _, n, _ in made)
    ok = covered == len(every)
    print('  %d files across %d parts, against %d in the engine: %s'
          % (covered, len(made), len(every),
             'every file is in exactly one part' if ok else 'MISMATCH, do not send these'))

    rows = ['# Review checklist, the whole engine', '',
            'Send one part per conversation. After each one, ask the reviewer how many',
            'files it actually read and write the number in the third column. If it does',
            'not match the second, the review is of a different codebase than you have.',
            '',
            '| Part | Files it holds | Files it says it read | Findings |',
            '| --- | --- | --- | --- |']
    for name, nfiles, _ in made:
        rows.append('| %s | %d |  |  |' % (name, nfiles))
    rows += ['', 'Total files in the engine: %d' % len(every)]
    io.open('REVIEW-CHECKLIST.md', 'w', encoding='utf-8', newline='\n').write('\n'.join(rows) + '\n')
    print('  REVIEW-CHECKLIST.md written, one row per part')

    if leaks:
        print('\n  A PART HOLDS A STAFF EMAIL. Do not send it.')
        return 1
    if not ok:
        return 2
    print('  all parts clean')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
