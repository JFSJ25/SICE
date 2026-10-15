import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { obtenerReporteNotasHemisemestre } from '../../lib/data.js'
import { descargarReporteNotasExcel } from '../../lib/reportes.js'
import { obtenerRubrica, puntajeMaximo } from '../../lib/rubricas.js'
import {
  Aviso,
  Button,
  Eyebrow,
  LoadingSkeleton,
  Panel,
  Select,
  Spinner
} from '../../components/ui/index.jsx'
import DownloadIcon from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'

const TIPOS_REPORTE = {
  primero: [1],
  segundo: [2],
  ambos: [1, 2]
}

export default function Reportes() {
  const { contexto, hemisemestres } = useOutletContext()
  const [tipo, setTipo] = useState('ambos')
  const [procesando, setProcesando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
  }, [contexto?.paraleloId])

  async function generarReporte() {
    if (!contexto || hemisemestres.length < 2) {
      setError('No hay un paralelo con sus dos hemisemestres disponibles.')
      return
    }

    setProcesando(true)
    setError('')
    try {
      const seleccionados = TIPOS_REPORTE[tipo]
      const rubricas = await cargarRubricas()
      const reportes = await Promise.all(
        seleccionados.map(orden => {
          const hemi = hemisemestres.find(h => h.orden === orden)
          return obtenerReporteNotasHemisemestre(
            contexto.paraleloId,
            hemi.id,
            rubricas
          ).then(reporte => ({ hemi, reporte }))
        })
      )

      const pendientes = reportes.flatMap(({ hemi, reporte }) => {
        const motivos = []
        if (reporte.totalEstudiantes === 0) {
          motivos.push('no hay estudiantes agrupados')
        }
        if (reporte.pendientesDocente.length > 0) {
          motivos.push(
            `${reporte.pendientesDocente.length} estudiante(s) sin calificación del docente`
          )
        }
        if (reporte.pendientesCoevaluacion.length > 0) {
          motivos.push(
            `${reporte.pendientesCoevaluacion.length} grupo(s) con coevaluaciones pendientes`
          )
        }
        return motivos.length > 0
          ? `${hemi.nombre}: ${motivos.join(' y ')}`
          : []
      })

      if (pendientes.length > 0) {
        setError(
          `No se puede generar el reporte porque aún no está completo: ${pendientes.join(
            '. '
          )}.`
        )
        return
      }

      const nombres = reportes.map(({ hemi }) => hemi.nombre)
      const estudiantes = new Map()
      reportes.forEach(({ hemi, reporte }) => {
        reporte.filas.forEach(fila => {
          const existente = estudiantes.get(fila.usuarioId) ?? {
            nombre: fila.nombre,
            grupoNumero: fila.grupoNumero,
            rol: fila.rol,
            notas: {}
          }
          existente.notas[hemi.nombre] = fila
          estudiantes.set(fila.usuarioId, existente)
        })
      })

      descargarReporteNotasExcel({
        filas: [...estudiantes.values()],
        nombreParalelo: contexto.etiqueta,
        nombrePeriodo: contexto.periodoNombre,
        nombresHemisemestres: nombres
      })
    } catch (e) {
      setError(e.message ?? 'No se pudo generar el reporte.')
    } finally {
      setProcesando(false)
    }
  }

  async function cargarRubricas() {
    setCargando(true)
    try {
      const [docExpositor, docEvaluador, coevExpositor, coevEvaluador] =
        await Promise.all([
          obtenerRubrica('CALIF_EXPOSITOR'),
          obtenerRubrica('CALIF_EVALUADOR'),
          obtenerRubrica('COEVAL_EXPOSITOR'),
          obtenerRubrica('COEVAL_EVALUADOR')
        ])
      return {
        docExpositor,
        docEvaluador,
        docExpositorMax: puntajeMaximo(docExpositor),
        docEvaluadorMax: puntajeMaximo(docEvaluador),
        coevExpositor,
        coevEvaluador,
        coevExpositorMax: puntajeMaximo(coevExpositor),
        coevEvaluadorMax: puntajeMaximo(coevEvaluador)
      }
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingSkeleton />

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>Exportación académica · {contexto?.etiqueta}</Eyebrow>
        <h1>Reportes de notas finales</h1>
        <p className="text-sm text-ink-soft mt-1">
          Descarga un Excel con el detalle de cada estudiante y su nota final.
        </p>
      </div>

      {error && <Aviso variant="red">{error}</Aviso>}

      <Panel>
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg">Selecciona el reporte</h2>
            <p className="text-sm text-ink-soft mt-1">
              Solo se podrá descargar cuando estén completas las calificaciones
              docentes y las coevaluaciones requeridas.
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-mid max-w-md">
            Tipo de reporte
            <Select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="primero">Notas del primer hemisemestre</option>
              <option value="segundo">Notas del segundo hemisemestre</option>
              <option value="ambos">Notas de ambos hemisemestres</option>
            </Select>
          </label>
          <Button
            onClick={generarReporte}
            disabled={procesando || !contexto}
            className="w-full sm:w-auto sm:self-start"
          >
            {procesando ? (
              <>
                <Spinner className="w-4 h-4" /> Verificando notas…
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" /> Generar Excel
              </>
            )}
          </Button>
        </div>
      </Panel>

      <Aviso variant="amber">
        <AssessmentIcon className="w-5 h-5 flex-shrink-0" />
        El archivo incluye estudiante, grupo, rol, calificación docente,
        coevaluación y nota final sobre 10.
      </Aviso>
    </div>
  )
}
