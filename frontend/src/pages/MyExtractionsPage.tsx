/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, downloadPdf } from '../api/client'
import { CompanyCardView } from '../components/CompanyCardView'
import { useAuth } from '../context/AuthContext'
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
  const [items, setItems] = useState<Extraction[]>([])
  const [favorites, setFavorites] = useState<FavoriteRow[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    setError('')
    try {
      const [mine, favs] = await Promise.all([
        api<Extraction[]>('/extractions/mine'),
        api<FavoriteRow[]>('/favorites'),
      ])
      setItems(mine)
      setFavorites(favs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  useEffect(() => {
    void load()
  }, [user])

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  )

  if (!user) {
    return (
      <section className="panel">
        <h1 style={{ fontFamily: 'var(--display)' }}>Mis Extracciones</h1>
        <div className="alert">
          Espacio personal. <Link to="/auth">Regístrate o inicia sesión</Link> para continuar.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--display)' }}>Mis Extracciones</h1>
      <div className="tabs">
        <button type="button" className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
          Personales
        </button>
        <button
          type="button"
          className={tab === 'favorites' ? 'active' : ''}
          onClick={() => setTab('favorites')}
        >
          Favoritos
        </button>
      </div>
      {error && <div className="alert danger">{error}</div>}

      {tab === 'mine' && (
        <>
          <div className="toolbar">
            <button
              type="button"
              className="btn secondary"
              disabled={!selectedIds.length}
              onClick={() =>
                void downloadPdf({
                  extractionIds: selectedIds,
                  title: 'Mis extracciones — selección',
                })
              }
            >
              Exportar PDF ({selectedIds.length})
            </button>
          </div>
          {items.length === 0 ? (
            <div className="empty">Aún no tienes extracciones. Importa una URL.</div>
          ) : (
            <div className="grid-cards">
              {items.map((c) => (
                <CompanyCardView
                  key={c._id}
                  company={c}
                  selected={!!selected[c._id]}
                  onSelect={(id, checked) => setSelected((s) => ({ ...s, [id]: checked }))}
                  onFavorite={async (company) => {
                    await api('/favorites', {
                      method: 'POST',
                      body: JSON.stringify({ refType: 'extraction', refId: company._id }),
                    })
                    await load()
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <div className="empty">Sin favoritos. Usa el menú ⋮ en las fichas.</div>
          ) : (
            <div className="grid-cards">
              {favorites
                .filter((f) => f.item)
                .map((f) => (
                  <CompanyCardView key={f.id} company={f.item!} showMenu={false} />
                ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
