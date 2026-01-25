# Bitácora de Tester 🧪

Registro de actividades de aseguramiento de calidad y ejecución de pruebas.

## 2026-01-25 - Implementación Inicial de Suite de Tests
**Estado:** ✅ Pasó
**Cobertura:**
- `src/utils/slugs.ts`: Lógica de normalización de cadenas.
- `src/scripts/search.ts`: Lógica de búsqueda, escape HTML y manipulación DOM (mocked).
- `src/scripts/blog.ts`: Funcionalidad de botones de copiado y barra de progreso.
**Bugs Encontrados:**
- Se encontró un uso de `innerText` en `blog.ts` que causaba incompatibilidad en entornos sin layout completo (como JSDOM). Se corrigió usando `textContent`.
**Mejoras:**
- Instalación de Vitest y JSDOM.
- Refactorización de scripts para hacer exportables sus funciones internas.
