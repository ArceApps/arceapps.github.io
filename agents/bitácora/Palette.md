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
