<template>
  <TopNav />
  <div class="explore-view">
    <!-- Barra de navegación -->
    
    <h1>🔍 Explorar Obras</h1>
    
    <!-- Búsqueda -->
    <form @submit.prevent="handleSearch" class="search-bar">
      <input 
        v-model="searchQuery" 
        type="search" 
        placeholder="Buscar por título, artista o etiqueta..."
        class="search-input"
      />
      <button type="submit" :disabled="loading">
        {{ loading ? '...' : 'Buscar' }}
      </button>
    </form>
    
    <!-- Estado: cargando -->
    <div v-if="loading && artworks.length === 0" class="state-msg">
      Cargando obras...
    </div>
    
    <!-- Estado: error -->
    <div v-else-if="error" class="state-msg error">
      {{ error }}
      <button @click="handleSearch">Reintentar</button>
    </div>
    
    <!-- Estado: sin resultados -->
    <div v-else-if="artworks.length === 0" class="state-msg">
      No se encontraron obras.
    </div>
    
    <!-- Grid de obras -->
    <div v-else class="artworks-grid">
      <div 
        v-for="artwork in artworks" 
        :key="artwork.museum_id"
        class="artwork-card"
        @click="() => viewArtwork(artwork.museum_id)"
        tabindex="0"
        @keydown.enter="() => viewArtwork(artwork.museum_id)"
        role="button"
        aria-label="Ver detalles de {{ artwork.title }}"
      >
        <!-- Imagen: pointer-events none para que el click vaya a la card -->
        <div class="image-wrapper">
          <img 
            :src="artwork.thumbnail_url" 
            :alt="artwork.title"
            class="artwork-image"
            @error="handleImageError"
          />
        </div>
        
        <!-- Info -->
        <div class="artwork-info">
          <h3>{{ artwork.title }}</h3>
          <p class="artist">{{ artwork.artist_name }}</p>
          <p v-if="artwork.period" class="period">{{ artwork.period }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useArtworks } from '@/composables/useArtworks'
import TopNav from '../../components/common/TopNav.vue'

const { isAuthenticated } = useAuth()
const { artworks, loading, error, search } = useArtworks()
const router = useRouter()
const searchQuery = ref('')

onMounted(async () => {
  await search({ query: '', limit: 20 })
})

const handleSearch = async () => {
  await search({ query: searchQuery.value, limit: 20 })
}

const handleImageError = (e) => {
  e.target.src = `image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect fill='#f5f5f5' width='200' height='200'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
            fill='#999' font-family='system-ui' font-size='11'>Sin imagen</text>
    </svg>
  `)}`
}

const viewArtwork = (museumId) => {
  // ✅ Log para debug: confirmar que el click se registra
  console.log('🖱️ Click detectado en obra:', museumId)
  
  // ✅ Navegación explícita con callback de error
  router.push({ name: 'artwork-detail', params: { id: museumId } })
    .catch(err => {
      console.error('❌ Error de navegación:', err)
      // Fallback: navegación directa si router.push falla
      window.location.href = `/artwork/${museumId}`
    })
}
</script>

<style scoped>
/* ✅ Estilos de la navegación */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #1976d2;
}

.nav-link.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.explore-view { max-width: 1200px; margin: 0 auto; padding: 1rem; font-family: system-ui; }
.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.search-input { flex: 1; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.state-msg { text-align: center; padding: 2rem; color: #666; }
.state-msg.error { color: #d32f2f; }

/* Grid */
.artworks-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
  gap: 1.5rem; 
}

/* Card: estilo clickable */
.artwork-card { 
  border: 1px solid #e0e0e0; 
  border-radius: 8px; 
  overflow: hidden; 
  cursor: pointer;  /* ✅ Cursor de mano */
  transition: transform 0.2s, box-shadow 0.2s; 
  background: white;
  /* ✅ Asegurar que los clicks no sean bloqueados */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Hover/active feedback */
.artwork-card:hover { 
  transform: translateY(-4px); 
  box-shadow: 0 8px 24px rgba(0,0,0,0.15); 
}
.artwork-card:active {
  transform: translateY(-2px);
}
.artwork-card:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Imagen: pointer-events none para que el click "pase" a la card */
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
  pointer-events: none;  /* ✅ Clave: la imagen no intercepta clicks */
  display: block;
}

/* Info */
.artwork-info { padding: 1rem; pointer-events: none; }  /* ✅ Info tampoco intercepta */
.artwork-info h3 { font-size: 1rem; margin: 0 0 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artist { color: #666; font-size: 0.9rem; margin: 0; }
.period { color: #999; font-size: 0.85rem; margin: 0.25rem 0 0; }
</style>