/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useState } from 'react'
import type { ExtractPreview, SaveMode } from '../types'

interface Props {
  data: ExtractPreview
  onClose: () => void
  onSave: (payload: ExtractPreview & { mode: SaveMode; manuallyModified: boolean }) => Promise<void>
  onExportPdf: (data: ExtractPreview) => Promise<void>
}

export function ExtractPreviewModal({ data, onClose, onSave, onExportPdf }: Props) {
  const [draft, setDraft] = useState(data)
  const [editing, setEditing] = useState(false)
  const [manuallyModified, setManuallyModified] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setDraft(data), [data])

  const startEdit = () => {
    const ok = window.confirm(
      'Si editas la información, se marcará como modificada manualmente y NO podrás publicarla; solo se guardará en Mis Extracciones. ¿Continuar?'
    )
    if (!ok) return
    setEditing(true)
    setManuallyModified(true)
  }

  const save = async (mode: SaveMode) => {
    setError('')
    if (manuallyModified && mode !== 'private') {
      setError('Contenido editado manualmente: solo puedes guardarlo en Mis Extracciones (privado).')
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, mode, manuallyModified })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
      setSaveOpen(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Vista previa de extracción</h2>
        {manuallyModified && (
          <div className="alert danger">
            Esta ficha será etiquetada como <strong>modificada manualmente</strong>. Solo podrá
            guardarse en Mis Extracciones (sin publicación global).
          </div>
        )}
        {error && <div className="alert danger">{error}</div>}

        <div className="form">
          <label>
            Nombre
            <input
              value={draft.name}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Especialidad
            <input
              value={draft.specialty}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
            />
          </label>
          <label>
            Dirección
            <input
              value={draft.address}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input
              value={draft.phone}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </label>
          <label>
            Sitio web
            <input
              value={draft.website}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            />
          </label>
          <label>
            Descripción
            <textarea
              rows={4}
              value={draft.description}
              disabled={!editing}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          <label>
            Destacados (uno por línea)
            <textarea
              rows={3}
              value={(draft.highlights || []).join('\n')}
              disabled={!editing}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  highlights: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </label>
        </div>

        <div className="cta-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>
            Descartar
          </button>
          <button type="button" className="btn secondary" onClick={startEdit} disabled={busy || editing}>
            Editar / corregir
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => onExportPdf(draft)}
          >
            Guardar PDF
          </button>
          <div className="dropdown">
            <button type="button" className="btn" disabled={busy} onClick={() => setSaveOpen((v) => !v)}>
              Guardar ▾
            </button>
            {saveOpen && (
              <div className="dropdown-panel">
                <button type="button" disabled={busy} onClick={() => save('private')}>
                  Solo para mí
                </button>
                <button
                  type="button"
                  disabled={busy || manuallyModified}
                  onClick={() => save('private_and_publish')}
                >
                  Para mí y publicar
                </button>
                <button
                  type="button"
                  disabled={busy || manuallyModified}
                  onClick={() => save('publish')}
                >
                  Solo publicar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
