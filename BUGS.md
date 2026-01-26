# Reporte de Bugs y Calidad del Código

## Estado Actual
✅ **Todos los tests pasan.**

## Historial de Bugs Encontrados y Corregidos

### 1. Uso de `innerText` en `src/scripts/blog.ts`
- **Descripción:** El script utilizaba `code.innerText` para obtener el código a copiar. `innerText` depende del layout renderizado y no es estándar en todos los entornos (ej. JSDOM), lo que causaba fallos en los tests y podría causar inconsistencias.
- **Corrección:** Se reemplazó por `textContent`, que es más rápido, estándar y fiable para obtener el contenido textual de nodos DOM.
- **Estado:** Corregido.

## Observaciones
- Se han expuesto funciones internas de los scripts (`search.ts`, `blog.ts`) para permitir su testeo unitario. Esto mejora la mantenibilidad.
