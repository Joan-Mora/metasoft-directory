/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeContext } from '../context/ThemeContext'
import { CommandPalette } from './CommandPalette'

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/directorio', label: 'Directorio' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/importar', label: 'Importar' },
  { to: '/mis-extracciones', label: 'Mis Extracciones' },
  { to: '/admin', label: 'CRUD' },
] as const

export function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useThemeContext()
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const drawerRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector<HTMLElement>('.nav-link.active')
    if (!active) {
      setIndicator({ left: 0, width: 0 })
      return
    }
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const d = drawerRef.current
    if (!d) return
    if (drawerOpen && !d.open) d.showModal()
    if (!drawerOpen && d.open) d.close()
  }, [drawerOpen])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          MetaSoft
        </NavLink>

        <nav className="nav-desktop" ref={navRef} aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={'end' in l ? l.end : false}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          <span
            className="nav-indicator"
            aria-hidden="true"
            style={
              {
                ['--ind-left']: `${indicator.left}px`,
                ['--ind-width']: `${indicator.width}px`,
              } as CSSProperties
            }
          />
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Abrir búsqueda (Ctrl+K)"
            onClick={() => setCmdOpen(true)}
          >
            <span aria-hidden="true">⌕</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          {user ? (
            <>
              <span className="nav-user" title={user.email}>
                {user.name}
              </span>
              <button type="button" className="btn ghost" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="btn secondary">
              Entrar
            </NavLink>
          )}
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      <dialog
        ref={drawerRef}
        id="mobile-drawer"
        className="drawer-backdrop"
        aria-label="Menú de navegación"
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === drawerRef.current) setDrawerOpen(false)
        }}
      >
        <div className="drawer" role="document">
          <p className="mono">Navegación</p>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={'end' in l ? l.end : false}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              onClick={() => setDrawerOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          {!user && (
            <NavLink to="/auth" onClick={() => setDrawerOpen(false)}>
              Entrar / Registro
            </NavLink>
          )}
          <button type="button" className="btn secondary" onClick={() => setDrawerOpen(false)}>
            Cerrar
          </button>
        </div>
      </dialog>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <main className="main" id="contenido-principal">
        <Outlet />
      </main>

      <footer className="footer">
        © 2026 Joan Mora · Licencia propietaria · Signal Layer · Taller 1 C3
      </footer>
    </div>
  )
}
