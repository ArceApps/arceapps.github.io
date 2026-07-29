# Verificación: rediseño visual moderno integral

## Criterios de aceptación globales

- [x] `pnpm test` pasa sin regresiones: 22 archivos y 149 tests.
- [x] `pnpm build` finaliza correctamente: 1023 páginas estáticas.
- [x] `pnpm astro check` finaliza con 0 errores y 0 warnings; quedan 18 hints heredados de scripts inline.
- [x] Todas las rutas públicas EN/ES usan el sistema visual compartido de `DESIGN.md` y los listados/detalles nuevos respetan i18n.
- [x] El header tiene comportamiento móvil, tablet y escritorio accesible; el footer enlaza Apps, Projects y las secciones actuales.
- [x] El TOC reserva 264 px frente a 760 px de lectura en un contenedor de 1200 px y permanece navegable por teclado.
- [x] `projects` es una colección Astro; `projects.json` no tiene consumidores.
- [x] SpecAI, NewsAPI y SkillsAI tienen ficha EN/ES, hero, `reference_id` y fecha marcada como aproximada.
- [x] Projects solo contiene repositorios públicos y no duplica Apps.
- [x] Home muestra exactamente tres elementos de Apps/Projects ordenados por `pubDate`.
- [x] Las fichas Project muestran procedencia cuando corresponde.
- [x] SkillsAI tiene MIT, registro de procedencia, avisos Apache-2.0/MIT conservados y explicación de colección personal.
- [x] SkillsAI es público en GitHub antes de que la web publique su enlace.

## Matriz de evidencia

| Área | Evidencia mínima |
| --- | --- |
| Contenido/i18n | Seis entradas Projects válidas y rutas EN/ES renderizadas |
| UI/accesibilidad | Navegación por teclado, foco visible, contraste y textos alternativos |
| TOC | Captura o inspección de 1280 px sin colisión |
| Orden | Contrato que confirma tres entradas y fecha descendente |
| Procedencia | Registro por skill con URL, autor, licencia y cambio |
| Publicación | Consulta GitHub que devuelva `visibility: public` |
| Integración | `pnpm test` y `pnpm build` correctos |
