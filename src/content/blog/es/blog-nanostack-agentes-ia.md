---
title: "NanoStack: El Framework de Agentes IA que Piensa Antes de Programar"
description: "Descubre NanoStack, el framework open source sin dependencias que convierte cualquier agente de IA en un equipo de ingeniería completo. Compatible con Claude Code, Gemini CLI, OpenAI Codex, Cursor y más."
pubDate: 2026-03-29
heroImage: "/images/nanostack-hero.svg"
tags: ["Agentes IA", "NanoStack", "Gemini CLI", "Claude Code", "OpenAI", "Productividad", "Open Source"]
reference_id: "f8a3d12e-4b7c-4e9a-a5f2-c8d6e9b0f123"
---

La mayoría de las herramientas de IA para programar responden a una pregunta simple: *"¿Cómo escribo esto?"* NanoStack primero responde a una diferente: *"¿Deberíamos construir esto siquiera?"*

Esta distinción es el núcleo de [NanoStack](https://github.com/garagon/nanostack), un framework open source que estructura cualquier agente de IA en un flujo de trabajo de equipo de ingeniería completo. No reemplaza tu IA de elección — le da un proceso. Ya uses Claude Code, Gemini CLI, OpenAI Codex o Cursor, el mismo sprint funciona igual en todos.

## 🧠 ¿Qué es NanoStack?

NanoStack, creado por [Gustavo Aragón](https://github.com/garagon) e inspirado en [gstack de Garry Tan](https://github.com/garrytan/gstack), es una colección de 8 **agent skills** que modelan el ciclo de vida completo de un sprint de software. Cada skill encarna un rol dentro de un equipo de ingeniería:

| Skill | Rol | Qué hace |
|---|---|---|
| `/think` | CEO / Fundador | Cuestiona el requisito. ¿Es este el problema correcto? |
| `/nano` | Engineering Manager | Genera especificaciones técnicas y de producto antes de escribir código |
| `/review` | Staff Engineer | Code review en dos pasadas: estructural y adversarial |
| `/qa` | QA Lead | Testing funcional, visual y de navegador |
| `/security` | Security Engineer | Escanea secretos, inyecciones, auth y vulnerabilidades IA/LLM |
| `/ship` | Release Engineer | Creación de PR, monitoreo de CI y verificación post-despliegue |
| `/guard` | Capa de Seguridad | 28 reglas de bloqueo que previenen comandos destructivos |
| `/conductor` | Orquestador | Coordina sesiones paralelas de agentes |

La diferencia clave con un copiloto de IA convencional: estos skills se alimentan entre sí. `/nano` genera un artefacto de especificación que `/review` usa más tarde para detectar desviaciones de alcance. Los hallazgos de `/review` se cruzan con los resultados de `/security`. Nada se pierde por el camino.

## 🔄 El Sprint: Un Proceso, No una Colección de Herramientas

El modelo mental de NanoStack es un sprint. Se ejecuta en orden:

```
/think → /nano → build → /review → /qa → /security → /ship
```

Esto no va de imponer burocracia. Va de hacer las preguntas correctas en el momento adecuado. El valor real aparece cuando `/think` rechaza una petición de funcionalidad:

```
Tú:     Necesito añadir notificaciones push a mi app. Los usuarios
        se pierden las respuestas a sus publicaciones.
Tú:     /think

Agente: ¿Cómo se las arreglan los usuarios hoy?

Tú:     Abren la app 3-4 veces al día solo para comprobar.

Agente: Eso es alto engagement. Ya vuelven solos.
        El problema no es que no puedan ser contactados. El problema
        es que cuando llegan, no pueden ver qué ha cambiado.

        Es un problema de "freshness", no de mensajería.

        Un sistema de notificaciones es un proyecto de 3 semanas.
        Un punto rojo en el icono de navegación se puede lanzar
        esta tarde.

        RECOMENDACIÓN: Reduce el alcance. Lanza el punto. Mira si
        las quejas bajan. Si no bajan, entonces construye las
        notificaciones, pero ahora con datos, no con suposiciones.
```

Esto es lo que NanoStack entiende por "cuestionar el requisito antes de escribir el código". Si saltas `/think` y vas directamente a `/nano`, el agente igualmente planifica — simplemente no cuestiona la premisa.

## ⚡ Cero Dependencias, Una Instalación

NanoStack no tiene paso de build ni dependencias externas en tiempo de ejecución. Solo necesitas `jq`, `git` y un agente de IA compatible.

**Agentes compatibles:** Claude Code (por defecto), Gemini CLI, OpenAI Codex, Cursor, OpenCode, Amp, Cline, Antigravity.

### Instalación con git clone (recomendado)

```bash
git clone https://github.com/garagon/nanostack.git ~/.claude/skills/nanostack
cd ~/.claude/skills/nanostack && ./setup
```

El script de setup detecta automáticamente qué agentes tienes instalados y enlaza los skills. Puedes especificar un host concreto:

```bash
./setup --host gemini     # Solo Gemini CLI
./setup --host codex      # Solo OpenAI Codex
./setup --host cursor     # Solo Cursor
./setup --host auto       # Todos los agentes detectados
```

### Instalación con npx (inicio rápido)

```bash
npx skills add garagon/nanostack -g --full-depth
```

El flag `-g` instala globalmente (disponible en todos los proyectos). `--full-depth` instala los 8 skills. Este método copia archivos en lugar de usar symlinks, por lo que características avanzadas como `--rename` o `bin/analytics.sh` no estarán disponibles.

### Instalación como extensión de Gemini CLI

```bash
gemini extensions install https://github.com/garagon/nanostack --consent
```

### Actualizar

```bash
~/.claude/skills/nanostack/bin/upgrade.sh
```

Descarga los últimos cambios y re-ejecuta el setup. Sin paso de build. Los cambios se aplican de inmediato gracias a los symlinks.

## 🛡️ Guard: Barandillas de Seguridad para Agentes Autónomos

A medida que los agentes se vuelven más autónomos, crece el riesgo de comandos destructivos. `/guard` es un sistema de seguridad en tres capas que intercepta operaciones peligrosas antes de que se ejecuten:

- **Nivel 1 — Allowlist**: Los comandos de solo lectura (`ls`, `cat`, `git status`) saltan todas las comprobaciones.
- **Nivel 2 — In-project**: Las operaciones confinadas al repositorio git actual pasan sin restricciones. El control de versiones es la red de seguridad.
- **Nivel 3 — Pattern matching**: Todo lo demás se comprueba contra 28 reglas de bloqueo que cubren: borrado masivo, force push, eliminación de bases de datos, despliegues a producción sin revisión, ejecución remota de código y bypass de seguridad.

Cuando un comando es bloqueado, `/guard` no dice simplemente "no". Sugiere una alternativa más segura:

```
BLOQUEADO [G-007] El force push sobreescribe el historial remoto
Categoría: history-destruction
Comando: git push --force origin main

Alternativa más segura: git push --force-with-lease
  (falla si el remoto cambió, evita sobreescribir el trabajo de otros)
```

El agente lee este feedback y reintenta automáticamente con el comando más seguro. Todas las reglas son configurables en `guard/rules.json`, permitiéndote añadir patrones propios específicos de tu stack o infraestructura.

## 🤖 Autopilot: Aprueba una Vez, el Agente Lanza Todo

Una vez que has validado la idea con `/think`, puedes dejar que el agente ejecute el sprint completo sin supervisión:

```bash
/think --autopilot
```

`/think` sigue siendo interactivo: respondes las preguntas del agente y apruebas el brief. Tras tu aprobación, todo lo demás corre automáticamente:

```
/nano → build → /review → /security → /qa → /ship
```

El autopilot solo se detiene si encuentra algo que no puede resolver por sí mismo:
- Un problema bloqueante en `/review` que requiere una decisión de criterio
- Una vulnerabilidad `CRÍTICA` o `ALTA` en `/security`
- Tests fallidos en `/qa`
- Una pregunta de producto que el contexto disponible no responde

Entre pasos, el agente informa del progreso sin pedir confirmación:

```
Autopilot: build completo. Ejecutando /review...
Autopilot: review limpio (5 hallazgos, 0 bloqueantes). Ejecutando /security...
Autopilot: security grado A. Ejecutando /qa...
Autopilot: qa superado (12 tests, 0 fallidos). Ejecutando /ship...
```

Esto es el significado práctico de "agéntico": el humano define el objetivo, el sistema gestiona la ejecución.

## 🎯 Specs por Alcance: El Plan Justo

Una frustración común con los agentes de IA es que van directamente a la implementación, saltándose la planificación que previene el retrabajo. `/nano` ajusta automáticamente la especificación en función de la complejidad detectada:

| Alcance | Detonante | Qué obtienes |
|---|---|---|
| **Pequeño** | 1–3 archivos | Solo pasos de implementación |
| **Medio** | 4–10 archivos | Spec de producto + pasos de implementación |
| **Grande** | 10+ archivos | Spec de producto + spec técnica + pasos |

La spec de producto cubre: problema, solución, historias de usuario, criterios de aceptación, flujo de usuario, casos límite y qué queda explícitamente fuera de alcance. La spec técnica añade: arquitectura, modelo de datos, contratos de API, integraciones, consideraciones de seguridad y plan de rollback.

Crucialmente, las specs se presentan para tu aprobación antes de que el agente escriba una sola línea de código. Como dicen los docs de NanoStack: *"Si la spec está mal, todo lo que viene después estará mal."*

## 🧘 El Zen de NanoStack

Lo que distingue filosóficamente a NanoStack es que aplica criterio de ingeniería, no solo capacidad de ingeniería. El archivo `ZEN.md` del repositorio lo recoge bien:

> *Cuestiona el requisito antes de escribir el código.*
> *Borra lo que no debería existir.*
> *Si nadie usaría una v1 rota, el alcance está mal.*
> *Reduce el alcance, no la ambición.*
> *Lanza la versión que se puede lanzar hoy.*
> *La seguridad no es un tradeoff. Es una restricción.*
> *El resultado debería ser mejor que lo que se pidió.*

Estas no son frases motivacionales. Cada línea es una regla que uno de los skills hace cumplir. `/think` cuestiona los requisitos. `/nano` reduce el alcance. `/security` trata la seguridad como una restricción dura. `/ship` verifica que el resultado sea mejor que lo solicitado.

## 💡 Cómo Encaja en Tu Flujo de Trabajo

NanoStack no exige cambiar de proveedor de IA ni aprender un nuevo modelo de programación. Si ya usas arquitectura basada en skills con archivos como `AGENTS.md`, `GEMINI.md` o `COPILOT.md`, NanoStack se conecta como un conjunto adicional de skills junto a los específicos de tu proyecto.

Si eres nuevo en el concepto de skills, vale la pena leer cómo funcionan los [agent skills](/blog/building-ai-agent-skills) y el [estándar AGENTS.md](/blog/agents-md-standard) antes de instalar NanoStack — el framework tiene más sentido una vez que entiendes el modelo de inyección de contexto modular.

## 🔌 Agnóstico del LLM por Diseño

Uno de los puntos más fuertes de NanoStack es que no te ata a ningún proveedor de IA concreto. Los skills son archivos Markdown planos — la IA los lee como contexto. Mientras tu agente soporte archivos de skills externos o instrucciones de sistema personalizadas, NanoStack funciona con él.

Esto significa:
- ¿Cambias de Claude a Gemini? El mismo sprint.
- ¿Pruebas OpenAI Codex? Los mismos comandos.
- ¿Usas Cursor en el trabajo y Amp para proyectos personales? Instala una vez con `--host auto`.

Lo único que cambia entre proveedores es cómo la IA interpreta las instrucciones Markdown — y eso es una característica, no un bug. Puedes afinar un skill para un modelo específico ajustando el lenguaje en su `SKILL.md` sin romper el flujo de trabajo para otros.

## Conclusión

NanoStack representa una respuesta práctica a una pregunta real: ¿qué pasa después de que la IA puede escribir código? La respuesta no es más generación de código — es mejor proceso. Al dar a tu agente de IA la misma estructura de sprint que seguiría un equipo de ingeniería disciplinado, obtienes menos reescrituras, requisitos más meditados y software que llega a producción con menos sorpresas.

Es gratuito, open source, sin dependencias y funciona con todos los grandes agentes de IA disponibles hoy. Para desarrolladores indie que ya experimentan con agentes autónomos, merece la pena probarlo en el próximo proyecto.

## Referencias

- [NanoStack en GitHub](https://github.com/garagon/nanostack)
- [NanoStack en skills.sh](https://skills.sh/garagon/nanostack)
- [gstack de Garry Tan (inspiración)](https://github.com/garrytan/gstack)
- [ZEN.md — La filosofía de NanoStack](https://github.com/garagon/nanostack/blob/main/ZEN.md)
- [AGENTS.md — Estándar para proyectos preparados para IA](https://github.com/garagon/nanostack/blob/main/AGENTS.md)
