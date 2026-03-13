<template>
  <div class="artwork-detail">
    <button @click="$router.back()" class="back-btn">← Volver</button>
    
    <div v-if="loading" class="loading">Cargando obra...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="artwork" class="artwork-content">
      <div class="artwork-header">
        <h1>{{ artwork.title }}</h1>
        <p class="artist">{{ artwork.artist_name }}</p>
        <p v-if="artwork.creation_date" class="date">{{ artwork.creation_date }}</p>
        <p v-if="artwork.period" class="period">{{ artwork.period }}</p>
      </div>
      
      <div class="artwork-image">
        <img 
            :src="artwork.image_url || artwork.thumbnail_url || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'><rect fill=\'%23f5f5f5\' width=\'800\' height=\'600\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-family=\'system-ui\' font-size=\'16\'>Sin imagen disponible</text></svg>'"
            :alt="artwork.title"
            @error="e => e.target.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'><rect fill=\'%23ffebee\' width=\'800\' height=\'600\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23d32f2f\' font-family=\'system-ui\' font-size=\'14\'>Error al cargar</text></svg>'"
        />
      </div>
      
      <div v-if="artwork.description" class="description">
        <h2>Descripción</h2>
        <p>{{ artwork.description }}</p>
      </div>
      
      <div v-if="artwork.tags?.length" class="tags">
        <h3>Etiquetas</h3>
        <div class="tags-list">
          <span v-for="tag in artwork.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      
      <div class="actions">
        <a 
          v-if="artwork.external_url" 
          :href="artwork.external_url" 
          target="_blank" 
          rel="noopener noreferrer"
          class="external-link"
        >
          Ver en Rijksmuseum →
        </a>
      </div>
      
      <!-- Metadata JSONB (para debug/desarrollo) -->
      <details class="metadata">
        <summary>Metadatos técnicos (JSON)</summary>
        <pre>{{ artwork.metadata }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'

const route = useRoute()
const { getArtwork, loading, error } = useArtworks()

const artwork = ref(null)

onMounted(async () => {
  const museumId = route.params.id
  artwork.value = await getArtwork(museumId)
})
</script>

<style scoped>
.artwork-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}

.back-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.artwork-header {
  margin-bottom: 1.5rem;
}

.artwork-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.artist {
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.date, .period {
  color: #666;
  margin: 0.25rem 0;
}

.artwork-image {
  margin: 1.5rem 0;
  text-align: center;
}

.artwork-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.description, .tags {
  margin: 1.5rem 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.actions {
  margin: 2rem 0;
}

.external-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.metadata {
  margin-top: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.85rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #d32f2f;
}
</style>