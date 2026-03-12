import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'  // Importar utilities de URL

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Usar fileURLToPath + import.meta.url en lugar de path + __dirname
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  }
})