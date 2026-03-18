<template>
  <div class="home-view">
    <!-- Navegación Superior -->
    <TopNav />   
  
    <!-- Contenido Principal -->
    <main class="home-content container">
      
      <!-- Hero Section -->
      <header class="hero-header">
        <h1 class="title-gradient">Kura</h1>
        <p class="tagline">Plataforma de descubrimiento cultural</p>
      </header>
      
      <!-- Saludo Personalizado (Sin Emojis) -->
      <transition name="fade" mode="out-in">
        <div v-if="isAuthenticated" key="greeting" class="user-greeting-card">
          <div class="greeting-icon-wrapper">
            <!-- Icono SVG: Usuario / Perfil -->
            <svg class="greeting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="greeting-text">
            <p>Bienvenido de nuevo, <strong>{{ user?.email?.split('@')[0] }}</strong></p>
            <p class="sub-greeting">Tu colección te espera.</p>
          </div>
        </div>
      </transition>

      <!-- Botones de Acción -->
      <div class="home-actions">
        <router-link to="/explore" class="btn btn-primary">
          <span>Explorar catálogo</span>
          <!-- Icono SVG: Flecha derecha / Explorar -->
          <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </router-link>
        
        <router-link 
          v-if="isAuthenticated" 
          to="/dashboard" 
          class="btn btn-secondary"
        >
          <!-- Icono SVG: Dashboard / Grid -->
          <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Mi Dashboard</span>
        </router-link>
      </div>
      
      <!-- Sección Informativa (Solo no autenticados) -->
      <transition name="slide-up">
        <div v-if="!isAuthenticated" key="info" class="home-info card-glass">
          <div class="info-content">
            <div class="info-header">
              <!-- Icono SVG: Museo / Arte -->
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18"></path>
                <path d="M5 21V7l8-4 8 4v14"></path>
                <path d="M10 9a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0z"></path>
                <path d="M10 21v-2a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2"></path>
              </svg>
              <h3>¿Qué es Kura?</h3>
            </div>
            <p>
              Una plataforma curada que conecta obras maestras de museos internacionales 
              con coleccionistas digitales. Explora, organiza y comparte patrimonio cultural 
              a través de colecciones temáticas personalizadas.
            </p>
          </div>
          <div class="info-action">
            <router-link to="/register" class="btn btn-outline">
              Comenzar ahora
            </router-link>
          </div>
        </div>
      </transition>

    </main>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import TopNav from '@/components/common/TopNav.vue'

const { user, isAuthenticated, signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
}
</script>

<style scoped>
/* ============================================
   LAYOUT & FONDO
   ============================================ */
.home-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Iluminación ambiental sutil (Teal oscuro) */
.home-view::before {
  content: '';
  position: absolute;
  top: -15%;
  left: 50%;
  transform: translateX(-50%);
  width: 90vw;
  height: 80vh;
  background: radial-gradient(circle, rgba(19, 70, 71, 0.4) 0%, transparent 70%);
  opacity: 0.6;
  z-index: 0;
  pointer-events: none;
  filter: blur(60px);
}

.home-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: var(--spacing-xxl);
  padding-bottom: var(--spacing-xxl);
  text-align: center;
  flex: 1;
  width: 100%;
}

/* ============================================
   HERO TYPOGRAPHY
   ============================================ */
.hero-header {
  margin-bottom: var(--spacing-xl);
  animation: fadeIn 0.8s ease-out;
}

.title-gradient {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 var(--spacing-sm);
  background: linear-gradient(135deg, #ffffff 0%, var(--kura-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.tagline {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  color: var(--text-secondary);
  font-weight: 300;
  max-width: 600px;
  margin: 0 auto;
  letter-spacing: 0.02em;
}

/* ============================================
   USER GREETING (SERIOUS STYLE)
   ============================================ */
.user-greeting-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  backdrop-filter: blur(10px);
  animation: slideDown 0.6s ease-out;
  text-align: left;
}

.greeting-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(191, 172, 139, 0.1); /* Dorado muy suave */
  border-radius: 50%;
  color: var(--kura-gold);
  flex-shrink: 0;
}

.greeting-icon {
  width: 20px;
  height: 20px;
}

.greeting-text p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.greeting-text strong {
  color: var(--text-primary);
  font-weight: 600;
}

.sub-greeting {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
  font-weight: 400;
}

/* ============================================
   ACTION BUTTONS
   ============================================ */
.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xxl);
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0.875rem 2.25rem;
  border-radius: var(--radius-full);
  font-weight: 500;
  font-size: 1rem;
  text-decoration: none;
  transition: all var(--transition-normal);
  cursor: pointer;
  border: 1px solid transparent;
  letter-spacing: 0.01em;
}

/* Primary: Teal Brillante */
.btn-primary {
  background-color: var(--kura-bright-teal);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(12, 126, 126, 0.3);
}

.btn-primary:hover {
  background-color: #0f9e9e;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(12, 126, 126, 0.5);
}

.btn-primary .icon-arrow {
  width: 18px;
  height: 18px;
  transition: transform var(--transition-fast);
}

.btn-primary:hover .icon-arrow {
  transform: translateX(4px);
}

/* Secondary: Glass/Border */
.btn-secondary {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.btn-secondary:hover {
  border-color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.btn-secondary .icon-small {
  width: 18px;
  height: 18px;
}

/* Outline: Gold Accent */
.btn-outline {
  background-color: transparent;
  border: 1px solid var(--kura-gold);
  color: var(--kura-gold);
  width: 100%;
  justify-content: center;
}

@media (min-width: 640px) {
  .btn-outline {
    width: auto;
  }
}

.btn-outline:hover {
  background-color: var(--kura-gold);
  color: var(--kura-black);
  box-shadow: 0 0 15px rgba(191, 172, 139, 0.3);
  transform: translateY(-2px);
}

/* ============================================
   INFO CARD (GLASSMORPHISM)
   ============================================ */
.home-info {
  width: 100%;
  max-width: 700px;
  animation: slideUp 0.8s ease-out;
}

.card-glass {
  background: rgba(19, 70, 71, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  text-align: left;
}

@media (min-width: 768px) {
  .card-glass {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg) var(--spacing-xl);
    gap: var(--spacing-xl);
  }
}

.info-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  justify-content: flex-start;
}

@media (min-width: 768px) {
  .info-header {
    margin-bottom: 0;
    flex-direction: column;
    text-align: center;
  }
}

.info-icon {
  width: 32px;
  height: 32px;
  color: var(--kura-gold);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .info-icon {
    margin-bottom: var(--spacing-xs);
  }
}

.info-content h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.info-content p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
  margin: 0;
}

.info-action {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Vue Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(25px);
}
</style>