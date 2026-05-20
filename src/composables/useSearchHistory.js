// src/composables/useSearchHistory.js
import { ref } from 'vue'

const HISTORY_KEY = 'kura_search_history'
const MAX_ITEMS = 10

/**
 * Composable para gestionar el historial de búsquedas recientes
 * Persiste en localStorage y limita a los 10 últimos términos únicos.
 */
export function useSearchHistory() {
  const history = ref([])

  /** Carga el historial desde localStorage al inicializar */
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      history.value = stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('[SearchHistory] Error al cargar historial:', e)
      history.value = []
    }
  }

  /** Guarda el historial actual en localStorage */
  const saveHistory = () => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
    } catch (e) {
      console.error('[SearchHistory] Error al guardar historial:', e)
    }
  }

  /** Añade un término al inicio de la lista (elimina duplicados y respeta el límite) */
  const addTerm = (term) => {
    const cleanTerm = term?.trim()
    if (!cleanTerm) return

    // Eliminar si ya existe para moverlo al principio
    history.value = history.value.filter(t => t !== cleanTerm)
    history.value.unshift(cleanTerm)

    // Recortar si supera el límite
    if (history.value.length > MAX_ITEMS) {
      history.value = history.value.slice(0, MAX_ITEMS)
    }

    saveHistory()
  }

  /** Elimina un término específico */
  const removeTerm = (term) => {
    history.value = history.value.filter(t => t !== term)
    saveHistory()
  }

  /** Limpia todo el historial */
  const clearHistory = () => {
    history.value = []
    localStorage.removeItem(HISTORY_KEY)
  }

  // Carga automática al instanciar el composable
  loadHistory()

  return {
    history,
    addTerm,
    removeTerm,
    clearHistory
  }
}