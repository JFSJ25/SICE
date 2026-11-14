import { createPortal } from 'react-dom'
import SaveIcon from '@mui/icons-material/Save'
import UndoIcon from '@mui/icons-material/Undo'
import { Badge, Button, Spinner } from '../ui/index.jsx'

export default function ControlCoevaluacion({
  totalGrupos,
  totalHabilitados,
  hayCambios,
  guardando,
  onToggleTodas,
  onDescartar,
  onGuardar
}) {
  const todasHabilitadas = totalHabilitados === totalGrupos

  return (
    <>
      <div className="md:sticky md:top-0 md:z-30 flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-surface rounded-DEFAULT border border-black/10 dark:border-white/10 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-soft">
            Habilitación de coevaluación:
          </span>
          <Badge variant={totalHabilitados > 0 ? 'ok' : 'pending'}>
            {totalHabilitados} de {totalGrupos} habilitados
          </Badge>
          {hayCambios && (
            <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-sice-amber-soft text-sice-amber dark:text-amber-200 border border-sice-amber/30">
              Cambios pendientes
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleTodas(!todasHabilitadas)}
            disabled={guardando}
            title={
              todasHabilitadas
                ? 'Desmarcar todos los grupos'
                : 'Marcar todos los grupos para coevaluar'
            }
          >
            {todasHabilitadas ? 'Desmarcar todas' : 'Habilitar todas'}
          </Button>

          {hayCambios && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDescartar}
              disabled={guardando}
              title="Descartar cambios no guardados"
            >
              <UndoIcon className="w-4 h-4" /> Descartar
            </Button>
          )}

          <Button
            size="sm"
            variant={hayCambios ? 'primary' : 'outline'}
            onClick={onGuardar}
            disabled={!hayCambios || guardando}
            title="Guardar estado de coevaluación en la base de datos"
          >
            {guardando ? (
              <>
                <Spinner className="w-4 h-4" /> Guardando…
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" /> Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {hayCambios &&
        createPortal(
          <div className="md:hidden fixed inset-x-0 bottom-1 z-50 flex justify-center px-3 pointer-events-none">
            <div className="pointer-events-auto bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 animate-fade-in">
              <span className="text-xs font-medium text-white/90">
                Cambios sin guardar
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-xs py-1 px-2.5"
                  onClick={onDescartar}
                  disabled={guardando}
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs py-1 px-3"
                  onClick={onGuardar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <Spinner className="w-3.5 h-3.5" /> Guardando…
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-3.5 h-3.5" /> Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
