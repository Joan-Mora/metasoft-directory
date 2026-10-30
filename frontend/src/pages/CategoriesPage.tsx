/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CompanyCardView } from '../components/CompanyCardView'
import { StateView } from '../components/StateView'
import { useApi } from '../hooks/useApi'
import type { CompanyCard, DataStatus } from '../types'

const tabs: { id: DataStatus; label: string; hint: string }[] = [
  { id: 'complete', label: 'Completas', hint: 'Núcleo + web/logo/descripción' },
  { id: 'partial', label: 'Datos parciales', hint: 'Al menos un dato relevante' },
  { id: 'none', label: 'Sin datos registrados', hint: 'Sin información enriquecida útil' },
]

export function CategoriesPage() {
  const [status, setStatus] = useState<DataStatus>('complete')
  const current = tabs.find((t) => t.id === status)!

  const { data, loading, error, reload } = useApi(async (signal) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || '/api'}/companies/by-status/${status}`,
      { signal }
    )
    if (!res.ok) throw new Error('No se pudieron cargar las categorías')
    return (await res.json()) as CompanyCard[]
  }, [status])

  const items = data ?? []

  return (
    <section>
      <h1 className="page-title">Categorías de señal</h1>
      <p className="page-lead">{current.hint}</p>
      <div className="tabs" role="tablist" aria-label="Nivel de completitud">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={status === t.id}
            className={status === t.id ? 'active' : ''}
            onClick={() => setStatus(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="category-band" data-level={status}>
        <StateView
          loading={loading}
          error={error}
          onRetry={reload}
          empty={!loading && !error && items.length === 0}
          emptyTitle="Sin empresas en esta banda"
          emptyHint="Importa una URL o revisa otra categoría."
          emptyAction={
            <Link className="btn" to="/importar">
              Ir a Importar
            </Link>
          }
        >
          <div className="grid-cards">
            {items.map((c) => (
              <CompanyCardView key={c._id} company={c} showMenu={false} />
            ))}
          </div>
        </StateView>
      </div>
    </section>
  )
}
