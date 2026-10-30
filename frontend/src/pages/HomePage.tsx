/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useReducedMotion } from '../hooks/useReducedMotion'

const STEPS = ['URL', 'Escaneo', 'Extracción', 'Ficha'] as const

export function HomePage() {
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduced) {
      setStep(STEPS.length - 1)
      return
    }
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 1100)
    return () => window.clearInterval(id)
  }, [reduced])

  return (
    <section className="hero">
      <p className="space-chip global">SIGNAL LAYER · CONSOLA DE DATOS</p>
      <h1>Extrae señal de cualquier web oficial</h1>
      <p>
        MetaSoft Directory no es un catálogo estático: conecta a MongoDB, scrapea sitios oficiales,
        interpreta la información y clasifica la completitud de cada casa de software.
      </p>
      <div className="alert info">
        Puedes explorar el directorio global sin cuenta. Para <strong>guardar</strong>,{' '}
        <strong>publicar</strong> o usar <strong>Mis Extracciones / Favoritos</strong> debes
        registrarte.
      </div>
      <div className="cta-row">
        <Link className="btn" to="/directorio">
          Explorar directorio
        </Link>
        {!user && (
          <Link className="btn secondary" to="/auth">
            Registrarme
          </Link>
        )}
        <Link className="btn secondary" to="/importar">
          Importar URL
        </Link>
      </div>

      <div className="bento-home">
        <div className="pipeline-demo" aria-label="Demo del flujo de extracción">
          <span className="scan-line" aria-hidden="true" />
          <p className="mono">flujo · url → ficha</p>
          <div className="pipeline-steps">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`pipeline-step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
              >
                {label}
              </div>
            ))}
          </div>
          <p className="meta">
            La extracción lee meta/og, contactos y bloques About; luego interpreta descripción y
            highlights.
          </p>
        </div>
        <article className="feature">
          <h3>Tres niveles de señal</h3>
          <p>Completa, parcial o sin datos — color, textura, anillo e iconografía coherentes.</p>
        </article>
        <article className="feature">
          <h3>Global vs personal</h3>
          <p>Publica al canal global o guarda solo en tu espacio. Lo editado a mano no se publica.</p>
        </article>
      </div>

      <div className="feature-grid">
        <article className="feature">
          <h3>Extracción directa</h3>
          <p>Importa un enlace oficial y obtén logo, contactos, descripción y enlaces.</p>
        </article>
        <article className="feature">
          <h3>Favoritos + PDF</h3>
          <p>Menú ⋮ en cada ficha y exportación múltiple con identidad visual uniforme.</p>
        </article>
        <article className="feature">
          <h3>CRUD instrumentado</h3>
          <p>Crea, edita y elimina casas del directorio con confirmación en lo destructivo.</p>
        </article>
        <article className="feature">
          <h3>Atajos</h3>
          <p>
            <span className="kbd">Ctrl</span>+<span className="kbd">K</span> abre la paleta para
            buscar empresas o saltar de ruta.
          </p>
        </article>
      </div>
    </section>
  )
}
