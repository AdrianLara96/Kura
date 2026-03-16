import { ref, computed } from 'vue'
import { supabase } from '@/supabase/client'
import { useAuth } from './useAuth'

/**
 * Composable para gestionar colecciones de arte
 * @returns {Object} Métodos y estado para trabajar con colecciones
 */
export function useCollections() {
  // ─────────────────────────────────────────────────────────────
  // ESTADO REACTIVO (variables que actualizan la UI automáticamente)
  // ─────────────────────────────────────────────────────────────
  
  const collections = ref([])           // Lista de colecciones
  const currentCollection = ref(null)   // Colección seleccionada (detalle)
  const items = ref([])                 // Items de una colección
  const loading = ref(false)            // Estado de carga
  const error = ref(null)               // Errores de operaciones
  
  // Obtenemos el usuario actual del composable de Auth
  const { user } = useAuth()
  
  // ─────────────────────────────────────────────────────────────
  // PROPIEDADES COMPUTADAS (valores derivados del estado)
  // ─────────────────────────────────────────────────────────────
  
  // ¿El usuario actual es dueño de la colección?
  const isOwner = computed(() => {
    if (!currentCollection.value || !user.value) return false
    return currentCollection.value.user_id === user.value.id
  })
  
  // ─────────────────────────────────────────────────────────────
  // MÉTODOS - OPERACIONES CON COLECCIONES
  // ─────────────────────────────────────────────────────────────
  
  /**
   * Obtener todas las colecciones públicas (para galería)
   * @param {number} limit - Número máximo de colecciones a traer
   */
  async function fetchPublicCollections(limit = 20) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select(`
          *,
          user_profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          collection_items (
            museum_artworks (
              id,
              title,
              artist_name,
              thumbnail_url
            )
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (fetchError) throw fetchError
      collections.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching public collections:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Obtener las colecciones del usuario actual (para "Mis Colecciones")
   */
  async function fetchMyCollections() {
    if (!user.value) {
      error.value = 'No hay usuario autenticado'
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select(`
          *,
          collection_items (
            museum_artworks (
              id,
              title,
              thumbnail_url
            )
          )
        `)
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      collections.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching my collections:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Obtener una colección específica por su ID
   * @param {string} collectionId - UUID de la colección
   */
  async function fetchCollectionById(collectionId) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select(`
          *,
          user_profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          collection_items (
            id,
            position,
            user_note,
            added_at,
            museum_artworks (
              id,
              museum_name,
              title,
              artist_name,
              image_url,
              thumbnail_url,
              creation_date,
              period
            )
          )
        `)
        .eq('id', collectionId)
        .single()
      
      if (fetchError) throw fetchError
      
      currentCollection.value = data
      items.value = data?.collection_items || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching collection:', err)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Crear una nueva colección
   * @param {Object} collectionData - Datos de la colección
   * @returns {Object|null} La colección creada o null si falla
   */
  async function createCollection(collectionData) {
    if (!user.value) {
      error.value = 'Debes iniciar sesión para crear colecciones'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const newCollection = {
        user_id: user.value.id,
        title: collectionData.title,
        description: collectionData.description || null,
        cover_image_url: collectionData.cover_image_url || null,
        is_public: collectionData.is_public ?? true
      }
      
      const { data, error: insertError } = await supabase
        .from('collections')
        .insert(newCollection)
        .select()
        .single()
      
      if (insertError) throw insertError
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error creating collection:', err)
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Actualizar una colección existente
   * @param {string} collectionId - UUID de la colección
   * @param {Object} updateData - Datos a actualizar
   * @returns {boolean} true si éxito, false si falla
   */
  async function updateCollection(collectionId, updateData) {
    loading.value = true
    error.value = null
    
    try {
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
      
      if (updateError) throw updateError
      
      // Actualizar la colección en el estado local si es la actual
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = { ...currentCollection.value, ...updateData }
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error updating collection:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Eliminar una colección
   * @param {string} collectionId - UUID de la colección
   * @returns {boolean} true si éxito, false si falla
   */
  async function deleteCollection(collectionId) {
    loading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
      
      if (deleteError) throw deleteError
      
      // Eliminar del estado local si es la colección actual
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = null
      }
      
      // Eliminar de la lista si existe
      collections.value = collections.value.filter(c => c.id !== collectionId)
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting collection:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // MÉTODOS - OPERACIONES CON ITEMS DE COLECCIÓN
  // ─────────────────────────────────────────────────────────────
  
  /**
   * Añadir una obra a una colección
   * @param {string} collectionId - UUID de la colección
   * @param {string} artworkId - UUID de la obra
   * @param {string} userNote - Nota opcional del usuario
   * @returns {Object|null} El item creado o null si falla
   */
  async function addArtworkToCollection(collectionId, artworkId, userNote = '') {
    loading.value = true
    error.value = null
    
    try {
      // Obtener la posición más alta actual para añadir al final
      const { data: existingItems } = await supabase
        .from('collection_items')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1)
      
      const newPosition = existingItems && existingItems.length > 0 
        ? existingItems[0].position + 1 
        : 1
      
      const newItem = {
        collection_id: collectionId,
        museum_artwork_id: artworkId,
        position: newPosition,
        user_note: userNote || null
      }
      
      const { data, error: insertError } = await supabase
        .from('collection_items')
        .insert(newItem)
        .select(`
          *,
          museum_artworks (
            id,
            title,
            artist_name,
            thumbnail_url
          )
        `)
        .single()
      
      if (insertError) throw insertError
      
      // Actualizar estado local
      items.value.push(data)
      
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error adding artwork to collection:', err)
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Eliminar una obra de una colección
   * @param {string} itemId - UUID del item en collection_items
   * @returns {boolean} true si éxito, false si falla
   */
  async function removeArtworkFromCollection(itemId) {
    loading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('collection_items')
        .delete()
        .eq('id', itemId)
      
      if (deleteError) throw deleteError
      
      // Actualizar estado local
      items.value = items.value.filter(item => item.id !== itemId)
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error removing artwork from collection:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Actualizar la nota de un item en una colección
   * @param {string} itemId - UUID del item
   * @param {string} note - Nueva nota
   * @returns {boolean} true si éxito, false si falla
   */
  async function updateItemNote(itemId, note) {
    loading.value = true
    error.value = null
    
    try {
      const { error: updateError } = await supabase
        .from('collection_items')
        .update({ user_note: note })
        .eq('id', itemId)
      
      if (updateError) throw updateError
      
      // Actualizar estado local
      const itemIndex = items.value.findIndex(item => item.id === itemId)
      if (itemIndex !== -1) {
        items.value[itemIndex].user_note = note
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error updating item note:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Incrementar el contador de vistas de una colección
   * @param {string} collectionId - UUID de la colección
   */
  async function incrementViewCount(collectionId) {
    try {
      await supabase.rpc('increment_collection_views', { 
        collection_id: collectionId 
      })
    } catch (err) {
      console.error('Error incrementing view count:', err)
      // No bloqueamos la UX si falla el contador
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // LIMPIEZA Y RESET
  // ─────────────────────────────────────────────────────────────
  
  /**
   * Limpiar el estado del composable
   */
  function resetState() {
    collections.value = []
    currentCollection.value = null
    items.value = []
    error.value = null
    loading.value = false
  }
  
  // ─────────────────────────────────────────────────────────────
  // EXPORTAR TODO LO QUE NECESITAN LOS COMPONENTES
  // ─────────────────────────────────────────────────────────────
  
  return {
    // Estado
    collections,
    currentCollection,
    items,
    loading,
    error,
    isOwner,
    
    // Métodos de colecciones
    fetchPublicCollections,
    fetchMyCollections,
    fetchCollectionById,
    createCollection,
    updateCollection,
    deleteCollection,
    
    // Métodos de items
    addArtworkToCollection,
    removeArtworkFromCollection,
    updateItemNote,
    
    // Utilidades
    incrementViewCount,
    resetState
  }
}