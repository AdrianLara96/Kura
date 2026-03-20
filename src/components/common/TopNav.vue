<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase/client'
import { useCommunity } from '@/composables/useCommunity'

// ============================================
// ROUTER
// ============================================

const router = useRouter()
const route = useRoute()

// ============================================
// ESTADO LOCAL
// ============================================

const currentUser = ref(null)
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)
const notificationsOpen = ref(false)

// Community composable
const { 
  unreadCount, 
  notifications,
  fetchNotifications, 
  markAsRead,
  markAllAsRead 
} = useCommunity()

// ============================================
// COMPUTED
// ============================================

const isLoggedIn = computed(() => !!currentUser.value)
const hasUnreadNotifications = computed(() => unreadCount.value > 0)

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// ============================================
// VARIABLES PARA LIMPIEZA
// ============================================

let notificationInterval = null
let authSubscription = null

// ============================================
// MÉTODOS
// ============================================

async function handleLogout() {
  await supabase.auth.signOut()
  userMenuOpen.value = false
  mobileMenuOpen.value = false
  router.push('/')
}

function navigateTo(path) {
  router.push(path)
  userMenuOpen.value = false
  mobileMenuOpen.value = false
  notificationsOpen.value = false
}

function getUserDisplayName() {
  return currentUser.value?.user_metadata?.display_name || 
         currentUser.value?.email?.split('@')[0] || 
         'Usuario'
}

function getUserAvatar() {
  return currentUser.value?.user_metadata?.avatar_url || null
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins} min`
  if (diffHours < 24) return `${diffHours} h`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getNotificationIcon(type) {
  const icons = {
    new_follower: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    new_comment: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    collection_liked: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'
  }
  return icons[type] || icons.new_follower
}

function getIconColor(type) {
  const colors = {
    new_follower: 'var(--kura-bright-teal)',
    new_comment: 'var(--kura-gold)',
    collection_liked: '#ff6b6b'
  }
  return colors[type] || 'var(--text-muted)'
}

async function handleNotificationClick(notification) {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  notificationsOpen.value = false
  if (notification.link_url) {
    router.push(notification.link_url)
  }
}

function handleClickOutside(event) {
  if (!event.target.closest('.user-menu-container')) {
    userMenuOpen.value = false
  }
  if (!event.target.closest('.notifications-container')) {
    notificationsOpen.value = false
  }
}

// ============================================
// CICLO DE VIDA (SIN AWAIT ANTES DE HOOKS)
// ============================================

// Registrar cleanup PRIMERO (antes de cualquier await)
onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
  }
  if (authSubscription) {
    authSubscription.unsubscribe()
  }
  document.removeEventListener('click', handleClickOutside)
})

onMounted(async () => {
  // Obtener sesión inicial
  const { data } = await supabase.auth.getSession()
  currentUser.value = data?.session?.user || null

  // Si hay usuario, cargar notificaciones
  if (currentUser.value) {
    await fetchNotifications(50)
    
    // Actualizar notificaciones cada 30 segundos
    notificationInterval = setInterval(async () => {
      await fetchNotifications(50)
    }, 30000)
  }

  // Escuchar cambios de auth
  const {  subscription } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      currentUser.value = session?.user || null
      
      if (currentUser.value) {
        await fetchNotifications(50)
      } else {
        notifications.value = []
        unreadCount.value = 0
      }
    }
  )
  
  authSubscription = subscription

  // Listener para click outside
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav class="top-nav">
    <div class="nav-container">
      <!-- ============================================
           LOGO
           ============================================ -->
      <router-link to="/" class="nav-logo" @click="mobileMenuOpen = false">
        <svg class="logo-icon" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="var(--kura-bright-teal)" stroke-width="2"/>
          <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" fill="var(--kura-gold)"/>
          <circle cx="20" cy="20" r="3" fill="var(--kura-bright-teal)"/>
        </svg>
        <span class="logo-text">Kura</span>
      </router-link>

      <!-- ============================================
           NAVEGACIÓN ESCRITORIO
           ============================================ -->
      <div class="nav-links desktop-only">
        <router-link to="/explore" class="nav-link" :class="{ active: isActiveRoute('/explore') }">
          Explorar
        </router-link>
        <router-link to="/collections" class="nav-link" :class="{ active: isActiveRoute('/collections') }">
          Colecciones
        </router-link>
      </div>

      <!-- ============================================
           ACCIONES DERECHA
           ============================================ -->
      <div class="nav-actions">
        <!-- Usuario no logueado -->
        <template v-if="!isLoggedIn">
          <button class="nav-btn nav-btn-ghost" @click="navigateTo('/login')" type="button">
            Iniciar sesión
          </button>
          <button class="nav-btn nav-btn-primary" @click="navigateTo('/register')" type="button">
            Registrarse
          </button>
        </template>

        <!-- Usuario logueado -->
        <template v-else>
          <!-- ============================================
               NOTIFICACIONES
               ============================================ -->
          <div class="notifications-container">
            <button
              class="nav-btn nav-btn-icon"
              @click="notificationsOpen = !notificationsOpen"
              :class="{ 'has-unread': hasUnreadNotifications }"
              type="button"
              aria-label="Notificaciones"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <!-- Badge de no leídas -->
              <span v-if="hasUnreadNotifications" class="notification-badge">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>

            <!-- Dropdown de notificaciones -->
            <transition name="dropdown">
              <div v-if="notificationsOpen" class="notifications-dropdown">
                <div class="dropdown-header">
                  <h4 class="dropdown-title">Notificaciones</h4>
                  <button
                    v-if="hasUnreadNotifications"
                    class="mark-all-btn"
                    @click="markAllAsRead"
                    type="button"
                  >
                    Marcar todas como leídas
                  </button>
                </div>

                <div class="notifications-list">
                  <!-- Vacío -->
                  <div v-if="notifications.length === 0" class="empty-notifications">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                    <p>Sin notificaciones</p>
                  </div>

                  <!-- Lista -->
                  <div
                    v-else
                    class="notification-item-dropdown"
                    v-for="notification in notifications.slice(0, 5)"
                    :key="notification.id"
                    :class="{ 'unread': !notification.is_read }"
                    @click="handleNotificationClick(notification)"
                  >
                    <div
                      class="notification-icon-dropdown"
                      :style="{ color: getIconColor(notification.type) }"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path :d="getNotificationIcon(notification.type)" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </div>
                    <div class="notification-content-dropdown">
                      <p class="notification-message-dropdown">{{ notification.message }}</p>
                      <span class="notification-time-dropdown">{{ formatDate(notification.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <router-link
                  to="/notifications"
                  class="view-all-link"
                  @click="notificationsOpen = false"
                >
                  Ver todas las notificaciones
                </router-link>
              </div>
            </transition>
          </div>

          <!-- ============================================
               MENÚ DE USUARIO
               ============================================ -->
          <div class="user-menu-container">
            <button
              class="user-menu-btn"
              @click="userMenuOpen = !userMenuOpen"
              type="button"
              aria-label="Menú de usuario"
            >
              <div class="user-avatar-small">
                <img
                  v-if="getUserAvatar()"
                  :src="getUserAvatar()"
                  :alt="getUserDisplayName()"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ getUserDisplayName().charAt(0).toUpperCase() }}
                </div>
              </div>
            </button>

            <!-- Dropdown de usuario -->
            <transition name="dropdown">
              <div v-if="userMenuOpen" class="user-menu-dropdown">
                <div class="user-info">
                  <div class="user-avatar-large">
                    <img
                      v-if="getUserAvatar()"
                      :src="getUserAvatar()"
                      :alt="getUserDisplayName()"
                      class="avatar-img"
                    />
                    <div v-else class="avatar-placeholder">
                      {{ getUserDisplayName().charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="user-details">
                    <p class="user-name">{{ getUserDisplayName() }}</p>
                    <p class="user-email">{{ currentUser?.email }}</p>
                  </div>
                </div>

                <div class="menu-divider"></div>

                <nav class="user-menu-links">
                  <router-link
                    to="/dashboard"
                    class="menu-link"
                    @click="userMenuOpen = false"
                  >
                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                      <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                      <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                      <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Dashboard
                  </router-link>
                  <router-link
                    to="/my-collections"
                    class="menu-link"
                    @click="userMenuOpen = false"
                  >
                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Mis Colecciones
                  </router-link>
                  <router-link
                    to="/my-profile"
                    class="menu-link"
                    @click="userMenuOpen = false"
                  >
                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Mi Perfil
                  </router-link>
                  <router-link
                    to="/notifications"
                    class="menu-link"
                    @click="userMenuOpen = false"
                  >
                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Notificaciones
                    <span v-if="hasUnreadNotifications" class="menu-badge">
                      {{ unreadCount }}
                    </span>
                  </router-link>
                </nav>

                <div class="menu-divider"></div>

                <button class="menu-link menu-link-danger" @click="handleLogout" type="button">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </transition>
          </div>

          <!-- ============================================
               MENÚ MÓVIL
               ============================================ -->
          <button
            class="nav-btn nav-btn-icon mobile-only"
            @click="mobileMenuOpen = !mobileMenuOpen"
            type="button"
            aria-label="Menú"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </template>
      </div>
    </div>

    <!-- ============================================
         MENÚ MÓVIL DROPDOWN
         ============================================ -->
    <transition name="slide">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <nav class="mobile-nav-links">
          <router-link
            to="/explore"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Explorar
          </router-link>
          <router-link
            to="/collections"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Colecciones
          </router-link>
          <router-link
            to="/dashboard"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Dashboard
          </router-link>
          <router-link
            to="/my-collections"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Mis Colecciones
          </router-link>
          <router-link
            to="/my-profile"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Mi Perfil
          </router-link>
          <router-link
            to="/notifications"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            Notificaciones
            <span v-if="hasUnreadNotifications" class="mobile-badge">
              {{ unreadCount }}
            </span>
          </router-link>
        </nav>
        <div class="mobile-divider"></div>
        <button class="mobile-nav-link mobile-logout" @click="handleLogout" type="button">
          Cerrar sesión
        </button>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
/* ============================================
   ESTILOS DEL COMPONENTE
   ============================================ */

.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ============================================
   LOGO
   ============================================ */

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--text-primary);
  transition: opacity var(--transition-fast);
}

.nav-logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* ============================================
   NAVEGACIÓN ESCRITORIO
   ============================================ */

.nav-links {
  display: flex;
  gap: var(--spacing-md);
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-family: var(--font-main);
  font-size: 0.95rem;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-link.active {
  color: var(--text-primary);
  background: var(--kura-teal);
}

/* ============================================
   ACCIONES
   ============================================ */

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-main);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.nav-btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-md);
}

.nav-btn-ghost:hover {
  color: var(--text-primary);
}

.nav-btn-primary {
  background: var(--kura-bright-teal);
  color: var(--text-primary);
  padding: var(--spacing-xs) var(--spacing-lg);
}

.nav-btn-primary:hover {
  background: var(--kura-teal);
  transform: translateY(-2px);
}

.nav-btn-icon {
  width: 44px;
  height: 44px;
  background: transparent;
  color: var(--text-secondary);
  position: relative;
}

.nav-btn-icon:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-btn-icon.has-unread {
  color: var(--kura-bright-teal);
}

.nav-icon {
  width: 22px;
  height: 22px;
}

/* ============================================
   NOTIFICACIONES BADGE
   ============================================ */

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 18px;
  height: 18px;
  background: #ff6b6b;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* ============================================
   NOTIFICACIONES DROPDOWN
   ============================================ */

.notifications-container {
  position: relative;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  width: 360px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
}

.dropdown-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: var(--kura-bright-teal);
  font-family: var(--font-main);
  font-size: 0.75rem;
  cursor: pointer;
}

.mark-all-btn:hover {
  text-decoration: underline;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-sm);
  opacity: 0.5;
}

.empty-notifications p {
  font-size: 0.9rem;
  margin: 0;
}

.notification-item-dropdown {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--border-subtle);
}

.notification-item-dropdown:last-child {
  border-bottom: none;
}

.notification-item-dropdown:hover {
  background: var(--bg-tertiary);
}

.notification-item-dropdown.unread {
  background: rgba(12, 126, 126, 0.15);
}

.notification-icon-dropdown {
  width: 40px;
  height: 40px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon-dropdown svg {
  width: 20px;
  height: 20px;
}

.notification-content-dropdown {
  flex: 1;
  min-width: 0;
}

.notification-message-dropdown {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-time-dropdown {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.view-all-link {
  display: block;
  text-align: center;
  padding: var(--spacing-md);
  color: var(--kura-bright-teal);
  text-decoration: none;
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 500;
  border-top: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.view-all-link:hover {
  background: var(--bg-tertiary);
}

/* ============================================
   MENÚ DE USUARIO
   ============================================ */

.user-menu-container {
  position: relative;
}

.user-menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.user-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--kura-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-subtle);
  transition: border-color var(--transition-fast);
}

.user-menu-btn:hover .user-avatar-small {
  border-color: var(--kura-bright-teal);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1001;
}

.user-info {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--kura-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-xs) 0;
}

.user-menu-links {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xs) 0;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-family: var(--font-main);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  position: relative;
}

.menu-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.menu-link.menu-link-danger {
  color: #ff6b6b;
}

.menu-link.menu-link-danger:hover {
  background: rgba(255, 107, 107, 0.1);
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.menu-badge {
  margin-left: auto;
  background: #ff6b6b;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

/* ============================================
   MENÚ MÓVIL
   ============================================ */

.mobile-only {
  display: none;
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--spacing-md);
  z-index: 999;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mobile-nav-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-family: var(--font-main);
  font-size: 0.95rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.mobile-nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.mobile-nav-link.mobile-logout {
  color: #ff6b6b;
}

.mobile-badge {
  background: #ff6b6b;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.mobile-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-md) 0;
}

/* ============================================
   ANIMACIONES
   ============================================ */

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .nav-container {
    padding: 0 var(--spacing-md);
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .notifications-dropdown {
    right: -10px;
    width: 320px;
  }

  .user-menu-dropdown {
    right: -10px;
    width: 260px;
  }
}
</style>