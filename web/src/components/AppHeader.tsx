import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useAuth, homeForRole } from '../lib/auth'
import { isLiteMode, setLiteMode } from '../lib/liteMode'

export default function AppHeader() {
  const { auth, signOut } = useAuth()
  const [lite, setLite] = useState(() => isLiteMode())

  const toggleLite = () => {
    const next = !lite
    setLite(next)
    setLiteMode(next)
  }

  return (
    <header className="app-header">
      <Link to={auth ? homeForRole(auth.role) : '/login'} className="brand-mark">
        <span className="dot" />
        Sprint
      </Link>
      <div className="header-actions">
        {auth && (
          <span className="user-chip">
            <span className="user-chip-name" title={auth.name}>
              {auth.name}
            </span>
            <span className="user-chip-role" style={{ color: 'var(--text-faint)' }}>
              · {auth.role}
            </span>
          </span>
        )}
        <button
          className="icon-btn"
          onClick={toggleLite}
          title={lite ? 'Lite mode on, photos load on tap' : 'Lite mode off'}
          aria-label={lite ? 'Turn lite mode off' : 'Turn lite mode on, save data'}
          aria-pressed={lite}
          style={lite ? { color: 'var(--orange, #f7941d)' } : undefined}
        >
          ▽
        </button>
        <ThemeToggle />
        {auth && (
          <button className="icon-btn" onClick={signOut} title="Sign out" aria-label="Sign out">
            ⏻
          </button>
        )}
      </div>
    </header>
  )
}
