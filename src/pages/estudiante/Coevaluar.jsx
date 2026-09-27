import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { obtenerGruposConDetalle, yaCoevaluoGrupo } from '../../lib/data.js'
import {
  Eyebrow,
  StatCard,
  Aviso,
  Button,
  Spinner
} from '../../components/ui/index.jsx'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RateReviewIcon from '@mui/icons-material/RateReview'

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
        otros.map(g => yaCoevaluoGrupo(perfil.id, g.id, hemisemestreActivo.id))
      )
      setGrupos(otros)
      setEstados(checks)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-ink-soft" />
      </div>
    )
  if (error) return <Aviso variant="red">{error}</Aviso>

  const pendientes = grupos.filter((_, i) => !estados[i])
  const hechos = grupos.filter((_, i) => estados[i])

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>{hemisemestreActivo?.nombre}</Eyebrow>
        <h1>Coevaluar a otros grupos</h1>
        <p className="text-sm text-ink-soft mt-1">
          No puedes coevaluar a tu propio grupo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-7">
        <StatCard
          value={pendientes.length}
          label="Por coevaluar"
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
            const expositores = g.miembros
              .filter(m => m.rolGrupo === 'expositor')
              .map(m => m.nombre)
              .join(', ')
            const evaluador = g.miembros.find(m => m.rolGrupo === 'evaluador')
            return (
              <div
                key={g.id}
                className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5"
              >
                <p className="text-[11px] font-bold text-sice-green mb-1">
                  Grupo {g.numero}
                </p>
                <h3 className="text-base mb-3 leading-snug">{g.tema}</h3>
                <p className="text-xs text-ink-soft mb-1">
                  <strong>Expositores:</strong> {expositores || '—'}
                </p>
                <p className="text-xs text-ink-soft mb-4">
                  <strong>Evaluador:</strong> {evaluador?.nombre ?? '—'}
                </p>
                {hecho ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sice-green-soft text-sice-green">
                    <>
                      <CheckCircleIcon className="w-4 h-4" /> Ya coevaluado
                    </>
                  </span>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigate(`/estudiante/coevaluar/${g.id}`, {
                        state: {
                          grupoNumero: g.numero,
                          tema: g.tema,
                          hemisemestreId: hemisemestreActivo.id,
                          hemisemestreNombre: hemisemestreActivo.nombre
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
