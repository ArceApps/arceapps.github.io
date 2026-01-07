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

## 2025-05-27 - Cabeceras de Seguridad en Layout
**Estado:** Realizado
**Análisis:**
- El archivo `src/layouts/Layout.astro` carecía de cabeceras de seguridad fundamentales que se pueden establecer vía meta tags en sitios estáticos.
- Faltaban configuraciones explícitas para la política de referer y la política de seguridad de contenido básica.
**Cambios:**
- Se añadió `<meta name="referrer" content="strict-origin-when-cross-origin" />` para proteger la privacidad del usuario al navegar a otros sitios, manteniendo la información de origen para el mismo sitio.
- Se añadió `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />` para forzar la actualización de recursos HTTP a HTTPS, mitigando riesgos de contenido mixto.
**Aprendizaje (si aplica):** En sitios estáticos donde no se tiene control total sobre las cabeceras del servidor (como GitHub Pages sin configuración avanzada), el uso de meta tags para políticas de seguridad es una capa esencial de defensa.

## 2025-05-28 - Mejora CSP: Protección Clickjacking y Contenido Mixto
**Estado:** Realizado
**Análisis:**
- El sitio carecía de protección contra Clickjacking (ser embebido en un iframe malicioso). Al ser un sitio estático, no se pueden configurar cabeceras HTTP como `X-Frame-Options` directamente.
- Se detectó un enlace con protocolo HTTP inseguro (`http://try.crashlytics.com`) en `src/pages/privacy-policy.astro`, generando advertencias de contenido mixto.
**Cambios:**
- Se implementó un script de "Frame Busting" en `src/layouts/Layout.astro` para prevenir que el sitio sea cargado dentro de un iframe.
- Se corrigió el enlace en `src/pages/privacy-policy.astro` para usar HTTPS.
**Aprendizaje (si aplica):** La directiva `frame-ancestors` de CSP es ignorada en etiquetas `<meta>`, por lo que en entornos de hosting estático puro (como GitHub Pages), se requiere un script de bloqueo de iframes (Frame Buster) como medida de defensa en profundidad.

## 2025-05-29 - Sanitización de JSON-LD (Prevención XSS)
**Estado:** Realizado
**Análisis:**
- Se identificó que la inyección de Schema.org en `src/layouts/Layout.astro` utilizaba `JSON.stringify` directamente dentro de `set:html`.
- `JSON.stringify` no escapa el carácter `<` por defecto, lo que permite que una cadena maliciosa conteniendo `</script>` rompa el contexto del script y ejecute código JavaScript arbitrario (XSS).
**Cambios:**
- Se añadió `.replace(/</g, '\\u003C')` al resultado de `JSON.stringify`. Esto asegura que cualquier etiqueta HTML inyectada en los metadatos sea tratada como texto unicode seguro y no como marcado HTML parseable.
**Aprendizaje (si aplica):** Al inyectar JSON en un contexto HTML (dentro de `<script>`), `JSON.stringify` no es suficiente. Es crítico escapar los caracteres que pueden cerrar el bloque de script prematuramente.

## 2026-01-14 - Validación de Inputs (DoS Mitigation)
**Estado:** Realizado
**Análisis:**
- Se detectó que los campos de entrada en `ContactForm.astro` y `Search.astro` carecían de atributos `maxlength`.
- Esto podría permitir a usuarios malintencionados o bots enviar cadenas extremadamente largas, causando potenciales denegaciones de servicio (DoS) por agotamiento de recursos en el cliente o en el servicio de procesamiento de formularios.
**Cambios:**
- `ContactForm.astro`: Se añadieron límites estrictos: Nombre (100), Email (254 - estándar RFC), Mensaje (5000).
- `Search.astro`: Se limitó la búsqueda a 100 caracteres para prevenir consultas abusivas.
**Aprendizaje (si aplica):** La validación en el cliente (HTML5 constraints) es la primera línea de defensa contra inputs malformados o abusivos, mejorando la robustez y UX antes de que los datos lleguen a la lógica de negocio.
