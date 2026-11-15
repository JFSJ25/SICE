import toast from 'react-hot-toast'
import { crearRenderToast } from '../components/ui/Notificaciones'

function obtenerMensaje(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return 'Ocurrió un error inesperado.'
}

function mostrarToastInformativo(mensaje, tipo, opciones) {
  return toast.custom(crearRenderToast(mensaje, tipo), opciones)
}

export const notificar = {
  exito(mensaje, opciones) {
    return toast.success(mensaje, opciones)
  },

  error(error, opciones) {
    return toast.error(obtenerMensaje(error), opciones)
  },

  aviso(mensaje, opciones = {}) {
    return mostrarToastInformativo(mensaje, 'aviso', opciones)
  },

  info(mensaje, opciones = {}) {
    return mostrarToastInformativo(mensaje, 'info', opciones)
  },

  promesa(promesa, mensajes, opciones) {
    return toast.promise(promesa, mensajes, opciones)
  },

  cerrar(toastId) {
    toast.dismiss(toastId)
  },

  cerrarTodas() {
    toast.dismiss()
  }
}