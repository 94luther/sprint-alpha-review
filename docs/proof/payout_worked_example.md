# Payout worked out for 2026-09-13

Produced by api/src/orders/settlement.ts from 7 orders on a made up day, to show the shape of the file finance would open.

**The fault model is still a proposal, so nothing can be paid out yet. Barbara has it.**

| Merchant | Orders | Goods | Covered loss | Net | Rail | Sprint must fund it |
|---|---|---|---|---|---|---|
| A Gaborone grocer | 3 | P520.00 | P220.00 | **P740.00** | cash | no |
| A licensed pharmacy | 2 | P410.00 | P0.00 | **P410.00** | myzaka | YES |
| A licensed bottle store | 2 | P260.00 | P0.00 | **P260.00** | orange_money | YES |
| **Total** | | | | **P1410.00** | | P670.00 |

Sprint earned P300.00 in delivery fees and carried P60.00 for its own failures.

P670.00 of this has to come out of Sprint's own bank account on the day, because MyZaka and Orange Money do not push money to a merchant account on their own.

Every figure follows from the fault already recorded on each order by the person who was there. Nobody reads an order history to produce this.
