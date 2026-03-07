---
title: "La madurez de mydevbot - CI/CD, eGPUs y el futuro del desarrollo móvil"
description: "La fase final. Cómo mydevbot se despliega a sí mismo usando GitHub Actions y Watchtower, programación desde el móvil con VS Code Server y la preparación del UM890 Pro para IA local extrema vía OCuLink."
pubDate: 2026-03-07
tags: ["devlog", "telegram", "mydevbot", "cicd", "oculink", "egpu", "vscode", "n8n"]
heroImage: "/images/mydevbot-cicd-future-hero.svg"
reference_id: "83523401-9392-426f-b039-f3ae73132d40"
---

Llegamos a la última entrada de esta trilogía sobre **mydevbot**. Si en el [primer artículo](2026-03-05-mydevbot-genesis-hardware) hablé de la odisea para encontrar el hardware perfecto (el Minisforum UM890 Pro) y en el [segundo](2026-03-06-mydevbot-github-cron-skills) detallé cómo le enseñé a usar la API de GitHub y a despertarme con resúmenes diarios, hoy toca hablar de escalabilidad, automatización y de la experiencia real de desarrollo.

Porque aquí hay una paradoja fascinante: he construido un bot de Telegram para gestionar mi desarrollo de software mientras estoy fuera de casa... pero ¿qué pasa cuando quiero desarrollar o mejorar *el propio bot* mientras estoy fuera de casa?

Si estoy en una cafetería, sin mi portátil, y de repente se me ocurre una nueva *Skill* genial para que mydevbot me formatee el código usando *black*, ¿cómo la implemento? No puedo enviarle un mensaje de voz al bot diciéndole "modifica tu propio código fuente", porque eso sería un riesgo de seguridad monumental (además de técnicamente suicida con la versión actual).

Necesitaba cerrar el círculo. Necesitaba que el Mini PC que aloja a mydevbot se convirtiera no solo en un servidor de ejecución, sino en mi entorno de desarrollo remoto completo.

### El entorno de desarrollo móvil: VS Code Server

Escribir código en la pantalla de un móvil de 6 pulgadas es un dolor, lo admito. Pero en el año 2026, los móviles modernos (como mi Pixel) tienen modos de escritorio fantásticos cuando los conectas a un monitor externo o incluso a unas gafas de realidad mixta ligeras. Aún sin accesorios, con un buen teclado Bluetooth plegable, puedes apañarte muy bien.

El problema histórico siempre ha sido el entorno. Configurar Git, Python, las dependencias y un editor decente en Android (usando Termux, por ejemplo) es factible pero tosco.

La solución estaba ya en el propio Mini PC. El UM890 Pro, con sus 32GB de RAM, apenas estaba sudando con el contenedor de *mydevbot*. Decidí instalar **VS Code Server**.

Para los que no lo conozcan, VS Code Server te permite ejecutar el backend de Visual Studio Code en tu servidor remoto y acceder a la interfaz de usuario completa y nativa a través de cualquier navegador web.

Añadí un nuevo contenedor a mi `docker-compose.yml` en el Mini PC: un contenedor oficial de `code-server` de *linuxserver.io*. Lo configuré para mapear la carpeta donde vive el código de *mydevbot* como volumen de trabajo.

Para acceder a él de forma segura desde fuera de casa sin abrir puertos al mundo (y exponerme a ataques de fuerza bruta), utilicé **Tailscale**. Instalé el cliente de Tailscale en el Mini PC y en mi móvil. Así, mi móvil formaba parte de una red privada virtual (VPN) cifrada tipo malla (Mesh) con el Mini PC.

Ahora, el flujo es pura ciencia ficción:
1.  Estoy en el tren.
2.  Enciendo el teclado Bluetooth.
3.  Abro el navegador de mi móvil (Brave) y tecleo la IP de Tailscale de mi Mini PC (ej. `http://100.80.x.x:8443`).
4.  Aparece el editor completo de VS Code, con mis temas, mis atajos de teclado y acceso directo al código de *mydevbot*.

Puedo escribir una nueva función de Python en el editor del navegador, guardar, e inmediatamente probarla ejecutando el script en la terminal integrada del navegador.

Pero aquí surge un problema. Si cambio el código, necesito reiniciar el contenedor Docker de *mydevbot* para que tome los cambios. Y lo que es peor, esos cambios están "sueltos" en el servidor; necesito hacer commit y subirlos a GitHub para no perder el control de versiones.

Podría hacerlo a mano desde la terminal del VS Code Server, pero si he construido un ecosistema automatizado, quería que el despliegue de mi bot fuera también automático.

### CI/CD para un Bot casero: Watchtower al rescate

Quería llegar a un punto donde yo simplemente hiciera `git push` (ya sea desde el VS Code Server en el móvil o desde mi portátil en casa) y el Mini PC se actualizara solo. Un pipeline de Continuous Integration / Continuous Deployment (CI/CD) en toda regla, pero para mi homelab.

Tradicionalmente, en entornos empresariales, un GitHub Action se conectaría por SSH a mi servidor y ejecutaría un script de actualización. O usaría herramientas como ArgoCD. Pero esas opciones son complejas de mantener en un entorno doméstico donde mi IP pública puede cambiar (aunque use Tailscale).

La respuesta más elegante para contenedores Docker es **Watchtower**.

Watchtower es un contenedor cuyo único trabajo es vigilar a otros contenedores. Periódicamente (por ejemplo, cada 5 minutos), Watchtower consulta el registro de imágenes (Docker Hub, o GitHub Container Registry) para ver si hay una versión más nueva de la imagen de un contenedor que se está ejecutando actualmente. Si encuentra una imagen nueva, Watchtower detiene elegantemente el contenedor antiguo, descarga la nueva imagen y la arranca usando exactamente las mismas variables de entorno y volúmenes (`docker-compose` settings) que el contenedor original.

El pipeline completo quedó configurado así:

1.  **Desarrollo:** Modifico el código de `mydevbot` en el navegador (vía VS Code Server) o en local.
2.  **Commit y Push:** Hago `git commit -m "Nueva skill de finanzas"` y `git push`.
3.  **GitHub Actions (CI):** En GitHub, un Action detecta el push. Ejecuta un linter de Python (flake8), pasa los tests unitarios básicos que escribí, y si todo está verde, construye una nueva imagen Docker y la sube al GitHub Container Registry (GHCR) etiquetada como `latest`.
4.  **Watchtower (CD):** En mi Mini PC, Watchtower, que está corriendo en segundo plano, detecta que hay una nueva imagen `latest` en el GHCR.
5.  **Reinicio automático:** Watchtower mata el proceso antiguo de *mydevbot*, descarga la nueva imagen y la arranca.

Todo esto ocurre en unos 3 minutos de reloj. Yo hago `push` desde el móvil, me tomo un sorbo de café, y cuando vuelvo a Telegram, le pregunto a *mydevbot* qué versión está corriendo, y me responde con el nuevo commit hash.

Es la magia del DevOps aplicada a mi vida personal. Ya no hay fricción. Si el bot falla, lo corrijo, hago push, y me olvido.

### El horizonte de la IA Local: El puerto OCuLink y las eGPUs

Llegados a este punto, la arquitectura de software era sólida. Pero quiero hablar de hardware otra vez. De ese puerto OCuLink del que hablé en el primer artículo y que fue el factor decisivo para comprar el Minisforum UM890 Pro en lugar de alternativas más baratas.

Actualmente, *mydevbot* usa la API de Gemini 3.1 Flash-Lite. Es rápida, es casi gratuita, y es brillante para programación. Pero sigue siendo "La Nube". Si mañana me quedo sin internet (y la red de fibra óptica de mi zona tiene cortes ocasionales), o si Google decide cambiar radicalmente los precios de su API, mi cerebro automatizado dejará de funcionar.

La verdadera soberanía de la que hablaba al principio solo se consigue cuando el Modelo de Lenguaje corre físicamente en tu casa.

Para tareas sencillas, el Ryzen 9 8945HS del Mini PC (con su CPU y su NPU) puede correr modelos locales pequeños (como un Llama 3 8B o un Phi-3) a una velocidad aceptable usando herramientas como **Ollama**. Pero si quiero un modelo que pueda leer mis repositorios enteros de código y hacer razonamientos complejos sobre la arquitectura del software, necesito modelos más grandes (de 30B a 70B parámetros).

Y esos modelos devoran VRAM (Memoria de Vídeo).

Aquí es donde el puerto OCuLink entra en juego. El plan para el Q3 de 2026 es adquirir una base eGPU (External GPU) que se conecte por OCuLink. Estas bases son, esencialmente, un zócalo PCIe desnudo con una fuente de alimentación.

Mi objetivo es conectar una tarjeta gráfica dedicada de escritorio, como una **RTX 5070 Ti** o incluso una **RTX 5080** (cuando bajen de precio en el mercado de segunda mano o haya ofertas), directamente al Mini PC.

A diferencia de Thunderbolt 4 o 5, que introducen latencia y cuellos de botella por su encapsulamiento de datos, OCuLink es PCIe puro. La pérdida de rendimiento es marginal (entre un 5% y un 10%).

Con una gráfica de 16GB o 24GB de VRAM conectada a mi Mini PC de bajo consumo, la arquitectura de *mydevbot* evolucionará dramáticamente:
1.  En el día a día, el Mini PC funcionará de forma autónoma con sus 15W de consumo base, gestionando el código, los cron jobs y usando modelos pequeños o la nube.
2.  Cuando necesite que *mydevbot* haga un trabajo pesado (como un refactor automático masivo, o análisis de vulnerabilidades complejos), encenderé remotamente la fuente de alimentación de la eGPU.
3.  El bot detectará la presencia de la tarjeta gráfica y cambiará su backend de inferencia desde la API de Gemini hacia un servidor Ollama/vLLM local corriendo en la eGPU.

Esta hibridación (bajo consumo por defecto, potencia extrema bajo demanda) es el futuro de los servidores domésticos y de los agentes de IA personales.

### Más allá de Python: Explorando n8n y MCP

La construcción manual de Skills en Python es divertida y te da un control total. Pero admitámoslo: a veces quieres conectar dos servicios sin tener que escribir 50 líneas de código y manejar las excepciones de la API HTTP.

Durante las últimas semanas de desarrollo de *mydevbot*, me he encontrado con casos de uso donde escribir código me parecía matar moscas a cañonazos. Por ejemplo, quería que si llegaba un email de facturación a una cuenta específica de Gmail, el bot me avisara por Telegram y lo guardara en una carpeta de Google Drive.

Podía escribir una Skill en Python para Gmail y Drive. Pero es tedioso.

Para solucionar esto, he empezado a integrar **n8n** en mi clúster del Mini PC.
n8n es una herramienta de automatización visual de flujos de trabajo (similar a Zapier o Make, pero open-source y auto-alojable). Te permite conectar cientos de aplicaciones arrastrando y soltando nodos en una interfaz gráfica.

Lo fascinante es que n8n no sustituye a *mydevbot*; lo complementa. He configurado Webhooks en n8n que *mydevbot* puede llamar como si fueran Skills.
Así, si le digo al bot *"Oye, guarda este recibo en mi Drive de facturas"*, el bot invoca la Skill `trigger_n8n_workflow_invoice`, le pasa el archivo, y n8n se encarga visualmente de subirlo a Drive, renombrarlo y clasificarlo. Esta separación de responsabilidades (la IA gestiona la intención y el lenguaje, n8n gestiona la fontanería de las APIs) es extremadamente eficiente.

Por último, el horizonte más prometedor a nivel de software es el **Model Context Protocol (MCP)**, el estándar impulsado por Anthropic.
En lugar de yo tener que programar cada Skill de GitHub a mano (escribiendo código de PyGithub), MCP propone una arquitectura donde las aplicaciones (como GitHub, Notion, o bases de datos locales) exponen servidores MCP.

El modelo de IA simplemente se conecta a esos servidores MCP de forma estándar y "descubre" automáticamente qué herramientas tiene disponibles y cómo usarlas.
Cuando Gemini (o modelos locales como Claude/Llama) adopten MCP de forma universal, la cantidad de código "pegamento" que tendré que escribir para *mydevbot* se reducirá un 90%. El bot será simplemente el orquestador (el cerebro) que se conecta a los distintos órganos sensoriales y actuadores del sistema.

### Epílogo: El fin de la tiranía del PC de sobremesa

Ha sido un viaje intenso desde aquella frustración en el transporte público hasta la sofisticada red de contenedores, IAs e integraciones que tengo hoy en casa.

La lección más importante que he aprendido es que la infraestructura personal debe adaptarse a nuestra forma de vida, no al revés. No tiene sentido estar encadenado a una torre ruidosa y devoradora de electricidad para desarrollar software en el año 2026.

Con un Minisforum UM890 Pro, Tailscale, VS Code Server y un bot en Telegram súper inteligente impulsado por Gemini, he desacoplado el *dónde* estoy del *qué* puedo hacer.

*mydevbot* me recibe cada mañana con un resumen de mis obligaciones, vigila mis servidores mientras duermo, revisa el código que escribo desde mi móvil, y se despliega a sí mismo en silencio cuando detecta mejoras.

Ya no soy un desarrollador en solitario. Tengo un equipo de operaciones trabajando para mí 24/7. Y solo me costó un poco de investigación, algo de hardware compacto, y un fin de semana divertido programando en Python.

El futuro del desarrollo es móvil, asistido, privado y extremadamente potente. Y gracias a proyectos como este, ese futuro ya está zumbando silenciosamente en una estantería de mi salón.

### El impacto en la productividad real y reflexiones finales

Si echo la vista atrás, al momento en que concebí la idea de *mydevbot* en aquel vagón de metro abarrotado, me doy cuenta de que el impacto real de este proyecto va mucho más allá de la mera conveniencia técnica. No se trata solo de poder hacer un `git push` desde el teléfono móvil, ni de recibir un mensaje automatizado cada mañana a las 8:30. Se trata de una transformación fundamental en la forma en que interactúo con mis propios proyectos y con mi carga de trabajo cognitivo.

Antes de la llegada de *mydevbot*, el mantenimiento de mis repositorios personales y de mi infraestructura de servidor doméstico era, a menudo, una tarea pesada. Requería un cambio de contexto mental severo. Tenía que sentarme físicamente frente al ordenador de sobremesa, encender los monitores, abrir el navegador, navegar por múltiples pestañas de GitHub, revisar los logs de los contenedores Docker a través de SSH y, finalmente, intentar recordar qué era exactamente lo que quería hacer horas atrás. Ese proceso, lleno de fricción, a menudo resultaba en procrastinación. Los issues se acumulaban, las actualizaciones de dependencias se posponían y los pequeños bugs de la interfaz de usuario quedaban sin resolver durante semanas, simplemente porque "no valía la pena encender el PC solo para arreglar un padding de CSS".

Hoy, la historia es completamente diferente. *mydevbot* ha democratizado el acceso a mi propio ecosistema de desarrollo, reduciendo la fricción a cero. Cuando encuentro un pequeño error visual mientras pruebo una aplicación en mi teléfono, no tomo una nota mental que inevitablemente olvidaré. Abro Telegram, le envío un mensaje de voz rápido a mi bot explicando el problema, y en cuestión de segundos, la IA ha interpretado mis palabras, ha interactuado con la API de GitHub y ha creado un issue perfectamente formateado, etiquetado y asignado. La tarea sale inmediatamente de mi cabeza y entra en el sistema de seguimiento de manera estructurada y procesable.

Pero la verdadera magia radica en la proactividad impulsada por las tareas cron y APScheduler. El hecho de que el sistema me informe a mí, en lugar de que yo tenga que interrogar al sistema, cambia por completo la dinámica de responsabilidad. Si un disco duro de mi servidor alcanza el 90% de su capacidad, *mydevbot* me alerta inmediatamente en Telegram con un mensaje prioritario. Si un proceso crítico falla durante la noche, me despierto con un resumen detallado del error y, a menudo, con una sugerencia de la IA sobre cómo solucionarlo. Ya no sufro la ansiedad de "¿estará todo funcionando correctamente?". Confío en que mi asistente digital está vigilando y me avisará si mi atención es verdaderamente necesaria.

Además, la integración de VS Code Server y Tailscale ha convertido cualquier dispositivo con un navegador web en una potente estación de trabajo de ingeniería de software. He corregido bugs críticos, revisado y fusionado Pull Requests complejas, e incluso he desplegado nuevas versiones de aplicaciones desde la sala de espera del dentista, utilizando únicamente un teclado Bluetooth plegable y la pantalla de mi smartphone. La sensación de libertad y de control absoluto sobre mi infraestructura es embriagadora.

Mirando hacia el futuro, la hoja de ruta para *mydevbot* es tan ambiciosa como emocionante. La inminente integración de una eGPU a través del puerto OCuLink del Minisforum UM890 Pro abrirá las puertas a la ejecución local de modelos de lenguaje masivos, garantizando una privacidad absoluta y liberándome de la dependencia de las APIs en la nube. La adopción de n8n para la automatización visual de flujos de trabajo complejos reducirá drásticamente la cantidad de código personalizado que necesito escribir, permitiendo que el bot interactúe con cientos de servicios externos con solo unos pocos clics. Y la llegada del Model Context Protocol (MCP) estandarizará la forma en que las IAs descubren y utilizan las herramientas, convirtiendo a *mydevbot* en un orquestador universal capaz de manejar cualquier tarea que le proponga.

En última instancia, *mydevbot* no pretende ser un producto comercial revolucionario que compita con gigantes como Clawbot. No he inventado nada nuevo aquí; simplemente he conectado servicios ya existentes (Telegram, Gemini, Docker, GitHub) mediante código pegamento en Python. Sin embargo, el valor real reside en que está hecho a medida para mis necesidades, no me cuesta dinero extra al mes, y mantiene mis datos privados bajo mi control.

Esta trilogía es una demostración de cómo, con las herramientas actuales y una pizca de ingenio, cualquier desarrollador puede automatizar las partes aburridas de su trabajo. La era del desarrollo donde todo es fricción manual puede terminar, y tener a un bot en Telegram vigilando los repositorios mientras duermes no es magia, es simple sentido práctico.
