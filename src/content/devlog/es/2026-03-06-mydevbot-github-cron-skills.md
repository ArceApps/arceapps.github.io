---
title: "Enseñando a mydevbot a programar - GitHub Skills y Tareas Cron"
description: "La segunda fase de mydevbot. Cómo integrar la API de GitHub usando las capacidades de Function Calling de Gemini y configurar tareas programadas con APScheduler para recibir resúmenes diarios."
pubDate: 2026-03-06
tags: ["devlog", "telegram", "mydevbot", "gemini", "github", "cron", "python"]
heroImage: "/images/mydevbot-skills-cron-hero.svg"
reference_id: "0463727d-8058-4f3a-b565-1baec56b3470"
---

Ayer dejé la historia en un punto dulce. Tenía a **mydevbot** funcionando en su nueva y flamante casa: un Mini PC Minisforum UM890 Pro con un consumo irrisorio y potencia de sobra. El bot podía responder mensajes en Telegram en milisegundos gracias al uso del SDK nativo de Google Gemini (específicamente, Gemini 3.1). Era rápido, eficiente y privado.

Pero seamos sinceros: un bot que solo sirve para charlar, por muy rápido que sea, no es más que un ChatGPT glorificado con otra interfaz. Para que *mydevbot* se ganara su nombre y realmente revolucionara mi flujo de trabajo, necesitaba darle manos. Necesitaba que pudiera tocar mis repositorios, leer mi código, gestionar mis problemas y mantener un ojo en mi infraestructura mientras yo estaba ocupado en otras cosas.

El objetivo de esta segunda fase de desarrollo era doble, y muy centrado en el pragmatismo:
1.  **Integración profunda con GitHub:** Lograr que el bot pudiera gestionar repositorios enteros, crear issues y revisar Pull Requests, replicando funcionalidades que ya ofrecen herramientas comerciales como Clawbot, pero sin pagar suscripciones ni comprometer la privacidad del código.
2.  **Proactividad mediante tareas Cron:** Que el bot dejara de ser puramente reactivo. Quería que me despertara por la mañana con un resumen de los issues pendientes, automatizando una parte aburrida de la gestión de proyectos.

Esta es la crónica de cómo ensamblé piezas estándar de software para que *mydevbot* pasara de ser un simple loro conversacional a un asistente de gestión útil y práctico.

### Implementando Skills: Function Calling con Gemini

En el mundo de los Modelos de Lenguaje Grande (LLMs), el "Function Calling" (o invocación de herramientas/skills) ya es un estándar consolidado. Hay miles de ejemplos en GitHub y la documentación de Google o OpenAI es muy clara al respecto. Básicamente, en lugar de intentar engañar a la IA con prompts complejos para que te devuelva un JSON o una palabra clave, le das un manual de instrucciones explícito sobre qué herramientas (funciones de Python) tiene a su disposición.

La IA, de forma nativa, decide cuándo es apropiado usar una herramienta basándose en la petición del usuario.

Para *mydevbot*, esto significaba que podía ahorrar muchísimo tiempo en programación. No tenía que escribir un complejo árbol de `if/else` para analizar si el usuario decía "crea un issue" o "revisa este repo". Simplemente le daba a Gemini la herramienta y él se encargaba de la semántica.

El primer paso fue integrar la API de GitHub. Utilicé la librería **PyGithub**, un wrapper excelente y robusto para interactuar con la API REST v3 de GitHub en Python. El reto principal aquí era la seguridad. Bajo ningún concepto iba a quemar mis credenciales directamente en el código. Generé un **Personal Access Token (PAT)** en GitHub con permisos estrictamente limitados (lectura de repositorios y escritura de issues/PRs, pero sin permisos para borrar repositorios). Este token se cargaría como variable de entorno segura en el contenedor Docker.

Una vez asegurado el acceso, empecé a definir las "Skills" de *mydevbot*. La primera y más obvia: obtener un resumen de los repositorios.

Definí la función en Python usando PyGithub:

```python
from github import Github
import os

def get_repo_summary(repo_name: str) -> str:
    """Obtiene un resumen del estado actual de un repositorio en GitHub (estrellas, forks, issues abiertos)."""
    try:
        g = Github(os.environ["GITHUB_PAT"])
        repo = g.get_repo(repo_name)

        summary = f"Repositorio: {repo.full_name}\n"
        summary += f"Descripción: {repo.description}\n"
        summary += f"Estrellas: {repo.stargazers_count}\n"
        summary += f"Issues abiertos: {repo.open_issues_count}\n"
        return summary
    except Exception as e:
        return f"Error al acceder al repositorio: {str(e)}"
```

La magia ocurre en cómo le pasas esta función al SDK de Gemini. Cuando inicializas el modelo, le indicas que tiene esta herramienta disponible. El modelo lee el docstring (`"""Obtiene un resumen..."""`) y las anotaciones de tipo (`repo_name: str`) para entender cómo y cuándo usarla.

La primera prueba fue un momento de pura euforia nerd. Abrí Telegram y le escribí a *mydevbot*:
*"Oye, ¿cómo va el repositorio de ArceApps/PuzzleHub? ¿Tenemos mucho trabajo pendiente?"*

En el backend, observé los logs del servidor. El flujo fue el siguiente:
1.  Gemini recibió mi mensaje.
2.  Analizó mi intención y determinó que necesitaba consultar datos de GitHub para responderme.
3.  En lugar de generar texto de respuesta, Gemini me devolvió una petición estructurada: *"Quiero ejecutar la función `get_repo_summary` con el parámetro `repo_name="ArceApps/PuzzleHub"`"*.
4.  Mi script de Python interceptó esta petición, ejecutó la función real contra la API de GitHub, y obtuvo el texto con las estrellas y los issues.
5.  Mi script le devolvió esos datos a Gemini.
6.  Finalmente, Gemini analizó esos datos y redactó la respuesta natural para Telegram: *"Acabo de revisar el repositorio ArceApps/PuzzleHub. Actualmente tiene 3 issues abiertos pendientes de revisar. ¿Quieres que te liste los títulos de esos issues?"*

¡Funcionaba! El bot estaba usando herramientas de forma autónoma. Y la respuesta natural (el hecho de que me preguntara si quería listar los títulos) demostraba que mantenía el contexto y razonaba sobre los datos obtenidos, no era un simple volcado de base de datos.

### Ampliando el arsenal: De leer a escribir

Leer datos está bien, pero el verdadero poder reside en actuar. La siguiente fase fue dotar a *mydevbot* de la capacidad de interactuar activamente con mis proyectos. Escribir código, crear incidencias, comentar PRs.

Creé una suite completa de herramientas para GitHub. Algunas de las más útiles que implementé esa misma tarde fueron:

*   `create_github_issue(repo_name: str, title: str, body: str, labels: list)`: Para reportar bugs sobre la marcha. Si estoy probando una de mis apps en el móvil y encuentro un error de UI, ya no tengo que abrir el portátil. Simplemente voy a Telegram y le digo a mydevbot: *"Crea un issue en el repo de la web indicando que el botón de contacto en modo oscuro no tiene suficiente contraste. Etiquétalo como bug y ui"*. El bot extrae los parámetros perfectamente y crea el ticket.
*   `get_latest_pr_diff(repo_name: str)`: Esta fue una de mis favoritas. Le permite al bot leer el diff (los cambios de código) de la última Pull Request abierta. Y como Gemini tiene una ventana de contexto enorme (especialmente la versión 3.1 Pro, aunque en la 3.1 también funciona muy bien para diffs medianos), puede analizar ese código y buscar errores.
*   `comment_on_pr(repo_name: str, pr_number: int, comment: str)`: El complemento lógico de la anterior. Después de que el bot lee el diff, puede publicar un comentario directamente en GitHub.

Recuerdo la primera vez que probé el flujo completo. Había subido un pequeño parche desde el portátil, pero no estaba seguro de si había introducido un posible problema de concurrencia. Me fui al sofá, abrí Telegram y le pedí a mydevbot que revisara el PR.

El bot consultó la API, descargó el diff, lo analizó (usando su conocimiento inherente de programación) y me respondió: *"He revisado la PR #42. El código parece sólido en general, pero en el archivo `worker.py` estás usando un diccionario compartido entre hilos sin un cerrojo (lock). Esto podría causar condiciones de carrera. ¿Quieres que deje este comentario en la PR por ti?"*.

Le respondí con un simple *"Sí, por favor, y añade que lo revisaré mañana"*. Segundos después, mi teléfono vibró con una notificación de la app oficial de GitHub: *mydevbot* había comentado en mi PR exactamente lo que le había pedido, redactado con un tono profesional.

El nivel de fricción para gestionar mis proyectos se había reducido a casi cero. Podía hacer tareas de revisión, planificación y triage de bugs mientras caminaba por la calle, usando solo mi voz (a través de los mensajes de voz de Telegram, que también integramos usando Whisper, pero esa es otra historia) y mi bot personal.

### La necesidad de la proactividad: El problema de ser reactivo

Hasta este punto, *mydevbot* era una herramienta formidable, pero seguía siendo reactiva. Solo hacía cosas cuando yo le hablaba. Y uno de los problemas fundamentales de la gestión de infraestructuras personales o proyectos paralelos es el olvido.

Si no me acuerdo de preguntarle al bot cómo están los repositorios, los issues se acumulan. Si no le pregunto por el estado del servidor, un disco duro puede llenarse silenciosamente hasta causar un fallo catastrófico. Un verdadero asistente no espera a que le preguntes si la casa se está quemando; te avisa en cuanto huele a humo.

Necesitaba implementar tareas en segundo plano. Necesitaba **Cron**.

En el entorno tradicional de Linux, configurar tareas repetitivas se hace con el demonio cron (editando `crontab`). Es fiable, sólido como una roca, pero es un componente del sistema operativo. Si configuraba cron en el Mini PC a nivel de sistema para llamar a scripts de Python, estaría rompiendo el encapsulamiento de mi entorno Docker. Además, perdería la integración fluida con la instancia persistente del bot y el SDK de Gemini.

Quería que las tareas programadas vivieran dentro del mismo código de *mydevbot*, compartiendo el mismo contexto de memoria, la misma sesión de Telegram y las mismas herramientas de GitHub. La respuesta era obvia para cualquier desarrollador de Python: **APScheduler** (Advanced Python Scheduler).

APScheduler es una librería fantástica que te permite programar trabajos en Python de forma similar a cron, pero integrado directamente en tu aplicación. Es ligero, no requiere procesos externos y se integra de maravilla con aplicaciones asíncronas como `python-telegram-bot`.

### Implementando APScheduler: El briefing matutino

La integración fue sorprendentemente sencilla. Añadí la dependencia a mi `requirements.txt` y modifiqué el script principal del bot.

El objetivo inaugural para el sistema de cron era crear el **Briefing Matutino**. Quería que, todos los días a las 08:30 de la mañana, de lunes a viernes, *mydevbot* me enviara un mensaje estructurado con un resumen de todo lo que necesitaba saber para empezar el día.

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

async def morning_briefing(context: ContextTypes.DEFAULT_TYPE):
    chat_id = os.environ["MY_TELEGRAM_CHAT_ID"]

    # Recopilar datos (usando las funciones ya creadas)
    repo_status = get_repo_summary("ArceApps/PuzzleHub")

    # Pedirle a Gemini que formatee el resumen de forma amigable
    prompt = f"Actúa como mi asistente personal. Redacta un mensaje de buenos días amable y profesional. " \
             f"Incluye este estado del repositorio principal de forma resumida: {repo_status}. " \
             f"Añade un mensaje motivacional corto al final."

    response = chat_session.send_message(prompt)

    # Enviar el mensaje por Telegram de forma proactiva
    await context.bot.send_message(chat_id=chat_id, text=response.text)

# En la inicialización del bot:
scheduler = AsyncIOScheduler()
scheduler.add_job(
    morning_briefing,
    trigger=CronTrigger(day_of_week='mon-fri', hour=8, minute=30),
    args=[application] # Pasar la instancia de la app de Telegram
)
scheduler.start()
```

Ese código es la base de la proactividad. El bloque `CronTrigger` permite una flexibilidad increíble. Podía programar tareas para que se ejecutaran cada hora, el primer domingo de cada mes, o combinaciones complejas.

La mañana siguiente a implementar esto fue mágica. Estaba tomando el primer café del día, preparándome mentalmente para la jornada laboral, cuando el móvil vibró a las 08:30 en punto. Era un mensaje de Telegram de *mydevbot*:

*"¡Buenos días jefe! Espero que hayas descansado. Aquí tienes el briefing de hoy: El repositorio ArceApps/PuzzleHub tiene actualmente 3 issues abiertos esperando tu atención y 1 Pull Request lista para revisión de merge. Parece que la comunidad ha estado activa esta noche. Recuerda que pequeños avances constantes construyen grandes proyectos. ¡A por el día!"*

No tuve que abrir ninguna app. No tuve que acordarme de mirar. La información vino a mí, filtrada, formateada de manera agradable y en el momento exacto en que la necesitaba.

A partir de ahí, las posibilidades de los "jobs" de APScheduler explotaron en mi cabeza. Empecé a añadir más tareas cron al arsenal de *mydevbot*:

*   **Monitor de salud del servidor (Cada 6 horas):** Un script sencillo que lee el uso de CPU, RAM y disco del Mini PC. Si alguno de estos valores supera el 90%, el bot me envía una alerta urgente (usando un formato de texto rojo/negrita) a Telegram advirtiéndome del cuello de botella.
*   **Limpieza de contenedores Docker (Domingos a las 3:00 AM):** Un script que ejecuta un `docker system prune -f` para liberar espacio, y luego me manda un mensaje confirmando los megabytes liberados.
*   **Recordatorios de Stand-up (Lunes a las 10:00 AM):** Un ping rápido preguntándome cuáles son mis objetivos semanales para el proyecto devlog, obligándome a escribirlos y, por tanto, a comprometerme con ellos.

### Reflexión: El salto cualitativo

Pasar de un bot conversacional reactivo a un asistente proactivo integrado con la API de mis herramientas principales fue un salto cualitativo brutal. Ya no era solo una prueba de concepto divertida. Era una herramienta de productividad real, alojada en mi propio hardware (el heroico UM890 Pro), sin suscripciones mensuales recurrentes y con total privacidad de mis datos.

Había resuelto el problema inicial. Ya podía gestionar mis repositorios desde el metro sin frustrarme con interfaces web móviles. Podía enterarme de los problemas de los servidores antes de que los usuarios se quejaran. Había logrado mi objetivo.

Pero, como cualquier desarrollador sabe, un proyecto nunca está realmente terminado. Una vez que resuelves el problema principal, empiezas a ver nuevas oportunidades. El entorno era perfecto, el código base era sólido y la arquitectura modular me invitaba a soñar a lo grande.

Si podía crear issues desde el móvil, ¿por qué no poder escribir código complejo? Si tenía un puerto OCuLink libre en el Mini PC, ¿por qué limitarme a la API en la nube si podía conectar una gráfica dedicada de escritorio y correr modelos enormes en local? Y si la configuración manual del código en Python se volvía tediosa para flujos muy complejos, ¿qué herramientas visuales podía integrar?

Estas ambiciones marcarían la tercera y última fase de esta etapa de desarrollo. Una fase centrada en la evolución continua, en la automatización del propio código del bot (CI/CD) y en la exploración de las tecnologías más punteras (eGPUs, herramientas de automatización como n8n y el nuevo estándar MCP de Anthropic). Todo esto, junto con la ironía de cómo *mydevbot* se actualiza a sí mismo, será la historia que cerrará esta trilogía mañana.

### La escalabilidad y el futuro inmediato de las Skills

Antes de concluir esta entrada, creo que es fundamental reflexionar sobre lo que significa realmente esta arquitectura basada en Skills y Cron para el futuro de mi trabajo diario. Hemos pasado de un simple script que responde mensajes a un sistema operativo personal distribuido en la nube, pero anclado firmemente en el hardware de mi hogar.

La modularidad de las funciones de Python, expuestas a través del SDK de Gemini, significa que el límite de lo que *mydevbot* puede hacer está definido únicamente por las APIs que decida integrar. Si mañana quiero que el bot gestione mis finanzas personales, solo tengo que crear un archivo `finance_skills.py`, integrar la API de mi banco, añadir la descripción correspondiente en el docstring y reiniciar el contenedor. Gemini entenderá inmediatamente su nuevo propósito y sus nuevas capacidades.

Esta extensibilidad orgánica es el sueño húmedo de cualquier desarrollador de software. No hay que reescribir la interfaz de usuario, no hay que diseñar nuevos menús ni botones en Telegram. La interfaz es el lenguaje natural, y el lenguaje natural es universal.

Además, el uso de APScheduler ha transformado mi relación con la información. Ya no soy yo quien persigue los datos de mis proyectos; son los datos los que vienen a mí cuando son relevantes. El resumen matutino es solo el principio. Imagino un futuro cercano donde *mydevbot* no solo me informa de los problemas, sino que, utilizando sus Skills de GitHub, propone y ejecuta soluciones automatizadas (como auto-asignarse PRs triviales, aprobar cambios de dependencias menores, o incluso reiniciar servidores que no responden) notificándome únicamente cuando la tarea se ha completado con éxito.

El verdadero reto ahora no es técnico, sino conceptual. ¿Cuánta autonomía estoy dispuesto a darle a este sistema? ¿Hasta qué punto quiero que una IA gestione mis repositorios sin mi supervisión directa? Son preguntas fascinantes que iré respondiendo a medida que el proyecto madure. De momento, he construido los cimientos perfectos. Mañana exploraremos cómo escalar esta infraestructura y prepararla para el futuro.
