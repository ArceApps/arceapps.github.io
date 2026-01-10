---
title: "2025 W48: Los Cimientos Invisibles"
description: "Preparando el terreno para la paridad de características. Trabajo de backend, migraciones de Room y por qué Minesweeper es diferente a todo lo demás."
pubDate: "2025-11-30"
tags: ["devlog", "backend", "room", "architecture", "minesweeper"]
heroImage: "/images/devlog-w48-foundations.svg"
---

Llegamos al final de Noviembre. La Semana 48 (del 24 al 30 de Noviembre) ha sido, visualmente, la menos impresionante del mes. Si descargas la versión de esta semana y la comparas con la anterior, apenas notarás diferencias en la pantalla.

Pero si pudieras ver los esquemas de la base de datos con rayos X, verías una obra de construcción masiva.

Nuestra meta para Diciembre es ambiciosa: **Paridad Total**. Queremos que todos los juegos tengan Estadísticas, Logros Historial y Tutoriales. Actualmente, dos de nuestros juegos más populares, *Minesweeper* (Buscaminas) y *Galaxies*, son ciudadanos de segunda clase. No recuerdan tus mejores tiempos. No celebran tus rachas. Solo te dejan jugar y olvidar.

Esta semana nos pusimos el casco de obra y bajamos al sótano del código: la capa de Datos (`Data Layer`).

## El Reto de Minesweeper

Implementar estadísticas para *Minesweeper* suena trivial. "Guarda el tiempo y ya está", ¿verdad?
No tan rápido.

La mayoría de nuestros puzzles (*Sudoku*, *Kakuro*) tienen una dificultad fija basada en la lógica. Pero *Minesweeper* es un juego de **probabilidades y velocidad mecánica**.
Un tiempo de 30 segundos en un tablero "Fácil" no es comparable con 30 segundos en "Experto". Y un tablero "Custom" (personalizado) es un mundo aparte.

Tuvimos que diseñar una entidad de estadísticas (`MinesweeperStatsEntity`) mucho más compleja que la de sus hermanos.
*   Necesitamos trackear `bestTime` por *cada* nivel de dificultad.
*   Necesitamos métricas de eficiencia: `3BV` (Bechtel's Board Benchmark), una medida estándar en la comunidad competitiva de Buscaminas para calcular la dificultad mínima de clics necesarios.
*   Necesitamos `winStreak` (racha de victorias), pero con una condición cruel: reiniciar o abandonar cuenta como derrota.

Diseñamos una tabla relacional en Room que pudiera escalar. No queríamos una columna `bestTimeEasy`, `bestTimeMedium`... porque es rígido. Optamos por una estructura normalizada donde las estadísticas están ligadas a `difficultyID`.

## Galaxies y la Simetría de los Datos

*Galaxies* presentó otro problema. No tiene dificultades estándar ("Fácil", "Difícil"). Se basa en **Tamaños** (10x10, 15x15).
¿Cómo comparas una partida?
Decidimos que para Galaxies, la métrica reina no es solo el tiempo, sino la **Simetría**.
Preparamos la base de datos para almacenar no solo `timeTaken`, sino `actionsTaken`. Queremos poder decirle al usuario: "Resolviste este 10x10 en 40 movimientos, el mínimo teórico era 36".

## La Pesadilla de las Migraciones

Tocar la base de datos de una app en producción es como desactivar una bomba. Un paso en falso y borras el historial de miles de usuarios.
Android usa **Room** como ORM sobre SQLite. Cuando cambias la estructura de una tabla, necesitas escribir una `Migration`.

Esta semana escribimos las migraciones `MIGRATION_1_2` para Minesweeper y Galaxies.
1.  Crear tabla temporal `new_stats`.
2.  Copiar datos existentes (si hubiera, que no los hay, pero el script debe ser robusto).
3.  Renombrar tablas.
4.  Crear índices para búsquedas rápidas.

Probamos esta migración repetidamente. Creamos bases de datos falsas con estructuras antiguas, aplicamos la migración y verificamos que la app no crasheara al inicio. Es un trabajo tedioso, de "fontanería", pero dormir tranquilos sabiendo que no vamos a provocar un `SQLiteException` en el teléfono de nadie vale la pena.

## Preparando los UseCases

Con las tablas listas, subimos un nivel a la capa de Dominio. Escribimos los **UseCases** (Casos de Uso) que encapsulan la lógica de negocio.

*   `UpdateMinesweeperStatsUseCase`: Recibe el resultado de una partida. Decide si es un nuevo récord. Calcula si la racha continúa.
*   `GetGalaxiesHistoryUseCase`: Prepara los datos para los gráficos que implementaremos la semana que viene.

Aquí es donde definimos las "Reglas de la Casa". Por ejemplo: ¿Una victoria en menos de 1 segundo cuenta? (Probablemente es un bug o un hack). Decidimos poner umbrales mínimos de validación en los UseCases para proteger la integridad de los leaderboards globales futuros.

## Conclusión de Noviembre

Cerramos el libro de Noviembre exhaustos pero satisfechos.
*   Hemos lanzado un juego nuevo (**Dominosa**).
*   Hemos unificado la interfaz de usuario.
*   Hemos arreglado la geometría de **Hashi**.
*   Hemos rediseñado la Home.
*   Y ahora, hemos vertido el hormigón para los rascacielos de estadísticas que construiremos en Diciembre.

El código base es un 40% más grande que hace un mes, pero se siente más ligero. Más ordenado.
Diciembre será el mes del "Brillo". Gráficos, medallas, celebraciones. Pero nada de eso sería posible sin el trabajo sucio, oscuro y silencioso de esta semana 48.

Nos vemos en Diciembre.
