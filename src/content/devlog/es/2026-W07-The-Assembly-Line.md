---
title: "2026 W07: La Línea de Montaje (y el placer de borrar código legado)"
description: "Cómo pasamos de la artesanía a la producción industrial: 11 tutoriales interactivos en 7 días. Una crónica técnica sobre escalado, deuda técnica y el arte de enseñar geometría sin usar palabras."
pubDate: 2026-02-15
tags: ["devlog", "scaling", "refactoring", "ux-design", "education", "legacy-code", "kotlin", "jetpack-compose"]
heroImage: "/images/devlog-default.svg"
---

El lunes 9 de febrero me desperté con una sensación extraña en el estómago. Una mezcla de emoción y pánico existencial.
La semana anterior (W06) había sido un éxito rotundo: habíamos refactorizado el motor de tutoriales y creado una experiencia educativa maravillosa para *Hashi*.
Pero *Hashi* es solo uno de nuestros doce "hijos".
Quedaban once juegos huérfanos. Once juegos complejos, abstractos y difíciles de entender para el novato, que seguían dependiendo de pantallas de texto estático aburridas e inútiles.

El objetivo de la semana era absurdo, casi irresponsable: **Implementar los 11 tutoriales restantes antes del domingo**.
En cualquier otra circunstancia de mi carrera, esto habría sido una "Marcha de la Muerte" (*Death March*). Habría significado noches sin dormir, café rancio, bugs por agotamiento y código basura copiado y pegado a la desesperada para cumplir con el deadline.

Pero esta vez teníamos un arma secreta. Teníamos el **Motor de Educación** (The Education Engine) que construimos con tanto dolor la semana pasada.
Esta semana no iba a tratar sobre "programar" en el sentido artesanal. Iba a tratar sobre **Industrializar**.
Íbamos a dejar de ser artesanos que tallan cada píxel a mano para convertirnos en Henry Ford.

## Lunes y Martes: La Prueba de Fuego (Akari y la Crisis de UX)

Empezamos con *Akari* (Light Up).
Sobre el papel, era el candidato perfecto para probar nuestra nueva línea de montaje. Reglas sencillas, tablero visual, lógica booleana.
Arrancamos la fábrica.
Creamos `AkariInteractiveTutorial.kt`. Heredamos de nuestra clase base. Definimos los pasos.
En 4 horas teníamos un tutorial funcional.
*"¡Funciona! ¡Somos invencibles!"*, gritamos, chocando las manos virtuales. *"A este ritmo acabamos el miércoles"*.

Y entonces, cometimos el error (o el acierto) de probarlo en una Tablet de 10 pulgadas.

El desastre fue mayúsculo (`TASK-2026-101`).
En nuestro afán por reutilizar componentes, habíamos asumido que "una talla sirve para todos".
Pero *Akari* tiene una densidad de información diferente a *Hashi*.
Los ejemplos prácticos que en el teléfono se veían preciosos y compactos, en la tablet se renderizaban como monstruosidades grotescas.
Las bombillas eran del tamaño de melones (400dp de altura). Los textos de ayuda flotaban perdidos en un mar de espacio negativo.
Era una interfaz que gritaba "Software Portado con Prisas".

Fue un baño de humildad. La industrialización tiene sus riesgos: si tu molde tiene un defecto milimétrico, fabricarás mil copias defectuosas por minuto.

Tuvimos que detener la línea de montaje (Stop the Line!) y recalibrar la maquinaria.
Aprendimos una lección valiosa sobre **Jerarquía Visual Responsiva**. No puedes simplemente usar `Modifier.fillMaxSize()`.
Tuvimos que introducir restricciones de tamaño máximo (`widthIn`) para evitar que los componentes "explotaran" en pantallas grandes.

```kotlin
// El Fix que salvó la dignidad de Akari en Tablets
Box(
    modifier = Modifier
        .fillMaxWidth()
        .wrapContentSize(Alignment.Center) // Centrar en el padre
) {
    Box(
        modifier = Modifier
            .widthIn(max = 200.dp) // <--- LA CLAVE. Nunca crezcas más de esto.
            .aspectRatio(1f)
            .clip(RoundedCornerShape(12.dp))
            .background(BoardColors.Background)
    ) {
        // ... Logic de dibujado ...
    }
}
```

Ese simple `.widthIn(max = 200.dp)` marcó la diferencia entre una app amateur y una profesional.
Redujimos la altura efectiva de los componentes en un **42%**.
El resultado fue una interfaz que se sentía nativa y respetuosa tanto en un Pixel 4 minúsculo como en una Galaxy Tab S9 Ultra.

## Miércoles: El Reto de la Geometría Silenciosa (Galaxies)

Con la crisis de *Akari* resuelta, el miércoles nos enfrentamos al jefe final de la pedagogía: *Galaxies* (Tentai Show).

Explicar *Sudoku* es fácil. "Pon números del 1 al 9".
Explicar *Galaxies* es una pesadilla lingüística.
Las reglas implican conceptos de **Simetría Rotacional de 180 grados**.
Intenta explicarle eso a tu abuela sin usar palabras técnicas. O peor, inténtalo explicar en una pantalla de móvil donde nadie lee más de dos líneas.
*"Tienes que formar una región tal que si la giras sobre su centro, coincida con ella misma"*.
La gente lee eso, le explota el cerebro y desinstala la app.

Decidimos que el texto era el enemigo.
Si tienes que explicar una regla visual con un párrafo de texto, **tu UI ha fallado**.
Para el tutorial de *Galaxies* (`TASK-2026-106`), implementamos una demostración visual sin palabras.
Creamos una animación personalizada usando `Canvas` y las APIs de animación de Compose.

No usamos un video. Usamos código.
Dibujamos una forma irregular (una "L") y un punto central.
Y luego, aplicando una rotación de matriz suave, hicimos que la pieza girara sobre el punto.

```kotlin
// La Física de la Intuición
val rotation = remember { Animatable(0f) }

LaunchedEffect(Unit) {
    // Ciclo infinito de enseñanza hipnótica
    while(true) {
        rotation.animateTo(
            targetValue = 180f,
            animationSpec = tween(2000, easing = FastOutSlowInEasing)
        )
        delay(500)
        rotation.animateTo(
            targetValue = 360f, // Vuelta completa
            animationSpec = tween(2000, easing = FastOutSlowInEasing) // "Peso" físico
        )
    }
}

Canvas(...) {
    rotate(degrees = rotation.value, pivot = center) {
        drawPath(path = galaxyShape, color = GalaxyColor)
    }
}
```

Usamos interpolaciones `FastOutSlowIn` para que el giro tuviera "peso". Inercia.
Ver la pieza encajar consigo misma al girar 180 grados produce un *"Click"* mental instantáneo en el usuario.
*"¡Ah! Es como un molinillo de viento. No es un espejo, es un giro"*.

No tuvimos que escribir ni una sola línea de texto explicativo sobre grados o rotaciones.
La animación enseñaba por "ósmosis visual". Fue una victoria absoluta de la filosofía "Show, don't tell".

## Jueves y Viernes: La Velocidad de Crucero

A partir del jueves, entramos en "La Zona" (Flow State).
Con los problemas de tablets resueltos y las herramientas de animación listas, la maquinaria estaba perfectamente engrasada.
*   Jueves mañana: *Fillomino* y *Slitherlink*. Listos antes de comer.
*   Jueves tarde: *Minesweeper* y *Dominosa*. Listos antes de cenar.
*   Viernes: *Shikaku*, *Kakuro*, *Kenken* y *Math Crossword*.

Era casi hipnótico.
Copiar la estructura. Definir las reglas específicas en el `TutorialStepContainer`. Ajustar los validadores. Compilar.
Lo que hace un mes nos habría llevado dos semanas de picar código espagueti y corregir bugs de estado, ahora fluía como el agua.
El código era limpio, predecible y robusto.
Cada tutorial compartía el 90% de su ADN (navegación, estilos, animaciones) y solo variaba en el 10% esencial (las reglas del juego).

Fue una demostración empírica del poder de la **Inversión en Infraestructura** y la **Arquitectura Composable**.
Perdimos toda la semana pasada (W06) construyendo el motor. Parecía que no avanzábamos. Parecía que estábamos perdiendo el tiempo "poniendo bonito el código".
Pero esa inversión nos permitió viajar a velocidad luz esta semana.
A veces, para ir rápido, primero tienes que pararte a afilar el hacha.

## Sábado: La Gran Purga

El sábado por la mañana, con los 12 tutoriales implementados y funcionando en producción, llegó el momento más dulce de la semana.
La tarea `TASK-2026-110`.
Su descripción era breve, casi poética: **"Eliminar Sistema de Onboarding Antiguo"**.

Abrí el archivo `InteractiveTutorialOverlay.kt`.
Era un archivo viejo, feo, lleno de parches, `if-else` anidados y `TODOs` de hace seis meses.
Era el código que habíamos escrito cuando éramos jóvenes e ingenuos (o sea, en diciembre).
Hice clic derecho -> **Delete**.
Luego fui a `TutorialContent.kt`. **Delete**.
Busqué todas las referencias a imágenes estáticas PNG que usábamos antes. **Delete**.

Borramos casi 3.000 líneas de código esa mañana.
Ver el contador de líneas del proyecto bajar verticalmente mientras la funcionalidad y la calidad de la app aumentaban fue una sensación casi física de ligereza.
Es como tirar esa caja de cables viejos que tienes en el armario "por si acaso". Sabes que no los necesitas, pero da miedo tirarlos.
Pero cuando lo haces, sientes que tu casa (o tu codebase) respira mejor. Hay menos ruido. Menos carga cognitiva.

## Domingo: Reflexión desde la Cima

Terminamos la semana exhaustos pero eufóricos.
Los 12 juegos ahora están equipados con tutoriales interactivos de primera clase.
Cada tutorial tiene su propia "Ceremonia de Graduación".
Cada uno enseña reglas complejas de forma visual y táctil, respetando la inteligencia del usuario pero guiándole con mano firme.

Hace siete semanas, *PuzzleHub* era una colección heterogénea de puzles sueltos.
Hoy, empieza a parecerse a una **Plataforma Educativa Coherente**.
El usuario no solo "juega". Aprende. Mejora. Entiende la geometría oculta de las cosas.

La semana que viene (W08) será la última antes de la Release Candidate.
Toca pulir. Toca optimizar el rendimiento (esos 60fps no se mantienen solos en dispositivos gama baja). Toca revisar la accesibilidad para daltónicos.
Pero el núcleo duro, el corazón de la experiencia, está terminado. Y late fuerte.

---
*Fin del reporte semanal.*
