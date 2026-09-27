import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  obtenerGruposConDetalle,
  obtenerMapaCalificacionesDocente,
  obtenerPromedioCoeval
} from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import {
  Eyebrow,
  StatCard,
  Badge,
  Button,
  Aviso,
  Spinner
} from '../../components/ui/index.jsx'
import EditIcon from '@mui/icons-material/Edit'

export default function Grupos() {
  const { contexto, hemisemestreActivo } = useOutletContext()
  const navigate = useNavigate()

  const [grupos, setGrupos] = useState([])
  const [mapaCalif, setMapaCalif] = useState(new Map())
  const [mapaNotas, setMapaNotas] = useState(new Map())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contexto || !hemisemestreActivo) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestreActivo?.id])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const gs = await obtenerGruposConDetalle(
        contexto.paraleloId,
        hemisemestreActivo.id
      )
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
      const promediosPorGrupo = new Map(
        await Promise.all(
          gs.map(async g => {
            const [exp, eval_] = await Promise.all([
              obtenerPromedioCoeval(
                g.id,
                hemisemestreActivo.id,
                rubricaCoevExp.id
              ),
              obtenerPromedioCoeval(
                g.id,
                hemisemestreActivo.id,
                rubricaCoevEval.id
              )
            ])
            return [g.id, { exp, eval_ }]
          })
        )
      )
      const notas = new Map()
      gs.forEach(g => {
        const promedios = promediosPorGrupo.get(g.id)
        g.miembros.forEach(m => {
          const calif = mapa.get(m.usuarioId)
          const esEvaluador = m.rolGrupo === 'evaluador'
          const maxDoc = esEvaluador ? maxDocEval : maxDocExp
          const maxCoev = esEvaluador ? maxCoevEval : maxCoevExp
          const promedio = esEvaluador ? promedios.eval_ : promedios.exp
          const docente = calif ? (calif.puntaje / maxDoc) * 100 : null
          const coevaluacion = promedio
            ? (promedio.promedio / maxCoev) * 100
            : null
          notas.set(m.usuarioId, {
            docente,
            coevaluacion,
            final:
              docente !== null && coevaluacion !== null
                ? docente * 0.7 + coevaluacion * 0.3
                : null
          })
        })
      })
      setGrupos(gs)
      setMapaCalif(mapa)
      setMapaNotas(notas)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )
  if (error) return <Aviso variant="red">{error}</Aviso>
  if (!contexto)
    return (
      <Aviso>
        No hay paralelo activo. Ve a Administración para configurar uno.
      </Aviso>
    )

  const totalEstudiantes = grupos.flatMap(g => g.miembros).length
  const totalCalificados = mapaCalif.size
  const pendientes = totalEstudiantes - totalCalificados

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-7">
        <Eyebrow>
          {hemisemestreActivo?.nombre} · {contexto.etiqueta}
        </Eyebrow>
        <h1>Grupos y temas</h1>
        <p className="text-sm text-ink-soft mt-1">
          Selecciona un integrante para registrar o editar su calificación.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <StatCard value={grupos.length} label="Grupos activos" acento="gold" />
        <StatCard value={totalEstudiantes} label="Estudiantes" acento="green" />
        <StatCard value={pendientes} label="Por calificar" acento="red" />
      </div>

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
    </div>
  )
}

function CardGrupo({ grupo, mapaCalif, mapaNotas, onCalificar }) {
  const [detalle, setDetalle] = useState(null)

  return (
    <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5">
      <p className="text-[11px] font-bold text-sice-green mb-1">
        Grupo {grupo.numero}
      </p>
      <h3 className="text-base mb-4 leading-snug">{grupo.tema}</h3>

      <ul className="flex flex-col gap-2">
        {grupo.miembros.map(m => {
          const calif = mapaCalif.get(m.usuarioId)
          const nota = mapaNotas.get(m.usuarioId)
          const coevaluado =
            nota?.coevaluacion !== null && nota?.coevaluacion !== undefined
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
                  className={`text-xs mt-0.5 ${esEval ? 'text-sice-green font-semibold' : 'text-ink-soft'}`}
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
              className="w-full max-w-md bg-white rounded-DEFAULT shadow-card p-5"
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
                  X
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <DetalleNota
                  label="Calificación docente (70%)"
                  valor={detalle.nota?.docente}
                />
                <DetalleNota
                  label="Promedio coevaluación (30%)"
                  valor={detalle.nota?.coevaluacion}
                />
                <div className="pt-3 mt-2 border-t border-black/10">
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

function DetalleNota({ label, valor }) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold">
        {valor !== null && valor !== undefined
          ? `${valor.toFixed(1)} / 100`
          : 'Pendiente'}
      </span>
    </div>
  )
}
