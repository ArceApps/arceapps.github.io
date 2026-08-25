# Bitácora de Scribe 📝

Registro de actividades del redactor técnico del blog de ArceApps. Producción de artículos bilingües (ES/EN), generación de imágenes de portada y documentación de proyectos.

---

## 2026-08-26 — Artículo Issue #388: "Mem0 y MemGPT: Stack de Memoria Cognitiva para Agentes IA"

**Estado:** ✅ Artículo escrito, SEO corregido (`description` recortada a 140-143 chars), pendientes 7 SVGs en `public/images/`. Pendiente `pnpm build` para validación Zod final. **NO publicado** — pasa a Gate UA para revisión del user antes de commit/push.

**Tema (de issue #388 — Memoria/Permanente):**
Arquitecturas cognitivas y sistemas de memoria persistente para agentes de IA, integrando los cuatro pilares que el prior art del blog cubre por separado: extracción y deduplicación automáticas (Mem0), paginación tipo sistema operativo (MemGPT/Letta), ontología espacial legible (método PARA de Tiago Forte) y elección informada entre Chroma y LanceDB. Cierra con LangChain `create_agent` como orquestador. El ángulo diferenciador vs `memoria-persistente-agentes-ia` (panorama), `metodo-memoria-ia-archivos` (PARA aislado), `stack-memoria-persistente-implementacion` (mi stack anterior), `servidores-mcp-memoria-cross-agent`, `hmem-sqlite-memoria-jerarquica-agentes`, `hipocampus-memoria-jerarquica-agentes` y `plugmem-microsoft-memoria-agentes` (alternativas) es **la integración accionable**: cómo un indie dev monta los cuatro pilares en una sola arquitectura coherente que arranca en una tarde, escala sin saltos, y corre sin vendor lock-in.

**Investigación primaria verificada (WebFetch vía subagente `explore`):**

| Fuente | Datos verificados |
|---|---|
| mem0.ai + docs.mem0.ai | API Python de `MemoryClient` (`add`/`search`/`update`/`batch_update`); pipeline de extracción (context lookup → fact extraction → dedup+embedding → entity extraction); algoritmo v3 abril 2026 (92.5 LoCoMo, 94.4 LongMemEval, 64.1 BEAM 1M); tres almacenes (SQL/Vector/Entity). |
| arXiv:2310.08560 (MemGPT) | Paper original de Packer et al., UC Berkeley, oct-2023. Benchmarks DMR GPT-4 32.1% → 92.5% con MemGPT; nested KV retrieval colapse de baselines a 0% en nivel 3 sin MemGPT, estable con MemGPT. |
| docs.letta.com | Comandos `/init`, `/remember`, `/sleeptime`, `/doctor`; MemFS como filesystem git-backed con `system/`, `reference/`, `skills/`; 24.4k estrellas en `letta-ai/letta`. |
| docs.langchain.com | API actual `create_agent` sobre LangGraph con `SqliteSaver`/`PostgresSaver`; Deep Agents con virtual filesystem + automatic context compression + subagent spawning. |
| docs.trychroma.com + lancedb.github.io | API Python verificada de `chromadb.Client` + `collection.add/query`; API LanceDB `lancedb.connect` + `table.add/search` + `LanceHybridQueryBuilder` (vector + BM25 + SQL-like). |
| zilliz.com/comparison/chroma-vs-lancedb | Tabla comparativa con estrellas GitHub (Chroma 29k, LanceDB 11k), licencia Apache 2.0 para ambos, escalabilidad (Chroma decenas/cientos de miles; LanceDB decenas/cientos de millones). |
| fortelabs.com/blog/para | Definición canónica de Projects / Areas / Resources / Archives; principio de actionability; trampa Project vs Area. |

**Outputs producidos:**

| Archivo | Tipo | Contenido |
|---|---|---|
| `src/content/blog/es/mem0-memgpt-agent-memory-stack.md` | Artículo | 6306 palabras, 10 secciones (Gancho → Contexto → 5 Deep Dives → Lecciones → Bibliografía → Cierre) |
| `src/content/blog/en/mem0-memgpt-agent-memory-stack.md` | Artículo (nativo, no traducción) | 6049 palabras, misma estructura bilingüe |
| `public/images/mem0-memgpt-agent-memory-stack.svg` | Hero | 1200x630, fondo `#0F172A`, gradientes teal+orange, MEM0/MemGPT/PARA/Chroma&LanceDB en grid |
| `public/images/memory-taxonomy-es.svg` | Infografía ES | Taxonomía 5 categorías (Episódica / Semántica / Procedural / Corto plazo / Largo plazo) |
| `public/images/memory-taxonomy-en.svg` | Infografía EN | Taxonomía bilingüe (Episodic / Semantic / Procedural / Short-term / Long-term) |
| `public/images/memgpt-virtual-context-es.svg` | Infografía ES | Main context (System/Working/FIFO) + External context (Recall/Archival) con arrows de function calls |
| `public/images/memgpt-virtual-context-en.svg` | Infografía EN | Misma arquitectura, etiquetas en inglés |
| `public/images/consolidation-pipeline-es.svg` | Infografía ES | Pipeline 7 pasos (write→chunk→embed→store→retrieve→update→consolidate) con feedback al agente |
| `public/images/consolidation-pipeline-en.svg` | Infografía EN | Mismo pipeline, etiquetas en inglés |

**SEO (auditoría `write-blog-seo`):**

| Campo | ES | EN | Resultado |
|---|---|---|---|
| title (chars) | 57 | 51 | PASS (≤60) |
| tool name primeras 5 palabras | "Mem0 y MemGPT" | "Mem0 & MemGPT" | PASS |
| slug | `mem0-memgpt-agent-memory-stack` | (mismo) | PASS (kebab, sin stopwords, sin `blog-`/`-es`/`-en`) |
| keywords (count) | 8 | 8 | PASS (3-8) |
| description (chars) | 140 | 143 | PASS (120-160, **corregido desde 177/167**) |
| canonical URL | `https://arceapps.com/es/blog/mem0-memgpt-agent-memory-stack/` | `https://arceapps.com/blog/mem0-memgpt-agent-memory-stack/` | PASS |
| pubDate / lastmod | 2026-08-26 | 2026-08-26 | PASS (igual, fecha real del sistema) |
| lastmod ≥ pubDate | OK | OK | PASS |
| reference_id | `1b17a401-c962-4e13-a24b-f0b4034f3597` (UUID v4) | (mismo, par i18n) | PASS |
| pnpm build | pendiente | pendiente | bloqueante |

**Prior art enlazado (10+ artículos ES + 10+ EN):**
ES — `memoria-persistente-agentes-ia`, `metodo-memoria-ia-archivos`, `stack-memoria-persistente-implementacion`, `servidores-mcp-memoria-cross-agent`, `hmem-sqlite-memoria-jerarquica-agentes`, `hipocampus-memoria-jerarquica-agentes`, `plugmem-microsoft-memoria-agentes`, `memoria-seguridad-privacidad-agentica`, `obsidian-desarrolladores`, `opencode-plugins-memoria-nativos`, `opencode-subagents`.
EN — `ai-agent-memory-persistence-guide`, `para-method-file-based-ai-memory`, `persistent-memory-stack-implementation`, `mcp-servers-memory-cross-agent`, `hmem-sqlite-hierarchical-memory-agents`, `hipocampus-hierarchical-memory-agents`, `plugmem-microsoft-agent-memory`, `memory-security-privacy-agentic`, `obsidian-developer-guide`, `opencode-memory-plugins-native`, `opencode-subagents`.

**Decisiones de diseño aplicadas:**

- Tono "Espíritu Indie": ejemplos concretos (Norvig vs DLX, app Sudoku), jerga artesanal, sin lenguaje corporativo.
- Cero emojis en el cuerpo del artículo (no fueron pedidos).
- Sin comentarios en código.
- Bibliografía con 35 entradas verificadas (URLs primarias de mem0.ai, arxiv, docs.letta.com, docs.langchain.com, chroma, lancedb, fortelabs, modelcontextprotocol + 11 enlaces al prior art interno).
- 7 SVGs con paleta de marca exacta (`#018786` + `#FF9800` + fondo oscuro/claro) y dimensiones 1200x630 (Open Graph).
- Slug único para ES y EN (no sufijo `-es`/`-en`), con `canonical` separado por idioma apuntando a URLs absolutas.

**Próximos pasos:**
1. `pnpm build` para validar schema Zod (referencias internas, frontmatter).
2. Si falla por algún path incorrecto: fix y re-build.
3. Gate UA: notificación al user con resumen ejecutivo + opción de commit/push.

---
