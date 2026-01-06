# AGENTS.md

Este archivo sirve como fuente de verdad y contexto para todos los agentes de IA (como Sentinel, Palette, Bolt) que interactúan con este repositorio.

## 1. Visión General del Proyecto
**ArceApps** es un sitio web de portafolio y blog construido con Astro, enfocado en aplicaciones Android y artículos técnicos. El diseño sigue principios de Material Design y la comunicación debe ser técnica pero cercana ("Cercano").

## 2. Stack Tecnológico
- **Framework:** Astro 5.16.3 (Modo estático)
- **Lenguaje:** TypeScript (Configuración estricta)
- **Estilos:** Tailwind CSS v4.1.17 (vía `@tailwindcss/vite`) + DaisyUI 5.5.5
- **Iconografía:** Material Icons (`@fontsource/material-icons`)
- **Fuentes:** Roboto (`@fontsource/roboto`)
- **Búsqueda:** Fuse.js (Client-side)
- **Gestor de Paquetes:** pnpm (Exclusivamente)

## 3. Estructura de Directorios Clave
- `src/content/`: Colecciones de contenido (Markdown/MDX).
  - `blog/`: Artículos técnicos.
  - `apps/`: Proyectos y aplicaciones.
- `src/pages/`: Rutas del sitio (`[...slug].astro` para rutas dinámicas).
- `src/layouts/`: Plantillas principales. `Layout.astro` es el wrapper global.
- `src/components/`: Componentes UI reutilizables.
- `src/styles/`: `global.css` contiene la configuración de Tailwind y variables CSS.
- `public/`: Assets estáticos.
  - `images/`: Todas las imágenes deben residir aquí y referenciarse como `/images/nombre.ext`.
- `agents/`:
  - `bots/`: Definiciones de agentes (`bot_*.md`).
    - `bot_Sentinel.md`: Seguridad y QA.
    - `bot_Palette.md`: Diseño y UX.
    - `bot_Bolt.md`: Performance y Optimización.
    - `bot_Scribe.md`: Redacción y Contenido (Blog, Apps, Devlog).
  - `bitácora/`: Logs de actividad de los agentes.

## 4. Comandos de Desarrollo
- **Desarrollo:** `pnpm dev`
- **Build Producción:** `pnpm build`
- **Preview:** `pnpm preview`
- **Lint/Test:** No hay scripts configurados actualmente (se debe tener cuidado manual).

## 5. Convenciones de Código y Diseño

### Estilo y UI
- **Colores de Marca:**
  - Primary (Teal): `#018786` (`--color-primary`)
  - Secondary (Orange): `#FF9800` (`--color-secondary`)
- **Modo Oscuro:**
  - Implementado vía clase `.dark` en `<html>`.
  - Persistencia mediante `localStorage` ('theme').
  - Usar clases `dark:` de Tailwind.
- **Accesibilidad:**
  - Todo componente interactivo debe ser accesible por teclado.
  - Usar etiquetas ARIA donde sea necesario.
  - Enlaces de "Saltar al contenido" implementados.

### Imágenes
- Usar rutas absolutas desde la raíz pública (ej. `/images/mi-imagen.png`).
- Las apps usan `realIconUrl` en el frontmatter.

### Contenido
- **Blog:** Tono técnico, explicativo, con ejemplos prácticos.
- **Frontmatter:** Definido estrictamente en `src/content/config.ts`.

## 6. Reglas para Agentes
1. **Lectura Obligatoria:** Antes de comenzar cualquier tarea, revisa este archivo (`AGENTS.md`) para entender el contexto.
2. **Bitácoras:** Cada agente debe registrar sus acciones en su respectiva bitácora en `agents/bitácora/`.
3. **Nombres de Archivos:** Los archivos de definición de bots deben seguir el patrón `agents/bots/bot_[Nombre].md`.
4. **Verificación:** Siempre ejecuta `pnpm build` antes de considerar una tarea completada para asegurar que no hay errores de compilación.
5. **Idioma:** Todas las interacciones, explicaciones y registros en bitácoras deben ser estrictamente en **ESPAÑOL**.
   - El código (nombres de variables, funciones, commits) debe mantenerse en **Inglés**.
   - Los comentarios explicativos dentro del código pueden ser en Español.

## 7. Requisito de Imágenes
Para asegurar la consistencia visual del sitio, se aplican las siguientes reglas al crear contenido:
- **Ámbito:** Nuevas Apps (`src/content/apps`), Artículos de Blog (`src/content/blog`) y Entradas de Bitácora/Devlog (`src/content/story` o `src/content/devlog`).
- **Regla:** Todo nuevo contenido **DEBE** incluir una imagen de portada especificada en el campo `heroImage` del frontmatter.
- **Generación Automática:** Si el usuario no proporciona una imagen específica, el agente **DEBE generar una imagen SVG minimalista**.
  - **Estilo:** Geométrico, limpio y profesional.
  - **Colores:** Debe usar estrictamente los colores de marca: Teal (`#018786`) y Orange (`#FF9800`).
  - **Ubicación:** Guardar en `public/images/` y referenciar correctamente.
