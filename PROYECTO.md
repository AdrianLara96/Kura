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

- [X] Usuario puede registrarse/loguearse
- [X] Usuario puede editar su perfil
- [ ] Se pueden fetchear obras
- [X] Las obras se guardan en cache en tu BD

#### Fase 2: Exploración

- Grid de obras responsive
- Filtros por museo, período, artista
- Búsqueda por texto
- Detalle de obra con metadatos
- Paginación/scroll infinito
- Home con destacados

**Criterio de completado:**

- [ ] Grid de obras responsive
- [ ] Filtros funcionan correctamente
- [ ] Detalle de obra muestra toda la información
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