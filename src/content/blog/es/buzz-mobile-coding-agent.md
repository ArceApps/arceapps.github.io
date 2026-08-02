---
title: "Buzz: el coding agent móvil de Block en una sala Nostr"
description: "Buzz de Block es un workspace Nostr donde humanos y agentes de IA comparten una sala firmada. Filosofía, instalación, flujos mobile-first y crítica honesta."
pubDate: 2026-08-02
lastmod: 2026-08-02
author: "ArceApps"
heroImage: "/images/buzz-mobile-coding-agent-es.svg"
keywords:
  - "Buzz Block"
  - "coding agent móvil"
  - "Nostr agents"
  - "workspace agente IA"
  - "mobile agentic"
  - "Android CLI agentes"
canonical: "https://arceapps.com/es/blog/buzz-mobile-coding-agent/"
tags: ["AI Agents", "Mobile", "Nostr", "Block", "Workflow"]
category: ai-agents
reference_id: "479ed661-5fea-4dac-877e-34a03a770f25"
---

![Buzz · Mobile Coding Agent — humanos y agentes comparten una sala Nostr firmada](/images/buzz-mobile-coding-agent-es.svg)

> **Si vienes del mundo mobile, este post es la pieza que conecta lo que ya cubrimos.** En [Android CLI: Accelerating Development with AI Agents](/es/blog/android-cli-agentes-herramientas) expliqué cómo Google reescribió su tooling para que un agente pueda dirigir un proyecto Android. En [Android Skills: desarrollo guiado por agentes](/es/blog/android-skills-ia-desarrollo-guiado/) vimos el repositorio de Skills como capa de reglas. Hoy, [Block](https://block.xyz) —la matriz de Square, Cash App y Bitkey— entra desde el otro lado: no te da comandos para invocar agentes, te da el **cuarto donde humanos, agentes, repos y decisiones ya conviven**. Se llama Buzz, vive en [buzz.xyz](https://buzz.xyz), es código abierto en [github.com/block/buzz](https://github.com/block/buzz) y la primera versión pública está fechada 21 de julio de 2026. Este artículo recorre su filosofía, cómo funciona, cómo se instala y por qué, especialmente si trabajas en mobile, te interesa aunque seas un indie dev con un proyecto y un gato.

## El gancho: cuando los bots dejaron de ser asistentes

Llevo meses con la misma sensación que el equipo de Block describe en su post inaugural. Abro [Codex](https://openai.com/codex/) en una pestaña, [Claude Code](https://docs.anthropic.com/en/docs/claude-code) en otra, [goose](https://github.com/block/goose) en una tercera. Cada uno hace su parte con brillantez, y luego llega el momento de **pegar el resultado en Slack** para que un humano lo revise, **copiar el comentario de vuelta al harness**, **mandar el patch al canal de CI**, **abrir un PR en GitHub**, **esperar a que un aprobador humano responda desde su teléfono vía Slack móvil**, y **re-explicar todo otra vez** cuando alguien nuevo llega al proyecto.

> "Models can do the work now. Teams still need somewhere to do it together. The bottleneck moved from intelligence to coordination."
> — [Tyler Longwell, Block Engineering Blog](https://engineering.block.xyz/blog/buzz), 21 jul 2026

Block publicó Buzz para resolver exactamente eso, pero con una decisión de fondo que cambia el juego: **los agentes no son bots a los que invocas, son miembros del workspace con su propia identidad criptográfica, su propio historial y su propia responsabilidad sobre lo que firman**. El canal ya no es donde *contamos* lo que pasó: el canal **es** lo que pasó, porque chat, código, CI, aprobación y merge son el mismo tipo de evento firmado.

Y hay una segunda decisión, igual de pesada: **Buzz no es un cliente de chat que controla a tus agentes desde lejos. Es un par más en la conversación.** El móvil no es un "remote control" del agente; es otro participante con la misma clave criptográfica que tu laptop, hablando directo con el relay, y eso cambia para siempre cómo un indie dev puede trabajar cuando el gato se le sube al teclado a las 11 de la noche.

---

## Filosofía: el cuaderno firmado donde la gente y los bots firman a la par

Antes de instalar nada, conviene entender qué está defendiendo Buzz, porque su postura es fuerte y poco habitual. Estos son los seis principios que articulan el diseño, tal como aparecen en [VISION.md](https://github.com/block/buzz/blob/main/VISION.md), [VISION_AGENT.md](https://github.com/block/buzz/blob/main/VISION_AGENT.md) y los posts del equipo.

### 1 · Una identidad criptográfica por actor, sin excepciones

Cada humano y cada agente tiene un par de claves Schnorr (el mismo esquema que usa Bitcoin y Nostr). La clave privada **nunca abandona el dispositivo que la creó**. Cuando un agente ejecuta un comando, lo firma con **su** clave, no con la tuya. Cuando tú apruebas un merge, lo firmas con la tuya. Cuando el agente se conecta a un canal, su presencia es verificable criptográficamente, no por un token de sesión que un proveedor puede revocar a las tres de la mañana.

La consecuencia operativa es enorme: si la clave de un agente se filtra, **revo cas al agente sin tocar tu identidad humana**. Si tu clave humana se ve comprometida, **revo cas tu identidad** y los agentes que autorizaste caen automáticamente porque la autorización prueba quién la firmó. Esto es lo que el [post de Tom Brow](https://engineering.block.xyz/blog/a-buzz-on-your-phone) llama *"delegation, not impersonation"*.

### 2 · Un único log de eventos firmados, no siete pestañas fingiendo que se hablan

Chat, parche, CI, aprobación, merge, reacción con emoji, comando shell ejecutado por el agente, llamada al LLM — todo es un **evento Nostr firmado**. El log es buscable de forma unificada y la auditoría no requiere correlacionar tres sistemas. Un `grep` semántico sobre seis meses de historia devuelve el hilo donde se discutió el fix que ahora te acaba de explotar en producción, junto con las dos alternativas que se rechazaron y el motivo. Esa es la definición interna de *"honey, I saved the context"*: no pierdes el porqué.

### 3 · Los agentes son miembros del canal, no bots invocados

Esta es la pieza que más me cuesta explicar a otros devs. En Slack, Discord o Telegram, **un bot es una cuenta propiedad de un humano y autorizada por un admin**. En Buzz, **un bot es un par de claves más** que alguien (humano u organización) autorizó con un scope estrecho. No necesita que lo *mencionen* para actuar: tiene membresía del canal. Puede postear, reaccionar, abrir hilos, crear sub-canales, invitar humanos, llamar a otros agentes, ejecutar workflows YAML, mergear código. **La misma superficie que un humano, una firma diferente**.

Tyler Longwell, autor del post técnico principal, lo cuenta así:

> "I often have one frontier agent driving a swarm of cheaper, faster agents. The smart one keeps the big picture in context. The fast ones research, build, test, and review in parallel. They talk through ordinary Buzz mentions, injected into each other's active work almost instantly without breaking anyone's flow."

Es decir: **un agente frontier recluta a agentes baratos para investigación, build, test y review**. Se hablan entre ellos por menciones normales, en el mismo canal donde tú estás leyendo. Tú rediriges el trabajo mientras ocurre, en vez de esperar a tener un resultado perfectamente formateado que ya resulta ser incorrecto.

### 4 · Misma superficie para todos, diferente keypair

Un agente puede leer un repositorio, escribir código, ejecutar tests, firmar commits, hacer push, abrir PRs, comentar reviews y mergear — siempre que la delegación lo permita. **No hay una "versión lite" del workspace para bots**. Esto elimina por completo la fricción de tener APIs distintas para humanos y para máquinas: el código de la UI, las búsquedas y los workflows no distinguen entre quién firma.

### 5 · Portable por diseño: si Block desaparece, tu historia sigue verificándose

Buzz corre sobre el [protocolo Nostr](https://github.com/nostr-protocol/nostr), que es abierto y tiene implementaciones en decenas de lenguajes. El repositorio `block/buzz` está bajo [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0). La consecuencia práctica: **puedes hostear tu propio relay, tu propia instancia, o migrar a otra implementación sin perder identidad, historial ni commits firmados**. Es la misma filosofía que Bitkey aplica al self-custody del Bitcoin: **el host no es dueño de tu nombre ni de tu trabajo**.

### 6 · Los agentes viven donde pueden hacer trabajo, no donde el vendor quiere

Un agente en Buzz puede correr en tu laptop, en una VM en la nube, en un edge box, en un servidor dedicado o, literalmente, *"en una tostadora suficientemente ambiciosa"*. El relay ve metadatos de routing, nunca los payloads del modelo ni los secretos del agente. Y puedes incluso **compartir GPUs entre miembros de la comunidad**: Buzz introduce pares autorizados y el tráfico del modelo viaja cifrado, directo entre pares, sin pasar por el relay.

---

![Arquitectura de Buzz: capas, principios y crates principales del monorepo Rust](/images/buzz-architecture-es.svg)

## Cómo funciona: la anatomía técnica sin humo

Una vez entendida la filosofía, lo técnico se vuelve menos mágico y más *comprensible*. La siguiente es la radiografía del [README y ARCHITECTURE.md](https://github.com/block/buzz/blob/main/ARCHITECTURE.md) del repo.

### El relay es el corazón, y es un crate de Rust

`buzz-relay` es un servidor Axum (Rust) que expone WebSocket + REST. Implementa el subset Nostr relevante para el producto: NIP-01 (filtros y eventos), NIP-42 (autenticación), NIP-34 (eventos Git: parches, anuncios de repo, status), NIP-98 (firmar requests HTTP). Mantiene canales, hilos, DMs, canvases, búsqueda FTS en Postgres y un audit log encadenado por hash. **Un relay, una comunidad** en el setup por defecto; en hospedaje multi-tenant, los datos tenant-visibles se separan por la URL de la comunidad.

### El plano de datos es lo que esperarías, sin sorpresas

Postgres para eventos y FTS, Redis para pub/sub (presencia, typing), S3/MinIO para media vía [Blossom](https://github.com/hoytech/blossom). Nada exótico. Lo interesante es lo que **no** está acoplado a un proveedor: la capa de datos es intercambiable mientras pase la suite de conformidad del proyecto.

### Los crates que de verdad vas a tocar

Si vas a contribuir o auto-hostear, los crates clave son:

- `buzz-core`: tipos zero-I/O, filtros NIP-01, verificación Schnorr. Lo único que no toca red.
- `buzz-relay`: el servidor Axum WS + REST.
- `buzz-db`, `buzz-auth`, `buzz-pubsub`, `buzz-search`, `buzz-audit`: servicios.
- `buzz-cli`: el cliente CLI en JSON-in / JSON-out, **diseñado para ser invocado por un LLM**.
- `buzz-acp`: el adaptador que traduce entre el [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) y MCP. Esto es lo que permite que **Codex, Claude Code y goose** se conecten sin reescribir nada.
- `buzz-agent`: un agente ACP de referencia que puedes usar tal cual o forkear.
- `buzz-workflow`: motor de workflows YAML con triggers por mensaje, reacción, schedule o webhook.
- `buzz-persona`: paquetes de personalidad para tus agentes (cómo hablan, qué tono, qué límites).

### Git sobre object storage: la decisión rara y correcta

La parte más contraintuitiva de la arquitectura es cómo almacenan Git. Los forges tradicionales asumen un filesystem con semántica POSIX (locks, renames atómicos, etc.). Buzz necesita **escalar al ritmo de agentes que pushan commits en paralelo**. Su solución, descrita en detalle por Longwell, es elegante:

> "We specified the storage protocol in TLA+ and model-checked durability, reconstruction, and concurrent pushes. The bounded result depends on three explicit object-store guarantees, so every backend must pass a conformance suite."

En la práctica: **packfiles inmutables identificados por contenido + un manifest pointer mutable**. Un push escribe primero los objetos, luego avanza el puntero con un compare-and-swap condicional. El avance del puntero *es* el commit point; los eventos del workspace lo anuncian, no lo definen. Es Git puesto deliberadamente sobre object storage, con un modelo TLA+ verificando las propiedades. Si te interesan los sistemas distribuidos serios, este es uno de los párrafos más densos del año.

### El pairing de dispositivos es criptografía seria, no un truco de UX

Cuando mueves tu identidad a otro dispositivo —típicamente del laptop al móvil— el protocolo usa un intercambio cifrado sobre Buzz, iniciado con un QR secreto y confirmado con seis dígitos que ambas pantallas muestran. El modelo de seguridad apunta a verificar **secrecy y agreement** y documenta explícitamente los supuestos. Esto importa especialmente en mobile, donde la pérdida del dispositivo es un escenario común.

---

## Instalación: tres caminos según quién eres

El propio README distingue tres audiencias. Voy a respetar esa taxonomía porque está pensada para minimizar tu tiempo hasta el primer commit.

### Camino 1 — Solo quiero probar la app

Descargas un binario empaquetado desde la [página de releases](https://github.com/block/buzz/releases/latest):

| Plataforma | Archivo |
|---|---|
| macOS Apple Silicon | `Buzz_<version>_aarch64.dmg` |
| macOS Intel | `Buzz_<version>_x64.dmg` |
| Linux x86_64 | `Buzz_<version>_amd64.AppImage` o `..._amd64.deb` |
| Windows x64 | `Buzz_<version>_x64-setup_alpha-unsigned.exe` |

Por defecto la app apunta a `ws://localhost:3000`. Si quieres apuntarla a un relay tuyo o de un amigo, exporta `BUZZ_RELAY_URL` antes de lanzar, o cámbialo dentro de la app. **El binario de Windows no está code-signed**, así que SmartScreen mostrará la pantalla de "Windows protected your PC". Click en *More info → Run anyway*.

Si trabajas en Block, no uses nada de esto: descarga el build interno desde [`squareup/buzz-releases`](https://github.com/squareup/buzz-releases/releases/latest), que viene pre-cableado al relay y al agent provider de la empresa.

### Camino 2 — Quiero mi propio relay hospedado (sin pelearme con servidores)

Si lo que quieres es un relay para tu equipo sin administrar infraestructura, **deploy en Railway con un click**:

```bash
# Sigue el botón "Deploy on Railway" del README
# O revisa el post: https://engineering.block.xyz/blog/run-your-own-buzz-relay
```

Esto levanta `buzz-relay` con su Postgres, Redis y S3 compatible, todo dentro de Railway. **Ideal para un equipo pequeño que quiere control de datos sin convertirse en SRE**.

### Camino 3 — Quiero compilar y correr desde código (el camino indie)

El setup es opinionated, pero justificado. Necesitas [Docker](https://www.docker.com/products/docker-desktop/) y [Hermit](https://cashapp.github.io/hermit/) (la herramienta de pinning de toolchains que Block también usa en otros proyectos). Hermit baja Rust 1.88+, Node 24+, pnpm 10+ y `just` automáticamente la primera vez.

```bash
git clone https://github.com/block/buzz.git && cd buzz
. ./bin/activate-hermit   # toolchain pinneada (tools auto-descargados)
just setup && just build  # ~5-15 min la primera vez
```

`just setup` corre `just bootstrap`, que copia `.env.example` a `.env`, descarga las tools vía Hermit, levanta los servicios Docker y aplica migraciones. Tu día a día es:

```bash
. ./bin/activate-hermit
just dev   # arranca relay + desktop app juntos
```

Si prefieres terminales separadas (logs del relay sin ruido del Vite HMR):

```bash
just relay          # terminal 1
just desktop-dev    # terminal 2
```

**Para un relay single-node en un VPS** (no el stack de dev), usa el `docker-compose` de producción en `deploy/compose/` con Postgres, Redis, MinIO y opcionalmente Caddy para TLS. El `docker-compose.yml` raíz es solo para dev local.

Si vas a usar agentes, lo único extra es `BUZZ_PRIVATE_KEY` apuntando al `nsec` del agente y conectas vía `buzz-cli`. El CLI es JSON-in / JSON-out por diseño, así que cualquier LLM con capacidad de invocar herramientas puede usarlo como otra tool más.

### Prerrequisito raro para Windows

El shell del agente corre comandos en `bash`. En macOS y Linux ya está; en Windows necesitas [Git for Windows](https://git-scm.com/download/win), que trae Git Bash. Si prefieres otro bash, exporta `BUZZ_SHELL` con la ruta.

---

## Flujos de uso genéricos: lo que ya puedes hacer hoy

La tabla de capacidades del README es honesta sobre el estado del proyecto (no es marketing), así que la reproduzco y la extiendo con mis notas:

### Works today (funcional y estable)

- **Relay, canales, hilos, DMs, canvases, media, búsqueda, audit log.** El núcleo del producto.
- **Desktop app** (Tauri + React, ~nativo en cada OS).
- **`buzz-cli`** (JSON in / JSON out) **+ harness ACP** que habla con Goose, Codex y Claude Code.
- **Workflows YAML**: triggers por mensaje, reacción, schedule o webhook. Perfectos para "cuando alguien mergea un PR, lanza el deploy de staging".
- **Eventos Git (NIP-34)**: parches, anuncios de repo, status. El forge UI ya permite ver PRs, branches, reviews y actividad.
- **Hosting backend de Git**: el repo vive dentro de Buzz. Inmutable, content-addressed, con compare-and-swap sobre object storage.

### Being wired up (infra existe, glue aún secando)

- **Clientes mobile**: iOS + Android, en Flutter. Los builds ya están en App Store y Google Play como *early access*. Las apps se actualizan cada pocos días según [Tom Brow](https://engineering.block.xyz/blog/a-buzz-on-your-phone).
- **Workflow approval gates**: la infraestructura para approvals está; la UX de "este workflow requiere aprobación humana antes de fase 3" se está puliendo.
- **Eventos de lifecycle de huddles** (llamadas de voz).

### Strong opinions, pending code (filosofía clara, código aún no)

- **Reputación web-of-trust cross-relay.** Cómo saber si una clave es confiable cuando no es de tu comunidad.
- **Push notifications** ya funcionan en la práctica pero el estándar NIP-PL es draft y puede evolucionar.
- **Culture features**: cosas tipo "este agente lleva 6 meses sin fallar reviews, debería tener más permisos".

El propio README tiene una pullita deliciosa sobre esto: *"Please do not plan your compliance program around the 💭 column yet."* Es el tipo de honestidad que me hace confiar en el proyecto.

### Tres historias que el README cuenta como casos de uso

Más allá del catálogo, hay tres flujos que vale la pena imaginar funcionando, porque aterrizan la propuesta:

1. **Incident memory a las 2am.** Escribes *"¿hemos visto este error antes?"* Un agente vigilando el canal jala seis meses de historia y postea los hilos, las root causes, los fixes y ofrece paginar al último que lo rompió. Pregunta, respuesta, evidencia — todo firmado en el mismo canal.
2. **Branch as room.** Abres una feature branch. Aparece un canal. Los parches llegan como eventos NIP-34, CI postea resultados, un agente hace first-pass review, los humanos reaccionan a las partes que les importan, el merge firmado aterriza en el mismo cuarto que la evidencia.
3. **Release que se escribe a sí misma.** Un workflow dispara en un tag. Un agente lee los PRs mergeados de los canales del proyecto, redacta las release notes, las postea para revisión humana, recibe un 👍 y publica. **Cada paso firmado, cada paso buscable**.

---

## Enfoque mobile: por qué Buzz me importa especialmente como dev Android

Aquí es donde este artículo se separa de la cobertura genérica. Hay tres razones por las que Buzz me parece especialmente relevante para quien desarrolla en Android (o iOS).

### Razón 1 · El móvil es un par completo, no un control remoto

La app móvil de Buzz —Flutter, disponible en [App Store](https://apps.apple.com/us/app/buzz-chat-with-your-hive/id6779728271) y [Google Play](https://play.google.com/store/apps/details?id=xyz.block.buzz.mobile)— **reusa la misma clave criptográfica que creaste en el desktop**. No es una sesión remota que se rompe cuando cierras la laptop; es otra instancia del mismo participante firmado.

El [post de Tom Brow](https://engineering.block.xyz/blog/a-buzz-on-your-phone) es claro sobre los tres puntos que sostienen esta promesa:

1. **Pairing por QR + 6 dígitos.** La identidad se transfiere entre dispositivos con un intercambio cifrado. No hay un "login con Google" en medio.
2. **Privacidad verificable en código.** Sin SDKs de analytics al momento de escribir el post. La metadata EXIF / GPS se elimina antes de subir imágenes. Las claves privadas nunca salen del dispositivo. El relay ve solo metadatos de routing. Y como el código está en el mismo repo que el relay, **puedes verificarlo**.
3. **Push con un draft estándar propio, NIP-PL.** El diseño está hecho para que: el relay no vea el device token (lo cual podría correlacionar distintas pubkeys del mismo humano), el push gateway no vea pubkeys ni contenido, y Apple/Google tampoco vean nada útil. Es un protocolo de notificaciones que asume que *todos los intermediarios son adversarios*.

La consecuencia operativa para un indie dev: **puedo salir del laptop, dejar un mensaje para mi agente en el canal "release train", y el agente lo procesa cuando despierto el laptop a las 9am**. Si necesito parar el swarm, mando una cancelación y viaja como evento efímero cifrado. Si necesito mergear desde el metro, lo hago, y el merge es un evento firmado con la misma identidad que mi laptop.

### Razón 2 · Complementa directo lo que ya exploré sobre Android CLI y Skills

En [Android CLI: Accelerating Development with AI Agents](/es/blog/android-cli-agentes-herramientas) cubrí cómo Google reescribió su tooling para que un agente pueda dirigir un proyecto Android desde la terminal. En [Android Skills: desarrollo guiado por agentes](/es/blog/android-skills-ia-desarrollo-guiado/) exploré el repositorio de Skills como capa de reglas estrictas y actualizadas. Buzz se enchufa perfecto a esa historia:

- **El agente** (Codex, Claude Code o goose) habla con `adb`, Gradle y el emulador a través de Android CLI.
- **Las reglas** sobre qué versión de Compose usar, cuándo preferir Kotlin idiomático, cómo evitar legacy XML — viven en Android Skills.
- **El workspace donde todo eso pasa y se registra** es Buzz. La conversación sobre por qué elegiste Compose 1.7 vs 1.8, el patch que rompió la build, el CI run que pasó en verde, el review de un humano, el merge firmado — todo en un mismo log buscable.

Lo que antes era *Android CLI + Slack + GitHub + CI dashboard + paste manual de logs* se vuelve **una sola habitación**. Y desde el móvil puedes abrir un canal *"android-1.8-rollout"*, ver al agente reportando progreso, reaccionar con 👍, y mergear cuando estés en la cola del supermercado.

### Razón 3 · El modelo de autorización escala a equipos distribuidos que hacen mobile

Imagina un estudio indie de tres personas, cada una con su agente Claude Code configurado. O un equipo open-source distribuido en tres zonas horarias con agentes que hacen triage nocturno de issues. O un founder que se va de viaje y deja a sus agentes trabajando con guardrails explícitos.

El modelo de Buzz —clave humana firma delegaciones estrechas, agentes firman su propio trabajo, revocación granular— es **el primer modelo que he visto que toma en serio lo que significa "agente fuera de horario sin perder el control"**. No es un sandbox cloud donde depositas tu código. No es un bot que se loggea con tu usuario. Es un participante más, con permisos auditables y revocables.

### Caso concreto: ciclo de release mobile-first

Para aterrizar todo esto, aquí está el flujo que recomendaría a un indie dev de Android que adopte Buzz mañana:

![Flujo mobile-first en Buzz: desde pairing hasta review firmado desde el móvil](/images/buzz-mobile-flow-es.svg)

1. **Fase 1 — Abrir el canal.** Desde el móvil,creas un canal efímero por feature o bug. Invitas a tu agente (Codex o Claude Code) y a tus colaboradores humanos.
2. **Fase 2 — Plan + delegación.** El agente frontier analiza la tarea, postea un plan en el canal, recluta a uno o dos agentes baratos para subtareas (ej. uno investiga docs, otro corre lint).
3. **Fase 3 — Build + tests en paralelo.** Los agentes postean patches como eventos NIP-34, CI postea resultados. Tú lees el canal como leerías una conversación.
4. **Fase 4 — Review y merge desde el móvil.** Apruebas con un emoji o un tap. El merge es un evento firmado. La historia —el plan, los patches, los tests, tu razón para aprobar— queda en el canal, no en tu cabeza.

Si el día siguiente hay un bug en producción, abres el canal y tienes el contexto completo. **No estás reconstruyendo por qué se hizo algo desde cero**.

---

## Flujos especializados que ya están en producción

Más allá del ciclo genérico, hay cuatro patrones que el equipo de Block documenta como *lo que realmente hacen con Buzz* todos los días:

### 1 · Triage de bugs a las 2am

Un agente vigila canales de issues (también vía webhook externo). Cuando aparece algo nuevo, busca en seis meses de historia, postea los hilos relevantes, sugiere el autor del último fix relacionado y, si tienes un workflow configurado, pagina al on-call. **Tú solo te enteras cuando hay algo genuinamente nuevo**.

### 2 · Branch-as-room

Cada feature branch vive en su propio canal. Los parches llegan como eventos NIP-34, CI postea resultados, un agente hace first-pass review, los humanos reaccionan a las partes específicas que les importan, y el merge firmado cierra el canal con la razón documentada. Es **GitHub Projects + Slack + Linear fusionados en un solo stream firmado**.

### 3 · Release que se escribe a sí misma

Workflow YAML con trigger `on: tag`. Un agente lee los PRs mergeados de los canales del proyecto, redacta release notes, las postea para revisión, espera 👍, publica. **Cada paso firmado y buscable**.

### 4 · Swarm de agentes baratos bajo uno caro

El patrón *"frontier agent drives a swarm of cheaper ones"* es lo que más me emociona. Un Claude Code mantiene el big picture en contexto. Tres Haiku workers hacen investigación, build, test y review en paralelo. Se hablan por menciones normales. Tú rediriges mientras ocurre. **El costo se desploma, la velocidad sube, y el log lo cuenta todo**.

---

## Lo que NO es Buzz (la crítica honesta)

Block es admirablemente transparente sobre el estado del proyecto, pero también vale la pena poner las cartas sobre la mesa desde fuera.

### 1 · Está en 0.x y la suite mobile es temprana

El README mismo marca **mobile clients como "being wired up"**. Push notifications ya funcionan vía NIP-PL pero el estándar es draft. El sitio de noticias [TechTimes](https://www.techtimes.com/articles/321242/20260722/block-launches-buzz-open-source-workspace-where-ai-agents-sign-their-own-work.htm) lo resume bien: *"Buzz is still early. Block's own project notes are candid about what works today versus what's still being wired up."* Si tu flujo depende de notificaciones push estables, **puede que tengas que vivir con pequeñas demoras**.

### 2 · El self-hosting tiene costo de setup real

El setup no es trivial si vienes de *"descargar y dar click"*. Necesitas Docker, Hermit, decidir entre dev compose o production compose, configurar Postgres + Redis + S3, entender la suite de conformidad de object storage. Para un indie dev que quiere algo funcionando en 10 minutos, [el deploy de Railway](https://railway.com/deploy/buzz-relay-block) es el camino sensato. Para un VPS dedicado, espera invertir una tarde.

### 3 · Los agentes corren fuera de sandbox, con `--dangerously-skip-permissions`

Esto es **deliberado** y está bien documentado por [Tom Brow](https://engineering.block.xyz/blog/a-buzz-on-your-phone): los agentes heredan los `.mds`, skills y credenciales del host, lo cual es lo que los hace útiles sin configuración. Pero significa que **toda la seguridad descansa en restringir quién puede darle instrucciones al agente**. Si tu modelo de amenaza es "alguien se infiltra en mi relay y convence a mi agente de hacer algo destructivo", necesitas entender que **el relay nunca debería poder hacer eso**: el agente verifica firmas, no direcciones. Pero si filtras tu clave humana, todo cae. La conclusión operativa es clara: **la clave humana es tu root key, trátala como tal**.

### 4 · El modelo Nostr asume familiaridad con cripto

Si nunca has tocado Bitcoin, Schnorr o Nostr, la curva de entrada es real. *"¿Qué es npub? ¿Qué es nsec? ¿Por qué hay un QR para pairing?"* Suena a magia hasta que lees 20 minutos de docs. **No es culpa de Buzz** —es la naturaleza del modelo de identidad elegido— pero merece estar en tu lista mental antes de adoptarlo.

### 5 · El ecosistema de integraciones es todavía pequeño

Si vienes de Slack con sus 5000+ apps, el catálogo de Buzz es modesto. Tienes Git nativo, workflows YAML, webhooks, y el ACP para conectar harnesses. Pero no esperes un "Notion plugin" o un "Linear bridge" oficial todavía. **El terreno es fértil para contribuidores**, lo cual es excitante si te gusta construir herramientas.

### 6 · Es un proyecto de Block, con todo lo que eso implica

Block es una empresa seria con financiamiento, equipo y un roadmap claro. Pero la promesa de *"if Block disappears, your identity and signed history still verify"* es real solo si la comunidad recoge el testigo. **Mira el repo, mira el AGENTS.md, mira las CONTRIBUTING y GOVERNANCE**. Si te importa la promesa, la única forma de sostenerla es contribuir.

---

## Errores comunes que vas a cometer si no lees esto

1. **Comprometer la clave humana por andar pasándola entre dispositivos.** El pairing por QR + 6 dígitos existe precisamente para evitar esto. Si copias la `nsec` a mano a un portapapeles, **has roto el modelo**. Usa siempre el flujo oficial.
2. **Asumir que el relay es la fuente de verdad.** No lo es. El relay enruta. La verdad es la cadena de eventos firmados. Si hosteas tu propio relay, asegúrate de tener un backup del object store y un export periódico del log a un formato verificable offline.
3. **Dar permisos demasiado amplios al agente en la primera delegación.** Empieza con scope estrecho (ej. "solo puede postear en `#drafts`, no en `#releases`") y ve abriendo. La revocación granular existe precisamente porque se espera que la calibres.
4. **Olvidar que `buzz-cli` es solo el cliente.** El LLM que invoca `buzz-cli` no vive dentro de Buzz. Tú decides qué modelo corre, qué system prompt tiene, qué skills carga. Buzz es el substrate, no el agente.
5. **Pensar que el push NIP-PL es solo tema del móvil.** Si despliegas tu propio relay, vas a querer configurar el push gateway correctamente, sino las notificaciones se filtran a Apple/Google y rompes la promesa de no-correlación. Lee el NIP-PL con calma.
6. **Subestimar el costo emocional de salir de Slack.** Buzz no tiene emojis animados, no tiene hilos de 50 respuestas con memes, no tiene Huddles pulidos como Slack. **El ROI está en la productividad y la auditabilidad, no en el deleite**. Si tu equipo necesita Slack como chat social, déjenlo para eso y usen Buzz para el trabajo que importa.

---

## Cómo empezar HOY si haces mobile

Si llegaste hasta aquí y quieres probarlo sin comerte todo el whitepaper, este es el camino mínimo:

### Para evaluar en 30 minutos

```bash
# 1. Descarga la app desktop desde la página de releases
# 2. Lanza el relay de Railway con un click (gratis en tier básico)
# 3. Apunta BUZZ_RELAY_URL a tu instancia
# 4. Crea tu identidad y escanea el QR con tu móvil
# 5. Invita a tu agente favorito vía buzz-cli + ACP
```

### Para adoptar en serio en un proyecto Android

```bash
# 1. Clona el repo y haz tu propio deploy en un VPS pequeño
git clone https://github.com/block/buzz.git && cd buzz
. ./bin/activate-hermit
just setup && just build
# 2. Configura un workflow YAML que dispare tu CI al mergear
# 3. Conecta Codex o Claude Code vía buzz-acp con scope restringido
# 4. Haz que tu agente cargue las Android Skills como context adicional
# 5. Empieza con un solo feature branch como canal. Mide cuánto contexto
#    sobrevive a una semana.
```

### Para contribuir (que es la forma de que la promesa se cumpla)

- Lee [CONTRIBUTING.md](https://github.com/block/buzz/blob/main/CONTRIBUTING.md) y [GOVERNANCE.md](https://github.com/block/buzz/blob/main/GOVERNANCE.md).
- Mira las [issues abiertas con label `good first issue`](https://github.com/block/buzz/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).
- El AGENTS.md del repo es una lectura recomendada aunque no vayas a contribuir — explica la arquitectura interna con más detalle del que cabe aquí.

---

## Bibliografía y referencias

### Fuentes primarias

- [Introducing Buzz: where humans and agents work together](https://block.xyz/inside/introducing-buzz-where-humans-and-agents-work-together) — Post oficial de lanzamiento, 21 jul 2026.
- [Buzz! 🐝 — Block Engineering Blog](https://engineering.block.xyz/blog/buzz) — El post técnico de Tyler Longwell que articula la filosofía.
- [A Buzz on your phone](https://engineering.block.xyz/blog/a-buzz-on-your-phone) — El post de Tom Brow sobre los principios y la implementación móvil.
- [Run your own Buzz relay](https://engineering.block.xyz/blog/run-your-own-buzz-relay) — Guía de self-hosting.
- [github.com/block/buzz](https://github.com/block/buzz) — El repo. `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `VISION*.md` son obligatorios.
- [Buzz Support](https://block.github.io/buzz/support.html) — Política de seguridad y reporte.

### Protocolos y estándares

- [Nostr Protocol](https://github.com/nostr-protocol/nostr) — El protocolo base sobre el que vive Buzz.
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) — Eventos y filtros.
- [NIP-34](https://github.com/nostr-protocol/nips/blob/master/34.md) — Eventos Git (patches, repo announcements, status).
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) — Autenticación de relays.
- [NIP-PL](https://github.com/block/buzz/blob/6300a6b1d03e32c473c7b6568df663c8927565cf/docs/nips/NIP-PL.md) — Draft de push con privacidad split-routed.
- [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) — El protocolo que permite a Codex, Claude Code y goose hablar con Buzz.

### Cobertura externa útil

- [Block/Buzz Collaborative Workspace: How Signed Agent... — YouTube](https://www.youtube.com/watch?v=8avfUUZ8ClU) — Análisis independiente en video, cubre fricciones reales de despliegue (Helm, CLI panics, frame limits).
- [Techstrong: Block Open-Sources Buzz](https://techstrong.ai/features/block-open-sources-buzz-giving-ai-agents-their-own-identity-inside-the-workspace/) — Buen resumen del estado del proyecto.
- [Decrypt: Jack Dorsey's Block Launches Buzz](https://decrypt.co/374026/jack-dorseys-block-launches-buzz-a-nostr-based-slack-and-github-rival-for-ai-agents) — Contexto del lanzamiento.
- [TechTimes: Block Launches Buzz](https://www.techtimes.com/articles/321242/20260722/block-launches-buzz-open-source-workspace-where-ai-agents-sign-their-own-work.htm) — Cobertura con sano escepticismo sobre el estado real.
- [explainx.ai: Block Buzz Nostr Agent Workspace](https://explainx.ai/blog/block-buzz-nostr-agent-workspace-humans-agents-july-2026) — Análisis de la propuesta de valor.
- [xCloud: What is Buzz Workspace?](https://xcloud.host/what-is-buzz-workspace-features-and-use-cases/) — Guía 2026.
- [4Geeks: What Is Buzz?](https://4geeks.com/en/blog/ai-powered-learning/what-is-buzz-jack-dorsey-slack-alternative) — Buena explicación de buzz-acp.
- [Remote OpenClaw: How to Self-Host Buzz on a VPS](https://www.remoteopenclaw.com/blog/how-to-self-host-buzz-vps) — Setup en VPS.

### Prior art en este blog (lectura recomendada)

- [Android CLI: Accelerating Development with AI Agents](/es/blog/android-cli-agentes-herramientas) — La capa de comandos que un agente usa para construir tu app Android. Complemento directo de este artículo.
- [Android Skills: desarrollo guiado por agentes](/es/blog/android-skills-ia-desarrollo-guiado/) — El repositorio de reglas que mantiene al agente en el camino recto.
- [Android: skills IA para desarrollo guiado](/blog/android-skills-ia-desarrollo-guiado) — Versión EN.
- [Persistent memory stack implementation](/blog/persistent-memory-stack-implementation) — Cómo los agentes recuerdan entre sesiones. Complemento natural al log firmado de Buzz.
- [Hipocampus: memoria jerárquica para agentes](/es/blog/hipocampus-memoria-jerarquica-agentes) — Patrón de memoria que Buzz no reemplaza pero sí contextualiza.
- [OpenCode Subagents: workflows móviles](/es/blog/opencode-subagents-workflows) — Cómo orquestar agentes cheap + frontier, patrón que Buzz hace nativo en el workspace.
- [Socratic agents part 3 — multi-agent orchestrator](/es/blog/socratic-agents-part-3-multi-agent-orchestrator) — Diseño de orquestación que casa con el modelo de Buzz.

### Herramientas

- [goose (Block)](https://github.com/block/goose) — El agent framework open source de Block que se integra nativamente vía ACP.
- [Android CLI](https://developer.android.com/blog/posts/android-cli-build-android-apps-3x-faster-using-any-agent) — El set de comandos de Google que un agente usa para tu proyecto Android.
- [Android Skills](https://developer.android.com/tools/agents/android-skills) — Reglas agent-optimized para Android.
- [Hermit](https://cashapp.github.io/hermit/) — Toolchain pinner.
- [TLA+](https://lamport.azurewebsites.net/tla/tla.html) — El lenguaje de especificación formal que usaron para model-checkear el storage de Git.

---

## Cierre: una nota personal

Llevo dos años usando agentes de IA a diario, y la mayor parte del tiempo me he sentido como el *"middleware"* que el equipo de Block describe en su post: copiando contexto entre ventanas, pegando logs entre herramientas, perdiendo el porqué de las decisiones cuando el proyecto crecía. Buzz no resuelve eso solo —hay que configurar bien a los agentes, escribir buenos workflows, mantener disciplina sobre qué canales creas— pero **el substrate que ofrece es, por primera vez, el substrate correcto**. Identidad firmada, log único, agentes como pares, mobile como ciudadano de primera, open source verificable.

Lo que más me gusta es que **Block publicó no solo el código, sino los modelos formales, los protocolos y los design docs**. *"It's 2026: software got cheap. Taste didn't."* La frase del post de Longwell me parece la mejor descripción del momento que vive el desarrollo de software. Las herramientas ya no son la ventaja; las decisiones arquitectónicas sí.

Si haces mobile, pruébalo. Si te importa que la infraestructura de agentes no quede en manos de tres proveedores, contribuye. Y si simplemente quieres ver a dónde va esto, quédate leyendo el repo — el AGENTS.md solo ya vale la semana.

🐝 **Hive a good one.**
