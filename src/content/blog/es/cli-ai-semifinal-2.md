---
title: "IA CLI Match 2: Codex vs Hermes vs Qwen vs Sweep"
description: "La segunda semifinal de agentes CLI. Enfrentamos a Codex, Hermes, Qwen Agent y Sweep en la terminal para decidir quién avanza a la Gran Final."
pubDate: 2026-07-01
lastmod: 2026-07-01
author: "ArceApps"
heroImage: "/images/cli-ai-semifinal-2.svg"
tags: ["AI", "CLI", "Agents", "Codex", "Hermes"]
reference_id: "05ddb988-cd84-466b-9336-6bf5ab96a7e7"
keywords: ["CLI AI Match", "Codex CLI", "Hermes", "Qwen Agent", "Sweep", "agentes IA terminal"]
canonical: "https://arceapps.com/blog/cli-ai-semifinal-2/"
---

## 🌩️ Tormenta en la Terminal: La Segunda Semifinal

Tras una primera semifinal de infarto donde Cline y OpenCode demostraron por qué son los reyes actuales de la terminal, llegamos a la segunda llave de este torneo de agentes de Inteligencia Artificial. Como desarrollador indie, mi tiempo es mi recurso más valioso. Si un agente CLI me hace perder el tiempo arreglando sus errores de sintaxis, no tiene lugar en mi stack. Necesito herramientas que actúen como un compañero Senior emparejado en mi terminal, no como un becario al que tengo que micro-gestionar.

En este cuadrilátero tenemos a cuatro contendientes con filosofías radicalmente distintas: **Codex CLI**, la apuesta minimalista e hiper-optimizada para la nube; **Hermes**, el dios mensajero del open source con una capacidad de orquestación local sin precedentes; **Qwen Agent**, el gigante asiático que está redefiniendo el uso de herramientas complejas; y **Sweep**, el agente asíncrono que ha bajado de GitHub para vivir directamente en tu consola.

Al igual que en la primera semifinal, solo dos sobrevivirán y avanzarán a la Gran Final para enfrentarse a Cline y OpenCode.

---

## 📋 Recordatorio de la Metodología

Evaluaremos a los agentes en las mismas cinco categorías, puntuando sobre 10:

1. **Arquitectura y Configuración Inicial (Setup & Arch):** Instalación, dependencias y fricción inicial.
2. **Capacidad de Integración y Extensibilidad (Extensibility):** Ecosistema, plugins y soporte MCP.
3. **Diseño de Interfaz de Usuario y UX (Design & UX):** Legibilidad, diffs, y experiencia en la terminal.
4. **Características y Rendimiento (Features & Perf):** Autonomía, gestión de tokens, velocidad y precisión.
5. **Funcionamiento en el Mundo Real (Real-World Test):** Refactorización autónoma en un proyecto Kotlin.

¡Que suene la campana!

---

## 🟢 Contendiente 1: Codex CLI - El Minimalista de la Nube

No confundir con el antiguo modelo de OpenAI, "Codex CLI" es una nueva herramienta escrita en Zig que ha irrumpido en 2026 prometiendo una cosa: velocidad de la luz asumiendo que siempre estás conectado a internet.

### Arquitectura y Configuración Inicial

Escrito en Zig, el binario es absurdamente pequeño (apenas 4MB). No requiere runtime, no requiere dependencias.

```bash
# Instalación con un gestor de paquetes moderno
brew install codex-cli
codex auth --provider openai
```

Su arquitectura es puramente *Cloud-Native*. A diferencia de otros agentes que tokenizan y vectorizan tu repositorio localmente, Codex empaqueta tu proyecto (usando ignorados inteligentes vía `.gitignore`) y lo envía a su propia nube para el procesamiento semántico. Esto hace que la configuración local sea un 10/10 en simplicidad, pero plantea serias dudas sobre la privacidad si trabajas con código altamente sensible.

### Integraciones y Extensibilidad

Codex CLI es cerrado por diseño. No soporta MCP ni plugins locales de terceros. Su premisa es que todo el "tooling" ocurre en la nube.

Si necesitas que el agente ejecute un linter, Codex no lo ejecuta en tu máquina local. Envía el comando, lo ejecuta en un contenedor efímero en la nube que tiene una réplica de tu entorno, y devuelve el resultado. Es un enfoque fascinante y extremadamente seguro para tu máquina host (cero riesgo de que la IA ejecute `rm -rf /` en tu laptop), pero hace que extenderlo con tus propios scripts de Python locales sea imposible.

### Diseño y Experiencia de Usuario (UX)

La UX es pura, dura y espartana, pero increíblemente pulida. Utiliza animaciones ASCII simples para denotar que está pensando. Sus diffs se renderizan usando el estándar `delta` (si lo tienes instalado en tu sistema), lo que le da una apariencia idéntica a hacer un `git diff`.

- **Puntos fuertes:** Integración nativa con `delta` o `bat` para mostrar código. Cero lag de interfaz.
- **Puntos débiles:** Al delegar todo a la nube, si tu conexión a internet fluctúa, la UX se degrada instantáneamente, dejando la terminal congelada sin feedback claro.

### Características y Rendimiento

Al usar clústers dedicados para indexar tu código, el RAG (Retrieval) es el mejor de su clase. Cuando le pides que encuentre dónde se define una interfaz, no busca por regex, hace una consulta semántica en su base de datos remota que devuelve resultados en milisegundos.

La inyección de código es estándar (búsqueda y reemplazo), pero está fuertemente respaldada por los LLMs más grandes disponibles, lo que reduce la tasa de fallos.

### Prueba en el Mundo Real

Le pedí a Codex CLI que abstrajera una lógica de validación de formularios en Kotlin que estaba repetida en 4 Fragments diferentes y la moviera a un `ViewModel` base compartido.

**Resultado:** Resolvió el problema conceptualmente a la perfección. Sin embargo, al intentar aplicar los cambios, el contenedor en la nube donde ejecutó el build de prueba no tenía la versión correcta del JDK (17 en lugar de 21 que yo uso localmente), por lo que me aseguró que el código funcionaba, pero al descargarlo a mi máquina, falló la compilación local por un uso de *Pattern Matching* introducido en Java 21/Kotlin 2.0. Una desconexión brutal entre el entorno de la nube y el local.

### Puntuaciones de Codex CLI:
- Setup & Arch: 9/10
- Extensibility: 3/10
- Design & UX: 8/10
- Features & Perf: 8/10
- Real-World Test: 5/10 (Fallo por discrepancia de entorno)
- **Total: 33/50**

---

## 🟡 Contendiente 2: Hermes - El Dios de la Orquestación Local

Hermes es el "darling" actual de la comunidad Indie y Open Source. Escrito enteramente en TypeScript (compilado a binarios nativos con Bun), está diseñado para ser el nodo central de tu sistema operativo, no solo un agente de código.

### Arquitectura y Configuración Inicial

Al usar Bun bajo el capó, la velocidad de ejecución de Hermes rivaliza con Go o Rust. Su inicialización es algo más compleja, ya que te invita a definir un "Workspace" completo.

```bash
bun install -g @hermes-ai/cli
hermes init --workspace-type android
```

Hermes brilla en su gestión de estado. Utiliza una base de datos local SQLite para mantener el historial de conversaciones, mapas de dependencias y un caché de embeddings vectorial. Su arquitectura está pensada para el *Local-First*, priorizando SLMs (Small Language Models) ejecutados en tu máquina vía llama.cpp para tareas triviales y solo llamando a APIs de pago cuando es estrictamente necesario.

### Integraciones y Extensibilidad

Este es el paraíso de los hackers. Hermes implementa el estándar MCP (Model Context Protocol) a la perfección, pero va más allá con su sistema de *Sub-agentes*.

Puedes definir en su configuración que, para tareas de UI, Hermes debe delegar a un sub-agente configurado específicamente con un modelo de visión y darle acceso a herramientas de captura de pantalla (usando Playwright).

```typescript
// hermes.config.ts
export default defineConfig({
  agents: {
    coder: { model: 'claude-4.6', role: 'software_engineer' },
    reviewer: { model: 'llama-3-70b-local', role: 'security_auditor' }
  },
  mcp: ["@mcp/android-adb-tool"]
});
```

Si le das permisos, Hermes puede compilar tu app, instalarla en un emulador vía ADB, tomar una captura, analizarla visualmente y corregir el XML/Compose. Es brujería.

### Diseño y Experiencia de Usuario (UX)

La interfaz de Hermes es interactiva y rica. Utiliza componentes de Inquirer.js hiper-vitaminados.

- **Puntos fuertes:** Cuando Hermes propone un cambio en múltiples archivos, te muestra un árbol interactivo en la terminal. Puedes usar las flechas del teclado para expandir cada archivo, ver el diff, y hacer un "cherry-pick" aceptando solo ciertas modificaciones antes de aplicar. Esto te da un control absoluto.
- **Puntos débiles:** A veces se emociona demasiado imprimiendo logs de "Delegando al sub-agente X..." que ensucian el historial de la terminal.

### Características y Rendimiento

La latencia de Hermes es ligeramente mayor al principio porque intenta hacer gran parte del razonamiento (como el routing de tareas) usando modelos locales. Su motor de patching utiliza AST para lenguajes soportados (TS, Python) pero recae en diffs unificados para Kotlin, lo que a veces requiere intervención manual si los archivos son muy largos.

### Prueba en el Mundo Real

Le pedí a Hermes que implementara un sistema de logging estructurado a través de 20 archivos de la app Android, reemplazando los clásicos `Log.d()`.

**Resultado:** Hermes entendió la magnitud de la tarea. En lugar de intentar hacerlo todo de una vez y desbordar su contexto, él mismo dividió el trabajo en 4 lotes. Editó los archivos, ejecutó `./gradlew lint` localmente (descubriendo que había roto una regla de ktlint en el lote 2), se auto-corrigió, y terminó la tarea en 5 minutos. El control interactivo del diff me permitió revisar su trabajo cómodamente.

### Puntuaciones de Hermes:
- Setup & Arch: 8/10
- Extensibility: 10/10
- Design & UX: 9/10
- Features & Perf: 9/10
- Real-World Test: 9/10
- **Total: 45/50**

---

## 🔴 Contendiente 3: Qwen Agent - El Gigante de Herramientas

Directamente desde los laboratorios de Alibaba, Qwen Agent es un framework Python diseñado explícitamente para exprimir los modelos Qwen-Max y Qwen-Coder. Es un agente pesado, pensado para entornos de investigación y pipelines corporativos, pero que ha encontrado su hueco en el CLI.

### Arquitectura y Configuración Inicial

Su dependencia de Python es fuerte y requiere paquetes pesados. No es una herramienta ligera.

```bash
pip install qwen-agent[all]
qwen-cli start
```

La arquitectura de Qwen Agent está centrada en la "Memoria a Largo Plazo" y el uso de herramientas complejas (Tool Use / Function Calling). Internamente, levanta un servicio local que indexa no solo tu código, sino tus documentos PDF de requisitos, tickets de Jira exportados, etc. Es un monstruo devorador de contexto.

### Integraciones y Extensibilidad

Qwen Agent brilla en integraciones empresariales pero cojea en las herramientas indie modernas (no soporta MCP de forma nativa).

Su sistema de plugins requiere escribir clases de Python bastante verbosas heredando de sus clases base. No puedes simplemente pasarle un script bash y decirle "usa esto". Tienes que definir el esquema JSON completo de entrada y salida, lo que genera mucha fricción para tareas rápidas.

### Diseño y Experiencia de Usuario (UX)

La UX es su talón de Aquiles. Qwen Agent se siente como una herramienta de investigación en Jupyter Notebooks que fue embutida a la fuerza en una terminal.

- **Puntos fuertes:** Puede generar gráficos (como dependencias de clases) y, si tu terminal soporta protocolos de imagen (como iTerm2 o Kitty), renderiza las imágenes directamente en la consola.
- **Puntos débiles:** El formato del texto es tosco. Los diffs a veces se muestran como texto plano sin colorear. Frecuentemente imprime diccionarios JSON enteros en la terminal cuando falla una llamada a herramienta, rompiendo por completo la inmersión.

### Características y Rendimiento

Donde Qwen Agent falla en UX, lo compensa con un razonamiento lógico y una comprensión de arquitecturas complejas asombrosa. Si le pasas un repositorio monolítico legacy sin documentación, es el mejor de los 4 contendientes en deducir cómo funciona el sistema leyendo el código espagueti.

### Prueba en el Mundo Real

El reto para Qwen Agent fue duro: "Analiza la clase `PaymentProcessor.kt`, encuentra un posible *race condition* en la actualización del estado de la UI, y aplica un Mutex o flujo concurrente seguro para solucionarlo".

**Resultado:** Qwen Agent leyó la clase, dedujo la arquitectura (identificó que usaba un MVP antiguo en lugar de MVVM), y escribió una explicación técnica impecable sobre el *race condition*. Propuso una solución usando `Mutex` de coroutines. Sin embargo, su mecanismo para escribir el archivo falló estrepitosamente, sobrescribiendo toda la clase con solo la función modificada, borrando el resto de los métodos. Tuve que usar Git para recuperar el archivo. Un cerebro brillante en un cuerpo torpe.

### Puntuaciones de Qwen Agent:
- Setup & Arch: 6/10
- Extensibility: 6/10
- Design & UX: 4/10
- Features & Perf: 9/10 (Razonamiento puro)
- Real-World Test: 4/10 (Destrucción de código)
- **Total: 29/50**

---

## 🟣 Contendiente 4: Sweep - El Asistente Asíncrono

Sweep nació como un bot de GitHub que leías issues y creaba Pull Requests. En 2026, lanzaron su versión CLI nativa (`sweep-cli`), trayendo toda esa potencia asíncrona directamente a la terminal local.

### Arquitectura y Configuración Inicial

Escrito en Python y empaquetado elegantemente, Sweep CLI actúa como un demonio (daemon) en tu sistema.

```bash
pipx install sweep-cli
sweep daemon start
```

Su arquitectura es única: no está pensado para el "chat" síncrono. Está diseñado para lanzar tareas al fondo y seguir trabajando. Tú escribes el requerimiento en un archivo markdown (ej. `tarea.md`) y ejecutas `sweep run tarea.md`. Sweep toma el control en background, creando una rama de Git, aplicando cambios, ejecutando tests, y cuando termina, te muestra una notificación en el sistema operativo.

### Integraciones y Extensibilidad

Sweep está profundamente integrado con Git y GitHub/GitLab. Su extensibilidad se basa en hooks de Git y scripts de CI/CD locales.

Si quieres que Sweep verifique el código, simplemente le indicas el comando de validación en su configuración (`pnpm test` o `./gradlew check`). Él iterará sobre el código hasta que el comando devuelva un *exit code* de 0. No soporta MCP explícitamente, pero al basar toda su validación en comandos shell, es universalmente compatible.

### Diseño y Experiencia de Usuario (UX)

La UX de Sweep no existe en la terminal interactiva, porque no es un chat.

- **Puntos fuertes:** La ausencia de distracción. Le das una tarea compleja, te vas a tomar un café o a trabajar en otra rama, y vuelves a una rama nueva con commits limpios. Te presenta un resumen del PR directamente en la terminal.
- **Puntos débiles:** Si se atasca, el feedback loop es lento. No puedes decirle "no, hazlo así" de forma rápida. Tienes que cancelar el proceso, reescribir tu prompt en el archivo markdown, y volver a lanzarlo.

### Características y Rendimiento

El motor de búsqueda de Sweep (que combina embeddings locales y bm25) es extremadamente preciso encontrando el contexto relevante. Su capacidad de edición usa un formato de "Search/Replace" muy optimizado que rara vez rompe la indentación.

### Prueba en el Mundo Real

A Sweep le asigné la tarea más tediosa: actualizar 10 dependencias de librerías de interfaz de usuario en el `build.gradle.kts`, lo que requería cambiar nombres de paquetes y actualizar llamadas a métodos obsoletos en unos 15 archivos XML y Kotlin.

**Resultado:** Ejecuté `sweep run update-ui-deps.md`. Durante 8 minutos la terminal estuvo libre. En background, Sweep creó una rama, intentó actualizar, el compilador falló (porque los nombres de atributos XML habían cambiado en la nueva versión de la librería), Sweep leyó el error del compilador, buscó la documentación de migración online usando su herramienta de navegación web interna, aplicó los cambios a los XML, y los tests pasaron. Cuando volvió a mí, la rama estaba lista para fusionar. Un éxito rotundo en autonomía asíncrona.

### Puntuaciones de Sweep:
- Setup & Arch: 8/10
- Extensibility: 7/10
- Design & UX: 7/10 (Por diseño asíncrono)
- Features & Perf: 10/10
- Real-World Test: 10/10
- **Total: 42/50**

---

## 🏆 Veredicto de la Semifinal 2: Los Ganadores

Los resultados han sido reveladores, demostrando que la forma en que interactuamos con los agentes (síncrono vs asíncrono) cambia radicalmente la percepción de valor.

| Contendiente | Setup | Extensibilidad | UX | Features | Real-World | **Total** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hermes** | 8 | 10 | 9 | 9 | 9 | **45** |
| **Sweep** | 8 | 7 | 7 | 10 | 10 | **42** |
| **Codex CLI** | 9 | 3 | 8 | 8 | 5 | **33** |
| **Qwen Agent** | 6 | 6 | 4 | 9 | 4 | **29** |

### ¡Hermes y Sweep avanzan a la Gran Final!

**Hermes** ha arrasado gracias a su visión de orquestación local. Su capacidad para definir sub-agentes, su soporte impecable para MCP y su interfaz interactiva (permitiendo cherry-picking de diffs) lo convierten en la herramienta definitiva para el desarrollador que quiere mantener el control absoluto mientras delega tareas complejas.

**Sweep**, a pesar de su enfoque poco convencional (sin chat interactivo), se ha ganado el segundo puesto por fuerza bruta de utilidad. La capacidad de lanzar tareas de refactorización largas y olvidarte de ellas hasta que los tests pasen es un superpoder real en el flujo de trabajo de un indie.

Codex CLI se quedó corto debido a su arquitectura exclusivamente en la nube que falló estrepitosamente al no poder replicar un entorno local complejo de Kotlin.

Qwen Agent es un cerebro atrapado en una herramienta mal diseñada para el día a día; brillante para análisis teóricos, pero peligroso si le das permisos de escritura en tu repositorio sin supervisión.

¡El escenario está listo! La Gran Final enfrentará a la precisión quirúrgica de **Cline**, la flexibilidad modular de **OpenCode**, la orquestación suprema de **Hermes** y la autonomía asíncrona de **Sweep**. Preparen sus teclados, el último enfrentamiento será épico.
