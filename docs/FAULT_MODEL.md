# Who pays when a delivery fails

Brick 15. Drafted 12 September 2026 by Luther Roberts. **Status: proposed. Not yet agreed by Barbara.**

Every rule below is a default that operates unless someone overrides it in writing. Where a rule needs a number that only finance can set, the number is marked as such rather than invented.

## Why this exists before the app takes a cent

The council said, independently and twice, that paying merchants the same day is impossible without this. That is right, and the reason is simple. The moment money moves automatically, somebody has to have already decided who carries the loss when a delivery goes wrong. If that decision is made afterwards, order by order, by whoever is on the phone, then three things follow. Merchants stop trusting the settlement. Riders learn which failures to hide. And nobody can tell whether the business makes money, because the losses never land anywhere you can count them.

The order state machine already refuses to move an order into any failure path without a fault attached. This document says what the fault means in money.

## The four faults, in plain words

| Fault | Means |
|---|---|
| **Merchant** | The shop could not supply what was sold, or supplied it wrong, or kept the rider waiting past the agreed time |
| **Customer** | The address was wrong, nobody was there, or the person refused or failed the identity check |
| **Rider** | The rider abandoned the job, was late through their own doing, damaged or lost the goods |
| **Sprint** | No rider was available, the app failed, dispatch sent it wrong, or the company simply could not do what it sold |
| **None** | Nobody is at fault. Flood, accident that was not the rider's doing, roadblock, power cut, a death in the family |

**None is a real answer and it must stay easy to choose.** If the only options blame somebody, people pick the nearest person, and the numbers become fiction.

## The table

Four things can move when an order fails: the goods, the delivery fee the customer paid, what the rider is paid, and who carries the cost of taking goods back.

| What went wrong | Fault | Goods | Delivery fee | Rider paid | Return leg | Customer is told |
|---|---|---|---|---|---|---|
| Shop cannot supply, before a rider is assigned | Merchant | Refunded in full | Refunded in full | Not applicable | None | The shop cannot supply this, your money is coming back |
| Out of stock, customer takes a substitute | Merchant | Difference settled either way | Charged as normal | Paid in full | None | We swapped one item, here is the difference |
| Out of stock, customer drops the item | Merchant | That line refunded | Charged as normal | Paid in full | None | One item was not available, the rest is on its way |
| Out of stock, customer cancels the order | Merchant | Refunded in full | Refunded in full | **Paid in full** | Merchant | Sorry, the shop let us down, everything is coming back |
| Rider abandons after accepting | Rider | Unaffected | Unaffected | **Not paid** for that job | Sprint | Nothing. Reassigned before they notice |
| No rider available at all | Sprint | Refunded in full | Refunded in full | Not applicable | Sprint | We could not get anyone to you, your money is coming back |
| Wrong address, sorted out, delivered late | Customer | Charged as normal | Charged as normal | **Paid, plus the waiting time** | None | Nothing |
| Wrong address, cannot be found, goods returned | Customer | Refunded less any perishable loss | **Not refunded** | Paid in full | **Customer** | We could not find the address, the delivery fee stands |
| Nobody home after the agreed wait | Customer | Refunded less any perishable loss | **Not refunded** | Paid in full | **Customer** | We waited and could not reach you, the delivery fee stands |
| Identity check failed, liquor or prescription | Customer | Refunded less any dispensing cost | **Not refunded** | Paid in full | **Customer** | We cannot hand this over without the right identification |
| Rider breaks down, goods returned | None or Rider | Refunded in full | Refunded in full | Paid if none, not paid if the rider's own doing | Sprint | Something happened on the road, your money is coming back |
| Goods damaged in transit | Rider | Refunded in full | Refunded in full | Paid, and it goes on their record | Sprint | We damaged it, your money is coming back |
| Customer cancels after paying, before pickup | Customer | Refunded in full | Refunded in full | Paid if already travelling | None | Cancelled, your money is coming back |
| Customer cancels after pickup | Customer | Refunded less perishable loss | **Not refunded** | Paid in full | Customer | Cancelled after it left the shop, the delivery fee stands |
| Dispute after delivery, upheld | Depends | Refunded | Refunded | Paid in full | Case by case | Sorry, your money is coming back |
| Dispute after delivery, not upheld | None | Not refunded | Not refunded | Paid in full | None | We looked at the proof of delivery and cannot refund this one |

## The five rules underneath the table

**1. The rider is paid unless the rider caused it.** This is the most important line in the document. A rider who loses a morning's pay because a shop was out of stock or a customer was not home will start refusing hard jobs, avoiding far addresses, and hiding failures rather than reporting them. Paying them protects the data as much as the person.

**2. Fault is recorded by the person who was there, at the time.** The rider at the door, the shop when it rejects the order. Not by operations the next morning from memory. The app asks at the moment of the event and will not proceed without an answer.

**3. Small losses are written off, not argued.** Below a threshold that finance sets, the loss is absorbed and the order is closed. Arguing over forty pula costs more than forty pula in staff time and in goodwill. **Threshold: to be set by finance.**

**4. Perishables and prescriptions cannot go back on a shelf.** A returned frozen basket or a dispensed prescription is a real loss to the merchant or the pharmacy, not a restock. Those returns are settled at cost, and the customer whose fault it was is told that before they order, not after.

**5. Any fault can be appealed once, within seven days, to one named person.** Not a committee, not a form. **Who: to be named by Barbara.** A rider or a merchant who believes a fault was wrongly assigned says so and one person decides. Without an appeal route, fault assignment becomes something people work around.

## What this makes possible

Same day merchant settlement becomes arithmetic rather than a judgement call. At the end of each day every completed order has a fault of merchant, customer, sprint, rider or none already attached, so the payout file can be produced without anyone reading an order history.

It also makes two director questions answerable for the first time. **Failures per rider, by fault**, which says who is actually struggling rather than who complains loudest. And **failures per merchant, by fault**, which says which shop is quietly costing money through stock it does not have. Both come free once fault is recorded at the moment it happens.

## The three numbers Barbara and finance must set

1. The write off threshold in rule 3.
2. The waiting time at the door before a customer counts as absent. A number, in minutes, the same for everybody.
3. Whether a rider who is not paid for an abandoned job still keeps that day's other earnings, which is an employment question and not a delivery one.

## What is not settled

- **MyZaka has no automatic settlement to a bank account.** Their own contract has the merchant emptying an electronic wallet by hand. So even with this model agreed, same day payment on that rail must be funded from Sprint's own account and reconciled afterwards. Not solved here, and it belongs with brick 19.
- The appeal person is not named.
- Nobody has decided what happens on the second and third time a rider causes the same failure. That is a people question and it belongs with the rider model at brick 36.
- This model assumes Sprint carries the goods. It says nothing about a merchant who delivers with their own driver on our platform, which will come up the moment a supermarket signs.

## Agreement

This becomes the operating rule when Barbara agrees it, and not before. Until then the app records fault correctly and nothing is deducted from anybody.

Agreed by: ______________________  Date: ______________
