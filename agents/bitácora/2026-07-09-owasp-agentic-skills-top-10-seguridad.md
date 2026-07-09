# Bitácora — Scribe — 2026-07-09

## Tarea
Crear artículo bilingüe (ES + EN) sobre el OWASP Agentic Skills Top 10 (AST10), el nuevo marco de seguridad de la fundación OWASP dedicado a las skills de agentes IA. Foco 100% seguridad — sin comparativa de frameworks ni tutorial de creación.

## Entregables

| Archivo | Tamaño | Estado |
|---|---|---|
| `src/content/blog/es/owasp-agentic-skills-top-10-seguridad.md` | ~23.8 KB (~3700 palabras) | Listo |
| `src/content/blog/en/owasp-agentic-skills-top-10-seguridad.md` | ~22.8 KB (~3700 palabras) | Listo |
| `public/images/owasp-agentic-skills-top-10-seguridad.svg` | 4120 bytes (1200×630) | Listo, build lo copia a `dist/images/` |

## Slug y títulos (SEO)

- **Slug**: `owasp-agentic-skills-top-10-seguridad` (regex `^[a-z0-9]+(-[a-z0-9]+)*$` ✓, sin stopwords, sin `blog-` prefix, sin locale suffix).
- **Title ES** (59 chars): "OWASP Agentic Skills Top 10: skills, el nuevo eslabón débil"
- **Title EN** (53 chars): "OWASP Agentic Skills Top 10: Skills Are the Weak Link"
- **Description ES** (140 chars) y **EN** (155 chars) — ambos en rango 120–160.

## Auditoría SEO

Status: **PASS** (auditor `/tmp/audit_seo.py` basado en `write-blog-seo` skill). Cumple todos los constraints: tool name en primeras 5 palabras, title ≤60 chars, slug kebab-case, descriptions 120–160, keywords 7 (en 3–8), author presente, lastmod ≥ pubDate, heroImage set.

## Verificación de build

- `npx astro build` ejecutado en `/home/arceapps/arceapps.github.io/`.
- 968 páginas generadas en 10.81s.
- Salidas confirmadas: `dist/es/blog/owasp-agentic-skills-top-10-seguridad/index.html`, `dist/blog/owasp-agentic-skills-top-10-seguridad/index.html`, `dist/images/owasp-agentic-skills-top-10-seguridad.svg`.
- Sitemap lo incluye en `sitemap-en.xml` y `sitemap-es.xml`.
- Sin errores Zod.

## Proceso (resumen)

1. **Fase 1 — Investigación**: dos subagentes delegados (deleg_176fdbe7 y deleg_d5b09555, este último con scope recortado tras la confirmación del usuario). Adoptado el informe del segundo como definitivo.
2. **Fase 1.5 — Prior art**: leídos `agents-of-chaos-seguridad-agentica.md`, `caveman-skill-token-compression.md`, `ai-skills-desarrollo.md` para confirmar contenido y razón de enlace.
3. **Fase 2 ES** (~3700 palabras) — escrito con tono Scribe: gancho personal, paper USENIX Security 2026 (98.380/157/632), caso ClawHavoc, ejemplo SKILL.md malicioso, 10 AST con casos reales, sección de 7 pasos accionables, 16 referencias con URL.
4. **Fase 2 EN** — equivalente independiente, no traducción literal: evita modismos ES, mantiene el "Espíritu Indie", adapta formato de portada ("Skills Are the Weak Link" en lugar de "skills, el nuevo eslabón débil").
5. **SVG portada** — escudo geométrico teal con check mark orange, leyenda con cifras duras (98.380 / 157 / CVSS 9.9), pie con URL canónica arceapps.com.
6. **Auditoría SEO** — aplicada skill `write-blog-seo` y corregidos 3 issues (title EN +1 char, descriptions ES/EN por +9 y +14 chars sobre el límite). Tras iteración, ambos archivos pasan.
7. **Build + verificación final** — `npx astro build` sin errores.

## Datos cuantitativos verificables usados en el artículo

- Paper USENIX Security 2026 (arXiv:2602.06547): 98.380 skills analizadas, 157 maliciosas, 632 vulnerabilidades, 13 técnicas, 73,2% con shadow features, 54,1% de un único clúster.
- Snyk ToxicSkills (5 feb 2026): 3.984 skills, 1.467 con flaws (36,82%), 534 críticas (13,4%), 76 payloads maliciosos confirmados, 280+ leaky skills.
- ClawHavoc (Antiy CERT, feb 2026): 1.184 skills maliciosas en ClawHub / 12 cuentas, IP C2 `91.92.242[.]30`, AMOS payload.
- ClawJacked / OpenClaw CVE-2026-28363 (CVSS 9.9, Oasis Security, 26 feb 2026): 12.812 instancias explotables.
- Claude Code CVE-2025-59536 (CVSS 8.7) y CVE-2026-21852 (CVSS 5.3) (Check Point, 25 feb 2026).
- 135.000+ instancias OpenClaw expuestas (SecurityScorecard, feb 2026).
- BlueRock Security: 7.000+ MCP servers, 36,7% SSRF-vulnerable.
- Aikido (Charlie Eriksen, 21 ene 2026): npx alucinados en 47 skills.

## Riesgos a evitar honrados

- No atribuir Caveman / Superpowers / OpenSpec a compromiso (no hay evidencia pública).
- No decir que AST10 es "versión final estable" — está en Q3 review pública, Q4 release v1.0.
- Marcar fuente Aikido como accesible y verificable (la URL es 200, no bloqueada).
- No mezclar OWASP AST10 (skills) con OWASP Top 10 for Agentic Applications 2026 (apps).
- Mantener tono "Espíritu Indie" — sin checklists de CISO, sin jerga corporativa.

## Notas para futuros artículos sobre el mismo tema

- El slug incluye `-seguridad` para permitir futuros artículos derivados (compliance, governance, etc.) sin colisión.
- Si OWASP publica v1.0 final en Q4 2026, conviene re-auditar el artículo (¿cambia algún AST?).
- El ejemplo del SKILL.md malicioso (3 líneas) está parafraseado, no transcrito — etiqueta "ilustración" en cualquier reuso.
