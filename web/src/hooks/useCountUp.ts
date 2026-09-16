import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Animates a numeric display value up to `target` exactly once per
// component instance, over `durationMs`. Meant for "first paint counts
// up" moments (the Track hero's arrival window, fed in minutes-since-
// midnight so it ticks through real intermediate clock times).
//
// Callers frequently mount this before their real data has loaded (target
// starts at a placeholder like 0 while `order` is still null), so the
// "count once" behaviour is keyed off the animation actually completing,
// not off the component mounting: every render where `target` changes and
// nothing has finished playing yet restarts the intro toward the new
// (now real) target, so the placeholder value never gets "played" and
// stranded. Once an animation completes, later target changes (a live
// poll nudging the eta by a minute) snap instantly instead of replaying.
//
// Honors prefers-reduced-motion by skipping straight to the target.
export function useCountUpOnce(target: number, durationMs = 800): number {
  const [display, setDisplay] = useState(target)
  const playedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (playedRef.current) {
      setDisplay(target)
      return
    }
    if (prefersReducedMotion()) {
      setDisplay(target)
      playedRef.current = true
      return
    }

    const startValue = Math.max(target - 12, 0)
    const startTime = performance.now()
    setDisplay(startValue)

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(startValue + (target - startValue) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        playedRef.current = true
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs])

  return display
}
