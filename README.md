# Kura

> Descubre el arte. Crea tu legado.

Plataforma de descubrimiento cultural que conecta obras maestras de museos internacionales con colecciones temáticas creadas por usuarios. Kura funciona como un agregador cultural que conecta APIs de instituciones prestigiosas (inicialmente integrada con The Met) con usuarios finales, permitiendo la creación de colecciones temáticas personales y el seguimiento de otros curadores.
El objetivo principal es democratizar el acceso al patrimonio cultural mediante una interfaz intuitiva, similar a las plataformas de streaming musical, pero adaptada al contexto de las bellas artes y la historia.

---

## Stack

El proyecto ha sido desarrollado utilizando tecnologías modernas de JavaScript, priorizando la reactividad, la escalabilidad y la separación de responsabilidades.

- **Frontend:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **Lenguaje:** JavaScript (ES6+)
- **State Management:** Composables personalizados (Patrón Reactivity)
- **Router:** Vue Router 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Estilos:** CSS Nativo con variables CSS (Custom Properties)
- **APIs:** API REST de The Metropolitan Museum of Art

---

## Arquitectura del Sistema

La aplicación sigue una arquitectura basada en componentes modulares y servicios desacoplados, organizada en cinco capas principales:

- **Capa de Presentación:** Compuesta por Vistas y Componentes que gestionan la interfaz responsiva. Implementa estados de carga (skeleton loaders), manejo de errores y diseños adaptativos mediante CSS Grid y Flexbox.
- **Capa de Lógica:** Basada en Composables (`useAuth`, `useCollections`, `useArtworks`) que encapsulan la lógica de negocio y el estado reactivo, facilitando su reutilización transversal en la aplicación.
- **Capa de Servicios:**
  - `museumApi.js`: Gestiona las peticiones HTTP a la API de The Met, integrando reintentos con backoff exponencial, control de tiempos de espera y normalización de datos.
  - `syncService.js`: Sincroniza los metadatos externos con la base de datos local para optimizar la latencia y habilitar consultas complejas.
- **Capa de Almacenamiento:** Gestionada por `storageService.js`, maneja la interacción con Supabase Storage para avatares de usuario. Incluye validación de archivos (tipo y tamaño), construcción fiable de URLs públicas manuales y mecanismos de limpieza para eliminar versiones anteriores al actualizar.
- **Capa de Datos:** Utiliza Supabase (PostgreSQL) para almacenar perfiles, colecciones y relaciones. La seguridad se garantiza mediante Row Level Security (RLS) y funciones RPC para operaciones críticas.

---

## Estructura del proyecto

src/
├── assets/             # Estilos globales y variables CSS
├── components/         # Componentes UI reutilizables
│ ├── artworks/         # Tarjetas y detalles de obras
│ ├── collections/      # Formularios y listas de colecciones
│ ├── comments/         # Sección de comentarios (CommentsSection.vue)
│ └── common/           # Elementos comunes (Nav, LikeButton, FollowButton)
├── composables/        # Lógica de estado reutilizable
│   ├── useAuth.js
│   ├── useCollections.js
│   ├── useArtworks.js
│   └── useCommunity.js # NUEVO - Interacciones sociales
├── router/             # Configuración de rutas protegidas y públicas
├── services/           # Conexión con APIs externas y Supabase
├── views/              # Vistas principales de la aplicación
│   ├── notifications/  # NUEVO - Bandeja de notificaciones
│   └── ...
└── App.vue             # Componente raíz

---

## Funcionalidades Principales

### 1. Exploración y Búsqueda

- **Catálogo Unificado:** Visualización de obras maestras de The Met en una interfaz homogénea.
- **Búsqueda Avanzada:** Filtrado por período histórico, artista y búsqueda textual.
- **Detalle Enriquecido:** Visualización de metadatos extendidos (dimensiones, materiales, nacionalidad del artista, contexto geográfico) con diseño responsive de dos columnas.
- **Resiliencia:** Implementación de lógica de reintentos automáticos (hasta 3 intentos con espera progresiva) y timeouts de 10s ante fallos de conexión con la API externa.
- **Empty States:** Diseños específicos para cuando no hay resultados o no se ha iniciado una búsqueda, sugiriendo términos populares.

### 2. Gestión de Colecciones

- **Curación Personal:** Los usuarios autenticados pueden crear colecciones temáticas, añadiendo títulos, descripciones e imágenes de portada.
- **Organización:** Añadir obras específicas a colecciones existentes o crear nuevas desde la vista de detalle de la obra.
- **Sincronización On-Demand:** Las obras se guardan en la base de datos local automáticamente al ser añadidas a una colección, optimizando el rendimiento.
- **Visibilidad:** Control granular sobre la privacidad de las colecciones (Público/Privado).

### 3. Perfiles y Comunidad

- **Perfiles de Usuario:** Personalización de biografía, avatar y tipo de usuario (artista, curador, entusiasta).
- **Interacción Social:**
  - **Likes:** Dar y quitar like a colecciones con contador en tiempo real.
  - **Comentarios:** Sistema completo de comentarios (crear, editar, eliminar) en colecciones.
  - **Seguir:** Seguir y dejar de seguir a otros curadores con contador de seguidores.
  - **Notificaciones:** Bandeja de notificaciones con contador de no leídas y actualizaciones en tiempo real.
- **Contador de Vistas:** Tracking automático de visualizaciones por colección.

---

## Modelo de Datos

La base de datos relacional en PostgreSQL (Supabase) se estructura principalmente en las siguientes tablas:

- `user_profiles`: Extensión de la tabla de autenticación con datos públicos y preferencias.
- `museum_artworks`: Caché local de obras obtenidas de la API externa, indexadas para búsquedas rápidas.
- `collections`: Contenedores temáticos creados por los usuarios (incluye view_count, like_count).
- `collection_items`: Tabla intermedia que relaciona obras con colecciones, almacenando el orden y notas del usuario.
- `likes`: Relación muchos-a-muchos entre usuarios y colecciones (con unique constraint).
- `comments`: Comentarios de usuarios en colecciones (con trigger para updated_at).
- `follows`: Relaciones de seguimiento entre usuarios (auto-referencial a user_profiles).
- `notifications`: Bandeja de notificaciones por tipo (new_follower, new_comment, collection_liked).

**Seguridad:** Todas las operaciones de lectura y escritura están protegidas mediante políticas RLS (Row Level Security) que garantizan que los usuarios solo puedan modificar sus propios recursos, mientras que los datos públicos son legibles globalmente. Se utilizan funciones RPC con `SECURITY DEFINER` para operaciones de sincronización seguras.

---

## Instalación y Configuración

### Prerrequisitos

- Node.js (versión recomendada: 18.x o superior)
- Cuenta en Supabase configurada con las tablas del esquema
- (Opcional) Clave API para futuras integraciones

### Pasos de Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/AdrianLara96/kura.git
   cd kura

   ```

2. **Instalar dependencias:**

   ```bash
   npm install

   ```

3. **Configurar variables de entorno:**
   Cree un archivo .env en la raíz del proyecto con la siguiente estructura:

   ```env.
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_public

   ```

4. **Ejecutar en modo desarrollo:**

   ```bash
   npm run dev

   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## Roadmap de Desarrollo

El proyecto se ha ejecutado siguiendo una metodología iterativa dividida en fases claras:

| Fase               | Estado     | Objetivo Principal                                                                                                |
| :----------------- | :--------- | :---------------------------------------------------------------------------------------------------------------- |
| **1. Foundation**  | Completado | Autenticación, perfiles de usuario, integración básica con The Met y esquema de base de datos.                    |
| **2. Exploración** | Completado | Motor de búsqueda, filtros avanzados, vista de detalle enriquecida, skeleton loaders y manejo robusto de errores. |
| **3. Colecciones** | Completado | CRUD de colecciones, relación obras-colecciones, galerías públicas, sincronización de datos y funciones RPC.      |
| **4. Comunidad**   | Completado | Sistema de likes, comentarios, seguimiento de usuarios y notificaciones en tiempo real.                           |

---

## Contribución

Este proyecto sirve como base para el aprendizaje de arquitecturas web modernas y la integración de datos culturales abiertos (GLAM). Para contribuir o revisar el código fuente, visite el repositorio oficial en GitHub.

---

## Características de Seguridad

### Sesión Automática (24h)

La aplicación implementa un sistema de cierre automático de sesión por inactividad:

- **Duración:** 24 horas sin actividad
- **Detección:** Monitoriza interacciones del usuario (click, scroll, teclado)
- **Persistencia:** Funciona incluso cerrando el navegador (localStorage)
- **Logout automático:** Al superar el límite, se cierra sesión y redirige al home

---

## Notificaciones Automáticas

El sistema genera notificaciones automáticamente mediante triggers de base de datos:

| Evento | Trigger | Notificación |
|--------|---------|--------------|
| Like en colección | `trigger_notify_collection_liked` | `collection_liked` |
| Comentario en colección | `trigger_notify_new_comment` | `new_comment` |
| Nuevo seguidor | `trigger_notify_new_follower` | `new_follower` |

**Ventajas:**
- Sin código extra en el frontend
- Consistencia garantizada
- Escalable a cualquier número de usuarios

---

## Licencia y Créditos

Los datos de las obras de arte pertenecen a The Metropolitan Museum of Art y se distribuyen bajo su política de uso de datos (generalmente dominio público o Creative Commons Zero para imágenes). El código de la plataforma está disponible bajo licencia abierta para fines educativos y de desarrollo.

---

## Estado Actual

**Versión:** MVP 1.0.0  
**Fases Completadas:** 4/4  
**Estado:** MVP Completo

Hemos completado el roadmap inicial de 4 fases y el proyecto está listo para:
- Testing final de UX
- Deploy a producción
- Feedback de usuarios beta


**Desarrollador Principal:** Adrian Lara  
**Fecha de última actualización:** 10 de abril de 2026
