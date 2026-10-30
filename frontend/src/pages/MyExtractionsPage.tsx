/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, downloadPdf } from '../api/client'
import { CompanyCardView } from '../components/CompanyCardView'
import { SelectionDock } from '../components/SelectionDock'
import { StateView } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import type { CompanyCard, Extraction } from '../types'

interface FavoriteRow {
  id: string
  refType: 'company' | 'extraction'
  refId: string
  item: CompanyCard | null
}

export function MyExtractionsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'mine' | 'favorites'>('mine')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectMode, setSelectMode] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [toast, setToast] = useState('')

  const loadAll = useCallback(async (signal: AbortSignal) => {
    const headers: HeadersInit = {}
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
    const [mineRes, favRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/extractions/mine`, { signal, headers }),
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/favorites`, { signal, headers }),
    ])
    if (!mineRes.ok || !favRes.ok) throw new Error('No se pudo cargar tu espacio')
    const mine = (await mineRes.json()) as Extraction[]
    const favorites = (await favRes.json()) as FavoriteRow[]
    return { mine, favorites }
  }, [])

  const { data, loading, error, reload } = useApi(
    loadAll,
    [user?.id]
  )

  const items = data?.mine ?? []
  const favorites = data?.favorites ?? []
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  if (!user) {
    return (
      <section className="panel">
        <h1 className="page-title">Mis Extracciones</h1>
        <div className="alert">
          Espacio personal. <Link to="/auth">Regístrate o inicia sesión</Link> para continuar.
        </div>
      </section>
    )
  }

  return (
    <section>
      <p className="space-chip private">CANAL PRIVADO</p>
      <h1 className="page-title">Mis Extracciones</h1>
      <p className="page-lead">Tus fichas personales y favoritos. Lo publicado global vive aparte.</p>
      {toast && (
        <div className="alert success" role="status">
          {toast}
          <button type="button" className="toast-dismiss" onClick={() => setToast('')}>
            Cerrar
          </button>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          className={tab === 'mine' ? 'active' : ''}
          onClick={() => setTab('mine')}
        >
          Personales
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'favorites'}
          className={tab === 'favorites' ? 'active' : ''}
          onClick={() => setTab('favorites')}
        >
          Favoritos
        </button>
      </div>

      {tab === 'mine' && (
        <>
          <div className="toolbar">
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
            emptyTitle="Aún no tienes extracciones"
            emptyHint="Importa una URL oficial para generar tu primera ficha."
            emptyAction={
              <Link className="btn" to="/importar">
                Importar URL
              </Link>
            }
          >
            <div className="grid-cards">
              {items.map((c) => (
                <CompanyCardView
                  key={c._id}
                  company={c}
                  selected={!!selected[c._id]}
                  onSelect={
                    selectMode
                      ? (id, checked) => setSelected((s) => ({ ...s, [id]: checked }))
                      : undefined
                  }
                  onFavorite={async (company) => {
                    try {
                      await api('/favorites', {
                        method: 'POST',
                        body: JSON.stringify({ refType: 'extraction', refId: company._id }),
                      })
                      setToast(`«${company.name}» se guardó en Favoritos.`)
                      setTab('favorites')
                      reload()
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'No se pudo guardar')
                    }
                  }}
                />
              ))}
            </div>
          </StateView>
          <SelectionDock
            count={selectedIds.length}
            busy={pdfBusy}
            onClear={() => setSelected({})}
            onExport={() => {
              setPdfBusy(true)
              void downloadPdf({
                extractionIds: selectedIds,
                title: 'Mis extracciones — selección',
              })
                .catch((e) => alert(e instanceof Error ? e.message : 'Error'))
                .finally(() => setPdfBusy(false))
            }}
          />
        </>
      )}

      {tab === 'favorites' && (
        <StateView
          loading={loading}
          error={error}
          onRetry={reload}
          empty={!loading && !error && favorites.filter((f) => f.item).length === 0}
          emptyTitle="Sin favoritos"
          emptyHint="Usa el menú ⋮ en las fichas del directorio o de tus extracciones."
        >
          <div className="grid-cards">
            {favorites
              .filter((f) => f.item)
              .map((f) => (
                <CompanyCardView key={f.id} company={f.item!} showMenu={false} />
              ))}
          </div>
        </StateView>
      )}
    </section>
  )
}
