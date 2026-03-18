<template>
  <div class="explore-view">
    <TopNav />
    
    <main class="explore-container container">
      
      <!-- Cabecera y Búsqueda -->
      <header class="explore-header">
        <h1 class="page-title">Explorar Colección</h1>
        <p class="page-subtitle">Descubre miles de obras maestras de museos internacionales</p>
        
        <form @submit.prevent="handleSearch" class="search-bar">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Busca por artista, título, movimiento..."
              class="search-input"
              :disabled="loading"
              aria-label="Buscar obras de arte"
            />
          </div>
          <button 
            type="submit" 
            :disabled="loading || !searchQuery.trim()"
            class="search-button"
          >
            <span v-if="loading" class="spinner-small"></span>
            <span v-else>Buscar</span>
          </button>
        </form>
      </header>

      <!-- ESTADO VACÍO (Inicial) -->
      <transition name="fade" mode="out-in">
        <div v-if="!hasSearched && artworks.length === 0" key="empty" class="empty-state card-glass">
          <div class="empty-state-visual">
            <!-- Icono SVG: Paleta/Arte abstracto -->
            <svg class="hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </div>
          <h2>El museo está abierto</h2>
          <p>
            Explora nuestra colección digital curada. Escribe un término para comenzar tu viaje cultural o selecciona una sugerencia.
          </p>
          
          <div class="suggestions-container">
            <span class="suggestions-label">Sugerencias populares:</span>
            <div class="suggestions-list">
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
        </div>

        <!-- ESTADO CARGANDO -->
        <div v-else-if="loading && artworks.length === 0" key="loading" class="state-container">
          <div class="loader-wrapper">
            <div class="loader-ring"></div>
          </div>
          <p class="loading-text">Curando resultados...</p>
        </div>

        <!-- ESTADO ERROR -->
        <div v-else-if="error" key="error" class="state-container card-glass error-state">
          <svg class="state-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Ha ocurrido un error</h3>
          <p>{{ error }}</p>
          <button @click="handleSearch" :disabled="loading" class="btn btn-retry">
            Reintentar búsqueda
          </button>
        </div>

        <!-- ESTADO SIN RESULTADOS -->
        <div v-else-if="artworks.length === 0 && hasSearched" key="no-results" class="state-container card-glass">
          <svg class="state-icon empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>Sin resultados encontrados</h3>
          <p>No hemos encontrado obras para "<strong>{{ searchQuery }}</strong>"</p>
          <p class="hint-text">Prueba con términos más generales o verifica la ortografía.</p>
        </div>

        <!-- GRID DE RESULTADOS -->
        <div v-else key="results" class="artworks-grid">
          <div
            v-for="artwork in artworks"
            :key="artwork.museum_id"
            class="artwork-card"
            @click="() => viewArtwork(artwork.museum_id)"
            tabindex="0"
            @keydown.enter="() => viewArtwork(artwork.museum_id)"
            role="button"
            :aria-label="'Ver detalles de ' + artwork.title"
          >
            <div class="image-wrapper">
              <img
                :src="artwork.thumbnail_url"
                :alt="artwork.title"
                class="artwork-image"
                @error="handleImageError"
                loading="lazy"
              />
              <!-- Overlay gradient para mejorar legibilidad del texto si se superpusiera -->
              <div class="image-overlay"></div>
            </div>
            
            <div class="artwork-info">
              <h3 class="artwork-title">{{ artwork.title }}</h3>
              <p class="artwork-artist">{{ artwork.artist_name || 'Autor desconocido' }}</p>
              <p v-if="artwork.period" class="artwork-period">{{ artwork.period }}</p>
            </div>
          </div>
        </div>
      </transition>

    </main>
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

const searchSuggestions = [
  'Van Gogh',
  'Rembrandt',
  'Monet',
  'Egyptian Art',
  'Greek Sculpture',
  'Impressionism'
]

onMounted(() => {
  // Limpieza de logs para producción
})

const handleSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  hasSearched.value = true
  await search({ query, limit: 24 }) // Aumentamos ligeramente el límite para el grid
}

const searchWithSuggestion = async (suggestion) => {
  searchQuery.value = suggestion
  await handleSearch()
}

const handleImageError = (e) => {
  // Placeholder oscuro elegante en lugar de SVG gris claro
  e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect fill='#00272d' width='400' height='300'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#134647' font-family='system-ui' font-size='14'>Imagen no disponible</text>
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
/* ============================================
   LAYOUT & HEADER
   ============================================ */
.explore-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  position: relative;
}

/* Fondo ambiental sutil */
.explore-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(circle at 50% -100px, var(--kura-deep-teal), transparent 70%);
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

.explore-container {
  position: relative;
  z-index: 1;
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xxl);
  display: flex;
  flex-direction: column;
}

.explore-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xl);
  font-weight: 300;
}

/* ============================================
   SEARCH BAR PREMIUM
   ============================================ */
.search-bar {
  display: flex;
  gap: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.03);
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-bar:focus-within {
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  position: relative;
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  padding: var(--spacing-sm) 0;
  outline: none;
  font-family: var(--font-main);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-button {
  background: var(--kura-bright-teal);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-full);
  padding: 0 var(--spacing-lg);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-height: 44px;
}

.search-button:hover:not(:disabled) {
  background: #0f9e9e;
  transform: scale(1.02);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

/* Spinner pequeño dentro del botón */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   ESTADOS (Empty, Loading, Error)
   ============================================ */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.card-glass {
  background: rgba(19, 70, 71, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.empty-state-visual {
  margin-bottom: var(--spacing-lg);
  opacity: 0.8;
}

.hero-icon {
  width: 80px;
  height: 80px;
  color: var(--kura-gold);
  stroke-width: 0.8; /* Líneas muy finas y elegantes */
}

.empty-state h2, 
.state-container h3 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
  font-weight: 600;
}

.empty-state p, 
.state-container p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1rem;
  margin: 0 0 var(--spacing-lg);
  max-width: 500px;
}

.hint-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

/* Sugerencias */
.suggestions-container {
  margin-top: var(--spacing-lg);
  width: 100%;
}

.suggestions-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-xs);
}

.suggestion-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.suggestion-chip:hover:not(:disabled) {
  background: rgba(191, 172, 139, 0.15); /* Dorado tenue */
  border-color: var(--kura-gold);
  color: var(--kura-gold);
  transform: translateY(-2px);
}

.suggestion-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loader Grande */
.loader-wrapper {
  margin-bottom: var(--spacing-lg);
}

.loader-ring {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--kura-bright-teal);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--text-secondary);
  font-style: italic;
}

/* Error State */
.error-state {
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.05);
}

.state-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);
}

.state-icon.error {
  color: #ff6b6b;
}

.state-icon.empty {
  color: var(--text-muted);
}

.btn-retry {
  margin-top: var(--spacing-md);
  background: transparent;
  border: 1px solid var(--text-primary);
  color: var(--text-primary);
  padding: 0.6rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-retry:hover {
  background: var(--text-primary);
  color: var(--bg-primary);
}

/* ============================================
   GRID DE OBRAS (ART CARDS)
   ============================================ */
.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  width: 100%;
}

.artwork-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  group: 'card';
}

.artwork-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
  border-color: rgba(191, 172, 139, 0.2); /* Borde dorado sutil al hover */
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  overflow: hidden;
}

.artwork-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Asegura que cubra sin deformar */
  transition: transform 0.5s ease;
  display: block;
}

.artwork-card:hover .artwork-image {
  transform: scale(1.05); /* Zoom sutil al hover */
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

/* Opcional: mostrar overlay siempre o solo al hover si hubiera texto sobre la imagen */
/* En este diseño, el texto está debajo, así que el overlay es decorativo o para futuro texto superpuesto */

.artwork-info {
  padding: var(--spacing-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.artwork-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
  line-height: 1.3;
  
  /* Truncar texto largo a 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.artwork-artist {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
  font-weight: 400;
}

.artwork-period {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ============================================
   ANIMACIONES DE TRANSICIÓN
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>