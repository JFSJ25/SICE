import { Fragment, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { obtenerResumenCoevaluacionEstudiantes } from '../../lib/data.js'
import {
  Aviso,
  Badge,
  LoadingSkeleton,
  StatCard,
  Tabla,
  FilaTabla,
  CeldaTabla,
  Button
} from '../../components/ui/index.jsx'
import CabeceraPagina from '../../components/shared/CabeceraPagina.jsx'
import { useRealtimeRefresh } from '../../lib/realtime.js'
import { notificar } from '../../lib/notifications.js'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

export default function Coevaluaciones() {
  const { contexto, hemisemestreActivo } = useOutletContext()
  const [estudiantes, setEstudiantes] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const realtimeSubscriptions = useMemo(
    () => [
      { event: '*', schema: 'public', table: 'coevaluaciones' },
      { event: '*', schema: 'public', table: 'grupo_temas' },
      { event: '*', schema: 'public', table: 'grupo_miembros' },
      { event: '*', schema: 'public', table: 'matriculas' }
    ],
    []
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
      const resumen = await obtenerResumenCoevaluacionEstudiantes(
        contexto.paraleloId,
        hemisemestreActivo.id
      )
      setEstudiantes(resumen)
    } catch (e) {
      setError(e.message)
      notificar.error(e)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingSkeleton variant="estudiantes" />
  if (!contexto) {
    return (
      <Aviso>
        No hay paralelo activo. Ve a Administración para configurar uno.
      </Aviso>
    )
  }

  const finalizados = estudiantes.filter(
    estudiante => estudiante.terminado
  ).length
  const pendientes = estudiantes.length - finalizados

  return (
    <div>
      <CabeceraPagina
        eyebrow={`${hemisemestreActivo?.nombre} · ${contexto.etiqueta}`}
        titulo="Seguimiento de coevaluaciones"
        descripcion="Consulta si cada estudiante terminó de coevaluar a todos los grupos activos."
      />

      {error && <Aviso variant="red">{error}</Aviso>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard
          value={estudiantes.length}
          label="Estudiantes"
          acento="gold"
        />
        <StatCard value={finalizados} label="Completaron" acento="green" />
        <StatCard value={pendientes} label="Pendientes" acento="red" />
      </div>

      {estudiantes.length === 0 ? (
        <Aviso>No hay estudiantes matriculados en este paralelo.</Aviso>
      ) : (
        <Tabla headers={['Estudiante', 'Grupo', 'Estado', '']}>
          {estudiantes.map(estudiante => {
            const abierto = expandido === estudiante.usuarioId
            return (
              <Fragment key={estudiante.usuarioId}>
                <FilaTabla
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandido(abierto ? null : estudiante.usuarioId)
                  }
                >
                  <CeldaTabla className="font-medium">
                    {estudiante.nombre}
                  </CeldaTabla>
                  <CeldaTabla>
                    {estudiante.grupoNumero
                      ? `Grupo ${estudiante.grupoNumero}`
                      : 'Sin grupo'}
                  </CeldaTabla>
                  <CeldaTabla>
                    {estudiante.terminado ? (
                      <Badge variant="ok">Completado</Badge>
                    ) : (
                      <Badge variant="pending">
                        Falta {estudiante.gruposPendientes.length}
                      </Badge>
                    )}
                  </CeldaTabla>
                  <CeldaTabla className="text-right">
                    <Button
                      type="button"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-sice-green dark:text-emerald-300 transition-colors hover:bg-sice-green-soft dark:hover:bg-white/10
                        bg-transparent border-none"
                      variant="custom"
                      aria-expanded={abierto}
                      aria-label={
                        abierto
                          ? `Ocultar detalles de ${estudiante.nombre}`
                          : `Ver detalles de ${estudiante.nombre}`
                      }
                    >
                      {abierto ? (
                        <ExpandLessIcon className="w-5 h-5" />
                      ) : (
                        <ExpandMoreIcon className="w-5 h-5" />
                      )}
                    </Button>
                  </CeldaTabla>
                </FilaTabla>
                <FilaTabla
                  key={`${estudiante.usuarioId}-detalle`}
                  hover={false}
                  className={`overflow-hidden transition-[opacity,border-color] duration-300 ${
                    abierto
                      ? 'opacity-100 border-b border-black/[0.07]'
                      : 'pointer-events-none opacity-0 !border-0'
                  }`}
                  aria-hidden={!abierto}
                >
                  <CeldaTabla colSpan={4} className="p-0">
                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        abierto
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="bg-surface/70 dark:bg-slate-900/15 px-4 py-3">
                          {estudiante.gruposActivos.length === 0 ? (
                            <p className="text-sm text-ink-soft">
                              No hay grupos activos para coevaluar.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {estudiante.gruposActivos.map(grupo => (
                                <div
                                  key={grupo.grupoId}
                                  className="flex items-start justify-between gap-3 rounded-sm border border-black/[0.08] bg-white dark:bg-slate-800 px-3 py-2.5"
                                >
                                  <div>
                                    <p className="font-semibold text-sm">
                                      Grupo {grupo.numero}
                                    </p>
                                    <p className="text-xs text-ink-soft">
                                      {grupo.tema}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={
                                      grupo.coevaluado ? 'ok' : 'pending'
                                    }
                                  >
                                    {grupo.coevaluado
                                      ? 'Coevaluado'
                                      : 'Pendiente'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CeldaTabla>
                </FilaTabla>
              </Fragment>
            )
          })}
        </Tabla>
      )}
    </div>
  )
}
