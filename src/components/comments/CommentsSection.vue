<!-- Componente para gestión completa de comentarios para colecciones -->

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCommunity } from '@/composables/useCommunity'
import { supabase } from '@/supabase/client'

// ============================================
// PROPS
// ============================================

const props = defineProps({
  collectionId: {
    type: String,
    required: true
  },
  collectionOwnerId: {
    type: String,
    required: false,
    default: null
  }
})

// ============================================
// EMITS
// ============================================

const emit = defineEmits(['comment-added', 'comment-deleted'])

// ============================================
// ESTADO LOCAL
// ============================================

const { 
  loading, 
  error, 
  comments, 
  fetchComments, 
  addComment, 
  updateComment, 
  deleteComment 
} = useCommunity()

const currentUser = ref(null)
const newCommentText = ref('')
const editingCommentId = ref(null)
const editCommentText = ref('')
const showError = ref(false)
const errorMessage = ref('')

// ============================================
// COMPUTED
// ============================================

const sortedComments = computed(() => {
  // Ordenar por fecha (más recientes primero)
  return [...comments.value].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  )
})

const isSubmitting = computed(() => loading.value && !editingCommentId.value)
const isEditing = computed(() => !!editingCommentId.value)

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Obtener usuario actual
  const { data } = await supabase.auth.getUser()
  currentUser.value = data?.user || null

  // Cargar comentarios
  await fetchComments(props.collectionId)
})

// ============================================
// MÉTODOS
// ============================================

/**
 * Añade un nuevo comentario
 */
async function handleSubmitComment() {
  // Validaciones
  if (!currentUser.value) {
    showError.value = true
    errorMessage.value = 'Debes iniciar sesión para comentar'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
    return
  }

  if (!newCommentText.value.trim()) {
    showError.value = true
    errorMessage.value = 'El comentario no puede estar vacío'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
    return
  }

  if (newCommentText.value.trim().length > 1000) {
    showError.value = true
    errorMessage.value = 'El comentario no puede superar los 1000 caracteres'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
    return
  }

  // Añadir comentario
  const result = await addComment(
    props.collectionId, 
    currentUser.value.id, 
    newCommentText.value
  )

  if (result.success) {
    newCommentText.value = ''
    emit('comment-added', result.data)
  } else {
    showError.value = true
    errorMessage.value = 'Error al publicar el comentario'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
  }
}

/**
 * Inicia el modo edición de un comentario
 */
function startEdit(comment) {
  // Solo el autor puede editar
  if (comment.user_id !== currentUser.value?.id) return

  editingCommentId.value = comment.id
  editCommentText.value = comment.content
}

/**
 * Cancela la edición de un comentario
 */
function cancelEdit() {
  editingCommentId.value = null
  editCommentText.value = ''
}

/**
 * Guarda los cambios de un comentario editado
 */
async function saveEdit(commentId) {
  if (!editCommentText.value.trim()) {
    showError.value = true
    errorMessage.value = 'El comentario no puede estar vacío'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
    return
  }

  const result = await updateComment(commentId, editCommentText.value)

  if (result.success) {
    editingCommentId.value = null
    editCommentText.value = ''
  } else {
    showError.value = true
    errorMessage.value = 'Error al actualizar el comentario'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
  }
}

/**
 * Elimina un comentario
 */
async function handleDeleteComment(commentId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
    return
  }

  const result = await deleteComment(commentId)

  if (result.success) {
    emit('comment-deleted', commentId)
  } else {
    showError.value = true
    errorMessage.value = 'Error al eliminar el comentario'
    setTimeout(() => {
      showError.value = false
      errorMessage.value = ''
    }, 3000)
  }
}

/**
 * Formatea la fecha de manera legible
 */
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Obtiene el avatar del usuario (o placeholder)
 */
function getAvatarUrl(comment) {
  return comment.user_profiles?.avatar_url || null
}

/**
 * Obtiene el nombre para mostrar
 */
function getDisplayName(comment) {
  return comment.user_profiles?.display_name || 
         comment.user_profiles?.username || 
         'Usuario'
}
</script>

<template>
  <div class="comments-section">
    <!-- Título -->
    <h3 class="comments-title">
      Comentarios ({{ comments.length }})
    </h3>

    <!-- Formulario de nuevo comentario -->
    <div class="new-comment-form">
      <div class="form-header">
        <div class="user-avatar">
          <svg 
            v-if="!currentUser"
            class="avatar-icon"
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
              stroke="currentColor" 
              stroke-width="2"
            />
            <circle 
              cx="12" 
              cy="7" 
              r="4" 
              stroke="currentColor" 
              stroke-width="2"
            />
          </svg>
          <img 
            v-else-if="currentUser.user_metadata?.avatar_url"
            :src="currentUser.user_metadata.avatar_url" 
            :alt="currentUser.user_metadata?.display_name || 'Avatar'"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            {{ currentUser?.email?.charAt(0).toUpperCase() || '?' }}
          </div>
        </div>
        <div class="form-input-wrapper">
          <textarea
            v-model="newCommentText"
            class="comment-input"
            placeholder="Escribe un comentario..."
            :disabled="!currentUser || loading"
            rows="3"
            maxlength="1000"
          />
          <div class="form-footer">
            <span class="char-counter">
              {{ newCommentText.length }}/1000
            </span>
            <button
              class="submit-button"
              :class="{ 'disabled': !newCommentText.trim() || !currentUser }"
              @click="handleSubmitComment"
              :disabled="!newCommentText.trim() || !currentUser || loading"
              type="button"
            >
              <span v-if="loading">Publicando...</span>
              <span v-else>Publicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje de error -->
    <transition name="fade">
      <div v-if="showError" class="error-banner">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </transition>

    <!-- Lista de comentarios -->
    <div class="comments-list">
      <!-- Estado: Cargando -->
      <div v-if="loading && comments.length === 0" class="loading-state">
        <div class="skeleton-comment" v-for="i in 3" :key="i">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-header"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>

      <!-- Estado: Sin comentarios -->
      <div v-else-if="comments.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none">
          <path 
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
            stroke="currentColor" 
            stroke-width="2"
          />
        </svg>
        <p>Sé el primero en comentar esta colección</p>
      </div>

      <!-- Estado: Comentarios existentes -->
      <div 
        v-else 
        class="comment-item" 
        v-for="comment in sortedComments" 
        :key="comment.id"
        :class="{ 'is-editing': editingCommentId === comment.id }"
      >
        <!-- Avatar -->
        <div class="comment-avatar">
          <img 
            v-if="getAvatarUrl(comment)"
            :src="getAvatarUrl(comment)" 
            :alt="getDisplayName(comment)"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            {{ getDisplayName(comment).charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Contenido -->
        <div class="comment-content">
          <!-- Header: Autor y fecha -->
          <div class="comment-header">
            <span class="author-name">
              {{ getDisplayName(comment) }}
            </span>
            <span class="comment-date">
              {{ formatDate(comment.created_at) }}
            </span>
            <span v-if="comment.updated_at !== comment.created_at" class="edited-badge">
              (editado)
            </span>
          </div>

          <!-- Texto del comentario -->
          <div class="comment-body">
            <p v-if="editingCommentId !== comment.id" class="comment-text">
              {{ comment.content }}
            </p>
            <textarea
              v-else
              v-model="editCommentText"
              class="edit-input"
              rows="3"
              maxlength="1000"
            />
          </div>

          <!-- Acciones -->
          <div class="comment-actions">
            <button
              v-if="comment.user_id === currentUser?.id && editingCommentId !== comment.id"
              class="action-button"
              @click="startEdit(comment)"
              type="button"
            >
              <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
                  stroke="currentColor" 
                  stroke-width="2"
                />
                <path 
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" 
                  stroke="currentColor" 
                  stroke-width="2"
                />
              </svg>
              Editar
            </button>
            <button
              v-if="editingCommentId === comment.id"
              class="action-button cancel"
              @click="cancelEdit"
              type="button"
            >
              Cancelar
            </button>
            <button
              v-if="editingCommentId === comment.id"
              class="action-button save"
              @click="saveEdit(comment.id)"
              :disabled="loading"
              type="button"
            >
              Guardar
            </button>
            <button
              v-if="comment.user_id === currentUser?.id && editingCommentId !== comment.id"
              class="action-button delete"
              @click="handleDeleteComment(comment.id)"
              :disabled="loading"
              type="button"
            >
              <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" 
                  stroke="currentColor" 
                  stroke-width="2"
                />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   ESTILOS DEL COMPONENTE
   ============================================ */

.comments-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.comments-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

/* ============================================
   FORMULARIO NUEVO COMENTARIO
   ============================================ */

.new-comment-form {
  margin-bottom: var(--spacing-lg);
}

.form-header {
  display: flex;
  gap: var(--spacing-md);
}

.user-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--kura-teal);
}

.form-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.comment-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-primary);
  font-family: var(--font-main);
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color var(--transition-fast);
}

.comment-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

.comment-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.submit-button {
  background: var(--kura-bright-teal);
  color: var(--text-primary);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--spacing-xs) var(--spacing-md);
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.submit-button:hover:not(.disabled) {
  background: var(--kura-teal);
  transform: translateY(-1px);
}

.submit-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   MENSAJE DE ERROR
   ============================================ */

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  color: #ff6b6b;
  font-size: 0.85rem;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ============================================
   LISTA DE COMENTARIOS
   ============================================ */

.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeleton-comment {
  display: flex;
  gap: var(--spacing-md);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.skeleton-header {
  width: 150px;
  height: 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.skeleton-text {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Comment Item */
.comment-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.comment-item:hover {
  border-color: var(--border-active);
}

.comment-item.is-editing {
  border-color: var(--kura-bright-teal);
}

.comment-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.edited-badge {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-style: italic;
}

.comment-body {
  margin-top: var(--spacing-xs);
}

.comment-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.edit-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  color: var(--text-primary);
  font-family: var(--font-main);
  font-size: 0.9rem;
  resize: vertical;
}

.edit-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
}

.comment-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-main);
  font-size: 0.75rem;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.action-button:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.action-button.delete:hover {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.action-button.save {
  color: var(--kura-bright-teal);
}

.action-button.save:hover {
  background: rgba(12, 126, 126, 0.2);
}

.action-button.cancel {
  color: var(--text-secondary);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* ============================================
   ANIMACIONES
   ============================================ */

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>