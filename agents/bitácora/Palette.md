## 2024-05-30 - Accesibilidad en Tarjetas de Proyecto

**Revisión:**
- Se analizó `src/components/ProjectCard.astro`.
- Se detectó que el icono de la aplicación tenía un texto alternativo genérico (`alt="App Icon"`).
- Se observó que elementos decorativos (brillo de fondo, icono placeholder "smartphone") no estaban ocultos para lectores de pantalla, generando ruido.
- El enlace principal carecía de estilos de foco visibles y claros para navegación por teclado.
- La redundancia del icono de flecha en "Ver Detalles" no estaba gestionada.

**Propuesta:**
- Mejorar el texto alternativo del icono de la aplicación para que sea descriptivo (`Icono de [Título]`).
- Ocultar elementos puramente decorativos usando `aria-hidden="true"`.
- Añadir estilos de foco (`focus-visible`) al contenedor principal para mejorar la accesibilidad por teclado.

**Realizado:**
- Modificado `src/components/ProjectCard.astro`:
  - Se actualizó el `alt` de la imagen del icono.
  - Se añadieron atributos `aria-hidden="true"` al placeholder de icono, al gradiente decorativo y al icono de flecha.
  - Se añadieron clases `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` al enlace principal.
