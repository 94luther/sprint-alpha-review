# Sprint Alpha Visual Upgrade Spec

Grounded in the real files in `web/src`: `GaboroneMap.tsx`, `AppHeader.tsx`, `ScoreBars.tsx`,
`StatusTimeline.tsx`, `ThemeToggle.tsx`, `Login.tsx`, `CustomerHome.tsx`, `Merchant.tsx`,
`Checkout.tsx`, `Track.tsx`, `Courier.tsx`, `Ops.tsx`, `styles/tokens.css`, `styles/app.css`.

## 1. Design thesis

The live delivery experience is the product, so it should feel like the HUD of a game you
trust, not a form you filled in. The map is the hero: near-black ground, glowing arterial
roads, a courier blip that breathes and points where it is going, benchmarked against GTA
and Death Stranding rather than a generic tile map [game-maps]. Every state change gets the
Rule of Three (motion, color, a number that moves) so the app reads as alive at a glance, the
way Domino's tracker and Uber Eats' animated stages do [delivery-ux]. All of it stays inside
Sprint's own palette and skew signature, ships under the 30KB budget, and holds 60fps on a
Snapdragon 665 by animating only transform and opacity [techniques].

## 2. Prioritized upgrade table

| Upgrade | Screen / component | What exactly changes | Technique | Benchmark | Effort |
|---|---|---|---|---|---|
| P1 Map v2 ground and roads | `GaboroneMap.tsx`, `--map-ground/--map-road*` | Near-black ground fill, two-layer glow on the two strong avenues (`.gmap-road-strong`), block fills get a soft top-light gradient for depth | SVG stroke layering instead of `feGaussianBlur` for cheap glow | Dark desaturated ground, high-contrast route lines [game-maps] | M |
| P1 Animated route draw | `GaboroneMap.tsx` `.gmap-route` | Route line draws in on mount/courier-change instead of just dash-scrolling; `stroke-dasharray/dashoffset` reveal over 500-700ms then hands off to the existing flow animation | `getTotalLength()` + `stroke-dashoffset` keyframe, CSS only | Cinematic route reveal [game-maps]; dash-offset draw-in [techniques] | S |
| P1 Interpolated courier blip with heading | `GaboroneMap.tsx`, `Track.tsx`, `Ops.tsx` | Blip glides between poll updates instead of snapping; a small heading wedge rotates to face the direction of travel | `requestAnimationFrame` lerp on a `ref`-held position, `transform` only, no React re-render per frame | Live map dot, 30-60s smooth update cadence [delivery-ux]; rAF lerp on refs [techniques] | M |
| P1 Fix blue grocery badge | `app.css` `.badge-grocery`, `.merchant-card-top.grocery`, `Login.tsx` `QUICK_USERS` ops dot | Replace `#6db8ff` badge and `#2c5f8a` card gradient with an ink/bone neutral chip plus the orange accent for the "18+" family instead of a new hue; replace the ops quick-chip dot `#6db8ff` with `--orange` | Token swap only, zero new colors | Brand rule: no blue anywhere | S |
| P1 Fix login logo clipping | `Login.tsx` `.login-logo`, `app.css` | Give the logo row `flex-shrink: 0` on the image, add `min-width: 0` and `overflow-wrap` on the text column, verify at 360-390px width so "Sprint" never crowds the mark | Layout-only CSS fix, no visual redesign | Typography legibility on dynamic backgrounds [game-maps] | S |
| P1 Fix right-edge padding at 390px | `app.css` `.app-main`, `.app-header` | Confirm `--space-4` (16px) both sides holds at 390px; add `env(safe-area-inset-right)` to header/main padding so nothing crowds the edge on notch devices | CSS clamp/safe-area padding | Minimum comfortable touch margin | S |
| P1 Tracking hero rebuild | `Track.tsx` `.eta-banner` | Replace the flat ETA block with the v2 tracking header (see section 4): stops-away, ETA pill with confidence, courier card | See section 4 | Amazon stops-away, Uber Eats stage bar [delivery-ux] | M |
| P2 Courier pulse hierarchy | `app.css` `.gmap-courier-pulse`, `mapPulse` | Only the assigned/active courier pulses; idle Ops-board couriers render as static dots so the eye is drawn to the one that matters | CSS `animation` toggled by a `.active` class, no JS timer | Reserve pulse for the one focal marker [game-maps] | S |
| P2 Skew-signature score bars | `ScoreBars.tsx`, `app.css` `.score-fill` | Fill gradient gets a subtle skewX(-12deg) end-cap and a brief scale-in on mount so the offer card feels like it is loading live, not just appearing | CSS transform + keyframe, no library | Micro-interaction duration 200-500ms [game-maps] | S |
| P2 Status timeline as vertical stepper polish | `StatusTimeline.tsx` | Current step gets a soft glow ring and a slow pulse; completed dots get a quick draw-in checkmark instead of appearing instantly | CSS only, reuse `mapPulse`-style keyframe at lower amplitude | Vertical stepper, endowed progress effect [delivery-ux] | S |
| P2 Skeleton loading states | `CustomerHome.tsx`, `Merchant.tsx`, `Track.tsx` loading blocks | Replace the spinner-only `.loading-block` with a shimmer skeleton shaped like the real content (merchant cards, map frame, timeline rows) | CSS gradient `background-position` shimmer, not SVG filter | Shimmer skeleton perceived as faster [delivery-ux][techniques] | M |
| P2 Ops board live legibility | `Ops.tsx` `.dispatch-table`, `.stat-chip` | Add a tiny trend arrow to each stat chip on change, row-flash on new dispatch score, color-blind-safe pattern (not just hue) on mini-bars | CSS transition + one-shot class toggle | Never rely on color alone [game-maps] | M |
| P3 Landmark depth pass | `GaboroneMap.tsx` `BLOCKS` | Blocks get a 1px top highlight and bottom shadow stroke for a subtle 3D read without new geometry | Two extra `<rect>` strokes per block, static | Cosmetic-only change, no new assets [game-maps] | S |
| P3 Day pulse ambient cycle | `GaboroneMap.tsx`, `--map-ground` | Ground fill breathes a very slow (12s) opacity shift tied to a CSS variable, purely decorative, pauses when tab hidden | CSS `@keyframes` + `prefers-reduced-motion` guard | Thermal-aware pacing, 30fps fallback branch [techniques] | S |
| P3 Checkout pay-chip motion | `Checkout.tsx` `.pay-chip` | Selected chip gets a quick spring-like scale bounce instead of an instant border change | CSS cubic-bezier spring approximation | Spring over linear ease [game-maps] | S |
| P3 Courier offer swipe affordance | `Courier.tsx` `.offer-card` | Visual swipe hint (chevron drift) on the Accept button, no gesture logic changes | CSS keyframe only | Swipe-to-accept visual language [delivery-ux] | S |

## 3. Map v2 spec

**Ground.** `--map-ground` moves toward true near-black (`#0b0f0c` dark / kept desaturated
light) instead of the current `#17201a`, so glowing roads and the route line hold all the
contrast [game-maps]. No texture, no noise, keeps SVG paint cost flat.

**Arterial roads, layered glow.** The two `.gmap-road-strong` avenues (currently a single
5px stroke) become three stacked strokes: a wide low-opacity outer stroke (10px, 12% accent),
a mid stroke (5px, 40% accent), and a bright core (2px, 90% accent). This is the same
technique as CSS box-shadow glow stacking but done as SVG strokes so it works inside the
existing `viewBox` without a filter pass, keeping paint cost near the current baseline
[techniques]. Grid streets stay a single low-opacity stroke, unchanged, so the hierarchy
between arterial and local roads reads instantly [game-maps].

**Animated route draw.** On mount, or whenever `routeCourierId` changes, the `.gmap-route`
line runs a one-time `stroke-dashoffset` reveal from full length to zero over 550ms
ease-out, then falls back into the existing `dashFlow` marching-ants loop. Length comes from
`getTotalLength()` on the line/path, memoized so it is not recomputed every render
[techniques].

**Interpolated courier blips with heading.** Replace the instant-jump dot with a small ref-
held `{x, y, heading}` state updated by `requestAnimationFrame`. Each time a new position
arrives (2s poll on Track, socket push on Ops), interpolate from the last known point to the
new one over the update interval rather than snapping; heading is `atan2` of the delta,
rendered as a small triangular wedge behind the dot that rotates with `transform: rotate()`.
State updates never touch React per frame, only the ref and a direct DOM transform write, so
this holds 60fps on low-end Android [techniques]. Only the assigned courier (Track) or the
one the ops operator is watching pulses; the rest render as calm static dots, matching the
one-focal-pulse rule [game-maps].

**Landmark labels.** Keep the existing five labels (CBD, Main Mall, Riverwalk, Game City,
Airport Junction) but raise contrast against the darker ground and add a 1px `paint-order:
stroke` halo in `--map-ground` so text never fights the road glow underneath it, avoiding the
cramped/unlabeled pitfall called out in the evidence [game-maps].

**Subtle block depth.** Each `BLOCKS` rect gets a 1px lighter top-left stroke and a 1px
darker bottom-right stroke (both static, no filter) to read as a slight extrusion, echoing
RDR2's restrained, non-3D depth cues rather than a heavier isometric treatment [game-maps].

**Day pulse.** A very slow (12s), very low-amplitude opacity breathing on the ground fill
only, driven by CSS `@keyframes` and disabled entirely under `prefers-reduced-motion` and
when the tab is hidden (`visibilitychange` pause), so it never fights the thermal budget on a
low-end phone [techniques].

Budget: all of the above adds zero new SVG filters, zero new dependencies, and stays inside
the existing `gmap-*` class family plus a handful of new modifier classes.

## 4. Tracking screen v2 spec

**Stops-away line.** Since the simulator gives `eta_min` and courier `lat/lng` but not a real
multi-stop route, derive a proxy: `stopsAway = max(1, round(eta_min / STOP_MINUTES))` with
`STOP_MINUTES` around 2.5, rendered as "X stops away" once `eta_min` drops under a threshold
(about 10 minutes), and as a plain "On the way" state above that threshold so the number
never reads as false precision [delivery-ux]. This is a client-only computation off data
`Track.tsx` already polls, so it costs nothing new on the backend.

**Milestone bar.** The six `ORDER_STEPS` already defined in `types.ts` (placed, paid, finding
courier, courier assigned, picked up, delivered) become the four-to-five-stage horizontal bar
pattern used by Domino's and Uber Eats, collapsing "placed" and "paid" into one completed
segment at order start for the endowed-progress effect [delivery-ux]. Each stage transition
gets a short color-fill sweep (`transform-origin: left; scaleX`), not a redraw.

**ETA pill with confidence.** Replace the flat `.eta-num` block with a pill showing the
minute count plus a light confidence qualifier once a courier is assigned versus before
("about 18 min" pre-assignment, "18 min · courier en route" after), mirroring the honest
wide-then-narrow ETA pattern instead of always claiming false precision [delivery-ux].

**Courier card.** Extend the existing `.courier-mini` (avatar initial, name, rating) with a
small live status word synced to `order.status` ("heading to pickup", "picked up your
order", "nearby") so the card itself narrates progress, not just the timeline below it.

**Delivered moment with payout split reveal.** When `status === 'delivered'`, the existing
`.split-row` payout breakdown (merchant/courier/Sprint) animates in as a staged reveal, each
row appearing 120ms after the previous with a small scale-in, instead of rendering flat and
instantly, giving the "Mmm!" completion beat Domino's tracker is known for [delivery-ux]. Map
frame gently zooms to the delivery pin and the route line fades out.

## 5. Polish list (catalog, checkout, courier, ops, login)

- **Catalog (`CustomerHome.tsx`)**: merchant card top gradient loses the blue grocery hue
  (see P1 fix above); card hover lift gets a touch more spring; skeleton cards replace the
  spinner while `merchants` is null.
- **Checkout (`Checkout.tsx`)**: selected `.pay-chip` gets the spring bounce; order total in
  the sticky button gets a tabular-nums roll animation when quantity changes upstream.
- **Courier (`Courier.tsx`)**: `.offer-card` score number counts up from 0 on arrival instead
  of appearing static; `.job-step` rows get the same draw-in checkmark as the timeline.
- **Ops (`Ops.tsx`)**: stat chips flash briefly on value change; dispatch table mini-bars gain
  a text/pattern cue for color-blind operators, not color alone.
- **Login (`Login.tsx`)**: fix logo clipping (P1); quick-chip role dots drop the blue ops dot
  in favor of orange; card gets a faint skewed accent bar echoing the brand `.skew` signature
  already used elsewhere in the app.

## 6. Non-goals

- No 3D, voxel, or WebGL map. SVG stays the renderer; this is a 2D game-HUD language, not a
  3D engine [techniques].
- No new runtime dependency over the ~30KB gzip budget; Framer Motion, Lottie, and similar
  libraries are out of scope, CSS and small rAF hooks cover every effect above [techniques].
- No GTA logos, fonts, HUD chrome, or trade dress. Only the aesthetic language (dark ground,
  glowing roads, blip hierarchy) is adapted, never copied assets [game-maps].
- No literal multi-stop routing engine. "Stops away" is an honest proxy label, not a claim of
  real waypoint data.
- No change to the order/dispatch data model, socket contract, or API shape. Every item here
  is presentation-layer only.
- No blue anywhere, including as an accent, a status color, or a chart series. Neutral ink or
  orange stands in wherever blue was used before.
- No light/dark theme regressions. Every new token and animation must be defined for both
  `:root` and `:root[data-theme='light']`, matching the existing `tokens.css` pattern.
