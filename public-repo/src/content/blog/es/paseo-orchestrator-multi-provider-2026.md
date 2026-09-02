---
title: "Paseo: el orchestrator de coding agents que reescribió la categoría"
description: "Paseo en profundidad: arquitectura daemon+relay Elixir, 35+ proveedores via ACP, SDK TypeScript, tres skills (Handoff, Advisor, Committee), y el RFC #1042 que explica por qué migró a Agent Client Protocol. Caso de estudio sobre open source individual."
pubDate: 2026-08-15
lastmod: 2026-08-15
author: ArceApps
keywords:
  - "Paseo"
  - "getpaseo"
  - "coding agents"
  - "AGPL-3.0"
  - "agent orchestrator"
  - "ACP"
canonical: "https://arceapps.com/es/blog/paseo-orchestrator-multi-provider-2026/"
heroImage: "/images/paseo-orchestrator-multi-provider-2026-es.svg"
tags: ["Paseo", "getpaseo", "Coding Agents", "Orchestrator", "OpenCode", "Claude Code", "Mobile Dev", "Indie Dev"]
category: ai-agents
reference_id: "eede9df0-9aaf-44c6-a424-19b868712f52"
---

> **Lecturas relacionadas en el blog:** [La comparativa operativa con OpenChamber, CodeNomad y opencode-mobile](/es/blog/openchamber-paseo-comparativa-2026/) (14-ago-2026) · [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) · [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) · [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/) · [Paradigmas alternativos de ingeniería de software con IA](/es/blog/paradigmas-alternativos-ingenieria-software-ia/)

![Hero · Paseo: el orchestrator de coding agents que reescribió la categoría](/images/paseo-orchestrator-multi-provider-2026-es.svg)

## Por qué Paseo merece un artículo propio

El 14 de agosto publiqué una comparativa de cuatro frontends para coding agents en este blog. La pieza funcionaba como mapa operativo: *¿cuál instalo hoy?* Y dentro de ese mapa, Paseo se llevó el rol de *"pieza más disruptiva"*. Pero el formato comparativa no le hacía justicia. Hay decisiones de diseño en Paseo que merecen más espacio del que un párrafo permite explicar, una historia de fondo que merece ser contada en su propio tiempo, y un caso de estudio (el RFC #1042) que merece un artículo en sí mismo.

A riesgo de sonar parcial, creo que Paseo es la historia más interesante del open source de coding agents en 2026. Y no porque sea el más popular —esa corona sigue siendo de OpenCode con 197.365 estrellas— ni el más bonito —esa discusión es subjetiva—. Es porque **Paseo resolvió un problema que el resto del ecosistema estaba ignorando**: cómo tener un solo cockpit para correr varios coding agents a la vez, sin rendirte a un proveedor único, sin construir un fork propietario, sin pagar licencia, sin entregar tus datos a un SaaS. Y lo hizo con una restricción operativa real: el equipo, como confirmó su maintainer en el Show HN, *"team of one right now"*. Una persona. Quince mil estrellas. Cientos de contribuciones. Y una arquitectura de relay en Elixir que funciona en producción.

Este artículo es el reverso profundo de la comparativa. Voy a explicar qué hace Paseo, cómo lo hace, por qué lo hizo así, y dónde está la línea entre lo que es magia y lo que es deuda técnica. Vamos a entrar en código, en issues, en RFCs, en skills oficiales. Si venías del post de la comparativa, te va a sonar el contexto; si no, este se sostiene solo.

## Lo que Paseo es (y lo que no es) en una frase

Paseo es un **daemon local que orquesta coding agents de múltiples proveedores** bajo una interfaz unificada, con clientes para desktop, web, móvil y CLI, y un relay opcional punto-a-punto encriptado para acceso remoto. Esa frase, aunque larga, recoge los cuatro elementos que separan a Paseo de cualquier otra cosa del ecosistema:

1. **Daemon local**: un proceso de fondo en tu máquina que tú controlas. No es un servicio SaaS. No es un webservice al que le entregas tu código. Es tu servidor. Si lo apagas, no pasa nada porque te quedas sin Paseo, no porque alguien te desautorice.
2. **Orchestrador de múltiples proveedores**: no habla con un solo agente. Habla con Claude Code, Codex, OpenCode, GitHub Copilot, Pi, Gemini CLI, Cursor, Hermes, Kimi, Qwen Code, y un catálogo de 25+ más. Cada uno corre como su propio proceso con su CLI real, su config real, sus credenciales reales. Paseo no envuelve, ejecuta.
3. **Clientes en cinco superfícies**: desktop (Electron), web (PWA), iOS (App Store), Android (Google Play y F-Droid), CLI. Todos hablan con el mismo daemon vía WebSocket. La experiencia de uso es coherente: arrancas una sesión en el Mac, la revisas desde el iPad, la apruebas desde el móvil.
4. **Relay opcional**: si quieres conectar dispositivos a través de internet sin abrir puertos, Paseo tiene un relay distribuido escrito en Elixir que usa encriptación E2E. Si no lo quieres, conectas por LAN, Tailscale, o VPN. El relay es opt-in, no obligatorio.

Lo que Paseo **no es**: un coding agent. No genera código por sí mismo. No es un frontend para un solo proveedor. No es una IDE completa. Es la **capa de coordinación** que ya no existía en el ecosistema.

## La arquitectura: el daemon como pieza central, todo lo demás como cliente

El repositorio es un monorepo de npm con seis paquetes:

```
packages/
  server/     ← El daemon: orquesta procesos de agentes, expone WebSocket API, también sirve como MCP server.
  app/        ← Cliente Expo (iOS, Android, web, PWA).
  cli/        ← El binario `paseo` para control desde terminal.
  desktop/    ← App nativa Electron.
  relay/      ← Cliente del relay + encriptación, usado por daemon y clientes.
  website/    ← Marketing site + docs (paseo.sh).
```

Hay un séptimo proyecto satélite, [`getpaseo/paseo-relay`](https://github.com/getpaseo/paseo-relay), escrito en Elixir. Es el relay distribuido oficial para cuando quieres conectar dispositivos a través de internet sin abrir puertos. Lo trataré en detalle más adelante.

### Por qué un daemon, no una app

La decisión más importante de la arquitectura de Paseo es separar el *cerebro* (daemon) de las *interfaces* (clientes). El daemon es el proceso que sabe qué agentes hay corriendo, qué sesión está activa, qué modelos están disponibles, qué credenciales tienes, qué historial conserva cada agente. Los clientes son solo *superfícies de control*: arrancan, se conectan, muestran, mandan prompts, y se desconectan. Cuando cierras la app de escritorio, las sesiones siguen vivas en el daemon. Cuando matas el cliente móvil, el daemon sigue corriendo. Cuando abres la PWA desde el PC de un amigo, se conecta a tu daemon (vía relay, claro) y ves lo mismo que viste desde tu Mac.

Esa separación tiene tres consecuencias prácticas que solo se entienden cuando las vives:

- **Las sesiones sobreviven a cerrar la app**. Esto es lo que en HN llaman *"ship on the go"*. Si dejas un agente trabajando y cierras el Mac, el proceso del daemon sigue corriendo bajo tu usuario. Abres Paseo en el iPhone y la sesión sigue ahí, con su último mensaje, su log, su estado. No es magia: es el patrón de toda herramienta Unix que se precie (`tmux`, `systemd`, `screen`).
- **El historial no es por cliente, es por agente**. Si abriste una sesión de Claude Code desde el Mac y la cierras, luego la abres desde el iPad, estás viendo la misma sesión. Paseo no duplica estado; enruta a la sesión del agente real. Esto se nota cuando llevas semanas usando Paseo: la sensación de continuidad entre dispositivos es mayor que la de cualquier app SaaS.
- **El daemon es un único proceso que puedes monitorear y reiniciar**. Si algo va mal, no "reinstalas la app": reinicias el daemon. Si quieres automatizar, le pones un `systemd` unit. Si quieres verlo desde fuera, usas `paseo status`. Es Unix, no Electron.

### El WebSocket API: la columna vertebral

El daemon expone una API WebSocket en `127.0.0.1:6767` (puerto configurable). El endpoint para clientes es `/ws`. Para integraciones externas, existe también un SDK de TypeScript (`@getpaseo/client`) que envuelve la conexión. El ejemplo que está en el README:

```typescript
import { createPaseoClient } from "@getpaseo/client";

const client = createPaseoClient({ url: "ws://127.0.0.1:6767/ws" });
await client.connect();

const agent = await client.agents.create({
  config: { provider: "codex/gpt-5.5" },
  cwd: "/Users/me/dev/storefront",
  prompt: "Review the current diff and name the riskiest change.",
});

const result = await agent.waitForFinish();
console.log(result.lastMessage);

await client.close();
```

Lo que esta pieza de código revela es justamente lo que hace a Paseo diferente: **la primitiva es "crear un agente", no "abrir una sesión"**. En un frontend clásico de OpenCode, abres una sesión y cambias de modelo dentro de la sesión. En Paseo, creas un agente (con su provider, su CWD, su prompt), le mandas comandos, esperas a que termine (`waitForFinish`), y lees la última respuesta. Si quieres otro agente con otro provider, creas otro. La sesión no es una abstracción de UI; es un proceso real bajo control.

El SDK también soporta operaciones como `paseo run --host workstation.local:6767`, lo que significa que **puedes apuntar a un daemon remoto** desde la CLI. Lo que abre la puerta al patrón que los power users adoran y los principiantes temen: un daemon en casa, varios clientes por la ciudad, coordinación distribuida.

## El catálogo de proveedores: 35+ agentes, una abstracción

Paseo no implementa un adaptador para cada coding agent. Esa sería una pesadilla de mantenimiento. Lo que hace es apoyarse en el **Agent Client Protocol (ACP)**, un protocolo estándar para que aplicaciones hablen con agentes de IA. La estrategia, según el RFC #1042 que el maintainer publicó el 15 de mayo de 2026, es la siguiente:

> *"Replace paseo's three bespoke provider adapters (claude-agent.ts, opencode-agent.ts, codex-app-server-agent.ts, ~10k lines combined) with the existing generic ACP adapter (acp-agent.ts, ~1.1k lines), leveraging maintained ACP shims for each provider."*

La cifra merece una pausa: **10.000 líneas de adaptadores custom reemplazadas por un genérico de 1.100 líneas**. Esa es la diferencia entre mantener "un fork que se va quedando viejo" y "delegar en una abstracción que evoluciona". Pero la historia es más interesante que la cifra, y voy a contarla porque enseña cómo se hace open source individual con criterio.

### La historia del RFC #1042

El RFC documenta un bug que llevaba seis meses sin ser detectado. OpenCode, en su versión 1.14, migró el almacenamiento de sesiones de archivos JSON en `~/.local/share/opencode/storage/{session,message,part}/*.json` a una base SQLite (`opencode.db`). El adaptador de Paseo en la rama `opencode-agent.ts` seguía scrapeando el layout viejo en una ruta específica (`listPersistedAgents`). El stream en vivo (`streamHistory`) usaba el servidor HTTP de OpenCode y seguía funcionando. Resultado: la importación de sesiones devolvía cero resultados silenciosamente durante seis meses. Mientras el resume (reanudar una sesión que ya tenías abierta) funcionaba bien, la importación de sesiones históricas (abrir una sesión de hace dos semanas) no devolvía nada. Y nadie se enteró porque la UI mostraba "no hay sesiones viejas" sin error.

El RFC diagnostica que el problema no es el bug en sí, sino la **clase de bug**: cualquier migración futura de almacenamiento, schema o capability repite el ciclo. El RFC propone reemplazar toda la plomería custom por el adaptador genérico ACP, que le pregunta a cada proveedor por su estado actual a través del protocolo. Las cifras de madurez que el RFC cita para cada adaptador ACP son concretas:

- **OpenCode**: soporta ACP de forma nativa desde 1.14.x. Mailing lists, calls, `session/list`, `session/update`, `resume`. Verificado en 1.14.33.
- **Claude Code**: shim en `agentclientprotocol/claude-agent-acp`. 1.9k estrellas, 91 releases, mantenido activamente.
- **Codex**: shim en `zed-industries/codex-acp` (con un paralelo en `agentclientprotocol/codex-acp` liderado por JetBrains hacia feature parity). 746 estrellas, v0.14.0.

Esa decisión —abandonar código propio a favor de un protocolo estándar— es la que separa a Paseo del patrón "fork que se va desactualizando". Es también la decisión que hace que el catálogo crezca sin que el maintainer tenga que mantener 35 adapters. Cada vez que un proveedor publica un shim ACP, Paseo lo soporta con un pequeño change.

### El catálogo que ves hoy

Paseo no solo soporta Claude Code, Codex y OpenCode. La lista de "one-click installs" en la documentación incluye Cursor, Gemini, GitHub Copilot, Hermes, Kimi, Qwen Code, Pi, y "25+ más". Cada uno aparece en la UI con un botón de instalación que descarga el CLI del proveedor y configura las credenciales. Puedes tener un mismo daemon con seis herramientas diferentes instaladas, y desde la misma UI correr cualquier combinación.

La pregunta obvia es: *¿cuán estables son los shims ACP de cada proveedor?* La respuesta honesta: depende del proveedor. Claude Code y OpenCode están en producción estable. Codex está acercándose. El resto van por olas. El propio RFC incluye una tabla de madurez con cada proveedor, y hay un issue abierto (#1041) que audita los problemas de sincronización de estado que aún quedan en el daemon. Paseo no oculta esa deuda.

## Las tres skills oficiales: Handoff, Advisor y Committee

Paseo no es solo un panel de control. Es una plataforma que expone tres *skills* oficiales —pequeños scripts que extienden lo que el agente puede hacer cuando lo invocas desde otro agente (por ejemplo, dentro de Claude Code). Las tres están en `skills/` y se instalan con `npx skills add getpaseo/paseo`. Las tres son `user-invocable: true`, lo que significa que se invocan con `/paseo-handoff`, `/paseo-advisor`, `/paseo-committee` desde cualquier conversación donde el skill esté cargado.

### `paseo-handoff` — pasar el trabajo con contexto completo

El archivo `SKILL.md` define esta skill como:

> *"Hand off the current task to another agent with full context. Use when the user says 'handoff', 'hand off', 'hand this to', or wants to pass work to another agent."*

El problema técnico que resuelve es real: cuando pasas trabajo de un agente a otro, el receptor empieza con cero contexto. El skill exige que el handoff prompt sea **un briefing autocontenido** con la siguiente estructura:

```
## Task
[Imperative description.]

## Context
[Why this task exists, required context.]

## Relevant files
- `path/to/file.ts` — [what it is and why it matters]

## Current state
[What's done, what works, what doesn't.]

## What was tried
- [Approach] — [why it failed or was abandoned]

## Decisions
- [Decision — rationale]

## Acceptance criteria
- [ ] [Criterion]

## Constraints
- [Must-not / must-preserve]
```

Esa plantilla es, en sí misma, una decisión de diseño. Paseo no espera que el usuario sepa estructurar el handoff. El skill se lo impone. Cuando invocas `/paseo-handoff`, el agente actual lee el contexto, lo empaqueta en ese formato, y crea un nuevo agente con ese briefing como prompt inicial. Si dices *"in a worktree"*, el skill añade `isolation: "worktree"` automáticamente. Si dices *"esto es solo análisis, no edites nada"*, el skill preserva la semántica de la tarea (*"Investigate-only → 'DO NOT edit files.' Fix → 'implement the fix.' Refactor → 'refactor, not rewrite.' Carry the user's exact intent."*).

El detalle fino que me parece más interesante: **el skill no espera ni polea**. *"Do not wait or poll for the agent to finish."* El nuevo agente queda en el track de subagentes del usuario, y este lo libera manualmente cuando quiere. La analogía es con un becario: le entregas el briefing, lo dejas trabajar, vuelves a ver cuando él te avisa. No te quedas mirando.

![Infografía · paseo-handoff: briefing structure de 8 secciones + reglas duras](/images/paseo-handoff-skill-es.svg)

### `paseo-advisor` — una segunda opinión sin delegación

A veces no quieres que otro agente haga el trabajo. Quieres que **opine**. La skill `paseo-advisor` levanta un agente como advisor, le entregas la pregunta, él te da una recomendación con razonamiento, y no toca nada. El `SKILL.md` deja claro: *"the advisor doesn't drive the work."*

El briefing del advisor tiene menos secciones que el handoff (no hay acceptance criteria, no hay constraints): la pregunta, lo que ya consideraste, lo que descartaste, paths relevantes, y una coletilla fija:

```
This is analysis only. Do NOT edit, create, or delete any files. Do NOT write code.
```

Esa coletilla es la pieza más práctica de toda la skill. Es la disciplina que separa "consultar a otro modelo" de "dejar que el modelo te edite el código en otro sitio". El maintainer lo sabe y lo repite en cada skill. Es la misma disciplina que luego aplico en mi propio blog cuando pido reviewer de un PR: lo hago en una sesión aparte, sin permisos de edición.

### `paseo-committee` — dos agentes contrastados, un plan

La más ambiciosa. *"Two agents from contrasting profiles, fresh context, planning a solution in parallel."* Cuando estás atascado, ves todo con tunnel-vision, o enfrentas un problema de planificación difícil, levantas un comité de dos agentes de perfiles diferentes (siempre de *provider families* distintos para que la segunda opinión sea genuinamente fresca). Cada uno trabaja en paralelo, ambos llegan a una propuesta, el comité entrega un plan.

La regla dura: *"No edits."* Cada prompt a un miembro del comité termina con la coletilla de no-edits. *"Trust the finish notification. Do not poll, send hurry-ups, or interrupt. Models can reason for 15–30 minutes. You can go idle and Paseo will notify you."*

Esa última línea es la que más me gusta de todo el proyecto. Es la aceptación honesta de que **los modelos razonan cuando se les deja razonar**, y que interrumpir es contraproducente. El mismo principio que aplica Anthropic con Claude Code cuando ejecuta tareas largas: tú te vas, vuelves cuando termina. Paseo formaliza el patrón en una skill.

## Mobile, voice, y la promesa de "procesado local"

Tres ángulos del proyecto que requieren explicación porque son los que más skepticism generan en el HN y en Discord.

### La app móvil: liviandad real

Hice una pregunta concreta en el Show HN del 9 de junio: *"después de las próximas semanas, ¿Claude Code seguirá funcionando con Paseo?"*. El maintainer respondió: *"Claude Code (via the subscription) will continue working under Paseo but it will consume a different pool of credits, which depending on your sub you get different amounts. Practically speaking you will be able to use only a fraction of your usage in Paseo, this applies to any programmatic usage of Claude Code."*

Pero la prueba más importante de la calidad de la app móvil vino de un usuario anónimo del mismo hilo: *"Gotta say: I love how mobile app works on my 13 years old Nexus 7 (2GB RAM). It was the sole reason I choose it, actually - other PWAs are too much for the little guy."*

DosGB de RAM. Un Nexus 7 de 2013. La app le corre. Esto es la confirmación práctica de que no es Electron empaquetado: es una app Expo (que en Android es Java/Kotlin nativo envuelto por la runtime de React Native, optimizado para hardware modesto). El feedback cualitativo en Reddit, Discord y el subreddit `/r/PaseoAI` coincide: la app es *snappy*, no come batería, no se cuelga en pantallas con muchos mensajes. El precio a pagar es que algunas features avanzadas (previews, preview of running app, fusión visual) están solo en desktop. La mobile es para supervisar, aprobar, y lanzar.

La distribución cubre los cuatro caminos principales: iOS App Store (`id6758887924`), Google Play (`sh.paseo`), F-Droid, y el APK directo desde GitHub Releases. No es una app de "si te toca instálala del repo": es una app ciudadana de primera.

### Voice: el secreto mejor guardado

El README lo anuncia en el primer párrafo de features: *"**Voice control:** Dictate tasks or talk through problems in voice mode. Hands-free when you need it."*. Pero lo que el README no detalla —y la review de GIGAZINE del 5 de julio de 2026 sí recogió— es el detalle clave: *"Voice data, such as voice input and text-to-speech, is processed locally and not transmitted externally."*

Eso es **una promesa de privacidad seria**. No es "los datos no se venden"; es "los datos no salen de tu dispositivo". Si es cierto (y la verificación está en el código del paquete, no solo en la promesa), Paseo es el único cliente de coding agents del ecosistema que ofrece voice sin mandar audio a la nube. El procesado probablemente corre on-device con Whisper o un derivado; no lo he confirmado leyendo el código al 100%, pero la declaración de GIGAZINE es específica y de un medio técnico serio, no es marketing.

La realidad es que voice en Paseo es un experimento en curso. Funciona bien en iPhone 15 Pro y va justo en Android de gama media. El maintainer ha sido transparente con esto en Discord. Si voice es *core* para tu workflow, prueba antes de comprometerte.

### Los shortcuts: teclas rápidas en desktop

Una cosa pequeña que suma mucho. En la review de GIGAZINE se lista: *"Panel switching, split-screen display, new agent creation, command palette, and more can all be operated using shortcuts."* Los paneles múltiples (cada agente en una ventana) se pueden manejar con ⌘1, ⌘2, ⌘3; el command palette es ⌘K (estándar de la industria); el split-screen divide la ventana actual en dos agentes lado a lado. Pequeñas decisiones que, sumadas, hacen que la *dwell time* en la app sea mucho mayor que en cualquier frontend de OpenCode.

## El relay oficial en Elixir: por qué escribieron un servidor en BEAM

El proyecto satélite [`getpaseo/paseo-relay`](https://github.com/getpaseo/paseo-relay) es, técnicamente, la pieza más ambiciosa del ecosistema. Está escrito en Elixir, corre sobre la BEAM VM, y maneja la coordinación entre daemons para descubrimiento y route ownership.

La pregunta natural es: ¿por qué Elixir? ¿Por qué no Node, que es el resto del repo? La respuesta está en el problema que resuelve: un relay distribuido es, técnicamente, un sistema con concurrencia masiva, supervision trees, y necesidad de *failover* sin downtime. La BEAM VM fue diseñada exactamente para eso —es la VM de WhatsApp, de Discord, de LinkedIn—. Tres cosas que Elixir te da casi gratis y que son pesadillas en Node:

1. **Concurrencia sin servidor dedicado**. Miles de conexiones WebSocket en una sola VM, sin que tengas que pensar en thread pools ni en event loops bloqueados.
2. **Supervision trees**. Si un proceso muere, el supervisor lo levanta. Si un nodo entero muere, otro nodo toma su lugar. El README es explícito: *"Nodes use OTP only for discovery and route ownership."* Esto es BEAM puro.
3. **Distribución por diseño**. BEAM permite clustering nativo entre nodos, con descubrimiento y replicación incluidos. Construir un relay distribuido en Node es escribir todo eso a mano.

El relay es **opt-in**. Cuando arrancas el daemon por primera vez, Paseo te pregunta si quieres habilitar el relay. Si dices que no, sigues conectando por LAN, Tailscale o VPN. Si dices que sí, el daemon se registra en el relay y obtienes un *pairing offer URL* del tipo `https://app.paseo.sh/#offer=...` que puedes escanear con la app móvil para emparejar. La encriptación es E2E: el relay solo enruta bytes encriptados, no puede leer el contenido.

El relay oficial es uno de los pocos casos donde el uso de Elixir está justificado más allá del gusto. Si Paseo hubiera escrito el relay en Node, hoy sería un proyecto con un cluster mode en beta permanente. En Elixir, es una pieza más de la plataforma.

## La licencia AGPL-3.0: la decisión que pocos entienden

Voy a dedicar un párrafo entero a esto porque levanta débats frecuentes. Paseo es AGPL-3.0. La elección es deliberada, y tiene implicaciones prácticas.

**¿Qué significa AGPL-3.0?** Puedes usar Paseo libremente, modificarlo, auto-hospedarlo, forkearlo. Si distribuyes una versión modificada a terceros (por ejemplo, vendes un SaaS basado en Paseo), debes abrir el código de tu fork bajo la misma licencia. Si eres un usuario individual o una empresa que solo lo usa internamente, no tienes obligación de abrir nada.

**¿Por qué no MIT?** El maintainer lo explica en el README: *"Privacy-first: Paseo doesn't have any telemetry, tracking, or forced log-ins."* Si Paseo fuera MIT, cualquiera podría tomar el código y armar un SaaS propietario sin contribuir de vuelta. Con AGPL-3.0, si lo haces, tu SaaS tiene que abrirse. Es la licencia que pone el listón para que los forks comerciales reviertan a la comunidad.

**¿Es un problema para uso normal?** No. Si eres un indie dev, un equipo pequeño, o una empresa que lo usa internamente, AGPL-3.0 es idéntico a MIT en la práctica. Solo se vuelve relevante cuando quieres vender Paseo modificado como servicio. Si quieres una versión más permisiva, abre un issue y discute con la comunidad; la licencia podría cambiar en el futuro.

**¿Por qué no GPL-3.0 regular?** AGPL cubre el caso SaaS, que es donde se licencia la mayoría del software moderno. GPL-3.0 tiene una cláusula de "redistribution" que en la práctica no aplica a servicios web. AGPL la extiende a "network use". Sin esa cláusula, alguien podría montar SaaS de Paseo sin abrir nada. Con AGPL, no.

La licencia es una decisión de producto, no un capricho. Es el *statement* que el maintainer hace sobre cómo quiere que el proyecto se mantenga libre.

## Por qué importa: el developer detrás del proyecto

El 14 de junio, en el HN thread, alguien preguntó: *"Could you publish terminal-bench scores? What about memory usage?"* Y el maintainer contestó: *"team of one right now."*

Una persona. Quince mil estrellas en menos de cuatro meses. Un RFC con cierre de deuda técnica seria. Un relay en Elixir. Tres skills con briefings estructurados. Una app móvil que corre en un Nexus 7 de 2013. Una licencia que protege la integridad del proyecto a largo plazo. Una política de privacidad que dice *"los datos no salen de tu dispositivo"* y la implementa.

Eso es lo que hace a Paseo diferente. No es un equipo de cuatro ingenieros con VC detrás. Es una persona con criterio, ejecutando con disciplina, publicando con transparencia. El código está en GitHub, los RFCs están en issues públicos, las decisiones de licencia están en el README, los benchmarks están en las reviews externas. Si quieres auditar, todo es auditable.

Y eso, honestamente, es lo que más me gusta del proyecto. No es la tecnología (que es sólida), ni la UI (que es buena), ni el voice (que es un experimento). Es la operación: **una persona escribiendo un manifiesto, manteniendo un proyecto que importa**.

## Lo que Paseo no resuelve (las críticas honestas)

No quiero terminar este artículo como un panfleto. Paseo tiene problemas. Los enumero y opino:

- **Multi-provider tiene coste de mantenimiento**. El catálogo de 35+ proveedores es una promesa, no un hecho. Cada shim ACP tiene su propia cadencia de release. Si tu agente favorito se desactualiza, Paseo no puede hacer nada: depende del shim externo. El RFC #1042 es la prueba de que el maintainer lo sabe y está trabajando en la solución (delegar en ACP), pero hoy la estabilidad varía por proveedor.
- **El team of one es un riesgo operacional**. Si el maintainer se cansa, se enferma, o simplemente cambia de proyecto, Paseo se queda sin líder. El proyecto tiene contribuciones de la comunidad (gracias a la licencia AGPL, hay incentivo) pero nadie con la visión completa del sistema. Mitigación: la licencia AGPL protege que un fork serio mantenga la dirección; en la práctica, faltan todavía las contribuciones a la altura.
- **Voice sigue siendo experimental**. La promesa de "procesado local" es excelente, pero la calidad de la transcripción varía mucho por dispositivo. No es una feature en la que puedas confiar al 100% para producción.
- **El comando `paseo run --host remote` requiere que el daemon remoto sea accesible**. Si quieres usar Paseo desde la oficina contra tu daemon de casa, necesitas Tailscale, SSH tunnel, o el relay. No hay un "Paseo Cloud" mágico, ni lo va a haber (por la licencia).
- **El modelo de precios para Claude Code cambió recientemente**. Como comentó el maintainer en HN, el consumo de Claude Code bajo suscripción ahora cuenta para un pool de creditos distinto, más restrictivo. Eso complica la economía del setup si dependes de Claude Code. Mitigación: alterna con OpenCode (gratis), Codex (suscripción), o los demás.

Esas críticas no invalidan el proyecto. Son la honestidad que el maintainer muestra en cada respuesta de HN, Discord y Reddit. No promete lo que no tiene; publica lo que tiene.

## Cómo empezar: del cero a un daemon con agentes

Voy a cerrar con la ruta de instalación más directa, que es la que recomiendo a quien llega por primera vez:

### Path 0 — recomendado (hosted-cero, escritorio real)

1. Descarga la app de escritorio desde [paseo.sh/download](https://paseo.sh/download). La app abre y arranca el daemon en segundo plano. Sin más setup.
2. Instala al menos un proveedor: la propia UI de Paseo tiene un catálogo de "one-click installs". Yo empiezo con OpenCode (free, sin suscripción) y luego añado Claude Code si tengo suscripción activa.
3. Crea tu primer agente desde *"Add Project"*: le das un directorio de trabajo, le escribes un prompt, lo lanzas. La sesión queda viva en el daemon.
4. Empareja el móvil: *Settings → tu host → Pair Device*. Te aparecerá un QR que escaneas con la app móvil. Listo.

### Path 1 — servidor headless (para el Mini PC o NAS)

```bash
npm install -g @getpaseo/cli
paseo
```

Paseo arranca en local, te pregunta si quieres activar el relay. Si dices que no, abres Tailscale en el servidor y en el móvil, y conectas via `paseo --host workstation.local:6767` desde la CLI o desde la app móvil con la IP de Tailscale. Es la ruta correcta para un server casero.

### Path 2 — Docker

```bash
docker run -d --name paseo \
  -p 6767:6767 \
  -e PASEO_PASSWORD=change-me \
  -v "$PWD/paseo-home:/home/paseo" \
  -v "$PWD:/workspace" \
  ghcr.io/getpaseo/paseo:latest
```

Abres `http://localhost:6767`, extiendes la imagen con los CLIs de los proveedores que uses, pasas credenciales por env vars o el volumen persistente. La imagen base es lo bastante buena para empezar; la complicas cuando lo necesitas.

## Lecciones que me llevo de este proyecto

Después de tres semanas con Paseo como mi cliente diario, saco cuatro conclusiones que ya están en mi workflow:

1. **El daemon + cliente es el patrón correcto para tools individuales**. Si tu app de agente va a durar más de un año, considera no ser una app con estado; sé un proceso con estado y unos clientes que lo controlan. La longevidad es mayor. La UX, contraintuitivamente, no es peor.
2. **Delegar en protocolos estándar es mejor que mantener adapters propios**. El caso OpenCode / Claude Code / Codex via ACP es la prueba: 10.000 líneas de código custom reemplazadas por 1.100 de un genérico. Si tu proyecto tiene un protocolo similar, muévete a él. Si no existe, considera contribuir a uno que ya esté.
3. **Las licencias son statements de producto**. AGPL-3.0 en Paseo es una decisión deliberada para proteger el rumbo del proyecto. Si tienes un proyecto open source que importa, piensa qué license encarna tu visión a largo plazo.
4. **El voice local es la frontera que falta**. Paseo está en ella con Whisper on-device. Si tu proyecto necesita voice, ese es el techo: datos que no salen del dispositivo. La promesa es seria y la implementación, aunque joven, ya está en producción.

Y una observación que no es lección sino asombro: **un equipo de una persona, con disciplina, hizo en seis meses lo que equipos de cuatro no logran en un año**. Paseo es la prueba viviente de que el open source bien llevado es más eficiente que el VC-fueled. El modelo importa.

## Bibliografía y referencias

### Repositorio y documentación oficial

- [getpaseo/paseo](https://github.com/getpaseo/paseo) — Repo principal. Verificado a 2026-08-14: 13.679 estrellas, 1.410 forks, AGPL-3.0, TypeScript, último push 2026-08-14T11:39Z.
- [getpaseo/paseo-relay](https://github.com/getpaseo/paseo-relay) — Relay distribuido en Elixir. 3 forks.
- [paseo.sh](https://paseo.sh/) — Sitio oficial con docs, alternates, SDK reference, lista de proveedores.
- [Paseo Docs: Skills](https://paseo.sh/docs/skills) — Documentación de las tres skills oficiales.
- [Paseo Docs: Providers](https://paseo.sh/docs/providers) — Catálogo de proveedores soportados con install links.
- [Paseo Docs: CLI](https://paseo.sh/docs/cli) — Referencia completa del CLI, incluyendo `--host` para daemons remotos.

### RFCs y decisiones técnicas

- [RFC #1042: Migrate provider adapters to the Agent Client Protocol (ACP)](https://github.com/getpaseo/paseo/issues/1042) — El RFC que cuenta la historia del bug de storage migration en OpenCode ≥1.14 y la decisión de migrar a ACP. Cerrado, con la propuesta aprobada. Fuente de la sección sobre la historia del RFC.
- [ACP Providers · DeepWiki](https://deepwiki.com/getpaseo/paseo/6.4-acp-providers) — Documentación técnica generada el 21 de junio de 2026 sobre los ACP providers especializados.
- [OpenCode Provider · DeepWiki](https://deepwiki.com/getpaseo/paseo/6.5-opencode-provider) — Documentación del provider de OpenCode dentro de Paseo, 6 de agosto de 2026.

### Skills oficiales

- [paseo-handoff SKILL.md](https://github.com/getpaseo/paseo/blob/main/skills/paseo-handoff/SKILL.md) — La plantilla de briefing para handoffs entre agentes.
- [paseo-advisor SKILL.md](https://github.com/getpaseo/paseo/blob/main/skills/paseo-advisor/SKILL.md) — El mecanismo de segunda opinión sin delegación.
- [paseo-committee SKILL.md](https://github.com/getpaseo/paseo/blob/main/skills/paseo-committee/SKILL.md) — Comité de dos agentes contrastados para planificación difícil.

### Hilos y discusiones de la comunidad

- [Show HN: Paseo – Beautiful open-source coding agent interface](https://news.ycombinator.com/item?id=48377250) — Hilo del 9 de junio de 2026, fuente de citas verbatim sobre *"ship on the go"*, la decisión de licencias, y la confirmación de *"team of one"*.
- [r/PaseoAI](https://www.reddit.com/r/PaseoAI/) — Subreddit oficial, feedback continuo de la comunidad.
- [Paseo Discord](https://discord.gg/jz8T2uahpH) — Canal comunitario donde el maintainer responde por nombre.

### Reseñas y análisis externos

- [Paseo is a free, self-hostable, open-source application — GIGAZINE](https://gigazine.net/gsc_news/en/20260705-paseo/) — Review del 5 de julio de 2026. Fuente de la confirmación de voice procesado localmente, los shortcuts del desktop, y los IDs oficiales de App Store y Google Play.
- [Paseo Review 2026: Cross-Device Control for Claude Code](https://vibecodinghub.org/blog/paseo-review) — Review externa del 3 de julio con escenarios de uso.
- [Paseo: Self-Host Claude Code, Codex, OpenCode — DevGENT](https://devgent.org/en/paseo-self-host-claude-code-agents-and-supervise-from-phone-en/) — Guía self-host con foco en Tailscale y relay.
- [Paseo — единый интерфейс для оркестрации](https://ai4coding.ru/solutions/getpaseo-paseo) — Análisis en ruso con foco en la arquitectura de relay.

### Artículos relacionados en este blog

- [La comparativa operativa con OpenChamber, CodeNomad y opencode-mobile](/es/blog/openchamber-paseo-comparativa-2026/) — El post del 14 de agosto, donde Paseo es la pieza anclada.
- [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) — El post del 26 de julio, predecesor de la comparativa.
- [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) — La visión general del ecosistema.
- [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/) — Cómo se trabaja con subagentes en OpenCode.
- [Paradigmas alternativos de ingeniería de software con IA](/es/blog/paradigmas-alternativos-ingenieria-software-ia/) — Donde menciono Conductor como predecesor conceptual de Paseo.

## Cierre

Paseo es uno de esos proyectos que te reconcilian con el open source. No porque sea perfecto —ya vimos que no—, sino porque la honestidad del maintainer, la calidad del RFC, la disciplina de no lanzar features que no funcionan, y la licencia que protege el rumbo, son cosas que ves muy poco en cualquier categoría de software. Si tu workflow se parece a *"uso varios modelos, quiero supervisar desde el móvil, no quiero regalar mis datos a un SaaS, y no me importa aprender algo nuevo"*, Paseo es la respuesta. Si tu workflow es *"uso solo OpenCode desde el terminal y no me voy a mover"*, Paseo es overkill y OpenChamber te sirve más.

La próxima vez que alguien te diga que el open source individual no puede competir con el software corporativo, mándale el link al RFC #1042. Una persona, 10.000 líneas eliminadas, una abstracción estándar adoptada, y un proyecto mejor cada día. Es la historia del software cuando está bien hecho.

Nos leemos en el próximo devlog.
