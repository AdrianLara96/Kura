## Proyecto : Kura

---

**Estado:** Proyecto iniciado

**Concepto:** Plataforma de descubrimiento cultural que conecta obras maestras de museos internacionales con colecciones temáticas creadas por usuarios.

---

### Información del Proyecto

| Campo                 | Valor                                     |
| --------------------- | ----------------------------------------- |
| **Nombre**            | Kura                                      |
| **Tipo**              | Plataforma web de descubrimiento cultural |
| **Stack**             | Vue 3 + Vite + JavaScript + Supabase      |
| **Duración estimada** | 8 semanas (MVP de 4 fases)                |
| **APIs**              | Rijksmuseum, The Met, Museo del Prado     |

---

### Roadmap del MVP (4 Fases)

| Fase           | Duración  | Objetivo                                |
| -------------- | --------- | --------------------------------------- |
| 1. Foundation  | 2 semanas | Auth + Perfiles + API de museos + BD    |
| 2. Exploración | 2 semanas | Explorador de obras + filtros + detalle |
| 3. Colecciones | 2 semanas | Crear/guardar colecciones personales    |
| 4. Comunidad   | 2 semanas | Likes, comentarios, seguir usuarios     |

---

### Esquema de Base de Datos

#### Tabla: user_profiles

| Columna      | Tipo        | Descripción                       |
| ------------ | ----------- | --------------------------------- |
| id           | uuid        | PK, referencia a auth.users       |
| username     | text        | Único para URLs amigables         |
| display_name | text        | Nombre visible                    |
| bio          | text        | Biografía del usuario             |
| avatar_url   | text        | URL del avatar en Storage         |
| user_type    | text        | 'artist', 'curator', 'enthusiast' |
| location     | text        | Ubicación geográfica              |
| website_url  | text        | Sitio web personal                |
| is_public    | boolean     | Perfil visible públicamente       |
| created_at   | timestamptz | Fecha de creación                 |
| updated_at   | timestamptz | Fecha de modificación             |

#### Tabla: museum_artworks

| Columna          | Tipo        | Descripción                     |
| ---------------- | ----------- | ------------------------------- |
| id               | uuid        | PK                              |
| museum_id        | text        | ID en la API del museo          |
| museum_name      | text        | 'Rijksmuseum', 'Met', 'Prado'   |
| external_url     | text        | URL original en el museo        |
| title            | text        | Título de la obra               |
| artist_name      | text        | Nombre del artista              |
| creation_date    | text        | Fecha de creación               |
| period           | text        | 'Renacimiento', 'Barroco', etc. |
| image_url        | text        | URL de la imagen                |
| thumbnail_url    | text        | URL de miniatura                |
| description      | text        | Descripción de la obra          |
| tags             | text[]      | Etiquetas                       |
| is_public_domain | boolean     | Dominio público                 |
| last_synced_at   | timestamptz | Última sincronización           |
| created_at       | timestamptz | Fecha de creación               |

#### Tabla: collections

| Columna         | Tipo        | Descripción            |
| --------------- | ----------- | ---------------------- |
| id              | uuid        | PK                     |
| user_id         | uuid        | FK → user_profiles.id  |
| title           | text        | Título de la colección |
| description     | text        | Descripción            |
| cover_image_url | text        | Imagen de portada      |
| is_public       | boolean     | Visible públicamente   |
| view_count      | integer     | Número de vistas       |
| like_count      | integer     | Número de likes        |
| created_at      | timestamptz | Fecha de creación      |
| updated_at      | timestamptz | Fecha de modificación  |

#### Tabla: collection_items

| Columna           | Tipo        | Descripción             |
| ----------------- | ----------- | ----------------------- |
| id                | uuid        | PK                      |
| collection_id     | uuid        | FK → collections.id     |
| museum_artwork_id | uuid        | FK → museum_artworks.id |
| position          | integer     | Orden en la colección   |
| user_note         | text        | Nota del usuario        |
| added_at          | timestamptz | Fecha de añadido        |

#### Tabla: likes

| Columna       | Tipo        | Descripción           |
| ------------- | ----------- | --------------------- |
| id            | uuid        | PK                    |
| user_id       | uuid        | FK → user_profiles.id |
| collection_id | uuid        | FK → collections.id   |
| created_at    | timestamptz | Fecha del like        |

#### Tabla: comments

| Columna       | Tipo        | Descripción              |
| ------------- | ----------- | ------------------------ |
| id            | uuid        | PK                       |
| user_id       | uuid        | FK → user_profiles.id    |
| collection_id | uuid        | FK → collections.id      |
| content       | text        | Contenido del comentario |
| created_at    | timestamptz | Fecha de creación        |
| updated_at    | timestamptz | Fecha de modificación    |

#### Tabla: follows

| Columna      | Tipo        | Descripción           |
| ------------ | ----------- | --------------------- |
| id           | uuid        | PK                    |
| follower_id  | uuid        | FK → user_profiles.id |
| following_id | uuid        | FK → user_profiles.id |
| created_at   | timestamptz | Fecha de seguimiento  |

#### Tabla: notifications

| Columna    | Tipo        | Descripción                                       |
| ---------- | ----------- | ------------------------------------------------- |
| id         | uuid        | PK                                                |
| user_id    | uuid        | FK → user_profiles.id                             |
| type       | text        | 'new_follower', 'new_comment', 'collection_liked' |
| message    | text        | Mensaje de notificación                           |
| link_url   | text        | URL de destino                                    |
| is_read    | boolean     | Leída o no                                        |
| created_at | timestamptz | Fecha de creación                                 |

---

### Políticas RLS Principales

| Tabla                  | Operación            | Condición                                |
| ---------------------- | -------------------- | ---------------------------------------- |
| user_profiles          | SELECT               | is_public = true OR auth.uid() = id      |
| user_profiles          | UPDATE               | auth.uid() = id                          |
| museum_artworks        | SELECT               | true (público)                           |
| museum_artworks        | ALL                  | Solo admins                              |
| collections            | SELECT               | is_public = true OR auth.uid() = user_id |
| collections            | INSERT/UPDATE/DELETE | auth.uid() = user_id                     |
| collection_items       | ALL                  | Usuarios con acceso a la colección       |
| likes/comments/follows | SELECT               | true (público)                           |
| likes/comments/follows | INSERT               | auth.uid() = user_id                     |
| notifications          | SELECT/UPDATE        | auth.uid() = user_id                     |

---

### Estructura de Rutas

#### Rutas Públicas

| Ruta                      | Componente         | Descripción            |
| ------------------------- | ------------------ | ---------------------- |
| `/`                       | HomeView           | Home: obras destacadas |
| `/explore`                | ExploreView        | Explorador de obras    |
| `/explore/museum/:name`   | ExploreView        | Filtrar por museo      |
| `/explore/period/:period` | ExploreView        | Filtrar por período    |
| `/artwork/:id`            | ArtworkDetail      | Detalle de obra        |
| `/collections`            | CollectionsGallery | Colecciones destacadas |
| `/collections/:id`        | CollectionDetail   | Ver colección          |
| `/profile/:username`      | PublicProfileView  | Perfil público         |

#### Rutas Privadas

| Ruta                       | Componente        | Descripción               |
| -------------------------- | ----------------- | ------------------------- |
| `/dashboard`               | DashboardView     | Mi actividad              |
| `/my-collections`          | MyCollectionsView | Mis colecciones           |
| `/my-collections/new`      | CollectionForm    | Crear colección           |
| `/my-collections/:id/edit` | CollectionEdit    | Editar colección          |
| `/my-profile`              | ProfileEdit       | Editar perfil             |
| `/my-likes`                | MyLikesView       | Colecciones que me gustan |
| `/my-following`            | MyFollowingView   | Usuarios que sigo         |
| `/notifications`           | NotificationsView | Mis notificaciones        |

---

### Estructura de Carpetas

src/
├── services/
│ ├── museumApi.js # APIs de museos
│ └── syncService.js # Sincronización con BD
├── composables/
│ ├── useAuth.js
│ ├── useCollections.js
│ └── useNotifications.js
├── views/
│ ├── auth/
│ ├── profile/
│ ├── explore/
│ ├── collections/
│ └── dashboard/
└── components/
├── artworks/
├── collections/
├── comments/
└── common/

---

### 🔌 APIs de Museos

| Museo              | URL                              | Key         | Obras      |
| ------------------ | -------------------------------- | ----------- | ---------- |
| Rijksmuseum 🇳🇱     | rijksmuseum.nl/api/en/collection | Sí (gratis) | 600,000+   |
| The Met 🇺🇸         | collectionapi.metmuseum.org      | No          | 490,000+   |
| Museo del Prado 🇪🇸 | museodelprado.es/api             | No          | 18,000+    |
| V&A 🇬🇧             | vam.ac.uk/api                    | Sí (gratis) | 1,000,000+ |
| Smithsonian 🇺🇸     | api.si.edu                       | Sí (gratis) | 3,300,000+ |

---

### Variables de Entorno

**Supabase**
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_public

**APIs de Museos**
VITE_RIJKS_API_KEY=tu_api_key_de_rijksmuseum

---

### Features por Fase

#### Fase 1: Foundation

- Auth completo (login, registro, logout)
- Perfiles de usuario editables
- Integración API
- Sincronización con cache (7 días)
- Router protegido

**Criterio de completado:**

- [x] Usuario puede registrarse/loguearse
- [x] Usuario puede editar su perfil
- [x] Se pueden fetchear obras
- [x] Las obras se guardan en cache en tu BD

#### Fase 2: Exploración

- Grid de obras responsive
- Filtros por museo, período, artista
- Búsqueda por texto
- Detalle de obra con metadatos
- Paginación/scroll infinito
- Home con destacados

**Criterio de completado:**

- [x] Grid de obras responsive
- [ ] Filtros funcionan correctamente
- [x] Detalle de obra muestra toda la información
- [ ] Home muestra obras destacadas del día

#### Fase 3: Colecciones

- Crear colección (título, descripción, portada)
- Añadir obras desde explorador
- Ver colección propia y pública
- Editar/eliminar colecciones
- Galería de colecciones públicas

**Criterio de completado:**

- [ ] Crear colección con título y descripción
- [ ] Añadir obras desde el explorador
- [ ] Ver colección propia y pública
- [ ] Editar/eliminar colecciones propias

#### Fase 4: Comunidad

- Likes en colecciones
- Comentarios en colecciones
- Seguir usuarios
- Perfil público de usuario
- Notificaciones básicas

**Criterio de completado:**

- [ ] Dar like a colecciones
- [ ] Comentar en colecciones
- [ ] Seguir/dejar de seguir usuarios
- [ ] Recibir notificaciones cuando alguien interactúa contigo

---

### Features Futuras (Post-MVP)

| Feature                                          | Complejidad |
| ------------------------------------------------ | ----------- |
| Más museos (Met, Prado, V&A)                     | Baja        |
| Artistas emergentes (upload obras)               | Media       |
| "Inspirado por" (vincular clásico-contemporáneo) | Media       |
| Rutas de aprendizaje                             | Media       |
| Time Travel Slider                               | Alta        |
| Extracción de colores                            | Media       |
| Mapa mundial                                     | Media       |
| Eventos virtuales                                | Media       |
| NFT Marketplace                                  | Alta        |
| AI Art Historian (chatbot)                       | Alta        |

---

### Enlaces de Referencia

| Recurso                | URL                                              |
| ---------------------- | ------------------------------------------------ |
| Documentación Vue 3    | https://vuejs.org/                               |
| Documentación Supabase | https://supabase.com/docs                        |
| Rijksmuseum API        | https://data.rijksmuseum.nl/object-metadata/api/ |
| The Met API            | https://metmuseum.github.io/                     |
| Museo del Prado API    | https://www.museodelprado.es/api/                |

---

### 📝 Notas para Cuando Empiece el Proyecto

1. **Empezar con Fase 1** siguiendo el orden establecido
2. **Obtener API key de Rijksmuseum** antes de comenzar (gratis, 5 minutos)
3. **Configurar RLS policies** antes de cualquier prueba
4. **Implementar cache de 7 días** para reducir llamadas a APIs
5. **Mantener .env fuera de Git** usando .gitignore
6. **Documentar cada fase** en este mismo archivo

---

### **Documento creado:** 04/03/2026\*

---

# Bitácora de Desarrollo - Kura

Registro de todos los pasos, decisiones y cambios del proyecto.

---

## [2026-03-04] Paso 1: Setup Inicial del Proyecto

### Completado

- [x] Nombre del proyecto: **Kura**
- [x] Crear proyecto con Vite + Vue 3
- [x] Instalar dependencias base (vue-router, pinia, supabase-js, axios)
- [x] Crear estructura de carpetas
- [x] Configurar `.env` y `.gitignore`
- [x] Crear archivos base:
  - `src/.env`
  - `src/router/index.js`
  - `src/supabase/client.js`
  - `src/services/museumApi.js`
  - `src/services/syncService.js`
- [x] Primer commit realizado

### Notas

- Estructura de carpetas alineada con roadmap de 4 fases

### Siguiente Paso

- Configurar proyecto en Supabase (tablas + RLS)

---

## [2026-03-12] ✅ FASE 1: FOUNDATION - COMPLETADA

### Logros técnicos

- [x] Auth con Supabase + Vue 3 (login, registro, logout, sesiones)
- [x] Perfiles editables + Storage para avatares + RLS policies
- [x] BD: user_profiles + museum_artworks con índices + caché TTL
- [x] Integración API: museumApi.js + syncService.js + useArtworks.js
- [x] Mock data con 5 obras reales del Met (URLs verificadas)
- [x] Router protegido con guards para rutas públicas/privadas
- [x] UI base: Home, Explore, Detail, Profile, Dashboard funcionales
- [x] Navegación global: TopNav componente reutilizable
- [x] Estado de auth reactivo en toda la app (login/logout condicional)

### URLs verificadas (imágenes reales del Met)

- DP-42549-001.jpg (Van Gogh - Wheat Field with Cypresses)
- DP346475.jpg (Van Gogh - Roses)
- DP164788.jpg (Dürer - Virgin and Child)
- DP158156.jpg (Gatti - Translation of Loreto)
- DP349564.jpg (El Greco - View of Toledo)

### Próximo: Fase 2 - Exploración avanzada

- Grid responsive con lazy loading de imágenes
- Filtros combinados: museo + período + artista + tags
- Búsqueda full-text con índice GIN en PostgreSQL
- Infinite scroll / paginación optimizada
- Home con obras destacadas curadas

---

# 📅 Fase 2: Exploración - Documentación Técnica

**Fecha de inicio:** 13 de marzo de 2026  
**Fecha de finalización:** 14 de marzo de 2026  
**Estado:** ✅ COMPLETADA

---

## Objetivos fase 2

- Integrar la API real de The Met reemplazando los datos simulados (mock data).
- Implementar un "Empty State" en la vista de exploración que evite búsquedas automáticas al cargar.
- Diseñar un layout responsive de dos columnas para la vista de detalle de obras.
- Mostrar más de 15 campos de metadatos extendidos (nacionalidad, edad del artista, materiales, dimensiones, contexto geográfico).
- Establecer un manejo robusto de errores con reintentos automáticos y tiempos de espera.

## Cambios técnicos realizados

- **Implementación de Retry con Backoff Exponencial:** Se creó una función personalizada para realizar peticiones HTTP que reintenta automáticamente hasta 3 veces si falla, esperando progresivamente más tiempo (1s, 2s, 4s) entre cada intento.
- **Gestión de Tiempos de Espera (Timeout):** Se estableció un límite máximo de 10 segundos por petición para evitar que la interfaz se quede bloqueada indefinidamente si la API externa no responde.
- **Normalización de Datos Centralizada:** Se desarrolló un proceso único que transforma la respuesta compleja de la API del Met al formato estandarizado que utiliza nuestra aplicación, filtrando automáticamente las obras que no tienen imágenes.
- **Estados de Carga Visuales (Skeleton Loaders):** Se sustituyeron los mensajes de texto de "Cargando..." por animaciones visuales que imitan la estructura del contenido final, mejorando la percepción de velocidad.
- **Lógica Condicional en Vistas:** Se refactorizó la lógica de renderizado para distinguir claramente entre estado inicial (sin búsqueda), carga, error, sin resultados y resultados exitosos.
- **Diseño Responsive con CSS Grid:** Se aplicó un sistema de rejilla que muestra dos columnas en pantallas grandes (imagen a la izquierda, información a la derecha) y colapsa a una sola columna vertical en dispositivos móviles.

## Archivos modificados o incluidos

- `src/services/museumApi.js`: Reescritura completa para conectar con la API real, incluyendo lógica de reintentos y normalización.
- `src/composables/useArtworks.js`: Ampliación con nuevas funciones para obtener obras destacadas, recargar búsquedas y limpiar errores.
- `src/views/explore/ExploreView.vue`: Modificación para eliminar la carga automática inicial e incluir el nuevo diseño de estado vacío con sugerencias.
- `src/views/explore/ArtworkDetail.vue`: Rediseño total de la interfaz para soportar el layout de dos columnas y la visualización detallada de metadatos.

## Resumen de nuevas funcionalidades

- **Búsqueda bajo demanda:** La aplicación ya no realiza peticiones innecesarias al abrir la sección de explorar; espera activamente a que el usuario introduzca un término o seleccione una sugerencia.
- **Sugerencias de búsqueda rápidas:** En la pantalla de inicio del explorador, se muestran chips interactivos con términos populares (como "Van Gogh" o "Arte Egipcio") para facilitar el descubrimiento inmediato.
- **Resiliencia ante fallos de red:** El sistema es capaz de recuperarse automáticamente de caídas temporales del servidor del museo o problemas de conexión intermitentes sin mostrar errores al usuario.
- **Filtrado inteligente de contenidos:** Las obras que carecen de imágenes o cuyos identificadores han sido eliminados de la base de datos del museo se descartan silenciosamente para no romper la visualización.
- **Visualización enriquecida de detalles:** La ficha de cada obra ahora presenta información contextual completa dividida en secciones lógicas: datos del artista, características físicas de la obra y ubicación geográfica histórica.
- **Indicadores de Dominio Público:** Se muestran distintivos visuales para identificar claramente las obras que son de libre uso y dominio público.
- **Navegación de retorno intuitiva:** Se ha añadido una navegación clara para volver a la lista de exploración desde el detalle sin perder el contexto de búsqueda.

---

## [2026-03-16] FASE 3: COLECCIONES - SESIÓN 1 ✅

### Completado

- [x] **Paso 1:** Tablas Supabase creadas
  - `collections` (10 columnas + FK a auth.users)
  - `collection_items` (6 columnas + FK a collections + museum_artworks)
  - 8 políticas RLS configuradas (4 por tabla)
- [x] **Paso 2:** Composable `useCollections.js`
  - Funciones CRUD: create, read, update, delete
  - Funciones de items: addArtwork, removeArtwork, updateNote
  - Estados reactivos: collections, currentCollection, items, loading, error
  - Propiedad computada: isOwner
- [x] **Paso 3:** Vista `MyCollectionsView.vue`
  - Grid responsive de colecciones
  - Estados: skeleton, error, empty, success
  - Modales para crear/editar y confirmar borrado
  - Acciones por colección: ver, editar, eliminar
- [x] **Paso 4:** Componente `CollectionForm.vue`
  - Formulario reutilizable con props y emits
  - Validaciones en tiempo real (título, URL)
  - Preview de imagen de portada
  - Contador de caracteres para descripción
  - Refactorización de MyCollectionsView para usar el componente
- [x] **Paso Extra:** Variables CSS globales
  - Paleta de colores Kura (5 colores principales)
  - Variables de espaciado, border-radius, sombras
  - Tipografía Inter como font-main
  - Animaciones: pulse, shimmer, spin

### Archivos Creados/Modificados

| Archivo                                         | Tipo       | Descripción                  |
| ----------------------------------------------- | ---------- | ---------------------------- |
| `src/assets/main.css`                           | Creado     | Variables CSS globales       |
| `src/composables/useCollections.js`             | Creado     | Lógica de colecciones        |
| `src/views/collections/MyCollectionsView.vue`   | Creado     | Vista principal              |
| `src/components/collections/CollectionForm.vue` | Creado     | Formulario reutilizable      |
| `src/router/index.js`                           | Modificado | Ruta /my-collections añadida |

### Decisiones Técnicas

1. **Separación de formulario en componente:**
   - Permite reutilización en múltiples rutas
   - Facilita testing aislado
   - Sigue Single Responsibility Principle

2. **Validaciones en el componente hijo:**
   - CollectionForm valida antes de emitir submit
   - El componente padre recibe datos ya limpios
   - Mejor separación de responsabilidades

3. **Variables CSS en :root:**
   - Consistencia visual en toda la app
   - Fácil mantenimiento de la paleta
   - Soporte para temas futuros (dark mode)

### Pruebas Realizadas

- [x] Crear colección nueva funciona
- [x] Editar colección existente funciona
- [x] Eliminar colección con confirmación funciona
- [x] Validaciones de formulario activas
- [x] Responsive en mobile (< 768px)
- [x] Estados de carga y error visibles

### Pendientes para Fase 3

- [ ] Paso 5: Añadir botón "Añadir a colección" en ArtworkDetail.vue
- [ ] Paso 6: Crear vista CollectionDetail.vue (ver colección)
- [ ] Paso 7: Crear vista CollectionsGallery.vue (colecciones públicas)
- [ ] Paso 8: Testing final y ajustes de UX

### Notas

- Las políticas RLS verifican que solo el dueño pueda editar/borrar
- El formulario soporta modo crear y editar con misma interfaz
- Las colecciones pueden ser públicas o privadas
- Preview de portada valida que la URL sea imagen

### Siguiente Sesión

Continuar con **Paso 5: Integrar "Añadir a colección" en ArtworkDetail.vue**

---

## [2026-03-17] FASE 3: COLECCIONES - SESIÓN 2 ✅

### Completado

- [x] **Paso 5:** Añadir obras a colecciones desde ArtworkDetail.vue
  - Botón "➕ Añadir a colección" en vista de detalle
  - Modal de selección de colecciones existentes
  - Creación rápida de colecciones sin salir del modal
  - Sincronización automática de obras en museum_artworks
  - Función RPC `sync_museum_artwork` con SECURITY DEFINER
  - Toast notifications para feedback de éxito/error
  - Validación de usuario autenticado

### Archivos Modificados

| Archivo                               | Cambios                                 |
| ------------------------------------- | --------------------------------------- |
| `src/views/explore/ArtworkDetail.vue` | +200 líneas (modales, lógica de añadir) |
| `src/composables/useCollections.js`   | Corrección en addArtworkToCollection    |
| Supabase Functions                    | Nueva función: sync_museum_artwork      |

### Problemas Solucionados

1. **Error 403 (RLS)** → Función RPC con SECURITY DEFINER
2. **Error 406 (SELECT)** → Eliminado SELECT previo, solo RPC
3. **artwork.id undefined** → Sincronización on-demand de obras

### Pruebas Realizadas

- [x] Añadir obra a colección existente
- [x] Crear nueva colección desde modal
- [x] Verificación de obras en /my-collections
- [x] Consola limpia sin errores

### Pendientes para Fase 3

- [ ] Paso 6: Crear vista CollectionDetail.vue (ver colección)
- [ ] Paso 7: Crear vista CollectionsGallery.vue (colecciones públicas)
- [ ] Paso 8: Testing final y ajustes de UX

---
