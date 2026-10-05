import { useEffect, useState } from 'react'
import {
  obtenerEstudiantesSinGrupo,
  obtenerGruposBase,
  obtenerHemisemestres,
  crearGrupo,
  eliminarGrupo,
  agregarIntegranteGrupo,
  moverIntegrante,
  actualizarTemaGrupo,
  actualizarRolesGrupo
} from '../../../lib/data.js'
import {
  Panel,
  Button,
  Aviso,
  Spinner,
  Input,
  Select,
  Badge
} from '../../../components/ui/index.jsx'
import { SelectorParalelo } from './StepParalelo.jsx'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'

export default function StepGrupos({
  paraleloId,
  paralelos,
  hemisemestres,
  onParaleloSeleccionado,
  onRetroceder
}) {
  const [sinGrupo, setSinGrupo] = useState([])
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modoEditar, setModoEditar] = useState(null) // grupoId del grupo en edición de tema
  const [modoEditarRoles, setModoEditarRoles] = useState(null)
  const [modoMover, setModoMover] = useState(null) // { usuarioId, grupoOrigenId }
  const [modoAgregar, setModoAgregar] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const paraleloActual = paralelos.find(
    p => (p.id ?? p.paraleloId) === paraleloId
  )
  const catalogoFijo = [
    'Sistemas Digitales',
    'Plataformas de Hardware'
  ].includes(paraleloActual?.materiaNombre)

  useEffect(() => {
    cargar()
  }, [paraleloId])

  useEffect(() => {
    if (!modoEdicion) {
      setModoEditar(null)
      setModoEditarRoles(null)
      setModoMover(null)
      setModoAgregar(null)
    }
  }, [modoEdicion])

  async function seleccionarParalelo(id) {
    try {
      const nuevosHemisemestres = await obtenerHemisemestres(id)
      onParaleloSeleccionado({
        paraleloId: id,
        hemisemestres: nuevosHemisemestres
      })
    } catch (e) {
      setError(e.message)
    }
  }

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const [sg, gs] = await Promise.all([
        obtenerEstudiantesSinGrupo(paraleloId),
        obtenerGruposBase(paraleloId)
      ])
      setSinGrupo(sg)
      setGrupos(gs)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargando)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="text-ink-soft" />
      </div>
    )

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <SelectorParalelo
          paralelos={paralelos}
          value={paraleloId}
          onChange={seleccionarParalelo}
        />
      </Panel>

      {error && <Aviso variant="red">{error}</Aviso>}

      {/* Builder: crear nuevo grupo */}
      {!catalogoFijo && sinGrupo.length > 0 && (
        <BuilderNuevoGrupo
          sinGrupo={sinGrupo}
          siguienteNumero={grupos.length + 1}
          paraleloId={paraleloId}
          hemisemestres={hemisemestres}
          onCreado={cargar}
          onError={setError}
        />
      )}

      {catalogoFijo && (
        <Aviso>
          Este paralelo usa siete grupos y temas fijos. Los estudiantes
          realizan su propia asignación desde «Mi grupo» mientras la etapa esté
          abierta.
        </Aviso>
      )}

      {sinGrupo.length === 0 && grupos.length > 0 && (
        <Aviso variant="green">
          Todos los estudiantes matriculados están asignados a un grupo.
        </Aviso>
      )}
      {sinGrupo.length > 0 && grupos.length > 0 && (
        <Aviso variant="amber">
          Hay {sinGrupo.length} estudiante
          {sinGrupo.length === 1 ? '' : 's'} matriculado
          {sinGrupo.length === 1 ? '' : 's'} sin grupo. Debe
          {sinGrupo.length === 1 ? '' : 'n'} ingresar a un grupo antes de
          finalizar la asignación.
        </Aviso>
      )}

      {/* Lista de grupos existentes */}
      {grupos.length > 0 && (
        <div>
          <div className="sticky top-[2.5rem] md:top-0 z-30 -mx-5 px-5 py-3 mb-3 border-b border-black/[0.08] bg-[#f8fafd]/95 backdrop-blur-sm sm:-mx-10 sm:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3>Grupos creados</h3>
              <label className="inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer text-sm font-semibold text-ink-mid">
                <input
                  type="checkbox"
                  checked={modoEdicion}
                  onChange={e => setModoEdicion(e.target.checked)}
                  className="w-4 h-4 accent-gold"
                />
                Modo edición
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {grupos.map(g => (
              <TarjetaGrupo
                key={g.id}
                grupo={g}
                grupos={grupos}
                estudiantesDisponibles={sinGrupo}
                hemisemestres={hemisemestres}
                modoEditar={modoEditar === g.id}
                modoEditarRoles={modoEditarRoles === g.id}
                modoAgregar={modoAgregar === g.id}
                modoMover={modoMover?.grupoOrigenId === g.id ? modoMover : null}
                modoEdicion={modoEdicion}
                catalogoFijo={catalogoFijo}
                onEditarTema={() => setModoEditar(g.id)}
                onCerrarEditar={() => setModoEditar(null)}
                onEditarRoles={() => setModoEditarRoles(g.id)}
                onCerrarEditarRoles={() => setModoEditarRoles(null)}
                onIniciarAgregar={() => setModoAgregar(g.id)}
                onCerrarAgregar={() => setModoAgregar(null)}
                onDeshacer={async () => {
                  try {
                    await eliminarGrupo(g.id)
                    await cargar()
                  } catch (e) {
                    setError(e.message)
                  }
                }}
                onAgregar={async (usuarioId, rolGrupo) => {
                  try {
                    await agregarIntegranteGrupo({
                      grupoId: g.id,
                      usuarioId,
                      rolGrupo
                    })
                    setModoAgregar(null)
                    await cargar()
                  } catch (e) {
                    setError(e.message)
                  }
                }}
                onIniciarMover={usuarioId =>
                  setModoMover({ usuarioId, grupoOrigenId: g.id })
                }
                onCancelarMover={() => setModoMover(null)}
                onMoverA={async (
                  grupoDestinoId,
                  rolGrupo,
                  nuevoLiderOrigenId,
                  nuevoEvaluadorOrigenId
                ) => {
                  try {
                    await moverIntegrante({
                      usuarioId: modoMover.usuarioId,
                      grupoOrigenId: modoMover.grupoOrigenId,
                      grupoDestinoId,
                      rolGrupo,
                      nuevoLiderOrigenId,
                      nuevoEvaluadorOrigenId
                    })
                    setModoMover(null)
                    await cargar()
                  } catch (e) {
                    setError(e.message)
                  }
                }}
                onTemaGuardado={cargar}
                onError={setError}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start mt-2">
        <Button variant="outline" onClick={onRetroceder}>
          <>
            <ArrowBackIcon className="w-4 h-4" /> Volver
          </>
        </Button>
      </div>
    </div>
  )
}

// ---- Builder para crear un nuevo grupo ----
function BuilderNuevoGrupo({
  sinGrupo,
  siguienteNumero,
  paraleloId,
  hemisemestres,
  onCreado,
  onError
}) {
  const [seleccionados, setSeleccionados] = useState(new Map()) // usuarioId → { rolGrupo, lider }
  const [temas, setTemas] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [liderActual, setLiderActual] = useState(null)
  const [desplegado, setDesplegado] = useState(true)

  function toggleEstudiante(uid, nombre) {
    setSeleccionados(prev => {
      const nuevo = new Map(prev)
      if (nuevo.has(uid)) {
        nuevo.delete(uid)
        if (liderActual === uid) setLiderActual(null)
      } else {
        nuevo.set(uid, { rolGrupo: 'expositor', lider: false })
      }
      return nuevo
    })
  }

  function cambiarRol(uid, rolGrupo) {
    setSeleccionados(prev => {
      const nuevo = new Map(prev)
      const m = nuevo.get(uid)
      if (m) nuevo.set(uid, { ...m, rolGrupo })
      return nuevo
    })
  }

  function cambiarLider(uid) {
    setLiderActual(uid)
  }

  async function handleCrear() {
    if (seleccionados.size === 0) {
      onError('Selecciona al menos un integrante.')
      return
    }
    if (hemisemestres.some(h => !String(temas[h.id] ?? '').trim())) {
      onError('Escribe el tema de cada hemisemestre.')
      return
    }
    if (liderActual === null) {
      onError('Todos los grupos deben tener un líder.')
      return
    }
    if (
      seleccionados.size > 3 &&
      !Array.from(seleccionados.values()).some(m => m.rolGrupo === 'evaluador')
    ) {
      onError(
        'Los grupos de más de 3 estudiantes deben tener al menos un evaluador.'
      )
      return
    }

    const miembros = Array.from(seleccionados.entries()).map(
      ([usuarioId, m]) => ({
        usuarioId,
        rolGrupo: m.rolGrupo,
        lider: usuarioId === liderActual
      })
    )
    setGuardando(true)
    try {
      await crearGrupo({
        paraleloId,
        numero: siguienteNumero,
        maxIntegrantes: 10,
        temas: Object.fromEntries(
          hemisemestres.map(h => [h.id, temas[h.id].trim()])
        ),
        hemisemestres,
        miembros
      })
      setSeleccionados(new Map())
      setTemas({})
      setLiderActual(null)
      onCreado()
    } catch (e) {
      onError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Panel>
      <button
        type="button"
        className={`${
          desplegado ? 'mb-4' : ''
        } flex w-full items-center gap-2 text-left`}
        onClick={() => setDesplegado(prev => !prev)}
        aria-expanded={desplegado}
      >
        <AddIcon className="w-5 h-5" />
        <span className="font-semibold">Crear grupo {siguienteNumero}</span>
        <span className="text-xs font-bold text-ink-soft ml-3">
          Estudiantes sin grupo: {sinGrupo.length}
        </span>
      </button>

      {desplegado && (
        <>
          {/* Lista de estudiantes sin grupo */}
          {/* <p className="text-xs font-semibold text-ink-soft mb-2">
            Estudiantes sin grupo ({sinGrupo.length})
          </p> */}
          <div className="flex flex-col gap-1.5 mb-5 max-h-72 overflow-y-auto pr-1">
            {sinGrupo.map(est => {
              const selec = seleccionados.get(est.usuarioId)
              return (
                <div
                  key={est.usuarioId}
                  className={`
                    flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-sm border transition-colors
                    ${selec ? 'border-gold/50 bg-gold-soft' : 'border-black/10 bg-surface'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={!!selec}
                    onChange={() => toggleEstudiante(est.usuarioId, est.nombre)}
                    className="accent-gold flex-shrink-0"
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium break-words">
                    {est.nombre}
                  </span>

                  {selec && (
                    <>
                      <Select
                        value={selec.rolGrupo}
                        onChange={e =>
                          cambiarRol(est.usuarioId, e.target.value)
                        }
                        className="w-32 text-xs py-1.5"
                      >
                        <option value="expositor">Expositor</option>
                        <option value="evaluador">Evaluador</option>
                      </Select>
                      <label className="flex items-center gap-1 text-xs text-ink-mid flex-shrink-0">
                        <input
                          type="radio"
                          name="lider-nuevo"
                          checked={liderActual === est.usuarioId}
                          onChange={() => cambiarLider(est.usuarioId)}
                          className="accent-gold"
                        />
                        Líder
                      </label>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Temas por hemisemestre */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-ink-mid mb-3">
              Temas del grupo
            </p>
            <div className="flex flex-col gap-3">
              {hemisemestres.map(h => (
                <div key={h.id}>
                  <label className="text-xs text-ink-soft block mb-1.5">
                    {h.nombre}
                  </label>
                  <Input
                    value={temas[h.id] ?? ''}
                    onChange={e =>
                      setTemas(prev => ({ ...prev, [h.id]: e.target.value }))
                    }
                    placeholder="Tema de este hemisemestre"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCrear}
              disabled={guardando || seleccionados.size === 0}
            >
              {guardando ? (
                <>
                  <Spinner className="w-4 h-4" /> Creando…
                </>
              ) : (
                <>
                  <AddIcon className="w-4 h-4" /> Crear Grupo {siguienteNumero}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Panel>
  )
}

// ---- Tarjeta de grupo existente (editar tema / mover integrante) ----
function TarjetaGrupo({
  grupo,
  grupos,
  estudiantesDisponibles,
  hemisemestres,
  modoEditar,
  modoEditarRoles,
  modoMover,
  modoAgregar,
  modoEdicion,
  catalogoFijo,
  onEditarTema,
  onCerrarEditar,
  onEditarRoles,
  onCerrarEditarRoles,
  onIniciarAgregar,
  onCerrarAgregar,
  onDeshacer,
  onAgregar,
  onIniciarMover,
  onCancelarMover,
  onMoverA,
  onTemaGuardado,
  onError
}) {
  const [temas, setTemas] = useState(
    // Inicializa con el primer miembro de grupo_temas si lo hay
    // (en StepGrupos no lo traemos; se edita por separado)
    {}
  )
  const [guardandoTema, setGuardandoTema] = useState(false)
  const [roles, setRoles] = useState({})
  const [guardandoRoles, setGuardandoRoles] = useState(false)
  const [errorRoles, setErrorRoles] = useState('')
  const [estudianteAgregar, setEstudianteAgregar] = useState('')
  const [rolAgregar, setRolAgregar] = useState('expositor')
  const [guardandoAgregar, setGuardandoAgregar] = useState(false)
  const [errorAgregar, setErrorAgregar] = useState('')
  const [confirmandoDeshacer, setConfirmandoDeshacer] = useState(false)
  const [guardandoDeshacer, setGuardandoDeshacer] = useState(false)

  // Para el diálogo de mover
  const [grupoDestino, setGrupoDestino] = useState('')
  const [rolDestino, setRolDestino] = useState('expositor')
  const [nuevoLiderOrigenId, setNuevoLiderOrigenId] = useState('')
  const [nuevoEvaluadorOrigenId, setNuevoEvaluadorOrigenId] = useState('')
  const [errorMovimiento, setErrorMovimiento] = useState('')

  useEffect(() => {
    setGrupoDestino('')
    setRolDestino('expositor')
    setNuevoLiderOrigenId('')
    setNuevoEvaluadorOrigenId('')
    setErrorMovimiento('')
  }, [modoMover?.usuarioId])

  useEffect(() => {
    if (modoAgregar) {
      setEstudianteAgregar('')
      setRolAgregar('expositor')
      setErrorAgregar('')
    }
  }, [modoAgregar])

  useEffect(() => {
    if (modoEditarRoles) {
      setRoles(
        Object.fromEntries(
          grupo.miembros.map(m => [
            m.usuarioId,
            { rolGrupo: m.rolGrupo, lider: m.lider }
          ])
        )
      )
      setErrorRoles('')
    }
  }, [modoEditarRoles, grupo.miembros])

  const miembroMover = grupo.miembros.find(
    m => m.usuarioId === modoMover?.usuarioId
  )
  const requiereNuevoLider = miembroMover?.lider === true
  const mueveEvaluador = miembroMover?.rolGrupo === 'evaluador'
  const integrantesOrigenDespues = grupo.miembros.length - 1
  const requiereNuevoEvaluador = mueveEvaluador && integrantesOrigenDespues > 3
  const miembrosOrigenDisponibles = grupo.miembros.filter(
    m => m.usuarioId !== modoMover?.usuarioId
  )

  async function handleGuardarTemas() {
    setGuardandoTema(true)
    try {
      await Promise.all(
        hemisemestres.map(h =>
          temas[h.id] !== undefined
            ? actualizarTemaGrupo(grupo.id, h.id, temas[h.id])
            : Promise.resolve()
        )
      )
      onCerrarEditar()
      onTemaGuardado()
    } catch (e) {
      onError(e.message)
    } finally {
      setGuardandoTema(false)
    }
  }

  async function handleGuardarRoles() {
    setGuardandoRoles(true)
    setErrorRoles('')
    try {
      await actualizarRolesGrupo(
        grupo.id,
        grupo.miembros.map(m => ({
          usuarioId: m.usuarioId,
          rolGrupo: roles[m.usuarioId]?.rolGrupo ?? m.rolGrupo,
          lider: roles[m.usuarioId]?.lider ?? m.lider
        }))
      )
      onCerrarEditarRoles()
      onTemaGuardado()
    } catch (e) {
      setErrorRoles(e.message)
    } finally {
      setGuardandoRoles(false)
    }
  }

  async function handleAgregar() {
    if (!estudianteAgregar) {
      setErrorAgregar('Selecciona un estudiante.')
      return
    }
    setGuardandoAgregar(true)
    setErrorAgregar('')
    try {
      await onAgregar(estudianteAgregar, rolAgregar)
    } catch (e) {
      setErrorAgregar(e.message)
    } finally {
      setGuardandoAgregar(false)
    }
  }

  async function handleDeshacer() {
    setGuardandoDeshacer(true)
    try {
      await onDeshacer()
    } finally {
      setGuardandoDeshacer(false)
      setConfirmandoDeshacer(false)
    }
  }

  const gruposDestino = grupos.filter(g => g.id !== grupo.id)
  const grupoDestinoSeleccionado = gruposDestino.find(
    g => g.id === grupoDestino
  )
  const evaluadoresDestino =
    (grupoDestinoSeleccionado?.miembros ?? []).filter(
      m => m.rolGrupo === 'evaluador'
    ).length + (rolDestino === 'evaluador' ? 1 : 0)
  const integrantesDestino =
    (grupoDestinoSeleccionado?.miembros.length ?? 0) + 1
  const lideresDestino = (grupoDestinoSeleccionado?.miembros ?? []).filter(
    m => m.lider
  ).length

  function confirmarMovimiento() {
    if (!grupoDestino) {
      setErrorMovimiento('Selecciona un grupo destino.')
      return
    }
    if (requiereNuevoLider && !nuevoLiderOrigenId) {
      setErrorMovimiento('Selecciona el nuevo líder del grupo de origen.')
      return
    }
    if (requiereNuevoEvaluador && !nuevoEvaluadorOrigenId) {
      setErrorMovimiento('Selecciona el nuevo evaluador del grupo de origen.')
      return
    }
    if (lideresDestino !== 1) {
      setErrorMovimiento('El grupo destino debe tener exactamente un líder.')
      return
    }
    if (evaluadoresDestino > 1) {
      setErrorMovimiento('El grupo destino solo puede tener un evaluador.')
      return
    }
    if (integrantesDestino > 3 && evaluadoresDestino === 0) {
      setErrorMovimiento(
        'Los grupos de más de 3 estudiantes deben tener un evaluador.'
      )
      return
    }

    setErrorMovimiento('')
    onMoverA(
      grupoDestino,
      rolDestino,
      nuevoLiderOrigenId,
      nuevoEvaluadorOrigenId
    )
  }

  return (
    <div className="bg-white border border-black/[0.11] rounded-DEFAULT shadow-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <p className="text-xs font-bold text-sice-green">
          Grupo {grupo.numero}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {modoEdicion && estudiantesDisponibles.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onIniciarAgregar}
            >
              <PersonAddIcon className="w-4 h-4" /> Añadir
            </Button>
          )}
          {modoEdicion && !catalogoFijo && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={onEditarTema}
              >
                <EditIcon className="w-4 h-4" /> Editar temas
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={onEditarRoles}
              >
                <EditIcon className="w-4 h-4" /> Editar roles
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="w-full sm:w-auto"
                onClick={() => setConfirmandoDeshacer(true)}
              >
                <DeleteIcon className="w-4 h-4" /> Deshacer
              </Button>
            </>
          )}
        </div>
      </div>

      {confirmandoDeshacer && (
        <div className="mb-4 p-3 bg-sice-red-soft rounded-sm border border-sice-red/25">
          <p className="text-sm font-semibold text-sice-red mb-1">
            ¿Deshacer el Grupo {grupo.numero}?
          </p>
          <p className="text-xs text-ink-mid leading-relaxed">
            Sus estudiantes volverán a la lista de estudiantes sin grupo y se
            eliminarán sus temas, calificaciones y coevaluaciones asociadas.
          </p>
          <div className="flex gap-2 mt-3 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmandoDeshacer(false)}
              disabled={guardandoDeshacer}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeshacer}
              disabled={guardandoDeshacer}
            >
              {guardandoDeshacer ? (
                <>
                  <Spinner className="w-4 h-4" /> Deshaciendo…
                </>
              ) : (
                <>
                  <DeleteIcon className="w-4 h-4" /> Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {modoAgregar && (
        <div className="mb-4 p-3 bg-gold-soft rounded-sm border border-gold/40">
          <p className="text-xs font-semibold text-ink-mid mb-3">
            Añadir estudiante al grupo
          </p>
          {errorAgregar && <Aviso variant="red">{errorAgregar}</Aviso>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-ink-soft block mb-1">
                Estudiante
              </label>
              <Select
                value={estudianteAgregar}
                onChange={e => {
                  setEstudianteAgregar(e.target.value)
                  setErrorAgregar('')
                }}
              >
                <option value="">— Seleccionar —</option>
                {estudiantesDisponibles.map(est => (
                  <option key={est.usuarioId} value={est.usuarioId}>
                    {est.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:w-36">
              <label className="text-xs text-ink-soft block mb-1">Rol</label>
              <Select
                value={rolAgregar}
                onChange={e => setRolAgregar(e.target.value)}
              >
                <option value="expositor">Expositor</option>
                <option value="evaluador">Evaluador</option>
              </Select>
            </div>
            <div className="flex gap-2 sm:pb-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onCerrarAgregar}
                disabled={guardandoAgregar}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAgregar}
                disabled={guardandoAgregar || !estudianteAgregar}
              >
                {guardandoAgregar ? (
                  <>
                    <Spinner className="w-4 h-4" /> Añadiendo…
                  </>
                ) : (
                  <>
                    <PersonAddIcon className="w-4 h-4" /> Añadir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edición de temas */}
      {modoEditar && (
        <div className="mb-4 p-3 bg-surface rounded-sm border border-black/10">
          <p className="text-xs font-semibold text-ink-mid mb-3">
            Temas por hemisemestre
          </p>
          <div className="flex flex-col gap-3">
            {hemisemestres.map((h, idx) => (
              <div key={h.id}>
                <label className="text-xs text-ink-soft block mb-1">
                  {h.orden === 1 ? 'Hemi 1' : 'Hemi 2'} — {h.nombre}
                </label>
                <Input
                  value={temas[h.id] ?? ''}
                  onChange={e =>
                    setTemas(prev => ({ ...prev, [h.id]: e.target.value }))
                  }
                  placeholder="Tema de este hemisemestre"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="outline" onClick={onCerrarEditar}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardarTemas}
              disabled={guardandoTema}
            >
              {guardandoTema ? (
                'Guardando…'
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" /> Guardar temas
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {modoEditarRoles && (
        <div className="mb-4 p-3 bg-surface rounded-sm border border-black/10">
          <p className="text-xs font-semibold text-ink-mid mb-3">
            Roles y líder del grupo
          </p>
          {errorRoles && <Aviso variant="red">{errorRoles}</Aviso>}
          <div className="flex flex-col gap-1.5">
            {grupo.miembros.map(m => (
              <div
                key={m.usuarioId}
                className="flex flex-wrap items-center gap-3 bg-white rounded-sm px-3 py-2"
              >
                <span className="min-w-0 flex-1 text-sm font-medium break-words">
                  {m.nombre}
                </span>
                <Select
                  value={roles[m.usuarioId]?.rolGrupo ?? m.rolGrupo}
                  onChange={e =>
                    setRoles(prev => ({
                      ...prev,
                      [m.usuarioId]: {
                        ...prev[m.usuarioId],
                        rolGrupo: e.target.value
                      }
                    }))
                  }
                  className="w-32 text-xs py-1.5"
                >
                  <option value="expositor">Expositor</option>
                  <option value="evaluador">Evaluador</option>
                </Select>
                <label className="flex items-center gap-1 text-xs text-ink-mid">
                  <input
                    type="radio"
                    name={`lider-${grupo.id}`}
                    checked={roles[m.usuarioId]?.lider ?? m.lider}
                    onChange={() =>
                      setRoles(prev => ({
                        ...prev,
                        ...Object.fromEntries(
                          grupo.miembros.map(miembro => [
                            miembro.usuarioId,
                            {
                              ...prev[miembro.usuarioId],
                              lider: miembro.usuarioId === m.usuarioId
                            }
                          ])
                        )
                      }))
                    }
                    className="accent-gold"
                  />
                  Líder
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="outline" onClick={onCerrarEditarRoles}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardarRoles}
              disabled={guardandoRoles}
            >
              {guardandoRoles ? 'Guardando…' : 'Guardar roles'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de miembros */}
      <ul className="flex flex-col gap-1.5">
        {grupo.miembros.map(m => (
          <li
            key={m.usuarioId}
            className="flex flex-wrap items-center gap-2 bg-surface rounded-sm px-3 py-2"
          >
            <span className="w-full min-w-0 text-sm font-medium break-words sm:w-auto sm:flex-1 sm:min-w-[140px]">
              {m.nombre}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge variant={m.rolGrupo === 'evaluador' ? 'ok' : 'info'}>
                {m.rolGrupo === 'evaluador' ? 'Evaluador' : 'Expositor'}
              </Badge>
              {m.lider && <Badge variant="pending">Líder</Badge>}
              {modoEdicion && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onIniciarMover(m.usuarioId)}
                >
                  <SwapHorizIcon className="w-4 h-4" /> Mover
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Panel de mover integrante */}
      {modoMover && (
        <div className="mt-3 p-3 bg-surface rounded-sm border border-black/10">
          <p className="text-xs font-semibold text-ink-mid mb-3">
            Mover <strong>{miembroMover?.nombre}</strong> a otro grupo
          </p>
          {errorMovimiento && <Aviso variant="red">{errorMovimiento}</Aviso>}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-ink-soft block mb-1">
                Grupo destino
              </label>
              <Select
                value={grupoDestino}
                onChange={e => {
                  setGrupoDestino(e.target.value)
                  setErrorMovimiento('')
                }}
              >
                <option value="">— Seleccionar —</option>
                {gruposDestino.map(gd => (
                  <option key={gd.id} value={gd.id}>
                    Grupo {gd.numero}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-ink-soft block mb-1">
                Nuevo rol
              </label>
              <Select
                value={rolDestino}
                onChange={e => {
                  setRolDestino(e.target.value)
                  setErrorMovimiento('')
                }}
              >
                <option value="expositor">Expositor</option>
                <option value="evaluador">Evaluador</option>
              </Select>
            </div>
            {requiereNuevoLider && (
              <div>
                <label className="text-xs text-ink-soft block mb-1">
                  Nuevo líder del grupo de origen
                </label>
                <Select
                  value={nuevoLiderOrigenId}
                  onChange={e => {
                    setNuevoLiderOrigenId(e.target.value)
                    setErrorMovimiento('')
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {miembrosOrigenDisponibles.map(m => (
                    <option key={m.usuarioId} value={m.usuarioId}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {mueveEvaluador && (
              <div>
                <label className="text-xs text-ink-soft block mb-1">
                  Nuevo evaluador del grupo de origen
                </label>
                <Select
                  value={nuevoEvaluadorOrigenId}
                  onChange={e => {
                    setNuevoEvaluadorOrigenId(e.target.value)
                    setErrorMovimiento('')
                  }}
                >
                  <option value="">
                    {requiereNuevoEvaluador ? '— Seleccionar —' : '— Ninguno —'}
                  </option>
                  {miembrosOrigenDisponibles.map(m => (
                    <option key={m.usuarioId} value={m.usuarioId}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
                {!requiereNuevoEvaluador && (
                  <p className="text-xs text-ink-soft mt-1">
                    Es opcional porque el grupo origen tendrá 3 o menos
                    integrantes.
                  </p>
                )}
              </div>
            )}
            {grupoDestino && evaluadoresDestino > 1 && (
              <p className="text-xs text-red-700">
                El grupo destino solo puede tener un evaluador.
              </p>
            )}
            {grupoDestino &&
              integrantesDestino > 3 &&
              evaluadoresDestino === 0 && (
                <p className="text-xs text-red-700">
                  Los grupos de más de 3 estudiantes deben tener un evaluador.
                </p>
              )}
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="outline" onClick={onCancelarMover}>
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmarMovimiento}>
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
