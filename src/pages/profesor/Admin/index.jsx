import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import StepParalelo from './StepParalelo.jsx'
import StepEstudiantes from './StepEstudiantes.jsx'
import StepGrupos from './StepGrupos.jsx'
import IndicadorPasos from '../../../components/shared/IndicadorPasos.jsx'

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
        <p className="text-xs font-semibold text-sice-green dark:text-emerald-300 mb-1.5">
          Configuración
        </p>
        <h1>Administración</h1>
        <p className="text-sm text-ink-soft mt-1">
          Selecciona un paralelo y trabaja en cualquier paso del flujo.
        </p>
      </div>

      <IndicadorPasos
        pasos={PASOS}
        pasoActual={pasoActual}
        puedeNavegar={indice => indice === 0 || Boolean(paraleloId)}
        onSeleccionar={irAlPaso}
      />

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
