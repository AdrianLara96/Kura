<template>
  <TopNav />   
  <div class="home-view">
    <!-- Barra de navegación -->
    
    <!-- Contenido principal -->
    <main class="home-content">
      <h1>Kura</h1>
      <p class="tagline">Plataforma de descubrimiento cultural</p>
      
      <p class="user-greeting" v-if="isAuthenticated">👋 ¡ Hola {{ user?.email?.split('@')[0] }} !</p>
      <div class="home-actions">
        <router-link to="/explore" class="btn-primary">Explorar obras</router-link>
        <router-link to="/dashboard" class="btn-secondary" v-if="isAuthenticated">Mi Dashboard</router-link>
      </div>
      
      <!-- Info para usuarios no autenticados -->
      <div v-if="!isAuthenticated" class="home-info">
        <h3>¿Qué es Kura?</h3>
        <p>Descubre obras maestras de museos internacionales, crea colecciones personales y comparte tu pasión por el arte.</p>
        <router-link to="/register" class="btn-outline">Crear cuenta gratis</router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import TopNav from '@/components/common/TopNav.vue'

const { user, isAuthenticated, signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
  // El listener de auth en useAuth.js redirigirá automáticamente a /
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Navegación */
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
  gap: 1.5rem;
  align-items: center;
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
  font-size: 1rem;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #1976d2;
}

.btn-logout {
  background: #ffebee;
  color: #d32f2f;
}

.btn-logout:hover {
  background: #ffcdd2;
}

.user-greeting {
  color: #1976d2;
  font-weight: 500;
}

/* Contenido principal */
.home-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
}

.home-content h1 {
  font-size: 3rem;
  margin: 0 0 1rem;
  color: #1a1a2e;
}

.tagline {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.home-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  padding: 0.75rem 2rem;
  background: #e0e0e0;
  color: #333;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #bdbdbd;
}

.home-info {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  text-align: left;
}

.home-info h3 {
  margin: 0 0 1rem;
  color: #1a1a2e;
}

.home-info p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.btn-outline {
  display: inline-block;
  padding: 0.75rem 2rem;
  border: 2px solid #1976d2;
  color: #1976d2;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}

.btn-outline:hover {
  background: #1976d2;
  color: white;
}
</style>