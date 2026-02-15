---
title: "2026 W06: Modo Profe (Cómo reducir 25.000 líneas de código a 1.000 y enseñar a jugar)"
description: "De un script monolítico de 2000 líneas a un Motor de Educación Modular. Una historia sobre deuda técnica, pedagogía interactiva y por qué decidimos dar diplomas virtuales con físicas de resorte."
pubDate: 2026-02-08
tags: ["devlog", "refactoring", "software-architecture", "ux-design", "jetpack-compose", "education"]
heroImage: "/images/devlog-default.svg"
---

Esta semana, **PuzzleHub** se ha graduado.
Y no me refiero a que hayamos salido de la beta, ni a que hayamos conseguido mil descargas.
Me refiero a que, por fin, hemos enseñado a nuestra aplicación a **enseñar**.

Tenemos 12 juegos de lógica fantásticos. Algunos, como el *Buscaminas* o el *Sudoku*, son patrimonio de la humanidad (gracias, Windows 95 y periódicos del domingo). Todo el mundo sabe jugarlos.
Pero, ¿cuánta gente sabe jugar realmente a *Hashi* (Puentes)? ¿O a *Dominosa*? ¿O a *Slitherlink*?
Son juegos maravillosos, pero tienen una barrera de entrada brutal.

Hasta ahora, nuestra estrategia de "Onboarding" era... optimista, por no decir ingenua.
Teníamos una pantalla de "Información" accesible desde el menú. Un muro de texto estático con diagramas pasivos.
*"Los puentes conectan islas con el número indicado. Los puentes pueden ser dobles..."*.
El resultado era predecible y desolador.
La **Primera Ley de la UX Móvil** dice: **"Nadie lee los manuales"**.
Nuestras métricas de retención en los juegos "nicho" eran abismales. La gente abría *Hashi*, veía un montón de círculos con números, tocaba la pantalla al azar durante 20 segundos, no pasaba nada interesante, se frustraba y cerraba la app para siempre.

Sabíamos que teníamos que arreglarlo. Necesitábamos un **Tutorial Interactivo**. Un "Modo Profe" que te cogiera de la mano y te dijera: *"Toca aquí. ¿Ves eso? Eso es un puente. Muy bien"*.
Lo que empezó como un simple script para guiar al usuario se convirtió en una odisea de arquitectura de software y en una de las refactorizaciones más agresivas que hemos hecho en meses.

## El Pecado Original: El Monolito de Hashi

Elegimos *Hashi* como nuestro conejillo de indias. Es un juego perfecto para esto: reglas muy visuales, lógica estricta, pero anti-intuitivo para el novato.

El lunes nos pusimos a picar código con la furia del converso (`TASK-2026-097`).
Escribimos un archivo llamado `HashiInteractiveTutorial.kt`.
Para el martes por la tarde, funcionaba de maravilla. Tenía una mano animada que te indicaba dónde pulsar. Tenía diálogos que reaccionaban a tus errores. Tenía confeti.
Nos sentíamos unos genios.

Entonces miramos el tamaño del archivo.
**2.099 líneas de código.**

Se nos cayó el alma a los pies.
Habíamos cometido el error de principiante (o de las prisas, que es lo mismo). Habíamos creado un **Monolito**. Acoplamiento feroz por todas partes.
En ese único archivo gigantesco convivían, en una orgía de código desordenado:
1.  La lógica de la máquina de estados del tutorial (`var currentStep = 3`).
2.  La definición visual de la UI (`Box`, `Column`, `Text`...).
3.  Las animaciones complejas de Lottie.
4.  La lógica específica del juego Hashi (validar si un puente es legal).
5.  Los estilos, colores, bordes y paddings.

Hicimos una multiplicación rápida y el pánico se apoderó de nosotros.
Tenemos 12 juegos.
Si copiábamos y pegábamos este patrón para los otros 11...
2.100 líneas x 12 juegos = **25.200 líneas de código boilerplate**.

Mantener eso sería un suicidio.
Imaginad que dentro de un mes decidimos cambiar el color del botón "Siguiente" de azul a verde, o decidimos que los textos deben ser un poco más grandes. Tendríamos que editar manualmente 12 archivos de 2.000 líneas cada uno. La deuda técnica nos comería vivos antes de lanzar la versión 2.0.

## La Gran Extracción: Nace el "Education Engine"

El miércoles por la mañana, en el Daily, tomamos la decisión difícil: **Parar la producción**.
"No podemos seguir así. Hay que refactorizar antes de crear ni un solo tutorial más".
Sacamos el bisturí digital y empezamos a diseccionar el monstruo de Hashi.
Nuestro objetivo: Extraer todo lo que NO fuera específico de *Hashi* y moverlo a una librería compartida. Queríamos crear un "Motor de Educación".

Creamos una nueva estructura de paquetes en `presentation/component/tutorial/` y empezamos a mover piezas:

### 1. La Cáscara (The Stage)
Primero, extrajimos la infraestructura. `TutorialHeader` y `TutorialFooter`.
Parece trivial, pero estandarizar la navegación (la barra de progreso superior, el botón de cancelar, el contador de pasos "3/5") garantiza que *Sudoku* y *Minesweeper* se sientan parte de la misma aplicación coherente. No quieres que cada juego tenga una interfaz de tutorial distinta.

### 2. Las "Cartas" de Contenido (The Bricks)
Aquí es donde la cosa se puso interesante. Analizando el guion de Hashi, nos dimos cuenta de que todos los tutoriales de juegos de lógica siguen patrones narrativos idénticos. Siempre estás haciendo una de estas cuatro cosas:
*   Explicar una Regla -> Creamos `RuleItem` (Icono + Texto en negrita).
*   Dar un consejo estratégico -> Creamos `StrategyTip` (Fondo gradiente suave + Icono de Bombilla).
*   Mostrar un ejemplo Válido vs Inválido -> Creamos `RestrictionCard` (Cajas verdes y rojas).
*   Vender los beneficios mentales del juego -> Creamos `BenefitCard` (Animación + "Mejora tu memoria espacial").

Al crear estos Componentes Componibles (`Composables`) genéricos, el código del tutorial de Hashi pasó de ser un espagueti ilegible de `Box`, `Column`, `Row`, `Text`, `Spacer`... a ser un guion semántico precioso:

```kotlin
// Antes (El Horror)
Column {
    Text("Regla 1: Los puentes son rectos", fontSize = 20.sp, fontWeight = Bold)
    Spacer(modifier = Modifier.height(8.dp))
    Row { 
        Icon(Icons.Default.Close, tint = Color.Red)
        Text("No pueden cruzarse ni ir en diagonal") 
    }
    // ... 50 líneas más de estilo ...
}

// Ahora (Semántico, Limpio, Legible)
TutorialStepContainer(title = "Reglas Básicas") {
    RuleItem(text = stringResource(R.string.hashi_rule_1))
    RestrictionCard(
        isValid = false, 
        text = stringResource(R.string.hashi_rule_cross)
    )
    StrategyTip(text = stringResource(R.string.hashi_tip_corners))
}
```

Es como leer un libro. El código describe la *intención*, no la implementación.

### 3. El Resultado Numérico

Tras la refactorización final del jueves, el archivo específico `HashiInteractiveTutorial.kt` bajó de **2.099 líneas a 1.280 líneas**.
Una reducción del **40%**.
Pero lo más importante no es lo que borramos, sino lo que ganamos. Esas 1.000 líneas de lógica de UI ahora viven en una librería compartida, testada y pulida.
La semana que viene, cuando implementemos el tutorial de *Akari*, esas 1.000 líneas ya nos vienen "gratis".
Estimamos que podremos producir nuevos tutoriales a un ritmo de **uno cada dos días** en lugar de uno por semana. Es la diferencia entre la artesanía lenta y la producción industrial.

## Psicología UX: La Ceremonia de Graduación

Reducir líneas de código es muy satisfactorio para el ingeniero (nos encanta borrar código), pero al usuario final le da igual nuestra arquitectura.
El usuario quiere sentirse bien. Quiere sentirse listo.

Durante las pruebas de usuario del jueves (`TASK-2026-092`), detectamos un problema emocional que llamamos "El Anticlímax".
El usuario completaba el tutorial, sudaba tinta para resolver los ejercicios prácticos interactivos... y cuando terminaba, la app simplemente cerraba el tutorial y lo mandaba al menú principal.
La reacción de los testers era unánime: *"¿Ya está? Vale. Pues juego."*
Faltaba el cierre de dopamina. Faltaba el reconocimiento del esfuerzo. Habían aprendido una habilidad nueva, y nadie les había dado una palmadita en la espalda.

Introdujimos el concepto de **Ceremonia de Graduación**.
Es una pantalla especial al final del tutorial. No tiene contenido nuevo. Su única función es celebrar el éxito del usuario y validar su competencia.

### Ingeniería de la Celebración
No queríamos un simple texto "¡Bien hecho!". Queríamos que se sintiera físico. Tangible.
Diseñamos tres elementos clave:

**1. El Badge Físico**
Creamos un vector de un diploma/medalla de 120dp. Pero no lo mostramos estáticamente.
Usamos la API de `Animatable` de Compose con físicas de resorte (`Spring.DampingRatioHighBouncy`).
El badge no "aparece". El badge *cae* desde arriba de la pantalla, choca contra el centro, rebota elásticamente y se asienta. Tiene peso. Tiene inercia. Se siente como si te hubieran colgado una medalla de verdad.

**2. El Resumen de Competencias**
Debajo del badge, listamos lo que el usuario ha aprendido, con checks animados secuencialmente:
*   ✅ Conectar Islas
*   ✅ Evitar Cruces
*   ✅ Estrategia de Esquinas

Esto refuerza la sensación de competencia (Self-Efficacy). El mensaje subconsciente es: *"No solo has jugado. Has adquirido herramientas. Estás preparado para ganar"*.

**3. El Confeti (Particle System)**
Sí, es un cliché. Pero funciona. Lanzamos un sistema de partículas simple sobre el badge.

El resultado en las pruebas A/B fue dramático. Los usuarios que veían la "Graduación" tenían un **30% más de probabilidad** de jugar una partida completa inmediatamente después del tutorial. Se sentían empoderados.

## La Arquitectura del "Profesor Fantasma"

Por último, quiero tocar brevemente la parte más compleja técnicamente, que llamamos el "Fantasma en la Máquina": El **Interactive Overlay**.

El reto era: ¿Cómo consigues que un tutorial guíe al usuario *dentro* del juego real, sin tener que reescribir el juego pare el tutorial?
Si hubiéramos creado una pantalla de "Falso Hashi" solo para el tutorial, tendríamos que mantener dos motores de juego paralelos. Un infierno de bugs duplicados.

La solución fue usar el motor real de Hashi (`HashiGameScreen`), pero "secuestrar" los inputs del usuario desde arriba.
Creamos un `InteractiveTutorialOverlay` que se coloca en el eje Z por encima del tablero de juego, como un cristal invisible.

Implementamos un patrón de **Interceptores de Eventos**:
El Overlay tiene una máscara transparente que captura TODOS los toques en la pantalla.
Antes de que el clic llegue al juego, el Overlay consulta a la lógica del tutorial:
*"El usuario ha tocado en la coordenada (3, 4). Estamos en el Paso 2 del tutorial. ¿Es esto lo que esperábamos?"*

*   **SÍ (Acierto)**: El Overlay se aparta. Deja pasar el evento (Pass-through) al tablero de juego inferior. El juego real procesa el clic, dibuja el puente, reproduce el sonido de "clack" y actualiza el estado. El tutorial celebra ("¡Bien!") y avanza al Paso 3.
*   **NO (Error)**: El Overlay **consume** el evento. El tablero de juego ni se entera de que hubo un toque. El Overlay muestra un mensaje de error ("¡No! Tienes que tocar la isla que está parpadeando") y agita la mano indicadora.

Esta separación de poderes (El Juego juega, el Tutorial supervisa) es lo que nos permite escalar. Podemos poner este Overlay encima de *Sudoku*, de *Minesweeper* o de *Kakuro* con cambios mínimos, porque el tutorial no necesita saber cómo funciona el juego por dentro, solo necesita saber qué celdas son objetivos válidos.

## Filosofía: Sugerencia vs Prisión

Un último apunte sobre UX/Filosofía. Tuvimos un debate intenso en el equipo sobre si debíamos **obligar** al usuario a terminar la práctica.
*"Si les dejamos saltárselo, no aprenderán. Se frustrarán luego y desinstalarán"*, argumentaba una parte de mi cerebro.
Implementamos un bloqueo duro. El botón "Atrás" estaba deshabilitado hasta que acabaras.

Fue un error.
Los usuarios avanzados (que ya conocían el juego y solo querían ver la UI) se sentían atrapados. "Sé jugar a Hashi, déjame en paz".
Cambiamos a un modelo de **Sugerencia Fuerte**.
Ahora, puedes intentar salir en cualquier momento.
Pero si lo haces antes de graduarte, te mostramos un Dialog (Modal) con un copy muy pensado:
*"¿Seguro que quieres irte? Saltar la práctica suele acabar en lágrimas y Game Overs tristes en los niveles Difíciles. Tú verás."*

El botón "Salir de todas formas" está ahí. Habilitado.
Respetamos la autonomía del adulto, pero le informamos claramente del riesgo. Tratamos al usuario como a un socio inteligente, no como a un niño.

## Conclusión

La Semana 06 no ha sido sobre añadir juegos. Ha sido sobre añadir **jugadores**.
Porque un juego sin jugadores que entiendan las reglas no es un juego, es un salvapantallas interactivo confuso y hostil.
Con el nuevo Motor de Tutoriales Modular y la Ceremonia de Graduación, estamos listos para abrir las puertas de nuestros juegos más complejos (*Akari*, *Fillomino*) al gran público.

La próxima semana: Escalado masivo. Tenemos la fábrica lista, ahora toca producir. 11 tutoriales en 7 días. Deseadnos suerte (y mucho café).

---
*Fin del reporte semanal.*
