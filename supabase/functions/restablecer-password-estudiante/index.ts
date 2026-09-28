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

function generarPassword() {
  const caracteres =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const valores = new Uint32Array(12)
  crypto.getRandomValues(valores)
  return Array.from(
    valores,
    valor => caracteres[valor % caracteres.length]
  ).join('')
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
      {
        error: 'Solo un profesor o administrador puede restablecer contraseñas'
      },
      403
    )

  let body: { estudianteId?: unknown }
  try {
    body = await request.json()
  } catch {
    return respuesta({ error: 'El cuerpo debe ser JSON válido' }, 400)
  }

  const estudianteId = String(body.estudianteId ?? '').trim()
  if (!estudianteId)
    return respuesta({ error: 'Debe indicar el estudiante a restablecer' }, 400)

  const { data: estudiante, error: estudianteError } = await adminClient
    .from('usuarios')
    .select('id, nombre_completo, email, rol_sistema')
    .eq('id', estudianteId)
    .eq('rol_sistema', 'estudiante')
    .maybeSingle()

  if (estudianteError) return respuesta({ error: estudianteError.message }, 500)
  if (!estudiante) return respuesta({ error: 'El estudiante no existe' }, 404)

  const password = generarPassword()
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    estudiante.id,
    {
      password,
      email_confirm: true,
      user_metadata: { nombre_completo: estudiante.nombre_completo }
    }
  )

  if (updateError) return respuesta({ error: updateError.message }, 500)

  return respuesta({
    estudiante: {
      id: estudiante.id,
      nombre_completo: estudiante.nombre_completo,
      email: estudiante.email
    },
    password_temporal: password
  })
})
