<!-- src/components/common/Footer.vue -->
<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Sección principal -->
      <div class="footer-main">
        <div class="footer-brand">
          <h3 class="footer-logo">Kura</h3>
          <p class="footer-tagline">Descubre arte. Crea colecciones. Conecta cultura.</p>
        </div>
        
        <nav class="footer-links">
          <div class="link-group">
            <h4>Plataforma</h4>
            <ul>
              <li><router-link to="/explore">Explorar</router-link></li>
              <li><router-link to="/collections">Colecciones</router-link></li>
              <li><router-link to="/dashboard" v-if="isAuthenticated">Dashboard</router-link></li>
            </ul>
          </div>
          
          <div class="link-group">
            <h4>Información</h4>
            <ul>
              <li><a href="#about" @click.prevent="showAbout">Sobre Kura</a></li>
              <li><a href="#contact" @click.prevent="showContact">Contacto</a></li>
              <li><a href="/api-docs" target="_blank" rel="noopener">API</a></li>
            </ul>
          </div>
          
          <div class="link-group">
            <h4>Legal</h4>
            <ul>
                <li><a href="#" @click.prevent="showModal('privacy')">Privacidad</a></li>
                <li><a href="#" @click.prevent="showModal('terms')">Términos</a></li>
            </ul>
          </div>
        </nav>
      </div>
      
      <!-- Sección inferior -->
      <div class="footer-bottom">
        <p class="copyright">
          &copy; {{ currentYear }} Kura. Proyecto educativo cultural.
        </p>
        <p class="attribution">
          Datos proporcionados por <a href="https://metmuseum.github.io/" target="_blank" rel="noopener">The Met API</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated } = useAuth()
const currentYear = computed(() => new Date().getFullYear())

const showAbout = () => {
  // Implementar modal o navegación a sección about aquí en un futuro
  console.log('Mostrar información sobre Kura')
}

const showContact = () => {
  // Implementar formulario de contacto o mailto más adelante
  window.location.href = 'mailto:contacto@kura-app.dev'
}

const showModal = (type) => {
  // Implementación temporal: mostrar mensaje en consola o alerta
  console.log(`Mostrar modal de ${type}`)
  alert(`Página de ${type === 'privacy' ? 'Privacidad' : 'Términos'} en desarrollo.`)
}
</script>

<style scoped>
.footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-primary);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-md);
}

.footer-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-primary);
}

@media (min-width: 768px) {
  .footer-main {
    grid-template-columns: 1fr 2fr;
    align-items: start;
  }
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.footer-tagline {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (min-width: 480px) {
  .footer-links {
    grid-template-columns: repeat(3, 1fr);
  }
}

.link-group h4 {
  color: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
}

.link-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.link-group a {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.link-group a:hover {
  color: var(--color-accent-primary);
}

.link-group a:focus {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-md);
  text-align: center;
}

@media (min-width: 480px) {
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }
}

.copyright,
.attribution {
  color: var(--color-text-tertiary);
  font-size: 0.85rem;
  margin: 0;
}

.attribution a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.attribution a:hover {
  color: var(--color-accent-primary);
}
</style>