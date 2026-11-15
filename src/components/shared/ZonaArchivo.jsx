import { useRef, useState } from 'react'

const EXTENSIONES = ['.xls', '.xlsx', '.csv']

export default function ZonaArchivo({ archivo, onArchivo, onRechazado }) {
  const inputRef = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)

  function procesar(archivos) {
    const lista = [...archivos]
    if (lista.length === 0) return

    if (lista.length > 1) {
      onRechazado('Sube un solo archivo a la vez.')
      return
    }
    const [f] = lista
    const valido = EXTENSIONES.some(ext => f.name.toLowerCase().endsWith(ext))
    if (!valido) {
      onRechazado('El archivo debe ser Excel (.xls, .xlsx) o CSV.')
      return
    }
    onArchivo(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setArrastrando(false)
    procesar(e.dataTransfer.files)
  }

  function handleDragLeave(e) {
    // Evita el parpadeo al pasar sobre elementos hijos
    if (!e.currentTarget.contains(e.relatedTarget)) setArrastrando(false)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={e => {
        e.preventDefault()
        setArrastrando(true)
      }}
      onDragOver={e => e.preventDefault()} // obligatorio para que 'drop' se dispare
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-sm border-2 border-dashed p-8 text-center text-sm transition-colors
        ${
          arrastrando
            ? 'border-sice-green bg-sice-green/5 text-ink'
            : 'border-black/20 text-ink-soft hover:bg-surface'
        }`}
    >
      {archivo ? (
        <>
          <strong className="text-ink">{archivo.name}</strong>
          <p className="text-xs mt-1">
            Haz clic o arrastra otro para reemplazarlo
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold">Arrastra tu Excel o CSV aquí</p>
          <p className="text-xs mt-1">o haz clic para seleccionarlo</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        onChange={e => {
          procesar(e.target.files)
          e.target.value = '' // permite volver a elegir el mismo archivo
        }}
      />
    </div>
  )
}
