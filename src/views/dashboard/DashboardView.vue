<template>
  <div class="dashboard-view">
    <TopNav />

    <main class="dashboard-content container">
      
      <!-- Cabecera del Dashboard -->
      <header class="dashboard-header">
        <div class="header-text">
          <h1 class="page-title">Panel de Control</h1>
          <p class="user-subtitle">
            Bienvenido de nuevo, <span class="highlight">{{ user?.email?.split('@')[0] }}</span>
          </p>
        </div>
        <div class="header-actions">
          <router-link to="/my-profile" class="btn btn-outline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Editar Perfil</span>
          </router-link>
        </div>
      </header>

      <!-- Grid de Contenido -->
      <div class="dashboard-grid">
        
        <!-- Tarjeta 1: Mis Colecciones (Placeholder) -->
        <section class="card glass-card">
          <div class="card-header">
            <div class="card-title-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <h2>Mis Colecciones</h2>
            </div>
            <router-link to="/collections/new" class="link-action">Ver todas</router-link>
          </div>
          <div class="card-body empty-state">
            <p>Aún no has creado ninguna colección.</p>
            <button class="btn btn-text-accent">Crear primera colección</button>
          </div>
        </section>

        <!-- Tarjeta 2: Obras Favoritas (Placeholder) -->
        <section class="card glass-card">
          <div class="card-header">
            <div class="card-title-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <h2>Obras Favoritas</h2>
            </div>
            <router-link to="/explore" class="link-action">Explorar</router-link>
          </div>
          <div class="card-body empty-state">
            <p>No has guardado obras todavía.</p>
            <button class="btn btn-text-accent">Descubrir obras</button>
          </div>
        </section>

        <!-- Tarjeta 3: Actividad Reciente / Estadísticas -->
        <section class="card glass-card full-width">
          <div class="card-header">
            <div class="card-title-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <h2>Actividad Reciente</h2>
            </div>
          </div>
          <div class="card-body empty-state">
            <p>Tu actividad reciente aparecerá aquí.</p>
          </div>
        </section>

      </div>

      <!-- Footer de sesión (Opcional, si se quiere cerrar desde aquí también) -->
      <div class="dashboard-footer">
        <button @click="handleLogout" class="btn btn-logout-full">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </button>
        <router-link to="/" class="link-muted">← Volver al inicio</router-link>
      </div>

    </main>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import TopNav from '@/components/common/TopNav.vue'

const { user, signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
}
</script>

<style scoped>
/* ============================================
   LAYOUT GENERAL
   ============================================ */
.dashboard-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xxl);
  flex: 1;
}

/* ============================================
   HEADER DEL DASHBOARD
   ============================================ */
.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xxl);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--spacing-lg);
}

@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.user-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0;
}

.highlight {
  color: var(--kura-gold);
  font-weight: 600;
}

/* ============================================
   GRID SYSTEM
   ============================================ */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ============================================
   TARJETAS (GLASS CARDS)
   ============================================ */
.card {
  background: rgba(19, 70, 71, 0.15); /* Teal muy sutil */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-normal), border-color var(--transition-normal);
}

.card:hover {
  border-color: rgba(191, 172, 139, 0.3); /* Borde dorado suave al hover */
  transform: translateY(-4px);
}

.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-icon {
  width: 24px;
  height: 24px;
  color: var(--kura-gold);
  flex-shrink: 0;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.link-action {
  font-size: 0.85rem;
  color: var(--kura-bright-teal);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.link-action:hover {
  color: #fff;
  text-decoration: underline;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: var(--spacing-lg) 0;
  color: var(--text-secondary);
  min-height: 120px;
}

.empty-state p {
  margin: 0 0 var(--spacing-md);
  font-size: 0.95rem;
}

/* ============================================
   BOTONES Y ACCIONES
   ============================================ */
.btn-outline-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  background: transparent;
}

.btn-outline-icon:hover {
  border-color: var(--kura-gold);
  color: var(--kura-gold);
  background: rgba(191, 172, 139, 0.05);
}

.btn-outline-icon svg {
  width: 16px;
  height: 16px;
}

.btn-text-accent {
  background: none;
  border: none;
  color: var(--kura-bright-teal);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.btn-text-accent:hover {
  background: rgba(12, 126, 126, 0.1);
  color: #fff;
}

/* ============================================
   FOOTER DE SESIÓN
   ============================================ */
.dashboard-footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--spacing-lg);
  margin-top: auto;
}

@media (min-width: 640px) {
  .dashboard-footer {
    flex-direction: row;
    justify-content: space-between;
  }
}

.btn-logout-full {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.95rem;
}

.btn-logout-full:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff8e8e;
  transform: translateY(-1px);
}

.btn-logout-full svg {
  width: 18px;
  height: 18px;
}

.link-muted {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.link-muted:hover {
  color: var(--text-primary);
}
</style>