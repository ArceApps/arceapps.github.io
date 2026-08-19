---
title: "Agent Skills de Addy Osmani: 24 Skills para el Ciclo Completo"
description: "Tour a fondo por addyosmani/agent-skills: las 24 skills del ciclo Define→Ship, la anatomía de un SKILL.md con anti-rationalizations y red flags, el eval framework de tres niveles, y comparativa honesta con Superpowers, Spec-Kit y OpenSpec."
pubDate: 2026-08-07
lastmod: 2026-08-07
author: "ArceApps"
keywords:
  - "agent skills"
  - "addyosmani"
  - "spec driven development"
  - "superpowers vs agent skills"
  - "spec kit vs openspec"
canonical: "https://arceapps.com/es/blog/agent-skills-addyosmani-lifecycle-completo/"
heroImage: "/images/agent-skills-addyosmani-lifecycle-completo-es.svg"
tags: ["AI Agents", "Skills", "SDD", "Addy Osmani", "Spec-Driven Development"]
reference_id: "f4a8e1d2-9c3b-4b6e-8f7a-1d2e3f4a5b6c"
---

## Por qué este repositorio importa (y por qué ahora)

Si llevas meses siguiendo cómo los coding agents han pasado de "autocompletado glorificado" a algo que planifica, testea y revisa código de forma autónoma, ya conoces el ruido. Cada semana aparece un framework nuevo, una "metodología definitiva", una colección de skills que promete arreglar el caos. La mayoría muere en su primer mes. Tres siguen vivas y creciendo a velocidad absurda: [obra/superpowers](https://github.com/obra/superpowers) (268k★), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (64k★) y [github/spec-kit](https://github.com/github/spec-kit) (el intento oficial de GitHub por estandarizar el flujo spec-driven). Y luego está [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), que en este momento es el que más ruido silencioso está haciendo: 24 skills que cubren todo el ciclo de desarrollo, una arquitectura interna obsesionada con que las skills se *usen de verdad* (no solo existan en el repo), y un marco de evals que corre en CI para que ningún cambio rompa silenciosamente el routing.

Este artículo es, ante todo, un **tour a fondo por ese repositorio**. Voy a abrir el capó, mirar las entrañas de tres skills concretas, explicar el eval framework de tres niveles que es probablemente la pieza más interesante de todo el proyecto, y luego dedicar la última sección a una comparativa honesta con Superpowers, OpenSpec y Spec-Kit — sin marketing cruzado, leyendo lo que cada uno dice de sí mismo y de los demás.

Si ya leíste mis posts anteriores sobre SDD, agent skills o harness engineering, sabrás que vengo tratando este tema desde hace meses: [`agentes-ia-skills`](/es/blog/agentes-ia-skills/), [`agent-skills-contexto-dinamico`](/es/blog/agent-skills-contexto-dinamico/), [`mattpocock-skills`](/es/blog/mattpocock-skills/), [`sdd-frameworks-spec-kit-openspec-bmad`](/es/blog/sdd-frameworks-spec-kit-openspec-bmad/) y [`superpowers-deep-dive`](/es/blog/superpowers-deep-dive/). Lo que cambia aquí es que Addy Osmani — Engineering Lead en Chrome, autor de *Learning JavaScript Design Patterns* y uno de los nombres que más han marcado cómo se enseña ingeniería web en la última década — ha decidido tomar posición en este mercado con algo que no es "una skill sueltecita" sino un sistema cerrado, opinado y con medidas. Merece un artículo entero, no una mención de tres párrafos.

---

## El repo en cinco minutos

Antes de bajar a los detalles técnicos, una foto global del proyecto. Todo lo que viene aquí lo he sacado directamente del [README principal](https://github.com/addyosmani/agent-skills/blob/main/README.md), del [`docs/comparison.md`](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md) (un documento que merece la pena leer por sí solo — Addy es brutalmente honesto sobre qué hace su proyecto mejor y qué hace peor que la competencia) y de los SKILL.md individuales.

**Qué es.** Una colección curada de 24 skills para coding agents. Cada skill es un fichero Markdown estructurado (SKILL.md) con frontmatter YAML, secciones `Overview`, `When to Use`, `Process`, `Rationalizations`, `Red Flags` y `Verification`. Las skills se entregan como archivos de texto plano y los agentes que las soportan las ejecutan vía slash commands (`/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`, `/webperf`) o por invocación automática cuando el contexto lo requiere.

**Qué problema ataca.** Los coding agents tienen una tendencia por defecto a ir por el camino más corto: saltarse la fase de especificación, escribir el código antes de tener tests, saltarse la revisión, desplegar sin verificar. agent-skills codifica los workflows que un ingeniero senior aplicaría de forma natural — los procesos que aprendes después de quemarte tres veces — y los empaqueta como skills que el agente *debe* seguir.

**El flujo principal.** Define → Plan → Build → Verify → Review → Ship. Cada fase tiene su skill (o varias), y una skill meta (`using-agent-skills`) enruta la petición del usuario a la skill correcta según lo que intenta hacer. Si dices "voy a añadir un endpoint nuevo con auth", el router mira tu petición, ve que estás en fase Build pero necesitas un poco de Define y mucho de Test, y carga las skills relevantes.

```
  DEFINE          PLAN           BUILD          VERIFY         REVIEW          SHIP
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Idea │ ───▶ │ Spec │ ───▶ │ Code │ ───▶ │ Test │ ───▶ │  QA  │      │  Go  │
 │Refine│      │  PRD │      │ Impl │      │Debug │      │ Gate │      │ Live │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
  /spec          /plan          /build        /test         /review       /ship
```

**Las cifras que importan.** 24 skills (23 del ciclo + 1 meta), 4 agent personas para review, 7 reference checklists reutilizables, 8 slash commands principales, instalación con un solo comando en 11 agentes distintos (Claude Code, Cursor, Codex, Gemini CLI, Windsurf, OpenCode, Antigravity, Copilot, Kiro, Command Code, y el `npx skills` CLI agnóstico). El repo es TypeScript y shell con un fuerte componente de documentación.

---

## La anatomía de un SKILL.md

Si vas a instalar agent-skills, lo primero que te encuentras al abrir cualquier carpeta `skills/<nombre>/` es un fichero con esta estructura:

```markdown
---
name: nombre-en-kebab-case
description: Una frase de trigger. Cuándo se debe invocar.
---

# Nombre Humano

## Overview
Qué hace la skill y por qué existe.

## When to Use
Bullet list de situaciones donde aplica. Bullet list de situaciones donde NO aplica.

## Process (o Steps)
El workflow paso a paso. Suele tener pseudo-código, ejemplos concretos y reglas tipo "if X then Y".

## Common Rationalizations
Tabla con dos columnas: Rationalization (excusa que se da el agente para saltarse un paso) | Reality (réplica seca y argumentada). Esto es la pieza más característica.

## Red Flags
Señales de que algo va mal y deberías parar.

## Verification
Qué evidencia necesitas para considerar la skill completada.
```

Lo interesante es que **cada skill tiene la misma forma**. Esto no es un accidente. Es la única manera de que un eval framework pueda inspeccionar las 24 skills con reglas consistentes. Pero también significa que cuando aprendes a leer una, las entiendes todas. Y cuando el agente las carga, gasta el mismo número de tokens de catálogo independientemente de cuál invoque.

### Anti-rationalizations: el arma secreta

Esta es probablemente la contribución más original del proyecto. Si alguna vez has visto a un coding agent "racionalizar" por qué esta vez no hace falta escribir un test, por qué el spec está obsoleto así que da igual seguirlo, o por qué el lint falla pero "es solo estilo", ya sabes de qué hablo. Los LLMs son expertos en encontrar justificaciones plausibles para saltarse procesos.

Mira un ejemplo real de la skill [`test-driven-development`](https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md):

| Rationalization | Reality |
|---|---|
| "El cambio es trivial, no necesita test" | Los bugs más caros de mi carrera han venido de cambios "triviales". El test te cuesta 30 segundos; el bug te cuesta una semana. |
| "Ya lo testearé a mano" | El test manual desaparece en el siguiente cambio. Si no está en el repositorio, no existe. |
| "El test ralentiza el desarrollo" | El test es lo que te permite ir rápido sin romper cosas. Sin test, cada cambio es una apuesta. |
| "Es una refactorización, no cambia comportamiento" | Precisamente por eso el test es *más* importante: estás cambiando la forma sin cambiar la función, y necesitas la red de seguridad para saber que la función sigue intacta. |

Esto no es teoría. Es una tabla que el agente lee literalmente antes de escribir código. Si intenta saltarse el paso, la tabla le recuerda por qué no debe. Y cuando el eval framework audita la skill, comprueba que esta tabla existe y tiene substance (no es un esqueleto de tres filas).

### Red Flags: las señales de stop

La otra pieza distintiva. Mientras las Rationalizations son "antes de actuar, lee esto", los Red Flags son "durante la acción, si ves esto, para y replantéate". Ejemplos sacados de varias skills:

- "Estás modificando el spec sin actualizar el documento: para, actualiza el spec, luego implementa."
- "El test pasa sin que hayas cambiado el código de producción: o el test no prueba nada, o estás testeando el resultado incorrecto. Cualquiera de los dos casos requiere atención."
- "Has escrito tres archivos sin un solo test: estás haciendo implementación, no TDD. Vuelve a RED."
- "El usuario ha dado el 'sí' pero no has pedido confirmación explícita sobre el out-of-scope: la mitad de los desacuerdos son sobre lo que *no* estás construyendo."

Esta combinación de Rationalizations + Red Flags convierte cada skill en un workflow con dientes. No es "te recomiendo que hagas esto", es "sé que vas a querer no hacerlo; aquí tienes por qué deberías".

---

## Las 24 skills: el catálogo completo

Antes de profundizar, una foto del catálogo agrupado por fase. Esto viene del README, así que es la forma oficial en que Addy lo presenta.

### Meta: el router

| Skill | Qué hace | Cuándo |
|---|---|---|
| `using-agent-skills` | Decide qué skill del catálogo aplica a tu petición. Es el punto de entrada implícito de todo lo demás. | Arranque de sesión o cuando la tarea es ambigua y no sabes qué skill cargar. |

### Define: clarificar qué construir

| Skill | Qué hace | Cuándo |
|---|---|---|
| `interview-me` | Una pregunta a la vez, con tu mejor hipótesis adjunta, hasta ~95% de confianza sobre qué quiere el usuario. | Petición infra-especificada ("hazme un dashboard"), o el usuario invoca "interview me" / "grill me". |
| `idea-refine` | Pensamiento divergente/convergente para convertir ideas vagas en propuestas concretas. | Tienes un concepto vago que necesita exploración. |
| `spec-driven-development` | Escribe un PRD cubriendo objetivos, comandos, estructura, estilo de código, testing y límites *antes* de cualquier código. | Empezando un proyecto, feature o cambio significativo. |

### Plan: descomponer

| Skill | Qué hace | Cuándo |
|---|---|---|
| `planning-and-task-breakdown` | Descompone specs en tareas pequeñas, verificables, con dependencias ordenadas y criterios de aceptación. | Tienes un spec y necesitas unidades implementables. |

### Build: escribir el código

| Skill | Qué hace | Cuándo |
|---|---|---|
| `incremental-implementation` | Vertical slices: implementar, testear, verificar, commitear. Feature flags, defaults seguros, rollback-friendly. | Cualquier cambio que toca más de un archivo. |
| `test-driven-development` | Red-Green-Refactor, pirámide de tests (80/15/5), Beyonce Rule, testing en navegador. | Implementar lógica, fix de bugs, cambiar comportamiento. |
| `context-engineering` | Alimentar al agente con la información correcta en el momento correcto. Rules files, context packing, MCPs. | Arranque de sesión, cambio de tarea, caída de calidad en el output. |
| `source-driven-development` | Cada decisión de framework grounded en documentación oficial. Verifica, cita fuentes, marca lo no verificado. | Quieres código source-cited para cualquier framework o librería. |
| `doubt-driven-development` | Revisión adversarial de cada decisión no trivial en vuelo. CLAIM → EXTRACT → DOUBT → RECONCILE → STOP, con escalado cross-model opcional. | Stakes altos (producción, seguridad, irreversible), código no familiar. |
| `frontend-ui-engineering` | Arquitectura de componentes, design systems, gestión de estado, responsive, WCAG 2.1 AA. | Construyendo o modificando UI. |
| `api-and-interface-design` | Contract-first, Hyrum's Law, One-Version Rule, semántica de errores, validación de boundary. | Diseñando APIs o boundaries de módulos. |

### Verify: probar que funciona

| Skill | Qué hace | Cuándo |
|---|---|---|
| `browser-testing-with-devtools` | Chrome DevTools MCP para DOM, consola, network, performance en runtime. | Construyendo o debugueando algo que corre en navegador. |
| `debugging-and-error-recovery` | Triage de 5 pasos: reproducir, localizar, reducir, fix, guard. Stop-the-line rule, fallbacks seguros. | Tests fallan, build rompe, comportamiento inesperado. |

### Review: quality gates antes de merge

| Skill | Qué hace | Cuándo |
|---|---|---|
| `code-review-and-quality` | Review de 5 ejes (correctness, readability, architecture, security, performance). Sizing de cambios (~100 líneas), severity labels (Nit/Optional/FYI), normas de velocidad. | Antes de mergear cualquier cambio. |
| `code-simplification` | Chesterton's Fence, Rule of 500, reducir complejidad preservando comportamiento exacto. | El código funciona pero es más difícil de leer de lo que debería. |
| `security-and-hardening` | OWASP Top 10, patrones de auth, gestión de secretos, auditoría de deps, sistema de boundaries de tres niveles. | Manejando input de usuario, auth, almacenamiento de datos, integraciones externas. |
| `performance-optimization` | Measure-first, objetivos Core Web Vitals, profiling workflows, análisis de bundle, detección de anti-patrones. | Requisitos de performance existen o sospechas regresiones. |

### Ship: desplegar con confianza

| Skill | Qué hace | Cuándo |
|---|---|---|
| `git-workflow-and-versioning` | Trunk-based, commits atómicos, sizing (~100 líneas), commit-as-save-point. | Cualquier cambio de código (siempre). |
| `ci-cd-and-automation` | Shift Left, Faster is Safer, feature flags, quality gate pipelines, feedback loops de fallo. | Configurando o modificando pipelines de build y deploy. |
| `deprecation-and-migration` | Code-as-liability mindset, deprecation obligatoria vs advisory, patrones de migración, eliminación de código zombie. | Eliminando sistemas viejos, migrando usuarios, haciendo sunset de features. |
| `documentation-and-adrs` | Architecture Decision Records, docs de API, estándares de documentación inline. Documenta el *por qué*. | Decisiones arquitectónicas, cambios de API, ships de features. |
| `observability-and-instrumentation` | Logging estructurado, métricas RED, tracing OpenTelemetry, alerting basado en síntomas, instrumentar mientras construyes. | Añadiendo telemetría o shipping de algo que corre en producción. |
| `shipping-and-launch` | Pre-launch checklists, lifecycle de feature flags, staged rollouts, procedimientos de rollback, monitoring setup. | Preparando deploy a producción. |

Mira el catálogo. No es una colección aleatoria. Hay tres cosas que me llaman la atención:

1. **Cubre todo el ciclo hasta producción.** Superpowers se queda en el inner loop (TDD, debugging, planning, review). Spec-Kit y OpenSpec se quedan en el spec loop. agent-skills te lleva hasta el rollback.
2. **Las skills de Review son explícitamente separadas del Build.** No es lo mismo escribir código que revisarlo, y el catálogo lo trata como fases distintas con skills distintas.
3. **Hay una skill explícita para "duda"** (`doubt-driven-development`). No la había visto en ningún otro framework. La idea es que después de tomar una decisión importante (no antes), te pongas en modo adversarial y la cuestiones. Esto es un anti-patrón contra la confianza prematura del LLM.

---

## Tres skills en detalle (lo que el repo realmente enseña)

Vale, el catálogo es impresionante. Pero lo que me importa más es qué se siente *usando* una skill. He leído cuatro SKILL.md completos para preparar este post: `interview-me`, `test-driven-development`, `spec-driven-development` y el `code-reviewer.md` (que es una agent persona, no una skill, pero usa el mismo formato). Voy a destacar las tres que más me han enseñado sobre la filosofía del proyecto.

### 1. `interview-me` — la skill que más me ha cambiado cómo trabajo

El nombre ya dice mucho. No es "ask the user a bunch of questions" ni "spec driven Q&A". Es una skill explícita sobre **una pregunta a la vez, con tu mejor hipótesis adjunta**.

El proceso, verbatim del repo:

> **Step 1: Hypothesize, with a confidence number.** Before asking anything, write down your current best read of what the user wants in *one sentence*, plus an honest confidence number (0–100%). The number forces honesty. If you wrote down a high number but can't actually predict the user's reactions to the next three questions you'd ask, the number is wrong.

> **Step 2: Ask one question at a time, each with a guess attached.** Format: `Q: <one focused question> / GUESS: <your hypothesis for the answer, with the reasoning that produced it>`. Wait for the user to react before asking the next question.

> **Step 3: Listen for "want vs. should want".** The most dangerous answers are the ones where the user says what a thoughtful answer *sounds like* rather than what they actually want. Watch for: pattern-matching best-practice talk ("I want it to be scalable", "clean architecture") without specifics; phrases like "I should probably…", "I think I'm supposed to…"; buzzwords as goals.

> **Step 4: Restate intent in the user's own words.** Six líneas: Outcome, User, Why now, Success, Constraint, **Out of scope** (esta última non-negotiable, dice el repo: "Half of misalignment is silent disagreement about what is *not* being built").

> **Step 5: Confirm — explicit yes, not "whatever you think".** Lista de frases que NO cuentan como yes: "Whatever you think is best" (es delegación), "Sounds good" (es ambiguo), "Sure, let's go" (a menudo es salida cortés), silencio seguido de "okay let's start" (es rendición, no convergencia).

El **95% Confidence Stop** es la pieza clave: estás done cuando puedes predecir la reacción del usuario a las siguientes tres preguntas que harías. Si no, no estás done.

Esto es, literalmente, lo que he estado haciendo a mano en mis posts más reflexivos sin saber que tenía nombre. La diferencia es que ahora el agente que trabaja conmigo lo hace de forma sistemática, con un número de confianza que le obliga a ser honesto, y con un set de "want vs. should want" explícito para detectar respuestas performativas.

Si tu colección de skills no tiene algo equivalente, te estás perdiendo el 50% del valor.

### 2. `test-driven-development` — la pirámide de tests con dientes

Esta skill es la que más se parece a lo que ya enseñaba la industria hace diez años, pero con dos twists importantes.

El primero es la **Discover the Stack First** section: antes de escribir el primer test, el agente tiene que descubrir *cómo testea este repo en concreto*. El comando no es "npm test" por defecto; es "lo que diga el package.json del repo, o el build.gradle, o el Cargo.toml". Esto parece obvio pero elimina una clase entera de errores: agentes que asumen una tooling que el proyecto no usa.

El segundo es la **Pirámide de tests con Beyonce Rule**: 80% unit, 15% integration, 5% E2E. Si te gustó algo, deberías haberle puesto un test encima. Los cambios de infra, los refactors y las migraciones no son responsables de cazar tus bugs — tus tests lo son. Si un cambio rompe tu código y no tenías test, es culpa tuya.

La tabla de **Test Sizes** también es útil: Small (un proceso, no I/O, no red, no DB, milisegundos), Medium (multi-proceso OK, solo localhost, segundos), Large (multi-máquina, servicios externos permitidos, minutos). El 80% de tu suite debería ser Small. Esto es práctico: si tu CI tarda 30 minutos porque tu pirámide está invertida, este skill te lo dice.

El **Prove-It Pattern** para bugs es la guinda: cuando llega un bug report, no intentes arreglarlo. Escribe primero el test que lo reproduce. Cuando el test falla (confirmando el bug), implementa el fix. Cuando el test pasa (confirmando el fix), corre la suite completa (verificando que no hay regresiones). Tres pasos. Disciplina.

### 3. `spec-driven-development` — el spec como contrato vivo

Esta skill es la que más se parece a lo que hacen OpenSpec y Spec-Kit, y es útil leerla junto con las de ellos para ver las diferencias (lo haré en la sección de comparativa). El flujo es **SPECIFY → PLAN → TASKS → IMPLEMENT** con un human review en cada fase.

Lo más interesante es la sección **Surface assumptions immediately**. Antes de escribir cualquier contenido del spec, el agente lista lo que está asumiendo:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
4. We're targeting modern browsers only (no IE11)
→ Correct me now or I'll proceed with these.
```

Esto es brillante. La mayoría de "specs" en otros frameworks asumen que el agente sabe el contexto. Aquí se obliga a hacerlo explícito y a pedir corrección antes de seguir. La mitad de los desacuerdos en specs vienen de assumptions no dichas; esto los mata de raíz.

El **Spec template** tiene seis áreas obligatorias: Objective, Commands, Project Structure, Code Style (con snippet real, no párrafo descriptivo), Testing Strategy, Boundaries (three-tier: Always/Ask first/Never). Y el spec es *vivo*: se actualiza cuando cambian decisiones, cuando cambia scope, se commitea junto al código, y se referencia en los PRs.

La sección final **Reframe instructions as success criteria** es la que más se debería copiar en todas partes:

> REQUIREMENT: "Make the dashboard faster"
> REFRAMED SUCCESS CRITERIA:
> - Dashboard LCP < 2.5s on 4G connection
> - Initial data load completes in < 500ms
> - No layout shift during load (CLS < 0.1)
> → Are these the right targets?

"Más rápido" no es una especificación. "LCP < 2.5s en 4G" sí lo es.

---

![Anatomía de un SKILL.md: 6 secciones consistentes, una tabla de racionalizaciones reales de TDD como ejemplo](/images/agent-skills-anatomy-skill-es.svg)

*Figura 1 — Las 6 secciones obligatorias de cada SKILL.md (izquierda) y una muestra real de la tabla de racionalizaciones de la skill `test-driven-development` (derecha). Las secciones en naranja son las que diferencian este catálogo de cualquier colección de prompts.*

## El eval framework de tres niveles: lo que de verdad diferencia este repo

Aquí es donde Addy deja de competir y empieza a ganar terreno. De los tres frameworks que estoy comparando (Superpowers, OpenSpec, Spec-Kit), **ninguno tiene un eval framework en el repo que se ejecute contra su propio catálogo**. agent-skills sí. Y está bien pensado.

El framework tiene tres tiers:

![Eval framework de tres niveles: structural, routing y behavioral](/images/agent-skills-eval-tiers-es.svg)

*Figura 2 — Cómo el repo mide la calidad de sus propias skills. Tier 1 y Tier 2 son deterministas y corren en CI; Tier 3 ejecuta un agente real contra escenarios por skill.*

### Tier 1: structural

Auditoría estática de los SKILL.md. Comprueba que cada uno tiene frontmatter válido, secciones obligatorias (`Overview`, `When to Use`, `Process`, `Rationalizations`, `Red Flags`, `Verification`), que las Rationalizations tienen substance (no son tres filas de cortesía) y que las descripciones son concretas. Si una skill no tiene Rationalizations o tiene menos de tres filas, falla el tier 1.

### Tier 2: routing

Comprueba que las descripciones de las skills llevan el vocabulario que los usuarios realmente usan y que no hay dos skills que se pisen el routing. Esto es **determinista y corre en CI**. Cuando un agente tiene que decidir qué skill cargar, lee las descripciones; si dos skills tienen descripciones parecidas o usan vocabulario ambiguo, el router falla. Esto evita el bug clásico de "le pedí X y cargó Y porque las descripciones se solapaban".

### Tier 3: behavioral

El más interesante y el más caro. Ejecuta un agente real contra un set de escenarios por skill y compara el output contra expectativas específicas por skill. ¿Cuándo falla? Cuando un modelo actualizado "racionaliza" saltarse un paso. Esto es lo que Superpowers llama "pressure testing" pero llevado al nivel de catálogo: no es una presión ad-hoc, es un test automatizado y reproducible.

Lo que esto significa en la práctica es que **el repo tiene tres tipos de calidad midiéndose continuamente**:

- ¿La skill está bien escrita? → Tier 1.
- ¿El agente carga la skill correcta? → Tier 2.
- ¿El agente hace lo que la skill dice cuando la tiene cargada? → Tier 3.

Si cualquiera de los tres falla, CI rompe. Y el repo trata los fallos de eval como bugs que hay que arreglar antes de mergear el PR.

Cuando lees la sección del `docs/comparison.md` donde Addy habla de los otros frameworks, dice esto explícitamente:

> What is newer, and the current point of difference: a **three-tier eval framework** lives in the repo. Tier 1 checks structure, Tier 2 checks that each skill's description carries the vocabulary users actually say and that no two skills collide on routing (deterministic, runs in CI), and Tier 3 grades an agent's real execution trace against per-skill expectations. Neither of the other two ships that kind of in-repo, catalog-wide measurement today.

Es honesto. No es "tenemos evals, somos los mejores". Es "este es el diferencial técnico concreto, y los otros no lo tienen". Eso me da más confianza que el marketing habitual.

---

## Instalación: qué agente usar y por qué

Lo bueno de agent-skills es que está pensado para correr en muchos agentes sin que tengas que aprender una tooling nueva. La instalación rápida es:

```bash
npx skills add addyosmani/agent-skills            # install all 24 skills
npx skills add addyosmani/agent-skills --list     # browse before installing
```

O individualmente:

```bash
npx skills add addyosmani/agent-skills --skill code-review-and-quality
npx skills add addyosmani/agent-skills --skill interview-me
npx skills add addyosmani/agent-skills --skill test-driven-development
```

El CLI `npx skills` viene de [vercel-labs/skills](https://github.com/vercel-labs/skills) y funciona con 70+ agentes. Si tienes Claude Code, Cursor, Codex, Copilot, Cline y otros, probablemente ya tienes el CLI disponible.

Si prefieres instalación nativa, las opciones son:

- **Claude Code (recomendado)**: marketplace oficial con `/plugin marketplace add addyosmani/agent-skills`.
- **Cursor**: workflow skills bajo `.cursor/skills/`, policies cortas en `.cursor/rules/*.mdc`. NO pegar skills completas en rules (esto está documentado en `docs/cursor-setup.md`).
- **Antigravity**: `agy plugin install https://github.com/addyosmani/agent-skills.git`.
- **Gemini CLI**: `gemini skills install https://github.com/addyosmani/agent-skills.git --path skills`.
- **Windsurf, OpenCode, Copilot, Kiro, Codex, Command Code**: cada uno con su setup documentado en `docs/<agente>-setup.md`.

Hay un caveat importante del propio repo: **instalar una skill suelta copia solo `skills/<nombre>/`, no los `references/` compartidos**. La skill sigue funcionando, pero las paths a checklists compartidas quedan rotas. Esto está tracked en [#361](https://github.com/addyosmani/agent-skills/issues/361). Para evitarlo, instala el repo entero, clónalo en local, o copia los checklists necesarios a `references/` dentro de la skill instalada.

Si tuviera que recomendar un agente para empezar con agent-skills, sería Claude Code. El marketplace oficial está mantenido por el propio Addy y la integración está más pulida que en el resto. Para multi-agente (tienes Cursor en el trabajo y Claude Code en casa), el `npx skills` CLI te abstrae de las diferencias.

---

## Agent personas: las 4 que usan para review

Además de las 24 skills, agent-skills trae 4 **agent personas** pre-configuradas para review. Las personas viven en `agents/<nombre>.md` y se invocan desde el slash command `/review` (single-perspective) o `/ship` (parallel fan-out).

| Persona | Rol | Perspectiva |
|---|---|---|
| `code-reviewer` | Senior Staff Engineer | Review de 5 ejes (correctness, readability, architecture, security, performance). Salida estructurada con Critical/Important/Suggestion. |
| `test-engineer` | QA Specialist | Estrategia de tests, análisis de cobertura, "Prove-It pattern". |
| `security-auditor` | Security Engineer | Detección de vulnerabilidades, threat modeling, OWASP assessment. |
| `web-performance-auditor` | Web Performance Engineer | Core Web Vitals audit con Quick/Deep modes, metric-honesty rule. |

La pieza interesante es que `/ship` lanza las cuatro en paralelo y luego fusiona los resultados en un go/no-go. Es la implementación más limpia del "fan-out review" que he visto en un framework de skills. Cada persona tiene una rúbrica explícita: no es "revisa esto", es "revisa esto y devuelve un veredicto en este formato".

He leído el `code-reviewer.md` entero. Su output template es un ejemplo de claridad:

```markdown
## Review Summary

**Verdict:** APPROVE | REQUEST CHANGES

**Overview:** [1-2 sentences summarizing the change]

### Critical Issues
- [File:line] [Description and recommended fix]

### Important Issues
- [File:line] [Description and recommended fix]

### Suggestions
- [File:line] [Description]

### What's Done Well
- [Positive observation — always include at least one]

### Verification Story
- Tests reviewed: [yes/no, observations]
- Build verified: [yes/no]
- Security checked: [yes/no, observations]
```

Si tu agente actual no produce reviews con este nivel de estructura, este skill vale la pena por sí sola. El **Acknowledge what's done well** es la pieza que más me gusta: las reviews sin feedback positivo son brutales incluso cuando son correctas.

---

## Reference checklists: lo que se reutiliza

Hay 7 reference checklists compartidas en `references/`:

| Reference | Cubre |
|---|---|
| `definition-of-done.md` | Standing bar que cualquier cambio debe superar, contrastado con acceptance criteria per-task. |
| `testing-patterns.md` | Estructura de tests, naming, mocking, ejemplos React/API/E2E, anti-patrones (JavaScript/TypeScript). |
| `security-checklist.md` | Pre-commit checks, auth, validación de input, headers, CORS, OWASP Top 10. |
| `performance-checklist.md` | Targets Core Web Vitals, frontend/backend checklists, comandos de medición. |
| `accessibility-checklist.md` | Keyboard nav, screen readers, visual design, ARIA, testing tools. |
| `observability-checklist.md` | Preguntas on-call, structured logging, RED/USE metrics, tracing, alerting por síntomas, pre-launch gate. |
| `orchestration-patterns.md` | Patrones multi-persona endorsed, anti-patrones, regla "personas no invocan personas". |

Esto es importante: las checklists son **documentos vivos**, no PDFs decorativos. Cuando una skill carga una checklist, la trata como fuente de verdad. Si encuentras un hueco en una checklist, abres un PR contra el repo y el cambio se propaga a todas las skills que la usan.

El patrón "personas no invocan personas" merece mención: si una persona detecta que necesita consultar a otra, lo dice en su output como recomendación. La orquestación pertenece a los slash commands (`/review`, `/ship`), no a las personas. Esto evita el bug clásico de los frameworks multi-agente donde las personas empiezan a llamarse entre sí en cascada y terminas con feedback loops infinitos.

---

## La comparativa honesta: Superpowers, OpenSpec, Spec-Kit

Vale, ahora la sección que pediste. Voy a ser tan honesto como Addy es en su propio `docs/comparison.md`. Los datos de cada repo son los oficiales del README de cada uno; las observaciones sobre diferencias son mías (y discutibles).

### Tabla resumen

| | **agent-skills (Addy)** | **Superpowers (obra)** | **Spec-Kit (GitHub)** | **OpenSpec (Fission-AI)** |
|---|---|---|---|---|
| **Core idea** | Codificar el ciclo senior-engineering completo como skills | Metodología completa de desarrollo basada en skills componibles | Toolkit oficial de GitHub para SDD con cualquier agente | SDD ligero, iterativo, marrón-friendly |
| **Principio organizador** | Fases del SDLC (Define→Ship) detrás de un meta-skill router | Un loop disciplinado: brainstorm, plan, execute, review | Phase gates rígidos (constitution → specify → plan → tasks → implement) | Cambios + specs como artefactos vivos, sin gates rígidos |
| **Tamaño del catálogo** | 24 skills, todo el ciclo | ~14 skills, hondo en el inner loop | 7 comandos principales + extensiones/presets/bundles | Comandos `/opsx:*` + CLI `openspec` |
| **Cobertura del ciclo** | Amplia: idea refinement, API/UI design, security, performance, CI/CD, observability, deprecation, ADRs, launch | Hondo pero estrecho: TDD, debugging, planning, review, skill authoring | Estrecho y centrado en SDD: del spec al implement | Estrecho y centrado en SDD: del explore al archive |
| **Puntos de entrada** | Slash commands 1:1 a fases (`/spec` `/plan` `/build` `/test` `/review` `/code-simplify` `/ship`, más `/webperf`), con `/build auto` modo full-plan | Pipeline encadenado (`brainstorming`, `writing-plans`, `subagent-driven-development`) | Slash commands (`/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) | Slash commands (`/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`) + CLI |
| **Mecanismos distintivos** | Anti-rationalization tables y Red Flags en cada skill; **personas** de review en paralelo en `/ship`; reference checklists; **eval framework de tres tiers** en CI | Subagent-driven development con task reviewer (spec + quality) y fix loop; git worktree isolation; skills-que-escriben-skills, pressure-tested | Constitution-based governance; extensions/presets/bundles stackables; Specify CLI en Python; 30+ integraciones oficiales | Stores beta para planning cross-repo; artefactos vivos editables en cualquier momento; 30+ herramientas soportadas; diseñado para brownfield |
| **Medición de calidad** | **Trigger, routing y behavioral evals** contra el catálogo (in-repo, algunos en CI) | Pressure-testing methodology es core; eval suite vive en repo separado | Sin evals in-repo del catálogo | Sin evals in-repo del catálogo |
| **Tooling reach** | Claude Code, Cursor, Gemini CLI, Antigravity, OpenCode, Windsurf, Copilot, Kiro, Codex, Command Code, `npx skills` CLI | Una de las superficies más amplias y más activas: Claude Code, Codex, Cursor, Copilot CLI, OpenCode, Kimi, Factory Droid, Antigravity, Pi | 30+ AI coding agents (oficial), con extensions/presets/bundles | 30+ AI assistants vía slash commands |
| **Gobernanza** | Revisa y mergea contribuciones de la comunidad activamente; cada skill trae eval | Mayormente solo autoría; backlog de PRs comunitarios sin mergear | Oficial de GitHub, mantenimiento centralizado | Mantenido por Fission-AI + comunidad activa |
| **Mejor para** | Llevar una feature por todas las fases con un checkpoint humano en cada una | Trabajo autónomo, reasoning-heavy o exploratorio de larga duración | Equipos grandes que necesitan governance + compliance + traceability | Proyectos existentes (brownfield) donde necesitas iterar specs sin gates rígidos |

### Cómo se diferencian realmente

Lo que la tabla no captura bien es la *filosofía*. Estos cuatro proyectos están optimizando para cosas distintas, y eso es lo que importa cuando eliges uno.

**agent-skills (Addy)** te lleva de la idea al deploy con un checkpoint humano en cada fase. Su obsesión es que **ningún paso se salte silenciosamente**. El eval framework existe para eso: para que un cambio de modelo o de skill no degrade el proceso sin que alguien se entere. Si tu prioridad es "quiero que mis agentes sigan el playbook aunque cambien de modelo", agent-skills es el más disciplinado de los cuatro. Su trade-off: cubre tanto que a veces siente que estás haciendo ceremony para una cosa trivial. Una fix de typo no debería pasar por 6 skills.

**Superpowers (obra/Jesse Vincent)** apuesta por **autonomía y razonamiento upfront**. Saca una spec por Socratic brainstorming, hace un plan ejecutable por "un ingeniero junior entusiasta con mal gusto", y luego lanza subagentes que ejecutan task-by-task con un task reviewer que verifica compliance + quality y tiene un fix loop. Es el framework para "dame un chunk grande, vete a dormir, y vuelve con un PR revisado". Trade-off: el single pipeline es pesado en cambios pequeños. La comunidad pide multi-agent team execution y no está en la caja todavía.

**Spec-Kit (GitHub)** es el intento oficial de GitHub por estandarizar SDD. Tiene 7 comandos principales (constitution, specify, plan, tasks, taskstoissues, implement, converge), un sistema de extensions/presets/bundles stackable, y soporte oficial para 30+ agentes. Su obsesión es **governance**: la constitution del proyecto define los principios que guían todo lo demás. Si trabajas en una empresa grande con compliance y quieres trazabilidad, Spec-Kit es la apuesta más segura. Trade-off: es Python (la CLI), requiere `uv`, y los phase gates son rígidos. Iterar sobre specs existentes es más fricción que con OpenSpec.

**OpenSpec (Fission-AI)** es el más ágil de los cuatro. Su filosofía explícita es *fluid not rigid, iterative not waterfall, easy not complex, built for brownfield*. El flujo es `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`, donde cada "change" es una carpeta con proposal.md, specs/, design.md, tasks.md. Puedes editar cualquier artefacto en cualquier momento sin phase gates. Es el más amigable para brownfield y para equipos que odian la ceremony. Trade-off: menos governance que Spec-Kit, menos cobertura del ciclo que agent-skills, menos autonomía que Superpowers.

### El head-to-head de Om Mishra

Hay un experimento controlado que vale la pena mencionar: Om Mishra ([Superpowers vs Agent-Skills: Faster Shipping, Safer Reasoning](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)) corrió la misma tarea, mismo modelo, mismo repo, en Claude Code, cambiando solo el framework de skills. Resultados:

- **agent-skills** movió a código más rápido (~8 min vs ~12) y corrió más pases de validación (7 vs 5, incluyendo la suite completa). Esa validación más amplia cazó un compatibility issue fuera del feature que los tests específicos del feature no vieron. Le dio la edge en **profundidad de validación**.
- **Superpowers** invirtió más razonamiento arquitectónico upfront, que Om sigue prefiriendo como su daily driver para evolving production systems y trabajo exploratorio sin patrón establecido.
- **Eficiencia de tokens: idéntica.** Ambos replanificaron una vez.

Es un experimento de un developer en una tarea, no un benchmark. Pero ilustra perfectamente el trade-off central: **validación disciplinada amplia vs razonamiento upfront pesado**. La conclusión honesta de Om es la conclusión honesta en general: pick the tool to the task.

### Cómo elegiría yo (en 2026)

Si me obligaran a poner uno solo en cada situación:

- **Llevar una feature de principio a fin con un review serio al final** → agent-skills. Único que cubre security, performance, observability y launch dentro del mismo sistema.
- **Refactorizar un subsistema complejo mientras duermo** → Superpowers. La pipeline + subagent review están hechas para eso.
- **Estandarizar cómo un equipo de 5+ ingenieros usa agentes en un repo compartido** → agent-skills (por las phase commands, personas compartidas y evals en CI) o Spec-Kit (por la governance + traceability institucional).
- **Trabajar en un codebase legacy donde quiero iterar specs sin reescribir todo** → OpenSpec.
- **Requirements interrogation puro** → Matt Pocock's `grill-me` (que ya cubrí en [`grill-me-claude-skill-deep-dive`](/es/blog/grill-me-claude-skill-deep-dive/)). No está en esta comparativa porque no es un framework completo, pero la skill de grilling sigue siendo la mejor de su clase.

Y lo más importante: **no tienes que elegir uno solo**. El README de agent-skills dice esto explícitamente y es la mejor pieza de advice del repo:

> You do not have to choose exclusively, but combine with care. These are Markdown skills, not runtimes, so cherry-picking *individual* skills works well: pull in Pocock's `grill-me`, a Superpowers isolation pattern, or a specific checklist alongside your main setup.
>
> What does not work is running two of them as your **active router at the same time**. Stacked meta-skills fight over command names (`/tdd` defined in two places), compete on routing logic, and pull in different TDD philosophies, so you get unpredictable behavior rather than the best of both. Pick one framework as your primary router, and borrow from the others a la carte.

Eso. Cherry-pick skills, no frameworks.

---

## La frontera compartida (donde ninguno ha llegado)

El propio Addy lo admite en `docs/comparison.md`, y es la pieza más honesta de todo el ecosistema:

> None of these has solved **durable cross-session memory** well yet: what an agent learned in one session rarely carries cleanly into the next. All three are circling it (learnings files, handoff artifacts, tracker-backed planning maps). If that is your bottleneck, know that you are at the edge of what any of them ships today, and expect to stitch some of it yourself for now.

Si tu dolor principal es "mi agente olvida lo que aprendió entre sesiones", ninguno de los cuatro lo resuelve out-of-the-box. Tendrás que montártelo. He tratado esto en otros posts ([`stack-memoria-persistente-implementacion`](/es/blog/stack-memoria-persistente-implementacion/), [`servidores-mcp-memoria-cross-agent`](/es/blog/servidores-mcp-memoria-cross-agent/)) pero la solución final sigue siendo tuya.

---

## Crítica honesta y trade-offs que Addy no menciona

El `docs/comparison.md` es brutalmente honesto sobre los otros, pero hay cosas sobre su propio proyecto que un lector crítico debería notar:

1. **El catálogo es grande y la sobrecarga es real.** 24 skills es más de lo que la mayoría de equipos va a usar conscientemente. Si instalas todo, el agente va a gastar tokens de catálogo en cada carga, lo que se nota en sesiones largas. La instalación per-skill existe pero requiere disciplina.

2. **El eval framework es poderoso pero opaco.** El Tier 1 y Tier 2 son deterministas y corren en CI, pero el Tier 3 (behavioral) es un test contra un agente real. ¿Qué agente? ¿Qué versión? ¿Qué escenarios? El repo no lo deja 100% claro desde fuera. Esto es importante si quieres reproducir los evals localmente.

3. **El meta-router (`using-agent-skills`) es la pieza menos madura.** Es la skill más crítica del sistema y la que menos he visto evaluada en detalle. Si el router falla, todo falla. Esto es un riesgo conocido en cualquier sistema basado en routing.

4. **La cobertura hasta Ship es ambiciosa pero no validada en producción por muchos equipos aún.** El repo es relativamente nuevo (created 2025-08 si miramos la historia de contributions; el `docs/comparison.md` es de mediados de 2026). El ciclo completo hasta launch no tiene el mismo track record que el inner loop de Superpowers.

5. **Las skills son opinionadas, lo que es bueno y malo.** Si tu equipo tiene un workflow distinto (por ejemplo, no haces TDD estricto), vas a tener que customizar. Las extensions/presets de Spec-Kit son más explícitos sobre esto.

Nada de esto es deal-breaker. Pero son cosas que un comprador informado debería tener en la cabeza.

---

## Por qué este repo me importa más que otros

Después de meses siguiendo este espacio, mi lectura es que **agent-skills de Addy es el más probable de los cuatro en convertirse en estándar de facto para equipos medianos y grandes**, por tres razones.

La primera es la **cobertura**. Es el único que llega hasta Ship con un checkpoint explícito. Eso importa porque la mayoría de los bugs caros no vienen del inner loop (TDD, debugging) sino del outer loop (deploy, rollback, monitoring). Spec-Kit se queda en implement. OpenSpec se queda en archive. Superpowers se queda en review.

La segunda es la **disciplina medible**. El eval framework convierte "somos disciplinados" en una afirmación falsificable. Cuando un equipo dice "usamos agent-skills", puede demostrar que las skills se cargan correctamente, que el routing no colisiona, y que la ejecución cumple las expectativas. Los otros tres frameworks viven en un mundo de "confía en nosotros".

La tercera es la **legitimidad institucional**. Addy Osmani no es un random en Twitter. Es Engineering Lead en Chrome, autor de libros que se enseñan en universidades, y alguien con suficiente peso específico para que "agent-skills" sea un término que un manager de ingeniería pueda pronunciar en una reunión sin que le pregunten "¿y eso qué es?". Spec-Kit tiene la legitimidad de GitHub, pero la legitimidad de una sola empresa también es una jaula. La de Addy es más portable.

Si tuviera que apostar por el que va a dominar el SDD-as-skills en 2027, apostaría por agent-skills.

---

## Lecciones que me llevo (y que me llevo a mis proyectos)

Tres cosas concretas que voy a aplicar en mi propio setup después de este tour:

1. **El patrón "rationalization table + red flags" es universal.** Cualquier skill que escriba a partir de ahora va a tener estas dos secciones. Es la diferencia entre un workflow que se respeta y uno que se "racionaliza" away.

2. **El 95% Confidence Stop de `interview-me` es mi nuevo gate.** Si no puedo predecir la reacción del usuario a las siguientes tres preguntas, no he terminado de entender. Lo voy a aplicar explícitamente en mis sesiones de planning.

3. **El eval framework es el techo del proyecto.** Si Addy no tuviera Tier 1/2/3, agent-skills sería una colección más. Con el eval framework, es un sistema que se puede mejorar y mantener. Voy a robar el patrón para mis propios setups: cualquier "framework" que monte a partir de ahora necesita tener un test automatizado de que hace lo que dice.

Y una pieza final, que es la que más cuesta admitir: **mi colección propia de skills (`vault/tareas/`, los workflows de Hermes, las skills de specai) tendría que parecerse más a agent-skills de lo que se parece ahora**. Tengo el hábito de escribir skills como prompts narrativos. El formato SKILL.md con Rationalizations + Red Flags + Verification es estrictamente superior para cualquier workflow que quieras que un agente siga de verdad. Es una de esas cosas que ves clara cuando lees el repo de Addy y te das cuenta de que has estado haciéndolo menos bien de lo que pensabas.

---

## Bibliografía y referencias

Fuentes primarias (todos verificados durante la investigación):

- [addyosmani/agent-skills — README principal](https://github.com/addyosmani/agent-skills/blob/main/README.md)
- [addyosmani/agent-skills — docs/comparison.md](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md) — la pieza más honesta del repo
- [skills/interview-me/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/interview-me/SKILL.md)
- [skills/test-driven-development/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md)
- [skills/spec-driven-development/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/spec-driven-development/SKILL.md)
- [agents/code-reviewer.md](https://github.com/addyosmani/agent-skills/blob/main/agents/code-reviewer.md)

Comparativa:

- [obra/superpowers — README](https://github.com/obra/superpowers/blob/main/README.md) (268k★)
- [obra/superpowers — skills/brainstorming/SKILL.md](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md)
- [github/spec-kit — README](https://github.com/github/spec-kit/blob/main/README.md)
- [Fission-AI/OpenSpec — README](https://github.com/Fission-AI/OpenSpec/blob/main/README.md) (64k★)
- [Fission-AI/OpenSpec — docs/](https://github.com/Fission-AI/OpenSpec/tree/main/docs) (incluye Stores beta para planning cross-repo)
- Om Mishra, [Superpowers vs Agent-Skills: Faster Shipping, Safer Reasoning](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)

Posts previos del blog que cruzan con este tema:

- [`agentes-ia-skills`](/es/blog/agentes-ia-skills/) — el meta-artículo sobre qué son las agent skills
- [`agent-skills-contexto-dinamico`](/es/blog/agent-skills-contexto-dinamico/) — cómo las skills manejan contexto
- [`mattpocock-skills`](/es/blog/mattpocock-skills/) — la tercera pata del ecosistema de skills (Pocock)
- [`sdd-frameworks-spec-kit-openspec-bmad`](/es/blog/sdd-frameworks-spec-kit-openspec-bmad/) — comparativa previa entre Spec-Kit y OpenSpec
- [`superpowers-deep-dive`](/es/blog/superpowers-deep-dive/) — deep dive previo en Superpowers
- [`grill-me-claude-skill-deep-dive`](/es/blog/grill-me-claude-skill-deep-dive/) — la skill de grilling de Pocock
- [`specs-driven-development`](/es/blog/specs-driven-development/) — SDD desde la perspectiva práctica indie
- [`socratic-agents-part-2-sdd-sycophancy`](/es/blog/socratic-agents-part-2-sdd-sycophancy/) — el problema de la sycophancy en SDD
- [`harness-engineering-wrapper-gana`](/es/blog/harness-engineering-wrapper-gana/) — el wrapper que importa más que el modelo
- [`stack-memoria-persistente-implementacion`](/es/blog/stack-memoria-persistente-implementacion/) — la frontera compartida que ninguno resuelve todavía

Lecturas complementarias sobre los principios que agent-skills codifica:

- *Software Engineering at Google* — el libro base de donde vienen muchas de las prácticas (Hyrum's Law, Beyonce Rule, code review norms)
- [Google's Engineering Practices guide](https://google.github.io/eng-practices/) — la versión pública de las prácticas de review
- [vercel-labs/skills](https://github.com/vercel-labs/skills) — el CLI agnóstico que usa agent-skills para instalar en 70+ agentes

---

## Cierre

agent-skills de Addy Osmani es, en este momento, el framework de skills para coding agents que más me toma en serio como ingeniero. No porque cubra más — eso es mercadotecnia. Sino porque cada pieza que cubre la cubre con disciplina medible: racionalizaciones explícitas, red flags, verification, evals en CI. Es la primera vez que veo un proyecto de este tamaño tomarse en serio la pregunta "¿cómo sé que mis skills funcionan?" y responderla con un sistema automatizado.

No va a resolver todo. El problema de la memoria cross-session sigue abierto, y la cobertura hasta Ship es ambiciosa pero todavía no validada por suficiente producción para sentirse obvia. Pero como base para montar un workflow serio de coding agents en 2026, es el lugar al que volver.

Si tuvieras que llevarte una sola cosa de este artículo: **el patrón anti-rationalization + red flags + eval framework es la diferencia entre una colección de prompts y un sistema de ingeniería**. Todo lo demás es secundario.

Si quieres probarlo, el `npx skills add addyosmani/agent-skills` te lo instala en 30 segundos. Si quieres entenderlo antes, este artículo es el tour. Y si quieres discutirlo, mi DMs están abiertos — siempre me interesa saber cómo lo está montando otra gente.
