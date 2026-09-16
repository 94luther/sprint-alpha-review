# Council brief: the build plan for a courier company's delivery app (groceries, medicines, liquor, parcels)

Send to Kimi first, then ChatGPT and Gemini, each in its own fresh chat, none shown the others' answers. Paste everything below the line. Governance: no client names, no prices bid or won, no ledger figures. Method and public facts only.

---

I run sales at a licensed national courier company in Botswana. It holds the commercial postal licence, runs 55 branches, and carries the majority of the country's courier mail volume (the regulator's own annual report says 76 percent). It already serves banks and public bodies on contract. Two small consumer apps in Gaborone, Wanzy (food, grocery, liquor, essentials; Pick n Pay signed with them in April 2026) and Zebras Delivery (groceries, food, pharmacy, flowers, electric scooters), are taking the consumer layer. Nobody here delivers prescription medicines with a proper pharmacist gate; one service, Plexilife, delivers repeat scripts for P89 a time with ten days notice.

I have written the build as a wall of 47 bricks in seven courses, of which the bottom six are already laid and verified. A brick is laid only when its proof exists (a file, a sent email, a photo). No brick starts before the bricks it stands on are laid. One brick per turn.

Footings, already finished and checked by machine before any of the below: (1) a working demo anyone can open on a phone; (2) the code base behind it, customer app and order engine; (3) the deep strategy answer on what to build first and when a warehouse pays; (4) a first council round survived with every fault fixed; (5) the competitor gap map; (6) this plan itself, with a tamper evident proof ledger.

Foundation: (7) the frame page, we are the incumbent monetising the corporate base, the app keeps newcomers off the consumer side; (8) the medicines regulator's written answer on whether a licensed courier may carry a pharmacist dispensed sealed prescription; (9) data protection impact assessment and a named officer; (10) mobile money merchant settlement terms in writing; (11) cold chain SOP with temperature logged boxes and a labelled refrigerated tariff; (12) the profit per order model from real costs; (13) licence and insurance register with dates read off originals.

Engine: (14) order state machine with exception states; (15) who pays when a delivery fails, agreed before money moves automatically; (16) address by plot and landmark, rider confirmed at the door; (17) dispatch on the real 55 branch network; (18) cash with a cap and photo, then mobile money, then cards; (19) merchants paid the same day using the fault model; (20) arrival window and landmark confirm first, map second, WhatsApp updates; (21) photo proof plus ID and code for liquor and medicines; (22) security patch floor.

Categories: (23) groceries with substitutions, weighed items, slots, first supermarket signed (not Pick n Pay); (24) over the counter medicines; (25) prescription lane with pharmacist dispensing and sealing; (26) liquor from licensed stores in trading hours with ID; (27) parcels and documents in the same app; (28) vapes on the web only, never in store builds; (29) repeat and scheduled orders.

Surfaces and people: (30) customer app on real data, installs from the web without a store; (31) ordering inside WhatsApp; (32) loud till printer at each merchant; (33) rider app offline first; (34) ops tower with output per rider and margin per merchant; (35) corporate accounts with monthly invoice; (36) rider model for on demand work, shifts and pay agreed in writing; (37) training with exception drills.

Launch cell: (38) two or three Gaborone clusters, merchants checked against field sales accounts first; (39) 25 to 30 merchants signed and onboarded; (40) pharmacy partner signed with the regulator's letter; (41) first 100 orders with staff and family; (42) council review of the live app; (43) MD pack.

Roof: (44) pilot live as an install free web app plus WhatsApp ordering, store listings submitted but never gating; (45) eight week measurement (90 percent accepted inside 2 minutes, P90 under 45 minutes, under 3 percent failed, 25 percent repeat, positive contribution, read at weeks 1, 4 and 8); (46) warehouse gate at 150 grocery orders a day, P250 baskets, 40 percent repeat, P40 contribution, 97 percent fill, under 3 percent cancelled; (47) the MD's written scale or stop decision.

Critical path: 7, 12, 14, 15, 19, 23, 39, 41, 43, 44, 45, 46, 47, with WhatsApp ordering (31) joining at 41. Medicine path beside it: 8, 11, 25, 40, 44. Proposed dates: pilot live 9 November 2026, decision 15 January 2027. One person builds until an IT lead is named.

My own seat's view before you answer (Claude, the plan's author): the wall is strong on compliance and proof and weak on people. It assumes one builder, it has a brick for rider pay and shifts (30) but none for recruiting riders, and none for what a customer, merchant or rider is told if the pilot stops. The week plan is a guess.

Questions, answer each with a verdict and a reason:
1. Which brick is in the wrong course, or stands on the wrong bricks? Name the number.
2. Which brick is missing entirely? Give me the brick, its owner type, and its proof.
3. Is the eight week measurement the right gate, and are those five numbers the right numbers for a courier incumbent rather than a food startup?
4. Should medicines be in the pilot at all, or be a second pilot after groceries prove density? Argue both ways, then decide.
5. What is the cheapest brick that, if laid first, makes the most other bricks easier?

GAPS clause: return at least three gaps I did not ask about, each scored by the cost of being wrong (low, medium, high) and who should own it.

Separately from the above: what is the single biggest thing I am getting wrong or overlooking that I have not asked you about?
