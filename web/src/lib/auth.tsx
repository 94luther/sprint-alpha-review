import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { AuthResult, Role } from './types'

const STORAGE_KEY = 'sprint.auth'

interface AuthState extends AuthResult {}

interface AuthContextValue {
  auth: AuthState | null
  signIn: (result: AuthResult) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthState
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => readStored())

  useEffect(() => {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    else localStorage.removeItem(STORAGE_KEY)
  }, [auth])

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      signIn: (result) => setAuth(result),
      signOut: () => setAuth(null)
    }),
    [auth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}

export function homeForRole(role: Role): string {
  if (role === 'courier') return '/courier'
  if (role === 'ops') return '/ops'
  return '/'
}

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { auth } = useAuth()
  const location = useLocation()

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && auth.role !== role) {
    return <Navigate to={homeForRole(auth.role)} replace />
  }

  return <>{children}</>
}
