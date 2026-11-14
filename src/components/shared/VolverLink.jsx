import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function VolverLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-sice-green dark:text-emerald-300 font-semibold hover:underline mb-4"
    >
      <ArrowBackIcon className="w-4 h-4" /> Volver
    </button>
  )
}
