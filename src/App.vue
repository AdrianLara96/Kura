<template>
  <router-view />
</template>

<script setup>
import { useAuth } from './composables/useAuth'

// Inicializar auth
useAuth()
</script>