---
title: "GSD Core: el framework anti-ceremonia para la ingeniería de contexto con IA"
description: "Análisis profundo de GSD Core (ex Get Shit Done): 33 agentes, wave execution, contexto fresco de 200K por subagente, y el phase loop Discuss→Plan→Execute→Verify→Ship. Cómo instalarlo, cuándo usarlo y cuándo no."
pubDate: 2026-06-05
lastmod: 2026-06-05
author: ArceApps
keywords:
  - "GSD Core"
  - "Context Engineering"
  - "Anti-ceremonia"
  - "Framework"
  - "IA"
canonical: "https://arceapps.com/es/blog/gsd-core-context-engineering/"
heroImage: "/images/gsd-core-context-engineering.svg"
tags: ["AI", "Workflow", "GSD", "Claude Code", "Spec-Driven Development", "Context Engineering", "Agentic AI", "Productivity", "Open Source", "Indie Dev"]
category: ai-agents
reference_id: "f8a4d6c2-7e3b-4a1f-9d5e-2c8b6a4f1e94"
---



> **Lectura relacionada:** [SDD Frameworks Deep Dive: Spec Kit, OpenSpec y BMAD-METHOD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) · [Lean, Task-First: Beads, LeanSpec y Taskmaster](/blog/lean-task-first-beads-leanspec-taskmaster) · [Spec-Driven Development con IA Agentic](/blog/specs-driven-development) · [Alternative Paradigms in AI-Assisted Engineering](/blog/paradigmas-alternativos-ingenieria-software-ia) · [Effective Context for AI](/blog/contexto-efectivo-ia)


![Infografía Taskmaster](/images/infographic-taskmaster.svg)


![Infografía LeanSpec](/images/infographic-leanspec.svg)


![Infografía Beads](/images/infographic-beads.svg)


![Infografía BMAD](/images/infographic-bmad.svg)


![Infografía Spec-Kit](/images/infographic-spec-kit.svg)


![Infografía OpenSpec](/images/infographic-openspec.svg)

Hubo un lunes, hará ya algunos meses, en el que abrí Claude Code con la mejor de las intenciones. El proyecto del fin de semana era un extractor de facturas en Kotlin: tres pantallas, un parser básico, y la enésima iteración de un side project que llevaba arrastrando tres meses. Le pedí al agente que continuara desde donde lo dejamos. Lo primero que hizo fue regenerar un archivo de configuración que ya existía. Se lo indiqué. Volvió a regenerarlo. Esta vez con un nombre distinto. Le recordé que ya teníamos un parser funcional y me propuso "refactorizar para mejor claridad". Cuando me quise dar cuenta llevaba cuarenta minutos de una sesión y el código nuevo era peor que el del viernes.

No era un problema del modelo. El modelo era el mismo. No era un problema de la herramienta, que probablemente era la mejor del mercado. El problema era estructural: yo estaba intentando hacer desarrollo serio con un agente que olvidaba todo entre sesiones, y la "solución" que había estado usando — re-explicar el contexto al inicio de cada sesión — había dejado de escalar.

Esa misma semana descubrí **GSD Core**, y mi forma de trabajar con agentes cambió para siempre.


![Infografía GSD](/images/infographic-gsd.svg)

Este artículo es el que me habría gustado leer ese lunes: qué es GSD, cómo está construido, cómo se instala, cómo se usa en un proyecto real, y honestamente, cuándo no usarlo. No es un tutorial superficial ni una reseña apologética. Es la guía que necesitaba un desarrollador indie frustrado por el context rot y cansado de la jerga enterprise de otros frameworks.

---

## 🦠 El enemigo: qué es el context rot (y por qué te está matando)

Antes de hablar de GSD hay que nombrar al enemigo. El equipo de GSD lo llama **context rot**, y la definición oficial no tiene pierde: *"la degradación de calidad que ocurre a medida que una IA llena su ventana de contexto"*. No es una alucinación en el sentido clásico. El modelo está haciendo exactamente lo que fue entrenado a hacer. El problema es que su "memoria de trabajo" es finita, opaca y, lo más importante, compartida con tu sesión actual.

La evidencia empírica es demoledora, y está medida por los propios ingenieros que construyen GSD:

- **0-30% de ocupación**: calidad máxima. El modelo razona bien, mantiene la atención, no inventa.
- **50%+ de ocupación**: empiezan los recortes y omisiones sutiles. Decisiones que tomaste hace dos horas son "reinterpretadas" con una variante que ya habías rechazado.
- **70%+ de ocupación**: alucinaciones de nombres de archivo, firmas de función inventadas, planes que ignoran requisitos enterrados en el historial.

El paper académico de referencia es **"Lost in the Middle"** (Liu et al., Stanford, 2023), que demuestra con datos que los transformers prestan más atención a los primeros y últimos tokens de la ventana que a los del medio, independientemente del tamaño total. Esto explica por qué una sesión de Claude Code con 100k tokens usados se comporta peor que una con 30k, aunque ambas "quepan" en la ventana.

La consecuencia práctica es que cada `/clear` que haces para "empezar de cero" no es un reset, es un parche que te devuelve a una tabula rasa sin memoria. Cada sesión que arranca desde cero es una sesión donde tienes que re-explicar la arquitectura, las decisiones, las restricciones, los archivos modificados y los próximos pasos. Y cada explicación adicional empuja la ventana hacia ese 50% crítico donde la calidad cae.

La pregunta que GSD se hace — y que yo debería haberme hecho antes — es: ¿y si en lugar de gestionar el contexto manualmente, **delego a subagentes que arrancan con su propia ventana limpia de 200.000 tokens**?

---

## 💀 El Lunes Negro y los frameworks que casi me convencen

Tras el Lunes Negro hice lo que cualquier desarrollador responsable haría: investigué. Probé **Spec Kit** de GitHub, que propone una constitución persistente que el agente lee al inicio. Bonito concepto, pero asume que ya conoces tu arquitectura lo suficiente para escribirla, y mi proyecto de las facturas estaba en plena exploración. Probé **OpenSpec**, que trata cada cambio como una propuesta que necesita aprobación. Útil para brownfield maduro, excesivo para un side project. Probé **BMAD-METHOD**, que simula un equipo ágil con 20+ agentes, product manager, arquitecto, scrum master. Lo instalé. Lo leí. Me sentí como si estuviera contratando un coach agile para una empresa de una persona.

Y entonces encontré un repositorio con 64.000 estrellas llamado **`gsd-build/get-shit-done`**. El nombre era deliberadamente provocador. La descripción, aún más:

> *"I'm a solo developer. I don't write code — Claude Code does. Other spec-driven development tools exist; BMAD, Speckit... But they all seem to make things way more complicated than they need to be (sprint ceremonies, story points, stakeholder syncs, retrospectives, Jira workflows)... I don't want to play enterprise theater."*

Eso era exactamente lo que necesitaba leer. Una herramienta construida por alguien que programa solo, en sus ratos libres, cansado de la jerga B2B, y que decidió que la complejidad debía vivir en el sistema, no en mi flujo de trabajo.

El autor es conocido como **TÂCHES** (un alias, no un equipo). El proyecto original alcanzó las **64.300 estrellas, 5.500 forks, 2.928 commits y 78 releases** antes de ser archivado como redirect puro. En 2026 el desarrollo se transfirió a la organización comunitaria **Open GSD** y el código activo vive ahora en `open-gsd/gsd-core`, con **v1.5.0 publicada apenas el 17 de junio de 2026** (un día antes de escribir este artículo). Todo bajo licencia **MIT**, sin tiers de pago, sin features bloqueadas, sin Discord privado, sin roadmap secreto.

Si te ofende el nombre, probablemente GSD no es para ti (estás buscando ceremonias). Si te resuena, encajas. Esa es la primera señal de que vamos a llevarnos bien.

---

## 🏗️ La arquitectura: cinco capas, una idea simple

Lo que más me sorprendió de GSD cuando empecé a leer el código fue lo *despojada* que es la arquitectura. En lugar de un monolito o de un framework de Python con estado distribuido, GSD son **cinco capas** que se comunican por convención:

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

El usuario teclea un comando. El comando es un archivo Markdown con un prompt estructurado. El workflow es otro Markdown que sabe qué agentes spawnear. Cada agente es, de nuevo, un Markdown con su propio prompt. Toda la lógica vive en texto plano versionable. Y al final, todos los artefactos — decisiones, planes, estados, verificaciones — son archivos Markdown y JSON en `.planning/`.

Esta decisión de diseño tiene tres consecuencias que me parecen profundas:

1. **Cero magia.** Si algo se comporta raro, abres el workflow y lees qué agentes spawneará. Si el planificador hace algo extraño, abres `gsd-planner.md` y lees su prompt. No hay un motor opaco que decide por ti.

2. **Versionable.** Todo `.planning/` se commitea a git. Puedes hacer `git diff` entre ramas y ver exactamente qué decisiones se tomaron, qué planes se ejecutaron, qué se verificó. Tu histórico de decisiones queda en el mismo sitio que tu código.

3. **Multi-runtime real.** Como todo es Markdown y JSON, y como cada runtime (Claude Code, Gemini CLI, Codex, Cursor, OpenCode) consume slash commands de su manera, GSD no te encierra en un proveedor. Funciona en 16+ entornos. Eso explicaré en detalle más adelante.

Pero la consecuencia más importante es la que combate directamente el context rot: **el orquestador principal (tu sesión) no toca código**. Tu sesión solo carga payloads JSON compactos y resultados. Los agentes hacen el trabajo pesado, cada uno con sus 200.000 tokens limpios. Tu ventana principal se queda en el 30-40% de ocupación, en la zona de calidad máxima.

---

## 🤖 Los 33 agentes: el roster que no verás (porque no tienes que hacerlo)

GSD no es un agente único. Es un equipo de **33 agentes especializados** que se invocan según la fase y la necesidad. Lo hermoso del diseño es que tú no los invocas individualmente. Los workflows saben qué agentes spawnear y cuándo. Tu trabajo es pedir el resultado correcto, no coordinar un organigrama.

El roster está documentado en `docs/INVENTORY.md` y se agrupa en categorías funcionales:

- **Researchers** (4 en paralelo): `gsd-project-researcher`, `gsd-phase-researcher`, `gsd-ui-researcher`, `gsd-advisor-researcher`. Son los que leen documentación, papers, blogs y repos para fundamentar decisiones.
- **Synthesizer** (1 secuencial): `gsd-research-synthesizer` consolida los hallazgos de los cuatro investigadores paralelos.
- **Planners** (2 secuenciales): `gsd-planner` y `gsd-roadmapper` descomponen el trabajo en planes atómicos.
- **Checkers** (4 secuenciales, max 3 iteraciones): `gsd-plan-checker`, `gsd-integration-checker`, `gsd-ui-checker`, `gsd-nyquist-auditor`. Verifican que lo planificado tiene sentido antes de ejecutarse.
- **Executors** (1 por plan, paralelos dentro de waves): `gsd-executor` es el que toca el código.
- **Verifiers** (1 secuencial): `gsd-verifier` confirma que el código ejecutó lo prometido.
- **Mappers** (4 en paralelo): para brownfield, `gsd-codebase-mapper` analiza tech, arquitectura, calidad y concerns del código existente.
- **Debuggers** (1 interactivo): `gsd-debugger` para sesiones de debugging sistemático.
- **Auditors** (2 secuenciales): `gsd-ui-auditor` y `gsd-security-auditor` para auditorías especializadas.
- **Doc Writers** (2 secuenciales): `gsd-doc-writer` y `gsd-doc-verifier` para mantener documentación sincronizada.
- **Profiler** (1 secuencial): `gsd-user-profiler` para personalizar el comportamiento según tu estilo.

La pregunta razonable es: ¿por qué 33 agentes y no 5 o 50? La respuesta está en la separación de responsabilidades. Cada agente tiene un prompt optimizado para una sola cosa, lo que significa que su contexto se llena de información relevante a su tarea, no de toda la información de toda la historia. Un researcher de stack no carga el código, solo carga documentación de librerías. Un executor de plan no carga todo el proyecto, solo carga el `PLAN.md` específico que le toca. Es la aplicación práctica de la idea de los "context slices" que expliqué en [Effective Context for AI](/blog/contexto-efectivo-ia): cada agente recibe solo la rodaja de contexto que maximiza su probabilidad de éxito.

---

## 🧭 El phase loop: Discuss → Plan → Execute → Verify → Ship

Si hay un concepto que define a GSD es el **phase loop canónico**: cinco pasos que se repiten fase a fase dentro de cada milestone. Cada paso tiene un comando slash, un workflow, agentes específicos, y artefactos versionados que sobreviven al context reset.

### Fase 0: Discuss (`/gsd-discuss-phase N`)

Antes de planificar, GSD quiere saber *cómo* vas a construir, no solo *qué*. El comando dispara una entrevista socrática adaptativa: si la fase es visual, pregunta por layouts y estados vacíos. Si es API, pregunta por formatos de respuesta y verbosidad. Si es base de datos, pregunta por migraciones y consistencia.

Los flags útiles son:

- `--all`: recorre todas las zonas grises sin selección.
- `--auto`: selecciona los defaults recomendados sin preguntar.
- `--batch`: agrupa preguntas en lotes para responder de un tirón.
- `--analyze`: incluye análisis de trade-offs en cada pregunta.
- `--power`: carga respuestas desde un archivo (útil para CI o sesiones desatendidas).
- `--assumptions`: muestra las suposiciones del agente sin preguntar, para que las corrijas o apruebes.

**Artefactos producidos:** `XX-CONTEXT.md` (tus preferencias para la fase) y `XX-DISCUSSION-LOG.md` (audit trail de las decisiones).

### Fase 0.5: UI design (`/gsd-ui-phase N`) — opcional

Solo se activa para fases con componente visual. Produce un `XX-UI-SPEC.md` que es un contrato de diseño: layouts, componentes, estados, interacciones. La justificación de su existencia es pragmática: un contrato de diseño escrito cuesta menos que re-implementar UI cuando hay ambigüedad. Para fases backend puras, este paso se salta automáticamente.

### Fase 1: Plan (`/gsd-plan-phase N`)

Esta es la fase más rica. El workflow lanza tres agentes en cadena:

1. **Researcher** investiga el ecosistema y escribe `XX-RESEARCH.md`. Desde v1.42.1 incluye el **Package Legitimacy Gate**: cada paquete externo que recomienda se somete a `slopcheck install <pkg> --json` y el veredicto se registra en una tabla. `[OK]` aprobado, `[SUS]` flag con checkpoint humano, `[SLOP]` eliminado del plan (defensa contra "slopsquatting", la nueva moda de attackers que suben paquetes maliciosos con nombres parecidos a librerías populares).

2. **Planner** lee `RESEARCH.md` + `CONTEXT.md` y descompone la fase en **planes atómicos** en formato XML. Cada plan tiene `name`, `files`, `action`, `verify` y `done`. Ejemplo real:

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

3. **Plan-checker** verifica cada plan con max 3 iteraciones. Comprueba cobertura de `REQ-IDs` y de decisiones registradas en el `CONTEXT.md`. Si un plan no pasa, vuelve al planner con feedback.

Los flags poderosos aquí son:

- `--mvp`: produce rebanadas verticales UI→API→DB en lugar de capas horizontales. En lugar de "primero toda la DB, luego toda la API, luego toda la UI", recibes "una feature end-to-end, luego otra, luego otra".
- `--tdd`: cada tarea behavior-adding empieza con un test rojo. Sí, integración de TDD real con el framework.
- `--bounce`: validación externa con script propio.
- `--ingest`: carga ADRs (Architecture Decision Records) en lugar de `CONTEXT.md`.
- `--gaps`: lee `VERIFICATION.md` de fases previas y re-planifica huecos detectados.

**Artefactos producidos:** `XX-RESEARCH.md`, `XX-YY-PLAN.md` (uno por plan), `XX-VALIDATION.md`.

### Fase 2: Execute (`/gsd-execute-phase N`)

Aquí ocurre la magia. El executor hace **wave analysis**: agrupa los planes en ondas según dependencias. Las waves corren en paralelo entre sí; dentro de cada wave los ejecutores no tocan archivos superpuestos. Entre waves hay merge de estado.

Cada executor corre en un contexto fresco de 200.000 tokens (o 1 millón si el modelo está habilitado para `context_window ≥ 500.000`) con su `PLAN.md` específico. Cada tarea completada produce un **commit atómico** que se puede revertir independientemente:

```bash
abc123f feat(08-02): add email confirmation flow
def456g feat(08-02): implement password hashing
hij789k feat(08-02): create registration endpoint
```

La seguridad de los commits paralelos está resuelta con elegancia técnica: `--no-verify` en los commits paralelos para evitar fights con hooks, más un **mutex sobre `STATE.md` con `STATE.md.lock`** (`O_EXCL`, timeout 10 segundos, spin-wait con jitter) para evitar race conditions read-modify-write. Es el tipo de detalle que solo aprecias cuando has visto un sistema multi-agente sin él.

Otros detalles notables de execute:

- **Checkpoint heartbeats**: los ejecutores en background emiten `[checkpoint] phase N wave W/M starting, P/Q plans done` para evitar el `Stream idle timeout` de la API de Claude en fases multi-plan.
- **Post-execute codebase drift gate**: compara nuevos directorios, exports y migrations contra `.planning/codebase/STRUCTURE.md` para detectar cambios no planificados.
- **Worktree isolation**: en modo `--worktree`, cada wave corre en un worktree git separado y se mergea al final, aislando completamente el trabajo.

**Artefactos producidos:** commits atómicos, `XX-YY-SUMMARY.md` por plan, `XX-VERIFICATION.md` al completar la fase.

### Fase 3: Verify (`/gsd-verify-work N`)

El humano vuelve al centro. GSD produce un `XX-UAT.md` con escenarios de aceptación que tú ejecutas. Si algo falla, lo marcas y el agente genera planes de fix listos para re-ejecutar. El companion oficial **`gsd-browser`** (`gsd-browser mcp`) permite verificación visual con navegación determinista, versionado, aserciones, screenshots y diffs visuales. También es compatible con Playwright MCP.

Esta fase es deliberadamente humana. La automatización llega hasta donde llega; la aceptación final es tuya.

### Fase 4: Ship (`/gsd-ship N`)

Crea un Pull Request con cuerpo auto-generado que incluye: objetivo de la fase, cambios (extraídos de los SUMMARYs), requisitos cubiertos (REQ-IDs), estado de verificación y decisiones clave. Secciones adicionales configurables vía `ship.pr_body_sections` en `config.json`. El flag `--draft` crea el PR como borrador.

El requisito es tener `gh` CLI instalado y autenticado. Sin más.

### Navegación: `/gsd-progress`

Después de unas cuántas fases, la pregunta obvia es "¿dónde estoy?". El comando lee `STATE.md` y te dice:

- Sin proyecto → sugiere `/gsd-new-project`.
- Fase necesita discusión → ejecuta `/gsd-discuss-phase`.
- Fase necesita planificación → sugiere `/gsd-plan-phase` o `/gsd-plan-review-convergence` con `--converge`.
- Fase necesita ejecución → `/gsd-execute-phase`.
- Fase necesita verificación → `/gsd-verify-work`.
- Todo completo → sugiere `/gsd-complete-milestone`.

Flags notables: `--next --auto` encadena pasos hasta completar el milestone; `--forensic` añade auditoría de 6 checks (consistencia de STATE, handoffs huérfanos, drift de scope, work pendiente, todos bloqueantes, código sin commit); `--do "descripción"` analiza intención libre y dispatcha al comando más apropiado.

---

## 🛠️ Instalación y primer proyecto: el camino mínimo viable

La instalación está diseñada para ser indolora. Un solo comando:

```bash
npx @opengsd/gsd-core@latest
```

El instalador detecta tu runtime, te pregunta global vs local, y adapta el formato de comandos, eventos de hooks y rutas de configuración automáticamente. Los tres perfiles de instalación controlan cuántas skills se cargan al inicio:

```bash
/gsd-core --claude --global --profile=core      # Solo el núcleo, mínimo coste de arranque
/gsd-core --claude --global --profile=standard  # Núcleo + revisión + configuración
/gsd-core --claude --global --profile=full      # Todas las skills (default)
```

Para greenfield, el segundo comando es:

```bash
/gsd-new-project                # Modo interactivo, entrevista socrática completa
/gsd-new-project --auto @prd.md # Auto-extrae requisitos de un PRD existente
```

La entrevista hace preguntas graduadas, lanza 4 investigadores en paralelo (stack, features, architecture, pitfalls), sintetiza los hallazgos y produce un roadmap con fases. El output es un `.planning/` poblado con:

- `PROJECT.md`: visión del proyecto
- `REQUIREMENTS.md`: requisitos v1, v2 y out-of-scope
- `ROADMAP.md`: fases con estado
- `STATE.md`: memoria viva con posición, decisiones y bloqueos
- `config.json`: configuración del workflow

A partir de ahí, el ciclo de una fase es:

```bash
/gsd-discuss-phase 1   # Decide cómo se construirá
/gsd-plan-phase 1      # Investiga + planifica + verifica
/gsd-execute-phase 1   # Ejecuta en waves paralelas
/gsd-verify-work 1     # Acepta tests manualmente
/gsd-ship 1            # Crea el PR
```

Al cerrar milestone:

```bash
/gsd-complete-milestone
# → Archiva, etiqueta release
```

Para brownfield (que era mi caso, mi extractor de facturas ya tenía código), el flujo es:

```bash
# 1. Analizar el código existente
/gsd-map-codebase             # 4 mappers paralelos, salida a .planning/codebase/
# o versión rápida:
/gsd-map-codebase --fast      # 1 mapper single-focus

# 2. Inicializar (ahora con contexto del código)
/gsd-new-project
# → Las preguntas socráticas se centran en qué vas a añadir
```

Los 7 archivos producidos por `map-codebase` (STACK, ARCHITECTURE, CONVENTIONS, CONCERNS, STRUCTURE, TESTING, INTEGRATIONS) incluyen frontmatter YAML con `last_mapped_commit` para detectar drift. Cuando el código cambie, vuelves a mapear.

---

## 🧠 Conceptos técnicos que merecen explicación aparte

### `STATE.md`: la espina dorsal de la memoria distribuida

`STATE.md` es el único archivo que todos los workflows leen al arrancar y escriben al terminar. Registra:

- **Current Position**: milestone, fase, plan actual, status
- **Decisions**: decisiones activas que aún no se han ejecutado (ej. "Use jose for JWT, no jsonwebtoken")
- **Blockers**: bloqueos conocidos
- **Metrics**: commits por fase, verificaciones fallidas
- **Last Updated**: timestamp ISO 8601

El truco está en que `STATE.md` se commitea con cada cambio de fase. Cualquier agente futuro (incluido el de una nueva sesión tras un `/clear`) puede leer el estado actual sin re-preguntarte nada.

### `continue-here.md`: el handoff entre sesiones

Generado por `/gsd-pause-work --report`, captura posición actual, decisiones pendientes, último commit y siguiente paso lógico. Al arrancar una sesión nueva, `/gsd-resume-work` lo lee y restaura el contexto completo. Es la solución al "Lunes Negro": nunca más llegas a un proyecto sin saber dónde lo dejaste.

### Subagentes con contexto fresco: la decisión de diseño central

La cita textual de la documentación merece ser repetida: *"You can run an entire phase — deep research, multiple plans created and verified, thousands of lines of code written across parallel executors, automated verification — and your main context window stays at 30-40%."*

Los subagentes spawneados por un orquestador arrancan con una ventana limpia de 200.000 tokens. El orquestador principal solo recibe payloads JSON compactos y resultados. El trade-off explícito es que la latencia de spawn es mayor que un edit in-context, pero la calidad ganada compensa para trabajo no trivial. Para tareas simples, el `/gsd-quick` salta todo el phase loop.

### Adaptive Context Enrichment (modelos 1M+)

Para modelos con `context_window ≥ 500.000` (Opus 4.6, Sonnet 4.6 con 1M tokens), GSD enriquece automáticamente los prompts:

- **Executors** reciben `SUMMARY.md` de waves previas y `CONTEXT.md`/`RESEARCH.md` de la fase, permitiendo conciencia cross-plan.
- **Verifiers** reciben `PLAN.md` + `SUMMARY.md` + `CONTEXT.md` + `REQUIREMENTS.md` completos, permitiendo verificación con historial.

Para ventanas estándar de 200K, los prompts usan versiones truncadas con ordenamiento cache-friendly.

### Context monitor hooks: la red de seguridad

GSD registra hooks de runtime para vigilar la ocupación de contexto:

- **statusLine**: muestra modelo, tarea, directorio y barra de uso.
- **context-monitor** (PostToolUse/AfterTool): inyecta warnings:
  - ≤ 35% restante: WARNING *"Avoid starting new complex work"*
  - ≤ 25% restante: CRITICAL *"Context nearly exhausted, inform user"*
- **Debounce**: 5 usos de herramienta entre warnings repetidos; severidad escala sin debounce.
- **Hot-reload de config**: hook `FileChanged` recarga `.planning/config.json` sin necesidad de `/clear`.

Es defensa en profundidad: aunque el phase loop mantenga tu contexto al 30-40%, si por alguna razón empiezas a llenar la ventana, el hook te avisa antes de que sea tarde.

### Multi-runtime hooks

Cada runtime expone eventos con nombres distintos:

- Claude Code: `PreCompact`, `Stop`, `SubagentStop`, `FileChanged`
- Gemini: `BeforeAgent`, `AfterAgent`, `BeforeModel`
- Qwen: `SubagentStop`, `Stop`, `PreCompact`

GSD registra el equivalente semántico en cada runtime, manteniendo la filosofía multi-runtime incluso en la capa de observabilidad.

### Namespace Meta-Skills (v1.40)

Para evitar listar 86 skills al inicio de cada sesión (coste de ~2.150 tokens), v1.40 introduce 6 routers que actúan como punto de entrada:

| Router | Rutea hacia |
|---|---|
| `/gsd-workflow` | Pipeline de fase: discuss / plan / execute / verify / phase / progress |
| `/gsd-project` | Ciclo de vida del proyecto: milestones, audits, summary |
| `/gsd-quality` | Quality gates: code review, debug, audit, security, eval, ui |
| `/gsd-context` | Inteligencia del codebase: map, graphify, docs, learnings |
| `/gsd-manage` | Gestión: config, workspace, workstreams, thread, update, ship, inbox |
| `/gsd-ideate` | Exploración y captura: explore, sketch, spike, spec, capture |

El modelo selecciona el namespace, y el router lo dirige a la skill concreta anidada. Coste total: ~120 tokens para los 6 routers vs ~2.150 para 86 skills planas. Es economía de tokens hecha con buen gusto.

---

## 🌐 El ecosistema multi-runtime: 16+ entornos donde GSD funciona

Una de las decisiones de diseño más inteligentes de GSD es que no te encierra en Claude Code. El instalador (`bin/install.js`, ~10.700 líneas) adapta automáticamente el formato de comandos, nombres de eventos de hooks y rutas de configuración a cada runtime. Los entornos soportados son:

- **Claude Code** (el original)
- **OpenCode** y **Kilo** (puerto OpenCode original, github.com/rokicool/gsd-opencode)
- **Gemini CLI** (usa sintaxis con dos puntos: `/gsd:comando`)
- **Kimi CLI** (con agent skills personalizadas)
- **Codex** (sintaxis con `$` prefijo)
- **GitHub Copilot**
- **Cursor**, **Windsurf**, **Devin Desktop**
- **Antigravity**, **Trae**, **Cline**, **Augment Code**
- **Qwen Code**, **Hermes Agent**, **CodeBuddy**

¿Por qué importa? Porque a lo largo de 2026 he cambiado de editor tres veces. Empecé con Claude Code, probé Cursor durante un mes, ahora estoy de vuelta en OpenCode porque el precio de Claude Pro se me fue de las manos. Si mi framework de workflow dependiera del editor, estaría reescribiendo `.planning/` cada dos meses. Con GSD no: lo instalo una vez, funciona igual en todos lados.

---

## 💰 Gestión de tokens y coste: la pregunta inevitable

La pregunta que todo el mundo hace: ¿cuánto cuesta esto? La respuesta honesta es "depende del profile". GSD ofrece cinco model profiles configurables en `config.json` o vía `/gsd-config --profile`:

| Profile | Planning | Execution | Verification | Coste |
|---|---|---|---|---|
| `quality` | Opus | Opus | Sonnet | Alto |
| `balanced` (default) | Opus | Sonnet | Sonnet | Medio |
| `budget` | Sonnet | Sonnet | Haiku | Bajo |
| `adaptive` | ajusta dinámicamente por agente | | | Variable |
| `inherit` | usa el modelo de la sesión actual | | | Variable |

Desde v1.40 se puede afinar por tipo de fase: `models.planning`, `models.discuss`, `models.research`, `models.execution`, `models.verification`, `models.completion`. Desde v1.42, `model_policy.provider` + `model_policy.budget` habilita presets por catálogo (OpenAI, Anthropic, Google, Qwen, generic).

Los levers principales para reducir coste:

- Profile `budget` (Sonnet + Haiku en lugar de Opus).
- Profile de instalación `core` / `standard` / `full`.
- Desactivar research/plan_check/verifier en `config.json` para tareas simples.
- `/gsd-quick` en lugar de fase completa para cambios triviales.
- No abusar de MCP servers pesados (browser/playwright, mac-tools pueden costar 20k+ tokens por turno).

Para mi proyecto de las facturas, el profile `balanced` me costó aproximadamente lo que costaba antes sin framework, con la diferencia de que ahora el código generado es coherente entre sesiones y verificable.

---

## 🚫 Cuándo NO usar GSD: la honestidad que aprecio

La documentación oficial incluye una sección que pocos frameworks se atreven a escribir. Los casos en los que GSD no aplica:

- **Prototipos rápidos de 1-2 horas** para validar una idea. El phase loop completo es overhead.
- **Scripts pequeños o utilidades de una sola función**. `/gsd-quick` tampoco compensa aquí.
- **Cambios triviales** (un color, un texto, una dependencia menor).
- **Aprendizaje exploratorio** donde quieres iterar rápido sin estructura.

La regla práctica del equipo: si puedes especificar la tarea en un prompt corto y completarla en un solo turno sin aclaración, salta el phase loop. Si requiere investigación, archivos no leídos recientemente, o decisiones no resueltas, el loop te protege.

En mi flujo, `/gsd-quick` se ha convertido en el modo por defecto para cosas como "añade este log", "cambia este endpoint a POST" o "renombra esta variable". El phase loop completo lo reservo para features que justifican investigación, decisiones arquitectónicas o trabajo multi-archivo.

---

## ⚖️ Comparativa honesta: GSD vs el resto del ecosistema SDD

Ya cubrí en profundidad [Spec Kit, OpenSpec y BMAD-METHOD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad), y también [Beads, LeanSpec y Taskmaster](/blog/lean-task-first-beads-leanspec-taskmaster). Aquí va la comparativa que faltaba: cómo se posiciona GSD frente a cada familia.

### GSD vs los "pesados" (Spec Kit, OpenSpec, BMAD)

| Dimensión | GSD Core | Spec Kit | OpenSpec | BMAD-METHOD |
|---|---|---|---|---|
| **Filosofía** | Context engineering + agentic | Constitucional | Change proposals | Multi-agent agile team |
| **Enfoque principal** | Combatir context rot con subagentes | Mantener constitución | Trazabilidad por cambio | Simular equipo ágil |
| **Complejidad inicial** | Baja | Baja-Media | Baja | Alta |
| **Curva de aprendizaje** | Suave | Media | Suave | Empinada |
| **Costo en tokens arranque** | Bajo (6 routers) | Medio | Bajo | Alto (20+ agentes) |
| **Ideal para** | Solo devs, freelancers | Equipos con stack estable | Brownfield, mantenimiento | Enterprise, compliance |
| **Verificación** | UAT + verifier | Phase gates | `openspec validate` | Quality gate 90% |
| **Comando principal** | `/gsd-plan-phase` | `/speckit.constitution` | `openspec new-change` | `/pm` (agente) |
| **Runtimes** | 16+ | 3 | 20+ | 3 |
| **Brownfield first** | Sí (`/gsd-map-codebase`) | No (greenfield) | Sí (incremental) | No |
| **Atomic commits** | Sí, por tarea | No automático | No | Opcional |

**Cuándo elegir GSD sobre los demás:**

- Eres solo o freelance y quieres "describe lo que necesitas, obtén código fiable".
- Tu mayor problema es context rot, no falta de documentación.
- Quieres funcionar con cualquier runtime (Claude, Codex, Gemini, Cursor, etc.).
- Odias las ceremonias y quieres atomic commits sin esfuerzo.

**Cuándo NO elegir GSD:**

- Necesitas compliance estricto con trazabilidad por cambio → OpenSpec es mejor.
- Tu proyecto es enterprise con múltiples equipos y procesos formales → BMAD.
- Tu arquitectura es estable y quieres un documento constitucional persistente → Spec Kit.

### GSD vs los "lean" (Beads, LeanSpec, Taskmaster)

| Dimensión | GSD Core | Beads | LeanSpec | Taskmaster |
|---|---|---|---|---|
| **Capa** | SDD completo + context engineering | Issue tracker DAG | Spec lifecycle | PRD → tasks |
| **Artefacto principal** | PLAN.md (XML atómico) | JSONL en git | Specs <2K tokens | Task graph JSON |
| **Almacenamiento** | `.planning/` (Markdown) | `.beads/issues.jsonl` | `specs/*.md` | `tasks.json` |
| **Dependencias** | Waves dentro de fase | DAG cross-issue | Spec-level | Task-level graph |
| **Inicio de proyecto** | `/gsd-new-project` (entrevista) | `bd init` (vacío) | `lean-spec new` | `task-master parse-prd` |
| **Planificación** | Investigador + planner + checker | No (solo tracking) | Discover→Design→Impl→Validate | Expandir tasks |
| **Ejecución** | Subagentes paralelos con contexto fresco | No (manual) | No (manual) | No (manual) |
| **Verificación** | Verifier + UAT | No | Validate phase | Status tracking |
| **Ceremonia** | Media (loop de 5 pasos) | Mínima | Mínima | Mínima |
| **Multi-runtime** | 16+ | Claude Code focus | 5+ | 7+ |

**Relación complementaria:** Nada impide usar GSD para la planificación/ejecución y Beads para coordinación cross-issue si la complejidad del grafo de tareas lo justifica. Sin embargo, GSD ya cubre la mayoría de casos de uso que esas tres herramientas abordan por separado, integradas en un solo loop. Si vienes del [artículo sobre Beads, LeanSpec y Taskmaster](/blog/lean-task-first-beads-leanspec-taskmaster), mi recomendación honesta es: prueba GSD primero. Si después de una fase sientes que necesitas el grafo de dependencias externo, añade Beads. Pero probablemente no lo necesitarás.

### GSD vs Ralph Loop (autonomous iteration)

Ralph Loop (de Geoffrey Huntley) ejecuta agentes en loops hasta cumplir specs, usando git como memoria. GSD y Ralph son complementarios en espíritu pero diferentes en ejecución:

- **Ralph**: itera sobre la misma sesión con stop hooks; simple y robusto.
- **GSD**: spawna subagentes con contextos frescos; estructura más rica.

De hecho existe **bmalph** (de Lars Cowe) que combina BMAD para planning + Ralph para execution. Es el tipo de composición que el ecosistema agentic está explorando en 2026.

---

## 🛡️ Seguridad y defensa en profundidad: lo que GSD hace por ti sin que lo pidas

Un aspecto que me sorprendió gratamente es la cantidad de mecanismos de seguridad integrados. No son features opcionales, son el comportamiento por defecto:

- **Plan-checker con max 3 iteraciones**: un plan que no pasa tres rondas de verificación se descarta. No se ejecuta código mal planificado.
- **Verifier post-execute**: confirma que el código ejecutó lo que el plan prometía. Si no, genera planes de fix.
- **Atomic commits**: cada tarea es un commit aislado. Si algo sale mal, `git revert` recupera el estado en segundos.
- **Package Legitimacy Gate**: defensa contra slopsquatting con `slopcheck`. Un paquete nuevo, sin historial, sin downloads, sin repo verificable, no se instala.
- **Worktree isolation**: en modo `--worktree`, cada wave corre en su propio branch y se mergea al final. Si una wave rompe algo, el resto sobrevive.
- **Post-execute codebase drift gate**: detecta cambios no planificados en estructura, exports y migrations.
- **Context monitor hooks**: warnings de capacidad de contexto antes de que degraden la calidad.
- **Mutex sobre `STATE.md`**: previene race conditions en escenarios multi-agente.

No es un framework que asuma que confías ciegamente en el agente. Es un framework que trata al agente como un colaborador potencialmente brillante pero propenso a errores, y que construye los andamios para que esos errores no te cuesten horas.

---

## 📚 Ejemplo real: un PLAN.md en estado puro

Para que el phase loop no quede en abstracto, aquí va un extracto real (anonimizado) de un `02-01-PLAN.md` que generé para una feature de autenticación:

```xml
<task type="auto">
  <name>Add login endpoint with JWT</name>
  <files>
    src/app/api/auth/login/route.ts
    src/lib/auth/jwt.ts
    src/lib/auth/password.ts
  </files>
  <action>
    1. Create POST /api/auth/login handler.
    2. Use jose for JWT signing (NOT jsonwebtoken, has CJS issues
       with our ESM setup per package-legitimacy audit).
    3. Validate credentials against users table.
    4. Use bcryptjs with 12 rounds for password comparison.
    5. Return httpOnly + secure + sameSite=strict cookie on success.
    6. Return 401 on invalid credentials (no enumeration).
    7. Log auth attempts (without credentials) at INFO level.
  </action>
  <verify>
    curl -X POST localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"correct"}' \
      -i
    # Expect: 200 + Set-Cookie header with JWT
  </verify>
  <done>
    Valid credentials return 200 + cookie.
    Invalid credentials return 401.
    Empty body returns 400.
  </done>
</task>

<task type="auto">
  <name>Add session validation middleware</name>
  <files>
    src/middleware.ts
  </files>
  <action>
    Read JWT from cookie.
    Verify signature with jose.
    Attach decoded user to request context.
    401 if invalid or expired.
  </action>
  <verify>
    curl -X GET localhost:3000/api/protected \
      -H "Cookie: auth_token=<valid-jwt>"
    # Expect: 200 with user data
  </verify>
  <done>
    Protected routes require valid JWT.
    Expired tokens trigger redirect to /login.
  </done>
</task>
```

Lo que ves es un plan que un humano puede revisar, aprobar y entender. No es un blob de código. No es una promesa vaga. Es un contrato ejecutable con su propia verificación.

El flujo completo con esos dos planes fue:

1. `/gsd-discuss-phase 2 --auto` (defaults recomendados).
2. `/gsd-plan-phase 2 --mvp --tdd` (rebanadas verticales + TDD).
3. Aprobé el plan manualmente (modo interactive).
4. `/gsd-execute-phase 2` → wave 1 ejecutó los dos planes en paralelo → dos commits atómicos.
5. `/gsd-verify-work 2` → corrí los curls manualmente → UAT verde.
6. `/gsd-ship 2` → PR auto-generado con cuerpo bien estructurado.

Tiempo total: 22 minutos. Sin GSD, esa misma feature me habría llevado una tarde entera y dos sesiones de re-explicación de contexto.

---

## 🎓 Lo que GSD me enseñó sobre desarrollar con IA

Más allá de la herramienta concreta, GSD me hizo replantear varias cosas sobre cómo desarrollo con agentes:

**1. El problema no es el modelo, es el harness.** Un Opus 4.6 con 100k tokens usados produce código peor que un Sonnet 4.5 con 30k. La diferencia no es la inteligencia del modelo, es la disciplina del sistema que lo orquesta. GSD me obligó a pensar en el agente como un recurso con capacidad finita, no como un oráculo infinito.


![Infografía Harness](/images/infographic-harness.svg)

**2. La memoria persistente es más valiosa que el prompt perfecto.** He invertido horas afinando prompts. GSD me enseñó que un sistema de archivos versionado con `STATE.md` y `PLAN.md` atómicos vale más que cualquier truco de prompt engineering. La conversación es efímera; los artefactos sobreviven.

**3. La verificación humana sigue siendo insustituible.** El verifier automatizado detecta que el código compila y pasa tests. No detecta que la feature resuelve el problema real del usuario. La fase de UAT manual existe por una razón: la aceptación es un juicio de valor, no una métrica automatizable.

**4. Multi-runtime es una característica, no una concesión.** Pensar que tu workflow depende del editor es como pensar que tu lógica de negocio depende del framework. La portabilidad es libertad. Si mañana aparece un runtime mejor, mi `.planning/` y mi `STATE.md` migran con un comando.

**5. La ceremonia debe ganarse su sitio.** Que un framework te fuerce a hacer planning para un cambio de una línea es overhead. Que te lo permita con `/gsd-quick` es diseño. Que el phase loop completo esté disponible para features que lo justifican es madurez. GSD no asume que todas tus tareas son épicas; asume que algunas lo son y te da el aparato para manejarlas.

---

## 🎯 Veredicto indie: para quién es GSD, para quién no

**Es para ti si:**

- Eres desarrollador independiente o trabajas en un equipo pequeño (1-3 personas).
- Tu mayor frustración con los agentes es la degradación de calidad en sesiones largas.
- Estás cansado de frameworks SDD que te piden扮演 roles de un equipo que no tienes.
- Quieres que tu workflow sea portable entre Claude Code, Cursor, OpenCode, Codex o Gemini CLI.
- Te gusta la idea de atomic commits por tarea con `git bisect` real.
- Valoras el open source sin paywalls y la transparencia de procesos.

**No es para ti si:**

- Trabajas en una organización grande con compliance estricto y trazabilidad por cambio (OpenSpec).
- Tu equipo sigue metodologías agile formales y quieres simularlas literalmente (BMAD).
- Tu proyecto es greenfield ultra-maduro donde una constitución persistente tiene sentido (Spec Kit).
- Tus tareas son siempre triviales y un solo turno basta (cualquier LLM sin framework).
- No quieres aprender un sistema nuevo y prefieres un workflow ad-hoc.

**Mi recomendación personal:** si vienes del [análisis de SDD frameworks](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) o del [repaso a herramientas lean](/blog/lean-task-first-beads-leanspec-taskmaster) y aún no has probado nada, empieza por GSD. Es la opción que mejor balance da entre potencia, portabilidad y sobriedad. Si después de dos fases sientes que necesitas algo más constitucional, añade Spec Kit al stack. Si sientes que necesitas un grafo de dependencias externo, evalúa Beads. Pero date dos fases para formar una opinión. El phase loop tiene una curva de familiaridad: las primeras dos fases se sienten ceremoniosas, la tercera ya fluye, y a la quinta no quieres volver atrás.

---

## 📚 Bibliografía y Referencias

### Fuentes oficiales de GSD

1. **GSD Core — Repositorio activo** — [github.com/open-gsd/gsd-core](https://github.com/open-gsd/gsd-core). Código fuente, 3.785 commits, 24 releases, v1.5.0 (17 jun 2026). Licencia MIT.
2. **GSD (legacy) — Archivo redirector** — [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done). 64.300 estrellas, 2.928 commits, 78 releases, v1.42.3 (16 may 2026).
3. **Documentación oficial (mintlify)** — [gsd-build-get-shit-done.mintlify.app](https://gsd-build-get-shit-done.mintlify.app/). Incluye `/why-gsd`, `/concepts`, `/commands`, `/workflow`.
4. **GSD Core en npm** — [npmjs.com/package/@opengsd/gsd-core](https://www.npmjs.com/package/@opengsd/gsd-core). Instalación con `npx @opengsd/gsd-core@latest`.
5. **Open GSD homepage** — [opengsd.net](https://opengsd.net).
6. **Discord oficial** — [discord.gg/mYgfVNfA2r](https://discord.gg/mYgfVNfA2r).
7. **OpenCode port (original)** — [github.com/rokicool/gsd-opencode](https://github.com/rokicool/gsd-opencode).

### Artículos en profundidad sobre GSD

8. **Web Reactiva — "GSD (Git. Ship. Done.): guía completa del framework de context engineering para Claude Code"** — Daniel Primo, 27 feb 2026 (actualizado 12 jun 2026). [webreactiva.com/blog/gsd](https://www.webreactiva.com/blog/gsd). Comparativa con PAUL, BMAD, cc-sdd; testimonios de usuarios; instalación detallada en español. Lectura obligada si vienes del mundo hispano.
9. **The New Stack — "Beating context rot in Claude Code with GSD"** — David Eastman, 31 ene 2026. [thenewstack.io/beating-the-rot-and-getting-stuff-done](https://thenewstack.io/beating-the-rot-and-getting-stuff-done/). Análisis técnico de context rot y experiencia práctica instalando GSD.
10. **Pasquale Pillitteri — "Goodbye Vibe Coding: Spec-Driven Development Framework"** — 23 ene 2026 (actualizado may 2026). [pasqualepillitteri.it/en/news/158](https://pasqualepillitteri.it/en/news/158/framework-ai-spec-driven-development-guide-bmad-gsd-ralph-loop). Comparativa de 7 frameworks SDD con el caso "100.000 LOC en 2 semanas" de Alex Lavaee con GSD.

### Papers y fundamentos técnicos

11. **"Lost in the Middle: How Language Models Use Long Contexts"** — Liu et al., Stanford, 2023. [cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf](https://cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf). El paper que demuestra que los transformers prestan más atención a los extremos de la ventana que al medio.
12. **"Attention is all you need"** — Vaswani et al., NeurIPS 2017. [papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf). El fundamento de la arquitectura transformer.
13. **Redis Blog — "What is context rot?"** — [redis.io/blog/context-rot](https://redis.io/blog/context-rot/). Articulación accesible del fenómeno para audiencias técnicas.

### Frameworks y alternativas referenciados

14. **GitHub Spec Kit** — [github.com/github/spec-kit](https://github.com/github/spec-kit). Constitutional workflow.
15. **OpenSpec** — [github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec). Change-proposal pattern.
16. **BMAD-METHOD** — [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD). 20+ agentes, multi-agent agile; v6.6.0 abril 2026.
17. **PAUL** — [github.com/ChristopherKahler/paul](https://github.com/ChristopherKahler/paul). PLAN → APPLY → UNIFY loop; CARL context augmentation.
18. **cc-sdd** — [github.com/gotalab/cc-sdd](https://github.com/gotalab/cc-sdd). Kiro-style commands para multi-IDE.
19. **Beads** — [github.com/steveyegge/beads](https://github.com/steveyegge/beads). DAG issue tracker para AI agents.
20. **LeanSpec** — [github.com/codervisor/lean-spec](https://github.com/codervisor/lean-spec). Specs <2K tokens con MCP.
21. **Taskmaster** — [github.com/eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master). PRD-to-task pipeline.
22. **Ralph Wiggum** — Plugin oficial Anthropic en [github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum). Loop autónomo.
23. **Kiro (AWS)** — [kiro.dev](https://kiro.dev/). Agentic IDE con SDD nativo.
24. **Tessl** — [tessl.io](https://tessl.io/). Spec-as-source con `// GENERATED FROM SPEC`.
25. **Spec-Flow** — [github.com/marcusgoll/Spec-Flow](https://github.com/marcusgoll/Spec-Flow). Quality gates y token budgets.

### Artículos relacionados de ArceApps

26. [SDD Frameworks Deep Dive: GitHub Spec Kit, OpenSpec, and BMAD-METHOD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) — Análisis previo de los tres frameworks SDD "pesados".
27. [Spec-Driven Development con IA Agentic](/blog/specs-driven-development) — Marco teórico del SDD y mención a GSD-2.
28. [Lean, Task-First: Beads, LeanSpec, and Taskmaster in Practice](/blog/lean-task-first-beads-leanspec-taskmaster) — Las tres herramientas lean que GSD integra.
29. [Alternative Paradigms in AI-Assisted Engineering](/blog/paradigmas-alternativos-ingenieria-software-ia) — IDD, Lean SDD y Beads como metodologías alternativas.
30. [Effective Context for AI](/blog/contexto-efectivo-ia) — Las 4C del prompt engineering manual que GSD automatiza.
31. [Orchestrating AI Agents in CI/CD Pipelines](/blog/orquestar-agentes-pipeline-cicd) — Sentinel, Scribe y Bolt como agentes coordinados.
32. [Production Agentic Frameworks](/blog/production-agentic-frameworks) — LangGraph, CrewAI y PydanticAI como frameworks de producción.
33. [The Complete Beginner's Guide to AI Agents Stack 2026](/blog/stack-completo-agentes-ia-2026) — Dónde encaja GSD en el stack general.

---

## 🚪 Cierre

Hace un año, si me hubieras dicho que iba a defender públicamente un framework que se llama "Get Shit Done" y que me iba a obsesionar con un archivo llamado `STATE.md`, me habría reído. Pero la risa se me pasó el lunes que perdí cuarenta minutos regenerando código que ya existía.

GSD no es magia. Es una pieza de infraestructura que toma en serio el hecho de que los agentes de codificación son colaboradores brillantes pero con memoria frágil, y que el desarrollador humano no debería pagar el coste de gestionar manualmente esa fragilidad. Lo hace delegando a subagentes con contextos frescos, manteniendo artefactos versionados en `.planning/`, y construyendo un phase loop que escala desde `/gsd-quick` para cambios triviales hasta pipelines de 33 agentes para features que justifican el aparato.

Si eres un desarrollador indie harto del context rot y de la jerga enterprise, dale una tarde. Instálalo, mapea tu codebase, ejecuta una fase, y mira cómo se siente. Si te resuena, sigue. Si no, te quedas con Claude Code plano y no habrás perdido más que un domingo.

Yo, mientras tanto, voy a volver a mi extractor de facturas. Tengo tres fases en el roadmap, y esta vez, cuando cierre la sesión el viernes, sé que el lunes podré seguir exactamente donde lo dejé.

Si te animas a probarlo, me encantaría leer tu experiencia. Y si encuentras un bug en mi comparativa con BMAD, también. Aquí andamos, iterando en público.
