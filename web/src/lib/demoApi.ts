// In-browser stand-in for the whole Sprint alpha API, used only when built
// with VITE_DEMO_STANDALONE=1 (see api.ts and socket.ts, the two files that
// pick between this and the real fetch/socket.io clients). Every endpoint
// the app calls is reproduced here against the seed data in demoSeed.ts,
// entirely in memory, so the built index.html needs no server at all: it
// can be opened straight off disk, published as a Claude artifact, or
// opened on a phone with no localhost:4000 behind it.
//
// Orders placed here auto-progress through their lifecycle on plain
// setTimeout timers (see ORDER_LIFECYCLE below) instead of the real API's
// random-interval simulator, so a demo on a phone always tells the same
// story at the same pace: confirmed at 3s, a rider assigned at 8s, picked
// up at 15s, visibly closing in at 25s, delivered at 40s.
import foodImages from '../assets/food'
import { ApiError } from './apiError'
import { DEMO_COURIER_NAMES, DEMO_CUSTOMER_PIN, DEMO_MERCHANTS, WAYPOINTS, type DemoMerchantSeed } from './demoSeed'
import type {
  AuthResult,
  CatalogResponse,
  CreateOrderPayload,
  DispatchScoreEntry,
  LastDispatch,
  Merchant,
  OpsCourier,
  OpsState,
  Order,
  OrderCourier,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PayoutSplit,
  Role,
  TimelineEntry
} from './types'

// ---------------------------------------------------------------------
// Tiny pub/sub standing in for the real /rt socket.io namespace. Only the
// two methods every page actually calls (see socket.ts, Track/Courier/Ops)
// need to exist: on and off. socket.ts hands this back cast as a Socket so
// no page needs to know the difference.
type Handler = (...args: any[]) => void

class DemoSocket {
  private handlers = new Map<string, Set<Handler>>()

  on(event: string, handler: Handler): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return this
  }

  off(event: string, handler?: Handler): this {
    if (!handler) {
      this.handlers.delete(event)
      return this
    }
    this.handlers.get(event)?.delete(handler)
    return this
  }

  emit(event: string, ...args: unknown[]): this {
    this.handlers.get(event)?.forEach((h) => h(...args))
    return this
  }

  disconnect(): void {
    this.handlers.clear()
  }
}

let demoSocket: DemoSocket | null = null

export function getDemoSocket(): DemoSocket {
  if (!demoSocket) demoSocket = new DemoSocket()
  return demoSocket
}

// ---------------------------------------------------------------------
// Catalog: seed merchants with their /food/*.jpg references swapped for the
// bundled data: URIs (see src/assets/food/index.ts). Computed once, module
// load time, and reused for every getCatalog() call.
function resolvePhoto(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return foodImages[filename] ?? path
}

function buildCatalogMerchant(seed: DemoMerchantSeed): Merchant {
  return {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    age_restricted: seed.age_restricted,
    heroImage: resolvePhoto(seed.heroImage),
    rating: seed.rating,
    ratingCount: seed.ratingCount,
    etaMinLow: seed.etaMinLow,
    etaMinHigh: seed.etaMinHigh,
    deliveryFee: seed.deliveryFee,
    promo: seed.promo,
    status: seed.status,
    items: seed.items.map((item) => ({ ...item, photo: resolvePhoto(item.photo) }))
  }
}

const CATALOG: CatalogResponse = { merchants: DEMO_MERCHANTS.map(buildCatalogMerchant) }

function findMerchantSeed(id: string): DemoMerchantSeed | undefined {
  return DEMO_MERCHANTS.find((m) => m.id === id)
}

// ---------------------------------------------------------------------
// Auth: the same three quick-sign-in demo users the real seed creates
// (see api/src/data-store/seed.ts and Login.tsx's QUICK_USERS), just
// checked in memory instead of against a bcrypt hash over the wire.
interface DemoUser {
  phone: string
  pin: string
  role: Role
  name: string
  token: string
}

const DEMO_USERS: DemoUser[] = [
  { phone: '71111111', pin: '1234', role: 'customer', name: 'Neo', token: 'demo-token-neo' },
  { phone: '72222222', pin: '1234', role: 'courier', name: 'Kabelo', token: 'demo-token-kabelo' },
  { phone: '73333333', pin: '1234', role: 'ops', name: 'Amo', token: 'demo-token-amo' }
]

export async function login(phone: string, pin: string): Promise<AuthResult> {
  const user = DEMO_USERS.find((u) => u.phone === phone.trim() && u.pin === pin.trim())
  if (!user) {
    throw new ApiError(
      'That phone number or pin is not recognised. Try one of the quick sign-in options above.',
      401,
      'INVALID_CREDENTIALS'
    )
  }
  return { token: user.token, role: user.role, name: user.name }
}

export async function getCatalog(): Promise<CatalogResponse> {
  return CATALOG
}

// ---------------------------------------------------------------------
// Couriers: 5 named riders wandering Gaborone, same names the real seed
// hands out. Positions and status live in one module-level registry so
// Ops's "Couriers online" board and each order's assigned rider share a
// single source of truth.
interface DemoCourier {
  id: string
  name: string
  status: 'online' | 'offered' | 'busy' | 'offline'
  lat: number
  lng: number
  rating: number
  earnings_today_bwp: number
}

const COURIERS: DemoCourier[] = DEMO_COURIER_NAMES.map((name, i) => {
  const wp = WAYPOINTS[i % WAYPOINTS.length]
  return {
    id: `c${i + 1}`,
    name,
    status: 'online',
    lat: wp.lat,
    lng: wp.lng,
    // Fixed, not Math.random: two loads of the same demo should look the
    // same, matching the determinism convention the rest of this app's
    // decorative/randomised bits already follow (see GaboroneMap.tsx).
    rating: [4.9, 4.6, 4.8, 4.7, 4.95][i] ?? 4.7,
    earnings_today_bwp: [60, 35, 80, 20, 45][i] ?? 40
  }
})

function medianEarnings(): number {
  const sorted = COURIERS.map((c) => c.earnings_today_bwp).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Mirrors api/src/dispatch/dispatch.service.ts's scoring formula (distance
// swapped for a plain haversine km instead of h3 ring distance, since there
// is no backend here to run h3-js against). Lower score still wins.
function scoreCouriers(merchant: DemoMerchantSeed): DispatchScoreEntry[] {
  const median = medianEarnings()
  return COURIERS.map((c) => {
    const distanceKm = haversineKm(merchant.pickup, { lat: c.lat, lng: c.lng })
    const eta_min = Math.round((2 + distanceKm * 3) * 10) / 10
    const active_load = c.status === 'busy' || c.status === 'offered' ? 1 : 0
    const rating_gap = Math.round((5 - c.rating) * 10) / 10
    const fairness_boost = c.earnings_today_bwp < median ? 1 : 0
    const score = 0.5 * eta_min + 1.0 * active_load + 0.2 * rating_gap - 1.5 * fairness_boost
    return {
      courier_id: c.id,
      courier_name: c.name,
      score: Math.round(score * 1000) / 1000,
      components: { eta_min, active_load, rating_gap, fairness_boost }
    }
  })
}

// ---------------------------------------------------------------------
// Orders: one in-memory record per placed order, advanced by five
// setTimeout ticks. Kept in a module-level map so getOrder/getOpsState can
// read it back and so a Track page still finds the order after a refresh
// within the same tab (a real reload loses it, same as the real app loses
// its socket subscription, this is a demo, not a persistence layer).
const CONFIRMED_MS = 3000
const OFFERED_MS = 6000
const ASSIGNED_MS = 8000
const PICKED_UP_MS = 15000
const ARRIVING_MS = 25000
const DELIVERED_MS = 40000

interface DemoOrderRecord {
  id: string
  merchant: DemoMerchantSeed
  items: OrderItem[]
  total_bwp: number
  payment_method: PaymentMethod
  address: string
  age_confirmed: boolean
  status: OrderStatus
  timeline: TimelineEntry[]
  courier: OrderCourier | null
  courierId: string | null
  eta_min: number | null
  payout_split?: PayoutSplit
}

const ORDERS = new Map<string, DemoOrderRecord>()
const IDEMPOTENCY = new Map<string, string>() // `${token}:${idemKey}` -> order id
let lastDispatch: LastDispatch | null = null

function nowIso(): string {
  return new Date().toISOString()
}

function pushStatus(order: DemoOrderRecord, status: OrderStatus) {
  order.status = status
  order.timeline.push({ status, at: nowIso() })
  getDemoSocket().emit('order_status', { order_id: order.id, status })
}

function emitCourierLocation(courier: DemoCourier) {
  getDemoSocket().emit('courier_locations', [
    { id: courier.id, lat: courier.lat, lng: courier.lng, status: courier.status }
  ])
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

// Merchant/courier/Sprint split, revealed once delivered (see Track.tsx's
// "Who gets what after delivery" card). No real ledger service here, so a
// flat 70/20/10 split of the order total stands in for it; the last leg
// absorbs the rounding remainder so the three always add back to the total.
function computeSplit(total: number): PayoutSplit {
  const merchant_bwp = roundMoney(total * 0.7)
  const courier_bwp = roundMoney(total * 0.2)
  const sprint_bwp = roundMoney(total - merchant_bwp - courier_bwp)
  return { merchant_bwp, courier_bwp, sprint_bwp }
}

function scheduleLifecycle(order: DemoOrderRecord) {
  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    pushStatus(order, 'paid')
  }, CONFIRMED_MS)

  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    pushStatus(order, 'dispatch.offered')
    const scores = scoreCouriers(order.merchant)
    lastDispatch = { order_id: order.id, scores }
    const winner = scores.slice().sort((a, b) => a.score - b.score)[0]
    if (winner) {
      const courier = COURIERS.find((c) => c.id === winner.courier_id)
      if (courier) courier.status = 'offered'
    }
    getDemoSocket().emit('dispatch_scored', { order_id: order.id, scores })
  }, OFFERED_MS)

  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    const winnerId = lastDispatch?.order_id === order.id
      ? lastDispatch.scores.slice().sort((a, b) => a.score - b.score)[0]?.courier_id
      : null
    const courier = (winnerId && COURIERS.find((c) => c.id === winnerId)) || COURIERS[0]
    courier.status = 'busy'
    courier.lat = order.merchant.pickup.lat
    courier.lng = order.merchant.pickup.lng
    order.courierId = courier.id
    order.courier = { name: courier.name, rating: courier.rating, lat: courier.lat, lng: courier.lng }
    order.eta_min = Math.round(haversineKm(courier, DEMO_CUSTOMER_PIN) * 3 + 6)
    pushStatus(order, 'dispatch.accepted')
    emitCourierLocation(courier)
  }, ASSIGNED_MS)

  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    const courier = order.courierId ? COURIERS.find((c) => c.id === order.courierId) : null
    if (courier && order.courier) {
      courier.lat = lerp(order.merchant.pickup.lat, DEMO_CUSTOMER_PIN.lat, 0.25)
      courier.lng = lerp(order.merchant.pickup.lng, DEMO_CUSTOMER_PIN.lng, 0.25)
      order.courier = { ...order.courier, lat: courier.lat, lng: courier.lng }
      order.eta_min = order.eta_min != null ? Math.max(3, Math.round(order.eta_min * 0.6)) : 10
      emitCourierLocation(courier)
    }
    pushStatus(order, 'picked_up')
  }, PICKED_UP_MS)

  // "Arriving": the rider visibly closes the last stretch to the customer
  // pin. OrderStatus has no dedicated "arriving" value (see lib/types.ts),
  // so this tick moves the courier and trims the eta without a status
  // change, then still nudges order_status so any page polling/listening
  // (Track, Ops) refreshes and picks up the new position right away.
  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    const courier = order.courierId ? COURIERS.find((c) => c.id === order.courierId) : null
    if (courier && order.courier) {
      courier.lat = lerp(order.merchant.pickup.lat, DEMO_CUSTOMER_PIN.lat, 0.75)
      courier.lng = lerp(order.merchant.pickup.lng, DEMO_CUSTOMER_PIN.lng, 0.75)
      order.courier = { ...order.courier, lat: courier.lat, lng: courier.lng }
      order.eta_min = 4
      emitCourierLocation(courier)
    }
    getDemoSocket().emit('order_status', { order_id: order.id, status: order.status })
  }, ARRIVING_MS)

  window.setTimeout(() => {
    if (!ORDERS.has(order.id)) return
    const courier = order.courierId ? COURIERS.find((c) => c.id === order.courierId) : null
    if (courier && order.courier) {
      courier.lat = DEMO_CUSTOMER_PIN.lat
      courier.lng = DEMO_CUSTOMER_PIN.lng
      order.courier = { ...order.courier, lat: courier.lat, lng: courier.lng }
    }
    order.eta_min = 0
    order.payout_split = computeSplit(order.total_bwp)
    pushStatus(order, 'delivered')
    if (courier) {
      emitCourierLocation(courier)
      // Free the rider back up so the demo does not permanently show every
      // courier as busy if the page is left open past one delivery.
      window.setTimeout(() => {
        courier.status = 'online'
        emitCourierLocation(courier)
      }, 2000)
    }
  }, DELIVERED_MS)
}

function toPublicOrder(order: DemoOrderRecord): Order {
  return {
    id: order.id,
    merchant_id: order.merchant.id,
    merchant_name: order.merchant.name,
    items: order.items,
    payment_method: order.payment_method,
    address: order.address,
    age_confirmed: order.age_confirmed,
    status: order.status,
    timeline: order.timeline,
    courier: order.courier ?? undefined,
    eta_min: order.eta_min ?? undefined,
    total_bwp: order.total_bwp,
    payout_split: order.payout_split
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function createOrder(
  token: string,
  idempotencyKey: string,
  payload: CreateOrderPayload
): Promise<Order> {
  const idemLookupKey = `${token}:${idempotencyKey}`
  const existingId = IDEMPOTENCY.get(idemLookupKey)
  if (existingId) {
    const existing = ORDERS.get(existingId)
    if (existing) return toPublicOrder(existing)
  }

  const merchant = findMerchantSeed(payload.merchant_id)
  if (!merchant) {
    throw new ApiError('We could not find that merchant.', 400)
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ApiError('Please add at least one item to the order.', 400)
  }
  if (!payload.address || !payload.address.trim()) {
    throw new ApiError('A delivery address is needed.', 400)
  }
  if (merchant.age_restricted && payload.age_confirmed !== true) {
    throw new ApiError(
      'Please confirm the customer is 18 or older before we can place this order.',
      403,
      'AGE_GATE'
    )
  }

  const items: OrderItem[] = payload.items.map((it) => {
    const found = merchant.items.find((mi) => mi.id === it.item_id)
    if (!found) {
      throw new ApiError(`Item ${it.item_id} is not on ${merchant.name}'s menu.`, 400)
    }
    if (!it.qty || it.qty < 1) {
      throw new ApiError(`Quantity for ${found.name} needs to be at least 1.`, 400)
    }
    return { item_id: found.id, qty: it.qty, name: found.name, price_bwp: found.price_bwp }
  })

  const total_bwp = roundMoney(items.reduce((sum, it) => sum + (it.price_bwp ?? 0) * it.qty, 0))

  const order: DemoOrderRecord = {
    id: newId(),
    merchant,
    items,
    total_bwp,
    payment_method: payload.payment_method,
    address: payload.address.trim(),
    age_confirmed: payload.age_confirmed === true,
    status: 'placed',
    timeline: [{ status: 'placed', at: nowIso() }],
    courier: null,
    courierId: null,
    eta_min: null
  }

  ORDERS.set(order.id, order)
  IDEMPOTENCY.set(idemLookupKey, order.id)
  scheduleLifecycle(order)

  return toPublicOrder(order)
}

export async function getOrder(_token: string, orderId: string): Promise<Order> {
  const order = ORDERS.get(orderId)
  if (!order) {
    throw new ApiError('We could not find that order.', 404)
  }
  return toPublicOrder(order)
}

export async function getOpsState(_token: string): Promise<OpsState> {
  const couriers: OpsCourier[] = COURIERS.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    lat: c.lat,
    lng: c.lng,
    rating: c.rating,
    earnings_today_bwp: c.earnings_today_bwp
  }))
  const orders: Order[] = Array.from(ORDERS.values()).map(toPublicOrder)
  return { couriers, orders, last_dispatch: lastDispatch }
}
