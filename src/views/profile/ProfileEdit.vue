<template>
  <div class="profile-edit-view">
    <TopNav />

    <main class="profile-container container">
      
      <!-- Cabecera -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Editar Perfil</h1>
          <p class="page-subtitle">Gestiona tu identidad pública en Kura</p>
        </div>
        <router-link to="/dashboard" class="btn btn-outline-sm">
          Cancelar
        </router-link>
      </header>

      <div class="profile-layout">
        
        <!-- Columna Izquierda: Avatar & Preview -->
        <aside class="avatar-column">
          <div class="avatar-card">
            <div class="avatar-wrapper" @mouseenter="showAvatarOverlay = true" @mouseleave="showAvatarOverlay = false">
              <img 
                :src="avatarPreview || profile?.avatar_url || defaultAvatarUrl" 
                alt="Avatar"
                class="avatar-image"
                :class="{ 'uploading': uploading }"
              />
              
              <!-- Overlay de subida -->
              <div class="avatar-overlay" :class="{ visible: showAvatarOverlay || uploading }">
                <svg v-if="!uploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span v-if="uploading" class="spinner-mini"></span>
                <span v-else>Cambiar</span>
              </div>

              <input 
                type="file" 
                accept="image/png,image/jpeg,image/webp"
                @change="handleAvatarChange"
                :disabled="uploading"
                class="avatar-input-hidden"
              />
            </div>

            <div class="avatar-info">
              <h3>Tu imagen pública</h3>
              <p>JPG, PNG o WebP. Máx 2MB.</p>
              <p v-if="avatarError" class="text-error">{{ avatarError }}</p>
            </div>
          </div>

          <!-- Estado del perfil (Badge) -->
          <div class="status-card" :class="{ public: form.is_public }">
            <div class="status-icon">
              <svg v-if="form.is_public" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="status-text">
              <span class="label">Visibilidad</span>
              <span class="value">{{ form.is_public ? 'Público' : 'Privado' }}</span>
            </div>
          </div>
        </aside>

        <!-- Columna Derecha: Formulario -->
        <form @submit.prevent="handleSubmit" class="profile-form">
          
          <!-- Nombre Visible -->
          <div class="form-group">
            <label for="display_name" class="form-label">Nombre visible <span class="required">*</span></label>
            <input 
              id="display_name"
              v-model="form.display_name" 
              type="text" 
              required 
              minlength="2" 
              maxlength="50"
              placeholder="Ej: Ana García"
              class="form-input"
            />
            <span class="form-hint">Cómo te llamarán en la comunidad.</span>
          </div>

          <!-- Username -->
          <div class="form-group">
            <label for="username" class="form-label">Nombre de usuario</label>
            <div class="input-with-prefix">
              <span class="prefix">kura.art/</span>
              <input 
                id="username"
                v-model="form.username" 
                type="text" 
                minlength="3" 
                maxlength="30"
                placeholder="tu_usuario"
                class="form-input"
                :class="{ error: usernameError }"
              />
            </div>
            <span class="form-hint" :class="{ error: usernameError }">
              {{ usernameError || 'Solo letras minúsculas, números, guiones y guiones bajos.' }}
            </span>
          </div>

          <!-- Biografía -->
          <div class="form-group">
            <label for="bio" class="form-label">Biografía</label>
            <textarea 
              id="bio"
              v-model="form.bio" 
              rows="5" 
              maxlength="500"
              placeholder="Cuéntanos sobre tus gustos artísticos, tu formación o qué buscas en Kura..."
              class="form-input"
            />
            <div class="char-counter">
              <span>{{ form.bio?.length || 0 }}</span>/500
            </div>
          </div>

          <!-- Grid: Tipo y Ubicación -->
          <div class="form-row">
            <div class="form-group">
              <label for="user_type" class="form-label">Perfil</label>
              <div class="select-wrapper">
                <select v-model="form.user_type" id="user_type" class="form-input">
                  <option value="enthusiast">Entusiasta</option>
                  <option value="curator">Curador / Coleccionista</option>
                  <option value="artist">Artista / Creador</option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div class="form-group">
              <label for="location" class="form-label">Ubicación</label>
              <input 
                id="location"
                v-model="form.location" 
                type="text" 
                placeholder="Madrid, ES"
                class="form-input"
              />
            </div>
          </div>

          <!-- Website -->
          <div class="form-group">
            <label for="website_url" class="form-label">Sitio Web</label>
            <input 
              id="website_url"
              v-model="form.website_url" 
              type="url" 
              placeholder="https://tuportfolio.com"
              class="form-input"
            />
          </div>

          <!-- Visibilidad Checkbox (Estilizado) -->
          <div class="form-group checkbox-group">
            <label class="toggle-switch">
              <input type="checkbox" v-model="form.is_public" />
              <span class="slider"></span>
              <div class="toggle-labels">
                <span class="label-text">Hacer perfil visible públicamente</span>
                <span class="sub-text">Si es privado, solo tú podrás ver tu perfil.</span>
              </div>
            </label>
          </div>

          <!-- Mensajes de Estado Globales -->
          <transition name="fade">
            <div v-if="error" class="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ error }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="success" class="alert alert-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Perfil actualizado correctamente</span>
            </div>
          </transition>

          <!-- Botones de Acción -->
          <div class="form-actions">
            <button type="submit" :disabled="loading || uploading" class="btn btn-primary btn-lg">
              <span v-if="loading" class="spinner-mini-white"></span>
              <span v-else>Guardar Cambios</span>
            </button>
          </div>

        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import TopNav from '@/components/common/TopNav.vue'

const { user, signOut, fetchProfile, updateProfile, uploadProfileAvatar, getDefaultAvatar } = useAuth()
const router = useRouter()

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
const usernameError = ref(null)
const showAvatarOverlay = ref(false)

const defaultAvatarUrl = computed(() => 
  getDefaultAvatar(profile.value?.display_name || form.value.display_name)
)

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

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'El archivo supera los 2MB'
    return
  }
  
  avatarPreview.value = URL.createObjectURL(file)
  uploading.value = true
  avatarError.value = null
  showAvatarOverlay.value = false
  
  const result = await uploadProfileAvatar(file)
  
  if (result.success) {
    await loadProfile()
  } else {
    avatarError.value = result.error || 'Error al subir la imagen'
    avatarPreview.value = null
  }
  
  uploading.value = false
  event.target.value = ''
}

const handleSubmit = async () => {
  // Validación Username
  const usernameRegex = /^[a-z0-9][a-z0-9_-]*$/
  if (form.value.username && !usernameRegex.test(form.value.username)) {
    usernameError.value = 'Formato no válido. Usa solo minúsculas, números y guiones.'
    return
  }
  usernameError.value = null

  loading.value = true
  error.value = null
  success.value = false
  
  const result = await updateProfile(form.value)
  
  if (result.success) {
    success.value = true
    profile.value = { ...profile.value, ...form.value }
    setTimeout(() => { success.value = false }, 4000)
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>

<style scoped>
/* ============================================
   LAYOUT GENERAL
   ============================================ */
.profile-edit-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: var(--spacing-xxl);
}

.profile-container {
  padding-top: var(--spacing-xl);
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xxl);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

/* ============================================
   LAYOUT DE 2 COLUMNAS
   ============================================ */
.profile-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-xxl);
}

@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
}

/* ============================================
   COLUMNA IZQUIERDA: AVATAR
   ============================================ */
.avatar-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.avatar-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto var(--spacing-md);
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-subtle);
  transition: border-color var(--transition-fast);
}

.avatar-wrapper:hover {
  border-color: var(--kura-gold);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.avatar-image.uploading {
  opacity: 0.6;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 7, 6, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.avatar-overlay.visible {
  opacity: 1;
}

.avatar-overlay svg {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  color: var(--kura-gold);
}

.avatar-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.avatar-info h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.avatar-info p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.text-error {
  color: #ff6b6b;
  margin-top: 8px;
  font-size: 0.85rem;
}

/* Status Card */
.status-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
}

.status-card.public {
  border-color: rgba(12, 126, 126, 0.3);
  background: rgba(12, 126, 126, 0.05);
}

.status-icon {
  color: var(--text-muted);
}

.status-card.public .status-icon {
  color: var(--kura-bright-teal);
}

.status-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ============================================
   FORMULARIO
   ============================================ */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.required {
  color: var(--kura-gold);
}

.form-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-family: var(--font-main);
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
}

.form-input.error {
  border-color: #ff6b6b;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.form-hint.error {
  color: #ff6b6b;
}

.char-counter {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Input con prefijo */
.input-with-prefix {
  display: flex;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
}

.input-with-prefix:focus-within {
  border-color: var(--kura-bright-teal);
}

.prefix {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border-subtle);
  font-family: monospace;
}

.input-with-prefix .form-input {
  border: none;
  border-radius: 0;
  flex: 1;
}

.input-with-prefix .form-input:focus {
  box-shadow: none;
}

/* Select Wrapper */
.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  width: 100%;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

/* Toggle Switch */
.checkbox-group {
  margin-top: var(--spacing-md);
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.slider {
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 24px;
  position: relative;
  transition: background var(--transition-fast);
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
}

.slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.toggle-switch input:checked + .slider {
  background: var(--kura-bright-teal);
  border-color: var(--kura-bright-teal);
}

.toggle-switch input:checked + .slider::after {
  transform: translateX(20px);
  background: #fff;
}

.toggle-labels {
  display: flex;
  flex-direction: column;
}

.label-text {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

.sub-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* ============================================
   ALERTAS Y BOTONES
   ============================================ */
.alert {
  padding: 1rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 500;
}

.alert-error {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.alert-success {
  background: rgba(12, 126, 126, 0.15);
  color: var(--kura-bright-teal);
  border: 1px solid rgba(12, 126, 126, 0.3);
}

.form-actions {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--kura-bright-teal);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0f9e9e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(12, 126, 126, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-sm {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-outline-sm:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

/* Spinners */
.spinner-mini {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-mini-white {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transiciones */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  .btn-outline-sm {
    align-self: flex-start;
  }
}
</style>