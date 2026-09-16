// Lite mode: a data-cost courtesy for Gaborone's mobile bundles. When on,
// photos load only when tapped and the promo carousel stops auto-cycling.
// Stored per browser; reading and writing both survive blocked storage.

const LITE_KEY = 'sprint-lite-mode'

type Listener = (on: boolean) => void
const listeners = new Set<Listener>()

export function isLiteMode(): boolean {
  try {
    return localStorage.getItem(LITE_KEY) === '1'
  } catch {
    return false
  }
}

export function setLiteMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(LITE_KEY, '1')
    else localStorage.removeItem(LITE_KEY)
  } catch {
    // Storage unavailable: the toggle just does not stick across reloads.
  }
  listeners.forEach((fn) => fn(on))
}

export function onLiteModeChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
