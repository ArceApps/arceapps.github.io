## 2026-01-07 - Accesibilidad de Foco en BlogCard

**Revisión:**
- Se analizó `src/components/BlogCard.astro`.
- Se detectó que el enlace principal (overlay link) y los enlaces de etiquetas carecían de estilos de foco (`focus-visible`).
- Esto dificultaba la navegación por teclado, ya que el usuario no podía ver qué tarjeta o etiqueta estaba seleccionada.

**Propuesta:**
- Añadir estilos `focus-visible` al enlace principal para que toda la tarjeta se resalte al recibir foco.
- Añadir estilos `focus-visible` a los enlaces de etiquetas para mantener la consistencia y usabilidad.

**Realizado:**
- Modificado `src/components/BlogCard.astro`:
  - Se añadieron clases `rounded-xl focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none transition-shadow` al enlace principal (`<a>` overlay).
  - Se añadieron clases `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` a los enlaces de etiquetas (`<a>` tags).

## 2026-01-20 - Accesibilidad de Foco en ProjectCard

**Revisión:**
- Se analizó `src/components/ProjectCard.astro` y `src/components/AppCard.astro`.
- Se detectó que `AppCard.astro` no se utilizaba en el sitio, por lo que se restauró su estado original para evitar ruido.
- Se observó que aunque `ProjectCard.astro` tenía un anillo de foco en el contenedor principal, los elementos internos (imagen, título, enlace de acción) no reaccionaban visualmente al foco del teclado, solo al hover del ratón.

**Propuesta:**
- Mejorar la experiencia de navegación por teclado en `ProjectCard.astro` haciendo que los elementos internos reaccionen al foco igual que lo hacen al hover.

**Realizado:**
- Modificado `src/components/ProjectCard.astro`:
  - Imagen hero: añadido `group-focus-visible:scale-110`.
  - Título: añadido `group-focus-visible:text-primary`.
  - Acción "Ver Detalles": añadido `group-focus-visible:translate-x-1`.
- Verificado mediante script de Playwright y captura de pantalla que muestra el anillo de foco y los estilos aplicados correctamente.

## 2026-01-24 - Micro-interacciones y Feedback en Formulario de Contacto

**Revisión:**
- Se analizó `src/components/ContactForm.astro`.
- Se observó falta de feedback visual inmediato en la interacción de los campos (etiquetas estáticas) y validación (errores invisibles hasta el envío).
- El botón de envío carecía de feedback táctil (estado `active`).

**Propuesta:**
- Implementar el patrón de "Label Highlighting" de Material Design, donde la etiqueta cambia de color al enfocar el input.
- Añadir validación visual contextual: mostrar borde rojo solo si el campo es inválido, tiene contenido y ha perdido el foco (para no molestar mientras se escribe).
- Añadir micro-interacción de escala al presionar el botón de envío.

**Realizado:**
- Modificado `src/components/ContactForm.astro`:
  - Añadida clase `group` a los contenedores de campo y `group-focus-within:text-primary` a las etiquetas `<label>`.
  - Añadida lógica CSS de validación: `invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500`.
  - Añadida clase `active:scale-[0.98]` al botón de envío para mejorar la sensación de "click".
- Verificado visualmente con Playwright: las etiquetas cambian a color `primary` al enfocar, y los emails inválidos se marcan en rojo al salir del campo.

## 2026-01-25 - Accesibilidad y UX en Búsqueda

**Revisión:**
- Se analizó `src/components/Search.astro`.
- Se detectó que no había indicador visual para el atajo de teclado `ESC` para cerrar el modal.
- El mensaje de "No se encontraron resultados" era genérico y poco útil.

**Propuesta:**
- Añadir un indicador visual `ESC` tipo tecla (`kbd`) visible en desktop para mejorar la descubribilidad del atajo.
- Mejorar el estado vacío con un icono más descriptivo (`search_off`) y sugerencias de acción (revisar ortografía).
- Asegurar que el botón de cerrar tenga una etiqueta `aria-label` explícita.

**Realizado:**
- Modificado `src/components/Search.astro`:
  - Añadido elemento `<kbd>ESC</kbd>` visible en pantallas medianas y superiores.
  - Actualizado el HTML inyectado para resultados vacíos con mejor feedback y diseño.
  - Añadido `aria-label="Cerrar búsqueda"` al botón de cierre.

## 2026-01-26 - Accesibilidad de Foco en Hero Buttons

**Revisión:**
- Se analizó `src/components/Hero.astro`.
- Se detectó que los botones principales ("Mis Proyectos" y "Leer Bitácora") carecían de estilos explícitos de foco (`focus-visible`).
- Esto dificultaba la navegación por teclado, ya que no había un indicador visual claro de qué botón estaba seleccionado.

**Propuesta:**
- Añadir estilos `focus-visible` a ambos botones.
- Para el botón primario, replicar la animación de elevación (`translate-y`) que ocurre en hover.
- Asegurar un anillo de foco consistente usando el color primario.

**Realizado:**
- Modificado `src/components/Hero.astro`:
  - Botón "Mis Proyectos": añadido `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:-translate-y-0.5`.
  - Botón "Leer Bitácora": añadido `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30`.
- Verificado mediante script de Playwright: los botones muestran el anillo de foco y el primario se eleva al recibir foco por teclado.

## 2026-01-14 - Accesibilidad de Foco en CTAs del Home

**Revisión:**
- Se analizó `src/pages/index.astro`.
- Se detectó que los botones de CTA (GitHub, Play Store) y enlaces secundarios ("Ver todas las aplicaciones", "Ver todos los artículos") carecían de estilos explícitos de foco (`focus-visible`).
- Esto afectaba la accesibilidad por teclado, especialmente en secciones con fondo de gradiente.

**Propuesta:**
- Añadir anillos de foco (`focus-visible:ring`) y transformaciones para asegurar que el usuario sepa dónde está el foco.
- Usar colores contrastantes (blanco sobre gradiente, primario/secundario sobre fondos claros).

**Realizado:**
- Modificado `src/pages/index.astro`:
  - Botón "Building in Public": añadido `focus-visible:ring-primary`.
  - Botón "Ver todas las aplicaciones": añadido `focus-visible:ring-primary/30`.
  - Enlace "Ver todos los artículos": añadido `focus-visible:ring-secondary` y `rounded`.
  - Botones CTA (GitHub/Play Store): añadido `focus-visible:ring-white/50` y `scale-105`.
- Verificado mediante script de Playwright: se confirmó la visibilidad de los anillos de foco en todos los elementos.

## 2026-01-15 - Accesibilidad de Foco en Navegación del Header

**Revisión:**
- Se analizó `src/components/Header.astro`.
- Se detectó que los enlaces de navegación, el logo y los botones de control (tema, menú móvil) carecían de estilos explícitos de foco (`focus-visible`), dependiendo de los estilos por defecto del navegador.
- Esto generaba una experiencia inconsistente y poco clara para usuarios de teclado.

**Propuesta:**
- Implementar `focus-visible` con un anillo de color primario y bordes redondeados para todos los elementos interactivos del header.
- Ajustar el padding de los enlaces de navegación para que el anillo de foco tenga espacio y se vea estético.

**Realizado:**
- Modificado `src/components/Header.astro`:
  - Logo: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg`.
  - Enlaces de navegación: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1`.
  - Botones de Tema y Menú Móvil: actualizado a `focus-visible:ring-2 focus-visible:ring-primary`.
  - Enlaces del menú móvil: añadido `focus-visible:ring-2 focus-visible:ring-primary`.
- Verificado visualmente con Playwright: los elementos muestran un anillo de foco claro y consistente al navegar con el teclado.

## 2026-01-16 - Accesibilidad de Foco en Footer

**Revisión:**
- Se analizó `src/components/Footer.astro`.
- Se detectó que los enlaces de navegación, legales y de redes sociales, así como el logo de la marca, carecían de estilos explícitos de foco (`focus-visible`).
- Esto generaba una experiencia inconsistente para usuarios de teclado en una zona crítica de navegación.

**Propuesta:**
- Implementar `focus-visible` con un anillo de color primario y bordes redondeados para todos los elementos interactivos del footer.
- Ajustar clases para asegurar que el anillo sea visible y estético.

**Realizado:**
- Modificado `src/components/Footer.astro`:
  - Enlace de Marca: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg`.
  - Enlaces de Navegación y Legales: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded`.
  - Iconos Sociales: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded`.
- Verificado mediante script de Playwright: los elementos muestran un anillo de foco claro y consistente.

## 2026-01-17 - Accesibilidad de Foco en Página 404

**Revisión:**
- Se analizó `src/pages/404.astro`.
- Botones de acción y enlaces de ayuda sin estilos de foco (`focus-visible`).
- Iconos decorativos sin atributos `aria-hidden`, potencialmente generando ruido en lectores de pantalla.

**Propuesta:**
- Añadir anillos de foco consistentes con el resto del sitio para mejorar accesibilidad por teclado.
- Añadir `aria-hidden="true"` a los iconos decorativos.

**Realizado:**
- Modificado `src/pages/404.astro`:
  - Añadido `focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none` a los botones primario y secundario.
  - Añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded` a los enlaces de ayuda.
  - Añadido `aria-hidden="true"` a los iconos de Android y advertencia.
- Verificado mediante script de Playwright: los elementos muestran el anillo de foco y los iconos están ocultos a tecnologías de asistencia.

## 2026-01-18 - Accesibilidad de Foco en Navegación de Artículo (Blog Post)

**Revisión:**
- Se analizó `src/pages/blog/[...slug].astro`.
- Se detectó que los enlaces "Volver al Blog" (sidebar y móvil), enlaces del índice de contenidos (TOC), tags y el botón de copiar código carecían de estilos explícitos de foco (`focus-visible`).
- Esto dificultaba la navegación por teclado en la lectura de artículos.

**Propuesta:**
- Añadir estilos `focus-visible` (anillo primario, outline none) a todos los elementos interactivos mencionados.
- Asegurar consistencia visual con el resto del sitio.

**Realizado:**
- Modificado `src/pages/blog/[...slug].astro`:
  - Enlaces "Volver al Blog": añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded`.
  - Enlaces TOC (Sidebar/Móvil): añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded`.
  - Summary TOC (Móvil): añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xl`.
  - Tags: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
  - Botón Copiar Código (Script): añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
- Verificado mediante script de Playwright y capturas de pantalla.

## 2026-01-19 - Mejora de Accesibilidad en Componente de Búsqueda

**Revisión:**
- Se analizó `src/components/Search.astro` y `src/scripts/search.ts`.
- Se detectó que el botón "Cerrar" (`#close-search`) y los resultados generados dinámicamente carecían de estilos `focus-visible`, haciendo difícil la navegación por teclado.
- El input de búsqueda tenía `focus:outline-none` y `focus:ring-0` sin un indicador de foco alternativo claro en su contenedor.
- El icono decorativo de búsqueda carecía de `aria-hidden="true"`.

**Propuesta:**
- Añadir estilos `focus-visible` al botón de cierre y a los enlaces de resultados generados por JS.
- Implementar estilos `focus-within` en el contenedor del input para simular un anillo de foco cuando el input está activo.
- Añadir atributo `aria-hidden` al icono decorativo.

**Realizado:**
- Modificado `src/components/Search.astro`:
  - Contenedor del input: añadido `transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20`.
  - Icono de búsqueda: añadido `aria-hidden="true"`.
  - Botón de cierre: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded transition-colors`.
- Modificado `src/scripts/search.ts`:
  - Template de resultados: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` a los enlaces `<a>`.
- Verificado mediante script de Playwright: confirmada la visualización de los anillos de foco en input, botón de cierre y resultados.

## 2026-01-20 - Mejora UX y Fix Memory Leaks en Menú Móvil

**Revisión:**
- Se analizó `src/components/Header.astro`.
- Se detectó un bug crítico donde los event listeners se duplicaban en cada navegación debido a una lógica de limpieza incorrecta en `initHeader`.
- El menú móvil carecía de comportamientos estándar de accesibilidad: no se cerraba al presionar Escape ni al hacer clic fuera de él.

**Propuesta:**
- Implementar una gestión robusta del ciclo de vida de los listeners usando `astro:page-load` y `astro:before-swap` con closures para limpieza correcta.
- Añadir funcionalidad "Close on Escape" y "Close on Click Outside" para el menú móvil.
- Asegurar que el menú se cierre al navegar (clic en enlaces).

**Realizado:**
- Modificado `src/components/Header.astro`:
  - Reescrita la lógica del script para usar una variable `cleanup` global al módulo.
  - Implementado `closeMenu` que limpia listeners específicos del menú.
  - Añadido soporte para tecla Escape y clic fuera del menú.
  - Añadido cierre automático al hacer clic en enlaces de navegación.
- Verificado mediante script de Playwright: el menú se comporta correctamente y no deja listeners huérfanos.

## 2026-01-21 - Accesibilidad de Foco en Políticas de Privacidad

**Revisión:**
- Se analizaron `src/pages/privacy-policy.astro` y `src/pages/politica-privacidad.astro`.
- Se detectó que el selector de idioma (enlace `<a>`) carecía de estilos explícitos de foco (`focus-visible`).
- Los enlaces dentro del contenido legal (prose) dependían de los estilos por defecto del navegador, lo cual podía ser inconsistente con el diseño del sitio.

**Propuesta:**
- Añadir estilos `focus-visible` al selector de idioma para asegurar una navegación por teclado clara.
- Utilizar el modificador `prose-a` de Tailwind Typography para aplicar estilos de foco a todos los enlaces dentro del contenido legal.

**Realizado:**
- Modificado `src/pages/privacy-policy.astro` y `src/pages/politica-privacidad.astro`:
  - Selector de idioma: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
  - Contenedor Prose: añadido `prose-a:focus-visible:ring-2 prose-a:focus-visible:ring-primary prose-a:focus-visible:outline-none prose-a:rounded-sm`.
- Verificado mediante script de Playwright y capturas de pantalla: los enlaces muestran claramente el foco.

## 2026-01-22 - Accesibilidad de Foco en Detalle de App

**Revisión:**
- Se analizó `src/pages/apps/[...slug].astro`.
- Se detectó que los botones de acción (Google Play, Demo, Código) y el enlace de retorno carecían de estilos explícitos de foco (`focus-visible`).
- La galería de capturas de pantalla era un contenedor desplazable pero no accesible por teclado (falta de `tabindex` y foco), lo que impedía el desplazamiento horizontal para usuarios de teclado.

**Propuesta:**
- Añadir estilos `focus-visible` a todos los elementos interactivos.
- Hacer que la galería de capturas sea focusable (`tabindex="0"`) y tenga una etiqueta accesible, permitiendo el desplazamiento con flechas.

**Realizado:**
- Modificado `src/pages/apps/[...slug].astro`:
  - Google Play/Demo: añadido `focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none`.
  - Código/Volver: añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
  - Galería: añadido `tabindex="0"`, `aria-label` y estilos de foco.
- Verificado mediante script de Playwright: confirmada la navegabilidad y visibilidad del foco en todos los elementos.

## 2026-01-23 - Accesibilidad de Foco en Bitácora (Devlog)

**Revisión:**
- Se analizó `src/pages/devlog/index.astro` y `src/pages/devlog/[...slug].astro`.
- Se detectó que la tarjeta de entrada en el índice tenía efectos de hover pero no reaccionaba al foco de teclado en sus enlaces internos.
- Los enlaces de título, "Leer entrada" y "Volver a la bitácora" carecían de estilos `focus-visible`.
- Iconos decorativos en la línea de tiempo y cabeceras no tenían `aria-hidden="true"`.

**Propuesta:**
- Implementar estilos `focus-visible` en todos los enlaces de navegación de la sección Bitácora.
- Añadir comportamiento `focus-within` al contenedor de la tarjeta para replicar los efectos de hover (elevación y sombra) cuando el usuario navega por teclado.
- Ocultar iconos decorativos a los lectores de pantalla.

**Realizado:**
- Modificado `src/pages/devlog/index.astro`:
  - Contenedor de tarjeta: añadido `focus-within:shadow-xl focus-within:-translate-y-1`.
  - Título y enlace "Leer entrada": añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded`.
  - Icono de timeline y flecha: añadido `aria-hidden="true"`.
- Modificado `src/pages/devlog/[...slug].astro`:
  - Enlace "Volver": añadido `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1`.
  - Contenedor Prose: añadido `prose-a:focus-visible:ring-2 prose-a:focus-visible:ring-primary prose-a:focus-visible:outline-none prose-a:rounded-sm`.
  - Iconos de cabecera: añadido `aria-hidden="true"`.
- Verificado mediante script de Playwright: los anillos de foco y efectos de elevación funcionan correctamente.
