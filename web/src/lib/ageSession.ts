// Session-level 18+ confirmation, separate from cart.ageConfirmed (see
// lib/cart.tsx), which only covers "this cart, this merchant" and resets
// the moment the customer switches merchants. This one is sticky for the
// whole browser tab: once confirmed at checkout, it never asks again this
// session, even for a different age-restricted merchant later on.
const KEY = 'sprint.ageConfirmedSession'

export function isAgeConfirmedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function confirmAgeThisSession(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Private browsing or storage disabled: the sheet will just ask again
    // next time, which is a safe direction to fail in.
  }
}
