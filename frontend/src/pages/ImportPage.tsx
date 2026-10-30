/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ExtractPreviewModal } from '../components/ExtractPreviewModal'
import { useAuth } from '../context/AuthContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { ExtractPreview, SaveMode } from '../types'

const PIPELINE = [
  { id: 'connecting', label: 'Conectando' },
  { id: 'reading', label: 'Leyendo HTML' },
  { id: 'extracting', label: 'Extrayendo señales' },
  { id: 'interpreting', label: 'Interpretando' },
] as const

export function ImportPage() {
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<ExtractPreview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(-1)

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
    setPreview(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida')
      setStep(-1)
    } finally {
      setBusy(false)
    }
  }

  const onSave = async (
    payload: ExtractPreview & { mode: SaveMode; manuallyModified: boolean }
  ) => {
    const { mode, ...rest } = payload
    await api('/extractions', {
      method: 'POST',
      body: JSON.stringify({ ...rest, mode }),
    })
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
        vista previa.
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
      {preview && (
        <ExtractPreviewModal
          data={preview}
          onClose={() => setPreview(null)}
          onSave={onSave}
          onExportPdf={onExportPdf}
        />
      )}
    </section>
  )
}
