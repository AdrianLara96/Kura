<!-- ============================================
     VISTA: CommunityView.vue
     ============================================
     Descubrimiento de usuarios para seguir
  -->

<template>
  <div class="community-view">
    <TopNav />

    <main class="community-container container">
      
      <!-- Header -->
      <header class="page-header">
        <h1 class="page-title">Comunidad</h1>
        <p class="page-subtitle">Descubre curadores, artistas y entusiastas del arte</p>
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o username..."
            class="search-input"
            @input="debouncedSearch"
          />
        </div>

        <div class="filter-type">
          <select v-model="userType" @change="loadUsers" class="type-select">
            <option value="">Todos los tipos</option>
            <option value="curator">Curadores</option>
            <option value="artist">Artistas</option>
            <option value="enthusiast">Entusiastas</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && users.length === 0" class="skeleton-grid">
        <div v-for="i in 9" :key="i" class="skeleton-user-card">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-name"></div>
            <div class="skeleton-username"></div>
            <div class="skeleton-type"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-card error">
        <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2>Error al cargar usuarios</h2>
        <p>{{ error }}</p>
        <button @click="loadUsers" class="btn btn-primary">Reintentar</button>
      </div>

      <!-- Empty -->
      <div v-else-if="users.length === 0" class="state-card empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h2 v-if="searchQuery">Sin resultados</h2>
        <h2 v-else>Comunidad en crecimiento</h2>
        <p v-if="searchQuery">No encontramos usuarios para "{{ searchQuery }}"</p>
        <p v-else>Sé el primero en unirte y compartir tu pasión por el arte</p>
        <button v-if="searchQuery" @click="clearSearch" class="btn btn-outline">Limpiar filtros</button>
      </div>

      <!-- Grid de Usuarios -->
      <div v-else class="users-grid">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="user-header" @click="goToProfile(user.username)">
            <img
              :src="user.avatar_url || getDefaultAvatar(user.display_name)"
              :alt="user.display_name"
              class="user-avatar"
            />
            <div class="user-info">
              <h3 class="user-name">{{ user.display_name }}</h3>
              <p class="user-username">@{{ user.username }}</p>
              <div class="user-type-badge" :class="user.user_type">
                <span>{{ getUserTypeLabel(user.user_type) }}</span>
              </div>
            </div>
          </div>
          
          <div class="user-stats">
            <div class="stat">
              <span class="stat-number">{{ user.follower_count || 0 }}</span>
              <span class="stat-label">Seguidores</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ user.collection_count || 0 }}</span>
              <span class="stat-label">Colecciones</span>
            </div>
          </div>

          <div class="user-actions">
            <router-link :to="`/profile/${user.username}`" class="btn btn-outline btn-sm">
              Ver perfil
            </router-link>
            <FollowButton
              v-if="isLoggedIn && currentUserId !== user.id"
              :targetUserId="user.id"
              :initialFollowersCount="user.follower_count || 0"
              :initialFollowing="false"
              size="sm"
              variant="default"
            />
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/composables/useAuth'
import TopNav from '@/components/common/TopNav.vue'
import FollowButton from '@/components/common/FollowButton.vue'

const router = useRouter()
const { isLoggedIn, getDefaultAvatar } = useAuth()

const users = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const userType = ref('')
const currentUserId = ref(null)

const getUserTypeLabel = (type) => {
  const labels = {
    enthusiast: 'Entusiasta',
    curator: 'Curador',
    artist: 'Artista'
  }
  return labels[type] || 'Usuario'
}

const goToProfile = (username) => {
  router.push(`/profile/${username}`)
}

const loadUsers = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('=== loadUsers START ===')

    // 1. Obtener usuario actual
    const {  authData } = await supabase.auth.getUser()
    currentUserId.value = authData?.user?.id || null
    console.log('currentUserId:', currentUserId.value)

    // 2. Consulta base de usuarios públicos
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        user_type,
        is_public,
        bio
      `)
      .eq('is_public', true)

    // 3. Filtro por tipo
    if (userType.value) {
      console.log('Filtrando por tipo:', userType.value)
      query = query.eq('user_type', userType.value)
    }

    // 4. Búsqueda por nombre o username
    if (searchQuery.value.trim()) {
      console.log('Búsqueda:', searchQuery.value)
      query = query.or(`display_name.ilike.%${searchQuery.value.trim()}%,username.ilike.%${searchQuery.value.trim()}%`)
    }

    // 5. Excluir usuario actual
    if (currentUserId.value) {
      query = query.neq('id', currentUserId.value)
    }

    query = query.limit(50)

    console.log('Ejecutando consulta...')
    const { data: usersData, error: fetchError } = await query

    console.log('usersData:', usersData)
    console.log('fetchError:', fetchError)

    if (fetchError) {
      console.error('Error en fetch:', fetchError)
      throw fetchError
    }

    if (!usersData || usersData.length === 0) {
      console.warn('No se encontraron usuarios públicos')
      users.value = []
      loading.value = false
      return
    }

    // 6. Cargar contadores por separado
    console.log('Cargando contadores para', usersData.length, 'usuarios...')
    
    const usersWithCounts = await Promise.all(
      usersData.map(async (user) => {
        // Contar seguidores
        const { count: followerCount, error: fError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)

        if (fError) console.error('Error counting followers:', fError)

        // Contar colecciones públicas
        const { count: collectionCount, error: cError } = await supabase
          .from('collections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_public', true)

        if (cError) console.error('Error counting collections:', cError)

        return {
          ...user,
          follower_count: followerCount || 0,
          collection_count: collectionCount || 0
        }
      })
    )

    console.log('usersWithCounts:', usersWithCounts)
    users.value = usersWithCounts
    console.log('=== loadUsers END ===')

  } catch (err) {
    error.value = err.message
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers()
  }, 500)
}

const clearSearch = () => {
  searchQuery.value = ''
  userType.value = ''
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
/* ============================================
   LAYOUT
   ============================================ */
.community-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.community-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ============================================
   FILTROS
   ============================================ */
.filters-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.search-wrapper {
  flex: 1;
  min-width: 280px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem 1rem 0.75rem 42px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: var(--font-main);
}

.search-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

.filter-type {
  min-width: 200px;
}

.type-select {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: var(--font-main);
  cursor: pointer;
}

.type-select:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

/* ============================================
   GRID DE USUARIOS
   ============================================ */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.user-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
}

.user-card:hover {
  border-color: var(--kura-teal);
  transform: translateY(-4px);
}

.user-header {
  display: flex;
  gap: var(--spacing-md);
  cursor: pointer;
  align-items: center;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
  font-family: monospace;
}

.user-type-badge {
  display: inline-block;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-top: 4px;
  background: rgba(255,255,255,0.05);
  color: var(--text-secondary);
}

.user-type-badge.curator {
  background: rgba(191, 172, 139, 0.15);
  color: var(--kura-gold);
}

.user-type-badge.artist {
  background: rgba(12, 126, 126, 0.15);
  color: var(--kura-bright-teal);
}

.user-stats {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* ============================================
   SKELETON
   ============================================ */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.skeleton-user-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeleton-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  height: 1.25rem;
  width: 70%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  animation: shimmer 1.5s infinite;
}

.skeleton-username {
  height: 1rem;
  width: 50%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  animation: shimmer 1.5s infinite;
}

.skeleton-type {
  height: 1.25rem;
  width: 40%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-full);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   STATE CARDS
   ============================================ */
.state-card {
  max-width: 500px;
  margin: 4rem auto;
  text-align: center;
  padding: var(--spacing-xxl);
  background: rgba(19, 70, 71, 0.15);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.state-card h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
}

.state-card p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.state-icon {
  width: 48px;
  height: 48px;
  color: #ff6b6b;
  margin-bottom: var(--spacing-md);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--kura-gold);
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* ============================================
   BOTONES
   ============================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-outline {
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.btn-outline:hover {
  border-color: var(--text-primary);
  background: var(--bg-tertiary);
}

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover {
  background: #0f9e9e;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .search-wrapper,
  .filter-type {
    min-width: 100%;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .user-actions {
    flex-direction: column;
  }

  .user-actions .btn {
    width: 100%;
  }
}
</style>