# SDD Design Document: Quitar 4Line de la Portada en favor de RadioHub

## 1. Contexto y Objetivos
El sitio muestra las tres aplicaciones más recientes en la portada ordenándolas por su fecha de publicación (`pubDate`). Con la reciente incorporación de **RadioHub**, las tres aplicaciones destacadas son:
1. RadioHub (`2026-07-02`)
2. PuzzleHub (`2023-12-01`)
3. 4Line (`2023-11-15`)

Se solicita quitar **4Line** de la portada, lo que permitirá que la siguiente aplicación más reciente por fecha de publicación (**2048 Puzzle**, con fecha `2023-10-27`) tome su lugar de manera automática.

---

## 2. Alternativas Exploradas

### Alternativa 1: Cambiar la fecha de publicación (`pubDate`) de 4Line
* **Descripción:** Modificar el metadato `pubDate` en los archivos de contenido `src/content/apps/en/4line.md` y `src/content/apps/es/4line.md` para establecerlo en `2023-10-10` (una fecha anterior a la de 2048 Puzzle).
* **Pros:** 
  - Extremadamente simple y rápido de implementar.
  - No altera la lógica de código de la aplicación.
  - Cero riesgo de regresiones en scripts de Astro.
* **Contras:** 
  - Se alteran los metadatos históricos reales de lanzamiento de la aplicación.

### Alternativa 2: Excluir 4Line mediante filtrado en la consulta de Astro
* **Descripción:** Modificar la consulta en `src/components/pages/HomePage.astro` para excluir específicamente la aplicación `4line` (ej. `!id.includes('4line')`).
* **Pros:**
  - Preserva la precisión de los metadatos históricos de 4Line.
* **Contras:**
  - Introduce lógica "hardcodeada" en el componente visual, acoplando el código de la UI a una aplicación específica.

### Alternativa 3: Introducir un flag de exclusión o control en Frontmatter
* **Descripción:** Añadir una propiedad opcional (por ejemplo, `hideFromHome` o `featured`) en la colección de aplicaciones, actualizar el esquema de Zod en `src/content/config.ts` y ajustar todos los markdown y la consulta en `HomePage.astro`.
* **Pros:**
  - Es la solución más limpia a nivel de arquitectura y escalable en el tiempo.
* **Contras:**
  - Requiere modificar el esquema de base de datos de contenido, todos los archivos Markdown y la lógica del componente visual, lo cual introduce mayor complejidad y sobrecarga para un cambio de una sola vez.

---

## 3. Alternativa Seleccionada
Se selecciona la **Alternativa 1** de acuerdo a la decisión explícita y pragmática del usuario. Modificaremos la fecha de publicación de 4Line a `2023-10-10`.

---

## 4. Archivos Afectados
* `src/content/apps/en/4line.md`
* `src/content/apps/es/4line.md`
