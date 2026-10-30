/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { StateView } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import type { CompanyCard } from '../types'

type Scope = 'all' | 'source' | 'external'
type EditKind = 'company' | 'extraction'

const empty = {
  name: '',
  address: '',
  specialty: '',
  phone: '',
  website: '',
  logoUrl: '',
  description: '',
  sourceUrl: '',
  visibility: 'published' as 'private' | 'published' | 'both',
}

const SCOPE_LABEL: Record<Scope, string> = {
  all: 'Todas',
  source: 'Fuente',
  external: 'Externas',
}

export function AdminPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [editKind, setEditKind] = useState<EditKind>('company')
  const [createKind, setCreateKind] = useState<EditKind>('company')
  const [formError, setFormError] = useState('')
  const [formOk, setFormOk] = useState('')
  const [scope, setScope] = useState<Scope>('all')

  const { data, loading, error, reload } = useApi(async (signal) => {
    const headers: HeadersInit = {}
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
    const [srcRes, extRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/companies/source`, { signal, headers }),
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/extractions/admin/all`, { signal, headers }),
    ])
    if (!srcRes.ok || !extRes.ok) throw new Error('No se pudieron cargar los registros')
    const source = (await srcRes.json()) as CompanyCard[]
    const external = (await extRes.json()) as CompanyCard[]
    return { source, external }
  }, [user?.id])

  const sourceItems = data?.source ?? []
  const externalItems = data?.external ?? []

  const visibleSource = useMemo(
    () => (scope === 'external' ? [] : sourceItems),
    [scope, sourceItems]
  )
  const visibleExternal = useMemo(
    () => (scope === 'source' ? [] : externalItems),
    [scope, externalItems]
  )

  const resetForm = () => {
    setForm(empty)
    setEditId(null)
    setEditKind('company')
    setCreateKind('company')
    setFormError('')
  }

  if (!user) {
    return (
      <section className="panel">
        <h1 className="page-title">CRUD de casas</h1>
        <div className="alert">
          Operaciones de escritura requieren cuenta. <Link to="/auth">Entrar</Link>
        </div>
      </section>
    )
  }

  const activeKind: EditKind = editId ? editKind : createKind

  const checkDuplicate = async () => {
    const url = (form.website || form.sourceUrl).trim()
    if (!url) return true
    const check = await api<{ duplicate: boolean; error?: string }>('/extract/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({
        url,
        excludeCompanyId: editId && editKind === 'company' ? editId : undefined,
        excludeExtractionId: editId && editKind === 'extraction' ? editId : undefined,
      }),
    })
    if (check.duplicate) {
      setFormError(check.error || 'Ya existe un registro con ese sitio web.')
      return false
    }
    return true
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormOk('')
    try {
      const ok = await checkDuplicate()
      if (!ok) return

      const payload = {
        name: form.name,
        address: form.address,
        specialty: form.specialty,
        phone: form.phone,
        website: form.website,
        logoUrl: form.logoUrl,
        description: form.description,
        sourceUrl: form.sourceUrl || form.website,
      }

      if (editId) {
        if (editKind === 'company') {
          await api(`/companies/${editId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...payload, manuallyModified: true }),
          })
          setFormOk('Casa de fuente actualizada.')
        } else {
          await api(`/extractions/admin/${editId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...payload, visibility: form.visibility }),
          })
          setFormOk('Casa externa actualizada.')
        }
      } else if (createKind === 'company') {
        await api('/companies', { method: 'POST', body: JSON.stringify(payload) })
        setFormOk('Casa de fuente creada.')
        setScope('source')
      } else {
        await api('/extractions/admin', {
          method: 'POST',
          body: JSON.stringify({ ...payload, visibility: form.visibility }),
        })
        setFormOk('Casa externa creada.')
        setScope('external')
      }

      resetForm()
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const onEdit = (c: CompanyCard, kind: EditKind) => {
    setEditId(c._id)
    setEditKind(kind)
    setCreateKind(kind)
    setFormOk('')
    setFormError('')
    setForm({
      name: c.name || '',
      address: c.address || '',
      specialty: c.specialty || '',
      phone: c.phone || '',
      website: c.website || '',
      logoUrl: c.logoUrl || '',
      description: c.description || '',
      sourceUrl: c.sourceUrl || '',
      visibility: c.visibility || 'published',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onDelete = async (id: string, kind: EditKind, name: string) => {
    if (
      !confirm(
        `¿Eliminar «${name}» (${kind === 'company' ? 'Fuente' : 'Externa'})? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    try {
      if (kind === 'company') {
        await api(`/companies/${id}`, { method: 'DELETE' })
      } else {
        await api(`/extractions/admin/${id}`, { method: 'DELETE' })
      }
      if (editId === id) resetForm()
      setFormOk(`«${name}» eliminada.`)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar')
    }
  }

  const renderCard = (c: CompanyCard, kind: EditKind) => (
    <article key={`${kind}-${c._id}`} className="panel admin-record">
      <div className="admin-record-head">
        <strong>{c.name}</strong>
        <span className={`activity-badge action-${kind === 'company' ? 'saved' : 'extract_ok'}`}>
          {kind === 'company' ? 'Fuente' : 'Externa'}
        </span>
      </div>
      <div className="meta">{c.specialty || 'Sin especialidad'}</div>
      <div className="meta mono">{c.website || c.sourceUrl || 'Sin URL'}</div>
      <div className="meta">SNR: {c.dataStatus}</div>
      <div className="cta-row">
        <button type="button" className="btn secondary" onClick={() => onEdit(c, kind)}>
          Editar
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => void onDelete(c._id, kind, c.name)}
        >
          Eliminar
        </button>
      </div>
    </article>
  )

  return (
    <section className="admin-crud">
      <p className="space-chip private">GESTIÓN · CRUD</p>
      <h1 className="page-title">CRUD de casas</h1>
      <p className="page-lead">
        <strong>Fuente</strong>: creadas por el sistema o admin. <strong>Externas</strong>:
        importadas por usuarios. Filtra o gestiona todas.
      </p>

      <div className="tabs" role="tablist" aria-label="Filtro de origen">
        {(Object.keys(SCOPE_LABEL) as Scope[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            className={scope === id ? 'active' : ''}
            onClick={() => setScope(id)}
          >
            {SCOPE_LABEL[id]}
            <span className="tab-count">
              {id === 'all'
                ? sourceItems.length + externalItems.length
                : id === 'source'
                  ? sourceItems.length
                  : externalItems.length}
            </span>
          </button>
        ))}
      </div>

      <div className="split two admin-crud-grid">
        <div className="panel">
          <h2 className="section-title">
            {editId
              ? `Editar · ${editKind === 'company' ? 'Fuente' : 'Externa'}`
              : 'Crear casa'}
          </h2>

          {!editId && (
            <div className="tabs compact" role="tablist" aria-label="Tipo a crear">
              <button
                type="button"
                role="tab"
                className={createKind === 'company' ? 'active' : ''}
                aria-selected={createKind === 'company'}
                onClick={() => setCreateKind('company')}
              >
                Fuente
              </button>
              <button
                type="button"
                role="tab"
                className={createKind === 'extraction' ? 'active' : ''}
                aria-selected={createKind === 'extraction'}
                onClick={() => setCreateKind('extraction')}
              >
                Externa
              </button>
            </div>
          )}

          {formError && (
            <div className="alert danger" role="alert">
              {formError}
            </div>
          )}
          {formOk && (
            <div className="alert success" role="status">
              {formOk}
              <button type="button" className="toast-dismiss" onClick={() => setFormOk('')}>
                Cerrar
              </button>
            </div>
          )}

          <form className="form" onSubmit={onSubmit}>
            {(
              [
                ['name', 'Nombre'],
                ['address', 'Dirección'],
                ['specialty', 'Especialidad'],
                ['phone', 'Teléfono'],
                ['website', 'Sitio web'],
                ['logoUrl', 'URL logo'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={form[key]}
                  onChange={(e) => {
                    setForm({ ...form, [key]: e.target.value })
                    if (key === 'website' && formError) setFormError('')
                  }}
                  onBlur={async () => {
                    if (key !== 'website' || !form.website.trim()) return
                    try {
                      await checkDuplicate()
                    } catch {
                      /* ignore */
                    }
                  }}
                  required={key === 'name'}
                />
              </label>
            ))}

            {activeKind === 'extraction' && (
              <>
                <label>
                  URL de origen
                  <input
                    value={form.sourceUrl}
                    onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
                <label>
                  Visibilidad
                  <select
                    value={form.visibility}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        visibility: e.target.value as 'private' | 'published' | 'both',
                      })
                    }
                  >
                    <option value="published">Solo directorio</option>
                    <option value="both">Directorio + Mis Extracciones</option>
                    <option value="private">Solo Mis Extracciones</option>
                  </select>
                </label>
              </>
            )}

            <label>
              Descripción
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="cta-row">
              <button className="btn" type="submit">
                {editId ? 'Actualizar' : `Crear ${activeKind === 'company' ? 'fuente' : 'externa'}`}
              </button>
              {editId && (
                <button type="button" className="btn secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-lists">
          <StateView loading={loading} error={error} onRetry={reload}>
            {(scope === 'all' || scope === 'source') && (
              <section className="admin-subsection">
                <div className="admin-subsection-head">
                  <h2 className="section-title">Fuente</h2>
                  <p className="meta">Casas del sistema o creadas por admin · {visibleSource.length}</p>
                </div>
                {visibleSource.length === 0 ? (
                  <p className="meta">No hay casas de fuente en este filtro.</p>
                ) : (
                  <div className="grid-cards admin-records">
                    {visibleSource.map((c) => renderCard(c, 'company'))}
                  </div>
                )}
              </section>
            )}

            {(scope === 'all' || scope === 'external') && (
              <section className="admin-subsection">
                <div className="admin-subsection-head">
                  <h2 className="section-title">Externas</h2>
                  <p className="meta">
                    Importaciones de usuarios · {visibleExternal.length}
                  </p>
                </div>
                {visibleExternal.length === 0 ? (
                  <p className="meta">No hay casas externas en este filtro.</p>
                ) : (
                  <div className="grid-cards admin-records">
                    {visibleExternal.map((c) => renderCard(c, 'extraction'))}
                  </div>
                )}
              </section>
            )}
          </StateView>
        </div>
      </div>
    </section>
  )
}
