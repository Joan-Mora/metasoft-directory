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
import type { CompanyCard, DataStatus } from '../types'

const SNR_FILTERS: { id: 'all' | DataStatus; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'complete', label: 'Completas' },
  { id: 'partial', label: 'Parciales' },
  { id: 'none', label: 'Sin datos' },
]

function parseStatus(raw: string | null): 'all' | DataStatus {
  if (raw === 'complete' || raw === 'partial' || raw === 'none') return raw
  return 'all'
}

export function DirectoryPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') || ''
  const initialStatus = parseStatus(params.get('status'))
  const [q, setQ] = useState(initialQ)
  const [submitted, setSubmitted] = useState(initialQ)
  const [status, setStatus] = useState<'all' | DataStatus>(initialStatus)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectMode, setSelectMode] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [toast, setToast] = useState('')

  const { data, loading, error, reload } = useApi(
    async (signal) => {
      const qs = new URLSearchParams()
      if (submitted) qs.set('q', submitted)
      if (status !== 'all') qs.set('status', status)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/companies?${qs.toString()}`,
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
    [submitted, status]
  )

  const items = data ?? []
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  const syncParams = (nextQ: string, nextStatus: 'all' | DataStatus) => {
    const next = new URLSearchParams()
    if (nextQ) next.set('q', nextQ)
    if (nextStatus !== 'all') next.set('status', nextStatus)
    setParams(next)
  }

  const onSearch = () => {
    const nextQ = q.trim()
    setSubmitted(nextQ)
    syncParams(nextQ, status)
    setSelected({})
  }

  const onFilter = (id: 'all' | DataStatus) => {
    setStatus(id)
    syncParams(submitted, id)
    setSelected({})
  }

  const clearAll = () => {
    setQ('')
    setSubmitted('')
    setStatus('all')
    setParams({})
    setSelected({})
  }

  const onFavorite = async (company: CompanyCard) => {
    if (!user) {
      setToast('')
      alert('Inicia sesión para guardar favoritos.')
      return
    }
    try {
      const refType = company.refType || 'company'
      await api('/favorites', {
        method: 'POST',
        body: JSON.stringify({ refType, refId: company._id }),
      })
      setToast(`«${company.name}» se guardó en Favoritos.`)
    } catch (e) {
      setToast('')
      alert(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  const exportPdf = async () => {
    setPdfBusy(true)
    try {
      const companyIds: string[] = []
      const extractionIds: string[] = []
      for (const id of selectedIds) {
        const item = items.find((c) => c._id === id)
        if (item?.refType === 'extraction') extractionIds.push(id)
        else companyIds.push(id)
      }
      await downloadPdf({
        companyIds,
        extractionIds,
        title: 'Directorio global — selección',
      })
      setToast('PDF exportado correctamente.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al exportar')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <section>
      <h1 className="page-title">Directorio</h1>
      <p className="page-lead">
        Busca por nombre y filtra por completitud (SNR). El logo abre el sitio oficial cuando existe.
      </p>
      {!user && (
        <div className="alert info">
          Inicia sesión para favoritos, importación con guardado y espacio personal.{' '}
          <Link to="/auth">Entrar</Link>
        </div>
      )}
      {toast && (
        <div className="alert success" role="status">
          {toast}{' '}
          {user && <Link to="/mis-extracciones">Ver favoritos</Link>}
          <button type="button" className="toast-dismiss" onClick={() => setToast('')}>
            Cerrar
          </button>
        </div>
      )}

      <div className="toolbar">
        <label className="sr-only" htmlFor="dir-search">
          Buscar casa desarrolladora
        </label>
        <input
          id="dir-search"
          type="search"
          placeholder="Buscar… p.ej. CODAL"
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

      <div className="tabs" role="tablist" aria-label="Filtro por completitud">
        {SNR_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={status === f.id}
            className={status === f.id ? 'active' : ''}
            onClick={() => onFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <StateView
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && items.length === 0}
        emptyTitle="Sin resultados"
        emptyHint="Prueba otro nombre o cambia el filtro de completitud."
        emptyAction={
          <button type="button" className="btn secondary" onClick={clearAll}>
            Ver todas
          </button>
        }
      >
        <div className="grid-cards">
          {items.map((c) => (
            <CompanyCardView
              key={c._id}
              company={c}
              query={submitted}
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
