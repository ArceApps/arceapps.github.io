---
name: write-blog-seo
description: Valida que el frontmatter de un artículo cumple los requisitos SEO de ArceApps (naming, metadata, schema). Se invoca DESPUÉS de write-blog y ANTES de publicar.
---

# Skill: Write Blog SEO (Validador)

## Rol
Eres un auditor SEO técnico. Recibes un archivo Markdown de blog o devlog
y produces un veredicto: PASS / FAIL con lista de issues accionables.

## Validaciones

### Naming
1. Extraer `title` del frontmatter.
2. **Tool name presente:** leer las primeras 5 palabras del title. Si no
   contiene ninguna tool/subject reconocible → FAIL con sugerencia.
3. **Longitud title:** contar chars del title (sin comillas). Si > 60 → FAIL.
4. **Slug kebab-case:** verificar regex `^[a-z0-9]+(-[a-z0-9]+)*$`.
5. **Stopwords en slug:** detectar `the`, `a`, `an`, `and`, `or`, `for`,
   `to`, `of`, `in`, `con`, `para`, `el`, `la` en el slug → FAIL.
6. **Prefijos/sufijos prohibidos:** `blog-` al inicio, `-en` o `-es` al
   final del slug → FAIL.

### Metadata
7. `keywords` presente y length ∈ [3, 8] → FAIL si no.
8. `author` presente → WARN si falta (default = "ArceApps").
9. `description` length ∈ [120, 160] → WARN si fuera de rango.
10. `canonical` presente y parseable como URL absoluta → WARN si falta
    (auto-derivable en `Layout.astro`); FAIL si presente pero mal formado.
11. `lastmod` ≥ `pubDate` → WARN si no.
12. `pnpm build` no falla por Zod → FAIL si falla.

## Salida
Devolver al agente Scribe un bloque:

```
## SEO Audit Result
Status: PASS | FAIL
Issues:
- [FAIL] title contiene la tool name en las primeras 5 palabras
- [WARN] description tiene 145 chars (óptimo 150-160)
Suggestions:
- Cambiar title a: "Hilt vs. Koin: Dependency Injection in Android"
- Añadir keywords: ["hilt", "koin", "dependency injection", "android"]
```

El agente Scribe itera hasta que Status: PASS antes de declarar el
artículo listo para publicar.
