---
title: "Coucou: supervisar agentes sin abandonar el editor"
description: "Investigamos cómo Coucou conecta agentes, escritorio y móvil para revisar permisos, observar sesiones y reducir interrupciones sin perder control."
pubDate: 2026-10-26
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["Coucou", "agentes de IA", "Claude Code", "Codex", "Android"]
canonical: "https://arceapps.com/es/devlog/2026-w44-coucou-agent-supervision/"
heroImage: "/images/devlog/coucou-agent-supervision.svg"
tags: ["devlog", "IA", "coding agents", "Open Source", "Android", "Linux", "seguridad"]
draft: false
reference_id: "coucou-agent-supervision-2026-w44"
---

Una sesión de un agente de programación puede durar bastante más que la instrucción que la puso en marcha. Lee archivos, propone cambios, ejecuta herramientas y, justo cuando uno está concentrado en otra cosa, se detiene para preguntar si puede continuar. A veces necesita permiso para un comando. Otras veces no sabe qué alternativa escoger. El problema no es que pregunte: **lo preocupante sería que dejara de preguntar**. El problema es que cada respuesta parece exigir volver a la terminal, encontrar la ventana correcta y reconstruir mentalmente qué estaba haciendo ese agente.

Ese detalle aparentemente pequeño es el motivo para estudiar [Coucou](https://github.com/Louis-CFM/coucou). No lo he desarrollado, no es un producto de ArceApps y **esta entrada no documenta una instalación ni una prueba práctica propia**. Es una bitácora de investigación: una lectura crítica de su diseño y de los contratos técnicos que lo hacen interesante. Me interesa una cuestión concreta: ¿podemos separar el trabajo prolongado de un agente de las pequeñas decisiones humanas que lo desbloquean, sin convertir el móvil en un mando a distancia peligroso?

El repositorio, impulsado por Louis Raillé y con la aplicación Android y parte del enlace móvil desarrollados por Rhytam Biswas, ofrece una respuesta con matices. Coucou muestra el estado de agentes como Claude Code, Codex, Gemini CLI, Cursor, OpenCode, Amp y Hermes en una pequeña isla visual del escritorio. Puede presentar solicitudes de aprobación, enseñar cambios y, según plataforma y agente, trasladar algunas decisiones al teléfono. Su personaje, Mochi, aporta personalidad; lo relevante para nosotros está detrás de esos ojos animados.

La documentación examinada corresponde al estado público consultado el **26 de octubre de 2026**. La serie 0.5.3 figura en el historial del 22 de octubre para macOS y también para Windows y Linux; Android llega a 0.3.0. Son versiones recientes y con diferencias funcionales entre plataformas. Por eso evito tratar cualquier característica anunciada en una plataforma como garantía automática para las otras.

## Cómo se ve Coucou realmente

![Captura de pantalla auténtica de Coucou con una sesión de Claude Code](/images/devlog/coucou-official-claude-code.png)

*Interfaz auténtica de Coucou, publicada por el proyecto. © Louis Raillé. [Fuente y permiso editorial](https://github.com/Louis-CFM/coucou/blob/main/LICENSE-ASSETS.md). No es una instalación ni una prueba realizada por ArceApps.*

## La interrupción como problema de diseño

Una interfaz de agentes suele resolver muy bien el problema de iniciar trabajo: escribimos la intención, escogemos modelo y esperamos. Resuelve peor el de la supervisión cuando hay varias sesiones en paralelo. Un agente está modificando una pantalla, otro investiga un fallo y un tercero pide una aprobación para ejecutar una herramienta. Sin una capa de estado, el usuario tiene que abrir cada sesión para distinguir «trabajando», «terminado», «bloqueado» y «esperando una respuesta».

Hay dos necesidades distintas. La primera es **observabilidad**: ver el estado del trabajo sin invadirlo. La segunda es **intervención**: ofrecer una respuesta válida al agente que está esperando. Un indicador de color basta para la primera, pero nunca para la segunda. Autorizar un comando implica identidad de sesión, texto exacto, contexto, caducidad y la certeza de que la respuesta vuelve a la solicitud correcta.

Coucou intenta cubrir las dos. La isla vive junto al borde superior de la pantalla: en macOS aprovecha la zona del notch y en Windows o Linux crea una superficie propia. En la práctica, esto reduce la distancia entre la aplicación que estamos usando y el punto de atención del agente. La decisión es interesante porque **no sustituye el entorno de programación**. No necesita convertirse en otro IDE, ni reclamar que todos los modelos, repositorios y terminales vivan dentro de su interfaz.

Esta distinción importa frente a otras herramientas. Ya analizamos clientes y orquestadores en [la comparativa de OpenChamber, Paseo y alternativas](/es/blog/openchamber-paseo-comparativa-2026/). Aquí la pregunta es otra: no «¿dónde ejecuto mi agente?», sino «¿cómo sé cuándo necesita mi atención y qué puedo aprobar de forma segura?». Son capas complementarias, no equivalentes.

## Una aplicación, cuatro arquitecturas

La primera sorpresa del repositorio es que no hay una única aplicación multiplataforma con una interfaz idéntica envuelta para cada sistema operativo. Hay decisiones técnicas diferentes para cuatro destinos.

En **macOS**, la aplicación se construye con Swift 6, SwiftUI y AppKit. El contenedor de la isla es un panel nativo sin borde; Mochi se dibuja con Canvas y TimelineView, y el estado visual sigue una pequeña máquina de estados. El proyecto declara no utilizar dependencias de terceros para el núcleo nativo de esa aplicación. No significa que ninguna función adicional descargue componentes: la transcripción con Parakeet, por ejemplo, utiliza FluidAudio y modelos que se instalan por separado.

En **Windows**, la aplicación emplea Tauri 2, Rust y TypeScript. La isla es una ventana transparente siempre visible diseñada para no robar el foco. El personaje se dibuja con Canvas 2D: el mismo lenguaje visual, otro motor de presentación. La conexión de los hooks de Claude Code pasa por un ejecutable auxiliar y una tubería con nombre.

En **Linux**, se reutiliza esa base Tauri, pero la integración de escritorio requiere decisiones específicas. Bajo compositores que admiten layer-shell, la isla puede fijarse a la parte superior de la pantalla. En GNOME, el README describe una vía alternativa mediante XWayland y una ventana tipo dock. No es un detalle estético: afecta a superposición, foco, recortes y compatibilidad con distintos escritorios. La comunicación local usa un socket Unix bajo XDG_RUNTIME_DIR y las credenciales se almacenan mediante Secret Service.

En **Android**, la aplicación es nativa, con Kotlin y Jetpack Compose. No ejecuta el agente del ordenador ni lleva sus claves de API: actúa como cliente de un enlace explícito con Coucou para Windows o Linux. El iPhone sigue otra ruta: una aplicación SwiftUI conectada al Mac por CloudKit, con Live Activities y notificaciones.

La consecuencia arquitectónica es clara: compartir experiencia visual no obliga a compartir todo el transporte. La ventaja es aprovechar capacidades nativas. El coste es mantener diferencias reales de versiones, permisos, sistemas de ventanas y protocolos. Para un proyecto pequeño, esto solo tiene sentido si cada plataforma tiene un motivo funcional suficiente.

## Los hooks son el verdadero punto de entrada

La demostración visual puede hacer pensar que Coucou vigila mágicamente las ventanas de Claude Code. La explicación del repositorio es mucho menos misteriosa y mucho más útil: usa **eventos emitidos por los agentes**.

En macOS, un pequeño relay recibe los eventos de hooks y los entrega a la aplicación mediante un socket Unix. En Windows hay un ejecutable equivalente que utiliza una tubería con nombre. En Linux, el relay se comunica con el socket local de la sesión del usuario. Cuando llega un evento, la isla actualiza el estado asociado a ese agente y su sesión.

Este enfoque tiene una propiedad importante: no requiere leer continuamente la pantalla ni reconocer texto en píxeles. Un evento estructurado puede transportar el tipo de acción, el identificador de sesión o el nombre del agente. Su interpretación sigue siendo responsabilidad de Coucou, pero la fuente es más adecuada que el scraping visual. También explica por qué distintas integraciones necesitan adaptadores: no todos los agentes publican los mismos eventos o admiten las mismas respuestas.

El proyecto permite integrar agentes personalizados mediante el campo *coucou_agent*. Según su documentación de terceros, el valor debe seguir un identificador corto con minúsculas, números y guiones. Es suficiente para asignar una píldora visual a una herramienta propia. Sin embargo, «mostrar un agente» y «aprobar cualquier permiso de ese agente» no son la misma capacidad. La guía de integración advierte limitaciones para las aprobaciones de agentes genéricos; mientras tanto, el README principal anuncia soporte específico para Codex y otros productos con sus mecanismos propios. La diferencia entre integración genérica e integración especializada debe conservarse.

Otro detalle merece reconocimiento: cuando Coucou no está abierto, la documentación dice que el hook finaliza inmediatamente para no bloquear Claude Code. Es la conducta deseable en un observador opcional. Un accesorio de productividad que detuviera el flujo principal cuando se cierra sería una dependencia peligrosa.

## De «veo una tarjeta» a «apruebo exactamente esta operación»

Mostrar un botón verde de permitir es fácil. Conseguir que una pulsación corresponda a la petición correcta es el problema complicado. La documentación del enlace Android está bien enfocada precisamente porque no se conforma con hablar de autenticación en general: describe el contrato de cada aprobación.

![Infografía del flujo de eventos y aprobaciones entre agentes, relay, Android y escritorio](/images/devlog/coucou-approval-flow-es.svg)

*Diagrama original de la ruta Android documentada, no una captura de pantalla. Una decisión solo es válida para una solicitud vigente y coincidente.*

El escritorio calcula una huella SHA-256 que incorpora identificador visual, sesión, herramienta, comando y un identificador de la solicitud. En Windows y Linux, este último cambia incluso si el agente pide ejecutar el mismo comando dos veces. El teléfono devuelve una decisión vinculada a esa huella; el escritorio solo la aplica si **esa petición concreta continúa pendiente**. Una autorización tardía, reutilizada o destinada a otro comando no debe servir.

Además, la aprobación caduca. El protocolo documenta una ventana de dos minutos, con retirada en el escritorio antes de ese límite. Permitir requiere biometría o bloqueo de pantalla configurado; denegar no. Si el teléfono muestra un comando truncado, solo permite denegar y obliga a revisar el texto completo en el ordenador. No es un capricho de interfaz: impedir que alguien apruebe lo que no puede leer cierra una clase entera de errores humanos.

Conviene no confundir esta protección con una garantía absoluta. La huella identifica la petición, pero no demuestra por sí sola que el comando sea inocuo. Una orden bien autenticada puede ser destructiva. Tampoco una pantalla pequeña es un entorno ideal para revisar cambios delicados. Lo que sí hace el diseño es reducir errores de correspondencia y decisiones emitidas fuera de tiempo.

La regla de producto que extraigo es sencilla: **el dispositivo remoto puede confirmar una intención limitada, no recibir autoridad ilimitada sobre la terminal**. De ahí que tengan sentido el control de caducidad, la verificación local y la negativa a aprobar comandos cuyo contenido está cortado.

## Android: red local, TLS y consentimiento explícito

El enlace entre Android y el escritorio merece una lectura separada porque es fácil proyectar sobre él las comodidades de un servicio en la nube que, en este caso, no forma parte del camino básico.

El teléfono se conecta directamente al servidor habilitado en Coucou para Windows o Linux. Ese servidor es **opt-in**: hay que activarlo. La documentación de instalación indica Android 11 o posterior, Coucou 0.4.0 o posterior en el escritorio y ambos dispositivos en la misma red Wi-Fi para el emparejamiento habitual. Esta ruta no incluye el Mac. No sería correcto instalar la APK y prometer el mismo comportamiento con macOS.

El transporte usa TCP sobre TLS 1.2 o 1.3. El escritorio genera un certificado autofirmado y el QR de emparejamiento incluye la huella SHA-256 del certificado, además del host, puerto, secreto y nombre del equipo. El teléfono fija ese certificado durante el emparejamiento, en lugar de aceptar cualquier certificado de la red. El token compartido se conserva cifrado mediante Android Keystore.

El protocolo es deliberadamente legible: JSON delimitado por líneas, mensajes tipados, límites de longitud y negociación de capacidades. *Sessions*, *approval*, *approvalResolved*, *decision*, *ping*: los nombres explican bastante bien su intención. Las ampliaciones se anuncian mediante capacidades opcionales como *chat*, *details*, *answers* y *diffs*. Un cliente antiguo que no las declare no recibe por accidente datos más sensibles.

Esa última decisión es tan importante como TLS. La seguridad de un enlace no consiste solamente en cifrar paquetes; también consiste en enviar el mínimo contenido necesario. Para los detalles de sesión, por ejemplo, la documentación diferencia nombre de carpeta y ruta completa, limita pasos visibles y excluye prompts y salidas completas. Los diffs requieren una capacidad habilitada y una petición explícita.

También existe documentación de un mecanismo de relay por Internet, distinto del enlace local básico. Por tanto, decir «Coucou solo funciona en la misma Wi-Fi» como afirmación universal sería tan impreciso como decir «siempre funciona desde cualquier lugar». El camino local es el que he analizado aquí; cualquier opción remota merece evaluar por separado sus condiciones, despliegue y superficie de exposición.

## iPhone no es un Android con otro icono

En el lado Apple el diseño cambia de forma sustancial. Según el documento oficial, el Mac publica sesiones, turnos y estados en una zona privada de CloudKit, asociada a la cuenta iCloud del usuario. El iPhone consume ese estado y puede escribir decisiones o instrucciones que el Mac procesa solo cuando corresponden al trabajo pendiente.

![Captura oficial de Coucou en iPhone con un diálogo de aprobación](/images/devlog/coucou-official-iphone-approval.jpg)

*Captura oficial de la aprobación en iPhone, © Louis Raillé. El transporte de iPhone usa CloudKit; no representa el enlace local con Android. [Material original](https://github.com/Louis-CFM/coucou).* 

Para las Live Activities, el repositorio describe un relay basado en Cloudflare Workers encargado de las notificaciones APNs. La documentación afirma que ese relay no necesita acceder al contenido completo de la sesión, sino a información mínima de estado. Es una arquitectura razonable sobre el papel, aunque la evaluación exhaustiva de privacidad necesitaría auditar el código, el despliegue y el modelo real de amenazas.

En Android no hay CloudKit ni esa vinculación por cuenta Apple. Se configura una relación directa con el escritorio y una credencial propia. La diferencia afecta a disponibilidad remota, conectividad, recuperación de errores y mantenimiento. La experiencia superficial puede parecer similar —Mochi, sesiones, avisos—, pero la arquitectura que la sostiene no lo es.

Hay otra distinción práctica: ciertas funciones avanzadas están reservadas a builds de GitHub, pueden requerir TestFlight o figurar todavía como próximas para App Store. Instalar «Coucou» no garantiza en todos los canales una lista única de capacidades. Esa matriz de disponibilidad debería formar parte de cualquier decisión de adopción, especialmente si se pretende depender de aprobaciones móviles durante una jornada de trabajo.

## Linux: el caso que me interesa especialmente

Para un desarrollador que trabaja sobre Ubuntu y quiere consultar sesiones desde Android, la combinación relevante es **Coucou Linux + Coucou Android**, no el itinerario macOS+iPhone que ocupa buena parte de las capturas promocionales.

La guía de Linux ofrece AppImage, paquetes deb y rpm. En Ubuntu, la ruta de instalación documentada utiliza el paquete deb; para una prueba reversible, AppImage puede ser cómodo. Las comprobaciones SHA-256 publicadas para las releases aportan una forma básica de verificar el archivo descargado. Son medidas de integridad del artefacto, no una auditoría de seguridad de todo el programa.

La isla en GNOME merece atención porque Ubuntu utiliza ese escritorio con frecuencia. En compositores con layer-shell, Coucou se apoya en esa capacidad para dibujar en el borde superior; en GNOME se recurre a XWayland. Hay que comprobar comportamiento real con escalado de pantalla, monitores múltiples y atajos globales. Un overlay que roba foco o tapa una zona interactiva puede generar más interrupciones de las que evita.

También importaría probar el ciclo de suspensión: ¿qué ocurre si el portátil duerme cuando aparece una petición?, ¿cuándo caduca en el teléfono?, ¿la sesión se reconecta sin reproducir solicitudes antiguas? El protocolo documenta reglas para peticiones caducadas; falta comprobarlas en una instalación de trabajo real. No voy a convertir esa incertidumbre en una afirmación de fiabilidad ya demostrada.

Finalmente, la presencia de Hermes en la lista de agentes soportados es relevante para flujos que ya trabajan con ese tipo de agente. Pero el catálogo no demuestra compatibilidad completa con cualquier configuración. La conexión a sesiones, la recepción de eventos y la posibilidad de responder permisos son tres capacidades que conviene verificar por separado.

## La tentación de convertir un visor en un sistema operativo personal

Coucou no se ha quedado en un indicador de agentes. El historial de octubre incorpora dictado, captura de notas, conversación con modelos de IA, integraciones con servicios, seguimiento de uso y funciones experimentales de WhatsApp. Esto plantea una tensión de producto bastante habitual.

Por una parte, un espacio de atención situado en el borde de la pantalla puede convertirse en una superficie útil para interacciones breves. Autorizar una herramienta, consultar el despliegue o dictar una frase comparten un patrón: tareas pequeñas que no merecen abrir una aplicación completa.

Por otra, cada integración añade permisos, credenciales y nuevas rutas de datos. El dictado sin conexión con Parakeet no tiene el mismo perfil que corregir texto enviándolo a una API externa. Una tarjeta de GitHub no exige los mismos controles que un gateway de WhatsApp Web. Las funciones opcionales deberían poder seguir siendo opcionales, no convertirse en una lista de permisos imprescindibles para usar la vigilancia de agentes.

El README distingue almacenamiento local de claves y determinadas transmisiones a proveedores elegidos. En macOS menciona Keychain; en Windows, Credential Manager; en Linux, Secret Service. Son elecciones razonables, pero la frase «las claves están protegidas» no basta para describir todos los datos que circulan. También cuentan comandos, nombres de archivos, extractos de cambios, prompts y mensajes.

Por eso mi interés principal sigue siendo la supervisión de agentes. Las píldoras para servicios y el personaje animado pueden ser agradables, pero no deberían ocultar la pregunta decisiva: **¿qué información se recopila, cuándo sale del equipo y qué acción exacta puede ejecutar otra pantalla?**

## Lo que dice el repositorio sobre voz y transcripción

La función Flow convierte la voz en texto y lo pega en la aplicación activa. En Mac con Apple silicon, Coucou ofrece reconocimiento sin conexión mediante Parakeet y FluidAudio tras descargar un modelo de alrededor de 650 MB. También hay un modo de notas de reuniones que transcribe audio y, con proveedores seleccionados, produce resúmenes y tareas. La documentación recomienda informar a los participantes cuando se graba una conversación.

Según las notas de versión, la serie 0.5.0 de Windows/Linux añadió dictado y Notetaker, incluida compatibilidad declarada con X11 y Wayland. No deben mezclarse los detalles de implementación de macOS con los de Linux solo porque ambas plataformas anuncien «Flow». Calidad de reconocimiento, idiomas, acceso al micrófono, permisos de accesibilidad y comportamiento de pegado pueden variar.

De nuevo aparece la frontera entre función local y servicio externo. Que un modelo de reconocimiento funcione offline no significa que toda corrección, traducción o resumen posterior se realice offline. El artículo no presume que se haya medido la latencia del modelo, ni su tasa de error, ni su consumo de memoria. Para elegirlo frente a una herramienta de dictado instalada, faltaría una prueba reproducible con el mismo audio, idioma, micrófono y máquina.

Este apartado es útil como recordatorio de diseño: cuando una interfaz agrupa funciones, su documentación debe dejar claro qué etapas del flujo son locales y cuáles dependen de servicios o claves adicionales. «Privado» no es una propiedad de la pantalla; es una propiedad del recorrido de datos completo.

## Por qué la caducidad importa más que una notificación bonita

Imaginemos una situación concreta, usada aquí como **ejemplo hipotético**, no como incidente vivido. Un agente solicita permiso para borrar un directorio temporal. Aparece la notificación en el móvil. La persona está lejos del escritorio; la ve un minuto después. Entretanto, el agente ha cancelado la operación, cambiado de tarea y vuelto a pedir permiso para otra acción.

Un sistema ingenuo tendría un único botón «Permitir» y una referencia implícita a «la última petición». Ese diseño es incorrecto. La segunda petición podría recibir una autorización concebida para la primera. El problema no es de estética ni de latencia, sino de identidad y orden causal.

El contrato de Coucou procura evitarlo con huellas específicas, ventanas temporales y comprobación del estado pendiente en el escritorio. El teléfono no decide qué comando ejecutar: responde a una solicitud existente y el escritorio verifica que todavía tiene sentido. Los mensajes *approvalResolved* permiten retirar tarjetas cuando algo se respondió por otro canal o expiró.

Este patrón tiene valor fuera de Coucou. Se puede aplicar a revisiones de despliegues, tareas administrativas y confirmaciones de agentes autónomos. La decisión remota debería tener alcance y validez definidos. Una alerta antigua no puede transformarse en una orden nueva por simple comodidad.

El límite sigue siendo humano: incluso mostrando el comando completo, una decisión puede estar mal informada si no conocemos sus consecuencias. En situaciones de alto riesgo conviene volver al equipo, revisar el contexto y, si procede, negar el permiso desde el teléfono.

## Observación, control y orquestación no son sinónimos

En el ecosistema de herramientas para coding agents se usan indistintamente palabras como dashboard, cliente, orquestador y supervisor. La distinción tiene consecuencias prácticas.

Un **visor** muestra estados. Un **supervisor** presenta información relevante y permite intervenir sobre solicitudes concretas. Un **cliente** puede gestionar conversaciones y sesiones de un proveedor. Un **orquestador** coordina ejecución, colas, dependencias, políticas y quizá varios agentes. Una herramienta puede ocupar más de una categoría, pero eso no significa que implemente todas.

Coucou se sitúa especialmente bien en observación y aprobaciones, con algunas funciones de chat e integración adicionales. No he encontrado en su documentación la promesa de sustituir el sistema de planificación de tareas, el CI, el repositorio o el motor de ejecución de los agentes. Presentarlo como una plataforma general que controla cualquier proceso desde cualquier red sería atribuirle capacidades que no están justificadas por lo estudiado.

Este matiz cambia la comparación con OpenChamber o Paseo. Si el problema principal es organizar múltiples proyectos, gestionar sesiones largas desde un navegador y disponer de un cockpit centralizado, la evaluación debe empezar por esas herramientas. Si el problema es enterarse de una pregunta sin abandonar una aplicación y contestarla con un gesto pequeño, Coucou propone otra solución.

Un buen flujo podría usar ambas capas, siempre que no duplique notificaciones ni genere aprobaciones contradictorias. Pero eso es una hipótesis de integración, no un escenario probado en esta investigación. Antes de adoptarla habría que conocer qué eventos producen ambos sistemas y qué proceso conserva la autoridad final.

## Licencia abierta, identidad visual protegida

El repositorio declara código bajo licencia MIT y permite estudiar, modificar y reutilizarlo con las obligaciones correspondientes. La aplicación Android y el enlace móvil también tienen sus atribuciones de autoría. Eso no convierte automáticamente todo el material gráfico en reutilizable.

El nombre Coucou, Mochi, iconos, sonidos y materiales de marca están sujetos a una licencia de activos distinta, con derechos reservados. Es un matiz importante para desarrolladores independientes: **poder reutilizar el código no implica poder publicar un clon con el mismo personaje**. El propio proyecto recomienda cambiar nombre e identidad para forks distribuidos.

Por ese motivo, la portada de esta entrada es una composición geométrica original del flujo escritorio–móvil y no una reproducción de Mochi. La decisión es coherente con dos principios: respetar licencias de terceros y no confundir al lector sobre la autoría del software analizado.

También hay una lección de mantenimiento. Separar claramente licencia de código, assets y contribuciones ayuda a quien quiera aprender del proyecto sin infringir la identidad de su creador. No hace falta que todos los repositorios sean productos comerciales para que esa distinción tenga valor.

## Qué verificaría antes de incorporarlo al flujo diario

El repositorio aporta bastante información para formar una hipótesis, pero no suficiente para certificar fiabilidad real en mi entorno. La siguiente fase lógica sería un ensayo acotado y reversible, no una adopción a ciegas.

Primero, instalaría la release oficial de Linux y comprobaría firma o checksum disponible, consumo en reposo y comportamiento de la isla sobre GNOME. Después, conectaría **una sola sesión de Claude Code o Codex** y comprobaría eventos de inicio, trabajo, error, finalización y solicitud de permiso. No mezclaría al mismo tiempo voz, GitHub, WhatsApp ni integraciones que exijan tokens.

En segundo lugar, probaría un Android en la misma red con un permiso inocuo. Verificaría emparejamiento, rechazo, aprobación con autenticación local, caducidad y desconexión. Me interesaría especialmente que una notificación obsoleta desaparezca y que el escritorio ignore respuestas fuera de plazo. Esas pruebas comprobarían el comportamiento anunciado sin arriesgar repositorios ni credenciales reales.

En tercer lugar, revisaría lo que realmente queda expuesto al activar *details* y *diffs*: nombres de archivo, cambios sensibles, contexto de las órdenes y ajustes por defecto. El protocolo limita y condiciona esos datos, pero una limitación documentada no sustituye a observar el tráfico de una instalación de prueba ni a inspeccionar los permisos del sistema.

Por último, repetiría el ensayo después de suspender el ordenador, cambiar de red y reiniciar la aplicación. La utilidad de un supervisor de agentes depende tanto de sus rutas de error como de su pantalla principal. No basta con que una demo parezca inmediata.

Hasta completar una prueba así, las conclusiones de esta entrada son **de arquitectura y documentación**, no de rendimiento, estabilidad o experiencia de uso medida.

## La lección que me llevo

La idea más valiosa de Coucou no es la isla, ni el personaje, ni siquiera la posibilidad de pulsar «Allow» desde el teléfono. Es la separación entre **ejecución**, **observación** y **decisión humana limitada**.

El agente sigue haciendo su trabajo en su entorno. Una capa ligera convierte eventos dispersos en estado comprensible. Cuando hace falta intervenir, la decisión se vincula a una petición exacta, tiene un tiempo de vida y debe validarse en el equipo que mantiene el control. El teléfono no necesita convertirse en otro terminal, ni almacenar las credenciales del proveedor.

También queda a la vista el precio de esa sencillez aparente. Detrás hay sistemas de ventanas diferentes, sockets, tuberías, certificados, almacenamiento seguro, permisos móviles, sincronización y una matriz de funciones que varía por versión. La experiencia minimalista solo es buena cuando esa complejidad está contenida y no sorprende al usuario.

Mi conclusión provisional es favorable al **patrón de diseño**, no una recomendación incondicional de instalación. Coucou documenta mecanismos sensatos para supervisión y aprobación; la combinación Linux–Android merece una prueba práctica. Pero no reemplaza un entorno de desarrollo, no concede seguridad por arte de magia y no debería utilizarse para aprobar operaciones que exigen una revisión completa.

En una época en la que los agentes pueden trabajar durante minutos u horas, quizá la siguiente mejora importante no sea hacer que ejecuten más cosas sin permiso, sino diseñar mejor los escasos momentos en los que necesitan una decisión humana. Esa es la pregunta que Coucou pone sobre la mesa, y por eso merece una entrada en esta bitácora.

## Referencias y documentación

- [Coucou: repositorio, README y releases](https://github.com/Louis-CFM/coucou).
- [CHANGELOG: evolución y fechas de las versiones](https://github.com/Louis-CFM/coucou/blob/main/CHANGELOG.md).
- [Arquitectura de integración de agentes y eventos](https://github.com/Louis-CFM/coucou/blob/main/docs/AGENTS.md).
- [Protocolo Android Link y reglas de autorización](https://github.com/Louis-CFM/coucou/blob/main/docs/ANDROID_LINK.md).
- [Guía de Coucou para Android](https://github.com/Louis-CFM/coucou/blob/main/android/README.md).
- [Integración iPhone, CloudKit y Live Activities](https://github.com/Louis-CFM/coucou/blob/main/docs/IPHONE.md).
- [Licencia de los recursos visuales y sonoros](https://github.com/Louis-CFM/coucou/blob/main/LICENSE-ASSETS.md).
- [Tauri 2: documentación oficial](https://v2.tauri.app/).
- [Comparativa previa de OpenChamber, Paseo y clientes de agentes](/es/blog/openchamber-paseo-comparativa-2026/).

*Nota de método: se ha revisado documentación pública y la estructura descrita por sus autores; no se han ejecutado binarios, auditado formalmente el protocolo ni medido su comportamiento en dispositivos reales.*
