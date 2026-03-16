<template>
  <div class="my-collections-view">
    <!-- Header de la página -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">📚 Mis Colecciones</h1>
        <p class="page-subtitle">
          Gestiona tus colecciones de arte personal
        </p>
      </div>
      <button @click="openCreateModal" class="create-btn">
        ➕ Nueva Colección
      </button>
    </header>

    <!-- SKELETON LOADER: Mientras carga -->
    <div v-if="loading && collections.length === 0" class="skeleton-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-cover"></div>
        <div class="skeleton-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>No se pudieron cargar las colecciones</h2>
      <p>{{ error }}</p>
      <button @click="loadCollections" :disabled="loading" class="retry-button">
        🔄 Reintentar
      </button>
    </div>

    <!-- EMPTY STATE: Sin colecciones -->
    <div v-else-if="collections.length === 0" class="empty-state">
      <div class="empty-icon">🎨</div>
      <h2>Aún no tienes colecciones</h2>
      <p>
        Crea tu primera colección para empezar a guardar tus obras de arte favoritas.
        Es como crear playlists en Spotify, pero con arte.
      </p>
      <button @click="openCreateModal" class="create-btn primary">
        ➕ Crear mi primera colección
      </button>
    </div>

    <!-- GRID DE COLECCIONES -->
    <div v-else class="collections-grid">
      <div 
        v-for="collection in collections" 
        :key="collection.id" 
        class="collection-card"
      >
        <!-- Portada de la colección -->
        <div class="card-cover" @click="goToCollection(collection.id)">
          <img
            v-if="collection.cover_image_url || getFirstArtworkImage(collection)"
            :src="collection.cover_image_url || getFirstArtworkImage(collection)"
            :alt="collection.title"
            class="cover-image"
          />
          <div v-else class="cover-placeholder">
            <span class="placeholder-icon">🖼️</span>
          </div>
          
          <!-- Overlay con acciones -->
          <div class="card-overlay">
            <button @click.stop="goToCollection(collection.id)" class="overlay-btn">
              👁️ Ver
            </button>
          </div>
        </div>

        <!-- Información de la colección -->
        <div class="card-info">
          <h3 class="card-title">{{ collection.title }}</h3>
          <p v-if="collection.description" class="card-description">
            {{ truncateText(collection.description, 80) }}
          </p>
          
          <!-- Meta información -->
          <div class="card-meta">
            <span class="meta-item">
              📦 {{ collection.collection_items?.length || 0 }} obras
            </span>
            <span class="meta-item" v-if="collection.is_public">
              🌍 Pública
            </span>
            <span class="meta-item" v-else>
              🔒 Privada
            </span>
          </div>
          
          <!-- Acciones -->
          <div class="card-actions">
            <button @click="openEditModal(collection)" class="action-btn edit">
              ✏️ Editar
            </button>
            <button @click="confirmDelete(collection)" class="action-btn delete">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Crear/Editar Colección (Usamos el componente CollectionForm) -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Editar Colección' : 'Nueva Colección' }}</h2>
          <button @click="closeFormModal" class="close-btn">✕</button>
        </div>
        
        <!-- 🆕 COMPONENTE REUTILIZABLE -->
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

    <!-- MODAL: Confirmar Eliminación -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h2>⚠️ Eliminar Colección</h2>
          <button @click="closeDeleteModal" class="close-btn">✕</button>
        </div>
        
        <div class="delete-content">
          <p>
            ¿Estás seguro de que quieres eliminar la colección 
            <strong>"{{ collectionToDelete?.title }}"</strong>?
          </p>
          <p class="delete-warning">
            Esta acción no se puede deshacer. Todas las obras se eliminarán de esta colección.
          </p>
        </div>
        
        <div class="form-actions">
          <button @click="closeDeleteModal" class="btn-cancel">
            Cancelar
          </button>
          <button @click="executeDelete" :disabled="deleteLoading" class="btn-delete">
            {{ deleteLoading ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollections } from '@/composables/useCollections'
import CollectionForm from '@/components/collections/CollectionForm.vue'

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

// ─────────────────────────────────────────────────────────────
// ESTADO DEL COMPONENTE
// ─────────────────────────────────────────────────────────────

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const collectionToDelete = ref(null)
const formLoading = ref(false)
const deleteLoading = ref(false)

// Formulario reactivo (se pasa a CollectionForm)
const formData = reactive({
  title: '',
  description: '',
  cover_image_url: '',
  is_public: true
})

// ─────────────────────────────────────────────────────────────
// MÉTODOS DE CARGA
// ─────────────────────────────────────────────────────────────

const loadCollections = async () => {
  await fetchMyCollections()
}

onMounted(() => {
  loadCollections()
})

// ─────────────────────────────────────────────────────────────
// MÉTODOS DE NAVEGACIÓN
// ─────────────────────────────────────────────────────────────

const goToCollection = (collectionId) => {
  router.push(`/my-collections/${collectionId}`)
}

// ─────────────────────────────────────────────────────────────
// MÉTODOS DE UTILIDAD
// ─────────────────────────────────────────────────────────────

const getFirstArtworkImage = (collection) => {
  if (!collection.collection_items || collection.collection_items.length === 0) {
    return null
  }
  const firstItem = collection.collection_items[0]
  return firstItem.museum_artworks?.thumbnail_url || firstItem.museum_artworks?.image_url
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// ─────────────────────────────────────────────────────────────
// MÉTODOS DEL MODAL (CREAR/EDITAR)
// ─────────────────────────────────────────────────────────────

const openCreateModal = () => {
  isEditMode.value = false
  // Resetear formulario a valores vacíos
  formData.title = ''
  formData.description = ''
  formData.cover_image_url = ''
  formData.is_public = true
  showFormModal.value = true
}

const openEditModal = (collection) => {
  isEditMode.value = true
  // Rellenar formulario con datos de la colección
  formData.title = collection.title
  formData.description = collection.description || ''
  formData.cover_image_url = collection.cover_image_url || ''
  formData.is_public = collection.is_public
  // Guardar referencia para saber qué editar
  collectionToDelete.value = collection
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  isEditMode.value = false
  collectionToDelete.value = null
}

/**
 * 🆕 Manejar submit del CollectionForm
 * Recibe los datos validados desde el componente hijo
 */
const handleFormSubmit = async (formValues) => {
  formLoading.value = true
  
  try {
    if (isEditMode.value && collectionToDelete.value) {
      // Actualizar colección existente
      const success = await updateCollection(collectionToDelete.value.id, formValues)
      if (success) {
        closeFormModal()
        await loadCollections()
      }
    } else {
      // Crear nueva colección
      const newCollection = await createCollection(formValues)
      if (newCollection) {
        closeFormModal()
        await loadCollections()
        // Opcional: redirigir a la nueva colección
        // router.push(`/my-collections/${newCollection.id}`)
      }
    }
  } catch (err) {
    console.error('Error saving collection:', err)
  } finally {
    formLoading.value = false
  }
}

/**
 * 🆕 Manejar errores de validación del formulario
 */
const handleFormError = (errorMessage) => {
  console.warn('Form validation error:', errorMessage)
  // Podrías mostrar un toast/notificación aquí
}

// ─────────────────────────────────────────────────────────────
// MÉTODOS DEL MODAL (ELIMINAR)
// ─────────────────────────────────────────────────────────────

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
    const success = await deleteCollection(collectionToDelete.value.id)
    if (success) {
      closeDeleteModal()
      await loadCollections()
    }
  } catch (err) {
    console.error('Error deleting collection:', err)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
/* ============================================
   CONTENEDOR PRINCIPAL
   ============================================ */
.my-collections-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  min-height: 100vh;
  background: var(--kura-bg);
}

/* ============================================
   HEADER DE PÁGINA
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--kura-color1);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--kura-text-muted);
  margin: 0;
}

.create-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--kura-color4);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background var(--transition-fast), transform var(--transition-fast);
  white-space: nowrap;
}

.create-btn:hover:not(:disabled) {
  background: var(--kura-color3);
  transform: translateY(-2px);
}

.create-btn.primary {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
}

/* ============================================
   SKELETON GRID
   ============================================ */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.skeleton-card {
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.skeleton-cover {
  height: 200px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  padding: var(--spacing-md);
}

.skeleton-title {
  height: 1.5rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  animation: shimmer 1.5s infinite;
}

.skeleton-line.short {
  width: 60%;
}

/* ============================================
   ERROR STATE
   ============================================ */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  max-width: 500px;
  margin: 2rem auto;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.error-state h2 {
  color: var(--kura-color1);
  margin-bottom: var(--spacing-md);
}

.error-state p {
  color: var(--kura-text-muted);
  margin-bottom: var(--spacing-xl);
}

.retry-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--kura-color4);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  transition: background var(--transition-fast);
}

.retry-button:hover:not(:disabled) {
  background: var(--kura-color3);
}

.retry-button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

/* ============================================
   EMPTY STATE
   ============================================ */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 2rem auto;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-md);
}

.empty-state h2 {
  color: var(--kura-color1);
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  color: var(--kura-text-muted);
  margin-bottom: var(--spacing-xl);
  line-height: 1.7;
}

/* ============================================
   GRID DE COLECCIONES
   ============================================ */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

/* ============================================
   TARJETA DE COLECCIÓN
   ============================================ */
.collection-card {
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-cover {
  position: relative;
  height: 200px;
  cursor: pointer;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.card-cover:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--kura-color2), var(--kura-color3));
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 7, 6, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card-cover:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: white;
  color: var(--kura-color1);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.overlay-btn:hover {
  background: var(--kura-color5);
}

/* ============================================
   INFORMACIÓN DE LA TARJETA
   ============================================ */
.card-info {
  padding: var(--spacing-md);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--kura-color1);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.3;
}

.card-description {
  font-size: 0.9rem;
  color: var(--kura-text-muted);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.meta-item {
  font-size: 0.8rem;
  color: var(--kura-text-muted);
  background: var(--kura-bg);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.card-actions {
  display: flex;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--kura-border);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.action-btn.edit {
  background: var(--kura-color5);
  color: var(--kura-color1);
}

.action-btn.edit:hover {
  background: #a89675;
}

.action-btn.delete {
  background: #ffebee;
  color: #c62828;
}

.action-btn.delete:hover {
  background: #ffcdd2;
}

/* ============================================
   MODAL OVERLAY
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 7, 6, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--kura-border);
}

.modal-header h2 {
  font-size: 1.25rem;
  color: var(--kura-color1);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--kura-text-muted);
  transition: color var(--transition-fast);
}

.close-btn:hover {
  color: var(--kura-color1);
}

/* ============================================
   BOTONES DEL MODAL DE ELIMINAR
   ============================================ */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--kura-border);
}

.btn-cancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--kura-bg);
  color: var(--kura-text);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.95rem;
  transition: background var(--transition-fast);
}

.btn-cancel:hover {
  background: var(--kura-border);
}

.btn-delete {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: #c62828;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.btn-delete:hover:not(:disabled) {
  background: #b71c1c;
}

.btn-delete:disabled {
  background: #ef9a9a;
  cursor: not-allowed;
}

/* ============================================
   DELETE MODAL ESPECÍFICO
   ============================================ */
.delete-modal .delete-content {
  padding: var(--spacing-lg);
}

.delete-modal p {
  color: var(--kura-text);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.delete-warning {
  color: #c62828;
  font-weight: 500;
  background: #ffebee;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

/* ============================================
   RESPONSIVE: MOBILE (< 768px)
   ============================================ */
@media (max-width: 768px) {
  .my-collections-view {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .collections-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-height: 95vh;
    margin: var(--spacing-sm);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-delete {
    width: 100%;
  }
}

/* ============================================
   RESPONSIVE: TABLET (768px - 1024px)
   ============================================ */
@media (min-width: 769px) and (max-width: 1024px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>