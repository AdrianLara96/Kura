<!-- Bandeja de notificaciones del usuario -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunity } from '@/composables/useCommunity'
import { supabase } from '@/supabase/client'

// ============================================
// ROUTER
// ============================================

const router = useRouter()

// ============================================
// ESTADO LOCAL
// ============================================

const { 
  loading, 
  error, 
  notifications, 
  unreadCount,
  fetchNotifications, 
  markAsRead, 
  markAllAsRead 
} = useCommunity()

const currentUser = ref(null)
const activeFilter = ref('all') // 'all', 'unread'

// ============================================
// COMPUTED
// ============================================

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'unread') {
    return notifications.value.filter(n => !n.is_read)
  }
  return notifications.value
})

const hasUnread = computed(() => unreadCount.value > 0)

const showEmptyState = computed(() => {
  return !loading.value && notifications.value.length === 0
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Obtener usuario actual
  const { data } = await supabase.auth.getUser()
  currentUser.value = data?.user || null

  // Si no hay usuario, redirigir a login
  if (!currentUser.value) {
    router.push('/login')
    return
  }

  // Cargar notificaciones
  await fetchNotifications(50)
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Marca una notificación como leída
 */
async function handleMarkAsRead(notificationId) {
  await markAsRead(notificationId)
}

/**
 * Marca todas las notificaciones como leídas
 */
async function handleMarkAllAsRead() {
  await markAllAsRead()
}

/**
 * Navega a la URL de la notificación
 */
function handleNavigate(notification) {
  // Marcar como leída al hacer click
  if (!notification.is_read) {
    markAsRead(notification.id)
  }

  // Navegar si hay URL
  if (notification.link_url) {
    router.push(notification.link_url)
  }
}

/**
 * Formatea la fecha de manera legible
 */
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Obtiene el icono según el tipo de notificación
 */
function getNotificationIcon(type) {
  const icons = {
    new_follower: `
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    new_comment: `
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    collection_liked: `
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `
  }
  return icons[type] || icons.new_follower
}

/**
 * Obtiene el color del icono según el tipo
 */
function getIconColor(type) {
  const colors = {
    new_follower: 'var(--kura-bright-teal)',
    new_comment: 'var(--kura-gold)',
    collection_liked: '#ff6b6b'
  }
  return colors[type] || 'var(--text-muted)'
}

/**
 * Obtiene el título según el tipo
 */
function getNotificationTitle(type) {
  const titles = {
    new_follower: 'Nuevo seguidor',
    new_comment: 'Nuevo comentario',
    collection_liked: 'Le gustó tu colección'
  }
  return titles[type] || 'Notificación'
}
</script>

<template>
  <div class="notifications-view">
    <!-- Header -->
    <div class="notifications-header">
      <div class="header-content">
        <h1 class="page-title">Notificaciones</h1>
        <p class="page-subtitle">
          Mantente al día de las interacciones con tu contenido
        </p>
      </div>

      <!-- Acciones -->
      <div class="header-actions">
        <!-- Filtros -->
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
            type="button"
          >
            Todas
            <span class="tab-count">{{ notifications.length }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'unread' }"
            @click="activeFilter = 'unread'"
            type="button"
          >
            No leídas
            <span class="tab-count">{{ unreadCount }}</span>
          </button>
        </div>

        <!-- Marcar todas como leídas -->
        <button
          v-if="hasUnread"
          class="mark-all-button"
          @click="handleMarkAllAsRead"
          :disabled="loading"
          type="button"
        >
          <svg class="check-icon" viewBox="0 0 24 24" fill="none">
            <path 
              d="M20 6L9 17l-5-5" 
              stroke="currentColor" 
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Marcar todas como leídas
        </button>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="error-banner">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Lista de notificaciones -->
    <div class="notifications-list">
      <!-- Estado: Cargando -->
      <div v-if="loading && notifications.length === 0" class="loading-state">
        <div class="skeleton-notification" v-for="i in 5" :key="i">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>

      <!-- Estado: Vacío -->
      <div v-else-if="showEmptyState" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none">
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
        <h3 class="empty-title">Sin notificaciones</h3>
        <p class="empty-text">
          Cuando alguien interactúe con tu contenido, aparecerá aquí
        </p>
      </div>

      <!-- Estado: Notificaciones existentes -->
      <div
        v-else
        class="notification-item"
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :class="{ 'unread': !notification.is_read }"
        @click="handleNavigate(notification)"
      >
        <!-- Icono -->
        <div 
          class="notification-icon"
          :style="{ color: getIconColor(notification.type) }"
        >
          <svg viewBox="0 0 24 24" fill="none" v-html="getNotificationIcon(notification.type)" />
        </div>

        <!-- Contenido -->
        <div class="notification-content">
          <div class="notification-header">
            <h4 class="notification-title">
              {{ getNotificationTitle(notification.type) }}
            </h4>
            <span class="notification-time">
              {{ formatDate(notification.created_at) }}
            </span>
          </div>
          <p class="notification-message">
            {{ notification.message }}
          </p>
        </div>

        <!-- Indicador de no leído -->
        <div v-if="!notification.is_read" class="unread-indicator"></div>

        <!-- Botón marcar como leída (hover) -->
        <button
          v-if="!notification.is_read"
          class="mark-read-button"
          @click.stop="handleMarkAsRead(notification.id)"
          type="button"
          aria-label="Marcar como leída"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path 
              d="M20 6L9 17l-5-5" 
              stroke="currentColor" 
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   ESTILOS DE LA VISTA
   ============================================ */

.notifications-view {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
  min-height: 100vh;
}

/* ============================================
   HEADER
   ============================================ */

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-content {
  flex: 1;
  min-width: 280px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--bg-secondary);
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.filter-tab.active {
  background: var(--kura-teal);
  color: var(--text-primary);
}

.tab-count {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
}

/* Mark All Button */
.mark-all-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-family: var(--font-main);
  font-size: 0.85rem;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mark-all-button:hover:not(:disabled) {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
}

.mark-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check-icon {
  width: 16px;
  height: 16px;
}

/* ============================================
   MENSAJE DE ERROR
   ============================================ */

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  color: #ff6b6b;
  font-size: 0.9rem;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ============================================
   LISTA DE NOTIFICACIONES
   ============================================ */

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skeleton-notification {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.skeleton-title {
  width: 200px;
  height: 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.skeleton-text {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.empty-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 400px;
}

/* Notification Item */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.notification-item:hover {
  border-color: var(--border-active);
  transform: translateX(4px);
}

.notification-item.unread {
  background: rgba(12, 126, 126, 0.15);
  border-color: var(--kura-teal);
}

.notification-item.unread:hover {
  background: rgba(12, 126, 126, 0.25);
}

/* Icon */
.notification-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon svg {
  width: 24px;
  height: 24px;
}

/* Content */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.notification-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.notification-message {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
}

/* Unread Indicator */
.unread-indicator {
  width: 8px;
  height: 8px;
  background: var(--kura-bright-teal);
  border-radius: var(--radius-full);
  flex-shrink: 0;
  margin-top: var(--spacing-sm);
}

/* Mark Read Button */
.mark-read-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.notification-item:hover .mark-read-button {
  opacity: 1;
}

.mark-read-button:hover {
  background: var(--bg-tertiary);
  color: var(--kura-bright-teal);
}

.mark-read-button svg {
  width: 18px;
  height: 18px;
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 768px) {
  .notifications-view {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .notifications-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .filter-tabs {
    flex: 1;
  }

  .mark-all-button {
    font-size: 0.8rem;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .notification-item {
    padding: var(--spacing-sm);
  }

  .notification-icon {
    width: 40px;
    height: 40px;
  }

  .notification-icon svg {
    width: 20px;
    height: 20px;
  }

  .mark-read-button {
    opacity: 1;
  }
}
</style>