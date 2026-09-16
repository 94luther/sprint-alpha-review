"""Checkpoint after brick 22: update STATE.md and HANDOFF.md to the current truth."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

s = ROOT / "STATE.md"
t = s.read_text(encoding="utf-8")
t = t.replace("# Sprint delivery app — STATE (2026-09-13, 01:40)", "# Sprint delivery app — STATE (2026-09-13, 02:30)")
t = t.replace("- 8 laid and verified, 10 in motion", "- 9 laid and verified, 9 in motion")
t = t.replace(
    "(7, 8, 9, 10, 11, 13, 15, 18, 22, 30), 29 not started.",
    "(7, 8, 9, 10, 11, 13, 15, 18, 30), 29 not started. Brick 22 was LAID 13 Sep: both projects now report ZERO vulnerabilities.",
)
t = t.replace(
    "ARGON2ID IS DONE (13 Sep): passwords are argon2id at 19456 KiB and two iterations, verification is async, an unknown phone costs the same time as a wrong pin, bcryptjs is removed from the project, and 9 auth tests cover it. The audit is still NOT clean and the rest cannot be fixed without breaking upgrades.",
    "DONE 13 Sep, the audit is CLEAN. Both projects report ZERO vulnerabilities, from 9 and 4. NestJS 10 to 12, an npm override pinning multer to 2.3.0, React Router 6 to 7, Vite current, passwords on argon2id with async verification and a timing safe unknown phone. Verified by booting the API (a real seeded login returns a token) and driving the app in a browser (renders, filters, navigates, no console errors). 45 tests pass.",
)
t = t.replace("Two upgrades remain and neither is scheduled.", "")
t = t.replace(
    "Brick 22's remaining work is TWO breaking upgrades, NestJS 10 to 12 and React Router 6 to 7, each its own sitting. Run every test with `npm --prefix api test`.",
    "Brick 22 is finished. Run every test with `npm --prefix api test`. Serve the built app with the `sprint-delivery-app` entry in Desktop\\.claude\\launch.json.",
)
t = t.replace(
    "## Watch this",
    """## Watch this
- The old data store held bcrypt password hashes and had to be reseeded after the argon2id swap, otherwise every demo login failed with a correct looking refusal that no test caught. Old file kept as api/data/store.json.bcrypt-backup-20260913. Anyone running this from an older copy must do the same.
- api/package.json now carries an npm override pinning multer to 2.3.0. Review it at the next framework upgrade.""",
)
s.write_text(t, encoding="utf-8")

h = ROOT / "HANDOFF.md"
x = h.read_text(encoding="utf-8")
x = x.replace("updated 13 September 01:40", "updated 13 September 02:30")
x = x.replace(
    "**8 laid and machine verified. 10 in motion. 29 not started.**",
    "**9 laid and machine verified. 9 in motion. 29 not started.**",
)
x = x.replace(
    "| 22 | Security audit, docs/SECURITY_AUDIT.md, **argon2id swap done** | Still NOT CLEAN, 13 findings, two breaking upgrades left |",
    "| 22 | **Security floor, docs/SECURITY_AUDIT.md** | **LAID. Both projects at ZERO vulnerabilities, verified by booting and driving the app** |",
)
OLD = """1. **Upgrade NestJS 10 to 12** in `api`. Breaking. Clears eight of the nine API findings including both high severity ones, and it must land before brick 25, which adds the first file upload and makes the six latent multer holes live. Run `npm --prefix api test` afterwards; there are 45 tests and they should all still pass.
2. **Upgrade React Router 6 to 7** in `web`. Breaking. Clears an open redirect that reaches customers, which is the one an attacker would use to phish with a genuine Sprint address in the bar.

**The argon2id swap is DONE** (13 Sep). Passwords are argon2id at 19456 KiB and two iterations, verification is async, an unknown phone costs the same time as a wrong pin, and bcryptjs is out of the project. Nine auth tests cover it."""
NEW = """**Everything in the engine that does not need a person is now done.** Bricks 14, 16 and 22 are laid. The remaining bricks all wait on Barbara, Snowy, the medicines regulator or the three payment companies, and every one of those has been asked.

When the answers land, work them in this order:

1. **Barbara agrees the fault model** (brick 15) and it stops saying proposed. That unblocks brick 19, merchants paid the same day, which is the next thing on the critical path.
2. **The mobile money rates arrive** (brick 10). Save each reply as `docs/compliance/payments/reply_<company>.pdf` or `.md`; the proof counts files named `reply_*` and nothing else. Then brick 12, the profit model, becomes real arithmetic instead of a guess.
3. **BoMRA answers** (brick 8). Save it as `docs/compliance/BOMRA_REPLY.pdf`. That opens bricks 25 and 40, the whole medicine lane.
4. **Snowy sends the insurance** (brick 13). File anything under `docs/compliance/insurance_*`. Read the exclusions page before anybody promises to carry a medicine.

If none of that has landed, the honest answer is that the wall is waiting, and the useful work is elsewhere."""
x = x.replace(OLD, NEW)
x = x.replace(
    "Start with NestJS. Bricks 14 and 16 are laid and the argon2id swap is done, so nothing else in the engine can move without a person answering.",
    "",
)
x = x.replace(
    "3. **The dependency tree is a major version behind and two high severity holes ship with it.** Neither upgrade is scheduled anywhere in the plan. Both must land before brick 25, which adds the first file upload and makes the latent multer holes live, and before brick 44, go live.",
    "3. **Changing the password hashing silently broke every saved login** until the data store was reseeded, and no test caught it because tests build their own data. Old file kept as `api/data/store.json.bcrypt-backup-20260913`.",
)
x = x.replace(
    "- Never mail Michelle directly. Everything routes through Barbara, Wame, Lucy or Snowy.",
    "- Never mail Michelle directly. Everything routes through Barbara, Wame, Lucy or Snowy.\n"
    "- Verify an upgrade by running the thing, not by reading a version number. The framework upgrade only counted once the API booted and a real login returned a token, and the router upgrade only counted once a shop page opened in a browser.",
)
h.write_text(x, encoding="utf-8")
print("state and handoff updated")
