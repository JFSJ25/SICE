import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  obtenerGruposConDetalle,
  obtenerMapaCalificacionesDocente,
  obtenerPromedioCoeval,
  obtenerEstadoAsignacion,
  finalizarAsignacion,
  reabrirAsignacion,
  guardarEstadosCoevaluacion
} from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import {
  Eyebrow,
  StatCard,
  Badge,
  Button,
  Aviso,
  Spinner,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import UndoIcon from '@mui/icons-material/Undo'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useRealtimeRefresh } from '../../lib/realtime.js'

export default function Grupos() {
  const { contexto, hemisemestreActivo } = useOutletContext()
  const navigate = useNavigate()

  const [grupos, setGrupos] = useState([])
  const [mapaCalif, setMapaCalif] = useState(new Map())
  const [mapaNotas, setMapaNotas] = useState(new Map())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [estadoAsignacion, setEstadoAsignacion] = useState('abierta')
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [guardandoCoeval, setGuardandoCoeval] = useState(false)
  const [estadosGuardados, setEstadosGuardados] = useState(new Map())
  const [mensajeExito, setMensajeExito] = useState('')
  const usaAsignacionAutonoma = [
    'Sistemas Digitales',
    'Plataformas de Hardware'
  ].includes(contexto?.materiaNombre)

  const realtimeSubscriptions = useMemo(
    () => [
      { event: '*', schema: 'public', table: 'grupo_miembros' },
      { event: '*', schema: 'public', table: 'grupo_temas' },
      { event: '*', schema: 'public', table: 'calificaciones_docente' },
      { event: '*', schema: 'public', table: 'coevaluaciones' },
      {
        event: '*',
        schema: 'public',
        table: 'paralelos',
        filter: `id=eq.${contexto?.paraleloId}`
      }
    ],
    [contexto?.paraleloId]
  )

  useEffect(() => {
    if (!contexto || !hemisemestreActivo) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestreActivo?.id])

  useRealtimeRefresh({
    subscriptions: realtimeSubscriptions,
    enabled: Boolean(contexto?.paraleloId && hemisemestreActivo?.id),
    onChange: ({ silent } = {}) => cargar(silent)
  })

  async function cargar(silenciosa = false) {
    if (!silenciosa) setCargando(true)
    setError('')
    try {
      const [gs, estado] = await Promise.all([
        obtenerGruposConDetalle(contexto.paraleloId, hemisemestreActivo.id),
        obtenerEstadoAsignacion(contexto.paraleloId)
      ])
      // Conserva los grupos visibles aunque falle una consulta secundaria,
      // como calificaciones o promedios.
      setGrupos(gs)
      setEstadosGuardados(
        new Map(gs.map(g => [g.id, Boolean(g.coevaluacionHabilitada)]))
      )
      setEstadoAsignacion(estado)
      const ids = gs.flatMap(g => g.miembros.map(m => m.usuarioId))
      const [mapa, rubricas] = await Promise.all([
        obtenerMapaCalificacionesDocente(ids, hemisemestreActivo.id),
        Promise.all([
          obtenerRubrica('CALIF_EXPOSITOR'),
          obtenerRubrica('CALIF_EVALUADOR'),
          obtenerRubrica('COEVAL_EXPOSITOR'),
          obtenerRubrica('COEVAL_EVALUADOR')
        ])
      ])
      const [rubricaExp, rubricaEval, rubricaCoevExp, rubricaCoevEval] =
        rubricas
      const maxDocExp = puntajeMaximo(rubricaExp)
      const maxDocEval = puntajeMaximo(rubricaEval)
      const maxCoevExp = puntajeMaximo(rubricaCoevExp)
      const maxCoevEval = puntajeMaximo(rubricaCoevEval)
      const promediosPorEstudiante = new Map(
        await Promise.all(
          gs.flatMap(g =>
            g.miembros.map(async miembro => [
              miembro.usuarioId,
              await obtenerPromedioCoeval(
                g.id,
                hemisemestreActivo.id,
                miembro.rolGrupo === 'evaluador'
                  ? rubricaCoevEval.id
                  : rubricaCoevExp.id,
                miembro.usuarioId
              )
            ])
          )
        )
      )
      const notas = new Map()
      const totalEstudiantes = gs.reduce(
        (total, grupo) => total + grupo.miembros.length,
        0
      )
      gs.forEach(g => {
        const coevaluacionesEsperadas = totalEstudiantes - g.miembros.length
        g.miembros.forEach(m => {
          const calif = mapa.get(m.usuarioId)
          const esEvaluador = m.rolGrupo === 'evaluador'
          const maxDoc = esEvaluador ? maxDocEval : maxDocExp
          const maxCoev = esEvaluador ? maxCoevEval : maxCoevExp
          const promedio = promediosPorEstudiante.get(m.usuarioId)
          const docente = calif ? (calif.puntaje / maxDoc) * 100 : null
          const coevaluacion = promedio
            ? (promedio.promedio / maxCoev) * 100
            : null
          notas.set(m.usuarioId, {
            docente,
            coevaluacion,
            coevaluado:
              promedio !== null && promedio.cantidad >= coevaluacionesEsperadas,
            final:
              docente !== null && coevaluacion !== null
                ? docente * 0.7 + coevaluacion * 0.3
                : null
          })
        })
      })
      setMapaCalif(mapa)
      setMapaNotas(notas)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function cambiarEstado() {
    setGuardandoEstado(true)
    setError('')
    try {
      if (estadoAsignacion === 'finalizada') {
        await reabrirAsignacion(contexto.paraleloId)
        setEstadoAsignacion('abierta')
      } else {
        await finalizarAsignacion(contexto.paraleloId)
        setEstadoAsignacion('finalizada')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardandoEstado(false)
    }
  }

  function handleToggleCheck(grupoId, habilitada) {
    setMensajeExito('')
    setError('')
    setGrupos(prev =>
      prev.map(g =>
        g.id === grupoId ? { ...g, coevaluacionHabilitada: habilitada } : g
      )
    )
  }

  function handleToggleTodas(habilitar) {
    setMensajeExito('')
    setError('')
    setGrupos(prev =>
      prev.map(g => ({ ...g, coevaluacionHabilitada: habilitar }))
    )
  }

  function handleDescartarCambios() {
    setGrupos(prev =>
      prev.map(g => ({
        ...g,
        coevaluacionHabilitada: Boolean(estadosGuardados.get(g.id))
      }))
    )
    setError('')
    setMensajeExito('')
  }

  async function handleGuardarCoeval() {
    if (!hayCambiosCoeval) return
    setGuardandoCoeval(true)
    setError('')
    setMensajeExito('')
    try {
      await guardarEstadosCoevaluacion(grupos, hemisemestreActivo.id)
      setEstadosGuardados(
        new Map(grupos.map(g => [g.id, Boolean(g.coevaluacionHabilitada)]))
      )
      setMensajeExito('Se guardaron correctamente los cambios de coevaluación.')
    } catch (e) {
      setError(`Error al guardar coevaluaciones: ${e.message}`)
    } finally {
      setGuardandoCoeval(false)
    }
  }

  if (cargando) return <LoadingSkeleton variant="grupos" />
  if (error && grupos.length === 0) return <Aviso variant="red">{error}</Aviso>
  if (!contexto)
    return (
      <Aviso>
        No hay paralelo activo. Ve a Administración para configurar uno.
      </Aviso>
    )

  const totalEstudiantes = grupos.flatMap(g => g.miembros).length
  const totalCalificados = mapaCalif.size
  const pendientes = totalEstudiantes - totalCalificados
  const totalHabilitados = grupos.filter(g => g.coevaluacionHabilitada).length
  const hayCambiosCoeval = grupos.some(
    g =>
      Boolean(estadosGuardados.get(g.id)) !== Boolean(g.coevaluacionHabilitada)
  )

  return (
    <div className={hayCambiosCoeval ? 'pb-20 md:pb-0' : ''}>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div className="flex-1 min-w-[280px]">
          <Eyebrow>
            {hemisemestreActivo?.nombre} · {contexto.etiqueta}
          </Eyebrow>
          <h1>Grupos y temas</h1>
          <p className="text-sm text-ink-soft mt-1">
            Selecciona un integrante para registrar o editar su calificación.
            Habilita la coevaluación conforme los grupos vayan exponiendo.
          </p>
          {usaAsignacionAutonoma ? (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Badge
                variant={estadoAsignacion === 'finalizada' ? 'ok' : 'pending'}
              >
                Asignación{' '}
                {estadoAsignacion === 'finalizada' ? 'finalizada' : 'abierta'}
              </Badge>
              <Button
                size="sm"
                variant={
                  estadoAsignacion === 'finalizada' ? 'outline' : 'primary'
                }
                onClick={cambiarEstado}
                disabled={guardandoEstado}
              >
                {guardandoEstado
                  ? 'Guardando…'
                  : estadoAsignacion === 'finalizada'
                    ? 'Reabrir asignación'
                    : 'Finalizar asignación'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-ink-soft mt-4">
              La asignación autónoma todavía no está disponible para esta materia.
            </p>
          )}
        </div>

        {/* <Button
          size="sm"
          variant="outline"
          onClick={cargar}
          disabled={cargando || guardandoCoeval}
          title="Actualizar grupos y calificaciones"
        >
          <RefreshIcon className="w-4 h-4" /> Actualizar
        </Button> */}
      </div>

      {error && (
        <Aviso variant="red" dismissible>
          {error}
        </Aviso>
      )}

      {mensajeExito && (
        <Aviso variant="green" dismissible>
          {mensajeExito}
        </Aviso>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard value={grupos.length} label="Grupos activos" acento="gold" />
        <StatCard value={totalEstudiantes} label="Estudiantes" acento="green" />
        <StatCard value={pendientes} label="Por calificar" acento="red" />
        <StatCard
          value={`${totalHabilitados}/${grupos.length}`}
          label="Coevaluación activa"
          acento={totalHabilitados > 0 ? 'green' : 'gold'}
        />
      </div>

      {/* Barra de control y guardado de coevaluación */}
      {grupos.length > 0 && (
        <div className="md:sticky md:top-0 md:z-30 flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-surface rounded-DEFAULT border border-black/10 dark:border-white/10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">
              Habilitación de coevaluación:
            </span>
            <Badge variant={totalHabilitados > 0 ? 'ok' : 'pending'}>
              {totalHabilitados} de {grupos.length} habilitados
            </Badge>
            {hayCambiosCoeval && (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-sice-amber-soft text-sice-amber dark:text-amber-200 border border-sice-amber/30">
                Cambios pendientes
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleToggleTodas(totalHabilitados !== grupos.length)
              }
              disabled={guardandoCoeval}
              title={
                totalHabilitados === grupos.length
                  ? 'Desmarcar todos los grupos'
                  : 'Marcar todos los grupos para coevaluar'
              }
            >
              {totalHabilitados === grupos.length
                ? 'Desmarcar todas'
                : 'Habilitar todas'}
            </Button>

            {hayCambiosCoeval && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDescartarCambios}
                disabled={guardandoCoeval}
                title="Descartar cambios no guardados"
              >
                <UndoIcon className="w-4 h-4" /> Descartar
              </Button>
            )}

            <Button
              size="sm"
              variant={hayCambiosCoeval ? 'primary' : 'outline'}
              onClick={handleGuardarCoeval}
              disabled={!hayCambiosCoeval || guardandoCoeval}
              title="Guardar estado de coevaluación en la base de datos"
            >
              {guardandoCoeval ? (
                <>
                  <Spinner className="w-4 h-4" /> Guardando…
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" /> Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {grupos.length === 0 ? (
        <Aviso>
          No hay grupos en este hemisemestre todavía.{' '}
          <button
            className="underline font-semibold"
            onClick={() => navigate('/profesor/admin')}
          >
            Ir a Administración
          </button>{' '}
          para armarlos.
        </Aviso>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {grupos.map(g => (
            <CardGrupo
              key={g.id}
              grupo={g}
              mapaCalif={mapaCalif}
              mapaNotas={mapaNotas}
              esModificado={
                Boolean(estadosGuardados.get(g.id)) !==
                Boolean(g.coevaluacionHabilitada)
              }
              onToggleCheck={handleToggleCheck}
              onCalificar={(personaId, nombreEstudiante, rolGrupo) =>
                navigate(`/profesor/calificar/${personaId}`, {
                  state: {
                    nombreEstudiante,
                    grupoId: g.id,
                    grupoNumero: g.numero,
                    tema: g.tema,
                    rolGrupo,
                    hemisemestreId: hemisemestreActivo.id,
                    hemisemestreNombre: hemisemestreActivo.nombre,
                    paraleloId: contexto.paraleloId
                  }
                })
              }
            />
          ))}
        </div>
      )}

      {/* Barra flotante inferior cuando hay cambios sin guardar */}
      {hayCambiosCoeval &&
        createPortal(
          <div className="md:hidden fixed inset-x-0 bottom-1 z-50 flex justify-center px-3 pointer-events-none">
            <div className="pointer-events-auto bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 animate-fade-in">
              <span className="text-xs font-medium text-white/90">
                Cambios sin guardar
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-xs py-1 px-2.5"
                  onClick={handleDescartarCambios}
                  disabled={guardandoCoeval}
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs py-1 px-3"
                  onClick={handleGuardarCoeval}
                  disabled={guardandoCoeval}
                >
                  {guardandoCoeval ? (
                    <>
                      <Spinner className="w-3.5 h-3.5" /> Guardando…
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-3.5 h-3.5" /> Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

function CardGrupo({
  grupo,
  mapaCalif,
  mapaNotas,
  onCalificar,
  onToggleCheck,
  esModificado
}) {
  const [detalle, setDetalle] = useState(null)

  return (
    <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-bold text-sice-green dark:text-emerald-300">
          Grupo {grupo.numero}
        </p>

        {/* Check para habilitar coevaluación */}
        <label
          className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
            grupo.coevaluacionHabilitada
              ? 'bg-sice-green-soft text-sice-green border-sice-green/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600/30 shadow-sm'
              : 'bg-surface text-ink-soft border-black/10 dark:border-white/10 hover:border-black/25'
          }`}
          title={
            grupo.coevaluacionHabilitada
              ? 'Coevaluación habilitada para que los estudiantes evalúen a este grupo'
              : 'Marcar para permitir que los estudiantes coevalúen a este grupo tras su exposición'
          }
        >
          <input
            type="checkbox"
            checked={Boolean(grupo.coevaluacionHabilitada)}
            onChange={e => onToggleCheck(grupo.id, e.target.checked)}
            className="accent-sice-green w-3.5 h-3.5 rounded cursor-pointer"
          />
          <span>
            {grupo.coevaluacionHabilitada
              ? 'Coevaluación habilitada'
              : 'Habilitar coevaluación'}
          </span>
          {esModificado && (
            <span
              className="w-2 h-2 rounded-full bg-sice-amber"
              title="Cambio pendiente de guardar"
            />
          )}
        </label>
      </div>

      <h2 className="text-base mb-4 leading-snug">{grupo.tema}</h2>

      <ul className="flex flex-col gap-2">
        {grupo.miembros.map(m => {
          const calif = mapaCalif.get(m.usuarioId)
          const nota = mapaNotas.get(m.usuarioId)
          const coevaluado = nota?.coevaluado === true
          const esEval = m.rolGrupo === 'evaluador'
          const rolLabel = esEval ? 'Evaluador' : 'Expositor'
          return (
            <li
              key={m.usuarioId}
              className="flex flex-col gap-2 bg-surface rounded-sm px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <div className="min-w-0 w-full sm:flex-1 sm:min-w-[180px]">
                <p className="text-sm font-semibold break-words leading-snug">
                  {m.nombre}
                </p>
                <p
                  className={`text-xs mt-0.5 ${esEval ? 'text-sice-green font-semibold dark:text-emerald-400' : 'text-ink-soft'}`}
                >
                  {rolLabel}
                  {m.lider ? '  Líder' : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {calif ? (
                  <Badge variant="ok">{calif.puntaje} pts</Badge>
                ) : (
                  <Badge variant="pending">Pendiente</Badge>
                )}
                {coevaluado && <Badge variant="info">Coevaluado</Badge>}
              </div>

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDetalle({ nombre: m.nombre, nota })}
                >
                  Ver detalles
                </Button>
                <Button
                  size="sm"
                  variant={calif ? 'outline' : 'primary'}
                  onClick={() => onCalificar(m.usuarioId, m.nombre, m.rolGrupo)}
                >
                  {calif ? (
                    <>
                      <EditIcon className="w-4 h-4" /> Editar
                    </>
                  ) : (
                    'Calificar'
                  )}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {detalle &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
            role="presentation"
            onClick={() => setDetalle(null)}
          >
            <div
              className="w-full max-w-md bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`detalles-${grupo.id}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-sice-green">
                    Grupo {grupo.numero}
                  </p>
                  <h3 id={`detalles-${grupo.id}`} className="text-lg">
                    Detalles de {detalle.nombre}
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDetalle(null)}
                  aria-label="Cerrar detalles"
                >
                  <CloseIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <DetalleNota
                  label="Calificación docente (70%)"
                  valor={detalle.nota?.docente * 0.7}
                  ponderacion={70}
                />
                <DetalleNota
                  label="Promedio coevaluación (30%)"
                  valor={detalle.nota?.coevaluacion * 0.3}
                  ponderacion={30}
                />
                <div className="pt-3 mt-2 border-t border-black/10 dark:border-white/15">
                  <DetalleNota label="Nota final" valor={detalle.nota?.final} />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

function DetalleNota({ label, valor, ponderacion = 100 }) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold">
        {valor !== null && valor !== undefined
          ? `${valor.toFixed(1)} / ${ponderacion}`
          : 'Pendiente'}
      </span>
    </div>
  )
}
