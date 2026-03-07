---
title: "El nacimiento de mydevbot y la odisea del hardware perfecto"
description: "Cómo surge la necesidad de controlar mi ecosistema de desarrollo desde Telegram, el análisis del repositorio AIPAL, la decepción con el Synology DS212+ y la decisión final por un Mini PC con el SDK nativo de Gemini."
pubDate: 2026-03-05
tags: ["devlog", "telegram", "mydevbot", "gemini", "hardware", "minipc", "docker"]
heroImage: "/images/mydevbot-hardware-hero.svg"
reference_id: "a2e2f3d0-729b-4fcb-ae9c-5c9c95977d00"
---

A veces, las mejores ideas nacen de la frustración pura y dura. Era un jueves por la tarde, estaba en el transporte público, volviendo a casa después de una jornada agotadora, y de repente me acordé de que no había revisado una Pull Request crítica en uno de mis repositorios personales. Tampoco había programado el cron para una tarea de mantenimiento que debía ejecutarse esa misma noche. Saqué el móvil, abrí el navegador, entré a GitHub y me encontré con la típica experiencia móvil: hacer zoom, intentar pulsar el botón correcto con mis dedos torpes, lidiar con la conexión intermitente del metro... Fue un desastre.

En ese momento, miré la aplicación de Telegram que acababa de abrir para responder un mensaje y tuve una epifanía. Telegram es rápido, ligero, funciona perfectamente incluso con coberturas pésimas y su API para bots es una de las mejores de la industria. ¿Y si pudiera gestionar todo mi ecosistema de desarrollo, mis repositorios, mis tareas programadas y mi infraestructura directamente desde un chat de Telegram? ¿Y si pudiera tener un asistente inteligente, impulsado por Inteligencia Artificial, que no solo ejecutara comandos, sino que entendiera mis intenciones en lenguaje natural?

Ese fue el germen de **mydevbot**. Un bot personal, privado, soberano y extremadamente capaz. Pero del concepto a la realidad hay un abismo tecnológico. En esta primera entrada de mi diario de desarrollo, voy a relatar los primeros pasos de este proyecto, que comenzaron no con código, sino con una profunda investigación sobre arquitectura y hardware. Porque, como pronto descubriría, la nube de otra persona no era el lugar adecuado para mi asistente personal.

### El punto de partida: Explorando el ecosistema existente

Mi primera reacción, como buen desarrollador, fue buscar si alguien ya había resuelto este problema. No tenía sentido reinventar la rueda si ya existía una solución robusta y de código abierto. Durante mis investigaciones me topé con un repositorio muy interesante llamado [AIPAL](https://github.com/antoniolg/aipal), creado por antoniolg.

AIPAL propone usar Telegram como puente para interactuar con una IA local. La premisa es fantástica: mantienes la privacidad, usas tus propios recursos y tienes una interfaz de chat universal. Lo cloné, lo configuré y funcionó. Era mágico poder enviar un mensaje desde la calle y que mi PC en casa procesara la petición y me devolviera la respuesta de la IA. El bot actuaba como un puente perfecto. No necesitaba abrir puertos en mi router ni lidiar con configuraciones complejas de NAT, ya que la librería de Telegram utiliza *long polling*. El bot simplemente pregunta periódicamente a los servidores de Telegram si hay mensajes nuevos.

Sin embargo, tras la euforia inicial, las limitaciones se hicieron evidentes. AIPAL y soluciones similares tienen un talón de Aquiles fundamental para mi caso de uso: requieren que el equipo donde se ejecutan esté encendido y conectado a Internet permanentemente. En mi caso, eso significaba dejar mi ordenador principal (una torre potente, ruidosa y con un consumo energético nada despreciable) encendido 24/7.

Dejar una máquina de 600W encendida todo el día solo para mantener vivo un bot de Telegram que recibe unas pocas docenas de mensajes al día es ineficiente desde cualquier punto de vista. Económicamente es un despilfarro en la factura de la luz, y ecológicamente es irresponsable. Además, el ruido de los ventiladores en el silencio de la noche era una molestia constante. Necesitaba otra solución. El concepto de AIPAL validó mi hipótesis de que Telegram era la interfaz perfecta, pero me obligó a replantearme completamente el hardware.

### La ilusión del Synology DS212+ y el choque con la realidad

Pensando en hardware de bajo consumo que ya tuviera en casa, mi mirada se posó en un rincón de mi estantería donde acumulaba polvo un viejo pero leal servidor NAS: el **Synology DS212+**. Es un modelo clásico, lanzado en 2012. En su época dorada era una maravilla para el almacenamiento en red, y lo mejor de todo: consume poquísimo. Estamos hablando de unos 15-20W en pleno rendimiento y apenas unos pocos vatios en reposo. Parecía el candidato ideal.

La idea era brillante: ejecutar el bot en el NAS. El NAS ya está encendido siempre, gestionando mis copias de seguridad y mis archivos multimedia. ¿Qué más da añadirle un pequeño script de Python para gestionar a *mydevbot*?

Me conecté por SSH al viejo DS212+. La terminal me recibió con ese familiar y espartano prompt de Linux recortado. Empecé a revisar las especificaciones y las posibilidades. Y aquí fue donde mis sueños se chocaron violentamente contra el muro de la obsolescencia tecnológica.

El primer gran problema: el procesador. El DS212+ cuenta con un procesador ARM antiguo de 32 bits. La memoria RAM es de apenas 512 MB. Esto, en el año 2026, es el equivalente tecnológico a intentar cruzar el océano en una cáscara de nuez. Pero el verdadero clavo en el ataúd fue la **ausencia de soporte para Docker**.

En la familia Synology, solo los modelos de la serie "+" más recientes y con procesadores x86_64 (Intel o AMD) tienen soporte oficial y funcional para Docker (o Container Manager, como lo llaman ahora). Para modelos de las series J o Play, y ciertamente para un modelo de 2012, Docker es un sueño imposible.

¿Por qué es tan crítico Docker? Podría simplemente instalar Python, dirás. Y sí, es posible instalar Python 3 en el DS212+ a través del centro de paquetes o usando repositorios comunitarios como Entware. Pero desarrollar, desplegar y mantener una aplicación moderna en un entorno tan hostil y frágil es una receta para el desastre. Gestionar dependencias virtualizadas, compilar librerías en C que a menudo requiere el ecosistema de IA, y lidiar con un sistema operativo propietario (DSM) que no está pensado para ser un servidor de aplicaciones de propósito general... no era el camino.

Imaginé el flujo de trabajo: escribir el código en mi portátil, pasarlo por SCP al NAS, cruzar los dedos para que las dependencias de pip se instalaran correctamente en esa arquitectura ARMvet vieja, y usar el programador de tareas del NAS para reiniciar el script si fallaba. Era volver a las prácticas de despliegue de hace quince años. La fricción sería tan alta que terminaría abandonando el proyecto.

El Synology DS212+ quedó descartado. Sigue siendo un excelente guardián de mis archivos históricos, pero para albergar a *mydevbot*, necesitaba algo moderno, eficiente y versátil.

### La revolución de los Mini PC: El equilibrio perfecto

Descartado el PC principal por consumo y el NAS por obsolescencia, evalué las alternativas de servidores en la nube. Un VPS gratuito de Oracle o una pequeña instancia en AWS EC2. Pero aquí entraban en juego mis principios de **soberanía tecnológica**. Si este bot iba a tener acceso a todos mis repositorios privados, a mis tareas, a mi calendario, y si iba a ser mi "cerebro extendido", no quería que estuviera alojado en la infraestructura de un gigante tecnológico, sujeto a cambios de términos de servicio, caídas regionales o inspecciones de datos. Quería el hierro en mi casa. Físicamente bajo mi control.

Esto me llevó al fascinante y competitivo mundo de los Mini PC modernos. En los últimos años, el mercado de los Mini PC ha explotado, impulsado por los avances en procesadores de portátiles que ofrecen un rendimiento espectacular con un consumo ridículamente bajo.

Pasé días investigando, viendo benchmarks y comparando opciones. La balanza se inclinó rápidamente hacia plataformas basadas en AMD Ryzen. Mis finalistas fueron tres modelos específicos que marcaban el punto dulce entre precio, potencia, eficiencia y, crucialmente, conectividad futura.

El rey indiscutible de mis opciones era el **Minisforum UM890 Pro**. Con un procesador Ryzen 9 8945HS (arquitectura Hawk Point con NPU integrada para tareas de IA), 32GB de RAM DDR5 y conectividad de sobra. Este bicho es el equivalente a un portátil de altísima gama comprimido en una caja del tamaño de un libro pequeño. Su consumo en reposo ronda los 10-15W, y a pleno rendimiento no pasa de los 65W. Era el sueño húmedo del homelabber. Sin embargo, su precio rondaba los 800€. Una inversión importante.

Como alternativas más económicas, alrededor de los 500€, estaban el **Minisforum UM780 XTX** y el **GMKtec K8**. Ambos montan el excelente Ryzen 7 7840HS. Un paso por detrás del 8945HS, pero con potencia más que de sobra para ser el cerebro de mi hogar digital, ejecutar decenas de contenedores Docker sin sudar y manejar el bot con soltura.

Lo que hacía que estos modelos destacaran por encima de otras opciones más baratas (como los típicos Intel N100) era una característica clave que pesó mucho en mi decisión a largo plazo: el **puerto OCuLink**.

Aunque inicialmente *mydevbot* se comunicaría con la API en la nube de Gemini, mi visión a futuro es tener la capacidad de ejecutar LLMs complejos (modelos de razonamiento profundo) de forma 100% local. Para eso se necesita potencia gráfica (VRAM). Las gráficas integradas (las Radeon 780M de estos Ryzen) son sorprendentemente buenas, pero no pueden competir con una GPU dedicada.

El puerto OCuLink (Optical-Copper Link) es una conexión PCIe directa x4. Es mucho más eficiente que Thunderbolt 4/5 para conectar una tarjeta gráfica externa (eGPU). Con una base eGPU OCuLink, podría conectar en el futuro una gráfica de escritorio (como una hipotética RTX 5070 o 5080) directamente al Mini PC. La pérdida de rendimiento respecto a pincharla en una placa base tradicional es de apenas un 5-10%. Es decir, el Mini PC me daba el bajo consumo de un portátil para el día a día, con la capacidad de transformarse en un monstruo del procesamiento de IA cuando lo necesitara, simplemente enchufando un cable.

Finalmente, decidí adquirir el Minisforum UM890 Pro. Quería ese extra de potencia de la NPU integrada y la tranquilidad de tener hardware top-tier para los próximos cinco años. Lo recibí en casa, le instalé Ubuntu Server 26.04 LTS y configuré el entorno base con Docker y Docker Compose. Ver el sistema arrancar en segundos y consumir apenas 11 vatios me confirmó que había tomado la decisión correcta. Ya tenía el hogar perfecto para *mydevbot*.

### La arquitectura del software: ¿Gemini CLI o SDK Nativo?

Con el hardware listo (el UM890 Pro ronroneando silenciosamente en una estantería del salón), tocaba definir el stack de software. Sabía que usaría Python. Sabía que usaría la librería `python-telegram-bot` para gestionar la comunicación por long-polling con los servidores de Telegram. Pero la pieza central era el cerebro de la IA.

Inicialmente, evalué usar la herramienta oficial **Gemini CLI**. Es una herramienta fantástica para bash scripts y automatizaciones rápidas. Podía hacer que el script de Python lanzara un subproceso (`subprocess.run`), ejecutara el comando de la CLI de Gemini pasándole el mensaje del usuario, capturara la salida estándar y la enviara de vuelta por Telegram.

Hice una prueba de concepto. Funcionaba. Pero era torpe.

El enfoque basado en CLI tiene varios problemas graves cuando intentas construir un bot conversacional persistente:

1. **Gestión del contexto y el estado:** Cada llamada a la CLI es, por defecto, independiente (stateless). Para mantener una conversación fluida, tendría que guardar el historial de la conversación en un archivo temporal, pasárselo entero a la CLI en cada llamada, y parsear la respuesta. Una pesadilla de ineficiencia.
2. **Latencia (Overhead de arranque):** Por muy rápido que sea invocar un binario, lanzar un subproceso nuevo del sistema operativo por cada mensaje añade latencia. Quería que *mydevbot* fuera instantáneo, ágil.
3. **Manejo de errores ciego:** Capturar errores analizando el texto de salida de un comando de terminal (stderr) es frágil. Si la API cambia su formato de error, el bot se rompe en silencio.
4. **Pérdida de funcionalidades avanzadas:** Características como el "Function Calling" (donde la IA decide ejecutar una herramienta externa, como consultar la API de GitHub) son tremendamente complejas de implementar parseando texto de una CLI.

La decisión fue obvia: debía utilizar el **SDK oficial de Google GenAI para Python** (`google-genai`).

Al integrar el SDK directamente en el código de mi bot, obtenía un control absoluto. Podía inicializar una instancia del modelo **Gemini 1.5 Flash** (elegí Flash por su extrema velocidad y bajísimo coste/gratuidad en el nivel básico, ideal para un asistente rápido). El SDK permite manejar sesiones de chat con estado persistente. Solo tengo que instanciar un objeto `ChatSession`, pasarle el nuevo mensaje del usuario, y el SDK se encarga de enviar todo el contexto previo a la API y devolver la respuesta.

El código se simplificaba enormemente:

```python
import google.generativeai as genai

# Configuración inicial
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')
chat_session = model.start_chat(history=[])

def handle_message(update, context):
    user_text = update.message.text
    # Enviar al modelo, manteniendo contexto
    response = chat_session.send_message(user_text)
    # Responder en Telegram
    update.message.reply_text(response.text)
```

Esa simplicidad es poder. Con el SDK nativo, las respuestas llegan en milisegundos. El manejo de excepciones (cuotas excedidas, errores de red) se gestiona elegantemente con bloques `try-catch`. Y lo más importante, me abría las puertas de par en par a las herramientas (Tools/Skills) de Gemini, lo que me permitiría integrar GitHub de forma nativa. Pero de eso hablaré en el próximo artículo.

### Conclusión de esta primera fase: El nacimiento de mydevbot

Esa misma noche de domingo, tras horas de configuración del servidor y de escribir la estructura básica del bot en Python, llegó el momento de la verdad. Empaqueté el código en un contenedor Docker usando un sencillo `Dockerfile`, creé un `docker-compose.yml` para gestionar las variables de entorno (el Token de Telegram y la API Key de Gemini, seguras y protegidas), y ejecuté el comando mágico:

`docker compose up -d`

El contenedor arrancó. Revisé los logs: `[INFO] Bot started. Polling Telegram servers...`

Apagué el Wi-Fi de mi móvil, conectándome a la red 5G para simular que estaba fuera de casa. Abrí Telegram, busqué a `@my_private_dev_bot` y le escribí el mensaje inaugural:

`"Hola, ¿estás ahí? Dime qué hardware te está ejecutando."`

Pasó medio segundo. El doble check de Telegram se puso azul. Y la respuesta apareció en mi pantalla:

`"¡Hola! Estoy en línea y listo. Analizando mi entorno... me estoy ejecutando dentro de un contenedor Linux (seguramente Docker). Y a juzgar por el número de núcleos que veo en /proc/cpuinfo, estoy corriendo en un monstruo de 8 núcleos y 16 hilos. ¿En qué puedo ayudarte jefe?"`

No pude evitar sonreír. Había nacido **mydevbot**. Ya no dependía de que mi ruidoso PC de sobremesa estuviera encendido. Tenía un servidor de bajo consumo, potente y dedicado, y una arquitectura de software limpia y nativa.

El puente entre mi móvil en cualquier parte del mundo y mi ecosistema de desarrollo estaba construido. Pero un puente no es útil si no lleva a ninguna parte. El bot podía charlar, pero aún no podía *trabajar*.

El siguiente paso, el verdadero reto que cambiaría mi forma de trabajar, era dotarlo de habilidades reales. Enseñarle a interactuar con la API de GitHub para que pudiera leer mis repositorios, crear issues y gestionar mis tareas. Y, por supuesto, implementar un sistema de tareas cron para que el bot me informara proactivamente, en lugar de esperar a mis órdenes.

Todo eso será el tema principal de la próxima entrada en esta bitácora. La verdadera revolución de *mydevbot* acaba de empezar. Nos leemos mañana.

*(Continúa en: Enseñando a mydevbot a programar - GitHub Skills y Tareas Cron)*
