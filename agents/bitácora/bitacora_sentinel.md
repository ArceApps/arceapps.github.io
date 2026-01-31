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
**Aprendizaje (si aplica):** La validación en el cliente (HTML5 constraints) es la primera línea de defensa contra inputs malformados o abusivos, mejorando la robustez y UX antes de que los datos lleguen al cliente.

## 2026-01-16 - Sanitización Automática de Enlaces en Markdown
**Estado:** Realizado
**Análisis:**
- Se identificó un riesgo potencial en los contenidos Markdown (Blog, Apps, Devlog): los enlaces externos creados con sintaxis estándar `[Texto](url)` se renderizan como `<a>` sin atributos de seguridad.
- Si un autor añade `target="_blank"` (o si se decide forzarlo), la ausencia de `rel="noopener noreferrer"` expone a vulnerabilidades de Reverse Tabnabbing.
- Además, para mejorar la UX y retención, es estándar que los enlaces externos se abran en nueva pestaña, pero esto debe hacerse de forma segura.
**Cambios:**
- Se instaló `rehype-external-links` como dependencia de desarrollo.
- Se configuró `astro.config.mjs` para incluir este plugin en el procesamiento de Markdown.
- Configuración aplicada: `target: '_blank'` y `rel: ['noopener', 'noreferrer']` para todos los enlaces externos.
**Aprendizaje (si aplica):** La seguridad no debe depender de la memoria del autor del contenido. Automatizar la sanitización de enlaces en la capa de compilación (build time) garantiza que *todo* enlace externo sea seguro por defecto, eliminando el error humano.

## 2026-01-20 - Control de Acceso de Contenido (Draft Support)
**Estado:** Realizado
**Análisis:**
- Se identificó la falta de un mecanismo formal para ocultar contenido en borrador (`draft`) en las colecciones de contenido (Blog, Apps, Devlog).
- Sin este filtro, cualquier contenido en progreso commiteado al repositorio se publicaría automáticamente, filtrando información incompleta o no autorizada.
- Aunque el riesgo de seguridad directo es bajo (confidencialidad), es una buena práctica de "Defensa en Profundidad" para controlar la superficie de información expuesta.
**Cambios:**
- Se actualizó el esquema en `src/content/config.ts` para incluir `draft: z.boolean().optional().default(false)` en todas las colecciones.
- Se implementaron filtros en `src/pages/search-index.json.ts` para excluir borradores del índice de búsqueda.
- Se añadieron filtros en todas las páginas de listado (`index`, `blog`, `apps`, `devlog`) y en la generación de rutas estáticas (`[...slug]`) para prevenir el acceso y generación de páginas de borrador.
**Aprendizaje (si aplica):** La seguridad de la información incluye controlar *cuándo* se hace pública. Implementar flags de características o estados de publicación a nivel de esquema previene fugas accidentales de contenido sensible o no listo.

## 2026-01-21 - Protección Avanzada Anti-Clickjacking
**Estado:** Realizado
**Análisis:**
- La protección anterior contra Clickjacking (Frame Buster) utilizaba una comprobación simple de JS (`window.self !== window.top`) que podía ser evadida mediante el atributo `sandbox="allow-scripts allow-same-origin"` en un iframe malicioso, bloqueando la navegación `top.location`.
- Esto dejaba al sitio vulnerable a ataques de UI Redressing en navegadores modernos bajo ciertas condiciones.
**Cambios:**
- Se actualizó `src/layouts/Layout.astro` implementando la técnica defensiva basada en CSS (estándar OWASP Legacy).
- El contenido del `body` se oculta por defecto (`display: none !important`) mediante estilos.
- Un script síncrono verifica si `self === top`; si es seguro, elimina el estilo y muestra el contenido. Si no, intenta romper el frame.
- Se añadió soporte `<noscript>` para garantizar que el contenido sea visible si JavaScript está desactivado.
**Aprendizaje (si aplica):** La defensa en profundidad requiere asumir que las contramedidas simples pueden fallar. Ocultar el contenido *hasta* verificar la seguridad es más robusto que intentar navegar *después* de detectar el ataque.

## 2026-01-22 - Implementación de Security.txt
**Estado:** Realizado
**Análisis:**
- El sitio carecía de un archivo `security.txt` estandarizado (RFC 9116).
- Sin este archivo, los investigadores de seguridad no tienen una forma clara y estándar de contactar al propietario del sitio para reportar vulnerabilidades de manera responsable.
**Cambios:**
- Se creó el directorio `public/.well-known/`.
- Se añadió el archivo `security.txt` con los campos `Contact`, `Expires`, `Preferred-Languages` y `Policy`.
- Se apuntó la política a `/privacy-policy` y el contacto al correo del formulario.
**Aprendizaje (si aplica):** Adoptar estándares de seguridad como RFC 9116 facilita la divulgación responsable y demuestra un compromiso proactivo con la seguridad, incluso en sitios estáticos.

## 2026-01-20 - Re-implementación Anti-Clickjacking y Mejora HTTPS
**Estado:** Realizado
**Análisis:**
- Se detectó que la protección Anti-Clickjacking descrita en registros futuros (2026-01-21) no estaba presente en el código base (`src/layouts/Layout.astro`), dejando el sitio vulnerable.
- El script de RSS (`scripts/fetch-rss.js`) utilizaba un enlace HTTP inseguro para el blog de Google AI.
**Cambios:**
- Se implementó la defensa Anti-Clickjacking (Frame Busting) en `src/layouts/Layout.astro` usando CSS (`display: none`) y un script de verificación de `self === top`. Se aseguró compatibilidad con `<noscript>`.
- Se actualizó el enlace del feed RSS de Google AI a HTTPS.
**Aprendizaje (si aplica):** La presencia de un registro en la bitácora no garantiza que el código esté en la rama actual; la verificación manual del código ("Verificar todo") es indispensable.

## 2026-01-21 - Implementación de CSP Estricto
**Estado:** Realizado
**Análisis:**
- La Política de Seguridad de Contenido (CSP) era débil (`upgrade-insecure-requests`), permitiendo potencialmente XSS y la carga de recursos maliciosos si otras defensas fallaban.
- Se requería una política más granular para restringir los orígenes de scripts, estilos, imágenes y conexiones.
**Cambios:**
- Se actualizó `src/layouts/Layout.astro` con una nueva directiva CSP en la etiqueta `<meta>`.
- Se configuraron directivas explícitas: `default-src 'self'`, `script-src` (incluyendo GTM), `img-src` (incluyendo CDN de iconos y Google Play), `connect-src` (Google Analytics) y `form-action` (FormSubmit).
- Se mantuvo `unsafe-inline` para scripts y estilos debido a la naturaleza de hidratación de Astro, pero se restringió el origen externo de scripts a solo GTM.
**Aprendizaje (si aplica):** Aunque `unsafe-inline` debilita CSP, restringir `script-src` a dominios de confianza y `object-src` a 'none' reduce significativamente la superficie de ataque comparado con no tener CSP o usar una muy permisiva.

## 2026-01-22 - Actualización de Dependencias y Reducción de Superficie
**Estado:** Realizado
**Análisis:** Se detectaron vulnerabilidades de severidad alta en dependencias (`devalue`, `h3`) mediante `pnpm audit`. Además, se identificó la dependencia `daisyui` como instalada pero no utilizada, aumentando la superficie de ataque y mantenimiento innecesariamente.
**Cambios:**
- Se eliminó la dependencia `daisyui` de `devDependencies`.
- Se actualizaron `astro` y `@tailwindcss/vite` a sus versiones más recientes para mitigar las vulnerabilidades reportadas.
- Se verificó la eliminación de alertas de severidad alta con `pnpm audit`.
**Aprendizaje (si aplica):** Mantener las dependencias actualizadas y eliminar las no utilizadas es fundamental para reducir la deuda técnica y los riesgos de seguridad, incluso si las vulnerabilidades parecen ser de entorno de desarrollo.

## 2026-01-23 - Validación de Esquema de URL
**Estado:** Realizado
**Análisis:** El esquema de la colección de contenido permitía cadenas arbitrarias para campos de URL (`repoUrl`, `demoUrl`, etc.), creando un vector potencial de XSS mediante esquemas `javascript:`.
**Cambios:** Se actualizó `src/content/config.ts` para usar `z.string().url()` en los campos de enlaces externos.
**Aprendizaje (si aplica):** Aplicar tipos de datos y formatos a nivel de esquema es la forma más efectiva de sanitizar entradas basadas en contenido.

## 2026-01-25 - Fix XSS en Componente de Búsqueda
**Estado:** Realizado
**Análisis:**
- Se detectó que la función `escapeHtml` en `src/scripts/search.ts` no sanitizaba las comillas dobles (`"`).
- Además, el atributo `href` en los resultados de búsqueda inyectaba `item.slug` sin escapar, lo que permitía una potencial inyección de atributos (XSS) si un slug malicioso fuera introducido en el sistema (ej. vía frontmatter).
**Cambios:**
- Se actualizó `escapeHtml` para convertir `"` en `&quot;`.
- Se aplicó `escapeHtml(item.slug)` al construir el enlace del resultado.
**Aprendizaje (si aplica):** Al construir HTML mediante strings (template literals), *toda* variable inyectada en atributos debe ser sanitizada, incluso si parece provenir de una fuente interna como el sistema de archivos, para mantener la defensa en profundidad.

## 2026-01-27 - Sanitización de Índice de Búsqueda y Hardening de Cabeceras
**Estado:** Realizado
**Análisis:**
- Se identificó que `src/pages/search-index.json.ts` no implementaba la sanitización y truncamiento descrita en la memoria de seguridad, generando riesgos de DoS por payloads grandes y XSS almacenado (aunque mitigado por el cliente).
- Se detectó que `src/layouts/Layout.astro` exponía la versión del framework mediante la etiqueta `meta generator`.
**Cambios:**
- Se creó `src/utils/sanitizer.ts` con la función `sanitizeForSearch` (strip HTML + truncamiento) y sus respectivos tests unitarios.
- Se actualizó `src/pages/search-index.json.ts` para aplicar esta sanitización a los campos de título (100 chars) y descripción (200 chars).
- Se eliminó la etiqueta `<meta name="generator" ... />` de `src/layouts/Layout.astro`.
**Aprendizaje (si aplica):** La sanitización en el servidor (o build time) es crucial para la defensa en profundidad, reduciendo la superficie de ataque antes de que los datos lleguen al cliente.

## 2026-01-28 - Sanitización de Recolección de RSS
**Estado:** Realizado
**Análisis:** Se detectó que `scripts/fetch-rss.js` extraía contenido de feeds RSS externos sin sanitización ni truncamiento adecuados. Esto presentaba un riesgo de Denegación de Servicio (DoS) por payloads excesivamente grandes y potencial inyección de contenido malicioso en el sistema de agentes (Curator).
**Cambios:** Se modificó `scripts/fetch-rss.js` para usar `JSDOM` para limpiar etiquetas HTML de forma robusta y se implementó un límite estricto de caracteres (150 para títulos, 500 para snippets). Se normalizaron los espacios en blanco.
**Aprendizaje (si aplica):** Nunca confiar en datos externos, incluso de fuentes "conocidas". La sanitización debe ocurrir en la frontera de entrada (Input Boundary).

## 2026-01-29 - Hardening de Dependencias y Fiabilidad de SW
**Estado:** Realizado
**Análisis:**
- Se detectó una vulnerabilidad moderada (Prototype Pollution) en `lodash` (dependencia transitiva) mediante `pnpm audit`.
- Se identificó que el Service Worker (`sw.js`) intentaba cachear `/favicon.svg`, archivo inexistente, lo que provocaba un fallo en la instalación del SW y pérdida de funcionalidad offline.
- Se encontraron tests unitarios rotos (`layout.test.ts`) debido a falta de mocking en el entorno JSDOM.
**Cambios:**
- Se añadió `pnpm.overrides` en `package.json` forzando `lodash` a `^4.17.23`.
- Se eliminó `/favicon.svg` de la lista de caché en `sw.js`.
- Se arregló el entorno de pruebas mockeando `window.matchMedia`.
**Aprendizaje (si aplica):** La seguridad incluye la disponibilidad. Un Service Worker roto impide que la aplicación funcione en condiciones adversas. Además, mantener un CI verde (tests pasando) es vital para detectar regresiones de seguridad rápidamente.

## 2026-01-30 - Fix RSS Draft Leak & Dependency Vulnerability
**Estado:** Realizado
**Análisis:**
- Se detectó que `src/pages/rss.xml.js` incluía posts en borrador (`draft: true`) en el feed RSS público, lo que constituye una fuga de información.
- Se identificó una vulnerabilidad de alta severidad (DoS) en `fast-xml-parser` (dependencia transitiva de `@astrojs/rss`).
**Cambios:**
- Se actualizó la consulta en `src/pages/rss.xml.js` para filtrar posts donde `draft` sea verdadero.
- Se añadió un override en `package.json` para forzar `fast-xml-parser` a la versión `^5.3.4`, mitigando la vulnerabilidad.
- Se verificó la ausencia de borradores en el feed generado y la resolución de la vulnerabilidad con `pnpm audit`.
**Aprendizaje (si aplica):** La seguridad de contenido requiere consistencia en todos los canales de distribución. Si se filtran borradores en la web, también deben filtrarse en RSS, sitemaps y búsquedas.
