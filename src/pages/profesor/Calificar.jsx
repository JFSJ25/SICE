import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  obtenerRubrica,
  puntajeMaximo,
  leerRespuestas
} from '../../lib/rubricas.js'
import {
  obtenerCalificacionDocente,
  guardarCalificacionDocente
} from '../../lib/data.js'
import RubricaForm, { calcularPuntaje } from '../../components/RubricaForm.jsx'
import {
  Eyebrow,
  Aviso,
  Button,
  Campo,
  Textarea,
  Spinner
} from '../../components/ui/index.jsx'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'

export default function Calificar() {
  const { estudianteId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { perfil } = useAuth()

  // state viene de navigate(..., { state: { grupoId, grupoNumero, tema, rolGrupo,
  //   hemisemestreId, hemisemestreNombre, paraleloId } })
  const {
    grupoId,
    grupoNumero,
    tema,
    rolGrupo,
    hemisemestreId,
    hemisemestreNombre
  } = state ?? {}

  const [rubrica, setRubrica] = useState(null)
  const [seleccionadas, setSeleccionadas] = useState(new Map()) // criterioId → opcionId
  const [comentario, setComentario] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  // Nombre del estudiante — lo recuperamos del state o lo mostramos como ID
  const nombreEstudiante = state?.nombreEstudiante ?? estudianteId

  useEffect(() => {
    if (!rolGrupo || !hemisemestreId) {
      setError('Faltan datos de navegación. Vuelve a la lista de grupos.')
      setCargando(false)
      return
    }
    cargar()
  }, [estudianteId, hemisemestreId, rolGrupo])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const tipo =
        rolGrupo === 'evaluador' ? 'CALIF_EVALUADOR' : 'CALIF_EXPOSITOR'
      const r = await obtenerRubrica(tipo)
      setRubrica(r)

      const existente = await obtenerCalificacionDocente(
        estudianteId,
        hemisemestreId,
        r.id
      )
      if (existente) {
        // Reconstruir el Map desde el JSONB { criterioId: opcionId }
        const m = new Map(Object.entries(existente.respuestas))
        setSeleccionadas(m)
        setComentario(existente.comentario ?? '')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleGuardar() {
    if (!rubrica) return
    const { respuestas, completo, puntaje } = leerRespuestas(
      rubrica,
      seleccionadas
    )
    if (!completo) {
      setError('Falta seleccionar una opción en algún criterio.')
      return
    }

    setGuardando(true)
    setError('')
    try {
      await guardarCalificacionDocente({
        profesorId: perfil.id,
        estudianteId,
        grupoId,
        hemisemestreId,
        rubricaId: rubrica.id,
        respuestas,
        puntaje,
        comentario: comentario.trim() || null
      })
      setExito(true)
      setTimeout(() => navigate(-1), 900)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const completo = rubrica?.rubrica_categorias.every(cat =>
    cat.rubrica_criterios.every(crit => seleccionadas.has(crit.id))
  )

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )
  if (error && !rubrica) return <Aviso variant="red">{error}</Aviso>

  const max = rubrica ? puntajeMaximo(rubrica) : 0
  const pts = rubrica ? calcularPuntaje(rubrica, seleccionadas) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-sice-green font-semibold hover:underline mb-4 block"
      >
        <>
          <ArrowBackIcon className="w-4 h-4" /> Volver
        </>
      </button>

      {/* Encabezado */}
      <div className="mb-6">
        <Eyebrow>
          {hemisemestreNombre} · Grupo {grupoNumero}
          {rolGrupo
            ? ` · ${rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}`
            : ''}
        </Eyebrow>
        <h1 className="leading-tight">{nombreEstudiante}</h1>
        {tema && <p className="text-sm text-ink-soft mt-1">Tema: {tema}</p>}
      </div>

      {/* {rubrica?.nota_especial && <Aviso>{rubrica.nota_especial}</Aviso>} */}

      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && <Aviso variant="green">Calificación guardada.</Aviso>}

      <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5 md:p-6">
        {rubrica && (
          <RubricaForm
            rubrica={rubrica}
            seleccionadas={seleccionadas}
            onCambio={(critId, opId) =>
              setSeleccionadas(prev => new Map(prev).set(critId, opId))
            }
          />
        )}

        {/* Campo de retroalimentación */}
        <div className="mt-6 pt-5 border-t border-black/[0.08]">
          <Campo label="Retroalimentación para el estudiante">
            <Textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Observaciones generales, fortalezas, puntos a mejorar…"
              rows={3}
            />
          </Campo>
        </div>

        {/* Barra de acción */}
        <div className="sticky bottom-0 bg-sidebar rounded-sm px-5 py-3.5 mt-5 flex justify-between items-center gap-4 flex-wrap shadow-md">
          <div>
            <span className="font-display text-2xl font-bold text-gold-dim">
              {pts}
            </span>
            <span className="text-white/45 text-xs ml-1">
              / {max} pts{!completo ? ' · faltan criterios' : ''}
            </span>
          </div>
          <Button onClick={handleGuardar} disabled={guardando || exito}>
            {guardando ? (
              <>
                <Spinner className="w-4 h-4" /> Guardando…
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" /> Guardar calificación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
