<template>
  <div class="artwork-detail-view">
    
    <!-- Navegación Superior (Opcional, si quieres que persista) -->
    <!-- Si prefieres una navegación más limpia solo con "Volver", puedes quitar TopNav aquí -->
    <!-- <TopNav /> -->

    <main class="artwork-container container">
      
      <!-- Botón Volver (Estilo discreto) -->
      <button @click="$router.back()" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Volver a la galería</span>
      </button>

      <!-- SKELETON LOADER (Dark Mode) -->
      <div v-if="loading && !artwork" class="skeleton-layout">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line subtitle"></div>
          <div class="skeleton-grid">
            <div class="skeleton-block"></div>
            <div class="skeleton-block"></div>
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
        <h2>No se pudo cargar la obra</h2>
        <p>{{ error }}</p>
        <button @click="loadArtwork" :disabled="loading" class="btn btn-primary">
          Reintentar
        </button>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div v-else-if="artwork" class="artwork-display">
        
        <!-- Columna Izquierda: Imagen Gigante -->
        <div class="visual-column">
          <div class="image-frame">
            <img
              :src="artwork.image_url || artwork.thumbnail_url"
              :alt="artwork.title"
              class="masterpiece-image"
              @error="handleImageError"
            />
          </div>
          
          <!-- Badge Dominio Público -->
          <div v-if="artwork.is_public_domain" class="badge-public-domain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Dominio Público</span>
          </div>
        </div>

        <!-- Columna Derecha: Ficha Técnica -->
        <div class="info-column">
          <header class="artwork-header">
            <h1 class="artwork-title">{{ artwork.title }}</h1>
            <p class="artwork-artist">{{ artwork.artist_name || 'Autor desconocido' }}</p>
            <p v-if="artwork.creation_date" class="artwork-date">{{ artwork.creation_date }}</p>
          </header>

          <div class="divider"></div>

          <!-- Sección: Datos del Artista -->
          <section class="data-section">
            <h3 class="section-heading">Sobre el artista</h3>
            <dl class="data-grid">
              <div v-if="artwork.metadata?.artistNationality" class="data-row">
                <dt>Nacionalidad</dt>
                <dd>{{ artwork.metadata.artistNationality }}</dd>
              </div>
              <div v-if="artwork.metadata?.artistBeginDate" class="data-row">
                <dt>Vida</dt>
                <dd>{{ artwork.metadata.artistBeginDate }} – {{ artwork.metadata.artistEndDate || 'Presente' }}</dd>
              </div>
              <div v-if="artwork.metadata?.artistGender" class="data-row">
                <dt>Género</dt>
                <dd>{{ artwork.metadata.artistGender }}</dd>
              </div>
            </dl>
          </section>

          <div class="divider"></div>

          <!-- Sección: Detalles de la Obra -->
          <section class="data-section">
            <h3 class="section-heading">Detalles físicos</h3>
            <dl class="data-grid">
              <div v-if="artwork.period" class="data-row">
                <dt>Movimiento</dt>
                <dd>{{ artwork.period }}</dd>
              </div>
              <div v-if="artwork.metadata?.medium" class="data-row">
                <dt>Técnica</dt>
                <dd>{{ artwork.metadata.medium }}</dd>
              </div>
              <div v-if="artwork.metadata?.dimensions" class="data-row">
                <dt>Dimensiones</dt>
                <dd>{{ artwork.metadata.dimensions }}</dd>
              </div>
              <div v-if="artwork.metadata?.department" class="data-row">
                <dt>Departamento</dt>
                <dd>{{ artwork.metadata.department }}</dd>
              </div>
            </dl>
          </section>

          <!-- Descripción Extendida -->
          <div v-if="artwork.description" class="description-block">
            <h3 class="section-heading">Descripción</h3>
            <p class="description-text">{{ artwork.description }}</p>
          </div>

          <!-- Tags -->
          <div v-if="artwork.tags?.length" class="tags-container">
            <span v-for="tag in artwork.tags" :key="tag" class="tag-pill">
              {{ tag }}
            </span>
          </div>

          <!-- Acciones Principales -->
          <div class="actions-bar">
            <button 
              @click="openAddToCollectionModal" 
              class="btn btn-primary full-width"
              :disabled="!isLoggedIn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Añadir a colección</span>
            </button>
            
            <a
              v-if="artwork.external_url"
              :href="artwork.external_url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline full-width"
            >
              <span>Ver en origen</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
          
          <p v-if="!isLoggedIn" class="login-prompt">
            <router-link to="/login">Inicia sesión</router-link> para guardar obras en tus colecciones.
          </p>
        </div>
      </div>
    </main>

    <!-- MODAL: Añadir a Colección (Refactorizado Sin Emojis) -->
    <transition name="modal-fade">
      <div v-if="showCollectionModal" class="modal-backdrop" @click.self="closeCollectionModal">
        <div class="modal-panel">
          <div class="modal-head">
            <h2>Añadir a colección</h2>
            <button @click="closeCollectionModal" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Loading -->
            <div v-if="collectionsLoading" class="modal-state">
              <div class="spinner-ring"></div>
              <p>Cargando tus colecciones...</p>
            </div>

            <!-- Error -->
            <div v-else-if="collectionsError" class="modal-state error">
              <p>{{ collectionsError }}</p>
              <button @click="loadUserCollections" class="btn-text">Reintentar</button>
            </div>

            <!-- Empty -->
            <div v-else-if="userCollections.length === 0" class="modal-state empty">
              <svg class="icon-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <p>No tienes colecciones creadas.</p>
              <button @click="openCreateCollectionForm" class="btn btn-primary btn-sm">
                Crear tu primera colección
              </button>
            </div>

            <!-- Lista -->
            <div v-else class="collection-list">
              <p class="list-instruction">Selecciona una destino:</p>
              <div 
                v-for="collection in userCollections" 
                :key="collection.id"
                @click="selectCollection(collection)"
                class="collection-item"
                :class="{ active: selectedCollection?.id === collection.id }"
              >
                <div class="item-details">
                  <h4>{{ collection.title }}</h4>
                  <span class="item-meta">
                    {{ collection.collection_items?.length || 0 }} obras • 
                    {{ collection.is_public ? 'Pública' : 'Privada' }}
                  </span>
                </div>
                <div class="item-indicator">
                  <div class="radio-circle" :class="{ checked: selectedCollection?.id === collection.id }">
                    <div v-if="selectedCollection?.id === collection.id" class="radio-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-foot" v-if="userCollections.length > 0">
            <button @click="openCreateCollectionForm" class="btn btn-ghost btn-sm">
              + Nueva colección
            </button>
            <div class="action-group">
              <button @click="closeCollectionModal" class="btn btn-text">Cancelar</button>
              <button 
                @click="confirmAddToCollection" 
                class="btn btn-primary"
                :disabled="!selectedCollection || addToCollectionLoading"
              >
                {{ addToCollectionLoading ? 'Guardando...' : 'Añadir' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL: Crear Colección (Refactorizado) -->
    <transition name="modal-fade">
      <div v-if="showCreateCollectionForm" class="modal-backdrop" @click.self="closeCreateCollectionForm">
        <div class="modal-panel">
          <div class="modal-head">
            <h2>Nueva Colección</h2>
            <button @click="closeCreateCollectionForm" class="btn-icon-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="handleQuickCreateCollection" class="modal-form">
            <div class="form-field">
              <label for="col-title" class="form-label">Título</label>
              <input
                id="col-title"
                v-model="quickCollectionData.title"
                type="text"
                placeholder="Ej: Impresionismo Francés"
                class="form-input-dark"
                required
              />
            </div>
            
            <div class="form-field">
              <span class="form-label">Visibilidad</span>
              <div class="radio-group-dark">
                <label class="radio-option">
                  <input v-model="quickCollectionData.is_public" type="radio" :value="true" />
                  <span>Pública</span>
                </label>
                <label class="radio-option">
                  <input v-model="quickCollectionData.is_public" type="radio" :value="false" />
                  <span>Privada</span>
                </label>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" @click="closeCreateCollectionForm" class="btn btn-text">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="quickCreateLoading">
                {{ quickCreateLoading ? 'Creando...' : 'Crear y Añadir' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- TOAST NOTIFICATION (Sin Emojis) -->
    <transition name="toast-slide">
      <div v-if="toast.visible" :class="['toast-notification', toast.type]">
        <svg v-if="toast.type === 'success'" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
// ... (El script se mantiene igual que en tu versión, ya que la lógica es correcta)
// Solo asegúrate de importar los composables correctamente.
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'
import { useCollections } from '@/composables/useCollections'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { getArtwork, loading, error } = useArtworks()
const { user } = useAuth()
const { addArtworkToCollection, createCollection, fetchMyCollections } = useCollections()

const artwork = ref(null)

const loadArtwork = async () => {
  const museumId = route.params.id
  artwork.value = await getArtwork(museumId)
}

const handleImageError = (e) => {
  // Placeholder oscuro elegante
  e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <rect fill='#00272d' width='800' height='600'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#134647' font-family='system-ui' font-size='16'>Imagen no disponible</text>
    </svg>
  `)}`
}

const isLoggedIn = computed(() => !!user.value)

// Estados del Modal
const showCollectionModal = ref(false)
const showCreateCollectionForm = ref(false)
const collectionsLoading = ref(false)
const collectionsError = ref(null)
const userCollections = ref([])
const selectedCollection = ref(null)
const addToCollectionLoading = ref(false)
const quickCreateLoading = ref(false)
const quickCollectionData = ref({ title: '', is_public: true })

// Toast
const toast = ref({ visible: false, type: 'success', message: '' })
const showToast = (type, message) => {
  toast.value = { visible: true, type, message }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

// Métodos (Lógica mantenida, solo limpieza visual)
const openAddToCollectionModal = async () => {
  if (!isLoggedIn.value) {
    showToast('error', 'Debes iniciar sesión para guardar colecciones')
    return
  }
  showCollectionModal.value = true
  selectedCollection.value = null
  await loadUserCollections()
}

const closeCollectionModal = () => {
  showCollectionModal.value = false
  selectedCollection.value = null
}

const syncArtworkToDatabase = async () => {
  const { supabase } = await import('@/supabase/client')
  if (artwork.value.id && artwork.value.id !== 'undefined') return artwork.value.id
  
  try {
    const { data, error } = await supabase.rpc('sync_museum_artwork', {
      p_museum_id: artwork.value.museum_id,
      p_museum_name: 'Met',
      p_external_url: artwork.value.external_url || null,
      p_title: artwork.value.title,
      p_artist_name: artwork.value.artist_name || null,
      p_creation_date: artwork.value.creation_date || null,
      p_period: artwork.value.period || null,
      p_image_url: artwork.value.image_url || null,
      p_thumbnail_url: artwork.value.thumbnail_url || null,
      p_description: artwork.value.description || null,
      p_tags: artwork.value.tags || null,
      p_is_public_domain: artwork.value.is_public_domain ?? true,
      p_metadata: artwork.value.metadata || null
    })
    if (error) throw error
    artwork.value.id = data
    return data
  } catch (err) {
    console.error('Error syncing artwork:', err)
    throw new Error('No se pudo guardar la obra en la base de datos')
  }
}

const loadUserCollections = async () => {
  collectionsLoading.value = true
  collectionsError.value = null
  try {
    const { supabase } = await import('@/supabase/client')
    if (!user.value) throw new Error('No hay usuario autenticado')
    
    const { data, error } = await supabase
      .from('collections')
      .select(`*, collection_items (id)`)
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    userCollections.value = data || []
  } catch (err) {
    collectionsError.value = err.message
  } finally {
    collectionsLoading.value = false
  }
}

const selectCollection = (collection) => {
  selectedCollection.value = collection
}

const openCreateCollectionForm = () => {
  showCreateCollectionForm.value = true
  quickCollectionData.value = { title: '', is_public: true }
}

const closeCreateCollectionForm = () => {
  showCreateCollectionForm.value = false
}

const confirmAddToCollection = async () => {
  if (!selectedCollection.value || !artwork.value) return
  addToCollectionLoading.value = true
  try {
    const artworkId = await syncArtworkToDatabase()
    const result = await addArtworkToCollection(selectedCollection.value.id, artworkId)
    if (result) {
      showToast('success', 'Obra añadida correctamente')
      closeCollectionModal()
    } else {
      showToast('error', 'Error al añadir la obra')
    }
  } catch (err) {
    showToast('error', err.message)
  } finally {
    addToCollectionLoading.value = false
  }
}

const handleQuickCreateCollection = async () => {
  if (!quickCollectionData.value.title.trim()) return
  quickCreateLoading.value = true
  try {
    const newCollection = await createCollection({
      title: quickCollectionData.value.title.trim(),
      description: `Creada desde ${artwork.value?.title}`,
      is_public: quickCollectionData.value.is_public
    })
    if (newCollection) {
      const result = await addArtworkToCollection(newCollection.id, artwork.value.id)
      if (result) {
        showToast('success', 'Colección creada y obra añadida')
        closeCreateCollectionForm()
        closeCollectionModal()
      }
    }
  } catch (err) {
    showToast('error', err.message)
  } finally {
    quickCreateLoading.value = false
  }
}

onMounted(() => {
  loadArtwork()
})
</script>

<style scoped>
/* ============================================
   LAYOUT GENERAL & FONDO
   ============================================ */
.artwork-detail-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: var(--spacing-xxl);
}

.artwork-container {
  padding-top: var(--spacing-xl);
  max-width: 1400px; /* Más ancho para permitir imagen grande */
}

/* Botón Volver */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  margin-bottom: var(--spacing-lg);
  transition: color var(--transition-fast);
  padding: 0;
}

.btn-back:hover {
  color: var(--kura-gold);
}

.btn-back svg {
  width: 18px;
  height: 18px;
}

/* ============================================
   SKELETON LOADER (DARK)
   ============================================ */
.skeleton-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  animation: fadeIn 0.5s ease;
}

.skeleton-image {
  aspect-ratio: 4/3;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
}

.skeleton-line {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-line.title { height: 3rem; width: 90%; }
.skeleton-line.subtitle { height: 1.5rem; width: 60%; }

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.skeleton-block {
  height: 4rem;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   DISPLAY PRINCIPAL (GRID)
   ============================================ */
.artwork-display {
  display: grid;
  grid-template-columns: 1.2fr 1fr; /* Imagen ligeramente más grande */
  gap: var(--spacing-xxl);
  animation: slideUp 0.6s ease-out;
}

/* Columna Visual */
.visual-column {
  position: sticky;
  top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-frame {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  background: #000;
  line-height: 0; /* Eliminar espacio extra en img */
}

.masterpiece-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s ease;
}

.image-frame:hover .masterpiece-image {
  transform: scale(1.02);
}

.badge-public-domain {
  margin-top: var(--spacing-md);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(12, 126, 126, 0.2);
  border: 1px solid var(--kura-bright-teal);
  color: var(--kura-bright-teal);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-public-domain svg {
  width: 14px;
  height: 14px;
}

/* Columna Info */
.info-column {
  padding-top: var(--spacing-sm);
  display: flex;
  flex-direction: column;
}

.artwork-header {
  margin-bottom: var(--spacing-lg);
}

.artwork-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 var(--spacing-xs);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.artwork-artist {
  font-size: 1.5rem;
  color: var(--kura-gold);
  font-weight: 500;
  margin: 0 0 var(--spacing-xs);
}

.artwork-date {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-lg) 0;
  border: none;
}

/* Secciones de Datos */
.data-section {
  margin-bottom: var(--spacing-lg);
}

.section-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0 0 var(--spacing-md);
  font-weight: 600;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.data-row {
  display: flex;
  flex-direction: column;
}

.data-row dt {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-weight: 500;
}

.data-row dd {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 400;
  line-height: 1.4;
}

.description-block {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--kura-gold);
}

.description-text {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
}

/* Tags */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin: var(--spacing-lg) 0;
}

.tag-pill {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-fast);
}

.tag-pill:hover {
  border-color: var(--kura-gold);
  color: var(--kura-gold);
}

/* Barra de Acciones */
.actions-bar {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
}

.full-width {
  width: 100%;
  justify-content: center;
}

.login-prompt {
  margin-top: var(--spacing-md);
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}

.login-prompt a {
  color: var(--kura-bright-teal);
  text-decoration: none;
  font-weight: 600;
}

/* ============================================
   BOTONES REUTILIZABLES (Scoped)
   ============================================ */
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
  text-decoration: none;
  border: 1px solid transparent;
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0f9e9e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(12, 126, 126, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px dashed var(--border-subtle);
}

.btn-ghost:hover {
  border-color: var(--kura-gold);
  color: var(--kura-gold);
}

.btn-text {
  background: transparent;
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
}

.btn-text:hover {
  color: var(--text-primary);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* ============================================
   MODALES (GLASSMORPHISM DARK)
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

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
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
  margin: 0;
  color: var(--text-primary);
}

.btn-icon-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.btn-icon-close:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.btn-icon-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-foot {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.action-group {
  display: flex;
  gap: var(--spacing-sm);
}

/* Estados del Modal */
.modal-state {
  text-align: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-secondary);
}

.modal-state.error { color: #ff6b6b; }
.modal-state.empty { color: var(--text-secondary); }

.icon-empty {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.spinner-ring {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--kura-bright-teal);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-md);
}

/* Lista de Colecciones */
.list-instruction {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: rgba(255,255,255,0.02);
}

.collection-item:hover {
  background: rgba(255,255,255,0.05);
  border-color: var(--text-muted);
}

.collection-item.active {
  border-color: var(--kura-gold);
  background: rgba(191, 172, 139, 0.1);
}

.item-details h4 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--text-primary);
}

.item-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.collection-item.active .radio-circle {
  border-color: var(--kura-gold);
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: var(--kura-gold);
  border-radius: 50%;
}

/* Formulario Dark */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input-dark {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-family: var(--font-main);
  font-size: 1rem;
}

.form-input-dark:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

.radio-group-dark {
  display: flex;
  gap: var(--spacing-md);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.radio-option input {
  accent-color: var(--kura-bright-teal);
}

/* ============================================
   TOAST NOTIFICATION
   ============================================ */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  z-index: 3000;
  animation: slideInRight 0.3s ease-out;
  color: var(--text-primary);
  font-weight: 500;
}

.toast-notification.success {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
}

.toast-notification.error {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 900px) {
  .artwork-display {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .visual-column {
    position: static;
  }
  
  .image-frame {
    max-width: 100%;
  }
  
  .actions-bar {
    grid-template-columns: 1fr;
  }
  
  .skeleton-layout {
    grid-template-columns: 1fr;
  }
  
  .modal-foot {
    flex-direction: column-reverse;
  }
  
  .action-group, .btn {
    width: 100%;
  }
}
</style>