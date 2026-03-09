---
title: "2025 W51: Rompiendo la Barrera del Idioma"
description: "Un sprint masivo de internacionalización para eliminar textos hardcodeados y preparar PuzzleSuite para el mundo."
pubDate: 2025-12-21
tags: ["devlog", "i18n", "refactoring", "quality"]
heroImage: "/images/devlog-w51-i18n.svg"
---

A veces, para ir rápido, dejas cosas por el camino. En el desarrollo de *PuzzleSuite*, una de esas cosas fue el idioma. "Ya lo arreglaremos luego", decíamos mientras escribíamos `Text("Estadísticas")` directamente en el código de la UI.

Bueno, esta semana, "luego" finalmente llegó.

## 🌍 La Gran Migración de Strings

La semana 51 (del 15 al 21 de Diciembre) se convirtió oficialmente en la semana de la Internacionalización. Nos dimos cuenta de que nuestras pantallas de estadísticas e historial eran un mosaico de textos en español "hardcodeados" en el código, lo que hacía imposible ofrecer una experiencia de calidad en cualquier otro idioma.

Mi equipo de agentes de IA y yo nos embarcamos en una misión de búsqueda y destrucción de strings hardcodeados.

### El Alcance del Trabajo

No fue solo un juego. Fue una operación sistemática que abarcó casi todo el catálogo:

*   **Minesweeper**: Limpiamos más de 15 textos en su compleja pantalla de estadísticas.
*   **Kakuro, Hitori, Shikaku, Fillomino**: Todas sus pantallas de estadísticas e historial fueron refactorizadas.

En total, movimos cientos de líneas de texto desde archivos Kotlin `(.kt)` a nuestros archivos de recursos `strings.xml`.

## 🛠️ ¿Por qué importa esto?

Puede parecer un trabajo aburrido de "copiar y pegar", pero el impacto en la calidad del código es enorme:

1.  **Cero Textos Mágicos**: Ahora, `R.string.hitori_stats_best_time` es la única fuente de la verdad. Si queremos cambiar "Mejor tiempo" a "Récord", lo hacemos en un solo lugar.
2.  **Soporte Multi-idioma Real**: Ahora la app cambia mágicamente de inglés a español (y en el futuro a francés, alemán, japonés...) respetando la configuración del teléfono del usuario.
3.  ** código más limpio**: Separar la lógica de la presentación es el ABC de la ingeniería de software, y nuestras pantallas de UI ahora son puras, sin cadenas de texto ensuciando la jerarquía de componentes.

## 🐛 Cazando Duplicados

Durante este proceso, encontramos algo vergonzoso pero instructivo: teníamos definiciones duplicadas (¡y triplicadas!) para cosas tan simples como los niveles de dificultad (`Easy`, `Medium`, `Hard`).

Cada juego había definido sus propias versiones: `dominosa_difficulty_easy`, `fillomino_difficulty_easy`, etc. Aprovechamos la limpieza para unificar todo bajo un único conjunto de strings genéricos: `difficulty_easy`.

Menos código, menos redundancia, menos probabilidad de errores.

## 🚀 Hacia el Cierre del Año

Con la barrera del idioma derribada, nos sentimos mucho más profesionales. *PuzzleSuite* ya no parece un proyecto de fin de semana, sino una aplicación robusta lista para una audiencia global.

La próxima semana (la penúltima del año), nos centraremos en estandarizar la arquitectura de estados, porque si la UI ahora habla bien, queremos que la lógica interna "piense" con la misma claridad.

¡Nos vemos en la semana 52!
