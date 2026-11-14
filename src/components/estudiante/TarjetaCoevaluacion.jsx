import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import RateReviewIcon from '@mui/icons-material/RateReview'
import { Button } from '../ui/index.jsx'

export default function TarjetaCoevaluacion({ grupo, realizada, onCoevaluar }) {
  const integrantes = grupo.miembros.map(m => m.nombre).join(', ')

  return (
    <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-5 flex flex-col h-full">
      <p className="text-[11px] font-bold text-sice-green dark:text-emerald-300 mb-1">
        Grupo {grupo.numero}
      </p>
      <h3 className="text-base mb-3 leading-snug">{grupo.tema}</h3>
      <p className="text-xs text-ink-soft mb-1">
        <strong>Integrantes:</strong> {integrantes || '—'}
      </p>
      <div className="mt-auto pt-3">
        {realizada ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sice-green-soft text-sice-green dark:text-emerald-300">
            <CheckCircleIcon className="w-4 h-4" /> Ya coevaluado
          </span>
        ) : !grupo.coevaluacionHabilitada ? (
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-ink-soft dark:bg-slate-800 dark:text-slate-300 w-fit">
              <LockIcon className="w-3.5 h-3.5 text-ink-soft" /> No disponible
            </span>
            <p className="text-[11px] text-ink-soft">
              El docente habilitará este grupo cuando finalice su exposición.
            </p>
          </div>
        ) : (
          <Button className="w-full" onClick={onCoevaluar}>
            <RateReviewIcon className="w-4 h-4" /> Coevaluar este grupo
          </Button>
        )}
      </div>
    </div>
  )
}
