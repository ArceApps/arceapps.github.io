---
title: "hmem: Memoria Jerárquica SQLite para Agentes IA que Realmente Persiste"
description: "Un análisis técnico de hmem (Humanlike Memory), un servidor MCP que modela la memoria humana en cinco niveles con lazy loading respaldados por SQLite + FTS5. Cómo el decaimiento Fibonacci, el envejecimiento logarítmico y un agente curador resuelven el problema de contexto entre sesiones y máquinas."
pubDate: 2026-03-27
heroImage: "/images/blog-hmem-sqlite-memoria-jerarquica.svg"
tags: ["IA", "Memoria", "Agentes", "MCP", "SQLite", "FTS5", "Arquitectura", "Open Source"]
reference_id: "c7d4e2f1-8b3a-4c9e-a5f7-2d1e8c6b4a3f"
---

> Este artículo se integra en la serie de memoria agéntica de este blog. Si quieres el panorama completo, empieza por [La Arquitectura de Memoria Persistente para Agentes IA](/blog/blog-memoria-persistente-agentes-ia). Para el ángulo de seguridad y privacidad, lee [Memoria Agéntica: Seguridad, Privacidad y el Futuro del Segundo Cerebro de la IA](/blog/blog-memoria-seguridad-privacidad-agentica). Para la propuesta de Microsoft Research, revisa [PlugMem: El Módulo de Memoria Plugin de Microsoft Research](/blog/blog-plugmem-microsoft-memoria-agentes). Este artículo analiza hmem, un servidor MCP open source que adopta un enfoque diferente y muy pragmático: modelar la memoria humana como una jerarquía de cinco niveles con lazy loading, respaldada por SQLite plano.

---

## El Mismo Problema, Otro Ángulo

El problema es siempre el mismo: los agentes IA son amnésicos por defecto. Cada sesión comienza desde cero. Cada máquina es una pizarra en blanco. Si trabajas en varios IDEs, en equipos distintos, o simplemente vuelves a un proyecto después de una semana, tu agente no tiene idea de lo que hizo antes.

Las soluciones que hemos visto hasta ahora — el grafo de conocimiento de PlugMem, la jerarquía de ficheros del método PARA, el vector store de Mem0 — atacan el problema desde ángulos arquitectónicos distintos. hmem (Humanlike Memory) lo afronta desde un ángulo deliberadamente humano: modelar los cinco niveles de detalle que usa la memoria humana y dejar que el agente decida cuánto necesita cargar en cada momento.

En retrospectiva parece obvio. Los humanos no reproducen recuerdos verbatim completos cuando toman una decisión. Empezamos con un resumen grueso ("la semana pasada trabajé en la autenticación") y solo profundizamos en los detalles cuando la tarea lo requiere ("recuerdo que usé bcrypt con factor de coste 12"). hmem aplica esta misma lógica de lazy loading al contexto del agente.

---

## Qué es hmem

hmem es un servidor MCP (Model Context Protocol) creado por Bumblebiber que proporciona memoria persistente y jerárquica a agentes IA. Sus datos se almacenan en ficheros `.hmem` (que en realidad son bases de datos SQLite), haciendo la memoria completamente portátil: lleva el fichero contigo y la memoria del agente te acompaña.

El nombre "Humanlike Memory" no es marketing vacío. Las decisiones de diseño del sistema están modeladas explícitamente sobre conceptos de ciencias cognitivas: recuerdo jerárquico, puntuación por recencia y frecuencia, decaimiento temporal y curación activa.

El proyecto está actualmente en v2.0+ con APIs estables, bajo licencia open source, y es compatible con todas las herramientas de codificación IA relevantes: Claude Code, Gemini CLI, Cursor, Windsurf y OpenCode.

**La instalación es un único comando:**

```bash
npx hmem-mcp init
```

Ese comando configura el servidor MCP y genera los ficheros de habilidades (slash commands) para las herramientas que hayas configurado.

---

## La Arquitectura de Cinco Niveles

El núcleo de hmem es su jerarquía de lazy loading en cinco niveles. Cada nivel es progresivamente más detallado, y los agentes cargan solo los niveles que realmente necesitan.

### Nivel 1: Resumen Grueso (Siempre Cargado al Inicio)

La capa más ligera, siempre presente en el contexto desde el primer mensaje. Equivale al nivel "de qué va este agente/proyecto": quién es el agente, cuál es su rol principal y los trazos más gruesos del conocimiento acumulado.

Cargar solo este nivel consume tokens mínimos. Para la mayoría de los turnos conversacionales es suficiente. El agente sabe dónde está sin necesitar saber todo lo que ha hecho.

### Nivel 2: Más Detalle

Cuando la tarea requiere algo más de contexto, el agente carga el Nivel 2. Esto añade resúmenes categorizados y clusters temáticos. No hechos individuales, sino grupos de conocimiento relacionado que aportan orientación sin saturar el contexto.

### Nivel 3: Contexto Profundo

El Nivel 3 es donde viven los patrones, comportamientos aprendidos y relaciones recurrentes. Si el agente ha descubierto que siempre prefieres un cierto estilo de código, o que una biblioteca en particular está vetada en el proyecto, ese tipo de regla contextual reside aquí.

### Nivel 4: Especificidades Granulares

Aquí se acumulan hechos específicos, decisiones concretas y detalles puntuales. "El módulo de autenticación fue refactorizado el 15 de marzo para usar JWTs en lugar de sesiones." "El pipeline de CI fallaba por una variable de entorno ausente." El registro granular de lo que realmente ocurrió.

### Nivel 5: Detalle Completo Verbatim

El nivel más profundo. Transcripciones verbatim en bruto, diffs de código completos, mensajes de error exactos. Se carga solo cuando la tarea requiere genuinamente reconstruir exactamente lo que se hizo, no solo qué pasó a alto nivel.

El resultado práctico de esta jerarquía: en la mayoría de las sesiones, el agente opera eficientemente en los Niveles 1–3 y solo profundiza en 4–5 cuando es estrictamente necesario. Esto reduce drásticamente el consumo de tokens en comparación con sistemas que inyectan toda la memoria en cada ventana de contexto.

---

## El Motor de Búsqueda Interno: SQLite + FTS5

El backend de hmem es SQLite usando la extensión FTS5 (Full Text Search 5). Es una elección arquitectónica interesante comparada con el enfoque de vector store al que la mayoría de sistemas de memoria recurren por defecto.

**¿Por qué FTS5 en lugar de embeddings?**

Los vector stores con embeddings son poderosos para similitud semántica, pero tienen costes reales:
- La generación de embeddings requiere o llamadas a API (dinero) o un modelo local (cómputo).
- Las bases de datos vectoriales añaden complejidad operacional.
- La similitud semántica puede devolver resultados plausibles pero contextualmente erróneos.

FTS5 hace algo diferente: búsqueda lexical de texto completo con ranking sofisticado. Las búsquedas son exactas (no "similares"), pero el ranking es matizado (frecuencia, recencia, relaciones). Para el tipo de información que almacenan los agentes — código, comandos, decisiones, hechos — esto es a menudo más preciso que la búsqueda semántica.

FTS5 también permite los algoritmos de ranking específicos que usa hmem, que veremos a continuación.

---

## Algoritmos de Decaimiento: Fibonacci y Envejecimiento Logarítmico

Dos mecanismos de decaimiento trabajan conjuntamente para mantener la memoria útil sin saturar al agente con información obsoleta.

### Caché de Sesión: Decaimiento Fibonacci

Dentro de una sesión, hmem usa una función de decaimiento Fibonacci para suprimir los recuerdos que ya han sido recuperados. La primera vez que se recupera una entrada de memoria, puntúa con valor completo. Las recuperaciones posteriores dentro de la misma sesión se penalizan siguiendo la secuencia Fibonacci, asegurando que el agente obtenga información fresca y relevante en lugar de ciclar repetidamente por los mismos resultados en caché.

La elección de Fibonacci es no obvia y vale la pena señalarla. La secuencia crece lo suficientemente rápido como para suprimir con fuerza las entradas repetidas, pero no tan agresivamente como para que un recuerdo genuinamente importante sea inaccesible si es necesario múltiples veces en una sesión.

### Entre Sesiones: Decaimiento Logarítmico por Edad

Para las entradas accedidas en múltiples sesiones, hmem aplica decaimiento logarítmico por edad. Los recuerdos reciben una puntuación menos prominente con el tiempo, pero nunca desaparecen del todo (el logaritmo nunca llega a cero). Esto replica cómo funciona la memoria humana a largo plazo: las experiencias antiguas son menos accesibles directamente, pero no se borran — pueden recuperarse con esfuerzo explícito.

Juntos, estos dos mecanismos garantizan que:
1. Dentro de una sesión, se mantiene la variedad (Fibonacci previene la repetición).
2. Entre sesiones, se premia la recencia (el envejecimiento logarítmico favorece el conocimiento reciente).

---

## Organización Más Allá de la Búsqueda: Favoritos, Etiquetas y Hashtags

hmem añade una capa de curación sobre la búsqueda central. Las entradas de memoria pueden tener:

- **Favoritos (Bookmarks)**: Marca entradas específicas como especialmente importantes. Reciben un boost de puntuación en la recuperación.
- **Fijadas (Pinned)**: Fuerza a que ciertas entradas aparezcan siempre en el contexto, independientemente del scoring de relevancia.
- **Marcadas como Obsoletas**: Señala que una entrada está desactualizada sin eliminarla. Útil para rastrear decisiones que fueron cambiadas y por qué.
- **Marcadas como Secretas**: Entradas que no deben aparecer en contextos compartidos (útil cuando un fichero hmem es compartido entre un equipo pero cierta información es específica de un rol).
- **Hashtags**: Agrupación temática libre, que permite recuperación por categoría (p.ej. `#arquitectura`, `#rendimiento`, `#pendiente`).

Esta riqueza organizativa supera a la mayoría de sistemas de memoria para agentes. El típico vector store te da "recuperar cosas similares". hmem te da una taxonomía de gestión de la memoria que se parece a un sistema de gestión de conocimiento personal.

---

## El Agente Curador

Una de las características más interesantes de hmem es el concepto del agente curador. Los sistemas de memoria acumulan ruido: entradas redundantes, hechos desactualizados, contradicciones, ruido de bajo valor de conversaciones rutinarias. Sin mantenimiento, la memoria se degrada.

El curador de hmem es un agente cuya función es mantener la salud de la memoria. Funciona como proceso separado (o bajo demanda) y realiza:

- **Deduplicación**: Fusiona entradas que capturan la misma información de forma redundante.
- **Marcado de obsolescencia**: Identifica entradas que han sido superadas por información más reciente.
- **Consolidación**: Combina múltiples entradas granulares de Nivel 4 en un patrón coherente de Nivel 3.
- **Etiquetado**: Mejora la organización categórica de las entradas acumuladas.

Este concepto — un curador dedicado que mantiene la calidad de la memoria — resuelve un problema real que la mayoría de sistemas de memoria ignoran: la acumulación a largo plazo de basura. Es análogo a cómo la memoria humana realiza consolidación durante el sueño: no solo almacenando nuevas experiencias sino reorganizando y podando el almacén existente.

Para un desarrollador indie que ejecuta agentes durante meses en un proyecto, esta es la diferencia entre memoria que mejora con el tiempo y memoria que se vuelve progresivamente menos útil.

---

## Variables de Entorno y Configuración

hmem usa tres variables de entorno clave para configurar la identidad del agente:

```bash
HMEM_PROJECT_DIR=/ruta/a/tu/proyecto/.hmem
HMEM_AGENT_ID=mi-identificador-unico-de-agente
HMEM_AGENT_ROLE=developer  # o reviewer, tester, architect, etc.
```

El `HMEM_AGENT_ROLE` es usado por los sistemas de recuperación y curación para filtrar las entradas relevantes al rol actual del agente. Un agente desarrollador y un agente arquitecto trabajando en el mismo proyecto pueden compartir un fichero hmem pero recuperar vistas diferentes de él.

### Slash Commands (Ficheros de Habilidades)

Tras ejecutar `npx hmem-mcp init`, hmem genera ficheros de habilidades para cada herramienta configurada. Estos se convierten en slash commands dentro de tu IDE o CLI:

- `/hmem-read`: Carga memoria para el contexto actual.
- `/hmem-write`: Guarda explícitamente un hecho o decisión en memoria.
- `/hmem-search`: Búsqueda directa de texto completo contra el almacén de memoria.
- `/hmem-curate`: Activa el agente curador para limpiar la memoria.
- `/hmem-status`: Muestra estadísticas actuales de memoria (entradas, niveles, puntuaciones de decaimiento).

El patrón es consistente con el enfoque de [Agent Skills y contexto dinámico](/blog/blog-agent-skills-contexto-dinamico) que hemos explorado en este blog. Las operaciones de memoria se convierten en comandos explícitos que el agente puede invocar, en lugar de procesos automáticos opacos.

---

## Compatibilidad Multi-Herramienta

hmem corre como servidor MCP, lo que significa que se integra con cualquier herramienta que hable el Model Context Protocol. La lista de herramientas soportadas actualmente incluye:

- **Claude Code** (el agente CLI de Anthropic)
- **Gemini CLI** (el agente CLI de Google)
- **Cursor** (editor de código AI-first)
- **Windsurf** (el IDE de Codeium)
- **OpenCode** (agente de codificación open source)

Dado que la memoria se almacena en un fichero SQLite `.hmem` portátil, puedes cambiar de herramienta a mitad de proyecto sin perder la memoria acumulada. Empieza una tarea en Cursor, continúala en Claude Code, y el agente retoma exactamente donde lo dejó. Para alguien que trabaja con varias herramientas (y la mayoría de los desarrolladores lo hace), esto es genuinamente valioso.

---

## Evaluación Honesta: Puntos Fuertes y Limitaciones

**Donde hmem destaca:**

- **Eficiencia de tokens**: El lazy loading en cinco niveles es el enfoque más reflexivo de gestión de tokens que he visto en un sistema de memoria. Te obliga a pensar qué granularidad necesita realmente la tarea actual.
- **Portabilidad**: Los ficheros SQLite son universalmente comprensibles. Puedes inspeccionar tu memoria con cualquier navegador SQLite, hacer backup con `cp` y moverla entre máquinas sin herramientas especiales.
- **Diseño pragmático**: La combinación de FTS5 + algoritmos de decaimiento es una alternativa bien razonada al vector store por defecto. Es más simple de operar, más barata de ejecutar y frecuentemente más precisa para conocimiento estructurado.
- **Concepto de curación**: El agente curador aborda el problema de calidad a largo plazo que la mayoría de sistemas de memoria ignoran.

**Donde hay que ser cauto:**

- **Proyecto joven**: Con 9 estrellas en GitHub (en el momento de escribir esto), hmem está en fase temprana. La API puede estabilizarse, pero el soporte de la comunidad y las herramientas del ecosistema son aún limitados.
- **Límites de FTS5**: La búsqueda de texto completo con decaimiento es poderosa para memoria factual, pero no funciona bien para consultas genuinamente semánticas. Si tu caso de uso requiere "encontrar algo conceptualmente similar aunque no coincidan las palabras clave", echarás de menos la búsqueda vectorial.
- **Madurez del curador**: El agente curador es un concepto atractivo, pero en un proyecto joven, la curación automática de memoria también puede introducir errores. La revisión manual de las acciones de curación es prudente hasta tener confianza en su comportamiento.
- **Documentación**: Como muchos proyectos open source tempranos, la documentación es funcional pero escasa. Espera leer el código fuente para entender los casos límite.

---

## Dónde Encaja hmem en el Ecosistema de Memoria

Tras analizar PlugMem, PARA, Mem0 y ahora hmem, el panorama de memoria para agentes IA empieza a parecerse a un ecosistema maduro en lugar de una colección de soluciones ad hoc.

Cada sistema tiene una filosofía diferenciada:

| Sistema | Filosofía | Backend | Mejor para |
|---------|-----------|---------|------------|
| PlugMem | Grafo de conocimiento proposicional + prescriptivo | Personalizado | Investigación; compartir conocimiento multi-agente |
| Mem0 | Recuperación semántica vectorial | Vector DB | Apps que requieren similitud semántica |
| Método PARA | Jerarquía basada en ficheros | Markdown | Flujos de trabajo de desarrollador, legible por humanos |
| **hmem** | **Lazy loading jerárquico, FTS + decaimiento** | **SQLite** | **Flujos multi-herramienta, eficiencia de tokens** |

hmem ocupa un nicho útil: es más estructurado que los enfoques basados en ficheros planos, más simple de operar que los vector stores, y más portátil que las soluciones específicas de cada framework.

---

## Conclusión Práctica para Desarrolladores Indie

Si trabajas con agentes IA de codificación en varias herramientas o máquinas, hmem vale la pena explorarlo. El setup con `npx hmem-mcp init` tiene poca fricción, el backend SQLite no impone ninguna sobrecarga operacional, y la arquitectura de cinco niveles te hará pensar con más cuidado sobre cuánto contexto de memoria necesita realmente tu agente en cada paso.

La clave que hmem codifica — que no toda la memoria necesita cargarse completamente en todo momento — es aplicable más allá de esta herramienta específica. Tanto si adoptas hmem como si no, diseñar la memoria en torno a niveles de granularidad con lazy loading es un patrón que vale la pena interiorizar.

Para un proyecto con 9 estrellas en GitHub, hmem muestra un diseño sorprendentemente reflexivo. Vale la pena seguirlo, experimentar con él en flujos de trabajo de agentes no críticos, y observar cómo madura el proyecto.

---

## Referencias

1. **hmem — GitHub Repository** — Bumblebiber (2025). El servidor MCP hmem que implementa memoria jerárquica humanlike con SQLite + FTS5.
   - [https://github.com/Bumblebiber/hmem](https://github.com/Bumblebiber/hmem)

2. **r/vibecoding — "My agent knows exactly what it did a week ago"** — Reddit (2025). Discusión original de la comunidad que introduce hmem y la motivación detrás de su diseño.
   - [https://www.reddit.com/r/vibecoding/comments/1rjlki3/my_agent_knows_exactly_what_it_did_a_week_ago/](https://www.reddit.com/r/vibecoding/comments/1rjlki3/my_agent_knows_exactly_what_it_did_a_week_ago/)

3. **La Arquitectura de Memoria Persistente para Agentes IA** — ArceApps Blog (2026). Análisis amplio de frameworks de memoria agéntica incluyendo Mem0, Cognee y OpenClaw.
   - [/blog/blog-memoria-persistente-agentes-ia](/blog/blog-memoria-persistente-agentes-ia)

4. **Memoria Agéntica: Seguridad, Privacidad y el Futuro del Segundo Cerebro de la IA** — ArceApps Blog (2026). Análisis de los riesgos de seguridad y privacidad en la memoria persistente de agentes.
   - [/blog/blog-memoria-seguridad-privacidad-agentica](/blog/blog-memoria-seguridad-privacidad-agentica)

5. **PlugMem: El Módulo de Memoria Plugin de Microsoft Research** — ArceApps Blog (2026). Análisis en profundidad de la arquitectura de grafo de conocimiento proposicional y prescriptivo de PlugMem.
   - [/blog/blog-plugmem-microsoft-memoria-agentes](/blog/blog-plugmem-microsoft-memoria-agentes)

6. **El Método PARA y la Memoria IA Basada en Ficheros** — ArceApps Blog (2026). Exploración del enfoque de memoria local basado en ficheros usando Markdown y el método PARA.
   - [/blog/blog-metodo-para-memoria-ia-archivos](/blog/blog-metodo-para-memoria-ia-archivos)

7. **Agent Skills y Contexto Dinámico** — ArceApps Blog (2026). Cómo usar ficheros de habilidades y slash commands para dar a los agentes contexto estructurado y bajo demanda.
   - [/blog/blog-agent-skills-contexto-dinamico](/blog/blog-agent-skills-contexto-dinamico)
