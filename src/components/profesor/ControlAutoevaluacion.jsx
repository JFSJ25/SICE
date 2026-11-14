import { Button } from '../ui/index.jsx'

export default function ControlAutoevaluacion({
  habilitada,
  guardando,
  onCambiar
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-surface rounded-DEFAULT border border-black/10 dark:border-white/10">
      <div>
        <p className="text-xs font-semibold text-ink-soft">
          Autoevaluación del estudiante
        </p>
      </div>
      <Button
        size="sm"
        variant={habilitada ? 'outline' : 'primary'}
        onClick={onCambiar}
        disabled={guardando}
      >
        {guardando
          ? 'Guardando…'
          : habilitada
            ? 'Cerrar autoevaluación'
            : 'Habilitar autoevaluación'}
      </Button>
    </div>
  )
}
