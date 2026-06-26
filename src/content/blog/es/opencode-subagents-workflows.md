---
title: "OpenCode Subagentes: Workflows, Casos de Uso y Superpowers"
description: "Aprende a diseñar flujos de trabajo con subagentes en OpenCode. Descubre cómo combinar modelos baratos y de frontera para automatizar tareas complejas."
pubDate: 2026-06-26
lastmod: 2026-06-26
author: ArceApps
keywords:
  - "opencode"
  - "subagentes"
  - "workflows"
  - "superpowers"
  - "automatización"
canonical: "https://arceapps.com/es/blog/opencode-subagents-workflows/"
heroImage: "/images/opencode-subagents-workflows.svg"
tags: ["ia", "opencode", "agents", "arquitectura"]
reference_id: "e5a3c9b7-1f2d-4e8a-b9c0-8d7e6f5a4b3c"
---

> **Lectura previa recomendada:** [Subagentes en OpenCode](/blog/opencode-subagents) · [Dentro de Superpowers](/blog/superpowers-deep-dive) · [Orquestando Agentes en CI/CD](/blog/orquestar-agentes-pipeline-cicd)

Hace un tiempo escribí sobre los [fundamentos de los subagentes en OpenCode](/blog/opencode-subagents), explicando cómo configurar el archivo `agents.json` y los diferentes modos de operación. Desde entonces, mi forma de usarlos ha evolucionado radicalmente. Ya no los veo simplemente como un atajo para evitar escribir prompts largos, sino como **componentes arquitectónicos para automatizar flujos de trabajo completos**.

Hoy vamos a profundizar mucho más. Vamos a ver cómo diseñar flujos de trabajo (workflows) combinando agentes "baratos" (SLMs o modelos rápidos) para tareas rutinarias y agentes de frontera (como Claude 3.5 Sonnet o GPT-4o) para el razonamiento profundo. Y lo más importante: cómo usar esta arquitectura para implementar metodologías rigurosas como [Superpowers](/blog/superpowers-deep-dive) de forma autónoma.

---

## La economía de los subagentes

Cuando empiezas a construir flujos de trabajo multi-agente, el coste (tanto en tokens como en latencia) se convierte rápidamente en un cuello de botella. No puedes pasarle cada pequeña decisión a un modelo de razonamiento pesado.

El secreto de los equipos de agentes eficientes es el **enrutamiento por complejidad**.

### Agentes baratos (SLMs / Modelos rápidos)
Modelos como Haiku, Gemini Flash o Llama 3 (8B) son perfectos para tareas de **clasificación, extracción y síntesis**. En mi stack actual, uso estos modelos para:

1. **El enrutador (Router Agent):** Analiza el prompt del usuario y decide a qué subagente especializado llamar.
2. **El resumidor (Summarizer):** Condensa el contexto de conversaciones largas antes de pasarlo al agente principal, ahorrando miles de tokens de contexto.
3. **El verificador de sintaxis (Linter Agent):** Revisa el código en busca de errores obvios de sintaxis o estilo antes de gastar recursos en un ciclo completo de testing.

### Agentes de frontera (Heavy-lifters)
Modelos como Claude 3.5 Sonnet o GPT-4o se reservan para las **tareas intensivas**:

1. **El arquitecto (Plan Agent):** Diseña la estructura de la solución y divide el problema en pasos.
2. **El revisor de seguridad (SecOps Agent):** Analiza dependencias y código en busca de vulnerabilidades complejas.
3. **El generador de código núcleo (Build Agent):** Escribe la lógica de negocio real.

---

## Caso de Uso 1: Automatizando "Superpowers"

Si has leído mi análisis sobre [Superpowers](/blog/superpowers-deep-dive), sabrás que es un framework fantástico porque obliga a los agentes a aplicar un riguroso Test-Driven Development (TDD). Pero ejecutar Superpowers manualmente requiere mucha supervisión. Aquí es donde los subagentes brillan.

Podemos crear un workflow en OpenCode que automatice el ciclo de Superpowers:

### La configuración de los agentes

En nuestro `.opencode/agents.json`, definimos tres agentes específicos:

```json
{
  "agent": {
    "super-plan": {
      "description": "Crea el plan técnico y los casos de prueba.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "temperature": 0.1,
      "permission": {
        "edit": "deny",
        "bash": "deny"
      }
    },
    "super-test": {
      "description": "Escribe los tests unitarios basados en el plan.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    },
    "super-code": {
      "description": "Implementa el código para que los tests pasen.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    }
  }
}
```

### El flujo de trabajo orquestado

En lugar de hacer todo de una vez, el flujo funciona así:

1. Llamamos a `@super-plan` para que analice el requerimiento y genere un documento de diseño con los casos de prueba esperados.
2. Una vez aprobado, llamamos a `@super-test`. Este agente **solo** tiene permitido escribir los archivos de test y ejecutar `pnpm test`. Obviamente, los tests fallarán porque no hay código. **Este es el comportamiento esperado en TDD.**
3. Finalmente, invocamos a `@super-code`. Su única directiva es: *"Lee el output de los tests fallidos y escribe el código mínimo necesario para que pasen"*.

Al dividir el problema, evitamos el clásico problema del agente que escribe el código y los tests a la vez, creando "tests felices" que siempre pasan pero no verifican nada real.

---

## Caso de Uso 2: Triaje automático de Issues (El agente explorador)

Otro workflow increíblemente útil para proyectos heredados o bases de código grandes es el **triaje automático**.

A menudo, nos enfrentamos a un bug reportado por un usuario: *"El botón de login no funciona cuando estoy en Safari"*. En lugar de abrir el proyecto y empezar a buscar con `grep`, uso un agente de exploración barato.

```markdown
<!-- ~/.config/opencode/agents/triage.md -->
---
description: Analiza un bug report y encuentra los archivos problemáticos
mode: subagent
model: google/gemini-1.5-flash
permission:
  edit: deny
  bash: allow
---

Eres un agente de triaje. Tu objetivo no es arreglar el bug, sino encontrar dónde está.
Usa comandos bash como `find`, `grep` y `cat` para buscar en la base de código.
Cuando encuentres los archivos relevantes, proporciona un resumen de 3 líneas
explicando qué componente podría estar fallando y qué archivos debe mirar el desarrollador.
```

Este agente usa un modelo ultrarrápido y barato. Su trabajo es hacer la "arqueología" del código. Una vez que `@triage` me dice que el problema está en `src/components/Auth/LoginButton.tsx`, puedo invocar a mi agente principal (el modelo caro) pasándole directamente ese archivo, ahorrando tiempo y contexto.

---

## Caso de Uso 3: El "Revisor Paranoico" (SecOps)

El código generado por IA tiende a ser funcional, pero no siempre seguro. Confiar a ciegas en un solo modelo para escribir y revisar su propio código es un antipatrón.

Para esto, configuro un subagente de revisión de seguridad estricto:

```json
{
  "agent": {
    "paranoia-review": {
      "description": "Revisa el código en busca de vulnerabilidades antes del commit.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "prompt": "Eres un auditor de seguridad extremadamente estricto. Busca inyecciones SQL, XSS, tokens expuestos y vulnerabilidades de lógica de negocio. NO sugieras mejoras de estilo, SOLO problemas de seguridad graves.",
      "temperature": 0.0
    }
  }
}
```

La clave aquí es el prompt y la temperatura de `0.0`. Queremos que este agente sea determinista y se enfoque exclusivamente en un dominio: la seguridad. Antes de hacer un push a producción, ejecuto `@paranoia-review revisa los cambios recientes` como último paso de mi flujo de trabajo.

---

## Conclusión

El verdadero poder de OpenCode no reside en tener un chat integrado en tu terminal, sino en su capacidad para actuar como un **director de orquesta**.

Al empezar a tratar a los subagentes como funciones atómicas especializadas —algunas baratas y rápidas para exploración, otras pesadas y metódicas para implementación— transformas tu entorno de desarrollo de un simple generador de código a una auténtica cadena de montaje de software.

La próxima vez que te enfrentes a una tarea compleja, no le pidas a tu agente principal que lo haga todo. Pregúntate: *¿Cómo dividiría esto un equipo de ingenieros reales?* Y luego, crea los subagentes para replicar ese equipo.
