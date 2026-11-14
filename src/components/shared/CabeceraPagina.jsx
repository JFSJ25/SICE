import { Eyebrow } from '../ui/index.jsx'

export default function CabeceraPagina({
  eyebrow,
  titulo,
  descripcion,
  children
}) {
  return (
    <div className="mb-7">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{titulo}</h1>
      {descripcion && (
        <p className="text-sm text-ink-soft mt-1">{descripcion}</p>
      )}
      {children}
    </div>
  )
}
