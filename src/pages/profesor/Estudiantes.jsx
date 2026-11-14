import { useEffect, useState } from 'react'
import {
  obtenerEstudiantesAdministrables,
  restablecerPasswordEstudiante
} from '../../lib/auth.js'
import {
  Aviso,
  Button,
  Campo,
  Input,
  // LoadingSkeleton,
  Panel,
  Spinner
} from '../../components/ui/index.jsx'
import CabeceraPagina from '../../components/shared/CabeceraPagina.jsx'
import ResultadoPassword from '../../components/profesor/ResultadoPassword.jsx'
import SearchIcon from '@mui/icons-material/Search'
import LockResetIcon from '@mui/icons-material/LockReset'

export default function Estudiantes() {
  const [busqueda, setBusqueda] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState(null)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  async function cargarEstudiantes(termino = busqueda) {
    setCargando(true)
    setError('')
    try {
      setEstudiantes(await obtenerEstudiantesAdministrables(termino))
    } catch (e) {
      setError(e.message ?? 'No se pudieron cargar los estudiantes.')
    } finally {
      setCargando(false)
    }
  }

  async function restablecer(estudiante) {
    const confirmado = window.confirm(
      `¿Restablecer la contraseña de ${estudiante.nombre_completo}?`
    )
    if (!confirmado) return

    setProcesandoId(estudiante.id)
    setResultado(null)
    setError('')
    setCopiado(false)
    try {
      setResultado(await restablecerPasswordEstudiante(estudiante.id))
    } catch (e) {
      setError(e.message ?? 'No se pudo restablecer la contraseña.')
    } finally {
      setProcesandoId(null)
    }
  }

  async function copiarPassword() {
    if (!resultado?.password_temporal) return
    await navigator.clipboard.writeText(resultado.password_temporal)
    setCopiado(true)
  }

  // if (cargando && estudiantes.length === 0 && !busqueda) {
  //   return <LoadingSkeleton variant="estudiantes" />
  // }

  return (
    <div>
      <CabeceraPagina
        eyebrow="Administración"
        titulo="Contraseñas de estudiantes"
        descripcion="Restablece el acceso de un estudiante que olvidó su contraseña."
      />

      {error && <Aviso variant="red">{error}</Aviso>}

      {resultado && (
        <ResultadoPassword
          resultado={resultado}
          copiada={copiado}
          onCopiar={copiarPassword}
        />
      )}

      <Panel>
        <form
          className="flex flex-col sm:flex-row gap-3 items-end"
          onSubmit={event => {
            event.preventDefault()
            cargarEstudiantes()
          }}
        >
          <Campo label="Buscar por nombre o correo" className="flex-1 w-full">
            <Input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Ej. Ana Pérez o correo@utmach.edu.ec"
            />
          </Campo>
          <Button type="submit" disabled={cargando}>
            <SearchIcon className="w-4 h-4" /> Buscar
          </Button>
        </form>
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
          <h2 className="font-display font-bold">Estudiantes</h2>
          <span className="text-xs text-ink-soft">
            {estudiantes.length} resultados
          </span>
        </div>
        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-soft">
            <Spinner className="w-4 h-4" /> Cargando estudiantes…
          </div>
        ) : estudiantes.length === 0 ? (
          <p className="px-5 md:px-6 py-10 text-sm text-ink-soft text-center">
            No se encontraron estudiantes.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.07]">
            {estudiantes.map(estudiante => (
              <div
                key={estudiante.id}
                className="px-5 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {estudiante.nombre_completo}
                  </p>
                  <p className="text-xs text-ink-soft truncate">
                    {estudiante.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={procesandoId === estudiante.id}
                  onClick={() => restablecer(estudiante)}
                >
                  {procesandoId === estudiante.id ? (
                    <>
                      <Spinner className="w-4 h-4" /> Procesando…
                    </>
                  ) : (
                    <>
                      <LockResetIcon className="w-4 h-4" /> Restablecer
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
