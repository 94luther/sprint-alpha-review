/**
 * The PUBLIC demo's entry point.
 *
 * Same real order engine as engine.ts, with the branch directory deliberately left out. That module
 * carries every Sprint office email address and staff mobile number, and a public page is not the
 * place for a company's internal contact list. Only what the phone demo actually calls is exposed.
 */

import * as machine from '../api/src/orders/state_machine';
import * as settlement from '../api/src/orders/settlement';
import * as payments from '../api/src/orders/payments';
import * as cash from '../api/src/orders/cash';
import * as verticals from '../api/src/catalog/verticals';

/* payments carries no secret: every rail it knows about is either switched on or
   plainly marked as waiting on somebody, which is exactly what the checkout screen
   should be showing a customer instead of a list it wrote itself. */
(window as any).Engine = { machine, settlement, payments, cash, verticals };
