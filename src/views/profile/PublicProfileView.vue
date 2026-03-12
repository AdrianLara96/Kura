<!-- src/views/profile/PublicProfileView.vue -->
<template>
  <div class="p-4">
    <h1>👤 Perfil de {{ username }}</h1>
    <p>Próximamente: colecciones y actividad de {{ username }}</p>
    <router-link to="/">← Volver</router-link>
  </div>
</template>

<script setup>
defineProps({
  username: String
})
</script>