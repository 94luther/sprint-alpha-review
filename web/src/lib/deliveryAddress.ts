// Client only cache for the address typed at checkout.
//
// The API's GET /orders/:id response (see
// api/src/orders/orders.service.ts, toPublicOrder) never echoes the
// address back, it stays encrypted at rest on purpose as the demo's "look,
// it is really encrypted" talking point. The Track page therefore cannot
// read it off the order object. Checkout already has the plain text the
// customer typed, so it is stashed here, keyed by order id, purely for
// this page's UI. No API change needed or made.
const KEY_PREFIX = 'sprint.deliveryAddress.'

export function saveDeliveryAddress(orderId: string, address: string): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + orderId, address)
  } catch {
    // Private browsing or storage disabled: the demo still works, callers
    // just fall back to a generic placeholder.
  }
}

export function loadDeliveryAddress(orderId: string): string | null {
  try {
    return window.localStorage.getItem(KEY_PREFIX + orderId)
  } catch {
    return null
  }
}
