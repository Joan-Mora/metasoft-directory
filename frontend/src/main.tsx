/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme } from './hooks/useTheme'
import './index.css'

const stored = localStorage.getItem('metasoft-theme')
const theme =
  stored === 'light' || stored === 'dark'
    ? stored
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
applyTheme(theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
