---
title: "NanoStack: El Framework de Agentes IA que Piensa Antes de Programar"
description: "Descubre NanoStack, el framework open source sin dependencias que convierte cualquier agente de IA en un equipo de ingeniería completo. Compatible con Claude Code, Gemini CLI, OpenAI Codex, Cursor y más."
pubDate: 2026-03-29
heroImage: "/images/nanostack-hero.svg"
tags: ["Agentes IA", "NanoStack", "Gemini CLI", "Claude Code", "OpenAI", "Productividad", "Open Source"]
reference_id: "f8a3d12e-4b7c-4e9a-a5f2-c8d6e9b0f123"
---

La mayoría de las herramientas de IA para programar responden a una pregunta simple: *"¿Cómo escribo esto?"* NanoStack primero responde a una diferente: *"¿Deberíamos construir esto siquiera?"*

Esta distinción es el núcleo de [NanoStack](https://github.com/garagon/nanostack), un framework open source que estructura cualquier agente de IA en un flujo de trabajo de equipo de ingeniería completo. No reemplaza tu IA de elección — le da un proceso. Ya uses Claude Code, Gemini CLI, OpenAI Codex o Cursor, el mismo sprint funciona igual con los mismos comandos.

El proyecto fue creado por Gustavo Aragón e inspirado en [gstack de Garry Tan](https://github.com/garrytan/gstack). No tiene dependencias externas, no requiere pasos de build y se instala en menos de un minuto. Pero la innovación real no está en el tooling — está en la idea de que un agente de IA debería modelar cómo un equipo de ingeniería *piensa*, no solo cómo *teclea*.

## 🧠 ¿Qué es NanoStack?

NanoStack es una colección de 8 **agent skills** que juntos replican el ciclo de vida completo de un sprint de software. Cada skill es una carpeta que contiene un archivo `SKILL.md` con el rol específico del agente, una lista de responsabilidades e instrucciones sobre qué hacer y cuándo. Los skills están diseñados para ejecutarse en secuencia y compartir información entre sí mediante un sistema de artefactos persistentes almacenados localmente en `.nanostack/`.

Cada skill encarna un rol dentro de un equipo de ingeniería:

| Skill | Rol | Qué hace |
|---|---|---|
| `/think` | CEO / Fundador | Cuestiona el requisito. ¿Es este el problema correcto que hay que resolver? |
| `/nano` | Engineering Manager | Genera especificaciones técnicas y de producto antes de escribir código |
| `/review` | Staff Engineer | Code review en dos pasadas: estructural y adversarial |
| `/qa` | QA Lead | Testing funcional, visual y de navegador |
| `/security` | Security Engineer | Escanea secretos, inyecciones, auth y vulnerabilidades IA/LLM |
| `/ship` | Release Engineer | Creación de PR, monitoreo de CI y verificación post-despliegue |
| `/guard` | Capa de Seguridad | 28 reglas de bloqueo que previenen comandos destructivos |
| `/conductor` | Orquestador | Coordina sesiones paralelas de agentes |

La diferencia fundamental con un copiloto de IA convencional: estos skills tienen estado y están interconectados. `/nano` genera un artefacto de especificación que `/review` lee más tarde para detectar desviaciones de alcance — ¿tocó el agente archivos que no estaban planificados? ¿Saltó archivos que sí lo estaban? `/review` guarda sus hallazgos en un artefacto JSON que `/security` cruza para detectar conflictos entre recomendaciones de calidad de código y restricciones de seguridad. Nada se pierde por el camino porque cada paso sabe qué hicieron los anteriores.

## 🔄 El Sprint: Un Proceso, No una Colección de Herramientas

El modelo mental de NanoStack es un sprint. Se ejecuta en orden:

```
/think → /nano → build → /review → /qa → /security → /ship
```

Esto no va de imponer burocracia por el placer de hacerlo. Va de hacer las preguntas correctas en el momento adecuado — las mismas que haría un ingeniero senior reflexivo antes de tocar el teclado. El valor real aparece cuando `/think` rechaza una petición de funcionalidad en lugar de ejecutarla sin más:

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

        Un sistema de notificaciones (push, email, preferencias,
        resumen, gestión de bajas) es un proyecto de 3 semanas.
        Un punto rojo en el icono de navegación se puede lanzar
        esta tarde.

        RECOMENDACIÓN: Reduce el alcance. Lanza el punto. Mira si
        las quejas bajan. Si no bajan, entonces construye las
        notificaciones — pero ahora con datos, no con suposiciones.
```

Esto es lo que NanoStack entiende por "cuestionar el requisito antes de escribir el código". Si saltas `/think` y vas directamente a `/nano`, el agente igualmente planifica — simplemente no cuestiona la premisa. Ahorras 3 semanas o las malgastas en función de una sola conversación.

### Modos de intensidad

No todas las tareas necesitan el mismo nivel de análisis. `/review`, `/qa` y `/security` soportan tres modos de intensidad:

| Modo | Flag | Cuándo usarlo |
|---|---|---|
| **Quick** | `--quick` | Corrección de typos, cambios en config, documentación |
| **Standard** | (por defecto) | Features normales y corrección de bugs |
| **Thorough** | `--thorough` | Flujos de autenticación, pagos, cambios de infraestructura |

Ejecutar `/review --thorough` tras un cambio en la autenticación hace que el agente marque todo lo sospechoso, incluyendo patrones que parecen correctos de forma aislada pero serían problemáticos en condiciones adversariales. Ejecutar `/security --quick` tras actualizar un README omite el escaneo profundo y solo comprueba secretos obvios.

## ⚡ Cero Dependencias, Una Instalación

NanoStack no tiene paso de build ni dependencias externas en tiempo de ejecución más allá de `jq` y `git`. Los skills son Markdown plano y scripts de shell. No descargas una imagen Docker ni configuras un pipeline de YAML. Clonas un repositorio y ejecutas un script de setup.

**Agentes compatibles:** Claude Code (por defecto), Gemini CLI, OpenAI Codex, Cursor, OpenCode, Amp, Cline, Antigravity.

### Instalación con git clone (recomendado)

```bash
git clone https://github.com/garagon/nanostack.git ~/.claude/skills/nanostack
cd ~/.claude/skills/nanostack && ./setup
```

El script de setup detecta automáticamente qué agentes tienes instalados y crea symlinks. Puedes especificar un host concreto:

```bash
./setup --host gemini     # Solo Gemini CLI
./setup --host codex      # Solo OpenAI Codex
./setup --host cursor     # Solo Cursor
./setup --host auto       # Todos los agentes detectados simultáneamente
```

El enfoque de git clone es el recomendado porque habilita el conjunto completo de funcionalidades: renombrado de skills, analytics de sprints, integración con Obsidian y el script `bin/init-project.sh` que configura permisos por proyecto para Claude Code.

### Instalación con npx (inicio rápido)

```bash
npx skills add garagon/nanostack -g --full-depth
```

El flag `-g` instala globalmente (disponible en todos los proyectos). `--full-depth` instala los 8 skills. Este método copia archivos en lugar de usar symlinks, por lo que características avanzadas como `--rename` y los scripts de analytics no estarán disponibles. Bueno para una primera prueba; migra a git clone si decides usarlo en serio.

### Instalación como extensión de Gemini CLI

```bash
gemini extensions install https://github.com/garagon/nanostack --consent
```

### Setup por proyecto

Ejecuta esto una vez por proyecto para configurar permisos de archivos y añadir `.nanostack/` al `.gitignore`:

```bash
~/.claude/skills/nanostack/bin/init-project.sh
```

Esto evita que Claude Code interrumpa el sprint pidiendo aprobación para cada operación de archivo, lo que rompería el flujo del autopilot.

### Actualizar

```bash
~/.claude/skills/nanostack/bin/upgrade.sh
```

Descarga los últimos cambios y re-ejecuta el setup. Sin paso de build. Los symlinks se actualizan de inmediato.

## 🛡️ Guard: Barandillas de Seguridad para Agentes Autónomos

A medida que los agentes se vuelven más autónomos, crece el riesgo de comandos destructivos. Un agente que puede ejecutar `git push` también puede ejecutar `git push --force`. Uno que puede borrar un archivo de test puede borrar una configuración de producción. `/guard` es un sistema de seguridad en tres capas que intercepta operaciones peligrosas antes de que se ejecuten.

- **Nivel 1 — Allowlist**: Los comandos de solo lectura (`ls`, `cat`, `git status`, `jq`) saltan todas las comprobaciones. No pueden causar daños.
- **Nivel 2 — In-project**: Las operaciones confinadas al repositorio git actual pasan sin restricciones. El control de versiones es la red de seguridad — si el agente escribe un archivo malo, se revierte.
- **Nivel 3 — Pattern matching**: Todo lo demás se comprueba contra 28 reglas de bloqueo que cubren: borrado masivo, force push que sobreescribe historial, eliminación de bases de datos, despliegues a producción sin revisión previa, ejecución remota de código vía `curl | sh`, y bypass de configuraciones de seguridad.

Cuando un comando es bloqueado, `/guard` no dice simplemente "no". Sugiere una alternativa más segura y explica la categoría de riesgo:

```
BLOQUEADO [G-007] El force push sobreescribe el historial remoto
Categoría: history-destruction
Comando: git push --force origin main

Alternativa más segura: git push --force-with-lease
  (falla si el remoto cambió, evita sobreescribir el trabajo de otros)
```

El agente lee este output y reintenta automáticamente con el comando más seguro. Todas las reglas viven en `guard/rules.json` y son completamente configurables — puedes añadir tus propios patrones para riesgos específicos de tu infraestructura, como `terraform destroy` o `kubectl delete namespace production`.

## 🤖 Autopilot: Aprueba una Vez, el Agente Lanza Todo

Una vez que has validado la idea con `/think` y acordado el brief, puedes entregar el sprint completo al agente:

```bash
/think --autopilot
```

`/think` sigue siendo interactivo: respondes las preguntas del agente y apruebas la dirección. Tras tu aprobación, todo lo demás corre sin ti:

```
/nano → build → /review → /security → /qa → /ship
```

El autopilot solo se detiene cuando encuentra algo que genuinamente no puede resolver de forma autónoma:
- Un problema bloqueante en `/review` que requiere tu criterio (no solo una corrección mecánica)
- Una vulnerabilidad `CRÍTICA` o `ALTA` en `/security`
- Tests fallidos en `/qa` que requieren decisiones de producto para resolverlos
- Una pregunta de producto que el contexto disponible no responde

Entre fases, el agente informa del progreso sin pedir confirmación:

```
Autopilot: build completo. Ejecutando /review...
Autopilot: review limpio (5 hallazgos, 0 bloqueantes). Ejecutando /security...
Autopilot: security grado A. Ejecutando /qa...
Autopilot: qa superado (12 tests, 0 fallidos). Ejecutando /ship...
```

Esta es la definición práctica de "agéntico": el humano establece la dirección, el sistema gestiona la ejecución. Vuelves a encontrar un PR mergeado y un diario de sprint, no una serie de diálogos de aprobación.

## ⚡ Sprints en Paralelo con /conductor

Para cambios más grandes donde la revisión, el QA y la seguridad pueden ejecutarse independientemente, `/conductor` coordina múltiples sesiones de agentes de forma simultánea. Una vez que la fase de build termina, tres agentes reclaman fases separadas y trabajan en paralelo:

```
/think → /nano → build ─┬─ /review   (Agente A) ─┐
                        ├─ /qa       (Agente B)  ├─ /ship
                        └─ /security (Agente C) ─┘
```

La orquestación no usa daemon ni cola de mensajes — solo operaciones atómicas de archivo: `mkdir` para el bloqueo de fase, archivos JSON para el estado, y symlinks para la transferencia de artefactos. Cada agente reclama una fase creando un archivo de bloqueo, la ejecuta y escribe su artefacto. El siguiente agente en la cadena de dependencias recoge el artefacto cuando está disponible.

Esto es especialmente útil en proyectos grandes donde la pasada de revisión tarda 5 minutos y el escaneo de seguridad otros 5 — ejecutarlos secuencialmente duplica la espera. Ejecutarlos en paralelo reduce significativamente el sprint sin añadir complejidad de infraestructura.

## 🎯 Specs por Alcance: El Plan Justo

Una de las frustraciones más comunes con los agentes de IA es que van directamente a la implementación. Pueden escribir código más rápido que un humano, así que por defecto hacen eso. Pero la fase de implementación rara vez es donde se pierde el tiempo — es el retrabajo posterior cuando se descubre que el plan estaba mal.

`/nano` resuelve esto ajustando automáticamente la especificación según la complejidad que detecta en los cambios planificados:

| Alcance | Detonante | Qué obtienes |
|---|---|---|
| **Pequeño** | 1–3 archivos | Solo pasos de implementación |
| **Medio** | 4–10 archivos | Spec de producto + pasos de implementación |
| **Grande** | 10+ archivos | Spec de producto + spec técnica + pasos |

La spec de producto cubre: enunciado del problema, solución propuesta, historias de usuario, criterios de aceptación, flujo de usuario, casos límite y qué queda explícitamente fuera de alcance. La spec técnica añade: decisiones de arquitectura, modelo de datos, contratos de API, puntos de integración, consideraciones de seguridad, plan de migración y estrategia de rollback.

Las specs se presentan para tu aprobación antes de que el agente escriba ningún código. Si no estás de acuerdo con la spec — quizás el alcance es más amplio de lo que quieres, o la decisión de arquitectura no encaja con tus restricciones — lo dices y el agente la revisa antes de empezar. Como dicen los docs de NanoStack: *"Si la spec está mal, todo lo que viene después estará mal."*

## 🧠 Know-How: Memoria que Crece con el Tiempo

La mayoría de las herramientas de IA para programar son sin estado — cada sesión empieza desde cero. NanoStack construye conocimiento deliberadamente a medida que trabajas, sin requerir comandos extra.

Cada skill persiste automáticamente su output en `.nanostack/` tras cada ejecución:

```
/think     →  .nanostack/think/20260325-140000.json
/nano      →  .nanostack/plan/20260325-143000.json
/review    →  .nanostack/review/20260325-150000.json
/qa        →  .nanostack/qa/20260325-151500.json
/security  →  .nanostack/security/20260325-152000.json
/ship      →  .nanostack/ship/20260325-160000.json
```

Estos artefactos no son solo logs. El siguiente skill en la cadena lee el artefacto anterior y lo usa:

- `/review` lee el plan de `/nano` para comprobar si la implementación se desvió de lo acordado. "¿Tocaste `src/unplanned.ts`? Ese archivo no estaba en el plan. ¿Saltaste `tests/auth.test.ts`? Ese sí estaba."
- `/security` lee el artefacto de `/review` para detectar tensiones. `/review` dice "añade más detalle a los mensajes de error". `/security` dice "no expongas internos en los mensajes de error". El conflicto se cruza con 10 precedentes de conflicto integrados y se resuelve: "códigos de error estructurados: mensaje genérico al usuario, detalle completo en los logs del servidor."

Cuando `/ship` ejecuta y el PR llega a destino, genera automáticamente un diario de sprint:

```
/ship  →  lee todos los artefactos de fase del sprint
       →  escribe .nanostack/know-how/journal/2026-03-25-proyecto.md
```

El diario es un único archivo con toda la traza de decisiones: qué reformuló `/think`, qué acotó `/nano`, qué encontró `/review`, cómo se resolvieron los conflictos, qué nota asignó `/security` y por qué. Con el tiempo, estos diarios se convierten en un historial con búsqueda de cada decisión no trivial tomada en el proyecto.

Puedes abrir `.nanostack/know-how/` directamente en Obsidian para obtener una vista de grafo que conecta sprints, precedentes de conflictos y aprendizajes capturados a lo largo del tiempo.

## 🔧 Extendiendo NanoStack con Skills Propios

NanoStack está diseñado para ser una plataforma, no solo una herramienta. La misma infraestructura de artefactos que potencia los 8 skills integrados está disponible para cualquier skill personalizado que crees.

Las fases personalizadas se registran en `.nanostack/config.json`:

```json
{ "custom_phases": ["audience", "campaign", "measure"] }
```

Un skill personalizado sigue la misma estructura que los integrados: una carpeta con un `SKILL.md` que define el rol, un checklist, modos de intensidad y referencias a cualquier script o plantilla que necesite. Los scripts `save-artifact.sh` y `find-artifact.sh` gestionan la persistencia y las referencias cruzadas — tu skill personalizado puede leer el output de `/review` o `/security` exactamente igual que los skills integrados.

Esto significa que equipos con flujos de trabajo especializados pueden construir sobre NanoStack sin necesidad de hacer un fork. Un equipo de marketing podría construir `/audience` y `/campaign`. Un equipo de datos podría añadir `/explore` y `/model`. Un equipo de diseño podría contribuir `/wireframe` y `/usability`. Todos estos componen con el `/think` de NanoStack para la ideación, `/review` para la calidad y `/ship` para la entrega. El diario de sprint y los analytics funcionan con fases personalizadas automáticamente.

## 🧘 El Zen de NanoStack

Lo que distingue filosóficamente a NanoStack es que aplica *criterio* de ingeniería, no solo *capacidad* de ingeniería. El archivo `ZEN.md` del repositorio recoge esto en nueve principios:

> *Cuestiona el requisito antes de escribir el código.*
> *Borra lo que no debería existir.*
> *Si nadie usaría una v1 rota, el alcance está mal.*
> *Reduce el alcance, no la ambición.*
> *Lanza la versión que se puede lanzar hoy.*
> *Corrígelo o pregunta. Nunca lo ignores.*
> *La seguridad no es un tradeoff. Es una restricción.*
> *El resultado debería ser mejor que lo que se pidió.*
> *Si el plan es difícil de explicar, el plan está mal.*

Estas no son frases motivacionales. Cada línea es una regla que hace cumplir un skill específico. `/think` cuestiona los requisitos. `/nano` reduce el alcance y requiere un plan fácil de explicar. `/review` captura lo que fue ignorado en lugar de corregido. `/security` trata la seguridad como una restricción dura, no como un dial que se puede ajustar por conveniencia. `/ship` verifica que el resultado sea mejor que lo solicitado antes de crear el PR.

El efecto acumulado es que el agente de IA se comporta menos como un mecanógrafo rápido y más como un ingeniero reflexivo que plantea objeciones cuando algo no tiene sentido.

## 💡 Cómo Encaja en Tu Flujo de Trabajo

NanoStack no exige cambiar de proveedor de IA ni aprender un nuevo paradigma de programación. Si ya usas arquitectura basada en skills con archivos como `AGENTS.md`, `GEMINI.md` o `COPILOT.md`, NanoStack se conecta como un conjunto adicional de skills junto a los específicos de tu proyecto.

La integración en el flujo de trabajo es directa. En Claude Code, los skills aparecen como comandos de barra directamente. En Gemini CLI, se cargan como extensiones. En Cursor, aparecen como instrucciones personalizadas. Los mismos ocho comandos funcionan igual independientemente de la herramienta que uses.

Si eres nuevo en el concepto de skills, vale la pena entender cómo funcionan los [agent skills](/blog/building-ai-agent-skills) y el [estándar AGENTS.md](/blog/agents-md-standard) antes de profundizar con NanoStack — el framework tiene más sentido una vez que comprendes el modelo de inyección de contexto modular que hay detrás.

## 🔌 Agnóstico del LLM por Diseño

Una de las decisiones de diseño más importantes de NanoStack es que no te ata a ningún proveedor de IA concreto. Los skills son archivos Markdown planos — la IA los lee como instrucciones de contexto, no como código ejecutable. No hay llamadas a la API de un proveedor específico dentro del propio framework. Mientras tu agente soporte archivos de skills externos o instrucciones de sistema personalizadas, NanoStack funciona con él.

Esto tiene una implicación práctica para los desarrolladores indie: puedes cambiar de opinión. Prueba Claude Code este mes, cámbiate a Gemini CLI el siguiente cuando salga un nuevo modelo, prueba OpenAI Codex cuando tu caso de uso encaje mejor — el sprint no cambia, los comandos no cambian, los artefactos no cambian. Solo cambia la IA que interpreta las instrucciones, y puedes afinar el Markdown de un skill para los patrones de respuesta de un modelo específico sin romperlo para otros.

La instalación con `--host auto` detecta todos los agentes presentes en tu máquina y enlaza los skills a todos ellos simultáneamente. Cuando abres Claude, los skills están ahí. Cuando abres Gemini CLI, los mismos skills están ahí. Sin duplicación.

## 🔒 Privacidad

Todos los datos de NanoStack permanecen en tu máquina en `.nanostack/`. El framework no hace llamadas remotas y no tiene telemetría. Los diarios de sprint, los precedentes de conflictos y los analytics son archivos locales que solo tú puedes leer.

Los scripts de analytics (`bin/analytics.sh`) solo leen de artefactos locales — te dan un dashboard de qué skills ejecutas con más frecuencia, qué notas de seguridad están recibiendo tus sprints y cuánto tiempo suelen tomar las diferentes fases. Ninguno de estos datos sale de tu máquina.

## NanoStack vs. "Solo Pedírselo a la IA"

Es legítimo preguntarse: ¿para qué usar un framework? Los LLMs modernos son suficientemente capaces como para pedirles directamente lo que quieres y obtener código funcional. Eso funciona bien para cambios pequeños y aislados. Empieza a fallar en los bordes donde vive la mayoría de la complejidad interesante.

Cuando simplemente le pides a la IA que implemente una funcionalidad, parte de la premisa de que la funcionalidad como fue descrita es la que hay que construir. No pregunta si el problema es real, si la solución tiene el alcance adecuado o si existe un camino más simple. Tampoco recuerda lo que decidió en la fase de planificación cuando ahora está en la fase de revisión — cada invocación de un skill empieza de nuevo sin el sistema de artefactos compartidos.

NanoStack impone la pausa al principio (la conversación con `/think` que cuestiona el requisito) a cambio de un final más rápido y limpio (un PR que pasa la revisión, el QA y la seguridad en un solo intento en lugar de tres rondas de correcciones). Para desarrolladores indie que trabajan solos, esa conversación forzada con `/think` reemplaza la discusión frente a la pizarra que tendrías con un compañero antes de escribir código — y suele ser la parte más valiosa del sprint.

## Conclusión

NanoStack representa una respuesta práctica a una pregunta real: ¿qué viene después de que la IA puede escribir código de forma fiable? La respuesta no es más velocidad de generación — es mejor proceso. Al dar a tu agente de IA la misma estructura de sprint que seguiría un equipo de ingeniería disciplinado, obtienes menos reescrituras, requisitos más meditados y software que llega a producción con menos sorpresas.

Es gratuito, open source, sin dependencias externas y funciona con todos los grandes agentes de IA disponibles hoy. La instalación lleva menos de un minuto. La primera conversación con `/think` lleva cinco. Para cualquiera que ya esté experimentando con agentes autónomos en proyectos personales, merece la pena convertir esos cinco minutos en el próximo sprint.

## Referencias

- [NanoStack en GitHub](https://github.com/garagon/nanostack)
- [NanoStack en skills.sh](https://skills.sh/garagon/nanostack)
- [gstack de Garry Tan (inspiración)](https://github.com/garrytan/gstack)
- [ZEN.md — La filosofía de NanoStack](https://github.com/garagon/nanostack/blob/main/ZEN.md)
- [AGENTS.md — Estándar para proyectos preparados para IA](https://github.com/garagon/nanostack/blob/main/AGENTS.md)
- [EXTENDING.md — Crear skills personalizados sobre NanoStack](https://github.com/garagon/nanostack/blob/main/EXTENDING.md)
- [Referencia de precedentes de conflictos](https://github.com/garagon/nanostack/blob/main/reference/conflict-precedents.md)
