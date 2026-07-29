# Hallazgos de auditoría — 2026-07-29

> Generado por `/specai-audit-plan`. Esta auditoría no modifica la interfaz.

## Resumen

- 9 hallazgos: 3 de simplificación y 6 de arquitectura/diseño.
- La reforma anterior sí llegó a `main` mediante `8b56576`, pero la revisión del sitio publicado confirma que su resultado no cumple la dirección de «indie software studio» que documentó.
- El defecto de la tabla de contenidos se ha reproducido en `https://arceapps.com/es/blog/awesome-opencode-ecosystem/` a 1280 px: el panel mide 252,18 px dentro de una pista de 200 px e invade 4,18 px la columna de lectura.
- No se añaden dependencias: el rediseño puede hacerse con Astro, Tailwind, las fuentes y los iconos ya instalados.

## Simplificación

1. **[delete · media] Dos sistemas visuales sin consumidores.** `.material-card` y las 40 líneas de `.spatial-card` continúan en `src/styles/global.css`, pero ninguna plantilla Astro los usa. Eliminar ambos al instaurar el nuevo sistema; evita mantener Material, glassmorphism y el nuevo lenguaje a la vez. **Estimación:** -46 líneas.

2. **[shrink · media] Reglas editoriales duplicadas.** La estabilización de la columna de artículo está declarada tanto dentro de `@layer components` como de nuevo al final de `src/styles/global.css`. Consolidar la regla final con la fuente de verdad del layout. **Estimación:** -13 líneas y una fuente de verdad menos.

3. **[shrink · alta] Dos plantillas de artículo prácticamente iguales.** `src/pages/blog/[...slug].astro` y `src/pages/es/blog/[...slug].astro` comparten estructura, clases, TOC y composición; el diff solo cambia idioma, rutas, colecciones y etiquetas. Extraer una pantalla de detalle parametrizada por idioma, dejando las rutas con la carga de datos. El mismo patrón existe en detalles de Apps. **Impacto:** los cambios de diseño se harán una vez y no dos.

## Arquitectura y experiencia

4. **[dirección visual · crítica] El sistema actual sigue siendo una suma de retoques, no una identidad clara.** La portada publicada aún combina una cabecera genérica, un hero de bloques geométricos, tarjetas con radios y sombras distintos, gradientes de imagen y superficies superpuestas. El merge `8b56576` eliminó parte del exceso, pero no consiguió la jerarquía ni el carácter que prometía su plan. **Propuesta:** definir y aplicar una dirección única, editorial y sobria: trabajo real primero, teal estructural, naranja como señal puntual, mucho más espacio y menos contenedores decorativos.

5. **[lectura · crítica] El índice lateral puede montarse sobre el artículo.** El grid de detalle fija `200px` para el lateral y `760px` para el texto (`src/pages/blog/[...slug].astro:171` y equivalente ES). La tarjeta de TOC necesita 252,18 px por su contenido y `sticky`, por lo que desborda su pista y cruza 4,18 px la columna a 1280 px. **Propuesta:** nuevo layout de lectura con contenedor más ancho, pista lateral real de 264–288 px, columna de texto de 720–760 px, `min-width: 0` y salto a TOC desplegable antes de que no quepan ambas columnas.

6. **[responsive · alta] La cabecera cambia al modo de siete enlaces demasiado pronto.** `Header.astro` muestra la navegación completa desde `md` (768 px) con siete enlaces y tres acciones. A 1024 px ya consume prácticamente todo el ancho; entre 768 y 1023 px no existe un estado intermedio. **Propuesta:** navegación de escritorio solo a partir de un breakpoint que deje respiración; en tablet, navegación condensada y menú accesible, con búsqueda e idioma priorizados.

7. **[familia de componentes · alta] Las tarjetas compartidas no han alcanzado toda la web.** `BlogCard`, `ProjectCard` y `AppCard` usan `Card`, pero `projects`, `about-me`, el detalle de App y varias secciones mantienen su propio lenguaje de bordes, escalados, gradientes y sombras. **Propuesta:** primitivas pequeñas de superficie, metadatos, CTA y media; variantes explícitas en lugar de copiar combinaciones de utilidades.

8. **[jerarquía · alta] La portada no responde aún a una pregunta principal.** El hero ocupa gran parte del primer viewport y el motivo geométrico no presenta una aplicación, un proyecto o una historia real; la siguiente información relevante queda fuera de foco. **Propuesta:** portada de estudio indie con una promesa corta, una pieza real destacada y rutas claras hacia Apps, Blog y Bitácora, sin mockups ni decoración que compita con el contenido.

9. **[localidad · media] El cambio visual EN/ES exige editar pares de páginas.** Las rutas bilingües repiten composición en los detalles de Blog y Apps, y las diferencias solo son idioma/datos. **Propuesta:** conservar las URLs actuales y centralizar las pantallas de composición. Esto reduce regresiones visuales entre idiomas y permite comprobar ambos desde el mismo contrato.

## Orden recomendado

1. Acordar la dirección visual y las referencias de calidad.
2. Definir tokens, tipografía, superficies, espaciado y estados; retirar los sistemas no usados.
3. Rediseñar cabecera y portada.
4. Unificar listados, tarjetas y páginas estáticas.
5. Rehacer detalles de Blog y Apps, incluyendo el layout de lectura y TOC.
6. Consolidar composición bilingüe y validar escritorio, tablet, móvil, claro, oscuro, teclado y movimiento reducido.

