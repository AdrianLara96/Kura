<template>
  <router-view />
</template>

<script setup>
import { useAuth } from './composables/useAuth'
import { useSessionTimeout } from './composables/useSessionTimeout';

useSessionTimeout()
useAuth()
</script>