import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  obtenerGruposConDetalle,
  obtenerPendientesDocente
} from '../../lib/data.js'
import {
  Eyebrow,
  Aviso,
  Button,
  Spinner,
  Tabla,
  FilaTabla,
  CeldaTabla
} from '../../components/ui/index.jsx'

export default function Pendientes() {
  const { contexto, hemisemestreActivo } = useOutletContext()
  const navigate = useNavigate()

  const [pendientes, setPendientes] = useState([])
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
      const grupos = await obtenerGruposConDetalle(
        contexto.paraleloId,
        hemisemestreActivo.id
      )
      const ps = await obtenerPendientesDocente(grupos, hemisemestreActivo.id)
      setPendientes(ps)
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

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>
          {hemisemestreActivo?.nombre} · {contexto?.etiqueta}
        </Eyebrow>
        <h1>Pendientes</h1>
        {pendientes.length > 0 && (
          <p className="text-sm text-ink-soft mt-1">
            {pendientes.length} estudiante{pendientes.length !== 1 ? 's' : ''}{' '}
            sin calificar.
          </p>
        )}
      </div>

      {pendientes.length === 0 ? (
        <Aviso variant="green">
          Sin calificaciones pendientes en este hemisemestre.
        </Aviso>
      ) : (
        <Tabla headers={['Grupo', 'Estudiante', 'Rol', '']}>
          {pendientes.map(p => (
            <FilaTabla key={p.usuarioId}>
              <CeldaTabla>Grupo {p.grupoNumero}</CeldaTabla>
              <CeldaTabla className="font-medium">{p.nombre}</CeldaTabla>
              <CeldaTabla className="capitalize">{p.rolGrupo}</CeldaTabla>
              <CeldaTabla>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/profesor/calificar/${p.usuarioId}`, {
                      state: {
                        nombreEstudiante: p.nombre,
                        grupoId: p.grupoId,
                        grupoNumero: p.grupoNumero,
                        rolGrupo: p.rolGrupo,
                        hemisemestreId: hemisemestreActivo.id,
                        hemisemestreNombre: hemisemestreActivo.nombre,
                        paraleloId: contexto.paraleloId
                      }
                    })
                  }
                >
                  Calificar
                </Button>
              </CeldaTabla>
            </FilaTabla>
          ))}
        </Tabla>
      )}
    </div>
  )
}
