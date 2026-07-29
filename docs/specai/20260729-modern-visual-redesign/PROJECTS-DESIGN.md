# Diseño de Projects y rediseño visual moderno

**Fecha:** 2026-07-29  
**Ámbito:** rediseño completo de las rutas públicas de ArceApps en inglés y español.  
**Estado:** decisiones consolidadas para implementación.

## Propósito

Renovar la experiencia visual de todo el sitio público manteniendo el carácter indie, técnico y cercano de ArceApps.

El rediseño aplicará la paleta teal/orange ya aprobada en `DESIGN.md`.

Además, sustituirá el catálogo estático de proyectos por una colección Astro bilingüe, con páginas de detalle y atribución verificable de contenido reutilizado.

## Alcance de rutas

Se rediseñarán todas las rutas públicas EN y ES:

- Inicio: `/` y `/es/`.
- Apps: `/apps/`, `/es/apps/` y sus detalles.
- Projects: `/projects/`, `/es/projects/` y sus detalles.
- Blog, listados, artículos y taxonomías públicas.
- Sobre mí, contacto, búsqueda, páginas de error y cualquier ruta pública auxiliar.
- Navegación, pie, migas de pan, tarjetas, filtros y estados vacíos.

No se alterarán rutas internas de desarrollo ni se expondrán mecanismos de administración.

## Principios visuales

- Usar teal `#018786` como color principal y orange `#FF9800` como acento.
- Mantener buen contraste en temas claro y oscuro.
- Priorizar jerarquía tipográfica, lectura cómoda y navegación inmediata.
- Dar protagonismo a productos, código, aprendizaje y creación independiente.
- Evitar estética corporativa, lenguaje comercial agresivo o exceso de ornamento.
- Las tarjetas comunicarán tipo, fecha, tecnologías y acción principal sin ruido.
- La interfaz funcionará con teclado, lector de pantalla y pantallas pequeñas.
- Cada ruta EN y ES conservará una estructura visual equivalente, con textos localizados.

## Separación de Apps y Projects

`Apps` y `Projects` son catálogos distintos y no duplicarán elementos.

**Apps** contiene aplicaciones Android publicadas y disponibles para usuarios finales, especialmente las que disponen de ficha de Google Play.

**Projects** contiene repositorios públicos, herramientas, librerías, colecciones de skills, experimentos y productos de código abierto que no estén representados como Apps.

Una aplicación publicada no se volverá a listar en Projects aunque su repositorio sea público. Un Project podrá enlazar una App relacionada, pero no aparecer como una segunda tarjeta equivalente.

## Home: mezcla reciente

La Home mostrará automáticamente tres elementos recientes combinando Apps y Projects.

1. Obtiene las entradas publicables de ambas colecciones.
2. Las ordena de forma descendente por `pubDate`.
3. Toma las tres primeras sin favorecer una colección.
4. Muestra una etiqueta visual de tipo: `App` o `Project`.
5. Enlaza al detalle localizado correspondiente.
6. No inventa ni enlaza una traducción inexistente.

La mezcla no sustituye a los listados completos de Apps y Projects.

## Catálogo inicial de Projects

| Proyecto | Fecha | Precisión | Clasificación |
| --- | --- | --- | --- |
| SpecAI | 2026-06-02 | Aproximada; primer commit conocido | Workflow y skills para desarrollo asistido |
| NewsAPI | 2022-12-12 | Aproximada; primer commit conocido | Proyecto público histórico |
| SkillsAI | 2026-01-14 | Aproximada; primer commit conocido | Colección personal de skills |

Las fechas anteriores deberán mostrar una indicación visible y accesible, por ejemplo `Fecha aproximada`. Toda publicación futura usará una `pubDate` exacta y no llevará esa etiqueta.

## Migración de datos

`src/data/projects.json` dejará de ser la fuente del catálogo público de Projects. La fuente canónica será una colección Astro `projects`.

La migración preservará los datos útiles del JSON, pero aplicará la regla de elegibilidad para evitar que Apps publicadas aparezcan también como Projects. El JSON se retirará solo cuando no queden importaciones ni dependencias activas.

## Estructura de contenido propuesta

```text
src/content/
  projects/
    en/
      specai.md
      newsapi.md
      skillsai.md
    es/
      specai.md
      newsapi.md
      skillsai.md
public/
  images/
    projects/
      specai/
      newsapi/
      skillsai/
```

Cada Project tendrá una entrada EN y otra ES que comparten un `reference_id` estable. Cada detalle podrá incluir imágenes, diagramas, capturas, enlaces al repositorio, tecnologías, historia, estado y atribuciones.

## Esquema de datos sugerido

```ts
type ProjectFrontmatter = {
  title: string;
  description: string;
  reference_id: string;
  pubDate: Date;
  datePrecision: "exact" | "approximate";
  heroImage: string;
  heroImageAlt: string;
  repositoryUrl: string;
  demoUrl?: string;
  documentationUrl?: string;
  status: "active" | "maintained" | "archived" | "experimental";
  visibility: "public";
  technologies: string[];
  tags: string[];
  relatedApps?: string[];
  assets?: ProjectAsset[];
  provenance?: ProvenanceItem[];
};

type ProjectAsset = {
  src: string;
  alt: string;
  kind: "hero" | "screenshot" | "diagram" | "logo";
};

type ProvenanceItem = {
  item: string;
  sourceUrl: string;
  author: string;
  license: string;
  origin: "original" | "adapted" | "derived";
  modified: boolean;
  modificationReason?: string;
  notice?: string;
};
```

`reference_id` relaciona las versiones EN y ES. Las referencias a Apps relacionadas usarán identificadores estables de la colección `apps`, nunca títulos visibles. Los assets residirán en `public/images/projects/<project>/` y se referenciarán mediante rutas absolutas.

## Rutas de detalle

Cada Project tendrá detalles internos localizados:

- `/projects/specai/` y `/es/projects/specai/`.
- `/projects/newsapi/` y `/es/projects/newsapi/`.
- `/projects/skillsai/` y `/es/projects/skillsai/`.

Las páginas incluirán como mínimo resumen, estado y fecha, tecnologías, enlaces externos, galería o assets propios, relaciones con Apps cuando existan, procedencia/licencias y cambio de idioma cuando esté disponible.

## Elegibilidad de Projects

Una entrada será elegible si cumple todas estas condiciones:

- Tiene un repositorio público accesible.
- No está representada ya como App Android publicada en `apps`.
- Aporta una herramienta, repositorio, skill, biblioteca, experimento o producto técnico identificable.
- Tiene contenido suficiente para una página de detalle útil.
- Declara licencia, atribución o procedencia cuando incorpora trabajo ajeno.
- Puede mantenerse con una fuente de verdad clara.

No son elegibles los duplicados de Apps, repositorios privados o rotos, proyectos sin procedencia verificable cuando sea necesaria, ni entradas creadas solo para inflar el catálogo.

## SkillsAI

SkillsAI se hará público con licencia MIT. Será una colección personal mantenida para los proyectos de ArceApps y SpecAI.

No tendrá una zona de proveedores inmodificable: cada skill podrá reutilizarse, especializarse o combinarse para los flujos reales de los proyectos. Su procedencia seguirá siendo visible aunque haya sido modificada.

La página de SkillsAI diferenciará claramente las skills originales de las adaptadas.

## Procedencia por skill

Toda skill incorporada o adaptada registrará:

- Nombre de la skill.
- Fuente o repositorio de origen y enlace directo.
- Autor o autores reconocidos.
- Licencia aplicable.
- Origen: original, adaptada o derivada.
- Si fue modificada y la razón concreta.
- Aviso adicional exigido por la licencia, si lo hubiera.

La procedencia se mostrará tanto en el repositorio como en el contenido público cuando corresponda. No se atribuirá de forma genérica a una colección si las piezas tienen autores o licencias distintos.

## Catálogo Android y otras fuentes

Se incorporará el catálogo completo de [`android/skills`](https://github.com/android/skills) bajo Apache-2.0. Cada pieza podrá adaptarse para ArceApps, siempre que conserve la licencia, atribución requerida y una explicación de los cambios.

Cuando una skill dependa de material de Google, Gemini o Kotlin, enlazará la fuente oficial pertinente y describirá el uso real: referencia, integración, adaptación o material derivado. No se insinuará una afiliación inexistente.

Se adaptarán [Astro-Han/karpathy-llm-wiki](https://github.com/Astro-Han/karpathy-llm-wiki) y [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), ambas bajo MIT. Cada adaptación incluirá enlace original, autores, aviso MIT exigible y explicación breve de la adaptación.

## Reglas de contenido y atribución

- Toda portada incluirá `heroImage` y texto alternativo localizado.
- Los enlaces externos serán reales, específicos y revisables.
- Los créditos se mantendrán al traducir EN y ES.
- La traducción no elimina obligaciones de licencia ni modifica la autoría.
- Los assets de terceros requerirán licencia compatible o permiso explícito.
- Las fechas aproximadas no fingirán precisión.
- Las futuras publicaciones registrarán el día exacto de publicación.
- Los metadatos visibles corresponderán con los datos de la colección.

## Verificación de implementación

- Todas las rutas públicas EN y ES renderizan correctamente.
- La paleta teal/orange coincide con `DESIGN.md`.
- Apps y Projects no contienen entradas duplicadas.
- La Home mezcla exactamente tres entradas recientes de ambas colecciones.
- El orden usa `pubDate` y respeta `datePrecision`.
- SpecAI, NewsAPI y SkillsAI existen en EN y ES con `reference_id` coherente.
- Cada Project tiene detalle, portada y assets válidos.
- La colección `projects` sustituye los usos públicos de `projects.json`.
- SkillsAI declara MIT y su procedencia por skill.
- `android/skills`, Google/Gemini/Kotlin, karpathy-llm-wiki y ponytail tienen créditos, enlaces y licencias correctos.
- Teclado, contraste, texto alternativo y enlaces localizados funcionan.
- `pnpm build` termina sin errores.

## Glosario

**App:** aplicación Android publicada para usuarios finales.

**Project:** repositorio o producto técnico público que no duplica una App.

**Colección Astro:** fuente de contenido tipada y validada mediante `astro:content`.

**`reference_id`:** identificador estable que enlaza las versiones EN y ES de una misma entrada.

**`pubDate`:** fecha de publicación usada para ordenar contenido.

**Fecha aproximada:** fecha histórica estimada, etiquetada explícitamente como no exacta.

**Procedencia:** información verificable sobre fuente, autoría, licencia, origen y modificaciones.

**Adaptación:** material existente modificado para un uso concreto, conservando sus atribuciones y obligaciones de licencia.
