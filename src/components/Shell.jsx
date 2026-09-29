import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  cerrarSesion,
  obtenerContextosProfesor,
  obtenerContextoEstudiante
} from '../lib/auth.js'
import { obtenerHemisemestres } from '../lib/data.js'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import GroupIcon from '@mui/icons-material/Group'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import PersonIcon from '@mui/icons-material/Person'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import GradeIcon from '@mui/icons-material/Grade'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

// El Shell expone el contexto activo y el hemisemestre activo
// a las páginas hijas a través de props pasadas por Outlet context.
// Las páginas los consumen con useOutletContext().
const CLAVE_PARALELO_ACTIVO = 'sice-paralelo-activo'

export default function Shell() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const esStaff = perfil && ['profesor', 'admin'].includes(perfil.rol_sistema)

  const [navAbierta, setNavAbierta] = useState(false)
  const [paralelos, setParalelos] = useState([])
  const [contexto, setContexto] = useState(null)
  const [hemisemestres, setHemisemestres] = useState([])
  const [hemisemestreActivo, setHemisemestreActivo] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Carga inicial
  useEffect(() => {
    if (!perfil) return
    cargarContexto()
  }, [perfil])

  async function cargarContexto(mostrarCarga = true) {
    if (mostrarCarga) setCargando(true)
    try {
      if (esStaff) {
        const { paralelos: ps, contextoActivo } =
          await obtenerContextosProfesor(perfil.id)
        setParalelos(ps)
        const paraleloGuardado = localStorage.getItem(
          `${CLAVE_PARALELO_ACTIVO}-${perfil.id}`
        )
        const contextoActivoPersistido =
          ps.find(p => p.paraleloId === paraleloGuardado) ?? contextoActivo
        if (contextoActivoPersistido) {
          setContexto(contextoActivoPersistido)
          await cargarHemisemestres(contextoActivoPersistido.paraleloId)
        } else {
          // Sin paralelos → ir a Admin
          navigate('/profesor/admin', { replace: true })
        }
      } else {
        const ctx = await obtenerContextoEstudiante(perfil.id)
        if (!ctx) {
          // Sin matrícula — se muestra mensaje en la página
          setContexto(null)
        } else {
          setContexto(ctx)
          await cargarHemisemestres(ctx.paraleloId)
        }
      }
    } finally {
      setCargando(false)
    }
  }

  async function cargarHemisemestres(paraleloId) {
    const hs = await obtenerHemisemestres(paraleloId)
    setHemisemestres(hs)
    setHemisemestreActivo(prev => {
      const sigue = hs.find(h => h.id === prev?.id)
      return sigue ?? hs[0] ?? null
    })
  }

  async function cambiarParalelo(paraleloId) {
    const ctx = paralelos.find(p => p.paraleloId === paraleloId)
    if (!ctx) return
    localStorage.setItem(
      `${CLAVE_PARALELO_ACTIVO}-${perfil.id}`,
      ctx.paraleloId
    )
    setContexto(ctx)
    await cargarHemisemestres(paraleloId)
    navigate('/profesor/grupos')
  }

  async function handleLogout() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  // Etiqueta abreviada del hemisemestre para las tabs
  const hsLabel = h => (h.orden === 1 ? 'Hemi 1' : 'Hemi 2')

  const navProfesor = [
    { to: '/profesor/grupos', label: 'Grupos y temas', Icon: GroupIcon },
    {
      to: '/profesor/pendientes',
      label: 'Pendientes',
      Icon: PendingActionsIcon
    },
    {
      to: '/profesor/estudiantes',
      label: 'Contraseñas',
      Icon: ManageAccountsIcon
    }
  ]
  const navEstudiante = [
    { to: '/estudiante/mi-grupo', label: 'Mi grupo', Icon: PersonIcon },
    { to: '/estudiante/coevaluar', label: 'Coevaluar', Icon: FactCheckIcon },
    { to: '/estudiante/notas', label: 'Mis notas', Icon: GradeIcon }
  ]
  const navItems = [
    ...(esStaff ? navProfesor : navEstudiante),
    { to: '/cuenta', label: 'Mi cuenta', Icon: AccountCircleIcon },
    { to: '/acerca-de', label: 'Acerca de', Icon: InfoOutlinedIcon }
  ]

  const rolTexto = esStaff
    ? 'Profesor'
    : contexto?.rolGrupo === 'evaluador'
      ? 'Evaluador'
      : 'Expositor'

  return (
    <div className="min-h-screen bg-surface">
      {/* ---- Topbar móvil ---- */}
      <div className="md:hidden sticky top-0 z-[80] bg-sidebar border-b border-white/10 flex items-center gap-3 px-4 h-13 shadow-md">
        <button
          onClick={() => setNavAbierta(v => !v)}
          className="p-2 -ml-2 text-white/80"
          aria-label="Menú"
        >
          {navAbierta ? <CloseIcon /> : <MenuIcon />}
        </button>
        <span className="font-display font-bold text-gold-dim text-base">
          SICE
        </span>
        {contexto && (
          <span className="ml-auto text-xs text-white/40 truncate max-w-[180px]">
            {contexto.etiqueta}
          </span>
        )}
      </div>

      {/* ---- Overlay móvil ---- */}
      {navAbierta && (
        <div
          className="fixed inset-0 bg-black/55 z-[60] md:hidden backdrop-blur-sm"
          onClick={() => setNavAbierta(false)}
        />
      )}

      <div className="flex">
        {/* ---- Sidebar ---- */}
        <aside
          className={`
            fixed top-10 bottom-0 left-0 z-[70] w-64 bg-sidebar border-r border-white/10
            flex flex-col py-5 px-3.5 overflow-y-auto
            transition-transform duration-300 ease-out shadow-2xl
            ${navAbierta ? 'translate-x-0' : '-translate-x-full'}
            md:top-0 md:translate-x-0
          `}
        >
          {/* Marca */}
          <div className="flex items-center gap-2.5 px-1.5 pb-4 mb-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-white/7 flex items-center justify-center font-display font-bold text-gold-dim text-lg flex-shrink-0">
              S
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">
                SICE
              </p>
              <p className="text-[10px] text-white/35 leading-tight">UTMACH</p>
            </div>
          </div>

          {/* Selector de contexto — solo profesor */}
          {esStaff && paralelos.length > 0 && (
            <div className="mb-4 p-2.5 bg-white/5 rounded-sm border border-white/8">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                Materia - Paralelo activo
              </p>
              <select
                value={contexto?.paraleloId ?? ''}
                onChange={e => cambiarParalelo(e.target.value)}
                className="w-full bg-white/9 border border-white/12 rounded-sm text-black text-xs px-2.5 py-1.5 focus:outline-none focus:border-gold"
              >
                {paralelos.map(p => (
                  <option
                    key={p.paraleloId}
                    value={p.paraleloId}
                    className="bg-sidebar text-white"
                  >
                    {p.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs de hemisemestre */}
          {hemisemestres.length > 0 && (
            <div className="flex gap-1 bg-white/5 rounded-sm p-0.5 mb-4">
              {hemisemestres.map(h => (
                <button
                  key={h.id}
                  onClick={() => setHemisemestreActivo(h)}
                  className={`
                    flex-1 text-xs font-semibold py-1.5 rounded-[4px] transition-colors
                    ${
                      hemisemestreActivo?.id === h.id
                        ? 'bg-gold text-ink'
                        : 'text-white/50 hover:text-white/80'
                    }
                  `}
                >
                  {hsLabel(h)}
                </button>
              ))}
            </div>
          )}

          {/* Nav principal */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setNavAbierta(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-sm transition-colors ${
                    isActive
                      ? 'text-gold-dim font-semibold'
                      : 'text-white/65 hover:text-white/90 hover:bg-white/7'
                  }`
                }
              >
                <>
                  <Icon className="w-4 h-4" /> {label}
                </>
              </NavLink>
            ))}

            {/* Link Administración — solo profesor */}
            {esStaff && (
              <NavLink
                to="/profesor/admin"
                onClick={() => setNavAbierta(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-sm transition-colors ${
                    isActive
                      ? 'text-gold-dim font-semibold'
                      : 'text-white/65 hover:text-white/90 hover:bg-white/7'
                  }`
                }
              >
                <>
                  <AdminPanelSettingsIcon className="w-4 h-4" /> Administración
                </>
              </NavLink>
            )}
          </nav>

          {/* Usuario */}
          <div className="border-t border-white/10 pt-3.5 mt-2">
            <p className="text-sm font-semibold text-white mb-0.5 truncate">
              {perfil?.nombre_completo}
            </p>
            <p className="text-xs text-white/40 mb-3">{rolTexto}</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border border-white/15 text-white/60 hover:text-white/90 hover:bg-white/7 transition-colors"
            >
              <>
                <LogoutIcon className="w-4 h-4" /> Cerrar sesión
              </>
            </button>
          </div>
        </aside>

        {/* ---- Contenido ---- */}
        <main className="flex-1 min-w-0 md:ml-64 px-5 py-8 md:px-10 max-w-6xl page-enter">
          {cargando ? (
            <div className="flex items-center justify-center py-20 text-ink-soft text-sm">
              Cargando…
            </div>
          ) : (
            <Outlet
              context={{
                contexto,
                paralelos,
                hemisemestreActivo,
                hemisemestres,
                recargarContexto: cargarContexto
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
