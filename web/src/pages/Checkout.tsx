import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { createOrder, getCatalog, newIdempotencyKey, ApiError } from '../lib/api'
import { confirmAgeThisSession, isAgeConfirmedThisSession } from '../lib/ageSession'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import {
  CASH_NOTES_BWP,
  MINIMUM_ORDER_BWP,
  composeAddress,
  loadEntrance,
  parsePromo,
  promoDiscount,
  saveCashPlan,
  saveEntrance
} from '../lib/checkoutExtras'
import { saveDeliveryAddress } from '../lib/deliveryAddress'
import { recordOrder } from '../lib/orderAgain'
import { PAYMENT_METHODS, type PaymentMethod } from '../lib/types'
import '../styles/fees.css'

// Brief pause after a successful order so the button's success ripple (see
// fees.css, .success-ripple) actually gets to play before the route
// changes, instead of navigating out from under it.
const SUCCESS_RIPPLE_MS = 420

// Delivery fee comes from the merchant record so the checkout total always
// matches the fee promised on the card and hero. The service fee stays a
// flat demo percentage until the real pricing API quotes it.
const FALLBACK_DELIVERY_FEE_BWP = 15
const SERVICE_FEE_RATE = 0.05
// The order minimum lives in checkoutExtras so cards and heroes quote the
// same number this nudge enforces.

// Avoids floating point drift in the fee display (0.05 * 12.10 landing on
// something like 0.6050000000000001 instead of 0.61).
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100
}

export default function Checkout() {
  const { auth } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  // The verified entrance: structured fields the rider can actually find,
  // prefilled from the saved profile (see lib/checkoutExtras.ts).
  const [entrance, setEntrance] = useState(() => loadEntrance())
  const [payment, setPayment] = useState<PaymentMethod>('orange_money')
  // Cash plan: which note the customer hands over. 0 means exact amount.
  const [cashNote, setCashNote] = useState<number>(100)
  const [placing, setPlacing] = useState(false)
  const [justPlaced, setJustPlaced] = useState(false)
  const [error, setError] = useState('')
  const idemKey = useRef(newIdempotencyKey())
  // Guards against React StrictMode's dev-only double effect invocation,
  // which would otherwise seed the cart twice from a single page load.
  const seededRef = useRef(false)

  // 18+ confirm sheet: separate from Merchant.tsx's per-merchant AgeGate.
  // That one guards browsing the vape menu at all and resets whenever the
  // cart switches merchants; this one is a single checkpoint at checkout
  // that, once cleared, stays cleared for the rest of the browser tab (see
  // lib/ageSession.ts), so a returning vape order later in the same
  // session never has to ask again.
  const [showAgeSheet, setShowAgeSheet] = useState(
    () => cart.merchant?.age_restricted === true && !isAgeConfirmedThisSession()
  )

  // Presentation-only figures for the itemised breakdown. None of this
  // touches what gets posted to the API in placeOrder below.
  const subtotal = cart.total
  const deliveryFee = cart.merchant?.deliveryFee ?? FALLBACK_DELIVERY_FEE_BWP
  const serviceFee = roundToCents(subtotal * SERVICE_FEE_RATE)
  const promo = parsePromo(cart.merchant?.promo ?? null)
  const discount = roundToCents(promoDiscount(promo, subtotal, deliveryFee))
  const grandTotal = roundToCents(subtotal + deliveryFee + serviceFee - discount)
  const belowMinimum = subtotal < MINIMUM_ORDER_BWP
  const amountToMinimum = roundToCents(MINIMUM_ORDER_BWP - subtotal)
  const address = composeAddress(entrance)
  // Cash change: only notes that cover the total are offered; if none do,
  // the customer pays the exact amount.
  const offeredNotes = CASH_NOTES_BWP.filter((n) => n >= grandTotal)
  const effectiveNote = offeredNotes.includes(cashNote as (typeof CASH_NOTES_BWP)[number])
    ? cashNote
    : offeredNotes[0] ?? 0
  const cashChange = effectiveNote > 0 ? roundToCents(effectiveNote - grandTotal) : 0

  // Order total in the sticky button gets a brief tabular-nums roll whenever
  // the amount changes upstream (quantity edited in the drawer, etc). Keying
  // the span on a tick that only bumps when the total actually changes
  // replays the CSS entrance animation cleanly, no manual class timers.
  const prevTotalRef = useRef(grandTotal)
  const [totalRollTick, setTotalRollTick] = useState(0)
  useEffect(() => {
    if (prevTotalRef.current !== grandTotal) {
      prevTotalRef.current = grandTotal
      setTotalRollTick((n) => n + 1)
    }
  }, [grandTotal])

  // Demo/video capture only: ?seed=m1 pre-adds two items from that merchant
  // when the cart is empty, so /checkout renders fully from a direct URL
  // instead of showing the "cart is empty" state.
  useEffect(() => {
    if (seededRef.current) return
    const params = new URLSearchParams(window.location.search)
    const seedId = params.get('seed')
    if (!seedId || cart.merchant || cart.lines.length > 0) return
    seededRef.current = true
    getCatalog().then((res) => {
      const found = res.merchants.find((m) => m.id === seedId)
      if (!found) return
      found.items.slice(0, 2).forEach((item) => {
        cart.addItem(found, item.id, item.name, item.price_bwp)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!cart.merchant || cart.lines.length === 0) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="empty-state">
          <div className="glyph">🛒</div>
          <p>Your cart is empty. Pick something tasty first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse merchants
          </button>
        </div>
      </div>
    )
  }

  const merchant = cart.merchant
  const merchantId = merchant.id

  const placeOrder = async () => {
    if (!auth) return
    setPlacing(true)
    setError('')
    try {
      const order = await createOrder(auth.token, idemKey.current, {
        merchant_id: merchantId,
        items: cart.lines.map((l) => ({ item_id: l.item_id, qty: l.qty })),
        payment_method: payment,
        address,
        age_confirmed: cart.ageConfirmed
      })
      // The API never echoes the address back on GET /orders/:id, so the
      // Track page reads it from this cache instead. See lib/deliveryAddress.ts.
      saveDeliveryAddress(order.id, address)
      // The entrance profile persists for the next checkout; the cash plan
      // lets Track show "Rider brings P{change} change".
      saveEntrance(entrance)
      if (payment === 'cash') {
        saveCashPlan(order.id, { noteBwp: effectiveNote, changeBwp: cashChange })
      }
      // Feeds CustomerHome's "Order again" row (see lib/orderAgain.ts).
      recordOrder(merchant)
      // Let the button's success ripple actually play (see fees.css,
      // .success-ripple) before the route changes out from under it.
      // `placing` stays true the whole time, on purpose, so the button
      // cannot be double-tapped while this plays out.
      setJustPlaced(true)
      window.setTimeout(() => {
        cart.clear()
        navigate(`/track/${order.id}`, { replace: true })
      }, SUCCESS_RIPPLE_MS)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AGE_GATE') {
        setError('We need your age confirmed before this order can go through.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('We could not place your order. Please try again.')
      }
      setPlacing(false)
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />

      {showAgeSheet && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-icon">18+</div>
            <h2>Age check</h2>
            <p>
              {merchant.name} sells age restricted items. Please confirm the customer placing this
              order is 18 or older.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/')}>
                Go back
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  confirmAgeThisSession()
                  setShowAgeSheet(false)
                }}
              >
                Confirm, 18 or older
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <h1 className="page-title" style={{ fontSize: 30 }}>
          Checkout
        </h1>
        <p className="page-sub">{merchant.name}</p>

        <div className="section-label" style={{ margin: '4px 0 12px' }}>
          Where the rider finds you
        </div>
        <div className="field pulse-enter" style={{ '--pulse-delay': '0ms' } as CSSProperties}>
          <label htmlFor="entrance-plot">Plot and area</label>
          <input
            id="entrance-plot"
            type="text"
            value={entrance.plot}
            onChange={(e) => setEntrance({ ...entrance, plot: e.target.value })}
          />
        </div>
        <div className="field pulse-enter" style={{ '--pulse-delay': '60ms' } as CSSProperties}>
          <label htmlFor="entrance-landmark">Landmark or gate</label>
          <input
            id="entrance-landmark"
            type="text"
            placeholder="Blue gate opposite ABC Hardware"
            value={entrance.landmark}
            onChange={(e) => setEntrance({ ...entrance, landmark: e.target.value })}
          />
        </div>
        <div className="field pulse-enter" style={{ '--pulse-delay': '120ms' } as CSSProperties}>
          <label htmlFor="entrance-access">Access note, so the rider never has to call</label>
          <input
            id="entrance-access"
            type="text"
            placeholder="Hoot once, the gate opens"
            value={entrance.access}
            onChange={(e) => setEntrance({ ...entrance, access: e.target.value })}
          />
        </div>

        <div className="section-label" style={{ margin: '20px 0 12px' }}>
          Pay with
        </div>
        <div className="pay-grid pulse-stagger">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              className={`pay-chip${payment === pm.id ? ' selected' : ''}`}
              onClick={() => setPayment(pm.id)}
            >
              <div className="pay-name">{pm.label}</div>
              <div className="demo-rail">{pm.rail}</div>
            </button>
          ))}
        </div>

        {payment === 'cash' && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>
              Which note will you pay with?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {offeredNotes.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pay-chip${effectiveNote === n ? ' selected' : ''}`}
                  style={{ flex: '0 0 auto', padding: '10px 16px' }}
                  onClick={() => setCashNote(n)}
                >
                  <div className="pay-name tabular">P{n}</div>
                </button>
              ))}
              <button
                type="button"
                className={`pay-chip${effectiveNote === 0 ? ' selected' : ''}`}
                style={{ flex: '0 0 auto', padding: '10px 16px' }}
                onClick={() => setCashNote(0)}
              >
                <div className="pay-name">Exact amount</div>
              </button>
            </div>
            <div className="summary-line" style={{ marginTop: 10 }}>
              <span>{effectiveNote > 0 ? `You pay with P${effectiveNote}` : 'You pay the exact amount'}</span>
              <span className="tabular">
                {effectiveNote > 0 ? `Rider brings P${cashChange.toFixed(2)} change` : 'No change needed'}
              </span>
            </div>
          </div>
        )}

        <div className="card pulse-enter" style={{ '--pulse-delay': '120ms' } as CSSProperties}>
          {cart.lines.map((line) => (
            <div className="summary-line" key={line.item_id}>
              <span>
                {line.qty} × {line.name}
              </span>
              <span className="tabular">P{(line.qty * line.price_bwp).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-line checkout-subtotal-row">
            <span>Items subtotal</span>
            <span className="tabular">P{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line checkout-fee-row">
            <span>Delivery fee ({merchant.name})</span>
            <span className="tabular">P{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="summary-line checkout-fee-row">
            <span>Service fee</span>
            <span className="tabular">P{serviceFee.toFixed(2)}</span>
          </div>
          {discount > 0 && cart.merchant.promo && (
            <div className="summary-line checkout-fee-row" style={{ color: 'var(--green, #37c26a)' }}>
              <span>{cart.merchant.promo}</span>
              <span className="tabular">-P{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Total</span>
            <span className="tabular">P{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {belowMinimum && (
          <div className="checkout-min-order-nudge">
            Add P{amountToMinimum.toFixed(2)} more from {cart.merchant.name}. Their order
            minimum is P{MINIMUM_ORDER_BWP.toFixed(2)}.
          </div>
        )}

        {error && <div className="login-error" style={{ marginTop: 16 }}>{error}</div>}

        <button
          className={`btn btn-primary btn-block place-order-btn${justPlaced ? ' success-ripple' : ''}`}
          style={{ marginTop: 20 }}
          onClick={placeOrder}
          disabled={placing || !entrance.plot.trim() || belowMinimum}
        >
          {justPlaced ? (
            <>Order placed <span aria-hidden="true">✓</span></>
          ) : placing ? (
            'Placing your order…'
          ) : (
            <>
              Place order ·{' '}
              <span className="tabular checkout-total-roll" key={totalRollTick}>
                P{grandTotal.toFixed(2)}
              </span>
            </>
          )}
        </button>
      </main>
    </div>
  )
}
