import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  obtenerGruposConDetalle,
  obtenerMapaCalificacionesDocente,
  obtenerPromedioCoeval,
  obtenerEstadoAsignacion,
  finalizarAsignacion,
  reabrirAsignacion,
  guardarEstadosCoevaluacion,
  obtenerEstadoAutoevaluacion,
  configurarAutoevaluacion,
  obtenerMapaAutoevaluaciones
} from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import {
  Eyebrow,
  StatCard,
  Badge,
  Button,
  Aviso,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import { useRealtimeRefresh } from '../../lib/realtime.js'
import GrupoCard from '../../components/profesor/GrupoCard.jsx'
import ControlCoevaluacion from '../../components/profesor/ControlCoevaluacion.jsx'
import ControlAutoevaluacion from '../../components/profesor/ControlAutoevaluacion.jsx'

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
  const [autoevaluacionHabilitada, setAutoevaluacionHabilitada] =
    useState(false)
  const [guardandoAutoevaluacion, setGuardandoAutoevaluacion] = useState(false)
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
        table: 'configuracion_autoevaluacion',
        filter: `paralelo_id=eq.${contexto?.paraleloId}`
      },
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
      const [gs, estado, estadoAuto] = await Promise.all([
        obtenerGruposConDetalle(contexto.paraleloId, hemisemestreActivo.id),
        obtenerEstadoAsignacion(contexto.paraleloId),
        obtenerEstadoAutoevaluacion(contexto.paraleloId, hemisemestreActivo.id)
      ])
      // Conserva los grupos visibles aunque falle una consulta secundaria,
      // como calificaciones o promedios.
      setGrupos(gs)
      setEstadosGuardados(
        new Map(gs.map(g => [g.id, Boolean(g.coevaluacionHabilitada)]))
      )
      setEstadoAsignacion(estado)
      setAutoevaluacionHabilitada(estadoAuto)
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
      const mapaAutoevaluaciones = await obtenerMapaAutoevaluaciones(
        ids,
        hemisemestreActivo.id,
        [rubricaExp.id, rubricaEval.id, rubricaCoevExp.id, rubricaCoevEval.id]
      )
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
          const autoevaluaciones = mapaAutoevaluaciones.get(m.usuarioId) ?? []
          const rubricaAutoDocente = esEvaluador ? rubricaEval : rubricaExp
          const rubricaAutoCoev = esEvaluador ? rubricaCoevEval : rubricaCoevExp
          const autoDocente = autoevaluaciones.find(
            a => a.rubrica_id === rubricaAutoDocente.id
          )
          const autoCoev = autoevaluaciones.find(
            a => a.rubrica_id === rubricaAutoCoev.id
          )
          const autoevaluacion =
            autoDocente && autoCoev
              ? (Number(autoDocente.puntaje) /
                  puntajeMaximo(rubricaAutoDocente)) *
                  70 +
                (Number(autoCoev.puntaje) / puntajeMaximo(rubricaAutoCoev)) * 30
              : null
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
                : null,
            autoevaluacion
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

  async function cambiarAutoevaluacion() {
    const nuevoEstado = !autoevaluacionHabilitada
    setGuardandoAutoevaluacion(true)
    setError('')
    setMensajeExito('')
    try {
      await configurarAutoevaluacion(
        contexto.paraleloId,
        hemisemestreActivo.id,
        nuevoEstado
      )
      setAutoevaluacionHabilitada(nuevoEstado)
      setMensajeExito(
        nuevoEstado
          ? 'La autoevaluación quedó habilitada para los estudiantes.'
          : 'La autoevaluación quedó cerrada.'
      )
    } catch (e) {
      setError(`Error al cambiar autoevaluación: ${e.message}`)
    } finally {
      setGuardandoAutoevaluacion(false)
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
              La asignación autónoma todavía no está disponible para esta
              materia.
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
        <ControlCoevaluacion
          totalGrupos={grupos.length}
          totalHabilitados={totalHabilitados}
          hayCambios={hayCambiosCoeval}
          guardando={guardandoCoeval}
          onToggleTodas={handleToggleTodas}
          onDescartar={handleDescartarCambios}
          onGuardar={handleGuardarCoeval}
        />
      )}

      <ControlAutoevaluacion
        habilitada={autoevaluacionHabilitada}
        guardando={guardandoAutoevaluacion}
        onCambiar={cambiarAutoevaluacion}
      />

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
            <GrupoCard
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
              onVerAutoevaluacion={(personaId, nombreEstudiante, rolGrupo) =>
                navigate(`/profesor/autoevaluacion/${personaId}`, {
                  state: {
                    estudianteId: personaId,
                    nombreEstudiante,
                    grupoNumero: g.numero,
                    rolGrupo,
                    hemisemestreId: hemisemestreActivo.id,
                    hemisemestreNombre: hemisemestreActivo.nombre
                  }
                })
              }
            />
          ))}
        </div>
      )}

    </div>
  )
}
