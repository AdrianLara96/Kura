
<template>
  <div class="artwork-detail">
    <!-- Botón volver -->
    <button @click="$router.back()" class="back-btn">
      ← Volver al explorador
    </button>

    <!-- SKELETON LOADER: Mientras carga -->
    <div v-if="loading && !artwork" class="skeleton-loader">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-artist"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>No se pudo cargar la obra</h2>
      <p>{{ error }}</p>
      <button @click="loadArtwork" :disabled="loading" class="retry-button">
        🔄 Reintentar
      </button>
    </div>

    <!-- CONTENIDO DE LA OBRA -->
    <div v-else-if="artwork" class="artwork-content">
      <div class="artwork-grid">
        <!-- Columna izquierda: IMAGEN -->
        <div class="image-column">
          <div class="image-container">
            <img
              :src="artwork.image_url || artwork.thumbnail_url"
              :alt="artwork.title"
              class="artwork-image"
              @error="handleImageError"
            />
          </div>
          
          <!-- Dominio público badge -->
          <div v-if="artwork.is_public_domain" class="public-domain-badge">
            Dominio Público
          </div>
        </div>

        <!-- Columna derecha: INFORMACIÓN -->
        <div class="info-column">
          <!-- Título y artista -->
          <div class="artwork-header">
            <h1 class="artwork-title">{{ artwork.title }}</h1>
            <p class="artwork-artist">{{ artwork.artist_name }}</p>
            <p v-if="artwork.creation_date" class="artwork-date">
              {{ artwork.creation_date }}
            </p>
          </div>

          <hr class="divider" />

          <!-- INFORMACIÓN DEL ARTISTA -->
          <section class="info-section">
            <h2 class="section-title">👤 Información del artista</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.metadata?.artistNationality">
                <span class="info-label">Nacionalidad</span>
                <span class="info-value">{{ artwork.metadata.artistNationality }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistAge">
                <span class="info-label">Edad al crear la obra</span>
                <span class="info-value">{{ artwork.metadata.artistAge }} años</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistBeginDate && artwork.metadata?.artistEndDate">
                <span class="info-label">Vida del artista</span>
                <span class="info-value">
                  {{ artwork.metadata.artistBeginDate }} - {{ artwork.metadata.artistEndDate }}
                </span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.artistGender">
                <span class="info-label">Género</span>
                <span class="info-value">{{ artwork.metadata.artistGender }}</span>
              </div>
            </div>
          </section>

          <hr class="divider" />

          <!-- INFORMACIÓN DE LA OBRA -->
          <section class="info-section">
            <h2 class="section-title">🖼️ Información de la obra</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.period">
                <span class="info-label">Período</span>
                <span class="info-value">{{ artwork.period }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.medium">
                <span class="info-label">Materiales</span>
                <span class="info-value">{{ artwork.metadata.medium }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.dimensions">
                <span class="info-label">Dimensiones</span>
                <span class="info-value">{{ artwork.metadata.dimensions }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.department">
                <span class="info-label">Departamento</span>
                <span class="info-value">{{ artwork.metadata.department }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.classification">
                <span class="info-label">Clasificación</span>
                <span class="info-value">{{ artwork.metadata.classification }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.accessionNumber">
                <span class="info-label">Número de acceso</span>
                <span class="info-value">{{ artwork.metadata.accessionNumber }}</span>
              </div>
            </div>
          </section>

          <hr class="divider" />

          <!-- CONTEXTO GEOGRÁFICO -->
          <section class="info-section">
            <h2 class="section-title">🌍 Contexto geográfico</h2>
            <div class="info-grid">
              <div class="info-item" v-if="artwork.metadata?.city">
                <span class="info-label">Ciudad</span>
                <span class="info-value">{{ artwork.metadata.city }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.state">
                <span class="info-label">Estado/Región</span>
                <span class="info-value">{{ artwork.metadata.state }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.country">
                <span class="info-label">País</span>
                <span class="info-value">{{ artwork.metadata.country }}</span>
              </div>
              <div class="info-item" v-if="artwork.metadata?.culture">
                <span class="info-label">Cultura</span>
                <span class="info-value">{{ artwork.metadata.culture }}</span>
              </div>
            </div>
          </section>

          <!-- Descripción (si existe) -->
          <div v-if="artwork.description" class="description-section">
            <h2 class="section-title">📝 Descripción</h2>
            <p class="description-text">{{ artwork.description }}</p>
          </div>

          <!-- Etiquetas -->
          <div v-if="artwork.tags?.length" class="tags-section">
            <h2 class="section-title">🏷️ Tags</h2>
            <div class="tags-list">
              <span v-for="tag in artwork.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="actions-section">
            <a
              v-if="artwork.external_url"
              :href="artwork.external_url"
              target="_blank"
              rel="noopener noreferrer"
              class="external-link"
            >
              Ver en The Met →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useArtworks } from '@/composables/useArtworks'

const route = useRoute()
const { getArtwork, loading, error } = useArtworks()

const artwork = ref(null)

const loadArtwork = async () => {
  const museumId = route.params.id
  artwork.value = await getArtwork(museumId)
}

const handleImageError = (e) => {
  e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <rect fill='#f5f5f5' width='800' height='600'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            fill='#999' font-family='system-ui' font-size='16'>
        Error al cargar imagen
      </text>
    </svg>
  `)}`
}

onMounted(() => {
  loadArtwork()
})
</script>

<style scoped>
/* ============================================
   CONTENEDOR PRINCIPAL
   ============================================ */
.artwork-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  background: #fafafa;
}

.back-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1565c0;
}

/* ============================================
   SKELETON LOADER
   ============================================ */
.skeleton-loader {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  aspect-ratio: 4/3;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title {
  height: 2.5rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}

.skeleton-artist {
  height: 1.5rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   ERROR STATE
   ============================================ */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 2rem auto;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h2 {
  color: #333;
  margin-bottom: 1rem;
}

.error-state p {
  color: #666;
  margin-bottom: 2rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.retry-button:hover:not(:disabled) {
  background: #1565c0;
}

.retry-button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

/* ============================================
   LAYOUT PRINCIPAL (2 COLUMNAS)
   ============================================ */
.artwork-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.artwork-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

/* ============================================
   COLUMNA IZQUIERDA: IMAGEN
   ============================================ */
.image-column {
  background: #f5f5f5;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  max-width: 500px;
}

.artwork-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.public-domain-badge {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   COLUMNA DERECHA: INFORMACIÓN
   ============================================ */
.info-column {
  padding: 2rem;
  overflow-y: auto;
}

.artwork-header {
  margin-bottom: 1.5rem;
}

.artwork-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.artwork-artist {
  font-size: 1.25rem;
  color: #1976d2;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.artwork-date {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 1.5rem 0;
}

/* ============================================
   SECCIONES DE INFORMACIÓN
   ============================================ */
.info-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #333;
  font-weight: 400;
}

/* ============================================
   DESCRIPCIÓN
   ============================================ */
.description-section {
  margin: 1.5rem 0;
}

.description-text {
  color: #666;
  line-height: 1.7;
  font-size: 0.95rem;
}

/* ============================================
   ETIQUETAS
   ============================================ */
.tags-section {
  margin: 1.5rem 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ============================================
   ACCIONES
   ============================================ */
.actions-section {
  margin: 2rem 0;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.external-link {
  display: inline-block;
  padding: 0.875rem 1.75rem;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s, transform 0.1s;
}

.external-link:hover {
  background: #1565c0;
  transform: translateY(-1px);
}

/* ============================================
   RESPONSIVE: MOBILE (< 768px)
   ============================================ */
@media (max-width: 768px) {
  .artwork-detail {
    padding: 1rem;
  }

  .artwork-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .image-column {
    padding: 1rem;
  }

  .image-container {
    max-width: 100%;
  }

  .info-column {
    padding: 1.25rem;
  }

  .artwork-title {
    font-size: 1.4rem;
  }

  .artwork-artist {
    font-size: 1.1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .skeleton-loader {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   RESPONSIVE: TABLET (768px - 1024px)
   ============================================ */
@media (min-width: 769px) and (max-width: 1024px) {
  .artwork-grid {
    grid-template-columns: 1fr 1fr;
  }

  .image-container {
    max-width: 400px;
  }
}
</style>