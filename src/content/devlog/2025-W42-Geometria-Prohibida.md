---
title: "2025 W42: Geometría Prohibida"
description: "Slitherlink y Galaxies rompen nuestra cuadrícula. Introduciendo matemáticas vectoriales, zonas de impacto difusas y generación en hilos de fondo."
pubDate: 2025-10-19
tags: ["devlog", "canvas", "math", "algorithms", "performance"]
heroImage: "/images/devlog/2025-w42-cover.png"
---

Hasta ahora, nuestros juegos (Hitori, Shikaku, Fillomino) vivían felices dentro de celdas cuadradas perfectas.
Click en la celda (2,3) -> Pinta la celda (2,3). La vida era sencilla.

Pero la Semana 42 (del 13 al 19 de Octubre) trajo a los rebeldes del grupo: **Slitherlink** y **Galaxies**.

Estos juegos no tratan sobre las celdas. Tratan sobre lo que hay *entre* ellas.
En *Slitherlink*, interactúas con las **aristas** (los bordes entre puntos). Tu objetivo es dibujar un bucle.
En *Galaxies*, interactúas con **paredes** arbitrarias que cortan el espacio según la simetría.

Nuestro sistema de detección de toques `(coordenada / tamaño_celda)` se rompió inmediatamente.

## El Problema del Toque Fantasma

Imagina intentar tocar una línea de 1 pixel de grosor con un dedo que, en la pantalla, ocupa una superficie de casi un centímetro cuadrado. Es imposible acertar.
Si le pedimos al usuario precisión quirúrgica, tirará el teléfono por la ventana.

Para Slitherlink, tuvimos que tirar a la basura nuestra detección de clics simple e implementar un sistema de **"Hit Testing" con zonas de influencia**.
Ya no comprobamos si "tocaste la línea". Comprobamos "¿a qué línea está más cerca el centro de tu presión?".

```kotlin
fun getNearestEdge(touchX: Float, touchY: Float): Edge? {
    // Calculamos la distancia a los 4 bordes más cercanos
    val distTop = abs(touchY - cellTop)
    val distLeft = abs(touchX - cellLeft)
    // ...
    
    // Si la distancia es menor a un umbral (ej: 24dp), aceptamos el toque.
    if (minDist < TOUCH_THRESHOLD) return closestEdge
    return null
}
```

Pasamos dos días enteros ajustando esta constante `TOUCH_THRESHOLD`.
*   Si la zona es muy pequeña, fallas el toque y te frustras.
*   Si es muy grande, intentas tocar una línea vertical y activas la horizontal vecina por error.

Es UX invisible: si lo haces bien, nadie lo nota. El juego simplemente "se siente bien". Si lo haces mal, el juego se siente "roto" o "tosco".

## Galaxies y la Simetría Rotacional

**Galaxies** fue el jefe final de la semana. Posiblemente el juego más difícil de programar de todo el catálogo.
En este juego, debes dividir el tablero en regiones que sean **simétricas rotacionalmente (180 grados)** alrededor de varios centros dados.

Esto requiere matemáticas vectoriales que no había usado desde la universidad.
Para validar si una región es correcta, no basta con contar celdas. Tienes que verificar geométricamente:
1.  Para cada celda `C` en la región...
2.  Calcula su posición "espejo" `C'` respecto al centro de la galaxia.
3.  Verifica que `C'` también pertenezca a la región.
4.  Y lo más difícil: Verifica que el camino desde `C` a `C'` dentro de la región es continuo y no atraviesa paredes.

Implementamos un algoritmo que lanza "rayos virtuales" para comprobar la conectividad.
Fue el primer momento en el proyecto donde sentimos que el rendimiento podría sufrir. Validar la simetría de 100 celdas en cada frame (60 veces por segundo) es costoso para la CPU.

Introdujimos nuestra primera optimización seria: **Caché de Validación**.
Solo re-calculamos la validez de una región cuando el usuario modifica una pared. Si solo estás moviendo el cursor o haciendo scroll, reutilizamos el resultado anterior (verde o rojo). De 16ms por frame bajamos a 0.5ms.

## El Generador de Puzzles: El Nuevo Cuello de Botella

Con la lógica de visualización resuelta, nos topamos con otro muro: **Generar estos puzzles es lento**.
Generar un Hitori es rápido (borra números al azar hasta que funcione).
Pero generar un Slitherlink válido (un único bucle cerrado que satisfaga matemáticamente todos los números) es un problema extremadamente complejo (NP-completo en ciertas variantes).

Nuestro generador inicial tardaba 15 segundos en crear un puzzle 10x10.
Un usuario móvil no espera 15 segundos. Cierra la app y abre Instagram.

No podíamos hacer el algoritmo más rápido (las matemáticas son las que son), así que hicimos un truco de ilusionismo: **Pre-generación**.
Cuando instalas la app, viene con 10 puzzles de cada tipo pre-calculados en un archivo JSON.
Mientras juegas el primero, la app despierta un hilo secundario (`Worker`) que se pone a generar silenciosamente el puzzle #11, el #12...
Se almacenan en una base de datos local "Buffer".

Para el usuario, la carga es instantánea. Siempre hay un puzzle listo esperándole.
Es como los restaurantes de comida rápida: la hamburguesa no se cocina cuando la pides. Se cocinó 5 minutos antes y está esperando bajo una lámpara de calor. En nuestro caso, la lámpara es SQLite.

## Conclusión

Hemos salido de la seguridad de la cuadrícula simple.
Ahora nuestro motor soporta geometría arbitraria, toques difusos probabilísticos y validación geométrica compleja.
La arquitectura de "Clean Code" sigue aguantando, aunque los archivos `GameView` se están volviendo peligrosamente grandes con tanta lógica de dibujo vectorial.

Quizás la semana que viene toque dividir esos archivos gigantes antes de que cobren vida propia. Pero por ahora, ver las curvas suaves de Slitherlink funcionando en pantalla hace que todo valga la pena.
