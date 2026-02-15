---
title: "2026 W05: La Búsqueda de la Verdad Matemática (y por qué importamos una librería de física cuántica)"
description: "Una crónica de 3000 palabras sobre cómo intentamos añadir dos juegos 'sencillos' y acabamos peleando con problemas NP-Completos. La historia de cómo un simple tablero de luces nos obligó a usar SAT Solvers industriales y cómo la división entera casi destruye nuestra salud mental."
pubDate: 2026-02-01
tags: ["devlog", "algorithms", "sat-solver", "procedural-generation", "difficulty-design", "android", "math"]
heroImage: "/images/devlog-default.svg"
---

Esta semana iba a ser tranquila. Lo juro.
El plan en el *Daily* del lunes era insultantemente simple: "El motor de PuzzleHub ya es estable. Esta semana toca añadir contenido. Dos juegos nuevos: *Akari* y *Math Crossword*. Son grids estáticos, lógica sencilla. Para el jueves estamos fuera".

Narrador: *No estuvieron fuera el jueves.*

Lo que siguió fue una de las semanas más intensas, frustrantes y técnicamente exigentes de todo el proyecto. Pasamos de diseñar interfaces bonitas en Jetpack Compose a leer papers académicos oscuros sobre satisfacción booleana a las 3 de la mañana, y a depurar algoritmos de backtracking que realizaban medio millón de operaciones por segundo solo para intentar colocar un simple signo de sumar (`+`) sin romper las leyes fundamentales del universo.

Esta es la historia de cómo dos juegos aparentemente inofensivos casi nos rompen el cerebro, y de cómo la **Ingeniería Algorítmica Hardcore** (esa que te dicen en la universidad que nunca usarás en la vida real) nos salvó del desastre.

## Parte 1: Akari y la Ilusión de la Sencillez

*Akari* (también conocido como *Light Up*) es un puzzle de una elegancia japonesa casi insultante.
Tienes una cuadrícula oscura. Tienes bombillas.
Las reglas caben en un haiku:
Las bombillas iluminan en cruz hasta topar con una pared. Dos bombillas no pueden mirarse directamente. Todas las celdas blancas deben quedar iluminadas.
Parece un juego de niños.

El lunes por la tarde teníamos la implementación visual funcionando. El tablero se veía precioso con su tema oscuro. Podías poner bombillas. Las luces se encendían.
Solo faltaba una pequeña pieza: el **Generador de Niveles**.
"Bah", pensé con esa arrogancia típica del ingeniero que no ha mirado la Wikipedia. "Es fácil. Ponemos bombillas al azar donde quepan, y luego ponemos las paredes negras para que encaje la solución".

### El Primer Intento: La Ingenuidad del Algoritmo Avaro

Escribí un algoritmo *Greedy* (Avaro) en 30 minutos.
La lógica era simple: Itera por el tablero vacío. ¿Cabe una bombilla aquí sin romper nada? Ponla con un 30% de probabilidad. Repite hasta que todo esté iluminado. Cuenta las bombillas finales. Digamos que son **15**.
Listo. Ese es el "Récord del Nivel". El objetivo a batir.

Lanzamos la build interna. Me senté en el sofá, café en mano, a probar mi creación.
Nivel Medio (10x10). El juego me desafiaba: **"Objetivo: 15 Bombillas"**.
Empecé a jugar. Puse una bombilla aquí, otra allá... optimizando mis movimientos.
Resolví el puzzle. El tablero brillaba en naranja.
Miré el contador: **12 Bombillas**.

Se me heló la sangre.
Había superado al "Récord" del generador por 3 movimientos.
En el mundo de los puzzles lógicos, esto es un pecado capital. El "Par" (el objetivo ideal) debe ser **matemáticamente perfecto**. Es la Verdad Absoluta. Si el usuario puede resolver el puzzle con menos recursos que la máquina, la máquina es estúpida. Y si la máquina es estúpida, el usuario pierde instantáneamente el respeto por el juego. Se rompe la magia.

El problema del algoritmo Greedy es que es miope. Toma decisiones locales. Pone una bombilla en la esquina (0,0) porque "cabe", sin saber que si hubiera esperado y puesto una en (0,1), habría iluminado dos pasillos a la vez en lugar de uno.
Mi generador no estaba encontrando la solución óptima. Estaba encontrando *una* solución cualquiera, una solución chapucera y perezosa.

### El Descenso a la Locura del Backtracking

El martes decidí arreglarlo. "Necesitamos encontrar el Mínimo Global", dije en la reunión.
Implementé un solver por **Backtracking** (Fuerza Bruta Recursiva).
El algoritmo es conceptualmente sencillo, el tipo de cosa que te piden en una entrevista de trabajo:
Prueba a poner una bombilla. Llama a la función recursivamente. Si llegas al final, guarda el récord. Si no, retrocede (backtrack), quita la bombilla y prueba otro camino.

Para un tablero de 7x7 (Nivel Fácil), funcionaba en 50 milisegundos. Perfecto.
Para un tablero de 10x10 (Nivel Medio), tardaba unos 2 segundos. Aceptable para un generador en segundo plano.
Para un tablero de 15x15 (Nivel Experto)...
El emulador se congeló.
El ventilador de mi portátil empezó a sonar como un Boeing 747 intentando despegar desde mi escritorio.
Miré los logs: `Recursion depth: 225`.
Pasaron 10 segundos. 20 segundos. 30 segundos. **Timeout**.

Me di cuenta con horror de dónde me había metido.
*Akari* es un problema **NP-Completo**. El espacio de búsqueda crece exponencialmente con cada celda (`2^N`). En un tablero de 15x15 hay 225 celdas. `2^225` es un número con más ceros que átomos en el universo observable.
Estaba intentando contar hasta el infinito de uno en uno.
No podíamos usar fuerza bruta. Necesitábamos ciencia.

### La Solución Nuclear: SAT Solvers y Sat4j

Aquí es donde la historia deja de ser sobre desarrollo de videojuegos y se convierte en una clase de Lógica Computacional avanzada.
Recordé vagamente mis clases de la universidad. "Todo problema NP puede reducirse a un problema SAT (Satisfacibilidad Booleana)".
Si podíamos traducir las reglas visuales de *Akari* al lenguaje árido de la lógica proposicional, podríamos usar un motor SAT industrial (los mismos que usa la NASA para verificar software crítico o Intel para diseñar chips) para resolverlo en milisegundos.

Decidimos importar la librería `org.sat4j.core` a nuestro proyecto Android.
Sí, metimos una librería de compiladores de 5MB en un juego de puzles móvil. Y no me arrepiento de nada.

El reto fue la **Codificación (Encoding)**. Tuvimos que traducir el juego a Álgebra de Boole.
Definimos cada celda (i, j) como una variable $X_{i,j}$.
Si $X_{i,j}$ es Verdadero, hay una bombilla. Si es Falso, está vacía.
Luego, escribimos las reglas humanas como cláusulas CNF (Forma Normal Conjuntiva):

La **Regla de No-Conflicto** se convirtió en: "Para cada par de celdas que se ven, $(\neg A \lor \neg B)$" (No pueden ser ambas verdad).
La **Regla de Iluminación** se convirtió en una disyunción masiva: "Para cada celda blanca, $(L_1 \lor L_2 \lor ... \lor L_k)$" (Al menos una de las vecinas debe ser verdad).
La **Regla de Muros Numéricos** fue la más difícil. Un muro con un "2" obligaba a usar restricciones de cardinalidad complejas.

Una vez modelado todo este sistema de ecuaciones lógicas, le lanzamos el problema a `Sat4j`.
Pero el SAT Solver es binario. Solo te dice "Sí, es posible" o "No, es imposible". No te dice el número mínimo de bombillas.
Así que tuvimos que envolver el solver en una **Búsqueda Binaria**:
1.  Solver, ¿existe solución con 20 bombillas? -> SÍ.
2.  Solver, ¿existe con 10? -> NO.
3.  Solver, ¿existe con 15? -> SÍ.
4.  Solver, ¿existe con 12? -> NO.
...

El resultado es pura magia negra tecnológica.
El solver mastica un tablero de 15x15, construye un grafo de implicaciones con miles de nodos, utiliza heurísticas de aprendizaje de conflictos (CDCL), poda ramas imposibles del universo... y escupe el resultado: **"El mínimo matemático es 17"**.
Tiempo de ejecución: **210 milisegundos**.

Pasamos de 30 segundos (y un posible crash por StackOverflow) a 0.2 segundos.
Ahora, cuando juegas a Akari en PuzzleHub y ves "Récord: 17", eso no es una sugerencia. Es la **Verdad Absoluta**. Matemáticamente no existe en este universo una configuración de 16 bombillas que resuelva el tablero. Puedes intentarlo toda tu vida, pero las matemáticas dicen que no. Y esa certeza es lo que da calidad a un juego de puzles.

## Parte 2: Math Crossword y la Tiranía de los Enteros

Con el ego por las nubes tras domar a un problema NP-Completo, pensamos: "El siguiente juego es trivial. Crucigramas matemáticos. Sumar y restar. Cosas de primaria. Pan comido".

*Math Crossword* es una cuadrícula donde las palabras son ecuaciones que se cruzan.
Horizontal: `12 + 5 = 17`.
Vertical: `17 - 8 = 9`.
Todas las intersecciones deben cuadrar perfectamente.

Generar esto procedimentalmente resultó ser una pesadilla de **CSP (Constraint Satisfaction Problem)**.
Imagina que generas una fila horizontal: `10 / 2 = 5`.
Bien. Ahora tienes un `2` fijo en el tablero.
Tienes que generar una columna vertical que cruce obligatoriamente por ese `2`.
Digamos `2 + 8 = 10`.
Bien. Ahora tienes un `8` y un `10` fijos en otras posiciones.
Esos números fuerzan la creación de nuevas filas horizontales...
Es una reacción en cadena explosiva. Y si te equivocas en el paso 1, el error se propaga como una ola hasta la esquina opuesta del tablero, haciéndola imposible de rellenar.

Pero el verdadero villano de esta historia no fue la recursividad. Fue un simple símbolo: **La División (/)**.

Si solo usáramos sumas y restas, el problema sería trivial. Cualquier número puede sumarse o restarse.
Pero queríamos las 4 operaciones. Y la división es **tóxica**.
Es extremadamente exigente:
*   `7 / 2 = 3.5`. No queremos decimales en el juego.
*   `10 / 3 = 3.333`. No queremos periódicos.
*   `5 / 0`. Crash de la aplicación.

Decidimos imponer una **Regla de Oro**: Todas las divisiones deben ser enteras y exactas (`a % b == 0`).
Esto parece razonable, pero reduce drásticamente el espacio de búsqueda. De todos los pares de números posibles en el universo, solo una fracción minúscula es divisible de forma exacta.
Esto provocaba que nuestro generador se quedara "arrinconado" constantemente. Llegaba a una celda donde necesitaba desesperadamente un número que cumpliera cuatro condiciones imposibles a la vez:
1.  Ser el resultado de `X + 5`.
2.  Ser el dividendo exacto de `Y / 4`.
3.  Ser positivo (no queremos negativos para no asustar a los niños).
4.  Ser menor de 200 (para que quepa en la UI).

A menudo, ese número mágico no existía. Y el generador moría.

Como no podíamos usar un SAT Solver (demasiadas variables numéricas con dominios infinitos), volvimos al **Backtracking**, pero esta vez armado con una **Estrategia de Reintento Agresiva** (Retry Strategy).

El algoritmo funciona ahora como un constructor testarudo e incansable:
Elige un hueco. Intenta generar una ecuación válida. ¿Falla porque la división no es exacta? Prueba con otro operador (`+`). ¿Falla también? Prueba con `-`.
¿Falla 10 veces seguidas? Entonces realiza un **Backtrack Local**. Borra la ecuación *anterior* (la que nos obligó a poner este número aquí) e intenta regenerarla para que nos dé un número distinto en la intersección.

Definimos un `MAX_RETRIES_PER_SLOT = 500`.
Le damos al algoritmo 500 oportunidades de equivocarse *por cada maldita celda*.
En un tablero Experto de 11x11, esto significa que el motor está realizando millones de intentos fallidos, correcciones y reintentos por segundo en segundo plano.

Ver los logs de `Logcat` mientras se genera un nivel es fascinante, es como ver a alguien intentar abrir una caja fuerte probando combinaciones a velocidad luz:
```text
[CSP] Slot(3,4) imposible. Restricción: Debe ser divisible por 7.
[CSP] Reintentando Slot(3,4)... Intento 154.
[CSP] Reintentando Slot(3,4)... Intento 155.
[CSP] Backtracking al Slot(2,4)... Cambiando '14+2' por '28-12'.
[CSP] Slot(3,4) éxito!
```
Es caos controlado. Fuerza bruta dirigida por restricciones estrictas. Pero garantiza que cada puzzle sea **único, válido y soluble**.

## Parte 3: El Alma Visual (De Ingeniero a Artista)

Después de tanta pelea algorítmica y tanta sangre matemática, tuvimos que relajar el cerebro con algo de diseño visual.
El primer prototipo funcional de *Akari* era, siendo generosos, horrible.
Paredes negras (`#000000`). Grid gris estándar. Bombillas amarillas (`#FFFF00`).
Parecía una hoja de Excel estropeada. Era funcional, sí, pero no tenía alma. No te invitaba a jugar.

Decidimos aplicar teoría del color para intentar insuflarle vida. Y aquí es donde descubrimos el poder de los matices.

Primero, desterramos el negro puro. Nunca uses `#000000` en una interfaz moderna. El negro puro es un agujero negro que absorbe la luz de la pantalla y crea un contraste infinito con el blanco que cansa la vista rápidamente.
Cambiamos a un color **"Charcoal"** (`#1A1A1C`), un gris carbón muy profundo pero con un toque de calidez. Es más suave, más orgánico, más "premium".

Luego, atacamos el problema de la luz. El amarillo estándar sobre fondo oscuro tiende a verse verdoso y enfermizo en las pantallas OLED.
Cambiamos a un **Naranja Ámbar** (`#FF9800`) vibrante. Queríamos que las bombillas no parecieran LEDs fríos, sino filamentos de tungsteno incandescentes. Queríamos que el tablero se sintiera cálido, como una chimenea.

Pero el cambio más importante no fue estético, fue funcional. Lo llamamos **Feedback Reactivo** (Cognitive Offloading).
En *Akari*, tienes pistas numéricas en las paredes (ej. un "2").
Al principio, tenías que contar mentalmente: *"A ver, este muro tiene un 2, y tiene dos bombillas al lado... vale, está completo"*.
Eso es carga cognitiva inútil. Estás obligando al cerebro del usuario a hacer micro-tareas administrativas en lugar de centrarse en la lógica del puzzle.

Hicimos que los números cobraran vida.
*   Si faltan bombillas, el número es blanco neutro.
*   Si te has pasado (tienes 3 bombillas alrededor de un "2"), el número se vuelve **Rojo Alarma**.
*   Y si la condición está satisfecha perfectamente, el número se ilumina en ese mismo **Naranja Ámbar** brillante.

El efecto en la jugabilidad es inmediato. Ahora puedes escanear el tablero con una mirada rápida y tu cerebro reptiliano detecta patrones de color sin tener que hacer aritmética consciente. *"Todo lo que es naranja está bien. Todo lo que es blanco necesita atención"*.
El juego fluye. La fricción desaparece.

## Conclusión

Esta semana hemos añadido dos juegos nuevos a la suite.
Visualmente, son solo cuadrículas con números y luces. Parecen sencillos.
Pero bajo el capó, hay un motor de lógica digno de una tesis doctoral.

En *Akari*, hay un **SAT Solver** podando árboles de decisión de $2^{225}$ ramas en 200 milisegundos para decirte la verdad matemática sobre el récord.
En *Math Crossword*, hay un algoritmo de **Constraint Satisfaction** luchando contra el caos combinatorio millones de veces por segundo para asegurarse de que nunca te encuentres con una división inexacta.

El usuario nunca sabrá esto. Probablemente nunca lea este post.
El usuario solo verá que el juego "se siente bien". Que los niveles son "divertidos" y "justos". Que "siempre hay solución".
Y ese es el mayor halago posible para un ingeniero: que tu complejidad sea invisible, y que solo quede la magia.

---
*Fin del reporte semanal.*
