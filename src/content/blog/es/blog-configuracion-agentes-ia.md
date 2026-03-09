---
title: "Tu Staff Virtual: Configurando Sentinel, Bolt y Palette"
description: "Guía práctica paso a paso para implementar una arquitectura de agentes en tu proyecto Android. Configura tus propios agentes expertos y define sus reglas."
pubDate: 2025-05-21
tags: ["IA", "Tutorial", "Configuración", "Android", "Agentes"]
heroImage: "/images/placeholder-article-ai-setup.svg"
reference_id: "b0624ec0-08af-4dad-bc3f-7dce6d88c8ea"
---
En el [artículo anterior](/blog/blog-agentes-ia-android-teoria), exploramos por qué necesitamos agentes especializados en lugar de chats genéricos. Hoy, vamos a ensuciarnos las manos. Vamos a construir la infraestructura necesaria para que **Sentinel**, **Bolt** y **Palette** vivan en tu repositorio Android.

No necesitas instalar librerías complejas de Python ni configurar servidores locales. Solo necesitas organizar tu conocimiento en archivos Markdown que las IAs actuales (Claude, ChatGPT, Gemini) puedan consumir como contexto.

## Paso 1: La Estructura de Directorios

Lo primero es crear un "hogar" para tus agentes dentro de tu proyecto Android. Esta estructura separa las definiciones de los agentes de su memoria (bitácoras).

```text
MiProyectoAndroid/
├── app/
├── gradle/
├── agents/             <-- ¡Nueva carpeta!
│   ├── AGENTS.md       <-- El Cerebro (Contexto Global)
│   ├── bots/           <-- Las Personas (Definiciones)
│   │   ├── bot_Sentinel.md
│   │   ├── bot_Bolt.md
│   │   └── bot_Palette.md
│   └── bitácora/       <-- La Memoria (Logs)
│       ├── bitacora_Sentinel.md
│       └── ...
```

## Paso 2: El Cerebro (`AGENTS.md`)

Este es el archivo más importante. Es la "verdad" que todos los agentes deben conocer. En un proyecto Android, debe especificar versiones, librerías y patrones.

Crea `agents/AGENTS.md`:

```markdown
# AGENTS.md - Contexto Global

## 1. Stack Tecnológico
- **Lenguaje:** Kotlin 1.9 (Strict mode)
- **UI:** Jetpack Compose (Material3)
- **DI:** Hilt
- **Async:** Coroutines + Flow (No usar RxJava ni LiveData)
- **Red:** Retrofit + Moshi
- **Build:** Gradle Kotlin DSL (.kts)

## 2. Convenciones de Arquitectura
- **Patrón:** MVVM + Clean Architecture.
- **Capas:**
  - `data/`: Repositorios y fuentes de datos.
  - `domain/`: UseCases y Modelos puros (sin dependencias de Android).
  - `ui/`: ViewModels y Composables.

## 3. Reglas de Oro
- Nunca poner lógica de negocio en los Composables.
- Todos los strings deben ir en `strings.xml`.
- Usar `StateFlow` para exponer estado desde el ViewModel.
```

## Paso 3: Definiendo las Personas

Ahora, definamos a nuestros especialistas. Cada archivo `bot_*.md` es el "System Prompt" que usarás para inicializar una sesión con ese agente.

### Sentinel 🛡️ (Seguridad)
Crea `agents/bots/bot_Sentinel.md`. Su foco es ser paranoico con los datos.

```markdown
Eres "Sentinel" 🛡️, un experto en seguridad Android (OWASP Mobile Top 10).

**Tu Misión:**
Analizar el código proporcionado buscando vulnerabilidades de seguridad, fugas de datos o permisos innecesarios.

**Tus Reglas:**
1. Revisa siempre el `AndroidManifest.xml` buscando permisos peligrosos.
2. Busca claves de API hardcodeadas.
3. Verifica que `usesCleartextTraffic` esté en false.
4. En ProGuard/R8, asegura que no se ofusquen clases críticas de seguridad.

**Formato de Salida:**
Si encuentras un problema, clasifícalo como: [CRÍTICO], [ALTO], [MEDIO].
Propón la solución en código Kotlin seguro.
```

### Bolt ⚡ (Rendimiento)
Crea `agents/bots/bot_Bolt.md`. Su foco es la fluidez y la eficiencia.

```markdown
Eres "Bolt" ⚡, un ingeniero de rendimiento Android obsesionado con los 60fps.

**Tu Misión:**
Optimizar el código para reducir el uso de CPU, Memoria y Batería.

**Tus Reglas:**
1. Detecta operaciones bloqueantes en el Main Thread.
2. Sugiere `Dispatchers.Default` para operaciones intensivas de CPU.
3. En Compose, identifica recomposiciones innecesarias (sugiere `remember`, `derivedStateOf`).
4. Revisa el uso de `Bitmap` y cargas de imágenes grandes.

**Filosofía:**
"La velocidad es una funcionalidad". Si algo se puede hacer más rápido sin sacrificar legibilidad, hazlo.
```

### Palette 🎨 (UX/UI)
Crea `agents/bots/bot_Palette.md`. Su foco es la accesibilidad y el diseño.

```markdown
Eres "Palette" 🎨, un especialista en Material Design 3 y Accesibilidad Android.

**Tu Misión:**
Asegurar que la UI sea hermosa, consistente y accesible para todos.

**Tus Reglas:**
1. Verifica que todos los elementos interactivos tengan al menos 48x48dp.
2. Asegura que las imágenes decorativas tengan `contentDescription={null}` y las informativas tengan descripción.
3. Revisa el contraste de colores entre texto y fondo.
4. Sugiere animaciones de entrada/salida para mejorar la percepción de fluidez.
```

## Paso 4: Cómo usar tu Staff

Ahora que tienes los archivos, el flujo de trabajo es el siguiente:

1.  **Copia el Contexto:** Copia el contenido de `AGENTS.md`.
2.  **Elige tu Agente:** Copia el contenido de, por ejemplo, `bot_Bolt.md`.
3.  **Inicia la Sesión:** Pega ambos textos en tu LLM favorito (ChatGPT Plus, Claude 3 Opus, Gemini Advanced).
4.  **Trabaja:** "Bolt, revisa mi clase `HomeRepository.kt`. Siento que la carga de datos es lenta".

Al darle explícitamente el rol y el contexto del proyecto, la respuesta de la IA dejará de ser genérica y se convertirá en una consultoría experta sobre *tu* código.

## Conclusión

Has pasado de tener una herramienta genérica a tener un departamento técnico especializado. En el siguiente y último artículo, veremos **casos de uso reales**: pondremos a Sentinel a auditar un Manifest, a Bolt a optimizar un RecyclerView complejo, y a Palette a mejorar la accesibilidad de una pantalla de Login.
