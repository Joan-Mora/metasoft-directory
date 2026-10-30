/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { user } = useAuth()

  return (
    <section className="hero">
      <h1>MetaSoft Directory</h1>
      <p>
        Sistema de extracción y directorio de casas desarrolladoras de software. Consulta fichas
        enriquecidas desde MongoDB, importa páginas externas, interpreta la información y exporta
        reportes PDF con diseño profesional.
      </p>
      <div className="alert info">
        Puedes explorar el directorio global sin cuenta. Si quieres <strong>guardar</strong>,{' '}
        <strong>publicar</strong> tus propias páginas o usar tu espacio personal (Mis Extracciones /
        Favoritos), debes registrarte.
      </div>
      <div className="cta-row">
        <Link className="btn" to="/directorio">
          Explorar directorio
        </Link>
        {!user && (
          <Link className="btn secondary" to="/auth">
            Registrarme / Entrar
          </Link>
        )}
        <Link className="btn secondary" to="/importar">
          Importar URL
        </Link>
      </div>

      <div className="feature-grid">
        <article className="feature">
          <h3>Extracción directa</h3>
          <p>Importa un enlace oficial y obtén logo, contactos, descripción interpretada y enlaces.</p>
        </article>
        <article className="feature">
          <h3>Categorías de datos</h3>
          <p>Completas, parciales o sin registro: transparencia sobre la calidad de cada ficha.</p>
        </article>
        <article className="feature">
          <h3>Personal vs global</h3>
          <p>Publica al directorio o guarda solo para ti. Lo editado manualmente no se publica.</p>
        </article>
        <article className="feature">
          <h3>PDF profesional</h3>
          <p>Exporta una o varias empresas desde el directorio global o tus extracciones.</p>
        </article>
      </div>
    </section>
  )
}
