<!-- src/views/profile/ProfileEdit.vue -->
<template>
  <div class="profile-edit">
    <h1>✏️ Editar Perfil</h1>
    
    <!-- Avatar Section -->
    <div class="avatar-section">
        <img 
            :src="avatarPreview || profile?.avatar_url || defaultAvatarUrl" 
            alt="Avatar"
            class="avatar-preview"
        />
        <input 
            type="file" 
            accept="image/png,image/jpeg,image/webp"
            @change="handleAvatarChange"
            :disabled="uploading"
            class="avatar-input"
        />
        <p v-if="uploading" class="hint">Subiendo...</p>
        <p v-if="avatarError" class="error">{{ avatarError }}</p>
    </div>
    
    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="profile-form">
      <div class="form-group">
        <label>Nombre visible *</label>
        <input 
          v-model="form.display_name" 
          type="text" 
          required 
          minlength="2" 
          maxlength="50"
          placeholder="Tu nombre artístico"
        />
      </div>
      
      <div class="form-group">
        <label>Nombre de usuario (para tu URL)</label>
        <input 
          v-model="form.username" 
          type="text" 
          minlength="3" 
          maxlength="30"
          placeholder="ej: adrian_curator"
          title="Solo letras minúsculas, números, guiones y guiones bajos"
        />
        <small>Sin espacios, solo: a-z, 0-9, _, -</small>
      </div>
      
      <div class="form-group">
        <label>Biografía</label>
        <textarea 
          v-model="form.bio" 
          rows="4" 
          maxlength="500"
          placeholder="Cuéntanos sobre ti y tus intereses artísticos..."
        />
        <small>{{ form.bio?.length || 0 }}/500</small>
      </div>
      
      <div class="form-group">
        <label>Tipo de usuario</label>
        <select v-model="form.user_type">
          <option value="enthusiast">🎨 Entusiasta del arte</option>
          <option value="curator">🏛️ Curador / Coleccionista</option>
          <option value="artist">✍️ Artista / Creador</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Ubicación (opcional)</label>
        <input v-model="form.location" type="text" placeholder="Madrid, España" />
      </div>
      
      <div class="form-group">
        <label>Sitio web (opcional)</label>
        <input v-model="form.website_url" type="url" placeholder="https://tuportfolio.com" />
      </div>
      
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" v-model="form.is_public" />
          Mi perfil es visible públicamente
        </label>
      </div>
      
      <!-- Feedback -->
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">¡Perfil actualizado! ✅</p>
      
      <!-- Botones -->
      <div class="actions">
        <button type="submit" :disabled="loading || uploading">
          {{ loading ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <router-link to="/dashboard" class="btn-secondary">Cancelar</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { user, fetchProfile, updateProfile, uploadProfileAvatar, getDefaultAvatar } = useAuth()
const router = useRouter()

// Estado del formulario
const form = ref({
  display_name: '',
  username: '',
  bio: '',
  user_type: 'enthusiast',
  location: '',
  website_url: '',
  is_public: true
})

const profile = ref(null)
const avatarPreview = ref(null)
const loading = ref(false)
const uploading = ref(false)
const error = ref(null)
const success = ref(false)
const avatarError = ref(null)

const defaultAvatarUrl = computed(() => 
  getDefaultAvatar(profile.value?.display_name || form.value.display_name)
)

// Cargar perfil al montar
onMounted(async () => {
  if (!user.value) {
    router.push('/login')
    return
  }
  await loadProfile()
})

const loadProfile = async () => {
  const data = await fetchProfile()
  if (data) {
    profile.value = data
    // Rellenar formulario con datos existentes
    form.value = {
      display_name: data.display_name || '',
      username: data.username || '',
      bio: data.bio || '',
      user_type: data.user_type || 'enthusiast',
      location: data.location || '',
      website_url: data.website_url || '',
      is_public: data.is_public ?? true
    }
  }
}

// Manejar selección de avatar
const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  // Validación básica
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'Máximo 2MB'
    return
  }
  
  // Preview inmediato (optimista)
  avatarPreview.value = URL.createObjectURL(file)
  uploading.value = true
  avatarError.value = null
  
  // Subir a Storage
  const result = await uploadProfileAvatar(file)
  
  if (result.success) {
    // Recargar perfil para reflejar cambios
    await loadProfile()
  } else {
    avatarError.value = result.error || 'Error al subir avatar'
    avatarPreview.value = null // Revertir preview
  }
  
  uploading.value = false
  // Limpiar input file para permitir re-seleccionar el mismo archivo
  event.target.value = ''
}

// Guardar cambios del formulario
const handleSubmit = async () => {
  // Validar username
  const usernameRegex = /^[a-z0-9][a-z0-9_-]*$/
  if (form.value.username && !usernameRegex.test(form.value.username)) {
    error.value = 'El nombre de usuario solo puede contener letras minúsculas, números, guiones y guiones bajos. No puede empezar con guión.'
    return
  }
  loading.value = true
  error.value = null
  success.value = false
  
  // Validación extra: username único (opcional, se puede hacer con RLS)
  if (form.value.username && form.value.username !== profile.value?.username) {
    // Aquí podrías verificar unicidad con una llamada a BD
    // Por ahora, dejamos que la restricción UNIQUE de la tabla lo maneje
  }
  
  const result = await updateProfile(form.value)
  
  if (result.success) {
    success.value = true
    // Refrescar perfil local
    profile.value = { ...profile.value, ...form.value }
    
    // Opcional: redirigir al perfil público después de guardar
    // setTimeout(() => router.push(`/profile/${form.value.username}`), 1500)
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>

<style scoped>
/* Estilos mínimos funcionales - sin diseño, solo estructura */
.profile-edit {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}

.avatar-section {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar-preview {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
  margin-bottom: 1rem;
}

.avatar-input {
  display: block;
  margin: 0 auto;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.form-group small {
  color: #666;
  font-size: 0.85rem;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0;
}

.success {
  color: #2e7d32;
  background: #e8f5e9;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.actions button {
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.actions button:disabled {
  background: #90a4ae;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #e0e0e0;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  align-self: center;
}
</style>