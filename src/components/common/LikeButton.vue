<!-- 
  /components/common/LikeButton.vue
  Botón reutilizable para dar/quitar like a colecciones 
-->

<script setup>
import { ref, onMounted } from 'vue'
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
  initialCount: {
    type: Number,
    default: 0
  },
  initialLiked: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

// ============================================
// EMITS
// ============================================

const emit = defineEmits(['like-changed'])

// ============================================
// ESTADO LOCAL
// ============================================

const { 
  loading, 
  error, 
  likeCount, 
  hasLiked, 
  toggleLike 
} = useCommunity()

const currentUser = ref(null)
const showError = ref(false)

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Obtener usuario actual
  const { data } = await supabase.auth.getUser()
  currentUser.value = data?.user || null
  
  // Debug temporal
  console.log('LikeButton - currentUser:', currentUser.value)
  
  // Solo inicializar si el composable aún tiene valores por defecto
  if (likeCount.value === 0 && props.initialCount > 0) {
    likeCount.value = props.initialCount
  }
  if (!hasLiked.value && props.initialLiked) {
    hasLiked.value = props.initialLiked
  }
})

// ============================================
// MÉTODOS
// ============================================

async function handleLike() {
  if (!currentUser.value) {
    showError.value = true
    setTimeout(() => { showError.value = false }, 3000)
    return
  }

  const result = await toggleLike(props.collectionId, currentUser.value.id)

  if (result.success) {
    emit('like-changed', { 
      collectionId: props.collectionId, 
      liked: hasLiked.value,
      count: likeCount.value 
    })
  } else {
    showError.value = true
    setTimeout(() => { showError.value = false }, 3000)
  }
}

// ============================================
// CONFIGURACIÓN DE TAMAÑOS (Sin Tailwind)
// ============================================

const sizeConfig = {
  sm: {
    iconWidth: '16px',
    iconHeight: '16px',
    textSize: '0.875rem', // text-sm
    gap: '4px'
  },
  md: {
    iconWidth: '20px',
    iconHeight: '20px',
    textSize: '1rem', // text-base
    gap: '6px'
  },
  lg: {
    iconWidth: '24px',
    iconHeight: '24px',
    textSize: '1.125rem', // text-lg
    gap: '8px'
  }
}

const currentSize = sizeConfig[props.size]
</script>

<template>
  <div class="like-button-container">
    <button
      class="like-button"
      :class="{ 
        'is-liked': hasLiked, 
        'is-loading': loading,
        'has-error': showError 
      }"
      :style="{ gap: currentSize.gap }"
      @click="handleLike"
      :disabled="loading"
      type="button"
      aria-label="Dar o quitar like"
    >
      <!-- Icono de corazón LLENO (Liked) -->
      <svg
        class="heart-icon heart-filled"
        :style="{ width: currentSize.iconWidth, height: currentSize.iconHeight }"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      <!-- Icono de corazón VACÍO (Not Liked) -->
      <svg
        class="heart-icon heart-outline"
        :style="{ width: currentSize.iconWidth, height: currentSize.iconHeight }"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Contador -->
      <span 
        class="like-count"
        :style="{ fontSize: currentSize.textSize }"
      >
        {{ likeCount }}
      </span>
    </button>

    <!-- Mensaje de error -->
    <transition name="fade">
      <p v-if="showError" class="error-message">
        Debes iniciar sesión para dar like
      </p>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   CONTENEDOR
   ============================================ */
.like-button-container {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ============================================
   BOTÓN PRINCIPAL
   ============================================ */
.like-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 6px 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
  font-family: var(--font-main);
  white-space: nowrap;
}

.like-button:hover:not(:disabled) {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
  transform: translateY(-1px);
}

.like-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* ============================================
   ESTADOS DEL BOTÓN
   ============================================ */

/* Estado: Liked */
.like-button.is-liked {
  color: #ff4757; /* Un rojo/rosado más visible para el like, o usa --kura-bright-teal si prefieres */
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.08);
}

/* Ocultar/Mostrar iconos según estado */
.like-button .heart-icon {
  display: none; /* Por defecto ocultos */
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.like-button.is-liked .heart-filled {
  display: block;
  transform: scale(1.1);
}

.like-button:not(.is-liked) .heart-outline {
  display: block;
}

/* Estado: Loading */
.like-button.is-loading {
  cursor: wait;
  pointer-events: none;
}

.like-button.is-loading .heart-icon {
  animation: pulse 0.8s infinite;
}

/* Estado: Error */
.like-button.has-error {
  border-color: #ff6b6b;
  color: #ff6b6b;
  animation: shake 0.4s ease-in-out;
}

/* ============================================
   CONTADOR
   ============================================ */
.like-count {
  font-weight: 600;
  margin-left: 4px; /* Fallback */
  line-height: 1;
}

/* ============================================
   MENSAJE DE ERROR
   ============================================ */
.error-message {
  font-size: 0.75rem;
  color: #ff6b6b;
  margin: 4px 0 0 4px;
  line-height: 1.4;
}

/* ============================================
   ANIMACIONES
   ============================================ */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>