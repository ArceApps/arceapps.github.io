## 2026-01-20 - [Dimensiones Explícitas y Optimización LCP]
**Revisado:** `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ProjectCard.astro`, `src/pages/apps/[...slug].astro`.
**Propuesta:** Se identificó que las imágenes críticas (Logotipo en cabecera/pie y Hero Images en tarjetas y detalle de apps) carecían de atributos `width` y `height` explícitos. Aunque CSS controla su tamaño visual, la ausencia de atributos HTML obliga al navegador a recalcular el layout (Reflow) una vez que la imagen se descarga, causando CLS (Cumulative Layout Shift). Además, la imagen principal de la página de detalle de App (LCP) no tenía prioridad de carga.
**Cambios Realizados:**
1.  **Header y Footer:** Se añadieron `width="40" height="40"` (Header) y `width="32" height="32"` (Footer) a los logos.
2.  **ProjectCard:** Se añadieron `width="400" height="224"` a la imagen de portada.
3.  **App Detail:** Se añadieron `width="400" height="500"` y `fetchpriority="high"` a la imagen Hero.
**Impacto:**
- **CLS:** Eliminación de movimientos de layout en la carga inicial de cabecera y tarjetas.
- **LCP:** Mejora en el tiempo de renderizado de la imagen principal de las apps gracias a `fetchpriority="high"`.
**Aprendizaje:** Incluso con clases de Tailwind como `w-10 h-10`, el navegador necesita los atributos HTML para reservar el espacio antes de que se cargue el CSS o la imagen.
