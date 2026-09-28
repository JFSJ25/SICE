import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { cambiarPasswordPropia } from '../lib/auth.js'
import {
  Aviso,
  Button,
  Campo,
  Eyebrow,
  Input,
  Panel,
  Spinner
} from '../components/ui/index.jsx'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const PASSWORD_MINIMA = 8

export default function Cuenta() {
  const { sesion } = useAuth()
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setExito(false)

    if (passwordNueva.length < PASSWORD_MINIMA) {
      setError(
        `La nueva contraseña debe tener al menos ${PASSWORD_MINIMA} caracteres.`
      )
      return
    }
    if (passwordNueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.')
      return
    }
    if (passwordNueva === passwordActual) {
      setError('La nueva contraseña debe ser diferente de la actual.')
      return
    }

    setProcesando(true)
    try {
      await cambiarPasswordPropia({
        email: sesion.user.email,
        passwordActual,
        passwordNueva
      })
      setPasswordActual('')
      setPasswordNueva('')
      setConfirmacion('')
      setExito(true)
    } catch (e) {
      setError(e.message ?? 'No se pudo cambiar la contraseña.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-7">
        <Eyebrow>Seguridad</Eyebrow>
        <h1>Mi cuenta</h1>
        <p className="text-sm text-ink-soft mt-1">
          Cambia tu contraseña para mantener tu cuenta protegida.
        </p>
      </div>

      <Panel>
        <div className="flex items-center gap-2 mb-5">
          <LockIcon className="w-5 h-5 text-sice-green" />
          <h2 className="text-lg font-display font-bold">Cambiar contraseña</h2>
        </div>

        {exito && (
          <Aviso variant="green">
            <CheckCircleIcon className="w-4 h-4 inline align-text-bottom mr-1" />
            Tu contraseña se actualizó correctamente.
          </Aviso>
        )}
        {error && <Aviso variant="red">{error}</Aviso>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Campo label="Contraseña actual">
            <Input
              type="password"
              value={passwordActual}
              onChange={e => setPasswordActual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Campo>
          <Campo
            label="Nueva contraseña"
            hint={`Mínimo ${PASSWORD_MINIMA} caracteres.`}
          >
            <Input
              type="password"
              value={passwordNueva}
              onChange={e => setPasswordNueva(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MINIMA}
              required
            />
          </Campo>
          <Campo label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmacion}
              onChange={e => setConfirmacion(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MINIMA}
              required
            />
          </Campo>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={procesando}>
              {procesando ? (
                <>
                  <Spinner className="w-4 h-4" /> Actualizando…
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
