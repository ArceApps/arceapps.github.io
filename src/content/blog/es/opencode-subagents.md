---
title: "Subagentes en OpenCode: cómo crear equipos de agentes que colaboran"
description: "Aprende a configurar y usar subagentes en OpenCode para automatizar tareas complejas, crear flujos de trabajo en paralelo y dividir problemas grandes entre agentes especializados."
pubDate: 2026-05-20
lastmod: 2026-05-20
author: ArceApps
keywords:
  - "OpenCode"
  - "Subagentes"
  - "Equipos de Agentes"
  - "Colaboración"
  - "IA"
canonical: "https://arceapps.com/es/blog/opencode-subagents/"
heroImage: /images/blog-opencode-subagents.svg
tags: ["ia","opencode","agents"]
reference_id: "bd0a8de2-6772-4a99-8ef2-c2947c7edfa9"
---



## Introducción

Cuando trabajas en un proyecto de software real, raramente tienes una sola tarea limpia y delimitada. Normalmente estás leyendo código en varios archivos a la vez, planificando una refactorización, implementando una funcionalidad y revisando el trabajo hecho. Cada una de esas actividades requiere un modo de pensar distinto, herramientas distintas y niveles distintos de permiso. Hacer todo eso con un solo agente es como pedirle a un mismo desarrollador que sea al mismo tiempo arquitecto, escritor de tests, DBA y especialista en seguridad: funciona, pero no如愿 (ni es eficiente).

OpenCode resuelve esto con un sistema de **agentes** que incluye dos roles fundamentales: **agentes primarios** y **subagentes**. Los agentes primarios son los asistentes principales con los que interactúas directamente. Los subagentes son asistentes especializados que pueden invocarse para tareas concretas, trabajar en paralelo o帮你 (a ti, al agente primario) con investigación, exploración o análisis sin interrumpir el flujo de trabajo principal.

En este artículo vamos a profundizar en los subagentes: qué son, cómo funcionan los que vienen integrados en OpenCode, cómo invocarlos, cómo configurarlos y cómo crear tus propios subagentes personalizados para adaptar OpenCode a tu flujo de trabajo como desarrollador indie.

---

## Agentes primarios vs. subagentes: ¿Cuál es la diferencia?

OpenCode distingue entre dos tipos de agentes:

**Agentes primarios** son los asistentes principales. Cuando inicias una sesión en OpenCode, estás hablando con un agente primario. Estos agentes manejan tu conversación principal y pueden invocar subagentes cuando detectan que una tarea se beneficiaría de un especializado. Los agentes primarios se cycling (循环) con la tecla Tab o con el keybind `switch_agent` configurado. OpenCode trae dos agentes primarios integrados: **Build** (con todas las herramientas habilitadas) y **Plan** (restringido, solo para análisis y planificación, sin permisos de escritura ni ejecución de comandos bash por defecto).

**Subagentes** son asistentes especializados que corren en sesiones hijos (child sessions) vinculadas a la sesión principal. Un agente primario puede decidir invocarlos automáticamente cuando necesita realizar una tarea que encaja mejor con las capacidades de un subagente. También puedes invocarlos manualmente mencionándolos con `@` en tu mensaje: por ejemplo, `@explore analízame la estructura de este proyecto`.

La sesión padre y las sesiones hijo de los subagentes están conectadas. Puedes navegar entre ellas usando atajos de teclado dedicados. Esto significa que un subagente no es un proceso aislado: es parte de una conversación más amplia que mantiene contexto compartido.

---

## Los subagentes integrados en OpenCode

OpenCode viene con tres subagentes integrados diseñados para los casos más comunes en desarrollo de software. Vamos a verlos uno por uno.

### General: el todoterreno

**Modo:** subagent

El subagente **General** es un agente de propósito general capaz de ejecutar tareas complejas en múltiples pasos. Tiene acceso completo a todas las herramientas excepto `todo` (la herramienta de gestión de tareas pendientes), lo que significa que puede leer archivos, modificarlos, ejecutar comandos en la terminal y realizar investigación sin restricciones. La diferencia con el agente primario Build es que General corre en una sesión separada y su trabajo se presenta como una sub-tarea dentro de la conversación principal.

Usa General cuando necesites ejecutar múltiples unidades de trabajo en paralelo o cuando quieras delegar una tarea compleja sin interrumpir tu sesión principal. Por ejemplo: «@general investiga cómo implementar autenticación JWT en este proyecto y crea un archivo con las opciones disponibles».

### Explore: el explorador de código

**Modo:** subagent

El subagente **Explore** es un agente de solo lectura diseñado para explorar bases de código con rapidez. No puede modificar archivos. Su especialidad es encontrar archivos por patrones, buscar palabras clave en el código o responder preguntas sobre la estructura de un proyecto.

Usa Explore cuando necesites entender un código base desconocido sin riesgo de modificar nada. Es perfecto para responder preguntas como «¿dónde se define la clase User?» o «¿qué archivos tocaría esta migración de base de datos?». Como no tiene permisos de escritura, puedes usarlo con total tranquilidad sin担心 (sin preocupación) de que vaya a alterar tu código.

### Scout: el investigador externo

**Modo:** subagent

El subagente **Scout** es un agente de solo lectura especializado en documentación externa e investigación de dependencias. A diferencia de Explore, que trabaja únicamente con tu código local, Scout puede clonar repositorios de dependencias en la caché gestionada por OpenCode, inspeccionar el código fuente de librerías y cruzar-referenciar tu código local con las implementaciones upstream.

Usa Scout cuando necesites entender cómo funciona una librería que estás usando, verificar los cambios entre versiones de una dependencia, o investigar una implementación específica en el código fuente de un paquete npm o de un módulo Python. Es especialmente útil en proyectos indie donde no tienes un equipo de-platform engineers (ingenieros de plataforma) dedicado pero necesitas entender profundamente las herramientas que usas.

---

## Agentes de sistema ocultos

Además de los subagentes que puedes invocar manualmente, OpenCode incluye tres agentes de sistema que corren automáticamente cuando es necesario:

- **Compaction** (modo: primary, oculto): compacta el contexto largo en un resumen más pequeño. Se ejecuta automáticamente cuando el contexto crece demasiado.
- **Title** (modo: primary, oculto): genera títulos cortos para las sesiones. Corre de forma automática.
- **Summary** (modo: primary, oculto): crea resúmenes de sesión. También corre de forma automática.

Estos agentes no son seleccionables en la interfaz. OpenCode los invoca internamente cuando detecta que son necesarios, por ejemplo, cuando una sesión se ha vuelto demasiado larga y necesita ser resumida para mantener el rendimiento.

---

## Cómo invocar subagentes

Hay dos formas de invocar un subagente:

### Invocación automática

Los agentes primarios pueden decidir por sí mismos invocar un subagente cuando detectan que una tarea encaja mejor con sus capacidades especializadas. Por ejemplo, si el agente Build necesita investigar cómo funciona una librería externa para completar tu request (petición), podría invocar automáticamente al subagente Scout para esa investigación.

La invocación automática depende de las descripciones de cada subagente y del modelo de lenguaje subyacente. OpenCode no fuerza la invocación automática; es una decisión del modelo basada en el contexto de la conversación.

### Invocación manual con @

Puedes invocar un subagente manualmente mencionándolo con el símbolo `@` seguido del nombre del agente:

```
@general Ayúdame a buscar todas las funciones que usan esta API REST
@explore ¿Cuántos archivos hay en el directorio src/utils?
@scout Investiga las diferencias entre la versión 3 y 4 de esta librería
```

Esta forma de invocación es útil cuando sabes exactamente qué tipo de tarea necesitas y quieres ser explícito con el agente.

---

## Navegación entre sesiones

Cuando un subagente crea una sesión hijo, OpenCode permite navegar entre la sesión padre y las sesiones hijo usando atajos de teclado. Esto es fundamental para entender el flujo de trabajo y supervisar lo que está haciendo cada subagente.

Los atajos relevantes son:

- **session_child_first** (por defecto: `<Leader>+Down`): entra en la primera sesión hijo desde la sesión padre.
- **session_child_cycle** (por defecto: `Right`): Cycle al siguiente sibling session (hermana) cuando estás dentro de una sesión hijo.
- **session_child_cycle_reverse** (por defecto: `Left`): Cycle en dirección inversa.
- **session_parent** (por defecto: `Up`): vuelve a la sesión padre.

Con `<Leader>+Down` entras en la primera sesión hijo creada por un subagente. Una vez dentro, `Right` e `Left` te permiten ciclar entre sesiones hijo si hay varias activas. `Up` te devuelve a la conversación principal con el agente primario. Este patrón de navegación te permite pasar de la visión general (sesión padre) al detalle (sesiones hijo) sin perder contexto.

---

## Configurar subagentes existentes

OpenCode permite personalizar los subagentes integrados o crear los tuyos propios. La configuración se puede hacer de dos formas: en JSON dentro de tu archivo `opencode.json` o en archivos Markdown placed (colocados) en un directorio de agentes.

### Configuración en JSON

Abre tu archivo `opencode.json` y añade una sección `agent`. Aquí puedes personalizar el modelo, el prompt, los permisos y otras opciones:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514",
      "permission": {
        "edit": "deny",
        "bash": "deny"
      }
    },
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "permission": {
        "edit": "deny"
      }
    }
  }
}
```

### Configuración en Markdown

También puedes definir agentes usando archivos Markdown placed (colocados) en:

- Global: `~/.config/opencode/agents/`
- Per-project: `.opencode/agents/`

Ejemplo de `~/.config/opencode/agents/review.md`:

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash: deny
---

You are in code review mode. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

El nombre del archivo se convierte en el nombre del agente. En este caso, el archivo `review.md` crea un agente llamado `review` que puedes invocar con `@review`.

---

## Opciones de configuración detalladas

Vamos a ver cada opción de configuración en detalle para que puedas afinar tus subagentes.

### Description (Descripción)

La descripción es obligatoria. Define qué hace el agente y cuándo debería ser invocado:

```json
{
  "agent": {
    "researcher": {
      "description": "Investiga librerías externas y sus versiones"
    }
  }
}
```

Una buena descripción ayuda tanto a ti (para recordar para qué sirve cada agente) como al modelo de lenguaje (para decidir cuándo invocarlo automáticamente).

### Temperature

Controla la aleatoriedad y creatividad de las respuestas del modelo. Valores típicos:

- **0.0 – 0.2**: Respuestas muy enfocadas y deterministas. Ideal para análisis de código y planificación.
- **0.3 – 0.5**: Balance entre creatividad y foco. Bueno para tareas generales de desarrollo.
- **0.6 – 1.0**: Más creatividad y variación. Útil para brainstorming y exploración.

```json
{
  "agent": {
    "plan": {
      "temperature": 0.1
    },
    "creative": {
      "temperature": 0.7
    }
  }
}
```

Si no se especifica temperature, OpenCode usa los valores por defecto del modelo (típicamente 0 para la mayoría de modelos, 0.55 para modelos Qwen).

### Max steps

Controla el número máximo de iteraciones agentic que un agente puede realizar antes de ser forzado a responder solo con texto. Esto es útil para controlar costes: un subagente que se queda atascado en un bucle infinito puede consumir muchos tokens innecesariamente.

```json
{
  "agent": {
    "explore": {
      "maxSteps": 10
    }
  }
}
```

### Mode

Define si el agente es `primary`, `subagent` o `all`:

- **primary**: Solo actúa como agente principal. No puede ser invocado como subagente.
- **subagent**: Solo puede ser invocado como subagente.
- **all**: Puede actuar tanto como primario como ser invocado como subagente.

### Hidden

Cuando `hidden` es `true`, el agente no aparece en la lista de selección de agentes. Los agentes ocultos son útiles para agentes de sistema como Compaction, Title y Summary que necesitan existir pero no necesitan ser seleccionados manualmente.

### Prompt personalizado

Puedes sobrescribir el prompt del sistema de un agente para darle una personalidad o enfoque específico:

```json
{
  "agent": {
    "security-auditor": {
      "description": "Audita código buscando vulnerabilidades de seguridad",
      "mode": "subagent",
      "prompt": "Eres un experto en seguridad informática. Cuando revises código, piensa en: inyección SQL, XSS, control de acceso, gestión de secretos, y vulnerabilidades comunes en el stack tecnológico que estés analizando."
    }
  }
}
```

### Color

Puedes asignar un color en hexadecimal a cada agente para distinguirlo visualmente en la interfaz:

```json
{
  "agent": {
    "review": {
      "description": "Revisor de código",
      "color": "#FF5733"
    }
  }
}
```

### Tools (deprecated)

Históricamente había una opción `tools` para controlar el acceso a herramientas específicas. Esta opción está deprecated y se mantiene por compatibilidad. En su lugar, usa el sistema de permisos (`permission`).

---

## Permisos: el sistema de guardrails

Una de las características más potentes de OpenCode es el sistema de permisos por agente. Cada agente puede tener permisos granulares para diferentes tipos de operaciones.

Los permisos disponibles son:

- **edit**: Controla escrituras, parches y ediciones de archivos.
- **bash**: Controla la ejecución de comandos en la terminal.
- **webfetch**: Controla la capacidad de hacer peticiones HTTP.
- **doom_loop**: Controla bucles de tareas automáticamente (deprecated).
- **external_directory**: Controla el acceso a directorios externos al proyecto.

Cada permiso puede tener tres valores:

- **allow**: El agente puede realizar esta operación sin confirmación.
- **deny**: El agente no puede realizar esta operación.
- **ask**: El agente pide confirmación antes de realizarla.

Ejemplo de configuración restrictiva para un agente de solo revisión:

```json
{
  "agent": {
    "security-auditor": {
      "mode": "subagent",
      "permission": {
        "edit": "deny",
        "bash": "deny",
        "webfetch": "ask",
        "external_directory": "deny"
      }
    }
  }
}
```

Este agente de seguridad puede hacer preguntas (webfetch con ask, que pide confirmación) pero no puede modificar archivos ni ejecutar comandos potencialmente peligrosos.

---

## Casos de uso prácticos

Vamos a ver escenarios reales donde los subagentes brilian (destacan).

### Investigación en paralelo

Imagina que necesitas implementar una nueva funcionalidad que depende de investigar tres librerías distintas. En lugar de hacer tres sesiones sequentially (secuencialmente), puedes iniciar tres subagentes General en paralelo, cada uno investigando una librería diferente:

```
@general Investiga las opciones de autenticación OAuth2 disponibles para Node.js
@general Investiga las diferencias entre Prisma y Drizzle ORM
@general Investiga las mejores prácticas para APIs REST en Express
```

Cada subagente trabaja de forma independiente y luego puedes revisar los resultados en sus respectivas sesiones hijo antes de tomar decisiones.

### Code review sin interrupciones

Cuando estás en medio de una tarea de implementación, es tentador ignorar el code review hasta el final. Pero往往 (muchas veces) las bugs se atrapan más fácilmente en el momento. Un subagente reviewer dedicado te permite pedir feedback sin cambiar de contexto:

```
@review Revisa el archivo src/auth/login.ts por vulnerabilidades
```

El reviewer analiza el archivo, te da feedback, y tú decides cuándo integrarlo. Tu sesión principal con Build no se interrumpe.

### Exploración de código heredado

Cuando te enfrentas a código que no has escrito tú (o que escribiste hace mucho tiempo), usa Explore para entender la estructura antes de hacer cambios:

```
@explore ¿Cuál es la estructura general del proyecto? Dame un resumen de los módulos principales
```

Explore te da una visión general sin modificar nada. Es como tener un compañero de equipo que ya conoce el código y te puede guiar.

### Investigación de dependencias

Antes de actualizar una dependencia crítica, usa Scout para investigar el changelog y los breaking changes:

```
@scout Investiga los breaking changes entre la versión 2.x y 3.x de esta librería
```

Scout puede clonar el repositorio upstream, revisar los commits relevantes y darte un resumen accionable sin que tú tengas que hacer el trabajo de arqueología.

---

## Mejores prácticas

Basándome en mi experiencia con OpenCode y los patrones que mejor funcionan, aquí van algunas recomendaciones:

**Usa el agente correcto para la tarea correcta.** No uses Build para todo. Si solo necesitas explorar código, usa Explore. Si solo necesitas planificar, usa Plan. Esto reduce el ruido en tu sesión principal y mantiene el contexto más limpio.

**Configura permisos restrictivos por defecto.** Los subagentes que creas para tareas específicas no necesitan todos los permisos. Un agente de investigación no necesita `edit: allow`. Un agente de revisión no necesita `bash`. Los permisos restrictivos son guardrails que evitan errores costosos.

**Usa temperature bajo para tareas técnicas.** Para análisis de código, planificación y revisión, usa temperature bajo (0.0 – 0.2). Las respuestas serán más predecibles y enfocadas. Guarda temperature alto para brainstorming y generación de ideas.

**Aprovecha los archivos Markdown para agentes complejos.** Si un agente tiene un prompt muy largo o quieres versionar su configuración junto con el proyecto, usa el formato Markdown en `.opencode/agents/`. Es más legible y mantiene la configuración cerca del código.

**Navega entre sesiones activamente.** No dejes los resultados de los subagentes sin revisar. Usa `<Leader>+Down` para entrar en las sesiones hijo, revisa el progreso, y vuelve a la padre con `Up`. La navegación activa es lo que convierte un conjunto de agentes aislados en un verdadero equipo colaborador.

---

## Limitaciones y consideraciones

Los subagentes no son procesos completamente aislados. Comparten el contexto de la sesión padre de forma limitada: el padre conoce el resultado del trabajo del hijo, pero el hijo no necesariamente conoce todo el contexto del padre. Esto puede llevar a duplicated esfuerzo si no eres explícito en los prompts.

另一个 (otro) punto a considerar: los subagentes consumen recursos del modelo que estés usando. Cada subagente corre en su propia sesión y genera sus propios tokens de entrada y salida. En proyectos grandes con muchos subagentes, el coste en tokens puede crecer significativamente. Usa `maxSteps` para poner límites.

Finalmente, la invocación automática de subagentes depende del modelo de lenguaje. No todos los modelos deciden invocar subagentes de la misma forma. Modelos más recientes y capaces tienden a usar subagentes de forma más inteligente.

---

## Bibliografía y referencias

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents) — Documentación oficial de agentes en OpenCode
- [OpenCode SDK](https://opencode.ai/docs/sdk) — SDK oficial para integrar OpenCode en tus proyectos
- [opencode-telegram-bot](https://github.com/ArceApps/ai-autonomy/tree/main/opencode-telegram-bot) — Proyecto de ejemplo que usa subagentes de OpenCode via SDK
- [OpenCode GitHub Repository](https://github.com/anomalyco/opencode) — Repositorio oficial del proyecto

---

*¿Tienes un caso de uso para subagentes que no esté cubierto aquí? Los archivos de agente en Markdown soportan cualquier prompt que se te ocurra. Experimenta con distintas configuraciones y encuentra el flujo que mejor se adapte a tu forma de trabajar como desarrollador indie.*
