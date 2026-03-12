<template>
  <div class="p-4">
    <h1>✨ Registro</h1>
    <form @submit.prevent="handleRegister">
      <input v-model="displayName" type="text" placeholder="Nombre" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Contraseña (min 6)" minlength="6" required />
      <button type="submit" :disabled="loading">
        {{ loading ? '...' : 'Registrarse' }}
      </button>
    </form>
    <p v-if="error" style="color: red">{{ error }}</p>
    <p><router-link to="/login">¿Ya tienes cuenta? Inicia sesión</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { signUp, loading, error } = useAuth()
const router = useRouter()
const displayName = ref('')
const email = ref('')
const password = ref('')

const handleRegister = async () => {
  const result = await signUp(email.value, password.value, displayName.value)
  if (result.success) {
    alert('¡Cuenta creada! Revisa tu email.')
    router.push('/login')
  }
}
</script>