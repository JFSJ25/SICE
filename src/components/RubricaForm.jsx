import { puntajeMaximo } from '../lib/rubricas.js'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

function obtenerOpcionSeleccionadaId(seleccionadas, criterioId) {
  if (!seleccionadas) return undefined
  if (seleccionadas instanceof Map) {
    return seleccionadas.get(criterioId)
  }
  return seleccionadas[criterioId] ?? seleccionadas[String(criterioId)]
}

// seleccionadas: Map<criterioId, opcionId> | Object { [criterioId]: opcionId }
// onCambio: (criterioId, opcionId) => void
export default function RubricaForm({
  rubrica,
  seleccionadas,
  onCambio,
  prefijo = '',
  soloLectura = false
}) {
  const max = puntajeMaximo(rubrica)
  const puntajeActual = calcularPuntaje(rubrica, seleccionadas)
  const completo = rubrica.rubrica_categorias.every(cat =>
    cat.rubrica_criterios.every(crit =>
      Boolean(obtenerOpcionSeleccionadaId(seleccionadas, crit.id))
    )
  )

  return (
    <div>
      {rubrica.rubrica_categorias.map(cat => {
        const pesoCat = cat.rubrica_criterios.reduce(
          (a, c) =>
            a + Math.max(...c.rubrica_opciones.map(o => Number(o.puntos)), 0),
          0
        )
        const puntajeCat = cat.rubrica_criterios.reduce((a, c) => {
          const opId = obtenerOpcionSeleccionadaId(seleccionadas, c.id)
          const op = c.rubrica_opciones.find(o => o.id === opId)
          return a + (op ? Number(op.puntos) : 0)
        }, 0)

        return (
          <div key={cat.id} className="mb-6 last:mb-0">
            <div className="flex justify-between items-baseline border-b-2 border-ink dark:border-white/40 pb-1.5 mb-4">
              <h4 className="font-display text-base font-bold">{cat.nombre}</h4>
              <span className="text-xs text-ink-soft font-semibold">
                {soloLectura ? `${puntajeCat} / ${pesoCat} pts` : `${pesoCat} pts`}
              </span>
            </div>

            {cat.rubrica_criterios.map((crit, idx, arr) => {
              const opSeleccionadaId = obtenerOpcionSeleccionadaId(
                seleccionadas,
                crit.id
              )
              const opSeleccionada = crit.rubrica_opciones.find(
                o => o.id === opSeleccionadaId
              )

              return (
                <div
                  key={crit.id}
                  className={`mb-4 pb-4 ${
                    idx < arr.length - 1
                      ? 'border-b border-dashed border-black/10 dark:border-white/10'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <p className="text-sm font-semibold">{crit.nombre}</p>
                    {soloLectura && (
                      <span
                        className={`text-xs font-bold whitespace-nowrap ${
                          opSeleccionada
                            ? 'text-sice-green dark:text-emerald-400'
                            : 'text-ink-soft'
                        }`}
                      >
                        {opSeleccionada ? `${opSeleccionada.puntos} pts` : '—'}
                      </span>
                    )}
                  </div>
                  {crit.observacion && (
                    <p className="text-xs text-ink-soft mb-2.5 leading-relaxed">
                      {crit.observacion}
                    </p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {crit.rubrica_opciones.map(op => {
                      const marcada = opSeleccionadaId === op.id
                      return soloLectura ? (
                        <div
                          key={op.id}
                          className={`
                            flex items-center gap-2.5 p-2.5 rounded-sm border text-sm transition-colors select-none
                            ${
                              marcada
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-sice-green/60 text-ink dark:text-slate-100 font-medium ring-1 ring-sice-green/30'
                                : 'border-black/5 dark:border-white/5 opacity-55 bg-white/40 dark:bg-slate-800/40 text-ink-soft dark:text-slate-400'
                            }
                          `}
                        >
                          {marcada ? (
                            <CheckCircleIcon className="w-4 h-4 text-sice-green dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 flex-shrink-0 inline-block" />
                          )}
                          <span className="flex-1 leading-snug">
                            {op.etiqueta}
                          </span>
                          <span
                            className={`text-xs font-bold flex-shrink-0 pl-2 ${
                              marcada
                                ? 'text-sice-green dark:text-emerald-400'
                                : 'text-ink-soft'
                            }`}
                          >
                            {op.puntos} pts
                          </span>
                        </div>
                      ) : (
                        <label
                          key={op.id}
                          className={`
                            flex items-center gap-2.5 p-2.5 rounded-sm border text-sm cursor-pointer
                            transition-colors
                            ${
                              marcada
                                ? 'bg-sice-green-soft border-sice-green/40'
                                : 'border-black/10 dark:border-white/20 hover:border-gold/60'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={`${prefijo}crit_${crit.id}`}
                            value={op.id}
                            checked={marcada}
                            onChange={() => onCambio && onCambio(crit.id, op.id)}
                            className="mt-0.5 accent-gold flex-shrink-0"
                          />
                          <span className="flex-1 leading-snug">
                            {op.etiqueta}
                          </span>
                          <span
                            className={`text-xs font-bold flex-shrink-0 pl-2 ${
                              marcada ? 'text-sice-green' : 'text-ink-soft'
                            }`}
                          >
                            {op.puntos} pts
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function calcularPuntaje(rubrica, seleccionadas) {
  let total = 0
  rubrica.rubrica_categorias.forEach(cat =>
    cat.rubrica_criterios.forEach(crit => {
      const opcionId = obtenerOpcionSeleccionadaId(seleccionadas, crit.id)
      if (!opcionId) return
      const op = crit.rubrica_opciones.find(o => o.id === opcionId)
      if (op) total += Number(op.puntos)
    })
  )
  return total
}
