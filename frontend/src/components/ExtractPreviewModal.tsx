/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { ExtractPreview, SaveMode } from '../types'

interface Props {
  data: ExtractPreview
  onClose: () => void
  onSave: (payload: ExtractPreview & { mode: SaveMode; manuallyModified: boolean }) => Promise<void>
  onExportPdf: (data: ExtractPreview) => Promise<void>
}

export function ExtractPreviewModal({ data, onClose, onSave, onExportPdf }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [draft, setDraft] = useState(data)
  const [editing, setEditing] = useState(false)
  const [manuallyModified, setManuallyModified] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(data)
    setEditing(false)
    setManuallyModified(false)
    setSaveOpen(false)
    setError('')
  }, [data])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (!d.open) d.showModal()
    const onCloseEvt = () => onClose()
    d.addEventListener('close', onCloseEvt)
    return () => d.removeEventListener('close', onCloseEvt)
  }, [onClose])

  const startEdit = () => {
    const ok = window.confirm(
      'Si editas la información, se marcará como «Modificado manualmente» y NO podrás publicarla; solo se guardará en Mis Extracciones. ¿Continuar?'
    )
    if (!ok) return
    setEditing(true)
    setManuallyModified(true)
  }

  const save = async (mode: SaveMode) => {
    setError('')
    if (manuallyModified && mode !== 'private') {
      setError(
        'Contenido editado manualmente: solo puedes guardarlo en Mis Extracciones (privado).'
      )
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, mode, manuallyModified })
      dialogRef.current?.close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
      setSaveOpen(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="signal-dialog" aria-labelledby={titleId}>
      <div className="signal-dialog-body">
        <h2 id={titleId}>Vista previa de extracción</h2>
        {manuallyModified && (
          <div className="alert danger">
            Etiqueta activa: <span className="badge edited">Modificado manualmente</span>. Las
            opciones de publicar están deshabilitadas.
          </div>
        )}
        {error && (
          <div className="alert danger" role="alert">
            {error}
          </div>
        )}

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
                  highlights: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </div>

        <div className="cta-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => dialogRef.current?.close()}
            disabled={busy}
          >
            Descartar
          </button>
          <button type="button" className="btn secondary" onClick={startEdit} disabled={busy || editing}>
            Editar / corregir
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void onExportPdf(draft)}
          >
            Guardar PDF
          </button>
          <div className="dropdown">
            <button
              type="button"
              className="btn"
              disabled={busy}
              aria-haspopup="menu"
              aria-expanded={saveOpen}
              onClick={() => setSaveOpen((v) => !v)}
            >
              Guardar ▾
            </button>
            {saveOpen && (
              <div className="dropdown-panel" role="menu">
                <button type="button" role="menuitem" disabled={busy} onClick={() => void save('private')}>
                  Solo para mí
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy || manuallyModified}
                  title={
                    manuallyModified
                      ? 'No disponible: la ficha fue modificada manualmente'
                      : undefined
                  }
                  onClick={() => void save('private_and_publish')}
                >
                  Para mí y publicar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy || manuallyModified}
                  title={
                    manuallyModified
                      ? 'No disponible: la ficha fue modificada manualmente'
                      : undefined
                  }
                  onClick={() => void save('publish')}
                >
                  Solo publicar
                </button>
                {manuallyModified && (
                  <p className="meta">Publicar bloqueado por edición manual.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
