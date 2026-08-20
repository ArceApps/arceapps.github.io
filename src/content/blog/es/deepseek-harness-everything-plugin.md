---
title: "DeepSeek Harness: el runtime donde todo es un plugin"
description: "DeepSeek Harness (dsh) es un runtime open-source MIT donde modelo, herramientas, sesión, sandbox e incluso el loop son plugins. Análisis en profundidad: Cordis, modos, sesión append-only y self-evolution."
pubDate: 2026-08-20
lastmod: 2026-08-20
author: "ArceApps"
keywords:
  - "DeepSeek Harness"
  - "dsh"
  - "Cordis"
  - "Agent Harness"
  - "Plugin Architecture"
  - "Self-Evolving Agents"
canonical: "https://arceapps.com/es/blog/deepseek-harness-everything-plugin/"
heroImage: "/images/deepseek-harness-everything-plugin-es.svg"
tags: ["DeepSeek", "AI Agents", "Harness", "Open Source", "Indie Dev"]
reference_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
---

## La semana que DeepSeek cambió el debate del harness

El 13 de agosto de 2026, DeepSeek publicó en GitHub el repositorio
`deepseek-ai/deepseek-harness` bajo licencia MIT. Lo que en condiciones normales
hubiera sido una release más de infraestructura de agentes se convirtió, en
48 horas, en una de las curvas de adopción más rápidas que GitHub ha registrado
para una herramienta de desarrollo. Según el snapshot del propio API de GitHub
capturado por Flowtivity el 15 de agosto, el repositorio acumulaba 95.386
estrellas y 8.826 forks; el periodista Justin3Go, que llevaba el reloj desde el
minuto uno, reportó 50.000 estrellas en 12 horas y ~92.000 al cierre del segundo
día. Para ponerlo en perspectiva, el récord anterior — OpenClaw — tardó 84 días
en llegar a 200.000.

¿Qué tiene DeepSeek Harness (`dsh`) para provocar esa reacción? No es un
modelo nuevo: el modelo V4-Pro-0813 se publicó el mismo día, pero la
publicación del harness como código auditable es lo que separa esta release de
las anteriores. La propuesta central es una sola línea que la propia web
oficial repite hasta la saciedad:

> **Everything is a plugin.**

Y lo dicen en serio. El modelo es un plugin. El registro de tools es un plugin.
El sandbox es un plugin. El log de sesión es un plugin. La interfaz web es un
plugin. Y —aquí está el verdadero giro— **el propio bucle del agente es un
plugin**. Esa última línea cambia el tipo deframework que es `dsh`: no es
"otro Claude Code con otro nombre", es una declaración sobre cómo debería
estar estructurado el runtime de un agente para soportar, eventualmente,
agentes que se modifican a sí mismos.

Antes de seguir, dos enlaces obligatorios al prior art del blog: este artículo
se apoya en [Harness Engineering: el wrapper que gana](/es/blog/harness-engineering-wrapper-gana/),
donde argumento que el harness (tools, memoria, guardrails) hace productivo al
modelo, y en [Subagentes y Superpowers en OpenCode](/es/blog/opencode-subagents/),
donde vimos cómo se monta un harness por encima de un modelo sin tocar su
núcleo. Lo que `dsh` añade al debate es la pregunta inversa: ¿y si el
harness mismo fuera reconfigurable pieza por pieza, sin reiniciar nada? Eso
es lo que vamos a desgranar.

## Posicionamiento: qué es y qué no es `dsh`

Leído de cerca, el repositorio deja pocas dudas sobre su intención. El README
empieza con tres líneas: nombre del proyecto, organización y un enlace al
framework Cordis; debajo, una sección titulada literalmente "Developer preview"
con la advertencia en mayúsculas **"THERE WILL BE COMPATIBILITY-BREAKING
CHANGES"**. La licencia es MIT, el stack es un monorepo de TypeScript (57
package groups, ~500k líneas) con ~300 líneas de C11 debajo del sandbox de
Linux, y la versión en circulación mientras escribo es `0.1.0-rc.5`.

El detalle menos publicitado y más importante: `dsh` es **model-agnóstico**.
El adaptador de modelo vive en `ctx.llm`, y en las integraciones
documentadas aparecen DeepSeek, OpenAI, Anthropic, Google, Kimi y cualquier
endpoint compatible con el formato OpenAI. Conectar uno nuevo cuesta unas
cuantas líneas de YAML; cambiar de proveedor en caliente, sin recompilar.
Esto explica por qué la página oficial describe `dsh` con la fórmula:

> **Agent = Model + Harness**

El modelo es "el alma del agente"; el harness es lo que le permite entender
su entorno, usar herramientas y seguir trabajando en condiciones reales. Es
una declaración de diseño que separa, por primera vez de forma operativa, la
capa de modelo de la capa de ejecución.

Una pieza de backstory que ayuda a entender la madurez de día uno: cuando
DeepSeek publicó previamente las cifras de DeepSWE, parte de la comunidad
criticó que fueran "vendor-reported, unreproducible", y el equipo se
comprometió a "open-source the harness used for evaluation". Todas las
señales —los 22 contribuidores iniciales, el grueso del código viniendo de
commits con miles de contributions por autor, la cobertura de tests al 100%
por archivo exigida en CI— apuntan a que `dsh` es exactamente esa promesa
cumplida. Es el framework interno que DeepSeek usa para correr benchmarks
agénticos contra sus propios modelos. Por eso llegó al día uno con un nivel
de pulido que normalmente tarda seis meses en aparecer.

## Cordis: el sistema operativo de plugins que no conocías

El corazón de `dsh` se llama Cordis, y Cordis ya existía antes de que
DeepSeek lo pusiera en el centro de su producto. Es un meta-framework de
plugins cuyo diseño se formaliza en un paper de 88 páginas, *A Programming
Paradigm for Spatiotemporal Composability*, publicado el mismo 13 de agosto
por Yifan Shi (Peking University y DeepSeek-AI), Wei Zhang (DeepSeek-AI) y
Tianyi Cui (Peking University). El paper toma dos conceptos clásicos de la
teoría de tipos — **effects** y **coeffects** — y los levanta del análisis
estático en tiempo de compilación a mecanismos de runtime.

- **Effects** describen cómo un programa modifica su entorno.
- **Coeffects** describen qué requiere el programa de su entorno.

La intuición operativa: cuando un plugin se monta, registra efectos
explícitos (mutaciones de contexto con función inversa). Esos efectos se
apilan en una pila LIFO; cuando el plugin se desmonta, el runtime recorre
la pila hacia atrás y deja el sistema en exactamente el mismo estado que
tenía antes de montarlo. Esto resuelve el problema clásico de los plugins
— que cargarlos es fácil pero descargarlos limpiamente es casi imposible —
de un plumazo.

El segundo eje, **coefficients reactivos**, ataca la gestión de
dependencias. Cada componente declara qué necesita; el runtime lo deja
inactivo hasta que su dependencia aparece, y reconfigurar un proveedor
reactivará solo los dependientes cuya resolución haya cambiado realmente.
No hay grafos de dependencias escritos a mano; se infieren de
declaraciones.

La validación más interesante del paper no es teórica: cita el framework de
chatbot **Koishi**, que lleva más de cuatro años en producción con más de
4.000 plugins contribuidos por la comunidad, todos ellos hot-swappable desde
una consola web y re-aplicables en caliente al guardar cambios sin
descargar caches ni conexiones. Es una existencia demostrada, no un
benchmark controlado, pero para un equipo que se plantea "esto escalará en
producción" es la prueba más relevante que van a encontrar en 2026.

## Cómo se ve "todo es un plugin" en el código

Lo que la página oficial cuenta como eslogan, el repositorio lo demuestra con
la forma mínima de un plugin:

```ts
import type { Context } from '@deepseek-ai/cordis';

export const name = 'hello';

export function apply(ctx: Context) {
  console.log('hello from my primer plugin');
}
```

`apply(ctx)` recibe el contexto compartido y registra lo que sea —
servicios, eventos, herramientas. La línea de YAML que lo monta no entra en
el proceso principal como dependencia; se compone en boot:

```yaml
plugins:
  - hello
  - ./plugins/mi-stack
  - github:mi-org/mi-plugin#v1
```

El monorepo tiene un paquete llamado `packages/core/agent-loop` que define
el bucle principal del agente. Es **un paquete normal**, sin ningún privilegio
especial; se puede sustituir por configuración como cualquier otro plugin. La
forma mínima del bucle ReAct se descompone en eventos públicos
(`turn/start`, `agent/pre-step`, `step/start`, `system-prompt/assemble`,
`agent/request`, `llm/stream`, `assistant/message`, `tools/pre-execute`,
`tools/execute`, `tools/post-execute`, `step/end`, `agent/turn-stopping`,
`turn/end`). Cualquier plugin puede reescribir mensajes en `agent/pre-step`
o reemplazar el resultado de una tool en `tools/post-execute`. El loop no
es propiedad privada del framework; es un protocolo público en el que
participan todos los plugins.

La consecuencia directa, y la que más me interesa como autor: **convertir un
único agente en una arquitectura multi-agente es cambiar el plugin de loop**.
No hay que forkear nada. Frente a Codex CLI, donde alterar el bucle principal
implica editar su núcleo en Rust, `dsh` te da esa puerta sin pedirte el código
fuente.

## Cuatro modos para cuatro tipos de trabajo

El runtime oficial se entrega con cuatro modos preconfigurados, descritos como
"patrones de ensamblaje" más que como productos cerrados:

- **Standard mode**: el agente de código completo. Edición de ficheros,
  shell, búsqueda de archivos y web, skills, planning, goals, subagentes,
  workflows.
- **Code mode**: todas las capacidades de Standard, pero las tools se
  exponen vía SDK para que el modelo escriba TypeScript que orquesta
  múltiples llamadas en un único programa (esto resuelve de raíz el problema
  de "docenas de tool calls quemando la ventana de contexto").
- **Minimal mode**: shell persistente + `str_replace_editor`. Es el modo en
  el que DeepSeek ejecutó V4-Pro-0813 para los benchmarks de Terminal Bench
  2.1, Toolathlon-Verified y DSBench-FullStack.
- **Creator mode**: para inspeccionar el runtime actual y experimentar con
  plugins Cordis en memoria, ideal para autores de presets personalizados.

Pero estos cuatro son cuatro entre muchos. El propio beta-tester Jiayuan
Zhang lo resume con una metáfora precisa: `dsh` es como un **kit de Lego
para coches**, y los presets oficiales son solo una de las formas
recomendadas de montarlo, impresa en la caja. El sistema de perfiles y
bundles permite componer capas (`dsh-base` aporta adapters de modelo,
tools, persistencia, sandbox y política de aprobación) y, encima, parchear
cualquier fila de configuración con un archivo de patch sin tocar el código
del framework.

Para entender qué hace cada evento público en el loop, este diagrama
resume el flujo `turn → step → tools → result` con los gates
interceptables marcados en naranja:

![Bucle de eventos Cordis: turn wrapping steps, cada step con un model
request más tool calls](/images/diagrams/dsh-event-loop-es.svg)

Léelo dos veces. La primera para entender el flujo principal; la segunda
para notar que **casi cada caja es un evento interceptable**. Un plugin
puede reescribir mensajes en `agent/pre-step`, suprimir la ejecución de
una tool en `tools/pre-execute`, o reemplazar el resultado en
`tools/post-execute`. El loop no es propiedad privada del framework; es
un protocolo público en el que todos los plugins participan.

## El log append-only como invariante de runtime

El segundo pilar técnico —y el más práctico para equipos que necesitan
auditoría— es el **session log append-only**. `dsh` impone como invariante de
runtime una regla que la documentación llama *"model-visible means logged"*:
todo lo que llega a una request de modelo tiene que poder reconstruirse a
partir del log. El log es un stream de eventos: system prompts, razonamiento,
tool calls y resultados, scheduling de subagentes y cada context injection.
La vista de Trayectoria permite inspeccionar esos registros por fuente, y
resume, fork, search y replay operan todos sobre el mismo event stream.

Esta invariante es la razón por la que varios comentaristas en Hacker News
lo calificaron como *killer feature* en un momento donde los vendors
estadounidenses están cifrando trazas de razonamiento y dificultando su
auditoría. `dsh` convierte "fully traceable" en una garantía arquitectónica,
no en un nice-to-have.

La compactación de contexto tampoco es una caja negra cocinada dentro del
loop: es un plugin independiente. Primero recorta los resultados de tool que
exceden presupuesto; si no basta, genera un nodo de resumen que reemplaza un
trozo de historial. Todo el proceso va envuelto en tres eventos de log, así
que incluso un crash a mitad de compactación es reconstruible desde el log.

## Tres cosas que —según los críticos— "nadie más tiene"

El análisis técnico en chino de Justin3Go identificó tres capacidades del
runtime que, verificadas en el código, no aparecen juntas en ningún competidor:

1. **Code mode (`run_code`)**. El modelo escribe un fragmento de TypeScript
   que batch-llama tools vía `await tools.name(args)`; solo lo que se
   imprima o se retorne vuelve al modelo. Una docena de round-trips colapsan
   en una sola ejecución.
2. **Subagente delegado a un competidor**. El backend `ctx.subagents`
   soporta múltiples proveedores, y entre ellos aparecen **`claude-code`**
   y **`codex`**. Puedes despachar desde dentro de `dsh` una subtarea cuyo
   ejecutor real sea Claude Code o Codex CLI. No hay precedente de un
   stance tan "harness-agnostic" en productos comerciales.
3. **Toolset auto-modificable (`cordis_*`)**. El agente puede inspeccionar
   su propio árbol de plugins, escribir uno nuevo al vuelo y montarlo. Es la
   semilla del "self-evolving agent" —con dos caveats importantes: no está
   habilitado por defecto en ningún preset oficial, hay que activarlo
   explícitamente, y un plugin escrito al vuelo vive solo en memoria: se
   pierde al reiniciar, sin mecanismo de persistencia todavía.

El tercero es el que más tinta ha generado. Es real, está en el código, pero
**está sobredimensionado en la narrativa**. Que un agente pueda modificar su
propio toolset en una sesión no equivale a "agente autoevolutivo" en el
sentido fuerte del paper de Cordis; para eso falta persistencia, falta
verificación independiente, faltan políticas de compensación que el paper
documenta explícitamente como "fuera del core metateórico".

## Sandboxing y permisos: estricto donde debe serlo

El diseño de seguridad de `dsh` no es descuidado. Linux usa `bwrap` +
Landlock con un launcher en C construido ad-hoc y fail-closed; macOS usa
Seatbelt; Windows usa ACL tokens restringidos. El modelo de aprobación es
una enumeración cerrada, y cualquier anomalía se rechaza como "unavailable"
en lugar de admitirse silenciosamente. El runtime es además honesto sobre la
distinción entre sandbox completo y parcial: Landlock sobre kernels
antiguos solo califica como parcial, y no se reporta falsamente como
completo.

El matiz importante, que 36Kr señaló en su hands-on: **el sandbox gobierna
la ejecución de tools, pero los plugins corren dentro del proceso del
harness**. Hoy por hoy, cualquier plugin puede alcanzar el shell y el
sistema de ficheros. El modelo de confianza para instalar plugins
de terceros se reduce, en la práctica, a buena fe. Es la primera grieta
arquitectónica que cualquier equipo serio debería mapear antes de meter
`dsh` en producción.

## El detalle que me hizo sonreír: construir el harness con el harness

Lo que más me llamó la atención no fue el código en sí, sino los **1.386
Agent Notes** bajo `.agents/`: registros de decisiones arquitectónicas
clasificados como "implemented / rejected / archived / proposed", más
post-mortems publicados. La documentación interna ronda las 170.000 líneas,
casi a la par del codebase principal, y los snippets de tipo embebidos en
los docs se difusionan automáticamente contra el source en CI para evitar
drift; el 100% de cobertura de tests por archivo es un hard gate.

Estas trazas sugieren que el repositorio mismo se construyó con
participación intensiva de agentes de IA — diseñando, revisando y
escribiendo post-mortems. `dsh` es el primer usuario de su propia filosofía.
Es una ironía deliciosa y, para mí, el argumento más honesto de todos: si
un equipo puede usar su propio harness para construir su propio harness,
algo del diseño es correcto.

## Qué significa esto para los que ya tenemos un stack

`dsh` no es para todo el mundo. Es un framework, no un producto. Como dijo
un developer con un mes de early access antes del lanzamiento: *"as a
coding agent to actually use, the experience genuinely isn't as polished
as Claude Code or Codex"*. La realidad es que `dsh` está más cerca de
**PostgreSQL** que de **Notion**: te da piezas de infraestructura que
componer, no una experiencia cerrada que consumir.

Tres audiencias que deberían mirarlo en serio:

- **Equipos que ya construyen infra de agentes** y están hartos de que cada
  cambio de proveedor implique un fork. Con `dsh`, cambiar de
  OpenAI a Anthropic a un modelo local en Ollama es una línea de YAML.
- **Equipos que necesitan auditoría de verdad** — financieros, salud,
  defensa, cualquier dominio donde "qué vio el modelo" no pueda ser un
  misterio. La invariante *"model-visible means logged"* es la única del
  mercado que es architectural, no documental.
- **Investigadores de self-evolving agents** que necesitan una base con
  rollback semantics probado. El paper de Cordis es la única referencia
  pública con resultados de producción de cuatro años.

Tres audiencias que probablemente deberían seguir con Claude Code o Codex:

- **Indies que quieren productividad inmediata**. La superficie a aprender
  (profiles, bundles, patch layers) es más profunda que la de Codex CLI,
  y el onboarding docs es fino.
- **Equipos donde el token-usage manda**. Tests preliminares muestran un
  orden de magnitud más de tokens consumidos frente a Pi en el mismo
  modelo, y un bug confirmado: `dsh` lee `CLAUDE.md` y `AGENTS.md` del
  proyecto, y si el contenido es idéntico (algo común por compatibilidad
  cruzada) el system prompt se inyecta dos veces. Sin fix oficial al
  cierre de este artículo.
- **Equipos que necesitan madurez de plugin ecosystem hoy**. La lista de
  compatibilidad oficial reporta 41 integraciones validadas contra 219
  marcadas como "necesitan atención"; el hands-on de 36Kr reportó que las
  cinco herramientas de terceros que probó fallaron outright.

## Crítica honesta: lo que no me convence

Hay tres cosas que, leídas con frialdad, separan la release-day marketing
de la realidad operativa.

**El "todo es un plugin" como respuesta a una pregunta que pocos se hacen.**
El comentario chino de yage.ai lo resume bien: para buscar en la web,
reiniciar un servidor MCP toma 2-3 segundos; para una skill en texto plano,
no se necesita hot-reload a nivel de framework. La capacidad de "swappear
componentes sin parar el runtime" es real, pero es un requisito raro para
la mayoría de casos. Un beta-tester observó que los propios modelos de
DeepSeek muchas veces no saben cómo usar un plugin correctamente y
simplemente editan su propio código — *"más rápido, y casi igual de
efectivo"*.

**El coste en tokens**. La diferencia de orden de magnitud frente a Pi
(4.5K vs 47.6K tokens de input sin caché, en el mismo modelo) no se
justifica solo por el surface area; algo del overhead viene del
doble-injection de `CLAUDE.md` + `AGENTS.md`, pero sospecho que queda más
por explicar. Si tu modelo se factura por token, `dsh` no es todavía la
opción eficiente.

**La opacidad de los benchmarks**. La puntuación SWE-bench Verified de
V4-Pro tiene dos versiones circulando — 80.6% self-reported contra 96.4%
del evaluador externo Vals — un gap de 16 puntos que probablemente se
explica por variantes o metodologías distintas, pero sin explicación
autoritativa todavía. Y los agent benchmarks (Terminal Bench 2.1, etc.) se
midieron en minimal mode, que es **el propio harness de DeepSeek**, no
solo el modelo. Es información útil, pero no es comparable punto-a-punto
con otros agentes que corren en sus propios runtimes.

## El self-evolving bet y por qué importa aunque no lo adoptes

Si todo lo anterior te suena a "interesante pero no para mí", el paper de
Cordis sigue mereciendo una hora de lectura. Su argumento de fondo es que
**los efectos revertibles y los coeffects reactivos son la pieza que
faltaba** para que los agentes puedan modificar su propio software de
forma segura. El paper es cuidadoso al señalar los límites: efectos que
cruzan el límite del sistema (bytes escritos a un archivo compartido,
mensajes enviados por la red) no son revertibles por el runtime; la
solución que propone es **compensación** — acciones de undo suministradas
por la aplicación, compuestas en el mismo orden que las inversas pero no
cubiertas por el core metateórico.

Una forma concreta de verlo: imagínate un plugin que registra una tool
para escribir a un log. El efecto "registrar tool" es revertible — basta
con deregistrarla. Pero el efecto "escribir línea al log" cruza el límite
del sistema (los bytes ya están en el fichero, otro proceso puede haberlos
leído). El runtime no puede "des-escribir" la línea; lo que hace es pedir
al plugin una función de compensación que, en este caso, sería algo como
"truncar el fichero a la longitud anterior". El paper demuestra que las
composiciones de compensación siguen el mismo orden LIFO que las inversas
puras, lo que da una propiedad operativa importante: el agente puede
explorar, equivocarse y retroceder sin tener que razonar explícitamente
sobre cómo deshacer cada paso.

Una consecuencia lateral que no esperaba: el paper obliga a pensar
sobre qué información cruza el límite del sistema en cada plugin. En la
práctica eso fuerza una disciplina de diseño — los plugins se vuelven
más pequeños, más explícitos sobre sus efectos, y menos propensos a
esconder estado global mutable. Es el tipo de presión arquitectónica que
suele aparecer en proyectos que llevan años madurando (PostgreSQL, Erlang,
Kubernetes), no en un release de día uno. Que Cordis ya la traiga
incorporada es, para mí, el indicador más fuerte de que el equipo lleva
más tiempo del que sugiere el contador de GitHub.

Tres consecuencias que se aplican más allá de DeepSeek:

1. **Self-evolving agents deja de ser ciencia ficción** y se convierte en
   roadmap de systems engineering con teoría publicada.
2. **Los plugin ecosystems se vuelven mutables en caliente** sin "plug and
   pray". Memory, tools y skills se vuelven hot-swappable.
3. **La reversibilidad se vuelve un principio de diseño general**:
   cualquier sistema que permita al software modificarse a sí mismo tiene
   que enviar undo semantics primero. Ese patrón se va a extender a todo
   host de agentes de larga duración, incluyendo setups locales que no
   toquen Cordis.

Si construyes infra de agentes, lee el paper. Si evalúas plataformas de
agentes, pregunta si el runtime puede swappear tools y skills en vivo sin
reiniciar. Esa capacidad se acaba de convertir en benchmark, no en
nice-to-have.

## Cómo ve el modelo: prompt assembly, context injection y el adapter

Una dimensión que se pasa por alto al hablar de "todo es un plugin" es
cómo llega la información al modelo. `dsh` descompone ese momento en
varias etapas, todas interceptables como eventos. La más interesante es
**`system-prompt/assemble`**: el momento en el que el runtime compone el
prompt del sistema del agente. Plugins de skills, plugins de memoria,
plugins de policies y plugins de UI pueden registrarse como
"contribuyentes" al prompt; cada uno añade su bloque en un orden
determinado por dependencias declaradas, no por orden de carga. El
resultado es un system prompt reproducible: el mismo config en dos
runs produce el mismo prompt, lo que da una propiedad importante para
benchmarks y debugging — *"lo que vio el modelo" se puede reconstruir
bit a bit desde el log*.

La segunda etapa es el **adapter de modelo** en `ctx.llm`. A diferencia
de otros frameworks donde el adapter del proveedor es código interno
privilegiado, aquí vive como un plugin más. El runtime trae adapters
para OpenAI, Anthropic, Google, Kimi, DeepSeek y cualquier endpoint
OpenAI-compatible, y los publica en un registro que las tools pueden
consultar. Cuando una tool quiere llamar al modelo — por ejemplo, un
plugin de summarización que necesita generar un nodo de resumen para la
compactación — le pide al registry "dame el adapter activo" en lugar de
importar uno hardcoded. Cambiar de proveedor en caliente es reconfigurar
el registry, no recompilar el harness.

La tercera pieza, menos obvia pero crítica para la consistencia, es el
**context injection event waterfall**. Cada vez que un plugin añade
información al contexto del modelo (resultado de una tool, mensaje de
un subagente, observación del sandbox), dispara un evento que otros
plugins pueden interceptar para reescribir, anotar o suprimir. Es un
mecanismo de middleware al estilo Express, pero aplicado a la cadena de
inputs del modelo. En la práctica, eso significa que un equipo puede
montar un plugin de **red-team safety** que reescribe cualquier
inyección sospechosa antes de que llegue al modelo, o un plugin de
**observabilidad** que anota cada mensaje con un trace ID y lo envía a
un sink externo — sin tocar el código del framework.

Juntas, las tres etapas convierten al system prompt en un artefacto
componible, no en un string opaco que solo el vendor controla. Es la
misma filosofía que aplicó Unix a las pipes: cada etapa hace una cosa,
toma input de la anterior, y produce output para la siguiente. El
modelo, en este símil, es el último consumidor de una cadena de
plugins que filtran, anotan y dan forma al contexto antes de que el
agente "vea" nada.

## Preguntas frecuentes

**¿`dsh` es solo el Claude Code de DeepSeek con otro nombre?**
No. Claude Code es un producto comercial con un modelo de extensión
privilegiado (Skills, Subagents, Hooks viven en una capa de extensión,
no en el núcleo del runtime). `dsh` es un framework donde la capa de
extensión *es* el núcleo: el modelo, el toolset, el sandbox, el log y
el bucle son plugins de primera clase, intercambiables sin recompilar.
La diferencia operativa: puedes sustituir el bucle principal por un
plugin tuyo que implemente una arquitectura multi-agente; no puedes
hacer eso en Claude Code sin forkear el repo.

**¿Está listo para producción en agosto de 2026?**
No, no todavía. El propio README lleva la advertencia *"THERE WILL BE
COMPATIBILITY-BREAKING CHANGES"* en mayúsculas, y la release es
`0.1.0-rc.5` con etiqueta "developer preview". Lo que sí está listo
es la arquitectura: Cordis lleva cuatro años en producción dentro de
Koishi, y el diseño de effects revertibles está validado a nivel de
sistema en ese ecosistema. Lo que aún no está listo es la API pública
de `dsh`: los contratos de plugin pueden cambiar, los presets oficiales
pueden reorganizarse, y el ecosistema de 316 plugins comunitarios tiene
solo 41 marcados como compatibles. Trátalo como infraestructura
experimental con backing teórico serio, no como producto estable.

**¿Por qué no usar simplemente OpenCode o Claude Code con un buen
prompt?**
Si tu workload cabe en "leer el repo, editar unos ficheros, correr
los tests", cualquiera de los dos te va a dar mejor resultado *hoy*
con menos fricción. `dsh` entra en la ecuación cuando necesitas
alguno de estos: auditoría arquitectónica completa (*"model-visible
means logged"*), hot-swap de proveedores en runtime, composición de
plugins con estado entre sesiones, o un sandbox donde puedas meter
código generado por el modelo sin riesgo de escape. Para "indie
haciendo su app", `dsh` es overkill. Para "equipo construyendo infra
de agentes que otros van a consumir", es la única opción del mercado
que ya tiene esas propiedades por construcción.

**¿Cómo encaja `dsh` con el resto del stack de un indie?**
Tres patrones reales que he visto en la primera semana desde el
lanzamiento. (1) **Como sandbox para evaluar modelos**: el modo
Minimal mode te da shell + str_replace_editor y nada más, lo que
permite comparar dos modelos en idénticas condiciones sin que el
framework inyecte system prompts divergentes. (2) **Como memoria
persistente cross-proyecto**: el log append-only se puede montar como
fuente de verdad para un sistema de memoria tipo [Hipocampus](/es/blog/hipocampus-memoria-jerarquica-agentes/)
o [PlugMem](/es/blog/plugmem-microsoft-memoria-agentes/), donde cada
sesión alimenta un índice estructurado. (3) **Como proxy de auditoría
para equipos chicos que no pueden permitirse Datadog**: el Trajectory
view + el log exportable te dan observabilidad agéntica sin vendor
lock-in.

**¿Vale la pena leer el paper de Cordis aunque no adoptes `dsh`?**
Sí, sin discusión. El paper *"A Programming Paradigm for Spatiotemporal
Composability"* es la única referencia pública con teoría formal +
resultados de producción de cuatro años sobre el problema de
self-modificación segura en sistemas con plugins. Aunque no uses
Cordis ni `dsh`, los conceptos de effects revertibles y coeffects
reactivos son aplicables a cualquier sistema donde los componentes
llegan y se van en runtime: desde tu propio framework de microservicios
hasta un cluster de Kubernetes con operators. Es una de esas piezas
de teoría que, una vez leídas, cambian cómo ves el resto de tu stack.

## Cómo se instala y qué esperar el primer día

El quickstart oficial vive en una sola línea:

```sh
npx @deepseek-ai/dsh web
```

Eso arranca la Web UI en `http://127.0.0.1:3080` y, salvo que pases
`--no-open`, lanza el navegador por defecto. El primer `npx` no es
instantáneo: el equipo reporta varios minutos de descarga incluso en
servidores bien conectados, porque debajo hay un monorepo completo de
TypeScript con su build, no un script ligero. Es el footprint de una
aplicación, no el de un utility tipo curl. Quien lo adopte debería
esperarlo y presupuestarlo en su flujo de evaluación.

Para una instalación reproducible hay dos caminos más:

- **Desde el repo clonado**: `git clone`, `pnpm install`,
  `pnpm run build`, `pnpm dsh web`. Útil si vas a tocar el framework o
  a montar plugins privados contra una versión pinneada.
- **Imagen Docker**: la comunidad ya empezó a publicar imágenes no
  oficiales con el binario preempaquetado y un entrypoint que respeta
  `--no-open`. Útil para entornos donde `npx` no es viable (CI, sandboxes
  estrictos).

Una vez abierta la UI, el flujo documentado es: Settings → Models →
pegar una API key de DeepSeek → elegir un workspace directory. Sin
reinicio, el route del modelo queda utilizable; cambiar a Anthropic u
OpenAI vía endpoint compatible es otra fila de configuración en la misma
pantalla. El primer comando razonable para smoke-test es *"Summarize
this repository and identify its main packages"* sobre un repo pequeño:
verifica que el agente lee, edita, ejecuta y delega, con prompts de
aprobación para las operaciones sensibles.

El headless mode llega como perfil separado para runs one-shot sin
servidor, y un **Python SDK** cubre uso programático y benchmarks a
través de la variante `jsonrpc-agent`. Esto último es relevante si vienes
del mundo de evaluations: el mismo harness que usas interactivamente es
el que invocas desde tu runner de benchmarks, lo que cierra un gap que
muchos equipos hoy parchean con scripts bash por encima de Claude Code.

## El ecosistema de plugins: 316 al día dos y subiendo

Una señal que pasó por debajo del radar en la cobertura angloparlante: en
48 horas desde el lanzamiento, el topic `dsh-plugin` de GitHub indexaba
316 repositorios públicos etiquetados, según el catálogo de
deepseek-code.com. La distribución por categoría habla de una
comunidad que rápidamente detectó dónde están las fricciones:

- **Utilities (64)**: helpers genéricos, formateadores, validadores.
- **Development (51)**: integración con editores, LSPs, runners de
  tests.
- **Interface (46)**: temas, componentes de UI, alternativas al web UI.
- **AI & Agents (39)**: adapters para otros providers, memoria de
  largo plazo, compresión de contexto, scheduling proactivo.
- **Integrations (39)**: bridges a Linear, Notion, bases de datos, CRMs.
- **Media & Vision (37)**: tooling para que un agente text-only "vea"
  imágenes vía OCR, Q&A visual o restauración de UI frontend.
- **Knowledge (26)**: conectores a RAG externos, indexadores, parsers.
- **Workflow (14)**: pipelines largos, schedulers, plantillas de
  preset.

El ratio entre categorías sugiere una comunidad más interesada en
"hacerse la vida más fácil con `dsh`" que en "investigar nuevos modos
de razonamiento". Eso me parece sano para una release de día dos: las
utilities y los bridges son lo que cualquier framework necesita para
convertirse en infraestructura, no los plugins exóticos. La cifra de
2.000+ submissions reportada por Justin3Go hacia el día tres confirma la
tendencia, aunque —como él mismo advierte— cantidad no es calidad. La
lista oficial de compatibilidad reporta 41 integraciones validadas
contra 219 marcadas como "necesitan atención o investigación adicional".

## Veredicto: para quién es, en una línea

`dsh` no es la versión de DeepSeek de Claude Code; es una apuesta radical
sobre cómo debería verse un runtime de agentes. No es la herramienta
correcta hoy para la mayoría de personas que solo quieren escribir código,
pero la apuesta que hace merece una mirada seria de cualquiera que esté
construyendo infraestructura de agentes. El día que necesites swap de
proveedor en caliente, auditoría completa por invariante arquitectónica o
plugins que viven en memoria sin perder consistencia, `dsh` va a ser de
las pocas opciones que ya tenga respuesta.

## Bibliografía

- [DeepSeek Harness developer preview](https://deepseek.com/harness/en/) —
  página oficial con la promesa "Everything is a plugin", el quick-start
  `npx @deepseek-ai/dsh web` y los cuatro modos de runtime.
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) —
  repositorio MIT, README con la advertencia *"THERE WILL BE
  COMPATIBILITY-BREAKING CHANGES"*, `0.1.0-rc.5` al cierre del artículo.
- [A Programming Paradigm for Spatiotemporal Composability](https://github.com/cordiverse/paper) —
  paper de 88 páginas de Yifan Shi, Wei Zhang y Tianyi Cui (Peking University
  y DeepSeek-AI) que formaliza effects revertibles y coeffects reactivos.
- [Cordis](https://github.com/cordiverse/cordis) — meta-framework de
  plugins en el que se apoya `dsh`, base del chatbot framework Koishi que
  lleva más de cuatro años en producción con 4.000+ plugins.
- [DeepSeek Harness In Depth: 90K Stars in Two Days — Justin3Go](https://justin3go.com/en/posts/2026/08/15-deepseek-harness-review) —
  análisis técnico línea por línea del código, comparativa con Pi / Codex
  CLI / Claude Code / OpenCode, y verificación de las críticas más
  repetidas.
- [DeepSeek's Blueprint for Self-Evolving AI Agents — Aoyii](https://www.aoyii.com/en/deepseek-cordis-self-evolving-agents/) —
  lectura centrada en el paper de Cordis y el camino hacia agentes que
  modifican su propio software.
- [DeepSeek Harness: Why 95,000 GitHub Stars in 2 Days — Flowtivity](https://flowtivity.ai/blog/deepseek-harness-open-source-agent-explained/) —
  hands-on con métricas de adopción, números de benchmarks V4-Pro y
  contexto del cambio de pricing peak/off-peak del 16 de agosto.
- [The Open-Sourcing of DeepSeek Harness — InfoQ](https://www.infoq.com/news/2026/08/deep-seek-harness/) —
  cobertura institucional con foco en la arquitectura micro-kernel y el
  shift hacia infra modular y unbundled.
- [DeepSeek Harness developer preview — Hacker News](https://news.ycombinator.com/item?id=49285244) —
  thread de lanzamiento con 727 puntos y 305 comentarios, incluyendo
  respuesta del equipo autor a las preguntas más técnicas.
- [Harness Engineering: el wrapper que gana — ArceApps](/es/blog/harness-engineering-wrapper-gana/) —
  prior art del blog sobre la separación Model + Harness.
- [OpenCode Subagentes: Workflows y Superpowers — ArceApps](/es/blog/opencode-subagents/) —
  cómo montar un harness por encima de un modelo sin tocar su núcleo.
- [@deepseek-ai/dsh en npm](https://www.npmjs.com/package/@deepseek-ai/dsh) —
  paquete publicado que sirve la web UI en `http://127.0.0.1:3080`.
