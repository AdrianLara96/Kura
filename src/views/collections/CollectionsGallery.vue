<template>
  <div class="collections-gallery-view">

    <TopNav/>
    
    <!-- Header de Página -->
    <header class="page-header container">
      <div class="header-content">
        <h1 class="page-title">Galería de Colecciones</h1>
        <p class="page-subtitle">Explora colecciones públicas curadas por la comunidad de Kura</p>
      </div>
    </header>

    <!-- Barra de Controles (Búsqueda + Filtros) -->
    <div class="controls-bar container">
      <!-- Búsqueda -->
      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por título o creador..."
          class="search-input"
          @input="debouncedSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn" aria-label="Limpiar búsqueda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Ordenamiento -->
      <div class="sort-wrapper">
        <label for="sort-select" class="sort-label">Ordenar por:</label>
        <div class="select-custom">
          <select v-model="sortBy" @change="() => loadCollections(false)" id="sort-select" class="sort-select">
            <option value="recent">Más recientes</option>
            <option value="views">Más vistas</option>
            <option value="artworks">Más obras</option>
            <option value="oldest">Más antiguas</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <!-- SKELETON LOADER (Dark Mode) -->
    <div v-if="loading && collections.length === 0" class="skeleton-grid container">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <div class="skeleton-cover"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-meta"></div>
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
      <button @click="loadCollections" :disabled="loading" class="btn btn-outline">Reintentar</button>
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
      <h2 v-if="searchQuery">Sin resultados encontrados</h2>
      <h2 v-else>La galería está vacía</h2>
      
      <p v-if="searchQuery">
        No hemos encontrado colecciones para "{{ searchQuery }}". Prueba con otros términos.
      </p>
      <p v-else>
        Aún no hay colecciones públicas. ¡Sé el primero en compartir tu gusto por el arte!
      </p>

      <div class="empty-actions">
        <button v-if="searchQuery" @click="clearSearch" class="btn btn-primary">
          Limpiar filtros
        </button>
        <router-link v-if="isLoggedIn" to="/my-collections" class="btn btn-outline">
          Crear colección
        </router-link>
      </div>
    </div>

    <!-- GRID DE COLECCIONES -->
    <div v-else class="collections-grid container">
      <CollectionCard
        v-for="collection in collections"
        :key="collection.id"
        :id="collection.id"
        :title="collection.title"
        :description="collection.description"
        :cover-image="collection.cover_image_url || getFirstArtworkImage(collection)"
        :creator-name="collection.user_profiles?.display_name || 'Usuario'"
        :creator-avatar="collection.user_profiles?.avatar_url"
        :artwork-count="collection.collection_items?.length || 0"
        :view-count="collection.view_count || 0"
      />
    </div>

    <!-- CARGAR MÁS -->
    <div v-if="collections.length > 0 && !loading && hasMore" class="load-more-section">
      <button @click="loadMore" :disabled="loadingMore" class="btn btn-outline btn-lg">
        <span v-if="loadingMore" class="spinner-mini"></span>
        <span v-else>Cargar más colecciones</span>
      </button>
    </div>

    <!-- INFO FOOTER -->
    <div v-if="collections.length > 0" class="gallery-footer">
      <p>Mostrando {{ collections.length }} de {{ totalCollections }} colecciones públicas</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/composables/useAuth'
import CollectionCard from '@/components/collections/CollectionCard.vue'
import TopNav from '@/components/common/TopNav.vue'

const router = useRouter()
const { isLoggedIn } = useAuth()

const collections = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(null)
const searchQuery = ref('')
const sortBy = ref('recent')
const currentPage = ref(1)
const itemsPerPage = 12
const totalCollections = ref(0)

const hasMore = computed(() => collections.value.length < totalCollections.value)

const loadCollections = async (append = false) => {
  if (append) { loadingMore.value = true }
  else { 
    loading.value = true
    collections.value = []
  }
  
  error.value = null
  
  try {

    // debug:
    console.log('sortBy:', sortBy.value, 'append:', append)

    let query = supabase
        .from('collections')
        .select(`
            *,
            user_profiles:user_id (id, username, display_name, avatar_url),
            collection_items (
                id,
                museum_artworks (
                    id,
                    thumbnail_url,
                    image_url
                )
            )
        `, { count: 'exact' })
        .eq('is_public', true)
    
    // Búsqueda solo en título
    if (searchQuery.value.trim()) {
    query = query.ilike('title', `%${searchQuery.value.trim()}%`)
    }
    
    switch (sortBy.value) {
      case 'recent': query = query.order('created_at', { ascending: false }); break
      case 'oldest': query = query.order('created_at', { ascending: true }); break
      case 'views': query = query.order('view_count', { ascending: false }); break
      case 'artworks': break 
    }
    
    const from = append ? collections.value.length : 0
    const to = from + itemsPerPage - 1
    query = query.range(from, to)
    
    const { data, count, error: fetchError } = await query
    if (fetchError) throw fetchError
    
    let processedData = data || []
    if (sortBy.value === 'artworks') {
      processedData = processedData.sort((a, b) => {
        const countA = a.collection_items?.length || 0
        const countB = b.collection_items?.length || 0
        return countB - countA
      })
    }
    
    if (append) collections.value = [...collections.value, ...processedData]
    else collections.value = processedData
    
    totalCollections.value = count || 0
    currentPage.value = Math.floor(from / itemsPerPage) + 1

    // debug:
    console.log('Colecciones cargadas:', collections.value.length)
    
  } catch (err) {
    error.value = err.message
    console.error('Error loading collections:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => { await loadCollections(true) }

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    collections.value = []
    loadCollections()
  }, 500)
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  collections.value = []
  loadCollections()
}

const getFirstArtworkImage = (collection) => {
  if (!collection.collection_items?.length) return null
  
  // Obtener la primera obra de la colección
  const firstItem = collection.collection_items[0]
  
  // Retornar thumbnail o image_url de la obra
  return firstItem.museum_artworks?.thumbnail_url || 
         firstItem.museum_artworks?.image_url || 
         null
}

onMounted(() => { loadCollections() })
</script>

<style scoped>
/* ============================================
   LAYOUT GENERAL
   ============================================ */
.collections-gallery-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  text-align: center;
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
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
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* ============================================
   CONTROLS BAR
   ============================================ */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  background: rgba(19, 70, 71, 0.2); /* Glass sutil */
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.search-wrapper {
  flex: 1;
  min-width: 280px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  pointer-events: none;
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
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.sort-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sort-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.select-custom {
  position: relative;
}

.sort-select {
  appearance: none;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-family: var(--font-main);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sort-select:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-cover {
  height: 175px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content { padding: var(--spacing-md); }
.skeleton-title {
  height: 1.5rem; width: 90%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
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
.skeleton-meta {
  height: 1.5rem; width: 50%;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-xs);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   STATE CARDS (Empty / Error)
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

.state-icon {
  width: 48px;
  height: 48px;
  color: #ff6b6b;
  margin-bottom: var(--spacing-md);
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* ============================================
   GRID & LOAD MORE
   ============================================ */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.load-more-section {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.gallery-footer {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
  font-size: 0.9rem;
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--spacing-lg);
}

/* Botones Globales Scoped */
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

.btn-outline {
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--text-primary);
  background: var(--bg-tertiary);
}

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0f9e9e;
  transform: translateY(-2px);
}

.btn-lg { padding: 1rem 2rem; font-size: 1rem; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.spinner-mini {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 768px) {
  .controls-bar { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
  .search-wrapper { min-width: 100%; }
  .sort-wrapper { justify-content: space-between; }
  .collections-grid { grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
  .empty-actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>