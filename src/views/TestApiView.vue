<!-- src/views/TestApiView.vue -->
<template>
  <div class="p-4">
    <h1>Prueba API</h1>
    
    <button @click="testListRecords" :disabled="loading">
      {{ loading ? 'Cargando...' : 'Probar listRecords' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="results && results.length > 0" class="results">
      <h3>Obras encontradas: {{ results.length }}</h3>
      <ul>
        <li v-for="item in results" :key="item.museum_id">
          <strong>{{ item.title }}</strong><br>
          {{ item.artist_name }}<br>
          <img v-if="item.thumbnail_url" :src="item.thumbnail_url" width="100" />
        </li>
      </ul>
    </div>
    
    <button @click="testGetArtwork" :disabled="loading" class="ml-2">
      Probar Van Gogh
    </button>
    
    <div v-if="loading" class="loading">Procesando...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- ✅ Mensaje cuando no hay resultados -->
    <div v-else-if="results && results.length === 0 && !loading" class="empty">
      No se encontraron obras.
    </div>
    
    <!-- Detalle de obra individual -->
    <div v-if="artwork" class="artwork">
      <h3>Detalle:</h3>
      <p><strong>{{ artwork.title }}</strong></p>
      <p>{{ artwork.artist_name }}</p>
      <img v-if="artwork.thumbnail_url" :src="artwork.thumbnail_url" width="200" />
    </div>
    
    <router-link to="/explore" class="back-link">← Volver al explorador</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchArtworks, getArtworkById } from '@/services/museumApi'
// import { syncArtworkToCache } from '@/services/syncService'

const loading = ref(false)
const error = ref(null)
const results = ref([])
const artwork = ref(null)

const testListRecords = async () => {
  loading.value = true
  error.value = null
  results.value = []
  
  try {
    const result = await searchArtworks({ isHighlight: true, limit: 10 })
    
    // Asignación reactiva correcta
    results.value = result.results || []
    console.log('✅ listRecords exitoso:', results.value.length, 'obras')

  } catch (err) {
    error.value = err.message
    console.error('❌ Error:', err)
  } finally {
    loading.value = false
  }
}

const testGetArtwork = async () => {
  loading.value = true
  error.value = null
  artwork.value = null
  
  try {
    // ID de Van Gogh en nuestro mock
    const data = await getArtworkById('met-436535')
    artwork.value = data
    
    console.log('✅ getArtworkById:', data?.title || 'No encontrado')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.p-4 { padding: 1rem; font-family: system-ui; }
button { padding: 0.5rem 1rem; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:disabled { background: #90a4ae; cursor: not-allowed; }
.ml-2 { margin-left: 0.5rem; }
.loading, .error { margin: 1rem 0; padding: 0.5rem; }
.error { color: #d32f2f; background: #ffebee; border-radius: 4px; }
.results, .artwork { margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 4px; }
.back-link { display: inline-block; margin-top: 1rem; color: #1976d2; }
</style>