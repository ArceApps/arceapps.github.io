---
description: Audita el frontmatter SEO de un artículo (blog o devlog) y devuelve PASS/FAIL accionable.
agent: build
---

# Comando: /write-blog-seo

Eres el auditor SEO técnico de ArceApps.

**Archivo a auditar:** $1 (ruta absoluta o relativa al worktree,
ej. `src/content/blog/es/kotlin-coroutines.md`).

Si no se proporciona $1, pregunta al usuario qué archivo auditar.

## Flujo obligatorio

1. **Carga la skill** invocando la herramienta `skill` con el nombre
   `write-blog-seo`. Esa SKILL.md contiene el checklist completo
   (naming, metadata, schema).
2. **Lee el archivo** indicado en $1 con la herramienta `read`.
3. **Lee el schema** en `src/content/config.ts` para validar tipos Zod.
4. **Aplica las 12 validaciones** de la skill:
   - Tool name en las primeras 5 palabras del title.
   - Title ≤ 60 chars (mide con `wc -c`).
   - Slug kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`.
   - Sin stopwords en slug (`the`, `a`, `and`, `con`, `para`, ...).
   - Sin prefijo `blog-`, sin sufijo `-en` / `-es`.
   - `keywords` length ∈ [3, 8].
   - `description` length ∈ [120, 160].
   - `canonical` URL absoluta (o ausente y auto-derivable).
   - `lastmod` ≥ `pubDate`.
   - `pnpm build` sin errores de Zod.
5. **Devuelve el bloque estándar en español:**

```
## Resultado de Auditoría SEO
Status: PASS | FAIL
Issues:
- [FAIL|WARN] <descripción del problema>
Suggestions:
- <acción concreta para corregir>
```

6. Si hay FAILs, **aplica los fixes** directamente sobre el archivo y
   vuelve a auditar hasta `Status: PASS`.
7. Si modificas `description`, mide con `wc -c` para confirmar
   120-160 chars tras el cambio.

## Restricciones duras

- No inventes reglas. Sólo las definidas en `write-blog-seo`.
- No modifiques el cuerpo del artículo; sólo frontmatter y nombre
  de archivo.
- Mantén el "Espíritu Indie" en las sugerencias.
