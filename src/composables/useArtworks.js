// src/composables/useArtworks.js

import { ref } from 'vue'
import { searchArtworks, getArtworkById, getFeaturedArtworks, getDepartments } from '@/services/museumApi'

export function useArtworks() {
  // Estado reactivo - Obras y carga
  const artworks = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Estado reactivo - Paginación
  const pagination = ref({ 
    page: 1, 
    total: 0, 
    totalPages: 1, 
    pageSize: 12 // Default: 12 items por página
  })
  
  // Estado reactivo - Filtros
  const filters = ref({
    query: '',
    departmentIds: [], // Array de IDs seleccionados
    hasImages: true
  })
  
  // Parámetros de búsqueda actuales
  const currentSearchParams = ref({})

  /**
   * Busca obras con los parámetros especificados
   * @param {Object} params - { query, departmentIds, hasImages, page, pageSize }
   */
  const search = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Fusionar parámetros recibidos con los actuales y valores por defecto
      const searchParams = {
        query: params.query ?? filters.value.query,
        departmentIds: params.departmentIds ?? filters.value.departmentIds,
        hasImages: params.hasImages ?? filters.value.hasImages,
        page: params.page ?? pagination.value.page,
        pageSize: params.pageSize ?? pagination.value.pageSize
      }
      
      // Guardar parámetros actuales por si queremos recargar
      currentSearchParams.value = { ...searchParams }
      
      // Actualizar estado reactivo de filtros (para que la UI se sincronice)
      filters.value.query = searchParams.query
      filters.value.departmentIds = searchParams.departmentIds
      filters.value.hasImages = searchParams.hasImages
      pagination.value.page = searchParams.page
      pagination.value.pageSize = searchParams.pageSize
      
      const result = await searchArtworks(searchParams)
      
      // Actualizar estado reactivo
      artworks.value = [...result.results]
      pagination.value.total = result.total || artworks.value.length
      pagination.value.totalPages = result.totalPages || 1
      
      console.log(`Búsqueda completada: ${artworks.value.length} obras encontradas (página ${pagination.value.page})`)
      
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
   * Navega a una página específica y recarga los resultados
   * @param {number} page - Número de página (1-based)
   */
  const goToPage = async (page) => {
    // Validar que la página esté dentro del rango válido
    if (page < 1 || page > pagination.value.totalPages) {
      console.warn(`Página ${page} fuera de rango (1-${pagination.value.totalPages})`)
      return false
    }
    
    // Actualizar página actual y recargar búsqueda con mismos parámetros
    pagination.value.page = page
    return await search({ page })
  }

  /**
   * Actualiza el filtro de departamento y resetea a página 1
   * @param {Array<number>} departmentIds - Array de IDs de departamento a filtrar
   */
  const setDepartmentFilter = async (departmentIds) => {
    // Asegurar que siempre es un array
    const ids = Array.isArray(departmentIds) ? departmentIds : (departmentIds ? [departmentIds] : [])
    
    // Actualizar filtro y resetear paginación
    filters.value.departmentIds = ids
    pagination.value.page = 1 // Siempre volvemos a la página 1 al cambiar filtros
    
    // Recargar búsqueda con nuevo filtro
    return await search({ departmentIds: ids, page: 1 })
  }

  /**
   * Limpia todos los filtros y recarga la búsqueda
   */
  const resetFilters = async () => {
    filters.value = {
      query: '',
      departmentIds: [],
      hasImages: true
    }
    pagination.value.page = 1
    
    // Recargar con filtros limpios
    return await search({ 
      query: '', 
      departmentIds: [], 
      page: 1 
    })
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
      pageSize: 12 
    }
    filters.value = {
      query: '',
      departmentIds: [],
      hasImages: true
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

  /**
   * Obtiene la lista de departamentos disponibles para filtros
   * @returns {Array} Array de objetos { id, name }
   */
  const getAvailableDepartments = () => {
    return getDepartments()
  }

  return {
    // Estado - Obras y carga
    artworks,
    loading,
    error,
    
    // Estado - Paginación
    pagination,
    
    // Estado - Filtros
    filters,
    
    // Acciones - Búsqueda y navegación
    search,
    getArtwork,
    getFeatured,
    goToPage,
    reload,
    
    // Acciones - Filtros
    setDepartmentFilter,
    resetFilters,
    
    // Acciones - Utilidades
    reset,
    clearError,
    getAvailableDepartments
  }
}