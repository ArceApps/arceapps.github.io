---
title: "W23: Mejorando Pruebas y Sincronización de Documentación"
description: "Crónica de ingeniería sobre la adición de pruebas exhaustivas para la funcionalidad de búsqueda y la sincronización de la documentación de jerarquía visual con CSS en el portfolio de ArceApps."
pubDate: 2026-06-09
tags: ["devlog", "arceapps", "testing", "documentation", "css", "vitest"]
heroImage: "/images/devlog-default.svg"
reference_id: "2026-w23-testing-documentation"
---

## Estado del Arte: Construcción en Público

¡Hola a todos! Bienvenidos a una nueva entrega del devlog de **ArceApps**, el portfolio y ecosistema de agentes que estamos construyendo en público. Las últimas tres semanas han visto un esfuerzo dirigido a mejorar nuestra cobertura de pruebas y asegurar que nuestra documentación se mantenga perfectamente sincronizada con nuestra implementación real del código. Mientras que PuzzleHub se centra en la lógica del juego, este devlog del [ArceApps Portfolio] trata sobre mantener una plataforma web robusta, bien documentada y exhaustivamente probada.

Abordamos algo de deuda técnica en nuestras suites de pruebas eliminando APIs obsoletas y añadimos pruebas unitarias cruciales para asegurar que nuestro modal de búsqueda se comporte correctamente bajo todas las condiciones. Además, sincronizamos nuestra documentación de jerarquía visual con nuestro CSS global, manteniendo el principio de Única Fuente de Verdad. Profundicemos en los detalles técnicos de estos cambios.

## Hito 1: Pruebas Unitarias Exhaustivas para Transiciones de Estado del Modal de Búsqueda

El portfolio de ArceApps cuenta con un modal de búsqueda dinámico que depende en gran medida de la manipulación del estado en el lado del cliente. Asegurar que la apertura, y específicamente el cierre, de este modal limpie correctamente el estado es vital para una experiencia de usuario fluida. Notamos una brecha en nuestra cobertura de pruebas para la función `closeModal` en `src/scripts/search.ts`.

Para rectificar esto, introdujimos una suite de pruebas unitarias centrándonos en los efectos secundarios observables de cerrar el modal. En lugar de solo probar si la función se ejecuta sin lanzar errores, queríamos asegurar que el DOM se manipula exactamente como se espera.

### Verificando Efectos Secundarios en el DOM

Nuestra estrategia de prueba implicó configurar un entorno DOM simulado usando Vitest y JSDOM, simulando un estado de modal abierto, llamando a `closeModal`, y luego afirmando el estado final del DOM.

```typescript
// src/scripts/search.test.ts (Fragmento demostrando el enfoque de prueba)
it('should clear input value and results container when closing modal', () => {
  // 1. Arrange: Configurar estado inicial (modal abierto con contenido)
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchResults = document.getElementById('search-results');
  searchInput.value = 'query';
  searchResults.innerHTML = '<li>Result 1</li>';

  // 2. Act: Llamar a closeModal
  closeModal();

  // 3. Assert: Verificar cambios de estado esperados
  expect(searchInput.value).toBe('');
  expect(searchResults.innerHTML).toBe('');
  expect(document.body.style.overflow).toBe(''); // Verificar restauración de scroll del body
});
```

Estas pruebas verifican transiciones de estado críticas:
1.  **Limpieza de Entradas:** El input de búsqueda debe vaciarse para que la próxima vez que se abra el modal, sea una pizarra limpia.
2.  **Restablecimiento de Visibilidad:** El contenedor de resultados necesita ser limpiado u ocultado.
3.  **Restauración del Overflow del Body:** Crucialmente, cuando el modal se abre, prevenimos el scroll del fondo configurando `document.body.style.overflow = 'hidden'`. Al cerrar, debemos asegurar que esto se revierta para que el usuario pueda hacer scroll en la página principal nuevamente.
4.  **Manejo de Casos Extremos:** También añadimos pruebas para asegurar que `closeModal` no lance excepciones si faltan elementos del DOM (ej., si se llama antes de que el DOM esté completamente cargado o si la estructura HTML cambia inesperadamente), asegurando robustez.

## Hito 2: Refactorización de Pruebas para Eliminar APIs Obsoletas

Mientras trabajábamos en la suite de pruebas, identificamos una oportunidad para limpiar deuda técnica en `src/scripts/layout.test.ts`. Estábamos usando un mock para `matchMedia` que incluía métodos de escucha obsoletos (deprecated).

### Modernizando Mocks de matchMedia

Los métodos más antiguos `addListener` y `removeListener` en `MediaQueryList` están obsoletos. Los navegadores modernos, y consecuentemente nuestros entornos de prueba actualizados, esperan los métodos estándar de EventTarget: `addEventListener` y `removeEventListener`.

```typescript
// src/scripts/layout.test.ts (Antes de refactorizar)
// Configuración del mock (enfoque obsoleto)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Obsoleto
    removeListener: vi.fn(), // Obsoleto
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

Refactorizamos esto para alinearlo estrictamente con los estándares modernos, eliminando los métodos obsoletos por completo de nuestra configuración del mock. Esto asegura que nuestras pruebas reflejen con precisión cómo se ejecutará el código en un contexto de navegador moderno y previene futuras advertencias o roturas a medida que las bibliotecas de pruebas se actualizan para imponer estrictamente APIs modernas.

```typescript
// src/scripts/layout.test.ts (Después de refactorizar)
// Configuración del mock (enfoque moderno)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```
Este cambio aparentemente pequeño es parte de nuestro compromiso de mantener una base de código limpia, libre de advertencias y compatible con el futuro.

## Hito 3: Sincronizando la Documentación de Jerarquía Visual con CSS

Un desafío significativo en cualquier proyecto de software en evolución es mantener la documentación sincronizada con la implementación real. En el portfolio de ArceApps, tenemos devlogs específicos detallando nuestra filosofía de diseño, como el artículo "Jerarquía Visual Responsiva 2024" (`src/content/devlog/es/responsive-visual-hierarchy-2024.md` y su contraparte en inglés).

### El Desafío de la Documentación Desactualizada

Nos dimos cuenta de que los comentarios dentro de nuestro `src/styles/global.css`, que definen aspectos cruciales de nuestra jerarquía visual (como las restricciones de `max-inline-size` para contenido Markdown), se habían desincronizado con las explicaciones proporcionadas en nuestros devlogs. Esto crea una experiencia confusa para cualquier desarrollador (o agente) que intente entender el sistema.

### La Solución: Sincronización Manual e Ideas de Automatización Futuras

Sincronizamos manualmente los comentarios CSS con el texto del devlog para asegurar consistencia.

```css
/* src/styles/global.css (Comentario Sincronizado) */
.prose img, .prose video, .prose iframe {
  /* Restringiendo medios para evitar romper el layout en pantallas grandes.
     Ver: src/content/devlog/.../responsive-visual-hierarchy-2024.md */
  max-inline-size: min(100%, 500px);
}
```

Si bien una sincronización manual resuelve el problema inmediato, esto resalta un posible proyecto futuro: automatizar la sincronización entre los comentarios del código y la documentación, quizás usando un script que extraiga comentarios específicos y los inyecte en archivos Markdown durante el proceso de build. Por ahora, mantener esta disciplina es clave.

## Conclusión

Las últimas tres semanas se han centrado en las partes invisibles pero cruciales de la ingeniería de software: escribir pruebas robustas, limpiar la deuda técnica y asegurar la precisión de la documentación. Al agregar pruebas unitarias exhaustivas para nuestro modal de búsqueda, eliminar APIs de prueba obsoletas y sincronizar nuestra documentación de jerarquía visual, estamos construyendo un portfolio de ArceApps más estable y mantenible.

Estas mejoras incrementales aseguran que a medida que agregamos características más complejas o integramos nuevos agentes en nuestro ecosistema, la capa fundacional permanezca sólida. ¡Hasta la próxima actualización, feliz código!

### Análisis Profundo: La Importancia de Mocks Precisos en el Desarrollo Web Moderno

Al probar aplicaciones frontend, especialmente aquellas que interactúan estrechamente con APIs del navegador como el DOM o el objeto window, la fidelidad de su entorno de prueba es primordial. El uso de mocks obsoletos, como aquellos que dependen de métodos de escucha `matchMedia` anticuados, puede crear una falsa sensación de seguridad. Sus pruebas podrían pasar localmente, pero el código podría comportarse de manera impredecible en entornos de producción donde esas APIs más antiguas podrían ser eliminadas por completo o comportarse de manera diferente en casos extremos. Al actualizar proactivamente nuestra infraestructura de pruebas para alinearla con los estándares web actuales, no solo prevenimos futuras roturas, sino que también aseguramos que nuestras prácticas de desarrollo sigan siendo agudas y relevantes. Este mantenimiento proactivo es una piedra angular de nuestra filosofía de ingeniería en ArceApps. Creemos que las pruebas no son solo una red de seguridad; son documentación viva de cómo se espera que funcione el sistema. Por lo tanto, mantener la propia suite de pruebas limpia y moderna es tan importante como el código de la aplicación que verifica. El esfuerzo invertido en refactorizar estas pruebas rinde dividendos en la confianza del desarrollador y la estabilidad del sistema a largo plazo.

### Expandiendo Estrategias de Sincronización de Documentación

El desafío de mantener la documentación sincronizada con el código es un problema bien conocido en la ingeniería de software. Si bien nuestra sincronización manual de la documentación de jerarquía visual y los comentarios CSS fue un primer paso necesario, es inherentemente frágil. El error humano es inevitable, y a medida que la base de código crece, recordar actualizar múltiples ubicaciones para un solo cambio conceptual se vuelve cada vez más difícil. Estamos explorando activamente soluciones arquitectónicas para este problema. Un enfoque es "Documentación como Código", donde la fuente de la verdad tanto para la implementación como para la explicación reside en una sola ubicación verificable. Para el estilo, esto podría significar el uso de tokens de diseño definidos en un archivo de configuración central, que luego son consumidos tanto por nuestro pipeline de compilación CSS como por un generador de documentación. Esto garantizaría que los valores discutidos en nuestros devlogs coincidan perfectamente con el CSS aplicado en producción. Otra vía es desarrollar linters personalizados o ganchos pre-commit que escaneen nuestros archivos CSS y adviertan a los desarrolladores si las entradas correspondientes del devlog no se actualizan. Estos tipos de salvaguardas automatizadas son esenciales para escalar un proyecto como el portfolio de ArceApps manteniendo altos estándares de calidad y consistencia.

### Implicaciones Arquitectónicas de la Gestión de Estado del Modal de Búsqueda

El modal de búsqueda en nuestro portfolio, aunque aparentemente simple, representa una micro-arquitectura de gestión de estado. La decisión de probar extensamente la función `closeModal` surge del reconocimiento de que los cuadros de diálogo modales son fuentes frecuentes de fugas de estado en aplicaciones de una sola página (SPAs) o sitios altamente interactivos como el nuestro. Cuando se abre un modal, típicamente altera el estado global—como modificar la propiedad overflow del body para prevenir el scroll del fondo. Si el modal se cierra inesperadamente (ej., debido a un error en otro componente, o una interacción de usuario no manejada), y la función de limpieza no es perfectamente robusta, la aplicación puede quedar en un estado inconsistente, como que el usuario no pueda hacer scroll en la página principal. Al escribir pruebas que verifican específicamente estos efectos secundarios de limpieza, estamos codificando el contrato de nuestro componente modal. Este contrato garantiza que, independientemente de cómo se descarte el modal, la aplicación regresa a una línea base limpia y utilizable. Este enfoque riguroso de la gestión de estado, incluso para componentes UI localizados, es lo que diferencia un portfolio meramente funcional de una exhibición de ingeniería verdaderamente profesional. Demuestra un profundo entendimiento de la mecánica del navegador y un compromiso para entregar una experiencia de usuario impecable bajo todas las condiciones. A medida que continuamos desarrollando el ecosistema ArceApps, estos patrones fundacionales de gestión de estado robusta y pruebas rigurosas servirán como un plano para características más complejas e interacciones de agentes. No solo estamos construyendo características; estamos construyendo una plataforma resiliente capaz de soportar nuestras ambiciones futuras.
