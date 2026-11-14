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