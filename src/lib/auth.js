import { supabase } from './supabase.js'

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { data }
}

export async function cerrarSesion() {
  await supabase.auth.signOut()
}

export async function obtenerSesionActual() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function obtenerPerfil(usuarioId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, email, rol_sistema')
    .eq('id', usuarioId)
    .single()
  if (error) throw error
  return data
}

// Todos los paralelos del profesor, ordenados por más reciente.
// Devuelve { paralelos, contextoActivo }.
export async function obtenerContextosProfesor(profesorId) {
  const { data, error } = await supabase
    .from('paralelos')
    .select('id, codigo, creado_en, materias(id, nombre), periodos(id, nombre)')
    .eq('profesor_id', profesorId)
    .order('creado_en', { ascending: false })
  if (error) throw error
  if (!data || data.length === 0) return { paralelos: [], contextoActivo: null }

  const paralelos = data.map(p => ({
    paraleloId:    p.id,
    codigo:        p.codigo,
    materiaId:     p.materias?.id,
    materiaNombre: p.materias?.nombre ?? '—',
    periodoId:     p.periodos?.id,
    periodoNombre: p.periodos?.nombre ?? '—',
    etiqueta:      `${p.materias?.nombre ?? '—'} ${p.codigo} · ${p.periodos?.nombre ?? '—'}`,
  }))

  return { paralelos, contextoActivo: paralelos[0] }
}

// Contexto del estudiante: matrícula más reciente + grupo asignado.
export async function obtenerContextoEstudiante(usuarioId) {
  const { data, error } = await supabase
    .from('matriculas')
    .select('paralelo_id, paralelos(codigo, materias(nombre), periodos(nombre))')
    .eq('usuario_id', usuarioId)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const { data: miembro, error: errM } = await supabase
    .from('grupo_miembros')
    .select('grupo_id, rol_grupo, lider')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (errM) throw errM

  const p = data.paralelos
  return {
    paraleloId:    data.paralelo_id,
    codigo:        p?.codigo ?? '',
    materiaNombre: p?.materias?.nombre ?? '—',
    periodoNombre: p?.periodos?.nombre ?? '—',
    etiqueta:      `${p?.materias?.nombre ?? '—'} ${p?.codigo ?? ''} · ${p?.periodos?.nombre ?? '—'}`,
    grupoId:       miembro?.grupo_id  ?? null,
    rolGrupo:      miembro?.rol_grupo ?? null,
    lider:         miembro?.lider     ?? false,
  }
}
