## 2026-01-07 - Accesibilidad de Foco en BlogCard

**Revisión:**
- Se analizó `src/components/BlogCard.astro`.
- Se detectó que el enlace principal (overlay link) y los enlaces de etiquetas carecían de estilos de foco (`focus-visible`).
- Esto dificultaba la navegación por teclado, ya que el usuario no podía ver qué tarjeta o etiqueta estaba seleccionada.

**Propuesta:**
- Añadir estilos `focus-visible` al enlace principal para que toda la tarjeta se resalte al recibir foco.
- Añadir estilos `focus-visible` a los enlaces de las etiquetas para mantener la consistencia y usabilidad.

**Realizado:**
- Modificado `src/components/BlogCard.astro`:
  - Se añadieron clases `rounded-xl focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none transition-shadow` al enlace principal (`<a>` overlay).
  - Se añadieron clases `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` a los enlaces de etiquetas (`<a>` tags).

## 2026-01-20 - Accesibilidad de Foco en ProjectCard

**Revisión:**
- Se analizó `src/components/ProjectCard.astro` y `src/components/AppCard.astro`.
- Se detectó que `AppCard.astro` no se utilizaba en el sitio, por lo que se restauró su estado original para evitar ruido.
- Se observó que aunque `ProjectCard.astro` tenía un anillo de foco en el contenedor principal, los elementos internos (imagen, título, enlace de acción) no reaccionaban visualmente al foco del teclado, solo al hover del ratón.

**Propuesta:**
- Mejorar la experiencia de navegación por teclado en `ProjectCard.astro` haciendo que los elementos internos reaccionen al foco igual que lo hacen al hover.

**Realizado:**
- Modificado `src/components/ProjectCard.astro`:
  - Imagen hero: añadido `group-focus-visible:scale-110`.
  - Título: añadido `group-focus-visible:text-primary`.
  - Acción "Ver Detalles": añadido `group-focus-visible:translate-x-1`.
- Verificado mediante script de Playwright y captura de pantalla que muestra el anillo de foco y los estilos aplicados correctamente.
