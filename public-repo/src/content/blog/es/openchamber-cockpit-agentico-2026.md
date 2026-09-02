---
title: "OpenChamber: el cockpit agéntico que supervisa - OpenCode"
description: "OpenChamber en profundidad: las 6 funciones de la v0.7 (Session Goals, Multi-run con Fusion, Changes Walkthrough, Preview, issue-a-PR, cron), la arquitectura de supervision alrededor del SDK de OpenCode, y el contexto de Bohdan Triapitsyn construyendo el cockpit ausentes del ecosistema."
pubDate: 2026-08-16
lastmod: 2026-08-16
author: ArceApps
keywords:
  - "OpenChamber"
  - "OpenCode"
  - "agentic dev"
  - "Session Goals"
  - "Multi-run"
  - "Fusion"
  - "indie dev"
canonical: "https://arceapps.com/es/blog/openchamber-cockpit-agentico-2026/"
heroImage: "/images/openchamber-cockpit-agentico-2026-es.svg"
tags: ["OpenChamber", "OpenCode", "Agentic Dev", "Session Goals", "Multi-run", "Fusion", "Indie Dev"]
category: ai-agents
reference_id: "ec47df9a-f9fe-4c46-bf3f-1c056109ccdc"
---

> **Lecturas relacionadas en el blog:** [La comparativa operativa con Paseo, CodeNomad y opencode-mobile](/es/blog/openchamber-paseo-comparativa-2026/) (14-ago-2026) · [Paseo en profundidad: el orchestrator multi-provider](/es/blog/paseo-orchestrator-multi-provider-2026/) (15-ago-2026) · [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) · [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) · [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/)

![Hero · OpenChamber: el cockpit agéntico que supervisa - OpenCode](/images/openchamber-cockpit-agentico-2026-es.svg)

## Por qué OpenChamber merece un artículo propio

El 14 de agosto, en la comparativa que escribí con Paseo, CodeNomad y opencode-mobile, presenté a OpenChamber como el "cockpit para el 90% de los casos". Era la pieza más completa del set: maduro, mantenido por un equipo, con features que ningún frontend de OpenCode había intentado. Pero la comparativa fue, por diseño, una pieza de 30 segundos por producto. OpenChamber necesitaba más.

El 15 de agosto, el artículo de Paseo en este blog cubrió la categoría *agent orchestrator*. Hoy, en este artículo, voy a cubrir la categoría complementaria: **agent supervision environment**. OpenChamber no compite con Paseo en multi-provider; compite en *cuidar una sesión larga, mantener al agente en pista, y darte visibilidad total sobre lo que está haciendo*. Las dos categorías son respuestas a dos problemas distintos. OpenChamber es la respuesta al problema de "no quiero perder el control del agente aunque lo deje trabajando".

Y resulta que esta segunda categoría importa mucho más de lo que parecía a primera vista. La razón es un cambio de paradigma que OpenChamber lideró y que el resto del ecosistema está copiando: **los agentes ya no son tools que se usan; son procesos que se supervisan**. La sesión termina cuando cumple un objetivo, no cuando se acaban los tokens. El PR se mergea desde la UI del agente, no en una pestaña aparte. El diff se revisa como un tour guiado, no como un bloque de texto pegado. OpenChamber puso nombre a este cambio con una decisión de producto: la v0.7 introdujo seis funciones en un solo release que antes vivían repartidas en herramientas distintas.

Este artículo es el deep dive en OpenChamber. Vamos a recorrer cada una de esas seis funciones, la arquitectura que las hace posible, y los compromisos (técnicos y éticos) que el equipo asumió para construirlas. Si vienes del post de la comparativa, el contexto te va a sonar; si no, este se sostiene solo.

## Lo que OpenChamber es (y no es) en una frase

OpenChamber es **un entorno de desarrollo agéntico open source** que envuelve el SDK de OpenCode con una capa de supervision: sesiones persistentes, objetivos verificables, multi-model runs, walkthroughs guiados, workflows de GitHub, scheduling, y continuidad entre dispositivos. La frase es larga a propósito, porque cada uno de esos siete elementos es una decisión de producto distinta que por sí sola justificaría un proyecto. OpenChamber las junta en uno.

Lo que **no es**: un coding agent alternativo. No compite con OpenCode. OpenChamber no genera código por sí mismo: usa el SDK de OpenCode para hacerlo, añade la capa de UI y orquestación encima. Es la **capa de orchestration que Anomaly (el equipo de OpenCode) no construyó**. Esa decisión es deliberada: el foco de Anomaly es el motor, los 75 proveedores, el SDK. OpenChamber es la capa de producto que vive afuera y habla con el motor por el SDK.

El resultado es una relación simbiótica: OpenCode provee el *qué hace el código*, OpenChamber provee el *cómo lo uso yo*. Cuando el SDK de OpenCode añade un proveedor, OpenChamber lo hereda automáticamente. Cuando OpenChamber descubre un patrón de uso que el SDK no soporta, lo pide como feature en el repo de OpenCode. Es la estructura de **fork-extended** que todo SDK maduro termina teniendo.

## Las seis funciones de la v0.7 que cambiaron el producto

El 9 de agosto de 2026, una review en español de [elsolitario.org](https://elsolitario.org/2026/08/09/openchamber-entorno-agentico-desarrollo-ia/) titulada *"OpenChamber: el entorno agéntico open source para IA"* destiló la propuesta de valor de la v0.7 en una frase que merece copiar entera:

> *"OpenChamber sumó, en una sola versión, seis funciones que antes vivían repartidas en varias herramientas distintas: Session Goals, Multi-run and Fusion, Changes Walkthrough, Preview, flujo de issue a pull request y trabajo programado con cron."*

Esa es la lista canónica. Vamos a entrar en cada una.

![Infografía · Session Goals: el loop verificable de 4 pasos](/images/openchamber-session-goals-es.svg)

### 1. Session Goals — el agente termina cuando cumple, no cuando se acaban los tokens

La propuesta central de OpenChamber está en la primera línea de su landing: *"Set a finish line. The agent keeps working toward it, turn after turn — even with the app closed."*. Eso es Session Goals.

El modelo mental que rompe es el del TUI tradicional: abres sesión, mandas prompt, recibes respuesta, decides tú si el agente terminó. Con TUI, **tú eres el checker**. Si no lees cada respuesta, el agente se queda esperando aunque haya cumplido. Si lees cada respuesta pero no sabes qué esperar, el agente termina con un "ya está" que no verifica nada.

Session Goals invierte el modelo. Le dices al agente algo como:

> *"Refactoriza el módulo de auth, ejecuta los tests, no pares hasta que los tests pasen o se demuestre que no se pueden hacer pasar."*

OpenChamber **chequea el resultado después de cada turno** y mantiene al agente trabajando hasta que el objetivo se cumple, se bloquea con un motivo explícito, o alcanza el límite de turnos que tú fijaste. El "chequeo" es configurable: puede ser tests que pasen, un endpoint que responda, un archivo que exista, una condición arbitraria que tu prompt defina. Lo que el agente no puede hacer es *declarar victoria* sin que la condición se verifique.

Lo probé con un refactor de 800 líneas (migrar de SQLite a Postgres en un proyecto pequeño). Lo lancé con un Session Goal explícito, cerré la sesión, volví 23 minutos después. La migración estaba hecha, los tests pasaban, no había ningún mensaje de error en el log. Cuando lo lancé sin Session Goal, el agente se quedó esperando mi confirmación después de cada archivo migrado. La diferencia es la que separa una sesión de cinco minutos de una sesión de media hora productiva.

La trampa es que funciona mejor con objetivos verificables. Si el objetivo es *"mejora la performance"*, el agente puede iterar cuarenta minutos en un callejón sin salida sin alcanzar verificablemente nada. El slider de "límite de turnos" existe, pero la disciplina está en escribir buenos Session Goals.

### 2. Multi-run con Fusion — comparar y combinar, no elegir a ciegas

La segunda killer feature. OpenChamber permite correr la misma tarea en **hasta cinco modelos en paralelo**, cada uno en su sesión y opcionalmente en su propio worktree. El flujo es:

1. Escribes un prompt.
2. Seleccionas hasta cinco modelos (cualquier combinación que tengas configurada en OpenCode).
3. OpenChamber lanza cinco sesiones en paralelo, cada una en su worktree.
4. Ves los diffs lado a lado, comparas resultados.
5. Eliges el mejor, o usas **Fusion** para combinar las partes más fuertes de varios resultados en una nueva sesión.

Lo que esto resuelve es un problema que la mayoría del ecosistema ignora: **trabajar con un solo modelo es trabajar con un solo set de sesgos**. Claude puede resolver una tarea de una forma que GPT-5.5 no consideraría, y viceversa. Si tu flujo es "abro sesión, mando prompt, recibo respuesta", estás aceptando la primera respuesta sin punto de comparación. Multi-run te da cinco puntos de comparación por el coste de cinco presupuestos.

Fusion, además, **no es voting majoritario**. Es una sesión nueva que arranca con los patches más fuertes de los cinco runs como contexto. El maintainer de OpenChamber lo describe como *"keep the best result, or fuse the strongest parts"*. La pieza clave es que la fusión es una sesión más, no una operación automática: tú lees los diffs, identificas qué partes vale la pena mezclar, y disparas la fusión con tu criterio.

Lo probé una vez con un sistema de notificaciones push que necesitaba OAuth2 + retry exponencial + idempotency keys. Cuatro modelos, cuatro implementaciones distintas. La solución de GPT-5.5 tenía la abstracción de retry más limpia; la de Claude manejaba mejor los edge cases de idempotencia. Fusion assembló las dos en una sesión que voté como "el resultado bueno". Ese día entendí que Multi-run no es un benchmark: es una herramienta de producción.

El coste real es el de los tokens. Cinco modelos en paralelo son cinco presupuestos. No vale la pena para tareas triviales. Pero cuando el coste de equivocarte es alto (decisiones de arquitectura, lógica de negocio crítica, código que toca dinero), la inversión se amortiza en una iteración.

### 3. Changes Walkthrough — diff legible, no diff en bruto

Cuando un agente termina un cambio grande, el diff resultante es ilegible. Si el agente tocó veinte archivos, tienes veinte diffs concatenados, posiblemente miles de líneas, y la única forma de entender qué pasó es leerlas todas. Es la versión humana de "git log --patch" sin agrupación.

Changes Walkthrough reorganiza el resultado en **una visita guiada por el cambio**. Agrupa ediciones relacionadas en pasos, los pone en el orden en que el cambio tiene sentido, y explica cómo encajan las piezas. El ejemplo canónico es un PR que toca tres archivos: el Walkthrough no dice "PR con 3 archivos y 240 líneas de diff"; dice "primero añadimos el tipo `Result<T, E>` en models.ts, luego actualizamos cinco call sites en handlers/, finalmente ajustamos los tests". Para agentes que tocan veinte archivos, esto es la diferencia entre leer seis párrafos y saltar solo a las partes que te interesan.

El detalle técnico que merece saber: el Walkthrough **no es una feature de UI, es un modelo de datos**. Internamente, OpenChamber pide al agente que planifique el cambio antes de empezar, y luego estructura el diff resultante en pasos narrativos. Es como si el agente escribiera su propio commit message estructurado. La UI lo presenta bonito, pero la inteligencia está en cómo el agente narra lo que hizo.

### 4. Preview — el contexto visual del elemento que está mal

Una pieza pequeña pero matadora. Cuando el agente está iterando sobre una UI y tú ves *"esa cosa ahí no se ve bien"*, el flujo tradicional es: copiar el HTML, pegarlo en el prompt, describir el problema, esperar a que el agente entienda. **Preview** invierte esto.

Abres la app corriendo en Preview, señalas un elemento, y OpenChamber le manda al agente **el screenshot del elemento, sus estilos CSS, su posición en el viewport, y los errores de consola asociados**. Todo el contexto que normalmente tú tendrías que copiar a mano, la app lo extrae y lo adjunta al prompt.

Lo que cambió mi flujo fue cuando estaba ajustando un componente de tabs y el agente había puesto el padding equivocado. En lugar de *"el padding del tab activo es 16px, debería ser 12px"* le mandé el screenshot del componente y *"este padding está mal, ajústalo"*. El agente leyó el screenshot, hizo el cambio, y la próxima iteración ya estuvo bien. Es el tipo de feature que parece menor y resulta ser el atajo más usado del workflow.

### 5. Issue a pull request — GitHub workflows dentro de la app

Esta es la integración de las integraciones. OpenChamber permite:

- Crear una sesión desde un issue de GitHub con el contexto (título, descripción, comentarios, labels) atado.
- Mandar checks fallidos de vuelta al agente para que itere sin salir de la app.
- Mandar comentarios de review al agente, que arregla y sube.
- Mergear el PR desde OpenChamber.

El flujo se parece al de Cursor Composer o a la extensión de GitHub Copilot Workspace, pero open source y conectado con tu OpenCode. Lo que se siente en uso: **no cambias de tab para responder a un review**. Es la diferencia entre un IDE donde integras Git en una pestaña y un IDE donde Git es la primera clase.

La pieza que más me sorprendió: cuando un check de CI falla, OpenChamber te lo trae como un mensaje más en la sesión, no como un evento externo. El agente lo lee, lo agrega al contexto, e itera. No hay "esperando que el CI termine", hay "la sesión continúa".

### 6. Trabajo programado con cron — el agente que ejecuta, tú recibes el resultado

Esta es la killer feature para equipos. OpenChamber permite correr un prompt en un schedule diario, semanal, o en una expresión cron. Lo que lo separa de un cron clásico es que el prompt **puede incluir un Session Goal**: el agente trabaja hasta cumplir el objetivo, no hasta consumir tokens.

El ejemplo práctico que tengo en mi propio setup: cada mañana, OpenChamber dispara una sesión con el goal *"revisar las issues abiertas en mi repo, etiquetar las que necesitan triage, asignar áreas, no me molestes hasta que estén todas etiquetadas o hayas encontrado tres que requieren decisión humana"*. Vuelvo del café con el resultado en la bandeja. Es el patrón "agent on autopilot" pero con la disciplina de que el agente se autogestiona hasta un límite verificable.

Combinado con el flujo de GitHub, los prompts programados pueden ser cosas como *"cada lunes, recorre los PRs abiertos que llevan más de 7 días sin review, manda un ping al autor con resumen del estado"*. Es la pieza que completa el cuadro de "agentic IDE" — no solo trabajar con agentes en sesiones, sino orquestar agentes en background.

## La arquitectura: cinco superfícies alrededor del SDK de OpenCode

El repositorio es un monorepo con cinco paquetes:

```
packages/
  openchamber/   ← CLI + daemon (Node.js 22+)
  ui/            ← Frontend web (React + Vite)
  vscode/        ← Extensión para Visual Studio Code
  desktop/       ← Electron app basada en la UI web
  docs/          ← Documentación (Fumadocs)
```

Lo que más llama la atención al abrir el repo: **la app de escritorio no asume que tienes el CLI de OpenCode instalado**. La decisión de empaquetar OpenCode dentro del binario de OpenChamber es pragmática: ahorra una tarde entera de pelea con permisos y `$OPENCODE_HOME`. Las versiones web (PWA) y la extensión de VS Code sí asumen `opencode` en tu `PATH`, pero esas dos asunciones son de power users que ya tienen el CLI.

Desde la CLI, el flujo es:

```bash
# arrancar el daemon en localhost
openchamber --ui-password be-creative-here

# emparejar un dispositivo
openchamber connect-url --qr

# exponer al exterior con túnel (Cloudflare)
openchamber tunnel start --provider cloudflare --mode quick --qr

# arrancar con el sistema
openchamber startup enable

# monitorizar / reiniciar / actualizar
openchamber status
openchamber logs
openchamber stop
openchamber update
```

El parámetro `--ui-password` es importante: aunque el daemon se ata a `localhost` por defecto (la opción `--lan` lo expone a la LAN, ojo), la UI web pide contraseña para evitar que cualquier dispositivo en la misma red local tenga acceso. Es la disciplina de "secure by default" que deberías exigir a cualquier herramienta de este tipo.

### Private Relay, Cloudflare Tunnel, LAN, VPN, SSH — los cinco caminos de acceso remoto

Si quieres supervisar el agente desde el móvil o desde otro PC, OpenChamber expone cinco caminos, en orden de fricción:

1. **LAN** — `openchamber --lan` abre el puerto en la red local. Bueno para una tarde, no para producción.
2. **Tailscale / VPN** — si tienes una red mesh, conectas por ahí. Es la opción correcta para un Mini PC en casa.
3. **SSH tunnel** — si tienes SSH al servidor, es el camino clásico. Funciona en todos los mundos.
4. **Cloudflare Tunnel** — `openchamber tunnel start --provider cloudflare --mode quick --qr` levanta un tunnel efímero con un QR de emparejamiento. Lo bueno: no abres puertos. Lo malo: depende de Cloudflare.
5. **Private Relay** — la opción estrella. Emparejamiento por QR de un solo uso, conexión directa punto-a-punto con encriptación E2E, sin servidor público. Es la que usa el equipo de OpenChamber cuando enseña demos. Si vas a usar OpenChamber en serio, configura Private Relay.

La decisión de tener cinco caminos es intencional. No quieren forzar al usuario a configurar Tailscale o Cloudflare; cada quien puede usar el camino que ya tiene en su stack. Es la misma filosofía que el resto de la v0.7: *no imponemos la herramienta, dejamos que la escojas*.

### La extensión de VS Code: el detalle que los nuevos no ven

[OpenChamber extension en Marketplace](https://marketplace.visualstudio.com/items?itemName=FedaykinDev.openchamber) tiene **19,097 installs** a la fecha, según el marketplace. Es una extensión oficial, mantenida por el publisher `FedaykinDev` (que es el handle de Bohdan Triapitsyn, mantenedor de OpenChamber). Lo que ofrece:

- Panel lateral con la sesión activa de OpenChamber.
- "Send Selection to Agent" — manda el código que tienes seleccionado al prompt.
- Apertura de archivos del resultado en el editor nativo.
- Soporte para Agent Manager: correr varios modelos en paralelo desde el prompt de VS Code.

La pieza que más uso: mandar selección al agente. Selecciono una función, escribo *"explica qué hace esto y sugiere tres mejoras de performance"*, y el agente responde con contexto preciso. Es el atajo para code review informal que no requiere salir de la pestaña en la que estoy trabajando.

## Lo que dicen los early adopters

Del hilo de [elsolitario.org](https://elsolitario.org/2026/08/09/openchamber-entorno-agentico-desarrollo-ia/) rescato una cita de Harsha Kotcherlakota (`hkay-dev`) que captura la percepción de quien llegó temprano:

> *"I saw OpenChamber back when it was a small project, I think maybe a couple months ago, and now it is unrecognizable."*

Y otra, aún más reveladora, sobre el stack completo:

> *"Opencode + OhMyOpencode + Openchamber. VSCode looks like legacy notepad++ now."*

La cita de "legacy notepad++" es la que más me gusta porque es la que cuenta la historia del estado mental del usuario. No es que VS Code sea malo; es que cuando tienes un agente que supervisa sesiones, fusiona resultados y te deja mergear PRs desde la misma UI, **volver a la pestaña de VS Code sin OpenChamber se siente como volver a una herramienta del 2015**. Es lo que pasó en su día con la llegada de syntax highlighting, luego con IntelliSense, luego con Git integrado. Cada salto de categoría redefine lo que esperas de la herramienta.

Y otra cita del mismo artículo, sobre el enfoque de OpenChamber:

> *"OpenChamber no compite por ser el mejor agente; compite por ser la mejor capa de orquestación alrededor de agentes ya existentes: correr varios en paralelo, ordenarlos por resultado y mantenerlos vivos entre sesiones."*

Esa frase resume la tesis del producto. Es la frase que el equipo debería poner en el README. Si la buscas en el repo, no la encuentras tal cual, pero el comportamiento la refleja en cada decisión de diseño.

## El equipo: Bohdan Triapitsyn y la velocidad de iteración

El maintainer principal es [Bohdan Triapitsyn](https://github.com/fedaykindev), bajo el publisher `FedaykinDev` en VS Code Marketplace. El equipo es pequeño (no es un solo developer, pero es un grupo reducido), y la velocidad de iteración es notable: el repo publica releases menores cada pocas semanas, y la v0.7 fue un salto de calidad concentrado en un solo release.

Lo que el maintainer hace bien, y pocos equipos open source replican, es:

- **Decisiones documentadas en el código**. La arquitectura está explicada en el README, los trade-offs están en los issues, los planes están en el roadmap público (openchamber.dev/roadmap).
- **Features con un propósito, no por FOMO**. Cada función de la v0.7 resuelve un problema específico. No hay features añadidas "porque los competidores la tienen".
- **Honestidad sobre los límites**. La extensión de VS Code no es perfecta; la app móvil no tiene todas las features de la desktop; el voice no está implementado. El equipo no promete lo que no tiene.

La consecuencia: la *signal-to-noise ratio* del repo es alta. Cada issue abierto tiene substance, cada PR resuelto tiene un commit message descriptivo, cada release tiene notas claras. Es el tipo de proyecto que puedes observar durante seis meses y entender hacia dónde va sin necesidad de preguntar.

## Casos de uso reales: para quién es OpenChamber

Paseo es para quien necesita multi-provider. OpenChamber es para quien necesita **una sesión supervisada de calidad**. Eso se traduce en tres perfiles que más lo aprovechan:

### El indie dev con proyectos largos

Si tu día es sentarte al escritorio, abrir sesión, quedarte cuatro horas, OpenChamber es tu herramienta. Session Goals te deja lanzar una tarea larga de fondo. Multi-run te da cinco opiniones sobre el cambio importante. Changes Walkthrough te ayuda a entender el diff cuando vuelves. Scheduled tasks te ejecutan el "qué hay pendiente" del lunes. Es el cockpit del proyecto que dura meses.

### El equipo pequeño que comparte supervision

Si sois dos o tres personas, OpenChamber tiene la mejor vista de equipo del ecosistema: sidebar con todas las sesiones, status (working / waiting / finished / failed), approvals, scheduled tasks, token use, costos. La pieza de "issue a PR" se vuelve especialmente potente cuando un team member crea la sesión, otro la aprueba, y un tercero la mergea. Es el patrón de revisión distribuida que antes requería tres herramientas.

### El dev técnico que quiere sovereignty

Si usar Cursor o Windsurf te incomoda por la dependencia del SaaS, OpenChamber es la respuesta open source. La decisión de no tener telemetría, que el código no se mande a ningún servidor externo, y que la licencia MIT permita forkear con confianza, son las piezas que hacen clic para quien valora la soberanía sobre sus herramientas. Es la misma atracción que tiene el OpenCode TUI pero con la experiencia de UI añadida.

## Lo que OpenChamber no resuelve (las críticas honestas)

No quiero terminar este artículo como un panfleto. OpenChamber tiene problemas. Los enumero:

- **La versión web asume `opencode` en PATH**. Si tu servidor casero no tiene OpenCode CLI, la PWA no arranca. La app de escritorio (que lo trae empaquetado) sí funciona, pero ese primer momento de "instalé la web y no hace nada" es real.
- **Session Goals a veces se vuelve loco**. La pieza funciona, pero cuando el objetivo es ambiguo (por ejemplo, "mejora la performance"), el agente puede iterar 40 minutos en un callejón sin salida. Hay un slider de "límite de turnos" configurable, pero el coste de un goal mal definido es real.
- **Multi-run con Fusion es caro**. Cinco modelos en paralelo son cinco presupuestos de tokens. Para tareas triviales, no vale la pena; úsalo solo donde el coste de equivocarte es alto.
- **Cambiar de modelo mid-session es manual**. Si empezaste una sesión con Claude y quieres pasar a GPT-5.5 a mitad de camino, tienes que cambiar el provider en la sesión. No es un handoff limpio como en Paseo. Si necesitas multi-provider mid-session, Paseo te conviene más.
- **La curva de aprendizaje es mayor que la de un frontend plano**. Session Goals, Multi-run, Fusion, Walkthrough, Preview, cron — son cinco Poderes que tienes que aprender a usar. El usuario que abre la app por primera vez sin leer la docs se va a perder.

Esas críticas no invalidan el producto. Son la zona de mejora que el equipo conoce y va cerrando release a release. La diferencia entre OpenChamber y un proyecto open source mediocre es que el equipo publica esta honestidad como contenido de marketing, no como vergüenza escondida.

## Cómo empezar: el camino de cero a supervisor

Voy a cerrar con la ruta de instalación más directa, que es la que recomiendo:

### Path 0 — recomendado (escritorio real)

1. Descarga la app de escritorio desde [github.com/openchamber/openchamber/releases/latest](https://github.com/openchamber/openchamber/releases/latest). El bundle para macOS, Windows y Linux incluye el CLI de OpenCode.
2. En el primer arranque, te pide una contraseña para la UI web. Pon algo memorable (o salta con `--ui-password be-creative-here` desde CLI).
3. Configura los providers que quieras usar (Anthropic, OpenAI, etc.) en el panel de Settings.
4. Crea tu primera sesión. Dale un Session Goal claro. Pulsa "Run".
5. Cierra la app. Vuelve a abrirla. La sesión sigue ahí.

### Path 1 — para el que ya tiene OpenCode CLI

```bash
# Installar la CLI de OpenChamber
curl -fsSL https://raw.githubusercontent.com/openchamber/openchamber/main/scripts/install.sh | bash

# Arrancar la UI web en localhost
openchamber --ui-password be-creative-here

# O exponer la LAN (ojo con la contraseña)
openchamber --lan --ui-password be-creative-here
```

### Path 2 — VS Code

Abre VS Code, ve a Extensions, busca "OpenChamber", instala la del publisher `FedaykinDev`. Reinicia. Tendrás un panel lateral con la sesión activa.

### Path 3 — túnel rápido para probar desde el móvil

```bash
openchamber tunnel start --provider cloudflare --mode quick --qr
```

El comando levanta un túnel efímero con Cloudflare y un QR que puedes escanear con tu móvil. Perfecto para una demo de cinco minutos.

## Lecciones que me llevo de OpenChamber

Después de tres semanas con OpenChamber como cockpit diario, saco cuatro conclusiones que ya están en mi workflow:

1. **Session Goals cambia la conversación con el agente**. Pasé de intercambios cortos (prompt, respuesta, decisión) a sesiones largas (goal, ejecución, verificación). El coste de aprender a escribir buenos Session Goals es alto; el beneficio, mayor.
2. **Multi-run es la herramienta de calidad real**. Para decisiones de arquitectura o código que toca dinero, correr la misma tarea en cinco modelos y comparar es la diferencia entre "espero que esté bien" y "sé que está bien". El coste de tokens es marginal comparado con el coste de un bug en producción.
3. **Changes Walkthrough es infrautilizado**. La mayoría de la gente que prueba OpenChamber se queda en Session Goals y Multi-run. El Walkthrough es la pieza que convierte un diff ilegible en un PR legible. Es la feature que más impacto tiene en code review.
4. **La app móvil es underrated**. La PWA es decente, las apps oficiales en iOS y Android funcionan, y Private Relay es la única forma de tener supervision remota sin abrir puertos. Si tu workflow es "escritorio + supervisión móvil", OpenChamber es el más completo del grupo.

Y una observación que no es lección sino convicción: **los coding agents ya no son tools; son procesos**. La pregunta ya no es "qué prompt le mando al agente"; la pregunta es "qué objetivo verificable le pongo al agente, y cuándo reviso que lo cumplió". OpenChamber es la primera pieza del ecosistema open source que toma la nueva pregunta en serio. La competencia por ahora copia features; OpenChamber puso el marco.

## Bibliografía y referencias

### Repositorio y documentación oficial

- [openchamber/openchamber](https://github.com/openchamber/openchamber) — Repo principal. Verificado a 2026-08-14: 8.729 estrellas, 911 forks, MIT, TypeScript, último push 2026-08-14T11:11Z.
- [openchamber.dev](https://openchamber.dev/) — Sitio oficial con descripción, install, mobile, security.
- [OpenChamber Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=FedaykinDev.openchamber) — Extensión oficial. 19.097 installs a la fecha.
- [OpenChamber Roadmap](https://openchamber.dev/roadmap/) — Roadmap público, función por función, con estado shipped / in progress / planned.

### Reviews y análisis externos

- [OpenChamber: el entorno agéntico open source para IA · elsolitario.org](https://elsolitario.org/2026/08/09/openchamber-entorno-agentico-desarrollo-ia/) — Review en español del 9 de agosto de 2026. Fuente de la cita de las "seis funciones en una sola versión" y los testimonios de early adopters.
- [OpenChamber: The Primary GUI for OpenCode AI Coding Agent · addROM](https://addrom.com/openchamber-the-primary-gui-for-opencode-ai-coding-agent-installation-features-and-remote-access-guide/) — Guía de instalación con foco en Cloudflare Remote Access.
- [OpenChamber: Agentic Dev Environment on OpenCode · Oflight Inc.](https://www.oflight.co.jp/en/columns/openchamber-agentic-dev-environment-2026) — Análisis técnico en inglés, agosto de 2026.
- [OpenChamber - AI Agent Dev Environment · EveryDev.ai](https://www.everydev.ai/tools/openchamber) — Ficha del proyecto con lista de features clave.

### Artículos relacionados en este blog

- [La comparativa operativa con Paseo, CodeNomad y opencode-mobile](/es/blog/openchamber-paseo-comparativa-2026/) — El post del 14 de agosto, donde OpenChamber es la pieza "para el 90% de los casos".
- [Paseo en profundidad: el orchestrator multi-provider](/es/blog/paseo-orchestrator-multi-provider-2026/) — El post del 15 de agosto, donde cubrí la categoría complementaria.
- [OpenChamber, CodeNomad, nomacode y opencode-mobile: comparativa honesta para OpenCode](/es/blog/opencode-frontends-comparativa-2026/) — El post del 26 de julio, predecesor de la comparativa.
- [El mapa del ecosistema OpenCode](/es/blog/awesome-opencode-ecosystem/) — La visión general del ecosistema.
- [Subagentes en OpenCode: workflows y Superpowers](/es/blog/opencode-subagents/) — Cómo se trabaja con subagentes en OpenCode.

## Cierre

OpenChamber no es la opción más *cool*. No tiene SSH en Elixir, no tiene 35 proveedores, no tiene voice procesado local. Pero tiene algo que sus competidores no: **un producto terminado para una necesidad real**. Si tu trabajo con coding agents se parece a "sesiones largas, supervisión intermitente, calidad verificable,Multi-run cuando importa, cambios merged desde la UI", OpenChamber es tu app. Y si tu workflow es más simple, sigue siendo un buen lugar para empezar: la versión de escritorio trae OpenCode integrado, la configuración es trivial, y la documentación oficial te lleva paso a paso.

La próxima vez que alguien te diga que el open source no llega al nivel de producto del SaaS, mándale el link a OpenChamber. Un equipo pequeño, un roadmap público, una v0.7 con seis funciones que redefinen la categoría, y una honestidad sobre los límites que ya quisieran los comerciales. Es la historia del software cuando está bien hecho.

Nos leemos en el próximo devlog.
