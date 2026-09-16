export type Role = 'customer' | 'courier' | 'ops'

export interface AuthResult {
  token: string
  role: Role
  name: string
}

export type MerchantType = 'food' | 'grocery' | 'vape' | 'pharmacy'

export interface CatalogItem {
  id: string
  name: string
  price_bwp: number
  photo: string
  description: string
}

export interface Merchant {
  id: string
  name: string
  type: MerchantType
  age_restricted: boolean
  items: CatalogItem[]
  heroImage: string
  rating: number
  ratingCount: number
  etaMinLow: number
  etaMinHigh: number
  deliveryFee: number
  promo: string | null
  status: MerchantStatus
}

export type MerchantStatus = 'open' | 'busy' | 'closed'

// One copy string per live status, shown under the merchant name on cards
// and on the merchant hero. Closed merchants can be browsed but not ordered.
export const MERCHANT_STATUS_COPY: Record<MerchantStatus, string> = {
  open: 'Open · accepting orders',
  busy: 'Busy · next delivery in about 15 min',
  closed: 'Closed · preorder for tomorrow'
}

export interface CatalogResponse {
  merchants: Merchant[]
}

export type PaymentMethod = 'orange_money' | 'myzaka' | 'smega' | 'card' | 'cash'

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; rail: string }[] = [
  { id: 'orange_money', label: 'Orange Money', rail: 'Demo rail' },
  { id: 'myzaka', label: 'MyZaka', rail: 'Demo rail' },
  { id: 'smega', label: 'Smega', rail: 'Demo rail' },
  { id: 'card', label: 'Card', rail: 'Demo rail' },
  { id: 'cash', label: 'Cash', rail: 'Demo rail, pay on delivery' }
]

// Order lifecycle, in order. Matches the statuses the api reports on
// GET /orders/:id and on the order_status socket event.
export type OrderStatus =
  | 'placed'
  | 'paid'
  | 'dispatch.offered'
  | 'dispatch.accepted'
  | 'picked_up'
  | 'delivered'

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'placed', label: 'Order placed' },
  { status: 'paid', label: 'Payment confirmed' },
  { status: 'dispatch.offered', label: 'Finding a courier' },
  { status: 'dispatch.accepted', label: 'Courier assigned' },
  { status: 'picked_up', label: 'Picked up' },
  { status: 'delivered', label: 'Delivered' }
]

export interface TimelineEntry {
  status: OrderStatus
  at: string
}

export interface OrderCourier {
  name: string
  rating: number
  lat: number
  lng: number
}

export interface PayoutSplit {
  merchant_bwp: number
  courier_bwp: number
  sprint_bwp: number
}

export interface OrderItem {
  item_id: string
  qty: number
  name?: string
  price_bwp?: number
}

export interface Order {
  id: string
  merchant_id: string
  merchant_name?: string
  items: OrderItem[]
  payment_method: PaymentMethod
  address: string
  age_confirmed?: boolean
  status: OrderStatus
  timeline: TimelineEntry[]
  courier?: OrderCourier
  eta_min?: number
  total_bwp?: number
  payout_split?: PayoutSplit
}

export interface CreateOrderPayload {
  merchant_id: string
  items: { item_id: string; qty: number }[]
  payment_method: PaymentMethod
  address: string
  age_confirmed?: boolean
}

export interface ApiErrorBody {
  code?: string
  message?: string
}

export interface OpsCourier {
  id: string
  name: string
  status: string
  lat: number
  lng: number
  h3?: string
  rating: number
  earnings_today_bwp: number
}

export interface ScoreComponents {
  eta_min: number
  active_load: number
  rating_gap: number
  fairness_boost: number
}

export interface DispatchScoreEntry {
  courier_id: string
  courier_name: string
  score: number
  components: ScoreComponents
}

export interface LastDispatch {
  order_id: string
  scores: DispatchScoreEntry[]
}

export interface OpsState {
  couriers: OpsCourier[]
  orders: Order[]
  last_dispatch: LastDispatch | null
}

export interface CourierLocationEvent {
  id: string
  lat: number
  lng: number
  status: string
}

export interface OrderStatusEvent {
  order_id: string
  status: OrderStatus
}

export interface DispatchScoredEvent {
  order_id: string
  scores: DispatchScoreEntry[]
}
