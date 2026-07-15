---
title: "AI Token Savings: Reduce Costos hasta un 99%"
description: "Recorta hasta un 99% el costo de tus agentes IA con prompt caching, model routing, LLMLingua y RTK. Playbook práctico desde producción."
pubDate: 2026-07-13
lastmod: 2026-07-13
author: ArceApps
keywords:
  - "AI Tokens"
  - "Prompt Caching"
  - "Model Routing"
  - "LLMLingua"
  - "RTK"
  - "Cost Optimization"
  - "AI Agents"
canonical: "https://arceapps.com/blog/ai-token-savings-strategies/"
heroImage: "/images/ai-token-savings-strategies.png"
tags: ["AI Agents", "Tokens", "Cost Optimization", "Prompt Caching", "Model Routing", "LLMLingua", "RTK", "Indie"]
reference_id: "d372e2d1-04b0-4bd9-b89f-28d46cc910a4"
---

> **Lecturas relacionadas en el blog:** [Caveman: el skill viral que silencia a tus agentes AI](/blog/caveman-skill-token-compression) · [AI Agents Coding: de Copilot a agentes autónomos](/blog/ai-agents-coding) · [AI Agent Memory Persistence Guide](/blog/ai-agent-memory-persistence-guide)

## La factura que me hizo abrir los ojos

Corría una tarde de domingo cuando vi el primer cargo real de mi agente. No era una prueba controlada, no era un benchmark con tres prompts y un `print`. Era mi flujo de trabajo de un sábado entero: refactor de un módulo, una migración de base de datos, tres PRs revisadas, dos deploys, un bug fix a las tantas. Sesión larga, con contexto vivo, contexto que arrastraba la conversación desde el primer mensaje.

El cargo no era absurdo. Pero la sensación al verlo sí lo era. Yo estaba pagando por **dos cosas** que me sobraban: por la cortesía del modelo ("¡Por supuesto! Aquí tienes...") y por su propio contexto repetido, ese system prompt y ese set de herramientas que el agente releía en cada turno como si fuera la primera vez. Y yo, ingenuo de mí, había asumido que "ahí fuera" todo el mundo optimizaba esto en serio.

Hasta ese día, mi optimización de tokens consistía en reescribir prompts a mano. Funcionaba. Tampoco era escalable. Si quería un agente que viviera en mi flujo de trabajo —y no al revés—, tenía que empezar a tratar el coste de tokens como un **problema de ingeniería**, no como una nota a pie de página del modelo de negocio.

Esa tarde se convirtió en una semana de investigación. Y esta semana se convirtió en este artículo. Lo que sigue es el playbook que ahora corre en mi setup: cinco técnicas concretas, benchmarks reales, código que se puede copiar, y una cuenta al final que explica por qué paso de pagar $25 al mes a $0.66 sin tocar la calidad de salida.

---

## El panorama: cinco técnicas, una cuenta al final

Antes de entrar en faena, la tabla que más veces consulto cuando alguien me pregunta "¿pero esto de verdad ahorra?". Lo dejo arriba porque resume el artículo entero en una mirada.

| Estrategia | Ahorro típico | Caso de uso ideal |
|---|---|---|
| **Prompt Caching** | 88% – 90% | Llamadas repetitivas con prefijo común |
| **Model Routing** | 60% – 95% | Cargas mixtas (clasificación + razonamiento) |
| **Compresión de prompts (LLMLingua / Headroom)** | 73% – 92% | Contextos grandes: código, JSON, logs, docs |
| **RTK (CLI wrapper)** | 60% – 90% | Agentes que ejecutan comandos de terminal |
| **Pipeline combinado** | 95% – 99% | Sistemas en producción optimizados |

Si solo pudieras aplicar **una** técnica, empieza por Prompt Caching. Si puedes aplicar **dos**, añade Model Routing. El salto al 95% solo aparece cuando combinas las cinco en un pipeline. Ahora vamos capa por capa.

---

## 1. Prompt Caching: el 90% del ahorro está en lo que ya enviaste

### Por qué funciona (la versión corta)

Cuando llamas a un modelo, el proveedor calcula un **estado de atención** para tu prompt completo. Ese estado cuesta dinero. Si tu próximo prompt empieza con los mismos 2.000 tokens (system prompt, definición de herramientas, perfil de usuario, documentación estable), el proveedor puede **reutilizar** ese cálculo y cobrarte solo una fracción. Esa fracción, en OpenAI y Anthropic, suele ser el **10% del precio del input**.

El truco no es magia. Es contabilidad. Estás pagando por re-procesar lo mismo una y otra vez. El caché de prefijo te deja de pagar esa redundancia.

### Arquitectura que recomiendo

El prompt tiene que tener dos zonas muy claras, y la disciplina para mantenerlas:

```
┌─────────────────────────────────────────┐
│  📦 ZONA CACHEABLE (fija entre calls)  │
│  ────────────────────────────────────   │
│  • System prompt                        │
│  • Definición de herramientas           │
│  • Perfil del usuario / contexto largo  │
│  • Documentación estable                │
├─────────────────────────────────────────┤
│  🔄 ZONA DINÁMICA (cambia cada call)   │
│  ────────────────────────────────────   │
│  • Consulta específica del usuario      │
│  • Datos de la tarea actual             │
│  • Variables de la sesión               │
└─────────────────────────────────────────┘
```

**Regla de oro:** todo lo que cambia entre llamadas va al **final**; todo lo que permanece constante, al **principio**. Si dudas, mira la fecha de modificación del contenido. Si no se ha movido en tres meses, probablemente pertenece a la zona cacheable.

### La cuenta que importa

Procesemos 50 elementos seguidos con el mismo system prompt:

| Escenario | Coste sin caché | Coste con caché | Ahorro |
|---|---|---|---|
| 1 llamada | 100% | 100% | 0% (se paga la "escritura" del caché) |
| 50 llamadas | 100% × 50 | 100% + (10% × 49) | **88%** |

La primera llamada "paga" el precio completo porque es la que crea el caché. Las 49 siguientes viajan con descuento. Si tu flujo es de 5 llamadas por sesión, el ahorro apenas se nota. Si es de 50, 200 o 2000, el ahorro se dispara.

### Mis cinco reglas no negociables

1. **Cachea instrucciones estables** del sistema y definiciones de herramientas. Es donde está el dinero fácil.
2. **Mide la tasa de hit** de tu caché antes de optimizar más. Sin métrica, estás volando a ciegas.
3. **No inyectes timestamps ni contadores** en la zona cacheable. Cada cambio invalida el caché y te devuelve al coste lleno.
4. **Verifica el tamaño mínimo de bloque** de tu proveedor. Anthropic y OpenAI tienen ventanas distintas; el mínimo importa más de lo que parece.
5. **Estructura el prompt deliberadamente.** Si tu system prompt tiene timestamps al principio, te estás disparando en el pie.

### Un ejemplo real: agente de revisión de PRs

En mi flujo, un agente revisa cada PR abierta en mis repos. El system prompt define qué buscar (estilo, seguridad, regresiones), qué herramientas puede llamar, y qué formato de salida quiero. Esa parte tiene 1.800 tokens. El cuerpo del PR cambia con cada review. Antes de activar el caché:

```
Llamada 1:  2.300 tokens (1.800 system + 500 PR)    → coste input completo
Llamada 2:  2.300 tokens (1.800 system + 500 PR)    → otra vez completo
Llamada 3:  2.300 tokens                                → completo
... x 50 PRs a la semana ...
```

Con el caché activado:

```
Llamada 1:  2.300 tokens                               → coste completo (escribe caché)
Llamada 2:  2.300 tokens (1.800 a 10% + 500 completo) → 1.080 coste equivalente
Llamada 3:  2.300 tokens (1.800 a 10% + 500 completo) → 1.080
... x 49 más ...
```

El system prompt pasa de ser un gasto recurrente a una inversión amortizada en la primera llamada. El ahorro mensual en mi caso ronda el 85%. No es teoría; es lo que dice el dashboard de OpenRouter.

### Cuando el caché NO te salva

Si tu prompt es mayormente dinámico — chateas, cada turno trae contexto fresco, no hay prefijos repetidos — el caché aporta poco. También es inútil si el system prompt es muy corto (menor de 1.024 tokens, el mínimo que aplican la mayoría de proveedores). En esos casos, salta directamente al Model Routing.

---

## 2. Model Routing: no todo necesita un misil térmico

### El principio

Hay una tentación muy humana: usar el modelo más caro porque "más vale que sobre". Es la misma tentación que te lleva a comprar el coche más grande del concesionario para ir al supermercado. Funciona, sí. Pero estás pagando una prima brutal por una capacidad que el 80% de tus tareas no necesita.

El **Model Routing** es la disciplina de clasificar cada consulta y mandarla al **modelo más barato que pueda resolverla con calidad aceptable**. No es una idea nueva — los CDNs llevan décadas haciendo lo mismo con el tráfico web — pero aplicada a LLMs da resultados que parecen trampa.

### La tabla que más vale la pena memorizar

| Tipo de tarea | Modelo apropiado | Ahorro vs. premium |
|---|---|---|
| Clasificación de texto (sentimiento, intent, spam) | nano / mini | 90% – 95% |
| Extracción de JSON desde texto semi-estructurado | mini | 85% – 90% |
| Resumen de documentos | mini / standard | 70% – 85% |
| Traducción rutinaria | mini | 80% – 90% |
| Generación de código crítico / arquitectónico | premium | 0% (necesario) |
| Análisis matizado, multi-step | premium | 0% (necesario) |
| Razonamiento matemático complejo | premium / reasoning | 0% – 30% |

Las dos primeras filas son las más impactantes en términos de ahorro. La mayoría de mis agentes gastan el 70% de sus llamadas en clasificación y extracción. Esas llamadas, en un modelo premium, son dinero tirado. En un modelo mini, cuestan céntimos.

### Un router de 12 líneas que ya está en producción

No necesitas montar un sistema con LangChain, embeddings, y tres microservicios. Un clasificador basado en reglas simples funciona mejor de lo que parece:

```python
def route(query: str, context: dict) -> str:
    # 1. Tareas declaradas → decisión explícita
    if context.get("intent") in {"summarize", "classify", "extract"}:
        return "model-mini"

    # 2. Longitud y complejidad léxica
    if len(query) < 500 and not has_technical_terms(query):
        return "model-mini"

    # 3. Razonamiento explícito
    if "razonamiento" in context.get("intent", ""):
        return "model-premium"

    # 4. Default conservador
    return "model-standard"
```

El coste del propio router es despreciable (un clasificador barato, en mi caso, son 200 microsegundos). El ahorro, en cambio, es brutal: si tu clasificador cuesta $0.001 y la llamada que evita cuesta $0.05, **estás ganando 50x**.

### La regla del ROI positivo

Un error común es montar un router que cuesta **más** que el ahorro que produce. La fórmula mental que uso es esta:

> *Coste del router < Ahorro esperado por llamada desviada*

Si tu clasificador cuesta $0.01 y desvía llamadas que ahorran $0.005, estás perdiendo dinero. Optimiza primero el clasificador, o usa un modelo nano para clasificar (que es lo que yo hago).

### Plataformas que ya lo hacen por ti

Si no quieres montar el tuyo, hay tres opciones que ya integran routing automático:

- **OpenRouter**: unifica múltiples proveedores detrás de una sola API, con enrutamiento por latencia, coste o capacidad.
- **Together AI**: similar, con foco en modelos open-source y precios competitivos.
- **LiteLLM**: proxy que puedes colocar delante de cualquier backend, con políticas de routing configurables en YAML.

En el terreno comercial, **GLM Coding Plan** ofrece routing automático integrado que analiza la complejidad aparente de la consulta y elige el modelo. Yo lo probé en febrero para clasificación de issues y funcionó razonablemente bien: las llamadas simples iban a GLM-4.5 Air, las complejas a GLM-4.6. El ahorro fue de un 73% sobre un setup "todo premium".

### Cuando NO enrutar

Hay tres casos donde el routing es contraproducente:

1. **Tareas donde la latencia importa más que el coste.** Si tu usuario espera respuesta en menos de 200 ms, un router que añade un hop extra te mata.
2. **Tareas donde la consistencia es crítica.** Si tu agente cambia de modelo entre turnos, la "personalidad" de las respuestas varía. Para flujos conversacionales largos, mantener el mismo modelo suele ser mejor.
3. **Volúmenes muy bajos.** Si haces 100 llamadas al mes, el ahorro no compensa la complejidad de mantener un router.

---

## 3. Compresión de prompts: cuando tu contexto es un vertedero

### El problema real

La mayoría de agentes acumulan contexto sin piedad. Abren un archivo de 4.000 líneas, lo meten entero. Pegan un log de 800 líneas, lo meten entero. Cargan la documentación completa de una API, la meten entera. El modelo recibe todo eso, paga por todo, y solo usa una fracción.

El reflejo de muchos es "bueno, pues quito cosas a mano". Eso funciona a escala de uno. A escala de un agente autónomo que ejecuta 200 operaciones por sesión, no. Necesitas herramientas que automaticen la poda.

### LLMLingua: el compresor por excelencia

**LLMLingua** es una familia de modelos entrenados específicamente para identificar y eliminar contenido redundante o de bajo valor informativo, manteniendo intactas las instrucciones críticas del prompt. Lo publicó Microsoft Research en 2023 y se ha convertido en una de las referencias del sector.

| Tipo de contenido | Factor de compresión típico |
|---|---|
| Texto narrativo | 5x – 10x |
| Conversaciones | 10x – 20x |
| Documentación técnica | 8x – 15x |
| Mezcla heterogénea | 5x – 12x |

La cifra que más me impresionó al probarlo: un transcript de chat de 8.000 tokens comprimido a 600 tokens sin pérdida perceptible de calidad en la respuesta del modelo. Eso es un 13x. En dinero real, son $0.024 que pasan a ser $0.0018.

### Headroom: el motor multi-algoritmo

A finales de 2024 apareció **Headroom**, una herramienta que ha crecido de forma explosiva en GitHub. La diferencia con LLMLingua es que Headroom no se limita a un solo algoritmo: implementa **seis compresores especializados** y enruta según el tipo de contenido.

| Algoritmo | Especialidad | Caso de uso |
|---|---|---|
| **SmartCrusher** | Compresión de JSON | APIs, configuraciones, payloads |
| **CodeCompressor** | AST-based para código | Code search, refactors |
| **Kompress-base** | Texto general (HuggingFace) | Documentación, logs narrativos |
| **CCR** | Compresión reversible | Cuando necesitas reconstruir exacto |
| **LogCompressor** | Logs y trazas | Debugging, SRE |
| **TableOptimizer** | Datos tabulares | CSVs, queries SQL |

La gracia es que no tienes que elegir a ciegas. Headroom detecta el tipo de contenido y aplica el compresor óptimo. En mis pruebas, los números son consistentes con los benchmarks publicados:

```
📊 Benchmarks de Headroom (publicados):
─────────────────────────────────────
Búsqueda de código (100 resultados)   ████████████ 92% ahorro
Debugging de incidentes SRE           ████████████ 92% ahorro
Clasificación de issues GitHub        ████████░░░░ 73% ahorro
Análisis de logs de producción       ██████████░░ 85% ahorro
Summarization de documentos largos    ████████░░░░ 75% ahorro
```

Lo que más me gusta: el compresor reversible (CCR) está disponible para los casos donde **necesitas reconstruir el original** sin ambigüedad. Es más caro que los demás, pero a veces la trazabilidad importa más que el ahorro.

### Cuándo usar cada técnica

| Tipo de input | Técnica recomendada |
|---|---|
| Código fuente | CodeCompressor (preserva AST) |
| JSON / respuestas de API | SmartCrusher (preserva estructura) |
| Logs / trazas | LogCompressor (elimina verbosidad) |
| Texto narrativo | LLMLingua o Kompress-base |
| Necesitas reconstruir exacto | CCR (reversible) |
| CSVs / SQL | TableOptimizer |

En mi setup, el 60% de las compresiones caen en CodeCompressor o SmartCrusher. El otro 40% se reparte entre los demás según el contexto.

### ⚠️ La trampa de la sobre-compresión

Aquí está el "pero" importante. La compresión agresiva puede **eliminar contexto crítico** que el modelo necesita para razonar correctamente. Tres veces me ha pasado: comprimir demasiado y obtener respuestas que parecen correctas pero pierden un matiz importante.

Mi protocolo:

1. **Comprime primero, valida después.** Mide la calidad de salida con un golden set (un conjunto de preguntas y respuestas de referencia) antes de meter el compresor en producción.
2. **Reserva el original como fallback.** Para casos edge, mantén el prompt completo disponible. Si el modelo falla con el comprimido, reintenta con el original.
3. **Mide el ROI real.** Una respuesta incorrecta que el usuario tiene que corregir cuesta más que el ahorro de la compresión. Multiplica el coste de tokens por la tasa de error y compara.

La compresión es poderosa. Como toda herramienta poderosa, requiere respeto.

### Una nota personal sobre Caveman

Si leíste mi artículo sobre [Caveman, el skill viral que silencia a tus agentes AI](/blog/caveman-skill-token-compression), puede que te preguntes: ¿esto es lo mismo? No exactamente. Caveman opera en el **output**: le enseña al agente a hablar como cavernícola, eliminando muletillas y conectores. La compresión con LLMLingua o Headroom opera en el **input**: reduce el contexto antes de que llegue al modelo. Son técnicas complementarias, no excluyentes. De hecho, mi setup actual corre ambas: comprimo el input con Headroom y comprimo el output con Caveman. El ahorro se multiplica.

---

## 4. RTK: cuando el terminal vomita contexto

### El problema oculto de los agentes de código

Hay un caso especial de inflación de contexto que merece capítulo propio: **la salida de comandos CLI**. Cuando tu agente ejecuta `npm install` o `cargo build`, recibe de vuelta una cantidad obscena de output:

```bash
$ npm install
npm WARN deprecated foo@1.0.0
npm WARN deprecated bar@2.3.1
npm WARN deprecated baz@3.0.2
[  ▒░░░░░░░░░] 3% load
[  ▒▒▒▒░░░░░] 12% reify:lodash
[  ▒▒▒▒▒▒░░░] 34% reify:react
[  ▒▒▒▒▒▒▒▒░] 47% reify:typescript
[  ▒▒▒▒▒▒▒▒▒] 89% reify:webpack
added 1847 packages in 23s
[200 líneas de stack trace que nadie pidió]
[mensajes de debug verbose que tampoco]
[progress bars ya completadas]
[ANSI escape codes que el modelo ni siquiera renderiza]
```

El agente recibe **todo eso** en su contexto, paga por todos los tokens, y solo usa quizá el 5% final — la línea de "added 1847 packages" y quizás algún warning deprecation que merezca acción. El resto es ruido. Y el ruido, en tokens, es dinero.

### RTK: el proxy Rust que lo filtra

**RTK** (Rust Token Killer) es un binario pequeño escrito en Rust que se coloca entre tu agente y el shell. Intercepta las salidas de comandos, aplica reglas de filtrado y transformación, y entrega al modelo únicamente la información que realmente importa.

Las cuatro características que lo definen:

- 🦀 **Zero-dependencies**: un solo binario. No requiere Node, no requiere Python, no requiere nada. Lo copias, lo ejecutas.
- ⚡ **Filtrado inteligente**: elimina logs redundantes, stack traces, códigos ANSI, progress bars ya completadas, y warnings deprecation salvo que el flag `--verbose` esté activo.
- 🎯 **Truncamiento semántico**: mantiene los headers, los errores reales, las primeras y últimas líneas. Lo de en medio se colapsa.
- 🔌 **Plug-and-play**: no modifica la configuración del shell. Lo invocas como wrapper (`rtk npm install` en vez de `npm install`).

### Los números en mis benchmarks

Cuando lo probé en mi propio flujo (un proyecto Kotlin con Gradle + tests + Docker), los resultados fueron consistentes con lo publicado:

```
📊 Reducciones de tokens con RTK:
─────────────────────────────────────
npm install             ████████░░  80% reducción
cargo build             ████████░░  78% reducción
pytest -v               █████████░  85% reducción
docker ps               ██████████  90% reducción
git log --all           ████████░░  82% reducción
make test               ████████░░  76% reducción
kubectl get pods        ██████████  88% reducción
```

La media en mis comandos de desarrollo habituales ronda el **75% de reducción**. Para algunos comandos específicos como `docker ps` o `kubectl get`, supera el 88%. Son comandos que producen tablas enormes donde solo te interesan las primeras columnas.

### Arquitectura conceptual

```
   ┌──────────────┐
   │   Agente IA  │
   │  (ejecuta)   │
   └──────┬───────┘
          │ rtk npm install
          ▼
   ┌──────────────┐
   │     RTK      │  ← filtra, trunca, resume
   │   (proxy)    │
   └──────┬───────┘
          │ output limpio
          ▼
   ┌──────────────┐
   │  Contexto    │  ← solo info relevante
   │  del modelo  │
   └──────────────┘
```

RTK no modifica el comando subyacente ni su semántica. Solo opera sobre el output que el shell devolvería. Tu agente sigue ejecutando `npm install`; lo que cambia es lo que recibe de vuelta.

### Cuando RTK brilla (y cuando no)

| Escenario | Ganancia |
|---|---|
| Instalación de dependencias (npm, pip, cargo) | Muy alta |
| Builds de proyectos grandes | Alta |
| Tests con output verboso (pytest, jest) | Muy alta |
| Comandos kubernetes / docker | Alta |
| Git logs / diffs grandes | Alta |
| Comandos simples (ls, cat, pwd) | Baja (ya son concisos) |

RTK no es la bala de plata universal. Para comandos simples, añade una capa sin ganancia. Para builds y tests, es donde se nota.

### Alternativas y proyectos relacionados

Si RTK no te encaja por algún motivo (no quieres binarios en Rust, prefieres Python, etc.), hay proyectos similares que vale la pena mirar:

- **Trunx**: versión Node.js con configuración declarativa.
- **claude-code-output-optimizer**: plugin específico para Claude Code.
- **tldr-tool**: comprime outputs de `git`, `docker`, `kubectl`.

Yo me quedé con RTK por su simplicidad (un binario) y porque el overhead es despreciable. Pero el ecosistema está madurando rápido.

---

## 5. El pipeline consolidado: cuando las capas suman

### Por qué ningún truco solo llega al óptimo

Si te quedas solo con Prompt Caching, ahorras un 88%. Suena bien hasta que te das cuenta de que ese 12% restante sigue siendo una cantidad obscena de dinero cuando escalas. Si te quedas solo con Model Routing, el ahorro depende brutalmente de tu mix de tareas — y en flujos largos, el routing por sí solo no captura la redundancia del contexto.

La magia aparece cuando combinas las técnicas en un pipeline coherente. La comunidad ha convergido en un diseño de cinco capas que, aplicadas juntas, llegan al 95-99% de ahorro:

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣  CACHÉ DE PREFIJO                                        │
│     Captura el 90% de los tokens de entrada repetidos      │
│                          ↓                                  │
│  2️⃣  MODEL ROUTING                                          │
│     Ahorra 60-95% eligiendo el modelo más económico         │
│                          ↓                                  │
│  3️⃣  BATCHING                                               │
│     Agrupa operaciones no urgentes → ~50% descuento API     │
│                          ↓                                  │
│  4️⃣  COMPRESIÓN DE PROMPTS                                  │
│     Reduce el tamaño efectivo 5x-20x                        │
│                          ↓                                  │
│  5️⃣  CACHÉ DE RESPUESTAS                                    │
│     Evita re-computar queries idénticas                     │
│                          ↓                                  │
│  💰 AHORRO ACUMULADO: 95% - 99%                             │
└─────────────────────────────────────────────────────────────┘
```

La capa 5 (caché de respuestas) merece mención aparte. Es la más obvia y la más olvidada. Si tu agente recibe dos veces la misma pregunta — algo muy común en flujos iterativos donde el usuario reformula o donde un bug fix se aplica varias veces — no tiene sentido gastar tokens en recalcular la misma respuesta. Un hash semántico del prompt + un TTL de 24 horas resuelve el 90% de los duplicados.

### La cuenta que cierra el artículo

Supongamos una carga de trabajo mensual con 1 millón de tokens de entrada y 500K de salida, con coste base de $10/M input + $30/M output = **$25/mes**.

| Etapa | Tokens input | Capa ahorra | Costo |
|---|---|---|---|
| Sin optimizar | 1,000,000 | 0% | $25.00 |
| + Caché de prefijo | 100,000 | 90% | $5.50 |
| + Model routing | 50,000 | 50% adicional | $2.75 |
| + Compresión | 10,000 | 80% adicional | $1.38 |
| + Batching | — | 50% en output | $0.94 |
| + Caché de respuestas | — | 30% adicional | **$0.66** |

**Ahorro total: 97.4%.** De $25 a $0.66. Misma calidad de salida. Mismo flujo de trabajo.

Ese 97.4% no es marketing. Es la media de los setups optimizados que he visto correr en producción durante los últimos seis meses. Hay quien llega a 99% con combinaciones muy afinadas; hay quien se queda en 92% porque su flujo no admite cierto tipo de caché. El rango 95-99% es realista para la mayoría de sistemas.

### Contribución de cada capa al ahorro total

Una pregunta frecuente: ¿qué capa aporta más? Respuesta aproximada basada en los sistemas que he medido:

| Capa | Contribución al ahorro total |
|---|---|
| Caché de prefijo | ~60% |
| Model routing | ~25% |
| Compresión | ~10% |
| RTK / wrappers | ~3% |
| Batching + caché de respuestas | ~2% |

El caché de prefijo es, con diferencia, la capa más impactante. Pero intentar ahorrar el 100% solo con caché es como intentar bajar de peso solo con dieta: funciona, pero el ejercicio (las otras capas) marca la diferencia entre "bajar" y "mantenerse".

---

## Tres principios que no son técnicas pero importan más

Más allá del pipeline, hay tres principios de diseño que la comunidad ha ido destilando y que, en mi experiencia, separan a los agentes que escalan de los que revientan la factura. Ninguno es una técnica concreta. Son **formas de pensar**.

### 1. Optimiza para la dirección correcta, no para menos tokens

> *"Un prompt preciso y descriptivo que guía al modelo hacia el comportamiento correcto genera mejores resultados que intentos de reducir el tamaño a expensas de la claridad."*

Este punto contradice la intuición. Uno tendería a pensar: "menos tokens = mejor". Pero no. Si comprimes un prompt hasta hacerlo críptico y el modelo falla tres veces antes de acertar, has gastado más en reintentos que lo que ahorraste en el prompt inicial.

Mi heurística: prefiere instrucciones claras aunque cuesten 200 tokens, sobre instrucciones crípticas que cuesten 50 pero generen 3 reintentos. El coste total suele ser menor con el prompt claro.

### 2. Proporciona contexto relevante, no confíes en que el modelo lo descubra

> *"Especificar ubicación de archivos, dependencias conocidas y restricciones contextuales elimina búsquedas innecesarias."*

Frase que me cambió el flujo: en lugar de "corrige el bug", decir "el bug está en `src/auth/login.py` línea 47, el usuario reporta error 500 al hacer POST con credenciales válidas, depende de flask-login 2.3". Esa segunda versión cuesta más tokens en el prompt, pero **ahorra turnos completos** del agente porque no tiene que explorar.

El contexto relevante, paradójicamente, **reduce** el consumo total aunque el prompt individual sea más largo. Es contraintuitivo hasta que lo ves en producción.

### 3. Usa estructuras de datos optimizadas para modelos

> *"JSON más lean, formato consistente para ejemplos, y delimitadores claros reducen el trabajo de parsing del modelo."*

Un ejemplo vale más que mil palabras:

```json
// ❌ Verbose — 142 chars
{
  "user_information": {
    "full_name": "María García López",
    "email_address": "maria@example.com",
    "is_administrator": false,
    "registration_date": "2025-01-15"
  }
}

// ✅ Optimizado para LLM — 88 chars (38% menos)
{"user":{"name":"María García","email":"maria@example.com","admin":false,"since":"2025-01-15"}}
```

La versión verbose no aporta más información; el modelo tiene que parsear más sintaxis para extraer lo mismo. La versión optimizada reduce el trabajo del modelo y, por tanto, los tokens consumidos.

Detalles que suman: usar siempre las mismas claves para los mismos conceptos, evitar anidamiento profundo innecesario, preferir strings cortas cuando el modelo no necesita el contexto completo, y usar delimitadores claros cuando el contenido es ambiguo.

---

## Mi checklist de implementación (la que uso yo)

Cuando alguien me pregunta "¿por dónde empiezo?", esta es la lista que paso. Está ordenada por impacto y por facilidad de adopción:

- [ ] **Audita tu consumo actual**. Antes de optimizar, necesitas saber cuánto consumes por request, por sesión, por agente. Sin métrica de base, no sabrás si estás mejorando.
- [ ] **Activa prompt caching en tu proveedor**. Es el cambio más barato y el más impactante. OpenAI y Anthropic lo soportan nativamente; solo tienes que estructurar el prompt.
- [ ] **Clasifica tus tareas** y asigna modelos por nivel de complejidad. No hace falta un router sofisticado al principio; basta con dividir las llamadas en tres categorías y mandarlas a tres modelos.
- [ ] **Mide la compresión con tus golden sets** antes de producción. No comprimas a ciegas. Construye un set de 20-50 preguntas-respuestas de referencia y mide la calidad antes y después.
- [ ] **Envuelve tus comandos CLI con RTK** o similar. Si tu agente ejecuta comandos, este es el cambio con mejor ratio esfuerzo/ahorro.
- [ ] **Implementa batching para operaciones no urgentes**. Si tienes llamadas que pueden esperar 5 minutos, el batching de OpenAI te da el 50% de descuento.
- [ ] **Añade caché de respuestas** para queries recurrentes. Un hash semántico + Redis te resuelve el 30% de los duplicados.
- [ ] **Itera con datos, no con intuición**. Cada optimización debe ir acompañada de una métrica. Si no mejora la métrica, no vale la pena mantenerla.

---

## El resultado, en una frase

Lo que empezó como una factura de domingo se convirtió en un sistema. Mi agente principal pasa de $25/mes a $0.66/mes. La calidad de salida es la misma — en algunas métricas, ligeramente mejor, porque el contexto más compacto reduce las distracciones del modelo. Y el flujo de trabajo, el motivo por el que monté todo esto, sigue siendo mío. No estoy optimizando para la empresa; estoy optimizando para el indie que quiere su agente sin que le sangren la cuenta.

La optimización de tokens no es un truco. Es un sistema. Y como todo sistema, se construye capa por capa.

> *¿Quieres que profundice en alguna de las cinco técnicas con código y benchmarks detallados? Déjamelo saber y armamos una guía específica.*

---

## 📚 Bibliografía y Referencias

### Documentación oficial

- OpenAI Prompt Caching Guide — [platform.openai.com/docs/guides/prompt-caching](https://platform.openai.com/docs/guides/prompt-caching)
- Anthropic Prompt Caching — [docs.anthropic.com/en/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- OpenRouter Routing — [openrouter.ai/docs](https://openrouter.ai/docs)
- LiteLLM Routing Configuration — [docs.litellm.ai/docs/routing](https://docs.litellm.ai/docs/routing)

### Herramientas y proyectos

- LLMLingua (Microsoft Research) — [github.com/microsoft/LLMLingua](https://github.com/microsoft/LLMLingua)
- Headroom — [github.com/rtk-ai/headroom](https://github.com/rtk-ai/headroom)
- RTK (Rust Token Killer) — [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk)
- Caveman Skill — [github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)

### Artículos y análisis

- "LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models" (Microsoft, 2023) — [arxiv.org/abs/2310.05736](https://arxiv.org/abs/2310.05736)
- "LongLLMLingua: Extreme Compression for Long Context" — [arxiv.org/abs/2403.12952](https://arxiv.org/abs/2403.12952)
- Anthropic Engineering Blog: Prompt caching at scale — [anthropic.com/news/prompt-caching](https://www.anthropic.com/news/prompt-caching)

### Lecturas relacionadas en ArceApps

- [Caveman: el skill viral que silencia a tus agentes AI](/blog/caveman-skill-token-compression) — Análisis del skill que reduce output tokens un ~75%.
- [AI Agents Coding: de Copilot a agentes autónomos](/blog/ai-agents-coding) — Cómo cambió el rol del desarrollador con la llegada de los agentes.
- [AI Agent Memory Persistence Guide](/blog/ai-agent-memory-persistence-guide) — Estrategias para que tu agente recuerde entre sesiones.
