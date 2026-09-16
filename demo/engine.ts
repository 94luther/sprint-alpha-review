/**
 * The demo's entry point. It exposes the REAL order engine to the page, so nothing on screen is a
 * mock. Every refusal the demo shows is the same code that runs in the API, with the same tests
 * behind it. If the demo says a handover is refused, it is refused for the same reason a rider
 * would see at a real door.
 */

import * as machine from '../api/src/orders/state_machine';
import * as passport from '../api/src/orders/address_passport';
import * as handover from '../api/src/orders/handover';
import * as tracking from '../api/src/orders/tracking';
import * as parcel from '../api/src/orders/parcel';
import * as cash from '../api/src/orders/cash';
import * as corporate from '../api/src/orders/corporate';
import * as offline from '../api/src/orders/offline';
import * as network from '../api/src/orders/network';
import * as settlement from '../api/src/orders/settlement';
import * as ops from '../api/src/orders/ops';
import * as till from '../api/src/orders/till';
import * as liquor from '../api/src/orders/liquor';

(window as any).Engine = { machine, passport, handover, tracking, parcel, cash, corporate, offline, liquor, network, settlement, ops, till };
