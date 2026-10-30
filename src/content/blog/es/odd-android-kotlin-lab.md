---
title: "ODD en Android: Kotlin, pruebas y un caso realista"
description: "Aplica ODD a una app Android ficticia: programa rachas en Kotlin, comprueba cinco casos en JVM y diseña tests de Room y Compose sin inventar resultados."
pubDate: 2026-10-30
lastmod: 2026-10-30
author: "ArceApps"
keywords: ["ODD", "Organic Driven Development", "Android", "Kotlin", "JUnit", "Room", "Jetpack Compose"]
canonical: "https://arceapps.com/es/blog/odd-android-kotlin-lab/"
heroImage: "/images/odd-android-kotlin-lab.webp"
tags: ["ODD", "Android", "Kotlin", "Testing", "Jetpack Compose", "Room"]
reference_id: "d7fab46b-e6d7-437e-94ea-402aacd1dd7c"
---

> **Este es un laboratorio didáctico, no una aplicación comercial existente.** La app «Brújula» y su repositorio son ficticios. La portada es una ilustración conceptual generada con IA, no una captura de una aplicación real. El núcleo Kotlin que aparece abajo sí se ha compilado y ejecutado de forma aislada con Kotlin/JVM 1.9.0 y Java 21; las pruebas JUnit, Compose, Room y el build Android son ejemplos preparados para un proyecto real, **no ejecuciones realizadas**. Para entender el porqué del método antes de usarlo, empieza por [ODD frente a SDD](/es/blog/odd-vs-sdd-organic-development/). También sirven de contexto [IA + TDD en Android](/es/blog/ia-tdd-android/) y [SDD + TDD como bucle de aceptación](/es/blog/sdd-tdd-acceptance-loop/).

## Un proyecto Android ficticio como banco de pruebas del método

Imagina una aplicación mínima llamada **Brújula**, pensada para registrar hábitos cotidianos. La pantalla inicial muestra una tarjeta por hábito, la fecha de hoy, la racha acumulada y un botón para marcar que lo hemos completado. No habrá cuenta, servidor, publicidad ni sincronización. El propósito no es vender una nueva app imaginaria, sino observar cómo cambia nuestra forma de trabajar cuando dejamos que Organic Driven Development ajuste el proceso a cada petición.

El comportamiento deseado parece elemental: tocas «Completar hoy» y la racha sube. Inmediatamente aparecen situaciones que un agente puede pasar por alto: tocar dos veces, repetir un evento tras recrear la Activity, reabrir la app, cambiar de día, saltarse dos días, mover el reloj hacia atrás y conservar el estado sin conexión. Son problemas interesantes porque algunos se pueden resolver con un test puro de Kotlin y otros obligan a hablar de persistencia y arquitectura.

Para no fingir una prueba end-to-end que no hemos hecho, dividiremos el ejercicio en tres capas. La primera es un **reductor de dominio puro** que recibe un estado y un día y devuelve un resultado. Esta capa se puede compilar fuera de Android y tiene pruebas deterministas. La segunda sería el repositorio persistente, por ejemplo mediante Room; describiremos su contrato y las comprobaciones necesarias, sin presentar pseudocódigo como solución ya probada. La tercera sería la UI con Jetpack Compose, cuyos tests instrumentados requerirían un dispositivo o emulador.

El interés de ODD no consiste en escribir un tipo especial de Kotlin. Consiste en decidir cuándo observar código, cuándo conservar decisiones, cuándo preguntar por una regla del producto y cómo comunicar las pruebas realmente ejecutadas. Este laboratorio utiliza la definición de [Gentle-AI](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md), cuyo protocolo es autorización, exploración, resolución de incertidumbre, clasificación, seguimiento si procede, implementación y cierre.

Las cifras y las fechas de ejemplo sirven solo para que las pruebas sean reproducibles. No representan usuarios, resultados de producción ni métricas de una app existente. Tampoco afirmo que este artículo reproduzca automáticamente todo el comportamiento interno de Gentle-AI: aplicaremos manualmente sus principios a un cambio ficticio y valoraremos sus límites.

## La petición inicial y la primera clasificación

El usuario ficticio nos pide: «Al tocar Completar hoy, quiero que la racha aumente, pero que repetir la pulsación no cuente dos veces. Si no completo el hábito un día, la siguiente racha empieza en uno». Es una petición de implementación, de modo que supera la primera frontera de ODD: **tenemos autorización para cambiar código**. Si solo hubiese preguntado por alternativas, no la tendríamos.

El siguiente paso es explorar un repositorio, pero como aquí no existe uno real, debemos declarar su estructura **propuesta** en lugar de afirmar que hemos inspeccionado archivos inexistentes. Imaginamos un módulo app con una capa domain, un adaptador de persistencia en data y una UI Compose. Esa organización no es un mandato arquitectónico de ODD ni una excusa para crear módulos Gradle innecesarios. Es suficiente para separar la regla temporal de Android, de la base de datos y del renderizado.

Antes de escribir la primera función aparece una incertidumbre legítima: «¿Qué significa hoy?». Podría ser la fecha local del dispositivo, la del servidor, una zona horaria elegida por el usuario o una fecha calculada en UTC. Para una app completamente local y sin cuentas escogeremos explícitamente la **fecha local del dispositivo al ejecutar la acción**. El dominio recibirá un LocalDate ya resuelto por otra capa; así podremos probar cualquier día sin manipular el reloj del ordenador.

Otra regla es el comportamiento con fechas anteriores a la última completada. En lugar de recalcular retrospectivamente la racha, el ejercicio las rechaza sin modificar el progreso. Esto es una **decisión del caso ficticio**, no una propiedad universal de ODD. En una app real habría que abordar cambios de zona horaria, modificaciones manuales del reloj y la posibilidad de editar el historial. El ejemplo no promete resolver esos escenarios.

¿Es una tarea pequeña o sustancial? El núcleo de cálculo, una vez acordadas las reglas, puede recuperarse con la petición y el diff, y su estado se verifica con tests puros. Es un caso pequeño. Sin embargo, el requisito «que siga funcionando después de cerrar la app» introduce almacenamiento y potenciales carreras entre pulsaciones. Esa segunda parte ya merece un documento durable y un plan de pruebas de integración. El mismo producto contiene trabajo con dos clasificaciones distintas.

## Tarea pequeña: corregir una doble pulsación

Comenzamos con el dominio, deliberadamente sin Android Context, Room, ViewModel ni corrutinas. La función recibe un progreso anterior y un día. Devuelve uno de tres resultados: se registró una nueva completitud, ya estaba registrada ese día o se rechazó una fecha anterior. El objeto de estado no se modifica en el sitio: se produce una nueva instancia cuando corresponde.

~~~kotlin
import java.time.LocalDate

data class HabitProgress(
    val lastCompletedDay: LocalDate? = null,
    val streak: Int = 0,
)

sealed interface CompletionResult {
    data class Recorded(val progress: HabitProgress) : CompletionResult
    data class AlreadyRecorded(val progress: HabitProgress) : CompletionResult
    data class RejectedPastDay(val progress: HabitProgress) : CompletionResult
}

object HabitStreak {
    fun record(progress: HabitProgress, day: LocalDate): CompletionResult {
        val last = progress.lastCompletedDay
        if (last == day) return CompletionResult.AlreadyRecorded(progress)
        if (last != null && day.isBefore(last)) {
            return CompletionResult.RejectedPastDay(progress)
        }
        val nextStreak = if (last != null && last.plusDays(1) == day) {
            progress.streak + 1
        } else {
            1
        }
        return CompletionResult.Recorded(
            progress.copy(lastCompletedDay = day, streak = nextStreak)
        )
    }
}
~~~

La decisión importante no es si un sealed interface resulta elegante. Lo importante es que el resultado expresa explícitamente por qué una acción no cambia el estado. Eso permite mostrar un mensaje adecuado en UI, registrar una incidencia sin ambigüedad o distinguir un reintento inocente de un evento temporal inconsistente. Un booleano habría perdido demasiada información.

La función acepta como premisa que el estado recibido procede de un almacenamiento válido: la racha no es negativa y la fecha no contradice su historial. En producción habría que defender ese límite al leer la base de datos o añadir invariantes al constructor. No fingiremos que la función resuelve corrupción de almacenamiento, modificaciones concurrentes o sincronización entre dispositivos. Son otras responsabilidades, con otros tests.

También hay una consideración Android: LocalDate pertenece a java.time. Si soportamos versiones de Android anteriores a API 26, necesitamos comprobar la configuración de desugaring de Java 8+ o escoger una configuración compatible. En una app nueva no elegiría un mínimo de SDK a ciegas por comodidad del ejemplo. El modelo de dominio sigue siendo fácil de probar porque la zona horaria queda fuera de él.

Este código ilustra una decisión muy ODD: una regla estable, sin dependencias externas, no necesita una arquitectura de seis interfaces. Podemos implementar y verificar directamente la función. Añadir complejidad para demostrar que conocemos Clean Architecture sería confundir la herramienta con el objetivo.

## Pruebas: cinco comportamientos observables, no cinco métodos internos

Antes de considerar terminada la función necesitamos comprobar exactamente las reglas acordadas. La tabla siguiente sirve como mini contrato de aceptación y permite entender las pruebas sin ejecutar Android. El 27, 28 y 30 de octubre son fechas de ejemplo elegidas para reproducir saltos de día.

| Caso | Estado de entrada | Acción | Resultado esperado |
| --- | --- | --- | --- |
| Primer registro | Sin fecha, racha 0 | Completar 27/10 | Racha 1, último día 27/10 |
| Pulsación repetida | 27/10, racha 1 | Completar 27/10 | Sin cambios, AlreadyRecorded |
| Día consecutivo | 27/10, racha 1 | Completar 28/10 | Racha 2 |
| Salto de día | 27/10, racha 1 | Completar 30/10 | Racha 1 |
| Fecha anterior | 28/10, racha 2 | Completar 27/10 | Sin cambios, RejectedPastDay |

En un proyecto Android con JUnit 4 configurado, los tests unitarios JVM pueden usar las aserciones siguientes. Se trata de código de ejemplo preparado, **no de un informe de Gradle ejecutado**.

~~~kotlin
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HabitStreakTest {
    private val day1 = LocalDate.parse("2026-10-27")
    private val day2 = LocalDate.parse("2026-10-28")
    private val day4 = LocalDate.parse("2026-10-30")

    @Test fun firstCompletionStartsAtOne() {
        val result = HabitStreak.record(HabitProgress(), day1)
        assertEquals(1, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun repeatedDayDoesNotIncrement() {
        val first = CompletionResult.Recorded(HabitProgress(day1, 1))
        val result = HabitStreak.record(first.progress, day1)
        assertEquals(first.progress,
            (result as CompletionResult.AlreadyRecorded).progress)
    }

    @Test fun consecutiveDayIncrements() {
        val result = HabitStreak.record(HabitProgress(day1, 1), day2)
        assertEquals(2, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun skippedDayResets() {
        val result = HabitStreak.record(HabitProgress(day1, 5), day4)
        assertEquals(1, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun pastDayIsRejected() {
        val old = HabitProgress(day2, 2)
        val result = HabitStreak.record(old, day1)
        assertEquals(old, (result as CompletionResult.RejectedPastDay).progress)
        assertTrue(result is CompletionResult.RejectedPastDay)
    }
}
~~~

Hay una sutileza en el test del salto: utilizamos una racha previa de cinco para demostrar que el nuevo valor no depende accidentalmente del anterior cuando falta un día. Eso comprueba mejor la regla que empezar siempre desde uno. También comprobamos que en los resultados sin escritura el progreso devuelto es el mismo, no simplemente que una etiqueta de error tenga el nombre esperado.

Si queremos seguir TDD estrictamente, el proceso ideal sería escribir cada expectativa, observar el fallo contra una implementación ausente o incompleta, introducir el cambio mínimo y volver a ejecutar. Para este artículo **no afirmamos haber registrado un ciclo rojo-verde de JUnit**. Lo que sí podemos hacer es validar el algoritmo sin fingir disponer de un proyecto Android completo.

He creado una comprobación independiente con Kotlin/JVM 1.9.0 y JRE 21. El archivo HabitStreak.kt contiene exactamente la función anterior, y un Check.kt separado ejecuta cinco aserciones equivalentes mediante check(). Compilación y ejecución usadas:

~~~bash
kotlinc HabitStreak.kt Check.kt -include-runtime -d check.jar
java -jar check.jar
~~~

La salida **observada en este laboratorio aislado** fue:

~~~text
PASS: first, repeated, consecutive, skipped and past-day checks
~~~

Esto prueba que el algoritmo y esos cinco escenarios son ejecutables en JVM con la versión indicada. No prueba que un build Android pase, que Compose se muestre correctamente o que Room sea transaccional. La precisión de esa distinción es una parte esencial del cierre de ODD: informar de la evidencia y de sus límites sin exagerarlos.

![Separación entre comprobaciones de dominio, persistencia y UI](/images/odd-android-checks-es.svg)

*Diagrama de las tres capas del laboratorio: solo el núcleo Kotlin/JVM tiene una ejecución observada aquí; las demás comprobaciones se proponen para un proyecto Android completo.*

## La segunda petición cambia la clasificación

El usuario ficticio añade: «Quiero que la racha se conserve después de cerrar la app, incluso sin conexión, y que una pulsación doble no registre dos operaciones». Esta frase altera bastante el problema. Ya no basta con que una función de memoria produzca el estado correcto. Necesitamos una fuente de verdad persistente y evitar que dos lecturas simultáneas escriban un resultado incorrecto.

Imaginemos que una pulsación A lee racha 3 y fecha de ayer. Antes de guardar, otra pulsación B lee exactamente lo mismo. Ambas calculan racha 4. Si guardan por separado, quizá la base quede en 4 y no en 5, lo que parece aceptable para el contador. Pero si hay un registro de completitudes, dos efectos secundarios o una sincronización posterior, la operación puede duplicarse. Un test puramente funcional del reductor no descubre este tipo de problema.

Ahora el criterio de recuperación de ODD cambia. Si paramos el trabajo a mitad, el diff no nos dirá por qué hemos elegido una clave única, qué política de zona horaria seguimos ni qué garantías esperamos de Room. Es trabajo sustancial y autorizado: conviene crear un registro durable **antes de la primera modificación** del almacenamiento, con reglas, tareas y evidencia enlazadas.

La primera tentación sería escribir un repositorio genérico, introducir Retrofit «por si algún día hay nube», crear varias abstracciones de dominio y configurar una arquitectura multicapa con decenas de clases. No lo haría. La petición dice sin conexión, pero no exige servidor. La solución debe usar el almacenamiento existente, o Room si esa es la tecnología adoptada, con el menor número de capas coherente con la base de código real.

Tampoco conviene inventar el rendimiento. No afirmamos que esta solución ahorre batería, soporte millones de hábitos o permita múltiples dispositivos sincronizados. Esas propiedades necesitarían otras métricas, requisitos y escenarios. ODD no autoriza prometerlas porque el diseño parezca limpio.

## El documento de feature que sí merece existir

La documentación de Gentle-AI propone mantener especificaciones, tareas y log en un único documento bajo odd/tasks. En un repositorio propio podría utilizarse otra ruta, siempre que exista una fuente única y reconocible. El propósito es que cualquier agente pueda reanudar con la intención exacta y las comprobaciones pendientes. Este fragmento es inventado, pero sigue la lógica del protocolo.

~~~markdown
# Feature: rachas persistentes sin duplicados

## Specs
S1. "Al volver a abrir la app, la racha sigue igual".
Aceptación: completar un día, recrear el repositorio
y recuperar la misma fecha y racha.

S2. "Una pulsación repetida no suma dos veces".
Aceptación: dos operaciones para el mismo hábito y día
dejan una sola completitud persistida.

S3. "Funciona sin conexión".
Aceptación: completar un hábito sin red y recuperar
el estado local tras reiniciar el proceso.

S4. La fecha local se captura una vez por operación.
Aceptación: la misma operación no cambia de día
durante sus lecturas y escrituras.

## Tasks
T1 → S1/S3: contrato de persistencia y test de reapertura.
T2 → S2: restricción única y test de dos intentos.
T3 → S4: inyección de reloj y test de frontera del día.
T4 → S1/S2/S3/S4: verificación UI y revisión del diff.

## Log
L1. Petición original y alcance autorizado.
L2. Decisión: fecha local; sin servidor ni sincronización.
L3. Pendiente: pruebas en Android y migraciones.
~~~

La especificación está escrita en términos observables, no exige de antemano un DAO llamado de cierta manera. Eso permite adaptarse al código real. Si el repositorio ya tiene una transacción para completar tareas, reutilizarla es mejor que diseñar otra. Si los tests muestran que falta una restricción de unicidad, la añadimos a la solución, no a un archivo paralelo que nadie leerá.

La clave es convertir S1 y S2 en pruebas reproducibles. Para S1 haría una escritura, destruiría el objeto de repositorio o la conexión de base de datos y reconstruiría la capa de lectura, comprobando los valores. Para S2 forzaría llamadas repetidas y concurrentes; comprobaría el número de registros, no solo el texto de un mensaje. Si el sistema usa una tabla de eventos, una restricción única por habitId y día es una defensa importante.

La zona horaria requiere una decisión más precisa en una app real. Si el usuario cruza un huso horario cerca de medianoche, la fecha local de la operación puede diferir de la del día anterior en minutos. La política de negocio debe expresarlo. La prueba T3 debería recibir un Clock inyectado y una ZoneId elegida, capturar la fecha una sola vez y no depender del reloj real. Este es un buen ejemplo de incertidumbre material que sí justifica preguntar si el producto no la resolvió.

En la guía oficial de [pruebas de corrutinas Android](https://developer.android.com/kotlin/coroutines/test), Google recomienda runTest y despachadores de prueba cuando hay tareas asíncronas. Si nuestro repositorio expone operaciones suspend, las pruebas pueden usar ese mecanismo para controlar el tiempo virtual. No introduce automáticamente transacciones en la base: hay que probarlas por separado.

## Persistencia con Room: una propuesta, no un resultado probado

Podríamos modelar las completitudes por hábito y día mediante una tabla con una clave compuesta. A nivel conceptual, cada fila tendría un identificador de hábito y un LocalDate convertido en un formato estable. Un índice o clave primaria compuesta impediría dos registros idénticos para el mismo hábito y fecha. Un agregador calcularía la racha o mantendría un estado derivado que tendría que actualizarse de forma consistente.

Una entidad ilustrativa, usando anotaciones de Room, podría ser:

~~~kotlin
import androidx.room.Entity

@Entity(
    tableName = "habit_completions",
    primaryKeys = ["habitId", "localDay"]
)
data class HabitCompletionEntity(
    val habitId: String,
    val localDay: String, // ISO-8601: yyyy-MM-dd
)
~~~

Este ejemplo define una restricción de unicidad en el esquema, pero **no** constituye un repositorio persistente completo. Hay que decidir cómo insertar con conflictos, cómo convertir LocalDate, cómo calcular la racha a partir de registros pasados y qué garantías ofrece la transacción escogida. No se ha construido aquí una base Room ni se han ejecutado tests instrumentados. Si un agente escribiera «persistencia verificada» en estas condiciones, estaría faltando a la verdad.

Un diseño de prueba importante es intentar insertar la misma clave dos veces y verificar que la tabla contiene una sola fila. Otro es simular dos operaciones concurrentes y comprobar tanto el número de completitudes como el estado materializado, si existe. Otro más es reiniciar el proceso y comprobar la lectura posterior. Los casos deberían ejecutarse contra la implementación real y, cuando proceda, en un dispositivo o emulador.

Si estamos añadiendo Room a una app existente, no podemos olvidar las migraciones. La guía de [Android Developers sobre pruebas de base de datos](https://developer.android.com/training/data-storage/room/testing-db) advierte que las migraciones incorrectas pueden provocar fallos y pérdida de datos. Hay que crear fixtures de la versión anterior y comprobar la actualización. Si el proyecto ya tenía almacenamiento, sustituirlo sin migración para simplificar el tutorial sería un ejemplo de lo que no debemos hacer.

Un detalle de arquitectura: la UI no debería calcular ni modificar directamente la racha. La operación entra por una función del repositorio que encapsula la transacción y aplica reglas de dominio. La pantalla recibe un estado ya resuelto y muestra si hoy está completado. Así, una Activity recreada no añade una operación nueva por el mero hecho de recomponerse.

## Compose: comprobar el comportamiento visible

Una pantalla mínima podría recibir un estado de UI con nombre del hábito, racha y un indicador de completado. El botón utiliza un callback y se deshabilita cuando la completitud ya consta para el día actual. No necesitamos que el Composable conozca la fecha de la base de datos, ni que navegue hacia un servidor. Su responsabilidad es mostrar y enviar una intención.

~~~kotlin
data class HabitUiState(
    val name: String,
    val streak: Int,
    val completedToday: Boolean,
)

@Composable
fun HabitCard(state: HabitUiState, onComplete: () -> Unit) {
    Column {
        Text(state.name)
        Text("Racha: " + state.streak)
        Button(
            onClick = onComplete,
            enabled = !state.completedToday,
            modifier = Modifier.testTag("complete-button"),
        ) {
            Text("Completar hoy")
        }
    }
}
~~~

Este es un fragmento ilustrativo que presupone los imports de Material 3, Compose layout y testing. En una app real no dejaríamos el texto visible hardcodeado: lo llevaríamos a recursos localizados, y usaríamos plurales para «día/días». El ejemplo se centra en la ruta del estado, no en enseñar una pantalla terminada ni en sustituir una guía de accesibilidad.

Una prueba de UI preparada para androidTest podría verificar que un hábito completado deshabilita la acción:

~~~kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun completedHabitDisablesAction() {
    composeRule.setContent {
        HabitCard(
            state = HabitUiState("Leer", 4, completedToday = true),
            onComplete = {},
        )
    }
    composeRule.onNodeWithTag("complete-button").assertIsNotEnabled()
}
~~~

Para ejecutarla necesitaríamos las dependencias de testing de Compose, un proyecto configurado y el entorno de instrumentación apropiado. Por eso no la contamos entre las pruebas observadas. La [documentación oficial de Compose testing](https://developer.android.com/develop/ui/compose/testing) explica las reglas, las semánticas, la sincronización y el uso de tags. Un test que solo inspecciona el botón tampoco demuestra idempotencia de la base: cada capa tiene su contrato.

La verificación manual debería revisar tamaños de letra grandes, modo oscuro, idiomas, orientación y ancho reducido. Si la UI ofrece un mensaje cuando se rechaza una fecha antigua, conviene hacerlo accesible y localizable. Nada de esto necesita convertir el proyecto en una arquitectura de demostración; solo exige no confundir la prueba de un Composable con una prueba completa del producto.

## El cierre ODD con evidencia y límites honestos

Cuando termina una unidad de trabajo, el cierre debe ser legible para otro desarrollador. En nuestro caso diría: el cálculo de racha tiene una implementación pura, se ha compilado con Kotlin/JVM 1.9.0 y se han observado cinco aserciones satisfactorias. El ejemplo JUnit está escrito, pero no se ha ejecutado con Gradle. La base Room, la transacción, las pruebas de concurrencia, las migraciones y el Composable son material didáctico pendiente de integración y verificación en Android.

No diría que «la feature está al 100 %» ni asignaría un 10/10 de confianza. Nos faltan checks esenciales para afirmar que el requisito de persistencia está resuelto. Precisamente por eso ODD pide que el agente comunique fallos, verificaciones pendientes y el siguiente paso, en lugar de resumirlo todo como un éxito. La confianza nace de una separación precisa entre evidencia, hipótesis y trabajo futuro.

Al llevar esto a un repositorio real, revisaría las acciones de CI existentes antes de lanzar comandos redundantes. Si CI ya compila, ejecuta tests y produce capturas, observaría ese resultado y reservaría la comprobación manual para UX o casos no automatizables. Si el runner no funciona, lo indicaría; no sustituiría su salida con una «revisión visual del código» presentada como build correcto.

También protegería el historial de Git. Un commit para el cálculo del dominio con sus pruebas es revisable. Otro para almacenamiento y migración podría tener sentido cuando el comportamiento está completo. El tamaño orientativo de los work units en Gentle-AI no debería obligarnos a separar artificialmente un cambio atómico, especialmente si ello deja el repositorio en un estado inconsistente.

El cierre ideal contiene enlaces a las pruebas que sí se ejecutaron, versiones del entorno, límites conocidos y el estado del PR. Si un usuario corrige el requisito a mitad, actualizamos únicamente las especificaciones afectadas y reabrimos las tareas relacionadas. Esa recuperación incremental es más útil que volver a empezar con un nuevo plan completo cada vez que aparece un caso borde.

## ¿Qué hemos aprendido del método en este ejercicio?

Primero, que ODD **no es un sustituto de escribir código limpio ni de comprender Android**. Una función pura sigue siendo útil sin agente. Una restricción única sigue siendo necesaria si el problema la exige. Una prueba de migración sigue siendo imprescindible si existen datos que preservar. ODD decide cómo llegar a esas herramientas sin obligar a recorrer todas las fases formales para cualquier modificación.

Segundo, que la clasificación se puede revisar. Lo que parecía una corrección pequeña se convierte en trabajo sustancial cuando añadimos durabilidad y concurrencia. No hace falta declarar un fracaso metodológico: el agente actualiza el nivel de seguimiento al descubrir nueva información. Lo importante es que el nuevo alcance quede explícito y que las tareas anteriores verificadas no se desechen sin motivo.

Tercero, que el test es una herramienta de comunicación, además de una herramienta de detección. La tabla de cinco escenarios explica el producto mejor que una descripción abstracta de «gestión de rachas». Las aserciones permiten comprobar que una pulsación repetida no suma, que un día consecutivo sí suma y que una fecha anterior se rechaza. El código de producción es pequeño porque el contrato está claro.

Cuarto, que la evidencia tiene grados. Compilar el dominio con kotlinc no equivale a ejecutar Gradle. Un test de JUnit preparado no equivale a un test superado. Una entidad Room con clave compuesta no equivale a una transacción verificada. Un Composable con botón deshabilitado no equivale a una UI accesible en todos los dispositivos. Reconocer esos límites aumenta la utilidad del resultado.

Quinto, que el documento durable debe aparecer cuando aporta recuperación real. Para la función de rachas, la petición, las pruebas y el diff son suficientes. Para persistencia, la definición de «hoy», la clave única, las operaciones concurrentes, la migración y las verificaciones pendientes necesitan una fuente visible. ODD intenta preservar esa diferencia sin imponer una ceremonia universal.

Y sexto, que el criterio humano sigue siendo necesario en decisiones de producto. Si Brújula algún día permitiera corregir días anteriores, sincronizar dispositivos o importar un historial, este algoritmo dejaría de ser un modelo suficiente. El agente no debería extrapolar esas funcionalidades por iniciativa propia. Debería exponer la incertidumbre, ofrecer opciones y aplicar la decisión autorizada.

## Un itinerario de implementación en un Android real

Si quisiera convertir este laboratorio en una app funcional, empezaría creando un proyecto Android pequeño con Kotlin y Compose y comprobando su configuración existente. Integraría HabitProgress, CompletionResult y HabitStreak como lógica pura; añadiría los tests unitarios del contrato, ejecutaría el runner real y corregiría cualquier fallo. Antes de persistir, revisaría si el proyecto ya dispone de Room u otra solución que convenga reutilizar.

Después escribiría el documento ODD de la funcionalidad persistente y lo vincularía a una issue. Implementaría la tabla y su política de conflicto, definiría el adaptador que convierte entre fecha local y almacenamiento y escribiría pruebas de inserción repetida, reinicio y concurrencia. Si hay datos previos, añadiría pruebas de migración desde cada versión soportada. No habría merge mientras fallen las comprobaciones relevantes.

En la pantalla, el ViewModel observaría el estado persistido y enviaría el comando de completar una sola vez por acción del usuario. El Composable no lanzaría escrituras en cada recomposición. Comprobaría botón, mensaje, rotación, tema, fuentes y cadenas traducidas. Por último examinaría el diff completo buscando código muerto, duplicación, dependencias innecesarias y secretos, y dejaría que CI verificara lo automatizable.

No hay una fórmula que obligue a convertir este itinerario en diez artefactos separados. La pregunta es si otro agente podría continuar mañana con claridad y si el estado del repositorio permite demostrar que los requisitos se cumplen. Si la respuesta es afirmativa, la documentación ya es suficiente. Si es negativa, tenemos una carencia real que resolver, no una casilla burocrática más.

El ejercicio tampoco recomienda habilitar automáticamente acciones de publicación a un agente con acceso al código. La implementación autorizada y la publicación son permisos distintos. Para una app en Play Store o para un repositorio que publica una web, los controles de entrega y privacidad se definen por separado.

## Bibliografía y lecturas relacionadas

- [Gentle-AI, documentación primaria de ODD](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md): clasificación por recuperación, seguimiento, implementación y cierre; puede incluir cambios aún no publicados.
- [Gentle-AI, repositorio](https://github.com/Gentleman-Programming/gentle-ai): origen del protocolo y contexto del ecosistema.
- [Android Developers, probar corrutinas](https://developer.android.com/kotlin/coroutines/test): runTest, despachadores y tiempo virtual para componentes suspend.
- [Android Developers, probar Compose](https://developer.android.com/develop/ui/compose/testing): reglas y API semántica de UI.
- [Android Developers, probar bases Room](https://developer.android.com/training/data-storage/room/testing-db): estado, migraciones y depuración de datos persistentes.
- [Android Developers, guía de arquitectura](https://developer.android.com/topic/architecture): responsabilidades de capas y estado de UI.
- [ArceApps, ODD vs SDD](/es/blog/odd-vs-sdd-organic-development/): comparación y criterio de clasificación del trabajo.
- [ArceApps, SDD + TDD](/es/blog/sdd-tdd-acceptance-loop/): llevar requisitos a comprobaciones ejecutables.

## Cierre: el método se prueba en los detalles

Lo interesante de ODD es que puede hacer que un arreglo siga siendo un arreglo, sin dejar de exigir pruebas. Y puede convertir una feature que parecía sencilla en un trabajo rastreable cuando aparecen datos, concurrencia o decisiones que sobrevivirán a la sesión actual. En Brújula, ambas cosas ocurren con el mismo botón «Completar hoy».

No hemos lanzado una app Android ni ejecutado una prueba de instrumentación. Sí hemos formulado contratos verificables y ejecutado el núcleo Kotlin en JVM, marcando claramente lo que queda. Esa diferencia entre decir «funciona» y decir «esto es exactamente lo que he comprobado» es, para mí, una de las ideas más aprovechables del desarrollo orgánico con agentes.

*Si construyes una pequeña app Android con asistencia de IA, prueba a preguntarte antes de cada cambio: ¿puedo recuperarlo mañana con la petición y el diff?, ¿qué riesgo estoy asumiendo y qué prueba demostraría que no he roto nada? Cuando esas preguntas se responden bien, gran parte de la ceremonia sobra por sí sola.*