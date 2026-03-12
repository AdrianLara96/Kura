<template>
  <div class="p-4">
    <h1>👋 Hola, {{ user?.email }}</h1>
    <p>Bienvenido a tu dashboard de Kura</p>
    <p> <router-link to="/my-profile">✏️ Editar mi perfil</router-link> </p>
    <button @click="handleLogout">Cerrar sesión</button>
    <router-link to="/">← Volver al inicio</router-link>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
const { user, signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
}
</script>