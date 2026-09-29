import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

import Login from './pages/Login.jsx'
import Shell from './components/Shell.jsx'

// Páginas del profesor
import Grupos from './pages/profesor/Grupos.jsx'
import Pendientes from './pages/profesor/Pendientes.jsx'
import Calificar from './pages/profesor/Calificar.jsx'
import Admin from './pages/profesor/Admin/index.jsx'

// Páginas del estudiante
import MiGrupo from './pages/estudiante/MiGrupo.jsx'
import Coevaluar from './pages/estudiante/Coevaluar.jsx'
import CoevaluarForm from './pages/estudiante/CoevaluarForm.jsx'
import Notas from './pages/estudiante/Notas.jsx'
import Cuenta from './pages/Cuenta.jsx'
import Estudiantes from './pages/profesor/Estudiantes.jsx'
import AcercaDe from './pages/AcercaDe.jsx'

// ---- Guardias de ruta ----

function RequiereAuth({ children }) {
  const { sesion, cargando } = useAuth()
  if (cargando)
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-soft text-sm">
        Cargando…
      </div>
    )
  if (!sesion) return <Navigate to="/login" replace />
  return children
}

function RequiereProfesor({ children }) {
  const { perfil, cargando } = useAuth()
  if (cargando) return null
  if (!perfil || !['profesor', 'admin'].includes(perfil.rol_sistema))
    return <Navigate to="/estudiante/mi-grupo" replace />
  return children
}

function RequiereEstudiante({ children }) {
  const { perfil, cargando } = useAuth()
  if (cargando) return null
  if (!perfil || perfil.rol_sistema !== 'estudiante')
    return <Navigate to="/profesor/grupos" replace />
  return children
}

// Redirige según rol al entrar en "/"
function RootRedirect() {
  const { perfil, cargando } = useAuth()
  if (cargando) return null
  if (!perfil) return <Navigate to="/login" replace />
  if (['profesor', 'admin'].includes(perfil.rol_sistema))
    return <Navigate to="/profesor/grupos" replace />
  return <Navigate to="/estudiante/mi-grupo" replace />
}

// ---- App ----

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
