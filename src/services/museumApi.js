
const MET_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const REQUEST_TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 segundo base para backoff

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

    // 404: La obra no existe, retornamos null (no es error crítico)
    if (response.status === 404) {
      console.log(`⚠️ 404 - Recurso no encontrado: ${url}`);
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
 * Retorna null si la obra no tiene imagen (la filtramos)
 */
export function normalizeMetArtwork(metData) {
  // FILTRO: Sin imagen = no la mostramos
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
 * Busca obras en la API del Met
 * @param {Object} params - { query, limit, department, hasImages }
 * @returns {Object} { results, total, page, totalPages }
 */
export async function searchArtworks({ 
  query = '', 
  limit = 20, 
  department = '',
  hasImages = true 
} = {}) {
  try {
    // >> Paso 1: Obtener IDs de obras que coincidan con la búsqueda
    const searchParams = new URLSearchParams();
    
    if (query.trim()) {
      searchParams.append('q', query.trim());
    }
    
    if (department) {
      searchParams.append('department', department);
    }
    
    if (hasImages) {
      searchParams.append('hasImages', 'true');
    }

    const searchUrl = `${MET_BASE_URL}/search?${searchParams.toString()}`;
    console.log('Buscando en Met API:', searchUrl);

    // DEBUG - Borrar después
    console.log('🔍 [DEBUG museumApi] Parámetros recibidos:', { query, limit, department, hasImages })
    
    const searchData = await fetchWithRetry(searchUrl);
    
    // La API devuelve { total, objectIDs }
    const allObjectIDs = searchData?.objectIDs || [];
    
    // >> Paso 2: Si no hay resultados, retornar vacío
    if (allObjectIDs.length === 0) {
      return {
        results: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }

    // >> Paso 3: Limitar cantidad de IDs a procesar
    const limitedIDs = allObjectIDs.slice(0, limit * 2); // Pedimos más para filtrar sin imagen
    
    // >> Paso 4: Obtener detalles de cada obra (peticiones paralelas con manejo individual de errores)
    const detailPromises = limitedIDs.map(async (id) => {
      try {
        const data = await fetchWithRetry(`${MET_BASE_URL}/objects/${id}`);
        return data ? normalizeMetArtwork(data) : null;
      } catch (err) {
        console.warn(`Error obteniendo obra ${id}:`, err.message);
        return null;
      }
    });

    const allArtworks = await Promise.all(detailPromises);
    
    // >> Paso 5: Filtrar obras null (sin imagen o con error)
    const validArtworks = allArtworks.filter(artwork => artwork !== null);
    
    // >> Paso 6: Recortar al límite solicitado
    const results = validArtworks.slice(0, limit);

    return {
      results,
      total: searchData.total || results.length,
      page: 1,
      totalPages: Math.ceil((searchData.total || results.length) / limit)
    };

  } catch (err) {
    console.error('Error en searchArtworks:', err);
    
    // Mensaje más amigable según el tipo de error
    let userMessage = 'No se pudo conectar con The Met API';
    if (err.name === 'AbortError') {
      userMessage = 'La petición tardó demasiado. Por favor, inténtalo de nuevo.';
    } else if (err.message?.includes('502')) {
      userMessage = 'El servidor del museo está temporalmente indisponible. Intenta en unos minutos.';
    }
    
    throw new Error(userMessage);
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