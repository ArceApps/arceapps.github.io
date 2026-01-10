---
title: "2025 W45: Dominar la Incertidumbre"
description: "De la teoría a la práctica: Cómo implementamos Dominosa en una semana y aprendimos que la aleatoriedad verdadera es un enemigo."
pubDate: "2025-11-09"
tags: ["devlog", "algorithms", "dominosa", "completion", "production"]
heroImage: "/images/devlog-w45-algorithms.svg"
---

Si la semana pasada fue sobre la audacia de comenzar algo nuevo, la Semana 45 (del 3 al 9 de Noviembre) ha sido sobre la cruda realidad de terminarlo. Una cosa es decir "vamos a hacer un juego de dominó" y otra muy distinta es hacer que se sienta justo, divertido y libre de errores en un teléfono móvil.

Dominosa ha pasado de ser un prototipo en nuestra mente a ser un ejecutable en nuestros dispositivos. Pero el camino no fue línea recta. Fue un grafo de dependencias cíclicas, bugs de recursividad y mucho café.

## El Corazón de la Bestia: El Generador Único

El lunes nos dimos de bruces con nuestro primer gran obstáculo. El generador que habíamos esbozado la semana anterior funcionaba, sí, pero producía monstruos.

Generar un tablero de Dominosa es fácil: pones fichas al azar hasta llenar el rectángulo. El problema es que el jugador ve solo los números, no los bordes. Y a menudo, esa sopa de números podía interpretarse de tres o cuatro formas diferentes.

Un buen puzzle lógico debe tener **una y solo una solución**. Si el jugador llega a una situación donde tiene que "adivinar" entre dos opciones igualmente válidas, el diseñador ha fallado. El juego deja de ser lógica y se convierte en azar.

### Implementando el Solver de Backtracking

Para garantizar la unicidad, tuvimos que escribir un *Solver* (resolutor) capaz de resolver el puzzle como lo haría una máquina omnisciente.

Usamos un algoritmo de **Backtracking Recursivo con Poda**.
1.  Busca la primera casilla vacía.
2.  Intenta colocar una ficha válida (horizontal o vertical) que conecte con un vecino.
3.  Verifica si esa ficha ya ha sido usada en otra parte del tablero.
4.  Si es válida, avanza a la siguiente casilla.
5.  Si llega a un punto muerto, retrocede (*backtrack*) y prueba otra orientación.

El truco para detectar la unicidad es no detenerse en la primera solución.

```kotlin
fun countSolutions(board: Board, inventory: Set<Tile>): Int {
    if (isFull(board)) return 1
    
    var solutions = 0
    // ... lógica de colocación ...
    
    // Si encontramos más de 1 solución, abortamos temprano.
    // Solo nos importa saber si es 1 o >1.
    if (solutions > 1) return solutions 
    
    return solutions
}
```

Modificamos el generador para que funcione en un bucle:
*   Genera un tablero candidato.
*   Pásalo por el `Solver`.
*   ¿Tiene exactamente 1 solución? -> **ÉXITO**.
*   ¿Tiene >1 o 0 soluciones? -> **DESCARTAR** y reintentar.

Esto aumentó el tiempo de carga de unos pocos milisegundos a casi 2 segundos para los tableros grandes (Nivel Experto). Para mitigar esto, movimos la generación a un `Dispatcher.Default` (hilo de fondo) y añadimos una pequeña animación de "Barajando fichas". La percepción del usuario pasó de "la app se ha trabado" a "la app está pensando un desafío digno para mí". UX salva el día, otra vez.

## La Batalla de la Interacción Táctil

A mitad de semana, con la lógica resuelta, nos enfrentamos a la UX. Dominosa requiere dibujar muchas líneas pequeñas. En un puzzle de 8x9 celdas en una pantalla de 6 pulgadas, la precisión del dedo es un problema.

Nuestros primeros testers (nosotros mismos) reportaban frustración. Intentaban conectar el `3` con el `4` y terminaban conectando el `3` con el `1` de abajo.

Implementamos un sistema de **"Snap-to-Grid" con histéresis**.
*   No basta con tocar cerca de un borde para activar la línea.
*   Calculamos el vector de movimiento del dedo.
*   Si el usuario arrastra > 50% de la distancia hacia una celda vecina, el sistema asume la intención y "imanta" la conexión.
*   Añadimos retroalimentación háptica (una vibración diminuta, de 5ms) cuando la conexión se bloquea.

La diferencia fue noche y día. El juego dejó de sentirse "resbaladizo" y pasó a sentirse "mecánico", táctil, satisfactorio. Como encajar piezas de Lego virtuales.

## El Arte de Dar Pistas (Sin regalar la solución)

El jueves nos dimos cuenta de que Dominosa es *difícil*. Muy difícil. A diferencia de Sudoku, donde un número incorrecto a menudo se revela pronto, en Dominosa un error temprano puede pasar desapercibido hasta que te quedan las últimas dos fichas y te das cuenta de que nada encaja.

Necesitábamos un sistema de Pistas (`Hint System`). Pero, ¿qué es una pista en Dominosa?
*   ¿Revelar un borde aleatorio? (Demasiado fácil).
*   ¿Decirte dónde te equivocaste? (Demasiado intrusivo).

Optamos por una **IA deductiva**. Escribimos un pequeño motor de inferencia que conoce las reglas lógicas básicas que usaría un humano:
1.  *Unicidad*: "Si solo hay un lugar posible para el par [6|6], entonces esa debe ser la conexión".
2.  *Exclusión*: "Si el 3 de la esquina solo tiene un vecino libre, debe conectarse con él".

Cuando pides una pista, el juego no "mira" la solución final. En su lugar, ejecuta este motor lógico sobre tu estado actual. Si encuentra una jugada lógicamente forzada, te la muestra y te explica *por qué* ("Este 5 solo tiene un vecino libre").

Esto es crucial: **enseñar al jugador a pescar, no darle el pescado**. Si la pista te explica la lógica, te vuelves mejor jugador. Si solo te revela la respuesta, te vuelves dependiente de la máquina.

## Integración y Deployment

El sábado por la noche, Dominosa estaba listo.
Era el momento de la verdad: ejecutar `./gradlew build`.

La integración con el sistema de CI/CD fue sorprendentemente suave, gracias al trabajo previo de la Semana 44. Dominosa no era un extraño; era un módulo más que cumplía contratos.
*   Las estadísticas se inicializaron a cero.
*   El tema oscuro/claro se aplicó automáticamente gracias a nuestros tokens de diseño en `MaterialTheme`.
*   Las traducciones (que ahora manejamos con más rigor) estaban listas en `strings.xml`.

El domingo 9 de Noviembre, pulsamos el botón (metafórico) de merge. *PuzzleSuite* ahora tiene 9 juegos.

## Reflexión Semanal: La Deuda Oculta

Al cerrar esta semana, sin embargo, no todo es celebración. Al implementar Dominosa, tuvimos que copiar y pegar el código del `GameCompletionDialog` (la ventanita que sale cuando ganas).

Ahora tenemos 9 archivos llamados `GameCompletionDialog` (o variantes) dispersos por el proyecto. 9 lugares para mantener. 9 lugares para introducir bugs. 9 lugares para cambiar si decidimos refrescar el diseño.

Hemos ido rápido, sí. Hemos entregado valor, sí. Pero hemos ensuciado la cocina.

La próxima semana no habrá juegos nuevos. No habrá features brillantes. La próxima semana toca ponerse los guantes de goma y la lejía. Vamos a estandarizar. Vamos a eliminar duplicados. Vamos a pagar la deuda técnica antes de que los intereses nos coman vivos.

Dominosa está vivo. Ahora asegurémonos de que la casa donde vive no se derrumbe.
