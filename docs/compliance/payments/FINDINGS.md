# Mobile money merchant terms, what is public and what had to be asked

Brick 10. Evidence gathered 12 September 2026 from the providers' own pages and their own published contract. Nothing here comes from a directory site or a summary.

## The headline

**None of the three publishes what a merchant pays.** Orange Money, MyZaka and Smega all publish consumer charges and none publishes a merchant rate, a settlement time, or a minimum. So the profit per order cannot be calculated from public information, and blocker C1 is real rather than laziness. Three emails are queued for Monday.

## Mascom MyZakaPay, read from their own merchant contract

The contract is published at mascom.bw and is saved here as MyZakaPay-Merchant-Terms.pdf with the text beside it. Four things matter.

1. **The fee is blank, so it is negotiated.** Clause 5.1.3 reads that Mascom "shall be entitled to impose a collection fee of _____% per payment". An empty line in a published contract means the number is set per merchant. Sprint's volume is leverage, and the Monday email asks for the rate at our volume rather than asking whether there is one.

2. **There is no automatic settlement to a bank account.** Clause 3.3.6 says the merchant may "liquidate his/her wallet at any MyZaka agent's outlet or by issuing a bank transfer instruction for larger amounts". Takings sit in an electronic wallet until somebody at Sprint moves them. Cashing out at an agent attracts the normal withdrawal charge capped at BWP 175, and a bank transfer attracts normal bank charges.

3. **The fee cannot be passed to the customer.** Clause 3.3.4 says the merchant shall not deduct any charges from the payment, so the customer pays exactly the price of the goods. The collection fee comes out of Sprint's margin, which is why the rate decides whether an order makes money.

4. **Two obligations nobody has budgeted for.** Clause 3.5 requires annual anti money laundering training with proof shared with Mascom. Clause 10.2 allows Mascom to terminate on 30 days notice, or immediately on a regulatory breach.

## What this changes in the house

**Brick 19, merchants paid the same day, is harder than it looked.** The plan assumed money lands in a bank account and is split out daily. On MyZaka it lands in a wallet that a person has to empty, and emptying it costs money. Either Sprint funds merchant payouts from its own bank account and reconciles against the wallet later, or same day payment is not possible on that rail. This needs deciding when the three replies are in, and it belongs in the fault and settlement work at brick 15.

## Contacts used, each from the provider's own contact page

| Rail | Written to | Source page | Risk |
|---|---|---|---|
| Orange Money | b2bcustomer.support@orange.com | orange.co.bw business contact page | The business address is a group address, not a Botswana one. A local branch visit may be faster. |
| MyZaka | customerservice@mascom.bw | mascom.bw contact page | No merchant address is published, so this goes to the general contact centre and may be routed slowly. The email asks to be passed on. |
| Smega | 121@btc.bw | btc.bw company contacts | Same risk. The merchant onboarding page exists but publishes no address. |

Orange also publishes a merchant and KYC address, kyc.obw@orange.com, and a KYC phone, +267 72 093 875. Use those if the business address goes quiet.

## Also found

- **BTC publishes a merchant onboarding page** listing what is needed: business registration, tax number, bank confirmation letter. Sprint has all three.
- **The Smega developer site exists** at smegaapi.btc.bw, but its documentation page returns a certificate error and could not be read. The email asks for current documentation.
- **DPO Pay covers Orange Money in Botswana** and could remove one integration, but its published Botswana page does not confirm MyZaka or Smega, and it publishes no pricing. Worth a call once the direct rates are known, so there is something to compare against.

## Still not known, and only a reply will settle it

- What a merchant pays on any of the three rails.
- How long money takes to reach a bank account on Orange Money or Smega.
- Whether any of them has a minimum monthly volume or a monthly charge.
- Whether any offers automatic daily settlement rather than manual liquidation.
