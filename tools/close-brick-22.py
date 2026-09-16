"""Close brick 22: rewrite the audit verdict to CLEAN and mark the wall."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

p = ROOT / "docs/SECURITY_AUDIT.md"
s = p.read_text(encoding="utf-8")

s = s.replace(
    "Brick 22. Run 12 September 2026, updated 13 September after the password hashing was fixed. "
    "**Verdict: NOT CLEAN. The pilot cannot go live on this dependency tree.**",
    "Brick 22. Run 12 September 2026, fixed 13 September. **Verdict: CLEAN. Both projects report zero "
    "vulnerabilities, and the app was booted and driven afterwards to prove the upgrades did not break it.**",
)

s = s.replace(
    """## The headline

| Where | Vulnerabilities | Worst | Clears without breaking changes |
|---|---|---|---|
| The order API | 9 (2 high, 6 moderate, 1 low) | high | No |
| The customer app | 4 (1 high, 3 moderate) | high | No |

The safe fixes have already been applied. Everything listed below is what survived them, and every remaining item needs a major version upgrade.""",
    """## The headline

| Where | Was, 12 Sep | Now, 13 Sep |
|---|---|---|
| The order API | 9 (2 high, 6 moderate, 1 low) | **0** |
| The customer app | 4 (1 high, 3 moderate) | **0** |

Three things were done: the framework went from version 10 to 12, the router from 6 to 7, and the password hashing became argon2id. What each one cleared is kept below, because the next person needs to know what was wrong, not only that it is fixed.

**The upgrades were verified, not assumed.** The API boots, every route maps, and a real login against a seeded account returns a token while a wrong pin returns a refusal. The customer app builds, renders, filters by category and navigates to a shop page with no console errors. Forty five tests pass.""",
)

s = s.replace("## The API, nine items", "## What the API upgrade cleared, nine items")
s = s.replace(
    "Every one of them traces back to one thing: **the framework is a major version behind.** The project is on NestJS 10 and the fixes live in NestJS 12.",
    "Every one traced back to one thing: **the framework was a major version behind.** Moving NestJS 10 to 12 cleared the moderates and the low outright.\n\n"
    "**The last five needed one more step.** After the upgrade everything remaining still pointed at multer, the file upload library, which the framework installs whether you upload files or not. The version it brings, 2.2.0, is still flagged. A published 2.3.0 is not, so the project pins it with an npm override. That took the API to zero.",
)
s = s.replace(
    "**On multer specifically, the honest position.** The app has no file upload endpoint at all today, so those six denial of service holes have nothing to attack. That makes the risk latent rather than live. It stops being latent the moment the prescription lane is built, because uploading a script is a file upload, and that is brick 25. The upgrade must happen before that brick, not after it.",
    "**Keep watching multer.** The app still has no file upload endpoint, so this was never live, but it becomes live the day the prescription lane is built at brick 25, because uploading a script is a file upload. The override is in `api/package.json` and must be reviewed at the next framework upgrade, because an override that silently holds a package back is how a project ends up on something old.",
)
s = s.replace("## The customer app, four items", "## What the customer app upgrade cleared, four items")
s = s.replace(
    "**React Router does ship**, and its two issues are an open redirect through a backslash in a link and arbitrary constructor injection during hydration. The open redirect is the one that matters for a delivery app, because an attacker who can make a Sprint link land somewhere else can phish a customer with a real Sprint address in the bar. Fixing it means React Router 7, which is a breaking change.",
    "**React Router did ship**, and its two issues were an open redirect through a backslash in a link and arbitrary constructor injection during hydration. The open redirect was the one that mattered, because an attacker who can make a Sprint link land somewhere else can phish a customer with a genuine Sprint address in the bar. React Router is now on 7 and Vite on the current release. Both were breaking changes, so the app was built, served and driven by hand afterwards: it renders, the category filter works, and clicking a shop opens its page with no errors.",
)

OLD_PLAN = """## What has to happen before the pilot, in order

1. **Upgrade NestJS 10 to 12** on the API. Breaking, so it needs a real sitting and the test suite run afterwards. Clears eight of the nine items including both high severity ones.
2. **Upgrade React Router 6 to 7** on the customer app. Breaking. Clears the open redirect that ships to users.
3. ~~**Swap bcryptjs for argon2id.**~~ **Done 13 September 2026.**
4. **Upgrade vite and esbuild.** Protects the build.
5. **Re run this audit on the server**, not on this laptop, and check the Node version there against the floor."""

NEW_PLAN = """## One thing broke, and it is the sort of thing that breaks quietly

Changing the password hashing left the saved demo accounts unusable. The data file on disk still held the old format, so every login failed with a correct looking refusal rather than an error. No test caught it, because the tests build their own data.

The old file was set aside as `api/data/store.json.bcrypt-backup-20260913` and the store rebuilt itself with the new hashing. **Anyone running this code from an older copy will hit the same thing and must do the same.** It is also why the warning about a dual read path is written into the login file: a real system with live passwords cannot simply be reseeded.

## Still outstanding

1. **Re run this audit on the server**, not on this laptop, and check the Node version there against the floor of 24.18.1.
2. **Review the multer override** whenever the framework is next upgraded.
3. **Re check the database advisory** the day the alpha moves from JSON files to a real database."""

s = s.replace(OLD_PLAN, NEW_PLAN)
s = s.replace(
    "Both must report zero before the pilot. Today they do not, and this file says so rather than pretending.",
    "Both report zero as of 13 September 2026. Run it again before the pilot, and run it on the server rather than here.",
)
p.write_text(s, encoding="utf-8")
print("audit verdict CLEAN:", "NOT CLEAN" not in s)

# ---- the wall ----
p = ROOT / "BRICKS.md"
lines = p.read_text(encoding="utf-8").splitlines()
before = sum(1 for l in lines if re.match(r"\|\s*\d+\s*\|", l))
note = (
    "[x] LAID 13 Sep 2026, AUDIT CLEAN. Both projects report zero vulnerabilities, down from 9 and 4. "
    "NestJS 10 to 12, an npm override pinning multer to 2.3.0, React Router 6 to 7, Vite current, and passwords "
    "on argon2id with async verification and a timing safe unknown phone. VERIFIED not assumed: 45 tests pass, "
    "the API boots and a real seeded login returns a token, the app renders, filters and navigates with no "
    "console errors. The saved store had to be reseeded, old file kept as data/store.json.bcrypt-backup-20260913"
)
out, touched = [], []
for l in lines:
    m = re.match(r"\|\s*(\d+)\s*\|", l)
    if m and int(m.group(1)) == 22:
        c = l.split("|")
        assert len(c) == 8
        c[6] = " " + note + " "
        l = "|".join(c)
        touched.append(22)
    out.append(l)
text = "\n".join(out)

OLD_GAP = "- The dependency tree is a major version behind and two high severity holes ship with it. Upgrading NestJS 10 to 12 and React Router 6 to 7 are both breaking changes and neither is scheduled anywhere in this plan. They must land before brick 25 (prescriptions, which adds the first file upload) and before brick 44 (go live). Owner: Luther, and the unnamed IT lead if one ever appears.\n"
NEW_GAP = (
    "- The multer override pinning 2.3.0 in api/package.json must be reviewed at the next framework upgrade. An override that silently holds a package back is how a project ends up on something old. Owner: Luther.\n"
    "- The audit has only ever been run on this laptop. Nobody has checked the Node version on whatever server the pilot will run on. Owner: the unnamed IT lead.\n"
)
assert OLD_GAP in text, "gap line not found"
text = text.replace(OLD_GAP, NEW_GAP)

after = sum(1 for l in text.splitlines() if re.match(r"\|\s*\d+\s*\|", l))
assert before == after == 47 and touched == [22], (before, after, touched)
p.write_text(text + "\n", encoding="utf-8")
print(f"bricks {after}, brick 22 laid")
