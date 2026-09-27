import { supabase } from './supabase.js'

const cache = {}

export async function obtenerRubrica(tipo) {
  if (cache[tipo]) return cache[tipo]

  const { data, error } = await supabase
    .from('rubricas')
    .select(`
      id, tipo, nombre, nota_especial,
      rubrica_categorias (
        id, nombre, orden,
        rubrica_criterios (
          id, nombre, observacion, orden,
          rubrica_opciones ( id, etiqueta, puntos, orden )
        )
      )
    `)
    .eq('tipo', tipo)
    .eq('activa', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('No hay rúbrica activa para el tipo ' + tipo)

  data.rubrica_categorias.sort((a, b) => a.orden - b.orden)
  data.rubrica_categorias.forEach(cat => {
    cat.rubrica_criterios.sort((a, b) => a.orden - b.orden)
    cat.rubrica_criterios.forEach(crit => {
      crit.rubrica_opciones.sort((a, b) => a.orden - b.orden)
    })
  })

  cache[tipo] = data
  return data
}

export function puntajeMaximo(rubrica) {
  let max = 0
  rubrica.rubrica_categorias.forEach(cat =>
    cat.rubrica_criterios.forEach(crit => {
      max += Math.max(...crit.rubrica_opciones.map(o => Number(o.puntos)))
    })
  )
  return max
}

// Devuelve { respuestas, completo, puntaje } a partir de un Map criterioId→opcionId.
export function leerRespuestas(rubrica, seleccionadas) {
  const respuestas = {}
  let completo = true
  let puntaje = 0
  rubrica.rubrica_categorias.forEach(cat =>
    cat.rubrica_criterios.forEach(crit => {
      const opcionId = seleccionadas.get(crit.id)
      if (!opcionId) { completo = false; return }
      respuestas[crit.id] = opcionId
      const opcion = crit.rubrica_opciones.find(o => o.id === opcionId)
      if (opcion) puntaje += Number(opcion.puntos)
    })
  )
  return { respuestas, completo, puntaje }
}
