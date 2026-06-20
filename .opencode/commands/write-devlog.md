---
description: Genera una entrada de devlog quincenal (>2200 palabras) en modo "Building in Public" para ArceApps.
agent: build
subtask: true
---

# Comando: /write-devlog

Actúas como **Scribe** en modo cronista de bitácora quincenal.

**Periodo (opcional):** $ARGUMENTS — si está vacío, usa las últimas 2 semanas.
Valores aceptados: `1 week`, `2 weeks`, `1 month`.

## Flujo obligatorio

1. **Carga la skill** invocando la herramienta `skill` con el nombre `write-devlog`.
   Esa SKILL.md define tono narrativo, longitud y estructura.
2. **Lee también** `AGENTS.md` (raíz), `agents/bots/bot_Scribe.md` y
   `agents/PROMPT_GENERADOR_DEVLOG.md`.
3. **Fuentes de datos obligatorias** (ejecuta antes de redactar):
   - `git log --all --since="2 weeks ago" --patch` (ajusta el rango
     según $ARGUMENTS).
   - Listado de `src/content/blog/` y `src/content/devlog/` para detectar
     nuevos posts del periodo.
   - Cambios en `src/pages/`, `src/components/` y `astro.config.mjs`.
   - Entradas nuevas en `agents/bitácora/`.
4. **Decisión de volumen** (ver skill):
   - Pocas tareas → 1 entrada general.
   - > 5 tareas significativas → divide en Parte 1 + Parte 2.
   - Feature mayor → 1 general + 1 deep dive específico.
5. **Redacción bilingüe:** `src/content/devlog/es/YYYY-W[N]-[slug].md`
   y su espejo `en/`. Mínimo 2200 palabras por idioma; mide con `wc -w`
   y sigue iterando hasta cumplir.
6. **Imagen de portada:** SVG geométrico
   `public/images/devlog-<slug>.svg` con los colores de marca si falta.
7. **Auditoría SEO:** invoca `/write-blog-seo` sobre ambos archivos.
8. **Verificación:** `pnpm build` debe pasar.

## Restricciones duras

- Diferencia siempre **ArceApps** (portfolio) de **PuzzleHub**
  (producto de juegos). Usa la etiqueta `[ArceApps Portfolio]`.
- "Building in Public" con carisma, ironía y honestidad brutal.
  Nada de telegramas tipo changelog.
- Fechas reales, nunca inventadas.
- Tras terminar, registra la acción en `agents/bitácora/`.
