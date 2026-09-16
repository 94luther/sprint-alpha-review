/**
 * The engine service: the request handlers the rules layer was always waiting for.
 *
 * On 16 September 2026 a finder showed ten modules that were tested and imported
 * by nothing serving a request. Three had an obvious home in the order path and
 * went in. The rest had no home at all, because the endpoints that would call
 * them did not exist: there was nowhere to ask what a parcel costs, nowhere to
 * hand a parcel over at a door, nowhere for a rider's phone to empty its outbox
 * when the signal came back.
 *
 * This is that layer. It holds no rules of its own on purpose. Every method here
 * is thin: it checks who is asking, calls the module that owns the rule, and
 * turns a thrown rule into an HTTP answer a person can read. If a rule ever needs
 * changing, it changes in the module and this file does not move.
 *
 * What that buys: the modules stop being a library nobody calls and become the
 * thing the app actually does.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as liquor from '../orders/liquor';
import * as handover from '../orders/handover';
import * as offline from '../orders/offline';
import * as parcel from '../orders/parcel';
import * as tracking from '../orders/tracking';
import type { AddressPassport } from '../orders/address_passport';
import * as network from '../orders/network';
import * as till from '../orders/till';
import * as opsBoard from '../orders/ops';
import {
  placeOnAccount,
  cancelOnAccount,
  outstanding,
  statement,
  health,
  type CorporateAccount,
  type CorporateOrder,
} from '../orders/corporate';

/** Turn a rule's own error into an HTTP answer without losing its words. */
function asHttp<T>(run: () => T): T {
  try {
    return run();
  } catch (e) {
    const err = e as Error;
    if (
      err instanceof liquor.LiquorError ||
      err instanceof handover.HandoverError ||
      err instanceof offline.OfflineError ||
      err instanceof parcel.ParcelError ||
      err instanceof network.NetworkError ||
      err instanceof till.TillError
    ) {
      throw new BadRequestException(err.message);
    }
    throw e;
  }
}

@Injectable()
export class EngineService {
  /* ------------------------------------------------------------- parcels */

  /** What a parcel costs, from the signed tariff, before anybody commits to it. */
  quoteParcel(kg: unknown, zone: unknown) {
    if (typeof kg !== 'number' || !Number.isFinite(kg)) {
      throw new BadRequestException('A weight in kilograms is needed.');
    }
    if (typeof zone !== 'string' || !zone) {
      throw new BadRequestException('A zone is needed.');
    }
    const q = asHttp(() => parcel.quote(kg, zone as parcel.Zone));
    return { quote: q, note: parcel.priceNote() };
  }

  /** The price ladder for a zone, so a customer sees the steps rather than one number. */
  parcelLadder(zone: unknown, upToKg = 5) {
    if (typeof zone !== 'string' || !zone) throw new BadRequestException('A zone is needed.');
    return { zone, ladder: asHttp(() => parcel.ladder(zone as parcel.Zone, upToKg)) };
  }

  /* ------------------------------------------------------ the door: liquor */

  /**
   * May this liquor order be handed over at the time the rider will arrive?
   * The licence and its hours are the merchant's; the judgement is the engine's.
   */
  liquorHandover(licence: liquor.LiquorLicence | null, arrivesAtISO: string) {
    if (!arrivesAtISO) throw new BadRequestException('An arrival time is needed.');
    const verdict = asHttp(() => liquor.mayHandOver(licence ?? null, arrivesAtISO));
    const daysLeft = licence ? asHttp(() => liquor.daysLeft(licence, arrivesAtISO)) : null;
    return {
      ...verdict,
      licence_days_left: daysLeft,
      licence_expiring_soon:
        daysLeft !== null && daysLeft <= liquor.EXPIRY_WARNING_DAYS && daysLeft >= 0,
    };
  }

  /* -------------------------------------------------- the door: proof of it */

  /** What the rider must do at this door, before they are standing at it. */
  handoverRequirement(sensitivity: unknown) {
    if (typeof sensitivity !== 'string' || !sensitivity) {
      throw new BadRequestException('What kind of goods these are is needed.');
    }
    return asHttp(() => handover.requirementFor(sensitivity as handover.Sensitivity));
  }

  /** A one time code for a handover that needs one. Never guessable, never stored in the open. */
  handoverCode() {
    return { code: handover.makeCode(), length: handover.CODE_LENGTH, attempts: handover.CODE_MAX_ATTEMPTS };
  }

  /* ------------------------------------------- the rider's phone, offline */

  /**
   * A rider's phone empties its outbox when the signal comes back. Nothing is
   * dropped, and the precious actions go first.
   */
  syncOutbox(outbox: unknown, online: boolean, send?: (a: offline.QueuedAction) => offline.Outcome) {
    if (!Array.isArray(outbox)) throw new BadRequestException('An outbox is a list of actions.');
    /* The sender is passed in rather than assumed. In the app it is the real
       office call; a caller that does not supply one is telling us the office
       accepted everything, which is what a plain replay of an outbox means. */
    const deliver = send ?? ((): offline.Outcome => 'sent');
    const result = asHttp(() => offline.sync(outbox as offline.QueuedAction[], deliver, online));
    return { ...result, still_on_the_phone: offline.remaining(result) };
  }

  /* ----------------------------------------------------- what the customer sees */

  /** The panels a customer's tracking screen shows, and the one line safe for WhatsApp. */
  trackingPanels(
    state: unknown,
    sinceISO: unknown,
    passport: AddressPassport | null,
    alreadyAsked: boolean,
  ) {
    if (typeof state !== 'string' || typeof sinceISO !== 'string') {
      throw new BadRequestException('An order state and a time are needed.');
    }
    const window = tracking.arrivalWindow(state as never, sinceISO);
    const line = tracking.whatsappLine(state as never, window);
    return {
      window,
      panels: tracking.panels(state as never, passport ?? null, alreadyAsked, window),
      confirm_address: tracking.shouldConfirmAddress(state as never, passport ?? null, alreadyAsked),
      /* Nothing clinical goes down a channel that leaves the country. The line is
         checked here as well as written safely, because a future edit to the
         wording must not be able to slip past the rule. */
      whatsapp_line: line && tracking.isSafeForWhatsapp(line) ? line : null,
    };
  }

  /* ---------------------------------------------------------- where we reach */

  coverage() {
    return {
      claim: network.coverageClaim(),
      branches: network.branchClaim(),
      offices: network.offices().length,
      service_points: network.servicePoints().length,
      international: network.internationalSites().length,
      sites: network.allSites(),
    };
  }

  /* ------------------------------------------------------------- the till */

  /** Whether a merchant's till has accepted, gone quiet, or is simply switched off. */
  tillState(offer: unknown, tillRecord: unknown) {
    if (!offer || !tillRecord) throw new BadRequestException('An offer and a till are needed.');
    return asHttp(() => till.tillState(offer as till.Offer, tillRecord as till.Till));
  }

  /* ------------------------------------------------- corporate, on account */

  /**
   * Place an order against a company's credit. The check and the record happen in
   * one step here, which is the only reason two orders cannot both slip through.
   */
  orderOnAccount(
    book: CorporateOrder[],
    account: CorporateAccount,
    accountId: string,
    amountThebe: number,
    costCentre: string,
    orderId: string,
    description: string,
  ) {
    const r = placeOnAccount(
      book, account, accountId, amountThebe, costCentre,
      orderId, new Date().toISOString(), description,
    );
    if (!r.placed) throw new ForbiddenException(r.says);
    return { placed: true, says: r.says, order: r.order, owed: outstanding(book, accountId) };
  }

  cancelAccountOrder(book: CorporateOrder[], orderId: string) {
    if (!cancelOnAccount(book, orderId)) {
      throw new NotFoundException('No open order on account with that id.');
    }
    return { cancelled: true };
  }

  accountStatement(
    account: CorporateAccount,
    book: CorporateOrder[],
    accountId: string,
    from: string,
    to: string,
  ) {
    const s = asHttp(() => statement(account, book, from, to));
    const owed = outstanding(book, accountId);
    return { statement: s, owed, health: health(account, owed) };
  }

  /* --------------------------------------------------------- the ops board */

  /** The exception queue, the one thing to do next, and who is struggling. */
  board(live: unknown, done: unknown, riders: Array<{ id: string; name: string }> = []) {
    const liveOrders = Array.isArray(live) ? (live as opsBoard.LiveOrder[]) : [];
    const doneOrders = Array.isArray(done) ? (done as never[]) : [];
    const riderOf = new Map(riders.map((r) => [r.id, r]));
    return {
      exceptions: opsBoard.exceptionQueue(liveOrders),
      by_state: opsBoard.byState(liveOrders),
      per_rider: opsBoard.perRider(liveOrders, doneOrders, riderOf),
      per_merchant: opsBoard.perMerchant(doneOrders),
      failures_by_fault: opsBoard.failuresByFault(doneOrders),
      the_one_thing: opsBoard.theOneThing(liveOrders),
    };
  }
}
