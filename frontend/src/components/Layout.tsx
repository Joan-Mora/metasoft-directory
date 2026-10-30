/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          MetaSoft Directory
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/directorio">Directorio</NavLink>
          <NavLink to="/categorias">Categorías</NavLink>
          <NavLink to="/importar">Importar</NavLink>
          <NavLink to="/mis-extracciones">Mis Extracciones</NavLink>
          <NavLink to="/admin">CRUD</NavLink>
          {user ? (
            <>
              <span className="meta">{user.name}</span>
              <button type="button" className="btn ghost" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/auth">Entrar</NavLink>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} Joan Mora · Licencia propietaria · Uso académico Taller 1 C3
      </footer>
    </div>
  )
}
