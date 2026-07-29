# Verificación: rediseño visual moderno integral

## Criterios de aceptación globales

- [ ] `pnpm test` pasa sin regresiones.
- [ ] `pnpm build` finaliza correctamente.
- [ ] Todas las rutas públicas EN/ES usan el sistema visual de `DESIGN.md` y cadenas localizadas.
- [ ] El header tiene comportamiento móvil, tablet y escritorio accesible; footer enlaza las secciones actuales.
- [ ] El TOC no se superpone al artículo a 1280 px y permanece navegable por teclado.
- [ ] `projects` es una colección Astro; `projects.json` no tiene consumidores.
- [ ] SpecAI, NewsAPI y SkillsAI tienen ficha EN/ES, hero, `reference_id` y fecha marcada como aproximada.
- [ ] Projects solo contiene repositorios públicos y no duplica Apps.
- [ ] Home muestra exactamente tres elementos de Apps/Projects ordenados por `pubDate`.
- [ ] Las fichas Project muestran procedencia cuando corresponde.
- [ ] SkillsAI tiene MIT, registro de procedencia individual, avisos Apache-2.0/MIT conservados y explicación de colección personal.
- [ ] SkillsAI es público en GitHub antes de que la web publique su enlace.

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
