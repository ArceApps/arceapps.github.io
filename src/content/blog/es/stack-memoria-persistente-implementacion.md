---
title: "El Stack de Memoria Persistente que Realmente Uso en Mis Proyectos"
description: "Deep dive técnico y honesto en el stack de memoria persistente que combino a diario en mis proyectos: opencode-supermemory para auto-compact, basic-memory como memoria principal con Markdown + grafo, y forgetful como capa de skills procedurales."
pubDate: 2026-06-18
lastmod: 2026-06-18
author: ArceApps
keywords:
  - "Stack Memoria Persistente"
  - "Implementación"
  - "Proyectos"
  - "IA"
  - "Real"
canonical: "https://arceapps.com/es/blog/stack-memoria-persistente-implementacion/"
heroImage: "/images/blog-stack-memoria-persistente-implementacion.svg"
tags: ["IA", "Agentes", "Memoria", "MCP", "OpenCode", "Claude Code", "Codex", "Cursor", "Workflow"]
category: ai-agents
reference_id: "2f8d3b7c-6d4a-9c0f-df2d-8a1e7f4b9c6d"
---



> Este es el tercer artículo de la serie sobre memoria persistente en agentes. En el [primero](/blog/opencode-plugins-memoria-nativos) cubrimos tres plugins nativos de OpenCode. En el [segundo](/blog/servidores-mcp-memoria-cross-agent), tres servidores MCP cross-agent. Hoy cierro la serie con lo que realmente importa: **cómo combino los mejores en mi flujo real**, con configuraciones verificadas, scripts de mantenimiento y casos de uso honestos — incluyendo los momentos donde cada pieza falla.

---

## Disclaimer Honesto: No Existe el Stack Perfecto

Antes de meternos en harina, una confesión: llevo seis meses iterando sobre mi setup de memoria persistente. He probado las seis herramientas analizadas en esta serie más otras que no llegaron al blog. La combinación que te voy a contar **funciona para mí**, pero tiene compromisos reales.

Si me lees buscando el "stack definitivo" que no tengas que tocar nunca más, te lo digo ya: no existe. Lo que sí existe es un stack que puedes defender racionalmente, que falla de forma comprensible, y que puedes migrar pieza a pieza sin quedarte atascado.

Lo que voy a contar presupone que:

1. **Trabajas en 2-5 proyectos simultáneamente** (mi caso real con Android + Astro + scripts Python).
2. **Cambias de agente según la tarea**: Claude Code para arquitecturas serias, Cursor para refactors rápidos, OpenCode para sesiones largas, Codex en CI.
3. **Te importa más la auditabilidad y portabilidad que la conveniencia cloud**.
4. **Tienes Python 3.12+ y uv instalados** (si no, parte del setup no aplica).

Si alguno de estos no encaja con tu realidad, adapta. Esto es una guía, no un dogma.

---

## La Arquitectura en Tres Capas

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 3: opencode-supermemory                          │
│  Auto-compactación preventiva + context injection      │
│  (Solo OpenCode — pero crítico para sesiones largas)    │
├─────────────────────────────────────────────────────────┤
│  CAPA 2: forgetful                                     │
│  Skills procedurales + entidades + Zettelkasten         │
│  (Cross-agent — Claude, Cursor, Codex, Gemini, etc.)    │
├─────────────────────────────────────────────────────────┤
│  CAPA 1: basic-memory                                  │
│  Memoria principal: Markdown + grafo de conocimiento    │
│  (Cross-agent — funciona con todos los clientes MCP)    │
└─────────────────────────────────────────────────────────┘
```

La lógica de las tres capas:

- **Capa 1 (basic-memory)**: el "cerebro" central. Aquí vive todo lo que quiero recordar entre proyectos: decisiones arquitectónicas, preferencias, contexto de usuario, conocimiento técnico. Es la capa que más uso y la única que considero indispensable.

- **Capa 2 (forgetful)**: la "memoria muscular". Aquí almaceno procedimientos reutilizables (skills) que distribuyo entre agentes, y entidades (personas, servicios, dependencias externas) que necesito referenciar.

- **Capa 3 (supermemory)**: el "compactor inteligente". Solo la activo para sesiones largas de OpenCode donde la compactación nativa destruiría contexto crítico. Es opt-in, no siempre encendida.

Esta separación no es dogma. La razón práctica: cada capa tiene un ciclo de actualización, un coste de tokens y un modo de fallo distinto. Mezclarlas en una sola herramienta suena elegante pero en la práctica te obliga a aceptar compromisos en cada dimensión.

---

## Capa 1: basic-memory como Memoria Principal

### Por Qué basic-memory y No Otros

De los seis plugins analizados, basic-memory es el único que cumple simultáneamente:

1. **Almacenamiento legible y editable por humanos** (Markdown + Obsidian).
2. **Compatibilidad universal MCP** (Claude Code, Codex, Cursor, VS Code, ChatGPT, OpenCode, OpenClaw, Hermes, Oh My OpenCode).
3. **Búsqueda híbrida local** (FTS5 + FastEmbed, sin cloud).
4. **Grafo de conocimiento** vía wikilinks.
5. **Proyecto activo y financiado** (3.3k stars, releases frecuentes, Discord activo).

Los otros candidatos tenían debilidades en alguna dimensión:

- `opencode-supermemory` solo soporta OpenCode oficialmente.
- `forgetful` requiere disciplina atómica que no siempre mantengo.
- Los plugins nativos del [artículo previo](/blog/opencode-plugins-memoria-nativos) no son cross-agent.

### Configuración Inicial Paso a Paso

#### 1. Instalar basic-memory

```bash
uv tool install basic-memory
```

Verifica con:

```bash
basic-memory --version
# basic-memory, version 0.22.1
```

Si quieres mantenerlo actualizado automáticamente, no hagas nada más. basic-memory revisa updates cada 24h. Para forzar:

```bash
basic-memory update
```

#### 2. Configurar Proyectos

Mi setup personal tiene tres proyectos:

```bash
# Trabajo principal: Android + Astro
basic-memory project add work ~/basic-memory/work

# Aprendizaje y side projects
basic-memory project add study ~/basic-memory/study

# Notas personales / experimentos
basic-memory project add personal ~/basic-memory/personal
```

Verifica:

```bash
basic-memory project list
# NAME      PATH                  MODE
# work      ~/basic-memory/work        local
# study     ~/basic-memory/study       local
# personal  ~/basic-memory/personal    local
```

#### 3. Configurar Obsidian (Opcional pero Recomendado)

Apunta Obsidian a `~/basic-memory` como vault raíz. Dentro crea tres sub-vaults:

```
~/basic-memory/
├── work/
├── study/
└── personal/
```

Activa en Obsidian:
- **Plugin "Graph"** (nativo) — visualiza el grafo de wikilinks.
- **Plugin "Backlinks"** (nativo) — bidireccionalidad automática.
- **Plugin "Dataview"** — consultas SQL-like sobre el frontmatter.

#### 4. Conectar con Cada Agente MCP

**Claude Code** (mi agente principal para trabajo serio):

```bash
claude mcp add basic-memory -- uvx basic-memory mcp
```

Para verificar:

```bash
claude mcp list
# basic-memory: uvx basic-memory mcp - ✓ Connected
```

**Claude Desktop** (cuando quiero chat sin código):

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"]
    }
  }
}
```

**Codex CLI** (para CI y sesiones rápidas):

```toml
# ~/.codex/config.toml
[mcp_servers.basic-memory]
command = "uvx"
args = ["basic-memory", "mcp"]
```

**Cursor** (refactors visuales):

```json
// .cursor/mcp.json (project-level) o ~/.cursor/mcp.json (global)
{
  "mcpServers": {
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"]
    }
  }
}
```

**OpenCode**:

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["basic-memory"]
}
```

Notar que basic-memory se anuncia oficialmente como compatible con OpenCode vía su [plugin dedicado](https://github.com/basicmachines-co/basic-memory/tree/main/integrations/openclaw), aunque el server MCP también funciona directamente.

#### 5. Configurar Auto-Update

Edita `~/.basic-memory/config.json` y verifica que `auto_update` está en `true` (default):

```json
{
  "auto_update": true
}
```

Esto evita que una versión nueva rompa compatibilidades sin que te enteres.

### Mi Estructura de Conocimiento Real

Después de seis meses iterando, esta es la estructura que me funciona. Te la doy tal cual la uso, con explicaciones de por qué cada sección existe:

```
~/basic-memory/work/
├── index.md                          # Punto de entrada al grafo
├── preferences/
│   ├── coding-style.md               # Mis preferencias de código
│   ├── communication-style.md        # Tono, idioma, formato
│   └── tooling-preferences.md        # Qué uso para qué
├── architecture/
│   ├── android/
│   │   ├── module-structure.md       # Cómo organizo módulos
│   │   ├── dependency-injection.md   # Hilt patterns
│   │   └── persistence-layer.md      # Room + DAOs
│   └── astro/
│       ├── content-collections.md    # Schema de blog/apps/devlog
│       └── i18n-strategy.md          # Inglés default + español
├── decisions/
│   ├── 2026-01-15-why-bun-not-npm.md # Decisión sobre package manager
│   ├── 2026-02-03-typescript-strict.md
│   └── 2026-03-22-svg-not-png-heroes.md
├── projects/
│   ├── sudoku-android.md             # Estado actual del proyecto
│   ├── puzzle-hub.md
│   └── arceapps-site.md
└── meetings/
    └── 2026-06-10-pair-coding-claude.md
```

#### `index.md` — El Punto de Entrada

Este archivo es crítico. Lo abro al iniciar sesión con cualquier agente y le pido que lo lea primero:

```markdown
---
title: Work Memory Index
permalink: work-index
tags: [meta, index]
---

# Work Memory Index

This is the entry point to my work knowledge graph. Start here.

## Active Projects
- [[Sudoku Android]] - Current sprint: solving algorithm optimization
- [[Puzzle Hub]] - Paused, returning next week
- [[ArceApps Site]] - Active, content focus

## My Preferences (load these every session)
- [[Coding Style Preferences]]
- [[Communication Style]]
- [[Tooling Preferences]]

## Architectural Patterns I Use
- Android: [[Module Structure]], [[DI Patterns]], [[Persistence Layer]]
- Astro: [[Content Collections]], [[i18n Strategy]]

## Recent Decisions
- [[2026-01-15 Why Bun not npm]]
- [[2026-02-03 TypeScript Strict Mode]]
- [[2026-03-22 SVG Not PNG Heroes]]

## How to Use This Memory
1. Read `index.md` at session start.
2. Use `search_notes` to find specific topics.
3. Use `build_context` to navigate wikilinks.
4. Use `recent_activity` to see what I changed recently.
```

#### `preferences/coding-style.md` — Preferencias de Código

```markdown
---
title: Coding Style Preferences
permalink: coding-style
tags: [preferences, style]
---

# Coding Style Preferences

## Kotlin
- [rule] Use `data class` for DTOs and value objects
- [rule] Prefer expression bodies for single-line functions
- [rule] Coroutines over Threads, always
- [rule] `Result<T>` for error handling, not exceptions in domain layer
- [rule] Hilt for DI, never manual factories
- [rule] Room for persistence, never raw SQLite

## TypeScript
- [rule] Strict mode enabled, never `any` (use `unknown` if needed)
- [rule] Prefer `interface` for object shapes, `type` for unions
- [rule] Async/await over `.then()`, always
- [rule] Destructuring over property access when 3+ fields
- [rule] No default exports (except config files)

## Astro / Web
- [rule] Tailwind utility classes, no `<style>` blocks
- [rule] Components in `src/components/`, never inline
- [rule] All images in `public/images/`, referenced absolutely
- [rule] i18n via folder prefix (`en/`, `es/`)

## Git
- [rule] Conventional commits, always
- [rule] Never commit secrets, ever
- [rule] Squash commits on PR, rebase on main
```

Esta nota la carga el agente automáticamente vía `build_context` cuando le pido código nuevo.

#### `decisions/2026-03-22-svg-not-png-heroes.md` — El Formato de Decisiones

```markdown
---
title: Why SVG not PNG for Hero Images
permalink: 2026-03-22-svg-heroes
tags: [decision, astro, design]
---

# Why SVG instead of PNG for Hero Images

## Context
Was using PNG/JPG for hero images on blog posts. 132 images, ~50MB total.

## Decision
Switch to SVG with simple geometric patterns. Brand colors only (#018786 teal, #FF9800 orange).

## Rationale
- [fact] SVG files average 2-8KB vs 200-500KB for equivalent PNG
- [fact] SVG scales perfectly for retina/4K without 2x assets
- [principle] Geometric minimalism fits indie dev aesthetic
- [principle] Easier to maintain, edit text in any editor

## Consequences
- [consequence] 95% reduction in image weight
- [consequence] Hero images now version-controlled diff-friendly
- [consequence] Some illustrations less photographic (acceptable trade)

## Alternatives Considered
- WebP with fallback: too complex for indie flow
- PNG with compression: still 10x bigger than SVG
- Icon library (Undraw, Heroicons): limited customization

## Date
2026-03-22
```

Notar la estructura: **Contexto → Decisión → Rationale → Consecuencias → Alternativas**. Es el formato que recomiendo para todas las decisiones importantes. Permite al agente (y a mí dentro de seis meses) reconstruir el razonamiento.

### Cómo Lo Uso Día a Día

#### Sesión Típica con Claude Code

```bash
$ claude
```

```
> Lee ~/basic-memory/work/index.md y dime qué proyectos están activos.

[Claude lee el index.md vía MCP build_context]

Claude: Tienes tres proyectos activos según tu memoria:
- Sudoku Android (sprint actual: optimización del solver)
- Puzzle Hub (pausado, regresas la próxima semana)
- ArceApps Site (activo, foco en contenido)

¿Quieres continuar con Sudoku o cambiar de proyecto?

> Sudoku. Lee el archivo del proyecto y muéstrame el último estado.

[Claude lee ~/basic-memory/work/projects/sudoku-android.md vía MCP read_note]

Claude: Tu último estado en Sudoku Android:
- Solver implementado con backtracking, O(n!) en casos patológicos
- Próximo paso: implementar constraint propagation antes del backtracking
- Decisión abierta: DLX (Algorithm X) vs mantener backtracking optimizado
- Bloqueador actual: tests de regresión para puzzles difíciles fallan

¿Quieres que exploremos la opción DLX o prefieres optimizar el backtracking primero?
```

Esto es **exactamente** lo que quiero. Sin re-explicar nada. Sin "¿prefieres X o Y?" tres veces. El agente ya sabe qué hago, qué decisiones tomé, qué dejé pendiente.

#### Cuando Encuentro Algo Importante

Trabajo con el agente, encuentro un patrón, tomo una decisión. Le digo:

```
> Esto es importante: añade a la memoria que para puzzles de Sudoku difíciles, el algoritmo
> de Norvig (constraint propagation + backtracking) es 100x más rápido que backtracking puro.

[Claude llama write_note con type=learning, scope=work/sudoku]

Claude: He guardado en ~/basic-memory/work/decisions/2026-06-18-sudoku-norvig-algorithm.md
con tags [sudoku, algorithm, performance]. ¿Quieres que añada también la referencia al
paper original de Peter Norvig?

> Sí, y enlaza con el proyecto.

[Claude hace edit_note añadiendo wikilink [[Sudoku Android]] en la sección Relations]
```

La memoria crece orgánicamente. Sin ceremonias. Sin exportar, importar, sincronizar.

#### Cuando Busco Conocimiento Pasado

```
> ¿Recuerdas por qué elegimos Bun en lugar de npm?

[Claude llama search_notes con query="bun npm decision"]

Claude: Sí, lo decidiste el 2026-01-15. Las razones principales:
1. ~3x más rápido en install
2. Built-in TypeScript nativo, sin ts-node ni tsx
3. Lockfile más simple (bun.lock vs package-lock.json)
4. Compatibilidad con scripts de Node.js

Alternativas que descartaste: pnpm (más lento), yarn classic (abandonado),
deno (ecosistema más pequeño).

¿Quieres revisar esta decisión o está vigente?
```

#### Refactor con Cursor

Abro Cursor en `~/code/sudoku-android`. La configuración MCP global está activa, así que el agente ya tiene acceso a basic-memory.

```
> Refactoriza Solver.kt para usar el algoritmo de Norvig que tengo en memoria.

[Cursor llama search_notes "norvig algorithm kotlin"]

Cursor: Encontré tu nota del 2026-06-18. Voy a refactorizar Solver.kt aplicando
constraint propagation + backtracking. Primero leo el archivo actual...
```

**Lo crítico**: la memoria es la misma. No tengo que configurar nada específico para Cursor. La capa MCP se encarga.

### Mantenimiento Real

Esto es lo que nadie te cuenta sobre memoria persistente: requiere mantenimiento, igual que un jardín.

#### Script Semanal de Compactación

Tengo un script en `~/bin/basic-memory-maintenance.sh`:

```bash
#!/bin/bash
# Ejecutar semanalmente: ./basic-memory-maintenance.sh

set -e

echo "=== Basic Memory Maintenance ==="
echo ""

echo "1. Estado general..."
basic-memory status
echo ""

echo "2. Doctor check (consistencia archivos <-> DB)..."
basic-memory doctor
echo ""

echo "3. Reindex si es necesario..."
if basic-memory doctor --check 2>&1 | grep -q "out of sync"; then
  echo "Reindexando..."
  basic-memory reindex
fi
echo ""

echo "4. Búsqueda de notas huérfanas (sin relaciones)..."
orphans=$(basic-memory tool list_directory --output json | jq -r '.entries[] | select(.relations_count == 0) | .permalink')
if [ -n "$orphans" ]; then
  echo "Notas sin relaciones:"
  echo "$orphans"
  echo "Considera enlazarlas con wikilinks para fortalecer el grafo."
fi
echo ""

echo "5. Actividad reciente (últimos 7 días)..."
basic-memory tool recent_activity --days 7
echo ""

echo "=== Done ==="
```

Lo corro cada domingo por la noche. Tarda ~30 segundos.

#### Backup Trivial Con Git

`~/basic-memory/` es un repositorio Git:

```bash
cd ~/basic-memory
git init
echo "*.db" > .gitignore
echo "*.db-journal" >> .gitignore
echo ".basic-memory/" >> .gitignore
git add .
git commit -m "Initial memory snapshot"
```

Y sincronizo con un repo privado en GitHub:

```bash
git remote add origin git@github.com:arceapps/basic-memory-private.git
git push -u origin main
```

**Por qué este setup importa**: si basic-memory desapareciera mañana (proyecto abandonado, AGPL incompatible, lo que sea), tengo todos mis archivos de memoria en Git, en formato Markdown estándar, recuperables con cualquier herramienta.

#### Cuándo Editar Manualmente vs. Dejar al Agente

Regla que sigo:

- **El agente edita**: notas operativas, decisiones técnicas específicas, learnings de bugs.
- **Yo edito manualmente**: notas de preferencias, decisiones filosóficas, index.md, estructura de carpetas.

El motivo: las notas que más me importa que estén **exactamente como las quiero** son las que definen mi identidad técnica. El agente es bueno extrayendo conocimiento factual; yo soy mejor definiendo tono y estilo.

---

## Capa 2: forgetful como Memoria de Skills Procedurales

### Por Qué forgetful como Segunda Capa

La razón principal: **el formato Agent Skills SKILL.md es portable**. forgetful puede importar/exportar skills en este formato, que es el estándar que están adoptando Claude Code, Codex y otros agentes modernos (cubrimos esto en el [artículo sobre Skills dinámicas](/blog/ai-agent-skills-dynamic-context/)).

Mi uso concreto: tengo un repositorio de skills procedurales (cómo debuggear problemas de Gradle, cómo configurar CI para Android, cómo hacer refactor seguro en Astro) que quiero que estén disponibles en cualquier agente que use. forgetful es el repositorio central.

### Configuración Mínima

```bash
uv tool install forgetful-ai
```

Verifica:

```bash
forgetful --help
# O usando uvx directamente:
uvx forgetful-ai --help
```

### Conexión con Agentes

**Claude Code**:

```bash
claude mcp add forgetful -- uvx forgetful-ai
```

**OpenCode**:

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["forgetful"]
}
```

**Codex**:

```toml
# ~/.codex/config.toml
[mcp_servers.forgetful]
command = "uvx"
args = ["forgetful-ai"]
```

### Caso de Uso Real: Skill "Debug Gradle Build Failures"

Imagina que después de luchar contra un build fallido de Gradle en Android, identificas un patrón reproducible:

1. **Lo guardas en forgetful** con un prompt al agente:

```
> Crea una memoria atómica en forgetful con título "Debug Gradle Build Failures Pattern".
> Contenido: cuando ./gradlew falla sin stacktrace, ejecutar ./gradlew --stacktrace --info
> | head -200. Si el error es de dependencias, verificar gradle/wrapper/gradle-wrapper.properties
> y comparar con version catalog en gradle/libs.versions.toml. Si nada funciona, borrar
> ~/.gradle/caches y reintentar.
> Tags: gradle, android, debugging, build-failures
> Importance: 8
```

2. **El agente llama `execute_forgetful_tool("create_memory", ...)`** con esos parámetros.

3. **Meses después**, en otro proyecto Android:

```
> Tengo un fallo de Gradle sin stacktrace claro. ¿Tienes alguna memoria relevante?

[El agente llama execute_forgetful_tool("query_memory", { query: "gradle build failure debugging" })]

Agente: Sí, encontré tu memoria "Debug Gradle Build Failures Pattern" (importance 8).
Recomiendo:
1. Ejecutar ./gradlew --stacktrace --info | head -200
2. Verificar gradle/wrapper/gradle-wrapper.properties vs libs.versions.toml
3. Si nada funciona: rm -rf ~/.gradle/caches y reintentar

¿Aplico estos pasos?
```

### Por Qué forgetful y No basic-memory para Skills

Podría argumentarse que basic-memory también puede almacenar esto. La diferencia práctica:

- **basic-memory** está optimizado para **conocimiento declarativo** (hechos, decisiones, observaciones categorizadas). Escribes sobre el mundo.
- **forgetful** está optimizado para **conocimiento procedural** (pasos, secuencias, condiciones). Enseñas a hacer.

El formato atómico de forgetful (`title` corto + `content` autocontenido + `tags` + `importance`) es perfecto para skills que se invocan y ejecutan. El formato de basic-memory (Markdown con observaciones + relaciones) es perfecto para knowledge graph navegable.

Usar el tool correcto para el trabajo correcto simplifica la arquitectura cognitiva.

---

## Capa 3: opencode-supermemory para Auto-Compact

### Por Qué Solo OpenCode

`opencode-supermemory` solo funciona con OpenCode oficialmente. Esto limita su alcance pero también clarifica cuándo usarlo.

**Mi regla**: solo activo supermemory cuando voy a tener una sesión de OpenCode larga (>20 prompts) donde la compactación es probable. Para el resto, no lo enciendo.

### Instalación

```bash
bunx opencode-supermemory@latest install
```

Para autenticarte:

```bash
bunx opencode-supermemory@latest login
```

Si prefieres self-hosted:

```bash
# Clona y arranca el backend
git clone https://github.com/supermemoryai/supermemory.git
cd supermemory
docker compose up -d

# Configura el plugin para apuntar a localhost
echo '{"baseUrl": "http://localhost:8787"}' > ~/.config/opencode/supermemory.jsonc
```

### Configuración Optimizada para Sesiones Largas

```jsonc
// ~/.config/opencode/supermemory.jsonc
{
  "similarityThreshold": 0.65,
  "maxMemories": 8,
  "maxProjectMemories": 15,
  "maxProfileItems": 7,
  "injectProfile": true,
  "compactionThreshold": 0.75,
  "containerTagPrefix": "arceapps"
}
```

Los valores que se desvían del default:

- `compactionThreshold: 0.75` (default 0.8) — compacto antes, cuando todavía tengo contexto de sobra para tomar decisiones buenas.
- `maxMemories: 8` (default 5) — más memorias por inyección porque mi perfil es rico.
- `containerTagPrefix: "arceapps"` — namespace personalizado para evitar colisiones con otros devs que usen el mismo git email hash.

### Cuándo lo Activo Manualmente

No siempre está encendido. Lo activo al inicio de sesiones que sé que serán largas:

```bash
# Verificar si está cargado
bunx opencode-supermemory@latest status

# Sesión típica
opencode
```

Dentro de OpenCode, ejecuto `/supermemory-init` si estoy en un codebase nuevo (para que explore y memore la arquitectura), o salto directamente al trabajo si ya lo conoce.

### Cómo Coopera con basic-memory

Aquí viene lo interesante: **supermemory y basic-memory no compiten, cooperan**.

En una sesión típica:

1. basic-memory inyecta conocimiento persistente al inicio (vía `build_context`).
2. supermemory añade memorias de la sesión actual y detecta keywords.
3. Cuando el contexto llega a 75%, supermemory dispara compactación y guarda el resumen como memoria.
4. basic-memory permanece estable como repositorio a largo plazo; supermemory maneja el ciclo de vida inmediato.

Si quieres verificar la diferencia, abre `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["basic-memory", "opencode-supermemory"]
}
```

Ambos plugins coexisten sin conflictos. Cada uno escribe en su backend.

---

## El Flujo Completo en un Día Real

Déjame contarte un día reciente para que veas cómo encaja todo.

**9:00 AM — Sesión matutina con Claude Code**

```bash
claude
```

```
> Buenos días. Continúa con el refactor de Solver.kt.

[Claude lee basic-memory/work/projects/sudoku-android.md]
[Claude lee basic-memory/work/decisions/2026-06-18-sudoku-norvig-algorithm.md]

Claude: Buenos días. Según tu memoria, estás implementando el algoritmo de Norvig
en Solver.kt. El último estado: constraint propagation parcialmente implementado,
falta integrar con backtracking. ¿Continúo desde ahí o quieres replantear?
```

Trabajo 2 horas. Encuentro un edge case. Lo guardo:

```
> Crea nota: cuando el puzzle tiene solo 2 celdas vacías y backtracking no encuentra
> solución, es bug en mi implementación de candidatos. Verificar función candidateValues()
> excluyendo valores ya asignados en row/col/box.

[Claude llama write_note vía basic-memory]
```

**11:30 AM — Cambio a OpenCode para sesión larga**

```bash
# Verifico estado de supermemory
bunx opencode-supermemory@latest status
# Connected, 247 memories stored, 12 project memories for current dir

opencode
```

Trabajo 3 horas en una feature grande. A las 2 horas, la compactación automática se dispara:

```
> [Compactación automática ejecutada por supermemory]
> Contexto reducido de 87% a 42%.
> 3 memorias de proyecto actualizadas con resumen de la sesión.
```

Sigo trabajando 1 hora más sin perder el hilo.

**3:00 PM — Refactor visual en Cursor**

Abro Cursor. La configuración MCP global carga basic-memory automáticamente.

```
> Refactoriza el componente SudokuGrid.kt para usar ConstraintLayout en lugar del
> nested LinearLayout. Recuerda mis preferencias de estilo Kotlin.

[Cursor lee basic-memory/work/preferences/coding-style.md]
[Cursor busca memory:// style preferences vía build_context]

Cursor: Aplicando tus reglas: data class para value objects, expression bodies
para funciones simples, Hilt para DI. Refactorizando SudokuGrid.kt...
```

**5:00 PM — Issue en CI con Codex**

GitHub Actions falla. Abro Codex CLI localmente para reproducir:

```bash
codex
```

```
> El CI falla en ./gradlew test. Mira el log y dime qué pasa.

[Codex lee el log directamente]
[Codex consulta basic-memory vía MCP: "gradle test failures"]

Codex: El log muestra `Unsupported class file major version 67`. Según tu memoria
("Debug Gradle Build Failures Pattern"), esto suele ser JDK mismatch. El CI
probablemente está usando JDK 21 mientras libs.versions.toml pide JDK 17.

¿Quieres que actualice el CI a JDK 17 o el version catalog a JDK 21?
```

**7:00 PM — Cierre**

```bash
# Mantenimiento semanal cada domingo, pero el diario es trivial
basic-memory status
# 89 notes, 234 relations, healthy
```

Listo. Sin ceremonias. Sin reinventar el contexto cada vez.

---

## Trade-offs Honestos

No sería honesto si no contara dónde falla este stack.

### El Problema de "Memoria Sin Curar"

basic-memory crece sin parar. Después de seis meses tengo ~90 notas en `work/` y ~40 en `study/`. No todas son igual de útiles. **No tengo un proceso sistemático de podar**.

Esto es un problema real. Mi solución parcial: revisar las notas con `recent_activity --days 30` y fusionar las redundantes. Pero no es sistemático.

**Si tuviera que empezar de nuevo**, dedicaría una hora mensual a revisar y consolidar.

### El Coste de Tokens Inyectados

basic-memory inyecta conocimiento al inicio de cada sesión. Con 90 notas y un sistema de retrieval generoso, son ~3000-5000 tokens de contexto consumidos antes de tu primer prompt.

Esto no es dramático (contexto de 200k tokens en Claude, 1M en Gemini), pero **acumula**. Si pagas por tokens, es un coste real.

**Mitigación**: usa el tool `build_context` con un `URL` específico (`memory://work/projects/sudoku-android`) en vez de cargar todo el grafo.

### La Sincronización Entre Máquinas

basic-memory no sincroniza automáticamente entre máquinas (a menos que pagues el cloud). Mi solución: Git + push manual cada noche. Es feo pero funciona.

**Alternativa que probé y descarté**: usar Syncthing para sincronizar `~/basic-memory/` directamente. Problema: SQLite no se lleva bien con escrituras concurrentes. La base de datos se corrompió dos veces antes de que volviera a Git.

### La Inconsistencia Entre Agentes

Cada agente MCP tiene peculiaridades. Claude Code respeta `build_context` perfectamente. Cursor a veces ignora el `output_format=json`. Codex tiene su propia forma de invocar tools que a veces no encaja con las anotaciones FastMCP.

**Esto no es culpa de basic-memory**, es inmadurez del ecosistema MCP. Pero te lo encuentras.

### La Carga Cognitiva de Mantener Tres Sistemas

Tres capas, tres CLIs, tres bases de datos, tres modos de fallo. A veces pienso "debería quedarme solo con basic-memory y olvidarme del resto".

**La verdad**: para 80% de mis necesidades, basic-memory solo bastaría. forgetful y supermemory son el 20% de casos donde la especialización aporta valor real (skills procedurales portables, sesiones largas con auto-compact).

**Si tuviera que elegir solo uno**, sería basic-memory. Sin dudarlo.

---

## Lo Que Cambiaría (Y Lo Que No)

Después de seis meses con este stack:

**Cambiaría**:

- **El sistema de routing de proyectos en basic-memory**. Tres proyectos está bien, pero cuando pase a cinco quiero algo más sofisticado.
- **La falta de versionado automático de la base de datos SQLite**. Si se corrompe, pierdo el índice vectorial (los archivos Markdown siguen intactos, pero la búsqueda semántica hay que reindexar).

**No cambiaría**:

- La decisión de tener **tres capas en lugar de una monolítica**. Los compromisos son reales, pero la separación de responsabilidades cognitivas es valiosa.
- **Markdown como formato principal**. Es la decisión más defensible a largo plazo.
- **Git para versionado**. Sencillo, portable, gratis.

---

## Conclusión de la Serie

En el [primer artículo](/blog/opencode-plugins-memoria-nativos) vimos plugins nativos de OpenCode. En el [segundo](/blog/servidores-mcp-memoria-cross-agent), servidores MCP cross-agent. En este tercero, mi stack real.

Si tuviera que resumir todo en una frase: **la mejor memoria persistente es la que usa tu agente sin que tengas que pensar en ella**, que sobrevive a un cambio de herramienta, y que puedes auditar con `cat`.

basic-memory cumple las tres. forgetful y supermemory complementan casos específicos. Los plugins nativos del primer artículo son perfectos para empezar antes de decidir invertir en infraestructura más seria.

Y lo más importante: **no necesitas implementar todo esto hoy**. Empieza con basic-memory, vive con él un mes, y añade las otras capas solo cuando identifiques fricciones reales.

---

## Referencias y Lectura Adicional

- [basic-memory repository](https://github.com/basicmachines-co/basic-memory)
- [basic-memory documentation](https://docs.basicmemory.com/)
- [opencode-supermemory repository](https://github.com/supermemoryai/opencode-supermemory)
- [forgetful repository](https://github.com/ScottRBK/forgetful)
- [Model Context Protocol specification](https://modelcontextprotocol.io/)
- [Agent Skills specification](https://agentskills.io)
- [FastMCP framework](https://github.com/jlowin/fastmcp)
- [FastEmbed (local embeddings)](https://github.com/qdrant/fastembed)
- [Claude Code MCP documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Codex CLI MCP guide](https://github.com/openai/codex/blob/main/docs/mcp.md)
- [Cursor MCP documentation](https://docs.cursor.com/welcome/mcp)
- [uv (Astral Python package manager)](https://docs.astral.sh/uv/)
- [Artículo previo: Plugins nativos de OpenCode para memoria persistente](/blog/opencode-plugins-memoria-nativos/)
- [Artículo previo: Servidores MCP cross-agent para memoria persistente](/blog/servidores-mcp-memoria-cross-agent/)
- [Artículo previo: Arquitectura de la Memoria Persistente en Agentes IA](/blog/ai-agent-memory-persistence-guide/)
- [Artículo previo: Skills dinámicas para agentes IA](/blog/ai-agent-skills-dynamic-context/)
