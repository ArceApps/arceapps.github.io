---
title: "design.md: El Nuevo Estándar para el Diseño con IA"
description: "Descubre cómo design.md complementa a agents.md, enfocándose en decisiones de diseño, UI/UX, accesibilidad y Jetpack Compose para el desarrollo Android en la era de los agentes de IA."
pubDate: 2026-06-13
lastmod: 2026-06-13
author: ArceApps
keywords:
  - "design.md"
  - "Diseño"
  - "Estándar"
  - "IA"
  - "Documentación"
canonical: "https://arceapps.com/es/blog/design-md-estandar/"
heroImage: "/images/placeholder-article-design-md.svg"
tags: ["IA", "design.md", "Android", "Kotlin", "UI/UX", "Jetpack Compose"]
reference_id: "6a9e1b2c-8f4d-4e9b-b3c1-7d5a0f2e9d8f"
---


## 🎨 Introducción: La Evolución de la Documentación Orientada a la IA

En la vertiginosa evolución del desarrollo de software asistido por Inteligencia Artificial, hemos presenciado la adopción masiva de estándares como `agents.md` o `rules.md`. Estos archivos se han convertido en la columna vertebral para guiar a los agentes de IA (como GitHub Copilot, Cursor, Gemini o Claude) en aspectos de arquitectura, patrones de código, estrategias de testing y convenciones de nombrado. Sin embargo, a medida que los agentes de IA se vuelven más autónomos y capaces de generar componentes completos de interfaz de usuario, ha surgido una laguna crítica: ¿Cómo le explicamos a una máquina la "intención" detrás del diseño visual, la jerarquía, la accesibilidad y el tono emocional de una aplicación?

Aquí es donde entra en juego **`design.md`**. Mientras que `agents.md` es el manual de ingeniería, `design.md` es el manual de estilo, experiencia de usuario (UX) e interfaz de usuario (UI) interpretado para máquinas. En el ecosistema del desarrollo de aplicaciones móviles, particularmente en Android usando Kotlin y Jetpack Compose, este archivo ha demostrado ser un elemento revolucionario. Define la forma en que los LLMs (Large Language Models) y los subagentes de desarrollo frontend entienden el "alma" visual de un producto, asegurando que el código generado no solo compile correctamente o respete la Clean Architecture, sino que además sea hermoso, accesible y consistente con la marca.

Este artículo explora en profundidad el concepto de `design.md`, sus orígenes, su estructura, cómo se diferencia de otros archivos de contexto, y proporciona casos de uso exhaustivos centrados en el desarrollo Android moderno. A través de este análisis de más de 3000 palabras, aprenderás a dominar este nuevo estándar para potenciar la generación de interfaces de usuario en el año 2026.

## 🏛️ Origen e Historia: ¿Quién lo creó y por qué?

El concepto de un archivo dedicado a las reglas de diseño para la IA no surgió de un día para otro ni fue impuesto por un único comité estandarizador corporativo. Más bien, su desarrollo fue un proceso orgánico y comunitario, impulsado por la fricción que experimentaban los equipos de producto al interactuar con modelos de IA generativa para frontend.

### El Problema Inicial

A principios de 2025, cuando herramientas como Cursor y GitHub Copilot Workspace comenzaron a madurar, los desarrolladores empezaron a utilizar prompts globales en sus repositorios para instruir a la IA. Inicialmente, todo se aglomeraba en `agents.md` o `prompt.txt`. Un archivo `agents.md` típico intentaba abarcar:
- Arquitectura (Clean Architecture, MVVM).
- Base de datos (Room, SQLite).
- Diseño (Usa Material 3, botones azules, esquinas redondeadas).

Esta aglomeración generó varios problemas:
1. **Dilución del Contexto**: Los LLMs tienen límites en su capacidad para priorizar información dentro de ventanas de contexto enormes. Cuando las reglas de inyección de dependencias (Hilt) competían en atención con las reglas de padding de botones, la IA a menudo alucinaba en una o ambas.
2. **Ciclos de Vida Diferentes**: Las reglas arquitectónicas raramente cambian, pero el diseño visual iteraba rápidamente tras cada revisión con los diseñadores o pruebas A/B.
3. **Roles Segregados**: Los ingenieros de infraestructura modificaban las reglas de backend/arquitectura, mientras que los diseñadores o frontend engineers querían modificar los lineamientos visuales. Un solo archivo generaba conflictos de control de versiones y bloqueos cognitivos.

### El Surgimiento de design.md

La comunidad open source, específicamente los desarrolladores que trabajaban fuertemente en sistemas de diseño (Design Systems) para la web y aplicaciones móviles, propusieron una separación de responsabilidades ("Separation of Concerns"). La idea de `design.md` fue popularizada simultáneamente por ingenieros en Vercel (para ecosistemas React/Tailwind) y por Google Developer Experts (GDEs) enfocados en Android/Jetpack Compose durante la primavera de 2025.

El consenso fue simple: de la misma forma que el código tiene capas (Dominio, Datos, Presentación), el contexto proporcionado a la IA también debe estar estratificado.
- `agents.md` -> Para la capa de Dominio, Datos y Convenciones de Código generales.
- `design.md` -> Exclusivamente para la capa de Presentación, Sistema de Diseño, UX, Accesibilidad y Animaciones.

Para mediados de 2026, plataformas de orquestación de agentes y herramientas como el *MAO (Multi-Agent Orchestrator)* o frameworks como *OpenSpec* ya reconocían nativamente la presencia de un archivo `design.md` en el directorio raíz de los proyectos, inyectándolo automáticamente cuando el agente operaba sobre archivos relacionados con la interfaz de usuario.


![Infografía OpenSpec](/images/infographic-openspec.svg)

## ⚖️ Diferencia entre agents.md y design.md

Para evitar solapamientos y maximizar la eficiencia de los tokens consumidos por los LLMs, es crucial entender qué corresponde a cada archivo.

### agents.md (El Arquitecto)
- **Propósito**: Definir la estructura, la lógica y las reglas de ingeniería.
- **Contenido típico**: Clean Architecture, patrones de inyección de dependencias (Hilt, Koin), manejo de estado (StateFlow, SharedFlow), estrategias de persistencia (Room Database), gestión de hilos (Coroutines), convenciones de nombrado (PascalCase, camelCase).
- **Enfoque**: Cómo los datos se mueven, se procesan y se almacenan.
- **Ejemplo de Regla**: "Todos los repositorios deben estar detrás de una interfaz e inyectados vía Hilt. Los ViewModels deben exponer el estado a través de StateFlow".

### design.md (El Diseñador UI/UX)
- **Propósito**: Definir la estética, la usabilidad, el tono visual y las reglas de interacción.
- **Contenido típico**: Paleta de colores, tipografía, espaciado (grids, paddings lógicos), directrices de accesibilidad (A11y, TalkBack), componentes de Material 3 personalizados, comportamientos de animación (duraciones, interpoladores).
- **Enfoque**: Cómo el usuario ve, siente e interactúa con los datos.
- **Ejemplo de Regla**: "Todos los botones primarios deben usar un radio de borde de 12dp. Las animaciones de entrada deben durar 300ms usando el interpolador FastOutSlowIn. Todo componente clicable debe tener un mínimo touch target de 48dp por razones de accesibilidad".

## 🚀 ¿Por qué es necesario design.md en la Era de la IA?

El uso de `design.md` ofrece beneficios tangibles inmediatos que resuelven cuellos de botella reales en el desarrollo moderno de software.

### 1. Consistencia Visual sin Intervención Humana Constante
Las alucinaciones visuales son un problema común. Si le pides a una IA "Crea una pantalla de login", y no tiene un contexto claro, la IA recurrirá a sus datos de entrenamiento por defecto. Podría generar botones con estilos de Material 2, colores genéricos (como el clásico púrpura/teal por defecto de Android Studio), y márgenes inconsistentes (por ejemplo, usar 10dp en lugar del múltiplo de 4dp estándar de Material).
Con `design.md`, la IA sabe antes de escribir la primera línea de Compose que los márgenes son múltiplos de 8dp, los colores se sacan del objeto `MaterialTheme.colorScheme` y los campos de texto deben ser `OutlinedTextField` con esquinas redondeadas específicas.

### 2. Ahorro Masivo de Costos en Tokens
Los modelos avanzados o1-preview, DeepSeek-R1 o Claude 4.6 Opus cobran por token. Si envías las reglas de diseño, base de datos y red en cada iteración de una pantalla, estás desperdiciando dinero y ancho de banda. Si configuras a tu agente para que solo cargue `design.md` cuando toca archivos en el paquete `ui/` o archivos `.kt` que contienen la anotación `@Composable`, logras un enrutamiento de contexto hiper-eficiente.

### 3. Accesibilidad por Defecto (A11y-First)
Uno de los mayores logros de `design.md` es forzar a la IA a considerar la accesibilidad. Al declarar reglas explícitas de accesibilidad en el archivo, obligamos al agente a generar modificadores `semantics` y descripciones de contenido en Jetpack Compose de manera automática, eliminando la deuda técnica de accesibilidad que suele dejarse para el final del ciclo de desarrollo.

### 4. Soporte Multi-Tema Avanzado
En aplicaciones modernas de Android de 2026, el soporte para modo oscuro, temas dinámicos (Material You) e incluso soporte de alto contraste son estándares obligatorios. Un archivo `design.md` detalla exactamente cómo el agente debe mapear los colores semánticos a los esquemas de luz/oscuridad sin que el desarrollador tenga que recordárselo.

## 🏗️ Estructura Canónica de un archivo design.md

Un buen archivo `design.md` debe estar escrito de manera que un modelo de lenguaje lo procese rápidamente, usando encabezados claros, listas, y ejemplos ("few-shot prompting"). A continuación, se presenta la estructura ideal:

1. **Brand & Tone (Marca y Tono)**: Define el estado de ánimo. ¿Es una app financiera seria o un juego lúdico?
2. **Design System Baseline (Base del Sistema de Diseño)**: ¿Material 3, Cupertion, o un sistema 100% personalizado?
3. **Typography & Hierarchy (Tipografía y Jerarquía)**: Roles de texto.
4. **Color Semantics (Semántica de Color)**: Cómo usar primarios, secundarios, errores, fondos.
5. **Spacing & Layout (Espaciado y Disposición)**: Reglas de grid, paddings, insets.
6. **Components Rules (Reglas de Componentes)**: Comportamientos para Botones, TextFields, Cards.
7. **Accessibility (A11y)**: Requisitos estrictos de TalkBack, contraste, áreas táctiles.
8. **Motion & Animations (Movimiento y Animaciones)**: Duraciones, curvas.
9. **Code Snippets / "DOs & DON'Ts"**: Ejemplos concretos (el "oro" para el few-shot prompting).

## 📱 Enfoque Profundo: Desarrollo Móvil en Android con Kotlin

En el contexto específico del desarrollo Android, `design.md` brilla con luz propia cuando se integra con Jetpack Compose. Debido a que Compose es un framework declarativo gestionado completamente en código Kotlin, la frontera entre "diseño" e "ingeniería" es tenue.

### 7.1 Jetpack Compose y design.md

Jetpack Compose permite definir la interfaz a través de funciones. Sin directrices, una IA podría crear un lío de modificadores anidados y magic numbers (números mágicos codificados directamente). En el `design.md`, definimos explícitamente cómo debe interactuar la IA con Compose.

**Ejemplo de directriz en design.md:**
```markdown
### Jetpack Compose General Rules
- **Prohibido el uso de "magic numbers"** para tamaños, paddings o elevaciones. Todo debe derivar de nuestro `AppTheme.spacing` o `AppTheme.elevations`.
- El modificador `Modifier` siempre debe ser el primer parámetro opcional en cualquier Composable personalizado, siguiendo el estándar de Android.
- Evitar usar `Box` para centrar contenido a menos que se requiera superposición. Preferir `Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center)`.
```
Con estas instrucciones, la IA genera código Compose idiomático y altamente mantenible. No te entregará componentes rígidos que fallan en diferentes tamaños de pantalla.

### 7.2 Material 3 y Theming Dinámico

Material Design 3 (M3) introdujo el Color Dinámico y la semántica de tokens. Para la IA, es fácil mezclar Material 2 con Material 3 o ignorar por completo las funciones de Theming y usar colores duros.

**Ejemplo de directriz en design.md:**
```markdown
### Color y Theming (Material 3)
- Nuestra app utiliza Material 3. NUNCA importe de `androidx.compose.material.*`. Siempre utilice importaciones de `androidx.compose.material3.*`.
- Nunca codificar colores en hexadecimal (ej. `Color(0xFF0000)`).
- Para texto primario sobre fondo general: usar `MaterialTheme.colorScheme.onSurface`.
- Para fondos de pantalla generales: usar `MaterialTheme.colorScheme.surface`.
- Para resaltar errores: usar `MaterialTheme.colorScheme.error` con texto `onError`.
```
La regla explícita de importaciones es crítica. Aún en 2026, los modelos pueden alucinar y combinar `androidx.compose.material.Text` con `androidx.compose.material3.Scaffold`, lo que causa errores de compilación por incompatibilidad de tipos `TextStyle`. Esta simple regla en `design.md` erradica el problema de raíz.

### 7.3 Accesibilidad (A11y) y Comportamiento Semántico

La accesibilidad a menudo sufre en el código generado por IA. A menos que se le indique, la IA puede crear botones hermosos que son invisibles para los lectores de pantalla como TalkBack.

**Ejemplo de directriz en design.md:**
```markdown
### Accesibilidad Estricta (A11y)
1. **Touch Targets**: Cualquier componente interactivo (Button, IconButton, clickable modifier) DEBE tener un tamaño mínimo de `48.dp`. No anule este tamaño hacia abajo.
2. **Descripciones (Content Description)**:
   - Todo `Icon` e `Image` DEBE tener un `contentDescription` descriptivo.
   - Si la imagen es puramente decorativa y no aporta contexto, usar `contentDescription = null`. NUNCA use una cadena vacía `""`.
3. **Semántica Personalizada**: Al crear componentes compuestos interactivos (ej. un Row que actúa como checkbox), utilice `Modifier.semantics(mergeDescendants = true) { ... }` para que TalkBack lea el componente completo como un solo elemento.
```

### 7.4 Animaciones y Transiciones (Motion)

El diseño fluido es la marca de una app premium en Android. Las animaciones inconexas destruyen la experiencia. A través de `design.md`, estandarizamos la coreografía de la app.

**Ejemplo de directriz en design.md:**
```markdown
### Motion & Animations
- **Duraciones**: Usar nuestro `MotionTokens`. Animaciones rápidas (micro-interacciones) = `200ms`. Animaciones de transición de pantalla = `400ms`.
- **Curvas**:
  - Elementos entrando a la pantalla: `FastOutLinearInEasing`.
  - Elementos moviéndose dentro de la pantalla: `FastOutSlowInEasing` (Standard).
  - Elementos saliendo de la pantalla: `LinearOutSlowInEasing`.
- Para cambios simples de visibilidad, usar SIEMPRE `AnimatedVisibility` en lugar de crear lógicas condicionales duras.
```

### 7.5 Manejo de Insets (Edge-to-Edge)

En las versiones recientes de Android (Android 15 y Android 16 "Baklava"), el modo Edge-to-Edge es forzoso. La app se dibuja detrás de la barra de estado y la barra de navegación de forma predeterminada.
El `design.md` debe instruir a la IA a manejar los `WindowInsets` de Compose correctamente.

**Ejemplo de directriz en design.md:**
```markdown
### Edge-to-Edge y Window Insets
- Todos los `Scaffold` deben consumir sus insets. El `paddingValues` que provee el `Scaffold` DEBE ser aplicado al contenedor principal interno.
- Evitar usar `Modifier.statusBarsPadding()` o `Modifier.navigationBarsPadding()` en componentes hijos profundos; manejarlos a nivel de la estructura de la pantalla para evitar dobles paddings.
```

## 💼 Casos de Uso: ¿Dónde conviene usarlo?

Si bien `design.md` es útil en todos los proyectos de interfaz, hay escenarios donde su uso genera un retorno de inversión monumental.

### 1. Migraciones de Sistemas de Diseño (Legacy UI a Jetpack Compose)
Muchas empresas todavía mantienen una enorme cantidad de código Android heredado en vistas XML. Al usar agentes de IA para refactorizar XML a Jetpack Compose, el archivo `design.md` actúa como la piedra rosetta. Le indica a la IA: "Cuando veas un `ConstraintLayout` con estilo anticuado en XML, tradúcelo a un `Column`/`Row` de Compose aplicando las reglas modernas de Material 3 definidas aquí".

### 2. Proyectos "White-Label" (Marca Blanca)
Imagina una aplicación de comercio electrónico que se compila y distribuye para docenas de diferentes clientes, cambiando solo los logos y esquemas de color. Al tener el `design.md` estructurado y separado, los ingenieros pueden crear variaciones del archivo (ej. `design_client_a.md`, `design_client_b.md`) y el agente de IA ajustará sus sugerencias automáticamente dependiendo de la rama o contexto cargado.

### 3. Reducción de Revisiones entre Diseño (Figma) y Desarrollo
A menudo, un desarrollador recibe un diseño en Figma y le pide a un LLM multimodal (que puede "ver" imágenes) que genere el código a partir del pantallazo. El problema es que la IA tiende a codificar los colores, fuentes y medidas exactas que ve (ej. un verde `#2A7F3B` y márgenes de `13dp`). Si tenemos `design.md`, podemos proporcionar la imagen de Figma junto con el archivo de diseño, instruyendo: "Genera el Compose basado en esta imagen, PERO mapea todos los colores y márgenes a nuestros tokens definidos en design.md". El resultado es código perfectamente alineado con la infraestructura del proyecto en lugar de parches con valores estáticos.

## 🤖 Soporte y Uso por Diferentes Agentes de IA

En 2026, el ecosistema de herramientas es vasto. Cada plataforma tiene su propia manera de consumir `design.md`.

### Cursor IDE
Cursor permite importar contexto de forma dinámica. Tienes la opción de usar el `@Files` para referenciar `design.md` manualmente. Sin embargo, para flujos de trabajo avanzados, puedes definir en el archivo de reglas globales `.cursorrules` una instrucción como:
`When working on frontend files (*.kt with @Composable annotations or UI packages), MUST read design.md first.`
Cursor, que utiliza modelos como Claude 3.5 Sonnet o GPT-4o subyacentes, integrará todo ese archivo visual sin fricciones.

### GitHub Copilot (y Copilot Workspace)
Copilot lee los archivos que están abiertos en las pestañas del IDE de Android Studio. Una técnica efectiva es mantener `design.md` abierto (incluso si está en un panel en segundo plano) o utilizar los agentes de repositorio de GitHub para que lo consideren parte de la base de conocimiento global del proyecto. En las PR (Pull Requests), los asistentes de revisión de código automatizados de GitHub verificarán el código propuesto contra el archivo `design.md` de forma nativa para buscar violaciones de estilo.

### Gemini Code Assist (en Android Studio)
Google ha optimizado su Gemini Code Assist para el ecosistema Android. Gemini comprende de manera innata los estándares de Jetpack Compose. Cuando le suministras un `design.md` local, Gemini recalibra su generación para priorizar tus preferencias sobre las suyas. Una de las funciones más poderosas es pedirle: "Analiza el UI actual y dime si incumple con design.md", funcionando como un linter de interfaz heurístico.

### Claude 4.6 (Sonnet / Opus)
Cuando se utilizan frameworks orquestadores locales o scripts en Python para manejar tareas (como el Scribe Agent o herramientas de CLI), `design.md` se puede inyectar en el prompt del sistema bajo la etiqueta XML `<design_system>`. Claude 4.6 sobresale en seguir directrices largas, siendo excepcional a la hora de recordar reglas minuciosas de accesibilidad y aplicarlas consistentemente en proyectos de miles de líneas de código.

## ✅ Mejores Prácticas: Qué SÍ poner y qué NO poner

Para que `design.md` no se vuelva inmanejable, aquí hay pautas estrictas de contenido:

**SÍ DEBES PONER:**
- **Reglas declarativas de Compose**: "Usar LazyColumn en lugar de un Column con scroll para listas dinámicas largas".
- **Semántica de colores**: "Primary es para botones de acción. Secondary es para chips y filtros".
- **Comportamientos predeterminados**: "Las imágenes cargadas desde red (Coil/Glide) siempre deben mostrar un placeholder animado y crossfade de 200ms".
- **Mapeo de iconos**: "Utilizamos Material Icons Rounded, nunca Filled o Outlined".

**NO DEBES PONER (Anti-patrones):**
- ❌ **Lógica de negocio**: Dónde guardar los datos del usuario. (Esto va en `agents.md`).
- ❌ **Configuraciones de build**: Dependencias de Gradle y versiones. (Esto lo debe inferir el agente de los archivos de build o `agents.md`).
- ❌ **Código excesivamente largo**: No pegues la clase de 500 líneas de `Color.kt`. Da ejemplos breves de cómo referenciarla y asume que el modelo buscará la definición cuando lo necesite.

## 🔄 Integración en el Ciclo de Vida de Desarrollo (CI/CD)

En 2026, `design.md` no es solo un documento pasivo. Se está integrando en los pipelines de Integración Continua. Utilizando herramientas de validación de IA (AI Linters), es posible escribir pasos en GitHub Actions que alimenten los Pull Requests a un modelo de lenguaje ligero local (SLM) o a una API, junto con `design.md` y el diff del código.

```yaml
# Ejemplo conceptual en .github/workflows/design-check.yml
name: "AI UI Design Checker"
on: [pull_request]
jobs:
  check-design:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: "Run Spec-Kitty Linter"
        run: |
          spec-kitty verify             --diff PR_DIFF             --rules design.md             --focus "accessibility, theming, compose-patterns"
```
Si el modelo detecta que el PR introdujo un botón con `color = Color.Red` explícito, ignorando `MaterialTheme.colorScheme.error` dictado en `design.md`, bloqueará el PR y sugerirá automáticamente el cambio de código. Esto libera tiempo inmenso a los desarrolladores humanos en las revisiones de código manuales enfocadas al aspecto visual (el temido "pixel-pushing").


![Infografía Spec-Kitty](/images/infographic-spec-kitty.svg)

## 🔮 Reflexiones Finales sobre el Futuro del Diseño Asistido por IA

El ascenso de `design.md` simboliza la madurez de nuestra interacción con las herramientas de inteligencia artificial. Hemos superado la fase en la que pedíamos "Hazme un botón" de forma rudimentaria, para entrar en la fase de "Ingeniería de Sistemas de Diseño Escalables a través de IA".

Al separar la ingeniería abstracta (`agents.md`) de la representación visual y experiencia de usuario (`design.md`), permitimos a los equipos escalar el uso de agentes autónomos en aplicaciones móviles de una manera segura y mantenible. Especialmente en Android, donde la combinación de Kotlin, Jetpack Compose y la gran variedad de dispositivos y factores de forma (tablets, foldables) hace que el diseño visual sea un desafío monumental, este archivo estandarizado actúa como el garante de la calidad, previniendo el caos visual.

Con `design.md`, el desarrollador móvil ya no está luchando constantemente contra las alucinaciones del modelo o corrigiendo incansablemente colores, márgenes y etiquetas de TalkBack; el desarrollador está colaborando con una inteligencia que respeta, entiende y aplica su visión creativa con una precisión quirúrgica e infalible. Este es el estado del arte del desarrollo Android UI/UX en 2026.

## 🧩 Casos de Estudio Reales y Ejemplos de Implementación en Compose

Para ilustrar el verdadero impacto de `design.md`, profundizaremos en dos escenarios de la vida real donde la implementación estricta de estas directrices transformó la forma en que los equipos interactuaban con sus agentes de IA generativa.

### Caso de Estudio 1: Aplicación Financiera (Seguridad Visual y Confianza)

En el ámbito de las finanzas y la banca móvil (Fintech), el diseño de la interfaz de usuario no es meramente estético; se trata de transmitir confianza y seguridad. Las aplicaciones financieras a menudo tienen requisitos estrictos sobre cómo se muestran los montos monetarios, las advertencias de seguridad y la navegación fluida.

**El Problema:**
El equipo notaba que cuando pedían a GitHub Copilot que generara una "Tarjeta de Transacción" (Transaction Card) o un "Resumen de Cuenta", el código a menudo variaba enormemente. A veces el agente generaba tarjetas con elevación masiva (sombra pronunciada), otras veces usaba bordes gruesos y, de vez en cuando, los montos negativos aparecían en rojo puro en lugar del "Rojo de Alerta" calibrado por la marca que garantizaba legibilidad en modo oscuro.

**Solución con design.md:**
El equipo introdujo una sección en `design.md` dedicada exclusivamente al manejo de datos sensibles y tarjetas en Jetpack Compose.

```markdown
#### Fintech Specific UI Rules
- **Confianza Visual (Tarjetas)**: Todos los contenedores de resumen de cuentas deben usar `OutlinedCard` con un `borderWidth` de `1.dp` y `color = AppTheme.colors.divider`. NUNCA use `ElevatedCard` porque las sombras inconsistentes reducen la percepción de modernidad corporativa.
- **Formateo Numérico**: Para números de moneda, use SIEMPRE el `AmountTextComposable` preexistente que garantiza la fuente monoespaciada tabular (tabular numbers) para que los números no salten en animaciones.
- **Colores de Estado Financiero**:
  - Positivo/Ingresos: `AppTheme.colors.successGreen` (Nunca verde genérico).
  - Negativo/Gastos: `AppTheme.colors.alertRed`.
  - Neutro/Cargos en proceso: `AppTheme.colors.pendingOrange`.
- **Modo Privacidad**: Al mostrar saldos, la IA debe implementar o soportar el modificador personalizado `Modifier.blurIfPrivacyModeActive()`.
```

**Resultado:**
Tras la implementación de este fragmento en el archivo, las revisiones de código de diseño cayeron drásticamente. Cada vez que un desarrollador escribía un comentario como `// Genera una lista de las últimas 5 transacciones de la tarjeta de crédito`, el código generado instanciaba las tarjetas delineadas correctas, usaba los colores semánticos exactos para los montos y recordaba importar y aplicar el modificador de desenfoque de privacidad. La IA dejó de ser una "máquina de hacer código rápido y sucio" para convertirse en un participante que respetaba celosamente el manual de marca.

### Caso de Estudio 2: Aplicación E-commerce (Fluidez, Animaciones y Retención)

En las aplicaciones de comercio electrónico (E-commerce), la retención del usuario está directamente vinculada a la velocidad percibida y a lo "agradable" de las micro-interacciones (micro-interactions). Añadir un artículo al carrito o realizar un scroll fluido por un catálogo masivo son acciones críticas.

**El Problema:**
En este caso, Gemini Code Assist estaba generando vistas de catálogos en Compose utilizando iteraciones simples (`Column` con scroll) que degradaban masivamente el rendimiento en listas largas con imágenes pesadas, o bien no implementaba feedback háptico (vibraciones) en botones clave como "Añadir al Carrito", lo cual había sido solicitado por el equipo de Producto como un requisito para mejorar el "feel" de la app.

**Solución con design.md:**
Se estructuró una sección enfocada en Rendimiento Visual y Micro-interacciones.

```markdown
#### E-commerce Performance & UX
- **Listas Largas**: CUALQUIER lista de productos que pueda exceder los 10 elementos debe usar imperativamente `LazyVerticalGrid` o `LazyColumn`. El modificador `key` DEBE ser implementado proporcionando un ID único (ej. `item(key = it.productId)`) para optimizar la recomposición.
- **Imágenes Asíncronas**:
  - Usar la librería `Coil` a través del componente `AsyncImage`.
  - Todo `AsyncImage` debe implementar un `Placeholder` en forma de `Box` con un modificador `Modifier.shimmerEffect()` hasta que la imagen cargue.
- **Feedback Táctil (Haptics)**:
  - Los botones de acciones primarias ("Comprar", "Añadir a carrito", "Guardar en favoritos") DEBEN invocar a `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.LongPress)` en su bloque `onClick` (o el equivalente custom `triggerHapticFeedback`).
- **Botones y Estados de Carga**: Ningún botón debe bloquear la UI al ser pulsado. Cuando una acción está en proceso, el botón debe transformar su `content` para mostrar un `CircularProgressIndicator` de `16.dp` con color alineado a `onPrimary`.
```

**Resultado:**
La generación de componentes de botones y listas pasó a ser de calidad de producción en el primer intento ("zero-shot zero-defect"). Si el equipo pedía a la IA que construyera la pantalla de "Detalles del Producto", la IA incorporaba haptics automáticamente en el botón de compra inferior, manejaba la carga de la imagen del producto con el efecto "shimmer" (parpadeo elegante de carga), y estructuraba la interfaz para no tener problemas de recomposición lenta.

## 🛠️ Cómo Iniciar con design.md Hoy Mismo: Una Guía Paso a Paso

Si después de leer sobre la eficiencia y el control que brinda `design.md` deseas implementarlo en tu proyecto, te ofrecemos una guía paso a paso para crear un archivo robusto sin abrumar al LLM.

### Paso 1: Auditoría de tu Sistema de Diseño Actual
Antes de escribir el archivo, necesitas entender cómo funciona actualmente tu diseño.
- ¿Tienes un Figma bien estructurado?
- ¿Tus tokens de color están definidos en un archivo `Color.kt` o `Theme.kt` en Compose?
- Reúne estas definiciones. Anota los colores, tipografías y medidas de espaciado clave.

### Paso 2: Crear el Archivo Base
En el directorio raíz de tu proyecto (al lado de `README.md` y `agents.md`), crea el archivo `design.md`.
Comienza con una cabecera que establezca el contexto y las reglas fundamentales inmutables.

```markdown
# 🎨 UI / UX Design Guidelines for AI Agents

Este documento contiene las reglas exclusivas de interfaz, experiencia de usuario y diseño visual para el proyecto [Nombre de tu App].
Todo código relacionado con la vista (UI), especialmente funciones @Composable, DEBE adherirse estrictamente a estas reglas.

## 1. El Paradigma de UI
- Usamos **Jetpack Compose** exclusivamente. Ningún layout en XML debe ser generado ni modificado.
- Sistema Base: **Material Design 3 (M3)** modificado con nuestra marca.
```

### Paso 3: Definir los Tokens Visuales
Establece reglas claras para que la IA sepa dónde buscar los valores y evite la invención.

```markdown
## 2. Tokens y Medidas
- **Grid/Spacing**: Usamos un sistema base de 8dp. Los valores válidos para padding/margin son: `4.dp`, `8.dp`, `16.dp`, `24.dp`, `32.dp`.
  - Nunca inventes espaciados intermedios (ej. `10.dp`, `12.dp` no están permitidos).
- **Tipografía**: Accede a las tipografías mediante `MaterialTheme.typography`.
  - Títulos principales: `headlineMedium`.
  - Subtítulos: `titleLarge`.
  - Texto de cuerpo: `bodyMedium`.
```

### Paso 4: Añadir la Sección "Golden Rules" (Reglas de Oro)
Las reglas de oro son aquellos "DON'Ts" absolutos que has visto fallar consistentemente en el pasado al usar IA. Esta es la parte más empírica y personal de tu `design.md`.

```markdown
## 3. Golden Rules (DO NOT IGNORE)
- ❌ **NO** uses `Scaffold` anidados. Solo debe haber un `Scaffold` por pantalla.
- ❌ **NO** uses modificadores de tamaño fijos como `width(200.dp)` a menos que sea un icono estricto. Usa `fillMaxWidth()` y `weight` para interfaces responsivas.
- ✅ **SÍ** utiliza `Preview` exhaustivos. Cada componente principal debe tener al menos dos funciones de `@Preview`: una para el modo claro y otra para el modo oscuro (`uiMode = Configuration.UI_MODE_NIGHT_YES`).
```

### Paso 5: Refinamiento Iterativo
No esperes que `design.md` sea perfecto desde el día 1. Trátalo como un archivo vivo, tal como el código fuente. Cuando la IA genere un componente que luce mal o viola una directriz de accesibilidad que no habías considerado, tu primer paso no debería ser simplemente corregir el código. Tu primer paso debe ser:
1. Abrir `design.md`.
2. Añadir la regla explícita que prevendrá ese error en el futuro.
3. Pedir a la IA que re-genere el código basándose en el archivo actualizado.

## 🧠 La Psicología de design.md: Colaboración, no Dictadura

Una de las barreras mentales más grandes para los equipos de diseño y frontend al adoptar herramientas basadas en agentes de IA es el miedo a perder la "artesanía" o el toque humano que diferencia una interfaz excelente de una genérica. El temor es válido: si delegas la UI a un modelo entrenado con la web entera, la tendencia a la reversión a la media es fuerte. Obtendrás un diseño "promedio", plano y corporativo sin alma.

El archivo `design.md` actúa como un manifiesto. Te permite inyectar esa "artesanía" en forma sistemática y descriptiva. Al plasmar tu filosofía de diseño en texto estructurado, pasas de ser un creador de componentes individuales a un creador de "directores de arte virtuales". Estás educando al LLM sobre lo que hace que tu aplicación sea única. Estás automatizando el trabajo tedioso (escribir modificadores de padding y alinear elementos de accesibilidad) para liberar el intelecto humano y enfocarse en la estrategia del usuario y las interacciones de alto nivel.

## 🌐 Comparativa Evolutiva: Cómo Procesan design.md los Diferentes Modelos de IA

A lo largo del tiempo, diferentes modelos lingüísticos han mostrado distintas fortalezas y debilidades al procesar el contexto proporcionado en archivos como `design.md`. Esta sección desglosa las capacidades actuales observadas en la industria (a mediados de 2026):

### Modelos Especializados en Razonamiento Profundo (OpenAI o1-preview, DeepSeek-R1)
Estos modelos, introducidos a finales de 2024 y mejorados a lo largo de 2025/2026, introdujeron el paradigma del razonamiento o "tiempo para pensar" (Chain of Thought oculto). Cuando se les provee el `design.md`:
- **Ventaja**: Son extraordinariamente precisos al correlacionar componentes complejos. Si el `design.md` indica "Las Cards deben adaptar su elevación según el estado de conexión de la app (conectado=2dp, desconectado=0dp)", el modelo o1 razonará internamente las ramificaciones de esto en Compose, requiriendo inyectar estados y generará un componente impecable.
- **Desventaja**: Su tiempo de respuesta puede ser ligeramente superior para tareas micro-frontends sencillas, por lo que a menudo se utilizan en la fase de estructuración inicial (Scaffolding) más que en autocompletado en tiempo real.

### Modelos Equilibrados de Código (Claude 4.6 Sonnet)
Ampliamente considerado como el campeón en ingeniería de software para interacciones de chat prolongadas.
- **Ventaja**: Claude 4.6 posee una capacidad legendaria para asimilar documentos largos sin perder fidelidad (el problema de "Lost in the Middle"). Si tienes un `design.md` de 500 líneas con detalles exhaustivos sobre las transiciones de MotionLayout y Compose, Claude lo seguirá a la letra de la A a la Z, respetando las importaciones de Material 3 y sin olvidar nunca el bloque de accesibilidad en el modificador `semantics`. Es la opción preferida por equipos que usan herramientas como Cursor o PearAI.

### Asistentes Embebidos y Autocompletado (Copilot)
Los modelos rápidos y reactivos que sugieren código mientras escribes.
- **Dinámica**: Dado que el autocompletado opera con milisegundos de latencia, no "razonan" profundamente, sino que completan patrones basándose en el contexto inmediato. Aquí es donde mantener fragmentos de ejemplos ("few-shot snippets") de botones y campos de texto dentro del `design.md` es fundamental. Copilot, al escanear ese documento cercano, adoptará instantáneamente el uso de las variables de tu `AppTheme` sin alucinar literales mágicos.

## 🏁 Conclusión: Un Nuevo Pilar del Desarrollo

Al igual que el testing, el linting o la arquitectura en capas, la gestión de contexto para IA se ha consolidado como una disciplina formal en la ingeniería de software moderna. En un mundo donde el código se genera a la velocidad del pensamiento, el control sobre el resultado final ya no recae en la capacidad de memorizar sintaxis, sino en la capacidad de especificar claramente las restricciones e intenciones a un agente colaborativo.

El archivo `design.md` no compite con `agents.md`; lo complementa simbióticamente. Juntos, forman un marco operativo completo: uno para el corazón y el cerebro de la aplicación (los datos y la lógica), y otro para su rostro y su voz (la UI y la UX). Si eres un desarrollador Android en 2026 y buscas maximizar la calidad visual, la coherencia de la marca y la inclusión mediante accesibilidad, dejando que la inteligencia artificial se encargue de la escritura del código repetitivo de Jetpack Compose, adoptar y mantener un documento `design.md` es, indiscutiblemente, la mejor inversión de tiempo que puedes realizar.

Empieza hoy. Un simple archivo de texto puede transformar a un asistente virtual de ser un aprendiz desorientado a ser tu mejor experto en frontend de toda la historia.
