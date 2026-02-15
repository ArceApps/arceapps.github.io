---
title: "2026 W01: Limpieza de Casa y Cimientos Sólidos (Versión Extendida)"
description: "Arrancamos el año poniendo orden en el caos. Una crónica técnica sobre cómo desmontamos un ViewModel de 600 líneas, unificamos la lógica del tiempo con Flows y mejoramos la accesibilidad invisible de Slitherlink."
pubDate: 2026-01-07
tags: ["devlog", "refactoring", "hitori", "accessibility", "clean-architecture", "technical-debt", "kotlin"]
heroImage: "/images/devlog-w01-refactoring.svg"
---

Arrancar el año programando se siente un poco como limpiar el garaje un domingo por la mañana de resaca.
Sabes que tienes que hacerlo.
Miras la montaña de cajas (o de `TODOs`) acumulada durante el frenesí de diciembre y sientes una mezcla de pereza existencial y deber moral.
*"Podría dejarlo así"*, te susurra el diablo de la procrastinación. *"El código funciona. Nadie va a ver el backend. Y total, si no lo tocas, no se rompe"*.

Pero tú sabes la verdad. Sabes que esa bicicleta oxidada (ese `ViewModel` monolítico) te hará tropezar en marzo. Sabes que esa caja de cables (esa lógica de base de datos duplicada) te costará tres días de debug en mayo.
Así que te pones los guantes, respiras hondo y empiezas a tirar cosas a la basura.

Esa ha sido la energía de esta primera semana de 2026 en **PuzzleSuite**.
No hemos añadido grandes features visibles. No hay nuevos juegos deslumbrantes.
Pero hemos bajado al sótano con una linterna y una pala, y hemos empezado a limpiar los cimientos.

## El Monstruo en el ViewModel de Hitori

El lunes abrí `HitoriGameViewModel.kt` con la intención inocente de añadir un simple Logro ("Completa 5 partidas seguidas").
Lo que encontré allí me hizo querer cerrar el portátil y hacerme granjero.

El archivo había crecido orgánicamente (eufemismo para "caóticamente") durante las vacaciones.
Había un método en particular, `updateStatsOnCompletion()`, que había cobrado vida propia.
Eran 67 líneas de lógica *inline* que mezclaban todo lo que está prohibido mezclar en una arquitectura sana:
1.  **Estado Mutable**: Cálculos de rachas (`currentStreak++`) basados en variables locales.
2.  **Persistencia**: Llamadas directas al DAO (`dao.update(...)`) sin pasar por un repositorio.
3.  **Lógica de UI**: Efectos secundarios directos (`_uiState.value = ...`).
4.  **Matemáticas de Tiempo**: Conversiones de milisegundos a segundos dispersas por el código.

Era un **espagueti de código imperativo**.
El problema no es que fuera "feo". El código feo que funciona es aceptable.
El problema es que era **rígido y peligroso**.
Si quería implementar un botón de "Resolver" (para debug), tenía que duplicar toda esa lógica o hacer malabares con flags booleanos para evitar doblar las estadísticas.
Si quería testear la lógica de las rachas, tenía que instanciar todo el `ViewModel` con sus dependencias de Android (Contexto, SavedStateHandle), lo cual es lento y doloroso.

Decidí aplicar **Clean Architecture** de manual. No por purismo académico, sino por pura supervivencia mental.
Creé un Caso de Uso (UseCase) específico: `ProcessHitoriGameCompletionUseCase`.

```kotlin
// Antes: Un ViewModel haciendo de todo (El Hombre Orquesta)
fun updateStatsOnCompletion(isWin: Boolean) {
    if (isWin) {
        // Bloqueante en Main Thread? Quizás.
        val currentStats = statsDao.getStatsSync() 
        val newStreak = currentStats.streak + 1
        
        // Lógica de negocio mezclada con lógica de presentación
        if (newStreak > currentStats.bestStreak) {
             // ... más lógica anidada ...
        }
        
        dao.update(currentStats.copy(streak = newStreak))
        _uiState.update { it.copy(showConfetti = true) }
    }
}
```

La solución fue extraer toda esa complejidad a una clase pura de Kotlin.
Ahora, el ViewModel es un "Director de Orquesta" que solo delega:

```kotlin
// Después: Delegando como un jefe
fun onGameFinished(result: GameResult) {
    viewModelScope.launch {
        // Toda la lógica sucia vive aquí dentro, testada y aislada
        val outcome = processGameCompletionUseCase(puzzle, result)
        
        // El ViewModel solo reacciona al resultado puro
        if (outcome.isNewRecord) {
            _uiState.update { it.copy(showNewRecordBadge = true) }
        }
    }
}
```

El resultado fue una reducción del **70% del código** en el ViewModel.
Pero lo más importante es la **paz mental**.
Ahora, la lógica de negocio ("¿Qué pasa cuando ganas?") vive en una clase sin dependencias de Android (`android.*`), que se puede testear en milisegundos con JUnit.
Se siente bien ver los tests pasar a la primera en verde. Es como ver el suelo del garaje limpio después de barrer.

## La Tiranía del Tiempo (Unificando Cronómetros con Flows)

Mientras limpiaba Hitori, me di cuenta de otro patrón repetitivo: **El Tiempo**.
Teníamos tres implementaciones diferentes de cronómetros en la app, cada una programada por una persona distinta (o por mí en días distintos):
1.  `CountUpTimer`: Un `while(true) { delay(1000) }` básico.
2.  `CountDownTimer`: Un wrapper sobre la clase de Android (malo para Compose).
3.  `Stopwatch`: Una implementación compleja con `System.nanoTime()`.

Cada uno tenía sus propios bugs. Algunos no se pausaban al minimizar la app. Otros perdían precisión al rotar la pantalla.
Era una violación flagrante del principio **DRY** (Don't Repeat Yourself).

Dediqué el miércoles a crear el `SharedTimerComponent` (`TASK-2026-003`).
En lugar de usar hilos o callbacks, usamos el poder de **Kotlin Flows**.
El cronómetro ahora es un "emisor de verdad" al que te suscribes.

```kotlin
// El corazón del nuevo reloj
class GameTimer {
    private val _time = MutableStateFlow(0L)
    val time: StateFlow<Long> = _time.asStateFlow()

    fun start() {
        tickerJob = scope.launch {
            while(isActive) {
                delay(1000)
                _time.value++
            }
        }
    }
    
    // Lo importante: Integración con el Ciclo de Vida
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun pause() { tickerJob?.cancel() }
}
```

Ahora, todos los juegos consumen este mismo componente.
Si arreglamos un bug de precisión en Hitori, se arregla gratis en Sudoku y Buscaminas.
Es ingeniería aburrida, sí. No venderá más copias. Pero es la clase de ingeniería que te permite dormir tranquilo por las noches sabiendo que el tiempo no se "romperá" aleatoriamente.

## Accesibilidad Invisible: Slitherlink y TalkBack

El otro foco de la semana fue **Slitherlink**.
Como desarrolladores videntes, diseñamos para los ojos. Agrupamos información visualmente usando espacios y colores.
Pero para un usuario ciego, la pantalla es una lista lineal de elementos a leer.

Activé **TalkBack** (el lector de pantalla de Android) para probar la accesibilidad de la pantalla de Estadísticas.
La experiencia fue dolorosa, casi insultante.
El lector leía las estadísticas como elementos robóticos y desconectados:
*"Texto: Jugados"* -> Swipe -> *"Texto: 10"* -> Swipe -> *"Texto: Ganados"* -> Swipe -> *"Texto: 8"*.
Navegar por una tabla de 5 filas requería 20 gestos de swipe. Era tedioso y cognitivamente agotador.

La solución técnica fue ridículamente simple, pero el impacto humano es enorme.
Usamos la API de **Semántica** de Compose para "fusionar" nodos.

```kotlin
// El 'Abrazo Semántico'
Row(
    modifier = Modifier
        .semantics(mergeDescendants = true) { 
            // Esto le dice a TalkBack: 
            // "No leas los hijos por separado. Trata esto como UNA sola frase".
        }
) {
    Text("Partidas Ganadas", style = LabelStyle)
    Text("85%", style = ValueStyle)
}
```

Ahora, cuando el foco de accesibilidad llega a esa fila, el usuario escucha:
*"Partidas Ganadas: 85%"*. Un solo grupo. Una sola idea.
Es un cambio de una línea de código (`mergeDescendants = true`).
Pero cambia drásticamente la experiencia de dignidad y eficiencia para alguien que no puede ver la pantalla.
Me hizo reflexionar sobre cuántas barreras invisibles creamos sin querer simplemente por no "cerrar los ojos" y probar nuestra propia app durante cinco minutos.

## Reflexión de la Semana

Esta semana no hemos subido nada a la Play Store.
No hay capturas de pantalla nuevas para enseñar en Twitter.
Si le enseñas el código de hoy a un usuario promedio (o a un Product Manager impaciente), te dirá que "está igual que ayer".

Pero bajo la superficie, todo ha cambiado.
Hemos pagado la deuda técnica de las prisas de diciembre.
Hemos establecido patrones (Clean Architecture, SharedComponents) que usaremos el resto del año.
A veces el trabajo más productivo es el que no se ve. Es el trabajo de cimentación.
Porque no puedes construir un rascacielos sobre un pantano de código espagueti.

La semana que viene, volvemos a construir hacia arriba. Pero esta semana, hemos disfrutado cavando hacia abajo.

---
*Fin del reporte semanal.*
