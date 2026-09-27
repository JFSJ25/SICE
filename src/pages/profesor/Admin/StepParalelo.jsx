import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import {
  obtenerPeriodos,
  crearPeriodo,
  eliminarPeriodo,
  obtenerMaterias,
  obtenerParalelosProfesor,
  upsertParalelo,
  eliminarParalelo,
  obtenerHemisemestres
} from '../../../lib/data.js'
import {
  Panel,
  Campo,
  Select,
  Input,
  Button,
  Aviso,
  Spinner
} from '../../../components/ui/index.jsx'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DeleteIcon from '@mui/icons-material/Delete'

export function SelectorParalelo({ paralelos, value, onChange }) {
  return (
    <Campo label="Materia - paralelo">
      <Select value={value ?? ''} onChange={e => onChange(e.target.value)}>
        {paralelos.map(p => (
          <option key={p.id} value={p.id}>
            {p.materiaNombre} - Paralelo {p.codigo} · {p.periodoNombre}
          </option>
        ))}
      </Select>
    </Campo>
  )
}

export default function StepParalelo({
  onAvanzar,
  onParaleloSeleccionado,
  onParalelosCargados
}) {
  const { perfil } = useAuth()

  const [periodos, setPeriodos] = useState([])
  const [materias, setMaterias] = useState([])
  const [paralelos, setParalelos] = useState([])
  const [paraleloSeleccionado, setParaleloSeleccionado] = useState('')
  const [modoNuevo, setModoNuevo] = useState(false)
  const [periodoId, setPeriodoId] = useState('')
  const [nuevoPeriodo, setNuevoPeriodo] = useState('')
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [materiaId, setMateriaId] = useState('')
  const [codigo, setCodigo] = useState('A')
  const [habilitarTodos, setHabilitarTodos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      const [ps, ms, paralelosProfesor] = await Promise.all([
        obtenerPeriodos(),
        obtenerMaterias(),
        obtenerParalelosProfesor(perfil.id)
      ])
      setPeriodos(ps)
      setMaterias(ms)
      setParalelos(paralelosProfesor)
      onParalelosCargados(paralelosProfesor)
      setModoNuevo(paralelosProfesor.length === 0)
      if (paralelosProfesor.length > 0) {
        const primero = paralelosProfesor[0]
        setParaleloSeleccionado(primero.id)
        const hs = await obtenerHemisemestres(primero.id)
        onParaleloSeleccionado({ paraleloId: primero.id, hemisemestres: hs })
      } else {
        setParaleloSeleccionado('')
        onParaleloSeleccionado({ paraleloId: null, hemisemestres: [] })
      }
      if (ps.length > 0) setPeriodoId(ps[0].id)
      if (ms.length > 0) setMateriaId(ms[0].id)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleCrearPeriodo() {
    if (!nuevoPeriodo.trim()) return
    setGuardando(true)
    try {
      const nuevo = await crearPeriodo(nuevoPeriodo.trim())
      setPeriodos(prev => [nuevo, ...prev])
      setPeriodoId(nuevo.id)
      setNuevoPeriodo('')
      setMostrarNuevo(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminarPeriodo() {
    const periodo = periodos.find(p => p.id === periodoId)
    if (!periodo) return
    if (
      !window.confirm(
        `¿Eliminar el periodo "${periodo.nombre}"? También se eliminarán sus paralelos y toda la información asociada.`
      )
    )
      return

    setGuardando(true)
    setError('')
    try {
      await eliminarPeriodo(periodo.id)
      await cargarDatos()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminarParalelo() {
    const paralelo = paralelos.find(p => p.id === paraleloSeleccionado)
    if (!paralelo) return
    if (
      !window.confirm(
        `¿Eliminar ${paralelo.materiaNombre} - Paralelo ${paralelo.codigo}? También se eliminarán matrículas, grupos y calificaciones asociadas.`
      )
    )
      return

    setGuardando(true)
    setError('')
    try {
      await eliminarParalelo(paralelo.id)
      await cargarDatos()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleAvanzar(e) {
    e.preventDefault()
    if (!modoNuevo && paraleloSeleccionado) {
      setGuardando(true)
      setError('')
      try {
        const hs = await obtenerHemisemestres(paraleloSeleccionado)
        onAvanzar({ paraleloId: paraleloSeleccionado, hemisemestres: hs })
      } catch (e) {
        setError(e.message)
      } finally {
        setGuardando(false)
      }
      return
    }
    if (!periodoId || !materiaId || !codigo) {
      setError('Completa todos los campos.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const codigos = habilitarTodos ? ['A', 'B', 'C'] : [codigo]
      const paralelosCreados = await Promise.all(
        codigos.map(codigoParalelo =>
          upsertParalelo({
            materiaId,
            periodoId,
            codigo: codigoParalelo,
            profesorId: perfil.id
          })
        )
      )
      const paralelosVisibles = paralelosCreados.map((paralelo, indice) => ({
        id: paralelo.id,
        codigo: codigos[indice],
        materiaNombre: materias.find(m => m.id === materiaId)?.nombre ?? '—',
        periodoNombre: periodos.find(p => p.id === periodoId)?.nombre ?? '—'
      }))
      setParaleloSeleccionado(paralelosVisibles[0].id)
      setParalelos(prev => [
        ...paralelosVisibles,
        ...prev.filter(p => !paralelosVisibles.some(nuevo => nuevo.id === p.id))
      ])
      onParalelosCargados(prev => [
        ...paralelosVisibles,
        ...prev.filter(p => !paralelosVisibles.some(nuevo => nuevo.id === p.id))
      ])
      // Leer los hemisemestres que creó el trigger
      const paraleloInicial = paralelosCreados[0]
      const hs = await obtenerHemisemestres(paraleloInicial.id)
      onAvanzar({ paraleloId: paraleloInicial.id, hemisemestres: hs })
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  function seleccionarParalelo(id) {
    setParaleloSeleccionado(id)
    obtenerHemisemestres(id)
      .then(hemisemestres =>
        onParaleloSeleccionado({ paraleloId: id, hemisemestres })
      )
      .catch(e => setError(e.message))
  }

  if (cargando)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="text-ink-soft" />
      </div>
    )

  return (
    <Panel>
      <h3 className="mb-5">Paso 1 — Seleccionar materia-paralelo</h3>

      {error && (
        <Aviso variant="red" className="mb-4">
          {error}
        </Aviso>
      )}

      <form onSubmit={handleAvanzar} className="flex flex-col gap-5">
        {paralelos.length > 0 && !modoNuevo && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SelectorParalelo
                paralelos={paralelos}
                value={paraleloSeleccionado}
                onChange={seleccionarParalelo}
              />
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleEliminarParalelo}
              disabled={guardando}
            >
              <>
                <DeleteIcon className="w-4 h-4" /> Eliminar
              </>
            </Button>
          </div>
        )}

        {modoNuevo && (
          <>
            {/* Periodo */}
            <div>
              <Campo label="Periodo académico">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      value={periodoId}
                      onChange={e => setPeriodoId(e.target.value)}
                      disabled={mostrarNuevo}
                    >
                      {periodos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleEliminarPeriodo}
                    disabled={
                      mostrarNuevo || guardando || periodos.length === 0
                    }
                  >
                    <>
                      <DeleteIcon className="w-4 h-4" /> Eliminar
                    </>
                  </Button>
                </div>
              </Campo>

              <button
                type="button"
                className="text-xs text-sice-green font-semibold mt-2 hover:underline"
                onClick={() => setMostrarNuevo(v => !v)}
              >
                {mostrarNuevo ? (
                  <>
                    <CloseIcon className="w-4 h-4" /> Cancelar
                  </>
                ) : (
                  <>
                    <AddIcon className="w-4 h-4" /> Crear nuevo periodo
                  </>
                )}
              </button>

              {mostrarNuevo && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={nuevoPeriodo}
                    onChange={e => setNuevoPeriodo(e.target.value)}
                    placeholder="ej. 2026-2"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCrearPeriodo}
                    disabled={guardando}
                  >
                    <>
                      <AddIcon className="w-4 h-4" /> Crear
                    </>
                  </Button>
                </div>
              )}
            </div>

            {/* Materia */}
            <Campo label="Materia">
              <Select
                value={materiaId}
                onChange={e => setMateriaId(e.target.value)}
              >
                {materias.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.semestre})
                  </option>
                ))}
              </Select>
            </Campo>

            {/* Paralelo */}
            <Campo label="Paralelo">
              <Select
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                disabled={habilitarTodos}
              >
                {['A', 'B', 'C'].map(c => (
                  <option key={c} value={c}>
                    Paralelo {c}
                  </option>
                ))}
              </Select>
            </Campo>

            <label className="flex items-start gap-2 text-sm text-ink-mid">
              <input
                type="checkbox"
                checked={habilitarTodos}
                onChange={e => setHabilitarTodos(e.target.checked)}
                className="mt-0.5 accent-gold"
              />
              <span>
                <strong className="text-ink">Habilitar los 3 paralelos</strong>
                <span className="block text-xs text-ink-soft mt-0.5">
                  Crea los paralelos A, B y C de esta materia de una sola vez.
                </span>
              </span>
            </label>

            <p className="text-xs text-ink-soft">
              Si este paralelo ya existe para el periodo seleccionado, se
              activará sin crear duplicados. Los hemisemestres se crean
              automáticamente.
            </p>
          </>
        )}

        {paralelos.length > 0 && (
          <button
            type="button"
            className="text-xs text-sice-green font-semibold hover:underline self-start"
            onClick={() => setModoNuevo(v => !v)}
          >
            {modoNuevo ? (
              <>
                <ArrowBackIcon className="w-4 h-4" /> Seleccionar
                materia-paralelo existente
              </>
            ) : (
              <>
                <AddIcon className="w-4 h-4" /> Crear nueva materia-paralelo
              </>
            )}
          </button>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={guardando}>
            {guardando ? (
              <>
                <Spinner className="w-4 h-4" /> Activando…
              </>
            ) : modoNuevo ? (
              <>
                <ArrowForwardIcon className="w-4 h-4" /> Activar paralelo
              </>
            ) : (
              <>
                <ArrowForwardIcon className="w-4 h-4" /> Continuar
              </>
            )}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
