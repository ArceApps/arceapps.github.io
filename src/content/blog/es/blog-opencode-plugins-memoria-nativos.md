---
title: "Plugins Nativos de OpenCode para Memoria Persistente: simple-memory, Mnemosyne y true-mem a Fondo"
description: "Análisis técnico comparativo de tres plugins nativos de OpenCode para dotar a tu agente IA de memoria persistente local: simple-memory (logfmt), Mnemosyne (binario Go offline) y true-mem (psicología cognitiva)."
pubDate: 2026-06-18
heroImage: "/images/blog-opencode-plugins-memoria-nativos.svg"
tags: ["IA", "Agentes", "Memoria", "OpenCode", "Plugins", "MCP", "Indie Dev"]
reference_id: "7a3f8c2d-1e9b-4d5a-8c7e-3b6f2a9c4d1e"
---

> Si llevas tiempo trabajando con agentes de codificación, sabes lo que es el "síndrome del agente amnésico": cada sesión empieza desde cero, vuelves a explicar tu arquitectura, tus preferencias y las decisiones que tomaste ayer. En [La Arquitectura de la Memoria Persistente en Agentes IA](/blog/memoria-persistente-agentes-ia/) ya cubrimos el marco teórico (OpenClaw, QMD, Mem0, Cognee). Hoy bajamos al barro con tres plugins reales que puedes instalar hoy mismo en [OpenCode](https://opencode.ai).

---

## El Problema Concreto: Tres Sesiones, Tres Agentes Distintos

Trabajo en proyectos Kotlin para Android, mantengo [este sitio Astro](https://github.com/arceapps/arceapps.github.io) y de vez en cuando retomo un script en Python que dejé a medias hace tres semanas. Mi flujo natural es abrir OpenCode, escribir "sigue donde lo dejamos con el parser de Kotlin", y esperar que el agente sepa qué es "el parser de Kotlin", por qué lo elegí sobre `kotlinx-parser`, y qué decisiones arquitectónicas tomé la última vez.

El problema es que sin memoria persistente, abro una sesión y el agente es un desconocido educado. Tiene los superpoderes del modelo, pero cero contexto sobre mí, mi proyecto, mis manías. Tengo que volver a dar el TED Talk de "este repo usa X, no Y, por la razón Z".

Esto me empujó a probar en serio el ecosistema de plugins de memoria persistente para OpenCode. Y aquí traigo los tres que más me han servido cuando **quieres algo nativo, local-first, y que se instale en cinco minutos**. En el [segundo artículo de esta serie](/blog/servidores-mcp-memoria-cross-agent) cubriremos los servidores MCP más pesados pero más versátiles, y en el [tercer artículo](/blog/stack-memoria-persistente-implementacion) entraremos al detalle del día a día.

---

## Criterios de Comparación

Antes de meternos en harina, dejemos claros los ejes por los que voy a evaluar cada plugin. Esto me sirve a mí para no engañarme, y a ti para entender por qué llego a las conclusiones que llego:

1. **Modelo de persistencia**: ¿archivos de texto planos, SQLite local, binario externo, base de datos remota? Esto determina auditabilidad, portabilidad y dependencia de infraestructura.
2. **Curva de instalación**: comandos necesarios, prerrequisitos del sistema, tamaño del modelo descargado.
3. **Modelo de extracción**: ¿hay que recordar explícitamente o el plugin detecta automáticamente? ¿Soporta scope global vs. proyecto?
4. **Búsqueda y recuperación**: simple coincidencia de tokens, BM25, búsqueda vectorial, híbrida. Esto importa cuando tu memoria crece a cientos de notas.
5. **Multi-idioma y ruido**: si trabajas en español y mezclas código, necesitas que el plugin no se vuelva loco con meta-conversación del propio agente.
6. **Madurez**: stars en GitHub, frecuencia de commits, issues abiertos, versión actual.
7. **Compatibilidad con el resto del stack OpenCode**: ¿interfiere con otros plugins, hooks de compactación, sub-agentes?

Con esto en mente, vamos al lío.

---

## 1. opencode-plugin-simple-memory: El Pragmático de los Archivos Logfmt

**Repositorio**: [github.com/ApplauseLab/opencode-plugin-simple-memory](https://github.com/ApplauseLab/opencode-plugin-simple-memory) (también publicado como `@knikolov/opencode-plugin-simple-memory` en npm).
**Autor**: cnikolov / ApplauseLab.
**Stars**: ~124. **Versión activa**: con releases regulares.
**Lenguaje**: TypeScript 100%. **Persistencia**: archivos `logfmt` diarios.

### Filosofía de Diseño

`simple-memory` es el plugin que escribes cuando estás harto de la complejidad. Su modelo de datos es deliberadamente minimalista: cada memoria es una línea en un archivo `YYYY-MM-DD.logfmt` bajo `.opencode/memory/`. Nada de SQLite, nada de embeddings, nada de servidor MCP. Texto plano con campos separados por espacios, fácilmente parseable y, sobre todo, **legible por humanos con `cat`**.

Este enfoque me encanta porque cumple la propiedad que más valoro en una herramienta de memoria: **puedo auditar lo que mi agente sabe con un comando de shell**.

### Instalación

La instalación es la más simple de los tres:

```json
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@knikolov/opencode-plugin-simple-memory"]
}
```

Y opcionalmente, para activar auto-load y auto-save:

```json
{
  "plugin": [
    [
      "@knikolov/opencode-plugin-simple-memory",
      {
        "autoLoad": true,
        "autoSave": true,
        "contextLimit": 5,
        "contextMaxChars": 1200
      }
    ]
  ]
}
```

Sin embargo, hay un detalle importante que poca gente menciona: **OpenCode no auto-actualiza plugins**. Si instalas la versión 0.5 hoy y mañana sale la 0.6 con una corrección de bug que te afecta, tienes que borrar la caché manualmente:

```bash
rm -rf ~/.cache/opencode/node_modules/@knikolov/opencode-plugin-simple-memory
opencode
```

Esto me pasó una vez y me hizo perder veinte minutos preguntándome por qué una feature nueva no aparecía.

### Modelo de Memoria

Cada registro de memoria es una línea logfmt con esta forma:

```
ts=2026-05-28T10:00:00.000Z type=context scope=api content="Remember this" issue=#51 tags=backend,current
```

Campos soportados:

- **`type`**: `decision`, `learning`, `preference`, `blocker`, `context`, `pattern`. Útil para categorizar sin tener que inventarte taxonomía.
- **`scope`**: cadena libre, típicamente algo como `user`, `project`, o un nombre de subsistema (`api`, `tests`, `deploy/staging`).
- **`tags`**: lista separada por comas para filtrado secundario.
- **`content`**: el texto en sí.

Los recuerdos borrados se registran en `deletions.logfmt`, lo cual es un detalle de auditoría que agradezco. Nada de "se ha perdido la memoria" sin trazabilidad.

### Herramientas Expuestas al Agente

El plugin registra nueve tools: `memory_remember`, `memory_recall`, `memory_update`, `memory_forget`, `memory_list`, `memory_export`, `memory_import`, `memory_compact`, `memory_context`. Los nombres son autoexplicativos, y `memory_compact` se puede ejecutar con `dryRun: true` para previsualizar cambios antes de aplicarlos.

### Lo Bueno

- **Auditabilidad extrema**: abres cualquier archivo `.logfmt` en `vim` y entiendes exactamente qué sabe el agente.
- **Cero dependencias externas**: no requiere Python, ni Go, ni Docker, ni conexión a internet después de instalar el paquete npm.
- **Filtros ricos en `memory_recall`**: por scope, type, query, tags, fecha (`since`/`until`), modo de matching (`contains`, `exact`, `prefix`). Esto compensa parcialmente la falta de búsqueda semántica.
- **Portable**: los archivos `logfmt` son trivialmente versionables con Git. Puedes hacer `git diff .opencode/memory/` y ver qué aprendió el agente esta semana.
- **Migración suave**: el formato es compatible hacia atrás. Las entradas antiguas sin comillas siguen siendo legibles.

### Lo No Tan Bueno

- **Sin búsqueda semántica**: si dices "JWT" y antes guardaste "JSON Web Token", no los va a relacionar. Para crecer más allá de unos cientos de memorias vas a notar el límite.
- **Sin multi-agente nativo**: solo OpenCode. Si mañana migras a Claude Code, te toca migrar a mano con `memory_export` / `memory_import` (que soporta `jsonl`, `json` y `logfmt`).
- **El scoring de relevancia es por coincidencia de palabras**: `contextMinScore` es binario, no gradual. Esto hace que las inyecciones automáticas pierdan contexto cuando las memorias usan terminología diferente.

### Veredicto

`simple-memory` es el plugin que recomendaría a alguien que **quiere empezar hoy y no quiere sorpresas**. Si tu proyecto cabe en unos cientos de notas y valoras la auditabilidad por encima de la sofisticación, es difícil de superar.

Yo lo uso como segunda capa: `basic-memory` (que cubriremos en el segundo artículo) maneja mi memoria semántica de proyecto, y `simple-memory` maneja las notas operativas rápidas que no quiero indexar vectorialmente.

---

## 2. opencode-mnemosyne: Offline Total con Binario Go y ONNX

**Repositorio**: [github.com/gandazgul/opencode-mnemosyne](https://github.com/gandazgul/opencode-mnemosyne).
**Autor**: gandazgul.
**Stars**: ~13 (proyecto joven). **Versión activa**: v0.2.4 (abril 2026).
**Lenguaje del plugin**: TypeScript 100%. **Backend**: binario Go independiente en [github.com/gandazgul/mnemosyne](https://github.com/gandazgul/mnemosyne).
**Persistencia**: SQLite con `sqlite-vec` para búsqueda vectorial local.

### Filosofía de Diseño

Mnemosyne es para los que ven un binario de 500MB de modelo descargado y dicen "perfecto, ahora sí". Es el único de los tres que **no depende de ningún servicio cloud** para nada: ni para embeddings, ni para LLM, ni para almacenamiento. Todo corre en tu máquina.

Lo posicionan explícitamente como "la alternativa local/offline a opencode-supermemory". Y lo cumplen.

### Instalación

Aquí es donde Mnemosyne empieza a diferenciarse. No es npm; es un binario Go:

```bash
git clone https://github.com/gandazgul/mnemosyne.git
cd mnemosyne
task install
```

Esto requiere:
- Go 1.21+
- GCC (para compilar sqlite-vec con bindings C)
- `task` (el task runner de Go)

Una vez instalado el binario `mnemosyne` (que está en `path`), el plugin de OpenCode se configura trivialmente:

```json
// ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-mnemosyne"]
}
```

La primera vez que se ejecuta, descarga automáticamente los modelos ML (~500MB one-time, cacheados localmente). Esto es un *showstopper* si tienes ancho de banda limitado, pero un *non-issue* si trabajas siempre desde la misma red.

### Modelo de Memoria

Mnemosyne opera con dos scopes:

- **`project`**: colección nombrada según el directorio del proyecto. Persiste entre sesiones del mismo proyecto.
- **`global`**: colección compartida. Se crea en el primer `memory_store_global`.

Y dos niveles de criticidad por scope:

- **Normal**: memorias que pueden decaer con la compactación del contexto.
- **`core`**: memorias marcadas como críticas que sobreviven a la compactación y siempre están disponibles. La documentación recomienda usarlas con moderación.

El plugin recomienda añadir este bloque al `AGENTS.md` del proyecto para que el agente use memoria de forma proactiva:

```markdown
## Memory (mnemosyne)

- At the start of a session, use memory_recall and memory_recall_global to search for context
  relevant to the user's first message.
- After significant decisions, use memory_store to save a concise summary.
- Delete contradicted memories with memory_delete before storing updated ones.
- Use memory_recall_global / memory_store_global for cross-project preferences.
- Mark critical, always-relevant context as core (core=true) — but use sparingly.
- When you are done with a session, store any memories that you think are relevant
  to the user and the project.
```

Esto es un patrón que me gusta mucho: el plugin define el contrato de uso vía convención, no vía código. El agente decide cuándo guardar basándose en las instrucciones.

### Búsqueda Híbrida Real

Aquí es donde Mnemosyne brilla técnicamente. Combina:

1. **Full-text search** vía SQLite FTS5 con ranking BM25.
2. **Vector search** vía `sqlite-vec` con cosine similarity usando el modelo `snowflake-arctic-embed-m-v1.5`.
3. **Reciprocal Rank Fusion (RRF)** para combinar ambos rankings.

Toda la inferencia ML corre localmente vía ONNX Runtime. Tus memorias nunca tocan la red después de la descarga inicial del modelo. Para mí, que trabajo a menudo desde cafeterías con WiFi compartido, esto es oro puro.

### Hook de Compactación

Un detalle muy interesante: el plugin registra un hook en `experimental.session.compacting` que inyecta instrucciones sobre las herramientas de memoria en el prompt de compactación. Esto significa que **cuando OpenCode compacta el contexto, el agente sabe que todavía tiene memoria disponible** y puede consultar antes de resumir.

### Lo Bueno

- **Privacidad absoluta**: nada sale de tu máquina. Ni siquiera embeddings.
- **Búsqueda híbrida real** sin servicios externos.
- **El hook de compactación** es elegante: integra memoria con el ciclo de vida del contexto.
- **Documentación clara** sobre cuándo usar `core` y cuándo no (con ejemplo concreto: "memorias de un bug crítico conocido").

### Lo No Tan Bueno

- **Curva de instalación más alta**: necesitas Go, GCC y task. Si vienes de Node puro (como yo con muchos proyectos), hay una pequeña fricción inicial.
- **Proyecto joven**: 13 stars es una base de usuarios pequeña. Si encuentras un bug, es posible que tengas que leer el código Go tú mismo.
- **Multi-agente limitado**: solo OpenCode por ahora. El backend binario podría integrarse con otros agentes vía MCP, pero no hay integración oficial fuera de OpenCode.
- **500MB de modelo**: no es enorme, pero en un portátil con SSD pequeño importa.

### Veredicto

Mnemosyne es lo que recomendaría a un paranoico de la privacidad, a alguien que trabaje en modo air-gapped, o a un indie dev que odia las dependencias cloud. Si tu mayor miedo al usar `supermemory` es "¿quién lee mis memorias?", Mnemosyne es tu respuesta. La contrapartida es una instalación más friccionada y una comunidad más pequeña.

---

## 3. true-mem: Psicología Cognitiva Aplicada a Memorias de IA

**Repositorio**: [github.com/rizal72/true-mem](https://github.com/rizal72/true-mem).
**Autor**: rizal72.
**Stars**: ~192. **Versión activa**: v1.4.1 (abril 2026).
**Lenguaje**: TypeScript 100%. **Persistencia**: SQLite vía `bun:sqlite` (con fallback a `node:sqlite` para Node 22+).
**Licencia**: MIT.

### Filosofía de Diseño

`true-mem` es, conceptualmente, el más interesante de los tres. Mientras `simple-memory` apuesta por simplicidad y `Mnemosyne` por privacidad offline, `true-mem` apuesta por **modelar la memoria como si fuera un cerebro humano**.

Su autor se inspira explícitamente en:

- **Curva del olvido de Ebbinghaus**: las memorias episódicas se desvanecen con el tiempo (default 7 días), pero las preferencias y decisiones son permanentes. Como tu cerebro: olvidas qué cenaste el martes pasado pero recuerdas tu color favorito.
- **Modelo de scoring de 7 características**: cada memoria se puntúa por Recencia, Frecuencia, Importancia, Utilidad, Novedad, Confianza e Interferencia. El scoring determina qué memorias se promueven de STM (short-term) a LTM (long-term).
- **Arquitectura dual-store STM/LTM** con promoción automática.
- **Sistema de defensa de 4 capas** contra falsos positivos.
- **Reconsolidación**: cuando nueva información contradice memorias existentes, el sistema decide inteligentemente si fusionar, mantener complementarias o resolver conflicto.

Esto lo convierte, técnicamente, en el plugin más sofisticado de los tres a nivel de **psicología computacional**.

### Instalación

La instalación es trivial, similar a `simple-memory`:

```json
// ~/.config/opencode/opencode.jsonc
{
  "plugin": ["true-mem"]
}
```

OpenCode descarga automáticamente el plugin desde npm. Al primer arranque, crea `~/.true-mem/` con la base de datos SQLite y los logs de debug. Verás una notificación tipo toast confirmando que está cargado.

El archivo de configuración se crea automáticamente en `~/.true-mem/config.jsonc`:

```jsonc
{
  // Storage location: "legacy" = ~/.true-mem/ (default), "opencode" = ~/.config/opencode/true-mem/
  "storageLocation": "legacy",
  // Injection mode: 0 = session start only (recommended), 1 = every prompt
  "injectionMode": 0,
  // Sub-agent mode: 0 = disabled, 1 = enabled (default)
  "subagentMode": 1,
  // Embeddings: 0 = Jaccard similarity only, 1 = hybrid (Jaccard + embeddings)
  "embeddingsEnabled": 0,
  // Maximum memories to inject per prompt (10-50 recommended)
  "maxMemories": 20
}
```

### Modelo de Memoria

`true-mem` clasifica automáticamente las memorias extraídas en:

| Tipo | Decay | Store | Scope | Ejemplo |
|---|---|---|---|---|
| `constraint` | Nunca | STM | Global | "Never use `var`" |
| `preference` | Nunca | STM | Global | "Prefers functional style" |
| `learning` | Nunca | LTM | Global | "Learned bun:sqlite API" |
| `procedural` | Nunca | STM | Global | "Run tests before commit" |
| `decision` | Nunca | LTM | Project | "Decided SQLite over Postgres" |
| `semantic` | Nunca | STM | Project | "API uses REST, not GraphQL" |
| `episodic` | Sí (7d) | STM | Project | "Yesterday we refactored auth" |

La clave aquí es que **las memorias episódicas son las únicas que se desvanecen**. Esto es exactamente lo que hace la memoria humana: recordamos lo importante (preferencias, decisiones, conocimiento técnico) y olvidamos lo mundano (qué comimos ayer).

### Detección Automática con Cuatro Capas de Defensa

Donde `true-mem` brilla especialmente es en **qué decide guardar y qué decide descartar**. A diferencia de `simple-memory` (que solo guarda cuando dices "remember") o `supermemory` (que detecta keywords como "remember this"), `true-mem` corre un clasificador con cuatro capas:

1. **Question Detection**: filtra preguntas antes de clasificar. Si dices "¿Te acuerdas de esto?", no se guarda.
2. **Negative Patterns**: detecta meta-conversación del propio IA ("Goal: The user is trying to..."), selecciones de lista ("I prefer option 3"), y primer persona de recuerdo ("I remember when we fixed that"). Soporta 10 idiomas.
3. **Multi-Keyword + Sentence-Level**: requiere 2+ señales en la misma frase para considerar almacenar.
4. **Confidence Threshold**: solo guarda si el score de confianza es ≥ 0.6.

Esto es importantísimo porque resuelve un problema real: **¿cómo evitas que el agente guarde sus propios pensamientos como si fueran tuyos?** Es el clásico problema de "el agente ha aprendido que le gusta TypeScript" cuando en realidad eras tú diciendo "I prefer TypeScript". El role-aware extraction (`role-patterns.ts`) separa explícitamente mensajes de Human vs Assistant.

### Multilingüe Real

`true-mem` soporta 15 idiomas: inglés, italiano, español, francés, alemán, portugués, holandés, polaco, turco, ruso, y cinco más. Lo he probado en conversaciones mezclando español e inglés, y la clasificación funciona sorprendentemente bien.

El sistema de scope global también es multilingüe: "siempre", "ovunque", "toujours", "immer", "sempre" — todas estas palabras activan el scope global en sus respectivos idiomas.

### Lo Bueno

- **Modelo de memoria más realista**: la combinación de decay + scoring + dual-store refleja cómo funciona la memoria humana. Es el único de los tres donde pensé "esto se siente correcto".
- **Filtros de ruido excelentes**: la detección de meta-talk del IA es algo que he sufrido en otros plugins y aquí está resuelto elegantemente.
- **Multilingüe de verdad**: no es un afterthought. 15 idiomas con patrones nativos.
- **Sin dependencias nativas**: usa `bun:sqlite` (o `node:sqlite`) built-in. No necesitas instalar binarios externos.
- **Embeddings opcionales**: puedes activarlos si quieres (`embeddingsEnabled: 1`), pero por defecto usa Jaccard (más rápido y menos hambriento de recursos).

### Lo No Tan Bueno

- **Solo OpenCode**: al igual que `simple-memory` y `Mnemosyne`, no hay integración nativa con Claude Code, Cursor o Codex.
- **Las inyecciones por defecto son al inicio de sesión** (`injectionMode: 0`). Esto significa que memorias nuevas creadas durante una sesión larga no aparecen hasta que reinicies. La opción de inyectar en cada prompt (`injectionMode: 1`) tiene coste de tokens.
- **Los embeddings son experimentales**: la docu es honesta al respecto. Funcionan, pero el modo Jaccard es el production-stable.
- **El threshold de confianza puede ser estricto**: en mis pruebas, a veces el plugin descarta preferencias válidas porque no superan el 0.6. Ajustable, pero hay que saber que existe.

### Veredicto

`true-mem` es el que recomiendo a quien **quiere el modelo de memoria más sofisticado sin sacrificar la facilidad de uso**. Si te importa que el agente no solo almacene, sino que **priorice** lo almacenado, y que olvide lo que debería olvidar (no lo que debería recordar), es tu plugin.

Lo tengo instalado permanentemente. La diferencia entre esto y `simple-memory` es que con `true-mem` raramente necesito revisar qué guardó, porque el sistema de filtrado es lo bastante bueno.

---

## Tabla Comparativa Rápida

| Característica | simple-memory | Mnemosyne | true-mem |
|---|---|---|---|
| **Stars** | ~124 | ~13 | ~192 |
| **Backend** | Archivos logfmt | Binario Go + SQLite | SQLite (bun:sqlite) |
| **Búsqueda** | Keyword matching | Híbrida FTS5 + vector (ONNX) | Jaccard / embeddings experimentales |
| **Multi-agente** | No (solo OpenCode) | No (solo OpenCode) | No (solo OpenCode) |
| **Instalación** | Trivial (npm) | Media (Go + GCC + task) | Trivial (npm) |
| **Detección auto** | Solo por keyword | Por convención AGENTS.md | Automática con 4 capas |
| **Privacidad** | Total (archivos locales) | Total (binario local) | Total (SQLite local) |
| **Dependencia externa** | Ninguna | 500MB modelo ONNX | Opcional (embeddings) |
| **Modelo de decay** | No | No | Sí (Ebbinghaus) |
| **Curva de aprendizaje** | Baja | Media | Baja-media |
| **Mejor para** | Auditabilidad, Git-friendly | Privacidad total, búsqueda semántica offline | Filtrado de ruido, multilingüe, modelo cognitivo |

---

## Cuándo Usar Cada Uno

Si tuviera que elegir uno para empezar hoy, mi respuesta honesta es: **depende de tu personalidad como desarrollador**.

- **Si valoras la transparencia radical y quieres leer tus memorias en `cat`**: `simple-memory`.
- **Si trabajas en modo air-gapped o con datos sensibles**: `Mnemosyne`.
- **Si quieres que el plugin "piense" por ti sobre qué guardar y qué olvidar**: `true-mem`.

Y si quieres probar varios (como yo), que sepas que **pueden coexistir** porque cada uno escribe en directorios diferentes: `.opencode/memory/` (simple-memory), `<proyecto>` o `global` de Mnemosyne, y `~/.true-mem/` (true-mem). No he encontrado conflictos, aunque obviamente cada plugin tiene su propia base de conocimiento y no se sincronizan entre sí.

---

## Lo Que Viene en el Siguiente Artículo

Estos tres plugins son fantásticos, pero todos tienen una limitación común: **solo funcionan con OpenCode**. Si mañana decides probar Claude Code para un proyecto serio, o Cursor para un quick refactor, o Codex CLI en el servidor de CI, no podrás llevarte la memoria contigo.

En el [segundo artículo de esta serie](/blog/servidores-mcp-memoria-cross-agent) cubrimos los tres servidores MCP cross-agent que he encontrado más maduros: **opencode-supermemory** (cloud-first con auto-compact), **basic-memory** (Markdown + grafo de conocimiento) y **forgetful** (Zettelkasten atómico + entidades + skills). Estos son más infraestructura, pero la versatilidad compensa.

Y en el [tercer artículo](/blog/stack-memoria-persistente-implementacion) te cuento exactamente cómo combino los mejores en mi flujo diario con ejemplos reales de configuración para Claude Code, Codex y OpenCode.

---

## Referencias y Lectura Adicional

- [Repositorio opencode-plugin-simple-memory](https://github.com/ApplauseLab/opencode-plugin-simple-memory)
- [Documentación de OpenCode sobre plugins](https://opencode.ai/docs/config/)
- [opencode-mnemosyne en GitHub](https://github.com/gandazgul/opencode-mnemosyne)
- [Backend binario Mnemosyne](https://github.com/gandazgul/mnemosyne)
- [true-mem en GitHub](https://github.com/rizal72/true-mem)
- [Curva del olvido de Ebbinghaus (Wikipedia)](https://en.wikipedia.org/wiki/Forgetting_curve)
- [Modelo A-MEM: Agentic Memory (arXiv)](https://arxiv.org/abs/2502.12110)
- [Documentación del formato logfmt](https://brandur.org/logfmt)
- [SQLite FTS5 (documentación oficial)](https://www.sqlite.org/fts5.html)
- [Reciprocal Rank Fusion (paper original)](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [Artículo previo: Arquitectura de la Memoria Persistente en Agentes IA](/blog/memoria-persistente-agentes-ia/)
- [Artículo previo: OpenCode Subagentes](/blog/opencode-subagents/)
