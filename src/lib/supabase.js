import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const WATCHDOG_TIMEOUT_MS = 5000
const resetListeners = new Set()
const fetchOriginal = globalThis.fetch.bind(globalThis)
let healthCheckPromise = null
let lastRecoveryAt = 0
let lastVisibleAt = 0

function crearCliente() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: fetchConWatchdog
    }
  })
}

export let supabase = crearCliente()

export function onSupabaseReset(callback) {
  resetListeners.add(callback)
  return () => resetListeners.delete(callback)
}

export function resetSupabase(reason) {
  const previousClient = supabase
  try {
    previousClient.auth.dispose?.()
  } catch (error) {
    console.warn(
      '[Supabase watchdog] Error al liberar el cliente anterior',
      error
    )
  }

  supabase = crearCliente()
  console.warn('[Supabase watchdog] Cliente recreado', {
    reason,
    at: new Date().toISOString()
  })
  resetListeners.forEach(callback => callback(supabase))
  return supabase
}

function conTimeout(promise, timeoutMs) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(`Supabase no respondió en ${timeoutMs} ms`)
      error.code = 'SUPABASE_WATCHDOG_TIMEOUT'
      reject(error)
    }, timeoutMs)
  })
  promise.catch(() => {})
  return Promise.race([promise, timeout])
}

async function fetchConWatchdog(input, init) {
  const despuesDeVolver =
    lastVisibleAt > 0 && Date.now() - lastVisibleAt < 30000
  if (!despuesDeVolver) return fetchOriginal(input, init)

  try {
    return await conTimeout(fetchOriginal(input, init), WATCHDOG_TIMEOUT_MS)
  } catch (error) {
    if (error.code !== 'SUPABASE_WATCHDOG_TIMEOUT') throw error

    const now = Date.now()
    if (now - lastRecoveryAt < WATCHDOG_TIMEOUT_MS) throw error
    lastRecoveryAt = now
    console.warn(
      '[Supabase watchdog] Query sin respuesta; reiniciando y reintentando',
      {
        timeoutMs: WATCHDOG_TIMEOUT_MS,
        at: new Date().toISOString()
      }
    )
    resetSupabase('query timeout after focus')
    return fetchOriginal(input, init)
  }
}

async function comprobarSalud() {
  if (document.visibilityState === 'hidden') return

  try {
    await conTimeout(supabase.auth.getSession(), WATCHDOG_TIMEOUT_MS)
  } catch (error) {
    const now = Date.now()
    if (now - lastRecoveryAt < WATCHDOG_TIMEOUT_MS) return
    lastRecoveryAt = now
    console.warn('[Supabase watchdog] Posible lock bloqueado; reiniciando', {
      message: error.message,
      timeoutMs: WATCHDOG_TIMEOUT_MS
    })

    const recoveredClient = resetSupabase('auth health check timeout')
    try {
      await conTimeout(recoveredClient.auth.getSession(), WATCHDOG_TIMEOUT_MS)
      console.info('[Supabase watchdog] Cliente recuperado')
    } catch (retryError) {
      console.error(
        '[Supabase watchdog] El cliente nuevo tampoco respondió',
        retryError
      )
    }
  }
}

function programarComprobacion() {
  if (healthCheckPromise) return
  lastVisibleAt = Date.now()
  healthCheckPromise = comprobarSalud().finally(() => {
    healthCheckPromise = null
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') programarComprobacion()
  })
  window.addEventListener('focus', programarComprobacion)
}
