# ArceApps — Design System

**Estado:** borrador de diseño para aprobar antes de la implementación  
**Fecha:** 2026-07-29  
**Decisión confirmada:** se conserva la paleta teal y naranja de ArceApps.

## 1. Intención

ArceApps será un estudio indie de software: técnico, cercano y sobrio. El diseño debe dar protagonismo al trabajo real —apps, artículos y bitácora— sin convertir cada bloque en una tarjeta ni usar efectos decorativos para aparentar modernidad.

La personalidad sale de la tipografía, el ritmo, el contraste y la calidad de los detalles; no de añadir gradientes, blur o animaciones por defecto.

## 2. Paleta y roles

Los valores actuales se conservan. Lo que cambia es su disciplina de uso.

| Rol | Claro | Oscuro | Uso permitido |
| --- | --- | --- | --- |
| Marca / acción principal | `#018786` | `#4FD1C5` | enlaces, foco, CTA principal, navegación activa |
| Marca intensa | `#006B6A` | `#4FD1C5` | hover y estados activos de la acción principal |
| Acento | `#FF9800` | `#FF9800` | etiqueta de estado, detalle de marca y CTA secundario |
| Fondo de página | `#FFFFFF` | `#121212` | fondo dominante |
| Superficie sutil | `#F4F5F7` | `#1C1C1E` | secciones alternas, metadatos y controles secundarios |
| Superficie elevada | `#FFFFFF` | `#242426` | cards puntuales, menú y paneles |
| Texto principal | `#1C1B1F` | `#F5F5F5` | títulos y lectura |
| Texto secundario | `#49454F` | `#E0E0E0` | descripciones, fechas y metadatos |
| Borde | `#E2E3E5` | `#3A3A3C` | separación discreta; nunca como decoración redundante |

Reglas:

- El teal guía; no llena cada superficie.
- El naranja solo señala algo especial. No se usa como segundo color de texto normal.
- Cada sección tiene un fondo dominante y, como máximo, una superficie elevada.
- Gradientes solo si aportan información visual a un asset editorial; no en fondos, cards ni navegación.

## 3. Tipografía

No se añaden fuentes: ambas ya están instaladas.

| Contexto | Fuente | Peso y uso |
| --- | --- | --- |
| Interfaz, navegación y títulos de página | Inter Variable | 500–700; compacto, legible y directo |
| Título de artículo | Inter Variable | 700; no más de dos líneas de jerarquía visual |
| Lectura de artículos y citas largas | Merriweather | 400–700; solo en el cuerpo editorial para aumentar confort de lectura |
| Metadatos, tags y etiquetas | Inter Variable | 600; tamaño pequeño y espaciado moderado |
| Código | fuente monoespaciada del sistema | bloques y fragmentos técnicos |

Escala orientativa:

- `display`: 56–72 px escritorio, 40–52 px móvil.
- `h1`: 40–56 px.
- `h2`: 28–36 px.
- `h3`: 22–26 px.
- cuerpo: 18 px y línea de 1,7 para artículos; 16 px para interfaz.
- metadatos: 14 px.

## 4. Espacio, radios y elevación

Se usa una escala de 4, 8, 12, 16, 24, 32, 48, 64 y 96 px. Las separaciones grandes deben explicar la jerarquía de una página, no rellenar huecos.

| Elemento | Radio | Elevación |
| --- | --- | --- |
| Control, tag y chip | 8–12 px | plano |
| Card normal | 16 px | borde o sombra sutil, nunca ambos con protagonismo |
| Panel destacado | 20–24 px | elevada, una única sombra suave |
| Menú flotante / diálogo | 16 px | flotante |

No se usarán radios `rounded-*` arbitrarios ni sombras grandes como estilo base.

## 5. Componentes

### Navegación

- Tres estados: móvil, tablet condensada y escritorio completo.
- En tablet no se muestran siete enlaces y tres acciones a la vez.
- La acción activa usa teal y una señal discreta; el resto no compite con ella.

### Cards

Todas comparten superficie, borde, foco, espaciado y transición cromática. Solo varía el contenido:

- `article`: imagen, fecha o tema, título, resumen y enlace.
- `app`: icono o imagen real, propuesta de valor y CTA.
- `feature`: una única pieza destacada, sin duplicar varios botones o adornos.

El hover cambia contraste o borde; no escala la card completa.

### Portada

1. Declaración breve de lo que se construye.
2. Una pieza real destacada.
3. Apps, artículos y bitácora organizados como rutas de exploración.

El panel geométrico actual puede desaparecer o convertirse en un soporte de contenido real. No será el protagonista por sí solo.

### Artículos

- Contenedor editorial: hasta 1.200 px.
- Texto: 720–760 px.
- Índice lateral: 264–288 px, con `min-width: 0` y límite de altura; pasa a desplegable antes de invadir la lectura.
- Hero: puede ser más ancho que el texto.
- Cuerpo: limpio, sin otra card alrededor; las tablas y el código se desplazan horizontalmente dentro de su propio bloque.

## 6. Responsive y accesibilidad

| Rango | Composición |
| --- | --- |
| Móvil, hasta 767 px | una columna, menú desplegable, TOC plegable |
| Tablet, 768–1199 px | navegación condensada, grids de dos columnas cuando el contenido lo permita, TOC plegable si falta espacio |
| Escritorio, desde 1200 px | navegación completa, lectura con lateral y columna editorial |

- Todo control tiene foco visible teal y nombre accesible.
- El contenido no depende de hover.
- Las animaciones se limitan a color, foco y entrada breve; `prefers-reduced-motion` las desactiva.
- Claro y oscuro conservan el mismo contraste y jerarquía, no solo colores invertidos.

## 7. Antipatrones

- Glassmorphism, glow, blur, bento y gradientes como lenguaje por defecto.
- Dos CTAs principales en el mismo bloque.
- Cards dentro de cards para texto de lectura.
- Escalados, giros o pulsos decorativos.
- Tener una variante visual diferente para cada página sin una razón semántica.

## 8. Criterios de aceptación del rediseño

- La web se reconoce como una misma pieza en portada, listados, Apps, Blog, Bitácora y páginas estáticas.
- El teal y el naranja siguen siendo inequívocamente ArceApps, sin saturar la pantalla.
- Ninguna combinación de ancho reproduce solapamiento entre TOC y contenido.
- Los artículos largos son cómodos a 360, 768, 1024, 1280 y 1440 px.
- EN y ES comparten estructura visual y todos los textos de UI se localizan.

