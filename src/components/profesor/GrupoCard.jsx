import { useState } from 'react'
import DetalleCalificacionModal from '../evaluacion/DetalleCalificacionModal.jsx'
import EditIcon from '@mui/icons-material/Edit'
import { Badge, Button } from '../ui/index.jsx'

export default function GrupoCard({
  grupo,
  mapaCalif,
  mapaNotas,
  onCalificar,
  onVerAutoevaluacion,
  onToggleCheck,
  esModificado
}) {
  const [detalle, setDetalle] = useState(null)

  return (
    <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-bold text-sice-green dark:text-emerald-300">
          Grupo {grupo.numero}
        </p>

        <label
          className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
            grupo.coevaluacionHabilitada
              ? 'bg-sice-green-soft text-sice-green border-sice-green/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600/30 shadow-sm'
              : 'bg-surface text-ink-soft border-black/10 dark:border-white/10 hover:border-black/25'
          }`}
          title={
            grupo.coevaluacionHabilitada
              ? 'Coevaluación habilitada para que los estudiantes evalúen a este grupo'
              : 'Marcar para permitir que los estudiantes coevalúen a este grupo tras su exposición'
          }
        >
          <input
            type="checkbox"
            checked={Boolean(grupo.coevaluacionHabilitada)}
            onChange={e => onToggleCheck(grupo.id, e.target.checked)}
            className="accent-sice-green w-3.5 h-3.5 rounded cursor-pointer"
          />
          <span>
            {grupo.coevaluacionHabilitada
              ? 'Coevaluación habilitada'
              : 'Habilitar coevaluación'}
          </span>
          {esModificado && (
            <span
              className="w-2 h-2 rounded-full bg-sice-amber"
              title="Cambio pendiente de guardar"
            />
          )}
        </label>
      </div>

      <h2 className="text-base mb-4 leading-snug">{grupo.tema}</h2>

      <ul className="flex flex-col gap-2">
        {grupo.miembros.map(m => {
          const calif = mapaCalif.get(m.usuarioId)
          const nota = mapaNotas.get(m.usuarioId)
          const coevaluado = nota?.coevaluado === true
          const esEval = m.rolGrupo === 'evaluador'
          const rolLabel = esEval ? 'Evaluador' : 'Expositor'
          return (
            <li
              key={m.usuarioId}
              className="flex flex-col gap-2 bg-surface rounded-sm px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <div className="min-w-0 w-full sm:flex-1 sm:min-w-[180px]">
                <p className="text-sm font-semibold break-words leading-snug">
                  {m.nombre}
                </p>
                <p
                  className={`text-xs mt-0.5 ${esEval ? 'text-sice-green font-semibold dark:text-emerald-400' : 'text-ink-soft'}`}
                >
                  {rolLabel}
                  {m.lider ? '  Líder' : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {calif ? (
                  <Badge variant="ok">{calif.puntaje} pts</Badge>
                ) : (
                  <Badge variant="pending">Pendiente</Badge>
                )}
                {coevaluado && <Badge variant="info">Coevaluado</Badge>}
              </div>

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDetalle({
                      nombre: m.nombre,
                      nota,
                      usuarioId: m.usuarioId,
                      rolGrupo: m.rolGrupo
                    })
                  }
                >
                  Ver detalles
                </Button>
                <Button
                  size="sm"
                  variant={calif ? 'outline' : 'primary'}
                  onClick={() => onCalificar(m.usuarioId, m.nombre, m.rolGrupo)}
                >
                  {calif ? (
                    <>
                      <EditIcon className="w-4 h-4" /> Editar
                    </>
                  ) : (
                    'Calificar'
                  )}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {detalle && (
        <DetalleCalificacionModal
          grupo={grupo}
          detalle={detalle}
          onCerrar={() => setDetalle(null)}
          onVerAutoevaluacion={onVerAutoevaluacion}
        />
      )}
    </div>
  )
}
