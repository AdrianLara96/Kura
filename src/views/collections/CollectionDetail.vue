<!-- ============================================
     VISTA: CollectionDetail.vue
     ============================================
     Detalle de colección con likes, comentarios y follow
     Actualizado Fase 4: Interacciones sociales
  -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase/client'
import { useCollections } from '@/composables/useCollections'
import { useCommunity } from '@/composables/useCommunity'
import LikeButton from '@/components/common/LikeButton.vue'
import CommentsSection from '@/components/comments/CommentsSection.vue'
import FollowButton from '@/components/common/FollowButton.vue'
import TopNav from '@/components/common/TopNav.vue'


// ============================================
// ROUTER
// ============================================

const router = useRouter()
const route = useRoute()

// ============================================
// COMPOSABLES
// ============================================

const { 
  loading: collectionsLoading, 
  error: collectionsError, 
  currentCollection, 
  items,
  fetchCollectionById 
} = useCollections()

const { 
  loading: communityLoading, 
  error: communityError, 
  // Estados reactivos de las interacciones
  hasLiked,
  likeCount,
  isFollowing,
  followerCount,
  // Funciones para consultar estado real
  fetchLikeStatus,
  fetchFollowStatus
} = useCommunity()

// ============================================
// ESTADO LOCAL
// ============================================

const currentUser = ref(null)
const collectionOwnerId = ref(null)
const viewCount = ref(0)
const isOwner = ref(false)

// ============================================
// COMPUTED
// ============================================

const loading = computed(() => collectionsLoading.value || communityLoading.value)
const error = computed(() => collectionsError.value || communityError.value)

const artworkItems = computed(() => {
  return items.value.map(item => ({
    id: item.museum_artwork_id,
    position: item.position,
    user_note: item.user_note,
    added_at: item.added_at,
    artwork: item.museum_artworks
  }))
})

const collectionCover = computed(() => {
  if (currentCollection.value?.cover_image_url) {
    return currentCollection.value.cover_image_url
  }
  // Fallback: primera obra de la colección
  if (artworkItems.value.length > 0 && artworkItems.value[0]?.artwork?.image_url) {
    return artworkItems.value[0].artwork.image_url
  }
  return null
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Obtener usuario actual
  const { data: { session } } = await supabase.auth.getUser()
  currentUser.value = session?.user || null

  // Cargar colección
  if (route.params.id) {
    await fetchCollectionById(route.params.id)
    
    // Si se cargó correctamente, incrementar vistas y obtener datos adicionales
    if (currentCollection.value) {
      collectionOwnerId.value = currentCollection.value.user_id
      viewCount.value = currentCollection.value.view_count || 0
      
      // Verificar si es el dueño
      isOwner.value = currentUser.value?.id === collectionOwnerId.value
      
      // Incrementar contador de vistas (solo si no es el dueño)
      if (!isOwner.value) {
        await incrementViewCount()
      }

      // Consultar estado de likes y follows
      if (currentUser.value) {
        await fetchLikeStatus(currentCollection.value.id)
        await fetchFollowStatus(collectionOwnerId.value)
        // Debug (borrar despuéss)
        console.log('After fetch - hasLiked:', hasLiked.value, 'likeCount:', likeCount.value)
        console.log('After fetch - isFollowing:', isFollowing.value, 'followersCount:', followerCount.value)
      }
    }
  }
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Incrementa el contador de vistas de la colección
 */
async function incrementViewCount() {
  try {
    // Opción A: UPDATE directo (me da error en la actualización)
    // const { error } = await supabase
      // .from('collections')
      // .update({ view_count: viewCount.value + 1 })
      // .eq('id', route.params.id)

    // Opción B: Función RPC (alternativa sin modificar RLS)
    const { error } = await supabase.rpc('increment_collection_view', {
      collection_id: route.params.id
    })

    if (!error) {
      viewCount.value = viewCount.value + 1
    }
  } catch (err) {
    console.error('Error incrementing view count:', err)
  }
}

/**
 * Navega al perfil público de un usuario
 */
function navigateToProfile(username) {
  router.push(`/profile/${username}`)
}

/**
 * Maneja el cambio de like y actualiza estado local
 */
function handleLikeChanged(data) {
  // Por seguridad, sincronizamos con los valores recibidos
  if (data.count !== undefined) {
    likeCount.value = data.count
  }
  if (data.liked !== undefined) {
    hasLiked.value = data.liked
  }
  console.log('Like updated:', { liked: hasLiked.value, count: likeCount.value })
  console.log('handleLikeChanged - data:', data)                                                // debug
  console.log('handleLikeChanged - hasLiked:', hasLiked.value, 'likeCount:', likeCount.value)   // debug
}

/**
 * Maneja el cambio de follow y actualiza estado local
 */
function handleFollowChanged(data) {
  //debug:
  console.log('=== handleFollowChanged DEBUG ===')
  console.log('data recibido:', data)
  console.log('followerCount (del composable):', followerCount?.value)
  console.log('isFollowing (del composable):', isFollowing?.value)

  // Sincronizar con valores recibidos
  if (data.followersCount !== undefined) {
    followerCount.value = data.followersCount
  }
  if (data.following !== undefined) {
    isFollowing.value = data.following
  }
  console.log('Follow updated:', { following: isFollowing.value, count: followerCount.value })
  console.log('handleFollowChanged - data:', data)                                                                // debug
  console.log('handleFollowChanged - isFollowing:', isFollowing.value, 'followerCount:', followerCount.value)     // debug
}

/**
 * Maneja el comentario añadido
 */
function handleCommentAdded(comment) {
  console.log('Comment added:', comment)
  // CommentsSection ya actualiza su estado internamente
}

/**
 * Maneja el comentario eliminado
 */
function handleCommentDeleted(commentId) {
  console.log('Comment deleted:', commentId)
  // CommentsSection ya actualiza su estado internamente
}

/**
 * Eliminar colección (solo dueño)
 */
async function handleDeleteCollection() {
  if (!confirm('¿Estás seguro de que quieres eliminar esta colección? Esta acción no se puede deshacer.')) {
    return
  }

  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', route.params.id)

    if (error) throw error

    router.push('/my-collections')
  } catch (err) {
    console.error('Error deleting collection:', err)
    alert('Error al eliminar la colección')
  }
}
</script>

<template>
  <div class="collection-detail-view">
    <TopNav/>

    <!-- ============================================
         ESTADO: CARGANDO
         ============================================ -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-cover"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-description"></div>
      </div>
    </div>

    <!-- ============================================
         ESTADO: ERROR
         ============================================ -->
    <div v-else-if="error || !currentCollection" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2"/>
      </svg>
      <h2 class="error-title">Error al cargar la colección</h2>
      <p class="error-message">{{ error || 'La colección no existe o ha sido eliminada' }}</p>
      <button class="back-button" @click="router.push('/collections')" type="button">
        Volver a colecciones
      </button>
    </div>

    <!-- ============================================
         ESTADO: EXITO
         ============================================ -->
    <div v-else class="collection-detail">
      <!-- Portada -->
      <div class="collection-cover" :style="{ backgroundImage: `url(${collectionCover})` }">
        <div class="cover-overlay"></div>
      </div>

      <!-- Contenido principal -->
      <div class="container">
        <div class="collection-header">
          <!-- Información de la colección -->
          <div class="collection-info">
            <!-- Título y metadatos -->
            <div class="collection-title-section">
              <h1 class="collection-title">{{ currentCollection.title }}</h1>
              
              <div class="collection-meta">
                <span class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Creada el {{ formatDate(currentCollection.created_at) }}
                </span>
                <span class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  {{ viewCount }} vistas
                </span>
                <span class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 9h18" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  {{ items.length }} obras
                </span>
              </div>
            </div>

            <!-- Descripción -->
            <p v-if="currentCollection.description" class="collection-description">
              {{ currentCollection.description }}
            </p>

            <!-- Dueño de la colección -->
            <div class="collection-owner">
              <span class="owner-label">Creada por</span>
              <button
                v-if="currentCollection.user_profiles"
                class="owner-button"
                @click="navigateToProfile(currentCollection.user_profiles.username)"
                type="button"
              >
                <div class="owner-avatar">
                  <img
                    v-if="currentCollection.user_profiles.avatar_url"
                    :src="currentCollection.user_profiles.avatar_url"
                    :alt="currentCollection.user_profiles.display_name"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ (currentCollection.user_profiles.display_name || currentCollection.user_profiles.username || 'U').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <span class="owner-name">
                  {{ currentCollection.user_profiles.display_name || currentCollection.user_profiles.username }}
                </span>
              </button>
            </div>

            <!-- Acciones sociales -->
            <div class="collection-actions">
              <!-- Like Button -->
              <LikeButton
                :collectionId="currentCollection.id"
                :initialCount="likeCount"
                :initialLiked="hasLiked"
                size="lg"
                @like-changed="handleLikeChanged"
              />

              <!-- Follow Button (solo si no es el dueño) -->
              <FollowButton
                v-if="!isOwner && collectionOwnerId"
                :targetUserId="collectionOwnerId"
                :initialFollowersCount="followerCount"
                :initialFollowing="isFollowing"
                size="md"
                variant="default"
                @follow-changed="handleFollowChanged"
              />
              <!-- Debug temporal -->
              <div style="font-size: 10px; color: red;">
                Debug: followerCount={{ followerCount }}, isFollowing={{ isFollowing }}
              </div>
            </div>

            <!-- Acciones para el dueño -->
            <div v-if="isOwner" class="owner-actions">
              <router-link
                :to="`/my-collections/${currentCollection.id}/edit`"
                class="action-button action-button-secondary"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Editar colección
              </router-link>
              <button
                class="action-button action-button-danger"
                @click="handleDeleteCollection"
                type="button"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                </svg>
                Eliminar colección
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================
             OBRAS DE LA COLECCIÓN
             ============================================ -->
        <div class="collection-works">
          <h2 class="section-title">Obras en esta colección</h2>

          <!-- Vacío -->
          <div v-if="artworkItems.length === 0" class="empty-works">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M3 9h18" stroke="currentColor" stroke-width="2"/>
            </svg>
            <p>Esta colección aún no tiene obras</p>
          </div>

          <!-- Grid de obras -->
          <div v-else class="works-grid">
            <router-link
              v-for="item in artworkItems"
              :key="item.id"
              :to="`/artwork/${item.artwork?.id}`"
              class="work-card"
            >
              <div class="work-image">
                <img
                  v-if="item.artwork?.thumbnail_url || item.artwork?.image_url"
                  :src="item.artwork.thumbnail_url || item.artwork.image_url"
                  :alt="item.artwork?.title || 'Obra de arte'"
                  loading="lazy"
                />
                <div v-else class="work-placeholder">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
              </div>
              <div class="work-info">
                <h3 class="work-title">{{ item.artwork?.title || 'Sin título' }}</h3>
                <p class="work-artist">{{ item.artwork?.artist_name || 'Artista desconocido' }}</p>
                <p v-if="item.user_note" class="work-note">{{ item.user_note }}</p>
              </div>
            </router-link>
          </div>
        </div>

        <!-- SECCIÓN DE COMENTARIOS -->
        <CommentsSection
          v-if="collectionOwnerId"
          :collectionId="currentCollection.id"
          :collectionOwnerId="collectionOwnerId"
          @comment-added="handleCommentAdded"
          @comment-deleted="handleCommentDeleted"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   ESTILOS DE LA VISTA
   ============================================ */

.collection-detail-view {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* ============================================
   ESTADO: CARGANDO
   ============================================ */

.loading-state {
  padding: var(--spacing-xl);
}

.skeleton-cover {
  width: 100%;
  height: 400px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.skeleton-content {
  max-width: 800px;
  margin: 0 auto;
}

.skeleton-title {
  width: 60%;
  height: 48px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.skeleton-meta {
  width: 40%;
  height: 24px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.skeleton-description {
  width: 100%;
  height: 80px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* ============================================
   ESTADO: ERROR
   ============================================ */

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
  text-align: center;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ff6b6b;
  margin-bottom: var(--spacing-md);
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.back-button {
  background: var(--kura-bright-teal);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-main);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-button:hover {
  background: var(--kura-teal);
  transform: translateY(-2px);
}

/* ============================================
   PORTADA
   ============================================ */

.collection-cover {
  width: 100%;
  height: 400px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 7, 6, 0.3) 0%,
    rgba(0, 7, 6, 0.8) 100%
  );
}

/* ============================================
   HEADER DE COLECCIÓN
   ============================================ */

.collection-header {
  margin-top: calc(-1 * var(--spacing-xl));
  position: relative;
  z-index: 10;
}

.collection-info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.collection-title-section {
  margin-bottom: var(--spacing-lg);
}

.collection-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  letter-spacing: -0.02em;
}

.collection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.collection-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 var(--spacing-lg) 0;
}

/* ============================================
   DUEÑO DE LA COLECCIÓN
   ============================================ */

.collection-owner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.owner-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.owner-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.owner-button:hover {
  background: var(--bg-tertiary);
}

.owner-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--kura-teal);
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 0.85rem;
  background: var(--kura-bright-teal);
}

.owner-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ============================================
   ACCIONES SOCIALES
   ============================================ */

.collection-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
  margin-bottom: var(--spacing-lg);
}

/* ============================================
   ACCIONES DEL DUEÑO
   ============================================ */

.owner-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.action-button-secondary {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.action-button-secondary:hover {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
}

.action-button-danger {
  background: transparent;
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
}

.action-button-danger:hover {
  background: rgba(255, 107, 107, 0.1);
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* ============================================
   OBRAS DE LA COLECCIÓN
   ============================================ */

.collection-works {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.empty-works {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-works p {
  font-size: 0.95rem;
  margin: 0;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.work-card {
  display: block;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.work-card:hover {
  border-color: var(--kura-teal);
  transform: translateY(-4px);
}

.work-image {
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg-primary);
  overflow: hidden;
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.work-card:hover .work-image img {
  transform: scale(1.05);
}

.work-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.work-placeholder svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.work-info {
  padding: var(--spacing-md);
}

.work-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.work-artist {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.work-note {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 768px) {
  .collection-cover {
    height: 250px;
  }

  .collection-title {
    font-size: 1.5rem;
  }

  .collection-meta {
    gap: var(--spacing-md);
  }

  .collection-actions {
    flex-wrap: wrap;
  }

  .owner-actions {
    flex-wrap: wrap;
  }

  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>