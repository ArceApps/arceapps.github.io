---
title: "Adiós al Contexto Estático: Agent Skills y la Divulgación Progresiva"
description: "Optimiza el rendimiento de tu IA adoptando Agent Skills. Aprende a usar la divulgación progresiva para cargar contexto especializado solo cuando es necesario, ahorrando tokens y mejorando la precisión."
pubDate: 2026-01-07
heroImage: "/images/agent-skills-context.svg"
tags: ["IA", "Productividad", "Workflow", "Agent-Skills", "Android", "Skills"]
reference_id: "c8b07a57-31a7-459e-94af-fc4d60d827e7"
---

> **Nota:** Este artículo es una evolución directa de conceptos que hemos tratado previamente. Si eres nuevo aquí, te recomiendo leer primero sobre [cómo estandarizar el contexto con AGENTS.md](/blog/blog-agents-md-estandar) y [cómo configurar tus primeros agentes](/blog/blog-configuracion-agentes-ia). Hoy vamos un paso más allá para solucionar los problemas de escalabilidad de ese modelo.

Imagínate la escena: estás concentrado en ajustar una animación compleja en Jetpack Compose y le pides ayuda a tu asistente de IA. Sin embargo, antes de poder responderte, el modelo se ve obligado a procesar un archivo `AGENTS.md` inmenso que contiene desde las reglas de tu pipeline de CI/CD hasta guías de migración de bases de datos antiguas. Es como si consultaras a un experto para una duda rápida, pero le obligaras a leerse toda la documentación de tus repositorios antes de dejarle decir una palabra. Este enfoque de "contexto estático", aunque ha sido el estándar hasta ahora, está empezando a mostrar sus costuras.

## 🎯 El Problema del Contexto Monolítico

El problema de volcar todo el conocimiento del proyecto de golpe es triple. Por un lado, sacrificamos **precisión**: al inundar la ventana de contexto con reglas irrelevantes, bajamos la relación señal-ruido, lo que confunde al modelo y provoca alucinaciones o la aplicación de normas que no tocan. Por otro, está el **coste** y la eficiencia; desperdiciamos tokens procesando miles de líneas que no aportan nada a la tarea actual. Y no olvidemos la **experiencia de desarrollo**: mantener un archivo monolítico de instrucciones se vuelve insostenible a medida que el proyecto escala, convirtiéndose en un documento que nadie quiere tocar por miedo a romper algo.

La solución pasa por un cambio de paradigma: abandonar el bloque estático en favor de los **Agent Skills** y la **Divulgación Progresiva**. La idea es sencilla pero potente: dotar a tu IA de una arquitectura modular similar a la de un equipo de especialistas. En lugar de saberlo todo todo el tiempo, el agente debe ser capaz de "cargar" habilidades específicas —como un módulo experto en Gradle o una guía de estilos de UI— solo cuando el contexto lo demande. Así, obtenemos respuestas más rápidas, más baratas y, sobre todo, mucho más acertadas.

> **Write once, use everywhere:** Lo mejor de este enfoque es que el formato de Skills se está estandarizando. Una estructura similar funciona en **Claude Code**, **GitHub Copilot**, y herramientas emergentes basadas en protocolos abiertos como MCP (Model Context Protocol).

## 🧩 ¿Qué es un Skill? Anatomía Técnica

Un skill no es más que un paquete de conocimiento modular. Técnicamente, es una carpeta que contiene instrucciones y metadatos.

El flujo de "Divulgación Progresiva" funciona en tres niveles:

1.  **Nivel 1: Descubrimiento (Metadata)**
    La IA lee *solo* el nombre y la descripción del skill (definidos en YAML). Esto consume muy pocos tokens. El modelo se pregunta: *"¿Es este skill relevante para lo que me pide el usuario?"*.
2.  **Nivel 2: Instrucción (Instructions)**
    Si la respuesta es sí, la IA carga el contenido principal del skill (el archivo `.md`). Aquí están las reglas, guías de estilo y mejores prácticas.
3.  **Nivel 3: Recursos (Resources)**
    Para tareas complejas, el skill puede referenciar documentación extensa, scripts o assets que solo se leen si son absolutamente necesarios.

### Estructura de Archivos

Para instalar tus skills, simplemente crea la carpeta correspondiente según tu herramienta:

*   **Claude Code:** `.claude/skills/` (en tu proyecto) o `~/.claude/skills/` (global).
*   **GitHub Copilot / VS Code:** `.github/skills/` (estándar emergente).

Dentro, creas una subcarpeta por skill:

```text
.claude/skills/
└── android-gradle-doctor/
    └── skill.md       <-- Aquí vive la magia
```

## 🛠️ Ejemplos Prácticos para Android

Vamos a aterrizar esto con ejemplos reales de cómo estructuraríamos skills para un proyecto Android moderno en Kotlin.

### Skill 1: El Doctor de Gradle (`android-gradle-doctor`)

Este skill solo debería activarse cuando hay problemas de compilación o estamos tocando archivos `.kts`. No queremos que contamine el contexto cuando estamos diseñando UI.

**Archivo:** `.claude/skills/android-gradle-doctor/skill.md`

```markdown
---
name: android-gradle-doctor
description: Experto en resolución de conflictos de dependencias, catálogos de versiones (libs.versions.toml) y errores de compilación de Gradle en Android.
---

# Android Gradle Doctor

Actúa como un Ingeniero de Build Systems especializado en Android.

## Activación
Úsame cuando:
- El usuario comparta logs de error de compilación.
- Se modifiquen archivos `build.gradle.kts` o `libs.versions.toml`.

## Reglas de Oro
1.  **Version Catalog**: SIEMPRE verifica `gradle/libs.versions.toml`. Nunca sugieras hardcodear versiones en el `build.gradle.kts`.
2.  **KTS**: Asegúrate de que la sintaxis sea Kotlin DSL, no Groovy.
3.  **Conflictos**: Si hay conflicto de versiones transitivas, sugiere usar `./gradlew app:dependencies` para diagnosticar antes de forzar una resolución.

## Scripts de Ayuda
Si el error persiste, sugiere ejecutar:
`./gradlew clean build --stacktrace`
```

### Skill 2: Migrador a Compose (`compose-migrator`)

Un skill especializado que toma el control cuando detecta que quieres modernizar una pantalla antigua.

**Archivo:** `.claude/skills/compose-migrator/skill.md`

```markdown
---
name: compose-migrator
description: Asistente especializado en refactorizar layouts XML tradicionales de Android a Jetpack Compose moderno.
---

# Jetpack Compose Migrator

Tu objetivo es traducir layouts XML a funciones `@Composable` idiomáticas.

## Estrategia de Migración
1.  **Análisis**: Identifica el `ConstraintLayout` o `LinearLayout` raíz.
2.  **Mapeo**:
    - `RecyclerView` -> `LazyColumn`
    - `TextView` -> `Text` (con estilo de MaterialTheme)
    - `ImageView` -> `AsyncImage` (Coil)
3.  **Estado**: No traduzcas lógica de vista. Sugiere elevar el estado (`State Hoisting`) al ViewModel.

## Forbidden Patterns (Anti-patrones)
- NUNCA uses `AndroidView` para componentes que ya tienen equivalente nativo en Compose.
- NUNCA sugieras `ConstraintLayout` en Compose si una `Column` o `Row` simple funciona (por rendimiento).
```

### Skill 3: El Publisher (`play-store-publisher`)

Este skill es perfecto porque contiene reglas muy específicas y "pesadas" que solo necesitas una vez al mes: cuando vas a publicar una versión.

**Archivo:** `.claude/skills/play-store-publisher/skill.md`

```markdown
---
name: play-store-publisher
description: Guía para el proceso de release, firma de APKs/AABs y requisitos de metadatos para Google Play Console.
---

# Android Release Manager

## Checklist de Pre-Release
1.  **Version Code**: Verifica que `versionCode` en `build.gradle.kts` sea mayor que la versión anterior (format: `YYMMDDxx`).
2.  **Signing**: Asegúrate de que las variables de entorno `KEYSTORE_PASSWORD` y `KEY_ALIAS` estén configuradas. No hardcodees credenciales.
3.  **Proguard/R8**: Verifica que `isMinifyEnabled = true` en el buildType de release.

## Assets de Play Store
- **Icono**: 512x512 PNG 32-bit.
- **Feature Graphic**: 1024x500 JPG/PNG (sin transparencia).
- **Screenshots**: Mínimo 2 por factor de forma (Phone, 7-inch tablet, 10-inch tablet).
```

## 🚀 Conclusión: Empieza a Trabajar de Forma Inteligente

La era de los prompts kilométricos y los archivos de contexto monolíticos está llegando a su fin. Los **Agent Skills** no son solo una mejora técnica; son un cambio de mentalidad.

Nos permiten tratar a nuestros agentes de IA no como becarios a los que tenemos que explicarles todo cada vez, sino como un equipo de especialistas (un experto en Gradle, un experto en UI, un experto en DevOps) que entran y salen de la habitación exactamente cuando los necesitas.

¿Sigues volcando todo tu contexto de golpe o empiezas a construir tu biblioteca de skills hoy mismo?
