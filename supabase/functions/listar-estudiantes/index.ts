import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

function respuesta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST')
    return respuesta({ error: 'Método no permitido' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey)
    return respuesta({ error: 'Faltan variables de entorno de Supabase' }, 500)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer '))
    return respuesta({ error: 'Se requiere una sesión autenticada' }, 401)

  const token = authorization.slice('Bearer '.length)
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: authData, error: authError } =
    await authClient.auth.getUser(token)
  if (authError || !authData.user)
    return respuesta({ error: 'Sesión inválida o expirada' }, 401)

  const { data: perfil, error: perfilError } = await adminClient
    .from('usuarios')
    .select('rol_sistema')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (perfilError) return respuesta({ error: perfilError.message }, 500)
  if (!perfil || !['profesor', 'admin'].includes(perfil.rol_sistema))
    return respuesta(
      { error: 'Solo un profesor o administrador puede consultar estudiantes' },
      403
    )

  let body: { busqueda?: unknown }
  try {
    body = await request.json()
  } catch {
    return respuesta({ error: 'El cuerpo debe ser JSON válido' }, 400)
  }

  const busqueda = String(body.busqueda ?? '').trim()
  let consulta = adminClient
    .from('usuarios')
    .select('id, nombre_completo, email')
    .eq('rol_sistema', 'estudiante')
    .order('nombre_completo', { ascending: true })
    .limit(100)

  if (busqueda) {
    const termino = busqueda.replace(/[%_,]/g, '')
    if (termino) {
      consulta = consulta.or(
        `nombre_completo.ilike.%${termino}%,email.ilike.%${termino}%`
      )
    }
  }

  const { data: estudiantes, error: estudiantesError } = await consulta
  if (estudiantesError)
    return respuesta({ error: estudiantesError.message }, 500)

  return respuesta({ estudiantes: estudiantes ?? [] })
})
