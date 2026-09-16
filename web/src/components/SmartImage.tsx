import { useRef, useState, useEffect, type CSSProperties } from 'react'
import { isLiteMode, onLiteModeChange } from '../lib/liteMode'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  /** Above-the-fold images (heroes, first cards) load eagerly for instant paint. */
  eager?: boolean
}

// One skeleton-to-photo swap used everywhere an image appears (merchant
// hero cards, menu item photos, category chips): same shimmer timing, same
// fade-in, so the whole app loads images with one consistent hand instead
// of every screen inventing its own placeholder. Always object-fit: cover,
// sized by the parent, so nothing ever stretches.
export default function SmartImage({ src, alt, className = '', style, eager = false }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  // Lite mode holds the photo back until this one is tapped.
  const [lite, setLite] = useState(() => isLiteMode())
  const [liteRevealed, setLiteRevealed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => onLiteModeChange((on) => {
    setLite(on)
    if (!on) setLiteRevealed(false)
  }), [])

  // A cached image can be complete before React attaches onLoad; without this
  // check it would sit behind the skeleton forever.
  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }, [src])

  if (lite && !liteRevealed) {
    return (
      <div className={`smart-image ${className}`} style={style}>
        <button type="button" className="smart-image-lite" onClick={() => setLiteRevealed(true)}>
          Lite mode on · Tap to load photo
        </button>
      </div>
    )
  }

  return (
    <div className={`smart-image ${className}`} style={style}>
      {!loaded && <div className="skeleton smart-image-skeleton" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        className={`smart-image-img${loaded ? ' loaded' : ''}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
