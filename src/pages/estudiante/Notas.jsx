import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  obtenerCalificacionDocente,
  obtenerPromedioCoeval
} from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import { Eyebrow, Panel, Aviso, Spinner } from '../../components/ui/index.jsx'

const PESO_PROF = 0.7
const PESO_COEV = 0.3

export default function Notas() {
  const { perfil } = useAuth()
  const { contexto, hemisemestres } = useOutletContext()

  const [bloques, setBloques] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

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
              ? obtenerPromedioCoeval(contexto.grupoId, hs.id, rubricaCoev.id)
              : null
          ])

          const docSobre100 = califDoc
            ? (califDoc.puntaje / maxDoc) * 100
            : null
          const coevSobre100 = coeval ? (coeval.promedio / maxCoev) * 100 : null

          let final = null
          if (docSobre100 !== null && coevSobre100 !== null) {
            final = docSobre100 * PESO_PROF + coevSobre100 * PESO_COEV
          } else if (docSobre100 !== null) {
            final = docSobre100
          } else if (coevSobre100 !== null) {
            final = coevSobre100
          }

          return {
            hs,
            docSobre100,
            coevSobre100,
            final,
            incompleto: docSobre100 === null || coevSobre100 === null,
            comentario: califDoc?.comentario ?? null
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

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )
  if (error) return <Aviso variant="red">{error}</Aviso>

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>Mis notas</Eyebrow>
        <h1>{perfil?.nombre_completo}</h1>
        <p className="text-sm text-ink-soft mt-1">{contexto?.etiqueta}</p>
      </div>

      {bloques.map(
        ({ hs, docSobre100, coevSobre100, final, incompleto, comentario }) => (
          <Panel key={hs.id} className="mb-4">
            <h3 className="mb-4">{hs.nombre}</h3>

            {docSobre100 === null && coevSobre100 === null ? (
              <p className="text-sm text-ink-soft">
                Todavía no hay calificaciones registradas para este
                hemisemestre.
              </p>
            ) : (
              <>
                <FilaDesglose
                  label="Calificación del docente (70 %)"
                  valor={docSobre100}
                />

                {comentario && (
                  <div className="my-3 px-4 py-3 bg-surface rounded-sm border-l-[3px] border-gold text-sm text-ink-mid leading-relaxed">
                    <strong className="block text-xs text-ink-soft mb-1">
                      Retroalimentación del docente
                    </strong>
                    {comentario}
                  </div>
                )}

                <FilaDesglose
                  label="Promedio de coevaluación (30 %)"
                  valor={coevSobre100}
                />

                <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-baseline">
                  <span className="text-sm font-semibold">
                    Nota final estimada
                  </span>
                  <span
                    className={`font-display text-2xl font-bold ${final !== null ? 'text-sice-green' : 'text-ink-soft'}`}
                  >
                    {final !== null ? final.toFixed(1) : '—'}
                    <span className="font-body text-xs text-ink-soft font-normal ml-1">
                      / 100
                    </span>
                  </span>
                </div>

                {incompleto && (
                  <p className="text-xs text-sice-amber mt-2">
                    Nota provisional — todavía falta que el docente o los
                    compañeros califiquen.
                  </p>
                )}
              </>
            )}
          </Panel>
        )
      )}

      <p className="text-xs text-ink-soft mt-4">
        Ponderación: 70 % calificación del docente · 30 % promedio de
        coevaluación.
      </p>
    </div>
  )
}

function FilaDesglose({ label, valor }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-black/[0.07] gap-3">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-sm font-bold">
        {valor !== null ? `${valor.toFixed(1)} / 100` : '— pendiente'}
      </span>
    </div>
  )
}
