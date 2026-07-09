# Plan: Torneo GUI IA 2026 (3 artículos)

> Fecha del plan: 2026-07-08
> Estado: en curso
> Rama: `feat/gui-ai-tournament-2026`
> Skill principal: `agents/skills/write-blog/SKILL.md`
> Skill secundaria: `agents/skills/write-blog-seo/SKILL.md`

## Resumen ejecutivo

Reescribir desde cero el torneo de IA con interfaz gráfica. Tres artículos, dos idiomas (ES + EN), mínimo 5 000 palabras por idioma y por artículo.

- SF1 Occidental (round-robin entre 8 apps occidentales)
- SF2 Chino (round-robin entre 8 apps chinas)
- Gran Final (4 finalistas: 2 occidente + 2 china)

Los artículos CLI previos (`cli-ai-*`) **se conservan** como histórico. Los nuevos viven en `gui-ai-*`.

## Roster definitivo

### SF1 Occidental
1. W1 Cursor
2. W2 Windsurf
3. W3 Zed
4. W4 GitHub Copilot
5. W5 Claude Desktop
6. W6 ChatGPT Desktop
7. W7 JetBrains AI Assistant
8. W8 Cline

### SF2 Chino
1. C1 DeepSeek Desktop
2. C2 Kimi
3. C3 Qwen / Tongyi Yuanbao
4. C4 MiniMax
5. C5 Mimo
6. C6 Doubao
7. C7 Lingma
8. C8 iFlyCode

### Bloques narrativos (Fisher-Yates sembrado)
- SF1 B1: Windsurf vs Claude Desktop · B2: Zed vs JetBrains AI · B3: Cursor vs ChatGPT Desktop · B4: Cline vs Copilot
- SF2 B1: iFlyCode vs MiniMax · B2: DeepSeek vs Qwen · B3: Kimi vs Doubao · B4: Mimo vs Lingma

Reproducibilidad: `node agents/bitacora/sorteo-gui-ai-2026.cjs`.

## Tareas atómicas

### T1. Investigación paralela SF1 + SF2
- Subagente A: investiga 8 apps occidentales con WebFetch (Cursor, Windsurf, Zed, Copilot, Claude Desktop, ChatGPT Desktop, JetBrains AI, Cline).
- Subagente B: investiga 8 apps chinas (DeepSeek, Kimi, Qwen, MiniMax, Mimo, Doubao, Lingma, iFlyCode).
- Entrega: `informe-sf1-oeste.md` e `informe-sf2-este.md` con scoring 0-10 por categoría y citas verbatim.

### T2. HeroImages SVG (3 archivos)
- `public/images/gui-ai-semifinal-1.svg`
- `public/images/gui-ai-semifinal-2.svg`
- `public/images/gui-ai-grand-final.svg`
- Estilo: geométrico, teal `#018786` + naranja `#FF9800`, fondo `#0F172A`, 1200x630.

### T3. Artículo SF1 (ES + EN)
- Slug: `gui-ai-semifinal-1`
- Rutas: `src/content/blog/es/gui-ai-semifinal-1.md` + `src/content/blog/en/gui-ai-semifinal-1.md`
- Longitud: >= 5 500 palabras / idioma
- Estructura: gancho · contexto · reglas · candidatos · bloques (4) · matriz final · 2 ganadores · reflexiones · bibliografía · cierre
- Decisión de los 2 ganadores basada en la rúbrica.

### T4. Artículo SF2 (ES + EN)
- Slug: `gui-ai-semifinal-2`
- Misma estructura,apps chinas, tono "el mundo mira a China con condescendencia, error".

### T5. Artículo Gran Final (ES + EN)
- Slug: `gui-ai-grand-final`
- 4 finalistas: 2 occidente + 2 china
- Comparativa real sin bracket, ranking 1-4 justificado, ganador único.

### T6. Auditoría SEO + build
- Auditoría `write-blog-seo` sobre los 6 archivos (title <= 60 chars, description 120-160, keywords 3-8, slug kebab-case, canonical, etc.).
- `pnpm build` exit 0.
- Iterar hasta PASS.

### T7. Commits (3, uno por artículo)
- `feat(blog): SF1 GUI IA 2026 (es + en)`
- `feat(blog): SF2 GUI IA 2026 (es + en)`
- `feat(blog): Gran Final GUI IA 2026 (es + en)`

### T8. Bitácora Scribe
- Anexar entrada del 2026-07-08 en `agents/bitacora/bitacora_scribe.md`.

## Dependencias

```
T1 ──┬──> T3 ──┐
     └──> T4 ──┼──> T6 ──> T7 ──> T8
T2 ───────────> T5 ──┘
```

- T1 y T2 se hacen en paralelo.
- T3, T4 y T5 pueden secuenciarse (T5 depende de los ganadores de T3 y T4).
- T6 valida los 6 archivos tras T5.

## Criterios de aceptación

- [ ] `pnpm build` exit 0.
- [ ] Cada archivo >= 5 000 palabras por idioma (objetivo 5 500).
- [ ] 8 apps evaluadas por semifinal, 4 finalistas en la final.
- [ ] 4 categorías con puntuación 0-10 y peso 25 % c/u, justificadas.
- [ ] Tabla matriz por semifinal + final.
- [ ] Radar SVG inline por app (8 + 8 + 4 = 20).
- [ ] Bracket SVG + ASCII por semifinal.
- [ ] Screenshots: 1 link oficial por app.
- [ ] HeroImage SVG en `/images/` para los 3 slugs.
- [ ] Bibliografía 10-15 referencias verificadas por artículo.
- [ ] SEO: write-blog-seo PASS en los 6 archivos.
- [ ] Tono indie (sin jerga corporativa).
- [ ] ES + EN simétricos en calidad.
- [ ] Commit por artículo + bitácora actualizada.

## Riesgos

- Trae eliminado del roster chino por petición del usuario (solo marcas conocidas).
- Algunas apps chinas pueden tener web-first: vale GUI web oficial.
- Documentación china sin inglés: traducir y declarar.
- Benchmarks cambian rápido: fechar mediciones.

## Bitácora de ejecución

- 2026-07-08 — Sorteo ejecutado, semilla `cee462d6`.
- 2026-07-08 — Plan creado.