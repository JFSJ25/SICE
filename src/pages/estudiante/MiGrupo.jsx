import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  asignarEstudianteGrupo,
  obtenerGruposConDetalle
} from '../../lib/data.js'
import {
  Eyebrow,
  Panel,
  Aviso,
  Badge,
  Button,
  Select,
  Spinner
} from '../../components/ui/index.jsx'

export default function MiGrupo() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [grupoGuardandoId, setGrupoGuardandoId] = useState(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [borradores, setBorradores] = useState({})

  useEffect(() => {
    if (!contexto || !hemisemestreActivo) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestreActivo?.id])

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const nuevosGrupos = await obtenerGruposConDetalle(
        contexto.paraleloId,
        hemisemestreActivo.id
      )
      setGrupos(nuevosGrupos)
      setBorradores(
        Object.fromEntries(
          nuevosGrupos.map(grupo => {
            const miembro = grupo.miembros.find(
              m => m.usuarioId === perfil?.id
            )
            return [
              grupo.id,
              {
                rol: miembro?.rolGrupo ?? 'expositor',
                lider: miembro?.lider ?? false
              }
            ]
          })
        )
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  const miGrupo = useMemo(
    () =>
      grupos.find(g =>
        g.miembros.some(m => m.usuarioId === perfil?.id)
      ) ?? null,
    [grupos, perfil?.id]
  )
  const abierta = contexto?.estadoAsignacion !== 'finalizada'

  async function guardarAsignacion(grupoId) {
    const borrador = borradores[grupoId] ?? {
      rol: 'expositor',
      lider: false
    }
    setGrupoGuardandoId(grupoId)
    setError('')
    setExito('')
    try {
      await asignarEstudianteGrupo({
        paraleloId: contexto.paraleloId,
        grupoId,
        rolGrupo: borrador.rol,
        lider: borrador.lider
      })
      await cargar()
      setExito('Tu asignación se guardó correctamente.')
    } catch (e) {
      setError(e.message)
    } finally {
      setGrupoGuardandoId(null)
    }
  }

  function actualizarBorrador(grupoId, cambios) {
    setBorradores(prev => ({
      ...prev,
      [grupoId]: {
        ...(prev[grupoId] ?? { rol: 'expositor', lider: false }),
        ...cambios
      }
    }))
  }

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )
  if (error && grupos.length === 0) return <Aviso variant="red">{error}</Aviso>
  if (!contexto)
    return (
      <Aviso>
        Todavía no estás matriculado en ningún paralelo. Consulta con tu
        profesor.
      </Aviso>
    )

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>
          {hemisemestreActivo?.nombre} · {contexto.etiqueta}
        </Eyebrow>
        <h1>Asignación de grupos</h1>
        <p className="text-sm text-ink-soft mt-1">
          {abierta
            ? 'Escoge un grupo, tu rol y si serás su líder. Puedes cambiar tu elección mientras la etapa esté abierta.'
            : 'La etapa de asignación fue finalizada por el profesor.'}
        </p>
      </div>

      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && <Aviso variant="green">{exito}</Aviso>}

      {miGrupo && (
        <Panel>
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
            Tu asignación actual
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <strong>Grupo {miGrupo.numero}</strong>
            <Badge
              variant={
                miembroActual(miGrupo, perfil?.id)?.rolGrupo === 'evaluador'
                  ? 'ok'
                  : 'info'
              }
            >
              {miembroActual(miGrupo, perfil?.id)?.rolGrupo === 'evaluador'
                ? 'Evaluador'
                : 'Expositor'}
            </Badge>
            {miembroActual(miGrupo, perfil?.id)?.lider && (
              <Badge variant="pending">Líder</Badge>
            )}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {grupos.map(grupo => {
          const borrador = borradores[grupo.id] ?? {
            rol: 'expositor',
            lider: false
          }
          const soyMiembro = grupo.miembros.some(
            m => m.usuarioId === perfil?.id
          )
          return (
            <Panel key={grupo.id}>
              <p className="text-[11px] font-bold text-sice-green mb-1">
                Grupo {grupo.numero}
              </p>
              <h3 className="text-base mb-3 leading-snug">{grupo.tema}</h3>
              <ul className="flex flex-col gap-1.5 mb-4">
                {grupo.miembros.map(m => (
                  <li
                    key={m.usuarioId}
                    className="flex items-center gap-2 bg-surface rounded-sm px-3 py-2"
                  >
                    <span className="flex-1 text-sm">{m.nombre}</span>
                    <Badge variant={m.rolGrupo === 'evaluador' ? 'ok' : 'info'}>
                      {m.rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}
                    </Badge>
                    {m.lider && <Badge variant="pending">Líder</Badge>}
                  </li>
                ))}
                {grupo.miembros.length === 0 && (
                  <li className="text-sm text-ink-soft">Aún no hay integrantes.</li>
                )}
              </ul>
              {abierta && (
                <div className="border-t border-black/10 pt-3">
                  {soyMiembro && (
                    <p className="text-xs text-ink-soft mb-2">
                      Puedes modificar tu rol o cambiarte a otro grupo.
                    </p>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-ink-soft">
                      <span className="block mb-1">Tu rol</span>
                      <Select
                        value={borrador.rol}
                        onChange={e =>
                          actualizarBorrador(grupo.id, { rol: e.target.value })
                        }
                        className="text-xs"
                      >
                        <option value="expositor">Expositor</option>
                        <option value="evaluador">Evaluador</option>
                      </Select>
                    </label>
                    <label className="flex items-center gap-1 text-xs text-ink-mid pb-2">
                      <input
                        type="checkbox"
                        checked={borrador.lider}
                        onChange={e =>
                          actualizarBorrador(grupo.id, {
                            lider: e.target.checked
                          })
                        }
                        className="accent-gold"
                      />
                      Ser líder
                    </label>
                    <Button
                      size="sm"
                      onClick={() => guardarAsignacion(grupo.id)}
                      disabled={grupoGuardandoId !== null}
                    >
                      {grupoGuardandoId === grupo.id
                        ? 'Guardando…'
                        : soyMiembro
                          ? 'Guardar cambios'
                          : 'Unirme a este grupo'}
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function miembroActual(grupo, usuarioId) {
  return grupo.miembros.find(m => m.usuarioId === usuarioId)
}
