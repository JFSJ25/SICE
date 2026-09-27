import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { obtenerPerfil } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(undefined) // undefined = cargando
  const [perfil, setPerfil] = useState(null)
  const [perfilCargando, setPerfilCargando] = useState(false)

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      if (data.session) {
        setPerfilCargando(true)
        cargarPerfil(data.session.user.id)
      } else {
        setPerfilCargando(false)
      }
    })

    // Escucha cambios de sesión (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (evento, nuevaSesion) => {
        if (evento === 'TOKEN_REFRESHED') return

        setSesion(nuevaSesion)

        if (!nuevaSesion) {
          setPerfil(null)
          setPerfilCargando(false)
          return
        }

        // Renovar el token no requiere volver a cargar el perfil.
        if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') {
          setPerfilCargando(true)
          cargarPerfil(nuevaSesion.user.id)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function cargarPerfil(uid) {
    try {
      const p = await obtenerPerfil(uid)
      setPerfil(p)
    } catch (error) {
      console.error('Error al obtener el perfil de usuario', {
        usuarioId: uid,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      })
      setPerfil(null)
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
