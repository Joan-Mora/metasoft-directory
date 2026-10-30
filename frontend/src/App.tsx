/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CardSkeletonGrid } from './components/StateView'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { HomePage } from './pages/HomePage'

const DirectoryPage = lazy(() =>
  import('./pages/DirectoryPage').then((m) => ({ default: m.DirectoryPage }))
)
const ImportPage = lazy(() =>
  import('./pages/ImportPage').then((m) => ({ default: m.ImportPage }))
)
const MyExtractionsPage = lazy(() =>
  import('./pages/MyExtractionsPage').then((m) => ({ default: m.MyExtractionsPage }))
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
)
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({ default: m.AuthPage }))
)

function RouteFallback() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando vista…</span>
      <CardSkeletonGrid count={3} />
    </div>
  )
}

/** Legacy /categorias → /directorio?status=… */
function CategoriesRedirect() {
  const [params] = useSearchParams()
  const status = params.get('status')
  const to =
    status === 'complete' || status === 'partial' || status === 'none'
      ? `/directorio?status=${status}`
      : '/directorio'
  return <Navigate to={to} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="directorio"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <DirectoryPage />
                  </Suspense>
                }
              />
              <Route path="categorias" element={<CategoriesRedirect />} />
              <Route
                path="importar"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <ImportPage />
                  </Suspense>
                }
              />
              <Route
                path="mis-extracciones"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <MyExtractionsPage />
                  </Suspense>
                }
              />
              <Route
                path="admin"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminPage />
                  </Suspense>
                }
              />
              <Route
                path="auth"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AuthPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
