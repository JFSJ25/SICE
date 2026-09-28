import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import StepParalelo from './StepParalelo.jsx'
import StepEstudiantes from './StepEstudiantes.jsx'
import StepGrupos from './StepGrupos.jsx'
import CheckIcon from '@mui/icons-material/Check'

const PASOS = ['Paralelo', 'Estudiantes', 'Grupos']
const CLAVE_PASO_ADMIN = 'sice-paso-admin'

export default function Admin() {
  const { perfil } = useAuth()
  const {
    contexto,
    paralelos: paralelosGlobales,
    hemisemestres: hemisemestresGlobales,
    recargarContexto
  } = useOutletContext()

  const [pasoActual, setPasoActual] = useState(() => {
    const guardado = Number(
      localStorage.getItem(`${CLAVE_PASO_ADMIN}-${perfil?.id ?? ''}`)
    )
    return Number.isInteger(guardado) &&
      guardado >= 0 &&
      guardado < PASOS.length
      ? guardado
      : 0
  })
  const [paraleloId, setParaleloId] = useState(contexto?.paraleloId ?? null)
  const [paralelos, setParalelos] = useState(paralelosGlobales ?? [])
  const [hemisemestres, setHemisemestres] = useState(
    hemisemestresGlobales ?? []
  )

  function guardarPaso(indice) {
    setPasoActual(indice)
    localStorage.setItem(
      `${CLAVE_PASO_ADMIN}-${perfil?.id ?? ''}`,
      String(indice)
    )
  }

  function actualizarParalelo(datos) {
    setParaleloId(datos.paraleloId)
    setHemisemestres(datos.hemisemestres)
    recargarContexto(false)
  }

  function avanzar(datos) {
    if (pasoActual === 0) {
      actualizarParalelo(datos)
    }
    guardarPaso(Math.min(pasoActual + 1, PASOS.length - 1))
  }

  function irAlPaso(indice) {
    if (indice > 0 && !paraleloId) return
    guardarPaso(indice)
  }

  function retroceder() {
    guardarPaso(Math.max(pasoActual - 1, 0))
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs font-semibold text-sice-green mb-1.5">
          Configuración
        </p>
        <h1>Administración</h1>
        <p className="text-sm text-ink-soft mt-1">
          Selecciona un paralelo y trabaja en cualquier paso del flujo.
        </p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex flex-wrap items-center gap-y-2 mb-8">
        {PASOS.map((nombre, i) => (
          <div key={i} className="flex items-center">
            <button
              type="button"
              onClick={() => irAlPaso(i)}
              disabled={i > 0 && !paraleloId}
              className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors
              ${
                i < pasoActual
                  ? 'bg-sice-green border-sice-green text-white'
                  : i === pasoActual
                    ? 'bg-gold border-gold text-ink'
                    : 'bg-surface border-black/20 text-ink-soft'
              }
                  ${i > 0 && !paraleloId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            >
              {i < pasoActual ? <CheckIcon className="w-4 h-4" /> : i + 1}
            </button>
            <span
              onClick={() => irAlPaso(i)}
              className={`
                  ml-2 text-sm font-medium cursor-pointer
              ${i === pasoActual ? 'text-ink' : 'text-ink-soft'}
            `}
            >
              {nombre}
            </span>
            {i < PASOS.length - 1 && (
              <div
                className={`
                mx-2 md:mx-4 h-px w-6 md:w-16
                ${i < pasoActual ? 'bg-sice-green' : 'bg-black/15'}
              `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Paso actual */}
      {pasoActual === 0 && (
        <StepParalelo
          onAvanzar={avanzar}
          onParaleloSeleccionado={actualizarParalelo}
          onParalelosCargados={setParalelos}
          paraleloInicialId={paraleloId}
        />
      )}
      {pasoActual === 1 && (
        <StepEstudiantes
          paraleloId={paraleloId}
          paralelos={paralelos}
          onParaleloSeleccionado={actualizarParalelo}
          onAvanzar={avanzar}
          onRetroceder={retroceder}
        />
      )}
      {pasoActual === 2 && (
        <StepGrupos
          paraleloId={paraleloId}
          paralelos={paralelos}
          hemisemestres={hemisemestres}
          onParaleloSeleccionado={actualizarParalelo}
          onRetroceder={retroceder}
        />
      )}
    </div>
  )
}
