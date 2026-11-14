import { Badge, Button, Panel, Select } from '../ui/index.jsx'

export default function TarjetaAsignacionGrupo({
  grupo,
  borrador,
  abierta,
  soyMiembro,
  guardando,
  onActualizar,
  onGuardar
}) {
  return (
    <Panel className="flex flex-col h-full">
      <p className="text-[11px] font-bold text-sice-green dark:text-emerald-300 mb-1">
        Grupo {grupo.numero}
      </p>
      <h3 className="text-base mb-3 leading-snug">{grupo.tema}</h3>
      <ul className="flex flex-col gap-1.5 mb-4">
        {grupo.miembros.map(m => (
          <li
            key={m.usuarioId}
            className="flex items-center gap-2 bg-surface rounded-sm px-3 py-2"
          >
            <span className="flex-1 text-sm">{m.nombre}</span>
            <Badge variant={m.rolGrupo === 'evaluador' ? 'ok' : 'info'}>
              {m.rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}
            </Badge>
            {m.lider && <Badge variant="pending">Líder</Badge>}
          </li>
        ))}
        {grupo.miembros.length === 0 && (
          <li className="text-sm text-ink-soft">Aún no hay integrantes.</li>
        )}
      </ul>

      {abierta && (
        <div className="border-t border-black/10 pt-3 mt-auto">
          {soyMiembro && (
            <p className="text-xs text-ink-soft mb-2">
              Puedes modificar tu rol o cambiarte a otro grupo.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs text-ink-soft">
              {/* <span className="block mb-1">Tu rol: </span> */}
              <Select
                value={borrador.rol}
                onChange={e => onActualizar({ rol: e.target.value })}
                className="text-xs"
              >
                <option value="expositor">Expositor</option>
                <option value="evaluador">Evaluador</option>
              </Select>
            </label>
            <label className="flex items-center gap-1 text-xs text-ink-mid">
              <input
                type="checkbox"
                checked={borrador.lider}
                onChange={e => onActualizar({ lider: e.target.checked })}
                className="accent-gold"
              />
              Ser líder
            </label>
            <Button size="sm" onClick={onGuardar} disabled={guardando}>
              {guardando
                ? 'Guardando…'
                : soyMiembro
                  ? 'Guardar cambios'
                  : 'Unirme a este grupo'}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
