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
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import { useRealtimeRefresh } from '../../lib/realtime.js'
import TarjetaAsignacionGrupo from '../../components/estudiante/TarjetaAsignacionGrupo.jsx'

export default function MiGrupo() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [grupoGuardandoId, setGrupoGuardandoId] = useState(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [borradores, setBorradores] = useState({})

  const realtimeSubscriptions = useMemo(
    () => [
      { event: '*', schema: 'public', table: 'grupo_miembros' },
      { event: '*', schema: 'public', table: 'grupos' },
      { event: '*', schema: 'public', table: 'grupo_temas' },
      {
        event: '*',
        schema: 'public',
        table: 'paralelos',
        filter: `id=eq.${contexto?.paraleloId}`
      }
    ],
    [contexto?.paraleloId]
  )

  useEffect(() => {
    if (!contexto || !hemisemestreActivo) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestreActivo?.id])

  useRealtimeRefresh({
    subscriptions: realtimeSubscriptions,
    enabled: Boolean(contexto?.paraleloId && hemisemestreActivo?.id),
    onChange: ({ silent } = {}) => cargar(silent)
  })

  async function cargar(silenciosa = false) {
    if (!silenciosa) setCargando(true)
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
            const miembro = grupo.miembros.find(m => m.usuarioId === perfil?.id)
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
      grupos.find(g => g.miembros.some(m => m.usuarioId === perfil?.id)) ??
      null,
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
      await cargar(true)
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

  if (cargando) return <LoadingSkeleton variant="mi-grupo" />
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
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
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
        {/* <Button
          size="sm"
          variant="outline"
          onClick={cargar}
          disabled={cargando}
          title="Actualizar lista de grupos habilitados"
        >
          <RefreshIcon className="w-4 h-4" /> Actualizar
        </Button> */}
      </div>

      {error && <Aviso variant="red">{error}</Aviso>}
      {exito && (
        <Aviso variant="green" dismissible>
          {exito}
        </Aviso>
      )}

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
            <TarjetaAsignacionGrupo
              key={grupo.id}
              grupo={grupo}
              borrador={borrador}
              abierta={abierta}
              soyMiembro={soyMiembro}
              guardando={grupoGuardandoId !== null}
              onActualizar={cambios => actualizarBorrador(grupo.id, cambios)}
              onGuardar={() => guardarAsignacion(grupo.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

function miembroActual(grupo, usuarioId) {
  return grupo.miembros.find(m => m.usuarioId === usuarioId)
}
