/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { useTheme, type Theme } from '../hooks/useTheme'

interface ThemeCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useTheme()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useThemeContext() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useThemeContext outside ThemeProvider')
  return ctx
}
