<template>
  <div class="collection-form-component">
    <form @submit.prevent="handleSubmit" class="form">
      
      <!-- Título -->
      <div class="form-group">
        <label for="title" class="form-label">
          Título <span class="required">*</span>
        </label>
        <input
          id="title"
          v-model="localFormData.title"
          type="text"
          placeholder="Ej: Impresionismo Francés, Maestros del Renacimiento..."
          class="form-input"
          :class="{ 'input-error': errors.title }"
          required
          @blur="validateTitle"
        />
        <span v-if="errors.title" class="error-message">
          {{ errors.title }}
        </span>
      </div>

      <!-- Descripción -->
      <div class="form-group">
        <label for="description" class="form-label">Descripción</label>
        <textarea
          id="description"
          v-model="localFormData.description"
          placeholder="Describe el concepto de tu colección, artistas incluidos o el periodo histórico..."
          class="form-textarea"
          rows="4"
          :maxlength="500"
        ></textarea>
        <div class="char-counter">
          {{ localFormData.description.length }} / 500
        </div>
      </div>

      <!-- URL de portada -->
      <div class="form-group">
        <label for="cover_image_url" class="form-label">
          Imagen de portada <span class="optional">(opcional)</span>
        </label>
        <div class="input-with-hint">
          <input
            id="cover_image_url"
            v-model="localFormData.cover_image_url"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            class="form-input"
            :class="{ 'input-error': errors.cover_image_url }"
            @blur="validateCoverUrl"
          />
          <p class="form-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Deja vacío para usar automáticamente la primera obra de la colección.
          </p>
        </div>
        <span v-if="errors.cover_image_url" class="error-message">
          {{ errors.cover_image_url }}
        </span>
        
        <!-- Preview de portada -->
        <div v-if="localFormData.cover_image_url && !previewError" class="cover-preview-wrapper">
          <div class="cover-preview">
            <img
              :src="localFormData.cover_image_url"
              alt="Vista previa"
              class="preview-image"
              @error="handlePreviewError"
            />
          </div>
          <span class="preview-label">Vista previa</span>
        </div>
        <div v-else-if="previewError" class="preview-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>No se pudo cargar la imagen. Verifica la URL.</span>
        </div>
      </div>

      <!-- Visibilidad -->
      <div class="form-group">
        <label class="form-label">Visibilidad</label>
        <div class="visibility-grid">
          
          <!-- Opción Pública -->
          <label class="visibility-card" :class="{ active: localFormData.is_public === true }">
            <input
              v-model="localFormData.is_public"
              type="radio"
              :value="true"
              class="vis-input"
            />
            <div class="vis-icon public">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <div class="vis-content">
              <span class="vis-title">Pública</span>
              <span class="vis-desc">Cualquiera puede verla</span>
            </div>
            <div class="vis-check" v-if="localFormData.is_public === true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

          <!-- Opción Privada -->
          <label class="visibility-card" :class="{ active: localFormData.is_public === false }">
            <input
              v-model="localFormData.is_public"
              type="radio"
              :value="false"
              class="vis-input"
            />
            <div class="vis-icon private">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="vis-content">
              <span class="vis-title">Privada</span>
              <span class="vis-desc">Solo tú puedes verla</span>
            </div>
            <div class="vis-check" v-if="localFormData.is_public === false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </label>

        </div>
      </div>

      <!-- Error Global -->
      <transition name="fade">
        <div v-if="submitError" class="global-alert error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ submitError }}</span>
        </div>
      </transition>

      <!-- Botones -->
      <div class="form-actions">
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn btn-outline"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="btn-loading">
            <span class="spinner"></span>
            <span>Guardando...</span>
          </span>
          <span v-else>
            {{ isEditMode ? 'Actualizar' : 'Crear' }} Colección
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      title: '',
      description: '',
      cover_image_url: '',
      is_public: true
    })
  },
  isEditMode: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel', 'error'])

const localFormData = reactive({ ...props.initialData })
const errors = reactive({ title: '', cover_image_url: '' })
const submitError = ref('')
const previewError = ref(false)

const isFormValid = computed(() => {
  return localFormData.title.trim().length >= 3 && 
         localFormData.title.trim().length <= 100 &&
         !errors.title &&
         !errors.cover_image_url
})

const validateTitle = () => {
  const title = localFormData.title.trim()
  if (!title) { errors.title = 'El título es obligatorio'; return false }
  if (title.length < 3) { errors.title = 'Mínimo 3 caracteres'; return false }
  if (title.length > 100) { errors.title = 'Máximo 100 caracteres'; return false }
  errors.title = ''
  return true
}

const validateCoverUrl = () => {
  const url = localFormData.cover_image_url.trim()
  if (!url) { errors.cover_image_url = ''; return true }
  try {
    new URL(url)
    errors.cover_image_url = ''
    previewError.value = false
    return true
  } catch {
    errors.cover_image_url = 'URL no válida'
    return false
  }
}

const handlePreviewError = () => {
  previewError.value = true
}

const handleSubmit = () => {
  submitError.value = ''
  if (!validateTitle() || !validateCoverUrl()) {
    emit('error', 'Revisa los campos del formulario')
    return
  }
  
  emit('submit', {
    title: localFormData.title.trim(),
    description: localFormData.description.trim(),
    cover_image_url: localFormData.cover_image_url.trim() || null,
    is_public: localFormData.is_public
  })
}

watch(() => props.initialData, (newData) => {
  Object.assign(localFormData, newData)
  errors.title = ''
  errors.cover_image_url = ''
  submitError.value = ''
  previewError.value = false
}, { deep: true })
</script>

<style scoped>
/* ============================================
   GENERAL
   ============================================ */
.collection-form-component {
  width: 100%;
}

.form {
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

.required { color: var(--kura-gold); }
.optional { color: var(--text-muted); font-weight: 400; }

/* ============================================
   INPUTS
   ============================================ */
.form-input,
.form-textarea {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-family: var(--font-main);
  font-size: 0.95rem;
  transition: all var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
}

.form-input.input-error,
.form-textarea.input-error {
  border-color: #ff6b6b;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-with-hint {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.error-message {
  font-size: 0.8rem;
  color: #ff6b6b;
  font-weight: 500;
}

.char-counter {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ============================================
   PREVIEW IMAGEN
   ============================================ */
.cover-preview-wrapper {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.cover-preview {
  width: 100%;
  max-width: 240px;
  aspect-ratio: 16/9;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  background: #000;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #ff6b6b;
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--radius-sm);
}

.preview-error svg { flex-shrink: 0; }

/* ============================================
   VISIBILIDAD
   ============================================ */
.visibility-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.visibility-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  gap: 8px;
}

.vis-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.visibility-card:hover {
  border-color: var(--text-muted);
  background: var(--bg-tertiary);
}

.visibility-card.active {
  border-color: var(--kura-bright-teal);
  background: rgba(12, 126, 126, 0.1);
}

.vis-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 4px;
}

.vis-icon.public { color: var(--kura-bright-teal); background: rgba(12, 126, 126, 0.2); }
.vis-icon.private { color: var(--text-muted); background: rgba(255,255,255,0.05); }

.vis-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vis-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.vis-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.vis-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--kura-bright-teal);
  background: var(--bg-primary);
  border-radius: 50%;
  padding: 2px;
}

/* ============================================
   ALERTAS & BOTONES
   ============================================ */
.global-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}

.global-alert.error {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--spacing-sm);
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
  border: 1px solid transparent;
}

.btn-outline {
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--text-primary);
  color: var(--text-primary);
  background: var(--bg-tertiary);
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* Responsive */
@media (max-width: 640px) {
  .visibility-grid { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column-reverse; }
  .btn { width: 100%; }
}
</style>