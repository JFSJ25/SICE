import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { obtenerGruposConDetalle, yaCoevaluoGrupo } from '../../lib/data.js'
import {
  Eyebrow,
  StatCard,
  Aviso,
  Button,
  Spinner,
  LoadingSkeleton
} from '../../components/ui/index.jsx'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RateReviewIcon from '@mui/icons-material/RateReview'
import LockIcon from '@mui/icons-material/Lock'
import RefreshIcon from '@mui/icons-material/Refresh'

export default function Coevaluar() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const navigate = useNavigate()

  const [grupos, setGrupos] = useState([])
  const [estados, setEstados] = useState([]) // bool[] paralelo a grupos
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

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
      setGrupos(otros)
      setEstados(checks)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingSkeleton variant="coevaluar" />
  if (error) return <Aviso variant="red">{error}</Aviso>

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
          onClick={cargar}
          disabled={cargando}
          title="Actualizar lista de grupos habilitados"
        >
          <RefreshIcon className="w-4 h-4" /> Actualizar
        </Button>
      </div>

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
            const integrantes = g.miembros.map(m => m.nombre).join(', ')
            return (
              <div
                key={g.id}
                className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5"
              >
                <p className="text-[11px] font-bold text-sice-green dark:text-emerald-300 mb-1">
                  Grupo {g.numero}
                </p>
                <h3 className="text-base mb-3 leading-snug">{g.tema}</h3>
                <p className="text-xs text-ink-soft mb-1">
                  <strong>Integrantes:</strong> {integrantes || '—'}
                </p>
                {hecho ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sice-green-soft text-sice-green dark:text-emerald-300">
                    <CheckCircleIcon className="w-4 h-4" /> Ya coevaluado
                  </span>
                ) : !g.coevaluacionHabilitada ? (
                  <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300 w-fit">
                      <LockIcon className="w-3.5 h-3.5 text-ink-soft" /> No
                      disponible
                    </span>
                    <p className="text-[11px] text-ink-soft">
                      El docente habilitará este grupo cuando finalice su
                      exposición.
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
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
                  >
                    <>
                      <RateReviewIcon className="w-4 h-4" /> Coevaluar este
                      grupo
                    </>
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
