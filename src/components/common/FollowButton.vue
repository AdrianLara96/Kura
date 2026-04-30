<!-- 
  /components/common/FollowButton.vue
  Botón reutilizable para seguir/dejar de seguir usuarios 
--> 

<script setup>
import { ref, onMounted } from 'vue'
import { useCommunity } from '@/composables/useCommunity'
import { supabase } from '@/supabase/client'

// ============================================
// PROPS
// ============================================

const props = defineProps({
  targetUserId: {
    type: String,
    required: true
  },
  initialFollowersCount: {
    type: Number,
    default: 0
  },
  initialFollowing: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'text-only'].includes(value)
  }
})

// ============================================
// EMITS
// ============================================

const emit = defineEmits(['follow-changed'])

// ============================================
// ESTADO LOCAL
// ============================================

const { 
  loading, 
  error, 
  followerCount, 
  isFollowing, 
  toggleFollow 
} = useCommunity()

const currentUser = ref(null)
const showError = ref(false)
const errorMessage = ref('')

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Obtener usuario actual
  const { data } = await supabase.auth.getUser()
  currentUser.value = data?.user || null

  // Solo inicializar si el composable aún tiene valores por defecto
  if (followerCount.value === 0 && props.initialFollowersCount > 0) {
    followerCount.value = props.initialFollowersCount
  }
  if (!isFollowing.value && props.initialFollowing) {
    isFollowing.value = props.initialFollowing
  }
})

// ============================================
// MÉTODOS
// ============================================

async function handleFollow() {
  // Validar autenticación
  if (!currentUser.value) {
    triggerError('Debes iniciar sesión para seguir usuarios')
    return
  }

  // Validar auto-seguimiento
  if (currentUser.value.id === props.targetUserId) {
    triggerError('No puedes seguirte a ti mismo')
    return
  }

  loading.value = true

  try {
    // CONSULTAR estado real en BD antes de actuar
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.value.id)
      .eq('following_id', props.targetUserId)
      .maybeSingle()

    const isCurrentlyFollowing = !!followData

    if (isCurrentlyFollowing) {
      // DEJAR de seguir (DELETE)
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.value.id)
        .eq('following_id', props.targetUserId)

      if (error) throw error

      // Actualizar estado local
      isFollowing.value = false
      followerCount.value = Math.max(0, followerCount.value - 1)
    } else {
      // SEGUIR (INSERT)
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.value.id,
          following_id: props.targetUserId
        })

      if (error) throw error

      // Actualizar estado local
      isFollowing.value = true
      followerCount.value = followerCount.value + 1
    }

    // Emitir evento
    emit('follow-changed', { 
      targetUserId: props.targetUserId, 
      following: isFollowing.value,
      followersCount: followerCount.value 
    })

  } catch (err) {
    console.error('Error en follow:', err)
    triggerError(err.message || 'Error al seguir al usuario')
  } finally {
    loading.value = false
  }
}

function triggerError(msg) {
  errorMessage.value = msg
  showError.value = true
  setTimeout(() => {
    showError.value = false
    errorMessage.value = ''
  }, 3000)
}

// ============================================
// CONFIGURACIÓN DE TAMAÑOS (Sin Tailwind)
// ============================================

const sizeConfig = {
  sm: {
    padding: '4px 10px',
    fontSize: '0.85rem',
    gap: '6px',
    iconSize: '16px'
  },
  md: {
    padding: '6px 16px',
    fontSize: '0.95rem',
    gap: '8px',
    iconSize: '18px'
  },
  lg: {
    padding: '8px 20px',
    fontSize: '1.1rem',
    gap: '10px',
    iconSize: '20px'
  }
}

const currentSize = sizeConfig[props.size]
</script>

<template>
  <div class="follow-button-container">
    <button
      class="follow-button"
      :class="{ 
        'is-following': isFollowing, 
        'is-loading': loading,
        'has-error': showError,
        'variant-text-only': variant === 'text-only'
      }"
      :style="{ 
        padding: currentSize.padding, 
        gap: currentSize.gap, 
        fontSize: currentSize.fontSize 
      }"
      @click="handleFollow"
      :disabled="loading"
      type="button"
      :aria-label="isFollowing ? 'Dejar de seguir' : 'Seguir usuario'"
    >
      <!-- Icono de usuario -->
      <svg
        v-if="variant === 'default'"
        class="user-icon"
        :style="{ width: currentSize.iconSize, height: currentSize.iconSize }"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="12"
          cy="7"
          r="4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Texto del botón -->
      <span class="button-text">
        <span v-if="loading" class="text-loading">
          {{ isFollowing ? 'Dejando...' : 'Siguiendo...' }}
        </span>
        <span v-else-if="isFollowing" class="text-following">
          Siguiendo
        </span>
        <span v-else class="text-not-following">
          Seguir
        </span>
      </span>

      <!-- Contador de seguidores -->
      <span 
        v-if="variant === 'default' && !loading"
        class="followers-count"
      >
        {{ followerCount }}
      </span>
    </button>

    <!-- Mensaje de error -->
    <transition name="fade">
      <p v-if="showError" class="error-message">
        {{ errorMessage }}
      </p>
    </transition>
  </div>
</template>

<style scoped>
/* ============================================
   CONTENEDOR
   ============================================ */
.follow-button-container {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ============================================
   BOTÓN PRINCIPAL
   ============================================ */
.follow-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
  font-family: var(--font-main);
  font-weight: 600;
  white-space: nowrap;
}

/* Hover Normal */
.follow-button:hover:not(:disabled):not(.is-following) {
  border-color: var(--kura-bright-teal);
  color: var(--kura-bright-teal);
  transform: translateY(-1px);
}

/* Estado: Disabled */
.follow-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* ============================================
   ESTADO: FOLLOWING (Activo)
   ============================================ */
.follow-button.is-following {
  color: #ffffff;
  border-color: var(--kura-bright-teal);
  background: var(--kura-bright-teal);
}

.follow-button.is-following .followers-count {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Hover cuando ya sigue (para indicar que puede dejar de seguir) */
.follow-button.is-following:hover:not(:disabled) {
  background: transparent;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.follow-button.is-following:hover:not(:disabled) .followers-count {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* ============================================
   ESTADO: ERROR
   ============================================ */
.follow-button.has-error {
  border-color: #ff6b6b;
  color: #ff6b6b;
  animation: shake 0.4s ease-in-out;
}

/* ============================================
   VARIANTE: TEXT-ONLY
   ============================================ */
.follow-button.variant-text-only {
  border: none;
  background: transparent;
  padding: 4px 8px !important; /* Override inline style slightly */
}

.follow-button.variant-text-only:hover:not(:disabled) {
  transform: none;
  color: var(--kura-bright-teal);
}

.follow-button.variant-text-only.is-following {
  background: transparent;
  color: var(--kura-bright-teal);
}

.follow-button.variant-text-only .followers-count {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
}

/* ============================================
   ELEMENTOS INTERNOS
   ============================================ */
.user-icon {
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.button-text {
  line-height: 1;
}

.followers-count {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-left: 4px;
  transition: all var(--transition-fast);
}

.error-message {
  font-size: 0.75rem;
  color: #ff6b6b;
  margin: 4px 0 0 4px;
  line-height: 1.4;
}

/* ============================================
   ANIMACIONES
   ============================================ */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading state applied via class in template if needed, 
   but here we rely on disabled attribute mostly */
.follow-button.is-loading .user-icon {
  animation: pulse 0.8s infinite;
}
</style>