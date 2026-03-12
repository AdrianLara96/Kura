<template>
  <div class="p-4">
    <h1>🔐 Login</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit" :disabled="loading">
        {{ loading ? '...' : 'Entrar' }}
      </button>
    </form>
    <p v-if="error" style="color: red">{{ error }}</p>
    <p><router-link to="/register">¿No tienes cuenta? Regístrate</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { signIn, loading, error } = useAuth()
const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const result = await signIn(email.value, password.value)
  if (result.success) router.push('/dashboard')
}
</script>