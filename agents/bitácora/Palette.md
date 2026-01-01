## 2024-05-23 - Mejora de Navegación y Accesibilidad

**Revisión:**
- Se analizó `src/components/Header.astro` y se detectó que los enlaces de navegación no indicaban la página activa.
- Se identificó que el menú móvil no tenía atributos `aria-expanded` ni `aria-controls`, dificultando su uso con lectores de pantalla.
- El feedback visual del estado activo estaba ausente.

**Propuesta:**
- Implementar lógica para determinar la ruta actual (`isActive`).
- Añadir estilos visuales (`text-primary`, `font-bold`) y atributo `aria-current="page"` al enlace activo.
- Mejorar la accesibilidad del botón de menú móvil añadiendo `aria-expanded` dinámico.

**Realizado:**
- Modificado `src/components/Header.astro`:
  - Lógica `isActive` basada en `Astro.url.pathname`.
  - Enlaces de escritorio y móvil ahora reflejan el estado activo.
  - Botón de menú móvil actualizado con `aria-controls` y gestión de estado `aria-expanded`.
