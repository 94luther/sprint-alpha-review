import type { ScoreComponents } from '../lib/types'

interface ScoreBarsProps {
  components: ScoreComponents
}

// Each component is normalized to a friendly 0 to 100 bar so the four
// numbers, which live on very different scales, read as one clear picture.
function normalize(key: keyof ScoreComponents, value: number): number {
  if (key === 'eta_min') {
    // Lower eta is better. Clamp a 0 to 20 minute range.
    const pct = 100 - (Math.min(Math.max(value, 0), 20) / 20) * 100
    return Math.round(pct)
  }
  if (key === 'active_load') {
    // Lower load is better. Clamp a 0 to 5 job range.
    const pct = 100 - (Math.min(Math.max(value, 0), 5) / 5) * 100
    return Math.round(pct)
  }
  // rating_gap and fairness_boost arrive roughly 0 to 1, higher is better.
  return Math.round(Math.min(Math.max(value, 0), 1) * 100)
}

const ROWS: { key: keyof ScoreComponents; label: string }[] = [
  { key: 'eta_min', label: 'Time to pickup' },
  { key: 'active_load', label: 'Current load' },
  { key: 'rating_gap', label: 'Rating' },
  { key: 'fairness_boost', label: 'Fair turn' }
]

export default function ScoreBars({ components }: ScoreBarsProps) {
  return (
    <div>
      {ROWS.map((row) => {
        const pct = normalize(row.key, components[row.key])
        return (
          <div className="score-row" key={row.key}>
            <div className="score-label">
              <span>{row.label}</span>
              <span className="tabular">{components[row.key].toFixed(row.key === 'eta_min' ? 0 : 2)}</span>
            </div>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
