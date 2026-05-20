<!-- src/App.vue -->
<script setup>
import { onMounted, computed, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import TopNav from '@/components/common/TopNav.vue'
import Footer from '@/components/common/Footer.vue'

const { initTheme, setupSystemPreferenceListener } = useTheme()

onMounted(() => {
  initTheme()
  const cleanup = setupSystemPreferenceListener()
  
  // Cleanup listener al desmontar
  onUnmounted(() => {
    if (cleanup) cleanup()
  })
})
</script>

<template>
  <div class="app-wrapper">
    <TopNav />
    
    <main class="main-content">
      <RouterView />
    </main>
    
    <Footer />
  </div>
</template>

<style>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg);
}
</style>