// src/services/museumApi.js
// API: The Metropolitan Museum of Art (New York)
// Docs: https://metmuseum.github.io/

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1'

/**
 * Normalizar obra de The Met → formato museum_artworks de Kura
 * @param {Object} metObject - Respuesta cruda de la API del Met
 * @returns {Object} Datos normalizados
 */
export function normalizeArtwork(metObject) {
  // The Met devuelve imágenes en el array 'primaryImage' o 'primaryImageSmall'
  const imageUrl = metObject.primaryImage || metObject.primaryImageSmall || null
  
  // Generar thumbnail reduciendo tamaño en la URL
  const thumbnailUrl = imageUrl 
    ? imageUrl.replace('images/metmuseum-images/thumbnails/', 'images/metmuseum-images/thumbnails/')
            .replace('/800w/', '/200w/') // Si existe versión 800px, pedir 200px
    : null

  // Extraer período histórico del departamento o cultura
  const period = metObject.Culture || metObject.Department || metObject.Classification || null

  return {
    // IDs y URLs
    museum_id: String(metObject.objectID),  // The Met usa números como ID
    museum_name: 'The Met',
    external_url: `https://www.metmuseum.org/art/collection/search/${metObject.objectID}`,
    
    // Información básica
    title: metObject.title || 'Sin título',
    artist_name: metObject.artistDisplayName || 'Desconocido',
    creation_date: metObject.objectDate || null,
    period: period,
    
    // Imágenes
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    
    // Metadatos
    description: metObject.description || null,
    tags: [
      metObject.Department,
      metObject.Classification,
      metObject.Culture,
      metObject.Materials
    ].filter(Boolean),
    
    // Dominio público (The Met marca obras con isPublicDomain)
    is_public_domain: metObject.isPublicDomain || false,
    
    // Metadatos extra en JSONB
    metadata: {
      objectID: metObject.objectID,
      department: metObject.Department,
      classification: metObject.Classification,
      culture: metObject.Culture,
      materials: metObject.Materials,
      dimensions: metObject.dimensions,
      repository: metObject.Repository,
      isHighlight: metObject.isHighlight,
      isPublicDomain: metObject.isPublicDomain
    }
  }
}

/**
 * Obtener lista de IDs de objetos (búsqueda básica)
 * @param {Object} params - Parámetros de búsqueda
 * @returns {Promise<Array<number>>} Lista de objectIDs
 */
export async function getObjectIds({
  q = '',
  department = '',
  isHighlight = false
} = {}) {
  const searchParams = new URLSearchParams()
  
  if (q) searchParams.append('q', q)
  if (department) searchParams.append('department', department)
  if (isHighlight) searchParams.append('isHighlight', 'true')
  
  const url = `${BASE_URL}/objects?${searchParams.toString()}`
  
  console.log('🔍 Fetching Met object IDs:', url)
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000)
  })
  
  if (!response.ok) {
    throw new Error(`Met API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.objectIDs || []
}

/**
 * Listar departamentos disponibles (para filtros)
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function listDepartments() {
  try {
    const url = 'https://collectionapi.metmuseum.org/public/collection/v1/departments'
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.departments?.map(dept => ({
      id: dept.departmentId,
      name: dept.displayName
    })) || []
    
  } catch (error) {
    console.error('❌ Error listing departments:', error)
    return []
  }
}

/**
 * Fallback a mock data cuando la API externa falla
 * Exportamos las mismas funciones para que useArtworks.js no necesite cambios
 */
export async function searchArtworks({ query = '', limit = 20 } = {}) {
  console.log('🎭 Usando datos mock (API externa no disponible)')
  const { searchMockArtworks } = await import('./mockArtworks')
  return searchMockArtworks({ query, limit })
}

export async function getArtworkById(museumId) {
  console.log('🎭 Usando dato mock para:', museumId)
  const { getMockArtworkById } = await import('./mockArtworks')
  return getMockArtworkById(museumId)
}

export async function getFeaturedArtworks(limit = 12) {
  const { getFeaturedMockArtworks } = await import('./mockArtworks')
  return getFeaturedMockArtworks(limit)
}