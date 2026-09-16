// Promo math, cash-change planning, and the saved entrance profile.
// All client side: the demo API neither prices promos nor stores entrances,
// so checkout computes honestly here and Track reads the caches back.

// One source of truth for the order minimum, shown on cards, heroes and the
// checkout nudge alike so no surface promises a different number.
export const MINIMUM_ORDER_BWP = 50

export type ParsedPromo =
  | { kind: 'percent'; percent: number; capBwp: number }
  | { kind: 'free_delivery' }

// Understands the two promo shapes the seed uses: "20% off, up to P30" and
// "Free delivery on your first order". Anything else shows as a pill only.
export function parsePromo(promo: string | null): ParsedPromo | null {
  if (!promo) return null
  const pct = promo.match(/(\d+)%\s*off(?:.*?P(\d+(?:\.\d+)?))?/i)
  if (pct) {
    return {
      kind: 'percent',
      percent: Number(pct[1]),
      capBwp: pct[2] ? Number(pct[2]) : Number.POSITIVE_INFINITY
    }
  }
  if (/free\s+delivery/i.test(promo)) return { kind: 'free_delivery' }
  return null
}

export function promoDiscount(
  parsed: ParsedPromo | null,
  itemsSubtotal: number,
  deliveryFee: number
): number {
  if (!parsed) return 0
  if (parsed.kind === 'free_delivery') return deliveryFee
  const raw = (itemsSubtotal * parsed.percent) / 100
  return Math.round(Math.min(raw, parsed.capBwp) * 100) / 100
}

// Cash orders: which note the customer will hand over, so the rider arrives
// carrying the right change instead of negotiating at the gate.
export const CASH_NOTES_BWP = [50, 100, 200] as const

export interface CashPlan {
  noteBwp: number // 0 means exact amount
  changeBwp: number
}

const CASH_KEY_PREFIX = 'sprint.cashPlan.'

export function saveCashPlan(orderId: string, plan: CashPlan): void {
  try {
    window.localStorage.setItem(CASH_KEY_PREFIX + orderId, JSON.stringify(plan))
  } catch {
    // Storage unavailable: Track simply omits the change line.
  }
}

export function loadCashPlan(orderId: string): CashPlan | null {
  try {
    const raw = window.localStorage.getItem(CASH_KEY_PREFIX + orderId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CashPlan
    if (typeof parsed?.changeBwp !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

// The verified entrance: plot, landmark, access note. Saved once, prefilled
// on every later checkout. This is the "rider finds the gate without
// calling" record the council named the defensible asset.
export interface EntranceProfile {
  plot: string
  landmark: string
  access: string
}

const ENTRANCE_KEY = 'sprint.entrance.v1'

export const DEFAULT_ENTRANCE: EntranceProfile = {
  plot: 'Plot 2147, Block 8, Gaborone',
  landmark: 'Blue gate opposite ABC Hardware',
  access: ''
}

export function saveEntrance(profile: EntranceProfile): void {
  try {
    window.localStorage.setItem(ENTRANCE_KEY, JSON.stringify(profile))
  } catch {
    // Storage unavailable: next checkout falls back to the defaults.
  }
}

export function loadEntrance(): EntranceProfile {
  try {
    const raw = window.localStorage.getItem(ENTRANCE_KEY)
    if (!raw) return DEFAULT_ENTRANCE
    const parsed = JSON.parse(raw) as EntranceProfile
    if (typeof parsed?.plot !== 'string') return DEFAULT_ENTRANCE
    return { ...DEFAULT_ENTRANCE, ...parsed }
  } catch {
    return DEFAULT_ENTRANCE
  }
}

// What the API and the rider actually receive: one composed address line.
export function composeAddress(profile: EntranceProfile): string {
  const parts = [profile.plot.trim(), profile.landmark.trim(), profile.access.trim()]
  return parts.filter(Boolean).join(' · ')
}
