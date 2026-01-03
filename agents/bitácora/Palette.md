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

## 2024-05-25 - Indicadores de Campos Requeridos en ContactForm

**Revisión:**
- Se analizó `src/components/ContactForm.astro` y se detectó que los campos requeridos (Nombre, Correo electrónico, Mensaje) tenían el atributo `required` en el HTML, pero no tenían un indicador visual explícito en la etiqueta.

**Propuesta:**
- Añadir un asterisco rojo (`*`) a las etiquetas de los campos requeridos para mejorar la usabilidad y accesibilidad, indicando claramente qué campos son obligatorios antes de intentar enviar el formulario.

**Realizado:**
- Modificado `src/components/ContactForm.astro`:
  - Se añadió `<span class="text-red-500">*</span>` a las etiquetas `label` de "Nombre", "Correo electrónico" y "Mensaje".

## 2024-05-27 - Auditoría de Infraestructura y Botón Volver Arriba

**Revisión:**
- **Infraestructura:** Se analizaron `package.json`, `astro.config.mjs` y `src/styles/global.css`. El proyecto usa Astro 5.16.3 y Tailwind CSS v4.1.17. No se detectaron dependencias obsoletas críticas ni cambios recientes que rompan la UI. El sistema de diseño basado en Material Design está estable en `global.css`.
- **UX:** Se observó que en artículos largos del blog, la navegación de retorno al inicio es tediosa. Aunque existe un enlace de accesibilidad "Saltar al contenido", falta un mecanismo rápido para volver al menú principal visualmente.

**Propuesta:**
- Implementar un botón "Volver Arriba" (Scroll to Top) flotante que aparezca al hacer scroll.
- Usar `requestAnimationFrame` para optimizar el listener de scroll y evitar problemas de rendimiento (jank).
- Asegurar que el botón sea accesible (aria-label) y respete el diseño Material (FAB style).

**Realizado:**
- Modificado `src/layouts/Layout.astro`:
  - Se añadió el botón con icono `arrow_upward` y clases de Tailwind para animación de entrada.
  - Se implementó la lógica en JS usando `requestAnimationFrame` para un control eficiente del estado de visibilidad basado en `window.scrollY`.
