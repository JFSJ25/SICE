import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Aviso, Button } from '../ui/index.jsx'

export default function ResultadoPassword({ resultado, copiada, onCopiar }) {
  return (
    <Aviso variant="green">
      <div className="flex items-start gap-2">
        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">
            Contraseña temporal creada para {resultado.estudiante.nombre_completo}.
          </p>
          <p className="text-xs mt-1">
            Entrégala al estudiante. Solo se mostrará mientras esta pantalla
            permanezca abierta.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <code className="bg-white/70 border dark:bg-sidebar border-sice-green/20 rounded-sm px-3 py-2 font-mono text-sm font-bold tracking-wide">
              {resultado.password_temporal}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopiar}
            >
              <ContentCopyIcon className="w-4 h-4" />
              {copiada ? 'Copiada' : 'Copiar'}
            </Button>
          </div>
        </div>
      </div>
    </Aviso>
  )
}
