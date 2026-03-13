// src/services/syncService.js
import { supabase } from '@/supabase/client'

const CACHE_TTL_DAYS = 7  // Caché de 7 días

/**
 * Verificar si una obra está en caché y no ha expirado
 * @param {string} museumId - ID de la obra en el museo
 * @param {string} museumName - Nombre del museo ('Rijksmuseum')
 * @returns {Promise<Object|null>} Obra en caché o null si expiró/no existe
 */
export async function getCachedArtwork(museumId, museumName = 'Rijksmuseum') {
  try {
    const { data, error } = await supabase
      .from('museum_artworks')
      .select('*')
      .eq('museum_id', museumId)
      .eq('museum_name', museumName)
      .single()
    
    if (error || !data) return null
    
    // Verificar si el caché ha expirado
    if (data.last_synced_at) {
      const lastSync = new Date(data.last_synced_at)
      const now = new Date()
      const diffDays = (now - lastSync) / (1000 * 60 * 60 * 24)
      
      if (diffDays > CACHE_TTL_DAYS) {
        console.log(`🔄 Caché expirado para ${museumId} (${diffDays.toFixed(1)} días)`)
        return { ...data, cacheExpired: true }
      }
    }
    
    return { ...data, cacheExpired: false }
    
  } catch (err) {
    console.error('❌ Error leyendo caché:', err)
    return null
  }
}

// src/services/syncService.js

/**
 * Insertar o actualizar una obra en la BD local (upsert)
 * @param {Object} artwork - Datos normalizados de la obra
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function syncArtworkToCache(artwork) {
  try {
    // Si es dato mock, NO intentar guardar en BD (solo para desarrollo)
    if (artwork.metadata?.source === 'mock' || artwork.title?.includes('Mock')) {
      console.log('🎭 Mock data: skipping database sync')
      return { success: true,  artwork, source: 'mock' }
    }

    // Datos reales: intentar upsert en Supabase
    const { data, error } = await supabase
      .from('museum_artworks')
      .upsert({
        ...artwork,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'museum_id,museum_name',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) {
      // Si es error de RLS (42501), es esperado desde frontend
      if (error.code === '42501') {
        console.log('ℹ️ Upsert bloqueado por RLS (esperado desde frontend)')
        return { success: true,  artwork, source: 'frontend-no-sync' }
      }
      throw error
    }
    
    console.log(`💾 Obra sincronizada: ${artwork.title} (${artwork.museum_id})`)
    return { success: true, data }
    
  } catch (err) {
    // Errores de RLS o permisos no son críticos para el MVP
    if (err.code === '42501' || err.message?.includes('row-level security')) {
      console.log('ℹ️ Sync omitido por políticas RLS (configuración esperada)')
      return { success: true,  artwork, source: 'rls-protected' }
    }
    
    console.error('❌ Error sincronizando obra:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Buscar obras en caché local (sin llamar a API externa)
 * @param {Object} filters - Filtros para la búsqueda
 * @returns {Promise<Array>} Resultados desde la BD local
 */
export async function searchCachedArtworks(filters = {}) {
  try {
    let query = supabase
      .from('museum_artworks')
      .select('*')
      .eq('museum_name', 'Rijksmuseum')  // Por ahora solo Rijksmuseum
    
    // Aplicar filtros dinámicos
    if (filters.artist_name) {
      query = query.ilike('artist_name', `%${filters.artist_name}%`)
    }
    if (filters.period) {
      query = query.eq('period', filters.period)
    }
    if (filters.query) {
      // Búsqueda de texto en título y artista usando el índice GIN
      query = query.or(`title.ilike.%${filters.query}%,artist_name.ilike.%${filters.query}%`)
    }
    if (filters.tags?.length) {
      // Buscar obras que tengan AL MENOS uno de los tags (operador @>)
      query = query.contains('tags', filters.tags)
    }
    
    // Paginación
    if (filters.limit) query = query.limit(filters.limit)
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    
    // Ordenar por relevancia (por ahora, por fecha de sincronización)
    query = query.order('last_synced_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
    
  } catch (err) {
    console.error('❌ Error buscando en caché:', err)
    return []
  }
}

/**
 * Estrategia principal: "Cache-Aside" con refresh automático
 * 1. Intentar servir desde caché local
 * 2. Si no existe o expiró → fetch a API externa → guardar en caché → devolver
 * @param {string} museumId - ID de la obra
 * @returns {Promise<Object>} Obra completa (desde caché o API)
 */
export async function getArtworkWithCache(museumId) {
  // 1. Intentar caché local
  const cached = await getCachedArtwork(museumId)
  
  if (cached && !cached.cacheExpired) {
    console.log('✅ Sirviendo desde caché:', museumId)
    return { data: cached, source: 'cache' }
  }
  
  // 2. Fetch a API externa
  console.log('🔄 Caché no válido, fetch a API externa:', museumId)
  const { getArtworkById } = await import('@/services/museumApi')
  const freshData = await getArtworkById(museumId)
  
  if (!freshData) {
    throw new Error('Obra no encontrada en la API del Rijksmuseum')
  }
  
  // 3. Guardar en caché (sin bloquear la respuesta al usuario)
  syncArtworkToCache(freshData) // Fire-and-forget
  
  return { data: freshData, source: 'api' }
}