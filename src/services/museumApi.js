// src/services/museumApi.js

const MET_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const REQUEST_TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 segundo base para backoff

/**
 * Lista de departamentos más populares del Met
 * Evitamos petición extra a /departments al cargar
 * Fuente: https://collectionapi.metmuseum.org/public/collection/v1/departments
 */
export const POPULAR_DEPARTMENTS = [
  { id: 1, name: 'Egyptian Art' },
  { id: 3, name: 'Arms and Armor' },
  { id: 4, name: 'Arts of Africa, Oceania, and the Americas' },
  { id: 5, name: 'Asian Art' },
  { id: 9, name: 'Costume Institute' },
  { id: 10, name: 'Drawings and Prints' },
  { id: 12, name: 'European Paintings' },
  { id: 13, name: 'European Sculpture and Decorative Arts' },
  { id: 19, name: 'Greek and Roman Art' },
  { id: 21, name: 'Islamic Art' }
];

/**
 * Sugerencias de búsqueda comunes para mostrar cuando la API falla
 */
export const SEARCH_SUGGESTIONS = [
  'Van Gogh',
  'Monet',
  'Rembrandt',
  'Flowers',
  'Portraits',
  'Landscapes',
  'Egyptian Art',
  'Greek Sculpture',
  'Impressionism',
  'Still Life'
];

/**
 * Helper para esperar X milisegundos
 * Usado para delays entre reintentos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch con timeout + reintentos automáticos
 * Usamos backoff exponencial: 1s → 2s → 4s entre intentos
 * 
 * @param {string} url - URL a fetchear
 * @param {number} retries - Intentos restantes (interno)
 * @returns {Promise<Object>} Datos JSON de la respuesta
 */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    // 404: La obra no existe, retornamos null
    if (response.status === 404) {
      console.log(`404 - Recurso no encontrado: ${url}`);
      return null;
    }

    // Otros errores HTTP: lanzamos error para reintentar
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();

  } catch (err) {
    clearTimeout(timeoutId);

    // Si quedan reintentos y es error de red/timeout, reintentamos
    if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, MAX_RETRIES - retries);
      console.log(`⏳ Reintentando en ${delay}ms... (${retries} intentos restantes)`);
      
      await sleep(delay);
      return fetchWithRetry(url, retries - 1);
    }

    // Sin más reintentos, propagamos el error
    throw err;
  }
}

/**
 * Normaliza una obra de la API del Met a nuestro esquema Kura
 * Retorna null si la obra no tiene imagen
 */
export function normalizeMetArtwork(metData) {
  // FILTRO: Sin imagen => no la mostramos
  if (!metData || !metData.primaryImage || metData.primaryImage.trim() === '') {
    return null;
  }

  // Calcular edad aproximada del artista si tenemos fechas
  let artistAge = null;
  if (metData.artistBeginDate && metData.artistEndDate) {
    artistAge = metData.artistEndDate - metData.artistBeginDate;
  }

  // Construir tags combinando departamento, clasificación y cultura
  const tags = [
    metData.department,
    metData.classification,
    metData.culture,
    metData.period,
    metData.city,
    metData.country
  ].filter(Boolean); // Eliminar valores null/undefined

  return {
    // Identificación
    museum_id: `met-${metData.objectID}`,
    museum_name: 'The Met',
    external_url: metData.objectURL || `https://www.metmuseum.org/art/collection/search/${metData.objectID}`,
    
    // Información básica
    title: metData.title || 'Sin título',
    artist_name: metData.artistDisplayName || 'Artista desconocido',
    creation_date: metData.objectDate || 'Fecha desconocida',
    period: metData.period || metData.culture || 'Desconocido',
    
    // Imágenes (usamos primaryImage para detalle, primaryImageSmall para grid/miniaturas)
    image_url: metData.primaryImage,
    thumbnail_url: metData.primaryImageSmall || metData.primaryImage,
    
    // Descripción
    description: metData.galleryText || metData.description || '',
    tags: tags,
    
    // Metadatos extendidos (los usaremos en ArtworkDetail)
    is_public_domain: metData.isPublicDomain || false,
    metadata: {
      objectID: metData.objectID,
      accessionNumber: metData.accessionNumber,
      isHighlight: metData.isHighlight || false,
      department: metData.department,
      classification: metData.classification,
      medium: metData.medium,
      dimensions: metData.dimensions,
      measurements: metData.measurements,
      artistBeginDate: metData.artistBeginDate,
      artistEndDate: metData.artistEndDate,
      artistAge: artistAge,
      artistNationality: metData.artistNationality,
      artistGender: metData.artistGender,
      culture: metData.culture,
      dynasty: metData.dynasty,
      reign: metData.reign,
      city: metData.city,
      state: metData.state,
      country: metData.country,
      region: metData.region,
      creditLine: metData.creditLine,
      objectBeginDate: metData.objectBeginDate,
      objectEndDate: metData.objectEndDate,
      source: 'met-api'
    }
  };
}

/**
 * Obtiene la lista de departamentos populares para filtros
 * @returns {Array} Array de objetos { id, name }
 */
export function getDepartments() {
  return POPULAR_DEPARTMENTS;
}

/**
 * Busca obras en la API del Met con soporte para filtros y paginación
 * @param {Object} params - { query, departmentIds, hasImages, page, pageSize }
 * @returns {Object} { results, total, page, totalPages, pageSize, errorType? }
 */
export async function searchArtworks({ 
  query = '', 
  departmentIds = [], // Array de IDs de departamento, ej: [1, 12]
  hasImages = true,
  page = 1,
  pageSize = 12 // 12 items por página
} = {}) {
  try {
    // >> Construir parámetros de búsqueda para el endpoint /search
    const searchParams = new URLSearchParams();
    
    if (query.trim()) {
      searchParams.append('q', query.trim());
    }
    
    // Filtro por departamento: la API del Met usa 'departmentId' (singular) en /search
    // Si hay múltiples, la API solo acepta uno en /search, así que usamos el primero
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      searchParams.append('departmentId', departmentIds[0].toString());
    } else if (typeof departmentIds === 'string' && departmentIds.trim()) {
      searchParams.append('departmentId', departmentIds.trim());
    }
    
    if (hasImages) {
      searchParams.append('hasImages', 'true');
    }

    const searchUrl = `${MET_BASE_URL}/search?${searchParams.toString()}`;
    console.log('Buscando en Met API:', searchUrl);
    
    const searchData = await fetchWithRetry(searchUrl);
    
    // La API devuelve { total, objectIDs }
    const allObjectIDs = searchData?.objectIDs || [];
    
    // >> Si no hay resultados, retornar vacío
    if (allObjectIDs.length === 0) {
      return {
        results: [],
        total: 0,
        page: 1,
        totalPages: 0,
        pageSize
      };
    }

    // >> Paginación manual (la API no tiene paginación nativa)
    // Calculamos el índice de inicio y fin para esta página
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Slice de los IDs para esta página
    const pageObjectIDs = allObjectIDs.slice(startIndex, endIndex);
    
    // Si no hay IDs en esta página, retornar vacío
    if (pageObjectIDs.length === 0) {
      return {
        results: [],
        total: searchData.total || allObjectIDs.length,
        page,
        totalPages: Math.ceil(allObjectIDs.length / pageSize),
        pageSize
      };
    }

    // >> Obtener detalles de cada obra de esta página
    const detailPromises = pageObjectIDs.map(async (id) => {
      try {
        const data = await fetchWithRetry(`${MET_BASE_URL}/objects/${id}`);
        return data ? normalizeMetArtwork(data) : null;
      } catch (err) {
        console.warn(`⚠️ Error obteniendo obra ${id}:`, err.message);
        return null;
      }
    });

    const allArtworks = await Promise.all(detailPromises);
    
    // >> Filtrar obras null (sin imagen o con error)
    const validArtworks = allArtworks.filter(artwork => artwork !== null);

    // >> Calcular totales reales (ajustados por obras filtradas sin imagen)
    // Nota: El total real puede ser menor que searchData.total porque filtramos sin imagen
    const estimatedTotal = searchData.total || allObjectIDs.length;
    const adjustedTotal = Math.max(estimatedTotal - (allObjectIDs.length - validArtworks.length), 0);

    return {
      results: validArtworks,
      total: adjustedTotal,
      page,
      totalPages: Math.ceil(adjustedTotal / pageSize),
      pageSize
    };

  } catch (err) {
    console.error('Error en searchArtworks:', err);

    // Clasificar el tipo de error para mostrar mensajes específicos
    let errorType = 'unknown';
    let userMessage = 'No se pudo conectar con The Met API';

    if (err.name === 'AbortError') {
      errorType = 'timeout';
      userMessage = 'La petición tardó demasiado. Por favor, inténtalo de nuevo.';
    } else if (err.message?.includes('502')) {
      errorType = 'server-unavailable';
      userMessage = 'El servidor del museo está temporalmente indisponible. Intenta en unos minutos.';
    } else if (err.message?.includes('404')) {
      errorType = 'not-found';
      userMessage = 'No se encontró el recurso solicitado.'; 
    } else if (err.message?.includes('CORS') || err.message?.includes('NetworkError')) {
      errorType = 'connection';
      userMessage = 'No se pudo establecer conexión con The Met API. Verifica tu conexión a internet.';
    } else if (departmentIds?.length > 0) {
      // Error específico cuando se usa filtro de departamento
      errorType = 'filter-unavailable';
      userMessage = 'El filtro por departamento no está disponible en este momento. Prueba con una búsqueda por texto.';
    }
    
    // Retornar objeto con información del error para que la UI lo maneje
    throw {
      message: userMessage,
      errorType,
      originalError: err
    };
  }
}

/**
 * Obtiene una obra específica por su ID del Met
 * @param {string} museumId - Formato: 'met-{objectID}'
 * @returns {Object|null} Obra normalizada o null
 */
export async function getArtworkById(museumId) {
  try {
    // Extraer el objectID del formato 'met-{objectID}'
    const objectID = museumId.replace('met-', '');
    
    if (!/^\d+$/.test(objectID)) {
      throw new Error('ID de obra inválido');
    }

    const url = `${MET_BASE_URL}/objects/${objectID}`;
    console.log('Obteniendo detalle de obra:', url);
    
    const metData = await fetchWithRetry(url);
    
    if (!metData) {
      throw new Error('Esta obra no está disponible');
    }
    
    const normalizedArtwork = normalizeMetArtwork(metData);

    if (!normalizedArtwork) {
      throw new Error('Esta obra no tiene imagen disponible');
    }

    return normalizedArtwork;

  } catch (err) {
    console.error('Error en getArtworkById:', err);
    throw err;
  }
}

/**
 * Obtiene obras destacadas (isHighlight = true)
 * @param {number} limit - Cantidad de obras a retornar
 * @returns {Array} Array de obras normalizadas
 */
export async function getFeaturedArtworks(limit = 12) {
  try {
    const searchUrl = `${MET_BASE_URL}/search?hasImages=true&isHighlight=true`;
    console.log('Obteniendo obras destacadas:', searchUrl);
    
    const searchData = await fetchWithRetry(searchUrl);
    const allObjectIDs = searchData?.objectIDs || [];
    
    if (allObjectIDs.length === 0) {
      return [];
    }

    // Obtener detalles de las primeras obras
    const limitedIDs = allObjectIDs.slice(0, limit * 2);
    
    const detailPromises = limitedIDs.map(async (id) => {
      try {
        const data = await fetchWithRetry(`${MET_BASE_URL}/objects/${id}`);
        return data ? normalizeMetArtwork(data) : null;
      } catch {
        return null;
      }
    });

    const allArtworks = await Promise.all(detailPromises);
    const validArtworks = allArtworks.filter(artwork => artwork !== null);
    
    return validArtworks.slice(0, limit);

  } catch (err) {
    console.error('Error en getFeaturedArtworks:', err);
    return [];
  }
}