---
title: "Prompting Socrático: Razonamiento Maiéutico en Mobile"
description: "Evita el código casi correcto en Android e iOS. Domina el prompting socrático y maiéutico con Gemini, Copilot y Cursor mediante guías de diálogo y código."
pubDate: 2026-07-13
lastmod: 2026-07-14
author: ArceApps
keywords:
  - "Prompting Socrático"
  - "Maieutic Prompting"
  - "Desarrollo Mobile"
  - "Android"
  - "iOS"
  - "AI Agents"
canonical: "https://arceapps.com/es/blog/socratic-maieutic-prompting-mobile-dev/"
heroImage: "/images/socratic-maieutic-prompting-mobile-hero-es.png"
tags: ["IA", "Prompt Engineering", "Android", "iOS", "Kotlin", "Swift", "Maieutic Prompting"]
reference_id: "c87a5611-d102-475f-b52e-d815b83d3d76"
---

## 1. Resumen Ejecutivo

La conversación con un Modelo de Lenguaje de Gran Escala (LLM) no es una simple búsqueda en la web: es una **entrevista clínica**. Desafortunadamente, la mayoría de los programadores mobile la están tratando como si fuera un buscador de Google convencional, enviando prompts planos e imperativos y esperando que la IA adivine la arquitectura de su aplicación.

El método socrático, llevado al prompting de LLMs por Edward Y. Chang en 2023 【1】, y su extensión lógica más profunda, el *Maieutic Prompting* de Jung et al. en 2022 【2】【3】, demuestran que la precisión de las respuestas de razonamiento complejo crece hasta un 20 % cuando el diálogo se estructura en torno a preguntas clarificadoras, verificación de supuestos y razonamiento recursivo, en lugar de instrucciones directas.

Esta guía práctica enseña a los desarrolladores de Android e iOS cómo aplicar este marco sobre las herramientas que ya usan en su día a día (Gemini en Android Studio, GitHub Copilot para Xcode y VS Code, Cursor Composer, Claude Code y JetBrains AI Assistant) para convertir los requisitos vagos en preguntas estructuradas que el modelo sabe resolver con precisión milimétrica.

---

## 2. El Problema de los Prompts Directos en Mobile Dev

El 84 % de los desarrolladores profesionales ya usa herramientas de IA en su flujo diario de trabajo, y el 51 % las toca a diario 【4】. Pero la misma encuesta revela un dato incómodo: el 46 % de los programadores no confía en la precisión de lo que la IA produce, y el 66 % reporta que acaba **depurando código "casi correcto"** más tiempo del que ahorró escribiéndolo 【4】.

En el desarrollo móvil, esta ineficiencia es particularmente cara. Un fragmento de código "casi correcto" en un `LazyColumn` en Android o en un `LazyVStack` en iOS con 10.000 elementos puede pasar desapercibido en el simulador de desarrollo de última generación de la computadora del programador, pero provocará caídas por falta de memoria y pérdida de fotogramas (jank) al ejecutarse en un dispositivo real de gama baja en producción.

La raíz del problema rara vez reside en las capacidades puras del modelo. Reside en el prompt. La gran mayoría de los prompts que se observan en tutoriales típicos —como *"escríbeme un ViewModel en Kotlin usando Hilt y Flow"*— son **instrucciones incompletas**. No definen qué restricciones existen, qué APIs mínimas se soportan, qué comportamiento se espera si el dispositivo pierde la conexión de red, ni qué decisiones arquitectónicas previas ya están tomadas en el proyecto. 

El modelo de lenguaje, en lugar de detenerse a preguntar los detalles faltantes, **asume** lo que le resulta estadísticamente más probable. Esto genera código inconsistente con tu arquitectura real y da pie a errores ocultos.

![Infografía: las tres fases operativas del método socrático](/images/socratic-maieutic-prompting-mobile-fases-es.png)

El método socrático formalizado por Chang en marzo de 2023 【1】 parte de una observación fundamental: **no se puede extraer conocimiento preciso del que pregunta si este no está dispuesto a dejarse cuestionar**. En el prompting, esto significa estructurar la conversación para que el modelo de IA formule las preguntas de especificación antes de empezar a escribir código.

---

## 3. El Método Socrático Aplicado a los LLMs

Edward Y. Chang identifica seis técnicas socráticas que se mapean de forma natural sobre patrones modernos de ingeniería de prompts 【1】:

1. **Definición**: Obligar al modelo a reformular el problema en sus propios términos antes de actuar. Es el fundamento del patrón *Rephrase and Respond* (RaR) 【5】.
2. **Elenchus (Refutación)**: Pedir al modelo que busque contraejemplos a su propia respuesta y evalúe inconsistencias antes de entregar el resultado final.
3. **Dialéctica**: Hacer que el modelo simule una discusión con perspectivas opuestas antes de decidirse por una implementación.
4. **Maiéutica**: Extraer conocimiento latente en el modelo mediante preguntas sucesivas que desglosan la complejidad lógica. Es el núcleo de *Maieutic Prompting* 【2】.
5. **Generalización**: Subir un nivel de abstracción para evaluar si la respuesta funciona en escenarios no contemplados inicialmente.
6. **Razonamiento contrafactual**: Preguntar al modelo *"¿y si en lugar del patrón X hubiéramos utilizado el patrón Y?"* para evaluar trade-offs.

Estas técnicas no son intercambiables. Atacan **fallos específicos** del razonamiento directo: la ambigüedad, la inconsistencia, el sesgo de confirmación y el olvido de casos límite. Mezclar las seis técnicas sin una estructura clara suele degradar la calidad de la inferencia, por lo que es vital aplicarlas de forma modular y por fases.

---

## 4. Las Tres Fases Operativas

Para llevar a la práctica el marco socrático, la conversación con el LLM debe dividirse en tres fases bien delimitadas y secuenciales.

### Fase 1: Preguntas Únicamente
Antes de generar código, el modelo tiene prohibido escribir clases o funciones. Su única salida permitida es una lista de preguntas de aclaración. Cada pregunta debe estar directamente vinculada a una decisión crítica de diseño o implementación.

### Fase 2: Verificación de Supuestos
Una vez que respondes las preguntas del modelo, este debe reformular el problema con sus palabras y enumerar los supuestos técnicos que asumirá para la generación del código base.

### Fase 3: Respuesta
Solo después de que apruebes los supuestos, el modelo entrega el código finalizado. Esta respuesta debe contener obligatoriamente dos elementos adicionales:
*   Un **razonamiento breve** (de 2 a 3 oraciones) de por qué se eligió esa solución concreta.
*   Una **alternativa de enmarcado** que describa cómo cambiaría el código si cambiara uno de los requisitos iniciales.

---

## 5. Caso de Estudio Android: Onboarding en Compose, Room y WorkManager

Para ilustrar este flujo, diseñaremos una pantalla de onboarding en Android que requiere almacenar el estado de lectura del usuario de forma persistente y sincronizarlo en segundo plano con un servidor remoto.

### Paso 1: Prompt de Fase 1 (Preguntas únicamente)
El desarrollador introduce el siguiente prompt en el chat de su IDE:

```text
ROL: Ingeniero Senior de Software Android.
OBJETIVO: Ayudarme a diseñar una funcionalidad de Onboarding usando Jetpack Compose, Room y WorkManager en Kotlin.
REGLA CRÍTICA: Tienes prohibido escribir código en esta fase. Formula únicamente las preguntas necesarias para resolver la arquitectura del Onboarding. Cada pregunta debe impactar directamente el código que generarás más adelante.
```

#### Respuesta del Modelo en Fase 1:
> Para darte la mejor implementación, necesito que aclaremos los siguientes puntos:
> 1. ¿Cómo debe persistirse el estado de onboarding completado? ¿Queremos guardarlo en `Room` junto con el resto de datos de usuario, o preferís usar `Jetpack DataStore Preferences` por simplicidad de I/O?
> 2. En la navegación, ¿el flujo de onboarding es el destino de inicio (`startDestination`) de tu `NavHost` controlado dinámicamente mediante un estado observable, o realizamos una navegación explícita de redirección?
> 3. En cuanto a WorkManager, ¿qué datos exactos requiere sincronizar el `SyncWorker` con el backend al finalizar el onboarding y qué políticas de reintento (`BackoffPolicy`) e constraints de red debemos configurar?
> 4. ¿Necesitás soporte para pantallas adaptativas (tablets y foldables) o el diseño está restringido a teléfonos en modo portrait?

---

### Paso 2: Entrada del Desarrollador y Fase 2 (Verificación de supuestos)
El desarrollador responde al modelo:

```text
1. Usaremos DataStore Preferences para el flag de onboarding. Room solo lo usaremos para almacenar información del perfil de usuario que se ingresa en el último slide.
2. El NavHost cambiará su startDestination basándose en un StateFlow expuesto desde el ViewModel.
3. El Worker enviará el perfil JSON a la API. Debe ejecutarse solo si hay conexión a internet ilimitada (Connected) y aplicar una política de reintento exponencial.
4. Solo teléfonos en portrait por ahora.
```

#### Respuesta del Modelo en Fase 2:
> Excelente. Con tus respuestas, procedo a establecer los siguientes supuestos para la implementación:
> - Usaremos `androidx.datastore.preferences.core` con una clave booleana `onboarding_completed`.
> - El `ViewModel` leerá de un `DataStoreRepository` y expondrá un `StateFlow<OnboardingState>` que contendrá `Loading`, `ShowOnboarding` y `NavigateToHome`.
> - Crearemos un `ProfileDao` y una base de datos `RoomDatabase` básica con la entidad `UserProfile`.
> - Diseñaremos un `SyncProfileWorker` que herede de `CoroutineWorker`, reciba la ID del perfil como input data, y se configure con restricciones de red `NetworkType.UNMETERED` y reintento exponencial.
>
> Confirmame si estos supuestos son correctos para proceder con el código de la Fase 3.

---

### Paso 3: Aprobación y Fase 3 (Respuesta del Modelo)
El desarrollador confirma: `"Correcto, generá el código de la Fase 3."`

#### Código de Producción Generado (Fase 3):

```kotlin
// 1. Entidad Room para el Perfil
package com.arceapps.socratic.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: String,
    val username: String,
    val email: String
)

// 2. DataStore para la persistencia del estado de onboarding
package com.arceapps.socratic.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "settings")

class OnboardingRepository(private val context: Context) {
    private val ONBOARDING_KEY = booleanPreferencesKey("onboarding_completed")

    val isOnboardingCompleted: Flow<Boolean> = context.dataStore.data
        .map { preferences -> preferences[ONBOARDING_KEY] ?: false }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[ONBOARDING_KEY] = completed
        }
    }
}

// 3. SyncWorker para la sincronización con el servidor
package com.arceapps.socratic.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.ListenableWorker.Result
import java.io.IOException

class SyncProfileWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val profileId = inputData.getString("profile_id") ?: return Result.failure()
        
        return try {
            // Simulación de llamada de red HTTP a través de un servicio Retrofit ficticio
            val success = mockUploadProfileToServer(profileId)
            if (success) Result.success() else Result.retry()
        } catch (e: IOException) {
            Result.retry()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private suspend fun mockUploadProfileToServer(profileId: String): Boolean {
        // Lógica de carga simulada
        kotlinx.coroutines.delay(1000)
        return true
    }
}
```

#### Razonamiento del Modelo:
> Se ha separado la persistencia de configuración del flujo de UI (`DataStore`) de los datos relacionales (`Room`) siguiendo los principios SOLID. El `SyncProfileWorker` encapsula el proceso asíncrono garantizando la robustez del sistema frente a cortes inesperados de red o muertes del proceso.

#### Alternativa de Enmarcado:
> Si en el futuro necesitás que el onboarding sea dinámico (es decir, que los slides y los textos se descarguen desde un CMS en tiempo real), esta arquitectura estática requeriría mutar. Tendríamos que implementar un repositorio intermedio `OnboardingContentRepository` que realice un fetch en la fase inicial del ViewModel, exponiendo un estado de carga (`OnboardingState.LoadingContent`).

---

## 6. Caso de Estudio iOS: Almacenamiento Seguro con Swift 6, SwiftUI y Swift Concurrency

En iOS, la seguridad de los datos sensibles y el correcto manejo de hilos bajo el modelo estricto de concurrencia de Swift 6 son desafíos comunes donde los modelos de IA suelen fallar si no se les interroga socráticamente.

### Paso 1: Prompt de Fase 1 (Preguntas únicamente)
El desarrollador introduce en Xcode Copilot Chat:

```text
ROLE: Senior iOS Software Engineer.
TASK: Help me design a secure storage repository in Swift 6 using Keychain Services and SwiftUI.
CRITICAL RULE: DO NOT write code yet. Ask questions to define the architectural details. I want to avoid Swift 6 data races and SwiftUI lifecycle issues.
```

#### Respuesta del Modelo en Fase 1:
> I will formulate the critical questions to construct a robust implementation:
> 1. Will this repository be accessed from multiple tasks or threads? If so, should we isolate it using a Swift `actor` or keep it on the `@MainActor`?
> 2. How should we handle SwiftUI state observation? Do you target iOS 17+ where we can use the `@Observable` macro, or must we support older targets with `ObservableObject` and `@Published`?
> 3. What types of keys will you store, and do they require custom access control configurations (like biographical authentication requirement `kSecAttrAccessControl`)?
> 4. Are there unit tests planned? If so, should we implement a mockable protocol interface for the keychain wrapper?

---

### Paso 2: Entrada del Desarrollador y Fase 2 (Verificación de supuestos)
El desarrollador responde:

```text
1. It will be accessed from background network threads, so it must be isolated via a dedicated global Actor.
2. Target is iOS 17+. We will use the new @Observable macro.
3. Plain credentials (token string). No biometrics required for now.
4. Yes, we need a SecureRepositoryProtocol for dependency injection.
```

#### Respuesta del Modelo en Fase 2:
> Understood. Here are the assumptions for the Swift 6 implementation:
> - We will create a `SecureRepositoryProtocol` specifying asynchronous read/write methods.
> - We will implement a thread-safe `KeychainSecureRepository` isolated to a global `actor` to prevent data races.
> - The SwiftUI `ViewModel` will be isolated to the `@MainActor` and call the repository methods asynchronously.
> - We will use iOS 17's `@Observable` macro for reactive UI updates without blocking the main actor.
>
> Please confirm if I can proceed to write the Swift 6 code.

---

### Paso 3: Aprobación y Fase 3 (Respuesta del Modelo)
El desarrollador confirma: `"Yes, proceed with the implementation."`

#### Código de Producción Generado (Fase 3):

```swift
import Foundation
import Security

// 1. Definición del protocolo mockeable
protocol SecureRepositoryProtocol: Sendable {
    func save(key: String, value: String) async throws
    func fetch(key: String) async throws -> String?
    func delete(key: String) async throws
}

// 2. Implementación aislada a un actor para garantizar seguridad de hilos (Swift 6)
actor KeychainSecureRepository: SecureRepositoryProtocol {
    private let serviceName = "com.arceapps.socratic.keychain"

    func save(key: String, value: String) async throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.invalidData
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        // Primero eliminamos el elemento existente para evitar colisiones
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.storageFailed(status)
        }
    }

    func fetch(key: String) async throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        guard status != errSecItemNotFound else { return nil }
        guard status == errSecSuccess, let data = dataTypeRef as? Data else {
            throw KeychainError.fetchFailed(status)
        }

        return String(data: data, encoding: .utf8)
    }

    func delete(key: String) async throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

// Errores del llavero
enum KeychainError: Error {
    case invalidData
    case storageFailed(OSStatus)
    case fetchFailed(OSStatus)
    case deleteFailed(OSStatus)
}

// 3. ViewModel en SwiftUI (iOS 17) aislado al MainActor
@Observable
@MainActor
class SecuritySettingsViewModel {
    private let repository: SecureRepositoryProtocol
    var savedToken: String = ""
    var errorMessage: String? = nil

    init(repository: SecureRepositoryProtocol) {
        self.repository = repository
    }

    func saveToken(_ token: String) {
        Task {
            do {
                try await repository.save(key: "auth_token", value: token)
                self.savedToken = token
                self.errorMessage = nil
            } catch {
                self.errorMessage = "Failed to save: \(error.localizedDescription)"
            }
        }
    }
}
```

#### Razonamiento del Modelo:
> El uso de un `actor` para la clase `KeychainSecureRepository` garantiza que todos los accesos de lectura y escritura al llavero estén sincronizados de manera no bloqueante. Esto cumple con las restricciones de Swift Concurrency 6, previniendo carreras de datos en runtime sin degradar la responsividad de la UI.

#### Alternativa de Enmarcado:
> Si necesitaras sincronizar este llavero a través de iCloud Keychain, tendríamos que mutar la consulta agregando la propiedad `kSecAttrSynchronizable as String: kSecAttrSynchronizableAny` dentro de la configuración del query de seguridad.

---

## 7. Maieutic Prompting y la Profundidad Abdutiva

El *Maieutic Prompting*, presentado por Jung et al. en la conferencia EMNLP 2022 【2】, lleva la idea de Chang a un nivel de análisis formalizado extremadamente potente: en lugar de confiar en una sola respuesta lineal, **obliga al modelo a construir un árbol de explicaciones recursivas** y resuelve la inferencia como un problema de consistencia lógica.

![Infografía: árbol abdutivo del Maieutic Prompting](/images/socratic-maieutic-prompting-mobile-arbol-es.png)

### La Estructura del Árbol Abdutivo
Para resolver una duda compleja o un bug arquitectónico:
1. El modelo formula una pregunta conceptual Q.
2. A partir de Q, el modelo genera dos hipótesis opuestas y las explica:
   *   Hipótesis A: "Q es verdadero, porque..."
   *   Hipótesis B: "Q es falso, porque..."
3. Para cada hipótesis, el modelo analiza si los argumentos que expuso se contradicen con otras reglas establecidas en el proyecto.
4. Las ramas del razonamiento que muestran inconsistencias lógicas se descartan de forma sistemática (poda lógica).
5. Las ramas restantes se traducen a cláusulas y se resuelven para encontrar el camino de menor contradicción técnica.

Los resultados de este método en problemas de razonamiento abstracto demuestran ganancias masivas en precisión en comparación con enfoques directos y con el clásico *Chain-of-Thought* (CoT):

| Dataset          | Standard | CoT    | Self-Consistency | Maieutic | Ganancia sobre CoT |
|------------------|----------|--------|------------------|----------|--------------------|
| Com2Sense        | 58.1     | 61.6   | 61.4             | **75.0** | +13.4 %            |
| CSQA 2.0         | 54.1     | 59.6   | 60.8             | **69.5** | +9.9 %             |
| CREAK            | 60.3     | 64.8   | 70.5             | **85.2** | +20.4 %            |

En desarrollo móvil diario, implementar un solver MAX-SAT externo no es práctico. Sin embargo, podemos aplicar el patrón **Self-Ask** 【3】, que es la versión simplificada y directa del árbol de explicaciones para interfaces de chat. Mediante este patrón, instruimos al modelo a autoformularse subpreguntas y refutarse antes de entregar la respuesta final.

---

## 8. Casos de Uso de Alta Tensión en Mobile

El prompting maiéutico aporta su mayor valor en escenarios de "alta tensión", donde dos restricciones técnicas críticas chocan directamente y la elección obvia tiene consecuencias negativas en otras áreas:

*   **Paginación de Datos**: Elegir entre implementar `PagingSource` de Jetpack Paging 3 o manejar la paginación de forma manual en el repositorio para evitar la complejidad de la librería pero corriendo el riesgo de provocar lagunas de memoria.
*   **Estrategias de Caché**: Decidir si una respuesta de la API debe persistirse en una base de datos local con cifrado en reposo para soporte sin conexión, o mantenerse exclusivamente en memoria volátil debido a los límites de almacenamiento.
*   **Manejo de Ciclo de Vida**: Decidir si se debe retener un estado en el ViewModel usando `SavedStateHandle` frente a la pérdida de estado en process death, o delegar la persistencia a un repositorio centralizado.

---

## 9. Seis Tipos de Preguntas Socráticas (Taxonomía de Paul)

Richard Paul, pionero del *Foundation for Critical Thinking*, estructuró las preguntas socráticas en una taxonomía de seis categorías didácticas 【6】【7】. A continuación, analizamos cómo estas categorías se aplican de forma operativa a la programación móvil:

![Infografía: los seis tipos de preguntas socráticas de R.W. Paul](/images/socratic-maieutic-prompting-mobile-preguntas-es.png)

### 1. Preguntas de Clarificación
Buscan eliminar la ambigüedad de los términos empleados en los requisitos de desarrollo.
*   *Ejemplo en prompt:* `"¿Qué quieres decir con que la sincronización debe ser 'inmediata'? ¿Debe ejecutarse en primer plano bloqueando la interfaz o puede encolarse en WorkManager?"`

### 2. Preguntas de Suposición
Cuestionan lo que se da por sentado sin tener pruebas empíricas.
*   *Ejemplo en prompt:* `"Estás asumiendo que el dispositivo siempre cuenta con un ancho de banda alto. ¿Qué ocurre con esta llamada a API si el usuario está en una red móvil 3G limitada?"`

### 3. Preguntas de Evidencia y Razones
Exigen comprobar los datos que respaldan una afirmación arquitectónica.
*   *Ejemplo en prompt:* `"¿Qué métricas de consumo de CPU demuestran que usar un Flow de Room es más eficiente que hacer consultas directas suspendidas para esta vista?"`

### 4. Preguntas de Perspectivas y Puntos de Vista
Obligan a analizar soluciones alternativas y a evitar el sesgo de familiaridad.
*   *Ejemplo en prompt:* `"¿Cómo resolvería este problema un ingeniero de backend enfocado en la integridad de los datos en lugar de la experiencia de UI?"`

### 5. Preguntas de Implicaciones y Consecuencias
Evalúan los efectos a largo plazo de una decisión técnica en el código base.
*   *Ejemplo en prompt:* `"Si decidimos usar la biblioteca Jetpack Compose Navigation en lugar de navegación por Compose Destinations, ¿cómo afecta esto a la modularización?"`

### 6. Meta-Preguntas sobre la Pregunta
Reflexionan sobre la utilidad del problema mismo.
*   *Ejemplo en prompt:* `"¿Por qué estamos intentando optimizar el rendimiento de este renderizado? ¿Es una optimización prematura o responde a una degradación real medida?"`

---

## 10. El Stack de IA para Mobile en 2025-2026

La evolución de las herramientas de asistencia al código ha pasado de sugerir bloques simples de sintaxis a operar de forma autónoma a través de agentes. Esto hace que estructurar el diálogo socrático sea vital para mantener el control sobre los cambios multi-archivo.

| Herramienta | Precio Individual | IDE Recomendado | Modo Agente | Soporte Nivel Mobile |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub Copilot** | $10 / $39 al mes 【8】 | VS Code, Xcode | Sí (Copilot Agent Mode) 【9】 | App GitHub Mobile 【10】 |
| **Cursor** | $20 a $200 al mes 【11】 | Cursor (Fork VS Code) | Sí (Composer) | App iOS dedicada 【12】 |
| **Claude Code** | Incluido en Pro ($20+) | CLI / Terminal | Sí (Agente Autónomo) | App iOS Research Preview 【13】 |
| **Gemini in Android Studio** | Gratis / API de pago | Android Studio | Sí (Agent Mode) 【14】 | Integrado nativamente 【14】 |
| **JetBrains AI Assistant** | $10 al mes 【15】 | IntelliJ, Android Studio | Sí (Junie Agent) | Soporte web y de escritorio 【15】 |

---

## 11. Selección de Técnica: Socrático, Few-shot, CoT o Maieutic

No todos los problemas del día a día justifican el mismo nivel de complejidad en los prompts. La elección de la técnica adecuada depende del equilibrio entre la ambigüedad de la tarea y el costo de los tokens:

![Infografía: cuándo usar cada técnica de prompting](/images/socratic-maieutic-prompting-mobile-cuando-es.png)

*   **Zero-shot (1x Tokens)**: Útil para tareas directas, traducción de sintaxis o formateo de textos donde no hay ambigüedad posible.
*   **Few-shot (2-5x Tokens)**: Ideal cuando necesitás que la salida siga un patrón de diseño estricto y disponés de ejemplos previos del código base para guiar al modelo.
*   **Chain-of-Thought (1.5-3x Tokens)**: Requerido en modelos que no realizan razonamiento interno nativo para desglosar algoritmos paso a paso. *Nota: En modelos modernos con razonamiento nativo como Gemini Thinking, esta técnica es redundante.*
*   **Socratic (2-4x Tokens)**: Mandatorio al iniciar nuevas funcionalidades con requisitos imprecisos o dependencias complejas del ciclo de vida móvil.
*   **Maieutic (5-10x Tokens)**: Recomendado para resolver bugs complejos, race conditions de concurrencia o conflictos de restricciones de diseño.

---

## 12. Patrones Avanzados para Programadores Mobile

### Patrón 1: La Especificación Viva
Consiste en adjuntar la documentación de diseño técnico como contexto permanente al chat. Al obligar al modelo a evaluarla socráticamente antes de generar código, evitás que las suposiciones obsoletas contaminen la salida.

```text
[Contexto: docs/architecture-rules.md]
Lee las reglas antes de responder. Pregúntame sobre cualquier contradicción entre esta tarea y la arquitectura actual.
```

### Patrón 2: El Revisor Socrático
Utilizado en revisiones de Pull Requests. En lugar de pedir correcciones automáticas, forzás al modelo a cuestionar su propio código buscando vulnerabilidades de seguridad de la plataforma móvil.

```text
Actúa como un revisor de código obsesionado con las fugas de memoria en Android. Analiza este diff y pregúntate qué pasará con la retención del contexto durante un cambio de configuración.
```

---

## 13. Los Límites del Enfoque y la Crisis de Confianza

A pesar de sus innegables ventajas en la precisión lógica, el prompting socrático y maiéutico tiene límites que los desarrolladores deben conocer:

*   **Costo de Tokens y Latencia**: Al exigir múltiples turnos de conversación antes de recibir la respuesta definitiva, el consumo de API y la latencia aumentan considerablemente. No es un patrón óptimo para correcciones rápidas de código en tiempo real.
*   **Conocimiento del Dominio**: La calidad de las preguntas formuladas por el modelo depende estrictamente de su entrenamiento previo. En SDKs de terceros propietarios, APIs cerradas o herramientas experimentales, el modelo puede inventar dependencias o proponer supuestos falsos.
*   **Dependencia del Desarrollador**: El programador debe poseer el criterio técnico suficiente para discernir si las preguntas del modelo son válidas o si carecen de sentido en el contexto del proyecto.

---

## 14. El Horizonte: Agentes Socráticos y Razonamiento Verificable

El futuro de la asistencia al desarrollo móvil apunta a la automatización de estos flujos de diálogo mediante arquitecturas de sistemas multi-agente dialécticos. सेटअपs como los descritos en el paper *SocraticAI* de Princeton 【20】 demuestran que instancias en debate abierto resuelven problemas de optimización con mayor éxito que un único modelo aislado.

El siguiente paso natural es la integración de **verificadores formales** en el bucle de inferencia. Esto permitirá a los agentes socráticos probar el código generado contra linters y compiladores reales en sandbox, podando de forma inmediata cualquier rama lógica que falle antes de entregar el Pull Request al desarrollador.

---

## 15. Conclusión

El prompting socrático no es simplemente una técnica más de redacción de instrucciones: es un **cambio en la distribución de la responsabilidad técnica**. En el prompting directo, el programador asume toda la carga de especificar el contexto a la perfección. En el socrático, esa carga se comparte: la IA pregunta, el desarrollador valida, y solo entonces se escribe el código base.

Para los ingenieros móviles que buscan reducir las horas perdidas depurando el código "casi correcto" de la IA, este marco no es una opción; es la única forma de garantizar la mantenibilidad y solidez de sus aplicaciones en el ecosistema Android e iOS.

---

## 16. Referencias

*   【1】 Chang, E. Y. (2023). *Prompting Large Language Models With the Socratic Method*. IEEE Computing and Communication Workshop and Conference (CCWC), March 2023. https://arxiv.org/abs/2303.08769
*   【2】 Jung, J., Qin, L., Welleck, S., Brahman, F., Bhagavatula, C., Le Bras, R., & Choi, Y. (2022). *Maieutic Prompting: Logically Consistent Reasoning with Recursive Explanations*. EMNLP 2022. https://arxiv.org/abs/2205.11822
*   【3】 Emergent Mind. *Self-Ask: Zero-Shot Maieutic Prompting*. https://www.emergentmind.com/topics/self-ask-zero-shot-maieutic-prompting
*   【4】 Stack Overflow. (2025). *2025 Developer Survey — AI Section*. https://survey.stackoverflow.co/2025/ai
*   【5】 Rewire IT. (2024). *Socrates Was a Terrible Prompt Engineer (That's the Point)*. https://rewire.it/blog/socrates-was-a-terrible-prompt-engineer/
*   【6】 Paul, R. & Elder, L. *The Thinker's Guide to Socratic Questioning*. Foundation for Critical Thinking. https://www.criticalthinking.org/store/products/the-thinkers-guide-to-socratic-questioning/231
*   【7】 1000 Ventures. *Socratic Questions: Enhancing Your Critical Thinking Skills*. https://www.1000ventures.com/business_guide/crosscuttings/questions_socratic.html
*   【8】 GitHub. *Plans & Pricing — GitHub Copilot*. https://github.com/features/copilot/plans
*   【9】 GitHub Blog. (2025). *Copilot code review: Generally available in Xcode and new admin control*. August 27, 2025. https://github.blog/changelog/2025-08-27-copilot-code-review-generally-available-in-xcode-and-new-admin-control/
*   【10】 GitHub. *CopilotForXcode — AI coding assistant for Xcode*. https://github.com/github/CopilotForXcode
*   【11】 Cursor. *Pricing*. https://cursor.com/pricing
*   【12】 IT之家. (2025). *AI 编程工具 Cursor 推出移动端应用，手机即可操控智能体*. June 30, 2025. https://www.ithome.com/0/970/555.htm
*   【13】 9to5Mac. (2025). *Claude Code comes to iOS and web as research preview*. October 20, 2025. https://9to5mac.com/2025/10/20/claude-code-preview-ios-iphone/
*   【14】 Google Android Developers Blog. (2025). *Google I/O 2025: What's new in Android development tools*. May 20, 2025. https://android-developers.blog/2025/05/google-io-2025-whats-new-in-android-development-tools.html
*   【15】 JetBrains Blog. (2025). *AI Assistant Comes to Kotlin Developers in Android Studio*. March 2025. https://blog.jetbrains.com/ai/2025/03/ai-assistant-comes-to-kotlin-developers-in-android-studio/
*   【16】 Dechive. (2025). *Few-shot & CoT – Are These Techniques Still Effective in 2025?*. https://dechive.dev/en/archive/prompt-few-shot-cot
*   【17】 White, J. et al. *A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT*. https://www.dre.vanderbilt.edu/~schmidt/PDF/prompt-patterns-book-chapter.pdf
*   【18】 Chidambaram, S. et al. (2024). *Socratic Human Feedback (SoHF): Expert Steering Strategies for LLM Code Generation*. Amazon Science. https://assets.amazon.science/bf/d7/04e34cc14e11b03e798dfec53e5a/socratic-human-feedback-sohf-expert-steering-strategies-for-llm-code-generation.pdf
*   【19】 TechnoTalkative. (2025). *Which AI Coding Tool Actually Works for Mobile Developers?*. https://technotalkative.com/copilot-cursor-claude-code-ai-coding-tools-mobile-developers/
*   【20】 Princeton NLP. *SocraticAI — The Socratic Method for Self-Discovery in Large Language Models*. https://princeton-nlp.github.io/SocraticAI/
*   【21】 *SocraticLM: Exploring Socratic Personalized Teaching with Large Language Models*. NeurIPS 2024. https://neurips.cc/virtual/2024/poster/93477
