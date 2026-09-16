import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { login, ApiError } from '../lib/api'
import { useAuth, homeForRole } from '../lib/auth'
import type { Role } from '../lib/types'

const QUICK_USERS: { role: Role; name: string; phone: string; pin: string; dot: string }[] = [
  { role: 'customer', name: 'Neo', phone: '71111111', pin: '1234', dot: 'var(--green-bright)' },
  { role: 'courier', name: 'Kabelo', phone: '72222222', pin: '1234', dot: 'var(--orange)' },
  { role: 'ops', name: 'Amo', phone: '73333333', pin: '1234', dot: 'var(--orange)' }
]

export default function Login() {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const doLogin = async (p: string, code: string) => {
    setError('')
    setLoading(true)
    try {
      const result = await login(p, code)
      signIn(result)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from || homeForRole(result.role), { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'We could not reach Sprint right now. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className="login-card">
        <div className="login-accent-bar" aria-hidden="true" />
        <div className="login-logo">
          <img src="/icons/icon-192.png" alt="Sprint" />
          <div className="login-logo-text">
            <div className="word">Sprint</div>
            <div className="tag">Delivery that keeps its word.</div>
          </div>
        </div>

        <div className="section-label" style={{ marginBottom: 10 }}>
          Quick sign in for the demo
        </div>
        <div className="quick-chips">
          {QUICK_USERS.map((u) => (
            <button
              key={u.phone}
              type="button"
              className="quick-chip"
              onClick={() => {
                setPhone(u.phone)
                setPin(u.pin)
                doLogin(u.phone, u.pin)
              }}
            >
              <span className="role-dot" style={{ background: u.dot }} />
              {u.name} · {u.role}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            doLogin(phone, pin)
          }}
        >
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              inputMode="numeric"
              placeholder="7XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label htmlFor="pin">Pin</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              placeholder="4 digit pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
