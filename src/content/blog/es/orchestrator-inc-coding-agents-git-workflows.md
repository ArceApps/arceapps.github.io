---
title: "Orchestrator.inc: coordinar agentes hasta el PR"
description: "Analizamos Orchestrator.inc desde sus worktrees y agentes paralelos hasta CI, revisiones, seguridad y móvil, y lo comparamos con Orca, OpenChamber y Paseo."
pubDate: 2026-10-06
lastmod: 2026-10-26
author: ArceApps
keywords: ["Orchestrator.inc", "Agent Orchestrator", "coding agents", "git worktrees", "Orca", "OpenChamber", "Paseo"]
canonical: "https://arceapps.com/es/blog/orchestrator-inc-coding-agents-git-workflows/"
heroImage: "/images/orchestrator-inc-coding-agents-git-workflows.svg"
tags: ["IA", "Coding Agents", "Git", "Orquestación", "Desarrollo Indie"]
category: ai-agents
reference_id: "cffb3111-badb-4fd0-928c-281bc792fb50"
---

> **Nota editorial.** Fecha de publicación solicitada: **6 de octubre de 2026**. Análisis y comparativa contrastados con documentación accesible el **26 de octubre de 2026**. Algunas capacidades descritas pueden haber cambiado desde el día de publicación; no se presentan como disponibles necesariamente el 6 de octubre. Esta revisión es documental, no una prueba de instalación ni un benchmark propio.

> **Lecturas relacionadas:** [Paseo y la orquestación multiproveedor](/es/blog/paseo-orchestrator-multi-provider-2026/) y [OpenChamber frente a Paseo: comparativa de herramientas](/es/blog/openchamber-paseo-comparative-2026/). Aquellos artículos analizan dos protagonistas por separado. Aquí la pregunta es otra: **¿quién sigue siendo responsable del trabajo cuando el agente termina de programar?**

## La parte difícil empieza cuando hay más de un agente

Pedirle a un agente que arregle una función ya no sorprende. Lo realmente complicado llega al abrir tres tareas a la vez. Un agente modifica componentes, otro corrige pruebas, un tercero introduce una migración y, mientras tanto, aparece una revisión en GitHub. ¿Dónde está cada cambio? ¿Qué agente debe responder al comentario? ¿Quién repite el test fallido? ¿Qué rama está preparada para fusionar y cuál arrastra un conflicto?

Esa es la oportunidad que intenta aprovechar [Orchestrator.inc](https://orchestrator.inc/), también conocido históricamente como **Agent Orchestrator** o **AO**. No pretende sustituir a Claude Code, Codex o Cursor. Se instala *encima* de esos entornos para conservar una relación entre **tarea, agente, directorio aislado, rama, pull request y estado de validación**. Más que un chat bonito, propone un sistema de seguimiento del trabajo delegado.

La promesa es sugerente para quien programa aplicaciones o mantiene varios repositorios por su cuenta: iniciar tareas independientes, dejar que los agentes trabajen, volver cuando algo requiere criterio y comprobar el resultado sin reconstruir media docena de terminales. Pero conviene distinguir el producto real de su demostración ideal. Un tablero que muestra una tarjeta verde no sustituye ni la revisión de código ni las pruebas; solo puede hacernos esas comprobaciones más visibles.

En esta guía explicaré la arquitectura publicada, el recorrido desde una petición hasta un PR, sus límites y su modelo de seguridad. Después cerraré con una comparación operativa frente a **Orca, OpenChamber y Paseo**. No hay ganadores universales: cada herramienta decide en qué punto coloca al humano.

## Qué es Orchestrator.inc y qué no es

La [documentación oficial](https://docs.orchestrator.inc/) lo define como una aplicación de escritorio para supervisar agentes de programación. Ofrece sesiones con conversación estructurada o terminal nativa, directorios Git aislados, inspección de cambios, vista de proyecto, vista de navegador y seguimiento de PR, CI y revisiones. Las plataformas de escritorio anunciadas son macOS, Windows y Linux, con paquetes específicos para varias distribuciones.

La idea de diseño es separar tres responsabilidades. El **agente de programación** decide qué archivos leer y editar según su harness y permisos. El **orquestador** mantiene las sesiones, asocia ramas y recoge señales de avance. **Git y el proveedor remoto** deciden qué commits, checks y revisiones existen realmente. Una interfaz puede explicar el estado de un PR, pero no convierte un check fallido en uno válido.

Esto tiene una consecuencia importante: instalar Orchestrator no equivale a contratar un modelo. Para utilizar un harness externo necesitas tenerlo disponible y autenticado. La aplicación aprovecha las credenciales o suscripciones configuradas para esas herramientas, según explica su documentación de instalación. Que el controlador local sea de código abierto no implica que Claude, Codex u otros modelos sean gratuitos.

Tampoco es un editor generalista que debas adoptar en lugar de tu IDE. Puedes seguir revisando el código con las herramientas habituales. Su valor está en **mantener la procedencia**: qué tarea originó un cambio, qué sesión lo escribió, qué rama contiene el trabajo y qué ocurrió después de abrir el PR. Una cadena de custodia imperfecta, pero mucho mejor que tener veinte conversaciones sin contexto compartido.

## Bajo el capó: daemon Go, Electron y estado persistente

El [documento de arquitectura](https://docs.orchestrator.inc/architecture/) describe un **daemon local de larga duración escrito en Go**, una aplicación **Electron con React**, una CLI opcional llamada `ao` y una aplicación móvil basada en Expo. Los clientes se conectan al proceso mediante API HTTP, eventos SSE y flujos de terminal. SQLite guarda información de sesiones y otros hechos persistentes. La aplicación de escritorio arranca y supervisa el daemon.

```text
Aplicación Electron ──┐
CLI ao ───────────────┼──> daemon Go ──> sesiones / adaptadores de agentes
Móvil (opcional) ─────┘         │                  │
                               │                  ├──> worktrees y procesos
                               ├──> SQLite         └──> observación GitHub/GitLab
                               ├──> eventos
                               └──> terminal y vista de navegador
```

No se trata de una infraestructura distribuida obligatoria. En el escenario local básico, el daemon, tus repositorios y los agentes residen en la misma máquina. Esto reduce las piezas necesarias para comenzar, aunque también significa que tu máquina sigue siendo el punto de ejecución y de fallo. Si se apaga, no es razonable esperar que los agentes locales continúen trabajando mágicamente.

La separación cliente/daemon es útil porque una conversación puede sobrevivir al cambio de pantalla y la interfaz puede reconstruir lo sucedido. La documentación distingue **hechos guardados** de **estado derivado**. Entre los primeros están la actividad del agente, la terminación de una sesión y los datos de PR y checks; a partir de ellos se muestra una tarjeta como «esperando al usuario», «trabajando», «en revisión» o «lista para fusionar».

¿Por qué importa este detalle? Porque los estados inventados manualmente se quedan obsoletos. Si un agente anuncia que ha terminado pero CI sigue fallando, la tarjeta debe representar la discrepancia. El objetivo no es premiar la confianza del agente, sino hacer visibles señales independientes. Aun así, esas señales pueden sufrir retrasos, fallos de red o problemas de autenticación. Un panel no es una base de verdad superior a GitHub.

### Dos formas de relacionarte con un agente

Una sesión puede abrirse como **Chat**, donde aparecen mensajes, planes, actividades y permisos, o como **Terminal UI**, conservando la experiencia nativa del harness. En macOS y Linux las sesiones nuevas pueden usar terminales PTY propios; Windows utiliza ConPTY. Para ciertas sesiones compatibles de Claude Code y Codex se documenta transición entre Chat y terminal sin abandonar el worktree ni duplicar el controlador activo.

No daría por supuesto que *todos* los harnesses admiten las mismas opciones. El catálogo anuncia numerosos agentes, pero el soporte para trabajador, chat estructurado y revisor no es equivalente entre proveedores. Precisamente por eso, al evaluar una herramienta multiproveedor no basta con contar logotipos. Una integración que abre una CLI en una terminal no aporta automáticamente historial estructurado, permisos finos o reanudación segura.

## El worktree: aislamiento útil, no sandbox de seguridad

El mecanismo fundamental de paralelización es `git worktree`. En lugar de hacer que varios agentes modifiquen un mismo checkout, Orchestrator puede asignar a cada trabajador **su propio directorio y rama**, ligados a una sesión. Así evita que uno sobrescriba archivos no guardados por otro y permite probar soluciones independientes.

Supongamos un proyecto web pequeño con tres cambios: añadir una búsqueda, actualizar textos accesibles y corregir una prueba. Los agentes pueden trabajar en ramas distintas. Cuando termina cada uno, revisas sus commits, abres o consultas el PR y dejas que CI señale regresiones. Las ramas no tienen que terminar al mismo tiempo ni fusionarse en el mismo orden.

Un ejemplo conceptual de Git, **no una receta para ejecutar simultáneamente con el worktree que Orchestrator ya ha creado**, sería:

```bash
git worktree add ../app-search -b feat/search
git worktree add ../app-a11y -b fix/a11y-copy
git worktree list
```

En Orchestrator, la gracia consiste en que la UI haga esa gestión asociándola a la sesión. Pero el aislamiento de archivos tiene límites. Dos worktrees de un mismo repositorio comparten objetos Git; dos agentes pueden seguir compitiendo por servicios externos, bases de datos, puertos, ficheros fuera del repositorio y credenciales del usuario. **Worktree no significa contenedor, máquina virtual ni sandbox**.

Si ambos agentes arrancan `npm run dev` en un puerto fijo, alguno fallará salvo que la herramienta o el proyecto asignen puertos distintos. Si ambos aplican migraciones a una base de datos de desarrollo compartida, el aislamiento de directorios no evita el conflicto. Y cuando dos ramas cambian las mismas líneas, Git seguirá exigiendo una resolución. La paralelización sirve cuando hay independencia real, no cuando disimula dependencias.

## Del prompt al PR: donde aparece la diferencia de producto

El [inicio rápido oficial](https://docs.orchestrator.inc/quickstart/) propone una secuencia simple: añadir repositorio, lanzar una sesión, seleccionar agente, dar una tarea y seguir sus cambios. El inspector reúne datos de sesión, archivos, estado de pull request, revisiones y vista previa. No requiere introducir primero una arquitectura propia de colas.

El camino más interesante comienza después de la edición. Orchestrator consulta el estado de PR y checks y puede dirigir comentarios de revisión o errores de CI a la sesión que produjo los cambios. En su [sitio de producto](https://orchestrator.inc/) muestra un circuito de corrección: aparece un fallo, se comunica al trabajador correspondiente, el agente modifica el código y vuelve a ejecutarse el flujo de validación.

Esa conexión es una diferencia real respecto a un simple multiplexor de terminales. Si un test falla en la rama A, no interesa despertar al agente de la rama B; necesitamos el contexto de la rama A. Al mantener tarea, sesión y PR unidos, el sistema puede reducir el coste de explicar de nuevo el problema. Pero **enrutar un error no equivale a resolverlo**. Un agente puede interpretar mal el log, arreglar un síntoma o generar nuevos fallos.

Por eso separaría cuatro hitos que a menudo se confunden: «el agente terminó de escribir», «hay un PR», «CI pasa» y «el cambio está listo para publicar». Cada hito requiere evidencia distinta. Los dos primeros describen actividad; el tercero depende de controles ejecutados; el cuarto puede necesitar pruebas manuales, criterios de producto y comprobar qué contenido terminará desplegado.

### ¿Y los agentes revisores?

La plataforma documenta la posibilidad de lanzar agentes que revisen un PR y devuelvan comentarios. El patrón puede ser valioso cuando un revisor busca casos límite, seguridad, accesibilidad o inconsistencias con la especificación. No lo usaría como aprobación final automática: una revisión hecha por otro modelo puede compartir los mismos puntos ciegos del agente que implementó.

Una estrategia prudente consiste en usar el revisor como **filtro preliminar**: localizar riesgos, pedir tests y acotar el diff. La decisión de fusionar se toma después de revisar cambios críticos y comprobar CI. Si se configura una automatización para iterar sobre feedback, debe existir límite de reintentos; de lo contrario, un fallo intermitente puede consumir cuotas y producir una larga cadena de commits innecesarios.

## Un protocolo SDD ligero aplicado a Orchestrator

La herramienta se entiende mejor con una tarea concreta que con una demo de veinte agentes. Imaginemos que necesitas añadir un selector de idioma a una web. No tiene sentido lanzar tres trabajadores antes de averiguar cómo funciona la internacionalización existente. El flujo razonable es **revisión del código → decisiones → plan → implementación → verificación → cierre**.

Al abrir la tarea, pediría al primer agente que identifique rutas, componentes reutilizables y tests actuales. Después revisaría un plan breve: qué se cambia, qué no se cambia y cómo sabremos que funciona. Solo entonces dividiría en dos sesiones realmente independientes si el cambio lo permite. Por ejemplo, una podría preparar pruebas de navegación y otra implementar el componente, siempre que no compitan por los mismos archivos.

El contrato inicial importa más que la cantidad de trabajadores. Una instrucción útil podría ser: «mantén el sistema visual actual, no añadas dependencias, conserva las URL existentes, cubre navegación por teclado y no publiques sin revisar el diff». Orchestrator mantiene el progreso visible, pero **no inventa criterios de aceptación por nosotros**. Si el objetivo es vago, distribuir el trabajo solo multiplica la ambigüedad.

Antes de fusionar, comprobaría también el efecto combinado de los PR. Dos cambios pueden pasar CI por separado y romperse al integrarse en `main`. La relación entre sesiones ayuda a gestionarlos; no evita que haya que volver a comprobar la rama resultante. Y, cuando el proyecto publica a otro repositorio, la revisión debe incluir los artefactos que salen de la frontera privada, no solo que Astro compile.

## Revisión visual y observabilidad: ver no es verificar

Orchestrator incorpora inspector de archivos cambiados, terminal y vistas de navegador asociadas a sesiones. En desarrollo web esto puede eliminar bastante fricción: ves qué agente trabaja sobre una pantalla, abres su preview y respondes con una indicación contextual. La alternativa tradicional es recordar qué puerto corresponde a qué checkout y cambiar continuamente de ventana.

Para evaluar la utilidad de esa preview, mediría tareas concretas: localizar un problema de overflow en móvil, comprobar foco de teclado, detectar una traducción cortada y asegurarse de que la consola no muestra errores. Un navegador integrado es una superficie de observación; su existencia no garantiza que la prueba visual se haya hecho correctamente.

La observabilidad tampoco debería reducirse a una lista de mensajes. Necesitamos saber qué comandos ejecutó cada agente, con qué directorio de trabajo, qué cambios produjo, qué pruebas corrió y qué comprobaciones no llegó a ejecutar. Si falla una integración con GitHub, conviene distinguir «el agente no terminó» de «terminó, pero la app no pudo recuperar el estado del PR».

Un detalle especialmente práctico es mantener el nombre de la tarea y de la rama reconocible. «Arreglar cositas» no permite reconstruir nada dos semanas después. «Corregir overflow en cabecera de móvil» y `fix/mobile-header-overflow` sí. Una buena interfaz no arregla una mala disciplina de trabajo, aunque puede reforzar una buena.

## Móvil y trabajo remoto: comodidad con fronteras claras

La propuesta móvil no consiste en compilar el proyecto en el teléfono, sino en **supervisar el daemon que ejecuta los agentes en el ordenador**. La documentación de [Connect Mobile](https://docs.orchestrator.inc/configuration/remote-access/) describe un emparejamiento mediante código QR y un listener separado que se habilita explícitamente. El código de emparejamiento contiene información sensible y debe tratarse como una credencial.

Hay una advertencia técnica decisiva: la API principal del daemon escucha en `127.0.0.1` y **no tiene autenticación para exposición pública**. La documentación insiste en que no debe publicarse mediante un proxy inverso, apertura de puerto o `tailscale serve`. La conexión móvil utiliza otra superficie autenticada, no una excepción a esta regla.

En una LAN fiable, el móvil puede conectarse al listener correspondiente. Para acceso exterior, el producto documenta alternativas de túnel seguro, con limitaciones específicas por plataforma. También advierte de que la compatibilidad de los extremos Tailscale brutos con iOS y Android no debe darse por sentada. Mi regla sería probar el emparejamiento y la reconexión en una red de ensayo antes de basar una automatización nocturna en él.

La distinción entre **cerrar una ventana**, **detener un daemon** y **apagar el ordenador** sigue siendo esencial. Un proceso local puede continuar si el cliente desaparece y el host permanece encendido; no puede continuar si el sistema suspende su ejecución. Las sesiones en la nube son otra modalidad, con capacidades y costes diferentes. Ninguna de esas situaciones debe mezclarse en una tabla con un simple «funciona en móvil: sí».

## Seguridad y privacidad: local no significa invisible

La [arquitectura](https://docs.orchestrator.inc/architecture/) está concebida para un usuario local. Esto simplifica el modelo, pero también concentra permisos. Los agentes ejecutan herramientas con la identidad y las credenciales configuradas en el host. Si el usuario puede leer un secreto o hacer un `git push`, un agente mal configurado podría intentar esas acciones. La interfaz de supervisión no reemplaza una política de mínimos privilegios.

Comenzaría siempre con un repositorio de prueba sin claves, acceso de red limitado al necesario y revisión explícita antes de operaciones destructivas. Los errores más costosos no suelen ser sintácticos: el agente puede trabajar en la rama equivocada, alterar archivos ignorados, publicar un token desde una configuración o hacer un cambio técnicamente válido que viola un requisito de privacidad.

También hay que mirar la telemetría. La [FAQ oficial](https://docs.orchestrator.inc/faq/) indica que las versiones de producción envían datos de uso y fiabilidad a PostHog. Pueden incluir identificadores de instalación, nombres de propietarios de repositorios en GitHub, usuario de GitHub y, al iniciar sesión en Cloud, información adicional de cuenta. La documentación declara que **no incluye código fuente ni contenido de las conversaciones** y explica cómo desactivarla desde los ajustes de privacidad.

Eso no equivale a afirmar que una instalación local sea anónima o que no salga ninguna petición de red. Los modelos externos reciben el contexto que su harness les envía, GitHub recibe las acciones autenticadas, los túneles pueden tener su propia política y el sistema de analítica es un canal adicional. Cada ruta de datos se debe evaluar de forma independiente.

## Costes: la aplicación gratuita no regala inferencia

El código local está disponible con licencia [Apache 2.0](https://github.com/OrchestratorInc/agent-orchestrator) y la página oficial presenta la ejecución local como gratuita. Los costes de proveedores de modelos y las cuotas de suscripciones siguen siendo externos. Si abres cuatro agentes de pago en paralelo, multiplicas capacidad de trabajo, pero también puedes multiplicar consumo de tokens y tiempo de revisión.

Orchestrator también comercializa servicios de ejecución en la nube. La [página específica de precios](https://orchestrator.inc/pricing/) anuncia planes Free, Starter y Pro, además de opciones de mayor escala. **La portada y la página de precios muestran actualmente cifras y límites no totalmente coincidentes** para algunas capacidades; por eso no utilizaría sus cantidades de agentes, horas o dispositivos como una garantía contractual sin revisar el plan dentro de la aplicación.

El cálculo interesante no es «cuánto cuesta la licencia», sino «cuánto trabajo validado consigue por euro y por minuto de atención». Un agente barato que crea tres PR que después hay que rehacer puede resultar más costoso que una sola sesión bien guiada. También influye el coste de revisar el propio sistema de orquestación: instalar integraciones, manejar credenciales, reparar sesiones rotas y resolver compatibilidades con nuevas versiones de los CLIs.

No he ejecutado un benchmark de uso, estabilidad ni rendimiento. Las recomendaciones de este artículo proceden de la arquitectura y las funciones documentadas, no de una supuesta semana de pruebas reales. Es una frontera importante: conocer el diseño permite formular una hipótesis; medir resultados permite aceptarla o rechazarla.

## Cómo lo probaría durante una semana sin autoengañarme

Prepararía una copia desechable de un proyecto con cinco tareas: un bug reproducible, un cambio de accesibilidad, una prueba rota, una pequeña feature y un refactor con comportamiento congelado. Cada tarea tendría tests de aceptación, límite de alcance y estado Git inicial. Repetiría exactamente el mismo conjunto en las herramientas comparadas.

Mediría **porcentaje de tareas aceptadas**, minutos de supervisión, minutos de revisión posterior, regresiones introducidas, tiempo de recuperación tras un check fallido y coste estimado de inferencia. Guardaría el diff final junto a los logs que permitan explicar lo sucedido. No consideraría un «PR creado» como éxito si los tests fallan o el código no cumple la especificación.

Haría dos experimentos adicionales. El primero: lanzar dos tareas que toquen archivos distintos y observar si el paralelismo aporta tiempo útil. El segundo: forzar deliberadamente un conflicto en la misma zona de código y comprobar cómo lo expone el sistema. La herramienta que mejor enseñe un conflicto y facilite resolverlo puede ser más valiosa que la que lo esconda tras una tarjeta elegante.

La prueba móvil también necesita criterios: conectar desde Android, responder a una pregunta, recuperar una sesión tras perder cobertura y confirmar que ninguna API no autenticada queda accesible. Compararía el flujo con el servidor encendido y con el host suspendido. Solo después decidiría si sustituir mi forma actual de trabajar merece el coste de cambio.

## Las preguntas que quedan abiertas

La primera es la compatibilidad de los adaptadores. Un catálogo enorme exige mantener versiones, flujos de autenticación y formatos de actividad cambiantes. Si un agente introduce una API nueva, la app puede tardar en aprovecharla. Conviene comprobar en el catálogo oficial **qué modalidad soporta la versión concreta** que vamos a usar, no inferirla del logotipo.

La segunda es el orden de los merges. Dos agentes trabajando bien por separado pueden causar un fallo al integrar. Necesitamos una política de actualización de ramas, resolución de conflictos y repetición de CI sobre el estado final. La tercera es la recuperación ante fallos: ¿qué ocurre si el daemon se reinicia mientras una terminal está esperando permisos? ¿Se recupera toda la conversación o solo el hecho de que hubo una sesión?

La cuarta es la frontera de publicación. Para un portfolio con repositorio de desarrollo privado y espejo público, ningún orquestador debería saltarse el proceso de build y sincronización. Un agente que tenga permisos para abrir PR no necesita permisos para copiar indiscriminadamente todos los archivos del repositorio privado a una web pública.

Por último, está la ergonomía. Cuanto más sofisticado es un cockpit, más tentador resulta pasar el día clasificando tarjetas, comparando agentes y mirando métricas. El éxito no es ver un tablero lleno de actividad: es cerrar tareas pequeñas con cambios comprobados y sin perder tiempo en la interfaz.

## Fuentes y lecturas adicionales

- [Orchestrator.inc — sitio oficial](https://orchestrator.inc/) y [documentación](https://docs.orchestrator.inc/).
- [Arquitectura del daemon, SQLite y controladores](https://docs.orchestrator.inc/architecture/), [Quickstart](https://docs.orchestrator.inc/quickstart/) y [plataformas](https://docs.orchestrator.inc/platforms/).
- [Acceso móvil y seguridad de los listeners](https://docs.orchestrator.inc/configuration/remote-access/), [FAQ de privacidad](https://docs.orchestrator.inc/faq/) y [precios](https://orchestrator.inc/pricing/).
- [Repositorio de Orchestrator, licencia y releases](https://github.com/OrchestratorInc/agent-orchestrator).
- [Orca: funcionalidades y licencia](https://github.com/NickRisky/orca_ade).
- [OpenChamber: documentación de sesiones, Multi-run y Git](https://docs.openchamber.dev/) y [repositorio](https://github.com/openchamber/openchamber).
- [Paseo: documentación de orquestación](https://paseo.sh/docs/orchestration), [instalación y daemon](https://paseo.sh/docs) y [seguridad de relay](https://paseo.sh/docs/security).

## Comparativa final: Orchestrator.inc frente a Orca, OpenChamber y Paseo

La comparación correcta no es «cuál tiene más agentes» ni «cuál tiene el dashboard más llamativo». Los cuatro productos se sitúan **entre el programador y sus agentes**, pero enfatizan distintos momentos del trabajo. Aquí comparo capacidades **documentadas al 26 de octubre**, no estabilidad medida, velocidad de generación ni una matriz certificada de todas las versiones.

| Criterio | Orchestrator.inc | Orca | OpenChamber | Paseo |
| --- | --- | --- | --- | --- |
| Centro de gravedad | Tarea → worktree → PR → CI → revisión | Entorno de desarrollo con agentes paralelos, terminal y editor | Cockpit visual sobre OpenCode | Daemon y orquestación multiproveedor/multidispositivo |
| Agentes | Diversos harnesses; capacidades variables | CLI de numerosos proveedores | Ecosistema OpenCode y sus proveedores/modelos | Claude Code, Codex, OpenCode y otros vía integraciones |
| Trabajo paralelo | Sesiones asociadas a worktrees | Worktrees y comparación de soluciones | Worktrees y Multi-run/Fusion | Worktrees y delegación entre agentes |
| Git y revisión | Especial énfasis en PR, checks y feedback | PR, comentarios en diffs e integración de tareas | Diff, walkthrough, Git y PR | Diffs, PR y terminal dentro del entorno |
| Uso desde móvil | Cliente emparejado con daemon de escritorio | Aplicación compañera | Web/móvil/PWA según instalación | Cliente móvil completo, web y CLI |
| Host remoto | Host local, listener autenticado separado y Cloud opcional | Worktrees y terminal SSH documentados | OpenCode remoto, túneles y conexiones | Daemon headless, Docker y relay E2E opcional |
| Mejor encaje | Ciclo de entrega con PR y CI | IDE/cockpit cómodo para editar y comparar | Quien ya trabaja con OpenCode | Quien busca portabilidad entre máquinas y proveedores |

### Orchestrator.inc contra Orca: entrega o experiencia de desarrollo

[Orca](https://github.com/NickRisky/orca_ade) declara una propuesta de **ADE**, *agentic development environment*. Su documentación destaca terminales con divisiones, editor, anotaciones sobre diffs, vista de Chromium para identificar elementos visuales, uso de SSH y la posibilidad de enviar una misma tarea a varios agentes y comparar resultados. Si pasas el día editando, explorando interfaces y alternando terminales, esa ergonomía puede aportar más que una automatización adicional del ciclo de PR.

Orchestrator apuesta por que el trabajo tenga una trayectoria hasta revisión y CI. Para alguien con muchos PR abiertos, ese hilo continuo puede ser más útil que un editor más completo. No afirmaría que Orca carece de revisión ni que Orchestrator impide trabajar desde terminal: ambos cubren parte del espacio del otro. **La distinción es de prioridad de producto**. Elegiría Orca si lo que me frena es manejar varios contextos de desarrollo; probaría Orchestrator primero si lo que se me escapa son los checks, las revisiones y los cambios pendientes de fusionar.

### Orchestrator.inc contra OpenChamber: diversidad de harnesses o profundidad de OpenCode

[OpenChamber](https://docs.openchamber.dev/) se presenta principalmente como entorno visual para **OpenCode**. Dispone de sesiones por worktree, Multi-run para comparar modelos, Fusion para combinar enfoques, objetivos de sesión, lectura guiada de diffs, terminales, Git y acceso remoto. No debe reducirse a «una pantalla de chat». Su especialización permite desarrollar funciones muy integradas con el flujo de OpenCode.

Orchestrator incorpora una selección de harnesses más heterogénea y dedica mucha atención a la relación entre sesiones, PR y CI. Si mi entorno estable es OpenCode y necesito control granular del modelo y del flujo visual, OpenChamber puede ser una opción más natural. Si alterno Claude Code, Codex y otros agentes y quiero que todos aparezcan en un único tablero de entrega, Orchestrator tiene una propuesta especialmente coherente. La contrapartida es que **multiproveedor no significa paridad completa** entre agentes.

### Orchestrator.inc contra Paseo: seguimiento del PR o independencia del dispositivo

[Paseo](https://paseo.sh/docs/orchestration) también orquesta agentes de múltiples proveedores y permite lanzar trabajadores en diferentes worktrees y máquinas. Su diseño de daemon separado, CLI, interfaz web, app móvil y relay opcional cifrado extremo a extremo resulta atractivo para un mini PC Linux que ejecuta los procesos y un portátil o teléfono desde los que se supervisa el trabajo. Hay una guía para ejecutar el daemon sin escritorio e incluso con Docker.

Orchestrator también tiene daemon, móvil y opciones remotas, pero su propuesta editorial más fuerte es el **circuito de PR, revisiones y corrección de fallos de CI**. Paseo destaca por la flexibilidad de despliegue y la continuidad entre clientes. Quien necesite un servicio headless en un servidor propio debería evaluar Paseo primero; quien trabaje sobre todo en un escritorio y quiera perseguir cada PR hasta estar listo para fusionarse debería probar Orchestrator. Y en ambos casos hay que revisar la autenticación real de los endpoints, no fiarse del rótulo «local».

### Qué elegiría para un desarrollador independiente

Si tuviera que escoger una herramienta **por escenario**, tomaría esta decisión provisional: **Orchestrator.inc** para un flujo con múltiples PR y GitHub Actions; **Orca** para una experiencia diaria de editor, terminales y agentes en paralelo; **OpenChamber** para un usuario centrado en OpenCode que quiera experimentar con Multi-run y Fusion; **Paseo** para un host Linux permanente y control completo desde escritorio, navegador y Android.

No le daría una puntuación de 9,8/10 a ninguna sin pruebas comparables. Las cuatro prometen ahorrar atención; las cuatro pueden añadir complejidad. Haría una prueba de dos tareas reales antes de migrar mi flujo y mantendría siempre el mismo criterio de terminado: diff revisado, tests relevantes en verde, límites de privacidad respetados y despliegue verificado cuando corresponda.

**La herramienta ganadora no es la que mantiene más agentes ocupados: es la que me permite dejar de vigilarlos sin perder control sobre lo que publican.**
