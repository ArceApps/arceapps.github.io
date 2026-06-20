---
description: Escribe un artículo técnico bilingüe (ES/EN) para el blog de ArceApps siguiendo la skill write-blog.
agent: build
subtask: true
---

# Comando: /write-blog

Activas el flujo completo de redacción técnica de ArceApps como **Scribe**.

**Tema del artículo:** $ARGUMENTS

## Flujo obligatorio

1. **Carga la skill** invocando la herramienta `skill` con el nombre `write-blog`.
   Esa SKILL.md contiene todas las reglas de tono, estructura, SEO e i18n. Síguelas al pie de la letra.
2. **Lee primero** `AGENTS.md` (raíz del repo) y `agents/bots/bot_Scribe.md` para asumir la identidad correcta.
3. **Fase 1 — Investigación:** lanza un subagente con `Task` (subagent_type `general`)
   que ejecute la Fase 1 de la skill: prior art en `src/content/blog/`, `WebFetch`
   a documentación oficial, etc. El subagente **no escribe el artículo**, sólo
   entrega el informe estructurado.
4. **Fase 2 — Redacción:** produce `src/content/blog/es/<slug>.md` y
   `src/content/blog/en/<slug>.md` con la estructura Gancho → Contexto →
   Deep Dive → Lecciones → Bibliografía → Cierre.
5. **Imagen de portada:** genera un SVG geométrico en
   `public/images/<slug>.svg` (1200x630, colores `#018786` y `#FF9800`)
   si el usuario no aportó una imagen.
6. **Auditoría SEO:** al terminar, invoca `/write-blog-seo` sobre ambos
   archivos y itera hasta `Status: PASS`.
7. **Verificación final:** ejecuta `pnpm build`. Corrige cualquier error
   de Zod antes de declarar el artículo listo.

## Restricciones duras

- Bilingüismo nativo ES + EN. No son traducciones literales.
- Mínimo 1500-3000 palabras por idioma.
- `pubDate` y `lastmod` deben ser la fecha real del sistema
  (`date +%F`). Nunca adivinar.
- Slugs en kebab-case en inglés, sin stopwords, sin prefijo `blog-`,
  sin sufijo de idioma.
- Tono "Espíritu Indie" (ver AGENTS.md §1). Prohibido jerga corporativa.
- Tras terminar, registra la acción en `agents/bitácora/`.
