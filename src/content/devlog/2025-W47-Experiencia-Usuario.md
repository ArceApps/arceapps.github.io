---
title: "2025 W47: La Mentira Piadosa y el Rediseño"
description: "Cómo rediseñamos la entrada principal de la aplicación y descubrimos que habíamos estado mintiendo a nuestros usuarios sobre sus estadísticas."
pubDate: "2025-11-23"
tags: ["devlog", "frontend", "stats", "bugfix", "design-system"]
heroImage: "/images/blog-placeholder-5.jpg"
---

Dicen que no hay segunda oportunidad para una primera impresión. En una aplicación móvil, esa primera impresión ocurre en los primeros 3 segundos tras el lanzamiento.

Durante meses, la `HomeScreen` de *PuzzleSuite* ha sido... utilitaria. Una lista vertical de botones. "Minesweeper", "Sudoku", "Hashi". Funcional, sí. Inspiradora, no. Parecía más un menú de depuración que un portal a un mundo de lógica y entretenimiento.

La Semana 47 (del 17 al 23 de Noviembre) comenzó con una misión estética: darle a *PuzzleSuite* la cara que se merece. Pero terminó con una misión ética: corregir un error que estaba corrompiendo silenciosamente los datos de nuestros jugadores.

## El Arte de la Bienvenida

El rediseño de la pantalla de inicio no fue solo "poner colores bonitos". Fue un ejercicio de arquitectura de información.
Con 9 juegos (y subiendo), una lista simple ya no escala. El usuario sufre de "parálisis de elección".

Reimaginamos la Home basándonos en el concepto de "Tarjetas de Juego" (`GameCard`).
Cada tarjeta no es solo un botón. Es un tablero de control en miniatura:
*   **Icono Dinámico**: Muestra una representación estilizada del puzzle.
*   **Estado Actual**: "¿Tienes una partida a medias?". Mostramos el tiempo transcurrido y el porcentaje completado directamente en la tarjeta. Un botón "Continuar" brilla invitándote a volver.
*   **Stats Rápidas**: Tus victorias totales y tu mejor racha, visibles de un vistazo. Gamificación pasiva.

Técnicamente, esto implicó cambiar cómo consultamos la base de datos. Antes, la Home no pedía datos. Ahora, necesita consultar el estado de 9 tablas diferentes (`MinesweeperDao`, `HashiDao`, etc.) en tiempo real sin bloquear la UI.
Implementamos un `HomeViewModel` que usa `Kotlin Flows` para combinar (`combine`) todos estos flujos de datos en un solo objeto `HomeUiState`. La pantalla reacciona instantáneamente: si terminas un puzzle y vuelves atrás, la tarjeta ya está actualizada. Se siente vivo.

También renovamos el **Onboarding**. Antes, al abrir la app por primera vez, te soltábamos en el menú sin mapa ni brújula. Ahora, una secuencia de diapositivas limpias te explica qué es la app, cómo funcionan las dificultades y te promete que no recopilamos tus datos privados. Es un apretón de manos digital antes de empezar a jugar.

## El Bug de la "Victoria Vacía"

Mientras probábamos la nueva Home y sus relucientes contadores de estadísticas, notamos algo extraño.

Yo estaba probando el juego *Hitori*. Me atasqué en un nivel Experto y, por pura frustración (y propósitos de testing, claro), pulsé el botón de debug **"Resolver"**. El puzzle se completó ante mis ojos. Salió el diálogo de victoria. Volví al menú.

El contador de "Victorias" seguía igual.

Pensé que era un error de refresco de la UI. Cerré la app. La abrí. Nada.
Me dio un escalofrío. ¿Y si las estadísticas no se estaban guardando?

Investigué el código de `HitoriGameViewModel`. Encontré la función `solve()`:

```kotlin
fun solve() {
    val solvedPuzzle = logic.solve(currentPuzzle)
    _uiState.value = _uiState.value.copy(puzzle = solvedPuzzle, isCompleted = true)
    // Fin de la función.
}
```

¿Lo ven? Faltaba algo. Faltaba *todo*.
La función actualizaba la UI visualmente para mostrar el puzzle resuelto, pero **nunca llamaba a la base de datos**. No llamaba a `repository.updateStats()`. No calculaba rachas. No desbloqueaba logros.

Para el sistema, esa partida nunca ocurrió. Era una victoria fantasma.

### La Escala del Desastre

Hice una auditoría rápida. ¿Solo Hitori?
No. **Shikaku**. **KenKen**. **Kakuro**. **Hashi**. **Fillomino**. **Minesweeper**.
7 de nuestros 9 juegos tenían el mismo defecto en su función de autocompletado/resolver.

Tuvimos que parchear 7 ViewModels de emergencia. Creamos un patrón unificado:
1.  Resolver el puzzle en memoria.
2.  Guardar el estado del puzzle en DB (para que conste como terminado).
3.  **Explícitamente** disparar la actualización de estadísticas (`trackStatsOnCompletion`).
4.  **Explícitamente** verificar logros (`checkAchievements`).

Ahora, si usas "Resolver", el juego cuenta como victoria (aunque internamente marcamos que fue "asistida", las estadísticas básicas suben). Somos honestos con la base de datos.

## Hitori y las Matemáticas de Barra de Progreso

Ya que estábamos arreglando números, atacamos otro reporte visual en *Hitori* y *Hashi*.
Los usuarios reportaban que la barra de progreso a veces llegaba al 110% o se quedaba en el 90% al terminar.

En **Hashi**, la barra se calculaba sumando los puentes requeridos de todas las islas.
`Progreso = Puentes_Colocados / Suma_Puentes_Requeridos`.
Error de novato: Cada puente conecta DOS islas. Por tanto, cada puente contribuye a la satisfacción de DOS números. Estábamos contando la demanda doble, pero la oferta simple (o viceversa según la versión del código).
La corrección fue una lección de humildad matemática: `Total_Real = Suma_Requerida / 2`.

En **Galaxies**, el problema era similar con los muros. Los muros internos dividen dos galaxias, los externos solo una. Nuestra fórmula trataba todos los muros igual. Tuvimos que dividir el problema en "Muros de Borde" y "Muros Internos" para normalizar el porcentaje al 100% exacto.

## Conclusión

La semana 47 fue un recordatorio de que una interfaz bonita no sirve de nada si los datos que muestra son mentira.
Hemos vestido a la mona de seda, sí, pero también nos hemos asegurado de que la mona esté sana por dentro.

Ahora la Home te invita a entrar, y cuando juegas (o incluso cuando haces trampas y le das a "Resolver"), la app te recuerda y te cuenta. La confianza entre usuario y sistema ha sido restaurada.

Queda una semana para terminar Noviembre. Y tenemos una deuda pendiente con dos juegos que todavía no tienen estadísticas ni logros: *Minesweeper* y *Galaxies*. Son los últimos marginados. En la semana 48, iremos a por ellos.
