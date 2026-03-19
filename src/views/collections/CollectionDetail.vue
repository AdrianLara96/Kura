<template>
  <div class="collection-detail-view">
    
    <!-- Navegación Superior-->
    <TopNav />

    <main class="collection-container container">
      
      <!-- Botón Volver -->
      <button @click="$router.back()" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Volver</span>
      </button>

      <!-- SKELETON LOADER -->
      <div v-if="loading && !collection" class="skeleton-layout">
        <div class="skeleton-cover"></div>
        <div class="skeleton-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line subtitle"></div>
          <div class="skeleton-grid">
            <div class="skeleton-block"></div>
            <div class="skeleton-block"></div>
          </div>
        </div>
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="error" class="state-card error">
        <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2>Error al cargar la colección</h2>
        <p>{{ error }}</p>
        <button @click="loadCollection" class="btn btn-outline">Reintentar</button>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div v-else-if="collection" class="collection-content">
        
        <!-- Header de la Colección -->
        <header class="collection-header">
          <div class="header-visual">
            <div class="cover-frame">
              <img
                v-if="collection.cover_image_url || getFirstArtworkImage()"
                :src="collection.cover_image_url || getFirstArtworkImage()"
                :alt="collection.title"
                class="cover-image"
              />
              <div v-else class="cover-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div class="header-info">
            <div class="badges-row">
              <span class="badge" :class="collection.is_public ? 'public' : 'private'">
                <svg v-if="collection.is_public" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {{ collection.is_public ? 'Pública' : 'Privada' }}
              </span>
              <span class="badge count">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                {{ collectionItems.length }} obras
              </span>
            </div>

            <h1 class="collection-title">{{ collection.title }}</h1>
            
            <p v-if="collection.description" class="collection-description">
              {{ collection.description }}
            </p>

            <div class="meta-row">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{{ collection.user_profiles?.display_name || 'Usuario' }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{{ formatDate(collection.created_at) }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{{ collection.view_count || 0 }} vistas</span>
              </div>
            </div>

            <!-- Acciones Dueño -->
            <div v-if="isOwner" class="actions-row">
              <button @click="openEditModal" class="btn btn-sm btn-outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar
              </button>
              <button @click="toggleVisibility" class="btn btn-sm btn-ghost">
                <svg v-if="collection.is_public" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {{ collection.is_public ? 'Hacer Privada' : 'Hacer Pública' }}
              </button>
              <button @click="confirmDeleteCollection" class="btn btn-sm btn-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Eliminar
              </button>
            </div>

            <!-- Acciones Visitante -->
            <div v-else-if="isLoggedIn" class="actions-row">
              <button @click="followUser" class="btn btn-sm btn-primary">
                {{ isFollowing ? 'Siguiendo' : 'Seguir' }}
              </button>
            </div>
          </div>
        </header>

        <!-- Sección de Obras -->
        <section class="artworks-section">
          <div class="section-header">
            <h2>Obras en esta colección</h2>
            <span class="section-count">{{ collectionItems.length }}</span>
          </div>

          <!-- Empty State -->
          <div v-if="collectionItems.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h3>Colección vacía</h3>
            <p>Esta colección aún no tiene obras añadidas.</p>
            <router-link v-if="isOwner" to="/explore" class="btn btn-primary">
              Explorar obras
            </router-link>
          </div>

          <!-- Grid -->
          <div v-else class="artworks-grid">
            <div
              v-for="item in collectionItems"
              :key="item.id"
              class="artwork-card"
            >
              <div class="card-image-wrapper">
                <router-link :to="`/artwork/${item.museum_artworks?.id}`">
                  <img
                    :src="item.museum_artworks?.thumbnail_url || item.museum_artworks?.image_url"
                    :alt="item.museum_artworks?.title"
                    class="card-image"
                  />
                </router-link>
                
                <!-- Overlay Acciones (Dueño) -->
                <div v-if="isOwner" class="card-overlay">
                  <button @click="openNoteModal(item)" class="icon-btn" title="Nota">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button @click="confirmRemoveArtwork(item)" class="icon-btn danger" title="Quitar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="card-body">
                <router-link 
                  :to="`/artwork/${item.museum_artworks?.id}`"
                  class="card-title"
                >
                  {{ item.museum_artworks?.title }}
                </router-link>
                <p class="card-artist">
                  {{ item.museum_artworks?.artist_name || 'Desconocido' }}
                </p>
                
                <!-- Nota -->
                <div v-if="item.user_note" class="user-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>{{ item.user_note }}</span>
                </div>
                
                <p class="card-museum">
                  {{ item.museum_artworks?.museum_name }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- MODALES -->
    <!-- Modal Editar -->
    <transition name="modal-fade">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal-panel">
          <div class="modal-head">
            <h2>Editar Colección</h2>
            <button @click="closeEditModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <CollectionForm
              :initial-data="editFormData"
              :is-edit-mode="true"
              :loading="updateLoading"
              @submit="handleUpdateCollection"
              @cancel="closeEditModal"
            />
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal Nota -->
    <transition name="modal-fade">
      <div v-if="showNoteModal" class="modal-backdrop" @click.self="closeNoteModal">
        <div class="modal-panel">
          <div class="modal-head">
            <h2>Nota Personal</h2>
            <button @click="closeNoteModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Tu reflexión sobre esta obra</label>
              <textarea
                v-model="noteFormData.note"
                placeholder="Ej: Me recuerda a..."
                class="form-textarea-dark"
                rows="4"
                maxlength="300"
              ></textarea>
              <div class="char-counter">{{ noteFormData.note.length }} / 300</div>
            </div>
            <div class="modal-foot">
              <button @click="closeNoteModal" class="btn btn-text">Cancelar</button>
              <button @click="saveNote" :disabled="noteLoading" class="btn btn-primary">
                {{ noteLoading ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal Eliminar -->
    <transition name="modal-fade">
      <div v-if="showDeleteCollectionModal" class="modal-backdrop" @click.self="closeDeleteCollectionModal">
        <div class="modal-panel delete-confirm">
          <div class="modal-head">
            <h2>Eliminar Colección</h2>
            <button @click="closeDeleteCollectionModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body text-center">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <p>¿Seguro que quieres eliminar <strong>"{{ collection?.title }}"</strong>?</p>
            <p class="warning-text">Esta acción es irreversible.</p>
          </div>
          <div class="modal-foot">
            <button @click="closeDeleteCollectionModal" class="btn btn-text">Cancelar</button>
            <button @click="executeDeleteCollection" :disabled="deleteLoading" class="btn btn-danger">
              {{ deleteLoading ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast Notification -->
    <transition name="toast-slide">
      <div v-if="toast.visible" :class="['toast-notification', toast.type]">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollections } from '@/composables/useCollections'
import { useAuth } from '@/composables/useAuth'
import CollectionForm from '@/components/collections/CollectionForm.vue'
import TopNav from '@/components/common/TopNav.vue'

const route = useRoute()
const router = useRouter()
const { 
  currentCollection, 
  items: collectionItems, 
  loading, 
  error, 
  isOwner,
  fetchCollectionById, 
  updateCollection, 
  deleteCollection,
  removeArtworkFromCollection,
  updateItemNote
} = useCollections()
const { user, isLoggedIn } = useAuth()

const collection = computed(() => currentCollection.value)
const updateLoading = ref(false)
const deleteLoading = ref(false)
const noteLoading = ref(false)

const showEditModal = ref(false)
const showNoteModal = ref(false)
const showDeleteCollectionModal = ref(false)

const editFormData = reactive({
  title: '',
  description: '',
  cover_image_url: '',
  is_public: true
})

const noteFormData = reactive({
  itemId: null,
  note: ''
})

const toast = ref({ visible: false, type: 'success', message: '' })
const showToast = (type, message) => {
  toast.value = { visible: true, type, message }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

const loadCollection = async () => {
  await fetchCollectionById(route.params.id)
}

onMounted(() => { loadCollection() })

const getFirstArtworkImage = () => {
  if (!collectionItems.value?.length) return null
  const first = collectionItems.value[0]
  return first.museum_artworks?.thumbnail_url || first.museum_artworks?.image_url
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

const openEditModal = () => {
  editFormData.title = collection.value.title
  editFormData.description = collection.value.description || ''
  editFormData.cover_image_url = collection.value.cover_image_url || ''
  editFormData.is_public = collection.value.is_public
  showEditModal.value = true
}
const closeEditModal = () => { showEditModal.value = false }

const handleUpdateCollection = async (formData) => {
  updateLoading.value = true
  try {
    if (await updateCollection(collection.value.id, formData)) {
      showToast('success', 'Colección actualizada')
      closeEditModal()
      await loadCollection()
    }
  } catch (err) { showToast('error', 'Error al actualizar') }
  finally { updateLoading.value = false }
}

const toggleVisibility = async () => {
  updateLoading.value = true
  try {
    if (await updateCollection(collection.value.id, { is_public: !collection.value.is_public })) {
      showToast('success', `Visibilidad cambiada a ${!collection.value.is_public ? 'pública' : 'privada'}`)
      await loadCollection()
    }
  } catch (err) { showToast('error', 'Error al cambiar visibilidad') }
  finally { updateLoading.value = false }
}

const confirmDeleteCollection = () => { showDeleteCollectionModal.value = true }
const closeDeleteCollectionModal = () => { showDeleteCollectionModal.value = false }

const executeDeleteCollection = async () => {
  deleteLoading.value = true
  try {
    if (await deleteCollection(collection.value.id)) {
      showToast('success', 'Colección eliminada')
      router.push('/my-collections')
    }
  } catch (err) { showToast('error', 'Error al eliminar') }
  finally { deleteLoading.value = false }
}

const openNoteModal = (item) => {
  noteFormData.itemId = item.id
  noteFormData.note = item.user_note || ''
  showNoteModal.value = true
}
const closeNoteModal = () => {
  showNoteModal.value = false
  noteFormData.itemId = null
  noteFormData.note = ''
}

const saveNote = async () => {
  if (!noteFormData.itemId) return
  noteLoading.value = true
  try {
    if (await updateItemNote(noteFormData.itemId, noteFormData.note)) {
      showToast('success', 'Nota guardada')
      closeNoteModal()
      await loadCollection()
    }
  } catch (err) { showToast('error', 'Error al guardar nota') }
  finally { noteLoading.value = false }
}

const confirmRemoveArtwork = (item) => {
  if (confirm(`¿Quitar "${item.museum_artworks?.title}"?`)) removeArtwork(item)
}

const removeArtwork = async (item) => {
  try {
    if (await removeArtworkFromCollection(item.id)) {
      showToast('success', 'Obra retirada')
      await loadCollection()
    }
  } catch (err) { showToast('error', 'Error al retirar obra') }
}

const isFollowing = ref(false)
const followUser = () => { showToast('info', 'Próximamente') }
</script>

<style scoped>
/* ============================================
   LAYOUT & HEADER
   ============================================ */
.collection-detail-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.collection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: var(--spacing-xl);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  margin-bottom: var(--spacing-lg);
  transition: color var(--transition-fast);
}

.btn-back:hover { color: var(--kura-gold); }
.btn-back svg { width: 18px; height: 18px; }

/* Skeleton Dark */
.skeleton-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-xl);
}
.skeleton-cover {
  height: 300px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  animation: shimmer 1.5s infinite;
}
.skeleton-info { display: flex; flex-direction: column; gap: var(--spacing-md); padding-top: var(--spacing-lg); }
.skeleton-line { height: 1.5rem; background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%); background-size: 200% 100%; border-radius: var(--radius-sm); animation: shimmer 1.5s infinite; }
.skeleton-line.title { height: 2.5rem; width: 80%; }
.skeleton-line.subtitle { height: 1rem; width: 60%; }
.skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-top: var(--spacing-md); }
.skeleton-block { height: 3rem; background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%); background-size: 200% 100%; border-radius: var(--radius-md); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* State Card */
.state-card {
  max-width: 500px;
  margin: 4rem auto;
  text-align: center;
  padding: var(--spacing-xxl);
  background: rgba(19, 70, 71, 0.15);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.state-card h2 { color: var(--text-primary); margin: var(--spacing-md) 0; }
.state-card p { color: var(--text-secondary); margin-bottom: var(--spacing-xl); }
.state-icon { width: 48px; height: 48px; color: #ff6b6b; margin-bottom: var(--spacing-md); }

/* ============================================
   COLLECTION HEADER
   ============================================ */
.collection-header {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xxl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.header-visual {
  background: #000;
  height: 100%;
  min-height: 320px;
}

.cover-frame {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--kura-deep-teal), #000);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-placeholder svg { width: 64px; height: 64px; color: rgba(255,255,255,0.1); }

.header-info {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.badges-row {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge.public { background: rgba(12, 126, 126, 0.2); color: var(--kura-bright-teal); border: 1px solid rgba(12, 126, 126, 0.3); }
.badge.private { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-subtle); }
.badge.count { background: rgba(191, 172, 139, 0.1); color: var(--kura-gold); border: 1px solid rgba(191, 172, 139, 0.2); }
.badge svg { flex-shrink: 0; }

.collection-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.1;
}

.collection-description {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1.05rem;
  margin: 0;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.meta-item svg { color: var(--kura-gold); }

.actions-row {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-top: var(--spacing-sm);
}

/* ============================================
   ARTWORKS SECTION
   ============================================ */
.artworks-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.section-count {
  color: var(--text-muted);
  font-size: 0.9rem;
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
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
  opacity: 0.2;
}

.empty-state h3 { color: var(--text-secondary); margin: 0 0 var(--spacing-sm); }
.empty-state p { margin: 0 0 var(--spacing-lg); }

.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

.artwork-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-normal), border-color var(--transition-normal);
}

.artwork-card:hover {
  transform: translateY(-4px);
  border-color: rgba(191, 172, 139, 0.3);
}

.card-image-wrapper {
  position: relative;
  aspect-ratio: 4/3;
  background: #000;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.artwork-card:hover .card-image { transform: scale(1.05); }

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 7, 6, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card-image-wrapper:hover .card-overlay { opacity: 1; }

.icon-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover { background: #fff; color: #000; }
.icon-btn.danger:hover { background: #ff6b6b; color: #fff; border-color: #ff6b6b; }

.card-body { padding: var(--spacing-md); }

.card-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  margin-bottom: 4px;
  line-height: 1.3;
  transition: color var(--transition-fast);
}

.card-title:hover { color: var(--kura-gold); }

.card-artist {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 8px;
}

.user-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: rgba(191, 172, 139, 0.1);
  border-left: 2px solid var(--kura-gold);
  padding: 6px 8px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.user-note svg { flex-shrink: 0; margin-top: 2px; color: var(--kura-gold); }

.card-museum {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

/* ============================================
   MODALES & BOTONES GLOBALES
   ============================================ */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0, 7, 6, 0.85); backdrop-filter: blur(8px);
  z-index: 2000; display: flex; align-items: center; justify-content: center; padding: var(--spacing-md);
}
.modal-panel {
  background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
  width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--spacing-lg); border-bottom: 1px solid var(--border-subtle);
}
.modal-head h2 { font-size: 1.25rem; color: var(--text-primary); margin: 0; }
.btn-icon-close {
  background: transparent; border: none; color: var(--text-muted); cursor: pointer;
  padding: 4px; border-radius: var(--radius-sm); transition: all var(--transition-fast);
}
.btn-icon-close:hover { color: var(--text-primary); background: var(--bg-tertiary); }

.modal-body { padding: var(--spacing-lg); overflow-y: auto; }
.modal-foot {
  padding: var(--spacing-lg); border-top: 1px solid var(--border-subtle);
  display: flex; justify-content: flex-end; gap: var(--spacing-sm);
}
.text-center { text-align: center; }
.warning-icon svg { color: #ff6b6b; margin-bottom: var(--spacing-md); }
.warning-text { color: #ff6b6b; font-size: 0.9rem; background: rgba(255, 107, 107, 0.1); padding: var(--spacing-sm); border-radius: var(--radius-md); display: inline-block; margin-top: var(--spacing-sm); }

.form-group { margin-bottom: var(--spacing-md); }
.form-label { display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-textarea-dark {
  width: 100%; background: var(--bg-primary); border: 1px solid var(--border-subtle);
  color: var(--text-primary); padding: 0.75rem; border-radius: var(--radius-md);
  font-family: var(--font-main); font-size: 0.95rem; resize: vertical;
}
.form-textarea-dark:focus { outline: none; border-color: var(--kura-bright-teal); }
.char-counter { text-align: right; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

/* Botones Scoped */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 0.6rem 1.2rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: all var(--transition-fast); border: 1px solid transparent; text-decoration: none;
}
.btn svg { flex-shrink: 0; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
.btn-primary { background: var(--kura-bright-teal); color: #fff; }
.btn-primary:hover:not(:disabled) { background: #0f9e9e; transform: translateY(-2px); }
.btn-outline { background: transparent; border-color: var(--border-subtle); color: var(--text-primary); }
.btn-outline:hover:not(:disabled) { border-color: var(--text-primary); background: var(--bg-tertiary); }
.btn-ghost { background: transparent; color: var(--text-secondary); border: 1px dashed var(--border-subtle); }
.btn-ghost:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); background: var(--bg-tertiary); }
.btn-danger { background: rgba(255, 107, 107, 0.15); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.3); }
.btn-danger:hover:not(:disabled) { background: #ff6b6b; color: #fff; }
.btn-text { background: transparent; color: var(--text-secondary); padding: 0.5rem 1rem; }
.btn-text:hover { color: var(--text-primary); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Toast */
.toast-notification {
  position: fixed; bottom: 2rem; right: 2rem;
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
  padding: 1rem 1.5rem; border-radius: var(--radius-md);
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 3000;
  animation: slideInRight 0.3s ease-out; color: var(--text-primary); font-weight: 500;
}
.toast-notification.success { border-color: var(--kura-bright-teal); color: var(--kura-bright-teal); }
.toast-notification.error { border-color: #ff6b6b; color: #ff6b6b; }
.toast-notification.info { border-color: var(--kura-gold); color: var(--kura-gold); }
@keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

/* Responsive */
@media (max-width: 768px) {
  .collection-header { grid-template-columns: 1fr; }
  .header-visual { min-height: 200px; }
  .collection-title { font-size: 1.75rem; }
  .artworks-grid { grid-template-columns: repeat(2, 1fr); }
  .actions-row { flex-direction: column; }
  .btn { width: 100%; }
  .modal-foot { flex-direction: column-reverse; }
}
</style>