import CheckIcon from '@mui/icons-material/Check'

export default function IndicadorPasos({
  pasos,
  pasoActual,
  puedeNavegar,
  onSeleccionar
}) {
  return (
    <div className="flex flex-wrap items-center gap-y-2 mb-8">
      {pasos.map((nombre, indice) => (
        <div key={nombre} className="flex items-center">
          <button
            type="button"
            onClick={() => onSeleccionar(indice)}
            disabled={!puedeNavegar(indice)}
            className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors
              ${
                indice < pasoActual
                  ? 'bg-sice-green dark:bg-emerald-500 border-sice-green dark:border-emerald-500 text-white'
                  : indice === pasoActual
                    ? 'bg-gold border-gold text-white'
                    : 'bg-surface dark:bg-slate-800 border-black/20 dark:border-white/20 text-ink-soft'
              }
              ${!puedeNavegar(indice) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            {indice < pasoActual ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              indice + 1
            )}
          </button>
          <button
            type="button"
            onClick={() => onSeleccionar(indice)}
            disabled={!puedeNavegar(indice)}
            className={`ml-2 text-sm font-medium ${
              indice === pasoActual ? 'text-ink' : 'text-ink-soft'
            } border-0 bg-transparent p-0 ${
              !puedeNavegar(indice)
                ? 'cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {nombre}
          </button>
          {indice < pasos.length - 1 && (
            <div
              className={`
                mx-2 md:mx-4 h-px w-6 md:w-16
                ${
                  indice < pasoActual
                    ? 'bg-sice-green dark:bg-emerald-500'
                    : 'bg-black/15 dark:bg-white/20'
                }
              `}
            />
          )}
        </div>
      ))}
    </div>
  )
}
