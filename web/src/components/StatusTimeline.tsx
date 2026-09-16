import type { CSSProperties } from 'react'
import { ORDER_STEPS, type OrderStatus, type TimelineEntry } from '../lib/types'

export function timeLabel(at?: string) {
  if (!at) return ''
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return at
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function StatusTimeline({
  status,
  timeline
}: {
  status: OrderStatus
  timeline: TimelineEntry[]
}) {
  const currentIndex = ORDER_STEPS.findIndex((s) => s.status === status)
  const byStatus = new Map(timeline.map((t) => [t.status, t.at]))

  return (
    <div className="timeline">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && status === 'delivered')
        const current = i === currentIndex && status !== 'delivered'
        const at = byStatus.get(step.status)
        return (
          <div className="timeline-step" key={step.status}>
            <div className="timeline-rail">
              <div className={`timeline-dot${done ? ' done' : ''}${current ? ' current' : ''}`}>
                {done ? <span className="check-draw">✓</span> : ''}
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div className={`timeline-line${done ? ' done' : ''}`} />
              )}
            </div>
            <div className="timeline-body">
              <div className={`label${!done && !current ? ' pending' : ''}`}>{step.label}</div>
              {at && <div className="at tabular">{timeLabel(at)}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Three "plain" checkpoints for the tracking hero: Accepted, Collected,
// Coming to you. The six ORDER_STEPS statuses collapse onto these three by
// threshold, not by a one to one map, since the backend has no separate
// "collection instant" or "in transit" status of its own, only picked_up
// covering both. Reuses the exact dot and check-draw markup and CSS classes
// from the vertical timeline above (timeline-dot, done, current, check-draw)
// so it reads as the same design language, only the layout is horizontal
// and there are no per-item timestamps, since the hero's big arrival window
// already carries the time.
const HERO_CHECKPOINTS: { label: string; throughIndex: number }[] = [
  { label: 'Accepted', throughIndex: ORDER_STEPS.findIndex((s) => s.status === 'dispatch.accepted') },
  { label: 'Collected', throughIndex: ORDER_STEPS.findIndex((s) => s.status === 'picked_up') },
  { label: 'Coming to you', throughIndex: ORDER_STEPS.findIndex((s) => s.status === 'delivered') }
]

// Fixed, deterministic angle spread for the orange stamp burst a
// completing checkpoint throws (Craft director's amendment). Not
// Math.random for the same reason Track.tsx's other bursts are not: two
// renders of the same completed checkpoint should look identical.
const STAMP_ANGLES = [0, 60, 120, 180, 240, 300]

// Small orange micro-burst, thrown by a checkpoint the instant it
// completes. Purely decorative, hidden from assistive tech, positioned by
// its .particle-burst wrapper filling the timeline-dot it sits inside.
function CheckpointStampBurst() {
  return (
    <span className="particle-burst" aria-hidden="true">
      {STAMP_ANGLES.map((angle, i) => (
        <span
          key={angle}
          className="particle-dot orange"
          style={{ '--angle': `${angle}deg`, animationDelay: `${i * 15}ms` } as CSSProperties}
        />
      ))}
    </span>
  )
}

export function HeroCheckpoints({
  status,
  burstIndex = null
}: {
  status: OrderStatus
  // Index (0, 1 or 2) of a checkpoint to play a one-shot radial burst ring
  // on right now, e.g. when the live socket just reported "collected".
  // null means no burst is playing.
  burstIndex?: number | null
}) {
  const fullIndex = ORDER_STEPS.findIndex((s) => s.status === status)
  const doneFlags = HERO_CHECKPOINTS.map((c) => fullIndex >= c.throughIndex)
  // The first not yet done checkpoint is the one that pulses as "current",
  // matching the same idea as the vertical timeline's single current index,
  // just derived from thresholds instead of a direct status lookup.
  const firstPending = doneFlags.findIndex((d) => !d)

  return (
    <div className="checkpoints">
      {/* Ambient, decorative: a small branded rider token that patrols the
          rail continuously, independent of real progress. Purely visual,
          never a source of status information (that is the dots above),
          so it is hidden from assistive tech. */}
      <span className="rider-token" aria-hidden="true">
        <span className="rider-token-dot" />
      </span>
      {HERO_CHECKPOINTS.map((c, i) => {
        const done = doneFlags[i]
        const current = !done && i === firstPending
        const bursting = burstIndex === i
        return (
          <div className={`checkpoint${bursting ? ' checkpoint-stamp' : ''}`} key={c.label}>
            {i > 0 && <div className={`checkpoint-connector${doneFlags[i - 1] ? ' done' : ''}`} />}
            <div className={`timeline-dot${done ? ' done' : ''}${current ? ' current' : ''}${bursting ? ' radial-burst' : ''}`}>
              {done ? <span className="check-draw">✓</span> : ''}
              {bursting && <CheckpointStampBurst />}
            </div>
            <div className={`checkpoint-label${done ? ' reached' : ''}${current ? ' active' : ''}`}>
              {c.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
