import { useEffect, useState } from 'react'
import { crearGrupo } from '../../../lib/data.js'
import {
  Panel,
  Button,
  Spinner,
  Input,
  Select
} from '../../ui/index.jsx'
import AddIcon from '@mui/icons-material/Add'

export default function BuilderNuevoGrupo({
  sinGrupo,
  siguienteNumero,
  paraleloId,
  hemisemestres,
  onOperacionInicio,
  onOperacionFin,
  onCreado,
  onError
}) {
  const [seleccionados, setSeleccionados] = useState(new Map())
  const [temas, setTemas] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [liderActual, setLiderActual] = useState(null)
  const [desplegado, setDesplegado] = useState(true)

  useEffect(() => {
    setSeleccionados(prev => {
      const uidsDisponibles = new Set(sinGrupo.map(est => est.usuarioId))
      let modificado = false
      const nuevo = new Map()
      for (const [uid, m] of prev.entries()) {
        if (uidsDisponibles.has(uid)) {
          nuevo.set(uid, m)
        } else {
          modificado = true
        }
      }
      if (liderActual && !uidsDisponibles.has(liderActual)) {
        setLiderActual(null)
      }
      return modificado ? nuevo : prev
    })
  }, [sinGrupo, liderActual])

  function toggleEstudiante(uid) {
    setSeleccionados(prev => {
      const nuevo = new Map(prev)
      if (nuevo.has(uid)) {
        nuevo.delete(uid)
        if (liderActual === uid) setLiderActual(null)
      } else {
        nuevo.set(uid, { rolGrupo: 'expositor', lider: false })
      }
      return nuevo
    })
  }

  function cambiarRol(uid, rolGrupo) {
    setSeleccionados(prev => {
      const nuevo = new Map(prev)
      const m = nuevo.get(uid)
      if (m) nuevo.set(uid, { ...m, rolGrupo })
      return nuevo
    })
  }

  async function handleCrear() {
    if (seleccionados.size === 0) {
      onError('Selecciona al menos un integrante.')
      return
    }
    if (hemisemestres.some(h => !String(temas[h.id] ?? '').trim())) {
      onError('Escribe el tema de cada hemisemestre.')
      return
    }
    if (liderActual === null) {
      onError('Todos los grupos deben tener un líder.')
      return
    }
    const miembros = Array.from(seleccionados.entries()).map(
      ([usuarioId, m]) => ({
        usuarioId,
        rolGrupo: m.rolGrupo,
        lider: usuarioId === liderActual
      })
    )
    setGuardando(true)
    onOperacionInicio?.()
    try {
      await crearGrupo({
        paraleloId,
        numero: siguienteNumero,
        maxIntegrantes: 10,
        temas: Object.fromEntries(
          hemisemestres.map(h => [h.id, temas[h.id].trim()])
        ),
        hemisemestres,
        miembros
      })
      setSeleccionados(new Map())
      setTemas({})
      setLiderActual(null)
      await onCreado?.()
    } catch (e) {
      onError(e.message)
    } finally {
      setGuardando(false)
      onOperacionFin?.()
    }
  }

  return (
    <Panel>
      <button
        type="button"
        className={`${
          desplegado ? 'mb-4' : ''
        } flex w-full items-center gap-2 text-left`}
        onClick={() => setDesplegado(prev => !prev)}
        aria-expanded={desplegado}
      >
        <AddIcon className="w-5 h-5" />
        <span className="font-semibold">Crear grupo {siguienteNumero}</span>
        <span className="text-xs font-bold text-ink-soft ml-3">
          Estudiantes sin grupo: {sinGrupo.length}
        </span>
      </button>

      {desplegado && (
        <>
          <div className="flex flex-col gap-1.5 mb-5 max-h-72 overflow-y-auto pr-1">
            {sinGrupo.map(est => {
              const selec = seleccionados.get(est.usuarioId)
              return (
                <div
                  key={est.usuarioId}
                  className={`
                    flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-sm border transition-colors
                    ${selec ? 'border-gold/50 bg-gold-soft' : 'border-black/10 bg-surface'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={!!selec}
                    onChange={() => toggleEstudiante(est.usuarioId)}
                    className="accent-gold flex-shrink-0"
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium break-words">
                    {est.nombre}
                  </span>

                  {selec && (
                    <>
                      <Select
                        value={selec.rolGrupo}
                        onChange={e =>
                          cambiarRol(est.usuarioId, e.target.value)
                        }
                        className="w-32 text-xs py-1.5"
                      >
                        <option value="expositor">Expositor</option>
                        <option value="evaluador">Evaluador</option>
                      </Select>
                      <label className="flex items-center gap-1 text-xs text-ink-mid flex-shrink-0">
                        <input
                          type="radio"
                          name="lider-nuevo"
                          checked={liderActual === est.usuarioId}
                          onChange={() => setLiderActual(est.usuarioId)}
                          className="accent-gold"
                        />
                        Líder
                      </label>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-ink-mid mb-3">
              Temas del grupo
            </p>
            <div className="flex flex-col gap-3">
              {hemisemestres.map(h => (
                <div key={h.id}>
                  <label className="text-xs text-ink-soft block mb-1.5">
                    {h.nombre}
                  </label>
                  <Input
                    value={temas[h.id] ?? ''}
                    onChange={e =>
                      setTemas(prev => ({ ...prev, [h.id]: e.target.value }))
                    }
                    placeholder="Tema de este hemisemestre"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCrear}
              disabled={guardando || seleccionados.size === 0}
            >
              {guardando ? (
                <>
                  <Spinner className="w-4 h-4" /> Creando…
                </>
              ) : (
                <>
                  <AddIcon className="w-4 h-4" /> Crear Grupo {siguienteNumero}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Panel>
  )
}
