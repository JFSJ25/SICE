import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, onSupabaseReset } from '../lib/supabase.js'
import { obtenerPerfil } from '../lib/auth.js'

const AuthContext = createContext(null)

function esTokenExpirado(error) {
  const mensaje = String(error?.message ?? '').toLowerCase()
  return (
    error?.code === 'PGRST301' ||
    /jwt.*expired|token.*expired|expired.*jwt/.test(mensaje)
  )
}

async function cerrarSesionLocal(mensaje) {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) console.error(mensaje, error)
  } catch (error) {
    console.error(mensaje, error)
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(undefined) // undefined = cargando
  const [perfil, setPerfil] = useState(null)
  const [perfilCargando, setPerfilCargando] = useState(false)
  const [cliente, setCliente] = useState(supabase) // ← cliente actual
  const uidRef = useRef(null) // ← faltaba

  // 1) Sesión inicial: solo una vez
  useEffect(() => {
    let activo = true
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error
        if (!activo) return

        setSesion(data.session)
        if (data.session) {
          uidRef.current = data.session.user.id
          setPerfilCargando(true)
          cargarPerfil(data.session.user.id)
        } else {
          setPerfil(null)
          uidRef.current = null
          setPerfilCargando(false)
        }
      })
      .catch(async error => {
        console.error('Error al recuperar la sesión', error)
        if (!activo) return

        uidRef.current = null
        setSesion(null)
        setPerfil(null)
        setPerfilCargando(false)
        await cerrarSesionLocal('Error al limpiar la sesión inválida')
      })

    return () => {
      activo = false
    }
  }, [])

  // 2) Si el watchdog recrea el cliente, guardarlo para re-suscribirse
  useEffect(() => onSupabaseReset(nuevo => setCliente(nuevo)), [])

  // 3) Listener de auth: se re-suscribe cuando cambia el cliente
  useEffect(() => {
    const { data: listener } = cliente.auth.onAuthStateChange(
      (evento, nuevaSesion) => {
        if (evento === 'TOKEN_REFRESHED') return

        if (!nuevaSesion) {
          uidRef.current = null
          setSesion(null)
          setPerfil(null)
          setPerfilCargando(false)
          return
        }

        const uid = nuevaSesion.user.id

        // Misma sesión (ej. SIGNED_IN al volver a la pestaña): conservar referencia
        setSesion(prev =>
          prev?.user?.id === uid &&
          prev.access_token === nuevaSesion.access_token
            ? prev
            : nuevaSesion
        )

        if (evento === 'SIGNED_IN' && uid !== uidRef.current) {
          // Login real o cambio de usuario
          uidRef.current = uid
          setPerfilCargando(true)
          setTimeout(() => cargarPerfil(uid), 0) // fuera del callback de auth
        } else if (evento === 'USER_UPDATED') {
          setTimeout(() => cargarPerfil(uid), 0) // recarga silenciosa
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [cliente])

  async function cargarPerfil(uid) {
    try {
      const p = await obtenerPerfil(uid)
      // Conservar la referencia si no cambió nada
      setPerfil(prev =>
        prev && JSON.stringify(prev) === JSON.stringify(p) ? prev : p
      )
    } catch (error) {
      console.error('Error al obtener el perfil de usuario', error)
      setPerfil(null)
      if (esTokenExpirado(error)) {
        uidRef.current = null
        setSesion(null)
        await cerrarSesionLocal('Error al cerrar la sesión expirada')
      }
    } finally {
      setPerfilCargando(false)
    }
  }

  const cargando = sesion === undefined || perfilCargando

  return (
    <AuthContext.Provider value={{ sesion, perfil, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
