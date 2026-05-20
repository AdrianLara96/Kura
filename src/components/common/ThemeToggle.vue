<!-- src/components/common/ThemeToggle.vue -->
<template>
  <button
    type="button"
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="isDark ? 'Activar tema claro' : 'Activar tema oscuro'"
    :title="isDark ? 'Tema claro' : 'Tema oscuro'"
  >
    <span class="icon-container">
      <!-- Icono sol -->
      <svg 
        v-if="isDark" 
        class="icon icon-light" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
      
      <!-- Icono luna -->
      <svg 
        v-else 
        class="icon icon-dark" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { currentTheme, toggleTheme } = useTheme()
const isDark = computed(() => currentTheme.value === 'dark')
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: var(--spacing-xs);
  background: transparent;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-primary);
}

.theme-toggle:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-secondary);
}

.theme-toggle:focus {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.icon-container {
  position: relative;
  width: 20px;
  height: 20px;
}

.icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.icon-light {
  opacity: 1;
  transform: scale(1);
}

.icon-dark {
  opacity: 1;
  transform: scale(1);
}

/* Animación de transición entre iconos */
.theme-toggle:hover .icon {
  transform: scale(1.05);
}
</style>