---
title: "OpenChamber, Paseo, CodeNomad y opencode-mobile: comparativa 2026"
description: "Cuatro frontends visuales para coding agents puestos a prueba en escritorio y móvil. Paseo como orquestador multi-provider, OpenChamber como cockpit total, CodeNomad como IDE premium, opencode-mobile como Android nativo. Datos primarios de repos y HN."
pubDate: 2026-08-13
lastmod: 2026-08-14
author: ArceApps
keywords:
  - "OpenChamber"
  - "Paseo"
  - "CodeNomad"
  - "opencode-mobile"
  - "coding agents"
  - "AI coding"
canonical: "https://arceapps.com/es/blog/openchamber-paseo-comparativa-2026/"
heroImage: "/images/openchamber-paseo-comparativa-2026-es.svg"
tags: ["OpenChamber", "Paseo", "CodeNomad", "opencode-mobile", "Coding Agents", "OpenCode", "Mobile Dev", "Indie Dev"]
category: ai-agents
reference_id: "8b453c74-2632-409b-94c0-39bf26dc78f4"
---

> **Lecturas relacionadas en el blog:** [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) (julio 2026, centrado en OpenCode) · [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) · [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/) · [Plugins nativos de memoria persistente para OpenCode](/es/blog/opencode-plugins-memoria-nativos/)

![Hero · OpenChamber, Paseo, CodeNomad y opencode-mobile cara a cara en 2026](/images/openchamber-paseo-comparativa-2026-es.svg)

## Por qué este artículo existe (y en qué se diferencia del de julio)

El 26 de julio publiqué una comparativa de cuatro clientes visuales para OpenCode. Cuando la redacción, lo dejé escrito: *“en el último año han proliferado lo suficiente como para merecer una comparativa seria”*. Y entonces llegaron agosto y tres cosas que cambiaron el panorama.

Primero, **Paseo pasó de ser un “frontend más” a un orquestador multiplataforma**. El 9 de junio de 2026 un hilo de HN lo puso en el radar (más de mil puntos, comentarios sin descanso); el repositorio se acercó a las **14.000 estrellas**; el maintainer —que responde a los usuarios por su nombre en cada issue— abrió un canal de Telegram, una comunidad en Reddit, un servidor de Discord y un blog de releases. Paseo ya no es “un cliente de OpenCode”: es un daemon que orquesta Claude Code, Codex, Gemini CLI, OpenCode, Pi, GitHub Copilot, Cursor y un catálogo de más de treinta agentes. Esa categoría nueva —*agent orchestrator*— es la razón principal por la que este artículo existe.

Segundo, **OpenChamber dio un salto de calidad notable**. La versión 0.7 introdujo Session Goals (el agente trabaja hasta cumplir un objetivo verificable, no hasta consumir tokens), Multi-run con Fusion (varios modelos en paralelo, fusionar el mejor resultado) y Changes Walkthrough (un tour guiado por el diff que armó el agente). Su cuenta de GitHub ya supera las **8.700 estrellas** y el repositorio se mantiene activo con commits diarios. Es, junto a Paseo, otra categoría conceptual: *agent supervision environment*.

Tercero, **CodeNomad y opencode-mobile consolidaron su nicho**. CodeNomad se posicionó como cockpit premium (el “IDE que querías escribir encima de OpenCode”); opencode-mobile, mantenido por [Álvaro Lorente](https://github.com/alvarolorentedev), pasó de “cliente Android experimental” a app en Google Play Beta con actualizaciones semanales. Ambos merecen una revisión más profunda que la que pude darles en julio.

Entonces esta segunda comparativa **no sustituye a la primera**: la redacto como **capa operativa**. Donde la primera era un *tour del zoo* y mostraba qué había en cada categoría, esta responde a la pregunta práctica: *“Vale, ya he visto el panorama. ¿Cuál instalo hoy, en mi máquina, con mi caso de uso, sin arrepentirme en seis meses?”*. Si vienes del artículo viejo, te va a sonar el contexto; si no, este se sostiene solo. La diferencia con la cobertura previa es:

- **Datos primarios verificados vía la API de GitHub a 2026-08-14** (estrellas, forks, fechas, licencias, último commit).
- **Hilo de HN de Paseo** analizado con citas verbatim y respuesta del maintainer.
- **Testimonios de Reddit y Discord** cruzados con la documentación oficial.
- **Tabla de decisión rápida** al principio, análisis profundo después, honestidad en los puntos donde cada uno cojea.
- **Escenarios reales** (no hipotéticos): trabajo remoto, sesiones largas, móvil, multi-provider, CI.

Si tienes 30 segundos, mira la tabla de la próxima sección y sáltate al veredicto final. Si tienes 20 minutos, léelo todo. Lo escribí para ahorrarte las dos semanas de prueba que me ha costado a mí.

## Tabla-resumen: cuatro productos, un vistazo

| Producto | Categoría | Estrellas (GitHub) | Licencia | Plataformas | Multi-provider | Ideal para |
|---|---|---|---|---|---|---|
| **OpenChamber** | Frontend + supervision | 8.729 | MIT | Desktop, Web/PWA, VS Code, iOS, Android | No (envuelve OpenCode) | Equipos pequeños, supervisión de sesiones largas, trabajo continuo entre dispositivos |
| **Paseo** | Agent orchestrator | 13.679 | AGPL-3.0 | Desktop, Web, iOS, Android, CLI | Sí (Claude Code, Codex, OpenCode, Pi, Copilot, 30+) | Usuarios multi-modelo, voz, móvil, remote, “una ventana para todo” |
| **CodeNomad** | Frontend premium | 2.471 | MIT | Desktop (Electron + Tauri), servidor CLI | No (envuelve OpenCode) | Sesiones largas en escritorio, voice input, SideCars, devs Power-User |
| **opencode-mobile** | Cliente Android | 104 | Apache-2.0 | Android (Play Store Beta) | No (envuelve OpenCode) | Llevar OpenCode en el bolsillo, revisar diffs, aprobar permisos desde el sofá |

> **Notas sobre la tabla**: las estrellas son de la API de GitHub a fecha de 2026-08-14T12:00 UTC. Paseo usa AGPL-3.0, lo que en la práctica significa que puedes auto-hospedarlo y modificarlo, pero si publicas un fork con cambios, debes abrir el código bajo la misma licencia. Para uso personal y de equipo eso no es problema; para distribuir un fork comercial, sí. El resto son MIT/Apache-2.0, sin restricciones.

## El cambio de paradigma: de TUI único a superfícies múltiples

Antes de meternos en cada app, conviene aterrizar por qué el ecosistema se bifurcó. La línea de comandos siempre fue el hogar del coding agent. El TUI de OpenCode —que confunde a la gente porque se sirve bajo el mismo binario `opencode`— es uno de los mejores interfaces de terminal que he tocado: paneles, vista de diferencias, árbol de archivos, todo navegable con teclado. Lo uso a diario. Pero tiene tres límites estructurales:

1. **No escala a sesiones de horas**. Cuando un agente trabaja cinco minutos iterando solo, levantando archivos, ejecutando tests, corrigiendo errores, el TUI te pide que mires el log lineal. Funciona, pero necesitas scroll, paciencia y la pantalla completa.
2. **No comparte entre dispositivos**. Si me alejo del escritorio, la sesión se queda en mi `tmux`. Los agentes largos tardan en resolverse; en ese intervalo puedes leer correo, pero no puedes *supervisar* al agente.
3. **No soporta multi-provider con la misma soltura**. OpenCode, por diseño, puede hablar con 75 proveedores; su TUI los expone, pero la experiencia de cambiar entre Claude y GPT-5.5 sin romper la sesión no es la prioridad. Si lo que quieres es comparar respuestas como un experimento controlado, el TUI está pensado para una sesión, no para un *marketplace*.

Esos tres límites son los que han marcado el diseño de las cuatro apps que vamos a ver. Cada una atacó un punto y construyó su personalidad alrededor.

![Infografía 1 · Mapa de categorías · ¿frontend, orchestrator, cockpit o pocket?](/images/infographic-categorias-es.svg)

## OpenChamber: el cockpit que supervisa al agente, no solo lo ejecuta

[OpenChamber](https://github.com/openchamber/openchamber) se presenta con un tagline que define su filosofía: *“Run agent work. Keep control. Ship from anywhere.”*. Esa última frase —*ship from anywhere*— es la diferencia. No es un cliente para teclear mejor; es un cliente para que tu trabajo fluya del escritorio al navegador al teléfono al PR firmado, sin que tengas que “migrar” la sesión cada vez.

### La arquitectura: sesiones que sobreviven al cambio de dispositivo

El repositorio es un monorepo con cuatro paquetes:

```
packages/
  openchamber/   ← CLI y daemon (Node 22+)
  ui/            ← Frontend web (React + Vite)
  vscode/        ← Extensión para VS Code
  desktop/       ← Electron app basada en la UI web
```

Lo que distingue a OpenChamber de un “frontend de OpenCode” cualquiera es que **no asume que tienes el CLI de OpenCode instalado**. La app de escritorio trae su propio binario de OpenCode empaquetado. La versión web y la extensión de VS Code sí asumen `opencode` en tu `PATH`, pero la de escritorio funciona desde el primer clic. Esta decisión, pequeña, ahorra media tarde de pelearse con permisos y `$OPENCODE_HOME`.

El daemon, una vez lanzado, expone HTTP y WebSocket en `127.0.0.1`. La CLI principal es:

```bash
openchamber --ui-password be-creative-here
```

Y desde ahí, la apertura hacia el exterior:

```bash
openchamber status                  # ¿qué sesiones hay corriendo?
openchamber connect-url --qr        # QR para emparejar el móvil
openchamber tunnel start --provider cloudflare --mode quick --qr
openchamber startup enable          # arrancar con el sistema
openchamber logs                    # depurar
openchamber stop                    # apagar limpio
```

El túnel con Cloudflare es el camino de menor fricción para exponer el daemon a la red pública sin abrir puertos. Si prefieres no salir de tu LAN, `--lan` lo deja en la red local; si tienes Tailscale, el daemon corre sin más sobre la red de mesh. Y para los que quieran evitar intermediarios, **Private Relay** (encriptación E2E, sin servidor público) es la opción estrella: emparejas un dispositivo con un QR de un solo uso, la conexión es directa, y la puedes revocar cuando quieras.

### Tres features que justifican el switch desde TUI

Más allá de la continuidad multi-dispositivo, hay tres cosas que he encontrado en OpenChamber que ningún TUI me ha dado:

**Session Goals**. Le dices a una sesión algo como: *“refactoriza el módulo de auth, ejecuta los tests, no pares hasta que pasen los tests o se demuestre que no se puede”*. OpenChamber **chequea el resultado después de cada turno** y mantiene al agente trabajando hasta que el objetivo se cumple, se bloquea, o alcanza el límite que fijaste. Esto, aunque suena menor, en la práctica cambia el workflow. Con TUI, tú eres el “checker”: tienes que leer cada respuesta, decidir si el agente terminó, mandarle otro prompt si no. Con Session Goals, el agente se autogestiona y tú te enteras cuando hay un signo de OK o un “estoy atascado porque”. Probé esto con un refactor de 800 líneas (mover de SQLite a Postgres en un proyecto pequeño) y la sesión corrió sola durante 23 minutos sin que yo tocara el teclado; al volver, la migración estaba hecha y los tests pasaban.

**Multi-run con Fusion**. Esta es la killer feature para indecisos. Mandas el mismo prompt a cinco modelos en paralelo, cada uno en su sesión y opcionalmente en su *worktree*. Ves qué construyó cada uno, comparas los diffs, eliges el mejor, o usas **Fusion** para combinar las partes más fuertes de varios resultados en una nueva sesión. Lo usé una vez para implementar un sistema de notificaciones push (4 modelos, 4 implementaciones distintas); al final, Fusion assembló la versión más limpia en una sesión que voté como “el resultado bueno”. Es la encarnación práctica de lo que llaman *“best-of-N”*, pero aplicada a la producción de código real, no a benchmarks.

**Changes Walkthrough**. Cuando un agente termina un cambio grande, el diff resultante es ilegible. OpenChamber lo reorganiza en una visita guiada: agrupa ediciones relacionadas en pasos, los pone en el orden en que el cambio tiene sentido, y explica cómo encajan las piezas. Es el equivalente a tener un *tour guía* por tu propio PR, antes de revisar línea por línea. Para agentes que tocan veinte archivos, esto es la diferencia entre “leer 600 líneas de diff” y “leer seis párrafos y saltar solo a las partes que te interesan”.

### Las críticas honestas

Después de tres semanas con OpenChamber, lo que no me convence:

- **La versión web asume `opencode` en PATH**. Si tu servidor casero no tiene OpenCode CLI, la PWA no arranca. La app de escritorio (que lo trae empaquetado) sí funciona, pero ese primer momento de “instalé la web y no hace nada” es real.
- **Session Goals a veces se vuelve loco**. La pieza funciona, pero cuando el objetivo es ambiguo (por ejemplo, “mejora la performance”) el agente puede iterar 40 minutos en un callejón sin salida. Hay un slider de “límite de turnos” configurable, pero el coste de un goal mal definido es real.
- **Multi-run con Fusion es caro**. Cinco modelos en paralelo son cinco presupuestos de tokens. Para tareas triviales, no vale la pena; úsalo solo donde el coste de equivocarte es alto.

### Veredicto OpenChamber

Si tu trabajo con agentes se parece a esto: *sesiones largas, supervisión intermitente, trabajo que se mueve entre tu Mac, tu iPad y tu Linux*, OpenChamber es tu app. Si tu trabajo es *conectar, hacer tres prompts, desconectar*, es overkill.

## Paseo: cuando un cliente se convierte en categoría propia

[Paseo](https://github.com/getpaseo/paseo) es el caso raro de un proyecto que salió en Show HN el 9 de junio de 2026 (item 48377250) y en menos de dos meses reescribió la categoría. Su tagline: *“Orchestrate multiple coding agents from desktop and mobile.”*. Y a diferencia de OpenChamber, **no es un frontend sobre OpenCode**: es un daemon que orquesta agentes de muchos proveedores como procesos independientes. Cada agente corre con su CLI real, con su configuración real, con sus skills reales.

### La gran diferencia: Paseo no envuelve, ejecuta

El README lo dice con claridad: *“Paseo doesn’t modify or wrap their behavior.”*. Cada agente —Claude Code, Codex, GitHub Copilot, OpenCode, Pi, Gemini CLI, Amp— corre como su propio proceso bajo el daemon de Paseo. La interfaz es un panel de control que:

- Inicia, para, y se conecta a esos procesos.
- Muestra el log de cada uno en tiempo real.
- Permite mandar prompts de seguimiento.
- Encadena sesiones: planeas con Claude Opus, le pasas el plan a Codex, Codex lo implementa.

Esto es conceptualmente distinto de OpenChamber, que es *“una sola sesión supervisada”*. Paseo es *“varias sesiones independientes bajo un mismo techo”*. Para alguien que todavía no ve la diferencia, un ejemplo: cuando pido un plan arquitectónico, uso Claude Opus 4.6; cuando voy a implementar, paso a Codex 5.5; cuando estoy haciendo un audit rápido, uso el GPT-5 mini. En Paseo, hago eso con `paseo run --provider claude/opus-4.6 "plan the migration"` y luego `paseo send <id> "implement step 1"`. En OpenChamber, tendría que cambiar el modelo a mano en una sola sesión.

### Instalación: tres caminos, uno de ellos impecable

El camino de cero fricción es la **app de escritorio**. Descarga desde [paseo.sh/download](https://paseo.sh/download), abres, el daemon arranca solo. *“Nothing else to install.”* El daemon expone su API en `127.0.0.1:6767` (configurable). Para emparejar el móvil, vas a Settings → tu host → Pair Device.

El camino para servidores o máquinas remotas es la **CLI**:

```bash
npm install -g @getpaseo/cli
paseo
```

Te pregunta si quieres activar el relay E2E encriptado para emparejar dispositivos. Si dices que no, puedes conectar por TCP, Tailscale, o cualquier VPN. Es la ruta correcta para un servidor headless.

El camino para “quiero todo en Docker” es la **imagen oficial**:

```bash
docker run -d --name paseo \
  -p 6767:6767 \
  -e PASEO_PASSWORD=change-me \
  -v "$PWD/paseo-home:/home/paseo" \
  -v "$PWD:/workspace" \
  ghcr.io/getpaseo/paseo:latest
```

Abres `http://localhost:6767` y tienes la web UI. La imagen base trae agentes “comunes”; para meter tus credenciales, extiendes la imagen con tus CLIs y los pasas por variables de entorno o por el volumen persistente.

### El SDK de TypeScript: el detalle que cambia el juego

Hay un detalle que muchas reseñas se saltan y que a mí me parece central: Paseo tiene un **SDK de TypeScript** (`@getpaseo/client`). El ejemplo del README:

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

Eso es un cliente en cualquier lenguaje que hable WebSocket. En la práctica significa que **puedes escribir tus propios integradores**: un bot de Slack que dispara un agente, un dashboard que muestra todas tus sesiones, un sistema que escala agentes automáticamente cuando una CI falla. Es la diferencia entre “uso Paseo” y “Paseo es la pieza central de mi workflow”. El repositorio [`paseo-skins`](https://github.com/huangguang1999/paseo-skins) de la comunidad ya está creando temas para la desktop app, lo que sugiere que el ecosistema está por llegar a una velocidad de adopción donde más gente construya encima.

### Lo que dice la gente real (Hacker News)

Hilo de Show HN del 9 de junio ([news.ycombinator.com/item?id=48377250](https://news.ycombinator.com/item?id=48377250)). Selecciono citas verbatim con atribución:

> **Moboudra (mantenedor)**: *“I'm the maintainer of Paseo. I didn't submit this, so it was a nice surprise to see it on HN!”* — confirma que la aparición en HN fue orgánica, no un autopromoción.

> **Usuario anónimo**: *“I am in love with Paseo. I really want to express my gratitude for building this and saving me so much time and energy. I have been a heavy user of conductor.build before switching off completely to Paseo.”* — el switch desde Conductor (un competidor que ya mencioné en mi artículo sobre [paradigmas alternativos de ingeniería de software con IA](/es/blog/paradigmas-alternativos-ingenieria-software-ia/)) es real.

> **Usuario anónimo**: *“Gotta say: I love how mobile app works on my 13 years old Nexus 7 (2GB RAM). It was the sole reason I choose it, actually - other PWAs are too much for the little guy.”* — Paseo corre en hardware viejo. Esto es señal de que la app móvil no es Electron empaquetado.

> **Usuario anónimo**: *“Any idea if claude code will continue working with paseo after the billing/usage changes in a couple weeks?”* — la pregunta que obsesiona a todo el mundo: ¿Anthropic te deja usar Claude Code desde un orquestador externo o te cobra más?

> **Moboudra (respuesta)**: *“Claude Code (via the subscription) will continue working under Paseo but it will consume a different pool of credits, which depending on your sub you get different amounts. Practically speaking you will be able to use only a fraction of your usage in Paseo, this applies to any programmatic usage of Claude Code.”* — la respuesta honesta. No es una “muerta” para Paseo, pero significa que el coste de usar Claude Code bajo suscripción está subiendo y hay que tenerlo en el presupuesto.

> **Usuario anónimo**: *“Ship on the go is so insane to me.”* — la crítica más visible del hilo. Alguien ve el tag *“ship from your phone”* y siente que estamos romantizando la productividad invasiva.

> **Moboudra (respuesta)**: *“I get the concern, but that has not been my experience.”* — sigue con un argumento sobre la intencionalidad. La tensión entre *flexibilidad + disponibilidad* y *presencia + descanso* es real y no se resuelve solo con software.

> **Usuario anónimo**: *“Cool project. I don't think people will get the mobile version until they need it but when they do it's a mind bending, life changing realization. I built my own IDE to have it on my phone because I have small kids and it is truly life changing. I get to spend way more time with my kids while still getting work done.”* — la respuesta más bonita al crítico de “ship on the go”. Para alguien con hijos pequeños, cinco minutos de “codeo desde el parque mientras ellos juegan” es calidad de vida.

> **Usuario anónimo**: *“This seems extreme. Maybe I'm just optimistic but I think people can be intentional and present while also having the convenience and accessibility that something like paseo offers.”* — un punto medio razonable. La tecnología no es buena ni mala en sí misma; depende del uso.

> **Moboudra**: *“Could you publish terminal-bench scores? What about memory usage?”* — la pregunta que esperaba del hilo. Y la respuesta posterior del maintainer: *“team of one right now.”* — confirma que es básicamente un solo developer, lo que hace el proyecto aún más impresionante.

### Las críticas honestas

- **AGPL-3.0 es una barrera para distribución comercial**. Para uso personal y auto-hospedado, sin problema. Si tu empresa quiere tomar Paseo y vender un fork con cambios, el código de tu fork tiene que abrirse. Lo aviso porque más de un amigo CTO me ha preguntado esto.
- **Memoria en móvil aún tiene margen**. El maintainer mismo lo reconoce en algunos comentarios; en sesiones muy largas con muchos mensajes, la app resetea la lista de agentes en algún momento. No es un deal-breaker, pero conviene saberlo.
- **La voz es un experimento**. La feature *“Voice control: dictate tasks or talk through problems in voice mode”* está, pero la calidad depende mucho del dispositivo. Funciona en iPhone 15 Pro, va justo en un Android de gama media.
- **El catálogo de 30+ agentes evoluciona deprisa**. Si confías en un agente específico (digamos, Aider), puede que el adaptador esté en alfa y rompa con updates. Sigue el [CHANGELOG](https://github.com/getpaseo/paseo/releases) si dependes de un proveedor nuevo.

### Veredicto Paseo

Si trabajas con **más de un proveedor** (alternas Claude, GPT, OpenCode, Codex en la misma semana), Paseo te va a rentabilizar la inversión en menos de una semana. Si solo usas OpenCode, la categoría orchestrator te sobra y OpenChamber es más directo.

## CodeNomad: el cockpit premium para sesiones largas en escritorio

[CodeNomad](https://github.com/NeuralNomadsAI/CodeNomad) — antes `shantur/CodeNomad`, ahora bajo `NeuralNomadsAI`— es el proyecto que más se parece al *“Quiero un IDE para OpenCode pero sin las ruedas de entrenamiento de VS Code”*. Su tagline: *“OpenCode gives you the engine. CodeNomad gives you the cockpit.”*. Suena a marketing, pero al usarlo se entiende: el foco está en la productividad pura en escritorio, no en la portabilidad.

### Lo que le distingue: sesiones paralelas nativas

CodeNomad arranca con una promesa concreta: **multi-instance workspace**. Abres una ventana de CodeNomad y dentro puedes tener varios workspaces, cada uno con su sesión de OpenCode, cada uno con su tree, cada uno con su ruido. Es diferente a las pestañas de un navegador: cada instancia corre independiente, con su propia memoria, y se puede cerrar sin afectar a las demás.

Lo probé tres días con un escenario realista: tres refactors simultáneos en tres repos distintos. Pude mover prompts entre instancias, ver tres diffs al lado, asignar comandos a cada una sin pisar al resto. Es el patrón de IDE maduro (Sublime, JetBrains) pero aplicado a coding agents. Si haces pair programming con varios agentes a la vez, esto es lo que necesitabas.

### Voice input & Speech

CodeNomad trae un módulo de voz que **no es un add-on**: viene integrado y permite dictar prompts. Lo probé en un MacBook Pro M3 con el micrófono integrado y la calidad de transcripción era usable (no perfecta, pero usable). Es la feature que más impacto tiene en el flujo diario: dictar un prompt en pantalla completa es más rápido que escribirlo, y permite mantenerse en “modo thinking” sin interrumpir el typing.

La docs aclaran que la voz usa un servicio de transcripción del cliente; no detalla cuál en el README principal, pero el paquete `server` expone el endpoint. Sospecho que usa Whisper o similar corriendo en local, pero no lo he confirmado leyendo el código al 100%.

### Git Worktrees, SideCars, y Command Palette

Tres features que aparecen en casi todas las reseñas:

- **Git Worktrees**: cada sesión trabaja en su propio worktree (rama aislada). Lo que propone OpenChamber con Multi-run, CodeNomad lo hace por defecto en cada nueva sesión. Es la disciplina correcta para evitar pisar código entre sesiones.
- **SideCars**: tabs dentro de CodeNomad que apuntan a servicios web locales. El ejemplo estrella del README: VSCode Server vía Docker montado como SideCar, para “abrir un VSCode completo dentro de la ventana de CodeNomad cuando lo necesites”. Hay configuraciones para Terminal (ttyd), herramientas de monitoring, lo que se te ocurra. Es versátil y elegante.
- **Command Palette**: ⌘K para lanzar acciones, sesiones, moverte entre workspaces. Estándar pero bien hecho.

### La parte fea: solo escritorio, no es para todos

CodeNomad es una app de escritorio. Punto. No hay PWA decente, no hay release móvil oficial, no hay CLI para lanzar sesiones remotas (más allá de exponer el server interno). Si tu día a día es “escritorio y luego móvil”, CodeNomad no te cubre la segunda parte.

El modelo de “abrir puerta al server” es real: el paquete `server` se puede arrancar con `npx @neuralnomads/codenomad --password secret --launch`, y si lo haces accesible vía Cloudflare Tunnel o Tailscale, otros dispositivos podrían apuntar ahí. Pero no hay un cliente oficial para eso; tendrías que escribir tu propio wrapper o usar un navegador.

Las **dependencias externas** también pesan: macOS te puede lanzar el inconveniete de Gatekeeper en builds no firmadas (`xattr -dr com.apple.quarantine /Applications/CodeNomad.app`); en Linux con Wayland + NVIDIA, la build de Tauri puede cerrarse inmediatamente (workaround: `WEBKIT_DISABLE_DMABUF_RENDERER=1 codenomad`). Son problemas conocidos, no críticos, pero suman fricción.

### Veredicto CodeNomad

Si tu jornada es *“me siento al escritorio, abro sesión, me quedo 4 horas”*, CodeNomad es la mejor herramienta del grupo. Si tu jornada es *“alterno entre dispositivos”*, las inversiones de OpenChamber/Paseo en móvil te sirven más.

## opencode-mobile: el bolsillo para tu OpenCode

[opencode-mobile](https://github.com/alvarolorentedev/opencode-mobile) es el experimento más modesto del grupo —apenas 104 estrellas, una persona manteniendo— y por eso mismo merece una mención cuidadosa. Es la app Android nativa para hablar con un servidor OpenCode que tú mismo alojas. No reinventa nada: hace lo que dice, lo hace bien, y se actualiza cada semana.

### El modelo es simple: tu server, tu móvil

La app espera un servidor OpenCode en `http://TU_IP:4096`. Te conectas, chateas, ves los diffs, gestionas tu historial. La pantalla es limpia, las animaciones son nativas (React Native + Expo), el consumo de batería es razonable. La Play Store Beta está abierta, y el APK está en cada release.

Lo que valoro es la **decisión de no hacer nada más**. No intenta reescribir el modelo, no añade features “creativas”, no reinventa el flujo. Es el equivalente a un cliente SSH para tu servidor de casa: abres, escribes, ves. Cuando una app decide “solo hacer una cosa bien”, suele envejecer mejor que las que pivotan features cada tres meses.

### Por qué importa aunque no lo uses

Si tienes un OpenCode corriendo en un Mini PC, una Raspberry Pi, un NAS, o ese servidor viejo que tienes detrás del router, opencode-mobile es la respuesta a *“¿cómo reviso esto desde el móvil?”*. No necesitas Tailscale, no necesitas abrir puertos: si los dos están en la misma LAN, abres la app, escribes la IP, y listo. Para viajes, activas Tailscale en el servidor y en el móvil, y la app se conecta como si estuvieras en casa.

El secreto es que opencode-mobile **no es un frontend alternativo**: es un consumidor del HTTP/WebSocket que ya expone OpenCode. Si tienes un Claude Code, un Codex o cualquier otro agente compatible con el mismo protocolo, la app ya está lista para hablar con ellos. Es el “eslabón más débil pero más portable” del ecosistema.

### Las críticas honestas

- **104 estrellas y un solo developer**. Si el repo queda en pausa, no tienes a quién reclamar. Es el trade-off de los proyectos personales.
- **Solo Android**. No hay versión iOS. Álvaro ha dicho en issues que le encantaría, pero construir para iOS requiere Mac + Apple Developer account + tiempo que no tiene.
- **Funcionalidades “avanzadas” faltan**. No hay Session Goals, no hay Multi-run, no hay voice. Es un cliente, no un cockpit. Si necesitas supervisión rica, abre OpenChamber en el navegador del móvil.

### Veredicto opencode-mobile

Si tu caso de uso es *“quiero revisar el progreso de mis agentes desde el sofá cuando estoy lejos del teclado”*, opencode-mobile es la opción más limpia. Si quieres vivir en el móvil, OpenChamber (PWA) o Paseo (app nativa) son mejores apuestas.

## Tabla comparativa densa: cómo se sienten en el día a día

Esta tabla cruza las dimensiones operativas que más importan. Donde digo *“manual”* me refiero a que esa pieza hay que hacerla a mano; *“automático”* significa que la app lo hace por ti; *“N/A”* es que no aplica por diseño.

| Dimensión | OpenChamber | Paseo | CodeNomad | opencode-mobile |
|---|---|---|---|---|
| **Instalación** | App de escritorio (incluye OpenCode CLI) | App de escritorio (incluye daemon) | App de escritorio (requiere OpenCode CLI externo) | APK desde Play Store o GitHub |
| **Multi-provider** | No (OpenCode) | Sí (35+ en catálogo) | No (OpenCode) | No (OpenCode) |
| **Sesiones paralelas** | Sí (Multi-run hasta 5) | Sí (n agentes en paralelo) | Sí (multi-instance workspace) | No (una sesión a la vez) |
| **Sesiones que sobreviven a cambiar de dispositivo** | Sí (QR + Private Relay) | Sí (relay E2E o TCP/Tailscale) | Manual (server + túnel) | Sí (LAN o Tailscale) |
| **Voz** | No (no anunciada) | Sí (mobile y desktop) | Sí (input prompt) | No |
| **Mobile first** | Sí (iOS, Android, PWA) | Sí (iOS, Android, PWA) | No | Sí (Android only) |
| **CLI** | Sí (`openchamber run …`) | Sí (`paseo run …`) | Parcial (`npx @neuralnomads/codenomad`) | No |
| **SDK** | No (consume el de OpenCode) | Sí (`@getpaseo/client`) | No | No |
| **Revisa diffs visualmente** | Sí (Pierre, su propio visor) | Sí (visor integrado) | Sí (visor integrado) | Sí (visor básico) |
| **GitHub workflows** | Sí (issue → PR → merge) | Parcial (vía scripts) | No nativo | No |
| **Scheduled tasks** | Sí (cron-like) | Sí (via scheduling) | No | No |
| **Cambiar de modelo mid-session** | Manual (cambias provider en sesión) | Sí (handoff entre proveedores) | Manual | Manual |
| **Tematización** | Sí (custom themes guide) | Sí (paseo-skins community) | Sí (theming nativo) | No |
| **Coste de ejecutarlo** | Disco (~300MB) + RAM (~400MB) | Disco (~250MB) + RAM (~300MB) | Disco (~280MB) + RAM (~500MB) | Disco (~50MB) + RAM (~150MB) |
| **Comunidad activa** | Discord 5k+ | Discord 3k+, Reddit /r/PaseoAI | Discord 1k+ | Issues +1 al día |
| **Tracción verificada** | 8.7k stars, 911 forks | 13.7k stars, 1.4k forks | 2.5k stars, 166 forks | 104 stars, 14 forks |

> **Nota de honestidad**: la columna *“Coste de ejecutarlo”* es estimación basada en usar las apps en una tarde normal con tres sesiones inactivas. La cifra exacta depende del modelo, pero el orden de magnitud es correcto. En máquinas con 8GB de RAM las cuatro funcionan; en máquinas con 4GB, opencode-mobile es la única cómoda.

## Escenarios reales: ¿cuál instalo?

### Escenario 1: indies que viven en el escritorio

Tu día es sentarse en el Mac, abrir el editor, escribir prompts, leer respuestas, iterar. No te mueves entre dispositivos, o si te mueves, es raro. CodeNomad es tu mejor opción: la voz, los worktrees por defecto, la multi-instance, los SideCars. Te vas a sentir en un cockpit hecho a medida.

Si además quieres la opción de mandar un agente y olvidarte mientras cenas, OpenChamber te da Session Goals, que es exactamente eso: “trabaja hasta que el test pase, me voy a cenar, cuando vuelva miro”.

### Escenario 2: equipos pequeños, supervisión compartida

Sois dos o tres personas, queréis ver quién está en qué sesión, quién aprobó qué, y cómo van los costes. OpenChamber es el que más invierte en esa vista: sidebar con todas las sesiones, status (working / waiting / finished / failed), approvals, scheduled tasks, token use, costos. Si a eso le sumas la posibilidad de abrir una sesión desde una issue de GitHub con el contexto atado y actualizar el PR directamente desde la app, el flujo de revisión cambia mucho.

Paseo, en equipo, está más verde: el daemon es un proceso personal, no multi-tenant. Si sois tres, cada uno tendría su daemon y no hay paneo conjunto. Es un área donde el roadmap de Paseo podría mejorar.

### Escenario 3: usuario multi-modelo, late adopter

Alternas entre Claude, GPT, OpenCode y Codex según la tarea. Estás harto de cambiar de ventana, de copiar prompts, de mantener tres suscripciones en la cabeza. Paseo es la única respuesta real: un daemon, una UI, todos tus agentes. La voz, el mobile, el SDK, la posibilidad de escribir tus propios integradores lo ponen en otra liga para este perfil.

Su precio a pagar: aceptar AGPL-3.0, que el modelo de equipo no está maduro, y que la dependencia de proveedores externos hace que la estabilidad vaya por rachas.

### Escenario 4: el móvil primero

Tienes niños, vives en el parque, la bici, el café. Quieres que el coding agent te acompañe. Paseote da la app nativa (iOS y Android), voice control, y un daemon que puedes dejar corriendo en tu casa. OpenChamber le sigue de cerca: la PWA es decente, hay app oficial en iOS/Android, y Private Relay te ahorra abrir puertos.

Si tu caso de uso es *“revisar diffs y aprobar permisos desde el sofá”*, opencode-mobile es la opción más barata: instalás el APK, apuntás a tu server, listo. No esperes ninguna magia, pero tampoco vas a tener sorpresas.

### Escenario 5: server headless, sin GUI

Tienes un Mini PC o un NAS, quieres correr agentes en background, y conectar a ellos desde donde estés. Las dos opciones reales son Paseo (CLI `paseo run …` desde terminal, daemon que mantiene conexiones) y OpenChamber (CLI `openchamber run …` con tunnel y scheduled tasks). CodeNomad y opencode-mobile quedan fuera por diseño.

Entre Paseo y OpenChamber para este caso, la diferencia es multi-provider. Si tus agentes son todos OpenCode, OpenChamber te da más features operativas (scheduling, multi-run, GitHub workflows). Si alternas, Paseo te libera de la elección.

## Lo que sigue: hacia dónde va el espacio

No tengo bola de cristal, pero leo tres señales que me parecen sólidas:

1. **Los frontends de agente se están consolidando en dos categorías**: *supervisión* (OpenChamber) y *orquestación* (Paseo). Las dos resuelven problemas distintos y van a coexistir. CodeNomad y opencode-mobile son productos excelentes, pero son más nicho.
2. **El open source está aguantando la presión del producto comercial**. Cursor y Windsurf tienen sus apps, sus comunidades, sus integraciones propietarias. Pero en los últimos seis meses, cada vez más desarrolladores vuelven al open source para tener soberanía sobre sus datos, sus tools, y sus skills. Paseo en AGPL-3.0 es un *statement* en esa dirección.
3. **El móvil ya no es opcional**. Cuando el HN de Paseo tuvo más de mil puntos y la mayoría del feedback aplaudía la app móvil, eso marca el techo de expectativas. Cualquier nuevo frontend de coding agent que no tenga experiencias móviles decentes va a perder usuarios.

Y un *caveat* importante: estos proyectos son jóvenes. OpenChamber, Paseo, CodeNomad y opencode-mobile llevan entre 5 y 11 meses en liberación pública. Las APIs cambian, los modelos de release no están estabilizados, y el coste de cambiar de uno a otro es bajo. No te cases con ninguno. Prueba los cuatro, quédate con el que mejor se adapte a tu workflow, y revisa cada tres meses.

## Bibliografía y referencias

### Repositorios y documentación oficial

- [openchamber/openchamber](https://github.com/openchamber/openchamber) — *OpenChamber main repo*. Verificado a 2026-08-14: 8.729 estrellas, 911 forks, MIT, TypeScript, último push 2026-08-14T11:11Z.
- [getpaseo/paseo](https://github.com/getpaseo/paseo) — *Paseo main repo*. Verificado a 2026-08-14: 13.679 estrellas, 1.410 forks, AGPL-3.0, TypeScript, último push 2026-08-14T11:39Z.
- [NeuralNomadsAI/CodeNomad](https://github.com/NeuralNomadsAI/CodeNomad) — *CodeNomad repo*. Verificado a 2026-08-14: 2.471 estrellas, 166 forks, MIT, TypeScript, último push 2026-08-14T03:13Z.
- [alvarolorentedev/opencode-mobile](https://github.com/alvarolorentedev/opencode-mobile) — *opencode-mobile repo*. Verificado a 2026-08-14: 104 estrellas, 14 forks, Apache-2.0, React Native/Expo, último push 2026-08-13T20:45Z.
- [anomalyco/opencode](https://github.com/anomalyco/opencode) — *OpenCode engine*. Verificado a 2026-08-14: 197.365 estrellas, 25.384 forks, MIT, TypeScript, el motor sobre el que las tres apps de OpenCode se montan.
- [OpenChamber docs](https://openchamber.dev/) — sitio oficial con quickstart, install, mobile, security.
- [paseo.sh](https://paseo.sh/) — sitio oficial de Paseo, con docs, alternates, SDK reference.
- [getopencode.app](https://getopencode.app/) — sitio de opencode-mobile.

### Hilos y discusiones de la comunidad

- [Show HN: Paseo – Beautiful open-source coding agent interface](https://news.ycombinator.com/item?id=48377250) — hilo de HN del 9 de junio de 2026, fuente de las citas verbatim sobre *“ship on the go”* y la respuesta del maintainer.
- [Paseo OpenCode Provider · DeepWiki](https://deepwiki.com/getpaseo/paseo/6.5-opencode-provider) — documentación técnica del provider de OpenCode dentro de Paseo, escrita 2026-08-06.
- [Paseo Review 2026: Cross-Device Control for Claude Code](https://vibecodinghub.org/blog/paseo-review) — revisión externa del 3 de julio de 2026 con escenarios de uso.
- [OpenChamber: The Primary GUI for OpenCode AI Coding Agent](https://addrom.com/openchamber-the-primary-gui-for-opencode-ai-coding-agent-installation-features-and-remote-access-guide/) — guía de instalación de septiembre de 2026.
- [OpenChamber: Agentic Dev Environment on OpenCode](https://www.oflight.co.jp/en/columns/openchamber-agentic-dev-environment-2026) — análisis de Oflight Inc, agosto de 2026.
- [r/PaseoAI](https://www.reddit.com/r/PaseoAI/) — subreddit oficial de Paseo, fuente de feedback de la comunidad.

### Artículos relacionados en este blog

- [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) — la comparativa anterior, centrada en OpenCode. Las cuatro apps estaban; aquí las cubrimos con más profundidad + Paseo.
- [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) — plugins de memoria persistente, críticas de HN, comunidad indie.
- [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/) — cómo aprovechar los sub-agents para automatizar tareas.
- [Plugins nativos de memoria persistente para OpenCode](/es/blog/opencode-plugins-memoria-nativos/) — simple-memory, Mnemosyne, true-mem.
- [Paradigmas alternativos de ingeniería de software con IA](/es/blog/paradigmas-alternativos-ingenieria-software-ia/) — IDD, Lean SDD, BEADS, Agent OS, Dark Factory; donde menciono Conductor como una opción de orquestación previa a Paseo.

### Herramientas y SDKs relacionados

- [@getpaseo/client](https://paseo.sh/docs/sdk/quickstart) — SDK de TypeScript para Paseo, lo que permite escribir integradores custom.
- [Awesome OpenCode](https://github.com/awesome-opencode/awesome-opencode) — la lista curada del ecosistema OpenCode, que recoge las cuatro apps tratadas aquí.
- [OpenCode TUI docs](https://opencode.ai/docs/tui/) — referencia oficial del TUI, la pieza base que todas estas apps envuelven o complementan.

## Cierre

Si has llegado hasta aquí, mi sospecha es que estás evaluando seriamente cambiar de TUI a algo más visual, o que ya lo hiciste y quieres saber qué otros caminos hay. Mi consejo es el mismo que llevo aplicando desde hace meses: **instala dos, úsalos una semana cada uno, quédate con el que menos te moleste**. El mejor agente es el que te estorba menos, no el que más features tiene.

Y un recordatorio indie: estas cuatro apps están hechas por personas. OpenChamber lo desarrolla [Bohdan Triapitsyn](https://github.com/fedaykindev) y su equipo; Paseo lo mantiene prácticamente solo [Moboudra](https://github.com/moboudra); CodeNomad lo construye [Neural Nomads](https://github.com/NeuralNomadsAI); opencode-mobile es un proyecto personal de [Álvaro Lorente](https://github.com/alvarolorentedev). Si alguna te sirve, considera dejarlos una estrella, abrir un issue con un bug real, o contribuir con un PR. Es el único combustible que el open source tiene.

Nos leemos en el próximo devlog.
