# Auditoría de diseño y experiencia — ArceApps

> Generada el 2026-07-23 mediante la auditoría de diseño, arquitectura de interfaz y revisión del sitio publicado.

## Alcance y evidencia

- Revisión del código Astro/TypeScript en `src/components`, `src/layouts`, `src/pages` y `src/styles`.
- Revisión del HTML visible de la portada publicada en [arceapps.com](https://arceapps.com/).
- Revisión de las plantillas de portada, Apps, Blog, Bitácora, detalle de app, detalle de artículo y About Me en inglés y español.
- `pnpm build`: PASS; se generaron 1.043 páginas estáticas y 301 imágenes OG.
- `pnpm test`: FAIL; 2 archivos fallan: las pruebas del header y la validación de enlaces internos, con 274 enlaces rotos detectados.
- La revisión visual interactiva de `localhost` quedó limitada por el aislamiento de red del navegador integrado; se compensó con HTML publicado, CSS compilado y lectura de las plantillas.

## Resumen

La web tiene una base sólida: identidad cromática reconocible, componentes reutilizables, buen uso de Astro estático, soporte bilingüe, modo oscuro y una portada con una propuesta clara. El principal problema no es falta de diseño, sino exceso de direcciones visuales simultáneas: Material Design, glassmorphism, Bento, gradientes, teléfonos simulados, grandes sombras, blur y animaciones aparecen juntos sin una jerarquía única.

La recomendación es evolucionar hacia una dirección de “estudio indie de software”: más editorial, sobria y memorable, con el teal como color estructural, naranja como acento puntual, más protagonismo del trabajo real y menos decoración genérica.

## Hallazgos priorizados

### Diseño y experiencia

1. **[Alta] La identidad visual mezcla demasiados lenguajes.** `src/styles/global.css` define tokens Material, `.material-card` y `.spatial-card`, mientras las páginas añaden gradientes, glassmorphism, bordes y sombras diferentes. El resultado puede verse moderno por separado, pero menos reconocible como sistema. **Recomendación:** definir una única dirección visual, tres niveles de superficie, una escala de radios y una escala de elevación; reservar blur y gradientes para hero y CTA.

2. **[Alta] La portada compite consigo misma.** `src/components/Hero.astro` contiene un teléfono ficticio muy trabajado y `src/components/pages/HomePage.astro` añade un Bento dominante para la bitácora y tres tarjetas de apps. Hay mucha superficie visual antes de que el visitante entienda qué proyecto merece su atención. **Recomendación:** hacer que el hero presente al creador y una pieza real; después mostrar “En construcción”, una app destacada y tres artículos recientes con una jerarquía más editorial.

3. **[Alta] Las tarjetas no forman una familia suficientemente consistente.** `BlogCard`, `ProjectCard`, `AppCard` y el Bento de la portada usan radios, padding, sombras, hover, fechas y llamadas a la acción distintas. **Recomendación:** crear una gramática de tarjetas con variantes `article`, `app` y `feature`, compartiendo estructura, estados de foco, altura, metadatos y CTA.

4. **[Media] El movimiento está sobrerrepresentado.** La búsqueda en `src` encuentra 168 usos de animaciones, transiciones, blur, escalados o rotaciones visuales. Además, `global.css` cambia el peso de todos los encabezados al pasar el ratón (`h1:hover` a `h6:hover`), lo que puede provocar cambios de ancho y ruido visual. **Recomendación:** eliminar el hover tipográfico global, reducir los escalados de tarjetas y mantener animación solo en entrada, foco, navegación y una o dos piezas de marca.

5. **[Media] Los artículos largos se perciben como tarjetas grandes.** `src/styles/global.css` da mucho peso a la caja `.prose`, a sus sombras y a párrafos de 18px con interlineado 2; las páginas de detalle vuelven a envolver el contenido en superficies redondeadas. **Recomendación:** usar una columna de lectura editorial más limpia, con ancho controlado, metadatos visibles y medios que puedan crecer hasta unos 720–760px sin quedar limitados globalmente a 500px.

6. **[Media] El detalle de app necesita una jerarquía más orientada a conversión.** `src/pages/apps/[...slug].astro` mezcla tags, icono, rating, versión, fecha, descripción, tres tipos de CTA, imagen inclinada y galería horizontal. **Recomendación:** priorizar título, propuesta de valor, Google Play y prueba visual; mover versión, fecha y repositorio a metadatos secundarios.

7. **[Media] La navegación móvil funciona, pero no tiene una capa visual propia.** El menú es un bloque absoluto con sombra, mientras la cabecera mantiene búsqueda, idioma, tema y menú al mismo nivel. **Recomendación:** convertir el menú móvil en panel claramente delimitado, añadir el estado activo con una señal más fuerte y revisar el orden de acciones para que el idioma y el tema no compitan con la navegación principal.

8. **[Media] La internacionalización visual está incompleta.** Hay textos visibles y etiquetas hardcodeadas en plantillas inglesas y españolas, por ejemplo `Gallery`, `Live Demo`, `Code`, `Updated`, `No Image Available`, `Filter by tags`, `Contact` y varias etiquetas ARIA. **Recomendación:** llevar todos los strings de UI a `src/i18n/ui.ts` y usar la misma composición visual en ambos idiomas.

### Arquitectura y deuda visual

9. **[Alta] Hay tokens visuales usados que no existen.** La portada y el botón de volver arriba usan `bg-primary-dark`, `hover:bg-primary-dark` y `elevation-4`, pero `src/styles/global.css` no declara esos tokens. El CSS compilado tampoco contiene `primary-dark` ni `elevation-4`. **Recomendación:** sustituirlos por tokens declarados o añadir una escala semántica completa antes de pulir los componentes.

10. **[Media] Hay duplicación entre inglés y español.** Las páginas de listado y detalle se mantienen como pares independientes, lo que permite que las clases, textos y estados visuales se desincronicen. Las pruebas ya detectan una gran cantidad de enlaces internos inconsistentes. **Recomendación:** centralizar la composición en componentes de página con `lang`, dejando en las rutas solo la carga de datos y los parámetros localizados.

11. **[Baja] `.material-card` está definido pero no se usa en plantillas Astro.** La interfaz actual usa `.spatial-card` y clases utilitarias directamente. **Recomendación:** decidir una sola abstracción: reutilizar `.material-card` como base sobria o eliminarla durante el rediseño para no mantener dos sistemas de tarjetas.

12. **[Media] El estado técnico puede contaminar cualquier rediseño.** `pnpm build` pasa, pero muestra que `CONTACT_FORM_KEY` no está definido; `pnpm test` falla en el header y en 274 validaciones de enlaces. **Recomendación:** tratar accesibilidad, navegación, enlaces e i18n como una línea de calidad paralela al rediseño, sin ocultar esos fallos bajo cambios visuales.

## Dirección propuesta

### “Indie software studio”

- Fondo claro cálido y fondo oscuro profundo, sin convertir cada sección en una superficie distinta.
- Teal para navegación, enlaces, estados y acciones principales.
- Naranja solo para acentos, etiquetas de estado y pequeños detalles de marca.
- Tipografía editorial para títulos de artículos y sans variable para interfaz.
- Hero con una historia y una pieza real, no un dashboard ficticio.
- Cards con menos decoración, más contraste de contenido y estados hover discretos.
- Sistema de espaciado y radios compartido entre portada, listados y detalles.
- Animación progresiva, opcional y respetuosa con `prefers-reduced-motion`.

## Orden recomendado para el futuro plan

1. Corregir tokens rotos y acordar la dirección visual.
2. Crear tokens/clases base y una familia de tarjetas.
3. Rediseñar cabecera, hero y portada.
4. Homogeneizar listados de Apps, Blog y Bitácora.
5. Rediseñar detalles de app y artículo.
6. Completar i18n visual, accesibilidad y estados responsive.
7. Separar y resolver la deuda de enlaces, header tests y configuración del formulario.

## Selección pendiente

Este informe no inicia implementación. La siguiente decisión es seleccionar qué hallazgos entran en el plan, por ejemplo: `1-10`, solo `1-9`, o una selección más pequeña.
