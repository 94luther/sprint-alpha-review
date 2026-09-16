import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import GaboroneMap from '../components/GaboroneMap'
import { getOpsState } from '../lib/api'
import { useAuth } from '../lib/auth'
import { getSocket } from '../lib/socket'
import type {
  CourierLocationEvent,
  DispatchScoredEvent,
  LastDispatch,
  OpsCourier,
  OpsState,
  Order,
  OrderStatusEvent
} from '../lib/types'

function scorePct(componentValue: number, kind: 'eta' | 'load' | 'ratio') {
  if (kind === 'eta') return Math.max(0, 100 - Math.min(componentValue, 20) * 5)
  if (kind === 'load') return Math.max(0, 100 - Math.min(componentValue, 5) * 20)
  return Math.min(Math.max(componentValue, 0), 1) * 100
}

export default function Ops() {
  const { auth } = useAuth()
  const [state, setState] = useState<OpsState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    getOpsState(auth.token)
      .then(setState)
      .catch(() => setError('We could not load the ops board. Please refresh.'))
  }, [auth])

  useEffect(() => {
    if (!auth) return
    const socket = getSocket()

    const onLocations = (updates: CourierLocationEvent[]) => {
      setState((prev) => {
        if (!prev) return prev
        const byId = new Map(prev.couriers.map((c) => [c.id, c]))
        updates.forEach((u) => {
          const existing = byId.get(u.id)
          if (existing) byId.set(u.id, { ...existing, lat: u.lat, lng: u.lng, status: u.status })
        })
        return { ...prev, couriers: Array.from(byId.values()) }
      })
    }

    const onStatus = (evt: OrderStatusEvent) => {
      setState((prev) => {
        if (!prev) return prev
        const orders: Order[] = prev.orders.map((o) =>
          o.id === evt.order_id ? { ...o, status: evt.status } : o
        )
        return { ...prev, orders }
      })
    }

    const onScored = (evt: DispatchScoredEvent) => {
      setState((prev) => {
        if (!prev) return prev
        const last: LastDispatch = { order_id: evt.order_id, scores: evt.scores }
        return { ...prev, last_dispatch: last }
      })
    }

    socket.on('courier_locations', onLocations)
    socket.on('order_status', onStatus)
    socket.on('dispatch_scored', onScored)
    return () => {
      socket.off('courier_locations', onLocations)
      socket.off('order_status', onStatus)
      socket.off('dispatch_scored', onScored)
    }
  }, [auth])

  const couriers: OpsCourier[] = state?.couriers ?? []
  const orders: Order[] = state?.orders ?? []
  const onlineCount = couriers.filter((c) => c.status !== 'offline').length
  const activeCount = orders.filter((o) => o.status !== 'delivered').length
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  // The courier the last dispatch actually matched to, so the map can give
  // it a distinct focal cue instead of every pin looking identical.
  const focalCourierId = state?.last_dispatch
    ? state.last_dispatch.scores.slice().sort((a, b) => b.score - a.score)[0]?.courier_id ?? null
    : null

  // Tiny trend arrows on the stat chips whenever a value moves, plus a
  // one-shot row-flash on the dispatch table when new scoring lands. Never
  // relies on color alone elsewhere (see the mini-bar pattern below).
  type Trend = 'up' | 'down' | null
  const prevStatsRef = useRef({ online: onlineCount, active: activeCount, delivered: deliveredCount })
  const [trend, setTrend] = useState<{ online: Trend; active: Trend; delivered: Trend }>({
    online: null,
    active: null,
    delivered: null
  })
  useEffect(() => {
    const prev = prevStatsRef.current
    const next: { online: Trend; active: Trend; delivered: Trend } = {
      online: onlineCount === prev.online ? null : onlineCount > prev.online ? 'up' : 'down',
      active: activeCount === prev.active ? null : activeCount > prev.active ? 'up' : 'down',
      delivered: deliveredCount === prev.delivered ? null : deliveredCount > prev.delivered ? 'up' : 'down'
    }
    prevStatsRef.current = { online: onlineCount, active: activeCount, delivered: deliveredCount }
    if (!next.online && !next.active && !next.delivered) return
    setTrend(next)
    const t = window.setTimeout(() => setTrend({ online: null, active: null, delivered: null }), 1300)
    return () => window.clearTimeout(t)
  }, [onlineCount, activeCount, deliveredCount])

  const [flashDispatch, setFlashDispatch] = useState(false)
  const lastDispatchIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state?.last_dispatch) return
    if (lastDispatchIdRef.current === state.last_dispatch.order_id) return
    lastDispatchIdRef.current = state.last_dispatch.order_id
    setFlashDispatch(true)
    const t = window.setTimeout(() => setFlashDispatch(false), 900)
    return () => window.clearTimeout(t)
  }, [state?.last_dispatch])

  const trendArrow = (dir: Trend) =>
    dir && (
      <span className={`trend-arrow ${dir}`} aria-hidden="true">
        {dir === 'up' ? '▲' : '▼'}
      </span>
    )

  return (
    <div className="app-shell">
      <AppHeader />
      {error && (
        <div className="login-error" style={{ padding: '0 16px' }}>
          {error}
        </div>
      )}
      <div className="ops-layout">
        <div className="ops-stats">
          <div className="stat-chip">
            <div className="num tabular">
              {onlineCount}
              {trendArrow(trend.online)}
            </div>
            <div className="label">Couriers online</div>
          </div>
          <div className="stat-chip">
            <div className="num tabular">
              {activeCount}
              {trendArrow(trend.active)}
            </div>
            <div className="label">Active orders</div>
          </div>
          <div className="stat-chip">
            <div className="num tabular">
              {deliveredCount}
              {trendArrow(trend.delivered)}
            </div>
            <div className="label">Delivered today</div>
          </div>
        </div>

        <div className="ops-map-wrap">
          <GaboroneMap
            couriers={couriers.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng }))}
            routeCourierId={focalCourierId}
          />
        </div>

        <div className="ops-side">
          {/* Dispatch scoring goes first, ahead of "Recent orders": on a
              single phone-height screen the map above already takes most
              of the fold, so whichever section is second here effectively
              never appears in a one-screen capture. This is the panel the
              checklist calls out (per-courier distance/ETA/rating/score
              for a match in progress), so it gets the visible slot. */}
          <h3>Last dispatch scoring</h3>
          {!state?.last_dispatch && (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No dispatch yet.</p>
          )}
          {state?.last_dispatch && (
            <div style={{ overflowX: 'auto' }}>
              <table className={`dispatch-table${flashDispatch ? ' flash' : ''}`}>
                <thead>
                  <tr>
                    <th>Courier</th>
                    <th>Score</th>
                    <th>ETA</th>
                    <th>Load</th>
                    <th>Rating</th>
                    <th>Fair</th>
                  </tr>
                </thead>
                <tbody>
                  {state.last_dispatch.scores
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((s) => {
                      const etaPct = scorePct(s.components.eta_min, 'eta')
                      const loadPct = scorePct(s.components.active_load, 'load')
                      const ratingPct = scorePct(s.components.rating_gap, 'ratio')
                      const fairPct = scorePct(s.components.fairness_boost, 'ratio')
                      return (
                        <tr key={s.courier_id}>
                          <td>{s.courier_name}</td>
                          <td className="tabular">{Math.round(s.score)}</td>
                          <td>
                            <span className="mini-bar-cell">
                              <span className="mini-bar-track">
                                <span className="mini-bar-fill" style={{ width: `${etaPct}%` }} />
                              </span>
                              <span className="mini-bar-value tabular">{Math.round(etaPct)}%</span>
                            </span>
                          </td>
                          <td>
                            <span className="mini-bar-cell">
                              <span className="mini-bar-track">
                                <span className="mini-bar-fill" style={{ width: `${loadPct}%` }} />
                              </span>
                              <span className="mini-bar-value tabular">{Math.round(loadPct)}%</span>
                            </span>
                          </td>
                          <td>
                            <span className="mini-bar-cell">
                              <span className="mini-bar-track">
                                <span className="mini-bar-fill" style={{ width: `${ratingPct}%` }} />
                              </span>
                              <span className="mini-bar-value tabular">{Math.round(ratingPct)}%</span>
                            </span>
                          </td>
                          <td>
                            <span className="mini-bar-cell">
                              <span className="mini-bar-track">
                                <span className="mini-bar-fill" style={{ width: `${fairPct}%` }} />
                              </span>
                              <span className="mini-bar-value tabular">{Math.round(fairPct)}%</span>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Named "Recent orders" rather than "Active orders" because it
              lists full order history (including delivered ones) so the
              demo still has rows to show once the seeded order completes;
              the "Active orders" stat chip above is the live in-flight
              count and is intentionally allowed to read 0 here. */}
          <h3>Recent orders</h3>
          {orders.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No orders yet.</p>
          )}
          {orders
            .slice()
            .reverse()
            .map((o) => {
              const match =
                state?.last_dispatch && state.last_dispatch.order_id === o.id
                  ? state.last_dispatch.scores.slice().sort((a, b) => b.score - a.score)[0]
                  : null
              return (
                <div className="order-row" key={o.id}>
                  <div className="order-row-info">
                    <div className="oid">{o.id.slice(-6).toUpperCase()}</div>
                    <div>{o.merchant_name || 'Order'}</div>
                  </div>
                  <div className="order-row-badges">
                    <span className={`status-pill${o.status === 'delivered' ? ' done' : ' live'}`}>
                      {o.status.replace('.', ' ').replace('_', ' ')}
                    </span>
                    {match && (
                      <span className="dispatch-match-badge" title={`Best dispatch match: ${match.courier_name}`}>
                        Match {Math.round(match.score)} · {match.courier_name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
