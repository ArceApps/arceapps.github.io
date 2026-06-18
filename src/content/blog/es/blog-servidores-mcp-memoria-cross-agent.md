---
title: "Servidores MCP Cross-Agent para Memoria Persistente: supermemory, basic-memory y forgetful a Fondo"
description: "Comparativa técnica exhaustiva de tres servidores MCP multiplataforma para dar memoria persistente a agentes IA: opencode-supermemory (cloud), basic-memory (Markdown + grafo) y forgetful (Zettelkasten atómico). Funcionan con Claude Code, Codex, Cursor y más."
pubDate: 2026-06-18
heroImage: "/images/blog-servidores-mcp-memoria-cross-agent.svg"
tags: ["IA", "Agentes", "Memoria", "MCP", "Claude Code", "Codex", "Cursor", "Indie Dev"]
reference_id: "9c5a0e4f-3a1d-6f7c-ae9a-5d8b4c1e6f3a"
---

> Los plugins nativos de OpenCode que cubrimos en el [artículo anterior](/blog/opencode-plugins-memoria-nativos) son fantásticos para uso personal dentro del ecosistema OpenCode. Pero ¿qué pasa cuando quieres usar Claude Code para una tarea seria, Codex en tu pipeline de CI, o Cursor para un refactor rápido? Si tu memoria vive solo en OpenCode, te toca empezar de cero en cada herramienta. Aquí es donde entran los servidores MCP cross-agent.

---

## Por Qué MCP Cambia las Reglas del Juego

El [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) es el estándar abierto que Anthropic lanzó a finales de 2024 para que herramientas externas (bases de datos, APIs, sistemas de archivos, sistemas de memoria) pudieran integrarse con cualquier agente de codificación que hable el protocolo. Hoy lo soportan nativamente:

- **Claude Code** (vía `claude mcp add`)
- **Claude Desktop** (vía `claude_desktop_config.json`)
- **Codex CLI** (vía `~/.codex/config.toml`)
- **Cursor** (vía `.cursor/mcp.json`)
- **VS Code** (vía configuración MCP nativa)
- **ChatGPT** (Custom GPTs con acciones)
- **Gemini CLI**
- **Copilot CLI**
- **OpenCode** (vía configuración de plugin)
- **Oh My OpenCode**, **Hermes**, **OpenClaw**

Esto significa que un servidor MCP bien escrito funciona con **todos los agentes modernos** sin tener que portar código. Y los tres plugins que cubrimos hoy son exactamente eso: servidores MCP que se conectan a tu memoria persistente.

A diferencia de los plugins nativos (que vimos en el [artículo previo](/blog/opencode-plugins-memoria-nativos)), estos tres proyectos ofrecen infraestructura más seria: embeddings vectoriales, grafos de conocimiento, entidades, proyectos, skills procedurales, y más. La contrapartida es que la instalación es ligeramente más compleja y, en algunos casos, hay componente cloud.

Vamos al lío.

---

## Criterios de Comparación

Estos son los ejes que voy a usar. Son los mismos que en el artículo anterior para que puedas comparar entre las dos familias:

1. **Modelo de persistencia y backend**: archivos + SQLite local, cloud, o ambos. ¿Dónde viven tus memorias?
2. **Multi-agente real**: ¿con cuántos agentes funciona out-of-the-box?
3. **Curva de instalación**: prerrequisitos (Python, uv, Docker), setup de credenciales, primer arranque.
4. **Modelo de memoria**: atómico (un concepto por nota), chunking automático, embeddings, grafo, etc.
5. **Auto-detección y patrones de extracción**: ¿el servidor detecta automáticamente cuándo guardar, o requiere instrucciones explícitas?
6. **Búsqueda y recuperación**: full-text, vector, híbrida, con re-ranking.
7. **Características avanzadas**: entidades, skills, proyectos, planes/tareas, integración con Obsidian.
8. **Madurez del proyecto**: stars, frecuencia de releases, comunidad, casos documentados.

---

## 1. opencode-supermemory: Cloud-First con Auto-Compact Inteligente

**Repositorio**: [github.com/supermemoryai/opencode-supermemory](https://github.com/supermemoryai/opencode-supermemory).
**Autor**: supermemoryai (la empresa detrás de [supermemory.ai](https://supermemory.ai)).
**Stars**: ~1.3k. **Lenguaje**: TypeScript 73%, JavaScript 26%.
**Backend**: API cloud de Supermemory (con opción self-hosted en `localhost:8787`).
**Multi-agente**: Principalmente OpenCode; integrable con otros vía configuración manual.

### Filosofía de Diseño

`opencode-supermemory` es el "enchufa-y-olvídate" del mundo de memoria persistente. Su tesis es: la memoria agéntica es un problema tan difícil que merece una empresa dedicada a resolverlo, y tú como desarrollador indie deberías poder usarlo en 30 segundos sin preocuparte por embeddings, SQLite ni Python.

El backend real es la [API de Supermemory](https://supermemory.ai/docs/integrations/opencode), un servicio comercial que hace el trabajo pesado: embeddings, búsqueda semántica, deduplicación, resúmenes. Tú envías contenido, ellos lo indexan; tú consultas, ellos te devuelven contexto relevante con scoring.

### Instalación

Sorprendentemente simple para ser un producto cloud:

```bash
bunx opencode-supermemory@latest install
bunx opencode-supermemory@latest login
```

El comando `install` registra el plugin en `~/.config/opencode/opencode.jsonc` y crea el comando `/supermemory-init`. El comando `login` abre un flujo OAuth en el navegador para autenticarte.

Para entornos headless (servidores, CI), puedes usar API key directamente:

```bash
export SUPERMEMORY_API_KEY="sm_..."
```

Y opcionalmente crear `~/.config/opencode/supermemory.jsonc` con tu configuración personalizada:

```jsonc
{
  "apiKey": "sm_...",
  "baseUrl": "https://api.supermemory.ai",
  "similarityThreshold": 0.6,
  "maxMemories": 5,
  "maxProjectMemories": 10,
  "maxProfileItems": 5,
  "injectProfile": true,
  "containerTagPrefix": "opencode",
  "compactionThreshold": 0.8
}
```

El campo `baseUrl` es la clave de la portabilidad: apúntalo a tu instancia self-hosted (`http://localhost:8787`) y tienes un setup 100% local.

### Modelo de Memoria: Contenedores

Supermemory organiza memorias en **contenedores** etiquetados. Por defecto:

- **User container**: `{prefix}_user_{sha256(git_email)}`. Sigue al usuario entre proyectos. Si configuras `user.email` en Git (que deberías), tus memorias se sincronizan automáticamente entre máquinas.
- **Project container**: `{prefix}_project_{sha256(directory)}`. Específico del proyecto.

Puedes sobrescribir ambos con tags personalizados (`userContainerTag`, `projectContainerTag`) para, por ejemplo, compartir memorias entre varios miembros de un equipo o sincronizar entre tu laptop y tu desktop.

### Auto-Compactación Preventiva

Esta es la feature estrella del plugin. Cuando el contexto de OpenCode alcanza el 80% de capacidad (`compactionThreshold: 0.8`), el plugin:

1. **Dispara la compactación nativa** de OpenCode.
2. **Inyecta memorias de proyecto relevantes** en el prompt de resumen, para que el agente no pierda el contexto crítico al compactar.
3. **Guarda el resumen de la sesión** como memoria de proyecto.

Esto resuelve elegantemente uno de los problemas más sutiles de los agentes de larga duración: la compactación destruye contexto valioso. Con Supermemory, ese contexto se preserva antes de compactar y se restaura al agente después.

### Codebase Indexing con `/supermemory-init`

Ejecutar `/supermemory-init` lanza un proceso donde el agente **explora tu codebase, identifica patrones arquitectónicos, y los memoriza**. Con un proyecto Kotlin medio (200 archivos, ~50k líneas), tarda unos minutos pero el resultado es notable: en sesiones futuras el agente ya sabe que usas Hilt para DI, Room para persistencia, y que el módulo `:feature:auth` sigue una arquitectura MVVM.

### Keyword Detection y Privacidad

El plugin detecta keywords como "remember", "save this", "don't forget" para auto-guardar. Puedes añadir patrones custom con `keywordPatterns` (regex):

```jsonc
{
  "keywordPatterns": ["log\\s+this", "write\\s+down"]
}
```

Para privacidad, soporta tags `<private>...</private>` que se filtran antes de almacenar. Útil si compartes logs que contienen secretos accidentalmente.

### Lo Bueno

- **Setup de 30 segundos**: es el más rápido de los tres en estar operativo.
- **Auto-compactación inteligente**: la feature que más valor aporta en sesiones largas.
- **Búsqueda semántica robusta**: por la infraestructura de Supermemory, que lleva años en este problema.
- **Sincronización cross-machine automática** via git email hash.
- **Compatible con Oh My OpenCode**: solo hay que desactivar el hook nativo de compactación con `"disabled_hooks": ["anthropic-context-window-limit-recovery"]` en `~/.config/opencode/oh-my-opencode.json`.

### Lo No Tan Bueno

- **Dependencia cloud (por defecto)**: aunque tiene self-hosted, la mayoría de usuarios usarán la versión cloud. Tus memorias viven en sus servidores.
- **Vendor lock-in parcial**: si Supermemory.ai cierra o sube precios dramáticamente, migrar requiere esfuerzo. Aunque `baseUrl` apunta a self-hosted, no todas las features están garantizadas.
- **Solo OpenCode oficialmente**: aunque la API es HTTP estándar, no hay integraciones oficiales pre-empaquetadas con Claude Code, Cursor o Codex.
- **El coste**: aunque tiene free tier, los planes pagos pueden sumar a largo plazo para uso intensivo.
- **Curva de aprendizaje de la API**: configurar `containerTagPrefix` y entender el modelo de contenedores no es trivial.

### Veredicto

`opencode-supermemory` es el plugin que recomendaría a alguien que **quiere resultados inmediatos y no le importa (o prefiere) el componente cloud**. Si tu principal dolor de cabeza es "¿cómo hago para que el agente no pierda contexto entre sesiones largas?", la auto-compactación vale oro. La contrapartida es la dependencia del servicio.

Yo lo uso puntualmente para sesiones largas de refactor donde la compactación es un problema real, pero mantengo `basic-memory` como mi memoria principal por privacidad.

---

## 2. basic-memory: Markdown Bidireccional con Grafo de Conocimiento

**Repositorio**: [github.com/basicmachines-co/basic-memory](https://github.com/basicmachines-co/basic-memory).
**Autor**: basicmachines-co (con oferta cloud opcional en [basicmemory.com](https://basicmemory.com)).
**Stars**: ~3.3k (el más popular de los seis analizados en esta serie).
**Lenguaje**: Python 83%. **Backend**: SQLite (default) o PostgreSQL.
**Licencia**: AGPL-3.0 (con cloud opcional de pago a $15/mes).
**Multi-agente**: Sí, oficialmente — Claude Desktop, Claude Code, Codex, Cursor, VS Code, ChatGPT, Obsidian, Hermes, OpenClaw, Oh My OpenCode.

### Filosofía de Diseño

`basic-memory` es el más filosófico de los tres. Su tesis es: **la memoria de un agente no debería ser una base de datos propietaria; debería ser archivos Markdown que tanto humanos como LLMs puedan leer y escribir**.

Es la culminación de la visión OpenClaw que cubrimos en [La Arquitectura de la Memoria Persistente](/blog/memoria-persistente-agentes-ia/): archivos de texto plano, versionables con Git, editables en Obsidian, consultables vía MCP.

La diferencia es que `basic-memory` añade:
- **Grafo de conocimiento** (observaciones categorizadas + wikilinks).
- **Búsqueda semántica local** (FastEmbed + sqlite-vec).
- **MCP nativo con anotaciones de comportamiento** (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`).
- **Cloud opcional** para sync cross-device.
- **Auto-updates** vía `uv tool`.

### Instalación

El método más simple es vía `uv tool` (Astral's Python package manager):

```bash
uv tool install basic-memory
```

Esto instala el CLI `basic-memory` (alias `bm`). Para conectar con tu agente MCP favorito:

**Claude Desktop** — editar `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"]
    }
  }
}
```

**Claude Code**:
```bash
claude mcp add basic-memory -- uvx basic-memory mcp
```

**Codex CLI** — añadir a `~/.codex/config.toml`:
```toml
[mcp_servers.basic-memory]
command = "uvx"
args = ["basic-memory", "mcp"]
```

**Cursor** — `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "uvx",
      "args": ["basic-memory", "mcp"]
    }
  }
}
```

**VS Code** — en User Settings (JSON):
```json
{
  "mcp": {
    "servers": {
      "basic-memory": {
        "command": "uvx",
        "args": ["basic-memory", "mcp"]
      }
    }
  }
}
```

Lo notable: **el mismo comando (`uvx basic-memory mcp`) funciona con todos los clientes**. Eso es MCP funcionando como se diseñó.

### El Formato Markdown

Cada nota es un Markdown estructurado con observaciones y relaciones:

```markdown
---
title: Coffee Brewing Methods
permalink: coffee-brewing-methods
tags: [coffee, brewing]
---

# Coffee Brewing Methods

## Observations
- [method] Pour over highlights subtle flavors over body
- [technique] Water at 205°F (96°C) extracts optimal compounds
- [principle] Freshly ground beans preserve aromatics

## Relations
- relates_to [[Coffee Bean Origins]]
- requires [[Proper Grinding Technique]]
- affects [[Flavor Extraction]]
```

Las **observaciones** son hechos categorizados con `[categoría]` y opcionalmente etiquetados con `#`. Las **relaciones** son wikilinks `[[Target]]` que forman el grafo.

Lo poderoso: esto es Markdown puro. Lo abres en Obsidian, lo editas en VS Code, lo commiteas en Git, lo buscas con `grep`. Y simultáneamente es una nota semántica estructurada que el agente puede navegar.

### MCP Tools con Anotaciones de Comportamiento

Basic Memory expone herramientas MCP con anotaciones FastMCP 3.0:

- **Content**: `write_note`, `read_note`, `edit_note`, `move_note`, `delete_note`, `read_content`, `view_note`.
- **Search & discovery**: `search`, `search_notes`, `recent_activity`, `list_directory`.
- **Knowledge graph**: `build_context` (navega URLs `memory://`), `canvas` (genera canvas de Obsidian).
- **Projects**: `list_memory_projects`, `create_memory_project`, `get_current_project`, `sync_status`.
- **Schema**: `schema_infer`, `schema_validate`, `schema_diff`.
- **Cloud**: `cloud_info`, `release_notes`.

Las anotaciones `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` permiten a los agentes MCP-aware descubrir capacidades progresivamente sin quemar tokens probando tools. Esto es una mejora sutil pero importante del estándar MCP.

### Proyectos y Routing

Basic Memory soporta **múltiples proyectos** dentro de la misma instalación:

```bash
basic-memory project list
basic-memory project add research ~/research
basic-memory project set-cloud research    # ruta via cloud
basic-memory project set-local research    # vuelve a local
```

Esto te permite tener `~/basic-memory/trabajo`, `~/basic-memory/estudio`, `~/basic-memory/personal`, cada uno con su propio knowledge graph pero accesibles desde el mismo agente.

### Auto-Updates

Una de las features más pulidas: Basic Memory se actualiza solo cada 24 horas cuando se instala vía `uv tool` o Homebrew. Para forzar manualmente:

```bash
basic-memory update
```

Para desactivar:

```jsonc
// ~/.basic-memory/config.json
{ "auto_update": false }
```

Esto es ideal para el desarrollador indie que no quiere mantener manualmente un daemon crítico.

### Integración con Obsidian

La guinda del pastel: **Obsidian lee los mismos archivos directamente**. Apunta Obsidian a `~/basic-memory` y tienes un vault visual con graph view, backlinks, búsqueda nativa, plugins de Obsidian — y simultáneamente accesible vía MCP desde cualquier agente.

Esta es la killer feature. Significa que puedes:
1. Pensar y editar en Obsidian manualmente.
2. El agente lee, escribe y estructura vía MCP.
3. La fuente de verdad es siempre los archivos.

### Lo Bueno

- **El más versátil de los seis**: oficialmente compatible con Claude Code, Codex, Cursor, VS Code, ChatGPT, Obsidian, OpenClaw, Hermes, Oh My OpenCode.
- **Markdown legible y editable por humanos**: cumple la propiedad más importante que pedíamos en el [artículo previo sobre memoria persistente](/blog/memoria-persistente-agentes-ia/).
- **Grafo de conocimiento navegable**: las relaciones `[[wikilinks]]` se vuelven primera clase, no segunda.
- **Búsqueda híbrida real** con FastEmbed + sqlite-vec localmente.
- **Cloud opcional a $15/mes** con sync cross-device.
- **Auto-updates** que funcionan.
- **Anotaciones MCP 3.0** para descubrimiento progresivo.
- **Activo**: 86+ releases, commits frecuentes, comunidad Discord, funding profesional.

### Lo No Tan Bueno

- **Requiere Python 3.12+** vía `uv`. Si tu entorno es Node puro, fricción inicial.
- **AGPL-3.0**: copyleft fuerte. Si quieres hacer un fork comercial o integrarlo en producto propietario, no puedes sin abrir tu código.
- **La complejidad del formato**: observaciones categorizadas + wikilinks es más sofisticado que Markdown puro, pero requiere disciplina para mantenerlo consistente.
- **El CLI tiene 40+ comandos**: curva de aprendizaje no trivial.
- **El cloud opcional es caro** comparado con self-hosted ($15/mes es razonable pero no es gratis).

### Veredicto

`basic-memory` es el que más uso y el que recomiendo como **memoria principal** para desarrolladores indie serios. Su combinación de Markdown legible + grafo semántico + compatibilidad universal MCP es imbatible para un workflow multi-agente real. Si solo pudiera quedarme con uno de los seis plugins analizados en esta serie, sería este.

---

## 3. forgetful: Zettelkasten Atómico con Entidades y Skills

**Repositorio**: [github.com/ScottRBK/forgetful](https://github.com/ScottRBK/forgetful).
**Autor**: ScottRBK.
**Stars**: ~278. **Versión activa**: v0.4.2 (junio 2026).
**Lenguaje**: Python 100%. **Backend**: SQLite (default) o PostgreSQL.
**Multi-agente**: Sí — Claude Code, Claude Desktop, VS Code, Cursor, Codex, Gemini CLI, Opencode, Copilot CLI.

### Filosofía de Diseño

`forgetful` es el más opinionated de los tres. Mientras `basic-memory` abraza Markdown libre y `supermemory` externaliza todo a la nube, `forgetful` toma una posición firme: **la memoria agéntica funciona mejor si imitamos el método Zettelkasten**.

El método Zettelkasten (literalmente "caja de notas" en alemán) es un sistema de notas atómicas donde cada nota contiene **un solo concepto**, está autocontenida, y se conecta a otras notas por similitud semántica o referencia explícita. Niklas Luhmann, el sociólogo alemán que lo popularizó, usó este sistema para escribir más de 70 libros y 400 artículos académicos.

La tesis de `forgetful` es: **si los humanos producen mejor conocimiento con notas atómicas, los agentes también deberían almacenar memorias atómicas**. Cada memoria es ~300-400 palabras sobre un solo concepto, con título claro (límite 200 chars), contexto explícito, keywords y tags.

### Instalación

La instalación es la más simple de los tres a nivel conceptual:

```bash
# Opción 1: directo con uvx (sin instalación)
uvx forgetful-ai

# Opción 2: instalar globalmente
uv tool install forgetful-ai
forgetful

# Opción 3: Docker para producción
cd docker
cp .env.example .env
docker compose -f docker-compose.sqlite.yml up -d
```

Datos almacenados en ubicaciones platform-appropriate: `~/.local/share/forgetful` en Linux/Mac, `AppData` en Windows.

Para conectar con agentes, el patrón MCP estándar:

```json
{
  "mcpServers": {
    "forgetful": {
      "type": "stdio",
      "command": "uvx",
      "args": ["forgetful-ai"]
    }
  }
}
```

O vía HTTP si usas Docker:

```json
{
  "mcpServers": {
    "forgetful": {
      "type": "http",
      "url": "http://localhost:8020/mcp"
    }
  }
}
```

### La Arquitectura de Meta-Tools

Lo más original de `forgetful` es su **patrón de meta-tools**: en lugar de exponer 42 tools individuales al agente (consumiendo tokens valiosos), expone solo 3:

- **`execute_forgetful_tool(tool_name, args)`** — el meta-tool que despacha a cualquiera de las 42 herramientas reales.

Esta es una decisión de diseño brillante desde el punto de vista del **presupuesto de tokens del contexto**. Si cada tool MCP consume ~100 tokens de descripción y `forgetful` tiene 42 tools, son 4200 tokens gastados solo en definiciones. Con meta-tools, son ~300 tokens y el agente despacha dinámicamente.

### Las 42 Herramientas Reales

Agrupadas en 7 categorías:

- **Memory Tools** (7): create, query, update, link, mark obsolete.
- **Project Tools** (5): organizar conocimiento por contexto/scope.
- **Entity Tools** (15): trackear personas, organizaciones, dispositivos; construir grafos de conocimiento.
- **Code Artifact Tools** (5): almacenar snippets de código reutilizables.
- **Document Tools** (5): almacenar contenido long-form (>400 palabras).
- **Skill Tools** (10): memoria procedural con búsqueda semántica e import/export en formato Agent Skills SKILL.md.
- **User Tools** (2): perfil y autenticación.

Las **Skill Tools** son particularmente interesantes: importan y exportan en el formato [`SKILL.md`](https://agentskills.io), lo que significa que forgetful puede ser un repositorio centralizado de skills procedurales que luego distribuyes a múltiples agentes.

### Auto-Linkado Semántico: El Cerebro del Grafo

Cuando creas una memoria, `forgetful`:

1. **Genera el embedding** localmente con FastEmbed (modelo `BAAI/bge-small-en-v1.5`, 384 dimensiones).
2. **Busca memorias similares** con threshold ≥ 0.7.
3. **Auto-linka** las top 3-5 matches (configurable con `MEMORY_NUM_AUTO_LINK`).
4. **Crea un grafo navegable** automáticamente.

El auto-linkado es lo que distingue a `forgetful` de una simple base vectorial. Es el equivalente algorítmico de "esta idea me recuerda a esta otra". Y se acumula: con el tiempo, tu knowledge graph crece orgánicamente sin que tengas que mantener relaciones manualmente.

### Entidades: Personas, Organizaciones, Dispositivos

Forgetful introduce **entidades tipadas** que no son memorias:

- **Individual**: una persona (Jordan Taylor, Backend Engineer).
- **Organization**: una empresa o equipo.
- **Team**: un grupo dentro de una organización.
- **Device**: un servidor o servicio.

Las entidades tienen **relaciones direccionales** con metadatos:

```
Jordan Taylor --works_for--> TechFlow Systems
  metadata: { role: "Backend Engineer II", department: "Payments", start_date: "2025-01-20" }
```

Y se pueden linkear a memorias específicas. Esto crea un grafo de dos niveles:

```
Memory ──linked_to──> Entity
Memory ──auto_link──> Memory (semantic similarity)
Entity ──relates_to──> Entity
```

Esto es conceptualmente similar al modelo de Cognee (que cubrimos en el [artículo de memoria persistente](/blog/memoria-persistente-agentes-ia/)) pero implementado en una librería standalone Python.

### Reranking con Cross-Encoder

Para mejorar la precisión de retrieval, `forgetful` usa **cross-encoder reranking** además del embedding search inicial. La pipeline es:

1. **Dense retrieval** (embeddings) → top 50 candidatos.
2. **Sparse retrieval** (BM25) → top 50 candidatos.
3. **Reciprocal Rank Fusion (RRF)** → combina ambos.
4. **Cross-encoder reranking** → reordena los top 20 con scoring más fino.

Todo localmente vía FastEmbed. Cero llamadas a la nube.

### Lo Bueno

- **Modelo atómico Zettelkasten**: conceptualmente el más correcto. Notas pequeñas, autocontenidas, linkables.
- **Meta-tools pattern**: brillante para presupuesto de tokens.
- **42 herramientas reales** accesibles bajo demanda.
- **Auto-linkado semántico** que construye el grafo orgánicamente.
- **Entidades + relaciones**: modelado rico del mundo real.
- **Skill Tools con formato Agent Skills** estándar.
- **Cross-encoder reranking** local para retrieval de alta precisión.
- **Standalone**: corre como servidor MCP independiente, integrable con cualquier cliente.

### Lo No Tan Bueno

- **El formato atómico requiere disciplina**: cada memoria debe ser un solo concepto. Almacenar documentos largos (>400 palabras) requiere extraer 3-7 memorias atómicas manualmente. Es trabajo extra, pero a cambio tienes mejor retrieval.
- **Solo Python**: si tu entorno es Node puro, fricción inicial.
- **Documentación dispersa**: tienen 11 documentos Markdown en `/docs` pero la navegación entre ellos no es trivial. Hay que leer varios para entender todas las capacidades.
- **La búsqueda inicial es por keyword/semántica**: no hay filtros por fecha o scope en el meta-tool. Tienes que especificar los filtros en cada llamada.
- **Menos popular** que `basic-memory` (278 vs 3300 stars), aunque más maduro técnicamente.

### Veredicto

`forgetful` es el que recomiendo para quienes **quieren el modelo de memoria más rico conceptualmente**. Si te atrae la idea de un grafo de conocimiento atómico con auto-linkado semántico y entidades tipadas, es tu servidor MCP. La contrapartida es que requiere más disciplina para mantener el formato atómico.

Yo lo uso como capa de **memoria procedural**: almaceno skills (procedimientos paso-a-paso) en `forgetful` y los distribuyo a múltiples agentes vía el formato SKILL.md.

---

## Tabla Comparativa Rápida

| Característica | opencode-supermemory | basic-memory | forgetful |
|---|---|---|---|
| **Stars** | ~1.3k | ~3.3k | ~278 |
| **Backend** | Cloud API (+ self-hosted opcional) | SQLite local (Postgres opcional) | SQLite local (Postgres opcional) |
| **Multi-agente oficial** | OpenCode (+ manual en otros) | Amplio: Claude, Codex, Cursor, VS Code, ChatGPT | Amplio: Claude, Codex, Cursor, Gemini, Copilot |
| **Instalación** | `bunx` (1 min) | `uv tool install` (2 min) | `uv tool install` o Docker |
| **Modelo de memoria** | Contenedores con scope user/project | Markdown libre con grafo | Notas atómicas con auto-link |
| **Búsqueda** | Vector semántica en cloud | Híbrida local (FTS + FastEmbed) | Híbrida local con cross-encoder reranking |
| **Grafo** | No | Sí (wikilinks + observaciones) | Sí (auto-link semántico + entidades) |
| **Skills procedurales** | No | No | Sí (formato SKILL.md) |
| **Entidades** | No | No | Sí (Individual, Org, Team, Device) |
| **Cloud opcional** | Sí (es la base) | $15/mes en basicmemory.com | No |
| **Privacidad** | Depende del backend | Local-first | Local-first |
| **Curva de aprendizaje** | Baja | Media | Alta |
| **Mejor para** | Quick start, auto-compact, sesiones largas | Markdown + grafo, multi-agente universal | Zettelkasten atómico, memoria procedural |

---

## Cuándo Usar Cada Uno

- **Si quieres empezar en 5 minutos y prefieres cloud**: `opencode-supermemory`.
- **Si quieres el equilibrio entre potencia, multi-agente y editabilidad humana**: `basic-memory`.
- **Si quieres el modelo de memoria más rico conceptualmente y no te importa la disciplina**: `forgetful`.

Mi setup personal, si te interesa: **basic-memory como memoria principal** (Markdown editable, grafo, multi-agente), **forgetful como capa de skills procedurales** (importo/exporto SKILL.md entre agentes), y **opencode-supermemory puntualmente** para sesiones largas donde la auto-compactación es crítica.

Los tres pueden coexistir sin conflictos: cada uno usa su propio puerto MCP y su propia base de datos.

---

## Lo Que Viene en el Siguiente Artículo

Ahora que tienes el mapa completo de las dos familias de plugins (nativos OpenCode y MCP cross-agent), en el [tercer artículo de esta serie](/blog/stack-memoria-persistente-implementacion) entro al detalle del día a día: cómo combino `basic-memory` + `forgetful` + `opencode-supermemory` en mi flujo real con Claude Code, Codex y OpenCode, con ejemplos concretos de configuración, scripts de mantenimiento, y casos de uso reales en proyectos Kotlin y Astro.

---

## Referencias y Lectura Adicional

- [Repositorio opencode-supermemory](https://github.com/supermemoryai/opencode-supermemory)
- [Documentación oficial de Supermemory](https://supermemory.ai/docs/integrations/opencode)
- [Repositorio basic-memory](https://github.com/basicmachines-co/basic-memory)
- [Documentación de basic-memory](https://docs.basicmemory.com/)
- [Repositorio forgetful](https://github.com/ScottRBK/forgetful)
- [Especificación del Model Context Protocol](https://modelcontextprotocol.io/)
- [FastMCP framework (usado por forgetful)](https://github.com/jlowin/fastmcp)
- [FastEmbed (embeddings locales)](https://github.com/qdrant/fastembed)
- [Método Zettelkasten (Wikipedia)](https://en.wikipedia.org/wiki/Zettelkasten)
- [Paper A-MEM: Agentic Memory (arXiv)](https://arxiv.org/abs/2502.12110)
- [pgvector (extensión vectorial para Postgres)](https://github.com/pgvector/pgvector)
- [Agent Skills specification](https://agentskills.io)
- [Artículo previo: Plugins nativos de OpenCode](/blog/opencode-plugins-memoria-nativos/)
- [Artículo previo: Arquitectura de la Memoria Persistente en Agentes IA](/blog/memoria-persistente-agentes-ia/)
