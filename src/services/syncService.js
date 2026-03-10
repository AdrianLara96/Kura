// src/services/syncService.js (esqueleto)
export const syncService = {
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
  
  async syncArtwork(museumId, museumName) {
    // 1. Verificar si existe en BD y si está actualizado
    // 2. Si no: fetch a API externa
    // 3. Guardar en museum_artworks con last_synced_at
    // 4. Retornar dato (de cache o fresco)
  }
}