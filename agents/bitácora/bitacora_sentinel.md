## 2025-05-24 - Fix Reverse Tabnabbing
**Estado:** Realizado
**Análisis:** Se detectaron múltiples enlaces externos con `target="_blank"` que carecían del atributo `rel="noopener noreferrer"`. Esto expone a los usuarios a ataques de Reverse Tabnabbing, donde la página enlazada puede obtener control parcial sobre la página de origen.
**Cambios:**
- Se añadió `rel="noopener noreferrer"` a los enlaces externos en `src/pages/privacy-policy.astro` y `src/pages/404.astro`.
- Se verificó `src/pages/politica-privacidad.astro` (no requirió cambios).
**Aprendizaje (si aplica):** Siempre que se use `target="_blank"`, es imperativo añadir `rel="noopener noreferrer"` para prevenir la manipulación de `window.opener`.

## 2025-05-25 - Mejoras de Seguridad en ContactForm
**Estado:** Realizado
**Análisis:**
- El correo electrónico en `src/components/ContactForm.astro` estaba destinado a ser hardcodeado, lo que presenta un riesgo de exposición de secretos en el repositorio si el usuario no tiene cuidado.
- El formulario carecía de protección contra spam (honeypot).
- Faltaban atributos `autocomplete` para una mejor gestión de credenciales/datos por el navegador.
**Cambios:**
- Se refactorizó el formulario para usar `import.meta.env.PUBLIC_CONTACT_EMAIL` con un fallback seguro, permitiendo la configuración vía `.env`.
- Se añadió un campo honeypot (`_honey`) oculto para mitigar spam.
- Se añadieron atributos `autocomplete="name"` y `autocomplete="email"`.
- Se actualizaron las instrucciones en el componente para reflejar el uso de variables de entorno.
**Aprendizaje (si aplica):** Incluso en sitios estáticos, usar variables de entorno para datos de configuración sensibles (como correos de destino) previene fugas accidentales en el control de versiones.

## 2025-05-26 - Prevención de XSS en Búsqueda
**Estado:** Realizado
**Análisis:**
- El componente `src/components/Search.astro` inyectaba `item.title` y `item.description` directamente en el DOM mediante `innerHTML`.
- Aunque los datos provienen de una fuente interna (`search-index.json`), si el contenido del blog o las apps contuviera scripts maliciosos (por ejemplo, en un PR de un colaborador), se ejecutarían en el navegador del usuario al realizar una búsqueda.
**Cambios:**
- Se implementó una función `escapeHtml` en el script del cliente para sanitizar caracteres peligrosos (`&`, `<`, `>`, `"`, `'`).
- Se aplicó esta función a los campos de título y descripción antes de renderizarlos.
**Aprendizaje (si aplica):** Siempre que se use `innerHTML` o inyección directa de HTML, es obligatorio sanitizar los datos de entrada, incluso si provienen de fuentes "confiables", para mantener una defensa en profundidad.
