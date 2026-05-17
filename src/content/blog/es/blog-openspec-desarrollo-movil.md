---
title: "OpenSpec para Desarrollo Móvil: Desarrollo Impulsado por Especificaciones en Android y Kotlin"
description: "Cómo aplicar OpenSpec en proyectos Android y Kotlin para mantener a los agentes de IA alineados con la arquitectura, con ejemplos prácticos de propuestas de cambio, validación de tareas y archivos vivos."
pubDate: 2026-05-17
heroImage: "/images/blog-openspec-mobile-development.svg"
tags: ["SDD", "OpenSpec", "Android", "Kotlin", "IA Agéntica", "Desarrollo Móvil", "Spec-Driven Development", "Workflow", "Arquitectura"]
reference_id: "e7f82a1b-3c45-4d9e-8f1a-2b3c4d5e6f7g"
---

> **Lecturas relacionadas:** [Análisis Profundo de Frameworks SDD: Spec Kit, OpenSpec y BMAD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad) · [Desarrollo Impulsado por Especificaciones con IA Agéntica](/blog/blog-specs-driven-development) · [Stack Completo para Construir Agentes IA en 2026](/blog/blog-stack-completo-agentes-ia-2026)

El desarrollo móvil tiene una disciplina particular que el desarrollo web no comparte: la **fragmentación de contextos técnicos**. Cada plataforma móvil — Android con Kotlin, iOS con Swift — tiene sus propios ciclos de release, restricciones de hardware, APIs nativas y patrones arquitectónicos. Cuando introduces agentes de IA en este ecosistema, el riesgo de desalineación se multiplica: el agente puede sugerirte una API de Android obsoleta, usar un patrón de concurrencia inadecuado para Kotlin, o implementar una característica ignorando las directrices de Material Design.

OpenSpec fue diseñado con esta realidad en mente. Su modelo de propuestas de cambio y construcción retroactiva de especificaciones encaja naturalmente con el ciclo de desarrollo móvil: pequeñas iteraciones, cada una con un propósito claro y verificable.

---

## Por qué SDD Es Particularmente Importante en Desarrollo Móvil

### La Amnesia del Contexto en Sesiones Móviles

Cuando trabajas con un agente de IA en un proyecto Android, cada sesión comienza sin contexto del estado actual del proyecto. El agente no sabe que:

- Hace tres meses prohibiste el uso de `LiveData` en favor de `Flow` porque el equipo adoptó arquitectura de unidirección de datos.
- Existe una regla de que todas las llamadas de red deben pasar por un repositorio con caché en memoria.
- La pantalla de login tiene un requisito específico de seguridad: nunca almacena tokens en `SharedPreferences`, siempre en el encrypted shared preferences de Jetpack Security.

这些 decisiones no están en el código. Están en la cabeza del desarrollador o dispersas en documentos que el agente nunca lee. El resultado: código que viola decisiones arquitectónicas establecidas.

### La Relación entre la Especificación y el Pipeline Móvil

En desarrollo móvil, la especificación no es un documento opcional — es parte del **pipeline de calidad**. Google Play Console y App Store Connect tienen requisitos de revisión que incluyen comportamiento de la aplicación, rendimiento y seguridad. Una especificación precisa actúa como el contrato que verificas antes de cada release.

OpenSpec permite que este contrato sea **legible por máquinas y por humanos**, y que evolucione con el proyecto mediante su mecanismo de archivo de deltas.

---

## La Anatomía de OpenSpec en un Proyecto Android

### Estructura de Directorios

Un proyecto Android con OpenSpec integrado tiene esta estructura:

```
mi-proyecto-android/
├── app/
│   └── src/main/
│       ├── java/com/miapp/
│       └── res/
├── openspec/
│   ├── main/
│   │   └── specs/                 # Specs canónicas del proyecto
│   │       ├── architecture.md
│   │       ├── concurrency.md
│   │       └── security.md
│   └── changes/
│       └── ch-0042-refactor-login/  # Cada cambio vive aquí
│           ├── proposal.md
│           ├── specs/
│           │   └── login-security-spec.md
│           ├── tasks.md
│           └── design.md
└── build.gradle.kts
```

La carpeta `openspec/main/specs/` es el **Source of Truth** del proyecto. Contiene las especificaciones que los agentes de IA deben consultar antes de generar cualquier código.

### El Flujo de Trabajo OpenSpec para Android

El flujo sigue un ciclo claro:

```
Propuesta → Spec Delta → Tareas → Implementación → Archivo
     ↓            ↓          ↓           ↓            ↓
  Humano      humano+IA    IA         IA+Pruebas    Fusión en specs
  escribe     valida      genera      verifican     main/
```

Cada fase tiene un checkpoint explícito. El agente no avanza a la siguiente sin que la anterior esté validada.

---

## Propuesta de Cambio: El Artefacto Central

### Anatomía de un proposal.md para Android

La propuesta define el **por qué** del cambio. En un contexto móvil, esto incluye consideraciones específicas de plataforma:

```markdown
# Proposal: Refactorizar sistema de autenticación para usar BiometricPrompt

## Contexto

El sistema actual usa autenticación por PIN almacenado en SharedPreferences.
Google Play Console ha identificado esto como problema de seguridad en auditoria.
El equipo de seguridad emitió un requerimiento de migrate a BiometricPrompt.

## Alcance

### Dentro del alcance
- Reemplazar SharedPreferences por EncryptedSharedPreferences
- Integrar BiometricPrompt API para autenticación biométrica
- Mantener fallback a PIN para dispositivos sin sensor biométrico
- Actualizar flujos de login y settings

### Fuera del alcance
- Cambios en la lógica de backend
- Modificaciones en el sistema de gestión de sesiones del servidor
- Actualización de la base de datos local

## Restricciones Técnicas Detectadas

1. **MinSdk 23 (Android 6.0)**: BiometricPrompt requiere API 23+
2. **Jetpack Security**: Usar `androidx.security:security-crypto`
3. **Compose**: La UI de autenticación usa Jetpack Compose
4. **Testing**: El módulo de autenticación tiene tests unitarios con Mockk

## Criterios de Éxito

- [ ] Autenticación biométrica funcional en dispositivos compatibles
- [ ] Fallback a PIN funciona cuando biométrico no está disponible
- [ ] Los tests unitarios existentes siguen pasando
- [ ] No hay regression en flows de registro nuevo usuario
```

### Por qué el Alcance Específico Importa en Móvil

En desarrollo móvil, los cambios suelen tocar APIs específicas de plataforma. Definir dentro/fuera del alcance previene que el agente proponga cambios en el backend o en componentes no relacionados — un error común cuando el agente no tiene contexto de los límites del sistema móvil.

---

## Specs Delta: El Contrato Verificable

### Estructura de un Delta para Android

El delta de spec contiene los requisitos **verificables por máquina**:

```markdown
# Delta: Autenticación Biométrica — Android

## MODIFIED: BiometricAuthentication

### Requisitos

1. **SHALL** usar `BiometricPrompt` de `androidx.biometric` para autenticación
2. **SHALL** usar `EncryptedSharedPreferences` para almacenar credenciales
3. **MUST** mantener backward compatibility con dispositivos sin sensor biométrico
4. **SHALL** mostrar mensaje de error específico cuando biometría no está disponible

### Comportamiento Observable

| Escenario | Entrada | Salida Esperada |
|-----------|---------|------------------|
| Dispositivo con sensor | Usuario toca "Login con huella" | `BiometricPrompt` se muestra |
| Biometría no disponible | Intent de login | Fallback a PIN automático |
| Autenticación exitosa | Credenciales válidas | Navigate a `HomeScreen` |
| Autenticación fallida | Credenciales inválidas | Mostrar error "Credenciales incorrectas" |

### Escenarios de Prueba

```
GIVEN el usuario tiene dispositivos con sensor biométrico configurado
WHEN selecciona autenticación por huella
THEN el sistema muestra BiometricPrompt
AND al autenticarse exitosamente navega a HomeScreen

GIVEN el usuario está en dispositivo sin sensor biométrico
WHEN intenta autenticarse
THEN el sistema muestra pantalla de PIN
AND proceeding normally
```

### La Importancia de SHALL/MUST en Móvil

Las palabras clave SHALL y MUST no son retóricas — son **instrucciones ejecutables**. Cuando un agente de IA como Cursor o Claude Code tiene acceso a estas specs, puede verificar su implementación contra el contrato antes de marcar una tarea como completada. Esto reduce drásticamente la necesidad de revisiones manuales.

---

## Tareas: La Lista Verificable

### Formato de tasks.md para Android

```markdown
# Tasks: Refactorizar sistema de autenticación

## Fase 1: Dependencias

- [ ] T001: Añadir dependencia `androidx.biometric:biometric:1.1.0` en build.gradle.kts
- [ ] T002: Añadir dependencia `androidx.security:security-crypto:1.1.0-alpha06`
- [ ] T003: Verificar que EncryptedSharedPreferences está disponible en minSdk 23

## Fase 2: Storage Seguro

- [ ] T004: Crear `SecureTokenStorage` wrapper sobre EncryptedSharedPreferences
- [ ] T005: Migrar PIN almacenado de SharedPreferences a EncryptedSharedPreferences
- [ ] T006: Implementar lectura/escritura de tokens con CryptoSheet

## Fase 3: BiometricPrompt

- [ ] T007: Crear `BiometricAuthenticator` con BiometricPrompt
- [ ] T008: Implementar `authenticationCallback` con manejo de errores
- [ ] T009: Añadir fallback a PIN cuando `BiometricManager.canAuthenticate()` returns false
- [ ] T010: Integrar BiometricAuthenticator en `LoginViewModel`

## Fase 4: UI y Flujo

- [ ] T011: Modificar `LoginScreen` para añadir botón de "Login con huella"
- [ ] T012: Implementar lógica de fallback en `LoginViewModel`
- [ ] T013: Actualizar navegación para ir a HomeScreen post-auth exitoso

## Fase 5: Testing y Validación

- [ ] T014: Verificar tests existentes en `AuthRepositoryTest` siguen pasando
- [ ] T015: Añadir tests unitarios para BiometricAuthenticator
- [ ] T016: Ejecutar `lintDebug` y `testDebugUnitTest` sin errores
```

### Verificabilidad Atómica

Cada tarea tiene un resultado verificable. T004 crea un archivo específico. T005 modifica comportamiento conocido. T014 verifica que tests existentes siguen pasando. El agente puede marcar `[x]` cada tarea cuando la verifica, sin ambigüedad.

---

## Diseño: Decisiones Arquitectónicas para Android

### El Archivo design.md

```markdown
# Diseño: Refactorización de Autenticación

## Decisión 1: BiometricPrompt sobre FingerprintManager (deprecated)

**Elección**: Usar `BiometricPrompt` (API 28+) con `BiometricManager` (API 23+)

**Razonamiento**: `FingerprintManager` fue deprecated en API 28.
`BiometricPrompt` proporciona una UI consistente y callbacks unificados.
Compatible hacia atrás usando `BiometricManager.canAuthenticate()`.

## Decisión 2: EncryptedSharedPreferences sobre Keystore directo

**Elección**: Usar `EncryptedSharedPreferences` en lugar de `KeyStore` directo

**Razonamiento**: `EncryptedSharedPreferences` abstrae la complejidad de:
- Generación de keys con `MasterKey`
- Cifrado AES-256 GCM
- Serialización automática de tipos primitivos

El costo de seguridad vs. uso directo de Keystore no justifica la complejidad.

## Decisión 3: Fallback síncrono a PIN

**Elección**: El fallback a PIN es inmediato, sin delay o confirmación adicional

**Razonamiento**: El flujo de usuario espera que si biometría falla o no está disponible,
el sistema muestre inmediatamente la alternativa. Un delay adicional rompe la UX.

## Decisión 4: Compose UI para Login

**Elección**: Mantener la UI existente en Jetpack Compose

**Razonamiento**: El proyecto ya usa Compose. No hay razón para introducir XML
en una pantalla que ya tiene Compose. El único cambio es añadir un botón y modificar
el ViewModel para manejar el nuevo flujo.
```

### Por qué el Diseño Es Vivo

El archivo `design.md` no es documentación al final — es **contexto que el agente consume antes de implementar**. Cuando el agente sabe que `FingerprintManager` está deprecated y que `BiometricPrompt` es la alternativa, no propone soluciones que usen APIs obsoletas.

---

## El Ciclo de Archivo: Construyendo Specs Retroactivamente

### El Comando `openspec archive`

Cuando un cambio se completa y verifica:

```bash
npx openspec archive --change ch-0042-refactor-login
```

El sistema:

1. **Valida**: Confirma que todas las tareas en `tasks.md` están marcadas `[x]`
2. **Fusiona**: Integra los deltas de `specs/` en `openspec/main/specs/`
3. **Archiva**: Mueve la carpeta de cambio a `openspec/changes/archive/YYYY-MM-DD-refactor-login/`
4. **Registra**: Actualiza el índice de specs con las nuevas versiones

### Construcción Retroactiva de Specs

Esta es la característica más valiosa para proyectos móviles existentes. Si llevas dos años construyendo una app Android sin specs formales, OpenSpec te permite construir una **incrementally**:

1. **Cambio 1**: Añades autenticación biométrica → Escribes el delta
2. **Archivo**: El delta se fusiona en `openspec/main/specs/security.md`
3. **Cambio 2**: Añades caché de imágenes → Escribes el delta
4. **Archivo**: El delta se fusiona en `openspec/main/specs/performance.md`

Después de 10 cambios, tienes un documento de specs tan completo como si lo hubieras escrito desde cero — pero sin el esfuerzo upfront de documentación que nunca usarías.

---

## Integración con el Ecosistema Android

### OpenSpec con Jetpack Compose

La integración con Compose es natural porque Compose sigue principios declarativos que mapean bien a specs:

```kotlin
// La spec dice: SHALL mostrar error cuando credenciales son inválidas
@Composable
fun LoginScreen(
    state: LoginState,
    onLoginClick: () -> Unit,
    onBiometricClick: () -> Unit
) {
    // La implementación sigue la spec, no al revés
    Column {
        // ...
        if (state.error != null) {
            Text(
                text = state.error,
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}
```

La spec define el comportamiento. El código lo implementa. El test lo verifica.

### OpenSpec con Hilt y Dagger

Las specs pueden documentar las **decisiones de inyección de dependencias**:

```markdown
## MODIFIED: Dependency Injection

### Requisitos

1. **SHALL** usar Hilt para inyección de dependencias
2. **SHALL** que todos los repositorios sean `@Singleton`
3. **MUST NOT** usar `ApplicationComponent` (deprecated)
```

Esto previene que un agente proponga refactorizar a Koin cuando el equipo ha invertido en Hilt.

### OpenSpec con Coroutines y Flow

Dado que Kotlin usa flujos asíncronos intensivamente, las specs de concurrencia son críticas:

```markdown
## MODIFIED: Concurrency Model

### Requisitos

1. **SHALL** usar `viewModelScope` para todas las operaciones en ViewModels
2. **SHALL** usar `Dispatchers.IO` para operaciones de red y base de datos
3. **MUST** cancelar coroutines en `onCleared()`
4. **SHALL** exposure de estado como `StateFlow<T>`, no `LiveData<T>`
```

---

## Validación Automática con CI Móvil

### Gates de Calidad en GitHub Actions

El archivo `tasks.md` puede intégrarse con el CI del proyecto:

```yaml
# .github/workflows/android-verify.yml
name: Verify Spec Alignment

on:
  pull_request:
    branches: [main]

jobs:
  spec-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate OpenSpec tasks
        run: |
          npx openspec validate --change ${{ github.event.inputs.change }}
          
      - name: Run unit tests
        run: ./gradlew testDebugUnitTest
        
      - name: Run lint
        run: ./gradlew lintDebug
```

El agente no puede hacer merge si las tareas no están completadas o si los tests fallan.

---

## Comparativa: OpenSpec vs Spec Kit en Móvil

| Aspecto | OpenSpec | Spec Kit |
|---------|----------|----------|
| **Modelo** | Cambio-by-cambio | Constitución + features |
| **Curva de entrada** | Baja — empieza vacío | Alta — requiere escribir constitución |
| **Specs existentes** | Construcción retroactiva | Necesita spec completa upfront |
| **Brownfield** | Ideal | Problemático |
| **Compuertas** | Validación de tasks | Cuatro fases bloqueadas |
| **Android/Compose** | Agnóstico — funciona con cualquier | Integración Copilot |
| **Maturity** | Más nuevo | Más maduro (GitHub) |

### Cuándo Elegir Cada Uno

**Usa OpenSpec sí:**
- Tienes un proyecto Android existente sin specs formales
- Quieres introducir rigor de manera incremental
- El equipo hace cambios frecuentes y pequeños
- Necesitas trazabilidad por cambio específico

**Usa Spec Kit sí:**
- El proyecto empieza de cero con arquitectura definida
- Quieres integración profunda con Copilot
- El equipo ya usa GitHub Copilot Workspace
- La ceremonia de fases es un feature, no un bug

---

## Guía Práctica: Primeros Pasos con OpenSpec en Android

### Paso 1: Inicialización

```bash
# Instalar CLI de OpenSpec
npm install -g openspec

# En la raíz del proyecto Android
npx openspec init

# Crear el directorio principal de specs
mkdir -p openspec/main/specs
```

### Paso 2: Escribir tu Primera Spec de Arquitectura

```markdown
# openspec/main/specs/architecture.md

## Intención

Este documento establece las decisiones arquitectónicas fundamentales del proyecto.
Todos los agentes de IA debenconsultar este documento antes de generar código.

## Stack Tecnológico

- **Lenguaje**: Kotlin 1.9+
- **MinSdk**: 24 (Android 7.0)
- **TargetSdk**: 34 (Android 14)
- **UI**: Jetpack Compose (no XML)
- **DI**: Hilt
- **Concurrencia**: Coroutines + Flow (no LiveData)
- **Red**: Retrofit + OkHttp + Moshi
- **Persistencia**: Room + DataStore

## Patrones Arquitectónicos

1. **Arquitectura de Unidirección de Datos (UDF)**
   - El estado fluye hacia la UI como StateFlow
   - La UI emite eventos hacia el ViewModel
   - El ViewModel procesa eventos y actualiza estado

2. **Clean Architecture Layers**
   - `ui/` — Composables y ViewModels
   - `domain/` — Casos de uso y modelos de dominio
   - `data/` — Repositorios, fuentes de datos, DTOs
```

### Paso 3: Crear tu Primera Propuesta de Cambio

```bash
npx openspec new-change "add-bearer-authentication"
```

Esto crea el esqueleto `openspec/changes/ch-0001-add-bearer-authentication/` con los archivos necesarios.

### Paso 4: Validar Antes de Implementar

```bash
npx openspec validate --change ch-0001-add-bearer-authentication
```

El validador confirma que cada tarea trace a un requisito y que no hay tareas huérfanas.

### Paso 5: Archivar Cuando Completas

```bash
npx openspec archive --change ch-0001-add-bearer-authentication
```

Los deltas se fusionan en `openspec/main/specs/` y el cambio se mueve al archivo.

---

## El Valor a Largo Plazo

OpenSpec no es solo un sistema de documentación — es un **framework de gobernanza del conocimiento** para proyectos móviles. Cuando cada decisión arquitectónica está documentada y accesible por agentes de IA, el proyecto se vuelve:

1. **Auditable**: Puedes responder "¿por qué existe este código?" consultando el historial de cambios
2. **Transferible**: Un nuevo desarrollador puede entender la arquitectura leyendo las specs, no el código
3. **Resistente a la degradación**: Los agentes de IA se mantienen alineados porque las specs son el contrato
4. **Evolutivo**: Las specs crecen con el proyecto sin requerir esfuerzo upfront

Para equipos móviles que construyen aplicaciones complejas con agentes de IA, OpenSpec es la capa de rigor que falta entre el prototipado rápido y la producción sostenible.

---

## Referencias y Recursos

- [Documentación Oficial de OpenSpec](https://openspec.dev)
- [Repositorio de OpenSpec en GitHub](https://github.com/Fission-AI/OpenSpec)
- [Guía de OpenSpec — Redreamality](https://redreamality.com/garden/notes/openspec-guide/)
- [BiometricPrompt — Documentación oficial de Android](https://developer.android.com/training/sign-in/biometric)
- [EncryptedSharedPreferences — Jetpack Security](https://developer.android.com/topic/security/data)
- [Hilt — Inyección de dependencias para Android](https://dagger.dev/hilt/)