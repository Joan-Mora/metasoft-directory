/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ExtractPreviewModal } from '../components/ExtractPreviewModal'
import { useAuth } from '../context/AuthContext'
import type { ExtractPreview, SaveMode } from '../types'

export function ImportPage() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<ExtractPreview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const data = await api<ExtractPreview>('/extract/preview', {
        method: 'POST',
        body: JSON.stringify({ url }),
      })
      setPreview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracción fallida')
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
        <h1 style={{ fontFamily: 'var(--display)' }}>Importar página</h1>
        <div className="alert">
          Debes <Link to="/auth">iniciar sesión o registrarte</Link> para importar URLs, guardar
          extracciones o publicar.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--display)' }}>Importar página externa</h1>
      <p className="meta">
        Pega el enlace oficial. El sistema extrae e interpreta la información y muestra una vista
        previa ordenada.
      </p>
      <form className="toolbar" onSubmit={onSubmit}>
        <input
          type="url"
          required
          placeholder="https://empresa.example"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ maxWidth: 480, flex: 1 }}
        />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Extrayendo…' : 'Extraer'}
        </button>
      </form>
      {error && <div className="alert danger">{error}</div>}
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
