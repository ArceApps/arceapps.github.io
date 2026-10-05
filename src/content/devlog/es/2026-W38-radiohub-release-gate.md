---
title: "RadioHub: una release no sale hasta que su SHA pasa todos los gates"
description: "Cómo RadioHub convirtió CHANGELOG, Roborazzi y GitHub Actions en un gate autocontenido que valida exactamente el commit destinado a Google Play."
pubDate: 2026-09-19
lastmod: 2026-10-05
author: "ArceApps"
keywords: ["RadioHub", "GitHub Actions", "Android", "Roborazzi", "release"]
heroImage: "/images/devlog/radiohub-release-gate.svg"
tags: ["Android", "CI/CD", "GitHub Actions", "testing", "devlog"]
draft: false
---

Una release de Android puede fallar de una forma especialmente incómoda: no porque el AAB no compile, sino porque compila algo que no debería haberse publicado. Una versión incorrecta, unas notas que no corresponden, una referencia visual desactualizada o un commit distinto del que pasó CI pueden convivir con un bundle perfectamente válido.

El 19 de septiembre RadioHub acumuló varias correcciones alrededor del proceso de publicación. Vistas por separado parecían tareas diferentes: arreglar Roborazzi, enseñar las novedades dentro de la app, validar versionName y endurecer el workflow de release. Vistas juntas contaban una historia más útil: convertir la publicación en una operación que pueda demostrar qué código está liberando y qué comprobaciones ha superado ese mismo código.

El resultado quedó repartido entre las PR [#8](https://github.com/ArceApps/RadioHub/pull/8), [#9](https://github.com/ArceApps/RadioHub/pull/9), [#10](https://github.com/ArceApps/RadioHub/pull/10) y [#11](https://github.com/ArceApps/RadioHub/pull/11). La última decisión ordenó las demás: el workflow de release no espera a que otro workflow le diga que todo está bien. Vuelve a ejecutar sus gates obligatorios sobre el SHA exacto que pretende publicar.

Ese matiz cambia la pregunta. Ya no es «¿hay un CI verde cerca de esta release?». Es «¿puedo demostrar que este SHA, con estos metadatos y estas pruebas, es el que va a Google Play?».

## Dos tipos de capturas con responsabilidades distintas

Roborazzi ya formaba parte de RadioHub. El proyecto tenía pruebas de capturas para detectar regresiones visuales, pero también generaba imágenes destinadas a marketing. Ambas cosas producen PNG y ambas pueden ejecutarse desde tests, así que es fácil tratarlas como el mismo problema.

No lo son.

Una baseline de regresión visual es una expectativa del producto. CI debe poder comparar la UI actual con esa referencia y fallar si aparece una diferencia no aceptada. Una captura de marketing es un artefacto editorial: se genera cuando interesa preparar material de tienda y no debería convertirse en requisito de cada ejecución automatizada.

La PR #8 separó esas responsabilidades. MarketingScreenshotTest dejó de escribir en una ruta absoluta de una máquina concreta y pasó a usar una ruta relativa al repositorio. Más importante aún, la generación quedó detrás de una propiedad explícita, radiohub.generateMarketingScreenshots. Si la propiedad no está activada, el test se omite.

Eso convierte la generación de marketing en una herramienta invocable, no en una obligación accidental del CI. Las capturas promocionales se generan cuando se solicitan expresamente; las baselines de Roborazzi, en cambio, sí forman parte del contrato de verificación.

La misma PR incorporó imágenes que faltaban para estados de RecordingsScreen: contenido, vacío, error y carga; claro y oscuro; inglés y español. No era solo «hacer que CI deje de fallar». Una prueba visual sin baseline versionada no tiene una referencia estable contra la que comparar. La baseline es parte del test.

La regla que quedó es reutilizable: los artefactos que verifican el producto pertenecen al gate; los artefactos que promocionan el producto pertenecen a un flujo explícito distinto.

## El changelog también estaba intentando hacer dos trabajos

El siguiente problema era parecido, pero textual.

Un CHANGELOG.md puede degenerar fácilmente en una transcripción de commits: migraciones internas, dependencias, refactors, cambios de CI y detalles útiles para quien desarrolla pero irrelevantes para quien acaba de actualizar la app.

La PR #9 cambió deliberadamente ese contrato. El archivo pasó a indicar que documenta cambios visibles para el usuario y añadió una regla explícita: refactors internos, CI, tests y documentación no necesitan una entrada salvo que afecten a la aplicación publicada.

Esto importa porque el mismo archivo empezó a alimentar una nueva pantalla «What's new» dentro de RadioHub.

En vez de mantener dos fuentes —unas notas para el repositorio y otras copiadas a mano dentro de Android—, Gradle genera un asset desde el CHANGELOG.md raíz. La tarea GenerateChangelogAsset declara el changelog como entrada y el directorio generado como salida. Después, androidComponents añade ese directorio a los assets de cada variante.

El flujo queda así:

~~~text
CHANGELOG.md
    |
    | Gradle generated asset
    v
assets/CHANGELOG.md
    |
    | ChangelogParser
    v
What's new
~~~

No hay una segunda copia autoritativa que editar.

El parser reconoce cabeceras de release y secciones, pero descarta Unreleased de la lista visible. La siguiente versión puede seguir preparándose en el mismo documento sin enseñar a usuarios cambios que todavía no se han publicado.

La prueba packaged changelog asset exactly matches repository source of truth cierra el circuito. Lee el asset empaquetado, lee el archivo del repositorio y exige igualdad de contenido normalizando finales de línea.

«CHANGELOG es la fuente de verdad» se convierte así en una propiedad comprobable.

## Fuente de verdad significa eliminar divergencias

Es fácil escribir en documentación que un archivo es source of truth. Si luego existe otra copia que puede desviarse, la frase no aporta demasiado.

RadioHub acabó con tres verificaciones alrededor de esta idea. Primero, el build genera el asset en vez de mantenerlo manualmente. Segundo, el test compara el asset generado con el origen. Tercero, la pantalla se prueba usando ese asset y comprueba que muestra una release publicada y que Unreleased no aparece.

Hay además cobertura de navegación desde Settings hacia «What's new». El contrato no termina en el parser: llega hasta el punto de entrada que usa la persona.

Este patrón me parece más interesante que la pantalla en sí. Cuando una misma información tiene que aparecer en repositorio, aplicación y release, la solución robusta no suele ser «sincronizar mejor tres copias». Es reducir el número de copias autoritativas.

## El primer gate de metadatos era demasiado pequeño

La PR #9 añadió al workflow de release una comprobación directa: la versión actual debía tener una sección fechada en CHANGELOG.md.

Era una mejora clara. Un AAB podía compilar y, aun así, carecer de notas correspondientes a su versión. Fallar antes de publicar era mejor que descubrirlo después.

Pero «existe una línea con esta versión» no cubre todas las incoherencias posibles.

La PR #10 convirtió esa comprobación en un validador reutilizable: scripts/validate-release-metadata.sh.

El script extrae versionName y versionCode de app/build.gradle.kts, exige una versión MAJOR.MINOR.PATCH, calcula el código esperado y valida el changelog.

La relación usada es:

~~~text
versionCode = major * 100000 + minor * 1000 + patch
~~~

Para 1.7.4, el resultado esperado es 107004.

El validador también impone límites a minor y patch para que el esquema no produzca colisiones silenciosas, exige exactamente una sección Unreleased, exactamente una sección fechada para la versión actual y al menos un elemento de cara al usuario dentro de esa release.

Si el workflow se ejecuta desde un tag v*, el tag debe corresponder a versionName.

Ya no se valida una cadena aislada. Se valida una relación entre Gradle, changelog y referencia Git.

## Probar el validador que puede bloquear una release

Añadir un script que puede impedir una publicación introduce otra pregunta: ¿quién valida al validador?

La PR #10 añadió scripts/test-validate-release-metadata.sh, un conjunto pequeño de casos positivos y negativos que trabaja con archivos temporales.

Hay un caso válido y varios fallos intencionados: versionCode que no corresponde a versionName, SemVer con formato no admitido, ausencia de Unreleased, release duplicada, release sin elementos y tag que no coincide con la versión.

Esta clase de prueba es barata y tiene mucho valor porque el script es política ejecutable. Si alguien modifica mañana la expresión regular o la fórmula de versión, no debería descubrir durante una publicación que el gate acepta estados inválidos o rechaza estados correctos.

También evita un problema habitual de los workflows: esconder demasiada lógica dentro de YAML. La lógica reutilizable vive en un script que puede probarse fuera del job; el workflow se limita a invocarla en el momento adecuado.

## CI verde no responde necesariamente qué SHA vas a publicar

La PR #11 fue el cambio arquitectónico.

RadioHub ya tenía un workflow de CI con build, tests y verificación Roborazzi. Una opción posible habría sido hacer que el workflow de release consultara el estado de CI y publicara únicamente si encontraba un resultado verde.

El diseño final no hace eso.

El propio workflow documenta que la release vuelve a ejecutar cada gate obligatorio sobre el SHA exacto y que no debe sustituirse por una consulta asíncrona al estado de otro CI. El objetivo declarado es que la publicación sea autocontenida y no dependa de una carrera entre workflows.

La razón es temporal. Imaginemos que main avanza de A a B. CI de A termina verde. Después se dispara una publicación de B. Si el release gate pregunta de forma imprecisa «¿está CI verde?», existe el riesgo conceptual de asociar una evidencia de A con una publicación de B.

GitHub permite diseños más sofisticados alrededor de checks asociados a commits, pero RadioHub eligió una propiedad más sencilla de razonar: el job que publica ejecuta sus gates sobre su propio checkout.

Eso cuesta tiempo de cómputo duplicado. A cambio, reduce acoplamiento entre workflows y elimina una carrera entre «CI terminó» y «release empezó».

## El primer paso es demostrar qué se ha hecho checkout

Antes de ejecutar Gradle, la PR #11 añadió Verify release source.

El job obtiene git rev-parse HEAD y lo compara con GITHUB_SHA. Si no coinciden, falla.

Para ejecuciones manuales añade otra restricción: solo se permite publicar desde main o desde un tag v* existente. Una rama arbitraria no puede convertirse en release mediante workflow_dispatch.

Es una comprobación deliberadamente sencilla. actions/checkout ya está diseñado para obtener la referencia del evento, pero aquí la identidad del código publicado es suficientemente importante como para convertirla en una invariante visible del pipeline.

El log puede decir literalmente qué commit va a validar.

## El orden de los gates también es diseño

Después de identificar el SHA, el workflow no empieza preparando el material de firma ni construyendo el AAB firmado.

Primero valida lo barato:

~~~text
1. verificar SHA/ref
2. validar versión + changelog
3. testDebugUnitTest
4. assembleDebug
5. verifyRoborazziDebug
6. preparar firma
7. bundleRelease
8. comprobar AAB
9. tag/publicación
~~~

Este orden tiene dos ventajas.

La primera es eficiencia. Si el changelog es inválido, no tiene sentido pagar el coste del build firmado.

La segunda es limitar trabajo sensible innecesario. El material de firma se prepara después de que los gates previos hayan pasado. Es una regla sencilla: no preparar recursos de publicación antes de necesitarlos.

Finalmente se comprueba que existe el AAB en el directorio esperado antes de crear tag y continuar con publicación.

## Build debug dentro de release no es redundancia accidental

assembleDebug ya puede haberse ejecutado en CI. Volver a ejecutarlo en release parece duplicación.

Lo es, pero es deliberada.

La PR #11 llama a este enfoque un gate autocontenido. El objetivo del job no es ahorrar todos los ciclos posibles, sino establecer una cadena de evidencia sobre un SHA.

testDebugUnitTest responde que la suite unitaria pasa. assembleDebug responde que la configuración debug compila. verifyRoborazziDebug responde que las referencias visuales aceptadas siguen coincidiendo. bundleRelease responde que el artefacto de release puede construirse.

Son preguntas diferentes. Ejecutarlas en el mismo job de publicación hace que el resultado tenga un significado fuerte: el artefacto no llegó al final saltándose una comprobación obligatoria porque otro workflow estuviera retrasado, cancelado o apuntando a otra revisión.

## Roborazzi pasa de «capturas» a parte de la definición de release

La PR #8 preparó el terreno y la #11 cerró la idea.

Antes, un problema de baselines podía hacer que Roborazzi fuese visto como una molestia del CI. Después de separar las capturas de marketing y versionar las referencias que faltaban, verifyRoborazziDebug pudo ocupar un lugar claro en el release gate.

Esto cambia cómo se interpreta una regresión visual.

Si una diferencia es intencionada, se actualiza la baseline de forma consciente y esa modificación queda en Git. Si no lo es, la release se detiene.

No significa que una captura pueda demostrar toda la corrección visual de una aplicación Android. Diferentes dispositivos, APIs, fuentes, animaciones y estados runtime siguen requiriendo otras verificaciones. Pero para las pantallas cubiertas, la baseline representa una expectativa revisable y versionada.

Lo importante es que no se mezcla con imágenes de Play Store. Una imagen promocional puede cambiar por composición editorial sin que la UI haya sufrido una regresión; una baseline cambia porque aceptamos un nuevo resultado del producto.

## El changelog se convierte en interfaz entre desarrollo, app y publicación

Hay otra consecuencia de las PR #9 y #10: CHANGELOG.md deja de ser documentación pasiva.

Participa en tres sistemas.

Para desarrollo, mantiene la lista de cambios visibles de la siguiente versión bajo Unreleased. Para la aplicación, alimenta «What's new». Para release, forma parte de los metadatos que deben ser coherentes con versionName.

Eso obliga a escribirlo de otra manera. Una entrada como «refactor del repositorio X» puede ser correcta técnicamente y, aun así, ser mala materia prima para la pantalla de novedades. El archivo se orientó por eso a cambios que una persona puede reconocer después de actualizar.

No todos los detalles técnicos desaparecen: este devlog existe precisamente para conservarlos. Se separan por audiencia.

El changelog explica qué cambió para usuarios. El devlog explica por qué el pipeline cambió, qué trade-offs tuvo y qué aprendimos. Los commits conservan la historia granular.

No necesitamos pedir a un único formato que haga los tres trabajos.

## El workflow deja de confiar en coincidencias

Al juntar las piezas aparece una cadena de invariantes:

~~~text
GITHUB_SHA == checkout HEAD
versionName <-> versionCode
versionName <-> CHANGELOG release
tag <-> versionName
CHANGELOG source == packaged asset
UI released notes != Unreleased
Roborazzi current UI == accepted baselines
release AAB exists
~~~

Cada flecha representa una posible divergencia que antes podía depender de disciplina manual.

Esto no elimina toda posibilidad de error. El validador no sabe si una nota está bien redactada. Roborazzi no sabe si una interacción compleja funciona en un dispositivo real. Un AAB existente no garantiza que Google Play lo acepte.

Pero el pipeline deja de aceptar varias clases de incoherencia mecánica que sí puede detectar de forma fiable.

Esa es una buena frontera para automatizar: máquinas comprobando relaciones deterministas; revisión humana ocupándose de semántica, UX y comportamiento real.

## La documentación de release tuvo que cambiar con el código

docs/RELEASING.md se actualizó para describir el nuevo contrato.

La secuencia documentada incluye verificar el SHA, validar SemVer/versionCode/changelog, ejecutar tests, construir debug, verificar Roborazzi y solo entonces construir el AAB de release.

Esto puede parecer secundario frente al YAML, pero evita otra clase de deriva: que el workflow haga una cosa y la guía operativa siga describiendo otra.

Una release se ejecuta pocas veces comparada con el desarrollo diario. Precisamente por eso la documentación importa. Las decisiones que parecen obvias el día que se escribe el workflow dejan de serlo semanas después.

El comentario dentro del workflow explica por qué se reejecutan los gates. RELEASING.md explica qué debe esperar quien publica. Los tests explican qué invariantes son ejecutables.

Son tres capas distintas de documentación.

## Lo que esta arquitectura no intenta resolver

El gate es fuerte dentro de su ámbito, pero conviene no exagerarlo.

No sustituye las pruebas en dispositivo real. RadioHub tiene funciones —audio, alarmas, servicios en foreground, comportamiento de lock screen— cuyo resultado depende del sistema Android y del hardware. Un workflow Ubuntu no puede demostrar por sí solo toda esa experiencia.

Tampoco convierte SemVer en una decisión automática. El script comprueba que la forma de la versión es válida y que versionCode corresponde. No decide si un cambio merece major, minor o patch.

Y no evalúa la calidad editorial del changelog. Solo exige estructura y contenido no vacío.

La automatización es útil precisamente porque su alcance es concreto. Un gate que pretendiese «garantizar que la release es perfecta» sería una promesa falsa. Este gate garantiza relaciones específicas antes de permitir la publicación.

## Coste: repetir trabajo para comprar trazabilidad

La decisión más discutible es también la más interesante: reejecutar pruebas y build debug en el release job.

En un proyecto enorme, duplicar una suite costosa puede ser inaceptable. Se podría diseñar un sistema donde release dependa de checks requeridos asociados exactamente al SHA y reutilice artefactos verificables.

RadioHub no eligió esa complejidad aquí.

La solución autocontenida es más fácil de inspeccionar: abres una ejecución de release y ves, en orden, todas las comprobaciones que protegieron el AAB.

El coste es tiempo de runner. El beneficio es una semántica simple.

Para un proyecto indie, esa relación puede ser favorable. La infraestructura también tiene coste cognitivo. Ahorrar minutos a cambio de introducir coordinación entre workflows, consultas de checks y manejo de carreras no siempre es una optimización.

## Una release como operación con precondiciones

La forma en que ahora pienso este workflow se parece a una transacción.

La publicación es la operación difícil, o al menos costosa, de deshacer. Antes de llegar a ella se comprueban precondiciones: identidad del código, coherencia de versión, existencia de notas, tests, compilación, regresión visual y artefacto final.

Si cualquiera falla, no se avanza.

La analogía no es perfecta —GitHub Actions no ofrece una transacción ACID sobre Google Play—, pero ayuda a diseñar el orden. Las comprobaciones deben ocurrir antes del efecto que protegen.

También explica por qué crear el tag al final es mejor que usarlo como prueba de que todo salió bien. El tag representa una release que ha cruzado el gate, no una intención temprana que quizá falle a mitad.

## Qué aprendí del 19 de septiembre

La primera lección es que source of truth necesita tests. Generar el changelog automáticamente y comparar el asset con el origen es más sólido que una convención escrita.

La segunda es que no todos los PNG generados por tests tienen la misma semántica. Separar marketing de regresión visual hizo que Roborazzi pudiera convertirse en un gate real.

La tercera es que un CI verde solo es evidencia útil si puedes asociarlo sin ambigüedad al código que publicas. RadioHub eligió resolverlo reejecutando los gates sobre el SHA de release.

La cuarta es que las validaciones baratas deben ocurrir antes de las operaciones más costosas.

La quinta es que la documentación de usuario y la documentación técnica no compiten. El changelog puede ser conciso y orientado a personas porque el devlog, los PR y los commits conservan el razonamiento técnico.

## Resultado

Al terminar ese ciclo, RadioHub tenía un proceso de release más explícito:

~~~text
commit/ref
   |
   v
verify exact SHA
   |
   v
validate version + changelog
   |
   v
unit tests
   |
   v
debug build
   |
   v
Roborazzi
   |
   v
release AAB
   |
   v
tag + publish
~~~

Y el changelog había dejado de ser un archivo periférico:

~~~text
CHANGELOG.md
  |--> release metadata gate
  |--> generated Android asset
          |--> What's new
~~~

Ninguno de esos cambios es espectacular por separado. Juntos hacen algo que valoro más: reducen el número de estados ambiguos en los que una release «parece correcta».

La automatización no debería limitarse a hacer más rápida una publicación. Debería hacer más difícil publicar la cosa equivocada.

El 19 de septiembre, RadioHub avanzó justo en esa dirección.

## Referencias

- [PR #8 — Fix Roborazzi CI and generate missing baselines](https://github.com/ArceApps/RadioHub/pull/8)
- [PR #9 — Add changelog-driven What's new screen](https://github.com/ArceApps/RadioHub/pull/9)
- [PR #10 — Stabilize changelog release validation](https://github.com/ArceApps/RadioHub/pull/10)
- [PR #11 — Enforce full pre-publish gate](https://github.com/ArceApps/RadioHub/pull/11)
- [GitHub Docs — Workflow syntax for GitHub Actions](https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- [Roborazzi](https://github.com/takahirom/roborazzi)
