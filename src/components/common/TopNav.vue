<!-- src/components/common/TopNav.vue -->
<template>
  <nav class="top-nav">
    <router-link to="/" class="nav-logo">Kura</router-link>
    <div class="nav-links">
      <router-link to="/explore" class="nav-link" :class="{ active: $route.name === 'explore' }">Explorar</router-link>
      <template v-if="isAuthenticated">
        <router-link to="/dashboard" class="nav-link" :class="{ active: $route.name === 'dashboard' }">Dashboard</router-link>
        <router-link to="/my-profile" class="nav-link" :class="{ active: $route.name === 'profile-edit' }">Mi Perfil</router-link>
        <button @click="handleLogout" class="nav-link btn-logout">Cerrar Sesión</button>
      </template>
      <template v-else>
        <router-link to="/login" class="nav-link">Iniciar Sesión</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, isAuthenticated, signOut } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await signOut()
}
</script>

<style scoped>
/* Mismos estilos que arriba */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}


.nav-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #1976d2;
}

.nav-link.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.btn-logout {
  background: #ffebee;
  color: #d32f2f;
}

.btn-logout:hover {
  background: #ffcdd2;
}

</style>