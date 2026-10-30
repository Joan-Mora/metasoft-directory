/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, downloadPdf } from '../api/client'
import { CompanyCardView } from '../components/CompanyCardView'
import { SelectionDock } from '../components/SelectionDock'
import { StateView } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import type { CompanyCard } from '../types'

export function DirectoryPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') || ''
  const [q, setQ] = useState(initialQ)
  const [submitted, setSubmitted] = useState(initialQ)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectMode, setSelectMode] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const { data, loading, error, reload } = useApi(
    async (signal) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/companies?q=${encodeURIComponent(submitted)}`,
        {
          signal,
          headers: localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : undefined,
        }
      )
      if (!res.ok) throw new Error('No se pudo cargar el directorio')
      return (await res.json()) as CompanyCard[]
    },
    [submitted]
  )

  const items = data ?? []
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  const onSearch = () => {
    setSubmitted(q.trim())
    setParams(q.trim() ? { q: q.trim() } : {})
    setSelected({})
  }

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

  const exportPdf = async () => {
    setPdfBusy(true)
    try {
      await downloadPdf({ companyIds: selectedIds, title: 'Directorio global — selección' })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al exportar')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <section>
      <h1 className="page-title">Directorio global</h1>
      <p className="page-lead">
        Busca por nombre o parte del nombre. La señal SNR indica completitud. El logo abre el sitio
        oficial.
      </p>
      {!user && (
        <div className="alert info">
          Inicia sesión para favoritos, importación con guardado y espacio personal.{' '}
          <Link to="/auth">Entrar</Link>
        </div>
      )}
      <div className="toolbar">
        <label className="sr-only" htmlFor="dir-search">
          Buscar casa desarrolladora
        </label>
        <input
          id="dir-search"
          type="search"
          placeholder="Buscar señal… p.ej. CODAL"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button type="button" className="btn" onClick={onSearch}>
          Buscar
        </button>
        <button
          type="button"
          className={`btn secondary${selectMode ? ' is-on' : ''}`}
          aria-pressed={selectMode}
          onClick={() => {
            setSelectMode((v) => !v)
            setSelected({})
          }}
        >
          {selectMode ? 'Cancelar selección' : 'Modo selección'}
        </button>
      </div>

      <StateView
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && items.length === 0}
        emptyTitle="Sin coincidencias"
        emptyHint="Prueba con otra parte del nombre o limpia la búsqueda."
        emptyAction={
          <button type="button" className="btn secondary" onClick={() => { setQ(''); setSubmitted(''); setParams({}) }}>
            Ver todas
          </button>
        }
      >
        <div className="grid-cards grid-bento">
          {items.map((c, i) => (
            <CompanyCardView
              key={c._id}
              company={c}
              query={submitted}
              featured={i === 0 && !submitted}
              selected={!!selected[c._id]}
              onSelect={
                selectMode
                  ? (id, checked) => setSelected((s) => ({ ...s, [id]: checked }))
                  : undefined
              }
              onFavorite={onFavorite}
            />
          ))}
        </div>
      </StateView>

      <SelectionDock
        count={selectedIds.length}
        onExport={() => void exportPdf()}
        onClear={() => setSelected({})}
        busy={pdfBusy}
      />
    </section>
  )
}
