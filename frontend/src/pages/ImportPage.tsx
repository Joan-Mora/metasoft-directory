/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ExtractPreviewModal } from '../components/ExtractPreviewModal'
import { useAuth } from '../context/AuthContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { ExtractPreview, ImportActivity, ImportActivityAction, SaveMode } from '../types'

const PIPELINE = [
  { id: 'connecting', label: 'Conectando' },
  { id: 'reading', label: 'Leyendo HTML' },
  { id: 'extracting', label: 'Extrayendo señales' },
  { id: 'interpreting', label: 'Interpretando' },
] as const

const ACTION_LABEL: Record<ImportActivityAction, string> = {
  extract_ok: 'Extracción OK',
  extract_fail: 'Extracción fallida',
  saved: 'Guardado',
  discarded: 'Descartado',
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ImportPage() {
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<ExtractPreview | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(-1)
  const [history, setHistory] = useState<ImportActivity[]>([])
  const [historyBusy, setHistoryBusy] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!user) return
    setHistoryBusy(true)
    try {
      const items = await api<ImportActivity[]>('/import-activity/mine')
      setHistory(items)
    } catch {
      /* keep previous list */
    } finally {
      setHistoryBusy(false)
    }
  }, [user])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const runPipelineVisual = async () => {
    if (reduced) {
      setStep(PIPELINE.length - 1)
      return
    }
    for (let i = 0; i < PIPELINE.length; i++) {
      setStep(i)
      await new Promise((r) => setTimeout(r, 420))
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')
    setSuccess('')
    setPreview(null)
    setStep(-1)

    try {
      const check = await api<{ duplicate: boolean; error?: string }>('/extract/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
      if (check.duplicate) {
        setError(check.error || 'Ya existe una importación para este sitio.')
        setBusy(false)
        void loadHistory()
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo validar la URL')
      setBusy(false)
      return
    }

    setStep(0)
    const visual = runPipelineVisual()
    try {
      const data = await api<ExtractPreview>('/extract/preview', {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
      await visual
      setStep(PIPELINE.length - 1)
      setPreview(data)
      setSuccess(`Extracción lista: «${data.name}». Revisa la vista previa y guarda si corresponde.`)
      void loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida')
      setStep(-1)
      void loadHistory()
    } finally {
      setBusy(false)
    }
  }

  const resetPipeline = () => {
    setPreview(null)
    setStep(-1)
    setError('')
  }

  const onSave = async (
    payload: ExtractPreview & { mode: SaveMode; manuallyModified: boolean }
  ) => {
    const {
      mode,
      manuallyModified,
      name,
      address,
      specialty,
      phone,
      website,
      logoUrl,
      bannerUrl,
      links,
      description,
      highlights,
      sourceUrl,
    } = payload
    await api('/extractions', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        manuallyModified,
        name,
        address,
        specialty,
        phone,
        website,
        logoUrl,
        bannerUrl,
        links,
        description,
        highlights,
        sourceUrl,
      }),
    })
    if (mode === 'private') {
      setSuccess(`«${name}» se guardó solo en Mis Extracciones.`)
    } else if (mode === 'publish') {
      setSuccess(
        `«${name}» se publicó en el Directorio (no aparece en Mis Extracciones).`
      )
    } else {
      setSuccess(`«${name}» quedó en el Directorio y en Mis Extracciones.`)
    }
    setUrl('')
    resetPipeline()
    void loadHistory()
  }

  const onExportPdf = async (data: ExtractPreview) => {
    const blob = await api<Blob>('/export/pdf/preview', {
      method: 'POST',
      body: JSON.stringify({
        title: `Extracción — ${data.name}`,
        cards: [data],
      }),
    })
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'extraccion-preview.pdf'
    a.click()
    URL.revokeObjectURL(objectUrl)
  }

  const clearHistory = async () => {
    if (!window.confirm('¿Borrar todo el historial de actividad de importación?')) return
    await api('/import-activity/mine', { method: 'DELETE' })
    setHistory([])
  }

  if (!user) {
    return (
      <section className="panel">
        <h1 className="page-title">Importar página</h1>
        <div className="alert">
          Debes <Link to="/auth">iniciar sesión o registrarte</Link> para importar URLs, guardar
          extracciones o publicar.
        </div>
      </section>
    )
  }

  return (
    <section>
      <p className="space-chip private">PIPELINE · IMPORT</p>
      <h1 className="page-title">Importar página externa</h1>
      <p className="page-lead">
        Pega el enlace oficial. El sistema conecta, lee, extrae e interpreta — luego muestra la
        vista previa. No se permiten dominios ya importados ni variaciones de ruta del mismo sitio
        (p. ej. ejemplo.com y ejemplo.com/inicio).
      </p>
      <form className="toolbar" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="import-url">
          URL a extraer
        </label>
        <input
          id="import-url"
          type="url"
          required
          placeholder="https://empresa.example"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Extrayendo…' : 'Iniciar extracción'}
        </button>
      </form>

      {(busy || step >= 0) && (
        <div className="extract-pipeline" aria-live="polite">
          <div className="extract-step-row">
            {PIPELINE.map((p, i) => (
              <div
                key={p.id}
                className={`extract-step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
              >
                {i === step && <span className="scan-line" aria-hidden="true" />}
                <div className="mono">0{i + 1}</div>
                <strong>{p.label}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="alert danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert success" role="status">
          {success}{' '}
          {success.includes('Directorio') && <Link to="/directorio">Ver Directorio</Link>}{' '}
          {success.includes('Mis Extracciones') && (
            <Link to="/mis-extracciones">Ver Mis Extracciones</Link>
          )}
        </div>
      )}
      {preview && (
        <ExtractPreviewModal
          data={preview}
          onClose={resetPipeline}
          onSave={onSave}
          onExportPdf={onExportPdf}
        />
      )}

      <div className="import-history">
        <div className="import-history-head">
          <div>
            <h2 className="section-title">Historial de actividad</h2>
            <p className="page-lead tight">
              Registro de extracciones y guardados de esta cuenta.
            </p>
          </div>
          <div className="import-history-actions">
            <button
              type="button"
              className="btn secondary"
              disabled={historyBusy}
              onClick={() => void loadHistory()}
            >
              Actualizar
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={!history.length}
              onClick={() => void clearHistory()}
            >
              Limpiar
            </button>
          </div>
        </div>

        {historyBusy && history.length === 0 ? (
          <p className="meta">Cargando historial…</p>
        ) : history.length === 0 ? (
          <p className="meta">Aún no hay actividad. Importa una URL para empezar el registro.</p>
        ) : (
          <ul className="activity-list">
            {history.map((item) => (
              <li key={item._id} className={`activity-item action-${item.action}`}>
                <div className="activity-main">
                  <span className={`activity-badge action-${item.action}`}>
                    {ACTION_LABEL[item.action]}
                  </span>
                  <strong>{item.name || 'Sin nombre'}</strong>
                  <span className="meta mono">{formatWhen(item.createdAt)}</span>
                </div>
                <div className="activity-detail meta">{item.detail}</div>
                {item.sourceUrl && (
                  <a
                    className="activity-url mono"
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.sourceUrl}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
