// A stylized, hand-drawn SVG map of Gaborone. Not real map tiles on purpose:
// this is the visual hero of the demo, so it is tuned for a clean, elegant
// look rather than geographic precision.

import { useEffect, useRef, type CSSProperties } from 'react'

export interface MapCourier {
  id: string
  name?: string
  lat: number
  lng: number
  status?: string
}

export interface MapPin {
  lat: number
  lng: number
}

interface GaboroneMapProps {
  couriers?: MapCourier[]
  customerPin?: MapPin | null
  routeCourierId?: string | null
  delivered?: boolean
  className?: string
}

// Bounding box from the shared contract.
const LAT_MIN = -24.7
const LAT_MAX = -24.6
const LNG_MIN = 25.85
const LNG_MAX = 25.95

const VB = 600 // square viewBox, sliced to fill whatever frame holds it

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VB
  const y = ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VB
  return [x, VB - y]
}

const LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'CBD', lat: -24.6556, lng: 25.9089 },
  { name: 'Main Mall', lat: -24.6595, lng: 25.9075 },
  { name: 'Riverwalk', lat: -24.6805, lng: 25.9215 },
  { name: 'Game City', lat: -24.6395, lng: 25.9145 },
  { name: 'Airport Junction', lat: -24.6135, lng: 25.9185 }
]

const BLOCKS: { x: number; y: number; w: number; h: number; r: number }[] = [
  { x: 60, y: 90, w: 90, h: 60, r: 6 },
  { x: 180, y: 60, w: 70, h: 100, r: 6 },
  { x: 300, y: 120, w: 120, h: 50, r: 6 },
  { x: 460, y: 80, w: 90, h: 70, r: 6 },
  { x: 90, y: 220, w: 110, h: 70, r: 6 },
  { x: 250, y: 250, w: 80, h: 90, r: 6 },
  { x: 380, y: 220, w: 100, h: 60, r: 6 },
  { x: 60, y: 340, w: 130, h: 60, r: 6 },
  { x: 240, y: 380, w: 90, h: 70, r: 6 },
  { x: 400, y: 360, w: 110, h: 80, r: 6 },
  { x: 120, y: 460, w: 100, h: 60, r: 6 },
  { x: 320, y: 470, w: 120, h: 60, r: 6 },
  { x: 440, y: 450, w: 90, h: 70, r: 6 }
]

// Precomputed bevel paths for the subtle block depth pass (P3): a top and
// left edge for the highlight, a bottom and right edge for the shadow. Both
// are static, no filter, no new geometry beyond two open paths per block.
const BLOCK_BEVELS = BLOCKS.map((b) => ({
  hi: `M ${b.x} ${b.y + b.h} L ${b.x} ${b.y} L ${b.x + b.w} ${b.y}`,
  lo: `M ${b.x} ${b.y + b.h} L ${b.x + b.w} ${b.y + b.h} L ${b.x + b.w} ${b.y}`
}))

// Interpolated blip animation tuning. Duration approximates the cadence of
// both the Track poll (2s) and Ops socket pushes, so the glide always
// finishes before the next update arrives.
const BLIP_GLIDE_MS = 1600

interface BlipFrame {
  x: number
  y: number
  heading: number
  startX: number
  startY: number
  startHeading: number
  targetX: number
  targetY: number
  targetHeading: number
  startTime: number
  duration: number
}

function shortestAngleDelta(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180
}

export default function GaboroneMap({
  couriers = [],
  customerPin = null,
  routeCourierId = null,
  delivered = false,
  className
}: GaboroneMapProps) {
  const routeCourier = routeCourierId ? couriers.find((c) => c.id === routeCourierId) : null
  const routePoints =
    routeCourier && customerPin
      ? [project(routeCourier.lat, routeCourier.lng), project(customerPin.lat, customerPin.lng)]
      : null

  const pinProjected = customerPin ? project(customerPin.lat, customerPin.lng) : null

  // ---- Day pulse ambient cycle (P3), paused when the tab is hidden ----
  const groundRef = useRef<SVGRectElement | null>(null)
  useEffect(() => {
    const onVis = () => {
      groundRef.current?.classList.toggle('gmap-ground-paused', document.hidden)
    }
    document.addEventListener('visibilitychange', onVis)
    onVis()
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // ---- Interpolated courier blips with heading (P1) ----
  const blipEls = useRef<Map<string, SVGGElement>>(new Map())
  const blipFrames = useRef<Map<string, BlipFrame>>(new Map())

  useEffect(() => {
    const now = performance.now()
    const seen = new Set<string>()
    couriers.forEach((c) => {
      seen.add(c.id)
      const [x, y] = project(c.lat, c.lng)
      const prev = blipFrames.current.get(c.id)
      if (!prev) {
        blipFrames.current.set(c.id, {
          x,
          y,
          heading: 0,
          startX: x,
          startY: y,
          startHeading: 0,
          targetX: x,
          targetY: y,
          targetHeading: 0,
          startTime: now,
          duration: 1
        })
        return
      }
      if (Math.abs(prev.targetX - x) < 0.01 && Math.abs(prev.targetY - y) < 0.01) return
      const dx = x - prev.targetX
      const dy = y - prev.targetY
      const dist = Math.hypot(dx, dy)
      const heading = dist > 0.5 ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : prev.targetHeading
      blipFrames.current.set(c.id, {
        x: prev.x,
        y: prev.y,
        heading: prev.heading,
        startX: prev.x,
        startY: prev.y,
        startHeading: prev.heading,
        targetX: x,
        targetY: y,
        targetHeading: prev.heading + shortestAngleDelta(prev.heading, heading),
        startTime: now,
        duration: BLIP_GLIDE_MS
      })
    })
    Array.from(blipFrames.current.keys()).forEach((id) => {
      if (!seen.has(id)) {
        blipFrames.current.delete(id)
        blipEls.current.delete(id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couriers])

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      blipFrames.current.forEach((f, id) => {
        const t = f.duration > 0 ? Math.min(1, (now - f.startTime) / f.duration) : 1
        const ease = 1 - (1 - t) * (1 - t)
        const x = f.startX + (f.targetX - f.startX) * ease
        const y = f.startY + (f.targetY - f.startY) * ease
        const heading = f.startHeading + shortestAngleDelta(f.startHeading, f.targetHeading) * ease
        f.x = x
        f.y = y
        f.heading = heading
        const el = blipEls.current.get(id)
        if (el) {
          el.style.transform = `translate(${x}px, ${y}px)`
          // The heading wedge paints last (on top of the pulse ring and
          // dot, see the render below), so it is the last child now, not
          // the first.
          const wedge = el.lastElementChild as SVGElement | null
          if (wedge) wedge.style.transform = `rotate(${heading}deg)`
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <svg
      className={`gmap-svg${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${VB} ${VB}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Live map of couriers around Gaborone"
      style={
        pinProjected
          ? ({
              '--zoom-origin-x': `${(pinProjected[0] / VB) * 100}%`,
              '--zoom-origin-y': `${(pinProjected[1] / VB) * 100}%`
            } as CSSProperties)
          : undefined
      }
    >
      {/* CSS transform on the outermost svg element is unreliable across
          renderers, so the delivered zoom lives on this inner group instead. */}
      <g className={`gmap-zoom-wrap${delivered ? ' gmap-delivered' : ''}`}>
      <rect ref={groundRef} className="gmap-ground" x="0" y="0" width={VB} height={VB} fill="var(--map-ground)" />

      {/* Block shapes, suggesting buildings without pretending to be real ones */}
      <g>
        {BLOCKS.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill="var(--map-block)" />
            <path d={BLOCK_BEVELS[i].hi} className="gmap-block-hi" fill="none" />
            <path d={BLOCK_BEVELS[i].lo} className="gmap-block-lo" fill="none" />
          </g>
        ))}
      </g>

      {/* Road grid */}
      <g stroke="var(--map-road)" strokeWidth="3" strokeLinecap="round">
        <line x1="0" y1="100" x2="600" y2="100" />
        <line x1="0" y1="200" x2="600" y2="200" />
        <line x1="0" y1="330" x2="600" y2="330" />
        <line x1="0" y1="430" x2="600" y2="430" />
        <line x1="0" y1="540" x2="600" y2="540" />
        <line x1="80" y1="0" x2="80" y2="600" />
        <line x1="200" y1="0" x2="200" y2="600" />
        <line x1="340" y1="0" x2="340" y2="600" />
        <line x1="470" y1="0" x2="470" y2="600" />
        <line x1="80" y1="0" x2="340" y2="600" opacity="0.6" />
        <line x1="470" y1="0" x2="200" y2="600" opacity="0.6" />
      </g>

      {/* Main avenues, layered glow: wide low-opacity outer, mid, bright core */}
      <g strokeLinecap="round" className="gmap-road-strong gmap-road-strong-outer">
        <line x1="0" y1="270" x2="600" y2="270" />
        <line x1="260" y1="0" x2="260" y2="600" />
      </g>
      <g strokeLinecap="round" className="gmap-road-strong gmap-road-strong-mid">
        <line x1="0" y1="270" x2="600" y2="270" />
        <line x1="260" y1="0" x2="260" y2="600" />
      </g>
      <g strokeLinecap="round" className="gmap-road-strong gmap-road-strong-core">
        <line x1="0" y1="270" x2="600" y2="270" />
        <line x1="260" y1="0" x2="260" y2="600" />
      </g>

      {/* Ring road arc */}
      <ellipse
        cx="300"
        cy="300"
        rx="250"
        ry="250"
        fill="none"
        stroke="var(--map-road-strong)"
        strokeWidth="4"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />

      {/* Labels, raised contrast with a ground-color halo so they never fight the road glow */}
      <g>
        {LABELS.map((l) => {
          const [x, y] = project(l.lat, l.lng)
          return (
            <text key={l.name} x={x} y={y} className="gmap-label" textAnchor="middle">
              {l.name}
            </text>
          )
        })}
      </g>

      {/* Route line from courier to customer. Rendered fully drawn and
          flowing from the first frame (a JS stroke-dashoffset "draw-in"
          used to live here, but it raced the very first paint in headless
          capture and could leave the line looking undrawn or missing) - the
          CSS opacity transition below still gives it a soft fade-in. */}
      {routePoints && (
        <line
          className={`gmap-route gmap-route-flow${delivered ? ' gmap-route-delivered' : ''}`}
          x1={routePoints[0][0]}
          y1={routePoints[0][1]}
          x2={routePoints[1][0]}
          y2={routePoints[1][1]}
        />
      )}

      {/* Customer pin */}
      {customerPin && pinProjected && (
        <g transform={`translate(${pinProjected.join(',')})`}>
          <path
            d="M0,-16 C8,-16 14,-10 14,-2 C14,8 0,20 0,20 C0,20 -14,8 -14,-2 C-14,-10 -8,-16 0,-16 Z"
            className="gmap-pin"
          />
          <circle r="3.5" fill="var(--white)" />
        </g>
      )}

      {/* Courier dots, interpolated with a heading wedge. Only the watched
          courier (routeCourierId) pulses; the rest are calm static dots. */}
      <g>
        {couriers.map((c) => {
          const isActive = routeCourierId != null && c.id === routeCourierId
          const [ix, iy] = project(c.lat, c.lng)
          return (
            <g
              key={c.id}
              ref={(el) => {
                if (el) blipEls.current.set(c.id, el)
              }}
              className="gmap-courier-wrap"
              style={{ transform: `translate(${ix}px, ${iy}px)` }}
            >
              {/* Pulse ring and dot painted first, heading wedge last: the
                  pulse ring grows well past the wedge's own footprint, and
                  drawing the wedge underneath it let the ring visually
                  swallow the heading caret while it was mid-pulse. Painting
                  the wedge on top keeps it visible in every frame. The
                  static halo is separate from the animated pulse on
                  purpose: a frozen frame can land on any point of the
                  pulse's fade cycle, but the halo never fades, so the
                  focal courier still reads as focal in a single still
                  capture. */}
              <circle className={`gmap-courier-pulse${isActive ? ' active' : ''}`} r="7" />
              {isActive && <circle className="gmap-courier-halo" r="11" />}
              <circle className={`gmap-courier${isActive ? ' active' : ''}`} r="7" />
              <path className="gmap-heading-wedge" d="M0,-13 L5,-1 L-5,-1 Z" />
            </g>
          )
        })}
      </g>
      </g>
    </svg>
  )
}
