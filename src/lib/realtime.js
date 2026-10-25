import { useEffect, useRef } from 'react'
import { onSupabaseReset, supabase } from './supabase.js'

const DEFAULT_DEBOUNCE_MS = 300

export function useRealtimeRefresh({
  subscriptions,
  onChange,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return undefined

    let timer = null
    let pendingPayloads = []
    let cleanup = () => {}

    const scheduleRefresh = payload => {
      pendingPayloads.push(payload)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        const payloads = pendingPayloads
        pendingPayloads = []
        onChangeRef.current({ silent: true, payloads })
      }, debounceMs)
    }

    const subscribe = client => {
      const channel = client
        .channel(`sice-refresh-${crypto.randomUUID()}`)
        .on(
          'postgres_changes',
          subscriptions[0],
          scheduleRefresh
        )

      subscriptions.slice(1).forEach(subscription => {
        channel.on('postgres_changes', subscription, scheduleRefresh)
      })

      channel.subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Supabase Realtime] No se pudo suscribir al canal', {
            status,
            subscriptions
          })
        }
      })
      return () => {
        if (timer) clearTimeout(timer)
        timer = null
        pendingPayloads = []
        client.removeChannel(channel)
      }
    }

    cleanup = subscribe(supabase)
    const unsubscribeFromReset = onSupabaseReset(client => {
      cleanup()
      cleanup = subscribe(client)
    })

    return () => {
      unsubscribeFromReset()
      cleanup()
    }
  }, [debounceMs, enabled, subscriptions])
}
