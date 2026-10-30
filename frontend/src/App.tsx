/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { HomePage } from './pages/HomePage'
import { ImportPage } from './pages/ImportPage'
import { MyExtractionsPage } from './pages/MyExtractionsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="directorio" element={<DirectoryPage />} />
              <Route path="categorias" element={<CategoriesPage />} />
              <Route path="importar" element={<ImportPage />} />
              <Route path="mis-extracciones" element={<MyExtractionsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
