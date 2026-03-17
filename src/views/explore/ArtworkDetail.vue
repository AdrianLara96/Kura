<template>
  <div class="artwork-detail">
    <!-- Botón volver -->
    <button @click="$router.back()" class="back-btn">
      ← Volver al explorador
    </button>

    <!-- SKELETON LOADER: Mientras carga -->
    <div v-if="loading && !artwork" class="skeleton-loader">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-artist"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>No se pudo cargar la obra</h2>
      <p>{{ error }}</p>
      <button @click="loadArtwork" :disabled="loading" class="retry-button">
        Reintentar
      </button>
    </div>

    <!-- CONTENIDO DE LA OBRA -->
    <div v-else-if="artwork" class="artwork-content">
      <div class="artwork-grid">
        <!-- Columna izquierda: IMAGEN -->
        <div class="image-column">
          <div class="image-container">
            <img
              :src="artwork.image_url || artwork.thumbnail_url"
              :alt="artwork.title"
              class="artwork-image"
              @error="handleImageError"
            />
          </div>
          
          <!-- Dominio público badge -->
          <div v-if="artwork.is_public_domain" class="public-domain-badge">
            Dominio Público
          </div>
        </div>

        <!-- Columna derecha: INFORMACIÓN -->
        <div class="info-column">
          <!-- Título y artista -->
          <div class="artwork-header">
            <h1 class="artwork-title">{{ artwork.title }}</h1>
            <p class="artwork-artist">{{ artwork.artist_name }}</p>
            <p v-if="artwork.creation_date" class="artwork-date">
              {{ artwork.creation_date }}
            </p>
          </div>

          <hr class="divider" />

          <!-- INFORMACIÓN DEL ARTISTA -->
          <section class="info-section">
            <h2 class="section-title">Información del artista</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.metadata?.artistNationality">
                <span class="info-label">Nacionalidad</span>
                <span class="info-value">{{ artwork.metadata.artistNationality }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistAge">
                <span class="info-label">Edad al crear la obra</span>
                <span class="info-value">{{ artwork.metadata.artistAge }} años</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistBeginDate && artwork.metadata?.artistEndDate">
                <span class="info-label">Vida del artista</span>
                <span class="info-value">
                  {{ artwork.metadata.artistBeginDate }} - {{ artwork.metadata.artistEndDate }}
                </span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistGender">
                <span class="info-label">Género</span>
                <span class="info-value">{{ artwork.metadata.artistGender }}</span>
              </div>
            </div>
          </section>

          <hr class="divider" />

          <!-- INFORMACIÓN DE LA OBRA -->
          <section class="info-section">
            <h2 class="section-title">Información de la obra</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.period">
                <span class="info-label">Período</span>
                <span class="info-value">{{ artwork.period }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.medium">
                <span class="info-label">Materiales</span>
                <span class="info-value">{{ artwork.metadata.medium }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.dimensions">
                <span class="info-label">Dimensiones</span>
                <span class="info-value">{{ artwork.metadata.dimensions }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.department">
                <span class="info-label">Departamento</span>
                <span class="info-value">{{ artwork.metadata.department }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.classification">
                <span class="info-label">Clasificación</span>
                <span class="info-value">{{ artwork.metadata.classification }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.accessionNumber">
                <span class="info-label">Número de acceso</span>
                <span class="info-value">{{ artwork.metadata.accessionNumber }}</span>
              </div>
            </div>
          </section>

          <hr class="divider" />

          <!-- CONTEXTO GEOGRÁFICO -->
          <section class="info-section">
            <h2 class="section-title">Contexto geográfico</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.metadata?.city">
                <span class="info-label">Ciudad</span>
                <span class="info-value">{{ artwork.metadata.city }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.state">
                <span class="info-label">Estado/Región</span>
                <span class="info-value">{{ artwork.metadata.state }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.country">
                <span class="info-label">País</span>
                <span class="info-value">{{ artwork.metadata.country }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.culture">
                <span class="info-label">Cultura</span>
                <span class="info-value">{{ artwork.metadata.culture }}</span>
              </div>
            </div>
          </section>

          <!-- Descripción (si existe) -->
          <div v-if="artwork.description" class="description-section">
            <h2 class="section-title">Descripción</h2>
            <p class="description-text">{{ artwork.description }}</p>
          </div>

          <!-- Etiquetas -->
          <div v-if="artwork.tags?.length" class="tags-section">
            <h2 class="section-title">Tags</h2>
            <div class="tags-list">
              <span v-for="tag in artwork.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- ACCIONES: Añadir a colección + Ver en museo -->
          <div class="actions-section">
            <button 
              @click="openAddToCollectionModal" 
              class="action-btn primary"
              :disabled="!isLoggedIn"
            >
              + Añadir a colección
            </button>
            
            <a
              v-if="artwork.external_url"
              :href="artwork.external_url"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn secondary"
            >
              Ver en The Met →
            </a>
            
            <!-- Mensaje si no está logueado -->
            <p v-if="!isLoggedIn" class="login-hint">
              Inicia sesión para guardar colecciones
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Seleccionar colección -->
    <div v-if="showCollectionModal" class="modal-overlay" @click.self="closeCollectionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>+ Añadir a Colección</h2>
          <button @click="closeCollectionModal" class="close-btn">✕</button>
        </div>
        
        <!-- Estado de carga de colecciones -->
        <div v-if="collectionsLoading" class="modal-loading">
          <div class="spinner"></div>
          <p>Cargando tus colecciones...</p>
        </div>
        
        <!-- Error al cargar colecciones -->
        <div v-else-if="collectionsError" class="modal-error">
          <p>{{ collectionsError }}</p>
          <button @click="loadUserCollections" class="retry-small">Reintentar</button>
        </div>
        
        <!-- Sin colecciones -->
        <div v-else-if="userCollections.length === 0" class="modal-empty">
          <p>Aún no tienes colecciones</p>
          <p class="empty-hint">Crea una nueva colección para añadir esta obra</p>
        </div>
        
        <!-- Lista de colecciones -->
        <div v-else class="collections-list">
          <p class="modal-hint">Selecciona una colección para añadir esta obra:</p>
          
          <div 
            v-for="collection in userCollections" 
            :key="collection.id"
            @click="selectCollection(collection)"
            class="collection-option"
            :class="{ 'selected': selectedCollection?.id === collection.id }"
          >
            <div class="collection-option-info">
              <h4 class="collection-option-title">{{ collection.title }}</h4>
              <p class="collection-option-meta">
                {{ collection.collection_items?.length || 0 }} obras • 
                {{ collection.is_public ? 'Pública' : 'Privada' }}
              </p>
            </div>
            <div class="collection-option-icon">
              {{ selectedCollection?.id === collection.id ? '✅' : '○' }}
            </div>
          </div>
        </div>
        
        <!-- Botones de acción del modal -->
        <div class="modal-actions">
          <button @click="openCreateCollectionForm" class="btn-create-new">
            + Crear nueva colección
          </button>
          
          <div class="modal-buttons">
            <button @click="closeCollectionModal" class="btn-cancel">
              Cancelar
            </button>
            <button 
              @click="confirmAddToCollection" 
              class="btn-confirm"
              :disabled="!selectedCollection || addToCollectionLoading"
            >
              {{ addToCollectionLoading ? 'Añadiendo...' : 'Añadir' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 🆕 MODAL: Crear colección rápida -->
    <div v-if="showCreateCollectionForm" class="modal-overlay" @click.self="closeCreateCollectionForm">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Nueva Colección</h2>
          <button @click="closeCreateCollectionForm" class="close-btn">✕</button>
        </div>
        
        <form @submit.prevent="handleQuickCreateCollection" class="quick-form">
          <div class="form-group">
            <label for="quick-title" class="form-label">Título *</label>
            <input
              id="quick-title"
              v-model="quickCollectionData.title"
              type="text"
              placeholder="Ej: Mis Favoritos, Arte Renacentista..."
              class="form-input"
              required
              minlength="3"
              maxlength="100"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Visibilidad</label>
            <div class="toggle-group">
              <label class="toggle-option">
                <input v-model="quickCollectionData.is_public" type="radio" :value="true" />
                <span>Pública</span>
              </label>
              <label class="toggle-option">
                <input v-model="quickCollectionData.is_public" type="radio" :value="false" />
                <span>Privada</span>
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeCreateCollectionForm" class="btn-cancel">
              Cancelar
            </button>
            <button type="submit" :disabled="quickCreateLoading" class="btn-confirm">
              {{ quickCreateLoading ? 'Creando...' : 'Crear y Añadir' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TOAST: Notificación de éxito/error -->
    <transition name="toast">
      <div v-if="toast.visible" :class="['toast', toast.type]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '⚠️' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'
import { useCollections } from '@/composables/useCollections'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { getArtwork, loading, error } = useArtworks()
const { user } = useAuth()
const { 
  addArtworkToCollection, 
  createCollection, 
  fetchMyCollections 
} = useCollections()

// ─────────────────────────────────────────────────────────────
// ESTADO DE LA OBRA
// ─────────────────────────────────────────────────────────────

const artwork = ref(null)

const loadArtwork = async () => {
  const museumId = route.params.id
  artwork.value = await getArtwork(museumId)
}

const handleImageError = (e) => {
  e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <rect fill='#f5f5f5' width='800' height='600'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#999' font-family='system-ui' font-size='16'>
        Error al cargar imagen
      </text>
    </svg>
  `)}`
}

// ─────────────────────────────────────────────────────────────
// ESTADO DE AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────

const isLoggedIn = computed(() => !!user.value)

// ─────────────────────────────────────────────────────────────
// ESTADO DEL MODAL DE COLECCIONES
// ─────────────────────────────────────────────────────────────

const showCollectionModal = ref(false)
const showCreateCollectionForm = ref(false)
const collectionsLoading = ref(false)
const collectionsError = ref(null)
const userCollections = ref([])
const selectedCollection = ref(null)
const addToCollectionLoading = ref(false)

// ─────────────────────────────────────────────────────────────
// ESTADO DE CREACIÓN RÁPIDA
// ─────────────────────────────────────────────────────────────

const quickCreateLoading = ref(false)
const quickCollectionData = ref({
  title: '',
  is_public: true
})

// ─────────────────────────────────────────────────────────────
// ESTADO DEL TOAST (NOTIFICACIÓN)
// ─────────────────────────────────────────────────────────────

const toast = ref({
  visible: false,
  type: 'success', // 'success' | 'error'
  message: ''
})

const showToast = (type, message) => {
  toast.value = { visible: true, type, message }
  setTimeout(() => {
    toast.value.visible = false
  }, 3000)
}

// ─────────────────────────────────────────────────────────────
// MÉTODOS DEL MODAL DE COLECCIONES
// ─────────────────────────────────────────────────────────────

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



// Función para sincronizar obra en BD usando RPC 
const syncArtworkToDatabase = async () => {
  const { supabase } = await import('@/supabase/client')
  
  // Si ya tiene ID, ya está en BD
  if (artwork.value.id && artwork.value.id !== 'undefined') {
    console.log('✅ La obra ya está en BD:', artwork.value.id)
    return artwork.value.id
  }
  
  try {
    console.log('📝 Insertando/verificando obra en BD mediante RPC...')
    
    // Si no existe, usar la función RPC para insertar
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
    
    if (error) {
      console.error('❌ Error RPC:', error)
      throw error
    }
    
    // 3. Guardar el ID devuelto
    artwork.value.id = data
    console.log('✅ Obra guardada en BD con ID:', data)
    
    return data
    
  } catch (err) {
    console.error('Error syncing artwork:', err)
    throw new Error('No se pudo guardar la obra en la base de datos: ' + err.message)
  }
}


// Usar el composable directamente
const loadUserCollections = async () => {
  collectionsLoading.value = true
  collectionsError.value = null
  
  try {
    const { supabase } = await import('@/supabase/client')
    
    if (!user.value) {
      throw new Error('No hay usuario autenticado')
    }
    
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items (
          id
        )
      `)
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    userCollections.value = data || []
  } catch (err) {
    collectionsError.value = err.message
    console.error('Error loading collections:', err)
  } finally {
    collectionsLoading.value = false
  }
}

const selectCollection = (collection) => {
  selectedCollection.value = collection
}

const openCreateCollectionForm = () => {
  showCreateCollectionForm.value = true
  quickCollectionData.value = {
    title: '',
    is_public: true
  }
}

const closeCreateCollectionForm = () => {
  showCreateCollectionForm.value = false
}

// ─────────────────────────────────────────────────────────────
// MÉTODOS DE AÑADIR A COLECCIÓN
// ─────────────────────────────────────────────────────────────

const confirmAddToCollection = async () => {
  if (!selectedCollection.value || !artwork.value) return
  
  addToCollectionLoading.value = true
  
  try {
    // 1. Sincronizar obra en BD si no existe
    const artworkId = await syncArtworkToDatabase()
    
    // 2. Debug para verificar
    console.log('✅ Artwork ID para añadir:', artworkId)
    
    // 3. Añadir a la colección
    const result = await addArtworkToCollection(
      selectedCollection.value.id,
      artworkId  // ← Ahora usamos el ID correcto
    )
    
    if (result) {
      showToast('success', 'Obra añadida a la colección correctamente')
      closeCollectionModal()
    } else {
      showToast('error', 'No se pudo añadir la obra a la colección')
    }
  } catch (err) {
    showToast('error', err.message)
    console.error('Error adding to collection:', err)
  } finally {
    addToCollectionLoading.value = false
  }
}

const handleQuickCreateCollection = async () => {
  if (!quickCollectionData.value.title.trim()) return
  
  quickCreateLoading.value = true
  
  try {
    // Crear nueva colección
    const newCollection = await createCollection({
      title: quickCollectionData.value.title.trim(),
      description: `Colección creada desde ${artwork.value?.title}`,
      is_public: quickCollectionData.value.is_public
    })
    
    if (newCollection) {
      // Añadir la obra automáticamente a la nueva colección
      const result = await addArtworkToCollection(
        newCollection.id,
        artwork.value.id
      )
      
      if (result) {
        showToast('success', 'Colección creada y obra añadida')
        closeCreateCollectionForm()
        closeCollectionModal()
      }
    }
  } catch (err) {
    showToast('error', err.message)
    console.error('Error creating collection:', err)
  } finally {
    quickCreateLoading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// CICLO DE VIDA
// ─────────────────────────────────────────────────────────────

onMounted(() => {
  loadArtwork()
})
</script>

<style scoped>
/* ============================================
   CONTENEDOR PRINCIPAL
   ============================================ */
.artwork-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: var(--font-main);
  min-height: 100vh;
  background: var(--kura-bg);
}

.back-btn {
  background: none;
  border: none;
  color: var(--kura-color4);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--kura-color3);
}

/* ============================================
   SKELETON LOADER
   ============================================ */
.skeleton-loader {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-lg);
  aspect-ratio: 4/3;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title {
  height: 2.5rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
}

.skeleton-artist {
  height: 1.5rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
   LAYOUT PRINCIPAL (2 COLUMNAS)
   ============================================ */
.artwork-content {
  background: var(--kura-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.artwork-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

/* ============================================
   COLUMNA IZQUIERDA: IMAGEN
   ============================================ */
.image-column {
  background: var(--kura-bg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  max-width: 500px;
}

.artwork-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.public-domain-badge {
  margin-top: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-md);
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: var(--radius-xl);
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   COLUMNA DERECHA: INFORMACIÓN
   ============================================ */
.info-column {
  padding: 2rem;
  overflow-y: auto;
}

.artwork-header {
  margin-bottom: 1.5rem;
}

.artwork-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--kura-color1);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.3;
}

.artwork-artist {
  font-size: 1.25rem;
  color: var(--kura-color4);
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.artwork-date {
  color: var(--kura-text-muted);
  font-size: 1rem;
  margin: 0;
}

.divider {
  border: none;
  border-top: 1px solid var(--kura-border);
  margin: 1.5rem 0;
}

/* ============================================
   SECCIONES DE INFORMACIÓN
   ============================================ */
.info-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--kura-color1);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--kura-text-muted);
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: var(--kura-text);
  font-weight: 400;
}

/* ============================================
   DESCRIPCIÓN Y TAGS
   ============================================ */
.description-section {
  margin: 1.5rem 0;
}

.description-text {
  color: var(--kura-text-muted);
  line-height: 1.7;
  font-size: 0.95rem;
}

.tags-section {
  margin: 1.5rem 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  background: #e3f2fd;
  color: var(--kura-color4);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-xl);
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   🆕 SECCIÓN DE ACCIONES
   ============================================ */
.actions-section {
  margin: 2rem 0;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--kura-border);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
  font-family: var(--font-main);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.primary {
  background: var(--kura-color4);
  color: white;
  border: none;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--kura-color3);
  transform: translateY(-1px);
}

.action-btn.primary:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
  transform: none;
}

.action-btn.secondary {
  background: var(--kura-bg);
  color: var(--kura-color4);
  border: 1px solid var(--kura-color4);
}

.action-btn.secondary:hover {
  background: var(--kura-color4);
  color: white;
}

.login-hint {
  width: 100%;
  font-size: 0.85rem;
  color: var(--kura-text-muted);
  margin: 0;
}

/* ============================================
   🆕 MODAL OVERLAY
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
   🆕 ESTADOS DEL MODAL
   ============================================ */
.modal-loading,
.modal-error,
.modal-empty {
  padding: var(--spacing-xl);
  text-align: center;
}

.modal-loading p,
.modal-error p,
.modal-empty p {
  color: var(--kura-text-muted);
  margin-bottom: var(--spacing-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(12, 126, 126, 0.3);
  border-top-color: var(--kura-color4);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-small {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--kura-color4);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
}

.empty-hint {
  font-size: 0.85rem;
  font-style: italic;
}

.modal-hint {
  padding: var(--spacing-lg);
  color: var(--kura-text-muted);
  font-size: 0.9rem;
}

/* ============================================
   🆕 LISTA DE COLECCIONES
   ============================================ */
.collections-list {
  padding: var(--spacing-sm) var(--spacing-md);
  max-height: 300px;
  overflow-y: auto;
}

.collection-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.collection-option:hover {
  background: var(--kura-bg);
  border-color: var(--kura-color4);
}

.collection-option.selected {
  background: #e8f5e9;
  border-color: var(--kura-color4);
}

.collection-option-info {
  flex: 1;
}

.collection-option-title {
  font-size: 1rem;
  color: var(--kura-color1);
  margin: 0 0 var(--spacing-xs) 0;
}

.collection-option-meta {
  font-size: 0.8rem;
  color: var(--kura-text-muted);
  margin: 0;
}

.collection-option-icon {
  font-size: 1.5rem;
  color: var(--kura-color4);
}

/* ============================================
   🆕 ACCIONES DEL MODAL
   ============================================ */
.modal-actions {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--kura-border);
}

.btn-create-new {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--kura-bg);
  color: var(--kura-color4);
  border: 1px dashed var(--kura-color4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: var(--spacing-md);
  transition: background var(--transition-fast);
}

.btn-create-new:hover {
  background: #e8f5e9;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
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

.btn-confirm {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--kura-color4);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.btn-confirm:hover:not(:disabled) {
  background: var(--kura-color3);
}

.btn-confirm:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

/* ============================================
   🆕 FORMULARIO RÁPIDO
   ============================================ */
.quick-form {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--kura-color1);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: var(--font-main);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--kura-color4);
  box-shadow: 0 0 0 3px rgba(12, 126, 126, 0.1);
}

.toggle-group {
  display: flex;
  gap: var(--spacing-md);
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.toggle-option:hover {
  background: var(--kura-bg);
  border-color: var(--kura-color4);
}

.toggle-option input[type="radio"] {
  accent-color: var(--kura-color4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--kura-border);
  margin-top: var(--spacing-md);
}

/* ============================================
   🆕 TOAST NOTIFICATION
   ============================================ */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.toast.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-message {
  font-size: 0.95rem;
  font-weight: 500;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   RESPONSIVE: MOBILE (< 768px)
   ============================================ */
@media (max-width: 768px) {
  .artwork-detail {
    padding: 1rem;
  }

  .artwork-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .image-column {
    padding: 1rem;
  }

  .image-container {
    max-width: 100%;
  }

  .info-column {
    padding: 1.25rem;
  }

  .artwork-title {
    font-size: 1.4rem;
  }

  .artwork-artist {
    font-size: 1.1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .skeleton-loader {
    grid-template-columns: 1fr;
  }

  .actions-section {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .modal-buttons {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }
}

/* ============================================
   RESPONSIVE: TABLET (768px - 1024px)
   ============================================ */
@media (min-width: 769px) and (max-width: 1024px) {
  .artwork-grid {
    grid-template-columns: 1fr 1fr;
  }

  .image-container {
    max-width: 400px;
  }
}
</style>