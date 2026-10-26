---
title: "SlopCodeBench: los agentes siguen rompiendo código"
description: "Revisa SlopCodeBench de octubre de 2026: resultados de Astra y Opus, costes de XHigh, regresiones y qué cambiar en tu flujo con agentes."
pubDate: 2026-10-26
lastmod: 2026-10-26
author: "ArceApps"
keywords: ["SlopCodeBench","GPT-6 Astra","Opus 5.5","coding agents","regression testing"]
canonical: "https://arceapps.com/es/blog/slopcodebench-october-coding-agents/"
heroImage: "/images/slopcodebench-october-coding-agents.svg"
tags: ["AI Agents", "Benchmark", "Software Quality", "Coding"]
reference_id: "c3efaf9a-61fc-4766-bc59-7c18da8c90de"
---

Un agente de programación puede resolver una tarea aislada y aun así ser un mal compañero para mantener una aplicación durante meses. La prueba difícil no es añadir una función desde cero; es modificar un programa que ya funciona, incorporar nuevas condiciones y conservar todo lo anterior. Ahí es donde aparecen los parches frágiles, las abstracciones innecesarias y las regresiones.

[SlopCodeBench](https://arxiv.org/abs/2603.24755) existe para medir precisamente esa degradación. El 15 de octubre de 2026, Dex Horthy publicó [una actualización del benchmark](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md) con resultados de modelos recientes. Su titular llama la atención: **GPT-6 Astra lidera la tasa estricta, Opus 5.5 obtiene resultados distintos según esfuerzo y XHigh no siempre mejora lo que hace Medium**.

La conclusión interesante no es un ranking para colgar en una pared. Es que los agentes siguen teniendo problemas para mantener garantías previas cuando los requisitos cambian. Y eso tiene consecuencias muy concretas para cualquier desarrollador independiente.

## Qué mide SlopCodeBench y por qué es diferente

El paper original, [*SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks*](https://arxiv.org/abs/2603.24755), fue presentado en marzo de 2026 por Gabriel Orlanski y colaboradores, con revisión en mayo. Define **36 problemas y 196 checkpoints**. Cada problema evoluciona por etapas: el agente escribe una solución, recibe nuevos requisitos y modifica el mismo código para satisfacerlos.

El diseño intenta evitar una limitación habitual de benchmarks de programación: las tareas de una sola ejecución no muestran si las decisiones de arquitectura iniciales facilitan o dificultan cambios posteriores. Aquí la estructura interna queda en manos del agente. Esa libertad es importante porque el mantenimiento de software depende precisamente de esas decisiones.

El benchmark estudia tanto el comportamiento observable —pruebas que pasan o fallan— como síntomas de **erosión estructural** y **verbosidad**. La erosión concentra complejidad en áreas difíciles de cambiar; la verbosidad acumula código redundante. Ninguna métrica aislada mide toda la mantenibilidad, pero juntas producen una señal más interesante que evaluar una captura del código final.

## El problema que todos conocemos: cambiar algo sin romper otra cosa

Imaginemos una app de puzzles con un generador de tableros. El primer requisito es generar partidas válidas. Después añadimos dificultad configurable. Más tarde pedimos reproducibilidad mediante semilla. Finalmente incorporamos un modo diario que debe crear el mismo puzzle para todos.

Cada paso puede pasar sus pruebas nuevas y, sin embargo, romper una propiedad anterior: un tablero imposible, una semilla que ya no es estable o una configuración que elimina la unicidad de la solución.

Un benchmark de una sola función puede aplaudir el resultado de la última petición. SlopCodeBench pregunta si **sobreviven los compromisos adquiridos en las etapas anteriores**.

Esta es la medida que de verdad importa al mantener productos reales. El software no se escribe una vez; se corrige y amplía. Una solución que luce bien en la demo pero se deteriora en la tercera modificación es una mala inversión.

## Core pass no significa strict pass

La actualización distingue dos métricas. **Core** considera aprobada la categoría central de una etapa cuando pasan todas sus pruebas no vacías. **Strict** exige superar todas las categorías pertinentes, incluidas las pruebas de **regresión**.

Esta diferencia explica por qué un mismo modelo puede presentar una tasa Core cercana al 70 % y una tasa Strict alrededor del 15 %. Puede cumplir el cambio solicitado hoy y seguir rompiendo comportamiento que antes funcionaba.

La actualización indica que las diez configuraciones completas quedaron entre **24 y 32 aprobaciones estrictas de 196 checkpoints**. La categoría Core se situó aproximadamente entre el 65,8 % y el 74,0 %.

El mensaje es incómodo: resolver la funcionalidad nueva no equivale a dejar el programa correctamente mantenido.

## Resultados de octubre de 2026

Estos son algunos resultados **reportados por HumanLayer**. Los costes se estiman para la campaña del benchmark y **no son precios de suscripción ni costes por una tarea individual**.

| Configuración | Strict | Tasa Strict | Coste estimado |
| --- | ---: | ---: | ---: |
| GPT-6 Astra XHigh | 32/196 | 16,33 % | 758,62 USD |
| GPT-6 SOL Medium | 30/196 | 15,31 % | 245,69 USD |
| GPT-6 Astra Medium | 29/196 | 14,80 % | 261,05 USD |
| GPT-6.1 SOL Medium | 29/196 | 14,80 % | 178,51 USD |
| Opus 5.5 Medium | 28/196 | 14,29 % | 193,47 USD |
| Opus 5.5 XHigh | 25/196 | 12,76 % | 817,04 USD |

La tabla es deliberadamente parcial. La publicación también incluye otras configuraciones, como Fable 5.1, GLM 5.3 y variantes adicionales de SOL. Las cifras completas están en [la fuente original](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md).

Astra XHigh logra la mayor cantidad de aprobaciones estrictas en esta campaña: **32 de 196**, equivalente a **16,33 %**. Es un avance respecto al **14,8 %** que el paper original atribuía a su mejor agente en su evaluación anterior, pero no justifica concluir que la ingeniería de software autónoma esté resuelta.

## ¿Es perjudicial usar XHigh? Lo que realmente dicen los datos

El titular original utiliza una frase provocadora: «xhigh considered harmful». Pero el contenido es mucho más matizado. Entre las parejas con campañas completas, el autor compara Medium y XHigh:

| Modelo | Strict Medium → XHigh | Multiplicador de coste |
| --- | --- | --- |
| Opus 5.5 | 28 → 25 | 4,22x |
| GPT-6 SOL | 30 → 26 | 2,11x |
| GPT-6 Astra | 29 → 32 | 2,91x |

Con **Opus 5.5** y **GPT-6 SOL**, la configuración XHigh consigue menos aprobaciones estrictas que Medium en esta muestra. Con **GPT-6 Astra**, consigue más. El coste aumenta en los tres pares.

La conclusión correcta no es «pensar más hace programar peor». Es **«aumentar el esfuerzo no garantizó más aprobaciones estrictas en estas ejecuciones»**. El propio autor advierte que realizó **una sola campaña por configuración**. Sin repeticiones no podemos separar el efecto real del esfuerzo de la variabilidad propia del agente.

Además, comparar valores absolutos de coste sin considerar la configuración del proveedor y la duración total de las ejecuciones puede inducir decisiones equivocadas. Una diferencia de tres checkpoints entre opciones no debe presentarse como una victoria universal.

## La metodología impide varios atajos narrativos

La publicación documenta un catálogo fijado en la versión 1.0, el prompt estándar denominado *just-solve*, semilla 42, política de aprobación *any-case* y entorno Docker con Python 3.12 y uv. Cada checkpoint parte del código producido en los anteriores. Algunas tareas tienen más checkpoints que otras, y todos pesan igual en la tasa.

Son decisiones que conviene conocer antes de interpretar la tabla. Los resultados de subconjuntos anteriores —por ejemplo, seis problemas en lugar de treinta y seis— no son directamente comparables con esta campaña completa.

Una ejecución aislada también deja abiertas dudas de estabilidad estadística. Si un agente es sensible al orden de archivos, a una búsqueda externa o a pequeñas variaciones, su resultado puede cambiar sin que modifiquemos su capacidad de fondo. Este benchmark es valioso, pero no autoriza a ignorar la incertidumbre.

## El dato más preocupante no es el porcentaje de la tabla

La actualización analiza también el estado **final** de cada problema. Para Astra XHigh, reporta **3 checkpoints finales estrictamente correctos de 36** y **1.435 casos de test fallidos** en las evaluaciones finales, de los cuales **1.178** pertenecen a regresiones.

No hay que confundir «1.435 casos fallidos» con «1.435 bugs independientes»: varios tests pueden detectar una misma causa. El propio estudio aclara esa diferencia. Pero las cifras ponen el dedo en la llaga: un agente puede ir superando partes del ejercicio sin acabar con un sistema completamente sano.

En tareas reales el resultado final importa tanto como el camino. No quiero celebrar que un agente completó la nueva pantalla si dejó roto el sistema de navegación anterior.

## El código innecesario también cuenta

Un punto especialmente interesante de la publicación es que HumanLayer decide no excluir automáticamente todo el código temporal y los artefactos que dejan los agentes. Si el agente ensucia el repositorio, ese comportamiento forma parte del trabajo que recibimos.

El análisis de calidad se limita a **28 problemas comunes** porque en ocho la herramienta de escaneo no pudo medir completamente determinados archivos. Esto es importante: las métricas de calidad no se calculan sobre los mismos treinta y seis problemas que la campaña funcional.

El escáner marca patrones de código problemático y repeticiones, y calcula la fracción de líneas afectadas sin contar varias veces una línea que active varias reglas. Es un indicador de presencia de patrones, **no una puntuación universal de calidad de código**.

Con la metodología aplicada, Opus 5.5 XHigh registra **77,75 %** de presencia de patrones marcados frente a **94,25 %** para Opus Medium. El porcentaje resulta muy alto en ambos casos y depende de los criterios del escáner. La publicación matiza que las reglas pueden no captar las nuevas formas de mala mantenibilidad que introduzcan modelos más recientes.

Un número tan llamativo necesita contexto. No significa que el 94 % del código sea inutilizable ni que una herramienta haya demostrado qué porcentaje exacto está «mal». Significa que, bajo esa batería de comprobaciones, esas proporciones de líneas activan alguna regla.

## Menos complejidad ciclomática no siempre es mejor

El informe compara también complejidad y volumen. Un agente puede bajar la complejidad media dividiendo una función en decenas de helpers diminutos. Eso no garantiza que el programa sea más sencillo de entender.

Del mismo modo, menos líneas no siempre implica mejor solución. Una función compacta y críptica puede ser peor que dos funciones explícitas; eliminar pruebas para reducir código sería una pérdida evidente.

En mantenimiento, prefiero medir aspectos concretos: tiempo necesario para modificar una regla, cantidad de regresiones, duplicaciones semánticas, nombres comprensibles y coherencia con la arquitectura existente. Los linters y las métricas ayudan a encontrar señales, pero el juicio sobre el diseño necesita contexto.

## Una política práctica para programar con agentes

Si tuviera que extraer una consecuencia inmediata para mi flujo de trabajo, sería esta: **no elijas esfuerzo máximo por defecto y no aceptes una feature solo porque los tests nuevos pasan**.

Organizaría las tareas por dificultad. Para cambios pequeños, usaría un modo intermedio con instrucciones precisas y tests existentes. Para una migración compleja, podría justificar más razonamiento, pero evaluaría su rendimiento real. En ambos casos mantendría una regla: comprobar que sigue funcionando lo que ya existía.

También pediría al agente que revise el diff y elimine archivos temporales, código muerto o abstracciones innecesarias. Esa limpieza no es cosmética; reduce trabajo de mantenimiento posterior.

Por último, evitaría que el agente mida su propio éxito solo con una explicación final. La fuente de verdad debe ser una suite de comprobaciones externa al modelo y, cuando corresponde, una revisión visual.

## Cómo haría mi propio benchmark pequeño

No necesito reproducir 36 problemas y 196 checkpoints para aprender algo útil. Puedo escoger tres errores que ya he corregido en mis aplicaciones y representar cada uno mediante una secuencia de requisitos.

Por ejemplo, una pantalla con texto adaptable: primero corregir el desbordamiento, después añadir traducciones largas, luego mejorar navegación con teclado y finalmente comprobar móvil y escritorio. Cada nuevo paso debe preservar los anteriores.

Probaría dos configuraciones de esfuerzo y el mismo harness. Usaría el mismo commit inicial y repetiría la secuencia varias veces, pues una ejecución por opción no basta para identificar una tendencia robusta. Guardaría el diff, coste, duración, tests y fallos de regresión.

Si XHigh mejora sistemáticamente el último checkpoint en tareas complejas, tendría un motivo para utilizarlo allí. Si solo cuesta más sin cambiar el resultado, preferiría Medium. La respuesta debe venir de nuestra carga real.

## El harness también influye

En [Harness Engineering: el wrapper que gana](/es/blog/harness-engineering-wrapper-gana/) ya argumenté que las herramientas y el contexto pueden cambiar el resultado tanto como el modelo. Y [Harness²](/es/blog/harness2-recursive-agent-harnessing/) lleva esa idea a la mejora experimental del propio entorno.

SlopCodeBench recuerda que los modelos no actúan en el vacío. Sus resultados reflejan **configuraciones completas**: modelo, esfuerzo, prompt, runner, herramientas y entorno. Cambiar la política de verificación puede alterar la cantidad de regresiones, incluso con los mismos pesos.

Por eso no convertiría esta tabla en una clasificación de inteligencia general. La utilizaría para diseñar evaluaciones mejores y para desconfiar de un sistema que se declara acabado sin demostrar estabilidad.

## Qué significa esto para un desarrollador independiente

La primera promesa de los agentes es ahorrar tiempo. Pero una regresión difícil, un archivo temporal publicado por accidente o una abstracción imposible de mantener pueden devolvernos esa deuda multiplicada.

Un buen agente debe hacer el trabajo **y dejarlo mantenible**. El benchmark nos ayuda a recordar que esas dos condiciones son distintas. También muestra que gastar más en razonamiento no sustituye un buen sistema de pruebas.

La decisión práctica no es escoger de una vez por todas el modelo ganador. Es diseñar un proceso que detecte cuándo el resultado dejó de ser confiable.

## Por qué las regresiones aparecen aunque el agente escriba código razonable

Una regresión no siempre procede de una decisión absurda. A menudo nace de un cambio local que parece correcto porque el agente no mantiene un mapa completo de los contratos anteriores. Reutiliza una función, modifica una condición y resuelve el nuevo caso, pero olvida una situación excepcional que dependía de la lógica original.

También influye la arquitectura. Si los requisitos se acumulan en una única función, cada ampliación añade otra rama y aumenta la cantidad de estados posibles. Si cada cambio produce una abstracción nueva sin eliminar duplicación anterior, el proyecto termina con varias fuentes de verdad.

Un benchmark iterativo es útil porque expone ambos problemas a lo largo del tiempo. El agente puede superar la primera etapa con una estructura aparentemente elegante y descubrir más tarde que no permite introducir la nueva función sin reescribir buena parte del código.

La solución no consiste únicamente en pedirle que «programe más limpio». Necesitamos identificar invariantes, diseñar pruebas que las representen y tratar los cambios posteriores como modificaciones a un sistema de contratos ya existente. Un buen harness puede ayudar a recordarlo, pero no sustituye esas pruebas.

## Cómo diseñaría pruebas que sobrevivan a requisitos cambiantes

Antes de modificar una feature, registraría qué comportamientos actuales no deben cambiar. Para una herramienta que exporta archivos, por ejemplo, conservaría muestras de entrada y salida que cubran caracteres internacionales, archivos vacíos y casos límite. Al añadir un nuevo formato, comprobaría tanto la exportación nueva como los formatos anteriores.

Ese conjunto de pruebas debería crecer cuando descubrimos un bug real. Si alguna vez el sistema interpretó mal una fecha o perdió un carácter, la corrección tendría que dejar un test de regresión. Así evitamos volver a pagar por el mismo fallo.

También dividiría las verificaciones. Las pruebas unitarias comprueban funciones concretas; las de integración detectan incompatibilidades entre componentes; las pruebas de comportamiento validan flujos completos; y los controles visuales sirven para interfaces donde un test funcional puede pasar a pesar de un layout roto.

No es necesario ejecutar cada comprobación cara en cada edición menor. Sí es necesario asegurarse de que **la revisión final** cubra las garantías relacionadas con los cambios. La política exacta depende del proyecto y de sus CI existentes.

## El coste real incluye reparar el resultado

Los costes publicados por HumanLayer corresponden a campañas de benchmark. Pero el coste económico que me importa como desarrollador tiene más componentes. Una ejecución barata puede exigir después horas de revisión; una opción cara puede salir rentable si reduce regresiones. También puede ocurrir lo contrario.

Para comparar opciones de forma útil calcularía algo parecido a:

~~~text
coste de tarea verificada =
  coste del agente
+ coste de ejecutar pruebas
+ tiempo humano de revisión
+ coste de corregir fallos introducidos
~~~

No hace falta convertir cada hora a una tarifa exacta para aplicar la idea. Basta con registrar cuánto tardamos en conseguir una solución aceptable, no cuánto tardó el modelo en responder por primera vez.

En ese sentido, una tasa Core alta junto con una Strict baja es una alerta operativa: si el cambio nuevo funciona pero aparecen regresiones, el trabajo de reparación se desplaza a la persona que mantiene el proyecto.

## El criterio de parada de un agente importa

Un agente puede decir «he terminado» después de ejecutar una única prueba favorable. Pero una tarea debería tener un criterio de cierre explícito: requisitos satisfechos, tests relevantes en verde, revisión del diff y ausencia de cambios fuera de alcance.

Cuando un test falla, el sistema no debería limitarse a explicar que el fallo «parece no relacionado». Debe comprobar si es anterior o posterior al cambio, reproducirlo cuando sea posible y documentar su impacto. Un fallo conocido requiere una decisión informada; no desaparece porque el agente lo etiquete de irrelevante.

La capacidad de **detenerse de forma honesta** también es una característica de calidad. Prefiero un agente que diga «la migración funciona pero no he podido verificar el caso de actualización» a otro que asegure que todo está perfecto basándose en dos pruebas.

SlopCodeBench ofrece un recordatorio cuantitativo de por qué necesitamos esa disciplina: el último estado del programa puede acumular problemas que no quedan reflejados en una impresión superficial de éxito.

## No buscaría un campeón universal de modelos

Hay tareas que se benefician de planificación profunda y otras donde añadir más pasos solo retrasa el resultado. Las diferencias entre Medium y XHigh pueden variar con el lenguaje, el tamaño del repositorio, las herramientas y el tipo de requisito.

Por ello definiría perfiles de trabajo, no una jerarquía inmutable de marcas. Una corrección CSS pequeña, una migración de arquitectura y la investigación de un fallo no reproducible necesitan estrategias distintas.

Antes de cambiar un modelo por otro, revisaría si el agente tiene buen acceso al proyecto, instrucciones coherentes y verificadores útiles. Si no, un modelo mejor puede seguir repitiendo el mismo tipo de error.

Los benchmarks son mapas parciales del terreno. Sirven para plantear buenas preguntas y detectar debilidades. Las decisiones finales deberían basarse en un conjunto de pruebas que represente nuestros propios riesgos y prioridades.

## Conclusión

La actualización de octubre de SlopCodeBench ofrece señales interesantes sobre Astra, Opus y las configuraciones de esfuerzo, pero su hallazgo más importante es menos vistoso: **la regresión acumulada sigue siendo uno de los problemas centrales de los agentes de código**.

No usaría la expresión «XHigh es perjudicial» como regla universal. Sí usaría estos datos para cuestionar la costumbre de pagar automáticamente por el máximo esfuerzo y para reforzar los controles que protegen comportamiento anterior.

### Referencias

- [HumanLayer — SlopCodeBench, actualización de octubre de 2026](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md).
- [Orlanski y colaboradores — SlopCodeBench, paper](https://arxiv.org/abs/2603.24755).
- [SlopCodeBench — web del benchmark](https://www.scbench.ai/).
- [Harness Engineering: el wrapper que gana](/es/blog/harness-engineering-wrapper-gana/).
- [Harness²: mejora recursiva del harness](/es/blog/harness2-recursive-agent-harnessing/).

En programación, la victoria no es que el agente termine una tarea. Es que podamos volver al proyecto mañana sin descubrir que la solución de ayer rompió tres cosas más.