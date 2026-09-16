import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAuth, useAuth, homeForRole } from './lib/auth'
import { CartProvider } from './lib/cart'
import { demoCredentialsFor } from './lib/demoCapture'
import { login } from './lib/api'
import Login from './pages/Login'
import CustomerHome from './pages/CustomerHome'
import Merchant from './pages/Merchant'
import Checkout from './pages/Checkout'
import Track from './pages/Track'
import Courier from './pages/Courier'
import Ops from './pages/Ops'

// Guests see the catalog straight away. Every competitor that has web ordering
// at all lets people browse before signing in, so a login wall on the front
// door costs us customers before they ever see a merchant. Signing in is asked
// for at checkout, where it actually buys the customer something.
function RootRedirect() {
  const { auth } = useAuth()
  if (!auth) return <CustomerHome />
  if (auth.role === 'customer') return <CustomerHome />
  return <Navigate to={homeForRole(auth.role)} replace />
}

// Demo/video capture only: if the URL carries ?as=customer|courier|ops and
// there is no session yet, sign in silently as that demo user before the
// route below ever gets a chance to bounce to /login. Everyday users never
// hit this, since they never land on a URL with ?as= on it.
function DemoAutoLogin({ children }: { children: ReactNode }) {
  const { auth, signIn } = useAuth()
  const [ready, setReady] = useState(false)
  // Guards against React StrictMode's dev-only double effect invocation,
  // which would otherwise fire this login call twice per page load and
  // burn through the api's login rate limit during a capture run.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const params = new URLSearchParams(window.location.search)
    const creds = auth ? null : demoCredentialsFor(params.get('as'))
    if (!creds) {
      setReady(true)
      return
    }
    login(creds.phone, creds.pin)
      .then((result) => signIn(result))
      .catch(() => {
        // Demo login failed, fall back to the normal auth flow.
      })
      .finally(() => setReady(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="loading-block">
          <span className="spinner" />
          Loading…
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <DemoAutoLogin>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/merchant/:id" element={<Merchant />} />
            <Route
              path="/checkout"
              element={
                <RequireAuth role="customer">
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="/track/:orderId"
              element={
                <RequireAuth>
                  <Track />
                </RequireAuth>
              }
            />
            <Route
              path="/courier"
              element={
                <RequireAuth role="courier">
                  <Courier />
                </RequireAuth>
              }
            />
            <Route
              path="/ops"
              element={
                <RequireAuth role="ops">
                  <Ops />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DemoAutoLogin>
      </CartProvider>
    </AuthProvider>
  )
}
