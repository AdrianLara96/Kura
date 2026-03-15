<template>
  <div class="explore-view">
    <TopNav />
    
    <div class="explore-container">
      <h1>Explorar Obras</h1>
      
      <!-- Barra de búsqueda -->
      <form @submit.prevent="handleSearch" class="search-bar">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por título, artista o etiqueta..."
          class="search-input"
          :disabled="loading"
        />
        <button 
          type="submit" 
          :disabled="loading || !searchQuery.trim()"
          class="search-button"
        >
          {{ loading ? 'Buscando...' : 'Buscar' }}
        </button>
      </form>

      <!-- 
        Estados: 
        Empty, loading y error
        Sin resultados/Con resultados
      -->
      <!-- EMPTY STATE: Se muestra cuando no hay búsqueda ni resultados -->
      <div v-if="!hasSearched && artworks.length === 0" class="empty-state">
        <div class="empty-state-icon">🎨</div>
        <h2>Descubre el arte del mundo</h2>
        <p>
          Explora miles de obras maestras de The Metropolitan Museum of Art.
          Escribe una búsqueda para comenzar tu viaje cultural.
        </p>
        <div class="empty-state-suggestions">
          <p class="suggestions-title">¿Prueba con?</p>
          <button 
            v-for="suggestion in searchSuggestions" 
            :key="suggestion"
            @click="searchWithSuggestion(suggestion)"
            class="suggestion-chip"
            :disabled="loading"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- LOADING STATE: Se muestra mientras carga -->
      <div v-else-if="loading && artworks.length === 0" class="state-msg">
        <div class="loading-spinner"></div>
        <p>Cargando obras de arte...</p>
      </div>

      <!-- ERROR STATE: Se muestra cuando hay error -->
      <div v-else-if="error" class="state-msg error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="handleSearch" :disabled="loading" class="retry-button">
          Reintentar
        </button>
      </div>

      <!-- NO RESULTS STATE: Búsqueda válida pero 0 resultados -->
      <div v-else-if="artworks.length === 0 && hasSearched" class="state-msg">
        <div class="no-results-icon">🔍</div>
        <p>No se encontraron obras para "{{ searchQuery }}"</p>
        <p class="no-results-hint">Prueba con otros términos o revisa la ortografía</p>
      </div>

      <!-- RESULTS GRID: Se muestra cuando hay resultados -->
      <div v-else class="artworks-grid">
        <div
          v-for="artwork in artworks"
          :key="artwork.museum_id"
          class="artwork-card"
          @click="() => viewArtwork(artwork.museum_id)"
          tabindex="0"
          @keydown.enter="() => viewArtwork(artwork.museum_id)"
          role="button"
        >
          <div class="image-wrapper">
            <img
              :src="artwork.thumbnail_url"
              :alt="artwork.title"
              class="artwork-image"
              @error="handleImageError"
              loading="lazy"
            />
          </div>
          
          <div class="artwork-info">
            <h3>{{ artwork.title }}</h3>
            <p class="artist">{{ artwork.artist_name }}</p>
            <p v-if="artwork.period" class="period">Periodo: {{ artwork.period }}</p>
          </div>
        </div>
      </div>

      <!-- DEBUG Info: Borrar luego -->
      <div v-if="false" class="debug-info">
        <p>hasSearched: {{ hasSearched }}</p>
        <p>artworks.length: {{ artworks.length }}</p>
        <p>loading: {{ loading }}</p>
        <p>error: {{ error }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'
import TopNav from '@/components/common/TopNav.vue'

const { artworks, loading, error, search } = useArtworks()
const router = useRouter()
const searchQuery = ref('')
const hasSearched = ref(false)

// Sugerencias de búsqueda predefinidas
const searchSuggestions = [
  'Van Gogh',
  'Rembrandt',
  'Monet',
  'Egyptian Art',
  'Greek Sculpture'
]

onMounted(() => {
  console.log('ExploreView montado - esperando búsqueda del usuario')
  console.log('🎨 [DEBUG ExploreView] Estado inicial:', {
    hasSearched: hasSearched.value,
    artworksLength: artworks.value.length,
    isEmptyState: !hasSearched.value && artworks.value.length === 0
  })
})

const handleSearch = async () => {
  const query = searchQuery.value.trim()
  
  if (!query) {
    console.warn('Búsqueda vacía, no se realiza petición')
    return // No buscar si está vacío
  }

  console.log('DEBUG > Iniciando búsqueda:', { query, hasSearched: hasSearched.value })

  hasSearched.value = true

  const result = await search({ query, limit: 20 })

  console.log('DEBUG > Búsqueda completada: ', {
    resultsCount: artworks.value.length,
    success: result.success
  })
}

const searchWithSuggestion = async (suggestion) => {
  searchQuery.value = suggestion
  await handleSearch()
}

const handleImageError = (e) => {
  e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect fill='#f5f5f5' width='200' height='200'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#999' font-family='system-ui' font-size='11'>Sin imagen</text>
    </svg>
  `)}`
}

const viewArtwork = (museumId) => {
  router.push({ name: 'artwork-detail', params: { id: museumId } })
    .catch(err => {
      console.error('Error de navegación:', err)
      window.location.href = `/artwork/${museumId}`
    })
}
</script>

<style scoped>
.explore-view {
  min-height: 100vh;
  background: #fafafa;
}

.explore-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: system-ui;
}

.explore-container h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  flex: 1;
  padding: 1rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.search-button {
  padding: 1rem 2rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.search-button:hover:not(:disabled) {
  background: #1565c0;
  transform: translateY(-1px);
}

.search-button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
  transform: none;
}

/* 🎨 EMPTY STATE STYLES */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 2rem auto;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.empty-state-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  display: block;
}

.empty-state p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 2rem;
  display: block;
}

.empty-state-suggestions {
  margin-top: 2rem;
  display: block;
}

.suggestions-title {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.suggestion-chip {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover:not(:disabled) {
  background: #1976d2;
  color: white;
}

.suggestion-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ⏳ LOADING STATE STYLES */
.state-msg {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.state-msg.error {
  color: #d32f2f;
  background: #ffebee;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.retry-button:hover:not(:disabled) {
  background: #1565c0;
}

.retry-button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

.no-results-hint {
  color: #999;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* ✅ RESULTS GRID STYLES */
.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.artwork-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  user-select: none;
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  background: #f5f5f5;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  display: block;
}

.artwork-info {
  padding: 1rem;
  pointer-events: none;
}

.artwork-info h3 {
  font-size: 1rem;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.period {
  color: #999;
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
}
</style>