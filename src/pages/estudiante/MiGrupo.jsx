import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { obtenerGruposConDetalle } from '../../lib/data.js'
import {
  Eyebrow,
  Panel,
  Aviso,
  Badge,
  Spinner
} from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function MiGrupo() {
  const { perfil } = useAuth()
  const { contexto, hemisemestreActivo } = useOutletContext()
  const [grupo, setGrupo] = useState(null)
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
      const miGrupo = grupos.find(g => g.id === contexto.grupoId)
      setGrupo(miGrupo ?? null)
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

  if (!contexto)
    return (
      <Aviso>
        Todavía no estás matriculado en ningún paralelo. Consulta con tu
        profesor.
      </Aviso>
    )

  if (!grupo)
    return (
      <Aviso>
        Todavía no estás asignado a ningún grupo en este hemisemestre. Consulta
        con tu profesor.
      </Aviso>
    )

  const esEvaluador = contexto.rolGrupo === 'evaluador'
  const companeros = grupo.miembros.filter(m => m.usuarioId !== perfil?.id)

  return (
    <div>
      <div className="mb-7">
        <Eyebrow>
          {hemisemestreActivo?.nombre} · Grupo {grupo.numero}
        </Eyebrow>
        <h1 className="leading-tight">{grupo.tema}</h1>
      </div>

      <Panel>
        <h3 className="mb-3">Tu rol en este grupo</h3>
        <p className="text-sm leading-relaxed text-ink-mid">
          {esEvaluador ? (
            <>
              Eres el <strong>evaluador</strong> de este grupo: preparas el
              cuestionario del tema y lo aplicas al resto de la clase.
            </>
          ) : (
            <>
              Eres <strong>expositor</strong> de este grupo: presentas el tema
              asignado.
            </>
          )}

          {contexto.lider && (
            <>
              {' '}
              Además eres el <strong>líder</strong> del grupo.
            </>
          )}
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant={esEvaluador ? 'ok' : 'info'}>
            {esEvaluador ? 'Evaluador' : 'Expositor'}
          </Badge>
          {contexto.lider && <Badge variant="pending">Líder</Badge>}
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-3">Compañeros de grupo</h3>
        <ul className="flex flex-col gap-2">
          {companeros.map(c => (
            <li
              key={c.usuarioId}
              className="flex items-center gap-2 bg-surface rounded-sm px-3 py-2"
            >
              <span className="flex-1 text-sm font-medium">{c.nombre}</span>
              <Badge variant={c.rolGrupo === 'evaluador' ? 'ok' : 'info'}>
                {c.rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}
              </Badge>
              {c.lider && <Badge variant="pending">Líder</Badge>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
