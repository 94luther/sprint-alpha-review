# Deep think prompt for ChatGPT

Paste everything below the line into ChatGPT. Use its reasoning or deep research mode if you
have it. Nothing here is confidential: it is market context and product direction, no code,
no keys, no customer data.

When it answers, paste the answer back to me and I will build whatever survives scrutiny.

---

You are a principal product architect who has shipped on-demand delivery platforms in
emerging markets. I want rigour, not encouragement. Challenge my assumptions and tell me
where I am wrong.

## The situation

I run Sprint Couriers, an established courier company in Gaborone, Botswana. We are building
our own on-demand delivery platform: food, groceries, vapes, pharmacy and parcels. We already
have the fleet, the drivers, the brand and existing B2B courier contracts. What we do not have
is the consumer app business.

We have a working alpha today. It genuinely runs: customer ordering, a dispatch engine that
scores couriers using Uber's H3 hexagon index, live courier tracking over websockets, an
18 plus age gate for vapes, encrypted delivery addresses, an ops console, and a ledger that
splits each order between the merchant, the courier and Sprint. It is real software, not a
mockup, but it is thin. It feels like an alpha.

## The market, as verified in August 2026

- Wanzy launched June 2025, has 6,000 plus users, and runs on a white label platform. In
  April 2026 Pick n Pay Botswana chose Wanzy as its delivery partner rather than build its
  own app, starting with Pick n Pay Liquor in Gaborone and naming groceries as next.
- Gabs Eats launched January 2026 with an all electric bike fleet and about a 30 minute
  average, but has no web ordering at all: every button pushes you to an app store.
- Zesta's website currently returns a paused deployment error on every path.
- Yamee, which is the rebrand of MyFoodness, has unreachable domains and a Facebook page
  silent since July 2023.
- No global platform operates in Botswana: no Uber Eats, no Bolt Food, no Glovo.
- Payments here are cash on delivery and mobile money first. Orange Money, Mascom MyZaka and
  BTC Smega dominate, and Smega has an open merchant API. Stripe and Paystack do not settle
  in Botswana pula. Cards go through DPO Pay, PayGate or Peach Payments.
- Botswana's Data Protection Act has been in force since January 2025, regulated by the
  Information and Data Protection Commission, with penalties up to 50 million pula or four
  percent of global turnover.
- Vapes are currently legal and unregulated here. We self impose an 18 plus gate anyway.
- Phones are mostly low end Android. Data is expensive. Connectivity drops.

## What I want from you

1. **The honest gap.** Given Pick n Pay chose Wanzy, is the consumer marketplace still worth
   entering, or should Sprint compete as the delivery layer that retailers rent, or do both?
   Argue the strongest case against my plan before you argue for it.

2. **Feature completeness.** Give me the exhaustive list of what a delivery app must have
   before a first time user stops thinking it looks unfinished. Separate the table stakes
   from the things that only matter at scale. Include the unglamorous ones people forget.

3. **Sequencing.** I cannot build everything. Give me a ruthless order of build, with the
   reasoning, optimised for winning customers in Gaborone specifically, not San Francisco.

4. **The unfair advantages.** We already own a courier fleet, existing corporate contracts,
   and a WhatsApp automation engine we built for another business. Most app first competitors
   own none of that. What strategies does that unlock that a pure app startup cannot copy?

5. **Next generation moves.** What is genuinely shipping in 2026 that would make us look
   ahead rather than merely current, that a small team in Botswana could actually operate?
   Be specific about what is real versus demo ware. Consider AI ordering agents, agentic
   commerce, predictive courier positioning, proof of delivery, smart lockers, quick commerce
   dark stores, own label goods, and WhatsApp as a primary ordering channel rather than a
   support link.

6. **The warehouse question.** Long term I want a Sprint fulfilment warehouse feeding an in
   house supermarket and a food corner, stocked with our own label goods. Private label runs
   roughly 35 percent margin against 26 percent for national brands, and Choppies proves own
   label works in Botswana. But Getir and Gorillas died from building dark stores before they
   had order density. At what point does this become sane rather than reckless, and what
   number should trigger it?

7. **What kills us.** The five most likely reasons this fails, and the earliest warning sign
   of each.

Be specific and concrete. Where you are uncertain, say so rather than filling the gap with
confident prose. Prefer numbers and named examples over adjectives.
