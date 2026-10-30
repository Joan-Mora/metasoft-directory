/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import type { DataStatus } from '../types'

const LABELS: Record<DataStatus, string> = {
  complete: 'Señal completa',
  partial: 'Señal parcial',
  none: 'Sin señal',
}

interface Props {
  level: DataStatus
  className?: string
}

export function CompletenessRing({ level, className = '' }: Props) {
  return (
    <span
      className={`snr-ring ${className}`.trim()}
      data-level={level}
      role="img"
      aria-label={LABELS[level]}
      title={LABELS[level]}
    />
  )
}
