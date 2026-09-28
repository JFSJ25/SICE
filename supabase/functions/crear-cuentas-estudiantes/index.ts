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

async function buscarUsuarioAuthPorEmail(adminClient: any, email: string) {
  const perPage = 1000
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage
    })
    if (error) return { user: null, error }

    const user = data.users.find(
      (usuario: { email?: string }) => usuario.email?.toLowerCase() === email
    )
    if (user) return { user, error: null }
    if (data.users.length < perPage) break
  }

  return { user: null, error: null }
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
      { error: 'Solo un profesor o administrador puede crear cuentas' },
      403
    )

  let body: { personas?: unknown }
  try {
    body = await request.json()
  } catch {
    return respuesta({ error: 'El cuerpo debe ser JSON válido' }, 400)
  }

  if (!Array.isArray(body.personas) || body.personas.length === 0)
    return respuesta(
      { error: "El body debe incluir 'personas' con al menos un registro" },
      400
    )

  const creados: Array<Record<string, string>> = []
  const errores: Array<Record<string, string>> = []

  for (const registro of body.personas) {
    const persona = registro as { nombre_completo?: unknown; email?: unknown }
    const nombre = String(persona.nombre_completo ?? '').trim()
    const email = String(persona.email ?? '')
      .trim()
      .toLowerCase()

    if (!nombre || !email || !email.includes('@')) {
      errores.push({ email, mensaje: 'Nombre o correo inválido' })
      continue
    }

    const password = generarPassword()
    const { data: cuenta, error: cuentaError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre_completo: nombre }
      })

    if (cuentaError || !cuenta.user) {
      const esCorreoExistente =
        cuentaError?.code === 'email_exists' ||
        cuentaError?.status === 422 ||
        cuentaError?.message?.toLowerCase().includes('already registered')

      if (esCorreoExistente) {
        const { user, error: usuarioConsultaError } =
          await buscarUsuarioAuthPorEmail(adminClient, email)

        if (usuarioConsultaError) {
          errores.push({ email, mensaje: usuarioConsultaError.message })
          continue
        }

        if (user) {
          const { data: perfilExistente, error: perfilConsultaError } =
            await adminClient
              .from('usuarios')
              .select('id')
              .eq('id', user.id)
              .maybeSingle()

          if (perfilConsultaError) {
            errores.push({ email, mensaje: perfilConsultaError.message })
            continue
          }

          const { error: passwordError } =
            await adminClient.auth.admin.updateUserById(user.id, {
              password,
              user_metadata: { nombre_completo: nombre }
            })

          if (passwordError) {
            errores.push({ email, mensaje: passwordError.message })
            continue
          }

          const perfilError = perfilExistente
            ? (
                await adminClient
                  .from('usuarios')
                  .update({ nombre_completo: nombre })
                  .eq('id', user.id)
              ).error
            : (
                await adminClient.from('usuarios').insert({
                  id: user.id,
                  nombre_completo: nombre,
                  email,
                  rol_sistema: 'estudiante'
                })
              ).error

          if (perfilError) {
            errores.push({ email, mensaje: perfilError.message })
            continue
          }

          creados.push({
            id: user.id,
            nombre_completo: nombre,
            email,
            password
          })
          continue
        }
      }

      errores.push({
        email,
        mensaje: cuentaError?.message ?? 'No se pudo crear la cuenta'
      })
      continue
    }

    const { error: perfilInsertError } = await adminClient
      .from('usuarios')
      .insert({
        id: cuenta.user.id,
        nombre_completo: nombre,
        email,
        rol_sistema: 'estudiante'
      })

    if (perfilInsertError) {
      await adminClient.auth.admin.deleteUser(cuenta.user.id)
      errores.push({ email, mensaje: perfilInsertError.message })
      continue
    }

    creados.push({
      id: cuenta.user.id,
      nombre_completo: nombre,
      email,
      password
    })
  }

  return respuesta({ creados, errores })
})