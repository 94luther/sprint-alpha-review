import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/app.css'
import './styles/pulse.css'

// Standalone/artifact build: this index.html is the only file, served from
// wherever it lands (a claude.ai artifact, a file:// open on a phone), not
// from a server that can rewrite every path back to it. BrowserRouter's
// real paths (/merchant/m1, /track/<id>...) would 404 or just show a blank
// file listing there, so this build uses hash-based routes (/#/merchant/m1)
// instead, which the one file can always resolve locally. The normal
// dev-server/API-backed build is untouched and keeps real paths.
const Router = import.meta.env.VITE_DEMO_STANDALONE === '1' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
)

if (import.meta.env.PROD && 'serviceWorker' in navigator && import.meta.env.VITE_DEMO_STANDALONE !== '1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed service worker registration should never block the app.
    })
  })
}
