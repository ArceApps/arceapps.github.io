---
title: "2025 W43: La Explosión Cámbrica"
description: "Duplicando el catálogo en siete días. De 4 juegos a 8. La reutilización de código alcanza su pico máximo, pero la deuda técnica empieza a acumular intereses."
pubDate: 2025-10-26
tags: ["devlog", "minesweeper", "hashi", "tech-debt", "productivity"]
heroImage: "/images/devlog/2025-w43-cover.png"
---

En biología evolutiva, la "Explosión Cámbrica" fue un periodo breve donde la vida en la Tierra se diversificó a una velocidad sin precedentes. De repente, aparecieron casi todos los planes corporales animales que conocemos hoy. Fue un caos de creatividad biológica.

En *PuzzleSuite*, la Semana 43 (del 20 al 26 de Octubre) fue nuestra propia explosión.

Entramos al lunes con 4 juegos estables (Shikaku, Hitori, Fillomino, Slitherlink).
Salimos el domingo, exhaustos pero eufóricos, con **8 juegos funcionales**.
Añadimos **Kenken** (Calcudoku), **Kakuro**, **Hashi** y el clásico abuelo del género: **Minesweeper** (Buscaminas).

¿Cómo es posible doblar el catálogo en 7 días sin morir en el intento?
La respuesta corta es: Copiar y Pegar con estilo.
La respuesta larga es que nuestra inversión en arquitectura modular finalmente dio sus dividendos... pero también estamos empezando a ver las letras pequeñas del contrato.

## Kenken y Kakuro: La Familia Aritmética

Empezamos con Kenken y Kakuro. Son primos hermanos.
Ambos requieren llenar celdas con números. Ambos tienen restricciones de "suma". Ambos requieren un teclado numérico en pantalla.

Aquí nos sentimos genios. Pudimos reutilizar el 90% del código.
Creamos un componente `NumberInputPad` que ambos comparten.
La lógica de validación de sumas se extrajo a una función de utilidad.
Implementar Kakuro fue básicamente: "Extiende de Kenken, cambia la forma de dibujar la rejilla (triángulos de pistas), y listo". Tuvimos Kakuro funcionando en un solo día. Esto es el sueño de la reutilización de código.

## Hashi: Un Puente Demasiado Lejos

Pero las celebraciones acabaron cuando llegó **Hashi**.
Hashi requiere conectar islas.
El problema es que Hashi no es una cuadrícula densa. Es un **grafo disperso**. La mayoría de la pantalla está vacía.
Intentamos forzar a Hashi a usar la estructura de `Grid` que creamos en la Semana 41 (la que usaba un Array plano).

Fue un error conceptual.
Para representar un Hashi en memoria, tuvimos que llenar nuestro Array de `nulls`.
*   "¿Celda (0,0)? Null."
*   "¿Celda (0,1)? Null."
*   "¿Celda (0,2)? Isla."

El `HashiViewModel` se llenó de "hacks" y parches para traducir entre coordenadas de pantalla y nodos lógicos del grafo. Funciona, pero el código es feo. Es un recordatorio de que **no existe una abstracción perfecta para todo**. A veces, intentar unificar demasiado crea más complejidad de la que ahorra.
*Nota mental para el futuro: Reescribir el motor de Hashi como un grafo real de nodos y aristas, no una matriz.*

## Minesweeper: El Intruso

Y el viernes llegó **Minesweeper**.
Minesweeper es el "bicho raro" de la colección.
Todos nuestros otros juegos son estáticos: lo resuelves a tu ritmo. Tienes toda la información desde el principio.
Minesweeper es dinámico. Es un juego de información oculta y riesgo.

Rompió todas nuestras reglas:
1.  **Estados de Derrota**: En Sudoku no "pierdes" de repente. En Minesweeper, un clic y *Game Over*. Tuvimos que añadir manejo de estados de derrota irreversible que no existían en el motor base.
2.  **Interacción Dual**: Requiere diferenciar claramente entre "Tap" (descubrir) y "Long Press" (poner bandera).
3.  **Generación Post-Clic**: Para ser justos, el primer clic del usuario SIEMPRE debe ser seguro. Esto significa que no podemos generar el mapa al principio. Tenemos que esperar a que el usuario toque la primera celda, y *entonces* generar las minas alrededor de ese punto para asegurar un hueco. Esta "generación perezosa" obligó a refactorizar todo el flujo de inicio de partida.

Minesweeper está lleno de `if (gameType == MINESWEEPER)` dispersos por el código base común. Eso huele mal. Huele a deuda técnica.

## La Resaca del Éxito

Al cerrar la semana, la app es impresionante. 8 juegos. Todos jugables. Generación infinita.
Desde fuera, parece un triunfo total de la productividad.

Pero desde dentro, vemos las costuras del traje.
*   Los colores de "Selección" no son consistentes (verde en uno, azul en otro).
*   Las pantallas de "Victoria" son ligeramente diferentes porque las fuimos copiando y modificando.
*   Hashi tironea un poco en tableros grandes por culpa de la estructura de datos ineficiente.

Hemos priorizado la **Cantidad** sobre la **Calidad** esta semana. Era necesario para alcanzar la "masa crítica" de juegos que hace que la app valga la pena descargar.
Pero no podemos seguir a este ritmo. Hemos pedido un préstamo al banco de la Deuda Técnica, y los intereses se empezarán a cobrar en Noviembre.

Se acerca un nuevo mes. Y con él, la promesa de un último juego (Dominosa) y la inevitable necesidad de limpiar el desorden de esta fiesta desenfrenada. La "Explosión Cámbrica" ha terminado. Ahora toca la selección natural.
