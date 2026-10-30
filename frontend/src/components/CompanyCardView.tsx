/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useRef, useState } from 'react'
import type { CompanyCard, DataStatus } from '../types'

const statusLabel: Record<DataStatus, string> = {
  complete: 'Completa',
  partial: 'Parcial',
  none: 'Sin datos',
}

interface Props {
  company: CompanyCard
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onFavorite?: (company: CompanyCard) => void
  showMenu?: boolean
  refType?: 'company' | 'extraction'
}

export function CompanyCardView({
  company,
  selected,
  onSelect,
  onFavorite,
  showMenu = true,
}: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const openSite = () => {
    if (company.website) window.open(company.website, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="company-card">
      <div className="media">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`Logo ${company.name}`}
            onClick={openSite}
            title={company.website ? 'Ir al sitio oficial' : 'Sin sitio oficial'}
          />
        ) : (
          <button type="button" className="btn secondary" onClick={openSite} disabled={!company.website}>
            {company.name.slice(0, 1)}
          </button>
        )}
      </div>
      <div className="body">
        <div className="check-row">
          {onSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={(e) => onSelect(company._id, e.target.checked)}
              aria-label={`Seleccionar ${company.name}`}
            />
          )}
          <h3>{company.name}</h3>
        </div>
        <div className="meta">{company.specialty || 'Sin especialidad'}</div>
        <div className="meta">{company.address || 'Dirección no registrada'}</div>
        <div className="meta">{company.phone || 'Teléfono no registrado'}</div>
        {company.description && (
          <p className="meta" style={{ marginTop: '0.35rem' }}>
            {company.description.slice(0, 140)}
            {company.description.length > 140 ? '…' : ''}
          </p>
        )}
        <div className="card-actions">
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span className={`badge ${company.dataStatus}`}>{statusLabel[company.dataStatus]}</span>
            {company.manuallyModified && <span className="badge edited">Editado</span>}
          </div>
          {showMenu && (
            <div className="menu" ref={menuRef}>
              <button type="button" className="menu-btn" aria-label="Más opciones" onClick={() => setOpen((v) => !v)}>
                ⋮
              </button>
              {open && (
                <div className="menu-panel">
                  {company.website && (
                    <button type="button" onClick={openSite}>
                      Sitio oficial
                    </button>
                  )}
                  {onFavorite && (
                    <button
                      type="button"
                      onClick={() => {
                        onFavorite(company)
                        setOpen(false)
                      }}
                    >
                      Guardar en Favoritos
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
