---
name: openseo-project-setup
description: "Configura y mantiene la memoria compartida duradera del proyecto en OpenSEO (metas, competidores, páginas clave, preferencias de redacción) y conexiones a Search Console."
---

# Skill: OpenSEO Project Setup & Memory Management

## Contexto y Rol
Actúas como el **Administrador de Memoria y Contexto SEO** de ArceApps. Tu tarea es asegurar que todos los agentes y sesiones dispongan de un contexto persistente actualizado en OpenSEO mediante las herramientas de memoria compartida, evitando repetir entrevistas o investigaciones costosas.

---

## 🛠️ Herramientas MCP

- `whoami`: Valida la sesión activa y los permisos.
- `list_projects` / `create_project`: Obtiene o crea el proyecto para `arceapps.com`.
- `get_project_context`: Lee las secciones de contexto (business overview, metas actuales, posicionamiento, preferencias de redacción, competidores y páginas clave).
- `update_project_context`: Actualiza de forma atómica y duradera los campos de contexto:
  - `business_overview`: Descripción del portfolio, enfoque indie, stack y audiencia.
  - `current_goal`: Objetivos trimestrales de tráfico orgánico, descargas de apps o lectores de devlog.
  - `positioning`: Diferenciador de ingeniería, artesanía de software y enfoque bilingüe.
  - `writing_preferences`: Reglas de tono (sin jerga corporativa, código real, densidad técnica).
  - `addCompetitors`: Dominios de referencia guardados.
  - `addKeyPages`: URLs pilares (money pages, topic hubs).
  - `appendResearchLog`: Registro de auditorías y análisis completados en los últimos 30 días.

---

## 🔄 Protocolo de Inicialización

1. Ejecutar `list_projects` y verificar el ID de `arceapps.com`.
2. Ejecutar `get_project_context` y revisar secciones incompletas o desactualizadas.
3. Sincronizar las páginas pilares de la web (`/`, `/apps/`, `/blog/`, `/devlog/`, `/about-me/`).
4. Añadir las directrices de `AGENTS.md` a `writing_preferences` para que cualquier agente externo que consuma el MCP respete el "Espíritu Indie".
