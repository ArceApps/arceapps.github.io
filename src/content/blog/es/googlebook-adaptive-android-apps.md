---
title: "Googlebook: Android adaptativo llega al portátil"
description: "Descubre cómo preparar una app Android para Googlebook con UI adaptativa, ventanas libres, teclado, trackpad, multi-instancia y continuidad entre dispositivos."
pubDate: 2026-10-05
lastmod: 2026-10-05
author: "ArceApps"
keywords:
  - "Googlebook"
  - "adaptive Android"
  - "desktop windowing"
  - "Jetpack Compose"
  - "Navigation 3"
  - "Android 17"
canonical: "https://arceapps.com/es/blog/googlebook-adaptive-android-apps/"
heroImage: "/images/googlebook-adaptive-android-apps.svg"
tags: ["Android", "Googlebook", "Adaptive", "Jetpack Compose", "Desktop", "Navigation 3"]
category: android-kotlin
reference_id: "8cd59ca8-005d-4582-a8a9-3aa4f168934d"
---

Durante años, “hacer una app Android para pantallas grandes” significaba casi siempre una de dos cosas: evitar que la interfaz se rompiera en una tablet o añadir un layout alternativo que aprovechara algo mejor el espacio.

**Googlebook obliga a pensar de otra manera.**

Google presentó Googlebook el 22 de septiembre de 2026 como una nueva categoría de portátiles construida sobre una base compartida de Android y los fundamentos de escritorio de ChromeOS. La documentación oficial habla de equipos de fabricantes como HP, Dell, Lenovo, Acer y Asus, con teclado físico, trackpad de precisión, pantallas táctiles y un entorno de ventanas libres.

Eso significa que una app Android ya no solo tiene que preguntarse si cabe en una pantalla más grande.

Tiene que preguntarse si **se comporta como una aplicación de escritorio**.

No es lo mismo.

Un móvil de 6,7 pulgadas y un portátil pueden ejecutar la misma base Android, pero el usuario no espera la misma densidad de información, ni la misma navegación, ni la misma interacción, ni el mismo tratamiento de varias ventanas.

Googlebook convierte el desarrollo adaptativo en algo mucho más concreto.

Ya he escrito sobre [Android Skills](/es/blog/android-skills-ia-desarrollo-guiado/) y sobre cómo Google está preparando herramientas pensadas para que agentes y desarrolladores trabajen con APIs modernas. De hecho, la documentación de Googlebook recomienda explícitamente la skill adaptativa oficial para ayudar a transformar layouts móviles en contenedores Compose responsivos. Pero aquí quiero centrarme en el producto final: **qué tendría que cambiar realmente en una app Android phone-first para que resulte natural en un portátil**.

La respuesta corta es: bastante más que aumentar el ancho máximo.

## Googlebook no es “Android en una pantalla de portátil”

La tentación inicial es imaginar una app móvil dentro de una ventana grande.

Técnicamente, puede arrancar.

Eso no significa que sea buena.

Google insiste en una idea muy clara en su guía: no hay que **estirar** interfaces móviles hasta ocupar un escritorio. Una experiencia de escritorio necesita reorganizar el contenido en agrupaciones funcionales, aprovechar mayor densidad de información, responder a entradas de precisión y convivir con multitarea activa.

La diferencia se ve rápido.

Una aplicación móvil típica puede tener:

```text
barra superior
lista
botón flotante
navegación inferior
```

Si simplemente ocupa 1400 píxeles de ancho, obtenemos:

```text
┌─────────────────────────────────────────────────────────────┐
│                        barra superior                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     lista muy estirada                      │
│                                                             │
│                                                             │
│                                                  (+)        │
├─────────────────────────────────────────────────────────────┤
│                    navegación inferior                      │
└─────────────────────────────────────────────────────────────┘
```

Funciona, pero desaprovecha el espacio y mantiene patrones pensados para el pulgar.

Una versión realmente adaptativa podría convertirse en:

```text
┌──────────────┬──────────────────────────────┬───────────────┐
│ navegación   │ lista                        │ detalle       │
│ persistente  │                              │               │
│              │ elemento 1                   │ contenido     │
│              │ elemento 2                   │ seleccionado  │
│              │ elemento 3                   │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

La app sigue siendo la misma.

La organización cambia porque **el espacio disponible cambia el trabajo que puede realizar el usuario**.

Ese es el punto central del desarrollo adaptativo.

## Diseñar para ventanas, no para dispositivos

Una de las ideas más importantes de la documentación moderna de Android es que la interfaz debería responder al **espacio de ventana disponible**, no al nombre del dispositivo.

No quiero escribir:

```kotlin
if (isGooglebook) {
    DesktopScreen()
} else {
    MobileScreen()
}
```

Eso recrearía el problema de fragmentación que el desarrollo adaptativo intenta evitar.

El mismo Googlebook puede tener la app:

- maximizada;
- ocupando media pantalla;
- en una ventana estrecha;
- junto a otra aplicación;
- redimensionándose continuamente.

Por eso el dato relevante no es “estoy en un portátil”, sino:

```text
¿cuánto espacio tiene mi ventana ahora mismo?
```

Las **window size classes** siguen siendo una herramienta clave para tomar decisiones de layout según el ancho y alto disponibles.

La UI responde a la ventana, no a una tabla de modelos de hardware.

Esto produce una arquitectura mucho más resistente:

```text
compact -> una zona principal
medium  -> más densidad / navegación adaptada
expanded -> varios paneles
```

Y lo importante es que esa lógica también beneficia tablets, plegables y ventanas redimensionables en otros dispositivos.

Googlebook no obliga a crear una segunda app.

Obliga a que la primera esté mejor diseñada.

## Navigation 3 convierte la navegación en layout

Uno de los cambios más interesantes aparece cuando una navegación móvil puede transformarse en una escena multipanel.

En móvil, un patrón list-detail suele ser:

```text
Lista -> tap -> Detalle
```

Tenemos dos destinos en la pila.

En una ventana amplia, mostrar solo uno cada vez es desperdiciar espacio.

Navigation 3 y Material 3 Adaptive permiten representar esas mismas entradas como una escena compartida mediante estrategias como:

- `ListDetailSceneStrategy`;
- `SupportingPaneSceneStrategy`.

Conceptualmente:

```text
ventana compacta
┌─────────────┐
│    LISTA    │
└─────────────┘
      ↓ tap
┌─────────────┐
│   DETALLE   │
└─────────────┘

ventana expanded
┌──────────────────┬──────────────────────────┐
│      LISTA       │         DETALLE          │
└──────────────────┴──────────────────────────┘
```

La idea me parece potente porque evita crear dos sistemas de navegación paralelos.

No necesito una “app tablet” separada.

La misma relación semántica entre destinos puede representarse de forma distinta según el espacio.

Eso es adaptar estructura, no decorar pixels.

## Tres paneles cambian el tipo de tarea

El patrón no termina en list-detail.

Una app puede necesitar:

```text
lista | contenido principal | panel auxiliar
```

Por ejemplo:

- cliente de correo: carpetas | mensajes | correo;
- editor: archivos | documento | propiedades;
- reproductor: biblioteca | contenido | cola;
- notas: cuadernos | nota | referencias.

`SupportingPaneSceneStrategy` permite modelar una relación de panel principal, panel de soporte y panel extra que se muestra o adapta según el espacio.

Esto es especialmente relevante en escritorio porque el usuario puede estar intentando **comparar** información, no solo navegar de una pantalla a otra.

En móvil, sustituir una vista por otra es natural.

En escritorio, ocultar continuamente el contexto puede ser frustrante.

Googlebook empuja a Android hacia experiencias donde “más espacio” no significa componentes más grandes, sino **más contexto simultáneo**.

## La ventana puede cambiar mientras el usuario está trabajando

Otra diferencia fundamental respecto a diseñar para una tablet fija es el **free-form windowing**.

La ventana puede redimensionarse en cualquier momento.

Eso destruye una serie de supuestos cómodos:

- el ancho no es estable;
- la orientación no resume el espacio real;
- “tablet” no implica expanded;
- una app maximizada puede pasar a compact sin reiniciarse;
- el usuario puede moverla entre displays.

La UI tiene que reflow de forma continua.

Un buen layout no debería saltar de “móvil” a “escritorio” como dos mundos completamente distintos. Debería conservar estado y continuidad mientras reorganiza contenido.

Un detalle seleccionado en un layout de dos paneles no debería desaparecer porque la ventana se estreche.

La arquitectura de estado debe ser independiente de la presentación.

Esto conecta muy bien con patrones habituales de Compose:

```text
estado de aplicación
        ↓
decisión adaptativa
        ↓
representación actual
```

No quiero que el estado viva dentro de “la versión desktop” de un composable.

Quiero que el mismo estado pueda proyectarse sobre uno, dos o tres paneles.

## El ratón cambia cosas que el táctil permitía ignorar

Una app diseñada exclusivamente para touch puede funcionar con ratón, pero eso no significa que se sienta bien.

Googlebook introduce expectativas de entrada de precisión:

- cursor;
- hover;
- clic derecho;
- selección precisa;
- scroll de trackpad;
- teclado completo;
- shortcuts.

Jetpack Compose ya soporta mucho de este comportamiento base. La documentación adaptativa indica que Compose 1.7 y posteriores incluyen navegación con Tab y operaciones habituales de ratón/trackpad como click, selección y scroll.

Pero “funcionar” es solo el comienzo.

En escritorio puedo querer:

```text
hover -> feedback
right click -> menú contextual
Ctrl/Cmd + K -> acción
Delete -> borrar selección
Shift -> selección múltiple
cursor -> indica redimensionado o texto
```

En móvil, esconder acciones detrás de long press puede ser aceptable.

Con ratón, un menú contextual con clic derecho puede ser natural.

En móvil, el FAB puede ser el centro de una pantalla.

En escritorio, quizá una toolbar persistente sea mejor.

El factor de forma cambia la ergonomía, no solo el tamaño.

## Los shortcuts deben poder descubrirse

Una aplicación de escritorio competente no puede limitarse a “también acepta teclado”.

El usuario espera poder aprender los atajos.

Android incluye **Keyboard Shortcuts Helper**, y la documentación de Googlebook recomienda hacer que los shortcuts de la app sean descubribles a través de esa superficie.

Eso tiene dos beneficios.

Primero, evita construir una UI propietaria para algo que el sistema ya entiende.

Segundo, obliga a tratar el teclado como parte de la experiencia principal, no como una adaptación de accesibilidad añadida al final.

Una app que uso durante horas en portátil puede ganar muchísimo con:

```text
Ctrl/Cmd + N -> nuevo
Ctrl/Cmd + F -> buscar
Ctrl/Cmd + S -> guardar
Ctrl/Cmd + W -> cerrar contexto
```

Los atajos exactos dependen de la app, pero la idea no.

En escritorio, ahorrar movimientos físicos repetidos importa.

## Multi-instancia: una app ya no equivale a una ventana

Aquí es donde Googlebook empieza a sentirse verdaderamente distinto de una tablet grande.

Android desktop windowing permite **múltiples instancias** de una aplicación.

Desde Android 15, una app puede indicar al sistema que admite esta experiencia con la propiedad:

```xml
<application>
    <property
        android:name="android.window.PROPERTY_SUPPORTS_MULTI_INSTANCE_SYSTEM_UI"
        android:value="true" />
</application>
```

Eso permite que la interfaz del sistema ofrezca acciones como “Nueva ventana”.

Parece un detalle pequeño, pero cambia muchas suposiciones.

¿Qué ocurre si el usuario abre:

```text
Ventana A -> proyecto 1
Ventana B -> proyecto 2
```

¿Compartimos selección global?

¿Abrir un deep link reutiliza una ventana o crea otra tarea?

¿Un singleton de proceso está guardando estado que debería pertenecer a una ventana?

¿La navegación asume que solo existe un back stack visible?

El soporte multi-instancia no se soluciona con una flag.

La flag expone una capacidad que la arquitectura de la app debe soportar de verdad.

## Drag & drop deja de ser un extra bonito

Una vez que hay varias ventanas, mover contenido entre ellas se vuelve natural.

Googlebook pone bastante énfasis en drag & drop entre ventanas:

- texto;
- imágenes;
- archivos;
- elementos propios de la app.

La guía de desktop windowing incluso contempla arrastrar un elemento fuera de una ventana para iniciar una nueva instancia en ciertos flujos.

En Compose existen APIs como `dragAndDropSource`, y Android 15 introdujo flags específicos para operaciones multi-instancia dentro de una misma aplicación.

Lo importante no es memorizar los nombres.

Lo importante es cambiar el modelo mental:

```text
móvil:
selecciona -> acción -> elige destino

desktop:
arrastra el objeto directamente hasta el destino
```

Cuando el usuario tiene ratón o trackpad y varias ventanas visibles, drag & drop puede expresar la intención de forma mucho más directa.

## La barra de ventana también forma parte de la app

En desktop windowing, las apps tienen una caption bar gestionada alrededor de la ventana.

Google permite personalizar parte de esa zona con elementos como:

- fondos;
- búsqueda;
- tabs.

Siempre respetando los controles del sistema.

Esto abre una frontera de diseño interesante.

En móvil, el top app bar suele pertenecer completamente a la aplicación.

En escritorio, la app comparte el borde de la ventana con el sistema.

Hay que evitar duplicar barras, desperdiciar espacio vertical o competir visualmente con botones de minimizar/maximizar/cerrar.

La interfaz empieza a parecer menos una “pantalla Android gigante” y más una aplicación que ocupa una ventana dentro de un workspace.

## Continue On: el móvil deja de ser otra sesión

Una de las funciones más interesantes de Googlebook es **Continue On**.

A partir de Android 17, API 37, una actividad en el teléfono puede habilitar handoff hacia Googlebook. El sistema puede mostrar en la barra de tareas del portátil una sugerencia para continuar la actividad que estaba abierta en el móvil.

No se trata solo de abrir la app.

Se puede transferir contexto mediante `HandoffActivityData`.

Por ejemplo:

```text
teléfono:
documento 42
posición 78 %
tab "comentarios"

        ↓ Continue On

Googlebook:
abre documento 42
restaura posición
mantiene contexto
adapta la UI a multipanel
```

La documentación contempla varios flujos:

- app a app;
- app a app con fallback web;
- directo a web.

Esto es importante porque no todas las experiencias necesitan la misma continuidad.

Una app nativa optimizada para Googlebook puede retomar dentro de Android.

Un servicio cuyo escritorio principal sea web puede transferir directamente a una URL.

La continuidad no obliga a fingir que todo debe vivir en una única interfaz.

## El estado transferido también tiene que adaptarse

Aquí aparece un problema sutil.

Supongamos que en móvil estoy viendo una pantalla de detalle a pantalla completa.

En Googlebook, ese mismo estado quizá no debería abrir “solo el detalle”.

Podría mapearse a:

```text
lista con item seleccionado | detalle restaurado
```

La guía oficial recomienda precisamente adaptar el estado recibido a layouts multipanel.

Eso demuestra una idea importante:

**handoff no es copiar pixels. Es transferir intención y contexto.**

El estado relevante puede ser:

- ID del documento;
- item seleccionado;
- posición;
- filtros;
- pestaña;
- cursor lógico.

La representación depende del destino.

Esta forma de pensar también mejora la arquitectura móvil porque obliga a separar estado semántico de UI accidental.

## Guardar estado al redimensionar ya no es opcional

Una ventana de escritorio se redimensiona constantemente.

Si cada cambio destruye selección, scroll o trabajo parcial, la app se siente rota.

Android ya lleva años recomendando que el estado importante sobreviva a cambios de configuración mediante ViewModel, `SavedStateHandle`, `rememberSaveable` o mecanismos adecuados al caso.

En Googlebook, esa recomendación se convierte en una expectativa cotidiana.

No estoy diseñando para “el usuario rotó el teléfono una vez”.

Estoy diseñando para:

```text
arrastrar borde
arrastrar borde
maximizar
restaurar
mover a otro tamaño
poner junto a otra app
```

La frecuencia cambia la severidad del fallo.

Una pérdida de estado rara en móvil puede convertirse en un bug constante en escritorio.

## Una migración real: de phone-first a adaptive-first

Si cogiera hoy una app Android diseñada casi exclusivamente para móvil, no intentaría “añadir Googlebook” con una gran rama separada.

Haría una migración por capas.

### Paso 1: eliminar supuestos de tamaño fijo

Buscaría:

- anchos hardcodeados;
- lógica basada solo en orientación;
- componentes que asumen pantalla completa;
- diálogos que deberían ser paneles en expanded;
- grids con columnas fijas.

### Paso 2: hacer el estado independiente del layout

Separaría claramente:

```text
qué está seleccionado
qué datos están cargados
qué acción está en curso
```

de:

```text
cuántos paneles estoy mostrando
```

### Paso 3: introducir decisiones por window size

Pasaría de un layout único a representaciones compact/medium/expanded donde tenga sentido.

### Paso 4: convertir navegación relacionada en multipanel

List-detail y supporting panes son candidatos claros.

### Paso 5: revisar entrada

Comprobaría:

- Tab;
- teclado;
- ratón;
- trackpad;
- hover;
- contextual menus;
- shortcuts.

### Paso 6: probar ventanas libres

No basta con tres tamaños de preview. Hay que arrastrar la ventana de forma agresiva.

### Paso 7: decidir si multi-instancia aporta valor

No todas las apps necesitan varias ventanas.

Pero si aporta, hay que validar aislamiento de estado.

### Paso 8: añadir drag & drop donde exprese una acción mejor

No como demo técnica.

Como interacción útil.

### Paso 9: estudiar continuidad

Identificaría qué tareas tiene sentido empezar en móvil y continuar en portátil.

### Paso 10: evaluar calidad desktop

Usaría las guías de calidad adaptativa y escritorio de Android, no mi intuición como único criterio.

Ese proceso mejora también tablets y plegables.

Por eso Googlebook puede ser catalizador sin convertirse en una bifurcación del producto.

## No todas las apps necesitan convertirse en Photoshop

“Desktop-class” no significa llenar cada app de paneles, shortcuts y ventanas.

Una app sencilla puede seguir siendo sencilla.

Una calculadora no necesita tres paneles.

Un temporizador quizá no necesita multi-instancia.

Un puzzle puede beneficiarse de teclado y resize sin convertirse en una suite de productividad.

La adaptación debe seguir la tarea.

La pregunta correcta es:

> ¿Qué expectativas nuevas aparecen porque el usuario tiene más espacio, entrada de precisión y multitarea?

Si la respuesta es “ninguna”, no hay que inventar complejidad.

Si la respuesta es “comparar dos documentos en paralelo”, entonces sí necesitamos arquitectura que lo permita.

El objetivo es naturalidad, no demostrar cuántas APIs nuevas conozco.

## Testing: el emulador de escritorio cambia la disciplina

Google ofrece un **desktop emulator** en Android Studio Preview para probar este tipo de experiencia.

Eso permite verificar:

- free-form resize;
- varias ventanas;
- multi-instancia;
- ratón;
- trackpad;
- teclado.

Este punto es crítico.

Si una feature solo se prueba con un teléfono vertical, la arquitectura adaptativa existe más en el código que en el producto.

Yo añadiría una matriz manual mínima:

```text
compact narrow window
medium window
expanded maximized window
resize continuo
teclado solo
ratón/trackpad
dos instancias
drag & drop, si aplica
handoff, si aplica
```

Y automatizaría lo que sea estable y repetible:

- unit tests de estado;
- screenshot tests de composables;
- navegación;
- lógica de selección;
- persistencia.

Lo visual y ergonómico seguiría necesitando revisión.

## Google Play convierte la calidad adaptativa en distribución

Hay otra motivación que no es puramente técnica.

Google ha anunciado que las apps optimizadas para Googlebook pueden recibir:

- badging de optimización;
- mejor visibilidad;
- colecciones dedicadas;
- destaque durante la configuración de un Googlebook desde un teléfono Android.

Es una forma de convertir la calidad de escritorio en señal de distribución.

No diseñaría la app solo por una insignia.

Pero si la inversión en adaptabilidad ya mejora tablets, plegables y desktop, esa visibilidad adicional aumenta el retorno del trabajo.

Lo interesante es que Google intenta evitar el patrón histórico de “las apps existen en la plataforma pero se sienten como ports”.

## Una sola base de código no significa una sola UI rígida

La promesa oficial es que no hace falta construir una app separada desde cero.

Estoy de acuerdo, con una matización.

**Una sola base de código no significa renderizar exactamente el mismo layout en todos sitios.**

Significa compartir:

- dominio;
- datos;
- estado;
- navegación semántica;
- componentes;
- lógica.

Y permitir que la representación cambie.

Una buena arquitectura adaptativa puede verse así:

```text
            dominio / estado
                  │
                  ▼
          navegación semántica
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   compact      medium     expanded
      │           │           │
   1 pane       1-2 panes    2-3 panes
```

No son tres aplicaciones.

Son tres proyecciones de la misma intención.

## Googlebook también refuerza el desarrollo agentic

Hay un detalle casi lateral en la documentación oficial que merece atención.

Googlebook incluye herramientas de desarrollo y Google está promoviendo una **adaptive skill** para agentes, instalable mediante Android CLI, que aporta contexto para refactorizar layouts móviles hacia Compose responsivo.

Esto conecta directamente con el ecosistema que comentaba en [Android Skills](/es/blog/android-skills-ia-desarrollo-guiado/).

La adaptación tiene patrones suficientemente claros como para ser parcialmente automatizable:

- detectar relaciones list-detail;
- migrar a Navigation 3 Scenes;
- localizar tamaños fijos;
- introducir window-aware containers;
- revisar APIs de entrada.

Pero sigo aplicando la misma regla que con cualquier agente: automatizar el cambio no sustituye validar el resultado.

Una migración adaptive puede compilar y seguir siendo incómoda con ratón.

La herramienta puede transformar estructura.

La experiencia sigue necesitando juicio.

## Qué cambia para mis propias apps

El anuncio me obliga a revisar una idea que durante años fue razonable para un indie Android:

> Primero móvil. Ya veremos tablet más adelante.

Ese “más adelante” ahora acumula demasiados destinos:

- plegables;
- tablets;
- desktop windowing;
- Googlebook;
- displays conectados.

La solución no es añadir cinco versiones.

Es diseñar antes alrededor de **ventanas adaptativas**.

Incluso si una app sigue teniendo como principal usuario a alguien con móvil, una arquitectura que no mezcle estado y tamaño de pantalla es más limpia.

Una lista que puede convertirse en list-detail está mejor estructurada.

Una navegación que funciona con teclado suele tener mejores focus semantics.

Un estado que soporta dos ventanas suele estar menos acoplado a Activity.

Googlebook hace visibles problemas que ya existían.

## Lo que no haría

También tengo bastante claro qué evitaría.

### No comprobaría el modelo de dispositivo

Nada de condicionales “Googlebook”.

### No crearía un módulo desktop completo por defecto

La divergencia debería justificarse por una feature realmente específica.

### No asumiría expanded por estar en portátil

La ventana puede ser estrecha.

### No llenaría la pantalla de contenido porque haya espacio

Mayor densidad no significa saturación.

### No activaría multi-instancia sin probar estado

Dos ventanas rotas son peor que una.

### No trataría mouse como touch con cursor

El hover, contextual menu y shortcuts importan.

### No haría handoff de UI

Transferiría contexto semántico.

### No confiaría solo en previews

El resize real, el focus y el drag & drop necesitan ejecución.

Estas negativas me parecen tan importantes como la lista de APIs.

## Mi modelo mental para Googlebook

Después de leer la documentación, la forma más útil que he encontrado de pensar en Googlebook es esta:

```text
NO:
Android app + pantalla grande

SÍ:
Android app + ventana cambiante
            + precisión
            + teclado
            + multitarea
            + continuidad
```

Ese cambio explica casi todo lo demás.

Si diseño para una pantalla grande, termino ampliando componentes.

Si diseño para una ventana cambiante, empiezo a pensar en reflow.

Si diseño para precisión, pienso en hover, targets y cursor.

Si diseño para teclado, pienso en focus y shortcuts.

Si diseño para multitarea, pienso en estado por ventana, drag & drop y multi-instancia.

Si diseño para continuidad, separo contexto de representación.

Googlebook no añade un único requisito.

Añade un conjunto de expectativas coherentes de escritorio.

## Conclusión

Googlebook me parece más importante para desarrolladores Android por lo que **obliga a mejorar en las apps** que por el hardware concreto que llegue primero al mercado.

Durante mucho tiempo, soportar tablets podía interpretarse como una optimización secundaria.

Un entorno de escritorio hace más evidente la diferencia entre “la app no se rompe” y “la app pertenece aquí”.

La buena noticia es que Google no está proponiendo una plataforma completamente separada.

Las piezas encajan con la dirección que Android ya llevaba:

- window size classes;
- Jetpack Compose;
- Material 3 Adaptive;
- Navigation 3 Scenes;
- desktop windowing;
- multi-window;
- keyboard y pointer input;
- continuidad en Android 17.

Eso significa que hacer una app mejor para Googlebook puede hacerla también mejor para tablets, plegables y cualquier contexto donde la ventana deje de parecerse a un teléfono vertical.

Mi conclusión práctica sería esta:

**no empezaría creando una versión Googlebook. Empezaría eliminando de mi app la suposición de que Android significa una sola ventana móvil.**

Cuando esa suposición desaparece, el portátil deja de ser un port extraño.

Se convierte simplemente en otra forma —más exigente— de ejecutar la misma aplicación.

## Referencias

- [Android Developers Blog — Land your apps on Googlebook with adaptive development](https://developer.android.com/blog/posts/land-your-apps-on-googlebook-with-adaptive-development)
- [Android Developers — Build adaptive apps for Googlebook](https://developer.android.com/develop/adaptive-apps/guides/googlebook/overview)
- [Android Developers — Get started with adaptive apps](https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps)
- [Android Developers — Support desktop windowing](https://developer.android.com/develop/adaptive-apps/guides/support-desktop-windowing)
- [Android Developers — Support cross-device continuity on Googlebook](https://developer.android.com/develop/adaptive-apps/guides/googlebook/cross-device-continuity)
- [Android Developers — Navigation 3 Scenes](https://developer.android.com/guide/navigation/navigation-3/scenes)
- [Android Developers — Adaptive skill for AI agents](https://developer.android.com/agents/skills/jetpack-compose/adaptive/skill)
- [Android Skills: guía de IA para el desarrollo](/es/blog/android-skills-ia-desarrollo-guiado/)
