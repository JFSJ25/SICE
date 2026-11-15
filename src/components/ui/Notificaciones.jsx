import { Toaster } from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext.jsx'

export function NotificacionesToast() {
  const { tema } = useTheme()
  const esOscuro = tema === 'dark'

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: esOscuro ? '#18263d' : '#ffffff',
          color: esOscuro ? '#e5edf8' : '#12213a',
          border: `1px solid ${
            esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(18,33,58,0.1)'
          }`,
          boxShadow: '0 12px 28px rgba(18, 33, 58, 0.16)',
          fontSize: '0.875rem',
          maxWidth: 'min(420px, calc(100vw - 2rem))'
        },
        success: {
          iconTheme: {
            primary: esOscuro ? '#34D37B' : '#0F766E',
            secondary: esOscuro ? '#18263d' : '#ffffff'
          }
        },
        error: {
          iconTheme: {
            primary: esOscuro ? '#F87171' : '#9B2E24',
            secondary: esOscuro ? '#18263d' : '#ffffff'
          }
        }
      }}
    />
  )
}

import WarningIcon from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// import CloseIcon from '@mui/icons-material/Close'

const TIPOS = {
  aviso: { Icono: WarningIcon, color: '#b7791f' },
  info: { Icono: InfoOutlinedIcon, color: '#2563a8' }
}

function ToastInformativo({ mensaje, tipo = 'info' /*, toastId */ }) {
  const { Icono, color } = TIPOS[tipo] ?? TIPOS.info

  return (
    <div
      role="status"
      className="flex items-center toast"
    >
      <Icono className="h-5 w-5 shrink-0" style={{ color }} />
      <span className="flex-1">{mensaje}</span>

      {/*
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => toast.dismiss(toastId)}
        className="rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      */}
    </div>
  )
}

// Devuelve la función que `toast.custom` espera: recibe el toast y retorna el elemento.
export function crearRenderToast(mensaje, tipo) {
  return toastActual => (
    <ToastInformativo
      mensaje={mensaje}
      tipo={tipo}
      toastId={toastActual.id}
    />
  )
}