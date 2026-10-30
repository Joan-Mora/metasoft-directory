/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { StateView } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import type { CompanyCard } from '../types'

const empty = {
  name: '',
  address: '',
  specialty: '',
  phone: '',
  website: '',
  logoUrl: '',
  description: '',
}

export function AdminPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const { data, loading, error, reload } = useApi(async (signal) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/companies`, { signal })
    if (!res.ok) throw new Error('No se pudieron cargar las casas')
    return (await res.json()) as CompanyCard[]
  }, [])

  const items = data ?? []

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    try {
      if (editId) {
        await api(`/companies/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, manuallyModified: true }),
        })
      } else {
        await api('/companies', { method: 'POST', body: JSON.stringify(form) })
      }
      setForm(empty)
      setEditId(null)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const onEdit = (c: CompanyCard) => {
    setEditId(c._id)
    setForm({
      name: c.name,
      address: c.address,
      specialty: c.specialty,
      phone: c.phone,
      website: c.website,
      logoUrl: c.logoUrl,
      description: c.description,
    })
  }

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta casa del directorio global? Esta acción no se puede deshacer.')) {
      return
    }
    await api(`/companies/${id}`, { method: 'DELETE' })
    reload()
  }

  return (
    <section className="split two">
      <div className="panel">
        <h1 className="page-title">{editId ? 'Editar casa' : 'Crear casa'}</h1>
        {formError && (
          <div className="alert danger" role="alert">
            {formError}
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
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'name'}
              />
            </label>
          ))}
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
              {editId ? 'Actualizar' : 'Crear'}
            </button>
            {editId && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditId(null)
                  setForm(empty)
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div>
        <h2 className="page-title">Registros ({items.length})</h2>
        <StateView loading={loading} error={error} onRetry={reload}>
          <div className="grid-cards">
            {items.map((c) => (
              <div key={c._id} className="panel">
                <strong>{c.name}</strong>
                <div className="meta">{c.specialty}</div>
                <div className="cta-row">
                  <button type="button" className="btn secondary" onClick={() => onEdit(c)}>
                    Editar
                  </button>
                  <button type="button" className="btn danger" onClick={() => void onDelete(c._id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </StateView>
      </div>
    </section>
  )
}
