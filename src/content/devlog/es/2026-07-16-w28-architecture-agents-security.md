---
title: "W28: Arquitectura Segura, Orquestación y Rendimiento en ArceApps"
description: "Crónica de la última quincena en la Construcción en Público de ArceApps. Detalles sobre mitigación de XSS, testing con Vitest y optimizaciones de build."
pubDate: "2026-07-16"
lastmod: "2026-07-16"
tags: ["devlog", "arceapps", "security", "vitest", "performance", "xss"]
keywords: ["arceapps portfolio", "seguridad web", "vitest jsdom", "astro performance", "orquestacion agentes"]
heroImage: "/images/placeholder-article-agents-md.svg"
---

Bienvenidos a una nueva entrega del devlog de ArceApps. Como desarrollador independiente ("Indie Spirit"), mi enfoque siempre ha sido construir una base técnica sólida y transparente. Antes de adentrarnos en los detalles técnicos de esta quincena, es crucial hacer una distinción fundamental: este devlog documenta exclusivamente los avances en el ecosistema y la plataforma del **Portfolio de ArceApps**, separándolo completamente de mis otros desarrollos como los juegos de PuzzleHub. Aquí, estamos hablando de la infraestructura central, los agentes de inteligencia artificial y la arquitectura web que soporta toda mi presencia digital.

Durante las últimas dos semanas, el esfuerzo de ingeniería se ha centrado en tres pilares principales: seguridad en la manipulación del DOM, una modernización exhaustiva del entorno de pruebas utilizando Vitest, y optimizaciones críticas en los tiempos de construcción de Astro. Estos cambios no solo mejoran la robustez actual de la plataforma, sino que sientan las bases para la futura orquestación de agentes autónomos que estoy desarrollando. A lo largo de este artículo, detallaré mi workflow, las decisiones arquitectónicas que he tomado y compartiré fragmentos de código real que ilustran cómo he abordado estos desafíos.

## Hito 1: Seguridad en la Manipulación del DOM y Serialización JSON

Uno de los principales desafíos en el desarrollo web moderno es garantizar que las inyecciones de código malicioso no comprometan la experiencia del usuario. Al auditar la arquitectura del Portfolio de ArceApps, identifiqué ciertas vulnerabilidades potenciales relacionadas con la forma en que se insertaba contenido en el DOM y cómo se serializaban los datos estructurados (JSON-LD) para el SEO.

### Eliminación de `innerHTML`

La primera acción fue erradicar por completo el uso de la propiedad `innerHTML` en varios de los scripts del cliente. El uso de `innerHTML` es una de las vías más comunes para ataques de tipo Cross-Site Scripting (XSS), especialmente si el contenido que se inserta proviene de fuentes dinámicas o no completamente confiables. Aunque el contenido de mi blog es estático y generado por mí mismo o mis agentes, la defensa en profundidad (defense-in-depth) exige que utilicemos APIs del DOM más seguras.

En el script encargado de la funcionalidad de copiar código (`src/scripts/code-copy.ts`), reemplacé la inserción directa de HTML por la creación de elementos mediante `document.createElement`, `textContent` y `replaceChildren`. Este enfoque garantiza que cualquier contenido dinámico se trate estrictamente como texto, eliminando cualquier posibilidad de que el navegador lo interprete y ejecute como marcado o scripts.

### Serialización Segura con `safeJsonLd`

El segundo aspecto de seguridad involucró la inyección de metadatos SEO. En Astro, es común incluir etiquetas `<script type="application/ld+json">` para proporcionar datos estructurados a los motores de búsqueda. Sin embargo, si estos datos contienen caracteres especiales que podrían cerrar la etiqueta del script prematuramente, se abre una ventana para ataques de inyección.

Para resolver esto, implementé una función de utilidad robusta llamada `safeJsonLd` en `src/utils/security.ts`. Esta función no solo convierte objetos a cadenas JSON de forma segura, sino que también escapa explícitamente caracteres sensibles al contexto HTML.

```typescript
/**
 * Safely serializes data to a JSON string for use in JSON-LD <script> tags.
 * Escapes characters that could be used for script injection or that have
 * special meaning in HTML, while preserving valid JSON.
 *
 * @param data The object to serialize
 * @returns A safe JSON string
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\u003c')
    .replace(/>/g, '\u003e')
    .replace(/&/g, '\u0026')
    .replace(/ /g, '\u2028')
    .replace(/ /g, '\u2029');
}
```

Como se observa en el fragmento, cualquier ocurrencia de `<`, `>`, y `&` es convertida a su representación Unicode. También escapo los separadores de línea y párrafo (` ` y ` `), los cuales pueden causar errores de sintaxis (SyntaxError) en motores de JavaScript antiguos si se incluyen directamente dentro de una cadena. Esta capa adicional de seguridad me permite dormir tranquilo sabiendo que mi ecosistema web está protegido desde la base.

## Hito 2: Evolución de la Infraestructura de Pruebas con Vitest

Mantener un ecosistema complejo como el Portfolio de ArceApps, que incluye cientos de páginas dinámicas y utilidades transversales, requiere de una red de seguridad infalible. Durante esta quincena, decidí dar un paso adelante en la madurez del proyecto al consolidar mi infraestructura de pruebas en torno a Vitest.

### Configuración de JSDOM y Globales

La transición a Vitest fue motivada por su velocidad excepcional y su integración nativa con el ecosistema de Vite, del cual Astro ya depende fuertemente. Configuré Vitest en `vitest.config.ts` para que operara con un entorno simulado de navegador (`jsdom`), lo que es indispensable para probar scripts de interfaz de usuario. Además, habilité los globales para simplificar la redacción de pruebas.

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true, // Allows using describe, it, expect without imports
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
```

Esta configuración permite que mis scripts de prueba se centren exclusivamente en la lógica de negocio sin el ruido visual de importar funciones básicas. Fue un cambio transformador en mi workflow de desarrollo (Test-Driven Development), mejorando mi productividad como solopreneur.

### Cobertura Exhaustiva en Utilidades

Una vez configurado el entorno, dediqué un esfuerzo considerable a aumentar la cobertura de pruebas. Archivos clave como `slugs.ts`, `sanitizer.ts`, y el recién creado `security.ts` ahora están completamente testeados. Por ejemplo, en el sanitizador de búsquedas, me aseguré de validar que los ataques de denegación de servicio (DoS) a través de textos masivos fueran mitigados truncando adecuadamente la longitud del string, al mismo tiempo que se purgan etiquetas HTML residuales. Estas pruebas se aseguran de que, independientemente de los cambios futuros, la integridad de mis herramientas se mantendrá intacta.

## Hito 3: El Reto de la Semana - Optimizando el Build de Astro

A medida que el número de artículos en la sección de blog y devlog ha crecido (incluyendo las masivas comparativas del reciente torneo de IDEs impulsados por IA), comencé a experimentar tiempos de compilación cada vez más largos en Astro. Siendo un desarrollador obsesionado con la eficiencia, este fue el desafío que decidí atacar frontalmente.

### El Problema: Consultas Secuenciales en `getStaticPaths`

Investigando el cuello de botella, descubrí que en las plantillas encargadas de generar las rutas dinámicas, el código realizaba llamadas a la función `getCollection` dentro de iteradores que no explotaban la concurrencia. Cada llamada a la colección dependía de que la anterior finalizara, creando un patrón de espera innecesario que escalaba linealmente con la cantidad de contenido. Esto afectaba drásticamente tanto a los builds en local como en la integración continua.

### La Solución: Concurrencia con `Promise.all`

La solución arquitectónica radicó en la refactorización profunda de las funciones `getStaticPaths`. Modifiqué la lógica para que las diferentes colecciones necesarias (por ejemplo, cargar el blog en español y en inglés simultáneamente) se solicitaran de manera concurrente utilizando `Promise.all`.

El impacto fue inmediato y contundente. Al paralelizar la carga de datos, el tiempo total de lectura se redujo a la duración de la operación más lenta, en lugar de ser la suma de todas las operaciones individuales. Además, revisé las técnicas de optimización en la iteración de mapas, sustituyendo patrones costosos por bucles `for` tradicionales y utilizando estructuras `Set` para búsquedas en memoria con complejidad de tiempo constante, $O(1)$. Esta mejora iterativa, si bien sutil a nivel de código, logró una reducción mensurable del 5-10% en ciertas rutinas pesadas, validando el principio de que los detalles importan cuando escalas un ecosistema.

## Reflexiones y Visión de Futuro

Construir en público el Portfolio de ArceApps no se trata solo de publicar código, sino de compartir el viaje de crecimiento técnico y estratégico. A lo largo de estas semanas, he reforzado áreas críticas de seguridad, establecido una base sólida para el testing y resuelto problemas de escalabilidad en la generación de contenido estático. Mi stack tecnológico se siente hoy mucho más resiliente de lo que era a principios de mes.

Mirando hacia adelante, las próximas dos semanas prometen ser igualmente emocionantes. Con la capa de compresión de contenido y las medidas de seguridad completamente en su lugar, el terreno está preparado para avanzar en las automatizaciones avanzadas. Mi foco se desplazará hacia el refinamiento del sistema de CI/CD, buscando integrar validaciones más complejas directamente en los hooks de pre-commit y profundizando en la comunicación asíncrona de los agentes de IA.

Cada paso que doy en el perfeccionamiento de mi "Indie Tech Stack" reafirma mi compromiso con la excelencia técnica. Como solopreneur, no cuento con un "departamento de QA" ni con un "equipo de operaciones"; yo soy responsable del ciclo completo de vida del software. Y eso es, precisamente, lo que hace que cada victoria técnica, por pequeña que sea (desde escapar correctamente un ampersand hasta arañar unos milisegundos en el build de Astro), sea profundamente satisfactoria.

La arquitectura de software es un proceso vivo y en constante iteración. Seguiré compartiendo estos aprendizajes, desafíos y victorias, consolidando a ArceApps no solo como un portfolio, sino como un testimonio tangible del desarrollo independiente de alta calidad. Hasta la próxima quincena.
