# 🎨 Kura - Sistema de Diseño (Design System)

> **Versión:** 1.0.0  
> **Última actualización:** 18 de Marzo de 2026  
> **Estado:** Dark First (Tema Oscuro Predeterminado)

## 1. Filosofía de Diseño

Kura es una plataforma de descubrimiento cultural que conecta obras maestras de museos internacionales con colecciones personales. La interfaz debe ser **inmersiva, sofisticada y centrada en el contenido**.

*   **Enfoque "Dark First":** El tema oscuro es el predeterminado y principal. Los fondos oscuros permiten que las obras de arte resalten con mayor vibrancia, reducen la fatiga visual y evocan la atmósfera de una galería o museo nocturno.
*   **Seriedad y Elegancia:** Se evita el uso de emojis. Toda la iconografía se basa en SVGs vectoriales minimalistas y de líneas finas.
*   **Jerarquía Visual:** Uso estricto de tipografía, espaciado y color para guiar la atención del usuario sin elementos distractores.
*   **Inmersión:** Uso de efectos *glassmorphism* (cristal esmerilado) y gradientes sutiles para crear profundidad.

---

## 2. Paleta de Colores

Los colores se definen en `src/assets/main.css` mediante variables CSS semánticas.

### 2.1. Colores de Marca (Identidad)
Estos colores no cambian y definen la esencia de Kura.

| Variable | Valor Hex | Uso |
| :--- | :--- | :--- |
| `--kura-black` | `#000706` | Negro profundo. Fondo base absoluto. |
| `--kura-deep-teal` | `#00272d` | Verde muy oscuro. Fondos secundarios, tarjetas. |
| `--kura-teal` | `#134647` | Verde medio. Bordes activos, hover sutiles. |
| `--kura-bright-teal` | `#0c7e7e` | **Color Primario.** Botones, enlaces, focos, acciones principales. |
| `--kura-gold` | `#bfac8b` | **Color de Acento.** Detalles premium, logos, estados activos destacados, roles de curador. |

### 2.2. Colores Semánticos (Tema Oscuro)
Variables utilizadas en la interfaz diaria.

| Variable | Valor / Referencia | Uso |
| :--- | :--- | :--- |
| `--bg-primary` | `var(--kura-black)` | Fondo de página completo. |
| `--bg-secondary` | `var(--kura-deep-teal)` | Fondo de tarjetas, sidebars, headers. |
| `--bg-tertiary` | `rgba(255, 255, 255, 0.05)` | Fondos sutiles para inputs, listas o hovers. |
| `--text-primary` | `#ffffff` | Títulos, texto principal. |
| `--text-secondary` | `#b3b3b3` | Subtítulos, metadatos, cuerpo de texto secundario. |
| `--text-muted` | `#6e6e6e` | Texto deshabilitado, hints, contadores. |
| `--border-subtle` | `rgba(255, 255, 255, 0.1)` | Bordes casi invisibles para separación sutil. |
| `--border-active` | `var(--kura-teal)` | Bordes al hacer focus o hover activo. |

### 2.3. Colores de Estado (Feedback)
| Estado | Color Sugerido | Uso |
| :--- | :--- | :--- |
| **Error** | `#ff6b6b` (Rojo suave) | Mensajes de error, bordes inválidos, iconos de alerta. |
| **Éxito** | `var(--kura-bright-teal)` | Confirmaciones, checks, estados completados. |
| **Advertencia** | `#ffd700` (Dorado ámbar) | Avisos importantes (usar con moderación). |

---

## 3. Tipografía

*   **Fuente Principal:** `'Inter', system-ui, -apple-system, sans-serif`.
*   **Estilo:** Limpia, legible en tamaños pequeños, moderna.

### Escala Tipográfica
*   **H1 (Títulos de Página):** `2.5rem` - `3.5rem` (Bold/ExtraBold). Tracking negativo (`-0.02em`).
*   **H2 (Títulos de Sección):** `1.75rem` - `2rem` (Bold).
*   **H3 (Títulos de Tarjeta):** `1.1rem` - `1.25rem` (SemiBold).
*   **Cuerpo:** `1rem` (Regular). Line-height `1.6`.
*   **Metadatos/Captions:** `0.85rem` - `0.9rem` (Regular/Medium). Color `--text-secondary`.
*   **Hints/Labels:** `0.75rem` - `0.8rem` (Medium). Uppercase, tracking amplio (`0.05em`).

---

## 4. Iconografía

*   **Regla de Oro:** **NO USAR EMOJIS**.
*   **Estilo:** SVG inline o componentes de iconos.
*   **Grosor de trazo (Stroke-width):**
    *   Iconos decorativos/grandes: `1` o `1.5`.
    *   Iconos de interfaz/acción: `2`.
*   **Color:** Heredan el `currentColor` del padre, salvo que requieran énfasis (ej. iconos de error en rojo, éxito en teal).
*   **Biblioteca recomendada:** Lucide, Heroicons o SVGs personalizados a mano.

---

## 5. Componentes y Patrones UI

### 5.1. Botones
*   **Forma:** `border-radius: var(--radius-full)` (Pill-shaped) para acciones principales. `var(--radius-md)` para secundarios.
*   **Primario:** Fondo `--kura-bright-teal`, texto blanco. Hover: Elevación (`translateY(-2px)`) y sombra de color (`box-shadow`).
*   **Secundario/Outline:** Fondo transparente, borde `--border-subtle`. Hover: Borde blanco o fondo `--bg-tertiary`.
*   **Peligro:** Fondo rojo suave o borde rojo. Texto rojo o blanco.

### 5.2. Tarjetas (Cards)
*   **Fondo:** `--bg-secondary` o `rgba(19, 70, 71, 0.15)` para efecto cristal.
*   **Borde:** `1px solid --border-subtle`.
*   **Hover:** Elevación sutil (`translateY(-4px)`), cambio de borde a dorado tenue o teal, sombra más profunda.
*   **Imágenes:** `object-fit: cover`. Bordes redondeados heredados o internos.

### 5.3. Inputs y Formularios
*   **Fondo:** `--bg-primary` (más oscuro que la tarjeta contenedora).
*   **Borde:** `--border-subtle`.
*   **Focus:** Borde `--kura-bright-teal` + `box-shadow` difuminado del mismo color.
*   **Iconos:** Integrados a la izquierda dentro del wrapper del input. Color `--text-muted` que cambia a `--kura-bright-teal` en focus.

### 5.4. Glassmorphism (Efecto Cristal)
Usado en navegación, modales y tarjetas destacadas.
```css
background: rgba(19, 70, 71, 0.2);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### 5.5. Estados vacíos (Empty States)
*   No dejar espacios en blanco.
*   Usar iconos SVG grandes y sutiles (opacity 0.3-0.5).
*   Texto descriptivo amable pero profesional.
*   Botón de llamada a la acción (CTA) claro.

---

## 6. Espaciado y Layout

*   **Unidad Base:** `rem` (1rem = 16px).
*   **Escala:**
    *   `--spacing-xs`: 0.5rem (8px)
    *   `--spacing-sm`: 0.75rem (12px)
    *   `--spacing-md`: 1rem (16px)
    *   `--spacing-lg`: 1.5rem (24px)
    *   `--spacing-xl`: 2rem (32px)
    *   `--spacing-xxl`: 3rem (48px)
*   **Container:** Máximo `1200px` - `1400px` centrado. Padding lateral `1.5rem` - `2rem`.

---

## 7. Animaciones y Transiciones

*   **Duración:**
    *   Rápida (Micro-interacciones): `0.2s`
    *   Normal (Hover, Focus): `0.3s`
    *   Lenta (Entradas de página): `0.5s`
*   **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` para sensación natural y premium.
*   **Patrones Comunes:**
    *   `fadeIn`: Opacidad 0 a 1.
    *   `slideUp`: Transform Y +20px a 0 + Opacidad.
    *   `shimmer`: Para skeletons de carga (gradiente moviéndose).

---

## 8. Guía de Implementación (Vue 3)

1.  **Variables Globales:** Siempre usar `var(--nombre-variable)`. Evitar valores hardcodeados.
2.  **Componentes Reutilizables:** Crear componentes base para `Btn`, `Input`, `Card` que ya incluyan estos estilos.
3.  **Iconos:** Preferir SVGs inline en templates para controlar colores con CSS (`stroke="currentColor"`).
4.  **Accesibilidad:**
    *   Contraste mínimo AA entre texto y fondo.
    *   Estados de `:focus-visible` claros y visibles.
    *   Textos alternativos en imágenes (`alt`).

---

## 9. Check-list para Nuevas Vistas

Antes de hacer commit de una nueva vista/componente, verificar:
- [ ] ¿El fondo es oscuro (`--bg-primary`)?
- [ ] ¿He eliminado todos los emojis?
- [ ] ¿Los iconos son SVGs profesionales?
- [ ] ¿Los botones usan los colores de marca (Teal/Dorado)?
- [ ] ¿Los inputs tienen el estado de foco correcto?
- [ ] ¿Las tarjetas tienen el efecto glass o borde sutil?
- [ ] ¿La tipografía sigue la jerarquía establecida?
- [ ] ¿Hay animaciones suaves en cargas y hovers?
