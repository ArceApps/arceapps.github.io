---
title: "Potencia tus Agentes de IA con Skills: De Gemini a Copilot"
description: "Descubre cómo transformar tu asistente de IA generalista en un equipo de especialistas usando Agent Skills. Incluye ejemplos prácticos para Android, Kotlin y Conventional Commits."
pubDate: 2025-05-24
heroImage: "/images/agent-skills-gemini.svg"
tags: ["IA", "Gemini", "GitHub Copilot", "Android", "Kotlin", "Productividad"]
---

La inteligencia artificial en el desarrollo de software ha evolucionado rápidamente. Hemos pasado de simples prompts de "copia y pega" a contextos complejos gestionados por archivos como `AGENTS.md` o `GEMINI.md`. Sin embargo, a medida que nuestros proyectos crecen, también lo hace el contexto que necesitamos proporcionar. Aquí es donde entra en juego el siguiente gran salto: los **Agent Skills**.

Tanto **Google Gemini** como **GitHub Copilot** (y otros como Claude Code o ChatGPT) están adoptando este modelo modular. En lugar de cargar un contexto monolítico gigante, los "Skills" permiten que la IA cargue conocimientos específicos bajo demanda, comportándose como un verdadero equipo de especialistas.

## 🧩 ¿Qué es un Skill?

Un **Skill** es básicamente una carpeta que encapsula un conocimiento específico. Imagínalo como instalar un plugin en tu cerebro digital. En lugar de explicarle a tu IA cómo funcionan las normas de tu empresa en cada chat, el agente "descubre" que tiene una habilidad llamada `company-standards` y la invoca solo cuando detecta que la necesita.

La estructura estándar (definida en gran parte por herramientas como Gemini CLI) suele ser:

```text
.gemini/skills/ (o .github/skills/)
└── mi-skill/
    ├── SKILL.md       <-- Instrucciones y metadatos
    └── scripts/       <-- Herramientas ejecutables (opcional)
```

Puedes leer más sobre la especificación oficial en la [documentación de Gemini CLI](https://geminicli.com/docs/cli/skills/) o explorar miles de habilidades creadas por la comunidad en [SkillsMP](https://skillsmp.com/es).

## 🛠️ Ejemplo 1: El Experto en Conventional Commits

Una de las tareas más repetitivas es redactar mensajes de commit que sigan estrictamente la convención. Vamos a crear un Skill que convierta a tu agente en un experto en **Conventional Commits**.

**Archivo:** `.gemini/skills/conventional-commits/SKILL.md`

```markdown
---
name: conventional-commits
description: Experto en redactar mensajes de commit siguiendo el estándar Conventional Commits. Úsalo cuando el usuario pida generar un commit o revisar cambios para subir.
---

# Conventional Commits Expert

Actúa como un experto en control de versiones que sigue estrictamente la especificación [Conventional Commits](https://www.conventionalcommits.org/).

## Estructura del Mensaje

```text
<tipo>[ambito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

## Tipos Permitidos
- **feat**: Una nueva característica para el usuario.
- **fix**: Un arreglo a un bug para el usuario.
- **docs**: Cambios solo en la documentación.
- **style**: Cambios de formato (espacios, comas) que no afectan el código.
- **refactor**: Cambio de código que no arregla bugs ni añade features.
- **perf**: Cambio de código que mejora el rendimiento.
- **test**: Añadir o corregir tests.
- **build**: Cambios que afectan al sistema de build o dependencias externas.
- **ci**: Cambios en archivos de configuración de CI (GitHub Actions, etc.).
- **chore**: Otros cambios que no modifican src o test.

## Reglas de Oro
1.  **Imperativo**: La descripción debe estar en imperativo ("agrega" en lugar de "agregado").
2.  **Minúsculas**: No uses mayúscula inicial en la descripción corta.
3.  **Sin punto final**: La primera línea no debe terminar en punto.
4.  **Breaking Changes**: Si hay cambios que rompen compatibilidad, añade `BREAKING CHANGE:` en el pie o un `!` después del tipo (ej: `feat!: ...`).

## Flujo de Trabajo
1.  Analiza los cambios en el `git diff`.
2.  Identifica el propósito principal (feature, fix, refactor, etc.).
3.  Genera 3 opciones de mensaje de commit.
```

Con este skill instalado, cada vez que le pidas "genera el commit para estos cambios", la IA sabrá exactamente qué formato usar sin que tengas que recordárselo.

## 📱 Ejemplo 2: Detector de Fugas en Android (Kotlin)

Para los desarrolladores Android, detectar *Memory Leaks* es crucial. Este skill ayuda a la IA a identificar patrones peligrosos en el código Kotlin.

**Archivo:** `.gemini/skills/android-leak-detector/SKILL.md`

```markdown
---
name: android-leak-detector
description: Especialista en detectar fugas de memoria (Memory Leaks) en código Android y Kotlin. Úsalo para revisar código o analizar errores de OutOfMemoryError.
---

# Android Leak Hunter

Tu objetivo es identificar patrones de código que comúnmente causan fugas de memoria en Android.

## Patrones a Vigilar (Red Flags)

### 1. Context en Objetos Estáticos
**Mal:** `companion object { var context: Context? = null }`
**Bien:** Nunca almacenes `Context`, `View` o `Activity` en campos estáticos. Si necesitas un contexto global, sugiere usar `WeakReference<Context>` o inyectar el `ApplicationContext`.

### 2. Inner Classes No Estáticas
**Mal:** Clases internas (`inner class`) o anónimas (como `Handler` o `Runnable`) definidas dentro de una Activity que sobreviven al ciclo de vida.
**Solución:** Sugiere convertirlas a `static class` (en Java) o clases anidada normales en Kotlin, y pasar las dependencias necesarias como referencias débiles.

### 3. Listeners y Observables sin limpiar
**Regla:** Si un componente se suscribe a un evento (EventBus, BroadcastReceiver, LocationManager) en `onStart`/`onResume`, DEBE desuscribirse en `onStop`/`onPause`.
**Verificación:** Busca llamadas a `register` sin su correspondiente `unregister`.

### 4. Coroutines y Lifecycle
**Mal:** Lanzar corrutinas en `GlobalScope` desde componentes con ciclo de vida (Activity/Fragment).
**Solución:** Sugiere siempre usar `lifecycleScope` o `viewModelScope` para asegurar que las tareas se cancelen automáticamente cuando la vista se destruye.

## Acción Recomendada
Si detectas uno de estos patrones:
1.  Señala la línea exacta.
2.  Explica por qué causa una fuga (referencia retenida).
3.  Proporciona el código refactorizado usando las mejores prácticas (ej: `WeakReference`, `LifecycleOwner`).
```

## 🧹 Ejemplo 3: El Guardián del Estilo Kotlin

Un skill para asegurar que el código no solo funcione, sino que sea idiomático y limpio.

**Archivo:** `.gemini/skills/kotlin-style-guardian/SKILL.md`

```markdown
---
name: kotlin-style-guardian
description: Linter y refactorizador de código Kotlin enfocado en idiomaticidad y limpieza. Úsalo para Code Reviews.
---

# Kotlin Style Guardian

Actúa como un Senior Android Developer revisando Pull Requests.

## Checklist de Idiomaticidad

1.  **Null Safety:**
    -   Evita `!!` a toda costa. Sugiere `?.let {}`, `?:` (Elvis operator) o smart casts.
    -   Prefiere `val` sobre `var` siempre que sea posible (inmutabilidad).

2.  **Scope Functions:**
    -   Usa `apply` para configuración de objetos.
    -   Usa `let` para bloques que dependen de un resultado no nulo.
    -   Usa `run` para bloques de inicialización y cálculo.

3.  **Collections:**
    -   Prefiere `Sequence` (con `asSequence()`) para cadenas largas de operaciones (`map`, `filter`) en listas grandes para mejorar rendimiento.
    -   Usa funciones de extensión como `firstOrNull()` en lugar de comprobar tamaño.

4.  **Expresiones:**
    -   Prefiere `if` y `when` como expresiones (asignando su valor) en lugar de sentencias de control de flujo imperativas.
    -   Usa "Expression Body" para funciones de una sola línea (`fun sum(a: Int, b: Int) = a + b`).

## Ejemplo de Refactorización
**Input:**
```kotlin
fun getUserName(user: User?): String {
    if (user != null) {
        if (user.name != null) {
            return user.name!!
        }
    }
    return "Guest"
}
```

**Output Sugerido:**
```kotlin
fun getUserName(user: User?) = user?.name ?: "Guest"
```
```

## Conclusión

La arquitectura de **Agent Skills** nos permite escalar la ayuda que recibimos de la IA sin saturar su contexto ni nuestro presupuesto de tokens. Al definir roles claros (el experto en commits, el cazador de fugas, el guardián de estilo), convertimos a herramientas como Gemini y Copilot en verdaderos compañeros de equipo que conocen las reglas del juego.

¿Te animas a crear tu primer skill? Empieza por identificar esa tarea repetitiva que siempre tienes que corregirle a tu chat actual y encapsúlala en un archivo `SKILL.md`.
