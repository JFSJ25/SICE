import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

const UMBRAL_SCROLL = 400

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const [mostrarBoton, setMostrarBoton] = useState(false)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  }, [pathname])

  useEffect(() => {
    function actualizarVisibilidad() {
      setMostrarBoton(window.scrollY > UMBRAL_SCROLL)
    }

    actualizarVisibilidad()
    window.addEventListener('scroll', actualizarVisibilidad, { passive: true })

    return () => window.removeEventListener('scroll', actualizarVisibilidad)
  }, [])

  function volverArriba() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }

  if (!mostrarBoton) return null

  return (
    <button
      type="button"
      onClick={volverArriba}
      aria-label="Volver arriba"
      className="fixed bottom-5 right-5 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-gold text-white shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 dark:focus:ring-offset-[#0b1424]"
    >
      <KeyboardArrowUpIcon />
    </button>
  )
}
