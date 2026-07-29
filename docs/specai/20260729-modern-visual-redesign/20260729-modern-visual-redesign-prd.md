# Product Requirements Document: Rediseño visual moderno integral de ArceApps

**Date:** 2026-07-29  
**Status:** DRAFT

## 1. Problem Statement & Solution

### Problem Statement

- La apariencia actual de las rutas públicas no ofrece una experiencia visual integral, coherente y moderna entre las versiones en inglés y español.
- La tabla de contenidos de los artículos de blog se solapa con el contenido a 1280 px cuando conviven un sidebar de 200 px y un área de lectura de 760 px.
- Los proyectos están definidos en `projects.json`, fuera del sistema de colecciones de contenido de Astro y sin una estructura bilingüe equivalente al resto del contenido.
- La sección Projects debe representar exclusivamente repositorios públicos, no aplicaciones, y necesita páginas internas, recursos hero y metadatos de procedencia verificables.
- La portada no combina de forma consistente las tres entradas más recientes entre Apps y Projects según `pubDate`.
- La incorporación de skills y recursos de terceros requiere trazabilidad de autoría, licencia, origen, modificaciones y motivo de adaptación antes de su publicación.

### Solution

- Aplicar un rediseño visual completo y coherente a todas las rutas públicas en EN y ES, utilizando el sistema cromático teal/orange definido en `DESIGN.md`.
- Corregir el comportamiento responsive del TOC para que nunca invada el área de lectura en el escenario de 1280 px con sidebar de 200 px y contenido de 760 px.
- Migrar Projects desde `projects.json` a una colección Astro bilingüe, con listados y páginas de detalle internas en EN y ES.
- Mostrar SpecAI, NewsAPI y SkillsAI, ordenados por fecha, con su fecha aproximada de primer commit etiquetada expresamente como aproximada.
- Crear y asociar recursos hero para cada Project.
- Construir en Home una selección unificada de Apps y Projects, ordenada por `pubDate`, que muestre los tres elementos más recientes.
- Publicar el catálogo de SkillsAI con la procedencia completa de toda adaptación externa y comprobar tanto el contenido de terceros como la visibilidad pública de SkillsAI antes de enlazarlo.

---

## 2. User Stories

1. **As a** visitante de ArceApps, **I want to** navegar por todas las rutas públicas en inglés y español con un lenguaje visual unificado **so that** percibo un sitio coherente, moderno y fácil de usar.
2. **As a** lector de un artículo de blog, **I want to** consultar la tabla de contenidos sin que se solape con el texto a 1280 px de ancho **so that** puedo leer y navegar el artículo sin obstáculos visuales.
3. **As a** visitante, **I want to** distinguir claramente Apps de Projects **so that** entiendo que Projects reúne repositorios públicos y no duplica el catálogo de aplicaciones.
4. **As a** visitante de habla inglesa, **I want to** acceder al listado y detalle de cada Project en inglés **so that** puedo conocer el trabajo publicado en mi idioma.
5. **As a** visitante de habla hispana, **I want to** acceder al listado y detalle de cada Project en español **so that** puedo conocer el trabajo publicado en mi idioma.
6. **As a** visitante, **I want to** ver SpecAI, NewsAPI y SkillsAI ordenados por fecha **so that** identifico los proyectos actuales sin una selección manual arbitraria.
7. **As a** visitante, **I want to** ver una fecha de primer commit claramente marcada como aproximada cuando exista evidencia verificable **so that** comprendo el nivel de precisión de ese dato.
8. **As a** visitante, **I want to** ver una imagen hero en cada página de detalle de Project **so that** puedo reconocer visualmente cada repositorio.
9. **As a** visitante de Home, **I want to** ver los tres elementos más recientes de Apps y Projects ordenados conjuntamente por fecha de publicación **so that** descubro la actividad más nueva sin tener que recorrer varias secciones.
10. **As a** usuario interesado en SkillsAI, **I want to** consultar un catálogo público de skills y recursos relacionados **so that** puedo reutilizar o estudiar materiales disponibles con sus condiciones claras.
11. **As a** persona que revisa atribuciones, **I want to** ver una ficha de procedencia en cada adaptación de terceros **so that** puedo verificar su fuente, autor, licencia, origen, modificaciones y razón de uso.
12. **As a** mantenedor de ArceApps y SpecAI, **I want to** adaptar skills para esos proyectos sin perder su procedencia original **so that** la utilidad práctica no elimina la trazabilidad legal y técnica.

---

## 3. Architectural Decisions

### Module Architecture

- El rediseño usará los tokens, colores teal/orange y criterios visuales establecidos en `DESIGN.md`; no se definirá un sistema de marca paralelo.
- Las rutas públicas existentes consumirán componentes y estilos reutilizables compatibles con EN y ES, evitando bifurcaciones visuales entre ambos idiomas.
- La corrección del TOC se concentrará en el componente y estilos responsables de la navegación del artículo. Conservará el contenido estructurado de encabezados y definirá un comportamiento responsive que reserve el espacio de lectura antes de mostrar una barra lateral fija.
- Projects dejará de depender de `projects.json` y se modelará como colección de contenido Astro bilingüe, con entradas separadas para EN y ES, frontmatter validado y `pubDate` como campo de ordenación.
- La colección Projects representará exclusivamente repositorios públicos. Apps continuará siendo la colección destinada a aplicaciones.
- Cada Project tendrá entrada EN y ES, ruta interna en ambos idiomas, `heroImage`, enlace al repositorio público y fecha de primer commit solo cuando se haya obtenido de una fuente verificable. Su presentación indicará expresamente que es aproximada.
- El catálogo inicial de Projects se limitará a SpecAI, NewsAPI y SkillsAI, ordenado por fecha; no se asignarán fechas concretas sin evidencia.
- Home obtendrá Apps y Projects desde sus colecciones, unificará ambos conjuntos, los ordenará descendentemente por `pubDate` y presentará únicamente los tres primeros resultados.
- SkillsAI será un Project público separado y deberá ofrecer skills personales para ArceApps y SpecAI, el catálogo íntegro de `android/skills` bajo Apache-2.0, recursos pertinentes de Google, Gemini y Kotlin con licencia individual verificada, LLM Wiki de Astro-Han bajo MIT y Ponytail de DietrichGebert bajo MIT.
- Toda adaptación de terceros incluirá enlace de fuente, autor, licencia, origen, qué se modificó y razón de la modificación. Las skills podrán adaptarse para ArceApps o SpecAI, pero nunca se eliminará ni sustituirá esa ficha.

### Verification Seams (Costuras)

- La colección Projects se verificará en el límite de esquema de Astro: entradas EN/ES válidas, campos obligatorios, `heroImage`, `pubDate`, enlace público y metadatos de procedencia cuando corresponda.
- La migración se verificará en el límite de contenido: ningún listado ni página de Project dependerá de `projects.json` después de la transición.
- Los listados de Projects se verificarán contra la regla editorial: solo repositorios públicos, sin Apps duplicadas y ordenados por fecha.
- Las páginas de detalle se verificarán en ambas rutas idiomáticas para cada Project, incluyendo hero, cadenas de interfaz y enlaces internos.
- Home se verificará con un conjunto que mezcle Apps y Projects para confirmar que la selección final contiene exactamente tres elementos y respeta el orden descendente por `pubDate`.
- El TOC se verificará en viewport de 1280 px con sidebar de 200 px y área de contenido de 760 px, comprobando que no existe solapamiento ni reducción ilegible del cuerpo del artículo.
- Las fichas de procedencia se verificarán por adaptación: enlace accesible, autor identificado cuando la fuente lo publique, licencia indicada, origen, modificación y razón presentes.
- Antes de publicar contenido de terceros se realizará inspección y lint del material incorporado, respetando las herramientas ya disponibles en el repositorio.
- Antes de enlazar SkillsAI desde una ruta pública se confirmará su visibilidad pública real. Si no puede confirmarse, el enlace no se publicará.

### Avoiding Side Effects

- No se añadirán dependencias npm; el rediseño, las colecciones, el ordenado y la presentación de procedencia usarán Astro y las dependencias existentes.
- La migración conservará Apps como una colección independiente y no reinterpretará aplicaciones existentes como Projects.
- Los cambios de estilos del TOC se limitarán a la navegación de artículos y sus breakpoints, sin alterar de forma involuntaria la maquetación de otras páginas.
- Las rutas EN y ES compartirán estructura y componentes cuando sea posible, pero mantendrán contenido, slugs y cadenas localizadas según las convenciones actuales de i18n.
- Los enlaces externos de Projects y procedencia se mantendrán separados de la navegación interna para evitar convertir recursos no verificados en contenido del sitio.
- La adaptación de skills de terceros no modificará ni ocultará la autoría, licencia u origen de la fuente original.

---

## 4. System Constraints (Must-NOTs)

- El proyecto **must NOT** añadir dependencias npm nuevas.
- Projects **must NOT** incluir aplicaciones; solo representará repositorios públicos.
- La implementación **must NOT** inventar fechas de primer commit, fechas de publicación, permisos, licencias ni condiciones de visibilidad.
- La interfaz **must NOT** mostrar una fecha de primer commit como exacta cuando sea aproximada o no esté verificada.
- La tabla de contenidos **must NOT** solaparse con el contenido del blog a 1280 px con sidebar de 200 px y área de lectura de 760 px.
- Las rutas públicas EN y ES **must NOT** divergir en funcionalidad o estructura visual por falta de implementación equivalente.
- Home **must NOT** mostrar más de tres elementos en la selección conjunta de Apps y Projects.
- El sitio **must NOT** enlazar SkillsAI como recurso público hasta confirmar que el repositorio es públicamente visible.
- El contenido de terceros **must NOT** publicarse sin inspección y lint previos.
- Ninguna adaptación de terceros **must NOT** carecer de enlace de fuente, autor, licencia, origen, modificaciones y motivo de adaptación.
- Las skills adaptadas para ArceApps o SpecAI **must NOT** perder sus datos de procedencia originales.
- El rediseño **must NOT** introducir un sistema de color que contradiga el teal/orange definido en `DESIGN.md`.

---

## 5. Edge Case Analysis

- **Datos de primer commit no verificables:** si no se puede obtener una fecha fiable del historial público, el Project no mostrará una fecha concreta. No se sustituirá por una estimación inventada.
- **Fecha aproximada disponible:** si el historial permite una aproximación razonable, se presentará con una etiqueta inequívoca de fecha de primer commit aproximada.
- **Repositorio privado, inexistente o sin acceso público:** no se incluirá en Projects ni se publicará un enlace como si fuera accesible.
- **SkillsAI sin visibilidad pública confirmada:** se podrá preparar contenido interno, pero no se añadirá un enlace público hasta completar la confirmación.
- **Project sin traducción equivalente:** no se publicará una ruta incompleta que rompa la paridad EN/ES; deberá existir la entrada correspondiente o mantenerse fuera del listado público hasta disponer de ella.
- **Project sin hero disponible:** se creará un hero compatible con las reglas visuales del sitio antes de publicar la página de detalle.
- **`pubDate` ausente o inválido:** la entrada no participará en el ordenado de Home hasta corregir sus metadatos; no se inferirá una fecha.
- **Empate de `pubDate` entre Apps y Projects:** se definirá un criterio determinista secundario basado en metadatos ya existentes, sin alterar la fecha original.
- **Viewport de 1280 px:** el TOC deberá reubicarse, limitarse o pasar a un modo no fijo cuando el espacio combinado no permita sidebar y lectura sin colisión.
- **Pantallas más estrechas:** el TOC seguirá siendo accesible por teclado y no ocultará encabezados, enlaces ni el contenido principal.
- **Fuente de terceros sin licencia verificable:** el recurso no se publicará como adaptación hasta disponer de una licencia identificable y compatible.
- **Autor no publicado por la fuente:** la ficha indicará que la autoría no está declarada por el origen, sin inventar una atribución.
- **Licencia o contenido de terceros cambiado aguas arriba:** la publicación reevaluará la ficha de procedencia y el resultado de inspección/lint antes de actualizar la adaptación.

---

## 6. Out of Scope

- Crear nuevas aplicaciones o convertir Projects en un catálogo de Apps.
- Añadir autenticación, gestión de usuarios, comentarios o funcionalidades sociales.
- Crear una plataforma de búsqueda, instalación o ejecución remota de skills.
- Garantizar permisos, fechas o licencias que no puedan verificarse desde sus fuentes correspondientes.
- Incorporar dependencias npm para resolver el rediseño, la colección Projects o la navegación responsive.
- Rediseñar la identidad de marca fuera de los criterios teal/orange ya definidos en `DESIGN.md`.
- Publicar SkillsAI o enlazarlo públicamente antes de confirmar su visibilidad pública.
- Modificar el contenido sustantivo de recursos de terceros más allá de las adaptaciones justificadas y documentadas en su ficha de procedencia.
