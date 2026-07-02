# SDD Implementation Plan: Quitar 4Line de la Portada en favor de RadioHub

## 1. Criterios de Aceptación
1. **Página Principal (Español):** La sección de aplicaciones destacadas debe mostrar **RadioHub**, **PuzzleHub** y **2048 Puzzle**. No debe mostrar **4Line**. [Verificado mediante build estático]
2. **Página Principal (Inglés):** La sección de aplicaciones destacadas debe mostrar **RadioHub**, **PuzzleHub** y **2048 Puzzle**. No debe mostrar **4Line**. [Verificado mediante build estático]
3. **Página de Aplicaciones (Listado):** 4Line debe seguir siendo accesible desde el listado general de aplicaciones (`/apps` y `/es/apps`). [Verificado en estructura de build]
4. **Construcción:** El proyecto de Astro debe compilar correctamente con `pnpm build` sin errores sintácticos o de metadatos. [Verificado exitosamente]

---

## 2. Tareas Atómicas

### Tarea 1: Modificar fecha en contenido en Español [Estimación: 1 min]
* **Acción:** Cambiar `pubDate: '2023-11-15'` por `pubDate: '2023-10-10'` en `src/content/apps/es/4line.md`.
* **Estado:** [x] COMPLETADO
* **Verificación:** Modificado con éxito.

### Tarea 2: Modificar fecha en contenido en Inglés [Estimación: 1 min]
* **Acción:** Cambiar `pubDate: '2023-11-15'` por `pubDate: '2023-10-10'` en `src/content/apps/en/4line.md`.
* **Estado:** [x] COMPLETADO
* **Verificación:** Modificado con éxito.

### Tarea 3: Verificación de compilación [Estimación: 2 min]
* **Acción:** Ejecutar `pnpm build` en la terminal.
* **Estado:** [x] COMPLETADO
* **Verificación:** Compilación finalizada exitosamente con código `Complete!`.
