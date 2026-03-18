<template>
  <router-view />
</template>

<script setup>
import { useAuth } from './composables/useAuth'
useAuth()
</script>