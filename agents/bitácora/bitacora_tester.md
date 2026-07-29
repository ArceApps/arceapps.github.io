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

## 2026-07-29 - Actualización del enlace de Google Play
**Estado:** ✅ Verificado
**Cambios comprobados:**
- Actualizados los cuatro enlaces compartidos al perfil de desarrollador para usar `https://play.google.com/store/apps/dev?id=8812775800441745731`.
- Añadida una prueba de contrato en `src/components/google-play-links.test.ts` para evitar la regresión del formato anterior.
**Verificación:**
- `pnpm test`: 23 archivos y 154 pruebas superadas.
- `pnpm build`: 1023 páginas generadas correctamente.
- `git diff --check`: sin errores.
