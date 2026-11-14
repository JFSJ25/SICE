import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import { Button } from '../ui/index.jsx'
import DetalleCalificacion from '../shared/DetalleCalificacion.jsx'

export default function DetalleCalificacionModal({
  grupo,
  onCerrar,
  detalle,
  onVerAutoevaluacion
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      role="presentation"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`detalles-${grupo.id}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-sice-green dark:text-emerald-400">
              Grupo {grupo.numero}
            </p>
            <h3 id={`detalles-${grupo.id}`} className="text-lg">
              Detalles de {detalle.nombre}
            </h3>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCerrar}
            aria-label="Cerrar detalles"
          >
            <CloseIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <DetalleCalificacion
            label="Calificación docente (70%)"
            valor={detalle.nota?.docente * 0.7}
            ponderacion={70}
          />

          <DetalleCalificacion
            label="Promedio coevaluación (30%)"
            valor={detalle.nota?.coevaluacion * 0.3}
            ponderacion={30}
          />

          <div className="pt-3 mt-2 border-t border-black/10 dark:border-white/15">
            <DetalleCalificacion
              label="Nota final"
              valor={detalle.nota?.final}
            />
          </div>

          <div className="pt-3 mt-2">
            <DetalleCalificacion
              label="Nota autoevaluación"
              valor={detalle.nota?.autoevaluacion}
            />
          </div>

          <Button
            className="w-full mt-2"
            variant="outline"
            onClick={() =>
              onVerAutoevaluacion(
                detalle.usuarioId,
                detalle.nombre,
                detalle.rolGrupo
              )
            }
          >
            Ver autoevaluación
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
