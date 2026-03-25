<template>
  <div class="public-profile-view">
    <TopNav />

    <main class="profile-container container">
      
      <!-- LOADING STATE -->
      <div v-if="loading" class="profile-skeleton">
        <div class="skeleton-hero"></div>
        <div class="skeleton-grid">
          <div v-for="i in 3" :key="i" class="skeleton-card"></div>
        </div>
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="error || !profile" class="state-card error">
        <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2>Perfil no encontrado</h2>
        <p>El usuario "{{ username }}" no existe o ha decidido hacer su perfil privado.</p>
        <router-link to="/explore" class="btn btn-primary">Explorar obras</router-link>
      </div>

      <!-- CONTENIDO DEL PERFIL -->
      <div v-else class="profile-content">
        
        <!-- Header -->
        <header class="profile-header">
          <div class="header-background"></div>
          <div class="header-content">
            <div class="avatar-wrapper">
              <img 
                :src="profile.avatar_url || getDefaultAvatar(profile.display_name)" 
                :alt="profile.display_name"
                class="profile-avatar"
              />
            </div>
            
            <div class="profile-info">
              <div class="name-row">
                <h1 class="display-name">{{ profile.display_name }}</h1>
                <span class="username-handle">@{{ profile.username }}</span>
              </div>

              <!-- Badge de Tipo de Usuario -->
              <div class="role-badge" :class="profile.user_type">
                <svg v-if="profile.user_type === 'curator'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"></path>
                  <path d="M5 21V7l8-4 8 4v14"></path>
                  <path d="M10 9a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0z"></path>
                </svg>
                <svg v-else-if="profile.user_type === 'artist'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                  <path d="M2 2l7.586 7.586"></path>
                  <circle cx="11" cy="11" r="2"></circle>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{{ getUserTypeLabel(profile.user_type) }}</span>
              </div>

              <!-- Contadores de seguidores/seguidos -->
              <div class="follow-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ followerCount }}</span>
                  <span class="stat-label">Seguidores</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ followingCount }}</span>
                  <span class="stat-label">Siguiendo</span>
                </div>
              </div>

              <p v-if="profile.bio" class="bio-text">{{ profile.bio }}</p>

              <div class="meta-data">
                <div v-if="profile.location" class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{{ profile.location }}</span>
                </div>
                <a v-if="profile.website_url" :href="profile.website_url" target="_blank" rel="noopener noreferrer" class="meta-item link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span>Visitar sitio web</span>
                </a>
              </div>

              <!-- FollowButton (solo si no es el propio usuario) -->
              <div v-if="currentUserId && currentUserId !== profile.id" class="follow-action">
                <FollowButton
                  :targetUserId="profile.id"
                  :initialFollowersCount="followerCount"
                  :initialFollowing="false"
                  size="lg"
                  variant="default"
                />
              </div>

            </div>
          </div>
        </header>

        <!-- Navegación por Pestañas -->
        <div class="profile-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'collections' }]"
            @click="activeTab = 'collections'"
          >
            Colecciones
            <span class="count">{{ collections.length }}</span>
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'favorites' }]"
            @click="activeTab = 'favorites'"
            disabled
            title="Próximamente"
          >
            Favoritos
            <span class="count">0</span>
          </button>
        </div>

        <!-- Contenido: Colecciones -->
        <section v-if="activeTab === 'collections'" class="tab-content">
          <div v-if="collections.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <h3>Sin colecciones públicas</h3>
            <p>{{ profile.display_name }} aún no ha creado ninguna colección pública.</p>
          </div>

          <div v-else class="collections-grid">
            <div 
              v-for="collection in collections" 
              :key="collection.id"
              class="collection-card"
              @click="goToCollection(collection.id)"
            >
              <div class="card-cover">
                <img 
                  v-if="getCollectionCover(collection)" 
                  :src="getCollectionCover(collection)" 
                  :alt="collection.title"
                  class="cover-img"
                  loading="lazy"
                />
                <div v-else class="cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              </div>
              <div class="card-body">
                <h3 class="card-title">{{ collection.title }}</h3>
                <p class="card-meta">
                  {{ collection.collection_items?.length || 0 }} obras
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Contenido: Favoritos (Placeholder) -->
        <section v-if="activeTab === 'favorites'" class="tab-content empty-state">
          <p>Funcionalidad próximamente...</p>
        </section>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/composables/useAuth'
import { useCommunity } from '@/composables/useCommunity'
import TopNav from '@/components/common/TopNav.vue'
import FollowButton from '@/components/common/FollowButton.vue'

const route = useRoute()
const router = useRouter()
const { getDefaultAvatar } = useAuth()
const { fetchFollowStatus, followerCount, followingCount } = useCommunity()

const username = computed(() => route.params.username)
const loading = ref(true)
const error = ref(null)
const profile = ref(null)
const collections = ref([])
const activeTab = ref('collections')
const currentUserId = ref(null)

// Mapeo de tipos de usuario a etiquetas legibles
const getUserTypeLabel = (type) => {
  const labels = {
    enthusiast: 'Entusiasta',
    curator: 'Curador',
    artist: 'Artista'
  }
  return labels[type] || 'Usuario'
}

// Obtener portada de colección
const getCollectionCover = (collection) => {
  if (collection.cover_image_url) return collection.cover_image_url
  if (collection.collection_items?.length > 0) {
    const first = collection.collection_items[0]
    return first.museum_artworks?.thumbnail_url || first.museum_artworks?.image_url
  }
  return null
}

const goToCollection = (id) => {
  router.push(`/collections/${id}`)
}

onMounted(async () => {
  try {
    // Obtener usuario actual
    const { data: authData } = await supabase.auth.getUser()
    currentUserId.value = authData?.user?.id || null

    // Buscar perfil por username
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        collections (
          id,
          title,
          description,
          cover_image_url,
          is_public,
          collection_items (id)
        )
      `)
      .eq('username', username.value)
      .eq('is_public', true)
      .single()

    if (profileError || !profileData) {
      throw new Error('Perfil no encontrado')
    }

    profile.value = profileData
    
    // Filtrar solo colecciones públicas
    collections.value = profileData.collections.filter(c => c.is_public)

    // Cargar estado de follows
    if (profileData.id) {
      await fetchFollowStatus(profileData.id)
    }

  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ============================================
   LAYOUT GENERAL
   ============================================ */
.public-profile-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.profile-container {
  max-width: 1200px;
  padding-top: var(--spacing-xl);
}

/* ============================================
   HEADER
   ============================================ */
.profile-header {
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--border-subtle);
}

.header-background {
  height: 200px;
  background: linear-gradient(135deg, var(--kura-deep-teal), var(--kura-black));
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
}

.header-content {
  position: relative;
  z-index: 1;
  padding: var(--spacing-xl);
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-end;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 80px;
  }
}

.avatar-wrapper {
  flex-shrink: 0;
  position: relative;
  margin-top: -60px;
}

@media (max-width: 768px) {
  .avatar-wrapper {
    margin-top: -80px;
  }
}

.profile-avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--bg-secondary);
  background: var(--bg-tertiary);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.profile-info {
  flex: 1;
  padding-bottom: var(--spacing-sm);
}

.name-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.display-name {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.1;
}

.username-handle {
  font-size: 1.1rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* Role Badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
  background: rgba(255,255,255,0.05);
  color: var(--text-secondary);
}

.role-badge.curator {
  background: rgba(191, 172, 139, 0.15);
  color: var(--kura-gold);
  border: 1px solid rgba(191, 172, 139, 0.3);
}

.role-badge.artist {
  background: rgba(12, 126, 126, 0.15);
  color: var(--kura-bright-teal);
  border: 1px solid rgba(12, 126, 126, 0.3);
}

.role-badge svg {
  width: 16px;
  height: 16px;
}

.bio-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  max-width: 700px;
}

.meta-data {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.meta-item.link {
  color: var(--kura-bright-teal);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.meta-item.link:hover {
  color: #fff;
  text-decoration: underline;
}

.meta-item svg {
  flex-shrink: 0;
}

/* ============================================
   FOLLOW STATS & ACTION
   ============================================ */

.follow-stats {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.follow-action {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
}

/* ============================================
   TABS DE NAVEGACIÓN
   ============================================ */
.profile-tabs {
  display: flex;
  gap: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--spacing-xl);
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover:not(:disabled) {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--kura-gold);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--kura-gold);
}

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ============================================
   GRID DE COLECCIONES
   ============================================ */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.collection-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-normal), border-color var(--transition-normal);
}

.collection-card:hover {
  transform: translateY(-4px);
  border-color: rgba(191, 172, 139, 0.3);
}

.card-cover {
  aspect-ratio: 16/9;
  background: var(--bg-tertiary);
  overflow: hidden;
  position: relative;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.collection-card:hover .cover-img {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, var(--kura-deep-teal), #000);
}

.cover-placeholder svg {
  width: 40px;
  height: 40px;
  color: rgba(255,255,255,0.1);
}

.card-body {
  padding: var(--spacing-md);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* ============================================
   ESTADOS (Empty, Loading, Error)
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
  opacity: 0.3;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

/* Skeletons */
.profile-skeleton .skeleton-hero {
  height: 300px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-xl);
  animation: shimmer 1.5s infinite;
}

.profile-skeleton .skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.profile-skeleton .skeleton-card {
  height: 200px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Botones Globales Scoped */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover {
  background: #0f9e9e;
  transform: translateY(-2px);
}
</style>