---
title: "AI Skills en el Desarrollo: Potencia Tu Flujo de Trabajo Android"
description: "Descubre cómo los AI Skills transforman el desarrollo moderno, automatizando tareas complejas y mejorando la productividad en proyectos Android."
pubDate: 2025-12-29
heroImage: "/images/placeholder-article-ai-skills.svg"
tags: ["IA", "Android", "Desarrollo", "Skills", "Gemini", "GitHub Copilot"]
reference_id: "f6063ef7-ac6b-4ff3-88cf-55681f3eb150"
---
## 🧠 ¿Qué son los AI Skills? Teoría y Conceptos

En el mundo de la Ingeniería de Prompts, un **Skill** no es simplemente una "instrucción". Técnicamente, un Skill es una **configuración de contexto persistente** diseñada para especializar a un Modelo de Lenguaje (LLM) en una tarea específica.

Los LLMs generalistas (como GPT-4 o Gemini Pro) saben "un poco de todo". Al definir un Skill, estamos aplicando una técnica llamada **Persona Adoption** combinada con **Few-Shot Prompting**:
1.  **Persona Adoption**: "Actúa como un Senior Android Engineer experto en Clean Architecture".
2.  **Constraints**: "Usa solo Kotlin, nunca Java. Prefiere StateFlow sobre LiveData".
3.  **Few-Shot Examples**: "Aquí tienes 3 ejemplos de cómo quiero que se vea el código".

Esta combinación transforma al asistente genérico en una herramienta de precisión quirúrgica para tu proyecto específico.

### La Jerarquía del Prompting
Para entender por qué los Skills son superiores a los prompts manuales, veamos la jerarquía:

1.  **Zero-Shot Prompt**: *"Haz un login"*. (Resultado: Código genérico, posiblemente en Java o con librerías viejas).
2.  **One-Shot Prompt**: *"Haz un login usando MVVM"*. (Resultado: Mejor estructura, pero detalles inconsistentes).
3.  **AI Skill (System Prompt + Context)**: *"Actúa como el experto del proyecto X. Usa la arquitectura definida en agents.md. Aquí tienes el patrón exacto de nuestros ViewModels. Genera el login"*. (Resultado: Código listo para producción).

## 🛠️ Configurando Skills para Android Development

A continuación, detallamos cómo configurar estos "expertos virtuales" para las tareas más críticas del desarrollo Android.

### 1. Skill de Arquitectura MVVM (El Arquitecto)

Este skill es fundamental. Su objetivo no es solo generar código, sino **mantener la integridad arquitectónica** del proyecto.

**Teoría detrás del Skill:**
En Android moderno, la separación de responsabilidades es crítica. Este skill impone el flujo de datos unidireccional (UDF) y el manejo de estado reactivo.

**Configuración (System Instruction):**
```markdown
# Role
Actúa como un Principal Android Architect.

# Objective
Generar componentes MVVM que cumplan estrictamente con Clean Architecture.

# Rules
1. **State Management**: NUNCA uses `LiveData` en nuevos ViewModels. Usa `StateFlow` con `asStateFlow()` para exponer estado inmutable.
2. **UI State**: Todo ViewModel debe exponer un único `uiState` (Sealed Interface).
3. **Concurrency**: Usa `viewModelScope` y `Coroutines`. Evita `RxJava`.
4. **Dependency Injection**: Todo debe ser inyectable via Hilt (`@HiltViewModel`, `@Inject`).
```

**Ejemplo de Salida Esperada (Few-Shot):**
```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase // Inyectamos UseCase, no Repo directamente
) : ViewModel() {
    
    // Backing property para encapsulamiento estricto
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    fun loadUser(userId: String) {
        viewModelScope.launch {
            _uiState.value = UserUiState.Loading
            getUserUseCase(userId)
                .fold(
                    onSuccess = { _uiState.value = UserUiState.Success(it) },
                    onFailure = { _uiState.value = UserUiState.Error(it) }
                )
        }
    }
}
```

### 2. Skill de Testing Completo (El QA Engineer)

Escribir tests es a menudo tedioso, lo que lleva a baja cobertura. Este skill automatiza la creación de tests robustos.

**Teoría detrás del Skill:**
Un buen test debe seguir el patrón AAA (Arrange, Act, Assert) y ser determinista. En el mundo de Coroutines, esto implica manejar correctamente los `TestDispatchers`.

**Configuración:**
```markdown
# Role
Senior Android Test Engineer.

# Rules
1. **Frameworks**: JUnit5 (no 4), MockK (no Mockito), Turbine (para Flows).
2. **Naming**: `should [ExpectedBehavior] when [Condition]`.
3. **Coroutines**: Usa `runTest` y `StandardTestDispatcher`.
4. **Isolation**: Cada test debe ser independiente.
```

**Ejemplo de Salida:**
```kotlin
@Test
fun `should emit Error state when repository fails`() = runTest {
    // Arrange
    val exception = IOException("Network Error")
    coEvery { userRepository.getUser(any()) } throws exception
    
    // Act
    viewModel.loadUser("123")
    
    // Assert
    viewModel.uiState.test { // Turbine library
        assertEquals(UserUiState.Loading, awaitItem())
        val errorState = awaitItem() as UserUiState.Error
        assertEquals(exception.message, errorState.message)
    }
}
```

### 3. Skill de Jetpack Compose (El UI Designer)

Compose simplifica la UI, pero introduce nuevos riesgos (recomposiciones innecesarias). Este skill asegura performance por defecto.

**Reglas Críticas para el Skill:**
1.  **Statelessness**: Los Composables de bajo nivel no deben tener `ViewModel`. Reciben datos y lambdas.
2.  **Hoisting**: El estado se eleva hasta el punto común más bajo (usualmente un Screen Composable).
3.  **Semantics**: Accesibilidad obligatoria (`contentDescription`).

```kotlin
// Skill Output Example
@Composable
fun UserCard(
    user: User,
    onLegacyClick: () -> Unit, // Lambda en lugar de manejar evento aquí
    modifier: Modifier = Modifier // Modifier siempre expuesto
) {
    Card(modifier = modifier) {
        // ...
    }
}
```

## 🚀 Skills Prácticos de Alto Nivel

### Skill: Generador de Infraestructura de Red (API Clients)

Escribir interfaces Retrofit y modelos DTO es repetitivo. Este skill convierte un JSON o especificación Swagger en código Kotlin seguro.

**Input del Usuario:**
"Aquí está la respuesta JSON del endpoint /users."

**Acción del Skill:**
1.  Analiza el JSON.
2.  Genera Data Classes (`@JsonClass(generateAdapter = true)` para Moshi).
3.  Genera interfaz Retrofit (`suspend functions`, `Response<T>`).
4.  Genera Mappers (DTO -> Domain Model).

```kotlin
// Generated Mapper
fun UserDto.toDomain(): User {
    return User(
        id = this.id ?: throw ApiException("Missing ID"),
        email = this.email.orEmpty()
    )
}
```

### Skill: Database Architect (Room)

Este skill optimiza consultas SQL y define relaciones entre entidades correctamente.

**Reglas del Skill:**
- Siempre usar `suspend` para I/O.
- Retornar `Flow<List<T>>` para listas observables.
- Índices en columnas de búsqueda frecuente.

```kotlin
@Dao
interface UserDao {
    // El skill sabe que retornar Flow hace que Room notifique cambios automáticamente
    @Query("SELECT * FROM users ORDER BY last_active DESC")
    fun getUsersStream(): Flow<List<UserEntity>>
}
```

## 📈 Mejores Prácticas: El Ciclo de Vida de un Skill

Crear un skill no es una tarea de una sola vez ("Set and Forget"). Debe tratarse como código fuente.

1.  **Drafting**: Crear la primera versión del prompt/instrucción.
2.  **Validation**: Probarlo con 5-10 casos de uso reales.
3.  **Refinement**: Si el skill falla (ej. usa una librería vieja), actualiza las reglas explícitamente ("NO uses Gson").
4.  **Sharing**: Guardar el skill en un repositorio compartido (`skills/android-mvvm.md`) para que todos los agentes usen el mismo estándar.

### Documentación del Skill
Igual que documentamos APIs, documentamos Skills:

```markdown
# Android MVVM Skill
**Versión**: 2.1
**Actualizado**: 2025-12-29
**Cambios**:
- Migrado de LiveData a StateFlow.
- Añadido soporte para SavedStateHandle.
```

## 🛡️ Integración con CI/CD: Skills como Validadores

Podemos llevar el concepto más allá y usar Skills en nuestro Pipeline de Integración Continua.

**Concepto**: Un script que envía el código modificado a un LLM con el Skill "Code Reviewer" y bloquea el PR si detecta violaciones graves.

```kotlin
/**
 * Skill: Android Code Analyzer
 * Ejecutado en GitHub Actions
 */
class CodeReviewSkill {
    fun analyze(diff: String): ReviewResult {
        // El LLM verifica:
        // 1. ¿Hay lógica de negocio en el Fragment? (Mal)
        // 2. ¿Se están capturando excepciones en las corrutinas? (Bien)
        // 3. ¿Los nombres siguen la convención?
    }
}
```

## 🎯 Conclusión

Los **AI Skills** representan la madurez en el uso de Inteligencia Artificial para el desarrollo. Ya no estamos "jugando" con un chatbot; estamos **programando al programador sintético**.

Al invertir tiempo en definir y refinar estos skills:
1.  Eliminas el "boilerplate mental" de recordar detalles de implementación.
2.  Garantizas que hasta el código generado automáticamente cumpla con tus estándares de calidad más altos.
3.  Multiplicas tu productividad, enfocándote en *qué* construir, mientras tus Skills expertos se encargan del *cómo*.

Empieza hoy: toma tu tarea más repetitiva (¿Crear ViewModels? ¿Mappers?), escribe las reglas y crea tu primer Skill.
