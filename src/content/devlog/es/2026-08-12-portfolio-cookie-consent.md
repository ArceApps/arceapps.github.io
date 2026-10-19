---
title: "Consentimiento de cookies: cuando Partytown dejó de ser la respuesta"
description: "Cómo el portfolio pasó de cargar Google Analytics sin preguntar a un Consent Mode v2 con default denied, banner bilingüe y verificación E2E real."
pubDate: 2026-08-12
lastmod: 2026-10-19
author: "ArceApps"
keywords:
  - "Consent Mode v2"
  - "Partytown"
  - "Google Analytics"
  - "cookies"
  - "RGPD"
canonical: "https://arceapps.com/es/devlog/2026-08-12-portfolio-cookie-consent/"
heroImage: "/images/devlog/portfolio-cookie-consent.svg"
tags: ["Privacidad", "Google Analytics", "Partytown", "Astro", "Building in Public"]
---

## Actualización — 19 de octubre de 2026

Esta entrada se conserva como registro histórico. La arquitectura que describe (Consent Mode v2 con default denied, Partytown, el banner bilingüe con aceptar/rechazar) ya no es el estado actual del sitio.

Dos meses después de publicar esta entrada, la automatización editorial que ejecuta `write-blog` y `write-devlog` introdujo varias regresiones a la vez: el identificador real de Google Analytics se filtró duplicado en una entrada sobre guardas anti secretos, el banner de cookies dejó de cerrarse al hacer click, el switcher de idioma se rompió en la entrada de bitácora que introducía precisamente esta funcionalidad, y la imagen de portada del artículo sobre DeepSeek desapareció en producción. La causa raíz común fue que la automatización ejecutaba skills que el código no enforcecía: la paridad de filenames, el comportamiento del banner y la integridad del `reference_id` eran todo implícito, no contratado.

El arreglo fue una sola feature que hizo cuatro cosas a la vez: eliminó la dependencia de analytics de terceros por completo, convirtió el banner en un dismiss de un solo click que sobrevive a Astro View Transitions, introdujo un contract test `i18n-parity-check` que el build rechaza cuando un par de artículos tiene filenames distintos, y dotó a la página de devlog del mismo puente por `reference_id` que la página de blog ya tenía.

En concreto, el sitio a 19 de octubre de 2026 no carga `gtag.js`, no declara señales de Consent Mode, y el CSP ya no lista `googletagmanager.com` ni `google-analytics.com`. El banner que introdujo esta entrada sigue ahí, pero ahora es un aviso sobre cookies estrictamente funcionales (tema, hecho de que el visitante ha visto y cerrado el aviso): no queda nada que aceptar ni rechazar, porque no se recoge ningún dato de terceros. El contenido bilingüe de esta entrada queda intacto debajo: se preserva verbatim porque la mecánica subyacente (el orden del bloque default-denied, el stub `dataLayer.push(arguments)`, el evento `astro:before-swap`, el proxy `forward: ["dataLayer.push"]` de Partytown, el contract test que falla si el default cae después de `gtag.js`) sigue siendo correcta para cualquier sitio futuro que sí quiera Consent Mode v2 — y porque las lecciones más útiles de la experiencia no son las que dependían de la tecnología.

## Entrada original — 12 de agosto de 2026

Hay deudas que no se ven hasta que alguien lee tu propia política de privacidad con atención. Durante mucho tiempo, el portfolio de ArceApps cargó Google Analytics en todas sus páginas de forma incondicional, sin ningún mecanismo de consentimiento. Y la página de privacidad, escrita con buena intención, afirmaba que el usuario «puede aceptar o rechazar estas cookies». Una de las dos cosas era falsa: no existía ninguna forma de rechazarlas.

El 12 de agosto de 2026 corregimos esa contradicción de arriba abajo. No se trataba solo de añadir un banner. Había que hacer que el comportamiento real del código coincidiera con lo que la web prometía por escrito, y había que hacerlo dentro de la arquitectura que ya teníamos: un sitio Astro estático, con analítica cargada a través de Partytown y una política de privacidad que no queríamos reescribir para tapar el problema.

Esta entrada cuenta la secuencia completa: qué encontramos, qué alternativas evaluamos, por qué elegimos Google Consent Mode v2 y, sobre todo, por qué una pieza que parecía perfecta —cargar la analítica en un web worker— terminó siendo la pieza que hubo que quitar.

## Una web que medía antes de preguntar

El punto de partida era sencillo de describir y difícil de defender. En `src/layouts/Layout.astro` se cargaba `gtag.js` con el identificador de medición de Google Analytics en todas las páginas, ejecutado a través de Partytown. No había ninguna condición previa: el script se inyectaba siempre, para todos los visitantes, sin preguntar.

Google Analytics instala cookies no esenciales —`_ga`, `_gid`, `_gat_*`— y en la Unión Europea ese tipo de cookies exige consentimiento previo. La base no es discutible: el artículo 5.3 de la Directiva ePrivacy regula el almacenamiento de información en el equipo del usuario, y la Guía de cookies de la AEPD, en su actualización de julio de 2023, desarrolla cómo debe pedirse y registrarse ese consentimiento. A eso se suma que, desde marzo de 2024, Google exige Consent Mode v2 para sus etiquetas en el Espacio Económico Europeo.

La contradicción más incómoda no era técnica, sino de coherencia. La política de privacidad del sitio ya hablaba de cookies y daba por hecho que el usuario tenía una elección. Esa elección no existía en la interfaz. Un tercero que auditara la web podía señalar con el dedo una frase concreta de nuestra propia documentación y pedirnos que la cumpliéramos.

Así que el problema tenía tres capas: una legal (consentimiento previo), una técnica (dónde y cómo se declara el estado de consentimiento) y una de honestidad documental (que lo que decimos y lo que hacemos coincidan).

## Cuatro caminos y una decisión incómoda

Antes de tocar código, el trabajo consistió en escribir las alternativas y decidir con la cabeza fría. Documentamos cuatro caminos.

El **camino A** era el más obvio: crear un banner propio y cargar `gtag.js` solo después de que el usuario aceptara. Es la solución que mucha gente imagina primero, y tiene una virtud clara: si alguien rechaza, no se envía ni una petición a Google. El problema es que tiene un coste. Quien rechaza o ignora el banner desaparece por completo de las estadísticas. No se pierde una parte de los datos: se pierde esa parte entera, sin ninguna estimación.

El **camino C** iba en la dirección opuesta: sustituir Google Analytics por una analítica sin cookies —Plausible, Umami, GoatCounter— y eliminar el problema de raíz. Sin cookies no esenciales no hace falta banner, y se mide legalmente a prácticamente todos los visitantes. Sobre el papel era la opción más limpia, y es una opción que a muchos proyectos indie les encaja. Pero implicaba renunciar al ecosistema de Google —Search Console, embudos, eventos ya instrumentados— y migrar el histórico. Se descartó conscientemente.

El **camino D** era no hacer nada. Se descartó por la razón evidente: la exposición legal seguía activa y la contradicción con la política de privacidad seguiría ahí.

El elegido fue el **camino B: Google Consent Mode v2**. La idea es que `gtag.js` se carga siempre, pero arranca con el consentimiento en estado `denied`. A partir de ahí, la web solo lo actualiza si el usuario acepta. Los que aceptan generan datos reales; los que rechazan o ignoran generan pings sin cookies, que Google puede tratar con modelado estadístico. Se conserva el ecosistema y se conserva una estimación de todo el tráfico, a cambio de aceptar que la parte modelada es una estimación y no un recuento exacto.

Es una decisión de producto, no solo técnica. La AEPD, en su informe de 2024, advirtió que el modelado no exime de configurar el consentimiento correctamente. Es decir, Consent Mode v2 no es un permiso para medir a todo el mundo: es una forma de no perderlo todo cuando la configuración es la correcta. Esa distinción guió todas las decisiones posteriores.

## Cómo funciona Consent Mode v2 de verdad

Conviene separar dos cosas que a veces se mezclan: el banner y el modo de consentimiento. El banner es la interfaz. El modo de consentimiento es un contrato entre la página y las etiquetas de Google que viven debajo.

Ese contrato se articula con dos comandos. Primero, un estado por defecto:

```js
gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  security_storage: "granted"
});
```

Después, una actualización cuando el usuario decide:

```js
gtag("consent", "update", { analytics_storage: "granted" });
```

Tomamos varias decisiones deliberadas. La primera: el estado por defecto es `denied` para **todos** los visitantes, sin segmentar por regiones. Es la opción más conservadora y evita mantener listas de países que se quedan desactualizadas. Además, el banner se muestra a todo el mundo, así que no tiene sentido que el estado por defecto dependa de la geolocalización.

La segunda: al aceptar, **solo** se concede `analytics_storage`. Las tres señales publicitarias —`ad_storage`, `ad_user_data`, `ad_personalization`— permanecen `denied` para siempre. La web no tiene publicidad, y su política lo dice con claridad; si el código activara señales de marketing, el texto del banner («no recopilamos datos para publicidad») sería mentira. La coherencia entre lo que promete la interfaz y lo que permite el código fue un criterio de revisión, no un detalle.

La tercera: `functionality_storage` y `security_storage` quedan `granted`. No afectan a Google Analytics, pero son señales estándar de Consent Mode v2 y dejan la configuración lista para etiquetas futuras sin tener que rehacer el default.

## El default tiene que llegar primero

Aquí aparece el primer problema real de orden. No basta con declarar el default en algún lugar de la página: tiene que ejecutarse **antes** de que `gtag.js` se cargue y lea el estado. Si el script de analítica arranca primero, el defecto es «sin consentimiento», y el modo queda desactivado en silencio.

La solución fue situar el script del default en el `<head>`, en línea, en el hilo principal, antes del bloque que carga la analítica. En ese punto no se ha ejecutado nada de terceros y no se ha creado ninguna cookie: el navegador solo guarda una instrucción en el `dataLayer`.

Ese script también resuelve el caso del visitante que ya decidió. Lee `localStorage['cookie-consent']` y, si existe una elección guardada, emite el `update` inmediatamente después del default. Elegimos `localStorage` y no una cookie precisamente porque no es una cookie: no forma parte de lo que hay que consentir, sobrevive a la navegación y es legible tanto por el script del default como por el banner.

## La trampa del stub: argumentos que Google ignora

Hay un detalle minúsculo con consecuencias enormes. Antes de que `gtag.js` termine de cargar, la página suele definir un stub de `gtag` que encola llamadas en el `dataLayer`. La forma más común de escribirlo es esta:

```js
function gtag() {
  dataLayer.push(arguments);
}
```

Y la forma aparentemente equivalente, pero rota, es esta otra:

```js
function gtag() {
  dataLayer.push(Array.from(arguments));
}
```

`Array.from(arguments)` convierte el objeto `arguments` en un array normal. Parece más limpio. Pero la API de consentimiento de Google espera el objeto `arguments` nativo, y cuando recibe un array serializado **ignora el comando**. No da error, no avisa: simplemente no aplica el estado de consentimiento. El resultado es un modo silenciosamente desactivado que parece funcionar hasta que lo auditas de verdad.

Este es el tipo de error que justifica no fiarse de la intuición. La documentación oficial y las guías prácticas sobre la combinación de Astro, Google Tag Manager y Partytown lo señalan como una trampa conocida, y por eso quedó registrado como una restricción explícita del proyecto: el stub **debe** empujar `arguments`, sin `Array.from`. En el código final, además, el stub se define solo como fallback —`window.gtag = window.gtag || function () { dataLayer.push(arguments); }`— para no pisar la implementación real de `gtag.js` si ya se ha cargado.

## Partytown entra en escena… y sale

Partytown es una herramienta estupenda y encajaba con el espíritu del proyecto: mueve scripts de terceros a un web worker para no bloquear el hilo principal. La configuración ya reenviaba las llamadas al `dataLayer` con `forward: ["dataLayer.push"]`, así que, en principio, todo lo que necesitábamos ya estaba conectado.

De hecho, la primera versión del requisito era esa: mantener `gtag.js` en Partytown y no tocar la configuración. Pero al verificar el comportamiento real apareció el problema de fondo. Partytown ejecuta la analítica en un worker, y el worker tiene su propia copia del `dataLayer`. El reenvío es de ida: el hilo principal empuja hacia el worker, pero el hilo principal no ve lo que ocurre dentro. Eso significa que el orden entre el default y la carga de `gtag.js` no queda garantizado de la forma en que Consent Mode v2 lo exige.

La decisión final fue retirar Partytown del camino de la analítica. El cambio fue pequeño en líneas y grande en intención: desaparece la dependencia `@astrojs/partytown` de `astro.config.mjs`, desaparece el `type="text/partytown"` de los scripts de Google, y `gtag.js` pasa a cargarse en el hilo principal, con `async`, justo después del script que declara el default.

El comentario que dejamos en el código resume el aprendizaje: *«el Consent Mode exige que gtag.js lea el default directamente del dataLayer main-thread; Partytown no garantiza ese orden en el worker»*. No es que Partytown sea mala idea. Es que, en este caso concreto, una garantía de orden pesaba más que el ahorro de rendimiento, y no había forma de tener ambas con esta arquitectura.

## Verificar sin TagAssistant

Verificar Consent Mode v2 es más difícil de lo que parece, precisamente por esta clase de intermediarios. TagAssistant, la herramienta habitual de Google para inspeccionar etiquetas, no era fiable aquí: en una configuración basada en worker, el hilo principal no ve las actualizaciones, y los tests que leen `window.dataLayer` tampoco ven el estado real.

Así que verificamos por comportamiento observable, no por herramientas de terceros. La señal de que el consentimiento funciona es doble: **qué cookies existen** y **qué peticiones se envían**. Si el default no llegara, `gtag` crearía `_ga` incluso sin que el usuario hubiera decidido nada. Si la actualización no llegara, aceptar no crearía `_ga`.

Con esa lógica escribimos una suite E2E que recorre tres escenarios y comprueba ocho cosas: que el banner aparece en la primera visita, que no hay ninguna cookie de Google antes de decidir, que aceptar guarda `granted` y crea `_ga`, que al volver no reaparece el banner, que rechazar guarda `denied` y deja cero cookies, y que al volver tras rechazar tampoco reaparece.

En paralelo, añadimos un contract test que protege dos cosas que son fáciles de romper sin darse cuenta: la existencia y el contenido del banner, y **el orden** del script de consentimiento por defecto respecto a la carga de la analítica. Ese segundo test es el que evita que un refactor futuro mueva el default detrás de `gtag.js` y desactive todo en silencio.

El cierre de la verificación fue explícito: el build quedó en verde con todas sus páginas generadas, el contract test pasó, la suite de pruebas quedó limpia salvo un fallo preexistente y ajeno a este cambio, y las rutas `/cookies` y `/es/cookies` respondieron 200 con su tabla de cookies. Nada de esto se dio por bueno «a ojo».

## Una *feature* no está cerrada hasta que alguien la acepta

Hay una regla del flujo de trabajo interno que merece mención aparte: el *Gate UA*, la aceptación del usuario. La verificación técnica puede estar entera en verde y el trabajo seguir sin cerrarse, porque la condición final no es que pasen los tests, sino que la persona observe el resultado real y lo acepte de forma explícita.

La distinción es más útil de lo que parece. Separa «el código hace lo que dice» de «el resultado es el que queríamos». En un cambio como el consentimiento, esa segunda pregunta no la puede contestar ninguna suite: la decisión de producto —conservar Google Analytics con modelado en lugar de migrar a una analítica sin cookies— es una elección de negocio, y la sensación del usuario al ver el banner es una experiencia, no una aserción. Por eso el trabajo quedó documentado como técnicamente completo y funcionalmente pendiente de esa aceptación, sin atajos y sin declararlo «terminado» antes de tiempo.

## La parte legal que no es código

Hay una tentación de tratar el consentimiento como un problema puramente técnico: pones el script, pones el banner, ya está. Pero la mitad del asunto es información, no código.

Escribimos una Política de Cookies bilingüe, con una tabla al estilo de la Guía de la AEPD: nombre de la cookie, finalidad, duración y proveedor. Incluye de forma explícita las cookies de Google Analytics, la explicación del consentimiento, qué es el Consent Mode y cómo retirar la decisión. La página vive en `/cookies` (inglés) y `/es/cookies` (español), con el mismo sistema de internacionalización que el resto del sitio.

El banner también es una pieza de lenguaje, no solo de interfaz. El texto que aprobamos dice, en esencia, tres cosas: que el sitio es gratuito y sin publicidad, que solo se usan cookies de estadísticas y que no se recopilan datos para publicidad, no se venden ni se comparten, y no se recogen datos sensibles. Los dos botones —Aceptar estadísticas y Rechazar— tienen el mismo peso visual, tal y como exige la AEPD. Nada de casillas premarcadas, nada de muros de cookies, nada de aceptar por defecto.

La decisión de escribir un banner sin oscuros patrones no es solo ética; también es práctica. Un banner honesto reduce la fricción y aumenta la tasa de aceptación, y al mismo tiempo deja el proyecto en una posición defendible si alguien lo audita.

La accesibilidad formó parte de la misma exigencia. El banner se comporta como un diálogo (`role="dialog"`, `aria-label`), sus botones son accesibles por teclado y el contraste cumple el nivel AA. No es un adorno: un consentimiento que no se puede leer ni operar con comodidad no es un consentimiento real. El enlace «Cookies» del pie de página, además, garantiza que la política siga accesible desde cualquier página y que la decisión pueda revisarse más adelante.

Un último detalle de interfaz: el sitio usa View Transitions, y el banner vive en el layout global. Al navegar entre páginas, había que evitar que el banner parpadeara o reapareciera. Lo resolvimos con un listener en `astro:before-swap` que elimina el banner del documento entrante cuando ya existe una elección guardada, el mismo patrón que ya usaba el script de tema.

## El coste de enterarse tarde

Este trabajo empezó, en realidad, con una lectura. Alguien —en este caso, el propio flujo de trabajo— leyó la política de privacidad y se dio cuenta de que prometía una elección inexistente. Es un recordatorio incómodo y útil: la deuda no siempre está donde miras. Estaba en una frase escrita meses antes, que nadie había vuelto a comprobar contra el comportamiento real de la web.

Si algo me llevo de este período es que la documentación pública es parte del sistema y merece las mismas comprobaciones que el código. Una política que no se audita se convierte, con el tiempo, en una promesa incumplida. Y las promesas incumplidas son las que, un día, alguien te señala por escrito.

## Qué aprendí

La primera lección es que una herramienta buena para un problema puede ser la herramienta equivocada para otro. Partytown resolvía el problema real de no bloquear el hilo principal, y lo hacía bien. Pero Consent Mode v2 necesita una garantía de orden que un worker con reenvío de ida no puede dar. Retirarlo no fue un fracaso de Partytown: fue reconocer que la restricción que importaba —el orden entre el default y la carga— pesaba más que la que Partytown optimizaba.

La segunda es que los errores silenciosos son los caros. El caso de `Array.from(arguments)` no rompe la página, no lanza una excepción y no se ve a simple vista. Solo se detecta si verificas el comportamiento real. Por eso la verificación se hizo por cookies y por red, no por una herramienta que confirma lo que el hilo principal cree ver.

La tercera es que la coherencia documental es parte del trabajo. La política de privacidad ya hablaba de una elección que no existía. Arreglar eso no era reescribir el texto para que encajara con el código, sino construir la elección de verdad.

Y la cuarta, la más general: el consentimiento no es un accesorio que se añade al final. Es una frontera que atraviesa el layout, los scripts de terceros, la configuración del bundler, los tests y el texto público. Cuando se trata como una capa transversal y no como un componente aislado, deja de ser una deuda y empieza a ser una propiedad del sistema.

## Referencias y lecturas relacionadas

La documentación y las guías que usamos como base:

- [Guía sobre el uso de las cookies](https://www.aepd.es/guias/guia-cookies.pdf) — Agencia Española de Protección de Datos, actualización de 2023.
- [Directiva 2002/58/CE (ePrivacy)](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058) — artículo 5.3.
- [Reglamento General de Protección de Datos (UE) 2016/679](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679) — artículo 6.
- [Consent Mode (Google Analytics)](https://developers.google.com/tag-platform/security/guides/consent) — documentación oficial.
- [Partytown](https://partytown.builder.io/) — documentación oficial del proyecto.

Dentro del propio portfolio, este trabajo encaja con otras dos entradas. La primera es la [frontera de publicación entre workspace privado y mirror público](/es/devlog/2026-W39-portfolio-mirror-pipeline/), que explica cómo el sitio separa fuente y distribución. La segunda es el [artículo sobre el mirror privado de GitHub Pages](/es/blog/github-pages-private-repo-mirror/), donde se detalla el flujo que sincroniza el contenido de este devlog hacia el repositorio público.

Este devlog documenta el período del 12 de agosto de 2026 y se publica como parte de la auditoría histórica del portfolio.
