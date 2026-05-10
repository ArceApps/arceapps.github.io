---
title: "W18: Endureciendo el Portfolio, Mitigación de DOM XSS y Jerarquía Visual"
description: "Un análisis profundo sobre parches de seguridad en Astro, el refinamiento de la jerarquía visual responsiva para contenido Markdown, y la crónica de la génesis de mydevbot."
pubDate: 2026-05-01
tags: ["devlog", "arceapps", "seguridad", "xss", "css", "mydevbot"]
heroImage: "/images/devlog-default.svg"
reference_id: "devlog-w18-security-visual-hierarchy"
---

¡Bienvenidos a la Bitácora del Portfolio de ArceApps! En nuestra serie continua de "Construcción en Público" para el ecosistema ArceApps (distinto de nuestra vertical de juegos PuzzleHub), las últimas dos semanas se han definido por un enfoque renovado en los fundamentos de seguridad y el refinamiento visual. Mientras que iterar sobre nuevas funcionalidades siempre es emocionante, la marca de una ingeniería madura reside en revisar los cimientos.

Esta quincena, abordamos una vulnerabilidad crítica de scripting entre sitios (XSS) oculta en nuestra lógica de búsqueda del lado del cliente, rediseñamos la jerarquía visual responsiva para los medios incrustados en nuestros artículos Markdown, y publicamos una serie exhaustiva de tres partes detallando la génesis y arquitectura de "mydevbot", nuestro asistente de flujo de trabajo de IA personalizado.

Desgranemos los retos técnicos y las soluciones que implementamos.

## Hito 1 (Desarrollo Web/UI): Jerarquía Visual Responsiva para Medios en Texto

En el Portfolio de ArceApps, nuestros artículos de blog y bitácora dependen en gran medida del contenido enriquecido. En las últimas semanas, notamos que las capturas de pantalla, videos y medios incrustados dentro de nuestros elementos Markdown `.prose` ocasionalmente rompían los límites del contenedor en dispositivos móviles más pequeños o aparecían torpemente sobredimensionados en pantallas de escritorio.

### El Problema con los Medios sin Restricciones
Por defecto, las imágenes grandes pueden desbordar sus contenedores padre, causando desplazamiento horizontal (un anti-patrón de UX importante). Aunque el plugin `prose` de Tailwind maneja la tipografía general de maravilla, a veces requiere intervención manual para elementos multimedia específicos para mantener una jerarquía visual estricta.

Necesitábamos una solución que manejara con elegancia tipos de medios mixtos (`img`, `video`, `iframe`) mientras respetaba las propiedades lógicas que hemos adoptado para nuestros estándares CSS de 2026.

### La Solución de Propiedades Lógicas CSS
Actualizamos `src/styles/global.css` para aplicar una caja delimitadora estricta y responsiva para todos los medios dentro de los cuerpos de nuestros artículos. En lugar de depender puramente de clases de utilidad de Tailwind, que pueden volverse verbosas al apuntar a elementos Markdown profundamente anidados, aplicamos una regla CSS global enfocada.

```css
/* src/styles/global.css */
/* Jerarquía visual para medios dentro del prose de markdown */
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

**Por qué funciona este enfoque:**
1.  **`max-inline-size: min(100%, 500px)`:** Este es el núcleo del comportamiento responsivo. Asegura que la imagen nunca exceda el ancho de su contenedor (`100%`) en móviles, pero limita su crecimiento máximo a `500px` en escritorio. Esto previene que capturas de pantalla de baja resolución se estiren para llenar una columna de artículo ancha, manteniendo la fidelidad visual.
2.  **Propiedades Lógicas CSS:** Al usar `margin-inline` y `margin-block` en lugar de `margin-left`/`right` o `margin-top`/`bottom`, nos aseguramos de que nuestros estilos sigan siendo robustos si alguna vez introducimos soporte para idiomas de derecha a izquierda (RTL) en el futuro. Esto se alinea con nuestro compromiso con estándares web modernos e inclusivos delineados en nuestro `ANALISIS_WEB.md`.
3.  **Pulido Estético:** La combinación de `border-radius` y un sutil `box-shadow` eleva la presentación de las capturas de pantalla, dándoles una apariencia moderna tipo "tarjeta" que encaja perfectamente con el lenguaje de diseño de ArceApps.

## Hito 2 (Infraestructura/IA): La Crónica de la Génesis de mydevbot

Más allá del portfolio en sí, gran parte de nuestro esfuerzo de ingeniería en el ecosistema ArceApps implica construir herramientas internas para acelerar nuestro flujo de trabajo. La más significativa de estas es **mydevbot**, nuestro asistente de IA a medida diseñado para manejar todo, desde la monitorización de CI/CD hasta el triaje de revisión de código.

Durante las últimas dos semanas, dedicamos tiempo a documentar la creación y evolución de mydevbot en una serie de devlog de tres partes, publicada tanto en inglés como en español.

### La Trilogía de mydevbot

1.  **Génesis y Hardware (`2026-03-05-mydevbot-genesis-hardware.md`):** Este artículo explora las motivaciones iniciales para construir un bot personalizado en lugar de depender de soluciones comerciales. Detallamos las restricciones de hardware, la decisión de ejecutar inferencia local para tareas específicas, y el boceto arquitectónico inicial.
2.  **GitHub Actions y Habilidades Cron (`2026-03-06-mydevbot-github-cron-skills.md`):** Aquí, nos sumergimos en la integración práctica. Explicamos cómo mydevbot interactúa con la API de GitHub para monitorizar la salud del repositorio, utilizando GitHub Actions y trabajos cron para automatizar tareas de mantenimiento de rutina y comprobaciones de PR.
3.  **Integración CI/CD y el Futuro eGPU (`2026-03-07-mydevbot-cicd-egpu-future.md`):** La pieza final se centra en la compleja orquestación requerida para inyectar un agente de IA en un pipeline CI/CD seguro. También especulamos sobre futuras actualizaciones de hardware, específicamente la potencial integración de una eGPU para reducir drásticamente los tiempos de inferencia local para modelos de razonamiento más complejos.

Escribir estos artículos es una parte fundamental de nuestra filosofía de "Construcción en Público". Al compartir las decisiones arquitectónicas—y los errores—esperamos aportar ideas valiosas a las comunidades más amplias de indie hacking e ingeniería de IA.

## Hito 3 (El Reto de la Semana): Mitigando DOM XSS en la Búsqueda y Copia de Código

El desafío técnico más crítico de este sprint fue una auditoría de seguridad proactiva que reveló potenciales vulnerabilidades de Cross-Site Scripting (XSS) basadas en el DOM en dos scripts del lado del cliente: nuestro componente de búsqueda global (`src/scripts/search.ts`) y nuestra utilidad para copiar fragmentos de código (`src/scripts/code-copy.ts`).

### La Vulnerabilidad: Los Peligros de `innerHTML`
Ambos scripts estaban usando previamente la propiedad `innerHTML` para inyectar dinámicamente contenido en el DOM.

En el componente de búsqueda, las consultas de los usuarios y los resultados de búsqueda se estaban concatenando en cadenas HTML y asignando a `innerHTML`. Si un actor malicioso lograba inyectar una carga útil manipulada (ej. `<img src=x onerror=alert(1)>`) en el índice de búsqueda o en la cadena de consulta, el navegador la ejecutaría.

De manera similar, la utilidad de copia de código estaba usando `innerHTML` para mostrar brevemente un mensaje de "¡Copiado!", lo cual, aunque menos expuesto, todavía representaba una violación de las prácticas de codificación segura.

### La Solución: APIs de Manipulación DOM Seguras
Para remediar esto, emprendimos una refactorización integral de ambos scripts, erradicando por completo el uso de `innerHTML`. Migramos a APIs DOM integradas y seguras: `document.createElement`, `textContent`, y `replaceChildren`.

He aquí un vistazo a la transformación en el componente `search.ts`:

**Antes (Vulnerable):**
```typescript
// Enfoque vulnerable usando innerHTML
resultsContainer.innerHTML = results.map(result => `
  <li class="search-result-item">
    <a href="${result.url}">
      <h4>${result.title}</h4>
      <p>${result.description}</p>
    </a>
  </li>
`).join('');
```

**Después (Seguro):**
```typescript
// Enfoque seguro usando createElement y textContent
resultsContainer.replaceChildren(); // Limpia el contenido existente de forma segura

results.forEach(result => {
  const li = document.createElement('li');
  li.className = 'search-result-item p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0';

  const a = document.createElement('a');
  a.href = sanitizeUrl(result.url); // Capa adicional de sanitización de URL
  a.className = 'block';

  const h4 = document.createElement('h4');
  h4.className = 'text-lg font-semibold text-primary-600 dark:text-primary-400 mb-1';
  h4.textContent = result.title; // Seguro: textContent escapa automáticamente el HTML

  const p = document.createElement('p');
  p.className = 'text-sm text-gray-600 dark:text-gray-400 line-clamp-2';
  p.textContent = result.description; // Seguro: textContent escapa automáticamente el HTML

  a.appendChild(h4);
  a.appendChild(p);
  li.appendChild(a);

  resultsContainer.appendChild(li);
});
```

### Defensa en Profundidad: Sanitización de URL
Mientras que `textContent` protege contra la inyección de HTML en los nodos de texto, también teníamos que asegurarnos de que el atributo `href` de las etiquetas de anclaje fuera seguro. Un atacante podría potencialmente inyectar un esquema URI malicioso como `javascript:alert(1)`.

Para contrarrestar esto, implementamos una función `sanitizeUrl`. Esta utilidad valida la URL contra una lista blanca de protocolos seguros (como `http:` y `https:`) y elimina los caracteres de control invisibles que podrían usarse para eludir la coincidencia de cadenas simples.

### Pruebas de Regresión con Vitest
Los parches de seguridad son tan buenos como las pruebas que demuestran que funcionan y aseguran que no se rompan en el futuro. Añadimos pruebas de regresión XSS específicas a `src/scripts/search.test.ts`.

```typescript
// src/scripts/search.test.ts
import { describe, it, expect } from 'vitest';
// ... importaciones ...

describe('Seguridad del Componente de Búsqueda', () => {
  it('debería renderizar cargas útiles maliciosas como texto plano', () => {
    const maliciousTitle = '<script>alert("xss")</script> Título Malicioso';
    const safeContainer = renderSearchResult({ title: maliciousTitle, /* ... */ });

    // Afirmar que la etiqueta script NO se ejecutó y está presente como texto
    expect(safeContainer.innerHTML).not.toContain('<script>');
    expect(safeContainer.textContent).toContain('<script>alert("xss")</script>');
  });
});
```
Estas pruebas utilizan Vitest y JSDOM para simular el entorno del navegador, confirmando que las cargas útiles maliciosas se renderizan de forma inofensiva como texto plano.

## Conclusión

Este ciclo de dos semanas fue un recordatorio crucial de que la deuda técnica no se trata solo de código desordenado; también se trata de vulnerabilidades de seguridad latentes e inconsistencias de UX. Al reemplazar `innerHTML` con APIs DOM seguras y aplicar una jerarquía visual estricta utilizando propiedades lógicas CSS modernas, hemos endurecido significativamente el Portfolio de ArceApps.

De cara al próximo sprint, planeamos volver a enfocar nuestra atención en el desarrollo de funcionalidades, específicamente explorando integraciones más profundas con nuestro recién documentado mydevbot para automatizar más de nuestro pipeline de publicación de contenido.

Hasta la próxima, sigan construyendo de forma segura.
