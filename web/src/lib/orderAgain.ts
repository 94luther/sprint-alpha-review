// Session-scoped "recently ordered from" list, feeding CustomerHome's
// "Order again" row (see pages/CustomerHome.tsx). Recorded from Checkout.tsx
// the moment an order actually places. sessionStorage, not localStorage: the
// row is meant to reflect this visit, not follow the customer forever.
import type { Merchant } from './types'

const KEY = 'sprint.orderAgain'
const MAX_ENTRIES = 5

export interface OrderAgainEntry {
  merchantId: string
  name: string
  heroImage: string
  type: Merchant['type']
}

function readAll(): OrderAgainEntry[] {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(entries: OrderAgainEntry[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    // Private browsing or storage disabled: the row just will not appear,
    // which is a safe direction to fail in.
  }
}

export function recordOrder(merchant: Merchant): void {
  const existing = readAll().filter((e) => e.merchantId !== merchant.id)
  const next: OrderAgainEntry[] = [
    { merchantId: merchant.id, name: merchant.name, heroImage: merchant.heroImage, type: merchant.type },
    ...existing
  ].slice(0, MAX_ENTRIES)
  writeAll(next)
}

export function getRecentOrders(): OrderAgainEntry[] {
  return readAll()
}
