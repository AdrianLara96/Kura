<template>
  <router-link :to="computedTo" class="collection-card-link">
    <article class="collection-card" :class="{ 'is-clickable': clickable }">
      
      <!-- PORTADA -->
      <div class="card-cover">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="title"
          class="cover-image"
          loading="lazy"
        />
        <div v-else class="cover-placeholder">
          <!-- Icono SVG abstracto en lugar de emoji -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        
        <!-- Overlay Hover -->
        <div class="card-overlay">
          <span class="overlay-text">
            Ver colección
            <svg class="overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        </div>
      </div>

      <!-- CONTENIDO -->
      <div class="card-content">
        <!-- Título -->
        <h3 class="card-title">{{ title }}</h3>
        
        <!-- Descripción -->
        <p v-if="description" class="card-description">
          {{ truncatedDescription }}
        </p>
        
        <!-- Creador -->
        <div v-if="creatorName || creatorAvatar" class="card-creator">
          <div class="creator-avatar-wrapper">
            <img
              v-if="creatorAvatar"
              :src="creatorAvatar"
              :alt="creatorName"
              class="creator-avatar"
            />
            <div v-else class="creator-avatar-placeholder">
              <!-- Icono de usuario SVG -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <span class="creator-name">{{ creatorName || 'Usuario' }}</span>
        </div>
        
        <!-- Metadatos (Obras y Vistas) -->
        <div class="card-meta">
          <span class="meta-item" :title="`${artworkCount} obras`">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <span>{{ artworkCount }}</span>
          </span>
          
          <span v-if="viewCount !== undefined" class="meta-item" :title="`${viewCount} vistas`">
            <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>{{ formatViewCount }}</span>
          </span>
        </div>
      </div>
    </article>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: null },
  creatorName: { type: String, default: '' },
  creatorAvatar: { type: String, default: null },
  artworkCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  to: { type: String, default: null },
  clickable: { type: Boolean, default: true }
})

const truncatedDescription = computed(() => {
  if (!props.description) return ''
  if (props.description.length <= 80) return props.description
  return props.description.substring(0, 80) + '...'
})

const formatViewCount = computed(() => {
  if (!props.viewCount) return '0'
  if (props.viewCount >= 1000000) return (props.viewCount / 1000000).toFixed(1) + 'M'
  if (props.viewCount >= 1000) return (props.viewCount / 1000).toFixed(1) + 'k'
  return props.viewCount.toString()
})

const computedTo = computed(() => props.to || `/collections/${props.id}`)
</script>

<style scoped>
/* ============================================
   LINK CONTAINER
   ============================================ */
.collection-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

/* ============================================
   TARJETA PRINCIPAL
   ============================================ */
.collection-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.collection-card:hover {
  transform: translateY(-6px);
  border-color: rgba(191, 172, 139, 0.3); /* Borde dorado sutil */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.collection-card.is-clickable {
  cursor: pointer;
}

/* ============================================
   PORTADA
   ============================================ */
.card-cover {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  background: #000;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  display: block;
}

.collection-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, var(--kura-deep-teal), #000);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.15);
  stroke-width: 1;
}

/* Overlay */
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 7, 6, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.collection-card:hover .card-overlay {
  opacity: 1;
}

.overlay-text {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  transform: translateY(10px);
  transition: transform var(--transition-fast);
}

.collection-card:hover .overlay-text {
  transform: translateY(0);
}

.overlay-icon {
  width: 16px;
  height: 16px;
}

/* ============================================
   CONTENIDO
   ============================================ */
.card-content {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  
  /* Truncar a 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  
  /* Truncar a 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1; /* Empuja los meta hacia abajo si hay espacio */
}

/* ============================================
   CREADOR
   ============================================ */
.card-creator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.creator-avatar-wrapper {
  flex-shrink: 0;
}

.creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-subtle);
}

.creator-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.creator-avatar-placeholder svg {
  width: 14px;
  height: 14px;
}

.creator-name {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================
   METADATOS
   ============================================ */
.card-meta {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  margin-top: auto; /* Empuja al fondo */
  border-top: 1px solid var(--border-subtle);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.meta-icon {
  width: 12px;
  height: 12px;
  color: var(--kura-gold); /* Iconos dorados sutiles */
  flex-shrink: 0;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .card-title { font-size: 1rem; }
  .card-description { font-size: 0.8rem; }
  .card-cover { aspect-ratio: 16/9; }
}
</style>