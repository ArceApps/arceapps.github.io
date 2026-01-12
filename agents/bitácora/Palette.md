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
- Implementar el patrón de "Label Highlighting" de Material Design, donde la etiqueta cambia a color primario al enfocar el input.
- Añadir validación visual contextual: mostrar borde rojo solo si el campo es inválido, tiene contenido y ha perdido el foco (para no molestar mientras se escribe).
- Añadir micro-interacción de escala al presionar el botón de envío.

**Realizado:**
- Modificado `src/components/ContactForm.astro`:
  - Añadida clase `group` a los contenedores de campo y `group-focus-within:text-primary` a las etiquetas `<label>`.
  - Añadida lógica CSS de validación: `invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500`.
  - Añadida clase `active:scale-[0.98]` al botón de envío para mejorar la sensación de "click".
- Verificado visualmente con Playwright: las etiquetas cambian a color `primary` al enfocar, y los emails inválidos se marcan en rojo al salir del campo.

## 2026-01-25 - Accesibilidad y UX en Búsqueda

**Revisión:**
- Se analizó `src/components/Search.astro`.
- Se detectó que no había indicador visual para el atajo de teclado `ESC` para cerrar el modal.
- El mensaje de "No se encontraron resultados" era genérico y poco útil.

**Propuesta:**
- Añadir un indicador visual `ESC` tipo tecla (`kbd`) visible en desktop para mejorar la descubribilidad del atajo.
- Mejorar el estado vacío con un icono más descriptivo (`search_off`) y sugerencias de acción (revisar ortografía).
- Asegurar que el botón de cerrar tenga una etiqueta `aria-label` explícita.

**Realizado:**
- Modificado `src/components/Search.astro`:
  - Añadido elemento `<kbd>ESC</kbd>` visible en pantallas medianas y superiores.
  - Actualizado el HTML inyectado para resultados vacíos con mejor feedback y diseño.
  - Añadido `aria-label="Cerrar búsqueda"` al botón de cierre.

## 2026-01-12 - Mejora UX Menú Móvil

**Revisión:**
- Se analizó `src/components/Header.astro`.
- Se observó que el menú móvil no se cerraba al hacer clic fuera de él (en el contenido de la página) ni al presionar la tecla `ESC`, lo cual es un patrón de comportamiento estándar esperado por los usuarios.
- Tampoco se cerraba explícitamente al navegar a enlaces internos (anchors) que no provocan una recarga completa inmediata.

**Propuesta:**
- Implementar lógica de "Click Outside" para cerrar el menú si el usuario toca el contenido principal.
- Añadir soporte para la tecla `Escape` para accesibilidad.
- Asegurar que cualquier clic en enlaces dentro del menú provoque su cierre inmediato.

**Realizado:**
- Modificado `src/components/Header.astro`:
  - Refactorizada la lógica de apertura para adjuntar listeners globales (`click` en document, `keydown`) solo cuando el menú está abierto.
  - Implementado `e.stopPropagation()` en el botón de toggle para evitar conflictos de eventos.
  - Añadida lógica de limpieza automática de listeners al cerrar el menú o al navegar (`astro:before-swap`).
- Verificado con script de Playwright: el menú se cierra correctamente al hacer clic en el cuerpo de la página y al usar ESC.
