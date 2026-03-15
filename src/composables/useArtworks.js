
import { ref } from 'vue'
import { searchArtworks, getArtworkById, getFeaturedArtworks } from '@/services/museumApi'

export function useArtworks() {
  // Estado reactivo
  const artworks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({ 
    page: 1, 
    total: 0, 
    totalPages: 1, 
    limit: 20 
  })
  
  // Parámetros de búsqueda actuales (para reutilizar)
  const currentSearchParams = ref({})

  /**
   * Busca obras con los parámetros especificados
   * @param {Object} params - { query, limit, department, hasImages }
   */
  const search = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Guardar parámetros actuales por si queremos recargar
      currentSearchParams.value = { ...params }
      
      const result = await searchArtworks({
        query: params.query || '',
        limit: params.limit || 20,
        department: params.department || '',
        hasImages: params.hasImages !== false // true por defecto
      })
      
      // Actualizar estado reactivo
      // IMPORTANTE: Usar spread operator ([...]) para forzar reactividad en Vue 3
      artworks.value = [...result.results]
      pagination.value.total = result.total || artworks.value.length
      pagination.value.totalPages = result.totalPages || 1
      pagination.value.page = result.page || 1
      
      console.log(`Búsqueda completada: ${artworks.value.length} obras encontradas`)
      
      return { 
        success: true, 
        count: artworks.value.length 
      }
      
    } catch (err) {
      // Manejo de errores con mensaje amigable
      console.error('Error en search:', err)
      error.value = err.message || 'No se pudo cargar las obras'
      artworks.value = []
      
      return { 
        success: false, 
        count: 0,
        error: err.message 
      }
      
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene una obra específica por su ID
   * @param {string} museumId - Formato: 'met-{objectID}'
   */
  const getArtwork = async (museumId) => {
    loading.value = true
    error.value = null
    
    try {
      const artwork = await getArtworkById(museumId)
      return artwork
      
    } catch (err) {
      console.error('Error en getArtwork:', err)
      error.value = err.message || 'No se pudo cargar la obra'
      return null
      
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene obras destacadas para la home
   * Esta función usa el endpoint que filtra por isHighlight=true
   * @param {number} limit - Cantidad de obras
   */
  const getFeatured = async (limit = 12) => {
    loading.value = true
    error.value = null
    
    try {
      const featured = await getFeaturedArtworks(limit)
      artworks.value = [...featured]
      pagination.value.total = featured.length
      
      console.log(`Obras destacadas cargadas: ${featured.length}`)
      
      return { 
        success: true, 
        count: featured.length 
      }
      
    } catch (err) {
      console.error('Error en getFeatured:', err)
      error.value = err.message || 'No se pudo cargar obras destacadas'
      artworks.value = []
      
      return { 
        success: false, 
        count: 0 
      }
      
    } finally {
      loading.value = false
    }
  }

  /**
   * Recarga la búsqueda con los últimos parámetros usados
   * Útil para botón "reintentar" después de un error
   */
  const reload = async () => {
    if (Object.keys(currentSearchParams.value).length > 0) {
      return await search(currentSearchParams.value)
    }
    return await search()
  }

  /**
   * Resetea todo el estado a valores iniciales
   */
  const reset = () => {
    artworks.value = []
    pagination.value = { 
      page: 1, 
      total: 0, 
      totalPages: 1, 
      limit: 20 
    }
    error.value = null
    currentSearchParams.value = {}
  }

  /**
   * Limpia solo el error (para reintentar sin recargar)
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Estado
    artworks,
    loading,
    error,
    pagination,
    
    // Acciones
    search,
    getArtwork,
    getFeatured,
    reload,
    reset,
    clearError
  }
}