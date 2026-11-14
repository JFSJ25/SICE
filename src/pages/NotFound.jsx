import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { ThemeToggle } from '../components/ui/index.jsx'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 bg-gradient">
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>
      <div className="flex flex-col items-center text-center w-full max-w-sm bg-white/95 dark:bg-slate-800 backdrop-blur rounded-2xl shadow-2xl px-8 py-10 page-enter border border-white/20">
        <h1 className="text-7xl font-bold text-sice-green dark:text-emerald-400">
          404
        </h1>

        <h2 className="text-xl font-semibold mt-4">Página no encontrada</h2>

        <p className="text-ink-soft mt-2 max-w-md">
          La página que buscas no existe, fue movida o la dirección ingresada es
          incorrecta.
        </p>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => navigate('/')}>Ir al inicio</Button>

          <Button variant="outline" onClick={() => navigate(-1)}>
            Regresar
          </Button>
        </div>
      </div>
    </div>
  )
}
