## 2025-05-24 - Fix Reverse Tabnabbing
**Estado:** Realizado
**Análisis:** Se detectaron múltiples enlaces externos con `target="_blank"` que carecían del atributo `rel="noopener noreferrer"`. Esto expone a los usuarios a ataques de Reverse Tabnabbing, donde la página enlazada puede obtener control parcial sobre la página de origen.
**Cambios:**
- Se añadió `rel="noopener noreferrer"` a los enlaces externos en `src/pages/privacy-policy.astro` y `src/pages/404.astro`.
- Se verificó `src/pages/politica-privacidad.astro` (no requirió cambios).
**Aprendizaje (si aplica):** Siempre que se use `target="_blank"`, es imperativo añadir `rel="noopener noreferrer"` para prevenir la manipulación de `window.opener`.
