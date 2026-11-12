import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  guardarAutoevaluaciones,
  obtenerAutoevaluaciones,
  obtenerEstadoAutoevaluacion
} from '../../lib/data.js'
import { leerRespuestas, obtenerRubrica } from '../../lib/rubricas.js'
import RubricaForm from '../../components/RubricaForm.jsx'
import {
  Eyebrow,
  Panel,
  Aviso,
  Button,
  Spinner,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import SendIcon from '@mui/icons-material/Send'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import { useRealtimeRefresh } from '../../lib/realtime.js'

const TIPOS_EXPOSITOR = ['CALIF_EXPOSITOR', 'COEVAL_EXPOSITOR']
const TIPOS_EVALUADOR = ['CALIF_EVALUADOR', 'COEVAL_EVALUADOR']

export default function Autoevaluar() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const [rubricas, setRubricas] = useState([])
  const [selecciones, setSelecciones] = useState({})
  const [seleccionesGuardadas, setSeleccionesGuardadas] = useState({})
  const [habilitada, setHabilitada] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [editando, setEditando] = useState(false)

  const tipos =
    contexto?.rolGrupo === 'evaluador' ? TIPOS_EVALUADOR : TIPOS_EXPOSITOR

  function getEvaluaciones() {
    return rubricas.map(rubrica => {
      const resultado = leerRespuestas(
        rubrica,
        selecciones[rubrica.id] ?? new Map()
      )
      return { rubricaId: rubrica.id, ...resultado }
    })
  }

  const evaluaciones = getEvaluaciones()

  const realtimeSubscriptions = useMemo(
    () => [
      {
        event: '*',
        schema: 'public',
        table: 'configuracion_autoevaluacion',
        filter: `paralelo_id=eq.${contexto?.paraleloId}`
      },
      {
        event: '*',
        schema: 'public',
        table: 'autoevaluaciones',
        filter: `estudiante_id=eq.${perfil?.id}`
      }
    ],
    [contexto?.paraleloId, perfil?.id]
  )

  useEffect(() => {
    if (!contexto?.paraleloId || !hemisemestreActivo?.id || !perfil?.id) {
      setCargando(false)
      return
    }
    cargar()
  }, [
    contexto?.paraleloId,
    hemisemestreActivo?.id,
    perfil?.id,
    contexto?.rolGrupo
  ])

  useRealtimeRefresh({
    subscriptions: realtimeSubscriptions,
    enabled: Boolean(
      perfil?.id && contexto?.paraleloId && hemisemestreActivo?.id
    ),
    onChange: ({ silent } = {}) => cargar(silent)
  })

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const rs = await Promise.all(tipos.map(obtenerRubrica))
      const [estado, respuestas] = await Promise.all([
        obtenerEstadoAutoevaluacion(contexto.paraleloId, hemisemestreActivo.id),
        obtenerAutoevaluaciones(
          perfil.id,
          hemisemestreActivo.id,
          rs.map(r => r.id)
        )
      ])
      const guardadas = Object.fromEntries(
        respuestas.map(r => [
          r.rubrica_id,
          new Map(Object.entries(r.respuestas ?? {}))
        ])
      )
      setRubricas(rs)
      setHabilitada(estado)
      setSelecciones(guardadas)
      setSeleccionesGuardadas(guardadas)
      setExito(respuestas.length === rs.length)
      setEditando(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleEnviar() {
    if (evaluaciones.some(e => !e.completo)) {
      setError('Falta seleccionar una opción en algún criterio.')
      return
    }
    setGuardando(true)
    setError('')
    setExito(false)
    try {
      await guardarAutoevaluaciones(
        perfil.id,
        hemisemestreActivo.id,
        evaluaciones
      )
      setExito(true)
      setEditando(false)
      setSeleccionesGuardadas(
        Object.fromEntries(
          evaluaciones.map(e => [
            e.rubricaId,
            new Map(selecciones[e.rubricaId] ?? [])
          ])
        )
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const completo = evaluaciones.every(e => e.completo)

  function cancelarEdicion() {
    setSelecciones(seleccionesGuardadas)
    setEditando(false)
    setExito(true)
    setError('')
  }

  if (cargando) return <LoadingSkeleton variant="coevaluar-form" />
  if (!contexto)
    return <Aviso>No tienes un paralelo activo para autoevaluarte.</Aviso>

  return (
    <div className={habilitada ? 'pb-0' : ''}>
      <div className="mb-7">
        <Eyebrow>{hemisemestreActivo?.nombre}</Eyebrow>
        <h1>Mi autoevaluación</h1>
        <p className="text-sm text-ink-soft mt-1">
          Completa la rúbrica correspondiente a tu rol. Esta autoevaluación es
          evidencia de aprendizaje y no modifica tu nota final.
        </p>
      </div>

      {!habilitada && (
        <Aviso variant="amber">
          La autoevaluación no está habilitada.
        </Aviso>
      )}
      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && (
        <Aviso variant="green">
          Tu autoevaluación fue guardada correctamente.
        </Aviso>
      )}

      {exito && (
        <Panel className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Tu autoevaluación está guardada.
            </p>
            {habilitada && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditando(true)}
              >
                <EditIcon className="w-4 h-4" /> Editar
              </Button>
            )}
          </div>
        </Panel>
      )}

      {rubricas.map(rubrica => (
        <div
          key={rubrica.id}
          className="bg-white border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4"
        >
          <RubricaForm
            rubrica={rubrica}
            seleccionadas={selecciones[rubrica.id] ?? new Map()}
            soloLectura={!habilitada || (exito && !editando)}
            onCambio={(criterioId, opcionId) => {
              const actual = new Map(selecciones[rubrica.id] ?? [])
              actual.set(criterioId, opcionId)
              setSelecciones(prev => ({ ...prev, [rubrica.id]: actual }))
              setExito(false)
              setEditando(true)
            }}
          />
        </div>
      ))}

      {habilitada && (!exito || editando) && (
        <div className="sticky bottom-0 bg-sidebar rounded-sm px-5 py-3.5 flex justify-between items-center gap-4 shadow-md">
          {!exito && (
            <span className="text-white/45 text-xs ml-1">
              {!completo ? 'Faltan criterios' : ''}
            </span>
          )}
          {editando && exito && (
            <Button
              variant="outline"
              onClick={cancelarEdicion}
              disabled={guardando}
            >
              Cancelar
            </Button>
          )}
          <Button onClick={handleEnviar} disabled={guardando}>
            {guardando ? (
              <>
                <Spinner className="w-4 h-4" /> Guardando…
              </>
            ) : (
              <>
                <SendIcon className="w-4 h-4" /> Guardar autoevaluación
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
