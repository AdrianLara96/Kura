import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase/client'
import { uploadAvatar, deleteOldAvatar, getDefaultAvatar } from '@/services/storageService'

// Estado GLOBAL compartido entre todas las instancias del composable
let globalUser = ref(null)
let globalSession = ref(null)
let globalLoading = ref(true)
let globalError = ref(null)
let authListenerInitialized = false

export function useAuth() {
  const router = useRouter()

  // Estado local que apunta al global (reactividad compartida)
  const user = globalUser
  const session = globalSession
  const loading = globalLoading
  const error = globalError

  const isAuthenticated = computed(() => !!session.value)

  const loadSession = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      session.value = data.session
      user.value = data.session?.user ?? null
      
    } catch (err) {
      console.error('Error cargando sesión:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const setupAuthListener = () => {
    // Evitar múltiples listeners
    if (authListenerInitialized) return
    authListenerInitialized = true
    
    supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth event:', event)
      
      session.value = newSession
      user.value = newSession?.user ?? null
      
      if (event === 'SIGNED_IN' && router.currentRoute.value.path === '/login') {
        router.push('/dashboard')
      }
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })
  }

  const signUp = async (email, password, displayName) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      })
      
      if (signUpError) throw signUpError
      
      return { success: true, user: data.user }
      
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      return { success: true, user: data.user }
      
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // === MÉTODOS DE PERFIL ===
  
  const fetchProfile = async (userId = null) => {
    try {
      const targetId = userId || user.value?.id
      if (!targetId) return null
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetId)
        .single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user.value?.id) throw new Error('Usuario no autenticado')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
        .select()
        .single()
      
      if (error) throw error
      
      // Actualizar metadata en auth.users si cambia display_name
      if (updates.display_name) {
        await supabase.auth.updateUser({ 
          data: { display_name: updates.display_name } 
        })
      }
      
      return { success: true, profile: data }
    } catch (err) {
      console.error('Error updating profile:', err)
      return { success: false, error: err.message }
    }
  }

  const uploadProfileAvatar = async (file) => {
    console.log('🚀 [AVATAR] Iniciando subida...', file.name)
    
    if (!user.value?.id) {
      return { success: false, error: 'No autenticado' }
    }
    
    // 1. Subir archivo
    const uploadResult = await uploadAvatar(file, user.value.id)
    
    if (!uploadResult.success) return uploadResult
    
    // 2. Eliminar avatar anterior
    const currentProfile = await fetchProfile()
    if (currentProfile?.avatar_url) {
      await deleteOldAvatar(currentProfile.avatar_url)
    }
    
    // 3. Actualizar perfil
    const updateResult = await updateProfile({ avatar_url: uploadResult.url })
    
    return updateResult
  }

  // Inicializar 
  onMounted(async () => {
    await loadSession()
    setupAuthListener()
  })

  return {
    // Estado
    user,
    session,
    loading,
    error,
    isAuthenticated,
    
    // Auth methods
    loadSession,
    signUp,
    signIn,
    signOut,
    
    // Profile methods
    fetchProfile,
    updateProfile,
    uploadProfileAvatar,
    
    // Helpers
    getDefaultAvatar
  }
}