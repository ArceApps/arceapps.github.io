---
title: "Astro, vitest y el guard contra secretos en el devlog"
description: "Cómo el devlog publicó el ID real de Google Analytics y por qué el arreglo no fue un escáner externo, sino un test de vitest en src/content."
pubDate: 2026-10-12
lastmod: 2026-10-19
author: "ArceApps"
keywords:
  - "Astro"
  - "vitest"
  - "secretos en contenido"
  - "Google Analytics"
  - "ArceApps Portfolio"
canonical: "https://arceapps.com/es/devlog/2026-10-12-portfolio-secretos-contenido/"
heroImage: "/images/devlog/portfolio-content-secrets.svg"
tags: ["Astro", "vitest", "Privacidad", "DevOps", "Building in Public"]
---

Hay artículos que se autodemuelen. El 12 de octubre de 2026, al fusionar el PR #71 sobre el devlog de Consent Mode v2 publicado el 11 de octubre, una revisión editorial detectó que el artículo llevaba más de dos semanas reproduciendo en dos idiomas el identificador real de medición de Google Analytics del sitio. La ID vivía en `src/layouts/Layout.astro` por una razón funcional legítima: ese archivo la usa para cargar `gtag.js` en cada página y mantener la analítica. Lo que no podía vivir era copiada en un artículo técnico sobre consentimiento de cookies, porque ese artículo estaba contando exactamente por qué esas IDs nunca deben quedar expuestas sin ton ni son. La corrección fue casi trivial —cuatro ediciones, dos `additions`, dos `deletions` por idioma— pero la lección no fue la corrección. La lección fue que el contenido editorial de un portfolio no puede confiar en no filtrar secretos solo porque no hay secretos. Necesita una verificación ejecutable que diga *no* cuando alguien los publique.

Esta entrada explica la mecánica completa de aquel PR y, sobre todo, el guard que lo acompaña: un test de vitest, `src/utils/sensitive-content.test.ts`, que recorre recursivamente `src/content`, busca identificadores de medición, claves de API y credenciales conocidas, y falla la pipeline de Content CI si los encuentra. Es un test muy pequeño —58 líneas, contando un `walk` recursivo y nueve patrones de expresión regular— pero su efecto es desproporcionado para lo que cuesta.

## Un devlog es una superficie editorial, no una superficie de código

Para entender por qué la respuesta no fue un escáner externo como trufflehog o gitleaks conviene empezar por algo que distingue este repositorio de casi cualquier otro: `src/content` no compila, no se minifica, no se prueba con tests unitarios. Su contrato es editorial. Un artículo mal escrito sigue siendo un artículo válido para Astro, mientras cumpla el esquema Zod de `src/content/config.ts`. Y, sin embargo, `src/content` se publica al espejo público `arceapps.github.io` casi sin filtrar nada. `astro.config.mjs` ya marca el directorio `src/content` para que termine en el build estático.

Esa asimetría —validación ligera en el extremo, publicación efectiva en el otro— es la que permitió que la ID de medición se filtrara sin disparar ningún gate de CI clásico. La pipeline ya probaba el contenido contra el esquema y contra un build de Astro. Ninguno de los dos mira la *sustancia* del Markdown. El esquema valida que `title` no supere los 100 caracteres, que `keywords` tenga entre 3 y 5 entradas, que las URLs de `canonical`parseen. El build de Astro compone HTML y lo deja listo. No hay, en ninguno de los dos pasos, una comprobación de que el texto no contenga secretos. Y sin embargo, el texto se publica.

Esa es la grieta.

`src/content`también es un lugar donde el copy tiende a parecerse al código fuente. El devlog de Consent Mode v2 hablaba de cómo `gtag.js` se carga en el sitio, y para explicarlo citaba la línea exacta de `Layout.astro` donde aparece la ID. Era un ejemplo natural: cuando estás escribiendo sobre cómo se carga Google Analytics, tiendes a copiar la URL de carga, que es exactamente donde la ID es visible. Si además la ID está en la cabecera de tu propio `Layout.astro` y en tu propia política de privacidad, el riesgo existe para cualquiera que quiera documentar el tema. El problema no fue falta de cuidado. Fue falta de *barrera*.

## Por qué la solución no fue añadir más cuidado

Hay tres reacciones naturales ante un secreto en un devlog publicado:

1. **Editarlo a mano y aprender la lección.** Funciona una vez. La siguiente vez alguien redacte ejemplos sobre cualquier servicio externo con clave, vuelve a aparecer.
2. **Añadir un recordatorio en CONTRIBUTING.md** para que cada persona que abra un PR recuerde revisar el texto. Es documentación; por definición, no se ejecuta.
3. **Confiar en GitHub secret scanning** o en escáneres como gitleaks y trufflehog. Tienen su sitio, pero sus patrones por defecto están calibrados para código fuente, no para prosa. Y el contenido editorial genera ruido por naturaleza —palabras como *token*, *secret*, *AWS*— que dispara falsos positivos que se acaban ignorando.

Ninguna de las tres es satisfactoria sola, y juntas tampoco. La primera y la segunda dependen de disciplina individual en una automatización editorial que funciona en piloto automático. La tercera introduce una herramienta externa que añade coste y un dialecto de configuración propio sin tocar el problema de raíz: la asimetría entre lo que Astro valida y lo que Astro publica.

La opción que preferí, después de pensarlo dos veces, fue la que más se parecía a lo que el repositorio ya hacía: un **test**.

## Por qué el test vive dentro del repositorio, no en una pipeline externa

Hay tres razones, en este orden, por las que la solución es un test de vitest dentro del propio proyecto.

La primera es que el repositorio ya ejecuta `pnpm test` en Content CI. La pipeline no se amplía con un paso nuevo; extiende un paso existente. Content CI ya hace checkout, instala dependencias, ejecuta `pnpm test` y, después, `pnpm build`. Si ese primer paso encuentra un secreto en `src/content`, falla antes de que se llegue al build. La naturaleza de Content CI es correr en *cada PR a `main`*, así que el bloqueo sucede donde tiene que suceder: en el momento en que alguien fusiona.

La segunda es la cobertura. Vitest descubre archivos bajo el patrón `src/**/*.{test,spec}.{js,ts}` por defecto. Cualquier fichero nuevo en `src/utils/` cuyo nombre termine en `.test.ts` entra automáticamente en la próxima ejecución. No hay un `index.ts` que mantener, ni un `import` global que añadir, ni una configuración que sincronizar.

La tercera es que el test es **legible**. Cuarenta líneas de regex, en orden, con un nombre para cada patrón. Un futuro mantenedor —o una futura versión de mí mismo a las tres de la mañana— puede añadir un patrón nuevo en treinta segundos, porque el código es legible sin contexto.

Podría haber adoptado trufflehog o gitleaks como dependencias. Funcionalmente sirven, pero en este proyecto añadirían una capa que solo entiende secretos. Prefiero un test que se lea como un test, no como una herramienta.

## El guard: cincuenta y ocho líneas de paranoia editorial

El archivo entero es este. Lo reproduzco aquí, con anotaciones mínimas, para que la siguiente persona que lo lea en frío no tenga que invertir en contexto.

```ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

// Guard for published editorial content: articles must never reproduce
// real tracking identifiers, API keys, or credentials. Refer to them
// generically instead (e.g. "the Google Analytics measurement ID").
const CONTENT_DIR = join(process.cwd(), "src", "content");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const SENSITIVE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "Google Analytics 4 measurement ID", re: /\bG-[A-Z0-9]{6,}\b/ },
  { name: "Universal Analytics ID", re: /\bUA-\d{4,}-\d+\b/ },
  { name: "Google Ads / conversion ID", re: /\b(?:AW|DC|GT)-[A-Z0-9]{6,}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "secret API key", re: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  {
    name: "GitHub token",
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "AWS access key ID", re: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "private key block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  },
];

const contentFiles = walk(CONTENT_DIR).filter((f) =>
  [".md", ".mdx"].includes(extname(f)),
);

describe("published content does not leak secrets or tracking identifiers", () => {
  it("has content files to scan", () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  for (const { name, re } of SENSITIVE_PATTERNS) {
    it(`does not contain a ${name}`, () => {
      const hits: string[] = [];
      for (const file of contentFiles) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, index) => {
          if (re.test(line)) {
            hits.push(`${file}:${index + 1}`);
          }
        });
      }
      expect(hits).toEqual([]);
    });
  }
});
```

Cinco ideas estructurales merece la pena explicar.

`walk` recorre `src/content` recursivamente, sin seguir enlaces simbólicos y sin cruzar la raíz —es un escaneo en anchura a la vieja usanza, donde cada entrada del directorio se inspecciona con `statSync`, y si es un directorio se vuelve a llamar recursivamente. Si es un archivo, se devuelve como una ruta. Es deliberadamente no asíncrono: la escala del repositorio es de decenas de archivos Markdown, no de millones, así que la simplicidad síncrona compensa.

`SENSITIVE_PATTERNS` es la lista de cosas que el guard sabe detectar. Cada entrada lleva un nombre legible y una expresión regular. La idea es que añadir un nuevo tipo de secreto sea una línea y un comentario, no un sistema.

El `describe` exterior nombra al guard. Cada `it(...)` interior verifica un único patrón. Si la pipeline falla con un mensaje largo, será trivial saber qué familia de secretos se ha filtrado —lo dice el nombre del test— y en qué archivo y línea, porque cada coincidencia se registra como `path:línea`.

La lista de archivos se filtra por extensión `.md` y `.mdx`. Astro solo publica Markdown y MDX bajo `src/content`, así que el resto no importa. Que el filtro sea por extensión y no por convención de carpeta se debe a que algunos artículos viven directamente en `devlog/es/...` y otros en `blog/es/...`. El guard no necesita saber dónde; necesita saber qué se publica.

Las regex usan `\b` (límite de palabra) para evitar falsos positivos del tipo `G-12345` (cinco caracteres tras `G-`, por debajo del mínimo) o para que `G-1234abc` no se confunda con la ID real porque contiene minúsculas. La longitud mínima de cada patrón está calibrada para no confundir prefijos cortos con un identificador real —Google Analytics 4 exige al menos seis caracteres alfanuméricos tras `G-`, Universal Analytics exige al menos cuatro dígitos antes del guion, y `AIza` exige exactamente 35 caracteres tras la firma porque las claves de API de Google tienen una longitud fija.

## Los nueve patrones, uno por uno

Cada patrón merece un párrafo, porque las decisiones tomadas en cada regex reflejan la forma concreta en que el secreto se filtra.

**GA4 `\bG-[A-Z0-9]{6,}\b`.** Es el patrón más común ahora mismo. Detecta cualquier identificador de medición de Google Analytics 4. La longitud mínima de seis caracteres descarta coincidencias accidentales con referencias genéricas del estilo "G-123" que un redactor pueda usar para hablar del formato sin usar un ID real. La regla `[A-Z0-9]` cubre el alfabeto real usado por Google —mayúsculas y dígitos—, sin minúsculas, porque Google no las emite.

**Universal Analytics `\bUA-\d{4,}-\d+\b`.** Cubre la versión antigua de Analytics, todavía en uso en algunos sitios. Aunque UA dejó de procesar datos en julio de 2023, sigue siendo un patrón relevante porque muchos artículos antiguos lo citan.

**Google Ads / conversión `\b(?:AW|DC|GT)-[A-Z0-9]{6,}\b`.** Una sola regex con tres prefijos porque Ads (`AW-`), la API de conversiones (`DC-`) y el conversor de etiquetas (`GT-`) comparten la misma forma. Misma longitud mínima que GA4, porque la convención es la misma.

**Google API key `\bAIza[0-9A-Za-z_-]{35}\b`.** La clave de API de servicios de Google —Maps, YouTube Data, Translate— empieza por `AIza` y tiene exactamente 39 caracteres. La regex exige los 35 posteriores a `AIza`; menos de eso probablemente no es una clave real.

**Generic secret `\bsk-[A-Za-z0-9_-]{16,}\b`.** Patrón usado por OpenAI, Stripe y muchos servicios que emiten claves con prefijo `sk-`. La longitud mínima de 16 caracteres evita falsos positivos del tipo "sk-123" que aparece en prosa sobre el formato.

**GitHub tokens `\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b`.** Dos formas porque GitHub emite tokens personales finos (`ghp_...`), tokens OAuth (`gho_...`), tokens de usuario a servidor (`ghu_...`), tokens de servidor a servidor (`ghs_...`) y refresh tokens (`ghr_...`), más los nuevos *fine-grained personal access tokens* que llevan el prefijo `github_pat_`. Cada uno termina en al menos 20 caracteres alfanuméricos.

**Slack tokens `\bxox[baprs]-[A-Za-z0-9-]{10,}\b`.** Cubre los tokens bot, app, usuario, refresh e instalación que Slack emite.

**AWS access key ID `\bAKIA[0-9A-Z]{16}\b`.** AKIA es el prefijo clásico de claves AWS de larga duración; las claves STS, temporales, empiezan con ASIA y tienen un patrón distinto que no incluí todavía. Es un hueco del guard, deliberado: las claves STS no se filtran en prosa porque no son imprimibles en documentación, y añadir su regex añadiría ruido. El plan es cerrar el hueco la próxima vez que aparezca una necesidad concreta.

**Private key block `-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----`.** Detecta bloques PEM completos de claves privadas —RSA, ECDSA, OpenSSH, DSA, PGP—. Es un ancla inequívoca: nadie escribe esa cadena en prosa por accidente.

## Por qué estos nueve y no más

La tentación, al construir este tipo de guard, es enumerar todos los servicios externos imaginables. Es una mala idea por dos razones.

La primera es que cada patrón adicional añade superficie de mantenimiento. AWS tiene claves de acceso de larga duración y temporales, varios tipos de tokens de sesión y una taxonomía en evolución. Google emite claves para una docena larga de servicios, cada uno con su prefijo y longitud. GitHub ha cambiado la forma de sus tokens tres veces en cinco años. Listar todo convierte el guard en un catálogo de servicios externos, y un catálogo así se desactualiza más rápido de lo que se audita.

La segunda es que cubrimos lo que importa para un portfolio: identificadores de medición, claves de API comunes y credenciales canónicas —las cosas que, si se imprimen por accidente en un artículo, harían el artículo mismo *peligroso de leer*—. El resto se cubre con secret scanning nativo de GitHub cuando el repositorio es privado, que es exactamente nuestro caso.

Esa jerarquía —guard editorial para lo editorial, secret scanning nativo para el código— evita duplicar trabajo y mantiene el guard enfocado en lo que puede fallar en `src/content`.

## Lo que el PR corrigió y lo que el PR no tocó

El PR #71 fusionó cinco cambios.

El primero, segundo, tercero y cuarto son las ediciones a los dos artículos —cookie-consent en español e inglés, jerarquía visual responsiva en español e inglés—. Cada edición reemplaza la ID real por una referencia genérica del estilo "el identificador de medición de Google Analytics" en castellano, "the Google Analytics measurement ID" en inglés. En el caso del artículo de jerarquía visual responsiva, donde la ID vivía en un fragmento de código que reproducía el `Layout.astro` antiguo, la sustitución fue por una *constante simbólica*: `GA_MEASUREMENT_ID`. Eso permite a quien lee entender el formato sin ver un identificador real. El patrón `\bG-[A-Z0-9]{6,}\b` no se dispara con `GA_MEASUREMENT_ID`, porque la segunda palabra `_MEASUREMENT_ID` no encaja con `[A-Z0-9]{6,}`: contiene un guion bajo, que no está en el alfabeto permitido por la regex. Es una decisión coherente: si en algún momento se quiere cambiar la palabra *measurement* por otra, la sustitución seguirá siendo válida.

El quinto cambio es el guard. Los otros cuatro son su motivo de existir.

El PR no tocó el comportamiento de Google Analytics en producción. La ID real sigue donde debe estar —en `src/layouts/Layout.astro`—, porque ese archivo es la fuente funcional del comportamiento. La asimetría es deliberada y útil: la ID es pública para el navegador que la ejecuta, pero no para el repositorio editorial que la menciona.

## Verificación, números y comportamiento esperado

Localmente el test pasa con 10/10 tests verdes: el de "hay contenido que escanear", más los nueve patrones. Content CI lo ejecuta automáticamente en cada PR a `main` antes de `pnpm build`, así que cualquier futura filtración se interceptará en la revisión de código.

El coste de ejecución es despreciable. `src/content` contiene menos de cien archivos Markdown, y cada archivo se lee una vez por patrón. El test completo termina en milisegundos —no hay red, no hay parsing complejo, no hay dependencias pesadas—.

El coste de mantenimiento existe: cuando aparezca un nuevo tipo de secreto que merezca estar en la lista, hay que añadir el patrón. Lo trato como un bug normal: abrir un PR, añadir la línea, actualizar la lista. Cada patrón es legible; añadir uno no requiere entender los demás.

## Lo que aprendí — y lo que cambia a partir de ahora

Hay tres lecciones que sobreviven al bug.

La primera es que **un repositorio que publica no puede confiar en la disciplina de quien escribe**. El PR de cookie-consent fue escrito con cuidado: se documentaron las cuatro alternativas evaluadas, se justificó Consent Mode v2 frente a las opciones A, C y D, se explicó por qué Partytown no garantizaba el orden de default denied. Y, sin embargo, copió una ID. La disciplina editorial no es una barrera; es una buena predisposición que necesita una barrera que la respalde cuando falla.

La segunda es que **la superficie editorial necesita un guard proporcional a su superficie de publicación**. Un test que falla en CI es más fuerte que una nota en CONTRIBUTING.md, porque se ejecuta por construcción. El guard no evita que alguien escriba una ID en un Markdown. Evita que esa ID termine en producción después del merge.

La tercera es que **los secretos editoriales son un problema de test, no de configuración**. Listar servicios externos en una tabla YAML es tentador; un test que recorre el contenido en busca de patrones es ejecutable, depurable, y deja un rastro en el log de CI si falla. La diferencia entre las dos aproximaciones es la diferencia entre un acuerdo y un muro.

A partir de ahora, cada vez que un devlog reproduzca una URL de carga, una clave de ejemplo o un fragmento de configuración con valores reales, el guard comprobará que esos valores no son reales. Si lo son, el PR no llegará a `main`.

Y cuando el guard se quede corto —porque aparecerá un nuevo servicio, un nuevo formato de token, una nueva forma de identificador—, el patrón se añadirá al archivo existente. El test es lo bastante pequeño para eso.

## Pasos siguientes

Tres líneas de mejora, por orden de prioridad.

La primera, ya en marcha: añadir al guard el reconocimiento de claves STS de AWS (`\bASIA[0-9A-Z]{16}\b`) y claves de secreto de cliente OAuth (`\b(?:client_secret|clientSecret)_?[a-zA-Z0-9_-]{20,}\b`) — los huecos visibles hoy son manejables.

La segunda, pendiente: extender el guard a `agents/`, donde el prompt operativo del agente Scribe y los workflows de bots también pueden contener claves de ejemplo. La cobertura actual es solo `src/content`; ampliar a `agents/` cubre un radio más grande.

La tercera, a medio plazo: considerar mover el walk a un script de CI independiente para que pueda correr también en `sync-to-public.yml` antes de sincronizar al mirror público, no solo en PR. La cobertura actual protege contra filtrar en el origen; la cobertura ampliada protegería también contra republicar accidentalmente lo ya filtrado.

## Referencias

- PR #71: [`fix(content): redact real analytics ID and add secret-leak guard`](https://github.com/ArceApps/web-portfolio/pull/71) — la corrección puntual y el guard.
- [Vitest — Getting Started](https://vitest.dev/guide/) — el framework en el que se ejecuta el guard; sin `setup` adicional, descubre `*.test.ts` por convención.
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — el esquema Zod sobre el que se compila `src/content`, y que delimita qué se publica.
- [GitHub — Secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) — la capa nativa para código fuente; no es sustituta del guard editorial.
- Devlog de Cookie Consent: [Consentimiento de cookies: cuando Partytown dejó de ser la respuesta](https://arceapps.com/es/devlog/2026-08-12-portfolio-cookie-consent/) — el artículo cuya propia corrección motivó este guard, y al que enlazamos desde el PR de la corrección.
- Devlog del pipeline mirror: [GitHub Actions: del runner privado al mirror](https://arceapps.com/es/devlog/2026-W39-portfolio-mirror-pipeline/) — donde se describe el pipeline que sincroniza el contenido corregido al mirror público limpio.
