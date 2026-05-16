---
title: "W20: Refactorización Bilingüe, Optimización y Seguridad"
description: "Crónica de ingeniería sobre las mejoras arquitectónicas, la optimización del rendimiento, la seguridad XSS y el enriquecimiento de pruebas unitarias en ArceApps."
pubDate: 2026-05-16
tags: ["devlog", "arceapps", "performance", "security", "vitest", "i18n"]
heroImage: "/images/devlog-default.svg"
reference_id: "2026-w20-refactoring-optimization"
---

## Estado del Arte: Construcción en Público

¡Hola a todos! Bienvenidos a una nueva entrega del devlog de **ArceApps**, el portfolio y ecosistema de agentes que estamos construyendo en público. Las últimas dos semanas han sido intensas, centradas principalmente en consolidar las bases técnicas de nuestra plataforma web (el portfolio de ArceApps). A diferencia de nuestro producto PuzzleHub, donde el foco es la lógica de juegos, aquí la prioridad ha sido la arquitectura de la web, la internacionalización (i18n), el rendimiento y la seguridad.

Nos hemos embarcado en una profunda refactorización, abordando desde la jerarquía visual de nuestro contenido Markdown hasta la mitigación de vulnerabilidades XSS en nuestro buscador y la validación de enlaces internos. Hemos escrito código, muchas pruebas unitarias (TDD en acción) y optimizado la generación estática (SSG) de nuestras páginas.

Acompáñanos en este recorrido técnico por los retos y las soluciones de esta quincena.

## Hito 1: Optimizando la Generación Estática y la Rutas (i18n)

### Rendimiento en la Generación Estática (SSG)

Uno de los cuellos de botella clásicos en Astro (y en muchos frameworks SSG) es la obtención redundante de datos. Durante la generación de nuestras páginas de blog (`src/pages/blog/[...slug].astro` y su contraparte en español), nos dimos cuenta de que estábamos incurriendo en llamadas $O(N^2)$ a `getCollection`.

La lógica original calculaba los "artículos relacionados" dentro del componente Astro para cada página. Esto significaba que por cada uno de los $N$ artículos, se volvía a consultar la colección y se iteraba para encontrar coincidencias de etiquetas.

La solución fue trasladar esta lógica a la función `getStaticPaths`. Al precalcular los artículos relacionados y pasarlos como `props`, reducimos las llamadas a `getCollection` a $O(1)$ por idioma durante el proceso de build.

```typescript
// Fragmento conceptual de la optimización en getStaticPaths
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const sortedPosts = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return sortedPosts.map(post => {
    // Calculamos las relaciones aquí, una sola vez por artículo durante el build
    const relatedPosts = sortedPosts
      .filter(p => p.id !== post.id && p.data.tags.some(t => post.data.tags.includes(t)))
      .slice(0, 3); // Solo tomamos los 3 primeros para optimizar

    return {
      params: { slug: post.slug },
      props: { post, relatedPosts }, // Pasamos los datos calculados
    };
  });
}
```

Esta refactorización no solo aceleró el tiempo de compilación, sino que también limpió la lógica de renderizado del componente, separando claramente la obtención de datos de la vista.

### Centralización del Enrutamiento Bilingüe

La gestión de rutas en una web bilingüe puede volverse caótica si se esparce por los componentes de la interfaz. En nuestro caso, el `Header.astro` acumulaba demasiada lógica sobre qué ruta estaba activa y cómo cambiar de idioma.

Decidimos extraer esta responsabilidad al módulo `src/i18n/utils.ts`. Implementamos funciones puras y testables como `normalizePath`, `isPathActive` y `getLocalizedTogglePath`.

Un detalle de seguridad sutil aquí fue proteger la función `getRouteFromUrl` contra la polución del prototipo. Usar directamente `Object.keys` o verificar propiedades en un objeto crudo en JavaScript puede ser peligroso si la ruta coincide con propiedades inherentes como `/toString/`.

```typescript
// src/i18n/utils.ts
export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname; // El análisis de memoria indicó una instanciación redundante que se corrigió posteriormente.
  const parts = pathname.split('/');

  // Lógica segura para determinar la ruta y el idioma...
}
```

Al mover esto a utilidades independientes, pudimos cubrir toda la casuística de enrutamiento con pruebas unitarias exhaustivas en `src/i18n/utils.test.ts`.

## Hito 2: Seguridad Primero - Sanitización y Prevención de XSS

En una web moderna, la seguridad no es opcional. Hemos dedicado un esfuerzo significativo a asegurar nuestro buscador y la inyección de metadatos (LD+JSON).

### Buscador: Adiós a `innerHTML`

Nuestro script de búsqueda cliente (`src/scripts/search.ts`) original usaba `innerHTML` para renderizar los resultados. Esto es una vulnerabilidad de XSS (Cross-Site Scripting) de libro si los datos indexados contienen HTML malicioso.

Refactorizamos completamente el renderizado para usar APIs del DOM seguras: `document.createElement`, `textContent` y `replaceChildren`.

```typescript
// src/scripts/search.ts (Refactorizado)
function renderResults(results: SearchResult[]) {
  const container = document.getElementById('search-results');
  if (!container) return;

  // En lugar de container.innerHTML = '...', usamos replaceChildren
  const fragment = document.createDocumentFragment();

  results.forEach(result => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = result.url;
    a.textContent = result.title; // Seguro contra XSS

    const p = document.createElement('p');
    p.textContent = result.description; // Seguro contra XSS

    li.appendChild(a);
    li.appendChild(p);
    fragment.appendChild(li);
  });

  container.replaceChildren(fragment);
}
```

Además, introdujimos la función `sanitizeForSearch` en `src/utils/sanitizer.ts`. Esta utilidad se encarga de limpiar el contenido antes de indexarlo, eliminando etiquetas HTML y truncando el texto. Añadimos pruebas específicas en `src/scripts/search.test.ts` que inyectan payloads maliciosos (`<script>alert(1)</script>`) para garantizar que se renderizan inofensivamente como texto plano.

### Serialización Segura de JSON-LD

Para el SEO, inyectamos bloques `<script type="application/ld+json">` con los metadatos de las páginas. Si el contenido de estos metadatos incluye caracteres de cierre de script `</script>`, un atacante podría romper el bloque y ejecutar código.

Implementamos `safeJsonLd` en `src/utils/security.ts`, que escapa los caracteres problemáticos `<, >, &` y los separadores de línea Unicode `\u2028, \u2029`.

```typescript
// src/utils/security.ts
export function safeJsonLd(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
```

Las pruebas unitarias en `src/utils/security.test.ts` aseguran que este comportamiento se mantiene firme.

## Hito 3: El Reto de la Semana - Integridad de los Enlaces Bilingües

Uno de los problemas más frustrantes al traducir contenido es mantener los enlaces internos correctos. Si traduces un artículo del inglés al español, los enlaces Markdown dentro de ese artículo deben actualizarse para apuntar a las versiones traducidas de otros artículos (`/es/blog/...`), no a las versiones en inglés (`/blog/...`).

Para automatizar esta verificación, desarrollamos `src/utils/links-validation.test.ts`.

Este no es un test unitario común. Utiliza la API del sistema de archivos (`node:fs/promises`) y `Promise.all` para validar asíncronamente cada enlace en cada archivo Markdown de nuestras colecciones de contenido.

```typescript
// src/utils/links-validation.test.ts (Concepto)
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

// ... lógica de extracción de enlaces ...

describe('Validación de enlaces internos del blog', async () => {
  const files = await fs.readdir('src/content/blog/es');
  // ...
  await Promise.all(files.map(async file => {
     const content = await fs.readFile(`src/content/blog/es/${file}`, 'utf-8');
     const links = extractLinks(content);
     // Verificar que los enlaces apunten a archivos existentes en 'es'
  }));
  // ...
});
```

El principal desafío fue la eficiencia. Leer cientos de archivos de forma síncrona ralentizaría nuestra suite de pruebas inaceptablemente. Al usar top-level `await` (soportado por Vitest) y `Promise.all` para la I/O concurrente, la validación se completa en milisegundos. Cuando un enlace está roto, el test falla y reporta exactamente qué archivo tiene el problema y a dónde intentaba enlazar. ¡Una red de seguridad increíble para nuestros redactores (y agentes)!

## Reflexión sobre la Jerarquía Visual Responsiva

Por último, pero no menos importante, hemos consolidado nuestro principio de "Jerarquía Visual Responsiva". En nuestro archivo `src/styles/global.css`, nos dimos cuenta de que elementos como imágenes, videos e iframes dentro del contenido Markdown (`.prose`) a veces rompían el layout en dispositivos móviles o se veían gigantes en pantallas enormes.

Aplicamos propiedades CSS lógicas (`max-inline-size`, `inline-size`) en lugar de físicas (`max-width`, `width`).

```css
/* src/styles/global.css */
.prose :where(img, video, iframe) {
  max-inline-size: min(100%, 500px); /* Evita que crezcan demasiado */
  margin-inline: auto; /* Centrado lógico */
}

.prose iframe {
  aspect-ratio: 16 / 9;
  inline-size: 100%;
}
```

El uso de `:where()` es clave aquí, ya que reduce la especificidad a cero, permitiendo sobrescribir estos estilos fácilmente si es necesario en componentes específicos, mejorando enormemente la mantenibilidad.

## Conclusión

Estas dos semanas han sido un ejercicio de rigor. Hemos priorizado la arquitectura, la seguridad y el rendimiento sobre las características deslumbrantes. Esta base sólida en ArceApps nos permitirá escalar nuestro contenido bilingüe y nuestra plataforma de agentes IA con confianza.

¿Qué nos espera? En la próxima iteración, planeamos profundizar en la orquestación de agentes y quizás, explorar nuevas formas de integrar la inteligencia artificial directamente en nuestro pipeline de CI/CD.

¡Sigamos construyendo en público! Nos vemos en el próximo commit.
