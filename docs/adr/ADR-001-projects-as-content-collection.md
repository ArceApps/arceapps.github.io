# ADR-001: Projects como colección de contenido

**Date:** 2026-07-29
**Status:** proposed

## Context
Projects procede de un JSON sin i18n ni rutas internas, y duplica Apps.

## Decision
Usar una colección Astro bilingüe `projects`, con una ficha interna por idioma y exclusión editorial de Apps.

## Alternatives Considered
- Mantener `projects.json`: rechazado por no validar esquema ni soportar detalles localizados.
- Mezclar Projects con Apps: rechazado porque borra su significado editorial.

## Consequences
Se añaden rutas y contenido tipado; la Home puede combinar ambas colecciones por fecha.
