---
title: "Spec Kitty: La Evolución de GitHub Spec Kit para Desarrollo Móvil Impulsado por IA"
description: "Cómo Spec Kitty reimagina el Desarrollo Impulsado por Especificaciones para equipos móviles que usan Kotlin y Android, con una filosofía donde el código es la fuente de verdad y worktrees de Git que hacen que los agentes de IA sean genuinamente útiles."
pubDate: 2026-05-19
heroImage: "/images/blog-spec-kitty-mobile-development.svg"
tags: ["SDD", "Spec Kitty", "Spec Kit", "Android", "Kotlin", "IA Agéntica", "Desarrollo Móvil", "Spec-Driven Development", "Workflow", "Arquitectura", "Git Worktrees"]
reference_id: "a8f92c3d-4e15-4b7a-9f2c-1d3e5f6a7b8c"
---

> **Lecturas relacionadas:** [Análisis Profundo de Frameworks SDD: Spec Kit, OpenSpec y BMAD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad) · [OpenSpec para Desarrollo Móvil: SDD en Android y Kotlin](/blog/blog-openspec-mobile-development) · [Desarrollo Impulsado por Especificaciones con IA Agéntica](/blog/blog-specs-driven-development)

Cuando GitHub publicó Spec Kit como proyecto de código abierto a finales de 2025, estableció un hito en cómo los equipos de desarrollo podían estructurar flujos de trabajo asistidos por IA. El framework introdujo el concepto de **constitución** — un documento vivo que los agentes de IA consultan antes de generar cualquier código — junto con un sistema de cuatro fases con compuertas (`specify` → `plan` → `tasks` → `merge`) que exigía aprobación humana en cada transición. Fue un enfoque metódico y reflexivo que funcionaba admirablemente para equipos de desarrollo native para web incrustados en el ecosistema de GitHub.

Pero el desarrollo móvil tiene su propio ritmo. Los proyectos Android con Kotlin tienen restricciones específicas — fragmentación de dispositivos, requisitos de nivel de API, patrones específicos de plataforma como Jetpack Compose o inyección de dependencias con Hilt — que un framework de propósito general como Spec Kit no estaba diseñado para abordar. El momento en que un desarrollador móvil intentaba usar Spec Kit en un proyecto Android, la fricción se hacía evidente: el modelo de constitución asumía que podías escribir documentación comprehensiva del sistema desde el principio, pero los proyectos móviles evolucionan en incrementos pequeños y verificables donde la documentación prematura se convierte en deuda técnica.

**Spec Kitty** emerge de este vacío. Es una evolución de las ideas centrales de Spec Kit — desarrollo impulsado por especificaciones, compuertas con humano-en-el-bucle, persistencia de artefactos en el repositorio — pero rediseñada desde cero para cómo los desarrolladores móviles y Kotlin realmente trabajan. La diferencia más significativa: **el código es la fuente de verdad, no la especificación**. Las especificaciones en Spec Kitty son solicitudes de cambio (change requests), no documentación comprehensiva. Esta inversión suena sutil pero transforma todo sobre cómo los agentes de IA operan en un codebase móvil.

---

## La Inversión Fundamental: El Código Es Verdad, la Spec Es Delta

Para entender por qué esto importa, consideremos el modo de fallo clásico del desarrollo impulsado por especificaciones en contextos móviles.

Cuando un equipo móvil escribe un documento de especificación comprehensivo para una funcionalidad de autenticación, documentan todo el sistema: cómo se almacenan los tokens, qué APIs se llaman, qué pasa en caso de fallo, el flujo de UI para login y registro. El documento se convierte en la fuente de verdad. Pero seis meses después, cuando el equipo ha evolucionado la implementación — cambiando de JWT a OAuth2, añadiendo autenticación biométrica, modificando la estrategia de almacenamiento de tokens — el documento de especificación ya está obsoleto. Nadie lo actualizó. El agente de IA lee la spec, genera código basado en ella, e introduce bugs porque la spec ya no refleja la realidad.

La fundación filosófica de Spec Kitty aborda esto directamente. **La especificación es siempre un delta desde la realidad actual, nunca la realidad actual en sí.**

Esto significa:
- Las especificaciones describen qué quieres AÑADIR, MODIFICAR o ELIMINAR
- El agente de IA SIEMPRE lee el código real para entender el estado actual
- Después de que un cambio se fusiona, la spec se convierte en contexto histórico — el código es lo que importa
- No hay deriva entre especificación e implementación porque cumplen roles diferentes

Para un proyecto Android con Kotlin, esto se mapea limpiamente a cómo el desarrollo móvil realmente ocurre. No escribes una spec para todo el sistema de autenticación. Escribes una spec que dice: "Añadir autenticación biométrica como fallback cuando el dispositivo lo soporte, usando la API BiometricPrompt con EncryptedSharedPreferences para almacenamiento de tokens." El agente de IA lee la implementación actual de auth, entiende el flujo JWT existente, y añade la capa biométrica como delta. El código resultante es correcto porque el agente trabajó desde la verdad terreno.

### Cómo Spec Kitty Se Diferencia del Modelo de Constitución de Spec Kit

Spec Kit usa una **constitución** como el artefacto de contexto primario. La constitución intenta documentar todas las decisiones arquitectónicas, estándares de codificación, elecciones tecnológicas y restricciones. Cuando ejecutas `/speckit.specify`, el agente carga la constitución y la usa para validar la spec generada.

Esto funciona cuando:
- El proyecto tiene una arquitectura estable y bien comprendida
- Estás construyendo desde cero (greenfield)
- El equipo puede invertir tiempo upfront en documentación comprehensiva

Se rompe cuando:
- El proyecto es brownfield con decisiones no documentadas dispersas en el codebase
- Los requisitos cambian frecuentemente y las specs se vuelven obsoletas
- La constitución crece tanto que los agentes la ignoran

Spec Kitty elimina la constitución completamente. En su lugar, la charter (`doctrine/charter.md`) define principios de desarrollo immutables — imperativo test-first, arquitectura library-first, restricciones de simplicidad — en lugar de documentación comprehensiva del sistema. Estos principios guían el comportamiento del agente sin intentar documentar el estado actual del sistema.

La diferencia práctica para un desarrollador Android:

**Enfoque Spec Kit:**
```
Constitución: "El sistema usa Retrofit 2.9 para networking, Moshi para serialización JSON,
Hilt para DI, Coroutines para async, StateFlow para estado UI. Nunca uses LiveData."
→ El agente lee la constitución
→ El agente genera spec de autenticación asumiendo Retrofit + Moshi + Hilt
```

**Enfoque Spec Kitty:**
```
Charter: "Imperativo test-first. Todas las operaciones de red DEBEN tener tests de contrato
antes de la implementación. Library-first: cada funcionalidad empieza como un módulo
independiente."
→ El agente lee la implementación actual de auth en el codebase
→ El agente lee la spec de Spec Kitty para el cambio: "Añadir auth biométrica con BiometricPrompt"
→ El agente genera implementación basada en código real + spec delta
```

El segundo enfoque es más robusto porque el agente nunca toma decisiones basadas en documentación obsoleta.

---

## La Arquitectura de Spec Kitty para Proyectos Android

Un proyecto Android con Kotlin usando Spec Kitty tiene una estructura de directorios específica que organiza los artefactos de especificación junto a la implementación:

```
mi-app-android/
├── app/
│   └── src/main/
│       ├── java/com/miapp/
│       └── res/
├── kitty-specs/                  # Artefactos de Spec Kitty (no van al APK)
│   ├── 001-auth-biometrica/
│   │   ├── spec.md               # Especificación de la funcionalidad
│   │   ├── plan.md               # Plan de implementación
│   │   ├── research.md           # Hallazgos de investigación técnica
│   │   ├── data-model.md         # Entidades de dominio y relaciones
│   │   ├── contracts/             # Especificaciones de API
│   │   │   └── biometric-api.md
│   │   ├── tasks.md              # Lista de verificación de tareas
│   │   └── tasks/                # Prompts de work packages (estructura plana)
│   │       ├── WP01-deps.md
│   │       ├── WP02-almacenamiento.md
│   │       ├── WP03-biometrico.md
│   │       └── WP04-integracion.md
│   └── _archive/                 # Specs de funcionalidades completadas
├── .worktrees/                   # Worktrees de Git para desarrollo paralelo
│   └── 001-auth-biometrica/     # Checkout aislado para esta funcionalidad
├── doctrine/                     # Charter y principios
│   └── charter.md
└── build.gradle.kts
```

El directorio `kitty-specs/` es el corazón del sistema. A diferencia de una carpeta general de documentación, está estructurado alrededor de **misiones** (el término de Spec Kitty para funcionalidades) con un ciclo de vida claro: especificación → planificación → tareas → implementación → revisión → aceptación → fusión → archivo.

### La Idea Clave: Worktrees para Aislamiento

Una de las características más prácticas de Spec Kitty es su uso de **git worktrees** para aislamiento de funcionalidades. Cuando ejecutas `/spec-kitty.specify "Añadir autenticación biométrica"`, el CLI:

1. Crea una rama semántica: `001-auth-biometrica`
2. Genera un worktree en `.worktrees/001-auth-biometrica/`
3. Cambia tu agente (Claude, Cursor, Gemini) a ese checkout aislado

Esto importa enormemente para desarrollo móvil porque:

- **Sin overhead de cambio de rama**: Trabajas en el worktree de la funcionalidad, haces commits, y la rama principal se mantiene limpia. Sin ciclos de `git stash` / `git checkout` cuando necesitas verificar algo rápidamente en main.
- **Desarrollo paralelo verdadero**: Si estás construyendo dos funcionalidades simultáneamente, puedes tener dos worktrees con diferentes agentes trabajando independientemente.
- **Transferencia limpia**: Cuando una funcionalidad está completa, el worktree se fusiona limpiamente y desaparece. Sin ramas huérfanas.

Para Android específicamente, el enfoque de worktree se alinea bien con cómo funcionan los módulos de Gradle. Una funcionalidad podría involucrar cambios al módulo app, un nuevo módulo de biblioteca para el wrapper biométrico, y módulos de test — todo aislado en el worktree sin tocar main.

---

## Comparando Spec Kitty y OpenSpec: Dos Filosofías, Un Problema

Tanto Spec Kitty como OpenSpec abordan el mismo problema central — mantener a los agentes de IA alineados con la intención arquitectónica en un codebase que evoluciona continuamente. Pero se aproximan desde ángulos fundamentalmente diferentes.

### El Modelo de Propuesta de Cambio de OpenSpec

OpenSpec trata cada modificación como una **propuesta formal** con una estructura específica:

```
openspec/
├── main/specs/                    # Specs canónicas del proyecto (construidas con el tiempo)
│   ├── architecture.md
│   └── security.md
└── changes/
    └── ch-0042-add-biometric/    # Cada cambio es una propuesta autocontenida
        ├── proposal.md             # Por qué, qué, alcance
        ├── specs/                 # Deltas de spec (adiciones/modificaciones/eliminaciones)
        │   └── biometric-spec.md
        ├── tasks.md               # Tareas atómicas verificables
        └── design.md              # Decisiones arquitectónicas
```

La innovación clave es **construcción retroactiva de specs**: empiezas con un directorio `main/specs/` vacío y lo construyes incrementalmente. Cada cambio, cuando se archiva, fusiona sus specs delta de vuelta a las specs canónicas. Después de un año de cambios, tienes un documento de especificación comprehensivo que fue construido orgánicamente en lugar de escrito especulativamente.

El paso de validación (`openspec validate`) asegura alineación spec-tarea antes de que comience la implementación. Esto detecta discrepancias entre lo propuesto y lo planificado *antes* de que se escriba cualquier código.

### El Modelo Basado en Misiones de Spec Kitty

Spec Kitty organiza el trabajo alrededor de **misiones** (funcionalidades) en lugar de cambios. La distinción es sutil pero importante:

- **Cambio OpenSpec**: Una modificación al comportamiento existente del sistema
- **Misión Spec Kitty**: Un resultado orientado al usuario que podría involucrar múltiples sistemas

Una funcionalidad de autenticación biométrica en Spec Kitty es una misión (`001-auth-biometrica`). Dentro de esa misión, hay work packages que podrían tocar la capa de almacenamiento, la integración de API biométrica, la UI y los tests — cada uno como un work package separado con su propio lane de ciclo de vida.

La gobernanza basada en charter de Spec Kitty proporciona restricciones que OpenSpec carece. La charter define principios immutables (test-first, library-first, restricciones de simplicidad) que aplican a todas las misiones. Esto significa que no necesitas redescubrir principios arquitectónicos para cada funcionalidad — están integrados en el flujo de trabajo.

### Tabla Comparativa de Características

| Aspecto | Spec Kitty | OpenSpec |
|---------|------------|----------|
| **Artefacto primario** | Misión (funcionalidad) con work packages | Propuesta de cambio con specs delta |
| **Contexto arquitectónico** | Principios de charter + código real | Specs canónicas construidas via archivo |
| **Alcance de especificación** | Delta desde código actual (solicitud de cambio) | Puede ser delta o comprehensivo |
| **Compuertas de aprobación humana** | Specify, plan, tasks, review, accept, merge | Propuesta, validación de spec |
| **Desarrollo paralelo** | Git worktrees (aislamiento nativo) | Basado en ramas (gestión manual) |
| **Amigabilidad brownfield** | Alta — trabaja desde código real | Alta — construye specs retroactivamente |
| **Soporte Android/Kotlin** | Multi-agente, aware de Hilt/Compose | Basado en cambios, agnóstico de plataforma |
| **Herramienta CLI** | `spec-kitty` (Python) | `openspec` (Node.js) |
| **Madurez** | Desarrollo activo, v3.x | Establecido, v2.x |

### Cuándo Elegir Cuál

**Elige Spec Kitty cuando:**
- Quieres principios de charter que apliquen consistentemente en todas las funcionalidades
- Trabajas con múltiples agentes de IA simultáneamente (Claude + Cursor + Gemini en paralelo)
- Los git worktrees encajan en tu flujo de trabajo (cambio rápido de rama, funcionalidades paralelas)
- Valoras el imperativo test-first aplicado como compuerta en lugar de como convención
- Tu proyecto Android usa intensamente Hilt, Compose y Coroutines — Spec Kitty tiene templates que entienden estos patrones

**Elige OpenSpec cuando:**
- Quieres trazabilidad a nivel de cambio (cada cambio es una propuesta formal con su propio delta)
- Tu equipo está cómodo con flujo de trabajo basado en ramas en lugar de worktrees
- El ecosistema Node.js encaja mejor en tu tooling
- Quieres una ceremonia más ligera para cambios pequeños (menos compuertas obligatorias)

La respuesta honesta es que para un proyecto Android con Kotlin y un equipo que usa múltiples asistentes de codificación con IA, **el modelo de worktree y los principios de charter de Spec Kitty proporcionan gobernanza más robusta**. Pero si ya estás invertido en OpenSpec y funciona para tu equipo, la hierba no es más verde al otro lado — ambos resuelven el mismo problema bien.

---

## Ejemplos de Implementación en Kotlin y Android

 recorramos cómo Spec Kitty maneja un escenario Android concreto: añadiendo autenticación biométrica a un sistema de login existente.

### Paso 1: Inicializar el Proyecto

```bash
# Instalar el CLI de Spec Kitty
pipx install spec-kitty-cli

# Inicializar con Claude Code como el agente primario
spec-kitty init mi-app-android --ai claude

cd mi-app-android
spec-kitty verify-setup
```

El comando init crea la estructura de directorios `kitty-specs/`, configura la carpeta `doctrine/` con una charter por defecto, y genera archivos de comando de agente para Claude Code (`.claude/commands/`).

### Paso 2: Crear la Especificación de la Misión

```text
/spec-kitty.specify

Añadir autenticación biométrica al flujo de login existente. Los usuarios con
reconocimiento de huella dactilar o facial deben poder autenticarse usando
BiometricPrompt. Los dispositivos sin capacidad biométrica deben hacer fallback
al flujo de PIN/contraseña existente. Almacenar tokens de autenticación en
EncryptedSharedPreferences usando la biblioteca AndroidX Security.
```

El CLI entra en modo descubrimiento, haciendo preguntas de clarificación sobre:
- Qué tipos biométricos soportar (huella, rostro, iris)
- Si exigir biométrico como auth primaria o permitirlo como opcional
- Cómo debe funcionar el fallback cuando falla lo biométrico
- Puntos de integración con el AuthManager existente

Después de completar la entrevista, crea `kitty-specs/001-auth-biometrica/spec.md` con la especificación estructurada.

### Paso 3: Generar el Plan de Implementación

```text
/spec-kitty.plan

Usar la biblioteca AndroidX Biometric 1.1.0, AndroidX Security-Crypto 1.1.0-alpha06
para EncryptedSharedPreferences. Mantener el flujo JWT existente para autenticación
de red. Añadir BiometricPrompt para autenticación local con BiometricManager.canAuthenticate()
para verificar disponibilidad en tiempo de ejecución.
```

El comando de plan crea `plan.md` con:
- Enfoque técnico (BiometricPrompt + EncryptedSharedPreferences)
- Estructura de módulos (nuevo módulo de biblioteca BiometricAuth)
- Adiciones de dependencias a build.gradle.kts
- Decisiones arquitectónicas con racional

### Paso 4: Fase de Investigación (Opcional pero Recomendada)

```text
/spec-kitty.research

Investigar:
1. Mejores prácticas para manejo de errores de BiometricPrompt
2. Consideraciones de seguridad para autenticación biométrica en Android
3. Impacto en rendimiento de la autenticación biométrica
4. Estrategias de testing para flujos biométricos (requiere tests de instrumentación)
```

Esto genera `research.md` con hallazgos del agente de investigación, incluyendo notas de compatibilidad de bibliotecas y benchmarks de seguridad específicos de Android.

### Paso 5: Generar los Work Packages

```text
/spec-kitty.tasks
```

Esto crea `tasks.md` con la lista de verificación de tareas y archivos individuales de work package en `tasks/`:

**WP01-deps.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Instalación de Dependencias

1. Añadir `androidx.biometric:biometric:1.1.0` a `app/build.gradle.kts`
2. Añadir `androidx.security:security-crypto:1.1.0-alpha06` a dependencias
3. Verificar que `minSdk` es 23 o superior (requerido para BiometricPrompt)
4. Ejecutar `./gradlew dependencies` para confirmar sin conflictos de versión
```

**WP02-almacenamiento.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Almacenamiento Seguro de Tokens

1. Crear clase `SecureTokenStorage` envolviendo EncryptedSharedPreferences
2. Implementar `MasterKey` usando `MasterKey.Builder` con `setKeyScheme(MasterKey.KeyScheme.AES256_GCM)`
3. Migrar tokens existentes de SharedPreferences a EncryptedSharedPreferences
4. Añadir tests unitarios para operaciones de lectura/escritura de `SecureTokenStorage`
```

**WP03-biometrico.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Integración de BiometricPrompt

1. Crear clase `BiometricAuthenticator` con método `authenticate()`
2. Usar `BiometricPrompt.PromptInfo` con `setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)`
3. Manejar `BiometricPrompt.AuthenticationCallback` con paths de éxito, error y fallo
4. Implementar fallback a PIN cuando `canAuthenticate()` retorna `BIOMETRIC_NO_HARDWARE` o `BIOMETRIC_ERROR_NONE_ENROLLED`
5. Añadir tests de instrumentación para el flujo biométrico
```

**WP04-integracion.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Integración con Flujo de Login

1. Modificar `LoginViewModel` para exponer estado de auth biométrica vía `StateFlow<BiometricState>`
2. Añadir botón "Usar huella" a `LoginScreen` composable
3. Conectar click del botón biométrico para activar `BiometricAuthenticator.authenticate()`
4. En auth biométrica exitosa, recuperar token de `SecureTokenStorage` y proceder a home
5. Verificar que el flujo existente de PIN/contraseña sigue funcionando cuando biométrico no disponible
```

### Paso 6: Implementar con Comandos de Workflow

```bash
# Comenzar a implementar WP01 - mueve automáticamente a lane "doing"
spec-kitty agent action implement WP01
```

El comando de workflow:
1. Mueve WP01 de `planned` → `doing` en frontmatter
2. Añade entrada de log de actividad con timestamp e info del agente
3. Muestra el prompt completo de implementación con instrucciones
4. Hace commit de la transición de lane a git

Después de la implementación:
```bash
# Cuando está hecho, avanzar a for_review
spec-kitty agent action implement WP01
# Esto mueve de "doing" a "for_review"
```

### Paso 7: Revisar y Aceptar

```text
/spec-kitty.review
```

El comando de revisión:
1. Auto-detecta primer WP con `lane: "for_review"`
2. Mueve a `doing` y muestra instrucciones de revisión
3. El agente revisa el código contra la spec
4. El humano aprueba (→ `done`) o solicita cambios (→ `planned`)

Una vez todos los WPs están en `done`:
```text
/spec-kitty.accept
# Valida todos los WPs completos, metadata de frontmatter, checkboxes de tasks
# Registra metadata de aceptación en meta.json

/spec-kitty.merge --push
# Fusiona rama de funcionalidad a main, elimina worktree
```

---

## Flujos de Trabajo Multi-Agente en Spec Kitty

El diseño de Spec Kitty acomoda múltiples agentes de IA trabajando simultáneamente — un escenario cada vez más común en desarrollo móvil donde un agente maneja lógica de negocio mientras otro se enfoca en UI o infraestructura.

### Orquestando Claude y Gemini en la Misma Funcionalidad

En el patrón multi-agente, los agentes se especializan:

- **Claude**: Descubrimiento, planificación, revisión (tareas narrativas pesadas)
- **Gemini**: Modelado de datos, investigación, diseño de API (profundidad técnica)
- **Cursor**: Implementación (integración IDE, iteración rápida)

Para la funcionalidad de auth biométrica, la orquestación se ve así:

1. **Lead (Claude) ejecuta specify**: `/spec-kitty.specify` crea la estructura de misión
2. **Lead cambia a worktree**: `cd .worktrees/001-auth-biometrica`
3. **Gemini ejecuta research**: `/spec-kitty.research` investiga implicaciones de seguridad biométrica
4. **Claude ejecuta plan**: `/spec-kitty.plan` genera el enfoque de implementación
5. **Claude ejecuta tasks**: `/spec-kitty.tasks` crea work packages
6. **Cursor implementa**: `spec-kitty agent action implement WP03` mientras Claude maneja revisión
7. **Lead acepta y fusiona**: Después de que todos los WPs se completan

El directorio plano `tasks/` con frontmatter basado en lanes hace esta coordinación robusta. Cada agente trabaja en su WP asignado sin pisar el trabajo de otros. El dashboard (`spec-kitty dashboard`) muestra posiciones de lane en tiempo real para que nadie duplique trabajo.

### Ejemplo de Colaboración Claude + Cursor

Para equipos que usan Claude para planificación y Cursor para implementación:

```bash
# Setup del proyecto (una vez)
cd mi-app-android
claude

# Claude crea la misión
/spec-kitty.specify

Añadir soporte de sync offline-first para la gestión de inventario con
resolución de conflictos usando last-write-wins y un indicador de sync
en la UI mostrando uploads pendientes.

# Cambiar a worktree - Claude continúa planificación
cd .worktrees/002-sync-offline
claude

# Fase de planificación
/spec-kitty.plan

Usar base de datos Room con WorkManager para sync en background,
Retrofit para llamadas API, Kotlin Flows para streams de datos reactivos.
Implementar resolución de conflictos en la capa Repository.

# Generar tareas
/spec-kitty.tasks

# Salir de Claude, iniciar Cursor en mismo worktree
exit
cursor-agent

# Cursor implementa desde work packages
spec-kitty agent action implement WP01  # Schema de base de datos
spec-kitty agent action implement WP02  # DAOs de Room
spec-kitty agent action implement WP03  # Sync con WorkManager
spec-kitty agent action implement WP04  # Indicador de sync en UI

# Cursor sale, Claude revisa
exit
claude

/spec-kitty.review  # Revisa cada WP desde lane for_review
```

El mecanismo clave habilitando esta colaboración es el **prompt bundle** en cada archivo de work package. El prompt contiene todo lo que el agente implementador necesita: contexto de spec.md y plan.md, instrucciones específicas de implementación, criterios de aceptación que el agente auto-verificará, los comandos exactos a ejecutar para validación, y las instrucciones de transición de lane.

---

## Por Qué la Filosofía de Spec Kitty Funciona Mejor para Agentes de IA

Los documentos de especificación tradicionales asumen que humanos los leerán. Optimizan para comprensión humana: explicaciones narrativas, diagramas, ejemplos y prosa que guía el entendimiento. Los agentes de IA no necesitan esta optimización — pueden parsear contenido estructurado y extraer significado directamente de él.

Spec Kitty aprovecha esto estructurando specs como **prompts ejecutables** en lugar de documentos legibles por humanos. El prompt del work package no es una descripción de qué construir — es una instrucción directa para el agente de IA que incluye:

- El contexto de spec.md y plan.md
- Instrucciones específicas de implementación
- Los criterios de aceptación que el agente auto-verificará
- Los comandos exactos a ejecutar para validación
- Las instrucciones de transición de lane

Esto significa que las specs de Spec Kitty son más densas y menos narrativas que las especificaciones tradicionales. Asumen un lector de IA. Para humanos que necesitan entender el trabajo, los archivos `spec.md`, `plan.md` y `tasks.md` proporcionan la vista narrativa — pero el agente trabaja desde los prompt bundles, que están optimizados para consumo por máquina.

La charter juega un papel crucial aquí. Porque la charter define principios immutables (test-first, library-first, simplicidad), los prompt bundles no necesitan repetir restricciones arquitectónicas. El agente sabe: "Debo escribir tests antes de la implementación. Debo empezar esto como un módulo de biblioteca antes de integrarlo en la app. Debo usar características del framework directamente en lugar de envolverlas." Estas restricciones están embebidas en la charter, no en cada spec.

Para un desarrollador Android con Kotlin, esto significa:
- Escribes menos documentación (la charter maneja las restricciones)
- El agente genera código más correcto (los principios de charter se aplican)
- Pasas menos tiempo revisando porque el agente auto-valida contra principios de charter

---

## Empezando con Spec Kitty en Android

Si estás convencido y quieres probarlo:

### 1. Instalar e Inicializar

```bash
pipx install spec-kitty-cli

# Crear un nuevo proyecto o inicializar existente
spec-kitty init mi-app-android --ai claude

cd mi-app-android
spec-kitty verify-setup
```

### 2. Revisar y Personalizar la Charter

La charter por defecto (`doctrine/charter.md`) tiene valores sensatos para Android:

```markdown
## Artículo III: Imperativo Test-First
Toda implementación DEBE seguir Desarrollo Dirigido por Tests estricto.
Ningún código de implementación se escribirá antes de que:
1. Los tests unitarios estén escritos y confirmados como FALLANDO (fase Red)
2. Los tests sean validados y aprobados
```

Para tu proyecto, podrías añadir:
- Restricciones de versión de bibliotecas AndroidX
- Requisitos de testing de Compose
- Requisitos de SDK mínimo forzados a nivel de spec
- Convenciones de módulos Hilt

### 3. Ejecutar Tu Primera Misión

```text
/spec-kitty.specify

Añadir soporte de notificaciones push usando Firebase Cloud Messaging.
Soportar acciones de tap en notificaciones que deep-link a pantallas específicas.
Manejar permisos de notificación en Android 13+ (API 33) con una
explicación racional a los usuarios antes de solicitar.
```

La entrevista de descubrimiento preguntará sobre categorías de notificación, niveles de prioridad, manejo de payload de datos, y estrategia de testing. Responde las preguntas, y Spec Kitty genera una estructura de misión completa.

### 4. Seguimiento Visual del Progreso

```bash
spec-kitty dashboard
# Abre el kanban board local en http://localhost:3000
```

El dashboard muestra todas las misiones y sus work packages en posiciones de lane. Puedes filtrar por agente, ver historial de actividad, e identificar bloqueos de un vistazo.

---

## Conclusión: Spec Kitty como la Evolución de Spec Kit para Móvil

Spec Kitty no reemplaza a Spec Kit — evoluciona sus ideas centrales para contextos para los que Spec Kit no fue diseñado. La gobernanza basada en charter, el aislamiento via worktrees, y la filosofía de código-como-verdad lo hacen particularmente adecuado para equipos de desarrollo Android y Kotlin que trabajan con agentes de codificación con IA.

El diferenciador clave es **pragmatismo sobre comprehensividad**. En lugar de intentar documentar todo el sistema upfront (modelo de constitución de Spec Kit), Spec Kitty trata las especificaciones como solicitudes de cambio que trabajan junto al código real. En lugar de requerir propuestas formales para cada modificación (modelo de cambio de OpenSpec), Spec Kitty usa organización basada en misiones con ceremonia más ligera para funcionalidades pequeñas.

Para desarrolladores móviles, esto se mapea limpiamente a cómo realmente trabajan: incrementos pequeños, resultados verificables, restricciones específicas de plataforma que cambian con el tiempo. La charter mantiene los principios arquitectónicos consistentes mientras las specs permanecen enfocadas y actuales.

Si ya estás usando Spec Kit u OpenSpec, Spec Kitty no es necesariamente una migración — es un enfoque alternativo que podría encajar mejor en tu flujo de trabajo. Evalúa basándote en tu tamaño de equipo, complejidad del proyecto, y cuántos agentes de IA usas simultáneamente. Para un desarrollador en solitario o equipo pequeño haciendo desarrollo Android con uno o dos asistentes de IA, el modelo de worktree y la aplicación de charter de Spec Kitty proporcionan ventajas significativas sobre enfoques menos estructurados.

El ecosistema alrededor de Spec Kitty se está desarrollando activamente — la serie v3.x está añadiendo características como sync hospedado, autenticación de teamspace, y visualizaciones de dashboard mejoradas. Vigila el proyecto si te tomas en serio el desarrollo móvil aumentado por IA.

---

## Referencias y Enlaces

- [Repositorio de Spec Kitty en GitHub](https://github.com/Priivacy-ai/spec-kitty)
- [Spec Kit por GitHub](https://github.com/github/spec-kit)
- [OpenSpec por Fission-AI](https://github.com/Fission-AI/OpenSpec)
- [Guía de Desarrollo Impulsado por Especificaciones (Spec Kitty)](spec-driven.md)
- [Análisis de Frameworks SDD: Spec Kit, OpenSpec, BMAD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad)
- [OpenSpec para Desarrollo Móvil](/blog/blog-openspec-mobile-development)