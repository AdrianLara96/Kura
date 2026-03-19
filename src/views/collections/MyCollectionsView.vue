<template>
  <div class="my-collections-view">
  <TopNav />
    
    <!-- Cabecera de Página -->
    <header class="page-header container">
      <div class="header-content">
        <h1 class="page-title">Mis Colecciones</h1>
        <p class="page-subtitle">Organiza y gestiona tu patrimonio cultural digital</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Nueva Colección</span>
      </button>
    </header>

    <!-- SKELETON LOADER -->
    <div v-if="loading && collections.length === 0" class="skeleton-grid container">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-cover"></div>
        <div class="skeleton-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="state-card error container">
      <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h2>Error al cargar colecciones</h2>
      <p>{{ error }}</p>
      <button @click="loadCollections" :disabled="loading" class="btn btn-outline">
        Reintentar
      </button>
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="collections.length === 0" class="state-card empty container">
      <div class="empty-visual">
        <svg class="hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
      </div>
      <h2>Tu biblioteca está vacía</h2>
      <p>
        Crea tu primera colección para empezar a curar obras maestras. 
        Organiza por artista, movimiento o simplemente por lo que te inspire.
      </p>
      <button @click="openCreateModal" class="btn btn-primary btn-lg">
        Crear primera colección
      </button>
    </div>

    <!-- GRID DE COLECCIONES -->
    <div v-else class="collections-grid container">
      <div 
        v-for="collection in collections" 
        :key="collection.id" 
        class="collection-card"
      >
        <!-- Portada Interactiva -->
        <div class="card-cover" @click="goToCollection(collection.id)">
          <img
            v-if="collection.cover_image_url || getFirstArtworkImage(collection)"
            :src="collection.cover_image_url || getFirstArtworkImage(collection)"
            :alt="collection.title"
            class="cover-image"
            loading="lazy"
          />
          <div v-else class="cover-placeholder">
            <!-- Icono -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
              <path d="M12 12l2.5-2.5"></path>
            </svg>
          </div>
          
          <!-- Overlay al Hover -->
          <div class="card-overlay">
            <span class="overlay-text">Ver colección</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        <!-- Cuerpo de la Tarjeta -->
        <div class="card-body">
          <div class="card-header">
            <h3 class="card-title">{{ collection.title }}</h3>
            <div class="visibility-badge" :class="collection.is_public ? 'public' : 'private'">
              <svg v-if="collection.is_public" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>{{ collection.is_public ? 'Pública' : 'Privada' }}</span>
            </div>
          </div>

          <p v-if="collection.description" class="card-description">
            {{ truncateText(collection.description, 100) }}
          </p>

          <div class="card-meta">
            <div class="meta-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <span>{{ collection.collection_items?.length || 0 }} obras</span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card-actions">
            <button @click.stop="openEditModal(collection)" class="btn-icon" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button @click.stop="confirmDelete(collection)" class="btn-icon danger" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Formulario (Usando componente reutilizable) -->
    <transition name="modal-fade">
      <div v-if="showFormModal" class="modal-backdrop" @click.self="closeFormModal">
        <div class="modal-panel">
          <div class="modal-head">
            <h2>{{ isEditMode ? 'Editar Colección' : 'Nueva Colección' }}</h2>
            <button @click="closeFormModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <CollectionForm
              :initial-data="formData"
              :is-edit-mode="isEditMode"
              :loading="formLoading"
              @submit="handleFormSubmit"
              @cancel="closeFormModal"
              @error="handleFormError"
            />
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL: Confirmar Eliminación -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-panel delete-confirm">
          <div class="modal-head">
            <h2>Eliminar Colección</h2>
            <button @click="closeDeleteModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-body text-center">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <p>
              ¿Estás seguro de eliminar <strong>"{{ collectionToDelete?.title }}"</strong>?
            </p>
            <p class="warning-text">
              Esta acción es irreversible. Las obras se liberarán de esta colección.
            </p>
          </div>

          <div class="modal-foot">
            <button @click="closeDeleteModal" class="btn btn-text">Cancelar</button>
            <button @click="executeDelete" :disabled="deleteLoading" class="btn btn-danger">
              {{ deleteLoading ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollections } from '@/composables/useCollections'
import CollectionForm from '@/components/collections/CollectionForm.vue'
import TopNav from '@/components/common/TopNav.vue'

const router = useRouter()
const { 
  collections, 
  loading, 
  error, 
  fetchMyCollections, 
  createCollection, 
  updateCollection, 
  deleteCollection 
} = useCollections()

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const collectionToDelete = ref(null)
const formLoading = ref(false)
const deleteLoading = ref(false)

const formData = reactive({
  title: '',
  description: '',
  cover_image_url: '',
  is_public: true
})

const loadCollections = async () => {
  await fetchMyCollections()
}

onMounted(() => {
  loadCollections()
})

const goToCollection = (id) => {
  router.push(`/collections/${id}`)
}

const getFirstArtworkImage = (collection) => {
  if (!collection.collection_items || collection.collection_items.length === 0) return null
  const first = collection.collection_items[0]
  return first.museum_artworks?.thumbnail_url || first.museum_artworks?.image_url
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
}

const openCreateModal = () => {
  isEditMode.value = false
  formData.title = ''
  formData.description = ''
  formData.cover_image_url = ''
  formData.is_public = true
  showFormModal.value = true
}

const openEditModal = (collection) => {
  isEditMode.value = true
  formData.title = collection.title
  formData.description = collection.description || ''
  formData.cover_image_url = collection.cover_image_url || ''
  formData.is_public = collection.is_public
  collectionToDelete.value = collection 
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  isEditMode.value = false
  collectionToDelete.value = null
}

const handleFormSubmit = async (formValues) => {
  formLoading.value = true
  try {
    if (isEditMode.value && collectionToDelete.value) {
      await updateCollection(collectionToDelete.value.id, formValues)
    } else {
      await createCollection(formValues)
    }
    closeFormModal()
    await loadCollections()
  } catch (err) {
    console.error('Error saving collection:', err)
  } finally {
    formLoading.value = false
  }
}

const handleFormError = (msg) => console.warn(msg)

const confirmDelete = (collection) => {
  collectionToDelete.value = collection
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  collectionToDelete.value = null
}

const executeDelete = async () => {
  if (!collectionToDelete.value) return
  deleteLoading.value = true
  try {
    await deleteCollection(collectionToDelete.value.id)
    closeDeleteModal()
    await loadCollections()
  } catch (err) {
    console.error('Error deleting:', err)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
/* ============================================
   LAYOUT & HEADER
   ============================================ */
.my-collections-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--spacing-xl);
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ============================================
   SKELETON (DARK)
   ============================================ */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.skeleton-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.skeleton-cover {
  height: 200px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info { padding: var(--spacing-md); }
.skeleton-title {
  height: 1.5rem; width: 80%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  animation: shimmer 1.5s infinite;
}
.skeleton-line {
  height: 1rem; width: 100%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  animation: shimmer 1.5s infinite;
}
.skeleton-line.short { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   ESTADOS (Empty / Error)
   ============================================ */
.state-card {
  max-width: 600px;
  margin: 4rem auto;
  text-align: center;
  padding: var(--spacing-xxl);
  background: rgba(19, 70, 71, 0.15);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
}

.state-card h2 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
}

.state-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-xl);
}

.empty-visual .hero-icon {
  width: 80px;
  height: 80px;
  color: var(--kura-gold);
  opacity: 0.8;
  margin-bottom: var(--spacing-md);
}

.warning-icon svg {
  width: 48px;
  height: 48px;
  color: #ff6b6b;
  margin-bottom: var(--spacing-md);
}

.warning-text {
  color: #ff6b6b;
  font-size: 0.9rem;
  background: rgba(255, 107, 107, 0.1);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  display: inline-block;
}

/* ============================================
   GRID & TARJETAS
   ============================================ */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.collection-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.collection-card:hover {
  transform: translateY(-6px);
  border-color: rgba(191, 172, 139, 0.3); /* Borde dorado sutil */
  box-shadow: 0 12px 24px rgba(0,0,0,0.4);
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.card-cover:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, var(--kura-deep-teal), #000);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder svg {
  width: 48px;
  height: 48px;
  color: rgba(255,255,255,0.2);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 7, 6, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: #fff;
}

.card-cover:hover .card-overlay {
  opacity: 1;
}

.overlay-text {
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

.card-overlay svg {
  width: 24px;
  height: 24px;
}

.card-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.visibility-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
  white-space: nowrap;
}

.visibility-badge.public {
  color: var(--kura-bright-teal);
  background: rgba(12, 126, 126, 0.15);
}

.visibility-badge.private {
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
}

.card-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 var(--spacing-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-meta {
  margin-bottom: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-subtle);
}

.meta-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-count svg {
  color: var(--kura-gold);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-subtle);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-icon.danger:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

/* ============================================
   MODALES & BOTONES GLOBALES
   ============================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 7, 6, 0.85);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.modal-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.modal-head h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.btn-icon-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.btn-icon-close:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.btn-icon-close svg { width: 20px; height: 20px; }

.modal-body { padding: var(--spacing-lg); overflow-y: auto; }
.modal-foot {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.text-center { text-align: center; }

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Botones Reutilizables Scoped */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  text-decoration: none;
}

.btn svg { width: 18px; height: 18px; }

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0f9e9e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(12, 126, 126, 0.4);
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

.btn-danger {
  background: #ff6b6b;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #ff5252;
}

.btn-text {
  background: transparent;
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
}

.btn-text:hover { color: var(--text-primary); }

.btn-lg { padding: 1rem 2rem; font-size: 1rem; }

/* Responsive */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
  .btn-primary { width: 100%; justify-content: center; }
  .collections-grid { grid-template-columns: 1fr; }
  .modal-foot { flex-direction: column-reverse; }
  .btn { width: 100%; }
}
</style>