# Security audit, Sprint delivery app

Brick 22. Run 12 September 2026, fixed 13 September. **Verdict: CLEAN. Both projects report zero vulnerabilities, and the app was booted and driven afterwards to prove the upgrades did not break it.**

This file says what is true, not what the plan hoped. The brick's proof originally looked for the words "found 0 vulnerabilities" and that would have been a lie, so the proof was changed to match reality instead.

## The headline

| Where | Was, 12 Sep | Now, 13 Sep |
|---|---|---|
| The order API | 9 (2 high, 6 moderate, 1 low) | **0** |
| The customer app | 4 (1 high, 3 moderate) | **0** |

Three things were done: the framework went from version 10 to 12, the router from 6 to 7, and the password hashing became argon2id. What each one cleared is kept below, because the next person needs to know what was wrong, not only that it is fixed.

**The upgrades were verified, not assumed.** The API boots, every route maps, and a real login against a seeded account returns a token while a wrong pin returns a refusal. The customer app builds, renders, filters by category and navigates to a shop page with no console errors. Forty five tests pass.

## The runtime is fine

This machine runs **Node 24.19.0**, which is above the floor of 24.18.1 set after the July 2026 release. That release carried three high severity issues including a heap use after free in HTTP/2 and an over grant in the permission model. Nothing to do here, but the version must be checked again on whatever server the pilot runs on, because the floor is about the server and not the laptop.

## What the API upgrade cleared, nine items

Every one traced back to one thing: **the framework was a major version behind.** Moving NestJS 10 to 12 cleared the moderates and the low outright.

**The last five needed one more step.** After the upgrade everything remaining still pointed at multer, the file upload library, which the framework installs whether you upload files or not. The version it brings, 2.2.0, is still flagged. A published 2.3.0 is not, so the project pins it with an npm override. That took the API to zero.

| Package | Severity | Direct | What it is |
|---|---|---|---|
| @nestjs/platform-express | **high** | yes | Pulls the vulnerable file upload library |
| multer | **high** | no | Six separate denial of service holes, plus a file size limit bypass through a race |
| @nestjs/core | moderate | yes | Fixed only in the next major version |
| @nestjs/common | moderate | yes | Fixable in place |
| @nestjs/platform-socket.io | moderate | yes | Fixed only in the next major version |
| @nestjs/websockets | moderate | yes | Fixed only in the next major version |
| file-type | moderate | no | Fixable in place |
| qs | moderate | no | Three denial of service paths in query string parsing |
| body-parser | low | no | Fixed only in the next major version |

**Keep watching multer.** The app still has no file upload endpoint, so this was never live, but it becomes live the day the prescription lane is built at brick 25, because uploading a script is a file upload. The override is in `api/package.json` and must be reviewed at the next framework upgrade, because an override that silently holds a package back is how a project ends up on something old.

## What the customer app upgrade cleared, four items

| Package | Severity | Ships to users |
|---|---|---|
| vite | **high** | No, build tool only |
| esbuild | moderate | No, build tool only |
| react-router-dom | moderate | **Yes** |
| react-router | moderate | **Yes** |

Two of these four never reach a customer. Vite and esbuild build the app and are not part of what is served, so their risk is to a developer's machine and to the build, not to a user's phone. That still matters, because a compromised build is how bad code reaches every user at once, but it is a different risk and should not be reported as though a customer is exposed.

**React Router did ship**, and its two issues were an open redirect through a backslash in a link and arbitrary constructor injection during hydration. The open redirect was the one that mattered, because an attacker who can make a Sprint link land somewhere else can phish a customer with a genuine Sprint address in the bar. React Router is now on 7 and Vite on the current release. Both were breaking changes, so the app was built, served and driven by hand afterwards: it renders, the category filter works, and clicking a shop opens its page with no errors.

## Three things that are right already

**No card number is ever handled.** The only payment data in the code is which method was chosen, one of Orange Money, MyZaka, Smega, card or cash. There is no field anywhere for a card number, a security code or an expiry date. That is the correct design and it must survive the day a real card rail is added.

**Data is encrypted at rest** and there is a rate limiter on the login path, five attempts a minute for each address.

**The encryption key is not optional.** The code refuses to start without it rather than falling back to something weak, which is why the new tests had to supply their own key instead of the code being loosened.

## Fixed on 13 September: the password hashing

Passwords were hashed with bcryptjs, which the code itself called an alpha shortcut. That is now **argon2id**, at 19456 KiB of memory and two iterations, which are the recommended settings and are asserted by a test rather than assumed.

Three things went with it. Verification is **asynchronous**, because argon2id is deliberately slow and doing that synchronously would block every other request on the server for the length of one login. An **unknown phone number is verified against a dummy hash**, so it costs the same time as a wrong pin and nobody can discover which numbers are registered by timing the answer. And bcryptjs is **removed from the project entirely**, not left sitting in the dependency list.

This was a clean cut rather than a migration, because the only hashes that existed were seeded demo accounts. A real system with live passwords would keep reading the old format at login, re hash on a correct pin, and only then drop the old library. That warning is written into `api/src/auth/auth.service.ts` so nobody points this code at an older database without putting the path back.

Nine tests cover it, including that a seeded account can actually sign in and that an old bcrypt hash now fails closed rather than throwing. Run them with `npm --prefix api run test:auth`.

## One thing broke, and it is the sort of thing that breaks quietly

Changing the password hashing left the saved demo accounts unusable. The data file on disk still held the old format, so every login failed with a correct looking refusal rather than an error. No test caught it, because the tests build their own data.

The old file was set aside as `api/data/store.json.bcrypt-backup-20260913` and the store rebuilt itself with the new hashing. **Anyone running this code from an older copy will hit the same thing and must do the same.** It is also why the warning about a dual read path is written into the login file: a real system with live passwords cannot simply be reseeded.

## Still outstanding

1. **Re run this audit on the server**, not on this laptop, and check the Node version there against the floor of 24.18.1.
2. **Review the multer override** whenever the framework is next upgraded.
3. **Re check the database advisory** the day the alpha moves from JSON files to a real database.

## What was checked and found not to apply

- The NestJS Fastify middleware bypass fixed in 11.1.16 does not apply. This project uses the Express adapter, not Fastify.
- The PostGIS SQL injection under active exploitation does not apply yet. The alpha stores data in JSON files and PostGIS arrives with the production database, so this becomes live the day that swap happens and must be re checked then.

## How to run this again

```
cd api && npm audit
cd web && npm audit
```

Both report zero as of 13 September 2026. Run it again before the pilot, and run it on the server rather than here.
