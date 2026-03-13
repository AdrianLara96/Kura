import { ref, computed } from 'vue'
import { searchCachedArtworks, syncArtworkToCache, getArtworkWithCache } from '@/services/syncService'

export function useArtworks() {
  const artworks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 20
  })

  // Búsqueda con estrategia cache-aside
  const search = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      // Intentar primero en caché local (más rápido)
      const cachedResults = await searchCachedArtworks({
        query: params.query,
        artist_name: params.artist,
        period: params.period,
        limit: pagination.value.limit,
        offset: (pagination.value.page - 1) * pagination.value.limit
      })
      
      // Si hay resultados en caché, devolverlos inmediatamente
      if (cachedResults.length > 0) {
        artworks.value = cachedResults
        pagination.value.total = cachedResults.length // Estimación
        return { source: 'cache', count: cachedResults.length }
      }
      
      // Si no hay caché, fetch a API externa
        const { searchArtworks } = await import('@/services/museumApi')
        const apiResult = await searchArtworks({
            query: params.query,
            department: params.period, // Mapeamos period → department para The Met
            limit: pagination.value.limit
        })
      
      artworks.value = apiResult.results
      pagination.value.total = apiResult.total
      pagination.value.totalPages = apiResult.totalPages
      
      // Sincronizar obras nuevas en caché (background)
      apiResult.results.forEach(artwork => {
        syncArtworkToCache(artwork) // Fire-and-forget
      })
      
      return { source: 'api', count: apiResult.results.length }
      
    } catch (err) {
      console.error('❌ Error en búsqueda:', err)
      error.value = err.message
      return { source: 'error', count: 0 }
    } finally {
      loading.value = false
    }
  }

  // Obtener obra individual con caché inteligente
  const getArtwork = async (museumId) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await getArtworkWithCache(museumId)
      return result.data
      
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // Cargar más resultados (infinite scroll)
  const loadMore = async (params = {}) => {
    pagination.value.page += 1
    return await search(params)
  }

  // Resetear búsqueda
  const reset = () => {
  artworks.value = []        // Limpiar array
  pagination.value = {       // Resetear paginación
    page: 1, 
    total: 0, 
    totalPages: 0, 
    limit: 20 
  }
  error.value = null         // Limpiar errores
  // NO resetear loading aquí, se maneja en cada búsqueda
}

  return {
    artworks,
    loading,
    error,
    pagination,
    search,
    getArtwork,
    loadMore,
    reset
  }
}