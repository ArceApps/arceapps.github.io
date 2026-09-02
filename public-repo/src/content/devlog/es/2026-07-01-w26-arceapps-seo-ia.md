---
title: "W26: Auditoría SEO, Agentes Inteligentes y la Evolución del Portfolio de ArceApps"
description: "Un repaso profundo por mi proceso de auditoría SEO total, la evolución de los artículos comparativos sobre IA y cómo diferencio técnicamente mi portfolio de mis otros proyectos como PuzzleHub."
pubDate: 2026-07-01
lastmod: 2026-07-01
tags: ["devlog", "arceapps", "ia-agents", "seo", "astro"]
keywords: ["arceapps", "seo audit", "astro sitemap", "ia agents", "indie dev"]
heroImage: "/images/placeholder-devlog-w26.svg"
---

# W26: Auditoría SEO, Agentes Inteligentes y la Evolución del Portfolio de ArceApps

[ArceApps Portfolio] Bienvenidos a una nueva entrada de la bitácora de mi viaje como desarrollador indie ("Indie Spirit/Solopreneur"). Estas últimas dos semanas han sido de esas en las que el trabajo duro y meticuloso de infraestructura, que muchas veces no se ve, toma el protagonismo. He centrado mis esfuerzos en consolidar **ArceApps**, no como un simple escaparate de aplicaciones, sino como la plataforma central y el ecosistema de agentes que define mi identidad técnica, diferenciándolo claramente de productos concretos como **PuzzleHub**.

A lo largo de este devlog, voy a desglosar cómo encaré una auditoría SEO masiva para un sitio multilingüe en Astro, cómo mejoré la calidad de los artículos técnicos sobre IA, y los desafíos arquitectónicos de diferenciar ecosistemas dentro de mi stack.

## Hito 1 (Desarrollo Web/UI): La Gran Auditoría SEO

El commit `2559108` marcó el fin de una tarea pendiente desde hacía tiempo: un *SEO audit completo*. Cuando construyes en público tu propio portfolio, a veces dejas los metadatos y la optimización para buscadores para "después". Ese "después" llegó la semana pasada.

### Generación Dinámica de Sitemaps Multilingües

Uno de los retos principales en ArceApps es que todo mi contenido (Devlogs, Apps, Blog) está localizado. Utilizo Astro, y aunque su ecosistema es fantástico, mantener un sitemap multilingüe requiere precisión. Decidí refactorizar la generación del sitemap en dos endpoints dinámicos: `src/pages/sitemap-en.xml.ts` y `src/pages/sitemap-es.xml.ts`.

El objetivo era extraer programáticamente las colecciones de contenido y establecer prioridades de indexación basadas en la jerarquía del sitio. Aquí hay un fragmento de cómo extraigo las rutas en inglés asegurando que solo se incluyan artículos no en borrador y con fecha de publicación válida:

```typescript
// Fragmento de src/pages/sitemap-en.xml.ts
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog', ({ data, id }) =>
    !data.draft && data.pubDate <= new Date() && id.startsWith('en/')
  );
  const apps = await getCollection('apps', ({ data, id }) =>
    !data.draft && id.startsWith('en/')
  );

  // Mapeo a URLs
  const blogUrls = blogPosts.map(post => ({
    url: `/blog/${post.slug.split('/').pop()}/`,
    lastmod: post.data.pubDate.toISOString(),
    priority: '0.8',
    changefreq: 'monthly',
  }));
  // ...
}
```

La clave aquí fue el filtrado `id.startsWith('en/')` o `id.startsWith('es/')`. Como mi colección de Astro maneja las subcarpetas de idiomas de forma transparente en los `slugs`, usar el `id` original garantiza que no haya cruce de idiomas.

### RSS Feeds y Endpoints de Búsqueda
Junto con los sitemaps, refactoricé el RSS Feed (`src/pages/rss.xml.js`) y el índice de búsqueda en `src/pages/search-index.json.ts`. Para el índice, apliqué la misma optimización que mencioné en un devlog anterior: procesar colecciones concurrentemente con `Promise.all`:

```typescript
export async function GET() {
  const [posts, apps] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('apps', ({ data }) => !data.draft),
  ]);
  // Generación del índice
}
```

Además, normalicé la forma en que los esquemas URI se sanitizan para evitar problemas de seguridad, una práctica vital cuando tu buscador está escrito en Vanilla JS puro en el cliente.

## Hito 2 (Contenido y Agentes): Profundizando en la IA

El portfolio de ArceApps es tanto sobre el código que escribo como sobre mi investigación en flujos de trabajo con agentes inteligentes. El commit `bdf2c98` representó una actualización masiva del contenido técnico del sitio.

He estado investigando y documentando activamente patrones de memoria persistente para agentes, servidores MCP (Model Context Protocol), frameworks de Socratic Agents y modelos de razonamiento profundo (como o1 o r1).

Mi flujo de trabajo para esto es puramente agentic (lo que yo llamo *Scribe Agent* y otras habilidades bajo `agents/skills/`). Pero he tenido que calibrar las directrices de estos agentes para que sigan mi voz ("Mi stack", "Mi flujo"). Un desarrollador indie no necesita jerga corporativa; necesita densidad técnica.

En las actualizaciones recientes, he forzado a mi ecosistema de generación de contenido a ser estricto con los frontmatters (exigiendo `lastmod` y `keywords`), porque Astro 5.16 y las colecciones tipeadas con Zod no perdonan:

```typescript
// src/content/config.ts (esquema ilustrativo)
const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    lastmod: z.date(), // Ahora obligatorio
    tags: z.array(z.string()),
    keywords: z.array(z.string()).min(3).max(8), // Validación estricta para SEO
    heroImage: z.string().optional(),
  }),
});
```

Este rigor de "specs-driven development" se traslada a mis artículos. Ya no se trata de "escribir sobre IA", sino de documentar *cómo uso la IA para construir mi software*.

## Hito 3 (El Reto de la Semana): Diferenciar ArceApps de PuzzleHub

Aquí es donde entra el diseño arquitectónico de mis distintos proyectos. Como solopreneur, gestiono múltiples aplicaciones y ecosistemas. El commit `451cd51` introdujo cambios sustanciales en cómo se manejan los logros (achievements) y la persistencia de estadísticas, pero *esos* cambios pertenecen a **PuzzleHub**, mi ecosistema de juegos (Hitori, Kakuro, Dominosa, etc).

El reto de la semana fue asegurar que **ArceApps**, el portfolio y la plataforma contenedora, reflejara esos avances de forma coherente sin mezclar las marcas. ArceApps es "quién soy y cómo trabajo"; PuzzleHub es "lo que los usuarios juegan".

Cuando actualicé la UI del portfolio (añadiendo páginas de detalles para apps específicas en `src/pages/apps/[...slug].astro`), tuve que aplicar el principio de Jerarquía Visual Responsiva (`.prose img { max-inline-size: min(100%, 500px); }`) para asegurar que las capturas de pantalla de los juegos de PuzzleHub se vieran perfectas en el contexto del portfolio de ArceApps.

En particular, la limitación `max-w-[200px]` con `object-contain` en las galerías de aplicaciones fue crucial. Me permitió mostrar la persistencia retroactiva de estadísticas de PuzzleHub (esa difícil migración de base de datos con columnas que empiezan en cero en vez de ser nullables) de forma elegante en la web de ArceApps, como un *caso de estudio* de ingeniería, no como una feature aislada.

## Conclusión y Visión a Futuro

Trabajar solo ("Indie Spirit") significa que soy mi propio Product Manager, mi propio ingeniero DevOps y mi propio especialista SEO. Esta quincena me ha enseñado que el SEO no es magia negra, es simplemente código estructurado y metadata bien mantenida. La inclusión de `sitemap-en.xml.ts` y las correcciones masivas de redirecciones son los cimientos invisibles que permiten que el contenido técnico de alto valor sobre agentes IA llegue a la audiencia adecuada.

En las próximas dos semanas, mi foco volverá a cambiar hacia la automatización del CI/CD de ArceApps, explorando cómo mis agentes pueden integrarse directamente en las GitHub Actions para no solo redactar estos devlogs (como el que estás leyendo), sino para pre-verificar las regresiones visuales.

Ese es el poder del ecosistema que estoy construyendo. Cada commit en el portfolio no es solo código; es un ladrillo más en un flujo de trabajo autónomo que me permite competir como un ejército de una sola persona.

Hasta el próximo sprint. Nos vemos en el código.