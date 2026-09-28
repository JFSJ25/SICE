import { supabase } from './supabase.js'

// ---- Periodos ----

export async function obtenerPeriodos() {
  const { data, error } = await supabase
    .from('periodos')
    .select('id, nombre')
    .order('nombre', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPeriodo(nombre) {
  const { data, error } = await supabase
    .from('periodos')
    .insert({ nombre })
    .select('id, nombre')
    .single()
  if (error) throw error
  return data
}

export async function eliminarPeriodo(periodoId) {
  const { error } = await supabase.from('periodos').delete().eq('id', periodoId)
  if (error) throw error
}

// ---- Materias ----

export async function obtenerMaterias() {
  const { data, error } = await supabase
    .from('materias')
    .select('id, nombre, semestre')
    .order('semestre')
  if (error) throw error
  return data
}

export async function obtenerParalelosProfesor(profesorId) {
  const { data, error } = await supabase
    .from('paralelos')
    .select('id, codigo, creado_en, materias(nombre), periodos(nombre)')
    .eq('profesor_id', profesorId)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data.map(p => ({
    id: p.id,
    codigo: p.codigo,
    materiaNombre: p.materias?.nombre ?? '—',
    periodoNombre: p.periodos?.nombre ?? '—'
  }))
}

// ---- Paralelos ----

// Crea el paralelo si no existe. El trigger de BD crea automáticamente
// los 2 hemisemestres y la configuracion_notas (70/30).
export async function upsertParalelo({
  materiaId,
  periodoId,
  codigo,
  profesorId
}) {
  const { data: existente } = await supabase
    .from('paralelos')
    .select('id')
    .eq('materia_id', materiaId)
    .eq('periodo_id', periodoId)
    .eq('codigo', codigo)
    .maybeSingle()
  if (existente) return existente

  const { data, error } = await supabase
    .from('paralelos')
    .insert({
      materia_id: materiaId,
      periodo_id: periodoId,
      codigo,
      profesor_id: profesorId
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function eliminarParalelo(paraleloId) {
  const { error } = await supabase
    .from('paralelos')
    .delete()
    .eq('id', paraleloId)
  if (error) throw error
}

// ---- Hemisemestres ----
// Siempre 2 por paralelo, creados por trigger. Esta función solo los lee.

export async function obtenerHemisemestres(paraleloId) {
  const { data, error } = await supabase
    .from('hemisemestres')
    .select('id, nombre, orden')
    .eq('paralelo_id', paraleloId)
    .order('orden')
  if (error) throw error
  return data
}

// ---- Grupos ----

function validarMiembrosGrupo(miembros) {
  const cantidadLideres = miembros.filter(m => m.lider).length
  if (cantidadLideres !== 1) {
    throw new Error('Todos los grupos deben tener un líder.')
  }
  const cantidadEvaluadores = miembros.filter(
    m => m.rolGrupo === 'evaluador'
  ).length
  if (cantidadEvaluadores > 1) {
    throw new Error('Cada grupo puede tener un solo evaluador.')
  }
  if (miembros.length > 3 && cantidadEvaluadores !== 1) {
    throw new Error(
      'Los grupos de más de 3 estudiantes deben tener un evaluador.'
    )
  }
}

export async function obtenerGruposConDetalle(paraleloId, hemisemestreId) {
  const { data, error } = await supabase
    .from('grupos')
    .select(
      `
      id, numero, max_integrantes,
      grupo_temas!inner ( tema, hemisemestre_id ),
      grupo_miembros ( usuario_id, rol_grupo, lider )
    `
    )
    .eq('paralelo_id', paraleloId)
    .eq('grupo_temas.hemisemestre_id', hemisemestreId)
    .order('numero')
  if (error) throw error

  const userIds = [
    ...new Set(
      (data ?? []).flatMap(g => (g.grupo_miembros ?? []).map(m => m.usuario_id))
    )
  ]

  const { data: usuarios, error: errUsuarios } = userIds.length
    ? await supabase
        .from('usuarios')
        .select('id, nombre_completo, email')
        .in('id', userIds)
    : { data: [], error: null }
  if (errUsuarios) throw errUsuarios

  const mapUsuarios = new Map((usuarios ?? []).map(u => [u.id, u]))

  return (data ?? []).map(g => ({
    id: g.id,
    numero: g.numero,
    maxIntegrantes: g.max_integrantes,
    tema: g.grupo_temas[0]?.tema ?? '(sin tema)',
    miembros: (g.grupo_miembros ?? []).map(m => {
      const usuario = mapUsuarios.get(m.usuario_id)
      return {
        usuarioId: m.usuario_id,
        nombre: usuario?.nombre_completo ?? '(sin nombre)',
        rolGrupo: m.rol_grupo,
        lider: m.lider
      }
    })
  }))
}

// Para el builder del Admin: grupos sin tener en cuenta el hemisemestre
// (membresía es fija; el tema es lo que varía).
export async function obtenerGruposBase(paraleloId) {
  const { data, error } = await supabase
    .from('grupos')
    .select(
      `
      id, numero, max_integrantes,
      grupo_miembros ( usuario_id, rol_grupo, lider )
    `
    )
    .eq('paralelo_id', paraleloId)
    .order('numero')
  if (error) throw error

  const userIds = [
    ...new Set(
      (data ?? []).flatMap(g => (g.grupo_miembros ?? []).map(m => m.usuario_id))
    )
  ]

  const { data: usuarios, error: errUsuarios } = userIds.length
    ? await supabase
        .from('usuarios')
        .select('id, nombre_completo, email')
        .in('id', userIds)
    : { data: [], error: null }
  if (errUsuarios) throw errUsuarios

  const mapUsuarios = new Map((usuarios ?? []).map(u => [u.id, u]))

  return (data ?? []).map(g => ({
    id: g.id,
    numero: g.numero,
    maxIntegrantes: g.max_integrantes,
    miembros: (g.grupo_miembros ?? []).map(m => {
      const usuario = mapUsuarios.get(m.usuario_id)
      return {
        usuarioId: m.usuario_id,
        nombre: usuario?.nombre_completo ?? '(sin nombre)',
        email: usuario?.email ?? '',
        rolGrupo: m.rol_grupo,
        lider: m.lider
      }
    })
  }))
}

// Crea un grupo con sus miembros y un tema independiente por hemisemestre.
export async function crearGrupo({
  paraleloId,
  numero,
  maxIntegrantes,
  temas,
  hemisemestres,
  miembros
}) {
  validarMiembrosGrupo(miembros)

  // hemisemestres: [{ id, orden }] — los 2 del paralelo
  const { data: grupo, error: errG } = await supabase
    .from('grupos')
    .insert({
      paralelo_id: paraleloId,
      numero,
      max_integrantes: maxIntegrantes
    })
    .select('id')
    .single()
  if (errG) throw errG

  // Insertar el tema correspondiente a cada hemisemestre
  if (temas && hemisemestres.length > 0) {
    const filasTemas = hemisemestres.map(h => ({
      grupo_id: grupo.id,
      hemisemestre_id: h.id,
      tema: temas[h.id]
    }))
    const { error: errT } = await supabase
      .from('grupo_temas')
      .insert(filasTemas)
    if (errT) throw errT
  }

  if (miembros && miembros.length > 0) {
    const filas = miembros.map(m => ({
      grupo_id: grupo.id,
      usuario_id: m.usuarioId,
      rol_grupo: m.rolGrupo,
      lider: m.lider ?? false
    }))
    const { error: errM } = await supabase.from('grupo_miembros').insert(filas)
    if (errM) throw errM
  }

  return grupo
}

// Elimina un grupo y devuelve sus estudiantes a la lista sin grupo.
// Las relaciones dependientes (temas, miembros y calificaciones) se eliminan
// mediante las reglas on delete cascade del esquema.
export async function eliminarGrupo(grupoId) {
  const { error } = await supabase.from('grupos').delete().eq('id', grupoId)
  if (error) throw error
}

// Actualiza el tema de un grupo en UN hemisemestre específico.
export async function actualizarTemaGrupo(grupoId, hemisemestreId, tema) {
  const { error } = await supabase
    .from('grupo_temas')
    .upsert(
      { grupo_id: grupoId, hemisemestre_id: hemisemestreId, tema },
      { onConflict: 'grupo_id,hemisemestre_id' }
    )
  if (error) throw error
}

export async function actualizarRolesGrupo(grupoId, miembros) {
  validarMiembrosGrupo(miembros)

  const { error: quitarLideresError } = await supabase
    .from('grupo_miembros')
    .update({ lider: false })
    .eq('grupo_id', grupoId)
  if (quitarLideresError) throw quitarLideresError

  await Promise.all(
    miembros.map(async miembro => {
      const { error } = await supabase
        .from('grupo_miembros')
        .update({ rol_grupo: miembro.rolGrupo, lider: miembro.lider })
        .eq('grupo_id', grupoId)
        .eq('usuario_id', miembro.usuarioId)
      if (error) throw error
    })
  )
}

// Mueve un integrante de un grupo a otro, cambiando opcionalmente su rol.
export async function moverIntegrante({
  usuarioId,
  grupoOrigenId,
  grupoDestinoId,
  rolGrupo,
  nuevoLiderOrigenId,
  nuevoEvaluadorOrigenId
}) {
  if (grupoOrigenId === grupoDestinoId) {
    throw new Error(
      'El grupo de destino debe ser diferente al grupo de origen.'
    )
  }

  const { data: miembrosActuales, error: errConsulta } = await supabase
    .from('grupo_miembros')
    .select('grupo_id, usuario_id, rol_grupo, lider')
    .in('grupo_id', [grupoOrigenId, grupoDestinoId])
  if (errConsulta) throw errConsulta

  const miembro = miembrosActuales.find(
    m => m.grupo_id === grupoOrigenId && m.usuario_id === usuarioId
  )
  if (!miembro)
    throw new Error('El integrante no pertenece al grupo de origen.')

  const miembrosOrigen = miembrosActuales
    .filter(m => m.grupo_id === grupoOrigenId && m.usuario_id !== usuarioId)
    .map(m => ({
      lider: m.usuario_id === nuevoLiderOrigenId || (m.lider && !miembro.lider),
      rolGrupo:
        m.usuario_id === nuevoEvaluadorOrigenId ? 'evaluador' : m.rol_grupo
    }))
  const miembrosDestino = miembrosActuales
    .filter(m => m.grupo_id === grupoDestinoId)
    .map(m => ({
      lider: m.lider,
      rolGrupo: m.rol_grupo
    }))
  miembrosDestino.push({ lider: false, rolGrupo })

  const integrantesOrigenDespues = miembrosOrigen.length
  if (miembro.lider && !nuevoLiderOrigenId) {
    throw new Error(
      'Selecciona el nuevo líder del grupo de origen antes de mover al líder actual.'
    )
  }
  if (
    miembro.rol_grupo === 'evaluador' &&
    integrantesOrigenDespues > 3 &&
    !nuevoEvaluadorOrigenId
  ) {
    throw new Error(
      'Los grupos de más de 3 estudiantes deben tener un evaluador.'
    )
  }

  validarMiembrosGrupo(miembrosOrigen)
  validarMiembrosGrupo(miembrosDestino)

  if (
    miembro.lider &&
    nuevoLiderOrigenId &&
    !miembrosActuales.some(
      m => m.grupo_id === grupoOrigenId && m.usuario_id === nuevoLiderOrigenId
    )
  ) {
    throw new Error('El nuevo líder debe pertenecer al grupo de origen.')
  }
  if (
    miembro.rol_grupo === 'evaluador' &&
    nuevoEvaluadorOrigenId &&
    !miembrosActuales.some(
      m =>
        m.grupo_id === grupoOrigenId && m.usuario_id === nuevoEvaluadorOrigenId
    )
  ) {
    throw new Error('El nuevo evaluador debe pertenecer al grupo de origen.')
  }

  // Quitar del grupo origen
  const { error: errDel } = await supabase
    .from('grupo_miembros')
    .delete()
    .eq('grupo_id', grupoOrigenId)
    .eq('usuario_id', usuarioId)
  if (errDel) throw errDel

  // Persistir el reemplazo de líder del grupo origen.
  if (miembro.lider) {
    const { error: errNuevoLider } = await supabase
      .from('grupo_miembros')
      .update({ lider: true })
      .eq('grupo_id', grupoOrigenId)
      .eq('usuario_id', nuevoLiderOrigenId)
    if (errNuevoLider) throw errNuevoLider
  }

  // Persistir el reemplazo de evaluador del grupo origen.
  if (nuevoEvaluadorOrigenId) {
    const { error: errNuevoEvaluador } = await supabase
      .from('grupo_miembros')
      .update({ rol_grupo: 'evaluador' })
      .eq('grupo_id', grupoOrigenId)
      .eq('usuario_id', nuevoEvaluadorOrigenId)
    if (errNuevoEvaluador) throw errNuevoEvaluador
  }

  // Insertar en el grupo destino
  const { error: errIns } = await supabase.from('grupo_miembros').insert({
    grupo_id: grupoDestinoId,
    usuario_id: usuarioId,
    rol_grupo: rolGrupo,
    lider: false
  })
  if (errIns) throw errIns
}

// Añade un estudiante matriculado y actualmente sin grupo a un grupo existente.
export async function agregarIntegranteGrupo({
  grupoId,
  usuarioId,
  rolGrupo = 'expositor'
}) {
  const [
    { data: miembrosActuales, error: errMiembros },
    { data: grupo, error: errGrupo }
  ] = await Promise.all([
    supabase
      .from('grupo_miembros')
      .select('usuario_id, rol_grupo, lider')
      .eq('grupo_id', grupoId),
    supabase.from('grupos').select('max_integrantes').eq('id', grupoId).single()
  ])
  if (errMiembros) throw errMiembros
  if (errGrupo) throw errGrupo

  if (miembrosActuales.length >= grupo.max_integrantes) {
    throw new Error('El grupo ya alcanzó el máximo de integrantes.')
  }

  if (miembrosActuales.some(m => m.usuario_id === usuarioId)) {
    throw new Error('El estudiante ya pertenece a este grupo.')
  }

  const miembros = miembrosActuales.map(m => ({
    rolGrupo: m.rol_grupo,
    lider: m.lider
  }))
  miembros.push({ rolGrupo, lider: false })
  validarMiembrosGrupo(miembros)

  const { error } = await supabase.from('grupo_miembros').insert({
    grupo_id: grupoId,
    usuario_id: usuarioId,
    rol_grupo: rolGrupo,
    lider: false
  })
  if (error) throw error
}

// Estudiantes del paralelo sin grupo asignado (para el builder).
export async function obtenerEstudiantesSinGrupo(paraleloId) {
  const { data: matriculados, error: errMat } = await supabase
    .from('matriculas')
    .select(
      'usuario_id, usuarios!matriculas_usuario_id_fkey(nombre_completo, email)'
    )
    .eq('paralelo_id', paraleloId)
  if (errMat) throw errMat

  const { data: conGrupo, error: errG } = await supabase
    .from('grupo_miembros')
    .select('usuario_id, grupos!inner(paralelo_id)')
    .eq('grupos.paralelo_id', paraleloId)
  if (errG) throw errG

  const idsConGrupo = new Set(conGrupo.map(r => r.usuario_id))
  return matriculados
    .filter(m => !idsConGrupo.has(m.usuario_id))
    .map(m => ({
      usuarioId: m.usuario_id,
      nombre: m.usuarios?.nombre_completo ?? '—',
      email: m.usuarios?.email ?? ''
    }))
}

// ---- Matrículas ----

export async function matricularEstudiantes(paraleloId, usuarioIds) {
  const filas = usuarioIds.map(uid => ({
    paralelo_id: paraleloId,
    usuario_id: uid
  }))
  const { error } = await supabase.from('matriculas').upsert(filas, {
    onConflict: 'paralelo_id,usuario_id',
    ignoreDuplicates: true
  })
  if (error) {
    if (
      error.code === '23505' &&
      error.message?.includes('periodo académico')
    ) {
      throw new Error(
        'Uno o más estudiantes ya están matriculados en otra materia-paralelo de este periodo académico.'
      )
    }
    throw error
  }
}

// ---- Calificaciones del docente ----

export async function obtenerCalificacionDocente(
  estudianteId,
  hemisemestreId,
  rubricaId
) {
  const { data, error } = await supabase
    .from('calificaciones_docente')
    .select('id, respuestas, puntaje, comentario, actualizado_en')
    .eq('estudiante_id', estudianteId)
    .eq('hemisemestre_id', hemisemestreId)
    .eq('rubrica_id', rubricaId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function guardarCalificacionDocente({
  profesorId,
  estudianteId,
  grupoId,
  hemisemestreId,
  rubricaId,
  respuestas,
  puntaje,
  comentario
}) {
  const { error } = await supabase.from('calificaciones_docente').upsert(
    {
      profesor_id: profesorId,
      estudiante_id: estudianteId,
      grupo_id: grupoId,
      hemisemestre_id: hemisemestreId,
      rubrica_id: rubricaId,
      respuestas,
      puntaje,
      comentario: comentario ?? null,
      actualizado_en: new Date().toISOString()
    },
    { onConflict: 'estudiante_id,hemisemestre_id,rubrica_id' }
  )
  if (error) throw error
}

// Mapa usuarioId → { puntaje, rubrica_id } para pintar la lista de grupos.
export async function obtenerMapaCalificacionesDocente(
  estudianteIds,
  hemisemestreId
) {
  const mapa = new Map()
  if (estudianteIds.length === 0) return mapa
  const { data, error } = await supabase
    .from('calificaciones_docente')
    .select('estudiante_id, puntaje, rubrica_id')
    .eq('hemisemestre_id', hemisemestreId)
    .in('estudiante_id', estudianteIds)
  if (error) throw error
  data.forEach(row => mapa.set(row.estudiante_id, row))
  return mapa
}

export async function obtenerPendientesDocente(grupos, hemisemestreId) {
  const estudianteIds = grupos.flatMap(g => g.miembros.map(m => m.usuarioId))
  if (estudianteIds.length === 0) return []

  const { data: calificados, error } = await supabase
    .from('calificaciones_docente')
    .select('estudiante_id')
    .eq('hemisemestre_id', hemisemestreId)
    .in('estudiante_id', estudianteIds)
  if (error) throw error

  const yaCalificados = new Set(calificados.map(c => c.estudiante_id))
  const pendientes = []
  grupos.forEach(g =>
    g.miembros.forEach(m => {
      if (!yaCalificados.has(m.usuarioId))
        pendientes.push({ ...m, grupoNumero: g.numero, grupoId: g.id })
    })
  )
  return pendientes
}

// ---- Coevaluaciones ----

export async function yaCoevaluoGrupo(evaluadorId, grupoId, hemisemestreId) {
  const { count, error } = await supabase
    .from('coevaluaciones')
    .select('id', { count: 'exact', head: true })
    .eq('evaluador_id', evaluadorId)
    .eq('grupo_evaluado_id', grupoId)
    .eq('hemisemestre_id', hemisemestreId)
  if (error) throw error
  return count > 0
}

export async function guardarCoevaluacion({
  evaluadorId,
  grupoId,
  hemisemestreId,
  rubricaExpositorId,
  respExpositor,
  puntajeExpositor,
  rubricaEvaluadorId,
  respEvaluador,
  puntajeEvaluador
}) {
  const filas = [
    {
      evaluador_id: evaluadorId,
      grupo_evaluado_id: grupoId,
      hemisemestre_id: hemisemestreId,
      rubrica_id: rubricaExpositorId,
      respuestas: respExpositor,
      puntaje: puntajeExpositor,
      actualizado_en: new Date().toISOString()
    },
    {
      evaluador_id: evaluadorId,
      grupo_evaluado_id: grupoId,
      hemisemestre_id: hemisemestreId,
      rubrica_id: rubricaEvaluadorId,
      respuestas: respEvaluador,
      puntaje: puntajeEvaluador,
      actualizado_en: new Date().toISOString()
    }
  ]
  const { error } = await supabase.from('coevaluaciones').upsert(filas, {
    onConflict: 'evaluador_id,grupo_evaluado_id,hemisemestre_id,rubrica_id'
  })
  if (error) throw error
}

export async function obtenerPromedioCoeval(
  grupoId,
  hemisemestreId,
  rubricaId
) {
  const { data, error } = await supabase.rpc('obtener_coeval_promedio', {
    p_grupo_id: grupoId,
    p_hemisemestre_id: hemisemestreId,
    p_rubrica_id: rubricaId
  })
  if (error) throw error
  const fila = data?.[0]
  if (!fila || fila.cantidad === 0) return null
  return { promedio: Number(fila.promedio), cantidad: Number(fila.cantidad) }
}
