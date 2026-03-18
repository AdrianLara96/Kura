<template>
  <nav class="top-nav">
    <div class="nav-container container">
      <!-- Logo / Marca -->
      <router-link to="/" class="nav-logo">
        Kura
      </router-link>

      <!-- Enlaces de Navegación -->
      <div class="nav-links">
        <!-- Enlace Explorar -->
        <router-link 
          to="/explore" 
          class="nav-link" 
          active-class="nav-link-active"
        >
          Explorar
        </router-link>

        <!-- Grupo Autenticado -->
        <template v-if="isAuthenticated">
          <router-link 
            to="/dashboard" 
            class="nav-link" 
            active-class="nav-link-active"
          >
            Dashboard
          </router-link>
          
          <router-link 
            to="/my-profile" 
            class="nav-link" 
            active-class="nav-link-active"
          >
            Perfil
          </router-link>

          <button @click="handleLogout" class="nav-link btn-logout" title="Cerrar sesión">
            <svg class="icon-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span class="btn-text">Salir</span>
          </button>
        </template>

        <!-- Grupo No Autenticado -->
        <template v-else>
          <router-link to="/login" class="nav-link btn-login">
            Iniciar Sesión
          </router-link>
          <router-link to="/register" class="btn btn-primary-small">
            Registrarse
          </router-link>
        </template>
      </div>
      
      <!-- Botón Menú Móvil (Visible solo en pantallas pequeñas) -->
      <button class="mobile-menu-btn" aria-label="Menú">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
}
</script>

<style scoped>
/* ============================================
   ESTRUCTURA DEL NAV
   ============================================ */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  background: rgba(0, 7, 6, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--spacing-sm) 0;
  transition: background var(--transition-normal);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

/* ============================================
   LOGO
   ============================================ */
.nav-logo {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-decoration: none;
  background: linear-gradient(135deg, #ffffff 0%, var(--kura-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: opacity var(--transition-fast);
}

.nav-logo:hover {
  opacity: 0.9;
}

/* ============================================
   ENLACES DE NAV
   ============================================ */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

/* Estado Activo: Indicador sutil dorado */
.nav-link-active {
  color: var(--kura-gold);
  background: rgba(191, 172, 139, 0.08);
  position: relative;
}

/* Pequeño punto indicador debajo del activo */
.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background-color: var(--kura-gold);
  border-radius: 50%;
}

/* ============================================
   BOTÓN SALIR (LOGOUT)
   ============================================ */
.btn-logout {
  color: var(--text-muted);
}

.btn-logout:hover {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.icon-logout {
  width: 18px;
  height: 18px;
}

.btn-text {
  display: inline;
}

/* Ocultar texto en pantallas muy pequeñas si fuera necesario, dejando solo icono */
@media (max-width: 480px) {
  .btn-text {
    display: none;
  }
  .btn-logout {
    padding: var(--spacing-xs);
  }
}

/* ============================================
   BOTONES DE ACCIÓN (LOGIN/REGISTER)
   ============================================ */
.btn-login {
  color: var(--text-primary);
}

.btn-login:hover {
  color: var(--kura-gold);
}

/* Botón Registrarse (Pequeño, estilo pill) */
.btn-primary-small {
  background-color: var(--kura-bright-teal);
  color: #ffffff;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary-small:hover {
  background-color: #0f9e9e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(12, 126, 126, 0.4);
}

/* ============================================
   MENÚ MÓVIL (Placeholder)
   ============================================ */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.mobile-menu-btn svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* Aquí falta implementar la lógica del menú desplegable */
  }
  
  .mobile-menu-btn {
    display: block;
  }
}
</style>