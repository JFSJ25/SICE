import { useEffect, useState, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { obtenerGruposConDetalle, yaCoevaluoGrupo } from '../../lib/data.js'
import {
  Eyebrow,
  StatCard,
  Aviso,
  Button,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import RefreshIcon from '@mui/icons-material/Refresh'
import TarjetaCoevaluacion from '../../components/estudiante/TarjetaCoevaluacion.jsx'
import { notificar } from '../../lib/notifications.js'

export default function Coevaluar() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const navigate = useNavigate()

  const [grupos, setGrupos] = useState([])
  const [estados, setEstados] = useState([]) // bool[] paralelo a grupos
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const cargarVersionRef = useRef(0)

  useEffect(() => {
    if (!contexto || !hemisemestreActivo) {
      setCargando(false)
      return
    }
    cargar()
  }, [contexto?.paraleloId, hemisemestreActivo?.id])

  async function cargar(silenciosa = false) {
    const version = ++cargarVersionRef.current
    if (!silenciosa) setCargando(true)
    setError('')
    try {
      const todos = await obtenerGruposConDetalle(
        contexto.paraleloId,
        hemisemestreActivo.id
      )
      const otros = todos.filter(g => g.id !== contexto.grupoId)
      const checks = await Promise.all(
        otros.map(g =>
          yaCoevaluoGrupo(
            perfil.id,
            g.id,
            hemisemestreActivo.id,
            g.miembros.map(m => m.usuarioId)
          )
        )
      )
      if (version !== cargarVersionRef.current) return
      setGrupos(otros)
      setEstados(checks)
    } catch (e) {
      if (version === cargarVersionRef.current) {
        setError(e.message)
        notificar.error(e)
      }
    } finally {
      if (version === cargarVersionRef.current) setCargando(false)
    }
  }

  async function handleActualizarManual() {
    setActualizando(true)
    try {
      await cargar(true)
    } finally {
      setActualizando(false)
    }
  }

  if (cargando) return <LoadingSkeleton variant="coevaluar" />
  // if (error) return <Aviso variant="red">{error}</Aviso>

  const disponibles = grupos.filter(
    (g, i) => !estados[i] && g.coevaluacionHabilitada
  )
  const noExpuestos = grupos.filter(
    (g, i) => !estados[i] && !g.coevaluacionHabilitada
  )
  const hechos = grupos.filter((_, i) => estados[i])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <Eyebrow>{hemisemestreActivo?.nombre}</Eyebrow>
          <h1>Coevaluar a otros grupos</h1>
          <p className="text-sm text-ink-soft mt-1">
            No puedes coevaluar a tu propio grupo. Los grupos se habilitan
            conforme finalizan su exposición.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleActualizarManual}
          disabled={cargando || actualizando}
          title="Actualizar lista de grupos habilitados"
        >
          <RefreshIcon
            className={`w-4 h-4 ${actualizando ? 'animate-spin' : ''}`}
          />{' '}
          Actualizar
        </Button>
      </div>

      {error && (
        <Aviso variant="red" className="mb-4">
          {error}
        </Aviso>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        <StatCard
          value={disponibles.length}
          label="Listos para coevaluar"
          acento="gold"
        />
        <StatCard
          value={noExpuestos.length}
          label="Aún no exponen"
          acento="red"
        />
        <StatCard value={hechos.length} label="Ya coevaluados" acento="green" />
      </div>

      {grupos.length === 0 ? (
        <Aviso>No hay otros grupos en este hemisemestre todavía.</Aviso>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {grupos.map((g, i) => {
            const hecho = estados[i]
            return (
              <TarjetaCoevaluacion
                key={g.id}
                grupo={g}
                realizada={hecho}
                onCoevaluar={() =>
                  navigate(`/estudiante/coevaluar/${g.id}`, {
                    state: {
                      grupoNumero: g.numero,
                      tema: g.tema,
                      hemisemestreId: hemisemestreActivo.id,
                      hemisemestreNombre: hemisemestreActivo.nombre,
                      miembros: g.miembros,
                      coevaluacionHabilitada: g.coevaluacionHabilitada
                    }
                  })
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
