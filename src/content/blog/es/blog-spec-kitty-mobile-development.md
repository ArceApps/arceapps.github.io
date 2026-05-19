---
title: "Spec Kitty: Desarrollo Impulsado por Especificaciones para Agentes de Codificación con IA"
description: "Guía completa de Spec Kitty — la CLI que convierte la intención de producto en un flujo de trabajo repetible para agentes de IA usando git worktrees, un sistema kanban de 9 carriles y artefactos de misión nativos del repositorio."
pubDate: 2026-05-19
heroImage: "/images/blog-spec-kitty-mobile-development.svg"
tags: ["SDD", "Spec Kitty", "Agentes IA", "Git Worktrees", "Desarrollo Impulsado por Especificaciones", "Workflow", "Kanban", "Multi-Agente", "CLI", "Python"]
reference_id: "a8f92c3d-4e15-4b7a-9f2c-1d3e5f6a7b8c"
---

> **Lecturas relacionadas:** [Desarrollo Impulsado por Especificaciones con IA Agéntica](/blog/blog-specs-driven-development) · [Git Worktrees para Desarrollo Paralelo](/blog/blog-git-worktrees-android) · [Agentes IA en Desarrollo Android](/blog/blog-ai-agents-workflow-android)

Cuando un equipo de desarrollo móvil trabaja con un agente de codificación con IA, el flujo se siente manejable. Describes lo que quieres, el agente escribe código, lo revisas, y la funcionalidad aterriza en tu codebase. Pero cuando agregas un segundo agente — quizás uno manejando lógica de backend mientras otro construye la UI — aparecen las grietas: ¿qué agente está trabajando en qué, dónde se perdieron los requisitos, cómo fusionas dos implementaciones separadas sin conflictos?

**Spec Kitty** aborda esto tratando el repositorio como la única fuente de verdad para todo lo que los agentes de IA necesitan para mantenerse alineados. Es una CLI de código abierto (Python, Python 3.11+) que estructura el trabajo alrededor de **misiones** — unidades autocontenidas de funcionalidad con su propio ciclo de vida, paquetes de trabajo y estado de carril kanban. El flujo de trabajo central sigue siete fases:

```
spec -> plan -> tasks -> next -> review -> accept -> merge
```

Lo que hace a Spec Kitty distintivo es su filosofía: **el código es la fuente de verdad, no la especificación**. Las especificaciones en Spec Kitty son solicitudes de cambio — deltas que describen qué quieres añadir, modificar o eliminar — en lugar de documentación comprehensiva. El agente siempre lee el código real para entender el estado actual antes de generar nueva implementación. Después de una fusión, la especificación se convierte en contexto histórico; el código es lo que importa.

Este artículo es un recorrido comprehensivo y basado en hechos de cada característica principal de Spec Kitty, extraído directamente del repositorio del proyecto en [github.com/Priivacy-ai/spec-kitty](https://github.com/Priivacy-ai/spec-kitty).

---

## El Problema que Spec Kitty Resuelve

Las sesiones de codificación con IA frecuentemente pierden requisitos, decisiones o criterios de aceptación. Un agente comienza a implementar una funcionalidad, el desarrollador responde algunas preguntas, pero tres semanas después nadie recuerda por qué se tomó una decisión arquitectónica particular o cuál era el alcance original. Spec Kitty resuelve esto almacenando cada artefacto — especificaciones, planes, desgloses de tareas, comentarios de revisión y estado de fusión — directamente en el repositorio bajo `kitty-specs/`.

La herramienta está diseñada para equipos que:

- Ejecutan sesiones de codificación con IA donde los requisitos se desvían durante la implementación
- Tienen múltiples agentes o desarrolladores que necesitan límites de paquete de trabajo claros
- Quieren todo versionado con historial de auditoría completo
- Necesitan un flujo de trabajo local primero, con integraciones opcionales de tracker hospedado después

Probablemente es overkill para ediciones únicas, scripts pequeños o equipos que no usan Git.

---

## El Modelo de Datos Central: Misiones, Paquetes de Trabajo y Carriles

### Misiones

Una **misión** es el término de Spec Kitty para una unidad de funcionalidad. Cada misión vive en su propio directorio bajo `kitty-specs/` y lleva todo lo que el equipo necesita para entender, planificar, implementar y revisar esa funcionalidad:

```
kitty-specs/
└── 001-auth-system/
    ├── spec.md           # Qué construir (el delta/solicitud de cambio)
    ├── plan.md           # Cómo construirlo (enfoque técnico)
    ├── research.md       # Hallazgos de investigación (opcional)
    ├── data-model.md     # Entidades de dominio y relaciones
    ├── contracts/        # Especificaciones de API
    ├── tasks.md          # Lista maestra de verificación de tareas
    └── tasks/            # Prompts individuales de paquetes de trabajo (estructura plana)
        ├── WP01-deps.md
        ├── WP02-storage.md
        ├── WP03-biometric.md
        └── WP04-integration.md
```

Cada misión tiene un **slug** (kebab-case, p.ej., `001-auth-system`) que sirve como su identificador legible por humanos, y una **identidad canónica basada en ULID** (`mission_id`) asignada al momento de la creación de la misión. El prefijo numérico de tres dígitos es solo para visualización y se asigna en el momento de la fusión — esto elimina el problema de colisión donde dos misiones podrían compartir el mismo prefijo `NNN-` y confundir selectores, ramas y dashboards.

La convención de nombrado de ramas y worktrees usa el prefijo ULID (`mid8`) para garantizar unicidad:

- **Rama:** `kitty/mission-<human-slug>-<mid8>-lane-<id>` (p.ej., `kitty/mission-my-feature-01J6XW9K-lane-a`)
- **Worktree:** `.worktrees/<human-slug>-<mid8>-lane-<id>`

### Paquetes de Trabajo

Una misión se divide en **paquetes de trabajo** (work packages, WPs) — prompts individuales que un agente puede ejecutar de forma aislada. Cada paquete de trabajo es un archivo plano en `tasks/` con frontmatter YAML que codifica su estado de carril:

```yaml
---
work_package_id: "WP01"
title: "Database Schema"
lane: "in_progress"
assignee: "claude"
agent: "claude"
shell_pid: "12345"
review_status: ""
review_feedback: ""
---
```

El campo frontmatter `lane` se mantiene por compatibilidad con características pre-3.0, pero a partir de Spec Kitty 3.0, el **modelo de estado canónico** usa un log de eventos append-only en `status.events.jsonl`. Cada transición de carril es un `StatusEvent` inmutable:

```json
{"actor":"claude","at":"2026-02-08T12:00:00+00:00","event_id":"01HXYZ...","evidence":null,"execution_mode":"worktree","feature_slug":"034-feature","force":false,"from_lane":"planned","reason":null,"review_ref":null,"to_lane":"claimed","wp_id":"WP01"}
```

La función `reduce()` reproduce todos los eventos para producir un `StatusSnapshot` (materializado como `status.json`). Esto significa que los mismos eventos siempre producen el mismo snapshot — una máquina de estados determinista y auditable.

### La Máquina de Estados de 9 Carriles

Los paquetes de trabajo se mueven a través de **nueve carriles** durante su ciclo de vida:

```
planned -> claimed -> in_progress -> for_review -> in_review -> approved -> done
       + blocked (alcanzable desde planned, claimed, in_progress, for_review, in_review, approved)
       + canceled (alcanzable desde todos los carriles no terminales)
```

La máquina de estados enforce exactamente **27 transiciones legales**. Cualquier transición que no esté en esta lista es rechazada a menos que se use `--force` (que requiere actor + razón para auditoría). Los carriles `done` y `canceled` son **terminales** — abandonarlos requiere `--force`.

El **log de eventos canónico** rastrea cada transición. Esto habilita:

- **Inmutabilidad**: Ningún evento se modifica o elimina jamás
- **Reproducción determinista**: Los mismos eventos siempre producen el mismo snapshot
- **Depuración**: Historial completo de quién hizo qué, cuándo y por qué
- **Métricas**: Calcular tiempo-en-carril, cycle time, throughput desde el stream de eventos
- **Coordinación**: Múltiples agentes pueden ver lo que otros están haciendo

---

## Git Worktrees: Desarrollo Paralelo Sin Cambio de Rama

Spec Kitty usa **git worktrees** para aislar la implementación de misiones. Cuando ejecutas `/spec-kitty.specify`, la CLI:

1. Crea una rama semántica: `kitty/mission-<slug>-<mid8>-lane-a`
2. Crea un worktree en `.worktrees/<slug>-<mid8>-lane-a/`
3. Cambia tu agente a ese checkout aislado

Esto importa porque:

- **Sin overhead de cambio de rama**: Trabaja en el worktree de la misión, haz commits, mantenén main limpio. Sin ciclos de `git stash` / `git checkout` cuando necesitas verificar algo rápidamente en main.
- **Desarrollo paralelo verdadero**: Si estás construyendo dos funcionalidades simultáneamente, tienes dos worktrees con diferentes agentes trabajando independientemente. Cada worktree tiene su propio directorio de trabajo, su propia rama, sin interferencia.
- **Transferencia limpia**: Cuando una misión está completa, el worktree se fusiona limpiamente y desaparece. Sin ramas huérfanas.

Para desarrollo móvil en Kotlin y Android, el modelo de worktree se alinea bien con cómo funcionan los módulos de Gradle. Una funcionalidad podría involucrar cambios al módulo app, un nuevo módulo de biblioteca para un wrapper biométrico, y módulos de test — todo aislado en el worktree sin tocar main.

El dashboard muestra qué worktrees están activos, en qué carril está cada paquete de trabajo, y qué agente está trabajando en qué tarea. Puedes filtrar por agente, ver historial de actividad e identificar bloqueos de un vistazo.

---

## El Dashboard: Visibilidad Kanban en Tiempo Real

Spec Kitty incluye un **dashboard kanban local** que se ejecuta como un proceso en segundo plano:

```bash
spec-kitty dashboard        # Iniciar el dashboard
spec-kitty dashboard --open  # Iniciar y abrir en el navegador inmediatamente
spec-kitty dashboard --port 8080  # Puerto personalizado
spec-kitty dashboard --kill # Detener el proceso en segundo plano
```

La URL del dashboard se almacena en `.kittify/.dashboard`. Si el navegador no se abre automáticamente, lee ese archivo para obtener la URL.

### Vistas del Dashboard

**Tablero Kanban**: Refleja el flujo de trabajo de carriles (`planned -> claimed -> in_progress -> for_review -> in_review -> approved -> done`) con actualizaciones WebSocket en tiempo real — no necesitas recargar la página manualmente.

**Vista General de Características**: Resume el progreso de funcionalidades, artefactos y worktrees en todo el proyecto.

### Endpoints de API del Dashboard

El dashboard expone endpoints REST para monitoreo personalizado y automatización:

- `GET /api/features` — Lista todas las funcionalidades y sus paquetes de trabajo
- `GET /api/feature/{slug}` — Obtiene detalles de una funcionalidad específica

Puedes construir alertas personalizadas cuando las tareas pasen más de 4 horas en el carril `doing`, o exportar métricas para reportes de stand-up diario.

### Usando el Dashboard en el Flujo de Trabajo Diario

En un flujo de trabajo de desarrollo dirigido por dashboard, el equipo usa el dashboard como la única fuente de verdad:

1. **Alineación matutina**: Todos abren el dashboard, el PM revisa conteos de carriles por funcionalidad y marca paquetes de trabajo atascados en "doing" más de 24 horas
2. **Asignar trabajo**: El tech lead ejecuta `.kittify/scripts/bash/tasks-list-lanes.sh FEATURE-SLUG` para detectar prompts inactivos, los agentes los reclaman vía `spec-kitty agent action implement WP01`
3. **Revisión de mediodía**: El diseñador revisa prompts en el carril `for_review`, añade comentarios de feedback como markdown, mueve de vuelta a `planned` o adelante a `done`
4. **Recapitulación vespertina**: El PM toma captura del dashboard para stakeholders, el tech lead consulta la API para métricas

Incluso para desarrolladores individuales, el dashboard proporciona progreso visual, recuperación de contexto después de interrupciones, y un impulso de motivación viendo las tareas moverse de `planned` a `done`.

---

## La Charter: Principios Inmutables, No Documentación Comprehensiva

Spec Kitty no usa una constitución (como Spec Kit) ni documentación comprehensiva del proyecto. En su lugar, usa una **charter** — un pequeño conjunto de principios inmutables almacenados en `.kittify/memory/charter.md` que guían el comportamiento del agente sin intentar documentar el estado actual del sistema.

La charter define principios como:

- **Imperativo test-first**: Ningún código de implementación se escribirá antes de que los tests unitarios se escriban y confirmen que fallan
- **Arquitectura library-first**: Cada funcionalidad empieza como un módulo independiente
- **Restricciones de simplicidad**: Preferir soluciones simples sobre complejas

Esto es fundamentalmente diferente del modelo de constitución de Spec Kit. Una constitución intenta documentar todas las decisiones arquitectónicas, estándares de codificación, elecciones tecnológicas y restricciones. Una charter define principios que guían el comportamiento sin importar cómo se vea el sistema actualmente.

La charter vive en `.kittify/memory/charter.md` y aplica a **todas las misiones** en el proyecto, enforcecida automáticamente por los comandos de Spec Kitty. Cuando ejecutas `/spec-kitty.specify`, `/spec-kitty.plan` o `/spec-kitty.tasks`, la charter influye en lo que va en los artefactos — requisitos de seguridad, objetivos de rendimiento y obligaciones de testing se incluyen automáticamente en lugar de ser redescubiertos para cada funcionalidad.

Para proyectos Android y Kotlin, podrías añadir artículos de charter como:

- Restricciones de versión de bibliotecas AndroidX
- Requisitos de testing de Compose
- Requisitos de SDK mínimo enforceable a nivel de spec
- Convenciones de módulos Hilt

La charter puede actualizarse vía `/spec-kitty.charter`, que crea una nueva versión. Las misiones existentes aceptadas bajo una versión más antigua de la charter son "grandfathered" — no necesitan cumplir los nuevos requisitos hasta que se actualicen.

---

## Orquestación Multi-Agente

Spec Kitty soporta **flujos de trabajo multi-agente** donde múltiples agentes de codificación con IA trabajan simultáneamente en la misma misión o en diferentes misiones. La herramienta está diseñada para agentes como Claude, Codex, Cursor, Gemini, Copilot, OpenCode, Qwen, Windsurf, Kiro, Vibe, Pi y Letta.

### Carriles de Ejecución para Trabajo Paralelo Dentro de una Misión

Dentro de una sola misión, Spec Kitty soporta **carriles de ejecución** — paquetes de trabajo paralelos que pueden ejecutarse concurrentemente. El sistema rastrea dependencias y asegura que los paquetes de trabajo upstream se completen antes de que empiecen los dependientes.

### Patrones de Especialización de Agentes

Un patrón común es la especialización de agentes:

- **Claude**: Descubrimiento, planificación, revisión (tareas narrativas pesadas)
- **Gemini**: Modelado de datos, investigación, diseño de API (profundidad técnica)
- **Cursor**: Implementación (integración IDE, iteración rápida)

Para una funcionalidad como autenticación biométrica, la orquestación se ve así:

1. **Lead (Claude)** ejecuta `/spec-kitty.specify` para crear la estructura de la misión
2. **Lead cambia a worktree**: `cd .worktrees/001-auth-biometrica`
3. **Gemini ejecuta research**: `/spec-kitty.research` investiga implicaciones de seguridad biométrica
4. **Claude ejecuta plan**: `/spec-kitty.plan` genera el enfoque de implementación
5. **Claude ejecuta tasks**: `/spec-kitty.tasks` crea paquetes de trabajo
6. **Cursor implementa**: `spec-kitty agent action implement WP03` mientras Claude maneja revisión
7. **Lead acepta y fusiona**: Después de que todos los WPs se completan

El directorio plano `tasks/` con frontmatter basado en carriles hace esta coordinación robusta. Cada agente trabaja en su WP asignado sin pisar el trabajo de otros. El dashboard muestra posiciones de carril en tiempo real para que nadie duplique esfuerzo.

### Comando de Estado de la CLI

El comando `spec-kitty agent tasks status` muestra un **tablero kanban de 5 columnas** en la terminal:

```
Feature: 012-user-authentication
Kanban Board
  Planned       Doing         For Review    In Review     Approved      Done
  WP04-tests    WP03-front..  WP02-api      WP06-auth     WP05-docs     WP01-database
                (stale: 15m)

  1 WPs         1 WPs         1 WPs         1 WPs         1 WPs         1 WPs
Progress: 1/6 (16.7%)
```

La visualización mapea los 9 carriles internos a 6 columnas de tablero. Los WPs `blocked` y `canceled` aparecen en secciones separadas debajo del tablero cuando están presentes.

---

## Misiones Más Allá del Desarrollo de Software

### Misiones de Investigación

Spec Kitty soporta un **template de misión de Investigación Profunda** para investigaciones sistemáticas:

```bash
cd my-research-project
spec-kitty mission switch research  # Activar Deep Research Kitty
```

Las misiones de investigación crean artefactos diferentes:

- `research.md` — Hallazgos y análisis
- `evidence-log.csv` — Seguimiento de fuentes con ratings de confianza
- `comparison-matrix.md` — Comparaciones lado a lado
- `synthesis-notes.md` — Perspectivas de integración

El flujo de trabajo:

1. Definir pregunta de investigación vía `/spec-kitty.specify`
2. Crear metodología vía `/spec-kitty.plan`
3. Recolectar evidencia vía `/spec-kitty.research`
4. Generar tareas vía `/spec-kitty.tasks`
5. Ejecutar investigación vía `/spec-kitty.implement`
6. Sintetizar hallazgos vía `/spec-kitty.review`
7. Finalizar vía `/spec-kitty.accept`

Después de que la investigación se completa, cambiar de vuelta a modo de desarrollo de software vía `spec-kitty mission switch software-dev` y usar los hallazgos para informar misiones de implementación.

---

## Flujo de Trabajo para Desarrollador Individual

Incluso para desarrolladores individuales, Spec Kitty proporciona estructura que mejora los resultados:

1. **Instalar e inicializar**: `pipx install spec-kitty-cli && spec-kitty init my-app --ai claude`
2. **Crear charter**: `/spec-kitty.charter` define tus principios (calidad de código, testing, seguridad)
3. **Specify**: `/spec-kitty.specify` describe qué construir
4. **Plan**: `/spec-kitty.plan` define el enfoque técnico
5. **Research** (opcional): `/spec-kitty.research` para investigaciones técnicas
6. **Tasks**: `/spec-kitty.tasks` genera paquetes de trabajo, visibles en el dashboard
7. **Implement**: `/spec-kitty.implement` mueve un WP a `doing` y muestra instrucciones de implementación
8. **Review**: `/spec-kitty.review` revisa el trabajo contra la especificación
9. **Accept y merge**: `/spec-kitty.accept && /spec-kitty.merge --push`

Estimaciones de tiempo para una funcionalidad simple: aproximadamente 1 hora en total (10 min charter, 5-10 min specify, 5-10 min plan, 2 min tasks, 30-60 min implement, 5-10 min review, 2 min accept/merge).

---

## El Flujo de Trabajo de 7 Fases en Detalle

### Fase 1: Specify

`/spec-kitty.specify` crea una misión a partir de la intención de producto. La CLI entra en modo descubrimiento, haciendo preguntas de clarificación sobre alcance, casos límite y criterios de aceptación. El resultado es `kitty-specs/<slug>/spec.md` — un documento de solicitud de cambio estructurado, no documentación comprehensiva.

### Fase 2: Plan

`/spec-kitty.plan` genera `plan.md` con el enfoque técnico: qué bibliotecas usar, estructura de módulos, decisiones arquitectónicas con racional, adiciones a `build.gradle.kts`.

### Fase 3: Tasks

`/spec-kitty.tasks` genera `tasks.md` y archivos individuales de paquete de trabajo en `tasks/`. Cada WP tiene un bundle de prompt con contexto de `spec.md` y `plan.md`, instrucciones específicas de implementación, criterios de aceptación para auto-verificación, y comandos de transición de carril.

### Fase 4: Next (Runtime)

`spec-kitty next --agent claude --mission <slug>` pregunta a Spec Kitty qué debería hacer el agente a continuación. El runtime elige la siguiente acción basándose en estado del WP, dependencias y disponibilidad del agente.

### Fase 5: Review

`/spec-kitty.review` auto-detecta el primer WP con carril `for_review`, lo mueve a `in_review`, y muestra instrucciones de revisión. El revisor aprueba (`→ approved → done`) o solicita cambios (`→ planned` con feedback).

### Fase 6: Accept

`/spec-kitty.accept` valida que todos los WPs están completos, la metadata es correcta, la lista de verificación de tareas está completamente marcada. Registra metadata de aceptación en `meta.json`.

### Fase 7: Merge

`/spec-kitty.merge --push` fusiona la rama de la misión a main y limpia el worktree. El sistema tiene validación preflight de fusión, predicción de conflictos, y `spec-kitty merge --resume` / `spec-kitty merge --abort` para fusiones interrumpidas.

---

## Comparando Spec Kitty con Alternativas

### Spec Kitty vs Spec Kit (GitHub)

Spec Kit usa una **constitución** como el artefacto de contexto primario — documentación comprehensiva de todas las decisiones arquitectónicas. Funciona para proyectos greenfield con arquitectura estable pero se rompe para proyectos brownfield donde las decisiones están dispersas por todo el codebase.

Spec Kitty elimina la constitución en favor de una **charter** (principios inmutables) más **código-como-verdad**. El agente siempre lee código real, no documentación. Esto es más robusto a medida que el sistema evoluciona.

### Spec Kitty vs OpenSpec

OpenSpec trata cada modificación como una **propuesta de cambio formal** con construcción retroactiva de specs — las specs se acumulan en `main/specs/` a medida que los cambios se archivan. Proporciona trazabilidad excelente a nivel de cambio.

Spec Kitty organiza alrededor de **misiones** (resultados) en lugar de cambios (modificaciones). Una misión puede abarcar múltiples sistemas. La gobernanza basada en charter proporciona restricciones que OpenSpec carece.

### Diferenciadores Clave

| Aspecto | Spec Kitty | Spec Kit | OpenSpec |
|---------|-----------|----------|----------|
| Artefacto primario | Misión con WPs | Constitución | Propuesta de cambio |
| Fuente de contexto | Charter + código | Constitución + código | Specs canónicas construidas retroactivamente |
| Alcance de spec | Delta (solicitud de cambio) | Comprehensivo | Delta o comprehensivo |
| Compuertas humanas | 7 fases | 4 fases | Propuesta + validación |
| Desarrollo paralelo | Git worktrees (nativo) | Ramas (manual) | Ramas (manual) |
| Amigabilidad brownfield | Alta | Media | Alta |
| CLI | Python (`spec-kitty`) | Node.js (`@github/spec-kit`) | Node.js (`openspec`) |

---

## Empezando

Instala la CLI:

```bash
pipx install spec-kitty-cli
```

Crea o inicializa un proyecto:

```bash
spec-kitty init my-project --ai claude
cd my-project
spec-kitty verify-setup
```

Abre tu agente de codificación con IA y ejecuta el flujo de trabajo central:

```text
/spec-kitty.charter
/spec-kitty.specify Construir un sistema de autenticación de usuario con email/contraseña y fallback biométrico.
/spec-kitty.plan
/spec-kitty.tasks
```

Deja que el runtime elija las siguientes acciones:

```bash
spec-kitty next --agent claude --mission <mission-slug>
```

Revisa, acepta, fusiona:

```text
/spec-kitty.review
/spec-kitty.accept
/spec-kitty.merge --push
```

Abre el dashboard en cualquier momento:

```bash
spec-kitty dashboard --open
```

---

## Conclusión

Spec Kitty proporciona un enfoque estructurado al desarrollo augmentado por IA que escala desde desarrolladores individuales hasta equipos multi-agente. Su filosofía central — el código es verdad, las specs son deltas — previene la deriva de documentación que plagia los enfoques tradicionales impulsados por especificaciones. La máquina de estados de 9 carriles con logging de eventos append-only te da un registro determinista y auditable de cada decisión. Los git worktrees permiten desarrollo paralelo verdadero sin overhead de cambio de rama. El dashboard proporciona visibilidad en tiempo real que mantiene a todos alineados.

Para equipos de desarrollo móvil usando Kotlin y Android, el sistema de charter de Spec Kitty puede codificar restricciones específicas de la plataforma (versiones AndroidX, requisitos de testing de Compose, convenciones de Hilt) y su modelo de worktree encaja naturalmente con la arquitectura basada en módulos de Gradle.

El proyecto está activamente mantenido — la serie v3.x introdujo el modelo de estado con log de eventos canónico, identidades ULID para misiones, y el corte de frontera de paquete compartido. Vigila el repositorio para sync hospedado, autenticación de teamspace y visualizaciones mejoradas del dashboard que vienen en futuros releases.

---

## Referencias

- [Repositorio GitHub de Spec Kitty](https://github.com/Priivacy-ai/spec-kitty)
- [CLAUDE.md — Documentación Completa de Spec Kitty](https://github.com/Priivacy-ai/spec-kitty/blob/main/CLAUDE.md)
- [Guía de Desarrollo Impulsado por Especificaciones](https://github.com/Priivacy-ai/spec-kitty/blob/main/spec-driven.md)
- [Flujo de Trabajo Kanban Explicado](https://github.com/Priivacy-ai/spec-kitty/blob/main/docs/explanation/kanban-workflow.md)
- [Ejemplo de Desarrollo Dirigido por Dashboard](https://github.com/Priivacy-ai/spec-kitty/blob/main/examples/dashboard-driven-development.md)
- [Ejemplo de Flujo de Trabajo para Desarrollador Individual](https://github.com/Priivacy-ai/spec-kitty/blob/main/examples/solo-developer-workflow.md)
- [Documentación de Git Worktrees](https://github.com/Priivacy-ai/spec-kitty/blob/main/docs/explanation/git-worktrees.md)
- [Guía de Orquestación Multi-Agente](https://github.com/Priivacy-ai/spec-kitty/blob/main/docs/explanation/multi-agent-orchestration.md)