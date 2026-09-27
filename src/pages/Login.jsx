import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { iniciarSesion } from '../lib/auth.js'
import { Button, Campo, Input, Spinner } from '../components/ui/index.jsx'
import LoginIcon from '@mui/icons-material/Login'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error: err } = await iniciarSesion(email.trim(), password)
    setCargando(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          'radial-gradient(ellipse at 8% 12%, rgba(37,99,235,0.42) 0%, transparent 48%), radial-gradient(ellipse at 92% 88%, rgba(15,118,110,0.28) 0%, transparent 45%), #0B1930'
      }}
    >
      <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-2xl px-8 py-10 page-enter border border-white/20">
        {/* Marca */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-sidebar flex items-center justify-center font-display font-bold text-gold-dim text-xl flex-shrink-0">
            S
          </div>
          <div>
            <p className="font-display font-bold text-ink text-lg leading-tight">
              SICE
            </p>
            <p className="text-xs text-ink-soft leading-tight">
              Sistema de Calificación de Exposiciones
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-sice-red-soft border border-sice-red/20 text-sice-red rounded-sm px-3.5 py-2.5 text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Campo label="Correo institucional">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre.apellido@utmach.edu.ec"
              autoComplete="username"
              required
            />
          </Campo>

          <Campo label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Campo>

          <Button type="submit" className="w-full mt-2" disabled={cargando}>
            {cargando ? (
              <>
                <Spinner className="w-4 h-4" /> Ingresando…
              </>
            ) : (
              <>
                <LoginIcon className="w-4 h-4" /> Ingresar
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          UTMACH · Plataformas de Hardware · Redes Eléctricas · Sistemas
          Digitales
        </p>
      </div>
    </div>
  )
}
