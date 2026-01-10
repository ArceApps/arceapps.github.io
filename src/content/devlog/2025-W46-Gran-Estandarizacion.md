---
title: "2025 W46: La Teoría de las Ventanas Rotas"
description: "Por qué decidimos detener el desarrollo de nuevas funciones para arreglar un píxel 6dp fuera de lugar, y la cacería del bug geométrico en Hashi."
pubDate: "2025-11-16"
tags: ["devlog", "refactoring", "bugfix", "ui", "clean-code"]
heroImage: "/images/blog-placeholder-2.jpg"
---

Hay una teoría criminológica llamada "La Ventana Rota". Dice que si dejas una ventana rota en un edificio, pronto todas las demás ventanas serán destrozadas. El desorden invita al desorden. La negligencia visible indica que "a nadie le importa", y eso reduce los estándares de todos.

En el desarrollo de software, esto es una verdad absoluta. Si tienes una pantalla con el título mal alineado, pronto tendrás funciones con nombres inconsistentes, luego bugs lógicos ignorados, y finalmente, un producto inmantenible.

La Semana 46 (del 10 al 16 de Noviembre) fue nuestra semana de "reparar ventanas". Después del sprint de Dominosa, miramos a *PuzzleSuite* y vimos muchas pequeñas grietas.

## El Caso del Botón Desaparecido

El primer objetivo fue una queja recurrente (incluso interna): el botón de **Reset** en la barra superior.
Teníamos un icono de "refrescar" en la esquina superior derecha de algunos juegos (Shikaku, Dominosa, Fillomino), pero no en otros (Minesweeper). Inconsistencia #1.

Peor aún, el comportamiento era ambiguo.
*   En Shikaku, el botón borraba tu progreso actual pero mantenía el mismo puzzle.
*   En Hitori, a veces parecía generar uno nuevo.

Y lo más grave: estaba peligrosamente cerca del menú de opciones. Imagina estar resolviendo un puzzle Experto durante 20 minutos, ir a cambiar el tema oscuro, fallar el clic por 4 milímetros, y ver cómo tu trabajo se borra instantáneamente. Sin confirmación. Sin "Deshacer".

Decidimos aplicar una solución radical: **Eliminación**.

Borramos el botón de Reset de la barra superior en todos los juegos. En su lugar, estandarizamos el flujo de "Nueva Partida". Ahora, si quieres reiniciar, debes ir al menú explícito o terminar el juego.
Pero fuimos más allá. Modificamos el diálogo de "Juego Completado" para que el botón principal no sea "Jugar de Nuevo" (que era ambiguo), sino **"Nuevo Puzzle"** (con un icono de `+`).

Esto requirió tocar 16 archivos en 10 módulos diferentes. Fue tedioso. No es el tipo de trabajo que pones en un currículum ("Borré un botón"). Pero la UX ganó en claridad y seguridad inmediatamente. Se acabaron los reinicios accidentales.

## Hashi: Geometría Prohibida

Mientras limpiábamos la interfaz, nuestro sistema de reportes automatizados (Sentinel) empezó a escupir errores silenciosos provenientes de **Hashi**.
Hashi es un juego sobre conectar islas con puentes. La regla de oro es: **"Los puentes no pueden cruzarse"**.

Resulta que nuestro código no respetaba su propia regla de oro.

En ciertas condiciones, el generador de puzzles creaba islas en posiciones tales que la única solución lógica requería que dos puentes se cruzaran en 'X'. Y como nuestro validador impedía al usuario cruzar puentes, el puzzle se volvía irresoluble. Un callejón sin salida matemático.

### La Anatomía del Cruce

Para arreglar esto, tuvimos que sumergirnos en la geometría computacional.
No basta con comprobar si dos líneas se tocan. Tuvimos que implementar una función `bridgesWouldCross(bridge1, bridge2)` robusta.

```kotlin
fun bridgesWouldCross(b1: HashiBridge, b2: HashiBridge): Boolean {
    // Si van en la misma dirección (ambos horizontales), no se cruzan (se superponen o son paralelos)
    if (b1.direction == b2.direction) return false
    
    val h = if (b1.isHorizontal) b1 else b2
    val v = if (b1.isVertical) b1 else b2
    
    // Para que se crucen, la fila del H debe estar DENTRO del rango de filas del V
    // Y la columna del V debe estar DENTRO del rango de columnas del H
    return (h.row in (v.startRow + 1) until v.endRow) &&
           (v.col in (h.startCol + 1) until h.endCol)
}
```

Implementamos esta validación en tres capas (La estrategia de "Defensa en Profundidad"):
1.  **En la UI**: El juego ahora te impide físicamente arrastrar un puente si va a cortar otro existente. Muestra un feedback rojo inmediato.
2.  **En el Generador**: Cada puzzle generado pasa por un filtro de validez. Si el generador produce un puzzle que requiere un cruce, se descarta y se reintenta (hasta 3 veces).
3.  **En el Solver**: El botón "Resolver" (nuestra fuente de verdad) ahora verifica que su solución propuesto no contenga cruces. Si los tiene, hace fallback a una búsqueda recursiva más lenta pero segura.

Fue como arreglar una tubería con fugas mientras el agua seguía corriendo. Pero ahora, Hashi es matemáticamente honesto.

## La Estandarización de Pantallas

Con los bugs críticos resueltos, volvimos a la estética.
Unificamos los márgenes. Parece trivial, pero tener 16dp de padding en la pantalla de *KenKen* y 24dp en la de *Galaxies* creaba una sensación subconsciente de "barato", de "amateur".

Creamos un Composable base `GameScreenScaffold` que impone:
*   La misma TopBar.
*   El mismo manejo de insets (para que la cámara frontal no tape el juego).
*   El mismo comportamiento del `GamePauseOverlay`.

Hablando del overlay de pausa: descubrimos que en algunos juegos, aunque la pantalla de "PAUSA" estaba visible, podías seguir tocando el tablero detrás de ella. Un usuario astuto podía pausar el tiempo y seguir resolviendo el puzzle "a ciegas" o visualmente.
Arreglamos esto interceptando todos los eventos táctiles en la capa de pausa. El cronómetro ahora es sagrado. Si paras el tiempo, paras el juego.

## Reflexión: La Disciplina de lo Invisible

Esta semana no hemos añadido ni una sola funcionalidad nueva que el equipo de marketing pueda vender. "Ahora los márgenes son iguales" no vende copias.

Pero la calidad del software no se mide solo por lo que hace, sino por cómo te hace sentir mientras lo usas. La consistencia genera confianza. Un usuario que ve que los botones, los diálogos y los errores se comportan igual en 10 juegos distintos, empieza a confiar en la aplicación. Deja de luchar contra la interfaz y empieza a fluir con el juego.

Hemos pasado la semana barriendo el suelo y cambiando bombillas. Y la casa nunca ha lucido mejor.
Ahora que los cimientos están limpios, estamos listos para traer los muebles nuevos. Semana 47, allá vamos.
