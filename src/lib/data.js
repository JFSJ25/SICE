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

export async function obtenerEstadoAsignacion(paraleloId) {
  const { data, error } = await supabase
    .from('paralelos')
    .select('estado_asignacion')
    .eq('id', paraleloId)
    .single()
  if (error) throw error
  return data.estado_asignacion
}

export async function asignarEstudianteGrupo({
  paraleloId,
  grupoId,
  rolGrupo,
  lider
}) {
  const { error } = await supabase.rpc('asignar_estudiante_grupo', {
    p_paralelo_id: paraleloId,
    p_grupo_id: grupoId,
    p_rol_grupo: rolGrupo,
    p_lider: lider
  })
  if (error) throw error
}

export async function finalizarAsignacion(paraleloId) {
  const { error } = await supabase.rpc('finalizar_asignacion', {
    p_paralelo_id: paraleloId
  })
  if (error) throw error
}

export async function reabrirAsignacion(paraleloId) {
  const { error } = await supabase.rpc('reabrir_asignacion', {
    p_paralelo_id: paraleloId
  })
  if (error) throw error
}

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
}

export async function obtenerGruposConDetalle(paraleloId, hemisemestreId) {
  const { data, error } = await supabase
    .from('grupos')
    .select(
      `
      id, numero, max_integrantes,
      grupo_temas!inner ( id, tema, hemisemestre_id, coevaluacion_habilitada ),
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

  const gruposUnicos = new Map((data ?? []).map(g => [g.id, g]))
  return [...gruposUnicos.values()].map(g => ({
    id: g.id,
    numero: g.numero,
    maxIntegrantes: g.max_integrantes,
    grupoTemaId: g.grupo_temas[0]?.id,
    tema: g.grupo_temas[0]?.tema ?? '(sin tema)',
    coevaluacionHabilitada: Boolean(g.grupo_temas[0]?.coevaluacion_habilitada),
    miembros: [
      ...new Map(
        (g.grupo_miembros ?? []).map(m => [m.usuario_id, m])
      ).values()
    ].map(m => {
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
export async function obtenerGruposBase(paraleloId, grupoId = null) {
  let query = supabase
    .from('grupos')
    .select(
      `
      id, numero, max_integrantes,
      grupo_miembros ( usuario_id, rol_grupo, lider )
    `
    )
    .eq('paralelo_id', paraleloId)
    .order('numero')

  if (grupoId) query = query.eq('id', grupoId)

  const { data, error } = await query
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

  const gruposUnicos = new Map((data ?? []).map(g => [g.id, g]))
  return [...gruposUnicos.values()].map(g => ({
    id: g.id,
    numero: g.numero,
    maxIntegrantes: g.max_integrantes,
    miembros: [
      ...new Map(
        (g.grupo_miembros ?? []).map(m => [m.usuario_id, m])
      ).values()
    ].map(m => {
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

export async function obtenerGrupoBase(paraleloId, grupoId) {
  const grupos = await obtenerGruposBase(paraleloId, grupoId)
  return grupos[0] ?? null
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
// Actualiza el estado de coevaluación de un grupo en un hemisemestre específico.
// Guarda el estado de coevaluación de múltiples grupos a la vez.
export async function guardarEstadosCoevaluacion(grupos, hemisemestreId) {
  if (!grupos || grupos.length === 0) return

  const payload = grupos.map(g => ({
    grupo_id: g.id,
    habilitada: Boolean(g.coevaluacionHabilitada)
  }))

  // 1. Intentar primero con la función RPC Security Definer (garantiza bypass de RLS de catálogo fijo)
  const { error: rpcError } = await supabase.rpc(
    'actualizar_coevaluacion_grupos',
    {
      p_cambios: payload,
      p_hemisemestre_id: hemisemestreId
    }
  )

  if (!rpcError) return

  // 2. Fallback a update directo con verificación explícita de filas modificadas
  const promesas = grupos.map(async g => {
    let query = supabase
      .from('grupo_temas')
      .update({ coevaluacion_habilitada: Boolean(g.coevaluacionHabilitada) })

    if (g.grupoTemaId) {
      query = query.eq('id', g.grupoTemaId)
    } else {
      query = query
        .eq('grupo_id', g.id)
        .eq('hemisemestre_id', hemisemestreId)
    }

    const { data, error } = await query.select()
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error(
        `No se pudo actualizar el Grupo ${g.numero}. Asegúrate de haber ejecutado el script SQL de migración en Supabase.`
      )
    }
  })

  await Promise.all(promesas)
}

// Actualiza el estado de coevaluación de un grupo en un hemisemestre específico.
export async function actualizarEstadoCoevaluacionGrupo(
  grupoId,
  hemisemestreId,
  habilitada,
  grupoTemaId
) {
  const { error: rpcError } = await supabase.rpc(
    'actualizar_coevaluacion_grupos',
    {
      p_cambios: [{ grupo_id: grupoId, habilitada: Boolean(habilitada) }],
      p_hemisemestre_id: hemisemestreId
    }
  )

  if (!rpcError) return

  let query = supabase
    .from('grupo_temas')
    .update({ coevaluacion_habilitada: Boolean(habilitada) })

  if (grupoTemaId) {
    query = query.eq('id', grupoTemaId)
  } else {
    query = query
      .eq('grupo_id', grupoId)
      .eq('hemisemestre_id', hemisemestreId)
  }

  const { data, error } = await query.select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error(
      'No se pudo actualizar el grupo en la base de datos. Asegúrate de haber ejecutado el script SQL de migración en Supabase.'
    )
  }
}

// Actualiza el estado de coevaluación para un conjunto de grupos.
export async function actualizarEstadoCoevaluacionTodos(
  grupos,
  hemisemestreId,
  habilitada
) {
  if (!grupos || grupos.length === 0) return

  const payload = grupos.map(item => ({
    grupo_id: typeof item === 'object' ? item.id : item,
    habilitada: Boolean(habilitada)
  }))

  const { error: rpcError } = await supabase.rpc(
    'actualizar_coevaluacion_grupos',
    {
      p_cambios: payload,
      p_hemisemestre_id: hemisemestreId
    }
  )

  if (!rpcError) return

  const promesas = grupos.map(async item => {
    const temaId = typeof item === 'object' ? item.grupoTemaId : null
    const gId = typeof item === 'object' ? item.id : item

    let query = supabase
      .from('grupo_temas')
      .update({ coevaluacion_habilitada: Boolean(habilitada) })

    if (temaId) {
      query = query.eq('id', temaId)
    } else {
      query = query
        .eq('grupo_id', gId)
        .eq('hemisemestre_id', hemisemestreId)
    }

    const { data, error } = await query.select()
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error(
        'No se pudieron actualizar los grupos en la base de datos. Asegúrate de haber ejecutado el script SQL de migración en Supabase.'
      )
    }
  })

  await Promise.all(promesas)
}

// Consulta si la coevaluación para un grupo está habilitada en un hemisemestre.
export async function obtenerEstadoCoevaluacionGrupo(grupoId, hemisemestreId) {
  const { data, error } = await supabase
    .from('grupo_temas')
    .select('coevaluacion_habilitada')
    .eq('grupo_id', grupoId)
    .eq('hemisemestre_id', hemisemestreId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data?.coevaluacion_habilitada)
}

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
  const { data: miembrosActuales, error: errMiembros } = await supabase
    .from('grupo_miembros')
    .select('usuario_id, rol_grupo, lider')
    .eq('grupo_id', grupoId)
  if (errMiembros) throw errMiembros

  if (miembrosActuales.some(m => m.usuario_id === usuarioId)) {
    throw new Error('El estudiante ya pertenece a este grupo.')
  }

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
  const matriculadosUnicos = new Map(
    matriculados.map(m => [m.usuario_id, m])
  )
  return [...matriculadosUnicos.values()]
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

export async function obtenerReporteNotasHemisemestre(
  paraleloId,
  hemisemestreId,
  rubricas
) {
  const grupos = await obtenerGruposConDetalle(paraleloId, hemisemestreId)
  const estudiantes = grupos.flatMap(grupo => grupo.miembros)
  const ids = estudiantes.map(estudiante => estudiante.usuarioId)
  const mapaCalificaciones = await obtenerMapaCalificacionesDocente(
    ids,
    hemisemestreId
  )
  const totalEstudiantes = estudiantes.length
  const promediosPorEstudiante = new Map(
    (
      await Promise.all(
        grupos.flatMap(grupo =>
          grupo.miembros.map(async estudiante => [
            estudiante.usuarioId,
            await obtenerPromedioCoeval(
              grupo.id,
              hemisemestreId,
              estudiante.rolGrupo === 'evaluador'
                ? rubricas.coevEvaluador.id
                : rubricas.coevExpositor.id,
              estudiante.usuarioId
            )
          ])
        )
      )
    )
  )

  const filas = []
  const pendientesDocente = []
  const pendientesCoevaluacion = new Map()

  grupos.forEach(grupo => {
    const esperadas = totalEstudiantes - grupo.miembros.length
    grupo.miembros.forEach(estudiante => {
      const esEvaluador = estudiante.rolGrupo === 'evaluador'
      const calificacion = mapaCalificaciones.get(estudiante.usuarioId)
      const maxDoc = esEvaluador
        ? rubricas.docEvaluadorMax
        : rubricas.docExpositorMax
      const rubricaDocente = esEvaluador
        ? rubricas.docEvaluador.id
        : rubricas.docExpositor.id
      const maxCoev = esEvaluador
        ? rubricas.coevEvaluadorMax
        : rubricas.coevExpositorMax
      const promedio = promediosPorEstudiante.get(estudiante.usuarioId)
      const calificacionValida =
        calificacion?.rubrica_id === rubricaDocente ? calificacion : null
      const docente = calificacionValida
        ? (Number(calificacionValida.puntaje) / maxDoc) * 100
        : null
      const coevaluacion =
        promedio && promedio.cantidad >= esperadas
          ? (promedio.promedio / maxCoev) * 100
          : null

      if (!calificacionValida) pendientesDocente.push(estudiante.nombre)
      if (esperadas > 0 && (!promedio || promedio.cantidad < esperadas)) {
        pendientesCoevaluacion.set(grupo.id, {
          grupoNumero: grupo.numero,
          faltantes: esperadas - (promedio?.cantidad ?? 0)
        })
      }

      filas.push({
        nombre: estudiante.nombre,
        usuarioId: estudiante.usuarioId,
        grupoNumero: grupo.numero,
        rol: esEvaluador ? 'Evaluador' : 'Expositor',
        docente,
        coevaluacion,
        final:
          docente !== null && coevaluacion !== null
            ? (docente * 0.7 + coevaluacion * 0.3) / 10
            : null
      })
    })
  })

  return {
    filas,
    pendientesDocente,
    pendientesCoevaluacion: [...pendientesCoevaluacion.values()],
    totalEstudiantes
  }
}

// ---- Coevaluaciones ----

export async function yaCoevaluoGrupo(
  evaluadorId,
  grupoId,
  hemisemestreId,
  estudianteIds = null
) {
  const { data, error } = await supabase
    .from('coevaluaciones')
    .select('estudiante_evaluado_id')
    .eq('evaluador_id', evaluadorId)
    .eq('grupo_evaluado_id', grupoId)
    .eq('hemisemestre_id', hemisemestreId)
  if (error) throw error
  if (!estudianteIds) return (data ?? []).length > 0
  const evaluados = new Set(
    (data ?? []).map(fila => fila.estudiante_evaluado_id)
  )
  return estudianteIds.every(id => evaluados.has(id))
}

export async function guardarCoevaluacion({
  evaluadorId,
  grupoId,
  hemisemestreId,
  evaluaciones
}) {
  const filas = evaluaciones.map(evaluacion => ({
      evaluador_id: evaluadorId,
      grupo_evaluado_id: grupoId,
      hemisemestre_id: hemisemestreId,
      estudiante_evaluado_id: evaluacion.estudianteEvaluadoId,
      rubrica_id: evaluacion.rubricaId,
      respuestas: evaluacion.respuestas,
      puntaje: evaluacion.puntaje,
      actualizado_en: new Date().toISOString()
    }))
  const { error } = await supabase.from('coevaluaciones').upsert(filas, {
    onConflict:
      'evaluador_id,grupo_evaluado_id,hemisemestre_id,estudiante_evaluado_id,rubrica_id'
  })
  if (error) throw error
}

export async function obtenerPromedioCoeval(
  grupoId,
  hemisemestreId,
  rubricaId,
  estudianteId
) {
  const { data, error } = await supabase.rpc('obtener_coeval_promedio', {
    p_grupo_id: grupoId,
    p_hemisemestre_id: hemisemestreId,
    p_rubrica_id: rubricaId,
    p_estudiante_id: estudianteId
  })
  if (error) throw error
  const fila = data?.[0]
  if (!fila || fila.cantidad === 0) return null
  return { promedio: Number(fila.promedio), cantidad: Number(fila.cantidad) }
}
