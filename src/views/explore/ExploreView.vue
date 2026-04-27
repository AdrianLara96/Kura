<!-- src/views/explore/ExploreView.vue -->

<template>
  <div class="explore-view">
    <TopNav />
    
    <main class="explore-container container">
      
      <!-- Cabecera y Barra de Búsqueda + Filtros -->
      <header class="explore-header">
        <h1 class="page-title">Explorar Colección</h1>
        <p class="page-subtitle">Descubre miles de obras maestras de museos internacionales</p>
        
        <!-- Barra de búsqueda con filtros horizontales -->
        <form @submit.prevent="handleSearch" class="search-bar">
          
          <!-- Input de búsqueda -->
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
          
          <!-- Filtro de departamentos (dropdown) -->
          <div class="filter-wrapper">
            <select
              v-model="selectedDepartment"
              class="filter-select"
              :disabled="loading"
              @change="handleDepartmentChange"
              aria-label="Filtrar por departamento"
            >
              <option :value="null">Todos los departamentos</option>
              <option 
                v-for="dept in availableDepartments" 
                :key="dept.id" 
                :value="dept.id"
              >
                {{ dept.name }}
              </option>
            </select>
          </div>
          
          <!-- Botón de búsqueda -->
          <button 
            type="submit" 
            :disabled="loading"
            class="search-button"
          >
            <span v-if="loading" class="spinner-small"></span>
            <span v-else>Buscar</span>
          </button>
        </form>
        
        <!-- Badge de filtro activo + Reset -->
        <div v-if="activeFilterLabel" class="active-filters">
          <span class="filter-badge">
            🏷️ {{ activeFilterLabel }}
            <button 
              @click="handleResetFilters" 
              class="filter-badge-remove"
              aria-label="Limpiar filtro"
            >×</button>
          </span>
        </div>
      </header>

      <!-- ESTADO VACÍO (Inicial) -->
      <transition name="fade" mode="out-in">
        <div v-if="!hasSearched && artworks.length === 0" key="empty" class="empty-state card-glass">
          <div class="empty-state-visual">
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

        <!-- ESTADO ERROR CON SUGERENCIAS -->
        <div v-else-if="error" key="error" class="state-container card-glass error-state">
          <svg class="state-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Conexión no disponible</h3>
          <p>{{ error }}</p>
          
          <!-- Sugerencias de búsqueda alternativas -->
          <div class="error-suggestions">
            <p class="suggestions-hint">Mientras tanto, puedes probar con:</p>
            <div class="suggestions-list">
              <button 
                v-for="suggestion in fallbackSuggestions" 
                :key="suggestion"
                @click="searchWithSuggestion(suggestion)"
                class="suggestion-chip error-chip"
                :disabled="loading"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
          
          <div class="error-actions">
            <button @click="handleResetFilters" :disabled="loading" class="btn btn-secondary">
              Limpiar filtros
            </button>
            <button @click="handleSearch" :disabled="loading" class="btn btn-retry">
              Reintentar
            </button>
          </div>
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

        <!-- GRID DE RESULTADOS + PAGINACIÓN -->
        <div v-else key="results" class="results-container">
          
          <!-- Info de resultados -->
          <div class="results-info">
            <p class="results-count">
              Mostrando <strong>{{ startIndex + 1 }}-{{ endIndex }}</strong> de <strong>{{ pagination.total }}</strong> resultados
              <span v-if="activeFilterLabel" class="results-filter">• Filtrado por: {{ activeFilterLabel }}</span>
            </p>
          </div>
          
          <!-- Grid de obras -->
          <div class="artworks-grid">
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
                <div class="image-overlay"></div>
              </div>
              
              <div class="artwork-info">
                <h3 class="artwork-title">{{ artwork.title }}</h3>
                <p class="artwork-artist">{{ artwork.artist_name || 'Autor desconocido' }}</p>
                <p v-if="artwork.period" class="artwork-period">{{ artwork.period }}</p>
              </div>
            </div>
          </div>
          
          <!-- Controles de paginación -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              @click="handlePreviousPage"
              :disabled="pagination.page === 1 || loading"
              class="pagination-btn"
              aria-label="Página anterior"
            >
              ← Anterior
            </button>
            
            <div class="pagination-numbers">
              <button
                v-for="pageNum in visiblePages"
                :key="pageNum"
                @click="handleGoToPage(pageNum)"
                :class="['pagination-number', { active: pageNum === pagination.page }]"
                :aria-label="'Ir a página ' + pageNum"
                :aria-current="pageNum === pagination.page ? 'page' : undefined"
              >
                {{ pageNum }}
              </button>
            </div>
            
            <button
              @click="handleNextPage"
              :disabled="pagination.page === pagination.totalPages || loading"
              class="pagination-btn"
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </div>
          
        </div>
      </transition>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'
import { searchArtworks, SEARCH_SUGGESTIONS } from '../../services/museumApi'
import TopNav from '@/components/common/TopNav.vue'

const { 
  artworks, 
  loading, 
  error, 
  pagination, 
  filters,
  search, 
  getArtwork, 
  setDepartmentFilter, 
  resetFilters,
  goToPage,
  getAvailableDepartments 
} = useArtworks()

const router = useRouter()
const searchQuery = ref('')
const hasSearched = ref(false)
const selectedDepartment = ref(null)

// Lista de departamentos disponibles para el filtro
const availableDepartments = getAvailableDepartments()

const searchSuggestions = [
  'Van Gogh',
  'Rembrandt',
  'Monet',
  'Egyptian Art',
  'Greek Sculpture',
  'Impressionism'
]

const fallbackSuggestions = SEARCH_SUGGESTIONS

// Computed: Etiqueta del filtro activo para mostrar en UI
const activeFilterLabel = computed(() => {
  if (!filters.value.departmentIds?.length) return null
  
  const deptId = filters.value.departmentIds[0]
  const dept = availableDepartments.find(d => d.id === deptId)
  return dept?.name || `Departamento #${deptId}`
})

// Computed: Índices para mostrar "Mostrando X-Y de Z"
const startIndex = computed(() => {
  return (pagination.value.page - 1) * pagination.value.pageSize
})

const endIndex = computed(() => {
  const end = startIndex.value + pagination.value.pageSize
  return Math.min(end, pagination.value.total)
})

// Computed: Números de página visibles (para no mostrar 100 botones)
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const delta = 2 // Cuántas páginas mostrar a cada lado de la actual
  
  const pages = []
  
  // Siempre mostrar primera página
  pages.push(1)
  
  // Páginas alrededor de la actual
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    if (!pages.includes(i)) pages.push(i)
  }
  
  // Siempre mostrar última página si es diferente de la primera
  if (total > 1 && !pages.includes(total)) {
    pages.push(total)
  }
  
  return pages.sort((a, b) => a - b)
})

onMounted(() => {
  // Limpieza de logs para producción
})

// Handlers de búsqueda
const handleSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query && !selectedDepartment.value) return

  hasSearched.value = true
  
  try {
    await search({ 
      query, 
      departmentIds: selectedDepartment.value ? [selectedDepartment.value] : [],
      page: 1
    })
  } catch (err) {
    console.warn('Búsqueda fallida:', err)
  }
}

const searchWithSuggestion = async (suggestion) => {
  searchQuery.value = suggestion
  selectedDepartment.value = null // Limpiar departamento al usar sugerencia
  await handleSearch()
}

// Handlers de filtros
const handleDepartmentChange = async () => {
  hasSearched.value = true
  
  try {
    const deptIds = selectedDepartment.value ? [selectedDepartment.value] : []
    await setDepartmentFilter(deptIds)
  } catch (err) {
    console.warn('Filtro de departamento fallido:', err)
  }
}

const handleResetFilters = async () => {
  selectedDepartment.value = null
  await resetFilters()
}

// Handlers de paginación
const handlePreviousPage = async () => {
  if (pagination.value.page > 1) {
    await goToPage(pagination.value.page - 1)
  }
}

const handleNextPage = async () => {
  if (pagination.value.page < pagination.value.totalPages) {
    await goToPage(pagination.value.page + 1)
  }
}

const handleGoToPage = async (pageNum) => {
  if (pageNum !== pagination.value.page) {
    await goToPage(pageNum)
  }
}

// Utilidades
const handleImageError = (e) => {
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
  max-width: 900px;
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
   SEARCH BAR CON FILTROS HORIZONTALES
   ============================================ */
.search-bar {
  display: flex;
  gap: var(--spacing-xs);
  background: rgba(255, 255, 255, 0.03);
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  flex-wrap: wrap;
  justify-content: center;
}

.search-bar:focus-within {
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.search-input-wrapper {
  flex: 1;
  min-width: 200px;
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

/* Filtro de departamentos */
.filter-wrapper {
  position: relative;
  min-width: 180px;
}

/* ============================================
   ESTILOS PARA SELECT NATIVO 
   ============================================ */
.filter-select {
  width: 100%;
  background: var(--bg-secondary, #1a1a1a); /* Forzar fondo oscuro */
  border: 1px solid var(--border-subtle, #444);
  border-radius: var(--radius-full);
  color: var(--text-primary, #ffffff); /* Forzar texto claro */
  font-size: 0.95rem;
  padding: var(--spacing-sm) var(--spacing-lg);
  padding-right: 30px;
  cursor: pointer;
  appearance: none;
  font-family: var(--font-main, system-ui);
  transition: border-color var(--transition-fast);
}

/* Hover y focus */
.filter-select:hover:not(:disabled) {
  border-color: var(--kura-bright-teal, #0cc);
}

.filter-select:focus {
  outline: none;
  border-color: var(--kura-bright-teal, #0cc);
  box-shadow: 0 0 0 2px rgba(12, 204, 204, 0.2);
}

.filter-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary, #2a2a2a);
}

/* 
 * forzar colores básicos con appearance y forced-colors
 */
.filter-select option {
  background-color: var(--bg-secondary, #1a1a1a) !important;
  color: var(--text-primary, #ffffff) !important;
  padding: 8px 12px;
}

/* Fallback para navegadores que ignoran !important en options */
@supports not (color: var(--dummy)) {
  .filter-select {
    background-color: #1a1a1a;
    color: #ffffff;
  }
}

/* Para modo forzado del sistema */
@media (forced-colors: active) {
  .filter-select {
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid ButtonText;
  }
}

/* Flecha personalizada para el select */
.filter-wrapper::after {
  content: '▼';
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: var(--text-muted);
  pointer-events: none;
}

/* Botón de búsqueda */
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
  white-space: nowrap;
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
   BADGE DE FILTRO ACTIVO
   ============================================ */
.active-filters {
  margin-top: var(--spacing-md);
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: rgba(191, 172, 139, 0.15);
  border: 1px solid var(--kura-gold);
  color: var(--kura-gold);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-badge-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin-left: var(--spacing-xs);
  opacity: 0.8;
  transition: opacity var(--transition-fast);
}

.filter-badge-remove:hover {
  opacity: 1;
}

/* ============================================
   INFO DE RESULTADOS
   ============================================ */
.results-info {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.results-count {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.results-count strong {
  color: var(--text-primary);
  font-weight: 600;
}

.results-filter {
  color: var(--kura-gold);
  margin-left: var(--spacing-xs);
}

/* ============================================
   GRID DE OBRAS
   ============================================ */
.results-container {
  width: 100%;
}

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
}

.artwork-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
  border-color: rgba(191, 172, 139, 0.2);
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
  object-fit: cover;
  transition: transform 0.5s ease;
  display: block;
}

.artwork-card:hover .artwork-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

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
   PAGINACIÓN
   ============================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xxl);
  padding: var(--spacing-lg) 0;
  flex-wrap: wrap;
}

.pagination-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--kura-bright-teal);
  border-color: var(--kura-bright-teal);
  color: #fff;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border-subtle);
}

.pagination-numbers {
  display: flex;
  gap: var(--spacing-xs);
}

.pagination-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-number:hover:not(.active) {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
}

.pagination-number.active {
  background: var(--kura-bright-teal);
  border-color: var(--kura-bright-teal);
  color: #fff;
  font-weight: 600;
}

/* ============================================
   RESPONSIVE: MOBILE
   ============================================ */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    padding: var(--spacing-sm);
  }
  
  .search-input-wrapper,
  .filter-wrapper {
    width: 100%;
    min-width: 100%;
  }
  
  .search-button {
    width: 100%;
    justify-content: center;
  }
  
  .pagination {
    gap: var(--spacing-xs);
  }
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .pagination-number {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
}

/* ============================================
   ESTADOS
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
  stroke-width: 0.8;
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
  background: rgba(191, 172, 139, 0.15);
  border-color: var(--kura-gold);
  color: var(--kura-gold);
  transform: translateY(-2px);
}

.suggestion-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.error-state {
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.05);
}

/* Sugerencias dentro del estado de error */
.error-suggestions {
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
}

.suggestions-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 var(--spacing-sm);
  text-align: center;
}

.error-chip {
  background: rgba(191, 172, 139, 0.1);
  border-color: var(--kura-gold);
  color: var(--kura-gold);
}

.error-chip:hover:not(:disabled) {
  background: var(--kura-gold);
  color: #000;
}

/* Acciones del error */
.error-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
   ANIMACIONES
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