// Composable para gestión de interacciones sociales: likes, comentarios, follows y notificaciones

import { ref, computed } from 'vue'
import { supabase } from '@/supabase/client'

export function useCommunity() {
  // ============================================
  // ESTADO REACTIVO
  // ============================================
  
  const loading = ref(false)
  const error = ref(null)
  
  // Likes
  const likeCount = ref(0)
  const hasLiked = ref(false)
  
  // Comentarios
  const comments = ref([])
  
  // Follows
  const followerCount = ref(0)
  const followingCount = ref(0)
  const isFollowing = ref(false)
  
  // Notificaciones
  const notifications = ref([])
  const unreadCount = ref(0)

  // ============================================
  // LIKES
  // ============================================

  /**
   * Obtiene el contador de likes y si el usuario actual ha dado like
   */
  async function fetchLikeStatus(collectionId) {
    try {
      loading.value = true
      error.value = null

      // 1. Obtener contador de likes
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId)

      if (countError) throw countError
      likeCount.value = count || 0

      // 2. Verificar si el usuario actual dio like
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('collection_id', collectionId)
          .eq('user_id', authData.user.id)
          .single()

        hasLiked.value = !!userLike
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching like status:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Dar o quitar like a una colección
   */
  async function toggleLike(collectionId, userId) {
    try {
      loading.value = true
      error.value = null

      // VERIFICAR si ya existe el like
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        // Quitar like (DELETE)
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id)

        if (deleteError) throw deleteError
        hasLiked.value = false
        likeCount.value = Math.max(0, likeCount.value - 1)
      } else {
        // Dar like (INSERT)
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ collection_id: collectionId, user_id: userId })

        if (insertError) throw insertError
        hasLiked.value = true
        likeCount.value = likeCount.value + 1
      }
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error toggling like:', err)
      // Al final de toggleLike, añade este log temporal:
      console.log('toggleLike - collectionId:', collectionId, 'userId:', userId)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // COMENTARIOS
  // ============================================

  /**
   * Obtiene todos los comentarios de una colección
   */
  async function fetchComments(collectionId) {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          user_profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      comments.value = data || []

      return { success: true, data: comments.value }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching comments:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Añade un nuevo comentario
   */
  async function addComment(collectionId, userId, content) {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          collection_id: collectionId,
          user_id: userId,
          content: content.trim()
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (insertError) throw insertError
      
      // Añadir al array local
      comments.value.push(data)

      // TO-DO: Crear notificación para el dueño de la colección

      return { success: true, data }
    } catch (err) {
      error.value = err.message
      console.error('Error adding comment:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza un comentario existente
   */
  async function updateComment(commentId, content) {
    try {
      loading.value = true
      error.value = null

      const { error: updateError } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId)

      if (updateError) throw updateError

      // Actualizar array local
      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        comments.value[index].content = content.trim()
        comments.value[index].updated_at = new Date().toISOString()
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error updating comment:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Elimina un comentario
   */
  async function deleteComment(commentId) {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) throw deleteError

      // Eliminar del array local
      comments.value = comments.value.filter(c => c.id !== commentId)

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error deleting comment:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // FOLLOWS
  // ============================================

  /**
   * Obtiene el estado de follows para un perfil
   */
  async function fetchFollowStatus(targetUserId) {
    try {
      loading.value = true
      error.value = null

      // 1. Contar seguidores
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)

      if (followersError) throw followersError
      followerCount.value = followersCount || 0

      // 2. Contar siguiendo
      const { count: followingCountResult, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId)

      if (followingError) throw followingError
      followingCount.value = followingCountResult || 0

      // 3. Verificar si el usuario actual sigue a este perfil
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', authData.user.id)
          .eq('following_id', targetUserId)
          .single()

        isFollowing.value = !!followData
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching follow status:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

    /**
     * Seguir o dejar de seguir a un usuario
     */
    async function toggleFollow(targetUserId, currentUserId) {
    try {
        loading.value = true
        error.value = null

        // PRIMERO: Verificar estado actual REAL en la BD
        const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()

        const actuallyFollowing = !!existingFollow

        if (actuallyFollowing) {
        // Dejar de seguir (DELETE)
        const { error: deleteError } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId)

        if (deleteError) throw deleteError
        
        // Actualizar estado local
        isFollowing.value = false
        followerCount.value = Math.max(0, followerCount.value - 1)
        } else {
        // Seguir (INSERT)
        const { error: insertError } = await supabase
            .from('follows')
            .insert({
            follower_id: currentUserId,
            following_id: targetUserId
            })

        if (insertError) throw insertError
        
        // Actualizar estado local
        isFollowing.value = true
        followerCount.value = followerCount.value + 1
        }

        return { success: true }
    } catch (err) {
        error.value = err.message
        console.error('Error toggling follow:', err)
        return { success: false, error: err.message }
    } finally {
        loading.value = false
    }
    }

  // ============================================
  // NOTIFICACIONES
  // ============================================

  /**
   * Obtiene las notificaciones del usuario actual
   */
  async function fetchNotifications(limit = 50) {
    try {
      loading.value = true
      error.value = null

      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) {
        error.value = 'Usuario no autenticado'
        return { success: false, error: 'Usuario no autenticado' }
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      notifications.value = data || []

      // Contar no leídas
      unreadCount.value = data?.filter(n => !n.is_read).length || 0

      return { success: true, data: notifications.value }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching notifications:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Marca una notificación como leída
   */
  async function markAsRead(notificationId) {
    try {
      loading.value = true
      error.value = null

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (updateError) throw updateError

      // Actualizar array local
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        notifications.value[index].is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error marking notification as read:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async function markAllAsRead() {
    try {
      loading.value = true
      error.value = null

      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) {
        error.value = 'Usuario no autenticado'
        return { success: false, error: 'Usuario no autenticado' }
      }

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', authData.user.id)
        .eq('is_read', false)

      if (updateError) throw updateError

      // Actualizar array local
      notifications.value = notifications.value.map(n => ({ ...n, is_read: true }))
      unreadCount.value = 0

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error marking all notifications as read:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // RESET DE ESTADO
  // ============================================

  function resetState() {
    likeCount.value = 0
    hasLiked.value = false
    comments.value = []
    followerCount.value = 0
    followingCount.value = 0
    isFollowing.value = false
    notifications.value = []
    unreadCount.value = 0
    error.value = null
  }

  // ============================================
  // RETORNAR FUNCIONES Y ESTADO
  // ============================================

  return {
    // Estado
    loading,
    error,
    likeCount,
    hasLiked,
    comments,
    followerCount,
    followingCount,
    isFollowing,
    notifications,
    unreadCount,
    
    // Likes
    fetchLikeStatus,
    toggleLike,
    
    // Comentarios
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    
    // Follows
    fetchFollowStatus,
    toggleFollow,
    
    // Notificaciones
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    
    // Utilidades
    resetState
  }
}