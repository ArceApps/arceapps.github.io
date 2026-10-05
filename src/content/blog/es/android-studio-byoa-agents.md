---
title: "Android Studio BYOA: Codex, Claude y Antigravity"
description: "Descubre Android Studio BYOA, cómo ACP conecta Codex, Claude y Antigravity con el IDE, y qué cambia al dar al agente contexto y herramientas Android."
pubDate: 2026-10-05
lastmod: 2026-10-05
author: "ArceApps"
keywords:
  - "Android Studio BYOA"
  - "Agent Client Protocol"
  - "Codex"
  - "Claude"
  - "Antigravity"
  - "Android agents"
canonical: "https://arceapps.com/es/blog/android-studio-byoa-agents/"
heroImage: "/images/android-studio-byoa-agents.svg"
tags: ["Android Studio", "IA", "Agentes", "ACP", "Codex", "Claude"]
category: ai-agents
reference_id: "a3f1f607-3fa5-452e-9e35-644997ed7440"
---

Hasta ahora, elegir un asistente de IA para Android Studio era casi lo mismo que elegir la integración que el propio IDE ponía delante de ti. Podías usar Gemini, instalar plugins, abrir una terminal aparte o repartir el trabajo entre varias herramientas, pero la frontera seguía siendo bastante clara: **el IDE era una cosa y el agente era otra**.

Android Studio Rabbit 2 cambia esa relación con **Bring Your Own Agent (BYOA)**.

Google lo presentó el 24 de septiembre de 2026 como una vista previa en el canal Canary. La idea es sencilla de explicar y bastante más profunda de lo que parece: Android Studio deja de tratar al agente como una función cerrada del producto y pasa a funcionar como **cliente de agentes externos**. Codex, Claude Agent y Antigravity aparecen como opciones iniciales, pero la pieza importante no son esos tres nombres. La pieza importante es el protocolo que hay debajo: **Agent Client Protocol, ACP**.

Ese detalle convierte BYOA en algo más interesante que “ahora hay un selector de modelos”.

Ya había escrito sobre [Gemini dentro de Android Studio](/es/blog/gemini-desarrollo-android/), sobre la [Android CLI para agentes](/es/blog/android-cli-agentes-herramientas/) y sobre [Android Skills](/es/blog/android-skills-ia-desarrollo-guiado/). Aquellos artículos explican tres piezas distintas: el asistente integrado, la superficie programática para que un agente opere sobre Android y el contexto especializado que ayuda a producir código moderno. BYOA añade una cuarta: **una capa estándar para conectar el agente que quieras con la inteligencia nativa del IDE**.

Y esa combinación puede cambiar bastante mi forma de entender el flujo de desarrollo Android.

## No es Bring Your Own Model

Conviene empezar por una distinción que parece semántica, pero no lo es.

Un **modelo** recibe contexto y genera una respuesta. Un **agente** mantiene una sesión, decide pasos, usa herramientas, modifica archivos, ejecuta comandos, pide permisos, inspecciona resultados y vuelve a actuar.

Android Studio ya había abierto la puerta a usar modelos personalizados. BYOA va un nivel por encima.

La pregunta deja de ser:

> ¿Qué LLM quiero para responder dentro del IDE?

y pasa a ser:

> ¿Qué sistema agente quiero que opere dentro del IDE?

Esto importa porque dos agentes que usen modelos de capacidad parecida pueden comportarse de manera muy distinta. Uno puede tener un buen bucle de edición y revisión; otro puede manejar mejor permisos; otro puede compactar contexto de forma más eficiente; otro puede exponer comandos especializados o integrarse con servidores MCP.

El modelo sigue importando, por supuesto. Pero cuando la tarea es “corrige esta pantalla Compose, ejecuta el build, abre el emulador, comprueba el estado y arregla lo que falle”, el **harness** alrededor del modelo importa tanto como el modelo.

BYOA reconoce esa realidad explícitamente.

## Qué ha anunciado Google exactamente

La documentación de Android Studio Rabbit 2 Canary describe BYOA como una integración de agentes mediante **ACP abierto**.

En la versión inicial aparecen:

- Claude Agent;
- OpenAI Codex;
- Google Antigravity.

Android Studio también mantiene su agente integrado.

El flujo de configuración es intencionadamente sencillo: abrir la ventana del agente, seleccionar uno de los agentes disponibles, iniciar sesión o proporcionar la credencial correspondiente. Los agentes adicionales aparecen en el registro de:

`Settings > Tools > AI > Agents`

Lo más importante está en la lista de capacidades que Android Studio entrega al agente. Según las notas oficiales de la preview, BYOA puede proporcionarle:

- el grafo completo del proyecto;
- diagnósticos de compilación;
- acceso a herramientas del Android SDK;
- terminal y ejecución de shell;
- administración del emulador.

Google lo presenta como una forma de conseguir ejecuciones más rápidas y reducir consumo de tokens al evitar que el agente tenga que reconstruir por sí mismo información que el IDE ya conoce.

Ese es, para mí, el verdadero producto.

El selector de Codex, Claude o Antigravity es la interfaz visible. La integración de contexto estructurado y herramientas Android es lo que puede hacer que el agente sea sensiblemente mejor.

## El IDE ya conoce cosas que el agente suele tener que adivinar

Cuando trabajo con un agente desde una terminal, una parte del presupuesto de contexto se consume explicando o redescubriendo el proyecto.

El agente ejecuta:

```bash
find .
cat settings.gradle.kts
cat app/build.gradle.kts
./gradlew assembleDebug
adb devices
```

Después interpreta salidas de Gradle, busca módulos, intenta entender qué variante está activa, localiza el APK, consulta el estado del emulador y vuelve a leer archivos cuando pierde parte del contexto.

No hay nada malo en ese flujo. De hecho, una CLI reproducible es una interfaz excelente para agentes, y por eso la [Android CLI](/es/blog/android-cli-agentes-herramientas/) me parece tan importante.

Pero Android Studio dispone de información que no necesita redescubrir desde cero:

```text
Android Studio
├── modelo estructural del proyecto
├── índices del código
├── configuración Gradle
├── diagnósticos de build
├── Android SDK
├── dispositivos y emuladores
├── terminal
└── estado del IDE
```

Si esa información se puede ofrecer al agente mediante una interfaz bien definida, desaparece una cantidad considerable de trabajo de reconocimiento.

No significa que todo el contexto del IDE se envíe automáticamente al modelo. Significa que la integración puede proporcionar al agente **herramientas y contexto de alto nivel** para consultar lo que necesita.

Es una diferencia parecida a dar a alguien acceso a una base de datos estructurada en lugar de obligarle a reconstruirla leyendo logs.

## ACP: la pieza que evita una integración distinta por agente

Aquí entra **Agent Client Protocol**.

ACP es un protocolo abierto para comunicar editores y agentes de programación. Su objetivo es que un editor pueda actuar como cliente y un agente como servidor sin que cada combinación necesite una integración completamente propietaria.

La arquitectura conceptual es bastante limpia:

```text
┌────────────────────────────┐
│       Android Studio       │
│         ACP client         │
│                            │
│ project graph / build /    │
│ emulator / terminal / SDK  │
└──────────────┬─────────────┘
               │ ACP
               │
┌──────────────▼─────────────┐
│         Coding agent       │
│ Codex / Claude /           │
│ Antigravity / otro ACP     │
└──────────────┬─────────────┘
               │
               ▼
          model + tools
```

ACP utiliza un modelo de mensajes basado en JSON-RPC. El protocolo contempla inicialización, autenticación cuando es necesaria, creación o reanudación de sesiones, prompts, actualizaciones de progreso, solicitudes de permisos y cancelación.

A alto nivel, una sesión se parece a esto:

```text
IDE -> agent: initialize
IDE -> agent: authenticate, si hace falta
IDE -> agent: session/new
IDE -> agent: session/prompt

agent -> IDE: progreso
agent -> IDE: petición de permiso
agent -> IDE: cambios / herramientas / estado

IDE -> agent: aprobación o rechazo
agent -> IDE: resultado
```

No necesito que Android Studio conozca la arquitectura interna de Codex. Tampoco necesito que Codex conozca cada detalle de implementación de Android Studio.

Ambos necesitan compartir el contrato.

Esa capa de desacoplamiento es lo que hace interesante a BYOA a largo plazo.

## Por qué ACP no es MCP

Es fácil mezclar siglas porque ambas aparecen alrededor de agentes.

**MCP** suele resolver cómo un agente accede a herramientas, servicios o fuentes de contexto.

**ACP** resuelve la relación entre **editor y agente**.

Una forma simplificada de verlo:

```text
IDE <---- ACP ----> agente <---- MCP ----> herramientas externas
```

No son competidores directos. Pueden convivir.

Un agente conectado a Android Studio mediante ACP puede, dependiendo de su implementación, seguir utilizando MCP para hablar con GitHub, documentación, bases de datos, memoria o cualquier otra herramienta.

Esto me gusta porque separa responsabilidades.

El IDE no tiene que convertirse en el orquestador universal de todas las herramientas del mundo. Se ocupa de aquello que conoce bien: código, proyecto, build, Android SDK, emulador y experiencia de edición.

El agente conserva su propio ecosistema.

## Qué gana Codex al estar dentro de Android Studio

Pensemos en una tarea muy normal:

> La pantalla de ajustes se corta en una tablet, corrígela sin romper el diseño móvil.

Un agente externo puro podría hacer algo así:

1. localizar los archivos de la pantalla;
2. entender el árbol Compose;
3. averiguar dependencias y versiones;
4. modificar el layout;
5. ejecutar Gradle;
6. interpretar los errores;
7. iniciar o localizar un emulador;
8. instalar la app;
9. navegar hasta la pantalla;
10. capturar evidencia;
11. corregir otra vez.

Con BYOA, una parte de esa interacción puede ocurrir usando capacidades que Android Studio ya tiene resueltas.

La diferencia no es que Codex “sepa más Android” por estar en el IDE.

La diferencia es que **tiene mejor instrumentación**.

Esto es algo que a veces se pierde en las comparativas de modelos. Un agente con un modelo algo peor pero excelentes herramientas puede superar a otro con un modelo más potente que trabaja prácticamente a ciegas.

Android Studio puede convertirse en esa capa de instrumentación.

## El grafo del proyecto vale más que diez prompts

Una de las capacidades oficiales que más me interesa es el acceso al **project graph**.

En un proyecto Android real, “el proyecto” no es una carpeta plana. Hay módulos, dependencias, source sets, variantes, plugins de Gradle, generated sources y relaciones entre clases que no siempre se deducen bien leyendo unos pocos archivos.

Para un humano, Android Studio lleva años solucionando esto mediante indexado y modelos internos.

Para un agente, tener una vista estructurada puede reducir dos problemas:

### 1. Exploración innecesaria

El agente no necesita abrir veinte archivos para descubrir que una clase pertenece al módulo `feature:settings`.

### 2. Cambios fuera de alcance

Un buen contexto estructural permite entender mejor qué componentes dependen de qué.

Esto no elimina errores. Pero mejora las condiciones iniciales del razonamiento.

Si quiero que un agente haga refactorizaciones más grandes, prefiero que empiece desde un mapa real del proyecto y no desde una serie de `grep`.

## Build diagnostics como herramienta, no como texto gigante

La segunda capacidad interesante son los diagnósticos de build.

El patrón clásico de terminal es:

```bash
./gradlew test
```

y después entregar al modelo cientos o miles de líneas.

Un IDE ya sabe cuáles son los errores relevantes, a qué archivo pertenecen y dónde están.

La diferencia entre:

```text
pega todo stdout de Gradle en el contexto
```

y:

```text
consulta los diagnósticos estructurados que afectan a este cambio
```

puede ser enorme.

Aquí es donde la afirmación de Google sobre menor consumo de tokens resulta plausible: no porque ACP comprima mágicamente el lenguaje natural, sino porque evita convertir todo el estado de desarrollo en texto bruto.

Aun así, no tomaría la frase “lower token consumption” como una garantía universal. El coste real dependerá del agente, del modelo, de cómo seleccione contexto y del tipo de tarea.

Lo que sí cambia es la arquitectura disponible para optimizarlo.

## El emulador cierra un bucle importante

Editar código es solo la mitad del trabajo Android.

Una pantalla puede compilar y seguir estando mal.

El soporte de BYOA para administración del emulador abre un bucle más útil:

```text
editar
  ↓
compilar
  ↓
ejecutar
  ↓
observar
  ↓
corregir
  └───────────────↺
```

Ya había visto esta dirección con Android CLI y sus herramientas pensadas para agentes. BYOA acerca ese bucle al propio IDE.

Mi objetivo no sería permitir que un agente “mire una captura y decida que todo está perfecto”. La validación visual automática sigue teniendo límites.

Lo útil es reducir fricción:

- iniciar el dispositivo correcto;
- instalar la variante adecuada;
- conocer errores de ejecución;
- inspeccionar una pantalla concreta;
- repetir el ciclo sin que yo haga de operador entre cada paso.

Para un desarrollador independiente, ese trabajo mecánico acumulado pesa bastante.

## Codex, Claude y Antigravity no necesitan una guerra de benchmarks

Sería tentador convertir BYOA en un artículo de “Codex vs Claude vs Antigravity”.

No creo que sea el punto más interesante todavía.

Primero, porque la función está en preview.

Segundo, porque una comparación justa tendría que controlar muchas variables:

- mismo proyecto;
- misma tarea;
- mismo estado inicial;
- mismo acceso a herramientas;
- mismas restricciones;
- criterios de éxito externos;
- coste total;
- número de turnos;
- regresiones introducidas.

Y tercero, porque BYOA reduce precisamente el coste de cambiar.

La pregunta más útil no es “¿qué agente gana para siempre?”, sino:

> ¿Puedo elegir el agente adecuado para cada tarea sin abandonar mi IDE ni perder las herramientas Android?

Por ejemplo, podría preferir un agente para un refactor estructural, otro para revisar un cambio y otro para una tarea rápida. Si todos hablan ACP, la infraestructura del IDE deja de estar acoplada a esa decisión.

Ese es un cambio más duradero que cualquier ranking de una semana concreta.

## Cómo evaluaría BYOA de forma seria

Si quisiera comparar agentes dentro de Android Studio, usaría un pequeño banco de tareas reales.

No prompts sintéticos. Tareas que se parezcan a las que hago.

### Tarea A: bug de build

Cambiar una dependencia, provocar una incompatibilidad pequeña y medir si el agente:

- identifica la causa;
- toca solo lo necesario;
- deja el build verde.

### Tarea B: modificación Compose

Pedir un cambio responsive y comprobar:

- teléfono compacto;
- tablet;
- rotación;
- previews o screenshots.

### Tarea C: refactor multiarchivo

Mover una responsabilidad de UI a ViewModel o dominio y medir:

- corrección;
- alcance del diff;
- tests;
- deuda añadida.

### Tarea D: bug de runtime

Dar una reproducción conocida y comprobar si usa correctamente emulador, logs y diagnósticos.

Después registraría:

```text
éxito funcional
tiempo hasta resultado
turnos
tokens/coste
archivos modificados
regresiones
intervenciones humanas
```

Entonces sí tendría sentido comparar.

Lo que no haría es preguntar a los tres “crea un ViewModel” y declarar un campeón por el código que parezca más bonito.

## Preview significa preview

Hay otro detalle importante: BYOA se está desplegando inicialmente en **Android Studio Rabbit 2 Canary**.

Eso significa que no lo trataría todavía como dependencia crítica de producción.

Canary existe precisamente para probar funcionalidad nueva antes de que tenga la estabilidad del canal estable.

Para experimentar, instalaría Android Studio Canary en paralelo al estable y mantendría ambos.

Mi flujo sería:

```text
Android Studio estable
└── trabajo diario crítico

Android Studio Rabbit 2 Canary
└── pruebas BYOA y nuevas capacidades
```

Así puedo evaluar el sistema sin convertir una feature experimental en un bloqueo para mi proyecto.

## La autenticación forma parte de la arquitectura

BYOA permite distintos métodos según el proveedor: cuentas, suscripciones y claves de API.

Esto parece una pantalla de configuración, pero tiene implicaciones.

Cuando conecto un agente externo, hay que separar tres capas:

1. **Android Studio**, que ofrece la interfaz y herramientas;
2. **el agente**, que ejecuta el bucle;
3. **el proveedor/modelo**, que procesa parte del contexto.

No asumiría que usar el mismo IDE implica la misma política de datos entre agentes.

Si trabajo con repositorios privados, antes de elegir proveedor revisaría:

- qué datos salen del equipo;
- política de retención;
- entrenamiento;
- controles empresariales si aplican;
- dónde se guardan credenciales;
- qué herramientas puede ejecutar el agente.

La interoperabilidad no convierte automáticamente a todos los agentes en equivalentes desde el punto de vista de seguridad.

## Un agente con shell sigue siendo un agente con shell

La lista oficial de capacidades incluye terminal y ejecución de shell.

Eso es extremadamente útil y exactamente por eso exige cuidado.

Un agente capaz de ejecutar:

```bash
./gradlew test
adb install ...
git diff
```

también opera en un entorno donde pueden existir comandos destructivos o información sensible.

BYOA no elimina las reglas básicas de un buen harness:

- trabajar con Git limpio;
- revisar el diff;
- limitar permisos;
- no guardar secretos en el repositorio;
- exigir aprobación para acciones sensibles;
- mantener tests y checks externos;
- tratar la salida del agente como trabajo que debe verificarse.

La integración más profunda aumenta capacidad, no infalibilidad.

## Android Skills encajan todavía mejor en este modelo

Aquí encuentro una conexión especialmente interesante.

[Android Skills](/es/blog/android-skills-ia-desarrollo-guiado/) aportan contexto especializado: cómo hacer una migración, cómo usar APIs modernas, cómo implementar adaptive layouts o cómo seguir patrones actuales.

BYOA aporta el canal entre el agente y el IDE.

Android Studio aporta herramientas y estado.

Podemos dibujarlo así:

```text
                 ┌─────────────────┐
                 │ Android Skills  │
                 │ reglas/contexto │
                 └────────┬────────┘
                          │
                          ▼
┌──────────────┐   ACP   ┌────────────────┐
│Android Studio│◄───────►│ agente elegido │
└──────┬───────┘         └───────┬────────┘
       │                         │
       │ build / SDK / emulator  │ modelo / otras tools
       ▼                         ▼
   proyecto                  ejecución
```

Ese conjunto me parece bastante más potente que “chat dentro del IDE”.

El agente sabe **cómo** debería trabajar gracias a las skills y puede **hacer** el trabajo con herramientas reales del IDE.

## ¿Entonces la Android CLI deja de importar?

No.

De hecho, creo que BYOA y Android CLI refuerzan el mismo principio desde dos superficies distintas.

La CLI es ideal para:

- CI;
- máquinas remotas;
- automatización sin interfaz;
- agentes terminal-first;
- scripts reproducibles.

BYOA es ideal cuando el centro del flujo es Android Studio y quiero aprovechar su modelo interno y sus herramientas.

No veo una sustitución:

```text
CI / remoto / automatización
        -> Android CLI

sesión interactiva de desarrollo
        -> Android Studio + BYOA
```

La arquitectura buena es la que no me obliga a elegir una única interfaz para todo.

## El IDE como host neutral de agentes

Esta es la idea que más me interesa de todo BYOA.

Durante años, la integración de IA en los IDE se ha planteado como una feature del propio IDE:

```text
IDE + asistente propietario
```

ACP abre otra posibilidad:

```text
IDE = plataforma de herramientas
agente = componente intercambiable
modelo = componente intercambiable
```

Si esa separación se consolida, elegir editor y elegir agente dejan de ser la misma decisión.

Puedo preferir Android Studio por Layout Inspector, Profiler, emulador, depuración y conocimiento del proyecto, sin aceptar necesariamente que eso determine qué agente uso.

Y un proveedor de agentes puede integrarse en varios editores sin escribir una capa completamente distinta para cada uno.

Es una arquitectura mucho más saludable que una colección de plugins incompatibles.

## También cambia cómo deberíamos diseñar herramientas

Hay una consecuencia menos visible.

Si los IDE se convierten en clientes de agentes, las features internas empiezan a tener dos consumidores:

- el desarrollador humano;
- el agente.

Un buen diagnóstico no solo debe verse bien en una ventana. Debe poder exponerse estructuradamente.

Un emulador no solo necesita botones. Necesita operaciones que una herramienta pueda invocar.

Un sistema de navegación por código no solo debe responder a clicks. Debe poder proporcionar referencias y relaciones.

Esto empuja hacia herramientas más componibles y automatizables.

En ese sentido, BYOA forma parte del mismo movimiento que Android CLI: convertir capacidades que antes estaban encerradas en una GUI en superficies que un agente puede utilizar explícitamente.

## Qué no sabemos todavía

Hay preguntas que la preview todavía tendrá que responder con uso real.

### ¿Qué tan homogénea será la experiencia entre agentes?

Que dos agentes hablen ACP no significa que aprovechen igual las capacidades disponibles.

### ¿Cuánto contexto del IDE necesita realmente cada tarea?

Más contexto no siempre produce mejores resultados. La selección sigue siendo importante.

### ¿Cómo evolucionarán los permisos?

Un agente integrado profundamente necesita un modelo de aprobación que no sea ni peligroso ni insoportablemente interruptivo.

### ¿Qué parte será estándar y qué parte específica de Android Studio?

ACP define interoperabilidad, pero cada cliente puede tener capacidades propias.

### ¿Qué pasa con agentes locales?

ACP está pensado para permitir distintos escenarios, incluidos agentes locales o propios. Será interesante ver hasta dónde llega la experiencia de Android Studio más allá de los proveedores destacados inicialmente.

Estas incógnitas son motivo para probar la preview, no para descartarla.

## Mi flujo ideal

Si BYOA madura como promete la arquitectura actual, mi flujo Android podría terminar pareciéndose a esto:

```text
1. Abro el proyecto en Android Studio.
2. Selecciono el agente según la tarea.
3. El agente recibe instrucciones del repo + Android Skills.
4. Consulta estructura y diagnósticos del IDE.
5. Modifica código.
6. Ejecuta build/tests.
7. Usa emulador cuando la tarea lo exige.
8. Me entrega diff + evidencia.
9. Reviso.
10. CI decide si el cambio es realmente aceptable.
```

Hay dos cosas que deliberadamente no desaparecen:

- la revisión humana;
- la verificación independiente.

No quiero un agente que declare su propio trabajo perfecto. Quiero un agente que tenga mejores herramientas para producir un cambio verificable.

Esa diferencia seguirá importando aunque los modelos mejoren muchísimo.

## Lo que me llevo de BYOA

BYOA no me parece importante porque Android Studio haya añadido tres logos nuevos a un selector.

Me parece importante porque formaliza una separación:

```text
editor ≠ agente ≠ modelo
```

Android Studio puede concentrarse en ser el mejor entorno posible para entender y ejecutar proyectos Android.

Los agentes pueden competir en razonamiento, autonomía, UX y harness.

Los modelos pueden evolucionar por debajo.

ACP conecta esas piezas sin exigir que sean un único producto.

Para un desarrollador independiente, eso significa algo bastante práctico: puedo conservar las herramientas especializadas de Android Studio sin renunciar a elegir el agente que mejor encaje con mi forma de trabajar.

Todavía es una preview. Seguramente habrá bordes ásperos, diferencias entre proveedores y cambios antes de llegar a estable.

Pero la dirección me parece correcta.

Después de años añadiendo IA *dentro* de los IDE, quizá la siguiente etapa sea que el IDE deje de intentar poseer al agente y se convierta en el mejor lugar desde el que cualquier agente pueda trabajar.

## Referencias

- [Android Developers Blog — Build your way: Use any AI agent of your choice in Android Studio](https://developer.android.com/blog/posts/build-your-way-use-any-ai-agent-of-your-choice-in-android-studio)
- [Android Studio Preview — Rabbit 2, Bring Your Own Agent](https://developer.android.com/studio/preview/features)
- [Agent Client Protocol — repositorio oficial](https://github.com/agentclientprotocol/agent-client-protocol)
- [Agent Client Protocol — documentación](https://agentclientprotocol.com/)
- [Android CLI: acelerando el desarrollo con agentes IA](/es/blog/android-cli-agentes-herramientas/)
- [Android Skills: guía de IA para el desarrollo](/es/blog/android-skills-ia-desarrollo-guiado/)
- [Gemini en desarrollo Android](/es/blog/gemini-desarrollo-android/)
