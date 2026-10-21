import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  obtenerCalificacionDocente,
  obtenerPromedioCoeval
} from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import RubricaForm from '../../components/RubricaForm.jsx'
import {
  Eyebrow,
  Panel,
  Aviso,
  Button,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import RefreshIcon from '@mui/icons-material/Refresh'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

const PESO_PROF = 0.7
const PESO_COEV = 0.3

export default function Notas() {
  const { perfil } = useAuth()
  const { contexto, hemisemestres } = useOutletContext()

  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [rubricasExpandidas, setRubricasExpandidas] = useState({})

  function toggleRubrica(hsId) {
    setRubricasExpandidas(prev => ({
      ...prev,
      [hsId]: !prev[hsId]
    }))
  }

  useEffect(() => {
    if (!contexto || hemisemestres.length === 0) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestres.length])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const tipoDoc =
        contexto.rolGrupo === 'evaluador'
          ? 'CALIF_EVALUADOR'
          : 'CALIF_EXPOSITOR'
      const tipoCoev =
        contexto.rolGrupo === 'evaluador'
          ? 'COEVAL_EVALUADOR'
          : 'COEVAL_EXPOSITOR'

      const [rubricaDoc, rubricaCoev] = await Promise.all([
        obtenerRubrica(tipoDoc),
        obtenerRubrica(tipoCoev)
      ])

      const maxDoc = puntajeMaximo(rubricaDoc)
      const maxCoev = puntajeMaximo(rubricaCoev)

      const bs = await Promise.all(
        hemisemestres.map(async hs => {
          const [califDoc, coeval] = await Promise.all([
            obtenerCalificacionDocente(perfil.id, hs.id, rubricaDoc.id),
            contexto.grupoId
              ? obtenerPromedioCoeval(
                  contexto.grupoId,
                  hs.id,
                  rubricaCoev.id,
                  perfil.id
                )
              : null
          ])

          const docSobre100 = califDoc
            ? (califDoc.puntaje / maxDoc) * 100
            : null

          const coevSobre100 = coeval ? (coeval.promedio / maxCoev) * 100 : null

          // Aplicar la ponderación correspondiente a cada componente
          const docPonderado =
            docSobre100 !== null ? docSobre100 * PESO_PROF : null

          const coevPonderado =
            coevSobre100 !== null ? coevSobre100 * PESO_COEV : null

          // Convertir la suma ponderada a una nota sobre 10
          const final =
            docPonderado !== null || coevPonderado !== null
              ? ((docPonderado ?? 0) + (coevPonderado ?? 0)) / 10
              : null

          return {
            hs,
            docPonderado,
            coevPonderado,
            final,
            incompleto: docPonderado === null || coevPonderado === null,
            comentario: califDoc?.comentario ?? null,
            califDoc,
            rubricaDoc
          }
        })
      )

      setBloques(bs)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingSkeleton />
  if (error) return <Aviso variant="red">{error}</Aviso>

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <Eyebrow>Mis notas</Eyebrow>
          <h1>{perfil?.nombre_completo}</h1>
          <p className="text-sm text-ink-soft mt-1">{contexto?.etiqueta}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={cargar}
          disabled={cargando}
          title="Actualizar notas y promedios"
        >
          <RefreshIcon className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {bloques.map(
        ({
          hs,
          docPonderado,
          coevPonderado,
          final,
          incompleto,
          comentario,
          califDoc,
          rubricaDoc
        }) => {
          const yaCalificadoDocente = Boolean(califDoc)
          const expandida = Boolean(rubricasExpandidas[hs.id])
          const maxDoc = rubricaDoc ? puntajeMaximo(rubricaDoc) : 0

          return (
            <Panel key={hs.id} className="mb-4">
              <h3 className="mb-4">{hs.nombre}</h3>

              {docPonderado === null && coevPonderado === null ? (
                <p className="text-sm text-ink-soft">
                  Todavía no hay calificaciones registradas para este
                  hemisemestre.
                </p>
              ) : (
                <>
                  <FilaDesglose
                    label="Calificación del docente (70 %)"
                    valor={docPonderado}
                    maximo={70}
                  />

                  {comentario && (
                    <div className="my-3 px-4 py-3 bg-surface rounded-sm border-l-[3px] border-gold text-sm text-ink-mid leading-relaxed">
                      <strong className="block text-xs text-ink-soft mb-1">
                        Retroalimentación del docente
                      </strong>
                      {comentario}
                    </div>
                  )}

                  {/* Rúbrica calificada por el docente (visible si ya calificó) */}
                  {yaCalificadoDocente && rubricaDoc && (
                    <div className="my-3 border border-black/10 dark:border-white/10 rounded-DEFAULT overflow-hidden bg-slate-50/60 dark:bg-slate-900/40">
                      <button
                        type="button"
                        onClick={() => toggleRubrica(hs.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 md:px-4 bg-surface hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                        aria-expanded={expandida}
                      >
                        <AssignmentIcon className="w-5 h-5 md:w-4 md:h-4 text-gold dark:text-gold-dim flex-shrink-0" />

                        <span className="flex-1 min-w-0 flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                          <span className="text-sm font-semibold text-ink dark:text-slate-200 leading-snug">
                            Rúbrica de calificación docente
                          </span>
                          {/* <span className="self-start text-xs px-2 py-0.5 rounded-full font-bold bg-sice-green-soft text-sice-green dark:text-emerald-300">
                            {califDoc.puntaje} / {maxDoc} pts
                          </span> */}
                        </span>

                        <span className="text-xs font-semibold text-gold dark:text-gold-dim flex items-center gap-1 shrink-0">
                          <span className="hidden md:inline">
                            {expandida ? 'Ocultar rúbrica' : 'Ver rúbrica'}
                          </span>
                          {expandida ? (
                            <ExpandLessIcon className="w-5 h-5 md:w-4 md:h-4" />
                          ) : (
                            <ExpandMoreIcon className="w-5 h-5 md:w-4 md:h-4" />
                          )}
                        </span>
                      </button>

                      {expandida && (
                        <div className="p-3 md:p-5 border-t border-black/10 dark:border-white/10 bg-white dark:bg-slate-800">
                          <div className="pb-3 mb-4 border-b border-black/[0.08] dark:border-white/10 md:flex md:flex-wrap md:items-baseline md:justify-between md:gap-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-sice-green dark:text-emerald-300 break-words">
                                {rubricaDoc.nombre}
                              </p>
                              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                                Criterios y niveles evaluados por el docente
                              </p>
                            </div>
                            {/* Ya se ve en el badge del encabezado; solo en desktop */}
                            <span className="hidden md:inline text-xs font-semibold text-ink-soft dark:text-slate-400">
                              Puntaje rúbrica:{' '}
                              <strong className="text-sm text-ink dark:text-slate-200 font-bold">
                                {califDoc.puntaje}
                              </strong>{' '}
                              / {maxDoc} pts
                            </span>
                          </div>

                          {rubricaDoc.nota_especial && (
                            <p className="text-xs text-ink-soft dark:text-slate-400 bg-surface dark:bg-slate-900/60 p-2.5 rounded-sm mb-4 border-l-2 border-gold">
                              {rubricaDoc.nota_especial}
                            </p>
                          )}

                          <RubricaForm
                            rubrica={rubricaDoc}
                            seleccionadas={califDoc.respuestas}
                            soloLectura
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <FilaDesglose
                    label="Promedio de coevaluación (30 %)"
                    valor={coevPonderado}
                    maximo={30}
                  />

                  <div className="mt-3 pt-3 border-black/10 flex justify-between items-baseline">
                    <span className="text-sm font-semibold">
                      Nota final estimada
                    </span>
                    <span
                      className={`font-display text-2xl font-bold ${final !== null ? 'text-sice-green dark:text-emerald-300' : 'text-ink-soft'}`}
                    >
                      {final !== null ? final.toFixed(1) : '—'}
                      <span className="font-body text-xs text-ink-soft font-normal ml-1">
                        / 10
                      </span>
                    </span>
                  </div>

                  {incompleto && (
                    <p className="text-xs text-sice-amber dark:text-sice-amber-soft mt-2">
                      Nota provisional - todavía falta que el docente o los
                      compañeros califiquen.
                    </p>
                  )}
                </>
              )}
            </Panel>
          )
        }
      )}
    </div>
  )
}

function FilaDesglose({ label, valor, maximo }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-black/[0.07] gap-3">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-sm font-bold">
        {valor !== null ? `${valor.toFixed(1)} / ${maximo}` : '— pendiente'}
      </span>
    </div>
  )
}
