import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import SmartImage from '../components/SmartImage'
import { getCatalog } from '../lib/api'
import { useCart } from '../lib/cart'
import { MERCHANT_STATUS_COPY, type CatalogItem, type Merchant as MerchantType } from '../lib/types'

const TYPE_LABEL: Record<string, string> = {
  food: 'Food',
  grocery: 'Grocery',
  vape: 'Vape',
  pharmacy: 'Pharmacy'
}

function AgeGate({ onConfirmed, onCancel }: { onConfirmed: () => void; onCancel: () => void }) {
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')

  const check = () => {
    if (!dob) {
      setError('Please enter your date of birth.')
      return
    }
    const birth = new Date(dob)
    if (Number.isNaN(birth.getTime())) {
      setError('That date does not look right.')
      return
    }
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1
    }
    if (age >= 18) {
      onConfirmed()
    } else {
      setError('Sorry, you need to be 18 or older to shop here.')
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-icon">18+</div>
        <h2>Age check</h2>
        <p>This merchant sells age restricted items. Please confirm your date of birth to continue.</p>
        <div className="field" style={{ textAlign: 'left' }}>
          <label htmlFor="dob">Date of birth</label>
          <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        {error && <div className="login-error">{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
            Go back
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={check}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Merchant() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState<MerchantType | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [gateOpen, setGateOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // A tap that would replace a different merchant's basket parks here until
  // the customer confirms, instead of silently wiping their cart.
  const [pendingAdd, setPendingAdd] = useState<CatalogItem | null>(null)
  const cart = useCart()
  // Guards against React StrictMode's dev-only double effect invocation,
  // which would otherwise fetch the catalog (and demo-seed the cart) twice
  // for the same merchant id.
  const fetchedIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (fetchedIdRef.current === id) return
    fetchedIdRef.current = id

    getCatalog().then((res) => {
      const found = res.merchants.find((m) => m.id === id) || null
      setMerchant(found)
      if (found?.type === 'vape' && !(cart.merchant?.id === found.id && cart.ageConfirmed)) {
        setGateOpen(true)
      }
      // Demo/video capture only: ?drawer=1 opens the cart drawer with two
      // items of this merchant already added, so a capture script can land
      // straight on a populated cart without simulating clicks.
      const params = new URLSearchParams(window.location.search)
      if (found && params.get('drawer') === '1' && cart.count === 0) {
        found.items.slice(0, 2).forEach((item) => {
          cart.addItem(found, item.id, item.name, item.price_bwp)
        })
        setDrawerOpen(true)
      }
    }).catch(() => setError('We could not load this menu just now. Please refresh.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const showMenu = useMemo(() => {
    if (!merchant) return false
    if (merchant.type !== 'vape') return true
    return cart.merchant?.id === merchant.id && cart.ageConfirmed
  }, [merchant, cart.merchant, cart.ageConfirmed])

  if (error) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="empty-state">
          <div className="glyph">⚠</div>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (merchant === undefined) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main" aria-label="Loading menu" aria-busy="true">
          <div className="skeleton-hero">
            <div className="skeleton skeleton-chip skeleton-line narrow" style={{ height: 22, width: 70 }} />
            <div className="skeleton skeleton-line wide" style={{ height: 30, marginTop: 10 }} />
          </div>
          <div className="card">
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton-item-row" key={i}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div className="skeleton skeleton-line wide" />
                  <div className="skeleton skeleton-line narrow" />
                </div>
                <div className="skeleton skeleton-chip" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (merchant === null) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="empty-state">
          <div className="glyph">🔍</div>
          <p>We could not find that merchant.</p>
          <Link to="/" className="btn btn-secondary">
            Back to merchants
          </Link>
        </div>
      </div>
    )
  }

  const isClosed = merchant.status === 'closed'

  // Adding from a different merchant with a non-empty basket asks first.
  const requestAdd = (item: CatalogItem) => {
    if (cart.merchant && cart.merchant.id !== merchant.id && cart.lines.length > 0) {
      setPendingAdd(item)
      return
    }
    cart.addItem(merchant, item.id, item.name, item.price_bwp)
  }

  return (
    <div className="app-shell">
      <AppHeader />

      {pendingAdd && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-icon">🧺</div>
            <h2>Start a new basket?</h2>
            <p>
              Your basket at {cart.merchant?.name} will be cleared. One order serves one shop at a
              time.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPendingAdd(null)}>
                Keep my basket
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  cart.addItem(merchant, pendingAdd.id, pendingAdd.name, pendingAdd.price_bwp)
                  setPendingAdd(null)
                }}
              >
                Start at {merchant.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {gateOpen && !showMenu && (
        <AgeGate
          onConfirmed={() => {
            cart.confirmAge()
            setGateOpen(false)
          }}
          onCancel={() => navigate('/')}
        />
      )}

      <main className="app-main flush" style={{ paddingBottom: cart.count > 0 ? 100 : 24 }}>
        <div className="merchant-hero">
          <SmartImage eager src={merchant.heroImage} alt={merchant.name} />
          <div className="merchant-hero-scrim" />
          <div className="merchant-hero-content">
            <span className={`badge badge-${merchant.type}`}>{TYPE_LABEL[merchant.type]}</span>
            {merchant.age_restricted && (
              <span className="badge badge-age" style={{ marginLeft: 8 }}>
                18+ verification required
              </span>
            )}
            <h1 className="page-title">{merchant.name}</h1>
            <div className="merchant-hero-meta">
              <span className="merchant-rating">
                <span className="star" aria-hidden="true">
                  ★
                </span>
                <span>{merchant.rating.toFixed(1)}</span>
                <span className="count">({merchant.ratingCount})</span>
              </span>
              <span>
                {merchant.etaMinLow}-{merchant.etaMinHigh} min
              </span>
              <span className="merchant-fee-badge tabular">P{merchant.deliveryFee.toFixed(2)} delivery</span>
            </div>
            <div className={`merchant-status merchant-status-${merchant.status} on-hero`}>
              {MERCHANT_STATUS_COPY[merchant.status]}
            </div>
          </div>
        </div>

        <div className="merchant-menu-wrap">
          {merchant.promo && <div className="merchant-promo-pill" style={{ marginBottom: 16 }}>{merchant.promo}</div>}

          {showMenu && (
            <div className="card pulse-stagger">
              {merchant.items.map((item) => {
                const qty = cart.qtyFor(item.id)
                return (
                  <div className="item-row" key={item.id}>
                    <div className="item-info">
                      <div className="name">{item.name}</div>
                      <div className="desc">{item.description}</div>
                      <div className="price tabular">P{item.price_bwp.toFixed(2)}</div>
                    </div>
                    <div className="item-photo-wrap">
                      <SmartImage src={item.photo} alt={item.name} />
                      {isClosed ? (
                        <button className="add-btn preorder" disabled aria-label="Closed, preorder for tomorrow">
                          ⏰
                        </button>
                      ) : qty === 0 ? (
                        <button
                          className="add-btn"
                          onClick={() => requestAdd(item)}
                          aria-label={`Add ${item.name}`}
                        >
                          +
                        </button>
                      ) : (
                        <div className="qty-stepper on-photo">
                          <button onClick={() => cart.setQty(item.id, qty - 1)} aria-label="Remove one">
                            −
                          </button>
                          <span className="count tabular">{qty}</span>
                          <button
                            className="primary"
                            onClick={() => cart.addItem(merchant, item.id, item.name, item.price_bwp)}
                            aria-label="Add one more"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {cart.count > 0 && cart.merchant?.id === merchant.id && (
        <div className="cart-fab cart-fab-bleed">
          <button className="cart-fab-inner" onClick={() => setDrawerOpen(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cart-fab-count">{cart.count}</span>
              View cart
            </span>
            <span className="tabular">P{cart.total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {drawerOpen && (
        <>
          <div className="cart-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-drawer-handle" />
            <div className="section-label" style={{ marginBottom: 12 }}>
              Your cart · {merchant.name}
            </div>
            {cart.lines.map((line) => (
              <div className="cart-line" key={line.item_id}>
                <div className="cart-line-info">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{line.name}</div>
                  <div className="tabular" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    P{line.price_bwp.toFixed(2)} each
                  </div>
                </div>
                <div className="qty-stepper">
                  <button onClick={() => cart.setQty(line.item_id, line.qty - 1)} aria-label="Remove one">
                    −
                  </button>
                  <span className="count tabular">{line.qty}</span>
                  <button
                    className="primary"
                    onClick={() => cart.setQty(line.item_id, line.qty + 1)}
                    aria-label="Add one more"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="cart-total-row">
              <span>Total</span>
              <span className="tabular">P{cart.total.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/checkout')}
            >
              Go to checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
