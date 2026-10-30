/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { CompanyCard, DataStatus } from '../types'
import { CompletenessRing } from './CompletenessRing'
import { HighlightMatch } from './HighlightMatch'

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
  query?: string
}

export function CompanyCardView({
  company,
  selected,
  onSelect,
  onFavorite,
  showMenu = true,
  query = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const checkboxId = useId()

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const hasOfficial = Boolean(company.website)

  return (
    <article
      className={`company-card${open ? ' is-menu-open' : ''}`}
      data-snr={company.dataStatus}
    >
      <div className="media">
        <span className="scan-line" aria-hidden="true" />
        {company.logoUrl ? (
          hasOfficial ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir sitio oficial de ${company.name}`}
            >
              <img
                src={company.logoUrl}
                alt=""
                width={160}
                height={80}
                loading="lazy"
              />
            </a>
          ) : (
            <img src={company.logoUrl} alt="" width={160} height={80} loading="lazy" />
          )
        ) : hasOfficial ? (
          <a
            className="btn secondary"
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {company.name.slice(0, 1)}
          </a>
        ) : (
          <span className="btn secondary" aria-hidden="true">
            {company.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="body">
        <div className="check-row">
          {onSelect && (
            <>
              <input
                id={checkboxId}
                type="checkbox"
                checked={!!selected}
                onChange={(e) => onSelect(company._id, e.target.checked)}
              />
              <label className="sr-only" htmlFor={checkboxId}>
                Seleccionar {company.name}
              </label>
            </>
          )}
          <CompletenessRing level={company.dataStatus} />
          <h3>
            <HighlightMatch text={company.name} query={query} />
          </h3>
        </div>
        <div className="meta">{company.specialty || 'Sin especialidad'}</div>
        <div className="meta">{company.address || 'Dirección no registrada'}</div>
        <div className="meta mono">{company.phone || 'Tel. no registrado'}</div>
        {company.description && (
          <p className="card-desc">
            {company.description.slice(0, 140)}
            {company.description.length > 140 ? '…' : ''}
          </p>
        )}
        <div className="card-actions">
          <div className="badge-row">
            <span className={`badge ${company.dataStatus}`}>{statusLabel[company.dataStatus]}</span>
            {company.manuallyModified && <span className="badge edited">Modificado</span>}
            {hasOfficial && <span className="badge official">Oficial</span>}
          </div>
          {showMenu && (
            <div className="menu" ref={menuRef}>
              <button
                type="button"
                className="menu-btn"
                aria-label={`Más opciones de ${company.name}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setOpen(true)
                  }
                }}
              >
                ⋮
              </button>
              {open && (
                <div className="menu-panel" role="menu" id={menuId}>
                  {hasOfficial && (
                    <a
                      role="menuitem"
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="menu-link"
                    >
                      Sitio oficial
                    </a>
                  )}
                  {onFavorite && (
                    <button
                      type="button"
                      role="menuitem"
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
