import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sprint.theme'
type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

function readInitial(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readInitial())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Switch between light and dark"
      title="Switch theme"
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  )
}
