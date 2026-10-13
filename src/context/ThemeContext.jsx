import { createContext, useContext, useEffect, useState } from 'react'

const CLAVE_TEMA = 'sice-tema'
const ThemeContext = createContext(null)

function obtenerTemaInicial() {
  if (typeof window === 'undefined') return 'light'
  const guardado = window.localStorage.getItem(CLAVE_TEMA)
  if (guardado === 'dark' || guardado === 'light') return guardado
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(obtenerTemaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    document.documentElement.style.colorScheme = tema
    window.localStorage.setItem(CLAVE_TEMA, tema)
  }, [tema])

  function alternarTema() {
    setTema(actual => (actual === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
