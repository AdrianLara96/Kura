// ============================================
// COMPOSABLE: useSessionTimeout.js
// ============================================
// Detecta inactividad del usuario y cierra sesión automáticamente (24h)

import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/supabase/client'
import { useRouter } from 'vue-router'

// Configuración: 24 horas en milisegundos
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000 // 86400000 ms
const STORAGE_KEY = 'kura_last_activity'

export function useSessionTimeout() {
  const router = useRouter()
  const lastActivityTime = ref(Date.now())
  const checkInterval = ref(null)
  const isWatching = ref(false)

  /**
   * Obtiene el timestamp de última actividad desde localStorage
   */
  function getLastActivityFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : Date.now()
  }

  /**
   * Guarda el timestamp en localStorage
   */
  function saveActivityToStorage(timestamp) {
    localStorage.setItem(STORAGE_KEY, timestamp.toString())
  }

  /**
   * Limpia el timestamp de localStorage
   */
  function clearActivityFromStorage() {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Actualiza el timestamp de última actividad
   */
  function updateLastActivity() {
    lastActivityTime.value = Date.now()
    saveActivityToStorage(lastActivityTime.value)
  }

  /**
   * Verifica si ha pasado el tiempo de inactividad
   */
  function checkInactivity() {
    // Obtener tiempo actualizado desde storage (por si se recargó la página)
    const storedTime = getLastActivityFromStorage()
    const timeSinceLastActivity = Date.now() - storedTime

    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      console.log('Sesión cerrada por inactividad (24h)')
      logout()
    }
  }

  /**
   * Cierra sesión y redirige al home
   */
  async function logout() {
    await supabase.auth.signOut()
    clearActivityFromStorage()
    router.push('/')
    alert('Tu sesión ha expirado por inactividad (24h). Por favor, inicia sesión nuevamente.')
  }

  /**
   * Inicia el monitor de inactividad
   */
  function startMonitoring() {
    if (isWatching.value) return

    isWatching.value = true

    // Restaurar última actividad desde storage
    lastActivityTime.value = getLastActivityFromStorage()

    // Escuchar eventos de actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      window.addEventListener(event, updateLastActivity, { passive: true })
    })

    // Verificar cada minuto si hay inactividad
    checkInterval.value = setInterval(checkInactivity, 60000) // 60 segundos

    console.log('Monitor de inactividad iniciado (24h)')
  }

  /**
   * Detiene el monitor de inactividad
   */
  function stopMonitoring() {
    if (!isWatching.value) return

    isWatching.value = false

    // Remover listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      window.removeEventListener(event, updateLastActivity)
    })

    // Limpiar intervalo
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
      checkInterval.value = null
    }

    console.log('Monitor de inactividad detenido')
  }

  /**
   * Inicializa el composable al montar el componente
   */
  onMounted(() => {
    // Solo iniciar si hay sesión activa
    supabase.auth.getSession().then(({   session  }) => {
      if (session) {
        // Guardar timestamp inicial si no existe
        if (!localStorage.getItem(STORAGE_KEY)) {
          saveActivityToStorage(Date.now())
        }
        startMonitoring()
      } else {
        clearActivityFromStorage()
      }
    })

    // Escuchar cambios de auth
    const {   subscription  } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        saveActivityToStorage(Date.now())
        startMonitoring()
      } else if (event === 'SIGNED_OUT') {
        stopMonitoring()
        clearActivityFromStorage()
      }
    })

    // Limpiar al desmontar
    onUnmounted(() => {
      stopMonitoring()
      subscription.unsubscribe()
    })
  })

  return {
    startMonitoring,
    stopMonitoring,
    lastActivityTime,
    logout
  }
}