# Lenguaje visual del portfolio ArceApps — spec de sistema

**Feature ID:** 20261029-rediseno-web-visual-1-1
**Delta status:** applied
**Status:** APPROVED

## Requisitos del sistema visual
- **SV1 — Paleta:** acento claro #038D90 y acento dark #00ACB0 (overrides :root.dark de bg-primary/text-primary/border-primary); fondo claro #FCFCFC; contenido claro #0B1014; fondo dark #091117; tarjeta dark #0E171D; texto muted dark #BDC0C2. Los literales de la paleta anterior (#007F7D, #F8F9FA, #111E26, #111827, #9CA3AF, #2DD4BF, #00bfa5) están prohibidos en código de producto.
- **SV2 — Movimiento:** prohibidos hover:scale, group-hover:scale y hover:-translate en componentes (contrato cross-cutting del repo).
- **SV3 — Paridad i18n:** toda superficie existe en ES y EN con claves paralelas; sin copy hardcodeada por idioma ni claves muertas.
- **SV4 — Superficies derivadas:** páginas no maquetadas (Proyectos, Contacto, detalles, legales, 404, series) usan los mismos tokens y patrones (material-card, tipografía, botones bg-primary).

## Evidencia
Contratos: src/styles/design-contract.test.ts, src/components/cross-cutting-contract.test.ts, src/components/pages/derived-surfaces-contract.test.ts (sweeps autoextensibles). Verifier PASS en C1–C10 (docs/specai/feature/20261029-rediseno-web-visual-1-1/).
