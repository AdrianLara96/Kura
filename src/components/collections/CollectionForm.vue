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
          placeholder="Ej: Arte Renacentista, Mis Favoritos..."
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
          placeholder="Describe tu colección..."
          class="form-textarea"
          rows="4"
          :maxlength="500"
        ></textarea>
        <div class="char-counter">
          {{ localFormData.description.length }} / 500 caracteres
        </div>
      </div>

      <!-- URL de portada -->
      <div class="form-group">
        <label for="cover_image_url" class="form-label">
          URL de portada <span class="optional">(opcional)</span>
        </label>
        <input
          id="cover_image_url"
          v-model="localFormData.cover_image_url"
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          class="form-input"
          :class="{ 'input-error': errors.cover_image_url }"
          @blur="validateCoverUrl"
        />
        <span v-if="errors.cover_image_url" class="error-message">
          {{ errors.cover_image_url }}
        </span>
        <p class="form-hint">
          💡 Deja vacío para usar automáticamente la primera obra de la colección
        </p>
        
        <!-- Preview de portada -->
        <div v-if="localFormData.cover_image_url" class="cover-preview">
          <img
            :src="localFormData.cover_image_url"
            alt="Vista previa de portada"
            class="preview-image"
            @error="handlePreviewError"
          />
        </div>
      </div>

      <!-- Visibilidad -->
      <div class="form-group">
        <label class="form-label">Visibilidad</label>
        <div class="toggle-group">
          <label class="toggle-option">
            <input
              v-model="localFormData.is_public"
              type="radio"
              :value="true"
            />
            <div class="toggle-content">
              <span class="toggle-icon">🌍</span>
              <span class="toggle-text">
                <strong>Pública</strong>
                <small>Cualquiera puede verla</small>
              </span>
            </div>
          </label>
          <label class="toggle-option">
            <input
              v-model="localFormData.is_public"
              type="radio"
              :value="false"
            />
            <div class="toggle-content">
              <span class="toggle-icon">🔒</span>
              <span class="toggle-text">
                <strong>Privada</strong>
                <small>Solo tú puedes verla</small>
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Mensajes de error generales -->
      <div v-if="submitError" class="form-error-global">
        ⚠️ {{ submitError }}
      </div>

      <!-- Botones de acción -->
      <div class="form-actions">
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn btn-cancel"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-submit"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="btn-loading">
            <span class="spinner"></span>
            Guardando...
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

// ─────────────────────────────────────────────────────────────
// PROPS (datos que recibe el componente desde fuera)
// ─────────────────────────────────────────────────────────────

const props = defineProps({
  /**
   * Datos iniciales del formulario
   * - Para crear: objeto vacío o con defaults
   * - Para editar: datos de la colección existente
   */
  initialData: {
    type: Object,
    default: () => ({
      title: '',
      description: '',
      cover_image_url: '',
      is_public: true
    })
  },
  
  /**
   * ¿Es modo edición? (cambia texto de botones y validaciones)
   */
  isEditMode: {
    type: Boolean,
    default: false
  },
  
  /**
   * Estado de carga externo (para deshabilitar botón)
   */
  loading: {
    type: Boolean,
    default: false
  }
})

// ─────────────────────────────────────────────────────────────
// EMITS (eventos que el componente emite hacia fuera)
// ─────────────────────────────────────────────────────────────

const emit = defineEmits([
  'submit',    // Cuando se envía el formulario correctamente
  'cancel',    // Cuando el usuario cancela
  'error'      // Cuando hay un error de validación
])

// ─────────────────────────────────────────────────────────────
// ESTADO LOCAL DEL COMPONENTE
// ─────────────────────────────────────────────────────────────

// Copia reactiva de los datos iniciales (para no mutar props directamente)
const localFormData = reactive({ ...props.initialData })

// Errores de validación por campo
const errors = reactive({
  title: '',
  cover_image_url: ''
})

// Error general del submit
const submitError = ref('')

// ─────────────────────────────────────────────────────────────
// PROPIEDADES COMPUTADAS
// ─────────────────────────────────────────────────────────────

/**
 * ¿El formulario es válido para enviar?
 */
const isFormValid = computed(() => {
  return localFormData.title.trim().length > 0 && 
         localFormData.title.trim().length <= 100 &&
         !errors.title &&
         !errors.cover_image_url
})

// ─────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────

/**
 * Validar título
 */
const validateTitle = () => {
  const title = localFormData.title.trim()
  
  if (!title) {
    errors.title = 'El título es obligatorio'
    return false
  }
  
  if (title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres'
    return false
  }
  
  if (title.length > 100) {
    errors.title = 'El título no puede superar los 100 caracteres'
    return false
  }
  
  errors.title = ''
  return true
}

/**
 * Validar URL de portada
 */
const validateCoverUrl = () => {
  const url = localFormData.cover_image_url.trim()
  
  // Si está vacío, es válido (es opcional)
  if (!url) {
    errors.cover_image_url = ''
    return true
  }
  
  // Validar formato URL
  try {
    new URL(url)
    errors.cover_image_url = ''
    return true
  } catch {
    errors.cover_image_url = 'Por favor, introduce una URL válida'
    return false
  }
}

/**
 * Validar todo el formulario
 */
const validateForm = () => {
  const titleValid = validateTitle()
  const urlValid = validateCoverUrl()
  
  return titleValid && urlValid
}

// ─────────────────────────────────────────────────────────────
// MANEJADORES DE EVENTOS
// ─────────────────────────────────────────────────────────────

/**
 * Manejar error de preview de imagen
 */
const handlePreviewError = (e) => {
  e.target.style.display = 'none'
  submitError.value = 'La URL de la portada no parece ser una imagen válida'
}

/**
 * Manejar submit del formulario
 */
const handleSubmit = () => {
  submitError.value = ''
  
  // Validar antes de enviar
  if (!validateForm()) {
    emit('error', 'Hay errores en el formulario')
    return
  }
  
  // Emitir datos limpios hacia el componente padre
  emit('submit', {
    title: localFormData.title.trim(),
    description: localFormData.description.trim(),
    cover_image_url: localFormData.cover_image_url.trim() || null,
    is_public: localFormData.is_public
  })
}

// ─────────────────────────────────────────────────────────────
// WATCHERS (observar cambios)
// ─────────────────────────────────────────────────────────────

/**
 * Cuando cambian los initialData desde fuera, actualizar localFormData
 * (útil cuando se abre el modal para editar)
 */
watch(
  () => props.initialData,
  (newData) => {
    Object.assign(localFormData, newData)
    // Limpiar errores al cambiar datos
    errors.title = ''
    errors.cover_image_url = ''
    submitError.value = ''
  },
  { deep: true }
)
</script>

<style scoped>
/* ============================================
   CONTENEDOR PRINCIPAL
   ============================================ */
.collection-form-component {
  width: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* ============================================
   GRUPOS DE FORMULARIO
   ============================================ */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--kura-color1);
}

.required {
  color: #c62828;
}

.optional {
  color: var(--kura-text-muted);
  font-weight: 400;
}

/* ============================================
   INPUTS
   ============================================ */
.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-family: var(--font-main);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  background: var(--kura-bg-card);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--kura-color4);
  box-shadow: 0 0 0 3px rgba(12, 126, 126, 0.1);
}

.form-input.input-error,
.form-textarea.input-error {
  border-color: #c62828;
}

.form-input.input-error:focus,
.form-textarea.input-error:focus {
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* ============================================
   CONTADOR DE CARACTERES
   ============================================ */
.char-counter {
  font-size: 0.75rem;
  color: var(--kura-text-muted);
  text-align: right;
}

/* ============================================
   MENSAJES DE ERROR
   ============================================ */
.error-message {
  font-size: 0.8rem;
  color: #c62828;
  font-weight: 500;
}

.form-error-global {
  background: #ffebee;
  color: #c62828;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--kura-text-muted);
  font-style: italic;
}

/* ============================================
   PREVIEW DE PORTADA
   ============================================ */
.cover-preview {
  margin-top: var(--spacing-sm);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--kura-border);
  max-width: 200px;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

/* ============================================
   TOGGLE DE VISIBILIDAD
   ============================================ */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.toggle-option {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--kura-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.toggle-option:hover {
  background: var(--kura-bg);
  border-color: var(--kura-color4);
}

.toggle-option input[type="radio"] {
  margin-top: 0.2rem;
  accent-color: var(--kura-color4);
}

.toggle-content {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.toggle-icon {
  font-size: 1.2rem;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.toggle-text strong {
  color: var(--kura-color1);
}

.toggle-text small {
  color: var(--kura-text-muted);
  font-size: 0.8rem;
}

/* ============================================
   BOTONES DE ACCIÓN
   ============================================ */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--kura-border);
  margin-top: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
  font-family: var(--font-main);
}

.btn-cancel {
  background: var(--kura-bg);
  color: var(--kura-text);
  border: 1px solid var(--kura-border);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--kura-border);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit {
  background: var(--kura-color4);
  color: white;
  border: none;
}

.btn-submit:hover:not(:disabled) {
  background: var(--kura-color3);
  transform: translateY(-1px);
}

.btn-submit:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .toggle-option {
    padding: var(--spacing-sm);
  }
}
</style>