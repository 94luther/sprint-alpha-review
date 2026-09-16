# Sprint Next-Level Gap Analysis and Spec

Scope: this is the flow, conversion, and trust layer, not the visual layer. Visual polish
(map v2, tracking hero, skeletons, motion) is already scoped in `visual-upgrade-spec.md` and
is not repeated here. Grounded in live field recon of Wanzy, Gabs Eats, Zesta, and Yamee, a
50-point structured teardown of Amazon/Uber Eats/DoorDash/Glovo/Bolt Food plus Baymard and
NN/G research, a cutting-edge tech sweep across 7 lanes, and a read of the real code in
`web/src/pages` and `web/src/lib`.

## 1. The bar: moments that decide winners

| Moment | Wanzy | Gabs Eats | Zesta | Amazon | Uber Eats | Sprint's answer |
|---|---|---|---|---|---|---|
| Browse before signup | Guest catalog, vendor pages, and cart all work with no login | Zero web catalog, app install required before seeing anything, hardest wall observed | Site down, wall does not currently exist | Full browse and cart as guest, account asked only at payment | Full guest checkout, email plus phone plus card | Gap: the whole web app sits behind `RequireAuth` in `App.tsx`, so `/`, `/merchant/:id`, and even the empty cart are unreachable without visiting Login first. Behind Wanzy today. Fix: let those three routes render for guests, gate only order placement on auth. |
| ETA honesty | Markets 30 min, April 2026 reviews report near 2 hr, a broken promise | Pitches roughly 15 min on an electric fleet and route optimization story, unverified independently | No live SLA, dead site | Wide window far out, narrows to 30 min by delivery day, states confidence not implying it | Dynamic ETA plus a separate hard "latest arrival by" deadline shown together | Already ahead: `Track.tsx`'s `etaPillParts` ships the honest wide-then-narrow pattern. Gap: no hard arrive-by deadline distinct from the soft ETA pill, add one line next to it. |
| Live tracking map | Not reachable this session, closed test store blocked checkout | App-only, unverified on web | n/a | Map activates only within the final 10 stops, saves render cost and builds anticipation | Live proximity map plus staged push at each leg | `GaboroneMap.tsx` already renders continuously and `visual-upgrade-spec.md` P1 adds an interpolated blip. Gap: no stops-away trigger for when the map zooms in, worth adding to protect paint budget on low-end phones. |
| Search and discovery | Location field present, no autocomplete dropdown appeared when typed into | None, app-only | n/a | Autocomplete ranked by order history, time of day, item level | Same, plus restaurant-level ranking | Confirmed gap: `CustomerHome.tsx` has zero search input and zero category or dietary filter chips today, just a plain merchant grid. Biggest catalog gap of the nine rows here. |
| Item modifiers, running total | Not observed, checkout unreachable | n/a | n/a | n/a | n/a (DoorDash: nested modifiers, live price update, gate on required groups) | `Merchant.tsx` cart drawer adds flat qty-only lines, no modifier data in `types.ts`. Low urgency for today's catalog complexity, flag as beta not now. |
| Fee and minimum-order transparency | Min-order shown on vendor page | n/a | n/a | n/a | n/a (Baymard/DoorDash: itemized fees, minimum-order nudge with cross-sell) | Gap: `Checkout.tsx`'s summary card shows item lines and a flat total only, no delivery fee, service fee, or minimum-order line anywhere. Undisclosed fees erode trust more than disclosed ones. |
| Payment method trust | Unconfirmed, checkout unreachable | Publishes the exact rail list on a public `/technology` page: DPO Pay, Visa, Mastercard, FNB, MyZaka, Orange Money, Smega, cash | n/a | n/a | n/a | On par already: `PAYMENT_METHODS` in `Checkout.tsx` lists Orange Money, MyZaka, Smega, card, cash. Gap is only that it is not published publicly the way Gabs Eats does; transparency itself is the differentiator per the recon. |
| Reorder and loyalty | Not observed | n/a | n/a | n/a | One-tap reorder button, tier progress bar | Confirmed gap: no order history or reorder surface exists anywhere in the app. Real but scale-phase, not urgent for a handful of alpha merchants. |
| Support channel | WhatsApp link on the homepage, phone/email otherwise, no bot | Unclear from public site | n/a | n/a | n/a | Sprint's own roadmap already centers WhatsApp as the first ordering channel (research digest section A). Shipping WhatsApp Flows checkout turns support parity into an ordering-channel lead over Wanzy's link-only approach. |

## 2. Where competitors are beatable

- Two of four competitors have a currently dead or abandoned digital presence: Zesta's site
  returns "This deployment is temporarily paused" on every path, and Yamee's two domains are
  both unreachable with a Facebook page showing "Closed now" and no post since July 2023. This
  is an open market window right now, not just a UX comparison.
- Wanzy's white-label Deonde backend produces real integrity failures: one live vendor's full
  menu rendered "No Item Found" despite categories listing, and the location search field
  showed no autocomplete suggestions when typed into. Both are simple, fixable moments Sprint
  can just not repeat.
- Wanzy's own Play Store listing flags "Data isn't encrypted" in its data-safety section, and
  April 2026 reviews report deliveries near 2 hours against a 30-minute promise. Both are
  provable, statable counter-claims (true encryption posture, honest SLA already matching
  `Track.tsx`'s wide-to-narrow ETA pattern) rather than vague "we're better" marketing.
- Gabs Eats has zero web ordering: every call to action links out to an app store, meaning
  nobody without the app already installed can browse anything. This is the largest funnel-top
  gap among all four, and a PWA that is browsable before install beats it directly.
- None of the four competitors gate browsing behind a signup wall anywhere web ordering exists
  at all (Wanzy). Guest browsing is table stakes, not a differentiator, which makes Sprint's
  current fully-authenticated web app (Section 1, row 1) the single highest-priority fix here.
- Every observed competitor tops out at phone, WhatsApp link, or email for support, with no
  in-chat bot or flow. Sprint's planned WhatsApp-first channel can be shipped as an ordering
  path, not just a support link, and lead on this axis instead of merely matching it.

## 3. Cutting-edge shortlist

Ranked by impact times feasibility for Sprint's actual stack (TypeScript PWA today, WhatsApp
Business API, React Native planned later), respecting the data-light constraint for
low-bandwidth Botswana use and the existing ~30KB gzip budget philosophy from
`visual-upgrade-spec.md`.

**Adopt now**
- Web Push with rich progress plus PWA Badging API: pure browser standards, near-zero byte
  cost, wires directly to the `order_status` socket event `Track.tsx` already listens for.
  Route: a small Service Worker push handler plus `navigator.setAppBadge()` on status change.
- `beforeinstallprompt` custom install button: standard event, tiny handler. Route: capture in
  `main.tsx`, surface a dismissible install chip in `AppHeader.tsx`, this is Sprint's direct
  counter to Gabs Eats' app-only wall while still keeping guest web browsing open.
- WhatsApp Flows checkout template plus a Paystack/Flutterwave webhook: matches the stack
  already chosen in the research digest ("WhatsApp channel first"). A Sefamerve case study
  reports 35% higher conversion and 23% fewer abandoned carts from this exact pattern. Route:
  mirror `Checkout.tsx`'s address/payment/total fields inside a Flow, post to the same
  order-create endpoint.
- Cache-first precache for static assets: standard Service Worker pattern, adds one small SW
  file, does not touch the app bundle. Route: Workbox or a hand-written precache list for the
  map, icons, and JS chunks.
- WhatsApp per-message billing (effective Oct 1 2026): not a feature, a cost input. Rate it
  into the cost model now, before WhatsApp order volume scales, tiering conversational versus
  marketing message types.

**Beta**
- Offline payment queue via IndexedDB: high relevance given the research digest's own
  offline-first mandate ("must work on 3G"). Half the plumbing already exists via
  `newIdempotencyKey()` in `lib/api.ts`. Route: queue the `createOrder` payload keyed by that
  same idempotency key, retry automatically on the browser's `online` event.
- Background Sync: Chromium-only, 0% Safari support, so usable only as progressive enhancement
  with a manual-retry fallback path for iOS.
- iOS Live Activities and Android 16 Live Updates: both need a native or React Native bridge,
  so they wait for Sprint's planned React Native phase rather than the current PWA.
- DoorDash-style AI ordering assistant (chat or photo to cart): real engagement gain shown by
  DoorDash Ask and Uber Eats Cart Assistant, but pilot it on the WhatsApp channel first, where
  images and audio never touch the PWA's own byte budget.

**Scale phase**
- On-device reorder prediction and fraud scoring (TensorFlow Lite, ExecuTorch): needs order
  history volume the alpha does not have yet. Server-side rule checks (GPS-delta sanity, ghost-
  delivery flags) are the right substitute today, consistent with "deterministic tools before
  any model."
- Proprietary route-optimization AI (Amazon Wellspring, IKEA's Locus acquisition): far beyond
  alpha scope; the research digest's own OSRM-based open-source alternative already covers this
  ground better for Sprint's size.
- WhatsApp Pay in Africa: 0% availability as of December 2025, do not build toward it, keep
  Paystack/Flutterwave as the real rail.

**Budget flag.** MapLibre GL JS, MapLibre-rs, and MapGPU are all GPU vector-tile renderers built
for real street-level routing, and every one requires a new runtime dependency well over the
30KB gzip budget. This directly conflicts with `visual-upgrade-spec.md`'s locked decision to
keep `GaboroneMap.tsx` as hand-rolled SVG with zero new dependencies (its own Section 6 non-goal
list rules out exactly this). None of these are recommended even at scale phase unless Sprint
someday needs true GPS street routing beyond the current hand-drawn Gaborone demo map, and even
then the decision should be revisited deliberately, not adopted by default because the tech
exists.

## 4. Adversarial checklist

Twenty-five yes/no questions a hostile reviewer should run against the live app, each tied to a
finding above. Use this list to drive the red-team pass.

1. Can a first-time visitor browse merchants and see a full menu without creating an account?
2. Does any screen during an active order sit with zero motion, zero color change, and zero
   moving number for more than three seconds?
3. If a merchant's menu call fails or returns empty, does the UI say so honestly instead of
   silently rendering a blank list?
4. Does typing into any location or search field produce live suggestions, or nothing at all?
5. Is there a search or filter control anywhere on the merchant catalog screen today?
6. Does checkout disclose a delivery fee and a service fee as separate line items before the
   final "Place order" tap, or only a bare item total?
7. Is a minimum order value shown, and does the cart nudge toward it with a suggestion rather
   than a silent block?
8. Does the pre-assignment ETA ever claim more precision than the data supports?
9. Once a courier is assigned, is there a hard "arrive by" deadline shown separately from the
   soft rolling ETA?
10. If the real delivery time will exceed the number shown at order time, does anything warn
    the customer before it happens, or only after?
11. Does the tracking map show a live position update, or does the courier dot only move on a
    full page refresh?
12. Is a timestamped delivery-proof photo captured and shown to the customer at drop-off?
13. Can a customer message their courier without either party's real phone number being
    exposed?
14. Does the on-screen payment method list match, exactly, what is wired up server-side?
15. Is the accepted payment method list published anywhere public, or only discovered at
    checkout?
16. If WhatsApp is offered as an ordering path, does it complete a full order inside the chat,
    or does it just link out to the web app?
17. Does the app ever silently drop a typed character, misalign on a 360 to 390px screen, or
    clip the logo?
18. Is there a visible PWA install prompt, or must a returning customer remember the URL every
    time?
19. If the network drops mid-checkout, does the order attempt queue and retry automatically, or
    is the cart lost?
20. Does a repeat customer have any one-tap way to reorder their last order?
21. Is any visible signal, rating, review count, or hours, shown on the merchant card before
    tapping in, given the data model already carries a rating field?
22. Does the age-gate for restricted items ask for proof once per session, or interrupt every
    single time?
23. If a store is closed, does the UI say so before the customer builds a full cart, or only
    reject the order at the end?
24. Does any screen rely on color alone to signal status, with no icon, text, or pattern
    backing it up?
25. Is the payout split (merchant, courier, Sprint) ever shown outside the Ops or courier view,
    or does the transparency stop at internal roles only?

## 5. Blueprint deltas

- Add a "competitor interface reality" subsection to the blueprint's competitive landscape,
  replacing marketing-page assumptions with the field recon's DOM-level findings: Wanzy runs on
  the white-label Deonde platform not custom tech, and Zesta and Yamee are currently dead or
  dormant, a live entry window, not just a UX gap.
- Add guest browsing before login as a P0 platform requirement in the blueprint's MVP scope; the
  app currently sits fully behind auth, which is behind Wanzy's weakest showing, not ahead of
  it.
- Add a WhatsApp Flows in-chat checkout milestone to the roadmap, not just a support link,
  positioned against every competitor's link-out-only WhatsApp presence and timed against the
  Oct 1 2026 per-message billing change.
- Add an explicit encryption-posture counter-claim to the trust and security section, since
  Wanzy's own Play Store listing flags "Data isn't encrypted," an easy, honest, provable
  advantage to state plainly.
- Add delivery-fee transparency, a minimum-order nudge, and a hard arrive-by deadline as UX
  requirements sourced from the Baymard and DoorDash teardown evidence, distinct from the
  game-HUD visual layer already covered in `visual-upgrade-spec.md`.
- Record MapLibre and WebGPU map tech as explicitly rejected for the alpha stack, since both
  conflict with the SVG-only, zero-new-dependency, 30KB-budget map decision already locked into
  `visual-upgrade-spec.md`; revisit only if real street-level GPS routing is ever required
  beyond the Gaborone demo map.
