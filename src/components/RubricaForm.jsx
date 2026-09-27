import { puntajeMaximo } from '../lib/rubricas.js'

// seleccionadas: Map<criterioId, opcionId>
// onCambio: (criterioId, opcionId) => void
export default function RubricaForm({ rubrica, seleccionadas, onCambio, prefijo = '' }) {
  const max = puntajeMaximo(rubrica)
  const puntajeActual = calcularPuntaje(rubrica, seleccionadas)
  const completo = rubrica.rubrica_categorias.every(cat =>
    cat.rubrica_criterios.every(crit => seleccionadas.has(crit.id))
  )

  return (
    <div>
      {rubrica.rubrica_categorias.map(cat => {
        const pesoCat = cat.rubrica_criterios.reduce(
          (a, c) => a + Math.max(...c.rubrica_opciones.map(o => Number(o.puntos))), 0
        )
        return (
          <div key={cat.id} className="mb-6">
            <div className="flex justify-between items-baseline border-b-2 border-ink pb-1.5 mb-4">
              <h4 className="font-display text-base font-bold">{cat.nombre}</h4>
              <span className="text-xs text-ink-soft font-semibold">{pesoCat} pts</span>
            </div>

            {cat.rubrica_criterios.map((crit, idx, arr) => (
              <div
                key={crit.id}
                className={`mb-4 pb-4 ${idx < arr.length - 1 ? 'border-b border-dashed border-black/10' : ''}`}
              >
                <p className="text-sm font-semibold mb-1">{crit.nombre}</p>
                {crit.observacion && (
                  <p className="text-xs text-ink-soft mb-2.5 leading-relaxed">{crit.observacion}</p>
                )}
                <div className="flex flex-col gap-1.5">
                  {crit.rubrica_opciones.map(op => {
                    const marcada = seleccionadas.get(crit.id) === op.id
                    return (
                      <label
                        key={op.id}
                        className={`
                          flex items-start gap-2.5 p-2.5 rounded-sm border text-sm cursor-pointer
                          transition-colors
                          ${marcada
                            ? 'bg-sice-green-soft border-sice-green/40'
                            : 'border-black/10 hover:border-gold/60'}
                        `}
                      >
                        <input
                          type="radio"
                          name={`${prefijo}crit_${crit.id}`}
                          value={op.id}
                          checked={marcada}
                          onChange={() => onCambio(crit.id, op.id)}
                          className="mt-0.5 accent-gold flex-shrink-0"
                        />
                        <span className="flex-1 leading-snug">{op.etiqueta}</span>
                        <span className={`text-xs font-bold flex-shrink-0 pl-2 ${marcada ? 'text-sice-green' : 'text-ink-soft'}`}>
                          {op.puntos} pts
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Barra de puntaje sticky */}
      {/* <div className="sticky bottom-0 bg-sidebar rounded-sm px-5 py-3.5 flex justify-between items-center gap-4 mt-4 shadow-md flex-wrap">
        <div>
          <span className="font-display text-2xl font-bold text-gold-dim">{puntajeActual}</span>
          <span className="text-white/45 text-xs ml-1">/ {max} pts{!completo ? ' · faltan criterios' : ''}</span>
        </div>
      </div> */}
    </div>
  )
}

export function calcularPuntaje(rubrica, seleccionadas) {
  let total = 0
  rubrica.rubrica_categorias.forEach(cat =>
    cat.rubrica_criterios.forEach(crit => {
      const opcionId = seleccionadas.get(crit.id)
      if (!opcionId) return
      const op = crit.rubrica_opciones.find(o => o.id === opcionId)
      if (op) total += Number(op.puntos)
    })
  )
  return total
}
