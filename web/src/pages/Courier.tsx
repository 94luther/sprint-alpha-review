import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import ScoreBars from '../components/ScoreBars'
import { getOrder } from '../lib/api'
import { useAuth } from '../lib/auth'
import { getSocket } from '../lib/socket'
import type { DispatchScoredEvent, DispatchScoreEntry, Order, OrderStatusEvent } from '../lib/types'

const JOB_STEPS = [
  { key: 'dispatch.accepted', label: 'Offer accepted, head to the merchant' },
  { key: 'picked_up', label: 'Order picked up, on your way' },
  { key: 'delivered', label: 'Delivered, nice work' }
] as const

export default function Courier() {
  const { auth } = useAuth()
  const [offer, setOffer] = useState<{ orderId: string; entry: DispatchScoreEntry; order: Order | null } | null>(
    null
  )
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const seenOrderIds = useRef<Set<string>>(new Set())
  const [displayScore, setDisplayScore] = useState(0)

  // Offer score counts up from 0 on arrival instead of appearing static.
  useEffect(() => {
    if (!offer) {
      setDisplayScore(0)
      return
    }
    const target = offer.entry.score
    const start = performance.now()
    const duration = 500
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const ease = 1 - (1 - t) * (1 - t)
      setDisplayScore(Math.round(target * ease))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [offer?.orderId, offer?.entry.score])

  useEffect(() => {
    if (!auth) return
    const socket = getSocket()

    const onScored = (evt: DispatchScoredEvent) => {
      if (activeOrder) return
      if (seenOrderIds.current.has(evt.order_id)) return
      const mine = evt.scores.find((s) => s.courier_name === auth.name)
      if (!mine) return
      seenOrderIds.current.add(evt.order_id)
      setOffer({ orderId: evt.order_id, entry: mine, order: null })
      getOrder(auth.token, evt.order_id)
        .then((order) => setOffer((prev) => (prev && prev.orderId === evt.order_id ? { ...prev, order } : prev)))
        .catch(() => {})
    }

    const onStatus = (evt: OrderStatusEvent) => {
      setActiveOrder((prev) => {
        if (!prev || prev.id !== evt.order_id) return prev
        return { ...prev, status: evt.status }
      })
      if (evt.status === 'delivered' && activeOrder?.id === evt.order_id) {
        window.setTimeout(() => setActiveOrder(null), 4000)
      }
    }

    socket.on('dispatch_scored', onScored)
    socket.on('order_status', onStatus)
    return () => {
      socket.off('dispatch_scored', onScored)
      socket.off('order_status', onStatus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, activeOrder])

  const acceptOffer = () => {
    if (!offer) return
    setActiveOrder(
      offer.order || {
        id: offer.orderId,
        merchant_id: '',
        items: [],
        payment_method: 'cash',
        address: '',
        status: 'dispatch.accepted',
        timeline: []
      }
    )
    setOffer(null)
  }

  const declineOffer = () => setOffer(null)

  const currentStepIndex = activeOrder
    ? JOB_STEPS.findIndex((s) => s.key === activeOrder.status)
    : -1

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <h1 className="page-title" style={{ fontSize: 30 }}>
          Courier
        </h1>
        <p className="page-sub">Welcome back, {auth?.name}. Here is what is waiting for you.</p>

        {!offer && !activeOrder && (
          <div className="empty-state card">
            <div className="pulse-dot" style={{ margin: '0 auto 16px' }} />
            <p>Listening for the next offer. Stay on this page and we will let you know.</p>
          </div>
        )}

        {offer && (
          <div className="card offer-card">
            <div className="offer-header">
              <div>
                <div className="section-label">New offer</div>
                <div style={{ fontFamily: 'var(--font-sub)', fontWeight: 800, fontSize: 18, marginTop: 4 }}>
                  {offer.order?.merchant_name || 'A nearby merchant'}
                </div>
              </div>
              <div className="tabular" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                {displayScore}
              </div>
            </div>

            <ScoreBars components={offer.entry.components} />

            {offer.order?.address && (
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>
                Drop off at {offer.order.address}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={declineOffer}>
                Not now
              </button>
              <button
                className="btn btn-primary offer-accept-btn"
                style={{ flex: 1 }}
                onClick={acceptOffer}
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {activeOrder && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>
                Job in progress
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {activeOrder.merchant_name || 'Order ' + activeOrder.id.slice(-6).toUpperCase()}
              </div>
              {activeOrder.address && (
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                  {activeOrder.address}
                </div>
              )}
            </div>

            {JOB_STEPS.map((step, i) => (
              <div
                className="job-step"
                key={step.key}
                style={{ opacity: i <= currentStepIndex ? 1 : 0.4 }}
              >
                <div className="num">
                  {i <= currentStepIndex ? <span className="check-draw">✓</span> : i + 1}
                </div>
                <div>{step.label}</div>
              </div>
            ))}

            {activeOrder.status === 'delivered' && (
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: 10 }}>
                Great job. Getting your next offer ready.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
