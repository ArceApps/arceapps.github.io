---
title: "GitHub Actions: del runner privado al mirror"
description: "Cómo el portfolio separó fuente privada, mirror público y despliegue de Pages tras descubrir que mover todos los jobs al runner propio era demasiado."
pubDate: 2026-09-21
lastmod: 2026-10-04
author: "ArceApps"
keywords:
  - "GitHub Actions"
  - "GitHub Pages"
  - "self-hosted runner"
  - "repository mirror"
  - "ArceApps Portfolio"
canonical: "https://arceapps.com/es/devlog/2026-W39-portfolio-mirror-pipeline/"
heroImage: "/images/devlog/portfolio-mirror-pipeline.svg"
tags: ["GitHub Actions", "GitHub Pages", "DevOps", "Astro", "Building in Public"]
---

Hay cambios que empiezan como una solución de emergencia y terminan obligándote a dibujar una frontera arquitectónica que antes no existía. El 20 y el 21 de septiembre el portfolio pasó exactamente por eso.

El detonante fue muy práctico: los minutos disponibles de GitHub Actions habían dejado de ser un recurso que pudiera dar por supuesto. El primer movimiento fue lógico y, visto de forma aislada, correcto: ya tenía un runner autohospedado, así que podía trasladar allí los workflows del portfolio. El PR #58 hizo precisamente eso. Build, despliegue, sincronización al repositorio público y OpenCode pasaron a `self-hosted`.

El problema apareció cuando miré el sistema completo en vez de cada workflow por separado.

El portfolio no era ya un único repositorio que compilaba una web. `ArceApps/web-portfolio` era el workspace privado y `ArceApps/arceapps.github.io` funcionaba como mirror público. Copiar el mismo workflow y el mismo tipo de runner a ambos lados significaba que una optimización de coste estaba borrando una frontera de confianza. El runner privado, persistente y con acceso al entorno de trabajo, no debía convertirse en el ejecutor general del repositorio público.

Menos de siete horas después del PR #58, el PR #59 corrigió el rumbo. El self-hosted runner quedó en el lado privado, donde prepara la distribución. El mirror público volvió a `ubuntu-latest`, donde construye y despliega Pages. El PR #60 documentó después la arquitectura completa en un artículo técnico.

Este devlog no pretende repetir aquella guía. Allí expliqué cómo reproducir el patrón y qué hace cada pieza. Aquí me interesa la secuencia: por qué una solución razonable se volvió incorrecta al ampliar el campo de visión, cómo el mirror pasó de ser una copia a convertirse en una frontera de publicación y qué aprendí al separar coste, confianza y despliegue.

## El punto de partida: un repositorio que ya no era solo una web

Durante mucho tiempo es fácil pensar en un portfolio Astro como una estructura bastante convencional:

```text
src/
public/
package.json
astro.config.mjs
```

Pero `web-portfolio` había crecido alrededor de la web. El repositorio también contiene documentación técnica, automatizaciones, configuración de agentes, especificaciones y material de trabajo que resulta útil para desarrollar pero no forma parte del producto público.

Eso crea dos conceptos que se parecen, pero no son lo mismo:

```text
repositorio de desarrollo
distribución publicable
```

Mientras ambos viven en el mismo repositorio, la diferencia puede parecer filosófica. En cuanto aparece un mirror público, deja de serlo.

La fuente privada puede contener todo lo necesario para construir, razonar y automatizar. El mirror, en cambio, debe contener solo lo que acepto publicar. No quería replicar la historia Git privada ni convertir un `.gitignore` en una falsa política de seguridad. Quería producir un árbol limpio.

Esa distinción ya estaba implícita en el script de sincronización, pero la crisis de runners hizo que tuviera que tratarla como una propiedad arquitectónica explícita.

## PR #58: moverlo todo al runner propio

El PR #58 se tituló `ci: use self-hosted runner for web workflows`. Su intención era directa: evitar depender de minutos hospedados para los jobs del portfolio.

Los workflows afectados incluían el despliegue, la sincronización del mirror y OpenCode. El cambio conceptual era casi mecánico:

```yaml
runs-on: self-hosted
```

Si solo miras el repositorio privado, tiene sentido. El Mini PC ya existe, puede ejecutar Node, pnpm y las herramientas del proyecto, y permite continuar trabajando aunque el presupuesto de minutos hospedados sea un cuello de botella.

Además, un runner propio puede ser especialmente cómodo para tareas largas o con cachés locales. No hay que reconstruir mentalmente el entorno en cada ejecución y puedo controlar las herramientas instaladas.

Pero esa persistencia es también la razón por la que un self-hosted runner requiere más cuidado.

Un runner hospedado por GitHub es efímero en el flujo habitual: el job obtiene una máquina preparada para la ejecución y esa máquina no se convierte en mi servidor de propósito general. Mi runner privado sí es una máquina que sigue existiendo después del job.

La pregunta correcta dejó de ser «¿dónde sale más barato ejecutar el build?» y pasó a ser «¿qué código permito ejecutar en una máquina persistente que pertenece a mi infraestructura?».

Ese cambio de pregunta fue el verdadero inicio de la arquitectura actual.

## El error no estaba en usar self-hosted

Es importante no sacar una conclusión equivocada. El problema no era `self-hosted`.

De hecho, el diseño final sigue dependiendo de él.

El error era tratar todos los jobs como si pertenecieran a la misma zona de confianza.

El repositorio privado y el público tienen responsabilidades distintas. El privado es un workspace controlado. El público es, por definición, una superficie expuesta: su código es visible y su modelo de colaboración puede evolucionar. Aunque hoy no ejecute pull requests de terceros sin revisar, diseñar el sistema suponiendo que un repositorio público es igual de confiable que el privado crea una deuda innecesaria.

El runner privado necesitaba acceso al origen y permiso para escribir la distribución. Esa tarea sí pertenece a su zona.

El build público no necesita acceso al workspace privado. Puede ejecutarse en infraestructura efímera de GitHub y recibir únicamente el árbol que ya decidí publicar.

La separación terminó siendo:

```text
web-portfolio privado
        |
        | self-hosted
        | filtra y sincroniza
        v
arceapps.github.io público
        |
        | ubuntu-latest
        | build y deploy
        v
GitHub Pages
```

Ese diagrama parece obvio ahora. No lo era cuando el objetivo inmediato era simplemente hacer que un workflow volviera a ejecutarse.

## PR #59: convertir la seguridad en topología

El PR #59, `ci: keep self-hosted runner private`, corrigió la arquitectura.

El workflow de despliegue quedó protegido por una condición explícita:

```yaml
jobs:
  build:
    if: github.repository == 'ArceApps/arceapps.github.io'
    runs-on: ubuntu-latest
```

El job de despliegue aplica la misma idea. El repositorio público es quien construye Pages y lo hace en un runner hospedado.

En el otro lado, la sincronización contiene la condición inversa:

```yaml
jobs:
  sync:
    if: github.repository == 'ArceApps/web-portfolio'
    runs-on: self-hosted
```

Me gusta especialmente esta parte porque la política no vive solo en documentación. Está codificada en los workflows.

Aunque un archivo termine donde no debería, el job pregunta dónde está ejecutándose antes de actuar.

Eso es defensa en profundidad. El script de mirror también excluye el workflow de sincronización, pero no confío toda la seguridad en que esa exclusión nunca cambie.

La topología final expresa la confianza:

- el runner privado toca la fuente privada;
- el mirror recibe una copia filtrada;
- el runner público solo ve la copia pública;
- Pages recibe el artefacto compilado.

No necesito que el runner público conozca el repositorio privado. Y no necesito que el runner privado compile código procedente del mirror.

## El mirror dejó de ser «una copia»

Antes de esta revisión podía describir `arceapps.github.io` como un mirror público y dar la explicación por terminada.

Después me parece una descripción insuficiente.

Un mirror tradicional sugiere réplica. Este no replica la historia Git y tampoco replica todos los archivos. Es una distribución construida mediante una política.

El workflow privado hace dos checkouts: el origen y el destino. Después ejecuta:

```bash
./scripts/sync-mirror.sh "$GITHUB_WORKSPACE" "$RUNNER_TEMP/clean-mirror"
```

Ese script crea un directorio temporal limpio y aplica exclusiones explícitas con `rsync`.

Entre otras cosas quedan fuera:

```text
.git
.opencode
agents
docs
openspec
AGENTS.md
BUGS.md
CONTEXT.md
test-results
dist
node_modules
```

También se excluye el propio `.github/workflows/sync-to-public.yml`.

La propiedad importante es que el script no «limpia» el repositorio privado. Construye otro árbol.

Eso cambia mucho cómo razono sobre el proceso:

```text
fuente privada + política de publicación = distribución pública
```

La fuente permanece intacta. La distribución puede destruirse y regenerarse.

Esa asimetría es saludable.

## Por qué no hago push de la historia privada

Una vez que tienes dos repositorios, una tentación es sincronizarlos con Git.

Para este caso sería la abstracción equivocada.

Un `git push --mirror` está pensado para replicar referencias e historia. Precisamente esa historia es algo que no quiero convertir en pública por accidente.

Aunque el estado actual ya no contenga un archivo, un commit antiguo puede seguir conteniéndolo. Una política de publicación basada solo en el working tree no puede volver segura una historia privada que decidas publicar completa.

Por eso el pipeline copia archivos y deja que el repositorio público genere su propia historia.

El checkout destino conserva su `.git`, recibe el árbol filtrado con:

```bash
rsync -av --delete --exclude='.git'   "$RUNNER_TEMP/clean-mirror/" public-repo/
```

y después crea un commit público si existe algún cambio.

Son dos historias diferentes porque representan dos cosas diferentes:

- la historia privada explica cómo trabajo;
- la historia pública explica qué he publicado.

No necesito que sean isomorfas.

## `--delete`: la opción que evita fantasmas

Una de las decisiones menos vistosas es `--delete`.

Sin ella, una sincronización puede copiar lo nuevo y dejar detrás archivos que ya no existen en el origen. En una carpeta de backup eso puede ser una característica. En una distribución pública es una incoherencia.

Supongamos que una ruta era publicable ayer y hoy la elimino o la muevo a una zona interna. Si el mirror conserva el archivo antiguo, la política actual dice una cosa y la distribución real dice otra.

Por eso la semántica que quiero es:

```text
mirror = estado publicable actual
```

no:

```text
mirror = acumulación histórica de archivos copiados
```

El uso de `--delete` aparece tanto al preparar la copia como al sincronizarla sobre el checkout público.

Esto tiene una consecuencia útil: puedo revisar el mirror como una fotografía de la política vigente. Los archivos obsoletos no se quedan por inercia.

## Denylist: cómoda, pero no gratis

El script actual publica todo salvo un conjunto de exclusiones.

Es una denylist.

Para un portfolio es práctica: si añado un componente, una imagen o una ruta pública, normalmente llega al mirror sin tener que editar también el script.

Pero el modo de fallo merece atención. Si creo mañana una nueva carpeta interna y olvido excluirla, esa carpeta puede publicarse.

Una allowlist invertiría la relación:

```text
publica solo src/
publica public/
publica package.json
publica astro.config.mjs
...
```

Eso es más seguro frente a olvidos porque una ruta nueva no se publica hasta declararla. A cambio, una nueva pieza legítima puede romper el build público si olvido incorporarla.

No cambié a allowlist durante este período. Es importante decirlo porque un devlog no debe presentar como implementada una mejora que solo está identificada.

La lección sí quedó clara: la política actual favorece ergonomía y necesita revisión consciente. Si la sensibilidad del repositorio aumenta, la allowlist sería una evolución razonable.

## La frontera no es un gestor de secretos

Otro aprendizaje importante es no pedir al mirror que resuelva un problema diferente.

Excluir archivos internos no hace aceptable versionar secretos.

Las credenciales de publicación siguen perteneciendo a GitHub Secrets o a mecanismos equivalentes. El mirror filtra documentación, automatizaciones y artefactos de trabajo; no es una máquina de borrar errores de seguridad de la historia.

El workflow utiliza `PUBLIC_RELEASE_TOKEN` para escribir en el repositorio público. Esa credencial tiene una responsabilidad acotada: permitir que el lado privado publique la distribución.

La arquitectura funciona mejor cuando cada secreto y cada runner tienen el menor alcance posible.

Esto enlaza directamente con el cambio del PR #59: si el build público no necesita la credencial privada, no debe tenerla.

## Dos pipelines, unidos por un commit

El diseño final tiene una propiedad que al principio me parecía una complicación y ahora considero una ventaja: el despliegue completo no es un único workflow.

Hay un pipeline privado:

```text
push web-portfolio/main
 -> checkout privado
 -> checkout destino
 -> crear clean-mirror
 -> rsync
 -> commit público
 -> push arceapps.github.io/main
```

Y hay un pipeline público:

```text
push arceapps.github.io/main
 -> ubuntu-latest
 -> pnpm install
 -> actualizar datos de apps
 -> pnpm build
 -> upload-pages-artifact
 -> deploy-pages
```

La unión entre ambos es Git.

Eso introduce un commit intermedio, pero también crea un punto de inspección. Si el build público falla, puedo mirar exactamente qué distribución intentó compilar. Si la sincronización no produce cambios, no se crea un commit vacío y el segundo pipeline no necesita fingir actividad.

También desacopla permisos. El primer pipeline necesita escribir en el mirror. El segundo necesita permisos de Pages, pero no necesita acceso a la fuente privada.

En seguridad, «un paso más» no siempre significa «más complejo de forma mala». A veces es el paso que permite reducir el privilegio de cada componente.

## El detalle de concurrencia que evita dos publicaciones a la vez

El workflow de sincronización define:

```yaml
concurrency:
  group: sync-to-public
  cancel-in-progress: false
```

Podría cancelar una sincronización antigua cuando llega otra. Elegí no hacerlo.

La razón no es rendimiento, sino secuencia.

Una publicación que ya ha empezado puede terminar; la siguiente espera y publica el estado posterior. Para este flujo prefiero una cola coherente a interrumpir un job en mitad de dos checkouts y una sincronización.

No es una regla universal. Para previews o builds costosos quizá elegiría `cancel-in-progress: true`. Aquí el objetivo es mantener un único escritor lógico sobre el mirror.

Es una de esas decisiones pequeñas que rara vez merecen un artículo por sí solas, pero que forman parte de la fiabilidad real del pipeline.


## El contrato del mirror se puede probar

La arquitectura también sugiere una forma más precisa de verificar el sistema. Un build verde responde a una pregunta: «¿la distribución pública compila?». El mirror necesita responder además a otra: «¿la distribución contiene únicamente lo que la política permite publicar?».

Son propiedades distintas.

El script ya materializa un directorio `clean-mirror`, así que existe un punto natural para comprobar invariantes antes del push. Por ejemplo, una validación podría fallar si encuentra rutas como `agents/`, `.opencode/` o `docs/`, y también podría exigir la presencia de entradas necesarias para construir Astro.

Conceptualmente:

```bash
test ! -e clean-mirror/agents
test ! -e clean-mirror/.opencode
test ! -e clean-mirror/docs
test -f clean-mirror/package.json
test -d clean-mirror/src
```

No implementé esa suite durante el período que documento, así que no la presento como una garantía existente. Lo importante es que la nueva topología hace posible formular el contrato.

Antes, «sincronizar el repositorio» podía significar demasiadas cosas. Después del cambio, el contrato es más concreto: una ejecución privada transforma un workspace en un árbol público, y una ejecución pública transforma ese árbol en un artefacto de Pages.

Cada flecha puede verificarse por separado.

También permite pensar en fallos de manera más útil. Si el mirror contiene una ruta prohibida, el problema está en la frontera de publicación. Si el mirror es correcto pero Astro no compila, el problema está en la distribución o el build. Si ambos pasos funcionan y Pages falla, el problema pertenece al despliegue.

Separar pipelines no elimina fallos. Hace que tengan un lugar.

## Un modelo de amenazas pequeño, pero explícito

No hacía falta convertir un portfolio personal en un ejercicio académico de seguridad, pero sí identificar qué estaba protegiendo.

Había tres riesgos distintos.

El primero era **publicar más archivos de los previstos**. El script de filtrado y la separación de historias Git reducen ese riesgo.

El segundo era **ejecutar código público en infraestructura privada persistente**. Mantener el build del mirror en `ubuntu-latest` evita convertir el Mini PC en esa superficie de ejecución.

El tercero era **dar a un componente más credenciales de las necesarias**. Separar sincronización y deploy permite que el token que escribe el mirror exista donde se necesita y que Pages opere con sus propios permisos.

Ninguna de esas medidas es una solución universal. La denylist puede quedarse desactualizada, un token de larga duración sigue requiriendo cuidado y los workflows también forman parte de la superficie de confianza.

Pero ahora los riesgos no están mezclados bajo una única etiqueta de «CI». Cada uno corresponde a una frontera concreta y puede mejorarse sin rediseñar todo el sistema.

Esa modularidad es una consecuencia importante del cambio. El día que sustituya el token por otra credencial, no necesito cambiar cómo Pages compila. Si cambio la política de denylist a allowlist, no necesito mover el runner público. Y si cambio de proveedor de hosting, el workspace privado puede conservar su contrato de distribución.


## PR #60: documentar después de corregir

Una cosa que me gusta de la cronología es que la documentación larga llegó después de los dos cambios de CI.

El PR #60 publicó el artículo «GitHub Pages: portfolio privado con mirror público». Allí quedó documentado el workflow real, el script de filtrado, la separación de runners, el trade-off denylist/allowlist y la gestión de credenciales.

Eso importa porque la documentación no describe una arquitectura imaginada. Describe la arquitectura después de haber corregido el primer intento.

También evita que este devlog tenga que convertirse en tutorial. Si alguien quiere copiar el patrón, el artículo técnico es mejor destino. Aquí puedo conservar la historia del cambio.

Es una separación editorial parecida a la separación del propio sistema:

- el artículo técnico explica el mecanismo;
- el devlog explica la evolución y las decisiones.

Ambos hablan de lo mismo sin necesitar ser el mismo texto.

## Qué cambió realmente en mi forma de ver el portfolio

Antes de este período pensaba sobre todo en el portfolio como una web con automatización.

Después lo veo como un pequeño sistema de publicación con tres capas:

1. **workspace**: donde puedo mantener herramientas y contexto privado;
2. **release source**: el repositorio público filtrado;
3. **artefacto**: el `dist` que Pages sirve.

Cada capa puede tener permisos diferentes.

Ese modelo es más útil que preguntar simplemente «¿el repo es público o privado?».

También me obliga a distinguir disponibilidad de seguridad. Mover jobs al runner propio resolvía disponibilidad/coste. Mantenerlos todos allí empeoraba la frontera de confianza. El PR #59 no deshizo el PR #58: refinó dónde tenía sentido cada parte.

El self-hosted runner siguió siendo solución, pero dejó de ser solución universal.

## Lo que no considero terminado

El sistema funciona, pero hay varias mejoras que no quiero disfrazar de trabajo ya hecho.

La primera es la denylist. Sigue siendo una política que exige recordar nuevas rutas internas.

La segunda es la credencial de escritura al mirror. El workflow actual utiliza un token dedicado. El artículo técnico ya señalaba que conviene mantener mínimo privilegio y que existen alternativas como GitHub Apps o mecanismos de credenciales temporales.

La tercera es que un mirror limpio necesita pruebas de su propia política. No basta con que Astro compile. También interesa comprobar que rutas prohibidas no aparecen en la distribución.

Más adelante, el Content CI añadido al portfolio para validar contenido reforzó otra parte del sistema, pero no lo voy a retrotraer artificialmente a esta historia. En septiembre, la pieza central era la frontera privado/público.

Un devlog útil debe conservar esas fechas: las mejoras posteriores pueden confirmar una dirección, pero no deben convertirse en evidencia de que ya existían.

## Lo que aprendí de una corrección de menos de un día

La primera lección es que optimizar un recurso aislado puede empeorar el sistema.

«Tengo un runner propio, ejecuto todo allí» es una optimización local. «Tengo código privado y público con niveles de confianza distintos» es una restricción global.

La segunda es que la seguridad se entiende mejor cuando se dibuja como flujo.

No tuve que inventar una gran capa de permisos. Bastó con colocar cada ejecución en el lado correcto:

```text
privado -> runner privado -> filtro -> público -> runner efímero
```

La tercera es que un mirror no tiene por qué ser una réplica. Puede ser una compilación de fuentes en el sentido editorial del término: una selección explícita de lo publicable.

La cuarta es que Git puede ser una frontera entre pipelines. El commit público no es ruido; es el contrato entre quien prepara la distribución y quien la construye.

La quinta es que documentar después de corregir produce documentación mejor. El PR #60 pudo explicar no solo qué había, sino por qué el runner público era deliberadamente distinto del privado.

## Resultado

Al terminar el 21 de septiembre, el portfolio tenía una topología más clara que al empezar:

```text
ArceApps/web-portfolio
(private workspace)
        |
        | GitHub Actions / self-hosted
        | scripts/sync-mirror.sh
        v
clean public tree
        |
        | commit + push
        v
ArceApps/arceapps.github.io
(public release source)
        |
        | GitHub Actions / ubuntu-latest
        | pnpm build
        v
GitHub Pages
```

El cambio visible para quien visita la web es casi ninguno. Esa es precisamente la gracia.

No todas las mejoras de infraestructura deberían producir una feature visual. Algunas deberían hacer que el sistema sea más fácil de explicar, que cada credencial tenga menos cosas que hacer y que una optimización de coste no termine convirtiendo una máquina privada en una superficie pública de ejecución.

Esta vez el trabajo empezó intentando gastar mejor los minutos de CI y terminó definiendo dónde acaba mi workspace.

Me parece un intercambio bastante bueno.

## Referencias

- [PR #58 — usar self-hosted runner en workflows del portfolio](https://github.com/ArceApps/web-portfolio/pull/58)
- [PR #59 — mantener privado el self-hosted runner](https://github.com/ArceApps/web-portfolio/pull/59)
- [PR #60 — artículo sobre el mirror privado/público](https://github.com/ArceApps/web-portfolio/pull/60)
- [Artículo técnico: GitHub Pages con repositorio privado y mirror público](/es/blog/github-pages-private-repo-mirror/)
- [GitHub Docs — About self-hosted runners](https://docs.github.com/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
- [GitHub Docs — Deploying with GitHub Actions](https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
