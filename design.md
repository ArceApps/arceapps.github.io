# Sistema de Diseño de ArceApps

Este documento define la identidad visual, la paleta de colores, la tipografía y los patrones de interfaz de usuario (UI/UX) utilizados en **ArceApps**. Sirve como guía de estilos tanto para desarrolladores como para agentes de IA que colaboren en el proyecto, garantizando consistencia estética y funcional.

---

## 1. Filosofía de Diseño: El Espíritu Indie

El diseño de ArceApps se rige por la filosofía **Indie Dev / Solopreneur**:
- **Sobrio y Técnico:** Un sitio creado por y para desarrolladores. La estética debe ser profesional, limpia y enfocada en el contenido.
- **Material-Inspired con Toques Modernos:** Basado en las guías de Material Design 3 (MD3) para las elevaciones, tarjetas y contraste, pero enriquecido con elementos interactivos modernos como Glassmorphism y animaciones fluidas en CSS.
- **Sin Elementos Corporativos:** Evitar interfaces genéricas de "plantillas empresariales B2B". El sitio debe sentirse personal, artesanal y dinámico.

---

## 2. Paleta de Colores (Brand Colors)

El sitio utiliza una paleta de colores contrastante que combina tonos fríos de tecnología con acentos cálidos y creativos.

### 2.1. Colores de Identidad (Marca)

| Color | Variable CSS | Código HEX | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Teal (Primario)** | `--color-primary` | `#018786` | Botones principales, enlaces en hover (oscuro), títulos destacados, bordes interactivos. |
| **Orange (Secundario)** | `--color-secondary` | `#FF9800` | Acentos, llamadas a la acción, enlaces activos (oscuro), estados de hover en enlaces (claro). |

### 2.2. Modo Claro (Light Mode)

Diseño limpio sobre fondos completamente blancos y grises tenues de baja saturación.

| Elemento | Variable CSS | Código HEX | Propósito |
| :--- | :--- | :--- | :--- |
| **Fondo Base (Surface)** | `--color-surface` | `#FFFFFF` | Fondo del sitio y fondo de tarjetas base. |
| **Fondo Variante** | `--color-surface-variant` | `#F4F5F7` | Fondos de secciones, barras de código y elementos secundarios. |
| **Texto Principal** | `--color-on-surface` | `#1C1B1F` | Títulos, párrafos y lecturas principales (alto contraste). |
| **Texto Secundario** | `--color-on-surface-variant`| `#49454F` | Metadatos, subtítulos y texto atenuado. |

### 2.3. Modo Oscuro (Dark Mode)

Fondo oscuro profundo con superficies grises elevadas para evitar la fatiga visual de pantallas OLED de noche. Se activa mediante la clase `.dark` en la etiqueta `<html>`.

| Elemento | Variable CSS | Código HEX | Propósito |
| :--- | :--- | :--- | :--- |
| **Fondo Base (Surface)** | `--color-dark-surface` | `#121212` | Fondo principal oscuro del sitio. |
| **Fondo Variante** | `--color-dark-surface-variant`| `#1C1C1E` | Superficies de tarjetas, inputs y barras secundarias en modo oscuro. |
| **Texto Principal** | `--color-dark-on-surface` | `#F5F5F5` | Texto principal en modo oscuro (legibilidad optimizada). |
| **Texto Secundario** | `--color-dark-on-surface-variant`| `#E0E0E0` | Texto secundario y metadatos oscuros. |

---

## 3. Tipografía

La tipografía está optimizada para la lectura técnica prolongada y se adapta dinámicamente según la interacción del usuario.

### 3.1. Fuentes del Sistema

- **Sans-serif (Texto Base e Interfaces):**
  - Variable CSS: `--font-sans`
  - Valor: `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif`
  - *Nota:* Usamos **Inter** como tipografía variable para controlar de forma nativa los pesos y transiciones de carga.
- **Headings (Títulos):**
  - Variable CSS: `--font-heading`
  - Valor: `'Inter Variable', 'Inter', system-ui, sans-serif`
- **Monospace (Código e Información Estructurada):**
  - Clases: `font-mono text-sm`
  - Fuente: Fuente por defecto de sistema mono (Fira Code, JetBrains Mono o SF Mono según el sistema operativo).
- **Serif (Citas / Blockquotes):**
  - Clases: `font-serif text-lg`
  - Valor: Usada exclusivamente para dar énfasis en elementos `<blockquote/>`.

### 3.2. Animación de Peso Tipográfico Variable (Variable Font Weight)

Aprovechando las fuentes variables en CSS, los encabezados cambian sutilmente de grosor al interactuar con ellos:
- **Títulos (`h1` a `h6`):** Por defecto tienen peso `500` (`font-medium`). Al hacer hover, suben suavemente a un peso de `650`.
- **Negritas (`.font-semibold` / `.font-bold`):**
  - `Semibold (600)` -> Hover a `700` (`font-bold`).
  - `Bold (700)` -> Hover a `800` (`font-extrabold`).
  - `Extra Bold (800)` -> Hover a `900`.
- *Transición:* Las variaciones se aplican con una transición suave (`transition: font-variation-settings 0.3s ease-out`).

---

## 4. Componentes y Utilidades Visuales

### 4.1. Elevaciones (Sombras MD3)
Utilizamos sombras nativas que simulan la elevación y profundidad física de los componentes:
*   **`.elevation-1`:** Sombra sutil para componentes al nivel del suelo (ej. menús desplegables).
    `box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);`
*   **`.elevation-2`:** Elevación intermedia para tarjetas interactivas estáticas.
    `box-shadow: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);`
*   **`.elevation-3`:** Elevación máxima para modales, overlays o tarjetas activas al hacer hover.
    `box-shadow: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);`

### 4.2. Tarjetas (Cards)

El sitio implementa dos estilos principales de tarjetas:
1.  **Tarjeta Material (`.material-card`):**
    Bordes redondeados de 12px (`rounded-xl`), fondo blanco en modo claro (`bg-surface`) y gris oscuro en modo oscuro (`dark:bg-dark-surface-variant`). Borde gris fino de 1px.
2.  **Tarjeta Espacial con Glassmorphism 2.0 (`.spatial-card`):**
    - **En modo claro:** Fondo semi-translúcido (`bg-surface/90`), borde difuminado (`border-gray-200/60`) y desenfoque de fondo (`backdrop-blur-md`).
    - **En modo oscuro:** Fondo translúcido profundo (`dark:bg-[#1e1e1e]/60`), desenfoque fuerte (`dark:backdrop-blur-xl`) y un **borde con gradiente dinámico** de Teal (`#018786`) a Naranja (`#FF9800`) mediante el pseudo-elemento `::before` y una máscara de exclusión CSS. Cuenta también con un brillo superior interno (`::after`) para dar profundidad 3D.

### 4.3. Estilo de Artículos y Contenido Técnico (`.prose`)
Los artículos renderizados a partir de Markdown usan Tailwind Typography personalizado:
- **Títulos:** Texto en color primario (`--color-primary`) en modo claro, y blanco en modo oscuro.
- **Enlaces:** Color primario, peso semibold. En modo oscuro, los enlaces cambian a naranja secundario (`--color-secondary`) por defecto y hacen hover en teal primario.
- **Citas (Blockquotes):** Borde izquierdo de 4px en Teal primario con un fondo sutilmente translúcido y bordes redondeados a la derecha.
- **Multimedia:** Las imágenes y videos tienen bordes redondeados (`rounded-2xl`), sombra y un ancho máximo de `500px` centrado para evitar desproporciones visuales en pantallas grandes.
- **Código en Línea (Inline Code):** Texto naranja en modo claro y celeste/teal claro en modo oscuro, con un fondo gris.
- **Bloques de Código:** Fondo muy oscuro (`#1e1e1e` / `#1a1a1a`), con bordes redondeados y un botón flotante de copiado rápido (`.copy-code-btn`) que aparece suavemente en hover.

---

## 5. Animaciones y Transiciones Nativas

Buscamos interfaces dinámicas que sientan responsivas al tacto y al scroll:
*   **Scroll-Driven Animations:**
    *   **Barra de progreso de lectura (`.scroll-progress-bar`):** Situada en la parte superior, se llena horizontalmente a medida que el usuario hace scroll usando la propiedad nativa de CSS `animation-timeline: scroll()`.
    *   **Efecto de revelado (`.fade-in-section`):** Las secciones secundarias del portafolio se desvanecen y se elevan progresivamente al entrar en la pantalla mediante `animation-timeline: view()` y `animation-range: entry 10% cover 30%`.
*   **Transiciones de Páginas:**
    *   El sitio implementa **Astro View Transitions** para animar el cambio entre rutas sin recargar el navegador, permitiendo persistir elementos de diseño comunes.

---

## 6. Accesibilidad (a11y) y Estándares

- **Navegación Teclado:** Todos los elementos interactivos cuentan con contornos visibles enfocados (`:focus-visible`). El botón flotante de copiado de código es accesible por teclado.
- **Respeto a las Preferencias del Sistema:** Las animaciones complejas de scroll y desplazamientos se desactivan automáticamente si el usuario tiene configurado "Reducir movimiento" en su sistema operativo (`@media (prefers-reduced-motion: reduce)`).
- **Contraste:** Los textos e iconos en modo oscuro aseguran un ratio de contraste adecuado frente a sus respectivas elevaciones de fondo.
