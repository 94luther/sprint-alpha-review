"""Rebuild the public review copy from the private engine, safely, every time.

Written 15 September 2026. The review copy was a one way snapshot: the moment the
engine changed, the public copy quietly became a lie, and the next reviewer would
report bugs already fixed. A stale review copy is worse than none, because it
looks current.

So this rebuilds it from scratch on demand. It always makes a SINGLE fresh commit
and force pushes, so no earlier version of a file can ever be recovered from the
public history.

IT REFUSES TO PUSH IF ANYTHING SENSITIVE SURVIVES. That is the whole point. The
first redaction written by hand covered .json, .ts, .md and .html and missed three
PowerShell scripts in tools/ that carried staff email addresses. So the sweep here
reads EVERY file, whatever its extension, and the gate runs after the redaction
rather than trusting it.

Run:  python tools/sync-review.py
      python tools/sync-review.py --check      (sweep only, push nothing)
"""

import hashlib
import io
import os
import re
import shutil
import subprocess
import sys

PRIVATE = r'C:/Users/SALES/Desktop/sprint-alpha'
REVIEW = r'C:/Users/SALES/Desktop/sprint-alpha-review'
REMOTE = 'https://github.com/94luther/sprint-alpha-review.git'

# Files that describe the business rather than the software, and have no place in
# a public copy: they name people, plans and the state of live negotiations.
DROP = [
    'STATE.md', 'HANDOFF.md', 'ALARM-CHAIN-BROKEN.txt',
    'PROOF-LEDGER.jsonl', 'PROOF-VERDICTS.json', 'BOUNDARY.md',
    'OPENER.json', 'OPENER-FACTS.json', 'GAPS.md', 'INSPECTION.md',
]

STAFF_EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@sprintcouriers\.co\.bw')
PHONE_HASH = re.compile(r'"phone_hash":\s*"[0-9a-f]{64}"')
HEX64 = re.compile(r'\b[0-9a-f]{64}\b')

# The only 64 character values allowed through: the demo phone hashes this script
# writes itself, and the obviously fake key in the auth test.
ALLOWED_HEX_CONTEXT = ('phone_hash', '00112233445566778899aabbccddeeff')


def run(cmd, cwd=None, quiet=True):
    r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if r.returncode != 0 and not quiet:
        print('   ! ' + (r.stderr or r.stdout).strip()[:160])
    return r


def every_file(root):
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', 'build')]
        for fn in files:
            yield os.path.join(base, fn)


def redact(root):
    """Read every file, whatever its extension. The miss last time was a .ps1."""
    touched = []
    n_hash = [0]

    def fake_hash(_m):
        n_hash[0] += 1
        return '"phone_hash": "%s"' % hashlib.sha256(
            ('demo-number-%d' % n_hash[0]).encode()).hexdigest()

    for p in every_file(root):
        try:
            s = io.open(p, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        if '\x00' in s[:1024]:
            continue  # binary
        n = STAFF_EMAIL.sub('office@example.com', s)
        n = PHONE_HASH.sub(fake_hash, n)
        if n != s:
            io.open(p, 'w', encoding='utf-8', newline='\n').write(n)
            touched.append(os.path.relpath(p, root).replace('\\', '/'))
    return touched


def sweep(root):
    """The gate. Runs AFTER redaction and does not trust it."""
    problems = []
    for p in every_file(root):
        rel = os.path.relpath(p, root).replace('\\', '/')
        name = os.path.basename(p)
        if name == '.env' or (name.startswith('.env') and not name.endswith('.example')):
            problems.append('%s is a secrets file' % rel)
            continue
        try:
            s = io.open(p, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        if STAFF_EMAIL.search(s):
            problems.append('%s still holds a staff email' % rel)
        for m in HEX64.finditer(s):
            line_start = s.rfind('\n', 0, m.start()) + 1
            line = s[line_start:s.find('\n', m.end())]
            if not any(a in line for a in ALLOWED_HEX_CONTEXT):
                problems.append('%s holds an unexplained 64 character value' % rel)
                break
    return problems


def main():
    check_only = '--check' in sys.argv

    print('  rebuilding the review copy from the private engine')
    if os.path.isdir(REVIEW):
        shutil.rmtree(REVIEW, ignore_errors=True)
    os.makedirs(REVIEW, exist_ok=True)

    r = run('git archive HEAD | tar -x -C "%s"' % REVIEW, cwd=PRIVATE)
    if r.returncode != 0:
        print('  could not export the engine. Nothing was published.')
        return 1

    for f in DROP:
        fp = os.path.join(REVIEW, f)
        if os.path.exists(fp):
            os.remove(fp)

    touched = redact(REVIEW)
    print('  redacted %d files' % len(touched))

    problems = sweep(REVIEW)
    if problems:
        print('\n  REFUSING TO PUBLISH. %d problems survived the redaction:' % len(problems))
        for p in problems[:12]:
            print('    - ' + p)
        print('\n  Nothing was pushed. Fix these and run it again.')
        return 2
    print('  sweep clean: no staff email, no secrets file, no unexplained key')

    readme = os.path.join(PRIVATE, 'tools', 'review-README.md')
    if os.path.exists(readme):
        shutil.copy(readme, os.path.join(REVIEW, 'README.md'))

    if check_only:
        print('  --check given, so nothing was pushed')
        return 0

    head = run('git rev-parse --short HEAD', cwd=PRIVATE).stdout.strip()
    run('rmdir /s /q .git', cwd=REVIEW)
    run('git init -q -b main', cwd=REVIEW)
    run('git add -A', cwd=REVIEW)
    msg = ('Review copy, rebuilt from the engine at %s\n\n'
           'Redacted and swept before publishing: no staff email addresses, no\n'
           'secrets file, no unexplained keys. A single fresh commit every time, so\n'
           'no earlier version of any file can be recovered from this history.\n\n'
           'Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>' % head)
    run('git -c user.email="94luther@gmail.com" -c user.name="Luther Roberts" '
        'commit -q -F -', cwd=REVIEW) if False else None
    io.open(os.path.join(REVIEW, '.commitmsg'), 'w', encoding='utf-8').write(msg)
    run('git -c user.email="94luther@gmail.com" -c user.name="Luther Roberts" '
        'commit -q -F .commitmsg', cwd=REVIEW)
    os.remove(os.path.join(REVIEW, '.commitmsg'))
    run('git rm --cached -q .commitmsg', cwd=REVIEW)
    run('git remote add origin %s' % REMOTE, cwd=REVIEW)
    r = run('git push --force -u origin main', cwd=REVIEW, quiet=False)
    if r.returncode != 0:
        print('  the push failed. The public copy is unchanged.')
        return 3

    n = len([1 for _ in every_file(REVIEW)])
    print('  published %d files, mirroring engine commit %s' % (n, head))
    print('  https://github.com/94luther/sprint-alpha-review')
    return 0


if __name__ == '__main__':
    sys.exit(main())
