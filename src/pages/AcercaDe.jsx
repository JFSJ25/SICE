import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CodeIcon from '@mui/icons-material/Code'
import GroupsIcon from '@mui/icons-material/Groups'
import GavelIcon from '@mui/icons-material/Gavel'
import { Eyebrow, Panel } from '../components/ui/index.jsx'

const equipo = [
  {
    nombre: 'Juan Fernando Sánchez Jumbo',
    rol: 'Desarrollador / Diseñador',
    descripcion: 'Responsable principal del desarrollo y diseño.',
    Icon: CodeIcon
  },
  {
    nombre: 'Jaime Alberto García Troya',
    rol: 'Tester / Analista',
    descripcion: 'Pruebas y análisis de requerimientos.',
    Icon: GroupsIcon
  },
  {
    nombre: 'Ing. Eléc. Johnny Novillo Vicuña',
    rol: 'Docente',
    descripcion: 'Solicitó el programa.',
    Icon: GavelIcon
  }
]

const tecnologias = [
  'React',
  'Vite',
  'Tailwind CSS',
  'Supabase',
  'React Router',
  'Material UI Icons'
]

export default function AcercaDe() {
  return (
    <div className="max-w-4xl">
      <div className="mb-7">
        <Eyebrow>Información del sistema</Eyebrow>
        <h1>Acerca de SICE</h1>
        <p className="text-sm text-ink-soft mt-1">
          Sistema de Calificación de Exposiciones · Versión 1.0.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <InfoOutlinedIcon className="w-5 h-5 text-sice-green" />
            <h2 className="text-lg">Sobre la aplicación</h2>
          </div>
          <p className="text-sm text-ink-mid leading-relaxed">
            SICE es una aplicación para registrar y calificar exposiciones
            académicas, organizando la información necesaria para su evaluación.
          </p>
        </Panel>

        <Panel>
          <h2 className="text-lg mb-3">Propósito del proyecto</h2>
          <p className="text-sm text-ink-mid leading-relaxed">
            El proyecto fue desarrollado para atender una necesidad académica
            relacionada con el registro y la evaluación de exposiciones.
          </p>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-lg mb-4">Equipo de desarrollo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {equipo.map(({ nombre, rol, descripcion, Icon }) => (
            <div
              key={rol}
              className="border border-blue-900/[0.09] rounded-sm p-4 bg-surface"
            >
              <Icon className="w-5 h-5 text-sice-green mb-3" />
              <p className="text-sm font-semibold text-ink">{rol}</p>
              <p className="text-xs text-ink-soft leading-relaxed mt-1">
                {descripcion}
              </p>
              <p className="text-xs text-ink-soft/70 mt-3">{nombre}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <h2 className="text-lg mb-3">Tecnologías</h2>
          <ul className="grid grid-cols-2 gap-2">
            {tecnologias.map(tecnologia => (
              <li
                key={tecnologia}
                className="text-sm text-ink-mid bg-surface border border-blue-900/[0.09] rounded-sm px-3 py-2"
              >
                {tecnologia}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="text-lg mb-3">Licencia</h2>
          <p className="text-sm font-semibold text-ink mb-1">MIT License</p>
          <p className="text-sm text-ink-mid leading-relaxed">
            SICE se distribuye bajo la licencia MIT, que permite usar, copiar,
            modificar y distribuir el software respetando sus condiciones.
          </p>
        </Panel>
      </div>

      <footer className="text-center text-xs text-ink-soft py-3">
        SICE · Versión 1.0.0 · © 2026
      </footer>
    </div>
  )
}
