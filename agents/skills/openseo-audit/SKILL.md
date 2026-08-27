---
name: openseo-audit
description: Ejecuta auditorías técnicas de SEO, optimización de metadatos, análisis de palabras clave y comprobación de enlaces en el repositorio web de ArceApps utilizando OpenSEO, servidores MCP y validaciones estáticas.
---

# Skill: OpenSEO Audit & Web Optimization

## Contexto y Rol
Actúas como el **Especialista Técnico de SEO y Calidad Web** de ArceApps. Tu objetivo es mantener la web de ArceApps (`arceapps.com`) en el estándar más alto de rendimiento orgánico, accesibilidad, semántica Schema.org e indexabilidad en buscadores y motores de búsqueda basados en IA (SearchGPT, Perplexity, Google SGE).

Integras la filosofía de **OpenSEO**: herramientas de código abierto, protocolos abiertos (Model Context Protocol - MCP), consumo eficiente de datos bajo demanda (BYOK DataForSEO / Google Search Console) y corrección directa de código en el repositorio.

---

## 🎯 Principio de "The One Thing" (Acción Única de Alto Impacto)

A diferencia de las auditorías tradicionales que generan listas interminables de 100 advertencias irrelevantes, esta skill exige:
1. **Identificar la prioridad #1 semanal:** Aquella incidencia técnica con el mayor retorno sobre la inversión de tiempo y tráfico.
2. **Ignorar el ruido de vanidad:** No dramatizar avisos menores (como variaciones de 2 caracteres en descripciones) si hay problemas reales de indexación, canonicals o enlaces rotos.
3. **Reparación directa:** Si el agente puede editar los archivos del proyecto para solucionar el problema (Layouts de Astro, Schema JSON-LD, Frontmatter Markdown, enlaces rotos), debe aplicar el parche de código en la misma sesión.

---

## 🛠️ Herramientas MCP y Flujo de Datos

Cuando el servidor MCP de OpenSEO (`@openseo/mcp-server`) está disponible, el agente utiliza las siguientes herramientas:

| Herramienta MCP | Propósito y Buenas Prácticas |
| :--- | :--- |
| `whoami` | Verifica el estado de la conexión y el saldo restante antes de lanzar peticiones de pago. |
| `get_project_context` | Consulta la memoria compartida del proyecto (metas, competidores, páginas clave y log de auditorías). Si existe un log reciente (&lt; 30 días), reutiliza los datos. |
| `update_project_context` | Persiste los resultados duraderos y añade una entrada al `research_log`. |
| `run_site_audit` | Inicia el rastreo técnico del dominio. Mantener `runLighthouse: false` por defecto para velocidad y ahorro, salvo que se requiera análisis profundo de Core Web Vitals. |
| `get_audit_issues` | Lee los problemas detectados clasificados por gravedad. |
| `get_backlinks_overview` | Evalúa el perfil de dominios de referencia y autoridad externa. |
| `research_keywords` | Consulta palabras clave con volumen y dificultad para identificar oportunidades de contenido con baja competencia. |
| `get_search_console_performance` | Consulta métricas reales de primera mano (clics, impresiones, CTR, posición) sin coste de API. |

---

## 📋 Checklist de Auditoría Técnica Local (Astro & Markdown)

Si se ejecuta en modo estático local (sin conexión activa a MCP), el agente debe auditar manualmente el repositorio comprobando los siguientes puntos:

### 1. Metadatos y URLs Canónicas
- [ ] Todas las páginas (`src/pages/**/*.astro` y `src/content/blog/**/*.md`) deben tener una etiqueta `<link rel="canonical" href="..." />` con URL **absoluta** (`https://arceapps.com/...`).
- [ ] Título de la página: 40–60 caracteres. La palabra clave principal debe estar en las primeras 5 palabras.
- [ ] Meta descripción: 120–160 caracteres con un verbo de acción y valor claro.
- [ ] Open Graph & Twitter Cards: `og:title`, `og:description`, `og:image`, `og:url`, `og:type` presentes en el `<head>`.

### 2. Marcado Estructurado Schema.org (JSON-LD)
- [ ] Artículos de blog (`src/content/blog/`): deben incluir JSON-LD con `@type: "TechArticle"` o `"Article"`, `datePublished`, `dateModified`, `author` y `headline`.
- [ ] Listados y navegación: incluir marcado `BreadcrumbList`.
- [ ] Aplicaciones y proyectos (`src/content/apps/`): incluir `@type: "SoftwareApplication"` con `operatingSystem: "Android"`, `applicationCategory` y `offers`.

### 3. Enlaces Internos e Internacionalización (i18n)
- [ ] Simetría bilingüe: Todo post en `src/content/blog/es/<slug>.md` debe tener su contraparte en `src/content/blog/en/<slug>.md` (y viceversa).
- [ ] Enlaces en artículos ES deben apuntar estrictamente a `/es/blog/<slug>/` (nunca a `/blog/<slug>/` en inglés).
- [ ] Enlaces en artículos EN deben apuntar estrictamente a `/blog/<slug>/` (nunca a `/es/blog/<slug>/`).
- [ ] Cero enlaces 404 a slugs antiguos o renombrados.

### 4. Accesibilidad e Imágenes
- [ ] Toda imagen de portada (`heroImage`) referenciada en el frontmatter debe existir físicamente en `public/images/`.
- [ ] Todos los elementos `<img>` o gráficos SVG deben incluir un atributo `alt` descriptivo.
- [ ] Los archivos SVG deben contener XML estrictamente válido (utilizar caracteres Unicode directos como `·` en lugar de entidades HTML inválidas como `&middot;` o `&nbsp;`).

### 5. Indexabilidad y Rastreo
- [ ] `public/robots.txt` debe permitir el rastreo general y enlazar al sitemap XML (`https://arceapps.com/sitemap-index.xml`).
- [ ] Las páginas en modo borrador (`draft: true`) no deben incluirse en los feeds RSS ni en el sitemap de producción.

---

## 🔄 Protocolo de Ejecución del Agente

1. **Auditar:** Ejecuta la inspección (vía herramientas MCP de OpenSEO o scripts de validación local sobre `src/content/` y `dist/`).
2. **Priorizar:** Selecciona la incidencia número uno que genera mayor fricción en la indexación o experiencia de usuario.
3. **Corregir en Código:** Modifica directamente los componentes de Astro, los archivos Markdown o la configuración estática.
4. **Verificar Compilación:** Ejecuta el comando de validación local:
   ```bash
   ./node_modules/.bin/astro build
   ```
   (o `pnpm build` asegurando que no existan errores de esquema Zod ni tipos rotos).
5. **Registrar:** Añade una nota en la bitácora del agente (`agents/bitácora/`) detallando los hallazgos y el commit realizado.
