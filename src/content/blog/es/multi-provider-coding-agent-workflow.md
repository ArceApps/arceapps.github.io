---
title: "OpenCode y Claude Code: de una tarea a una PR"
description: "Diseña un flujo de desarrollo con varios agentes: planificación, implementación en OpenCode, revisión independiente, GitHub Actions y PR verificable."
pubDate: "2026-11-14"
lastmod: "2026-11-14"
author: "ArceApps"
keywords: ["OpenCode","Claude Code","multi-agent workflow","GitHub Actions","pull request","coding agents"]
canonical: "https://arceapps.com/es/blog/multi-provider-coding-agent-workflow/"
heroImage: "/images/multi-provider-coding-agent-workflow.webp"
tags: ["IA","Agentes","OpenCode","Claude Code","GitHub Actions"]
category: "ai-agents"
reference_id: "f6143393-a010-487a-99b2-116fcbe8fbd2"
---

> **Serie «Orquestación de agentes sin depender de un proveedor», entrega 4 de 5.** En capítulos anteriores separamos [ChatGPT y el ejecutor OpenCode](/es/blog/chatgpt-desktop-agent-orchestration/), estudiamos [Claude Desktop como cliente MCP](/es/blog/claude-desktop-external-coding-agents/) y comparamos [MCP, ACP y A2A](/es/blog/mcp-acp-a2a-agent-protocols/). Hoy toca responder la pregunta más incómoda: **¿qué mejora realmente al delegar una tarea entre agentes de distintos proveedores?**

## El experimento: de un problema concreto a una PR revisable

En lugar de imaginar un «equipo de IA» con veinte roles, usaré un flujo pequeño y verificable: analizar un bug, redactar criterios de aceptación, implementar un parche, pedir una revisión independiente y abrir una pull request. La app de ejemplo es una web con un formulario que permite pulsar dos veces el botón de envío y crear solicitudes duplicadas. El bug es ficticio para explicar un procedimiento reproducible; **no presento resultados de ejecución ni un repositorio de prueba completado**.

El objetivo no es demostrar que ChatGPT supera a Claude o viceversa. Queremos saber si separar responsabilidades permite encontrar defectos antes, hacer cambios más focalizados y dejar una trazabilidad que una conversación única no ofrece. Si la coordinación añade más horas de supervisión de las que ahorra, no merece la pena. El criterio de éxito tiene que ser una PR que cualquier desarrollador pueda revisar, no una narración entusiasta del agente coordinador.

Empezaría con solo tres roles: **planificador**, **implementador** y **revisor**. El planificador puede ser ChatGPT o Claude Desktop según capacidades y preferencias. El implementador puede ser OpenCode con un modelo de OpenRouter. El revisor puede utilizar Claude Code u otro ejecutor independiente. Los roles no son alias de modelos: cada uno tiene acceso, contexto, salida y momento de intervención diferentes.

## Un contrato de trabajo antes de lanzar nada

Una petición como «arregla los duplicados» no dice qué es un duplicado, dónde aparece ni qué casos deben preservarse. Antes de delegar, el planificador debe producir una especificación mínima que el implementador pueda ejecutar sin reinterpretar el problema a su conveniencia. Esa especificación no es una novela, sino una lista comprobable de comportamientos esperados.

~~~yaml
task: prevent-duplicate-form-submit
repository: example-web
base: main
scope:
  - src/components/ContactForm.tsx
  - src/components/ContactForm.test.tsx
acceptance:
  - "Un segundo clic mientras hay envío pendiente no envía otra petición"
  - "Un error permite volver a intentar el envío"
  - "Teclado y lector de pantalla mantienen un estado accesible"
constraints:
  - "No modificar credenciales, dependencias ni workflows"
  - "No hacer merge ni desplegar"
deliverables:
  - "diff mínimo"
  - "tests ejecutados y resultado"
  - "riesgos restantes"
~~~

Esta estructura es un **ejemplo de contrato editorial**, no un esquema exigido por una herramienta concreta. El repositorio, rutas y archivos son ilustrativos; hay que adaptarlos al código real. Es importante no prometer una ruta que quizá no existe en el proyecto donde vayamos a usar el procedimiento.

Fijar el alcance ayuda a distinguir si el agente encontró una causa raíz fuera del archivo previsto. Puede proponer ampliar el ámbito, pero no debería hacerlo silenciosamente. La propuesta se devuelve como una decisión pendiente, no como un permiso implícito porque el agente escribió una justificación convincente.

## Paso uno: preparar una rama y aislar el entorno

Dos agentes que editan la misma rama en paralelo son una receta para conflictos difíciles de atribuir. Preferiría una rama por unidad de trabajo y un área de trabajo dedicada. Git ofrece \`git worktree\`, que permite mantener varios directorios asociados al mismo repositorio sin clonar todo desde cero. Para tareas que sí deben ejecutarse en paralelo, los worktrees reducen interferencias, siempre que cada uno tenga su rama.

~~~bash
git fetch origin
git switch main
git pull --ff-only
git worktree add -b fix/contact-submit ../example-web-fix main
cd ../example-web-fix
git status --short
~~~

Estos comandos son orientativos para un repositorio local limpio. Si hay cambios sin confirmar, no deben sobrescribirse con automatización. El coordinador tiene que comprobar el estado antes de modificar archivos y rechazar o pedir una estrategia explícita cuando encuentre trabajo previo. No lanzaría \`git reset --hard\` como «solución» automática a una rama sucia.

La identidad del trabajo debería quedar asociada a repositorio, commit base y rama. Así el revisor sabe qué diff tiene que inspeccionar y CI puede validar exactamente el cambio propuesto. Un agente que produce archivos sin referencia a una revisión de Git obliga al humano a reconstruir el contexto más importante.

## Paso dos: el planificador no escribe código

Daría al planificador acceso a la descripción del problema y, si hace falta, a fragmentos de código de lectura. Su salida debe definir condiciones de aceptación, riesgos, archivos probables y una comprobación mínima. No debería modificar el repositorio al mismo tiempo que el implementador, ni ejecutar comandos solo para demostrar actividad. Un rol concreto vale más que una personalidad distinta para cada agente.

En nuestro ejemplo, el planificador distinguiría entre desactivar el botón durante el envío y evitar duplicados en el servidor. Desactivar el botón puede mejorar UX, pero si la API admite peticiones repetidas o el usuario recarga la página, el riesgo de duplicación puede permanecer. El contrato de tarea debe señalar ese límite. Una solución solo de frontend no se convierte automáticamente en una garantía de idempotencia.

Otra decisión es dónde probar: un test de componente puede verificar los dos clics, pero no necesariamente confirma que un backend rechaza duplicados. Si el alcance incluye el servidor, habría que añadir una prueba de integración apropiada. Esta distinción permite que el implementador sepa qué evidencia es suficiente y qué queda fuera de alcance.

## Paso tres: delegar la implementación a OpenCode

Usaría el servicio de orquestación diseñado en el primer artículo: \`create_task\` recibe proyecto permitido, rama, objetivo, modo de modificación y una clave de idempotencia. El bridge conecta con el servidor o SDK de OpenCode. Si OpenCode utiliza OpenRouter, el modelo se selecciona en la configuración autorizada del ejecutor, no mediante texto arbitrario en la conversación.

El mensaje para el implementador debe transportar el contrato de tarea, no todo el historial del chat. Evitaría duplicar contexto irrelevante o enviar secretos. El bridge valida la rama, fija un límite de tiempo y conserva la referencia a la sesión para recuperar el resultado aunque se cierre la interfaz de ChatGPT o Claude Desktop.

~~~text
create_task(
  project_id = "example-web",
  branch = "fix/contact-submit",
  mode = "propose_patch",
  goal = "Cumple el contrato y deja un diff revisable"
)
           |
        OpenCode
           |
       archivos + tests + diff
~~~

Esta representación es **pseudocódigo de orquestación**, no una llamada directa documentada a OpenCode. La frontera de código real sigue siendo el SDK/servidor del agente. Separar estos niveles evita que un cambio de API de un proveedor obligue a rediseñar la conversación y la política de seguridad.

## Paso cuatro: revisar el diff antes de consultar otro agente

Antes de invocar a un revisor, el sistema debe obtener el diff de Git y verificar qué archivos cambiaron. Si el implementador modificó secretos, workflows, dependencias o archivos fuera del alcance autorizado, el trabajo debe detenerse. La revisión de IA no sustituye la comprobación de la superficie de cambio.

~~~bash
git status --short
git diff --check
git diff --stat
git diff -- src/components/ContactForm.tsx src/components/ContactForm.test.tsx
~~~

El comando \`git diff --check\` detecta problemas de formato como espacios al final de línea, pero no comprueba seguridad ni comportamiento. \`git diff --stat\` ofrece magnitud, no calidad. Las pruebas reales siguen siendo necesarias. Si el agente creó un commit, la comparación debe realizarse respecto al commit base, no asumir que \`git diff\` del árbol de trabajo mostrará cambios ya confirmados.

No enviaría al revisor un resumen escrito solo por el implementador. Le daría el contrato original, la referencia a Git, el diff y los resultados de CI. Así evitamos que el primer agente seleccione convenientemente qué enseñar y qué ocultar. Un revisor independiente necesita evidencia, no solo la versión narrada por su compañero.

## Paso cinco: usar Claude Code como revisor independiente

El revisor puede ser otro agente, por ejemplo Claude Code, pero debe estar limitado a **lectura y propuesta de observaciones**. Su pregunta es «¿qué podría estar mal en este parche?» y no «vuelve a escribir la funcionalidad a tu gusto». En esta fase conviene que trabaje sobre un checkout aislado o una instantánea del mismo commit, sin permisos para modificar la rama principal del implementador.

El checklist del revisor incluiría funcionalidad, casos límite, accesibilidad, seguridad, regresiones y pruebas insuficientes. El análisis de un segundo proveedor puede aportar diversidad de enfoque, pero también puede repetir los sesgos o errores del primero. No consideraría dos opiniones coincidentes como prueba matemática de corrección.

Si encuentra un defecto, el revisor devuelve una observación con ruta, línea o contexto preciso, impacto y ejemplo de reproducción. El implementador recibe una nueva tarea acotada y propone el ajuste. La orquestación debería limitar el número de rondas; permitir que los agentes discutan indefinidamente entre sí solo incrementa coste y retrasa la entrega.

## Paso seis: GitHub Actions es la autoridad para verificaciones

Cuando el código está listo, la PR debe pasar las comprobaciones que el repositorio ya ejecuta correctamente. No repetiría manualmente todos los mismos tests por tradición. GitHub Actions puede proporcionar una fuente común de evidencias: test unitarios, build, lint, análisis estático o comprobaciones visuales, según el proyecto. El coordinador registra el resultado real del workflow, no lo infiere del mensaje «todo parece bien».

~~~yaml
name: Verify proposed patch
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
~~~

Este workflow es un **ejemplo simplificado**. Solo sirve si el proyecto usa Node y pnpm y dispone de los scripts correspondientes. En el repositorio real hay que reutilizar sus Actions existentes en vez de añadir otro workflow duplicado. Si una comprobación necesita servicios externos o secretos, debe diseñarse según el modelo de seguridad de GitHub Actions; no se deben pasar credenciales a código de PR sin una revisión explícita.

La regla es simple: una respuesta del agente no cambia el estado de CI. Solo el resultado del job correspondiente puede declararlo verde. Y ni siquiera CI valida todo: UX, accesibilidad perceptual o posibles filtraciones requieren revisión adicional cuando son relevantes.

## Paso siete: abrir la PR y dejar el merge separado

La PR debería explicar qué problema soluciona, qué cambios introduce, cómo se verificó y qué riesgos quedan. Puede enlazar la issue y el identificador de tarea del orquestador si ese identificador no expone datos privados. Los commits deben ser legibles y mantener el alcance. No conviene llenar el historial con correcciones triviales de prompts si el resultado se puede presentar como un cambio coherente.

No haría merge automático por una simple respuesta «aprobado» de otro modelo. Exigiría las comprobaciones relevantes, una revisión del diff final y una autorización explícita para publicar. La distinción es importante en proyectos que despliegan desde \`main\`: fusionar una PR puede significar publicar una web, subir una app o activar cambios de infraestructura.

Una vez fusionada, el coordinador puede verificar que \`main\` contiene el cambio y que el despliegue terminó cuando forma parte de la tarea. La palabra «terminado» no debería pronunciarse antes. Una PR abierta, por muy buena que sea, no equivale a un producto actualizado.

## Las cinco decisiones que tomaría el humano

No delegaría ciegamente decisiones de alcance, credenciales, costes, cambios destructivos ni merge. El humano decide si el arreglo puede tocar el backend, si se acepta una dependencia nueva, si una llamada de modelo merece el gasto adicional, si un archivo debe borrarse y si el código se publica. El agente puede argumentar esas opciones y reunir evidencias, pero la autoridad tiene que estar clara.

Esto no convierte el flujo en una sucesión de aprobaciones absurdas. Un sistema bien diseñado puede autorizar de antemano análisis de lectura, tests locales y cambios dentro de una rama efímera. El truco es separar operaciones reversibles de operaciones con efectos de publicación o pérdida de datos.

En un proyecto pequeño, la supervisión humana debe concentrarse donde tiene valor. Si tengo que aprobar cada lectura de archivo, la orquestación será insoportable. Si el agente puede modificar \`main\` o borrar una base de datos sin intervención, el diseño es temerario. El equilibrio está en permisos por clase de operación y límites verificables.

## Contexto: transferir evidencia, no copiar conversaciones

La mayor tentación de un flujo multiagente es enviar el historial completo a cada nuevo modelo «por si acaso». Eso perjudica coste, latencia y privacidad; también arrastra decisiones antiguas que ya no son válidas. Prefiero un paquete de traspaso pequeño: objetivo, contrato, versión de Git, archivos relevantes, hechos comprobados, preguntas abiertas y artefactos.

~~~json
{
  "task_id": "task-042",
  "base_commit": "SHA_DEL_COMMIT_BASE",
  "branch": "fix/contact-submit",
  "acceptance": ["no duplicate requests", "retry after errors"],
  "artifacts": ["diff-ref", "test-report-ref"],
  "open_questions": ["backend idempotency out of scope"]
}
~~~

El ejemplo no contiene datos privados y no es un esquema oficial de MCP o A2A. Es la estructura que mantendría el servicio de orquestación, independientemente de cómo llame a los agentes. Las referencias a artefactos deberían requerir autorización; no basta con que un modelo conozca un ID para poder leer cualquier log.

Un traspaso bien diseñado ayuda también a revisar: el segundo agente recibe los mismos hechos que el primero, sin tener que confiar en que su narración fue completa. Eso puede aportar más valor que añadir un tercer modelo sin límites.

## Cómo evitar carreras y tareas duplicadas

Una petición del cliente puede repetirse por un timeout. El coordinador debe usar claves de idempotencia para que «crea una tarea» no arranque dos sesiones sobre la misma rama. Además, necesitará un bloqueo por proyecto/rama cuando la operación implique escritura. El objetivo no es serializar todas las tareas del sistema, sino evitar escrituras concurrentes conflictivas.

Si dos revisores quieren analizar el mismo commit, pueden hacerlo en paralelo porque trabajan en lectura. Si un implementador y un revisor modifican el mismo worktree, aparecerán resultados ambiguos. Para un experimento robusto, distinguiría \`analysis\`, \`propose_patch\` y \`review\` como modos con permisos diferentes.

Un trabajo interrumpido puede dejar un proceso activo o una rama a medio escribir. Antes de reintentarlo, el coordinador debería consultar el estado real de OpenCode y del repositorio. Repetir automáticamente una tarea de modificación sin reconciliación es una manera eficaz de duplicar cambios.

## Medir si realmente compensa

No daría por supuesto que usar tres agentes mejora el resultado. Compararía el flujo con una ejecución de un solo agente usando la misma tarea, repositorio base y condiciones de aceptación. Registraría tiempo total, llamadas al modelo, coste de tokens cuando esté disponible, número de revisiones, defectos encontrados antes de CI y correcciones requeridas después.

La comparación debe tener límites: un caso aislado no demuestra superioridad universal; los modelos pueden variar entre ejecuciones y el repositorio evoluciona. Por eso documentaría versiones y conservaría artefactos. Un test de regresión que falla en una variante y pasa en otra vale más que cinco párrafos elogiando la «sinergia» de agentes.

También contaría el tiempo humano dedicado a preparar, corregir y supervisar el flujo. Si la orquestación ahorra tokens pero consume una hora extra de supervisión, quizá no es rentable para un desarrollador independiente. El coste operativo no cabe entero en una factura de API.

## Riesgos que aparecerán antes de lo esperado

El primero es **autoridad confusa**. ¿Puede un agente cambiar el criterio de aceptación que escribió otro? Yo diría que no sin una revisión explícita. El segundo es **deriva de contexto**: tras varias rondas, un objetivo pequeño se convierte en una refactorización amplia. El tercero es **aprobación automática superficial**: un revisor de IA responde «LGTM» sin analizar realmente el diff.

El cuarto riesgo es la exposición de secretos al pasar logs entre proveedores. El quinto es reproducibilidad: si no registramos commit, dependencias, versión del ejecutor y modelo, una ejecución futura puede producir resultados distintos difíciles de comparar. El sexto son permisos excesivos, especialmente al conectar herramientas de GitHub que pueden crear ramas, modificar archivos y fusionar código.

Frente a esos riesgos, la estrategia útil es reducir el flujo a pocos estados y evidencias. No necesitamos un organigrama de agentes, sino contratos claros. El planificador define; el implementador propone; el revisor cuestiona; CI verifica; el humano decide publicar.

## Lecciones y siguiente capítulo

El resultado que persigo no es autonomía total. Es **delegación auditable**. Si puedo ver qué agente actuó, con qué modelo, sobre qué commit, qué diffs dejó, qué pruebas pasaron y quién aprobó la publicación, la orquestación empieza a tener sentido. Si solo obtengo mensajes cada vez más seguros de sí mismos, he añadido complejidad sin ganar control.

En el último capítulo veremos cómo enrutar modelos de OpenRouter, combinar ejecutores locales y remotos, establecer presupuestos por tarea y controlar fallbacks. Es el paso lógico: cuando una arquitectura funciona, el siguiente problema es que funcione de manera predecible y que no cueste más de lo que aporta.


## El control de calidad que no se puede delegar por completo

Un test verde es una evidencia valiosa, pero no siempre evalúa la experiencia final de un usuario. En el ejemplo del formulario, una prueba puede confirmar que el segundo clic no provoca otra petición y aun así pasar por alto que el indicador de carga no se anuncia al lector de pantalla. También puede bloquear el botón correctamente y dejar un mensaje de error imposible de interpretar. En una web real comprobaría manualmente teclado, foco, estados de error y responsive cuando la modificación los afecte.

La seguridad merece una revisión diferente del estilo de código. Si el cambio introduce peticiones idempotentes, hay que decidir dónde se genera y valida la clave, durante cuánto tiempo es válida y qué comportamiento tiene el backend ante reintentos. Estas preguntas rara vez quedan resueltas por «desactiva el botón»; sería un defecto del plan inicial, no un problema que el revisor deba descubrir por casualidad.

La privacidad de los artefactos importa también. El diff puede contener configuración interna; los logs pueden revelar tokens o identificadores. Antes de convertirlos en enlaces que el cliente conversacional pueda consultar, el coordinador debería aplicar el mismo control de acceso que en la ejecución. Un PR público puede mostrar código, pero eso no autoriza a publicar registros de depuración o capturas de entornos privados.

Por último, haría explícita la definición de terminado. No basta con que el agente diga «hecho», ni con que el revisor responda «aprobado». La condición final debe incluir diff revisado, pruebas relevantes, ausencia de errores conocidos, commits coherentes y, si la tarea requería publicar, comprobación efectiva del despliegue. Esta regla reduce los finales prematuros que tanto cuestan de detectar en un flujo automatizado.


## El coste oculto de cada traspaso

Un traspaso entre agentes tiene un coste de contexto y otro de coordinación. Si el planificador escribe diez páginas que el implementador debe leer, ya estamos pagando por producir y consumir información quizá innecesaria. Si el revisor recibe un resumen sin acceso al diff, puede aprobar errores que un humano detectaría en segundos. La solución no es minimizar todos los mensajes, sino diseñar entregables que aporten evidencias.

Usaría una plantilla breve para cada entrega: identificador de trabajo, commit exacto, objetivo, archivos afectados, pruebas y preguntas abiertas. El implementador puede adjuntar un diff y el revisor puede responder con observaciones vinculadas a ese mismo commit. Así evitamos que una discusión de varios turnos oculte qué versión de código se está evaluando.

La organización de esos artefactos debe seguir la política de privacidad del proyecto. Un enlace a una PR pública puede compartirse con libertad relativa; un log que contiene variables de entorno no. En lugar de enviar el contenido entero, el coordinador ofrece referencias autorizadas y un resumen sin secretos. Reducir datos transferidos mejora tanto el coste como la seguridad.

## Bibliografía y lecturas relacionadas

- [Git: documentación oficial de worktrees](https://git-scm.com/docs/git-worktree)
- [GitHub: comprobaciones requeridas en pull requests](https://docs.github.com/es/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [OpenCode: SDK de cliente y sesiones](https://opencode.ai/docs/sdk)
- [OpenCode: servidor HTTP](https://opencode.ai/docs/server)
- [ArceApps: protocolos MCP, ACP y A2A](/es/blog/mcp-acp-a2a-agent-protocols/)
- [ArceApps: ChatGPT Desktop y agentes](/es/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: orquestación de agentes en CI/CD](/es/blog/orquestar-agentes-pipeline-cicd/)

**Cierre.** Construiré un circuito que deje una PR revisable antes de buscar un «equipo» con diez especialistas. La mejor automatización es la que conserva la capacidad de explicar y revertir lo que hizo.
