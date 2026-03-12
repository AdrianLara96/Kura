import { supabase } from '@/supabase/client'

const BUCKET = 'avatars'

/**
 * Construir URL pública manualmente (más fiable)
 * @param {string} bucket   - Nombre del bucket
 * @param {string} path     - Ruta del archivo dentro del bucket
 * @returns {string}        - URL pública completa
 */
export function buildPublicUrl(bucket, path) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // Asegurar que no haya doble slash
  const baseUrl = supabaseUrl?.replace(/\/$/, '')
  const cleanPath = path?.replace(/^\//, '')
  return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}

/**
 * Subir un archivo de avatar para el usuario actual
 * @param {File} file       - El archivo a subir
 * @param {string} userId   - ID del usuario (auth.uid())
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export async function uploadAvatar(file, userId) {
  try {
    // Validar tipo y tamaño
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    const maxSize = 2 * 1024 * 1024 // 2MB
    
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Formato no válido. Usa PNG, JPG o WebP.' }
    }
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo es muy grande. Máximo 2MB.' }
    }

    // Generar path único: userId/timestamp.extension
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const path = `${userId}/${fileName}`  // sin bucket aquí

    console.log('📤 Subiendo avatar:', { userId, fileName, path })

    // Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false // Siempre nuevo nombre, no sobrescribir
      })

    if (uploadError) {
      console.error('❌ Error de upload:', uploadError)
      throw uploadError
    }

    // Construir URL pública manualmente (más fiable)
    const publicUrl = buildPublicUrl(BUCKET, path)
    console.log('✅ URL pública construida:', publicUrl)

    return { success: true, url: publicUrl }

  } catch (err) {
    console.error('❌ Error subiendo avatar:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Eliminar avatar anterior del usuario (limpieza)
 * @param {string} oldUrl - URL del avatar anterior (construida manualmente)
 * @returns {Promise<void>}
 */
export async function deleteOldAvatar(oldUrl) {
  if (!oldUrl || !oldUrl.includes('/storage/v1/object/public/')) {
    console.warn('⚠️ URL de avatar no válida para eliminación:', oldUrl)
    return
  }
  
  try {
    // Extraer bucket y path desde la URL manual
    // Formato: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/filename.jpg
    const urlParts = oldUrl.split('/storage/v1/object/public/')
    if (urlParts.length < 2) return
    
    const path = urlParts[1]  // Ej: "avatars/user-id/filename.jpg"
    const [bucket, ...pathParts] = path.split('/')
    const relativePath = pathParts.join('/')  // Ej: "user-id/filename.jpg"
    
    console.log('🗑️ Eliminando archivo:', { bucket, path: relativePath })
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([relativePath])
    
    if (error) {
      console.warn('⚠️ No se pudo eliminar avatar anterior:', error)
    } else {
      console.log('✅ Avatar anterior eliminado')
    }
  } catch (err) {
    console.warn('❌ Error eliminando avatar:', err)
  }
}

/**
 * Obtener URL de avatar por defecto (placeholder)
 * @param {string} displayName  - Nombre para generar un color/letra
 * @returns {string}            URL de placeholder
 */
export function getDefaultAvatar(displayName) {
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U'
  const color = Math.floor(Math.random() * 360)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=hsl(${color},70%,50%)&color=fff&size=128`
}