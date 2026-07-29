## Decisiones acordadas

**Tecnología:** se mantiene Astro 5 con TypeScript estricto, Tailwind 4 y DaisyUI; no se añadirán dependencias.

**Contenido e i18n:** se conserva la estructura EN/ES y la internacionalización actual. La colección Astro `projects` sustituirá al JSON existente.

**Proyectos:** se incorporarán tres proyectos iniciales, con referencias a sus primeros commits y etiquetas aproximadas. La portada mostrará tres publicaciones unidas por `pubDate`; Projects tendrá listado, detalle y hero.

**Diseño:** el índice de contenidos tendrá anchos definidos y colapsará de forma responsive.

**SkillsAI y fuentes:** SkillsAI será público bajo MIT; cada skill incluirá atribución y procedencia. Se copiará íntegramente el catálogo `android/skills` bajo Apache-2.0 y las fuentes MIT de LLM Wiki y Ponytail, auditando scripts, licencias y origen.

**Flujo:** los borradores actuales del árbol de trabajo viajarán a la rama de funcionalidad. El PRD está aprobado, pero el plan no comenzará hasta aprobar estas suposiciones.

## Suposiciones técnicas

1. El repositorio seguirá compilando con Astro 5, TypeScript estricto, Tailwind 4 y DaisyUI ya instalados, sin añadir paquetes.
2. Todo contenido nuevo o migrado de proyectos tendrá versión EN y ES mediante la infraestructura i18n existente.
3. La colección Astro `projects` será la única fuente de datos de proyectos y reemplazará el JSON actual sin consumidores residuales.
4. Un Project será elegible únicamente si apunta a un repositorio público y no duplica una App ya publicada.
5. La primera entrega contendrá exactamente tres Projects, cada uno vinculado a su primer commit disponible y con una etiqueta aproximada.
6. Las futuras fechas publicadas se obtendrán de una fuente verificable y se mostrarán como fechas exactas, no estimadas.
7. La portada seleccionará y mostrará exactamente tres publicaciones ordenadas y unidas por `pubDate`.
8. Cada Project dispondrá de una página de detalle y una imagen hero compatible con el esquema de contenido.
9. El TOC tendrá anchos explícitos en escritorio y se colapsará en pantallas donde no pueda coexistir con el contenido principal.
10. SkillsAI será públicamente accesible bajo licencia MIT e incluirá atribución y procedencia verificables para cada skill.
11. El catálogo `android/skills` se copiará íntegramente bajo Apache-2.0, y LLM Wiki y Ponytail bajo MIT, conservando avisos de licencia y origen.
12. Antes de publicar un enlace externo se verificará que su destino sea públicamente visible.
13. Los documentos actualmente sin confirmar del árbol de trabajo se incluirán en la rama de funcionalidad antes de abrir la implementación.
