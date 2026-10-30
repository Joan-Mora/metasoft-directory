/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
interface Props {
  count: number
  onExport: () => void
  onClear: () => void
  busy?: boolean
}

export function SelectionDock({ count, onExport, onClear, busy }: Props) {
  if (count < 1) return null
  return (
    <div className="selection-dock" role="status" aria-live="polite">
      <strong>
        {count} seleccionada{count === 1 ? '' : 's'}
      </strong>
      <button type="button" className="btn" onClick={onExport} disabled={busy}>
        Exportar PDF
      </button>
      <button type="button" className="btn ghost" onClick={onClear}>
        Limpiar
      </button>
    </div>
  )
}
