# Ideas de Artículos: Agentes IA, Workflows y Herramientas

## 1. Contexto Actual del Blog
Los artículos actuales del blog se centran en la intersección entre el desarrollo (particularmente Android y Kotlin) y la Inteligencia Artificial. Los enfoques principales incluyen:
*   **Persistencia de Contexto:** El uso de archivos `AGENTS.md` para evitar la fatiga del contexto y estandarizar reglas.
*   **Agentes Especializados:** En lugar de chats generales, se aboga por agentes con roles definidos (ej. auditor de seguridad "Sentinel", ingeniero de rendimiento "Bolt").
*   **Agent Skills:** El uso de habilidades encapsuladas (como revisión de *Conventional Commits* o detección de *Memory Leaks*) para herramientas como Gemini o Copilot.

## 2. Tendencias y Temas Extraídos de Reddit
Tras analizar las discusiones recientes en comunidades como r/LocalLLaMA, r/artificial y r/ollama, se destacan los siguientes temas con sus respectivos enlaces de referencia:

*   **Frameworks en Producción:** LangGraph, CrewAI, PydanticAI, Smolagents, y Atomic Agents como los estándares de facto para orquestación de agentes. ([Ver discusión en r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1sssc2p/best_production_agentic_frameworks/))
*   **Agent Harnesses & Herramientas Open Source:** Herramientas como OpenCode y OpenClaw para manejar agentes que ejecutan código local y automatizan workflows en repositorios. ([Discusión 1](https://www.reddit.com/r/LocalLLaMA/comments/1strbwt/what_open_source_harnessagentic_coding_framework/), [Discusión 2](https://www.reddit.com/r/LocalLLaMA/comments/1tdu2nt/recommendations_for_an_agentic_harness_not/))
*   **Memoria como Motor de Workflows:** La memoria de los agentes no es solo para "trivia", sino que es el núcleo para orquestar workflows complejos. ([Ver discusión en r/ollama](https://www.reddit.com/r/ollama/comments/1syaumv/memory_for_personal_ai_agents/))
*   **Seguridad Agéntica (Agentic Security):** Recopilaciones de incidentes y catástrofes causadas por agentes autónomos ("Rogue AI agents"), resaltando la necesidad de medidas de seguridad estrictas. ([Ver discusión en r/artificial](https://www.reddit.com/r/artificial/comments/1sgm6dz/i_compiled_every_major_ai_agent_security_incident/))
*   **Agentes Locales (Ollama) en el Día a Día:** Casos de uso reales de agentes creados sobre Ollama para automatizar tareas. ([Ver discusión en r/ollama](https://www.reddit.com/r/ollama/comments/1s5jcej/built_a_local_ai_agent_on_top_of_ollama_that_i/))

## 3. Propuestas de Nuevos Artículos

Combinando la línea editorial del blog (desarrollo, Android, arquitectura limpia, eficiencia local) con las tendencias descubiertas en Reddit, propongo los siguientes artículos:

### Idea 1: LangGraph vs PydanticAI en el ecosistema Android (Inferencia Local)
*   **Concepto:** Una comparativa técnica de cómo integrar frameworks de orquestación (como LangGraph o PydanticAI) para construir *harnesses* de agentes locales que asistan en el desarrollo móvil usando modelos cuantizados (SLMs) vía Ollama o Gemini Nano.
*   **Enfoque:** ¿Cuál framework es mejor para crear tu propio "Bolt" o "Sentinel" que corra de forma local en tu máquina de desarrollo sin enviar código propietario a la nube?

### Idea 2: Seguridad Agéntica en CI/CD: Evitando "Catástrofes" con Sentinel
*   **Concepto:** Inspirado en las discusiones sobre incidentes de seguridad de agentes, este artículo profundizará en cómo limitar y "enjaular" (sandboxing) agentes autónomos en pipelines de GitHub Actions.
*   **Enfoque:** Cómo configurar permisos, validaciones de *human-in-the-loop* y usar roles de lectura (como nuestro auditor Sentinel) para evitar que un agente modifique dependencias maliciosas u oculte vulnerabilidades.

### Idea 3: Implementando "Memoria a Largo Plazo" en tus Agentes Locales con Ollama
*   **Concepto:** Pasar del `AGENTS.md` estático a una memoria dinámica. Cómo construir un flujo de trabajo donde el agente recuerde decisiones arquitectónicas tomadas hace meses (ej. "¿Por qué elegimos Koin sobre Hilt en este módulo?").
*   **Enfoque:** Integración de bases de datos vectoriales ligeras (como SQLite con pgvector o similar local) en workflows diarios controlados por scripts simples o atajos en el móvil.

### Idea 4: OpenCode y el Fin del Tool-Calling Manual
*   **Concepto:** Un análisis de los "Agent Harnesses" emergentes (como OpenCode) que abstraen la complejidad de llamar a herramientas, permitiendo que la IA interactúe directamente con tu IDE o terminal.
*   **Enfoque:** Un caso práctico de automatización de un workflow repetitivo en Android (ej: generar un CRUD completo con ViewModel, Repositorio y UI en Compose) utilizando un arnés de código abierto.
