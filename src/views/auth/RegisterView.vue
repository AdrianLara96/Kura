<template>
  <div class="auth-view">
    <!-- Fondo -->
    <div class="auth-background"></div>

    <main class="auth-container">
      
      <!-- Tarjeta de Registro -->
      <div class="auth-card">
        
        <!-- Cabecera -->
        <header class="auth-header">
          <router-link to="/" class="brand-logo">Kura</router-link>
          <h1 class="auth-title">Únete a Kura</h1>
          <p class="auth-subtitle">Comienza tu viaje en el descubrimiento cultural</p>
        </header>

        <!-- Formulario -->
        <form @submit.prevent="handleRegister" class="auth-form" novalidate>
          
          <!-- Nombre Visible -->
          <div class="form-group">
            <label for="displayName" class="form-label">Nombre visible</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                id="displayName"
                v-model="displayName" 
                type="text" 
                placeholder="Ej: Ana García" 
                required 
                minlength="2"
                autocomplete="name"
                class="form-input"
                :class="{ error: fieldErrors.displayName }"
              />
            </div>
            <span v-if="fieldErrors.displayName" class="field-error">{{ fieldErrors.displayName }}</span>
            <span class="field-hint">Cómo te llamarán en la comunidad.</span>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                id="email"
                v-model="email" 
                type="email" 
                placeholder="nombre@ejemplo.com" 
                required 
                autocomplete="email"
                class="form-input"
                :class="{ error: fieldErrors.email }"
                @blur="validateEmail"
              />
            </div>
            <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                id="password"
                v-model="password" 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                required 
                minlength="6"
                autocomplete="new-password"
                class="form-input"
                :class="{ error: fieldErrors.password }"
              />
            </div>
            <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
          </div>

          <!-- Error Global -->
          <div v-if="error" class="global-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Botón de Envío -->
          <button type="submit" :disabled="loading" class="btn btn-primary btn-full">
            <span v-if="loading" class="spinner-icon"></span>
            <span v-else>Crear cuenta</span>
          </button>

        </form>

        <!-- Footer: Login -->
        <div class="auth-footer">
          <p>¿Ya tienes cuenta en Kura?</p>
          <router-link to="/login" class="btn btn-outline btn-full">
            Iniciar sesión
          </router-link>
        </div>

      </div>

      <!-- Texto legal -->
      <p class="legal-text">
        Al registrarte, aceptas nuestros <a href="#">Términos de Servicio</a> y <a href="#">Política de Privacidad</a>.
      </p>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { signUp, loading, error } = useAuth()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')

const fieldErrors = reactive({
  displayName: '',
  email: '',
  password: ''
})

// Validaciones
const validateEmail = () => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    fieldErrors.email = 'El correo es obligatorio'
  } else if (!re.test(email.value)) {
    fieldErrors.email = 'Introduce un correo válido'
  } else {
    fieldErrors.email = ''
  }
}

const validateForm = () => {
  let isValid = true
  
  // Validar Nombre
  if (!displayName.value || displayName.value.trim().length < 2) {
    fieldErrors.displayName = 'El nombre debe tener al menos 2 caracteres'
    isValid = false
  } else {
    fieldErrors.displayName = ''
  }

  // Validar Email
  validateEmail()
  if (fieldErrors.email) isValid = false

  // Validar contraseña
  if (!password.value || password.value.length < 6) {
    fieldErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    isValid = false
  } else {
    fieldErrors.password = ''
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) return

  const result = await signUp(email.value, password.value, displayName.value)
  
  if (result.success) {
    // aquí podríamos usar un toast o redirigir con mensaje
    router.push('/login?registered=true')
  }
}
</script>

<style scoped>
/* ============================================
   HERENCIA DE ESTILOS
   ============================================ */
.auth-view {
  min-height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
}

.auth-background {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 80vw;
  height: 80vh;
  background: radial-gradient(circle, rgba(19, 70, 71, 0.4) 0%, transparent 70%);
  opacity: 0.6;
  z-index: 0;
  pointer-events: none;
  filter: blur(60px);
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.auth-card {
  background: rgba(19, 70, 71, 0.2);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.brand-logo {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, var(--kura-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  display: inline-block;
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.03em;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* ============================================
   FORMULARIO & INPUTS
   ============================================ */
.auth-form {
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
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  pointer-events: none;
  transition: color var(--transition-fast);
}

.form-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.875rem 1rem 0.875rem 48px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: var(--font-main);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--kura-bright-teal);
  box-shadow: 0 0 0 2px rgba(12, 126, 126, 0.2);
}

.form-input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: var(--kura-bright-teal);
}

.form-input.error {
  border-color: #ff6b6b;
}

.field-error {
  font-size: 0.8rem;
  color: #ff6b6b;
  margin-left: 4px;
  margin-top: 4px;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: 4px;
  margin-top: 2px;
}

.global-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: var(--radius-md);
  color: #ff6b6b;
  font-size: 0.9rem;
  font-weight: 500;
}

.global-error svg {
  flex-shrink: 0;
}

/* ============================================
   BOTONES
   ============================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-full {
  width: 100%;
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
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-outline {
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.btn-outline:hover {
  border-color: var(--text-primary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.spinner-icon {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   FOOTER & LEGAL
   ============================================ */
.auth-footer {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-subtle);
  text-align: center;
}

.auth-footer p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0 0 var(--spacing-md);
}

.legal-text {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.legal-text a {
  color: var(--text-muted);
  text-decoration: underline;
  transition: color var(--transition-fast);
}

.legal-text a:hover {
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 480px) {
  .auth-card {
    padding: var(--spacing-lg);
  }
  .auth-title {
    font-size: 1.5rem;
  }
}
</style>