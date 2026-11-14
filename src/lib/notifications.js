import { createElement } from 'react'
import toast from 'react-hot-toast'
import WarningIcon from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// import CloseIcon from '@mui/icons-material/Close'

function obtenerMensaje(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return 'Ocurrió un error inesperado.'
}

function ToastInformativo({ toastActual, mensaje, Icono, color }) {
  return createElement(
    'div',
    {
      role: 'status',
      className:
        'flex items-center gap-3 rounded-sm border bg-white px-4 py-3 text-sm text-ink shadow-lg dark:bg-slate-800 dark:text-slate-100',
      // style: { borderColor: color }
    },
    createElement(Icono, {
      className: 'h-5 w-5 shrink-0',
      style: { color }
    }),
    createElement(
      'span',
      { className: 'flex-1 leading-relaxed' },
      mensaje
    ),
    // createElement(
    //   'button',
    //   {
    //     type: 'button',
    //     'aria-label': 'Cerrar notificación',
    //     onClick: () => toast.dismiss(toastActual.id),
    //     className:
    //       'rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100'
    //   },
      // createElement(CloseIcon, { className: 'h-4 w-4' })
    // )
  )
}

function mostrarToastInformativo(mensaje, Icono, opciones) {
  const color = Icono === WarningIcon ? '#b7791f' : '#2563a8'

  return toast.custom(
    toastActual =>
      createElement(ToastInformativo, {
        toastActual,
        mensaje,
        Icono,
        color
      }),
    opciones
  )
}

export const notificar = {
  exito(mensaje, opciones) {
    return toast.success(mensaje, opciones)
  },

  error(error, opciones) {
    return toast.error(obtenerMensaje(error), opciones)
  },

  aviso(mensaje, opciones = {}) {
    return mostrarToastInformativo(
      mensaje,
      WarningIcon,
      opciones
    )
  },

  info(mensaje, opciones = {}) {
    return mostrarToastInformativo(
      mensaje,
      InfoOutlinedIcon,
      opciones
    )
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
