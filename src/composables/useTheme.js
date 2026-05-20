// src/composables/useTheme.js
import { ref, onMounted, computed } from 'vue'

const THEME_KEY = 'kura_theme_preference'
const VALID_THEMES = ['light', 'dark']

/**
 * Composable para gestionar el sistema de temas claro/oscuro
 * @returns {Object} Métodos y estado reactivo para control del tema
 */
export function useTheme() {
  const currentTheme = ref('dark')
  const isInitialized = ref(false)

  /**
   * Aplica el tema al elemento HTML y guarda preferencia
   * @param {string} theme - 'light' o 'dark'
   */
  const applyTheme = (theme) => {
    if (!VALID_THEMES.includes(theme)) return
    
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    
    currentTheme.value = theme
    localStorage.setItem(THEME_KEY, theme)
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    applyTheme(newTheme)
  }

  /**
   * Inicializa el tema desde localStorage o preferencia del sistema
   */
  const initTheme = () => {
    if (isInitialized.value) return
    
    const savedTheme = localStorage.getItem(THEME_KEY)
    
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      applyTheme(savedTheme)
    } else {
      // Detectar preferencia del sistema operativo
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      applyTheme(prefersLight ? 'light' : 'dark')
    }
    
    isInitialized.value = true
  }

  /**
   * Escucha cambios en la preferencia del sistema (solo si no hay preferencia guardada)
   */
  const setupSystemPreferenceListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    
    const handleChange = (e) => {
      const hasUserPreference = localStorage.getItem(THEME_KEY)
      if (!hasUserPreference) {
        applyTheme(e.matches ? 'light' : 'dark')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    // Cleanup en onUnmounted si se usa en componente
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  onMounted(() => {
    initTheme()
  })

  return {
    currentTheme,
    isDark: computed(() => currentTheme.value === 'dark'),
    isLight: computed(() => currentTheme.value === 'light'),
    toggleTheme,
    applyTheme,
    initTheme,
    setupSystemPreferenceListener
  }
}