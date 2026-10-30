/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, downloadPdf } from '../api/client'
import { CompanyCardView } from '../components/CompanyCardView'
import { useAuth } from '../context/AuthContext'
import type { CompanyCard } from '../types'

export function DirectoryPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<CompanyCard[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async (query = q) => {
    setLoading(true)
    setError('')
    try {
      const data = await api<CompanyCard[]>(`/companies?q=${encodeURIComponent(query)}`)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('')
  }, [])

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  const onFavorite = async (company: CompanyCard) => {
    if (!user) {
      alert('Inicia sesión para guardar favoritos.')
      return
    }
    try {
      await api('/favorites', {
        method: 'POST',
        body: JSON.stringify({ refType: 'company', refId: company._id }),
      })
      alert('Añadido a Favoritos')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--display)' }}>Directorio global</h1>
      <p className="meta">Busca por nombre o parte del nombre. La imagen redirige al sitio oficial.</p>
      {!user && (
        <div className="alert info" style={{ marginBottom: '1rem' }}>
          Inicia sesión para favoritos, importación con guardado y espacio personal.{' '}
          <Link to="/auth">Entrar</Link>
        </div>
      )}
      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar casa desarrolladora…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void load()}
        />
        <button type="button" className="btn" onClick={() => void load()}>
          Buscar
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={!selectedIds.length}
          onClick={() =>
            void downloadPdf({ companyIds: selectedIds, title: 'Directorio global — selección' })
          }
        >
          Exportar PDF ({selectedIds.length})
        </button>
      </div>
      {error && <div className="alert danger">{error}</div>}
      {loading ? (
        <div className="empty">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="empty">Sin resultados</div>
      ) : (
        <div className="grid-cards">
          {items.map((c) => (
            <CompanyCardView
              key={c._id}
              company={c}
              selected={!!selected[c._id]}
              onSelect={(id, checked) => setSelected((s) => ({ ...s, [id]: checked }))}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}
