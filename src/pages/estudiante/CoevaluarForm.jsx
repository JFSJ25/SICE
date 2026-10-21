import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useOutletContext } from 'react-router-dom'
import {
  obtenerRubrica,
  leerRespuestas
} from '../../lib/rubricas.js'
import { guardarCoevaluacion, obtenerEstadoCoevaluacionGrupo } from '../../lib/data.js'
import RubricaForm from '../../components/RubricaForm.jsx'
import {
  Eyebrow,
  Aviso,
  Button,
  Spinner,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'

export default function CoevaluarForm() {
  const { grupoId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const { contexto } = useOutletContext()

  const {
    grupoNumero,
    tema,
    hemisemestreId,
    hemisemestreNombre,
    miembros = []
  } = state ?? {}

  const [rubricaExp, setRubricaExp] = useState(null)
  const [rubricaEval, setRubricaEval] = useState(null)
  const [selecciones, setSelecciones] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [habilitado, setHabilitado] = useState(state?.coevaluacionHabilitada ?? true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    cargar()
  }, [grupoId])

  async function cargar() {
    setCargando(true)
    try {
      const promesas = [
        obtenerRubrica('COEVAL_EXPOSITOR'),
        obtenerRubrica('COEVAL_EVALUADOR')
      ]
      if (hemisemestreId && grupoId) {
        promesas.push(obtenerEstadoCoevaluacionGrupo(grupoId, hemisemestreId))
      }
      const [rExp, rEval, estadoHabilitado] = await Promise.all(promesas)
      setRubricaExp(rExp)
      setRubricaEval(rEval)
      if (estadoHabilitado !== undefined) {
        setHabilitado(Boolean(estadoHabilitado))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleEnviar() {
    if (!habilitado) {
      setError('La coevaluación para este grupo aún no ha sido habilitada por el docente.')
      return
    }
    const evaluaciones = miembros.map(miembro => {
      const rubrica =
        miembro.rolGrupo === 'evaluador' ? rubricaEval : rubricaExp
      const resultado = leerRespuestas(
        rubrica,
        selecciones[miembro.usuarioId] ?? new Map()
      )
      return {
        estudianteEvaluadoId: miembro.usuarioId,
        rubricaId: rubrica.id,
        respuestas: resultado.respuestas,
        puntaje: resultado.puntaje,
        completo: resultado.completo
      }
    })
    if (evaluaciones.some(evaluacion => !evaluacion.completo)) {
      setError('Falta seleccionar una opción en algún criterio.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await guardarCoevaluacion({
        evaluadorId: perfil.id,
        grupoId,
        hemisemestreId,
        evaluaciones
      })
      setExito(true)
      setTimeout(() => navigate('/estudiante/coevaluar'), 900)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <LoadingSkeleton />

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-sice-green dark:text-emerald-300 font-semibold hover:underline mb-4"
      >
        <>
          <ArrowBackIcon className="w-4 h-4" /> Volver
        </>
      </button>

      <div className="mb-6">
        <Eyebrow>
          {hemisemestreNombre} · Grupo {grupoNumero}
        </Eyebrow>
        <h1 className="leading-tight">{tema}</h1>
      </div>

      {!habilitado && (
        <Aviso variant="amber">
          La coevaluación para el Grupo {grupoNumero} aún no ha sido habilitada por el docente porque todavía no finaliza su exposición.
        </Aviso>
      )}
      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && <Aviso variant="green">Coevaluación enviada.</Aviso>}

      {miembros.map(miembro => {
        const rubrica =
          miembro.rolGrupo === 'evaluador' ? rubricaEval : rubricaExp
        const seleccionadas =
          selecciones[miembro.usuarioId] ?? new Map()
        return (
          <div
            key={miembro.usuarioId}
            className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4"
          >
            <h3 className="text-base mb-4">{miembro.nombre}</h3>
            {rubrica && (
              <RubricaForm
                rubrica={rubrica}
                seleccionadas={seleccionadas}
                onCambio={(critId, opId) =>
                  setSelecciones(prev => ({
                    ...prev,
                    [miembro.usuarioId]: new Map(seleccionadas).set(
                      critId,
                      opId
                    )
                  }))
                }
                prefijo={`${miembro.usuarioId}_`}
              />
            )}
          </div>
        )
      })}

      {/* Barra de acción */}
      <div className="sticky bottom-0 bg-sidebar rounded-sm px-5 py-3.5 flex justify-between items-center gap-4 flex-wrap shadow-md">
        <div className="text-white/70 text-xs flex gap-4">
          <span>
            {miembros.length} integrante{miembros.length === 1 ? '' : 's'} por
            evaluar
          </span>
        </div>
        <Button onClick={handleEnviar} disabled={guardando || exito || !habilitado}>
          {guardando ? (
            <>
              <Spinner className="w-4 h-4" /> Enviando…
            </>
          ) : (
            <>
              <SendIcon className="w-4 h-4" /> Enviar coevaluación
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
