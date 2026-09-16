import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import SmartImage from '../components/SmartImage'
import { getCatalog } from '../lib/api'
import { useCart } from '../lib/cart'
import { MINIMUM_ORDER_BWP } from '../lib/checkoutExtras'
import { isLiteMode } from '../lib/liteMode'
import { getRecentOrders, type OrderAgainEntry } from '../lib/orderAgain'
import { MERCHANT_STATUS_COPY, type Merchant, type MerchantType } from '../lib/types'
import '../styles/discovery.css'

const TYPE_LABEL: Record<string, string> = {
  food: 'Food',
  grocery: 'Grocery',
  vape: 'Vape',
  pharmacy: 'Pharmacy'
}

// Category icon carousel data: one representative /food/ crop and one
// Glovo-style saturated accent per category, plus the imagery/colour for
// the "All" chip. Order fixed here (not insertion order) so the row reads
// the same every time the catalog loads.
const CATEGORY_META: Record<MerchantType, { image: string; color: string }> = {
  food: { image: '/food/burger.jpg', color: 'var(--cat-food)' },
  grocery: { image: '/food/grocery.jpg', color: 'var(--cat-grocery)' },
  pharmacy: { image: '/food/pharmacy.jpg', color: 'var(--cat-pharmacy)' },
  vape: { image: '/food/market.jpg', color: 'var(--cat-vape)' }
}
const CATEGORY_ORDER: MerchantType[] = ['food', 'grocery', 'pharmacy', 'vape']
const ALL_CATEGORY = { image: '/food/riceburger.jpg', color: 'var(--cat-all)' }

type CategoryFilter = 'all' | MerchantType

const PROMO_BANNERS = [
  { id: 'free-delivery', className: 'free-delivery', title: 'Free delivery on your first order' },
  { id: 'sprint-service', className: 'sprint-service', title: 'Sprint Service: within the hour in Gaborone' }
]
const PROMO_CYCLE_MS = 4200

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="merchant-rating">
      <span className="star" aria-hidden="true">
        ★
      </span>
      <span>{rating.toFixed(1)}</span>
      <span className="count">({count})</span>
    </span>
  )
}

export default function CustomerHome() {
  const navigate = useNavigate()
  const cart = useCart()
  const [merchants, setMerchants] = useState<Merchant[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<CategoryFilter>('all')
  const [pillPressed, setPillPressed] = useState(false)
  const [pressedTab, setPressedTab] = useState<string | null>(null)
  const [promoIndex, setPromoIndex] = useState(0)
  const promoRailRef = useRef<HTMLDivElement>(null)
  // "Order again" row: read once on mount and again whenever this page
  // regains focus (a customer bouncing back from /track after placing an
  // order is exactly when a fresh entry needs to show up), see
  // lib/orderAgain.ts for where it gets written.
  const [recentOrders, setRecentOrders] = useState<OrderAgainEntry[]>(() => getRecentOrders())

  useEffect(() => {
    getCatalog()
      .then((res) => setMerchants(res.merchants))
      .catch(() => setError('We could not load the merchants just now. Please refresh.'))
  }, [])

  useEffect(() => {
    const onFocus = () => setRecentOrders(getRecentOrders())
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  // Auto-cycling promo carousel, paused entirely for anyone who asked for
  // reduced motion (respect the swipe) or turned on lite mode (respect the
  // data bundle).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (isLiteMode()) return
    const id = window.setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_BANNERS.length)
    }, PROMO_CYCLE_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const rail = promoRailRef.current
    if (!rail) return
    rail.scrollTo({ left: promoIndex * rail.clientWidth, behavior: 'smooth' })
  }, [promoIndex])

  // Only offer a chip for a category that actually has a merchant in it
  // today, so the row never promises a type the catalog cannot deliver.
  const categories = useMemo(() => {
    if (!merchants) return []
    const present = new Set(merchants.map((m) => m.type))
    return CATEGORY_ORDER.filter((type) => present.has(type))
  }, [merchants])

  const filteredMerchants = useMemo(() => {
    if (!merchants) return null
    const q = query.trim().toLowerCase()
    return merchants.filter((m) => {
      if (activeType !== 'all' && m.type !== activeType) return false
      if (!q) return true
      if (m.name.toLowerCase().includes(q)) return true
      return m.items.some((item) => item.name.toLowerCase().includes(q))
    })
  }, [merchants, query, activeType])

  const clearFilters = () => {
    setQuery('')
    setActiveType('all')
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main" style={{ paddingBottom: 'calc(var(--tabbar-h) + var(--space-4))' }}>
        <button
          type="button"
          className={`location-pill${pillPressed ? ' pressed' : ''}`}
          onClick={() => setPillPressed(true)}
          onAnimationEnd={() => setPillPressed(false)}
        >
          <span className="pin" aria-hidden="true">
            📍
          </span>
          <span className="addr">Deliver to Plot 2147, Block 8</span>
        </button>

        {error && <div className="login-error">{error}</div>}

        {recentOrders.length > 0 && (
          <>
            <div className="section-label" style={{ margin: '4px 0 8px' }}>
              Order again
            </div>
            <div className="category-carousel" role="group" aria-label="Order again">
              {recentOrders.map((entry) => (
                <Link to={`/merchant/${entry.merchantId}`} className="category-chip" key={entry.merchantId}>
                  <span
                    className="category-chip-ring"
                    style={{ '--cat-ring': CATEGORY_META[entry.type]?.color ?? 'var(--cat-all)' } as CSSProperties}
                  >
                    <SmartImage src={entry.heroImage} alt="" />
                  </span>
                  <span
                    className="category-chip-label"
                    style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {entry.name}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="discovery-bar">
          <div className="discovery-search">
            <label htmlFor="merchant-search" className="sr-only">
              Search merchants and items
            </label>
            <span className="search-glyph" aria-hidden="true">
              🔍
            </span>
            <input
              id="merchant-search"
              type="search"
              className="discovery-search-input"
              placeholder="Search a shop or an item, like seswaa or airtime"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {!merchants && !error && (
          <div className="merchant-grid" aria-label="Loading merchants" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div className="skeleton-merchant-card" key={i}>
                <div className="skeleton skeleton-top" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton-line wide" />
                  <div className="skeleton skeleton-line narrow" />
                </div>
              </div>
            ))}
          </div>
        )}

        {merchants && (
          <>
            <div className="discovery-bar">
              <div className="category-carousel" role="group" aria-label="Filter by category">
                <button
                  type="button"
                  className={`category-chip${activeType === 'all' ? ' active' : ''}`}
                  aria-pressed={activeType === 'all'}
                  onClick={() => setActiveType('all')}
                >
                  <span className="category-chip-ring" style={{ '--cat-ring': ALL_CATEGORY.color } as CSSProperties}>
                    <SmartImage src={ALL_CATEGORY.image} alt="" />
                  </span>
                  <span className="category-chip-label">All</span>
                </button>
                {categories.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`category-chip${activeType === type ? ' active' : ''}`}
                    aria-pressed={activeType === type}
                    onClick={() => setActiveType(type)}
                  >
                    <span
                      className="category-chip-ring"
                      style={{ '--cat-ring': CATEGORY_META[type].color } as CSSProperties}
                    >
                      <SmartImage src={CATEGORY_META[type].image} alt="" />
                    </span>
                    <span className="category-chip-label">{TYPE_LABEL[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="promo-carousel" ref={promoRailRef}>
              {PROMO_BANNERS.map((banner) => (
                <div className={`promo-card ${banner.className}`} key={banner.id}>
                  <div className="promo-card-title">{banner.title}</div>
                </div>
              ))}
            </div>
            <div className="promo-dots" aria-hidden="true">
              {PROMO_BANNERS.map((banner, i) => (
                <span key={banner.id} className={`promo-dot${i === promoIndex ? ' active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {filteredMerchants && filteredMerchants.length === 0 && (
          <div className="empty-state">
            <div className="glyph">🔍</div>
            <p>
              {query.trim()
                ? `Nothing matches "${query.trim()}". Try seswaa, milk or airtime.`
                : `No ${activeType === 'all' ? '' : TYPE_LABEL[activeType] + ' '}shops here yet. More are joining Sprint every week.`}
            </p>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        {filteredMerchants && filteredMerchants.length > 0 && (
          <div className="merchant-grid pulse-stagger">
            {filteredMerchants.map((m) => (
              <Link to={`/merchant/${m.id}`} className="merchant-card" key={m.id}>
                <div className="merchant-card-hero">
                  <SmartImage eager src={m.heroImage} alt={m.name} />
                  {m.age_restricted && (
                    <span className="badge badge-age merchant-card-age-badge">18+</span>
                  )}
                </div>
                <div className="merchant-card-body">
                  <div className="merchant-name">{m.name}</div>
                  <div className={`merchant-status merchant-status-${m.status}`}>
                    {MERCHANT_STATUS_COPY[m.status]}
                  </div>
                  <div className="merchant-meta">
                    <StarRating rating={m.rating} count={m.ratingCount} />
                    <span>
                      {m.etaMinLow}-{m.etaMinHigh} min
                    </span>
                    <span className="merchant-fee-badge tabular">P{m.deliveryFee.toFixed(2)} delivery</span>
                    <span className="tabular">Min P{MINIMUM_ORDER_BWP}</span>
                  </div>
                  {m.promo && <div className="merchant-promo-pill">{m.promo}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="app-footer-credit">Demo photos: Wikimedia Commons contributors (CC licences)</div>
      </main>

      {cart.count > 0 && (
        <div className="cart-fab above-tabbar">
          <button className="cart-fab-inner" onClick={() => navigate('/checkout')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cart-fab-count">{cart.count}</span>
              View cart
            </span>
            <span className="tabular">P{cart.total.toFixed(2)}</span>
          </button>
        </div>
      )}

      <nav className="tab-bar" aria-label="Primary">
        <Link to="/" className="tab-bar-item active">
          <span className="tab-icon" aria-hidden="true">
            ⌂
          </span>
          Home
        </Link>
        {['Browse', 'Orders', 'Account'].map((label) => (
          <button
            key={label}
            type="button"
            className={`tab-bar-item${pressedTab === label ? ' pressed' : ''}`}
            onClick={() => setPressedTab(label)}
            onAnimationEnd={() => setPressedTab(null)}
          >
            <span className="tab-icon" aria-hidden="true">
              {label === 'Browse' ? '▤' : label === 'Orders' ? '▧' : '◍'}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
