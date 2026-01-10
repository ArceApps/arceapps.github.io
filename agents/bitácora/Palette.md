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

## 2026-01-24 - Micro-interacciones y Feedback en Formulario de Contacto

**Revisión:**
- Se analizó `src/components/ContactForm.astro`.
- Se observó falta de feedback visual inmediato en la interacción de los campos (etiquetas estáticas) y validación (errores invisibles hasta el envío).
- El botón de envío carecía de feedback táctil (estado `active`).

**Propuesta:**
- Implementar el patrón de "Label Highlighting" de Material Design, donde la etiqueta cambia de color al enfocar el input.
- Añadir validación visual contextual: mostrar borde rojo solo si el campo es inválido, tiene contenido y ha perdido el foco (para no molestar mientras se escribe).
- Añadir micro-interacción de escala al presionar el botón de envío.

**Realizado:**
- Modificado `src/components/ContactForm.astro`:
  - Añadida clase `group` a los contenedores de campo y `group-focus-within:text-primary` a las etiquetas `<label>`.
  - Añadida lógica CSS de validación: `invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500`.
  - Añadida clase `active:scale-[0.98]` al botón de envío para mejorar la sensación de "click".
- Verificado visualmente con Playwright: las etiquetas cambian a color `primary` al enfocar, y los emails inválidos se marcan en rojo al salir del campo.

## 2026-01-10 - Mejora de Accesibilidad y Feedback Visual en el Buscador

**Revisión:**
- Se analizó `src/components/Search.astro`.
- Se detectó que el botón de cerrar carecía de estilos de foco claros (solo `outline-none`), dificultando su uso con teclado.
- Los resultados de búsqueda tenían estilos `hover` pero carecían de estilos `focus-visible` claros, haciendo imposible navegar la lista de resultados con teclado de manera visible.
- El contenedor del input de búsqueda no reaccionaba visualmente al foco interno, reduciendo la sensación de "componente activo".

**Propuesta:**
- Mejorar la accesibilidad del botón de cerrar añadiendo un anillo de foco visible y consistente con el diseño.
- Implementar estilos `focus-visible` en los resultados de búsqueda dinámicos para igualar la experiencia de ratón y teclado.
- Añadir feedback visual (`focus-within`) al contenedor del input para resaltar el área activa de búsqueda.

**Realizado:**
- Modificado `src/components/Search.astro`:
  - Botón de cerrar: añadido `focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1` y estados hover mejorados.
  - Resultados (JS inyectado): añadido `focus-visible:bg-surface-variant dark:focus-visible:bg-gray-800 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
  - Contenedor Input: añadido `focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-colors`.
- Verificado mediante `pnpm build` exitoso.
