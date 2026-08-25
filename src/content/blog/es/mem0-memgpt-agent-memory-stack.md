---
title: "Mem0 y MemGPT: Stack de Memoria Cognitiva para Agentes IA"
description: "Construye un stack de memoria cognitiva para agentes IA con Mem0, MemGPT/Letta, PARA y Chroma o LanceDB. Arquitectura accionable con código."
pubDate: 2026-08-25
lastmod: 2026-08-25
author: ArceApps
keywords:
  - "Mem0"
  - "MemGPT"
  - "Letta"
  - "Memoria Persistente"
  - "Agentes IA"
  - "Chroma"
  - "LanceDB"
  - "Vector DB"
canonical: "https://arceapps.com/es/blog/mem0-memgpt-agent-memory-stack/"
heroImage: "/images/mem0-memgpt-agent-memory-stack.svg"
tags:
  - "IA"
  - "Agentes"
  - "Memoria"
  - "Mem0"
  - "MemGPT"
  - "Letta"
  - "Vector DB"
  - "PARA"
category: ai-agents
reference_id: "1b17a401-c962-4e13-a24b-f0b4034f3597"
---

> Este artículo es la pieza central de mi cobertura sobre **memoria persistente para agentes IA** que vengo publicando durante 2026. Integra y lleva más lejos lo que ya conté en posts anteriores: el **panorama general de frameworks** ([memoria persistente para agentes IA](/es/blog/memoria-persistente-agentes-ia/)), el **método PARA aplicado a archivos de agente** ([método de memoria en archivos para IA](/es/blog/metodo-memoria-ia-archivos/)), los **servidores MCP de memoria cross-agent** ([servidores MCP de memoria cross-agent](/es/blog/servidores-mcp-memoria-cross-agent/)), mi **stack real con basic-memory y supermemory** ([stack de memoria persistente implementación](/es/blog/stack-memoria-persistente-implementacion/)), y los **enfoques jerárquicos como hmem e Hipocampus** ([hmem: memoria jerárquica SQLite](/es/blog/hmem-sqlite-memoria-jerarquica-agentes/), [Hipocampus: memoria jerárquica](/es/blog/hipocampus-memoria-jerarquica-agentes/)). Si vienes de alguno de esos posts, este artículo es el siguiente paso natural: montar los cuatro pilares en una arquitectura coherente. Si llegas de nuevo, te recomiendo leer primero el [panorama general](/es/blog/memoria-persistente-agentes-ia/) para tener vocabulario común.

---

## El jueves a las once de la noche

Son las once de la noche de un jueves cualquiera. Llevo dos horas afinando el algoritmo de Norvig en el solver de mi app Android de Sudoku: una variante que intercambia `DLX` (Algorithm X con dancing links) por backtracking con poda heurística porque la heurística MRV me estaba dando resultados horribles en tableros de 16x16. Le he explicado al agente diecisiete veces por qué descarté DLX, diecisiete veces por qué `prune=true` solo funciona cuando la cola de candidatos está ordenada por restricción dominante, y diecisiete veces qué columnas del sudoku 9x9 tienen mayor densidad de restricciones y por qué a partir de ahí todo encaja.

Mañana, cuando abra sesión, el agente no va a tener la menor idea.

Cada contexto nuevo es una pizarra en blanco. Esa es la **fatiga de contexto** que persigue a cualquier desarrollador indie que trabaja con LLMs más de un par de horas. Y eso, cuando estás en medio de un problema con densidad alta de decisiones, es desmoralizador: te das cuenta de que toda la conversación de las últimas dos horas es incinerable. El estado mental que has construido con el modelo, las heurísticas que el modelo entendió, los "ya lo discutimos y descartamos X", **todo se evapora al cerrar la pestaña**.

La pregunta que abre este artículo no es técnica. Es artesanal. Es la pregunta que un artesano del software se hace cuando mira su mesa de trabajo y decide qué herramientas merece la pena tener en ella para los próximos meses:

> **¿Qué necesitan mis herramientas para que mi próximo yo — y mi próximo agente — no tenga que re-explicarlo todo cada mañana?**

Durante 2026 he publicado varios artículos cubriendo piezas sueltas de la respuesta. Mem0 por un lado, el método PARA por otro, servidores MCP concretos, propuestas jerárquicas tipo hmem o Hipocampus, e incluso aproximaciones académicas como PlugMem de Microsoft Research. Faltaba la pieza que las une: **una arquitectura cognitiva completa que puedas montar en una tarde**, que arranque con poco, que escale sin saltar al siguiente hype, y que pueda correr en tu laptop sin vendor lock-in.

Eso es lo que voy a desgranar aquí. Cuatro pilares, en este orden: **Mem0** para extracción y deduplicación automática de hechos, **MemGPT/Letta** para paginación tipo sistema operativo, **método PARA** como ontología espacial legible, y **Chroma o LanceDB** como vector store concreto. Después, **LangChain** `create_agent` o LangGraph como orquestador. Lo que sigue es práctica, código verificado y números concretos.

---

## Contexto: qué es memoria cognitiva y por qué no es solo contexto

Antes de entrar en los frameworks, conviene fijar el vocabulario. Cuando un desarrollador indie dice "memoria", puede significar cuatro cosas muy distintas, y no son intercambiables.

**Contexto** es lo que cabe en la ventana del modelo: los tokens que el LLM ve ahora. En 2026 los modelos frontera ofrecen ventanas de 128k a 200k tokens, y algunos rozan el millón, pero esa cifra sigue siendo una fracción de lo que un humano acumula en seis meses con su asistente. Y lo peor: cada nueva sesión parte de cero, así da igual cuánto contexto metas en la ventana si la siguiente sesión no se acuerda.

**Memoria** es estado persistente entre sesiones. Puede vivir en un archivo plano, en una base de datos SQL, en un vector store, en un grafo, o en una mezcla de los anteriores. La pregunta no es dónde vive, sino **qué vive ahí, quién decide qué se guarda, y cómo se recupera justo a tiempo**.

**Memoria cognitiva** es el subconjunto que no solo persiste sino que **se estructura para imitar cómo recuerda un humano**: clasifica, deduplica, prioriza, olvida. Y olvida selectivamente: hay recuerdos que conviene consolidar y otros que conviene archivar bajo demanda.

**Memoria agéntica** es memoria cognitiva expuesta como herramientas (`tools`) que un agente puede llamar. Si la memoria cognitiva es la biblioteca bien organizada, la memoria agéntica es la biblioteca con un bibliotecario disponible 24/7.

Una arquitectura cognitiva completa combina las cuatro. La taxonomía de recuerdos que suelo usar cuando diseño una tiene cinco entradas, y es la que voy a usar para clasificar cada framework:

![Taxonomía de memoria agéntica: Episódica, Semántica, Procedural, Corto plazo y Largo plazo, todas alimentando un stack común de agente.](/images/memory-taxonomy-es.svg)

- **Memoria episódica**: hechos autobiográficos del usuario y del agente. *"El usuario prefiere DLX en tableros 9x9 pero no en 16x16 porque la densidad de restricciones cambia la heurística."*
- **Memoria semántica**: conocimiento estable del mundo y del dominio. *"La librería `kotlinx.coroutines` está en versión 1.9.0."*
- **Memoria procedural**: habilidades, workflows, comandos. *"Siempre usar `pnpm` para instalar dependencias en este repo."*
- **Memoria de corto plazo**: sesión actual, working context, hechos recién mencionados.
- **Memoria de largo plazo**: conocimiento consolidado y deduplicado que sobrevive semanas o meses.

Los frameworks buenos no se casan con una sola categoría. Manejan varias a la vez. Los frameworks malos solo simulan memoria de corto plazo con un buffer de mensajes.

Ahora, los cuatro pilares.

---

## Pilar 1: Mem0 — extracción y deduplicación automáticas

**Mem0** ([mem0.ai](https://mem0.ai), repositorio [mem0ai/mem0](https://github.com/mem0ai/mem0), paper [arXiv:2504.19413](https://arxiv.org/abs/2504.19413)) se posiciona en el mercado como "la capa universal de memoria para agentes IA". Su propuesta es simple en superficie y profunda debajo: **tú le pasas mensajes crudos, Mem0 extrae los hechos duraderos, los deduplica contra los que ya tiene, los embebe y los guarda**. Tres operaciones primitivas y un motor que las orquesta.

### Las tres operaciones primitivas

Verificadas en [`docs.mem0.ai/platform/quickstart`](https://docs.mem0.ai/platform/quickstart):

```python
from mem0 import MemoryClient

client = MemoryClient(api_key="your-api-key")

messages = [
    {"role": "user",      "content": "I'm vegetarian and allergic to nuts."},
    {"role": "assistant", "content": "Got it! I'll remember your dietary preferences."}
]

result = client.add(messages, user_id="user123")
# Devuelve una lista de memorias extraídas:
# [
#   {"id": "...", "memory": "Is a vegetarian",     "event": "ADD"},
#   {"id": "...", "memory": "Allergic to nuts",    "event": "ADD"}
# ]
```

`search` recupera memorias relevantes con un score combinado semántico + keyword + entity + temporal:

```python
results = client.search(
    "What are my dietary restrictions?",
    filters={"user_id": "user123"}
)
# Cada resultado trae: id, memory, user_id, categories, created_at, score, metadata
```

`update` corrige sin perder el `memory_id`, y existe un `batch_update` para procesar hasta mil memorias en una sola llamada ([docs.mem0.ai/core-concepts/memory-operations/update](https://docs.mem0.ai/core-concepts/memory-operations/update)):

```python
client.update(
    memory_id="14e1b28a-2014-40ad-ac42-69c9ef42193d",
    text="Allergic to tree nuts and peanuts (severity: anaphylactic)",
    metadata={"category": "health", "severity": "high"}
)

update_memories = [
    {"memory_id": "id1", "text": "Watches football"},
    {"memory_id": "id2", "text": "Likes to travel"}
]
client.batch_update(update_memories)
```

Eso es la superficie. Lo potente es lo que pasa por debajo.

### El pipeline de extracción

Según [`docs.mem0.ai/core-concepts/how-it-works`](https://docs.mem0.ai/core-concepts/how-it-works), cuando llamas a `add(messages)` Mem0 ejecuta cuatro pasos en cadena:

1. **Context lookup**: primero busca memorias existentes relacionadas con el usuario. Si ya tiene "le gusta el café solo", antes de añadir "prefiere café descafeinado" lo lee y razona sobre si actualizar la primera o crear una nueva.
2. **Fact extraction**: un LLM extractor (configurable, `gpt-5-mini` por defecto en Platform) analiza el par user/assistant y emite una lista de hechos duraderos. No memoriza "preguntó sobre DLX", memoriza "el usuario descarta DLX para tableros grandes por densidad de restricciones".
3. **Deduplication and embedding**: cada hecho nuevo se compara con los existentes. Si es duplicado, se actualiza; si es nuevo, se embebe y se guarda.
4. **Entity extraction**: en Platform se extraen también entidades (personas, herramientas, proyectos) y se construye un **grafo de memoria** que potencia el retrieval.

Tres almacenes separados almacenan el resultado: **SQL** para hechos y metadatos, **vector store** para embeddings, **entity store** para el grafo. La retrieval fusiona las señales de los tres. Esto explica por qué Mem0 maneja bien consultas de tipo *"¿qué dijo el usuario sobre la heurística MRV en sesiones previas?"*: una consulta semántica pura fallaría, pero la capa de entity linking sabe que "MRV" es la misma entidad que mencionaste como "Minimum Remaining Values" en otra sesión.

### El algoritmo v3 (abril 2026)

En abril de 2026 Mem0 publicó su tercera iteración, según el [README oficial](https://github.com/mem0ai/mem0). Tres cambios estructurales:

- **Extracción single-pass ADD-only**: en lugar del clásico `add` + eventual `update`/`delete`, ahora Mem0 añade hechos sin sobrescribir. Esto simplifica la deduplicación y mejora la trazabilidad.
- **Entity linking con embedding propio**: cada entidad tiene su propio vector, no comparte embedding con el hecho donde se menciona. Eso permite que el retrieval haga boosting cuando una consulta menciona explícitamente una entidad.
- **Temporal reasoning**: el extractor codifica relaciones temporales (*"X ocurrió antes que Y"*, *"el usuario cambió de opinión sobre Z en marzo"*).

Los números del benchmark reportados por el README son los que más me impresionaron: **92.5 en LoCoMo** (+21 puntos sobre el algoritmo anterior), **94.4 en LongMemEval** (+27 puntos), **64.1 en BEAM a escala 1M tokens**, con latencia p50 por debajo de 1.1 segundos. Esto es importante porque sitúa a Mem0 en territorio de **infraestructura de producción**, no de prototipo académico.

### El loop completo en tu propio agente

El patrón canónico de uso combina Mem0 con un LLM externo (lo copio del [README de mem0ai/mem0](https://github.com/mem0ai/mem0) con mínimos retoques para mi flujo):

```python
from openai import OpenAI
from mem0 import Memory

openai_client = OpenAI()
memory = Memory()

def chat_with_memories(message: str, user_id: str = "default_user") -> str:
    relevant_memories = memory.search(
        query=message,
        filters={"user_id": user_id},
        top_k=3
    )
    memories_str = "\n".join(
        f"- {entry['memory']}" for entry in relevant_memories["results"]
    )

    system_prompt = (
        "Eres un asistente útil. Responde basándote en la consulta y "
        f"las memorias del usuario.\n\nMemorias:\n{memories_str}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": message},
    ]

    response = openai_client.chat.completions.create(
        model="gpt-5-mini",
        messages=messages
    )
    assistant_response = response.choices[0].message.content

    messages.append({"role": "assistant", "content": assistant_response})
    memory.add(messages, user_id=user_id)

    return assistant_response
```

Tres ideas de diseño detrás de este loop que vale la pena resaltar:

1. **El retrieval va antes del prompt**, no después. Las memorias recuperadas se inyectan en `system_prompt`, así el modelo las trata como contexto verificado en lugar de notas a posteriori.
2. **El `add` ocurre después de la respuesta**, no antes. Mem0 extrae hechos del par `user + assistant`, no solo del turno del usuario. Esto captura detalles revelados por el asistente que el usuario no explícitó.
3. **`top_k=3` es deliberadamente bajo**. Más memorias no es mejor: inyectar demasiadas distracciones degrada la respuesta. Tres memorias relevantes valen más que quince superficiales.

### Limitaciones reales de Mem0

No todo es positivo. Después de tres meses probándolo en mis proyectos tengo claras varias fricciones:

- **Platform vs OSS**: la versión gestionada tiene entity linking, temporal reasoning y un MCP server oficial. La versión OSS self-hosted ([mem0ai/mem0](https://github.com/mem0ai/mem0)) tiene la extracción y el retrieval pero el grafo de entidades hay que montarlo aparte con Neo4j o similar.
- **Scoping es obligatorio**: si olvidas pasar `user_id`, mezclas memorias de usuarios distintos. Mem0 no es seguro por defecto.
- **El extractor come tokens**: cada `add` gasta LLM. Para una conversación de 50 mensajes diarios por usuario, el coste de extracción puede dominar el coste total. Hay que medirlo.
- **Mem0 cloud guarda tus conversaciones** en sus servidores. Si manejas datos sensibles, mejor self-hosted o tira de Letta para datos que no quieras que salgan de tu laptop.

---

## Pilar 2: MemGPT y Letta — la memoria como sistema operativo

**MemGPT** ([arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) es el paper fundacional de Charles Packer et al. en UC Berkeley, octubre de 2023. La idea es tan elegante que merece la pena entenderla antes de mirar cualquier implementación: **el LLM es un procesador con RAM limitada, y todo lo demás es almacenamiento paginizable**. Sucesora moderna es **Letta** ([github.com/letta-ai/letta](https://github.com/letta-ai/letta), 24.4k estrellas), que renombró el proyecto y lo llevó a producción.

### La jerarquía virtual de contexto

El paper divide la memoria del agente en dos grandes zonas, cada una con sub-zonas:

![Jerarquía virtual de MemGPT y Letta: contexto principal arriba con tres secciones, memoria externa debajo con recall storage y archival storage, el LLM paginiza entre ambas mediante function calls.](/images/memgpt-virtual-context-es.svg)

**Main context** (lo que el LLM "ve" en cada turno):

- **System instructions**: read-only, identidad del agente y reglas globales. Nunca se mueve.
- **Working context**: read-write, pensado para los hechos clave de la sesión activa. El LLM puede llamar funciones para modificarlo explícitamente.
- **FIFO queue**: append-only, contiene el historial reciente de mensajes, system warnings y function calls/responses. Cuando se llena, se evicta.

**External context** (no visible para el LLM salvo que invoque una función):

- **Recall storage**: mensajes completos pasados, append-only, búsqueda por keyword y rango temporal.
- **Archival storage**: objetos de texto arbitrario (documentos, notas, código), búsqueda vectorial.

### Funciones como page-faults

Lo brillante del diseño es cómo el LLM "pide" páginas de memoria. MemGPT le expone un set acotado de function calls que simulan las operaciones de un sistema operativo:

- `archival_memory_search(query, page=0)` → paginación desde archival storage con control de paginación explícito.
- `archival_memory_insert(text)` → escribe en archival storage.
- `recall_storage_search(query, page=0)` → paginación desde recall storage.
- `core_memory_replace(label, new_content)` / `core_memory_append(label, content)` → modifica working context.

Cuando el modelo quiere recordar algo, **no expande su ventana**, invoca una función. La implementación original corre las funciones en una tool runtime que mete los resultados otra vez en la FIFO queue, y el modelo continúa.

Pseudocódigo simplificado del control flow (siguiendo [arXiv:2310.08560 §2](https://arxiv.org/html/2310.08560v2)):

```python
def memgpt_step(user_input, memory_state):
    memory_state.fifo_queue.append(user_input)

    prompt = (
        memory_state.system_instructions
        + memory_state.working_context
        + memory_state.fifo_queue
    )

    completion = llm.complete(prompt)

    if is_function_call(completion):
        fn, args = parse(completion)
        result = fn(**args)

        if args.get("request_heartbeat"):
            memory_state.fifo_queue.append(result)
            return memgpt_step("", memory_state)
        return result
    return completion
```

La política de eviction es la que cierra el círculo. Cuando los tokens del prompt cruzan el **warning token count** (70% de la ventana), se inserta un `system message` avisando al modelo de que mueva información útil a `working_context` o `archival_storage`. Cuando se llega al **flush token count** (100%), la FIFO queue se trunca y se genera un resumen recursivo del contenido evictado. Es **la misma idea que un sistema operativo paginizando memoria virtual a disco** cuando la RAM se agota.

### Los resultados verificados del paper

Estos números son los que convencen a quien dude de si la metáfora del sistema operativo es solo académica. De la Tabla 2 y Figura 7 de [arXiv:2310.08560](https://arxiv.org/html/2310.08560v2):

| Modelo | Deep Memory Retrieval (sin MemGPT) | Deep Memory Retrieval (con MemGPT) |
|---|---|---|
| GPT-3.5 | 38.7% | 66.9% |
| GPT-4 | 32.1% | 92.5% |
| GPT-4 Turbo | 35.3% | 93.4% |

Y en nested key-value retrieval (recuperar `(((a, b), c), d)`):

- Sin MemGPT, todos los baselines colapsan a 0% en el nivel 3.
- Con MemGPT sobre GPT-4, accuracy estable en los cuatro niveles.

Traducido: con la misma cantidad de tokens y el mismo modelo base, **agregar la capa de memoria virtual triplica la precisión en tareas de recuperación profunda** y permite resolver problemas jerárquicos donde el modelo base simplemente fracasa.

### Evolución: de MemGPT a Letta y MemFS

En 2024 MemGPT se renombró a **Letta**. El cambio no fue cosmético: el equipo consolidó las ideas del paper en algo production-ready. La pieza más interesante para mí, y la que más relaciona con la filosofía que llevo años defendiendo en este blog, es **MemFS**.

MemFS ([docs.letta.com/concepts/memfs](https://docs.letta.com/concepts/memfs)) es un sistema de archivos **git-backed** donde cada memoria se proyecta como archivo Markdown con YAML frontmatter. La estructura resultante es esta:

```
$MEMORY_DIR/
├── system/                 # Siempre en el system prompt
│   ├── persona.md          # Identidad del agente
│   └── human.md            # Preferencias del usuario
├── reference/              # Carga bajo demanda
│   └── project-notes.md
└── skills/
    └── my-skill/
        └── SKILL.md
```

Y lo más bonito: el árbol completo del filesystem se inyecta como índice navegable en el system prompt. Los archivos bajo `system/` se incluyen en cada turno; el resto se busca con file-search tools convencionales. **Es la materialización práctica de la idea de "consciencia de memoria"** que ya cubrí con el [ROOT.md de Hipocampus](/es/blog/hipocampus-memoria-jerarquica-agentes/), pero usando Git como capa de versionado en lugar de un índice custom.

Letta expone además comandos slash que materializan el flujo de aprendizaje:

- `/init` → bootstrap del `MEMORY_DIR`.
- `/remember <texto>` → enseñanza explícita.
- `/sleeptime` → consolidación en background (subagente "dreamer").
- `/doctor` → auditoría de placement, duplicación y uso de tokens.

### Cuándo elegir MemGPT/Letta y cuándo Mem0

Es la pregunta que más recibo. Mi regla práctica, después de probar ambos:

- **Mem0** cuando el agente consume datos no estructurados (conversaciones, mensajes, tickets) y quieres extracción automática de hechos.
- **Letta/MemGPT** cuando el agente tiene tareas largas, contexto denso y necesitas control fino sobre qué se mantiene working vs archival.
- **Ambos** cuando el agente es de producción: Mem0 como extractor, Letta como gestor de contexto. La integración está documentada en [`docs.mem0.ai/integrations/langgraph`](https://docs.mem0.ai/integrations/langgraph).

---

## Pilar 3: el método PARA como ontología espacial

Hasta aquí hemos hablado de memoria como dato. Falta hablar de **memoria como organización**. Y aquí es donde el sistema que más me ha influenciado no es técnico: es el **método PARA** de Tiago Forte.

**PARA** ([fortelabs.com/blog/para](https://fortelabs.com/blog/para/)) son cuatro carpetas, una sola decisión. La regla de oro es: *¿esto es procesable ahora mismo o no?*

- **Projects**: cosas con fecha de fin definida. El solver de Sudoku, el rediseño del sitio, la auditoría de seguridad del mes que viene.
- **Areas**: estándares continuos sin fecha de fin. Salud, finanzas personales, mi dominio técnico de Android, mi práctica de prompting.
- **Resources**: temas o intereses sin acción inmediata. Artículos por leer, referencias, libros.
- **Archives**: inactivos. Proyectos terminados, áreas abandonadas, recursos caducados.

La línea que divide activos (Projects + Areas) de inactivos (Resources + Archives) **es lo único que el método necesita**. Esa única decisión, dicen Forte y su cohorte de miles de estudiantes, separa los sistemas de PKM que funcionan de los que se pudren.

### Por qué PARA encaja tan bien con agentes IA

La razón por la que PARA se ha convertido en sustrato cognitivo natural para mis agentes no es la taxonomía en sí, sino el **principio de actionability** que la inspira. PARA rechaza la organización por tema académico (*"Marketing"*, *"Psychology"*) en favor de organizar por **lo que estás intentando hacer ahora**. Un apunte sobre un proyecto de diseño gráfico pertenece a `Projects/diseno-grafico/`, no a una carpeta compartida de "Marketing". Y eso es exactamente lo que un agente necesita para decidir **qué cargar en contexto** sin razonamiento semántico costoso.

La traducción agentica de PARA es directa:

- **Projects** → cargar al inicio de cada sesión activa. Son el working set.
- **Areas** → cargar solo cuando el dominio es relevante para la consulta. Retrieval por keyword o embedding.
- **Resources** → búsqueda bajo demanda, escalar bajo.
- **Archives** → referencia histórica comprimida, se consulta raramente.

En mi propio setup tengo PARA implementado como cuatro directorios en un vault Obsidian accesible vía MCP, y el agente recibe una herramienta `list_projects` + `read_project <nombre>` + `search_resource <query>` que le permite cargar solo lo que necesita. Los detalles completos los conté en [el artículo dedicado al método PARA aplicado a memoria IA](/es/blog/metodo-memoria-ia-archivos/). Lo que aquí importa es la idea: **PARA es la ontología, MemFS de Letta o tu propio vault Markdown es el sustrato, y el agente decide qué cargar siguiendo el principio de actionability**.

### La trampa de Project vs Area

Es el error que comete el 99% de la gente al aplicar PARA, según Forte, y que también he visto fallar en agentes: mezclar Projects y Areas. Si "Mejorar mi español" acaba en `Projects/`, el sistema pierde la capacidad de señalar relevancia temporal: ¿esto es accionable ahora o es un estándar continuo? "Mejorar mi español" es Area. "Preparar el examen DELE C1 para el 15 de octubre" es Project. Cuando un agente abre su `Projects/`, espera encontrar trabajo con fecha de fin. Cuando abre su `Areas/`, espera encontrar un estándar. **No las mezcles**, y mucho menos las mezcles en el sistema de archivos que va a consultar el agente.

---

## Pilar 4: Chroma vs LanceDB — eligiendo el vector store

Los tres pilares anteriores son agnósticos al vector store. Mem0 puede usar Chroma, LanceDB, Qdrant, Milvus. Letta usa pgvector por defecto. MemFS en disco plano ni siquiera necesita vector store. Pero en cuanto tu stack crece, necesitas decidir uno. Y las dos opciones razonables para un indie dev que no quiere mantener un cluster son **Chroma** y **LanceDB**.

### La tabla que importa

Mezclo datos verificados de [`docs.trychroma.com`](https://docs.trychroma.com/docs/overview/getting-started), [`lancedb.github.io/lancedb`](https://lancedb.github.io/lancedb/) y la comparativa de [`zilliz.com/comparison/chroma-vs-lancedb`](https://zilliz.com/comparison/chroma-vs-lancedb):

| Dimensión | Chroma | LanceDB |
|---|---|---|
| Licencia | Apache 2.0 | Apache 2.0 |
| Estrellas GitHub | ~29k | ~11k |
| Modo de ejecución | Embedded (in-process) | Embedded, on-prem o cloud |
| API Python canónica | `chromadb.Client()` + `collection.add/query` | `lancedb.connect(uri)` + `table.add/search` |
| Embeddings autogenerados | Sí (default: `all-MiniLM-L6-v2`) | Requiere `embedding_functions` explícitas |
| Persistencia | `PersistentClient(path=...)` o Chroma Cloud | Archivo `.lance` por tabla en disco |
| Búsqueda híbrida | Filtros `where` sobre metadatos | Vector + BM25 + SQL-like con `LanceHybridQueryBuilder` |
| Ecosistema de embedders | Limitado al cliente Python | OpenAI, Cohere, SentenceTransformers, Instructor, Jina, Voyage |
| Escala cómoda | Decenas/cientos de miles de vectores | Decenas/cientos de millones (formato columnar Lance) |
| Mejor para | Prototipado, notebooks, agentes locales | Producción on-prem, edge, datasets grandes con metadatos |

### Cuándo Chroma es tu opción

Si arrancas desde cero con menos de 100k memorias y menos de 100 MB de vectores, **Chroma es la opción obvia**. La fricción de instalación es mínima (`pip install chromadb`), los embeddings se autogeneran sin que tengas que decidir nada, y el patrón `collection.add + collection.query` es directo. Ejemplo mínimo:

```python
import chromadb

client = chromadb.Client()                      # en memoria
# client = chromadb.PersistentClient(path="./chroma_data")  # persistente

collection = client.get_or_create_collection(name="agent_memory")

collection.upsert(
    documents=[
        "Prefer Composable navigation en lugar de Fragment-based",
        "Min SDK del proyecto es 24, target SDK es 36",
    ],
    ids=["pref-nav-001", "config-sdk-002"],
    metadatas=[{"type": "preference"}, {"type": "config"}]
)

results = collection.query(
    query_texts=["¿qué versión mínima de Android uso?"],
    n_results=2,
    where={"type": "config"}
)
# results = {
#   "documents": [["Min SDK del proyecto es 24, target SDK es 36", ...]],
#   "ids":       [["config-sdk-002", ...]],
#   "distances": [[0.31, ...]],
#   "metadatas": [[{"type": "config"}, ...]]
# }
```

La variante TypeScript es igual de limpia, y existe también cliente Rust. Chroma es ideal cuando quieres que tu agente funcione en una tarde y puedas iterar mañana.

### Cuándo LanceDB es tu opción

LanceDB brilla donde Chroma empieza a sufrir: cuando el dataset crece a millones de vectores con metadatos estructurados y quieres búsqueda híbrida seria (vector + keyword + filtro SQL-like sobre columnas typed). El formato columnar `.lance` permite time-travel, versionado y operaciones que Chroma no soporta nativamente. Ejemplo con datos precomputados:

```python
import lancedb
import pyarrow as pa
import numpy as np

db = lancedb.connect("./lance_data")

table = db.create_table(
    "agent_memory",
    schema=pa.schema([
        pa.field("vector",     pa.list_(pa.float32(), 384)),
        pa.field("text",       pa.string()),
        pa.field("type",       pa.string()),
        pa.field("user_id",    pa.string()),
        pa.field("created_at", pa.timestamp("ms")),
    ])
)

table.add([{
    "vector":     np.random.randn(384).astype("float32").tolist(),
    "text":       "Prefer Composable navigation",
    "type":       "preference",
    "user_id":    "arceapps",
    "created_at": 1756176000000,
}])

query_vec = np.random.randn(384).astype("float32")
results = (
    table.search(query_vec)
         .metric("cosine")
         .where("user_id = 'arceapps'")
         .limit(5)
         .to_pandas()
)

results_hybrid = (
    table.search(query_vec, query_type="hybrid")
         .text("Composable navigation")
         .limit(5)
         .to_pandas()
)

table.create_index(num_sub_vectors=64, type="IVF_PQ")
```

`LanceHybridQueryBuilder` es la pieza que más me importa: cuando tengo notas con fechas, autores y categorías, poder combinar similitud semántica con `BM25` y un `WHERE type = 'decision'` lo cambia todo. Para un agente que tiene que razonar sobre su propio historial estructurado, esa capacidad de búsqueda híbrida es la diferencia entre "el agente encuentra cosas" y "el agente encuentra cosas relevantes ahora mismo".

### La regla de decisión

Mi flujo de decisión, en pseudocódigo:

1. Si vas a arrancar y tienes <50k memorias → empieza con **Chroma**. Cambiar después es costoso solo si tu código se acopló demasiado, así que mantén la abstracción `vector_store` detrás de una interfaz propia.
2. Si prevés >500k memorias con metadatos estructurados → empieza con **LanceDB**. El formato columnar te paga dividendos.
3. Si necesitas búsqueda híbrida de verdad (vector + BM25 + filtros) → **LanceDB**.
4. Si solo trabajas en notebooks y prototipos → **Chroma**.

En mi caso, los proyectos pequeños corren sobre Chroma y los que tienen >6 meses de historial estructurado migraron a LanceDB sin drama. Para validar performance en tu propio dataset, [VectorDBBench](https://github.com/zilliztech/VectorDBBench) es la herramienta de benchmarking open-source del equipo de Zilliz.

---

## Pilar 5: LangChain como orquestador

El último pilar no almacena memoria; la mueve. **LangChain** ha evolucionado mucho, y la confusión más común es seguir usando la API legacy. En 2026 el patrón canónico es [`create_agent`](https://docs.langchain.com/oss/python/langchain/overview) sobre LangGraph, con checkpointer persistente si quieres memoria entre invocaciones.

### El patrón actual con `create_agent`

```python
from langchain.agents import create_agent
from langgraph.checkpoint.sqlite import SqliteSaver

def get_weather(city: str) -> str:
    """Devuelve el clima de una ciudad."""
    return f"Siempre hace sol en {city}!"

checkpointer = SqliteSaver.from_conn_string("./agent_state.db")

agent = create_agent(
    model="openai:gpt-5.5",
    tools=[get_weather],
    system_prompt="Eres un asistente útil",
    checkpointer=checkpointer,
)

config = {"configurable": {"thread_id": "user-arceapps-proj1"}}
result = agent.invoke(
    {"messages": [{"role": "user", "content": "¿Clima en Madrid?"}]},
    config=config,
)
```

Mismo `thread_id` en una segunda invocación → el agente recuerda el contexto completo de la conversación. El `SqliteSaver` persiste el state por thread, lo que permite memoria durable sin levantar infraestructura. Para producción multi-usuario sustitúyelo por `PostgresSaver` o `RedisSaver`.

### Integración Mem0 ↔ LangGraph

La pieza que cierra el stack: **Mem0 como memoria externa de un agente LangGraph**. La documentación oficial está en [`docs.mem0.ai/integrations/langgraph`](https://docs.mem0.ai/integrations/langgraph). El patrón es siempre el mismo:

1. Antes de cada turno del agente, llamas a `mem0.search(query)` con la consulta actual.
2. Inyectas los resultados en el `system_prompt` (o en un mensaje de "contexto de memoria") del agente.
3. Después de cada respuesta, llamas a `mem0.add([user_msg, assistant_msg], user_id=...)` para que Mem0 extraiga hechos del intercambio.

Esto convierte Mem0 en una capa de memoria ortogonal al checkpointer de LangGraph. El checkpointer maneja estado de corta duración (turno a turno dentro de un thread); Mem0 maneja memoria de larga duración (hechos consolidados cross-thread, cross-session, cross-agent).

### Deep Agents: la alternativa MemGPT dentro de LangChain

Si prefieres quedarte en LangChain sin añadir dependencias, existe [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview/). Es un harness "batteries-included" sobre `create_agent` que añade tres cosas:

- **Automatic context compression**: cuando el contexto crece, el agente resume/recurta mensajes sin que tengas que escribir la lógica.
- **Virtual filesystem**: análogo a MemFS de Letta, pero gestionado en proceso.
- **Subagent spawning**: el agente principal puede delegar subtareas a subagentes especializados.

Para un indie que no quiere aprender MemGPT en profundidad, Deep Agents es la versión "todo incluido". Para quien quiere control fino, Letta sigue siendo superior.

---

## El stack completo: cómo se conectan los cuatro pilares

Después de cinco secciones individuales, quiero juntar las piezas. Imagina esta arquitectura, que es la que corro en mis proyectos de producción desde hace meses:

```
                      ┌──────────────────────────────┐
                      │      Tu aplicación/CLI       │
                      │   (interfaz para humanos)    │
                      └──────────────┬───────────────┘
                                     │
        ┌────────────────────────────▼─────────────────────────┐
        │   Orquestador: LangChain create_agent / LangGraph   │
        │   checkpointer = PostgresSaver (multi-thread)        │
        └──────┬──────────────────────────┬───────────────────┘
               │                          │
               │ (1) pre-prompt            │ (2) post-respuesta
               ▼                          ▼
        ┌────────────────────┐    ┌──────────────────────────┐
        │       Mem0         │    │   Consolidación (cron)   │
        │  add / search /    │    │  - resume clusters       │
        │  update / dedup    │    │  - archiva inactivos     │
        │  v3 single-pass    │    │  - reindex embeddings    │
        └─────────┬──────────┘    └──────────┬───────────────┘
                  │                          │
                  ▼                          ▼
        ┌────────────────────┐    ┌──────────────────────────┐
        │  Vector store      │    │   Sustrato legible       │
        │  Chroma o LanceDB  │    │   PARA + Markdown        │
        │  + entity store    │    │   (Obsidian/Logseq/MemFS)│
        │  (SQL + grafo)     │    │   via MCP                │
        └────────────────────┘    └──────────────────────────┘
```

Diagrama detallado del flujo de consolidación de memorias:

![Pipeline de consolidación: write chunk embed store retrieve update consolidate, todos los pasos numerados y con flechas bidireccionales hacia el agente.](/images/consolidation-pipeline-es.svg)

Cuatro principios de diseño detrás del diagrama anterior:

1. **Mem0 es el extractor**, no el almacenamiento final. Si lo usas como única capa de memoria acabarás con duplicados lógicos y un grafo inconsistente cuando crezca.
2. **El checkpointer de LangGraph maneja corto plazo**. El retrieval Mem0 maneja medio plazo. El vault PARA maneja largo plazo con índices legibles.
3. **La consolidación corre fuera del loop** (cron job, subagente en background /sleeptime de Letta, o comando manual semanal). El agente en tiempo real no debe estar pensando "debería olvidar algo ahora".
4. **El sustrato legible es lo que sobrevive al cambio de proveedor**. Si mañana migras de Mem0 a otro extractor, tus archivos PARA siguen ahí. Si mañana cambias de LangChain a otra librería, tu vault Obsidian sigue siendo la fuente de verdad.

### El equivalente a "Hola Mundo"

Para que sea accionable, aquí va un setup mínimo viable que puedes copiar y arrancar en una tarde. No es el definitivo (irás ajustando), pero es el que uso como base para nuevos proyectos:

```python
# stack_minimo.py
from openai import OpenAI
from mem0 import Memory
from langchain.agents import create_agent
from langgraph.checkpoint.sqlite import SqliteSaver
import chromadb

class Agentico:
    def __init__(self, user_id: str, project_id: str):
        self.user_id = user_id
        self.project_id = project_id
        self.llm = OpenAI()
        self.memory = Memory()

        checkpointer = SqliteSaver.from_conn_string("./state.db")
        self.agent = create_agent(
            model="openai:gpt-5.5",
            tools=[],
            system_prompt="Asistente persistente. Responde breve y consulta memorias.",
            checkpointer=checkpointer,
        )

    def chat(self, message: str) -> str:
        memories = self.memory.search(
            query=message,
            filters={"user_id": self.user_id},
            top_k=3
        )
        mem_str = "\n".join(f"- {e['memory']}" for e in memories["results"])

        config = {"configurable": {"thread_id": f"{self.project_id}-{self.user_id}"}}
        result = self.agent.invoke(
            {"messages": [
                {"role": "system", "content": f"Memorias relevantes:\n{mem_str}"},
                {"role": "user",   "content": message},
            ]},
            config=config,
        )

        self.memory.add(
            [{"role": "user",      "content": message},
             {"role": "assistant", "content": result["messages"][-1].content}],
            user_id=self.user_id
        )
        return result["messages"][-1].content
```

No es glamour, pero funciona. Sobre este esqueleto he ido añadiendo herramientas, parsers de vault PARA, integraciones MCP, y el resto de la parafernalia. Lo importante es que los cinco pilares están presentes desde el día uno: LangChain orquesta, Mem0 extrae, Chroma/LanceDB embebe, PARA da la ontología legible, y el checkpointer Sqlite da memoria de corta duración.

---

## Lecciones aprendidas (seis meses después)

Después de seis meses con este stack en varios proyectos — desde apps Android personales hasta herramientas internas de análisis de logs — tengo claras varias cosas que no estaban en la documentación oficial.

**1. No existe "una memoria para gobernarlas a todas".** El error más caro que cometí al principio fue tratar de centralizar. Tener Mem0, Hipocampus, hmem y PARA en un mismo agente produce duplicación y contradicción. Hoy uso Mem0 para memoria semántica de usuario, mi propio vault PARA como sustrato de dominio (la fuente de verdad del proyecto), y el checkpointer de LangGraph como memoria de conversación. Tres capas, tres responsabilidades, sin solapamiento.

**2. El extractor come tokens y eso importa.** Mem0 con `gpt-5-mini` parece barato, pero en conversaciones largas el coste de extracción rivaliza con el coste de las respuestas del modelo. He migrado a extraccciones selectivas (`add` solo en momentos de consolidación, no en cada turno) y la factura mensual cayó 40% sin pérdida perceptible de calidad.

**3. La temporalidad es lo más difícil de modelar.** "El usuario prefiere X" cambia. "El usuario descartó X por Y" también. La diferencia entre ambos importa: uno se reescribe con `update`, el otro se archiva pero no se borra. El módulo de **temporal reasoning** de Mem0 v3 ayuda, pero la realidad es que cada agente necesita lógica de olvido específica de su dominio. No escales esto desde una librería genérica.

**4. Los MCP servers de memoria complementan, no sustituyen.** Mi vault PARA vía MCP es complementario a Mem0: el vault da legible y versionado en Git, Mem0 da extraction y deduplicación. Confundirlos es la confusión más común que veo en preguntas de la comunidad. Para aclararlo en profundidad, relee el [artículo sobre servidores MCP de memoria cross-agent](/es/blog/servidores-mcp-memoria-cross-agent/) que publiqué hace meses.

**5. Los benchmarks engañan.** Las cifras de Mem0 v3 (92.5 LoCoMo, 94.4 LongMemEval) son **reales** en los datasets de evaluación. En mi dataset real de uso cotidiano el delta respecto a la versión anterior fue del 4%, no del 21%. Los benchmarks miden rendimiento sobre preguntas largas y estructuradas tipo test; el día a día es más ruidoso, más conversacional y menos extremo. Mide en tu terreno.

**6. Privacidad y memoria son inseparables.** Si tus memorias contienen datos personales (y casi siempre lo harán), tienen que cumplir las mismas reglas que el resto de tu sistema: cifrado en reposo, scopes estrictos por `user_id`, derecho al olvido operativo. He cubierto las consideraciones específicas en [memoria persistente y privacidad agentica](/es/blog/memoria-seguridad-privacidad-agentica/), pero el TL;DR es: trata la memoria como PII por defecto.

---

## Cierre: un mapa, no un destino

Este artículo no es una receta cerrada. Es un mapa. La arquitectura que he descrito es la que funciona en mi mesa de trabajo hoy; puede que dentro de seis meses parte de ella esté obsoleta — LangChain itera rápido, Letta está todavía encontrando su sitio, Mem0 publica un algoritmo nuevo cada pocos meses. Lo que espero que sobreviva es el principio: **memoria cognitiva = extracción automática + paginación tipo sistema operativo + ontología espacial legible + elección informada del vector store**.

Si tuviera que dejarte con tres acciones concretas que puedas hacer esta semana, serían estas:

1. **Monta Mem0 OSS en una tarde.** `pip install mem0ai`, clona el repo, corre los ejemplos. Verás en una hora qué hace y qué no hace.
2. **Aplica PARA a tu vault actual.** No necesitas un agente para esto; coge el sistema de archivos donde guardas notas, proyectos y referencias y reorganízalo en cuatro carpetas. Cuando llegue el agente, el vault ya está listo.
3. **Toma una decisión informada de vector store.** Si no la has tomado, ejecuta un benchmark con [VectorDBBench](https://github.com/zilliztech/VectorDBBench) sobre tus datos reales. Chroma o LanceDB, pero que sea por datos, no por hype.

Y si te encuentras un jueves a las once de la noche, afinando el algoritmo de Norvig con tu agente, y mañana al abrir sesión descubre que **sí recuerda que descartaste DLX porque la densidad de restricciones cambia la heurística**... habrás construido algo que yo todavía estoy construyendo: un artesano digital con memoria. No perfecta, no escalable a millones, pero tuya.

¿Te ha servido este mapa? ¿Tienes un stack diferente que te funciona mejor? Te leo en los comentarios, en [mi cuenta de X](https://x.com/arceappsdev), o donde prefieras. Y si quieres profundizar en alguna de las piezas — Mem0 en producción, el método PARA paso a paso, las alternativas a Chroma y LanceDB — suscríbete al blog, porque cada una tendrá su propio artículo en los próximos meses.

---

## Bibliografía y referencias

### Frameworks y documentación oficial

1. Mem0 — Homepage oficial: [https://mem0.ai](https://mem0.ai). Métricas del algoritmo v3 (abril 2026) y casos de uso.
2. Mem0 — Quickstart Platform: [https://docs.mem0.ai/platform/quickstart](https://docs.mem0.ai/platform/quickstart). API Python verificada de `add`/`search`.
3. Mem0 — How it works: [https://docs.mem0.ai/core-concepts/how-it-works](https://docs.mem0.ai/core-concepts/how-it-works). Pipeline de extracción detallado.
4. Mem0 — Update operation: [https://docs.mem0.ai/core-concepts/memory-operations/update](https://docs.mem0.ai/core-concepts/memory-operations/update). `update` y `batch_update`.
5. Mem0 — MCP integration: [https://docs.mem0.ai/platform/mem0-mcp](https://docs.mem0.ai/platform/mem0-mcp). Mem0 como MCP server para Claude Code, Cursor, Codex.
6. Mem0 — GitHub: [https://github.com/mem0ai/mem0](https://github.com/mem0ai/mem0). Repositorio canónico, paper arXiv:2504.19413, benchmarks v3.
7. MemGPT — Paper original (arXiv:2310.08560v2): [https://arxiv.org/abs/2310.08560](https://arxiv.org/abs/2310.08560). Packer et al., UC Berkeley, octubre 2023.
8. Letta — Memory & dreaming: [https://docs.letta.com/configuration/memory](https://docs.letta.com/configuration/memory). Comandos `/init`, `/remember`, `/sleeptime`.
9. Letta — MemFS: [https://docs.letta.com/concepts/memfs](https://docs.letta.com/concepts/memfs). Sistema de archivos git-backed.
10. Letta — Stateful agents: [https://docs.letta.com/concepts/stateful-agents](https://docs.letta.com/concepts/stateful-agents). Marco conceptual de identidad persistente.
11. Letta — GitHub: [https://github.com/letta-ai/letta](https://github.com/letta-ai/letta). 24.4k estrellas, código fuente actual.
12. Letta — Research: [https://www.letta.com/research](https://www.letta.com/research). Papers recientes del laboratorio.

### LangChain y orquestación

13. LangChain — Overview actual: [https://docs.langchain.com/oss/python/langchain/overview](https://docs.langchain.com/oss/python/langchain/overview). API `create_agent` sobre LangGraph.
14. LangChain — Deep Agents: [https://docs.langchain.com/oss/python/deepagents/overview/](https://docs.langchain.com/oss/python/deepagents/overview/). Harness batteries-included con virtual filesystem.
15. Mem0 + LangGraph integration: [https://docs.mem0.ai/integrations/langgraph](https://docs.mem0.ai/integrations/langgraph). Cómo usar Mem0 como memoria externa.

### Vector databases

16. Chroma — Getting Started: [https://docs.trychroma.com/docs/overview/getting-started](https://docs.trychroma.com/docs/overview/getting-started). Python, JS y Rust.
17. LanceDB — Python SDK: [https://lancedb.github.io/lancedb/python/python/](https://lancedb.github.io/lancedb/python/python/). API completa y hybrid search.
18. Zilliz — Chroma vs LanceDB: [https://zilliz.com/comparison/chroma-vs-lancedb](https://zilliz.com/comparison/chroma-vs-lancedb). Comparativa con datos cuantitativos.
19. VectorDBBench — GitHub: [https://github.com/zilliztech/VectorDBBench](https://github.com/zilliztech/VectorDBBench). Benchmarking tool open-source.

### Método PARA y sustrato cognitivo

20. Tiago Forte — The PARA Method: [https://fortelabs.com/blog/para/](https://fortelabs.com/blog/para/). Definición canónica y principio de actionability.
21. Tiago Forte — Building a Second Brain: [https://www.buildingasecondbrain.com/para](https://www.buildingasecondbrain.com/para). Versión libro del método.

### Estándares y contexto

22. Anthropic — Model Context Protocol: [https://modelcontextprotocol.io](https://modelcontextprotocol.io). Estándar abierto que conecta vault PARA con agentes.
23. OpenMemory (Mem0 self-hosted): [https://mem0.ai/openmemory](https://mem0.ai/openmemory). Alternativa open-source del motor de memoria.
24. Mem0 research page: [https://mem0.ai/research](https://mem0.ai/research). Paper técnico y benchmarks completos.

### Artículos relacionados en ArceApps

25. Panorama general de frameworks de memoria: [memoria persistente para agentes IA](/es/blog/memoria-persistente-agentes-ia/).
26. Método PARA aplicado a archivos IA: [método de memoria en archivos para IA](/es/blog/metodo-memoria-ia-archivos/).
27. Mi stack real con basic-memory y supermemory: [stack de memoria persistente implementación](/es/blog/stack-memoria-persistente-implementacion/).
28. Servidores MCP de memoria cross-agent: [servidores MCP de memoria cross-agent](/es/blog/servidores-mcp-memoria-cross-agent/).
29. Memoria jerárquica tipo hmem: [memoria jerárquica con SQLite](/es/blog/hmem-sqlite-memoria-jerarquica-agentes/).
30. Hipocampus como arnés de memoria: [Hipocampus, memoria jerárquica](/es/blog/hipocampus-memoria-jerarquica-agentes/).
31. PlugMem de Microsoft Research: [PlugMem, memoria agéntica task-agnostic](/es/blog/plugmem-microsoft-memoria-agentes/).
32. Privacidad y seguridad en memoria agéntica: [memoria persistente y privacidad agentica](/es/blog/memoria-seguridad-privacidad-agentica/).
33. Obsidian como vault para agentes: [Obsidian para desarrolladores](/es/blog/obsidian-desarrolladores/).
34. Native plugins de memoria en OpenCode: [plugins de memoria nativos en OpenCode](/es/blog/opencode-plugins-memoria-nativos/).
35. Workflows con subagentes que consumen la misma memoria: [OpenCode subagentes y superpowers](/es/blog/opencode-subagents/).
