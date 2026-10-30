/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { CompanyCardView } from '../components/CompanyCardView'
import type { CompanyCard, DataStatus } from '../types'

const tabs: { id: DataStatus; label: string; hint: string }[] = [
  { id: 'complete', label: 'Datos completos', hint: 'Núcleo + web/logo/descripción' },
  { id: 'partial', label: 'Datos parciales', hint: 'Al menos un dato relevante' },
  { id: 'none', label: 'Sin datos registrados', hint: 'Sin información enriquecida útil' },
]

export function CategoriesPage() {
  const [status, setStatus] = useState<DataStatus>('complete')
  const [items, setItems] = useState<CompanyCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api<CompanyCard[]>(`/companies/by-status/${status}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [status])

  const current = tabs.find((t) => t.id === status)!

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--display)' }}>Categorías de completitud</h1>
      <p className="meta">{current.hint}</p>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={status === t.id ? 'active' : ''}
            onClick={() => setStatus(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="empty">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="empty">No hay empresas en esta categoría</div>
      ) : (
        <div className="grid-cards">
          {items.map((c) => (
            <CompanyCardView key={c._id} company={c} showMenu={false} />
          ))}
        </div>
      )}
    </section>
  )
}
