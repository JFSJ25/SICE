import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { LoadingSkeleton } from './components/ui/index.jsx'
import ScrollToTop from './components/ui/ScrollToTop.jsx'
import { NotificacionesToast } from './components/ui/Notificaciones.jsx'

import Login from './pages/Login.jsx'
import Shell from './components/layout/Shell.jsx'
import Cuenta from './pages/Cuenta.jsx'
import AcercaDe from './pages/AcercaDe.jsx'
import NotFound from './pages/NotFound.jsx'

// Páginas del profesor
import Grupos from './pages/profesor/Grupos.jsx'
import Calificar from './pages/profesor/Calificar.jsx'
import Autoevaluacion from './pages/profesor/Autoevaluacion.jsx'
import Pendientes from './pages/profesor/Pendientes.jsx'
import Estudiantes from './pages/profesor/Estudiantes.jsx'
import Reportes from './pages/profesor/Reportes.jsx'
import Admin from './pages/profesor/Admin/index.jsx'

// Páginas del estudiante
import MiGrupo from './pages/estudiante/MiGrupo.jsx'
import Coevaluar from './pages/estudiante/Coevaluar.jsx'
import CoevaluarForm from './pages/estudiante/CoevaluarForm.jsx'
import Notas from './pages/estudiante/Notas.jsx'
import Autoevaluar from './pages/estudiante/Autoevaluar.jsx'

import './App.css'

// ---- Guardias de ruta ----

function RequiereAuth({ children }) {
  const { sesion, cargando } = useAuth()
  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <LoadingSkeleton variant="auth" />
        </div>
      </div>
    )
  if (!sesion) return <Navigate to="/login" replace />
  return children
}

function RequiereProfesor({ children }) {
  const { perfil, cargando } = useAuth()
  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <LoadingSkeleton variant="auth" />
        </div>
      </div>
    )
  if (!perfil || !['profesor', 'admin'].includes(perfil.rol_sistema))
    return <Navigate to="/estudiante/mi-grupo" replace />
  return children
}

function RequiereEstudiante({ children }) {
  const { perfil, cargando } = useAuth()
  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <LoadingSkeleton variant="auth" />
        </div>
      </div>
    )
  if (!perfil || perfil.rol_sistema !== 'estudiante')
    return <Navigate to="/profesor/grupos" replace />
  return children
}

// Redirige según rol al entrar en "/"
function RootRedirect() {
  const { perfil, cargando } = useAuth()
  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <LoadingSkeleton variant="auth" />
        </div>
      </div>
    )
  if (!perfil) return <Navigate to="/login" replace />
  if (['profesor', 'admin'].includes(perfil.rol_sistema))
    return <Navigate to="/profesor/grupos" replace />
  return <Navigate to="/estudiante/mi-grupo" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <NotificacionesToast />
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RequiereAuth>
                <Shell />
              </RequiereAuth>
            }
          >
            <Route index element={<RootRedirect />} />

            {/* Profesor */}
            <Route
              path="profesor"
              element={
                <RequiereProfesor>
                  <Navigate to="/profesor/grupos" replace />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/grupos"
              element={
                <RequiereProfesor>
                  <Grupos />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/pendientes"
              element={
                <RequiereProfesor>
                  <Pendientes />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/calificar/:estudianteId"
              element={
                <RequiereProfesor>
                  <Calificar />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/admin"
              element={
                <RequiereProfesor>
                  <Admin />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/estudiantes"
              element={
                <RequiereProfesor>
                  <Estudiantes />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/reportes"
              element={
                <RequiereProfesor>
                  <Reportes />
                </RequiereProfesor>
              }
            />
            <Route
              path="profesor/autoevaluacion/:estudianteId"
              element={
                <RequiereProfesor>
                  <Autoevaluacion />
                </RequiereProfesor>
              }
            />

            <Route path="cuenta" element={<Cuenta />} />
            <Route path="acerca-de" element={<AcercaDe />} />

            {/* Estudiante */}
            <Route
              path="estudiante/mi-grupo"
              element={
                <RequiereEstudiante>
                  <MiGrupo />
                </RequiereEstudiante>
              }
            />
            <Route
              path="estudiante/coevaluar"
              element={
                <RequiereEstudiante>
                  <Coevaluar />
                </RequiereEstudiante>
              }
            />
            <Route
              path="estudiante/coevaluar/:grupoId"
              element={
                <RequiereEstudiante>
                  <CoevaluarForm />
                </RequiereEstudiante>
              }
            />
            <Route
              path="estudiante/notas"
              element={
                <RequiereEstudiante>
                  <Notas />
                </RequiereEstudiante>
              }
            />
            <Route
              path="estudiante/autoevaluar"
              element={
                <RequiereEstudiante>
                  <Autoevaluar />
                </RequiereEstudiante>
              }
            />
          </Route>

          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}

          {/* Página 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
