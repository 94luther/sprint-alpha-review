# Data protection impact assessment, Sprint delivery app

Brick 9. Written 12 September 2026 by Luther Roberts. Reviewed by: not yet. Officer named: see section 12.

## 1. Why this document exists

Botswana's Data Protection Act, Act 18 of 2024, has been in force since 14 January 2025. It replaced the 2018 Act. The regulator is the Information and Data Protection Commission. Breaches must be reported within 72 hours. Penalties reach 50 million pula or 4 percent of global turnover, whichever is greater.

Two things in this app trigger the highest level of duty. It processes health information, because a prescription tells you what is wrong with someone. And it processes at scale, because the whole point is thousands of orders a month. Either one on its own requires an appointed Data Protection Officer. We have both.

**One honest caveat.** The Act requires the officer's contact details to be registered with the Commission, but no registration mechanism has been published. So the obligation is in force and the mechanism is not. We appoint the officer, record the appointment, and register the moment a route exists. This is written down so nobody later thinks we forgot.

## 2. What the app collects, and why

| What | Why we need it | Sensitive |
|---|---|---|
| Name and phone number | To deliver the order and to call when the rider cannot find the door | No |
| Delivery address, plot, landmark, access notes | Gaborone has no street grid, so the landmark is how a rider finds the door | No |
| Location while ordering | To show which shops can reach the customer | No |
| Order contents | To pick, pack and deliver | Sometimes |
| Prescription image and the medicine dispensed | The pharmacist must dispense against the script | **Yes, health** |
| Identity document at the door, for liquor and medicines | To prove the goods went to an adult, and to the right patient | **Yes** |
| Photograph at handover | Proof the delivery happened, and a defence against a false claim | Sometimes |
| Payment reference and amount | To reconcile the order and pay the merchant | No |
| Rider location while on a job | To dispatch fairly and tell the customer when to expect them | No, but it is staff data |

## 3. What we will not collect

No card numbers are ever stored. Payments are tokenised or handled on the provider's own rail. No customer identity document is photographed or stored; the rider confirms the name and date of birth against the document and records only that the check passed and who did it. No prescription image is kept after the pharmacist has dispensed and the order is closed.

## 4. Who can see what

- **The rider** sees the customer's name, phone, address and that an identity check is required. The rider does **not** see what the medicine is. The bag is sealed by the pharmacist and the app shows a reference, not a drug name. This is the single most important rule in this document.
- **The merchant** sees the order and a first name. Merchants do not get a customer list, a phone number or an address history.
- **The pharmacist** sees everything clinical, because they must. They already owe a professional duty of confidence.
- **Sprint operations** see orders, addresses and exceptions. They do not see prescription contents.
- **Payment providers** see the amount and a reference, not the basket.
- **Meta** sees anything sent through WhatsApp. See section 6.

## 5. Lawful basis

Delivery of goods the customer ordered rests on performance of a contract. The identity check for liquor and medicines rests on a legal obligation. The proof of delivery photograph rests on legitimate interest, which is to defend against false claims, and it is balanced by keeping it short lived and not pointing it at the person. Anything used for marketing rests on consent, asked for separately, and refusing it must not affect the delivery.

## 6. Data that leaves Botswana

This is the part most likely to be got wrong, so it is set out plainly.

**WhatsApp ordering sends order content to Meta, whose servers are outside Botswana.** That is a cross border transfer under the Act. Two consequences. First, no prescription content, no medicine name, and no identity document detail may ever pass through WhatsApp. Medicine orders in WhatsApp go no further than a link that opens the secure app. Second, the customer must be told, in plain words, at the point they choose to order in WhatsApp, that WhatsApp is not run by Sprint.

**Hosting.** Wherever the app is hosted, the location is recorded here before launch and the transfer basis is written down. Not settled yet, and named in section 13.

## 7. How long we keep things

| What | Kept for | Then |
|---|---|---|
| Prescription image | Until the order is closed | Deleted |
| Identity check record | Two years | Deleted, keeps only that a check passed and who did it |
| Proof of delivery photograph | 90 days | Deleted unless a dispute is open |
| Order and address history | While the account is active, then two years | Deleted |
| Payment reconciliation records | Seven years | Kept, tax law requires it |
| Rider location traces | 30 days | Aggregated to totals, traces deleted |

## 8. How it is kept safe

Passwords hashed with argon2id, not stored. Data encrypted at rest. Access by role, so a rider account cannot open an ops screen. Every look at a customer record is logged with who looked, which is how browsing gets caught. Patched versions of the platform before any pilot, which is brick 22. Rider phones need a screen lock and can be wiped remotely, and a rider sees only their own current jobs, never a list of customers.

## 9. The risks that actually matter, and what reduces each

| Risk | Who is hurt | What reduces it |
|---|---|---|
| A rider learns a customer's medical condition | The patient, badly, in a small country | Sealed bag, no drug name in the app, reference only |
| A rider's phone is lost with jobs open | Several customers | Screen lock, remote wipe, only today's jobs on the device |
| The handover photograph captures the customer or inside their home | The customer | Photograph the parcel at the door, never the person, and delete at 90 days |
| Ops staff look up someone they know | Anyone local | Every access logged and reviewed, dismissal offence |
| A merchant builds its own customer list from our orders | Customers, and Sprint | Merchants see a first name only |
| Medicine details reach Meta through WhatsApp | The patient | Hard rule, medicine orders leave WhatsApp for the app |
| An identity number is written in a free text note | The customer | No free text on the identity step, a yes or no and a staff number |
| Data kept forever because nobody deletes it | Everyone | The table in section 7, and a monthly job that enforces it |

## 10. What a person can ask for

Any customer may ask what we hold, ask for it to be corrected, ask for it to be deleted where no law requires us to keep it, and object to marketing. Requests go to the officer in section 12 and are answered within 30 days. Deleting an account does not delete the seven year payment records, and the customer is told that plainly rather than discovering it.

## 11. If something goes wrong

The 72 hour clock starts when Sprint becomes aware, not when it is confirmed, so the first call is made on suspicion. Steps, in order. Contain it. Write down what was exposed and whose. Tell the Commission inside 72 hours. Tell the people affected without delay where there is real risk to them, in plain language, saying what happened and what they should do. Record the whole thing. The officer runs this and does not need permission to start.

## 12. The officer

**Name: TO BE NAMED by Barbara.** Contact details: to follow. Appointed on: to follow.

This document is not finished until that line carries a real person. The officer must be able to reach leadership directly, must not also be the person whose targets depend on collecting more data, and must have time in their week for it rather than it being an extra title.

Deputy, for when the officer is away: also to be named.

## 13. Not settled, named rather than hidden

- The officer is not appointed. Everything in section 11 has no owner until they are. Asked of Barbara on 14 September.
- The hosting location and its transfer basis are not decided, and must be before the pilot.
- No registration route with the Commission has been published, so the appointment cannot yet be registered.
- The pharmacy partner is not chosen, so the agreement covering who controls the clinical data is not written. That agreement is part of brick 40.
- Nobody has run a deletion job yet, because nothing is live. It must exist before the first real order, not after.
- Staff have not been trained on any of this. That belongs with brick 37.
