# Reporte de Investigación: GSD (Get Shit Done) / GSD Core

**Investigador:** Scribe subagente
**Fecha del reporte:** 2026-06-18
**Fuentes consultadas:** Documentación oficial en mintlify, repositorio GitHub `open-gsd/gsd-core` (activo) y `gsd-build/get-shit-done` (archivo redirector), artículo de Web Reactiva por Daniel Primo, artículo de The New Stack por David Eastman, comparativa de Pasquale Pillitteri, 8 artículos previos del blog de ArceApps.

---

## 1. Resumen Ejecutivo (350 palabras)

**GSD Core** (anteriormente "Get Shit Done", ahora renombrado bajo el lema **"Git. Ship. Done."**) es un framework open source de *meta-prompting*, *ingeniería de contexto* y *Spec-Driven Development* diseñado para hacer que los agentes de codificación con IA (Claude Code, Codex, Gemini CLI, Cursor, OpenCode, etc.) sean fiables a escala. Nació como proyecto en solitario creado por el desarrollador conocido como **TÂCHES** bajo el repositorio `gsd-build/get-shit-done`, que llegó a acumular **64.300 estrellas y 5.500 forks** en GitHub, además de **2.928 commits y 78 releases** antes de ser archivado como punto de redirección. Tras el movimiento a la organización comunitaria **Open GSD** en 2026, el desarrollo activo continúa en `open-gsd/gsd-core` (4.400 estrellas, 3.785 commits, 24 releases, última versión **v1.5.0 publicada el 17 de junio de 2026**). Todo el código se distribuye bajo licencia **MIT**.

El problema central que GSD ataca tiene nombre: **context rot**, la degradación silenciosa de la calidad del modelo a medida que la ventana de contexto se llena durante sesiones largas. La solución arquitectónica es estructural: GSD delega toda la investigación, planificación y ejecución a **subagentes con contextos frescos de 200.000 tokens** (o hasta 1 millón en modelos habilitados), manteniendo la sesión principal del usuario al 30-40% de ocupación. Los artefactos de planificación (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `PLAN.md`, `SUMMARY.md`) viven como archivos versionados en `.planning/`, no como mensajes efímeros en la conversación.

Su filosofía explícita, según las palabras textuales de TÂCHES en la documentación oficial, es **"complejidad en el sistema, no en tu flujo de trabajo"**: nada de ceremonias de sprint, story points, retrospectivas ni workflows de Jira. Pocas comandos que funcionan, agentes invisibles haciendo el trabajo pesado, contexto fresco siempre. La frase que resume el producto: *"Claude Code is powerful. GSD Core makes it reliable."*

---

## 2. Orígenes y Filosofía

### Creador y contexto

- **Creador original:** TÂCHES (un desarrollador en solitario cuya filosofía se resume en "No escribo código. Claude Code lo hace.").
- **Filosofía fundacional** (cita textual de la documentación `/why-gsd`):
  > "I'm a solo developer. I don't write code — Claude Code does. Other spec-driven development tools exist; BMAD, Speckit... But they all seem to make things way more complicated than they need to be (sprint ceremonies, story points, stakeholder syncs, retrospectives, Jira workflows)... I don't want to play enterprise theater."
- **Por qué el nombre "Get Shit Done":** es deliberadamente crudo como rechazo explícito a la jerga corporate. La reacción instintiva de la comunidad al nombre se ha convertido en señal de identidad: si te ofende, probablemente GSD no es para ti (estás buscando ceremonias). Si te resuena, encajas.
- **Renombrado a GSD Core:** el acrónimo se mantiene pero se adoptó el lema "Git. Ship. Done." al pasar a ser proyecto comunitario. La justificación del cambio fue separar el proyecto de la connotación inicial y reflejar el flujo "discutir → planificar → ejecutar → verificar → enviar" de forma más neutral.
- **Transferencia a Open GSD:** el repositorio `gsd-build/get-shit-done` ya sólo contiene un redirect. El código activo está en `github.com/open-gsd/gsd-core` bajo la organización Open GSD, con Discord propio (discord.gg/mYgfVNfA2r) y sitio web en opengsd.net.

### Puntos de dolor que aborda

1. **Vibe coding sin estructura**: prompts vagos que producen código inconsistente a la tercera sesión.
2. **Context rot**: la calidad del modelo cae según se llena la ventana (a partir de ~50% ya hay omisiones, a 70%+ aparecen alucinaciones).
3. **Falta de memoria entre sesiones**: cada `/clear` te devuelve a una tabula rasa.
4. **Verificación ausente**: los frameworks "vibe" nunca preguntan si el código generado realmente funciona.
5. **Ceremonia corporativa en herramientas SDD existentes** (BMAD, Spec Kit): simulacros de agile para equipos de una persona.

### Posicionamiento "lean + pure code + agentic"

- **Lean:** ningún comando es obligatorio, pero existe `/gsd-quick` para tareas triviales que no justifican planificación. Se documentan explícitamente los casos donde **NO** usar GSD: prototipos de 1-2 horas, scripts pequeños, cambios triviales como un color o un texto, aprendizaje exploratorio.
- **Pure code:** los artefactos son Markdown y JSON en disco, sin base de datos externa. Esto permite commitear `.planning/` a git y mantenerlo bajo control de versiones.
- **Agentic:** la sesión principal del usuario es un orquestador delgado que nunca toca código directamente. Los subagentes hacen el trabajo pesado con contextos aislados.

### Métricas de popularidad (verificadas a 2026-06-18)

| Métrica | `gsd-build/get-shit-done` (archivo) | `open-gsd/gsd-core` (activo) |
|---|---|---|
| Estrellas | 64.300 | 4.400 |
| Forks | 5.500 | 275 |
| Commits | 2.928 | 3.785 |
| Releases | 78 | 24 |
| Watchers | 263 | 13 |
| Idioma dominante | JavaScript 73,1% | JavaScript 84,4% |
| Última versión | v1.42.3 (16 mayo 2026) | v1.5.0 (17 junio 2026) |
| Adoptantes destacados | Amazon, Google, Shopify, Webflow (según docs) | n/d |

Nota: la caída de estrellas de 64k a 4,4k se explica por el redirect — son dos repositorios distintos con comunidades que se están consolidando.

---

## 3. Arquitectura y Componentes

### 3.1 Las 5 capas del sistema

```
┌──────────────────────────────────────────────────────┐
│ USUARIO                                               │
│ /gsd-command [args]                                  │
└─────────────────────┬────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────┐
│ COMMAND LAYER (commands/gsd/*.md)                    │
│ Slash commands como prompts estructurados            │
└─────────────────────┬────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────┐
│ WORKFLOW LAYER (gsd-core/workflows/*.md)             │
│ Orquestadores delgados que spawnan agentes           │
└──┬──────────────┬─────────────────┬─────────────────┘
   ▼              ▼                 ▼
┌──────┐    ┌──────┐         ┌──────────┐
│Agent │    │Agent │   ...   │  Agent   │  (cada uno con contexto fresco de 200K)
└──┬───┘    └──┬───┘         └────┬─────┘
   ▼           ▼                 ▼
┌──────────────────────────────────────────────────────┐
│ CLI TOOLS LAYER (gsd-tools.cjs + módulos en lib/)    │
│ Utilidades Node.js: state, config, phase, roadmap... │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│ SISTEMA DE ARCHIVOS (.planning/)                     │
│ PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md... │
└──────────────────────────────────────────────────────┘
```

### 3.2 Estructura de archivos de un proyecto GSD

**Archivos de instalación (en `~/.claude/` o equivalente del runtime):**
```
.claude/  (o ~/.config/opencode/, ~/.gemini/, ~/.codex/, etc.)
├── skills/gsd-ns-*/SKILL.md       # 6 namespace routers (v1.40)
│   └── skills/<name>/SKILL.md     # Sub-skills anidadas
├── commands/gsd/*.md              # Slash commands locales
├── gsd-core/
│   ├── bin/gsd-tools.cjs          # Utilidad CLI principal
│   ├── bin/lib/*.cjs              # Módulos de dominio
│   ├── workflows/*.md             # Definiciones de orquestación
│   ├── references/*.md            # Conocimiento compartido
│   └── templates/                 # Plantillas de artefactos
├── agents/*.md                    # 33 definiciones de agentes
├── hooks/*.js / *.sh              # Hooks del runtime
└── settings.json                  # Registro de hooks
```

**Archivos del proyecto (en `.planning/`):**
```
.planning/
├── PROJECT.md              # Visión del proyecto
├── REQUIREMENTS.md         # Requisitos v1/v2/out-of-scope
├── ROADMAP.md              # Fases con estado
├── STATE.md                # Memoria viva: posición, decisiones, bloqueos
├── config.json             # Configuración del workflow
├── MILESTONES.md           # Archivo de milestones completados
├── research/               # Investigación de dominio (de /gsd-new-project)
│   ├── SUMMARY.md
│   ├── STACK.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   └── PITFALLS.md
├── codebase/               # Mapeo brownfield (de /gsd-map-codebase)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── CONCERNS.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   └── INTEGRATIONS.md
├── phases/
│   └── XX-phase-name/
│       ├── XX-CONTEXT.md       # Preferencias del usuario
│       ├── XX-RESEARCH.md      # Investigación del ecosistema
│       ├── XX-YY-PLAN.md       # Planes de ejecución
│       ├── XX-YY-SUMMARY.md    # Resultados de ejecución
│       ├── XX-VERIFICATION.md  # Verificación post-ejecución
│       ├── XX-VALIDATION.md    # Mapeo de cobertura de tests
│       ├── XX-UI-SPEC.md       # Contrato de diseño UI
│       ├── XX-UI-REVIEW.md     # Auditoría visual
│       └── XX-UAT.md           # Tests de aceptación
├── quick/                  # Tareas rápidas
├── todos/                  # Ideas capturadas
├── debug/                  # Sesiones de debugging activas
└── continue-here.md        # Handoff de sesión (de /gsd-pause-work)
```

### 3.3 Los 33 agentes especializados

Categorías principales (roster oficial en `docs/INVENTORY.md`):

| Categoría | Agentes | Paralelismo |
|---|---|---|
| Researchers | `gsd-project-researcher`, `gsd-phase-researcher`, `gsd-ui-researcher`, `gsd-advisor-researcher` | 4 en paralelo (stack, features, architecture, pitfalls) |
| Synthesizers | `gsd-research-synthesizer` | Secuencial tras investigadores |
| Planners | `gsd-planner`, `gsd-roadmapper` | Secuencial |
| Checkers | `gsd-plan-checker`, `gsd-integration-checker`, `gsd-ui-checker`, `gsd-nyquist-auditor` | Secuencial (max 3 iteraciones) |
| Executors | `gsd-executor` | Paralelo dentro de waves |
| Verifiers | `gsd-verifier` | Secuencial tras ejecutores |
| Mappers | `gsd-codebase-mapper` | 4 en paralelo (tech, arch, quality, concerns) |
| Debuggers | `gsd-debugger` | Secuencial e interactivo |
| Auditors | `gsd-ui-auditor`, `gsd-security-auditor` | Secuencial |
| Doc Writers | `gsd-doc-writer`, `gsd-doc-verifier` | Secuencial |
| Profilers | `gsd-user-profiler` | Secuencial |

### 3.4 Namespace Meta-Skills (v1.40)

Para evitar listar 86 skills al inicio de cada sesión (coste de ~2.150 tokens), v1.40 introduce 6 routers que actúan como punto de entrada:

| Router | Rutea hacia |
|---|---|
| `/gsd-workflow` | Pipeline de fase: discuss / plan / execute / verify / phase / progress |
| `/gsd-project` | Ciclo de vida del proyecto: milestones, audits, summary |
| `/gsd-quality` | Quality gates: code review, debug, audit, security, eval, ui |
| `/gsd-context` | Inteligencia del codebase: map, graphify, docs, learnings |
| `/gsd-manage` | Gestión: config, workspace, workstreams, thread, update, ship, inbox |
| `/gsd-ideate` | Exploración y captura: explore, sketch, spike, spec, capture |

El modelo selecciona el namespace, y el router lo dirige a la skill concreta anidada. Coste total: ~120 tokens para los 6 routers vs ~2.150 para 86 skills planas.

### 3.5 Runtimes soportados (16+)

GSD Core se instala en cualquiera de estos entornos:

- **Claude Code** (el original)
- **OpenCode** / **Kilo** (puerto OpenCode original)
- **Gemini CLI** (usa sintaxis con dos puntos: `/gsd:comando`)
- **Kimi CLI** (con agent skills personalizadas)
- **Codex** (sintaxis con `$` prefijo)
- **Copilot**
- **Cursor**, **Windsurf**, **Devin Desktop**
- **Antigravity**, **Trae**, **Cline**, **Augment Code**
- **Qwen Code**, **Hermes Agent**, **CodeBuddy**

El instalador (`bin/install.js`, ~10.700 líneas) adapta automáticamente el formato de comandos, nombres de eventos de hooks y rutas de configuración a cada runtime.

### 3.6 Brownfield vs Greenfield

- **Greenfield** (`/gsd-new-project`): el comando entrevista al usuario con preguntas socráticas, lanza 4 investigadores en paralelo (stack, features, architecture, pitfalls), sintetiza los hallazgos y produce un roadmap con fases.
- **Brownfield** (`/gsd-map-codebase`): primer paso analizar el código existente con un agente mapper (4 paralelos para tech, arch, quality, concerns). Los hallazgos se guardan en `.planning/codebase/` con frontmatter YAML que incluye `last_mapped_commit` para detectar drift. Tras mapear, `/gsd-new-project` ya puede partir del contexto existente.

---

## 4. Las Fases en Profundidad (el "Phase Loop")

El flujo canónico es **Discuss → UI design → Plan → Execute → Verify → Ship**, repetido fase a fase dentro de cada milestone.

### Fase 0: Discuss (`/gsd-discuss-phase N`)

- **Qué produce:** `XX-CONTEXT.md` (preferencias del usuario) y `XX-DISCUSSION-LOG.md` (audit trail).
- **Qué hace el humano:** responde preguntas socráticas adaptativas sobre las zonas grises de la fase. Si la fase es visual pregunta por layouts y estados vacíos; si es API pregunta por formatos de respuesta y verbosidad.
- **Qué hace el agente:** genera preguntas graduadas, registra respuestas. Modos: `--all` (recorre todas las zonas), `--auto` (selecciona defaults), `--batch` (agrupa en lote), `--analyze` (incluye análisis de trade-offs), `--power` (carga respuestas desde archivo), `--assumptions` (muestra las suposiciones del agente sin preguntar).
- **Verificación:** humana, antes de pasar a plan-phase.

### Fase 0.5: UI design (`/gsd-ui-phase N`) — opcional

- **Qué produce:** `XX-UI-SPEC.md` (contrato de diseño).
- **Cuándo se usa:** sólo para fases con componente visual. Salta en fases backend puras.
- **Por qué existe:** un contrato de diseño escrito cuesta menos que re-implementar UI cuando hay ambigüedad.

### Fase 1: Plan (`/gsd-plan-phase N`)

- **Qué produce:** `XX-RESEARCH.md`, `XX-YY-PLAN.md` (uno por plan de la fase), `XX-VALIDATION.md`. En modo MVP+TDD también puede generar `SKELETON.md` (Walking Skeleton para fase 1).
- **Qué hace el humano:** opcionalmente revisa planes antes de ejecutar; puede usar `--auto` para no confirmar.
- **Qué hace el agente:**
  1. **Researcher** investiga el ecosistema y escribe `RESEARCH.md` (con Package Legitimacy Gate desde v1.42.1).
  2. **Planner** lee research + CONTEXT.md y descompone en planes atómicos.
  3. **Plan-checker** verifica cada plan (max 3 iteraciones). Verifica cobertura de REQ-IDs y de decisiones.
- **Estructura de un plan atómico (XML):**
  ```xml
  <task type="auto">
    <name>Create login endpoint</name>
    <files>src/app/api/auth/login/route.ts</files>
    <action>
      Use jose for JWT (not jsonwebtoken - CommonJS issues).
      Validate credentials against users table.
      Return httpOnly cookie on success.
    </action>
    <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
    <done>Valid credentials return cookie, invalid return 401</done>
  </task>
  ```
- **Flags poderosos:** `--mvp` (rebanadas verticales UI→API→DB en lugar de capas horizontales), `--tdd` (cada tarea behavior-adding empieza con un test rojo), `--bounce` (validación externa con script), `--ingest` (carga ADRs), `--gaps` (lee VERIFICATION.md y re-planifica huecos).
- **Package Legitimacy Gate (v1.42.1):** cuando el investigador recomienda paquetes externos, GSD ejecuta `slopcheck install <pkg> --json` y registra el veredicto en una tabla de RESEARCH.md:
  - `[OK]` aprobado, sin checkpoint
  - `[SUS]` flag + checkpoint humano antes de instalar
  - `[SLOP]` eliminado del plan (defensa contra "slopsquatting")
  - `[ASSUMED]` paquetes de WebSearch sin verificación → tratado como `[SUS]`

### Fase 2: Execute (`/gsd-execute-phase N`)

- **Qué produce:** un commit atómico por tarea, `XX-YY-SUMMARY.md` por plan, `XX-VERIFICATION.md` al completar.
- **Qué hace el humano:** supervisión opcional con `--validate`, decisión de continuar/parar si falla.
- **Qué hace el agente:**
  1. **Wave analysis** agrupa planes en ondas por dependencias.
  2. **Executor** por plan corre en contexto fresco de 200K (o 1M si modelo habilitado) con el PLAN.md específico.
  3. **Resumen y merge** entre waves.
  4. **Post-execute codebase drift gate** (#2003) compara nuevos directorios/exports/migrations contra `.planning/codebase/STRUCTURE.md` para detectar cambios no planificados.
- **Wave execution (ejemplo):**
  ```
  Wave 1 (paralelo):  Plan 01 (User Model) + Plan 02 (Product Model)
  Wave 2 (paralelo):  Plan 03 (Orders API, depende de 01) + Plan 04 (Cart API, depende de 02)
  Wave 3:             Plan 05 (Checkout UI, depende de 03+04)
  ```
- **Commits atómicos resultantes:**
  ```bash
  abc123f feat(08-02): add email confirmation flow
  def456g feat(08-02): implement password hashing
  hij789k feat(08-02): create registration endpoint
  ```
- **Parallel commit safety:** `--no-verify` en commits paralelos para evitar fights de hooks; mutex sobre `STATE.md` con `STATE.md.lock` (O_EXCL, timeout 10s, spin-wait con jitter) para evitar race conditions read-modify-write.
- **Checkpoint heartbeats (#2410):** ejecutores en background emiten `[checkpoint] phase N wave W/M starting, P/Q plans done` para evitar Stream idle timeout de la API de Claude en fases multi-plan.

### Fase 3: Verify (`/gsd-verify-work N`)

- **Qué produce:** `XX-UAT.md` con resultados de tests de aceptación; planes de fix si hay fallos.
- **Qué hace el humano:** ejecuta los escenarios de aceptación listados. Si algo falla, marca el test como fallido.
- **Qué hace el agente:** si hay fallos, genera planes de fix listos para re-ejecutar.
- **Para UAT con navegador:** companion oficial `gsd-browser` (`gsd-browser mcp`) con navegación determinista, versionado, aserciones, screenshots, diffs visuales y takeover humano. También compatible con Playwright MCP.

### Fase 4: Ship (`/gsd-ship N`)

- **Qué produce:** Pull Request en GitHub con cuerpo auto-generado, STATE.md actualizado, tag de versión.
- **Requisitos:** CLI `gh` instalado y autenticado.
- **Cuerpo del PR incluye:** objetivo de la fase, cambios (de SUMMARYs), requisitos cubiertos (REQ-IDs), estado de verificación, decisiones clave. Secciones adicionales configurables vía `ship.pr_body_sections`.
- **Flag `--draft`:** crea el PR como borrador.

### Navegación: `/gsd-progress`

Muestra estado actual y下一步 con auto-routing:
- Sin proyecto → sugiere `/gsd-new-project`
- Fase necesita discusión → ejecuta `/gsd-discuss-phase`
- Fase necesita planificación → `/gsd-plan-phase` o `/gsd-plan-review-convergence` (con `--converge`)
- Fase necesita ejecución → `/gsd-execute-phase`
- Fase necesita verificación → `/gsd-verify-work`
- Todo completo → sugiere `/gsd-complete-milestone`

Flags notables: `--next --auto` encadena pasos hasta completar el milestone; `--forensic` añade auditoría de 6 checks (consistencia de STATE, handoffs huérfanos, drift de scope, work pendiente, todos bloqueantes, código sin commit); `--do "descripción"` analiza intención libre y dispatcha al comando más apropiado.

---

## 5. Conceptos Técnicos Clave

### Context rot (problema nuclear)

Definición oficial: "The quality degradation that happens as an AI fills its context window." Se manifiesta como:
- El modelo contradice decisiones anteriores.
- El estilo de código deriva de las convenciones iniciales.
- Los planes ignoran requisitos enterrados en el historial.
- Alucinaciones de nombres de archivo o firmas de función.

Investigación académica citada por el equipo GSD: el paper "Lost in the Middle" (Liu et al., Stanford) demuestra que los primeros y últimos tokens reciben más atención que los del medio, independientemente del tamaño de la ventana.

La métrica operativa:
- 0-30% de contexto: calidad máxima
- 50%+: recortes y omisiones
- 70%+: alucinaciones y olvidos graves

### Subagentes con contexto fresco (la solución)

Cada subagente spawneado por un orquestador arranca con una ventana limpia de 200.000 tokens. El orquestador principal (la sesión del usuario) sólo carga payloads JSON compactos y resultados, por lo que se mantiene al 30-40% de ocupación. Trade-off explícito de la documentación: la latencia de spawn es mayor que un edit in-context, pero la calidad ganada compensa para trabajo no trivial.

### Adaptive Context Enrichment (modelos 1M+)

Cuando el `context_window` configurado es ≥ 500.000 (modelos como Opus 4.6 o Sonnet 4.6 con 1M tokens), GSD enriquece automáticamente los prompts de los subagentes:
- **Executors** reciben SUMMARY.md de waves previas y CONTEXT.md/RESEARCH.md de la fase, permitiendo conciencia cross-plan.
- **Verifiers** reciben PLAN.md + SUMMARY.md + CONTEXT.md + REQUIREMENTS.md completos, permitiendo verificación con historial.

Para ventanas estándar de 200K, los prompts usan versiones truncadas con ordenamiento cache-friendly.

### `.planning/` como sistema de memoria

Cada artefacto significativo se escribe a disco como Markdown o JSON legible. Esto implica:
- Sobrevive a context resets (`/clear`).
- Cualquier agente posterior puede leer artefactos previos sin depender de conversación compartida.
- Se puede commitear a git para visibilidad de equipo.

`STATE.md` es la espina dorsal: registra posición actual (milestone, fase, planes completos), decisiones activas, bloqueos y métricas. Cualquier workflow lee STATE.md para orientarse; cualquier workflow escribe al terminar un paso significativo.

### Wave-based execution

Los planes se agrupan en waves según dependencias. Las waves corren en paralelo entre sí (dentro de cada wave los ejecutores no tocan archivos superpuestos). Entre waves hay merge de estado. Esto minimiza el tiempo total de fase y maximiza el throughput.

### Atomic commits

Cada tarea completada produce un commit inmediatamente. Beneficios:
- `git bisect` encuentra la tarea exacta que introdujo un bug.
- Cada commit es independientemente revertible.
- Historial legible para Claude en sesiones futuras.
- Mejor observabilidad del workflow.

### Context monitor hooks

GSD registra hooks de runtime para vigilar la ocupación de contexto:
- **statusLine** muestra modelo, tarea, directorio y barra de uso.
- **context-monitor** (PostToolUse/AfterTool) inyecta warnings:
  - ≤ 35% restante: WARNING "Avoid starting new complex work"
  - ≤ 25% restante: CRITICAL "Context nearly exhausted, inform user"
- **Debounce:** 5 usos de herramienta entre warnings repetidos; severidad escala sin debounce.
- **Hot-reload de config:** hook `FileChanged` recarga `.planning/config.json` sin necesidad de `/clear` (#2792).

### Multi-runtime hooks

Cada runtime expone eventos con nombres distintos, pero el propósito es el mismo:
- Claude Code: `PreCompact`, `Stop`, `SubagentStop`, `FileChanged`
- Gemini: `BeforeAgent`, `AfterAgent`, `BeforeModel`
- Qwen: `SubagentStop`, `Stop`, `PreCompact`

GSD registra el equivalente semántico en cada runtime, manteniendo filosofía multi-runtime incluso en la capa de observabilidad.

### Sobre "UAP" (User-Approved Plan)

El término "UAP" no aparece literalmente en la documentación oficial de GSD. El concepto más cercano es el **plan-checker verification loop** (max 3 iteraciones) más la aprobación humana implícita entre `plan-phase` y `execute-phase` que ocurre en modo `interactive`. En modo `yolo` se salta esta aprobación. **Nota para Scribe:** si vas a usar el término UAP en el artículo, conviene aclararlo como análogo conceptual a la fase de aprobación del plan.

### `continue-here.md` (handoff entre sesiones)

Generado por `/gsd-pause-work` (con `--report` opcional para summary adicional). Permite que `/gsd-resume-work` restaure el contexto completo en una nueva sesión: posición actual, decisiones pendientes, último commit, siguiente paso lógico.

---

## 6. Workflows y Patrones de Uso

### 6.1 Greenfield completo: de idea a PR

```bash
# 1. Instalar GSD (una vez)
npx @opengsd/gsd-core@latest
# → Elige runtime (Claude Code), instalación global o local

# 2. Inicializar proyecto
/gsd-new-project
# → Entrevista socrática + 4 investigadores paralelos + roadmap

# 3. Por cada fase del roadmap:
/gsd-discuss-phase 1   # Decide cómo se construirá
/gsd-plan-phase 1      # Investiga + planifica + verifica
/gsd-execute-phase 1   # Ejecuta en waves paralelas
/gsd-verify-work 1     # Acepta tests manualmente
/gsd-ship 1            # Crea el PR

# 4. Al cerrar milestone
/gsd-complete-milestone
# → Archiva, etiqueta release
```

### 6.2 Brownfield (proyecto con código existente)

```bash
# 1. Analizar el código existente
/gsd-map-codebase             # 4 mappers paralelos, salida a .planning/codebase/
# o versión rápida:
/gsd-map-codebase --fast      # 1 mapper single-focus

# 2. Inicializar (ahora con contexto del código)
/gsd-new-project
# → Las preguntas socráticas se centran en qué vas a añadir

# 3. Mismo loop por fase
# ... igual que greenfield
```

### 6.3 Modo "Quick" para tareas ad-hoc

```bash
/gsd-quick                          # Tarea rápida básica, sin investigar
/gsd-quick --validate               # Plan-check + post-verify
/gsd-quick --full                   # Pipeline completo: discuss + research + plan-check + verify
/gsd-quick --discuss --research     # Componible
/gsd-quick --validate --research    # Otra combinación
```

GSD mantiene atomic commits y tracking de estado igual que en el loop completo, pero sin la sobrecarga de la entrevista inicial.

### 6.4 Modo "Autonomous" hands-free

```bash
/gsd-autonomous                     # Ejecuta todas las fases restantes
/gsd-autonomous --from 3 --to 5     # Solo fases 3 a 5
/gsd-autonomous --only 4            # Solo fase 4
/gsd-autonomous --converge --all    # Con plan-review convergence y todos los reviewers
```

Encadena discuss → plan → execute → verify → ship automáticamente. Útil para sprint nights donde quieres ver progresar el proyecto mientras duermes.

### 6.5 Plan-Review Convergence (multi-AI validation)

```bash
/gsd-plan-review-convergence 3          # Default reviewers, 3 cycles
/gsd-plan-review-convergence 3 --codex  # Solo Codex
/gsd-plan-review-convergence 3 --all --max-cycles 5
```

Bucle `plan → review → replan → re-review` que termina cuando no quedan concerns HIGH ni findings accionables MEDIUM/LOW fuera de `PLAN.md`. Soporta reviewers: Codex, Gemini, Claude, OpenCode, Ollama, LM Studio, llama.cpp.

### 6.6 Model profiles

Configurables en `config.json` o vía `/gsd-config --profile`:

| Profile | Planning | Execution | Verification | Coste |
|---|---|---|---|---|
| `quality` | Opus | Opus | Sonnet | Alto |
| `balanced` (default) | Opus | Sonnet | Sonnet | Medio |
| `budget` | Sonnet | Sonnet | Haiku | Bajo |
| `adaptive` | ajusta dinámicamente por agente | | | Variable |
| `inherit` | usa el modelo de la sesión actual | | | Variable (útil con OpenRouter/modelos locales) |

Desde v1.40 se puede afinar por tipo de fase: `models.planning`, `models.discuss`, `models.research`, `models.execution`, `models.verification`, `models.completion`. Desde v1.42, `model_policy.provider` + `model_policy.budget` habilita presets por catálogo (OpenAI, Anthropic, Google, Qwen, generic).

### 6.7 Multi-modelo y cross-AI

- **Plan-review convergence** permite usar Gemini para revisar planes que Claude generó.
- **Cross-AI execution** (`workflow.cross_ai_execution: true`): delega `/gsd-execute-phase` a un CLI externo (configurable vía `workflow.cross_ai_command`). Útil cuando quieres que un modelo diferente ejecute.
- **Model policy** desde v1.42: mapea tiers a modelos específicos del provider (ej. `model_policy.runtime_tiers.claude.opus = "gpt-5-pro"`).

### 6.8 Gestión de tokens y coste

Cita textual de la documentación: *"You can run an entire phase — deep research, multiple plans created and verified, thousands of lines of code written across parallel executors, automated verification — and your main context window stays at 30-40%."*

Levers principales para reducir coste:
- **Profile `budget`** (Sonnet + Haiku en lugar de Opus).
- **Profile de instalación `core` / `standard` / `full`** que controla cuántas skills se cargan al inicio.
- **Desactivar research/plan_check/verifier** en `config.json` para tareas simples.
- **`/gsd-quick` en lugar de fase completa** para cambios triviales.
- **No abusar de MCP servers pesados** (browser/playwright, mac-tools pueden costar 20k+ tokens por turno).

### 6.9 Cuándo NO usar GSD (textual del docs)

- Prototipos rápidos de 1-2 horas para validar una idea.
- Scripts pequeños o utilidades de una sola función.
- Cambios triviales (un color, un texto, una dependencia).
- Aprendizaje exploratorio donde quieres iterar rápido.

Regla práctica: si puedes especificar la tarea en un prompt corto y completarla en un solo turno sin aclaración, salta el phase loop. Si requiere investigación, archivos no leídos recientemente, o decisiones no resueltas, el loop te protege.

---

## 7. Comparación Honesta con Otros Frameworks

### 7.1 vs Spec Kit, OpenSpec, BMAD (frameworks SDD "pesados")

| Dimensión | GSD Core | Spec Kit | OpenSpec | BMAD-METHOD |
|---|---|---|---|---|
| **Filosofía** | Context engineering + agentic | Constitucional (proyecto) | Change proposals (delta) | Multi-agent agile team |
| **Enfoque principal** | Combatir context rot con subagentes | Mantener constitución | Trazabilidad por cambio | Simular equipo ágil |
| **Complejidad inicial** | Baja | Baja-Media | Baja | Alta |
| **Curva de aprendizaje** | Suave | Media | Suave | Empinada |
| **Costo en tokens arranque** | Bajo (6 routers) | Medio | Bajo | Alto (20+ agentes) |
| **Ideal para** | Solo devs, freelancers | Equipos con stack estable | Brownfield, mantenimiento | Enterprise, compliance |
| **Verificación** | UAT + verifier + UAT gates | Phase gates | `openspec validate` | Quality gate 90% |
| **Comando principal** | `/gsd-plan-phase` | `/speckit.constitution` | `openspec new-change` | `/pm` (agente) |
| **Runtimes** | 16+ | 3 (Copilot, Claude, Gemini) | 20+ (cualquiera que lea MD) | 3 (Claude, Cursor, Windsurf) |
| **Brownfield first** | Sí (`/gsd-map-codebase`) | No (greenfield) | Sí (incremental specs) | No |
| **Atomic commits** | Sí, por tarea | No automático | No | Opcional |

**Cuándo elegir GSD sobre los demás:**
- Eres solo o freelance y quieres "describe lo que necesitas, obtén código fiable".
- Tu mayor problema es context rot, no falta de documentación.
- Quieres funcionar con cualquier runtime (Claude, Codex, Gemini, Cursor, etc.).
- Odias las ceremonias y quieres atomic commits sin esfuerzo.

**Cuándo NO elegir GSD:**
- Necesitas compliance estricto con trazabilidad por cambio (OpenSpec es mejor).
- Tu proyecto es enterprise con múltiples equipos y procesos formales (BMAD).
- Tu arquitectura es estable y quieres un documento constitucional persistente (Spec Kit).

### 7.2 vs Beads, LeanSpec, Taskmaster (frameworks "lean")

Comparado con los tres cubiertos en el artículo previo del blog (`lean-task-first-beads-leanspec-taskmaster.md`):

| Dimensión | GSD Core | Beads | LeanSpec | Taskmaster |
|---|---|---|---|---|
| **Capa** | SDD completo + context engineering | Issue tracker DAG | Spec lifecycle | PRD → tasks |
| **Artefacto principal** | PLAN.md (XML atómico) | JSONL en git | Specs <2K tokens | Task graph JSON |
| **Almacenamiento** | `.planning/` (Markdown) | `.beads/issues.jsonl` | `specs/*.md` | `tasks.json` |
| **Dependencias** | Waves dentro de fase | DAG cross-issue | Spec-level | Task-level graph |
| **Inicio de proyecto** | `/gsd-new-project` (entrevista) | `bd init` (vacío) | `lean-spec new` | `task-master parse-prd` |
| **Planificación** | Investigador + planner + checker | No (sólo tracking) | Discover→Design→Impl→Validate | Expandir tasks con subtasks |
| **Ejecución** | Subagentes paralelos con contexto fresco | No (manual) | No (manual) | No (manual) |
| **Verificación** | Verifier + UAT | No | Validate phase | Status tracking |
| **Ceremonia** | Media (loop de 5 pasos) | Mínima | Mínima | Mínima |
| **Multi-runtime** | 16+ | Claude Code focus | 5+ | 7+ |

**Relación complementaria:** Nada impide usar GSD para la planificación/ejecución y Beads para coordinación cross-issue si la complejidad del grafo de tareas lo justifica. Sin embargo, GSD ya cubre la mayoría de casos de uso que esas tres herramientas abordan por separado, integradas en un solo loop.

### 7.3 vs Ralph Loop (autonomous iteration)

Ralph Loop (de Geoffrey Huntley) ejecuta agentes en loops hasta cumplir specs, usando git como memoria. GSD y Ralph son complementarios en espíritu pero diferentes en ejecución:
- **Ralph:** itera sobre la misma sesión con stop hooks; simple y robusto.
- **GSD:** spawna subagentes con contextos frescos; estructura más rica.

De hecho existe **bmalph** (de Lars Cowe) que combina BMAD para planning + Ralph para execution.

### 7.4 Fortalezas de GSD (honestas)

- **Calidad constante:** los subagentes con contexto fresco evitan la degradación que mata proyectos largos.
- **Modularidad real:** 33 agentes intercambiables, 16+ runtimes, hooks configurables.
- **Brownfield-friendly:** `/gsd-map-codebase` analiza proyectos existentes sin reescribirlos.
- **Disciplina sin burocracia:** atomic commits + wave execution + UAT sin sprints ni standups.
- **Open source, sin paywall:** MIT, sin tiers de pago, sin features bloqueadas.
- **Comunidad activa:** Discord propio, Open GSD como organización, ~138 contribuidores en el pico.

### 7.5 Debilidades de GSD (honestas)

- **Latencia:** los spawns de subagentes son más lentos que un edit in-context. Para tareas simples, la espera duele.
- **Ceremonia para cambios triviales:** re-nombrar una variable no debería requerir 5 archivos de planning. El equipo lo sabe y por eso existe `/gsd-quick`, pero la gravedad por defecto sigue siendo el loop completo.
- **Configuración abrumadora:** el `config.json` tiene >50 keys, los profiles tienen 5+ opciones, los toggles de workflow son >30. Para un principiante, el primer arranque puede ser confuso.
- **Dependencia de la calidad del prompt base:** si los prompts del orquestador fallan, todo el sistema degrada. Es por eso que la modularización de los workflows en archivos `<40KB` es crítica.
- **Tooling joven:** aunque el framework original tiene 64k+ estrellas, el nuevo repositorio apenas lleva 4.4k y 24 releases. Riesgo de regresión.
- **Documentación dispersa:** `/docs/` está estructurada (tutorials/how-to/reference/explanation) pero algunas features avanzadas sólo se entienden leyendo el código fuente.

---

## 8. Ejemplos de Comandos y Artefactos Reales

### 8.1 Instalación con perfil de skills

```bash
# Solo el núcleo (mínimo coste de arranque)
/gsd-core --claude --global --profile=core

# Núcleo + revisión + configuración
/gsd-core --claude --global --profile=standard

# Todas las skills (default)
/gsd-core --claude --global --profile=full
```

### 8.2 Inicialización con extracción automática desde PRD

```bash
/gsd-new-project                    # Modo interactivo
/gsd-new-project --auto @prd.md     # Auto-extrae de un PRD existente
```

### 8.3 Discusión de fase con auto-defaults

```bash
/gsd-discuss-phase 3 --auto         # Selecciona defaults recomendados
/gsd-discuss-phase 1 --all          # Discute todo sin selección
/gsd-discuss-phase 2 --analyze      # Con análisis de trade-offs
```

### 8.4 Planificación con modo MVP+TDD

```bash
/gsd-plan-phase 1 --mvp                    # Rebanadas verticales UI→API→DB
/gsd-plan-phase 1 --mvp --tdd              # Cada tarea behavior-adding empieza en rojo
/gsd-plan-phase 2 --ingest docs/adr/0010.md  # Carga un ADR en lugar de CONTEXT
/gsd-plan-phase --research-phase 4 --view  # Solo ver RESEARCH.md existente
```

### 8.5 Ejecución de fase completa

```bash
/gsd-execute-phase 1                # Ejecuta toda la fase
/gsd-execute-phase 1 --wave 2       # Solo Wave 2
/gsd-execute-phase 2 --cross-ai     # Delega a CLI externo
/gsd-execute-phase 1 --validate     # Valida estado antes
```

### 8.6 Ejemplo real de `STATE.md` (estructura documentada)

```markdown
# State

## Current Position
- Milestone: v1.0
- Phase: 02 of 05 (User Authentication)
- Plan: 02-02 of 03 (JWT validation middleware)
- Status: In progress

## Decisions
- Use jose for JWT (not jsonwebtoken - CommonJS issues)
- bcrypt rounds: 12
- Session timeout: 24h sliding

## Blockers
- None

## Metrics
- Phase 01: 8 commits, 0 failed verifications
- Phase 02: 3 of 8 plans complete

## Last Updated
2026-06-18T14:23:00Z
```

### 8.7 Ejemplo real de `PLAN.md` (formato XML atómico)

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT (not jsonwebtoken - CommonJS issues).
    Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

### 8.8 Ejemplo real de `RESEARCH.md` con Package Legitimacy Gate

```markdown
# Phase 02 Research: User Authentication

## Ecosystem Findings
- Next.js 15.4 supports route handlers natively
- Supabase Auth has a free tier for indie projects
- jose is the recommended JWT library (replaces jsonwebtoken)

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict |
|---|---|---|---|---|---|
| jose | npm | 5y | 12M/wk | github.com/panva/jose | [OK] |
| bcryptjs | npm | 8y | 4M/wk | github.com/dcodeIO/bcrypt.js | [OK] |
| fastauth-pro | npm | 2d | 12 | not-found | [SLOP] |
| jwt-ultimate | npm | unknown | 0 | suspicious | [SUS] |

## Recommendation
Use jose + bcryptjs. Skip "fastauth-pro" (slopsquatting detected).
Manual verification required for "jwt-ultimate" before installation.
```

### 8.9 Ejemplo real de `ROADMAP.md` (formato documentado)

```markdown
# Roadmap

## Milestone: v1.0 - Core Application
**Status:** In progress

### Phase 01: Project Scaffolding
**Goal:** Set up Next.js 15 with TypeScript, Tailwind, and basic routing.
**Status:** Complete
**Requirements:** REQ-01, REQ-02

### Phase 02: User Authentication
**Goal:** Implement email/password login with JWT sessions.
**Status:** In progress
**Mode:** mvp
**Requirements:** REQ-03, REQ-04, REQ-05

### Phase 03: Data Model and API
**Goal:** Define database schema and REST endpoints.
**Status:** Pending
**Requirements:** REQ-06 through REQ-12
```

### 8.10 Comandos de gestión diaria

```bash
/gsd-progress                       # ¿Dónde estoy? ¿Qué sigue?
/gsd-progress --next                # Auto-avanza al siguiente paso
/gsd-progress --forensic            # Auditoría de 6 checks
/gsd-resume-work                    # Tras context reset
/gsd-pause-work --report            # Handoff con summary
/gsd-undo --plan 03-02              # Revierte plan específico
/gsd-debug "auth token null"        # Debugging sistemático
/gsd-help --full                    # Referencia completa
```

---

## 9. Referencias Bibliográficas

### Fuentes oficiales

1. **GSD Core — Repositorio activo** — [github.com/open-gsd/gsd-core](https://github.com/open-gsd/gsd-core). Código fuente, 3.785 commits, 24 releases, v1.5.0 (17 jun 2026). MIT license.
2. **GSD (legacy) — Archivo redirector** — [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done). 64.3k estrellas, 2.928 commits, 78 releases, v1.42.3 (16 may 2026).
3. **Documentación oficial (mintlify)** — [gsd-build-get-shit-done.mintlify.app](https://gsd-build-get-shit-done.mintlify.app/). Incluye `/why-gsd`, `/concepts`, `/commands`, `/workflow`.
4. **GSD Core en npm** — [npmjs.com/package/@opengsd/gsd-core](https://www.npmjs.com/package/@opengsd/gsd-core). Instalación con `npx @opengsd/gsd-core@latest`.
5. **Open GSD homepage** — [opengsd.net](https://opengsd.net).
6. **Discord oficial** — [discord.gg/mYgfVNfA2r](https://discord.gg/mYgfVNfA2r).
7. **OpenCode port (original)** — [github.com/rokicool/gsd-opencode](https://github.com/rokicool/gsd-opencode).

### Artículos en profundidad

8. **Web Reactiva — "GSD (Git. Ship. Done): guía completa del framework de context engineering para Claude Code"** — Daniel Primo, 27 feb 2026 (actualizado 12 jun 2026). [webreactiva.com/blog/gsd](https://www.webreactiva.com/blog/gsd). Comparativa con PAUL, BMAD, cc-sdd; testimonios de usuarios; instalación detallada.
9. **The New Stack — "Beating context rot in Claude Code with GSD"** — David Eastman, 31 ene 2026. [thenewstack.io/beating-the-rot-and-getting-stuff-done](https://thenewstack.io/beating-the-rot-and-getting-stuff-done/). Análisis técnico de context rot, experiencia práctica instalando GSD, flujo de preguntas socráticas en `/gsd:new-project`.
10. **Pasquale Pillitteri — "Goodbye Vibe Coding: Spec-Driven Development Framework"** — 23 ene 2026 (actualizado may 2026). [pasqualepillitteri.it/en/news/158](https://pasqualepillitteri.it/en/news/158/framework-ai-spec-driven-development-guide-bmad-gsd-ralph-loop). Comparativa de 7 frameworks SDD (BMAD, GSD, Ralph, Spec Kit, Kiro, Tessl, cc-sdd, Spec-Flow); caso "100.000 LOC en 2 semanas" (Alex Lavaee con GSD); hightower comparison marzo 2026.

### Papers y referencias técnicas

11. **"Lost in the Middle"** — Liu et al., Stanford. [cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf](https://cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf). Base académica del problema de context rot.
12. **"Attention is all you need"** — Vaswani et al., NeurIPS 2017. [papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf). Fundamento de la arquitectura transformer.
13. **Redis Blog — "What is context rot?"** — [redis.io/blog/context-rot](https://redis.io/blog/context-rot/). Articulación accesible del fenómeno.

### Artículos en español sobre GSD

14. **Web Reactiva Podcast/Newsletter** — [webreactiva.com](https://www.webreactiva.com). Cobertura continua de GSD por Daniel Primo.
15. **Web Reactiva Skill Store** — Skills descargables relacionadas con GSD en [webreactiva.com/skills](https://www.webreactiva.com/skills).

### Frameworks y alternativas referenciados

16. **PAUL** — [github.com/ChristopherKahler/paul](https://github.com/ChristopherKahler/paul). PLAN → APPLY → UNIFY loop; CARL context augmentation.
17. **BMAD-METHOD** — [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD). 20+ agentes, multi-agent agile; v6.6.0 abril 2026.
18. **cc-sdd** — [github.com/gotalab/cc-sdd](https://github.com/gotalab/cc-sdd). Kiro-style commands para multi-IDE.
19. **GitHub Spec Kit** — [github.com/github/spec-kit](https://github.com/github/spec-kit). Constitutional workflow.
20. **OpenSpec** — [github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec). Change-proposal pattern.
21. **Beads** — [github.com/steveyegge/beads](https://github.com/steveyegge/beads). DAG issue tracker para AI agents.
22. **LeanSpec** — [github.com/codervisor/lean-spec](https://github.com/codervisor/lean-spec). Specs <2K tokens con MCP.
23. **Taskmaster** — [github.com/eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master). PRD-to-task pipeline.
24. **Ralph Wiggum** — Plugin oficial Anthropic en [github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum). Loop autónomo.
25. **bmalph** — Combinación BMAD + Ralph por Lars Cowe.
26. **Kiro (AWS)** — [kiro.dev](https://kiro.dev/). Agentic IDE basado en Code OSS con SDD nativo.
27. **Tessl** — [tessl.io](https://tessl.io/). Spec-as-source, // GENERATED FROM SPEC.
28. **Spec-Flow** — [github.com/marcusgoll/Spec-Flow](https://github.com/marcusgoll/Spec-Flow). Quality gates y token budgets.
29. **Hightower's Comparison (marzo 2026)** — Rick Hightower. Comparativa Superpowers, BMAD, SpecKit, GSD.

### Artículos relacionados del blog ArceApps (prior art interno)

- `sdd-frameworks-analysis-spec-kit-openspec-bmad.md` (28 mar 2026)
- `spec-driven-development-ai.md` (24 mar 2026) — menciona GSD-2 brevemente
- `lean-task-first-beads-leanspec-taskmaster.md` (28 mar 2026)
- `alternative-paradigms-ai-software-engineering.md` (24 mar 2026)
- `effective-context-ai.md` (25 oct 2025)
- `orchestrating-ai-agents-cicd-pipeline.md` (9 mar 2026)
- `production-agentic-frameworks.md` (25 oct 2025)
- `complete-beginners-guide-ai-agents-stack-2026.md` (23 abr 2026)

---

## 10. Mapeo de Cross-links con Contenido Existente del Blog

Para cada artículo previo, identifico las secciones más relevantes para enlazar desde el nuevo artículo sobre GSD.

### 10.1 `sdd-frameworks-analysis-spec-kit-openspec-bmad.md`

**Secciones relevantes para cross-link:**
- **"The Shared Problem: Context Collapse in Agentic AI"** (línea 18) → Perfecto para introducir GSD como solución al mismo problema desde un ángulo distinto (subagentes vs constitución/deltas/organigrama).
- **"Comparative Analysis"** (línea 211) → Tabla comparativa que se puede ampliar/contrastar con la sección de GSD en el nuevo artículo.
- **"Practical Recommendation for Indie Developers"** (línea 250) → Ya recomienda OpenSpec; el nuevo artículo sobre GSD puede matizar "GSD cuando prefieres agente único sobre change proposals".

**Enlace sugerido al inicio:** "Este artículo complementa [SDD Frameworks Deep Dive](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad), que analiza tres frameworks constitucionales (Spec Kit, OpenSpec, BMAD). Aquí veremos cómo GSD toma un camino distinto: en lugar de organizar el código con reglas formales, organiza el trabajo del agente con contextos frescos."

### 10.2 `spec-driven-development-ai.md`

**Secciones relevantes para cross-link:**
- **"5. GSD-2 (`gsd-build/gsd-2`)"** (línea 202) → Menciona GSD-2 de pasada en la lista de frameworks. El nuevo artículo es la oportunidad de actualizar esa mención a GSD Core.
- **"The Crisis of Vibe Coding"** (línea 12) → Setup natural: "Si estás aquí porque el vibe coding te falló, GSD es una de las respuestas más estructuradas."

**Enlace sugerido:** "Vibe coding tiene un sucesor: [GSD Core](este artículo). Si vienes del [análisis general de SDD](/blog/spec-driven-development-ai), verás que GSD se posiciona en la columna 'context engineering first'."

### 10.3 `lean-task-first-beads-leanspec-taskmaster.md`

**Secciones relevantes para cross-link:**
- **"The Context Rot Problem in Depth"** (línea 20) → GSD ataca el mismo problema con una solución diferente: subagentes con contexto fresco en lugar de máquinas rehydratedas desde grafos.
- **"Combining All Three: A Practical Indie Dev Workflow"** (línea 326) → Esta sección proponía Taskmaster + LeanSpec + Beads. El nuevo artículo puede proponer "GSD como reemplazo integrado" de los tres.

**Enlace sugerido:** "Cubrimos tres herramientas lean (Beads, LeanSpec, Taskmaster) en [otro artículo](/blog/lean-task-first-beads-leanspec-taskmaster). GSD es la respuesta cuando quieres todas esas funciones (task graph, spec lifecycle, PRD parsing) integradas en un solo framework."

### 10.4 `alternative-paradigms-ai-software-engineering.md`

**Secciones relevantes para cross-link:**
- **"🎯 Intent-Driven Development (IDD)"** (línea 30) → GSD es la implementación práctica de IDD para Claude Code: el "intent" se captura en `PROJECT.md` y los planes XML.
- **"📐 Lean Specification-Driven Development (Lean SDD)"** (línea 64) → GSD va un paso más allá que Lean SDD: no solo specs pequeñas, sino specs + planes + ejecutores atómicos.
- **"🔗 The BEADS Workflow"** (línea 102) → GSD contiene internamente la funcionalidad de Beads (task tracking via STATE.md) más la ejecución.

**Enlace sugerido:** "IDD, Lean SDD y BEADS son las tres metodologías alternativas que [analizamos en otro artículo](/blog/alternative-paradigms-ai-software-engineering). GSD es la materialización práctica de las tres para Claude Code."

### 10.5 `effective-context-ai.md`

**Secciones relevantes para cross-link:**
- **"Optimizing Context Windows"** (línea 47) → Las técnicas manuales de selección de archivos relevantes son el precursor de lo que GSD automatiza con contexto fresco por subagente.
- **"The 4 C's of Context"** (línea 13) → GSD convierte esas 4C en defaults del sistema (Capacity=rol, Context=PROJ/STATE, Constraints=CONTEXT, Chain=PLAN atómico).

**Enlace sugerido al inicio:** "El manual [Effective Context for AI](/blog/effective-context-ai) enseña las 4C del prompt engineering manual. GSD automatiza esa disciplina con subagentes."

### 10.6 `orchestrating-ai-agents-cicd-pipeline.md`

**Secciones relevantes para cross-link:**
- **"The Architecture: Three Agents, One Pipeline"** (línea 22) → Describe Sentinel/Scribe/Bolt como agentes. GSD es el caso extremo: 33 agentes coordinados por un orquestador.
- **"AGENTS.md as the Pipeline's Source of Truth"** (línea 233) → GSD genera un `CLAUDE.md` automáticamente y mantiene `.planning/` como fuente de verdad versionada.
- **"Conclusion"** (línea 312) → "The natural next step is adding a planning agent that coordinates the others using a framework like CrewAI or LangGraph." — GSD ES ese planning agent.

**Enlace sugerido:** "En [Orchestrating AI Agents in CI/CD](/blog/orchestrating-ai-agents-cicd-pipeline) vimos cómo Sentinel, Scribe y Bolt colaboran en GitHub Actions. GSD es esa misma idea pero elevada a 33 agentes coordinados y orientada a desarrollo, no a CI."

### 10.7 `production-agentic-frameworks.md`

**Secciones relevantes para cross-link:**
- **"LangGraph: The State Machine Powerhouse"** (línea 25) → GSD tiene un state machine implícito (waves, gates, transiciones de fase) implementado en Markdown workflows en lugar de código Python.
- **"PydanticAI: Type-Safe, Pythonic Agent Engineering"** (línea 176) → GSD logra "type safety" de otra forma: planes XML con `<action>`, `<verify>`, `<done>` obligatorios.

**Enlace sugerido:** "Comparamos LangGraph, CrewAI y PydanticAI como frameworks de producción en [otro artículo](/blog/production-agentic-frameworks). GSD es interesante porque logra coordinación multi-agente sin código Python, sólo con workflows en Markdown."

### 10.8 `complete-beginners-guide-ai-agents-stack-2026.md`

**Secciones relevantes para cross-link:**
- **"🖱️ Cursor and Claude Code: The Agentic Programming Environment"** (línea 213) → GSD es la capa meta sobre Claude Code / Cursor / OpenCode, no un reemplazo.
- **"MCPs: The Integration Protocol That Changes Everything"** (línea 181) → GSD integra con `gsd-browser` MCP y respeta otros MCP servers.

**Enlace sugerido:** "Si estás siguiendo la [guía para principiantes de stack 2026](/blog/complete-beginners-guide-ai-agents-stack-2026), GSD es la pieza que faltaba en la capa de workflow: el meta-framework que orquesta Claude Code, Cursor o cualquier runtime compatible."

---

## 11. Ángulos Narrativos Sugeridos para el Artículo de 4000+ Palabras

El artículo debe respirar el **espíritu indie** del blog (técnico, apasionado, cercano, realista, sobrio). Tres ángulos posibles:

### Ángulo A: "Del caos al contexto fresco" — historia de una transformación personal

**Tono:** En primera persona, compartiendo el dolor del context rot, descubriendo GSD, y la transformación del workflow propio.

**Estructura sugerida:**
1. **El Lunes Negro** (300 palabras) — Anécdota personal: "el lunes abrí Claude Code, le pedí que continuara el proyecto del viernes anterior, y empezó a re-generar el archivo de configuración que ya existía. Volví a explicarle. Se olvidó otra vez. Ese día entendí que el problema no era el modelo, era mi flujo de trabajo."
2. **El problema técnico: context rot** (500 palabras) — Explicación del fenómeno con la cita del paper "Lost in the Middle". Las métricas de calidad por ocupación de contexto. Por qué `/clear` no es la solución.
3. **El descubrimiento de GSD** (400 palabras) — Cómo encontré el framework, la cita de TÂCHES ("I'm a solo developer. I don't write code — Claude Code does."), el contraste con la jerga enterprise de otros frameworks.
4. **La arquitectura de subagentes** (700 palabras) — Cómo GSD estructura el trabajo: comando → workflow → agentes con contexto fresco. Wave execution. Atomic commits. El estado en `.planning/`.
5. **El phase loop en acción** (800 palabras) — Walkthrough real de las 5 fases con un proyecto ficticio. Discuss → Plan → Execute → Verify → Ship. Lo que produce cada paso.
6. **El ecosistema alrededor** (500 palabras) — 16 runtimes, 33 agentes, 6 namespace routers, hooks, model profiles. Cómo GSD no te encierra.
7. **Cuándo no usarlo** (300 palabras) — Honesto: para qué NO sirve. El `/gsd-quick` para tareas triviales. La regla de "si cabe en un prompt corto, no merece el loop".
8. **Comparativa rápida con BMAD, Spec Kit, OpenSpec** (500 palabras) — Tabla + análisis de cuándo elegir cada uno.
9. **Cierre indie** (200 palabras) — Reflexión sobre por qué un framework que se llama "Get Shit Done" resuena con quien programa en sus ratos libres.

**Total estimado:** ~4.200 palabras.

### Ángulo B: "Anatomía de un framework indie" — el ángulo técnico-meta

**Tono:** Desmontar GSD pieza por pieza, explicando decisiones de diseño. Para lectores que quieren entender cómo funciona por dentro.

**Estructura sugerida:**
1. **El nombre como manifiesto** (200 palabras) — Por qué "Get Shit Done" y luego "Git. Ship. Done." Importa el naming.
2. **Context rot: el enemigo** (500 palabras) — Papers, métricas, evidencia anecdótica.
3. **Subagentes con contexto fresco: la solución estructural** (600 palabras) — Por qué funciona. Wave execution. Los 200K tokens por agente.
4. **El phase loop** (700 palabras) — Las 5 fases en detalle, qué artefactos producen, quién hace qué.
5. **Anatomía del código** (600 palabras) — 33 agentes, 6 routers, comandos, workflows, hooks, CLI tools. El árbol `.planning/`.
6. **El estado distribuido: STATE.md como memoria** (500 palabras) — Cómo se sobrevive a context resets. Handoffs via `continue-here.md`.
7. **Configuración y modelos** (400 palabras) — Model profiles, granularidad, TDD mode, MVP mode, package legitimacy gate.
8. **Seguridad y defensa en profundidad** (400 palabras) — Plan-checker, verifier, atomic commits, prompt injection guard, worktree isolation, drift gate.
9. **El ecosistema multi-runtime** (300 palabras) — 16 runtimes, hooks multi-vocabulario, MCP integration.
10. **Reflexión: lo que GSD enseña sobre el desarrollo con IA** (300 palabras) — Más allá de la herramienta: la lección metodológica.

**Total estimado:** ~4.500 palabras.

### Ángulo C: "Comparativa práctica desde la trinchera indie" — el ángulo decisión

**Tono:** Presentar GSD como una opción más en el ecosistema SDD, con honestidad sobre cuándo elegirlo.

**Estructura sugerida:**
1. **El estado del arte SDD en 2026** (400 palabras) — Repaso rápido de los frameworks (Spec Kit, OpenSpec, BMAD, PAUL, Ralph, Beads, LeanSpec, Taskmaster). Por qué hay tantos y qué problemas resuelven.
2. **GSD: el anti-ceremonia** (500 palabras) — La filosofía de TÂCHES. La promesa: "complejidad en el sistema, no en tu flujo."
3. **Instalación y primer proyecto** (600 palabras) — Tutorial paso a paso con comandos reales. Elige Claude Code, perfil standard.
4. **El phase loop en un proyecto real** (800 palabras) — Walkthrough completo. PROJECT.md, REQUIREMENTS.md, ROADMAP.md, primer fase, atomic commits, PR.
5. **Las sorpresas técnicas** (500 palabras) — Lo que no te cuentan: hooks que se registran solos, namespace routers, adaptive context enrichment, package legitimacy gate, worktree isolation.
6. **Comparativa práctica: GSD vs las alternativas** (700 palabras) — Tabla + análisis. Cuándo GSD gana, cuándo pierde, cuándo complementa a otros.
7. **El factor humano: cuándo NO vale la pena** (300 palabras) — La honestidad de Martin Fowler aplicada a GSD: no es para todo.
8. **Veredicto indie** (200 palabras) — Para quién es, para quién no.

**Total estimado:** ~4.000 palabras.

---

## Notas Adicionales para Scribe

1. **Tono de la traducción:** Mantener el nombre "GSD Core" en inglés (es la marca oficial), pero traducir todo lo demás. La sección "Espíritu Indie" del blog sugiere evitar jergas corporate — coherente con la filosofía de GSD.

2. **Fechas y verificación:** Mi fecha actual es 2026-06-18. La última versión de GSD Core (v1.5.0) se publicó el 17 jun 2026, así que la información está al día. El repositorio legacy `gsd-build/get-shit-done` quedó como redirect puro.

3. **Prior art más relevante para el cuerpo del artículo:** El artículo `lean-task-first-beads-leanspec-taskmaster.md` (28 mar 2026) ya cubre el contexto de "context rot" y herramientas para combatirlo. El nuevo artículo sobre GSD debe **complementar** sin repetir — centrarse en lo que GSD aporta de único: el phase loop completo, los subagentes paralelos, y la amplitud multi-runtime.

4. **Disclaimer sobre "UAP":** El término "User-Approved Plan" (sección 5 del brief original) no aparece en la documentación oficial. La fase de aprobación existe (entre `/gsd-plan-phase` y `/gsd-execute-phase` en modo `interactive`) pero no se llama UAP. Sugiero renombrar a "Plan Approval Gate" o simplemente "el loop de verificación del plan-checker" en el artículo.

5. **Para SEO/discovery:** Tags sugeridos para el frontmatter: `["AI", "Workflow", "GSD", "Claude Code", "Spec-Driven Development", "Context Engineering", "Agentic AI", "Productivity", "Open Source", "Indie Dev"]`.

6. **Imagen hero sugerida:** SVG minimalista con los 5 colores del phase loop (teal primary, orange secondary) en círculos conectados, con un agente (cubo) en el centro. Estilo coherente con los heroes previos del blog (blog-sdd-frameworks-analysis.svg, blog-lean-task-first-beads-leanspec-taskmaster.svg).

7. **Estructura de headings para Astro:** Usar el patrón `##` para secciones principales y `###` para subsecciones, como el resto del blog. Mantener emojis en los headings (consistente con el resto del blog).
