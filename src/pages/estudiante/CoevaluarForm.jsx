import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useOutletContext } from 'react-router-dom'
import {
  obtenerRubrica,
  puntajeMaximo,
  leerRespuestas
} from '../../lib/rubricas.js'
import { guardarCoevaluacion } from '../../lib/data.js'
import RubricaForm, { calcularPuntaje } from '../../components/RubricaForm.jsx'
import { Eyebrow, Aviso, Button, Spinner } from '../../components/ui/index.jsx'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'

export default function CoevaluarForm() {
  const { grupoId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const { contexto } = useOutletContext()

  const { grupoNumero, tema, hemisemestreId, hemisemestreNombre } = state ?? {}

  const [rubricaExp, setRubricaExp] = useState(null)
  const [rubricaEval, setRubricaEval] = useState(null)
  const [selExp, setSelExp] = useState(new Map())
  const [selEval, setSelEval] = useState(new Map())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    cargar()
  }, [grupoId])

  async function cargar() {
    setCargando(true)
    try {
      const [rExp, rEval] = await Promise.all([
        obtenerRubrica('COEVAL_EXPOSITOR'),
        obtenerRubrica('COEVAL_EVALUADOR')
      ])
      setRubricaExp(rExp)
      setRubricaEval(rEval)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleEnviar() {
    const exp = leerRespuestas(rubricaExp, selExp)
    const eval_ = leerRespuestas(rubricaEval, selEval)
    if (!exp.completo || !eval_.completo) {
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
        rubricaExpositorId: rubricaExp.id,
        respExpositor: exp.respuestas,
        puntajeExpositor: exp.puntaje,
        rubricaEvaluadorId: rubricaEval.id,
        respEvaluador: eval_.respuestas,
        puntajeEvaluador: eval_.puntaje
      })
      setExito(true)
      setTimeout(() => navigate('/estudiante/coevaluar'), 900)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )

  const maxExp = rubricaExp ? puntajeMaximo(rubricaExp) : 0
  const maxEval = rubricaEval ? puntajeMaximo(rubricaEval) : 0
  const ptsExp = rubricaExp ? calcularPuntaje(rubricaExp, selExp) : 0
  const ptsEval = rubricaEval ? calcularPuntaje(rubricaEval, selEval) : 0

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-sice-green font-semibold hover:underline mb-4 block"
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

      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && <Aviso variant="green">Coevaluación enviada.</Aviso>}

      {/* Sección expositores */}
      <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4">
        <h3 className="mb-4">Exposición oral</h3>
        {rubricaExp && (
          <RubricaForm
            rubrica={rubricaExp}
            seleccionadas={selExp}
            onCambio={(critId, opId) =>
              setSelExp(prev => new Map(prev).set(critId, opId))
            }
            prefijo="exp_"
          />
        )}
      </div>

      {/* Sección evaluador */}
      <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4">
        <h3 className="mb-4">Aplicación del cuestionario</h3>
        {rubricaEval && (
          <RubricaForm
            rubrica={rubricaEval}
            seleccionadas={selEval}
            onCambio={(critId, opId) =>
              setSelEval(prev => new Map(prev).set(critId, opId))
            }
            prefijo="eval_"
          />
        )}
      </div>

      {/* Barra de acción */}
      <div className="sticky bottom-0 bg-sidebar rounded-sm px-5 py-3.5 flex justify-between items-center gap-4 flex-wrap shadow-md">
        <div className="text-white/70 text-xs flex gap-4">
          <span>
            Exposición:{' '}
            <strong className="text-gold-dim">
              {ptsExp}/{maxExp}
            </strong>
          </span>
          <span>
            Cuestionario:{' '}
            <strong className="text-gold-dim">
              {ptsEval}/{maxEval}
            </strong>
          </span>
        </div>
        <Button onClick={handleEnviar} disabled={guardando || exito}>
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
