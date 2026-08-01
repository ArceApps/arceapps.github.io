---
title: "W31: Bento Grids, Agentes SEO y el Rediseño Arquitectónico del Portfolio"
description: "Crónica técnica sobre el rediseño moderno del portfolio de ArceApps usando Bento Grids, esquemas JSON-LD, automatización con OpenCode y Astro."
pubDate: "2026-08-01"
lastmod: "2026-08-01"
tags: ["devlog", "arceapps", "ia-agents", "astro", "seo", "ui", "opencode"]
keywords: ["bento grid astro", "seo json-ld", "opencode ai", "portfolio redesign"]
heroImage: "/images/devlog-default.svg"
---

**[ArceApps Portfolio]** – *Construcción en Público (Building in Public).*

Estas últimas dos semanas han supuesto un salto cuántico en la madurez y la presencia online de mi ecosistema. He pausado temporalmente las implementaciones directas en mi producto principal de juegos (PuzzleHub) para enfocarme al cien por cien en la nave nodriza: **El Portfolio de ArceApps**.

Como desarrollador independiente y solopreneur, la forma en que presento mis proyectos, mis artículos técnicos y mis experimentos con inteligencia artificial es tan vital como el código fuente que los respalda. En este devlog narraré en profundidad las decisiones de ingeniería, arquitectura de agentes y SEO técnico que han dado forma al rediseño completo de la web, desde el UI hasta el CI/CD impulsado por agentes.

## El Estado del Arte: Más Allá de un Simple Portfolio

Mi stack y workflow están diseñados para minimizar la fricción operativa. Sin embargo, mi antiguo sitio web había quedado obsoleto frente al torrente de nuevos contenidos, investigaciones sobre agentes IA, y aplicaciones que estaba publicando. Necesitaba una arquitectura web que fuera modular, altamente optimizada para SEO, accesible y capaz de mostrar de un vistazo la complejidad de lo que construyo en solitario.

Así que decidí apostar por un rediseño completo utilizando **Astro**. Quería que la plataforma fuera estática y extremadamente rápida, aprovechando las capacidades del framework para generar esquemas semánticos y estructurar un nuevo sistema visual basado en **Bento Grids**.

## Hito 1 (Desarrollo Web/UI): La Geometría del Bento Grid

El primer reto fue estructurar la ingente cantidad de información en la página de inicio. Opté por un patrón de diseño "Bento Grid". Este patrón no solo es visualmente atractivo, sino que me permite empaquetar de forma modular enlaces rápidos, mis aplicaciones destacadas, el stack tecnológico y los últimos devlogs en componentes completamente aislados.

Para implementarlo, creé un componente maestro `BentoGrid.astro` que maneja el responsive design de manera robusta sin JavaScript adicional, confiando en CSS Grid puro:

```astro
---
interface Props {
  class?: string;
  id?: string;
}

const { class: className = "", id = "bento-grid" } = Astro.props;
---

<section id={id} class="py-12 md:py-20 px-4 md:px-6 container mx-auto max-w-7xl cv-auto fade-in-section">
  <div class={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(220px,auto)] ${className}`}>
    <slot />
  </div>
</section>
```

Esta solución es elegante y declarativa. Me permite iterar sobre las "cajas" individuales del Bento sin tocar el layout principal. Combinado con esto, implementé una validación rigurosa de contratos de diseño (`design-contract.test.ts`), asegurando que todos los componentes Bento respeten la jerarquía visual responsiva, restringiendo las imágenes o elementos pesados para que nunca desborden sus contenedores, algo fundamental en mi filosofía indie donde un componente roto cuesta visibilidad.

Junto a esto, consolidé el sistema de internacionalización (i18n), estandarizando las migas de pan (breadcrumbs) y los Open Graph images (`OGImage.astro`).

## Hito 2 (Infraestructura/IA): La Llegada de los Agentes OpenCode

A nivel de automatización, esta quincena introdujo un cambio de paradigma en mi flujo CI/CD. He integrado **OpenCode** directamente en GitHub Actions. Esto significa que ahora tengo un entorno de agentes de IA capaz de ejecutar revisiones y tareas automatizadas en los pull requests.

Añadí el flujo de trabajo en `.github/workflows/opencode.yml`:

```yaml
name: opencode

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  opencode:
    if: |
      contains(github.event.comment.body, ' /oc') ||
      startsWith(github.event.comment.body, '/oc')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Install and run opencode
        run: |
          curl -fsSL https://opencode.ai/install | sh (emulated)
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH
          $HOME/.opencode/bin/opencode github run
```

Junto a esta infraestructura, desplegué nuevos "agentes de marca" y skills documentados. Por ejemplo, implementé el agente SEO (`write-blog-seo`). Este es un shell agent que valida estrictamente que cada artículo tenga un slug en kebab-case, sin "stopwords", y que el frontmatter cumpla con las longitudes de título (máximo 60 caracteres) y descripción (120-160 caracteres), así como las fechas de `lastmod`.

Es una maravilla técnica: externalizar el escrutinio SEO a un agente automatizado me permite concentrarme al 100% en la escritura técnica y la construcción del producto, mientras confío en que la máquina velará por el cumplimiento estricto del SEO Zod Schema en Astro.

## Hito 3 (El Reto de la Semana): Esquemas JSON-LD y Seguridad DOM XSS

El reto de ingeniería más profundo de la semana fue la integración segura de metadatos SEO enriquecidos (JSON-LD) en el Layout principal de Astro. No basta con inyectar JSON en un tag de script; si alguna variable (como el título o la descripción) incluye caracteres HTML escapados, se abre la puerta a vulnerabilidades de DOM XSS o simplemente a romper la validación del esquema.

Tuve que refactorizar `src/layouts/Layout.astro` para incorporar los esquemas dinámicos (`Person`, `WebSite`, `Article`) dependiendo del tipo de página. La clave fue asegurar la inyección de los datos serializados mediante una sanitización rigurosa directamente en Astro:

```astro
    <!-- Schema.org - Person (when type="profile") -->
    {type === "profile" && (
      <script
        type="application/ld+json"
        set:html={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "ArceApps",
          url: "https://arceapps.com/about-me",
          image: "https://arceapps.com/logo.png",
          sameAs: [
            "https://github.com/arceapps",
            "https://play.google.com/store/apps/developer?id=Arce+Apps",
          ],
        }).replace(/</g, "\\u003C")}
      />
    )}
```

Fijémonos en el `.replace(/</g, "\\u003C")`. Este es el detalle técnico crítico. Astro, por defecto, inyecta `set:html` directamente. Si no reemplazo los corchetes angulares en la serialización JSON, un atacante o un título mal formado podría cerrar la etiqueta `<script>` prematuramente. Este cambio, aparentemente diminuto, asegura la integridad total del portfolio y mitiga una de las fallas más comunes en las aplicaciones web modernas que renderizan metadata de manera dinámica.

## Lecciones Aprendidas

Esta quincena he consolidado mi visión sobre la delegación y la especialización en un proyecto en solitario. Cuando tu tiempo es el recurso más escaso, invertir en infraestructura rinde frutos masivos. El haber integrado herramientas de auditoría (registradas metódicamente en el commit de auditorías de diseño) y el pipeline de OpenCode reduce mi carga cognitiva drásticamente.

He comprendido que un portfolio no es solo un currículum estático. Es un *living system* o sistema vivo. La integración de los Bento Grids no solo es estética, obedece a una necesidad de organización de la información modular.

## Visión de Futuro

Las próximas dos semanas prometen ser un punto de inflexión. Con la base de la plataforma ArceApps completamente renovada y los agentes (Scribe, Sentinel, Palette) orquestados y funcionales, mi objetivo ahora es volver mi atención hacia la capa de datos. Quiero explorar cómo la persistencia en local (Local First Inference) puede revolucionar la próxima iteración de herramientas IA que estoy ideando para mis aplicaciones. Además, seguiré refinando las validaciones SEO y posiblemente extendiendo la cobertura de pruebas E2E para el nuevo diseño web, asegurando que el portfolio mantenga su estatus de referencia técnica impecable. La revolución Indie continúa.
