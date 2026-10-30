/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import type { ReactNode } from 'react'

interface SkeletonProps {
  count?: number
}

export function CardSkeletonGrid({ count = 6 }: SkeletonProps) {
  return (
    <div className="grid-cards" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="company-card skeleton-card">
          <div className="skeleton sk-media" />
          <div className="body">
            <div className="skeleton sk-line sk-w-70" />
            <div className="skeleton sk-line sk-w-50" />
            <div className="skeleton sk-line sk-w-90" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyHint?: string
  emptyAction?: ReactNode
  onRetry?: () => void
  skeleton?: ReactNode
  children: ReactNode
}

export function StateView({
  loading,
  error,
  empty,
  emptyTitle = 'Nada por aquí',
  emptyHint,
  emptyAction,
  onRetry,
  skeleton,
  children,
}: Props) {
  if (loading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Cargando…</span>
        {skeleton ?? <CardSkeletonGrid />}
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-panel state-error" role="alert">
        <h2 className="page-title">Algo falló</h2>
        <p className="page-lead">{error}</p>
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="state-panel state-empty">
        <div className="empty-signal" aria-hidden="true" />
        <h2 className="page-title">{emptyTitle}</h2>
        {emptyHint && <p className="page-lead">{emptyHint}</p>}
        {emptyAction}
      </div>
    )
  }

  return <>{children}</>
}
