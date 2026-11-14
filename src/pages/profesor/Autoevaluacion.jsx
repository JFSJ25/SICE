import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { obtenerAutoevaluaciones } from '../../lib/data.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import RubricaForm from '../../components/evaluacion/RubricaForm.jsx'
import {
  Eyebrow,
  Aviso,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import VolverLink from '../../components/shared/VolverLink.jsx'
import { notificar } from '../../lib/notifications.js'

export default function Autoevaluacion() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [rubricas, setRubricas] = useState([])
  const [respuestas, setRespuestas] = useState(new Map())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const tipos =
    state?.rolGrupo === 'evaluador'
      ? ['CALIF_EVALUADOR', 'COEVAL_EVALUADOR']
      : ['CALIF_EXPOSITOR', 'COEVAL_EXPOSITOR']

  useEffect(() => {
    if (!state?.estudianteId || !state?.hemisemestreId) {
      setError('Faltan datos de navegación. Vuelve a la lista de grupos.')
      setCargando(false)
      return
    }
    cargar()
  }, [state?.estudianteId, state?.hemisemestreId, state?.rolGrupo])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const rs = await Promise.all(tipos.map(obtenerRubrica))
      const filas = await obtenerAutoevaluaciones(
        state.estudianteId,
        state.hemisemestreId,
        rs.map(r => r.id)
      )
      setRubricas(rs)
      setRespuestas(
        new Map(
          filas.map(fila => [
            fila.rubrica_id,
            {
              respuestas: new Map(Object.entries(fila.respuestas ?? {})),
              puntaje: fila.puntaje,
              actualizadoEn: fila.actualizado_en
            }
          ])
        )
      )
    } catch (e) {
      setError(e.message)
      notificar.error(e)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingSkeleton variant="calificar" />
  if (error) return <Aviso variant="red">{error}</Aviso>

  return (
    <div>
      <VolverLink onClick={() => navigate(-1)} />

      <div className="mb-6">
        <Eyebrow>
          {state.hemisemestreNombre} · Grupo {state.grupoNumero}
        </Eyebrow>
        <h1>{state.nombreEstudiante}</h1>
        <p className="text-sm text-ink-soft mt-1">
          Autoevaluación ·{' '}
          {state.rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}
        </p>
      </div>

      {respuestas.size === 0 ? (
        <Aviso>El estudiante todavía no ha enviado su autoevaluación.</Aviso>
      ) : (
        rubricas.map((rubrica, index) => {
          const respuesta = respuestas.get(rubrica.id)
          return (
            <div
              key={rubrica.id}
              className="bg-white border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4"
            >
              <RubricaForm
                rubrica={rubrica}
                seleccionadas={respuesta.respuestas}
                soloLectura
              />
            </div>
          )
        })
      )}
    </div>
  )
}
