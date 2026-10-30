/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      navigate('/mis-extracciones')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel" style={{ maxWidth: 460, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--display)', marginTop: 0 }}>
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </h1>
      <p className="meta">
        El registro habilita Mis Extracciones, Favoritos, importación con guardado y publicación.
      </p>
      {error && <div className="alert danger">{error}</div>}
      <form className="form" onSubmit={onSubmit}>
        {mode === 'register' && (
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
        )}
        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>
      <button
        type="button"
        className="btn ghost"
        style={{ marginTop: '0.75rem' }}
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </section>
  )
}
