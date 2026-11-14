export default function DetalleCalificacion({
  label,
  valor,
  ponderacion = 100,
  className = '',
  textoPendiente = 'Pendiente'
}) {
  return (
    <div className={`flex justify-between items-baseline gap-3 text-sm ${className}`}>
      <span className="text-ink-soft">{label}</span>
      <span className="font-bold">
        {valor !== null && valor !== undefined
          ? `${valor.toFixed(1)} / ${ponderacion}`
          : textoPendiente}
      </span>
    </div>
  )
}
