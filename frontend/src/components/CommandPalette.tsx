/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { CompanyCard } from '../types'

const ROUTES = [
  { label: 'Inicio', path: '/', hint: 'Landing' },
  { label: 'Directorio', path: '/directorio', hint: 'Buscar y filtrar' },
  { label: 'Importar URL', path: '/importar', hint: 'Extracción' },
  { label: 'Mis Extracciones', path: '/mis-extracciones', hint: 'Privado' },
  { label: 'CRUD Admin', path: '/admin', hint: 'Gestión' },
  { label: 'Entrar / Registro', path: '/auth', hint: 'Auth' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [companies, setCompanies] = useState<CompanyCard[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || q.trim().length < 1) {
      setCompanies([])
      return
    }
    const ac = new AbortController()
    const handle = window.setTimeout(() => {
      api<CompanyCard[]>(`/companies?q=${encodeURIComponent(q.trim())}`)
        .then((data) => {
          if (!ac.signal.aborted) setCompanies(data.slice(0, 6))
        })
        .catch(() => {
          if (!ac.signal.aborted) setCompanies([])
        })
    }, 180)
    return () => {
      ac.abort()
      window.clearTimeout(handle)
    }
  }, [q, open])

  const routeHits = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ROUTES
    return ROUTES.filter(
      (r) =>
        r.label.toLowerCase().includes(needle) ||
        r.path.includes(needle) ||
        r.hint.toLowerCase().includes(needle)
    )
  }, [q])

  const items = useMemo(() => {
    const navItems = routeHits.map((r) => ({
      id: `route:${r.path}`,
      label: r.label,
      hint: r.hint,
      run: () => navigate(r.path),
    }))
    const companyItems = companies.map((c) => ({
      id: `co:${c._id}`,
      label: c.name,
      hint: c.specialty || 'Empresa',
      run: () => navigate(`/directorio?q=${encodeURIComponent(c.name)}`),
    }))
    return [...companyItems, ...navItems]
  }, [routeHits, companies, navigate])

  useEffect(() => {
    setActive(0)
  }, [items.length, q])

  if (!open) return null

  const go = (index: number) => {
    const item = items[index]
    if (!item) return
    item.run()
    onClose()
  }

  return (
    <div
      className="cmdk-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar empresa o ir a…"
          aria-label="Buscar en MetaSoft"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              go(active)
            }
          }}
        />
        <div className="cmdk-list" role="listbox" aria-label="Resultados">
          {items.length === 0 ? (
            <div className="cmdk-empty">Sin coincidencias</div>
          ) : (
            items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                className="cmdk-item"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(i)}
              >
                <span>{item.label}</span>
                <span className="mono">{item.hint}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmdk-hint">
          <span className="kbd">↑↓</span> navegar · <span className="kbd">Enter</span> abrir ·{' '}
          <span className="kbd">Esc</span> cerrar
        </div>
      </div>
    </div>
  )
}
