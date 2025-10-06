#!/bin/bash

# Script para crear issues de GitHub para cada característica del ISSUE_SUMMARY.md
# Este script utiliza GitHub CLI (gh) para crear los issues

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creando issues de GitHub para características faltantes...${NC}\n"

# Verificar que gh está instalado y autenticado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ ERROR: GitHub CLI (gh) no está instalado${NC}"
    echo "Instala gh desde: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ ERROR: No estás autenticado en GitHub CLI${NC}"
    echo "Ejecuta: gh auth login"
    exit 1
fi

REPO="ArceApps/arceapps.github.io"
ASSIGNEE="ArceApps"

echo -e "${YELLOW}📋 Creando issues en el repositorio: ${REPO}${NC}\n"

# Función para crear un issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local priority="$4"
    
    echo -e "${GREEN}➕ Creando issue: ${title}${NC}"
    
    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --assignee "$ASSIGNEE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Issue creado exitosamente${NC}\n"
    else
        echo -e "${RED}❌ Error al crear issue${NC}\n"
    fi
}

# ============================================================================
# PRIORIDAD CRÍTICA - Implementar YA
# ============================================================================

echo -e "\n${RED}🚨 === PRIORIDAD CRÍTICA === ${NC}\n"

# Issue 1: Página de contacto funcional
create_issue \
"🔴 CRÍTICO: Implementar página de contacto funcional" \
"## 🚨 Problema
Actualmente todos los enlaces de \"Contacto\" apuntan a \`#\`, lo que impide que empleadores y clientes potenciales puedan contactar.

## 💥 Impacto
- **ALTO**: Los empleadores/clientes no pueden contactar ❌
- Pérdida de oportunidades de negocio/trabajo
- Credibilidad profesional comprometida

## ✅ Solución Propuesta
1. Crear formulario de contacto funcional en \`contact.html\`
2. Implementar backend para envío de emails (opciones):
   - Netlify Forms (gratuito, fácil integración)
   - Formspree (gratuito hasta 50 envíos/mes)
   - EmailJS (gratuito hasta 200 envíos/mes)
3. Incluir información de contacto alternativa (email directo)
4. Actualizar todos los enlaces de navegación

## 📝 Tareas
- [ ] Diseñar formulario de contacto con campos: nombre, email, asunto, mensaje
- [ ] Implementar validación de formulario (JavaScript)
- [ ] Integrar servicio de envío de emails
- [ ] Añadir confirmación de envío exitoso
- [ ] Actualizar enlaces de navegación
- [ ] Probar funcionalidad completa

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Problema Crítico #1
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #1

## ⏱️ Estimación
2-4 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:critical,type:feature,category:functionality" \
"CRITICAL"

# Issue 2: Enlaces de redes sociales reales
create_issue \
"🔴 CRÍTICO: Actualizar enlaces de redes sociales con perfiles reales" \
"## 🚨 Problema
Los enlaces de GitHub y LinkedIn en el footer y página about apuntan a \`#\` en lugar de perfiles reales.

## 💥 Impacto
- **ALTO**: Credibilidad profesional comprometida ❌
- Empleadores no pueden verificar experiencia
- Pérdida de conexiones profesionales

## ✅ Solución Propuesta
1. Actualizar enlace de GitHub con perfil real
2. Actualizar enlace de LinkedIn con perfil profesional
3. Verificar que los perfiles estén actualizados
4. Considerar añadir otros enlaces profesionales (Twitter, Medium, etc.)

## 📝 Tareas
- [ ] Actualizar enlaces en el footer de todas las páginas
- [ ] Actualizar enlaces en \`about.html\`
- [ ] Verificar que los perfiles estén completos y actualizados
- [ ] Probar todos los enlaces

## 📍 Archivos a Modificar
- \`index.html\` - Footer
- \`about.html\` - Links section
- \`blog.html\` - Footer
- \`portfolio.html\` - Footer
- \`contact.html\` - Footer
- \`script.js\` - Si hay enlaces dinámicos

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Problema Crítico #2
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #2

## ⏱️ Estimación
1 hora de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:critical,type:bug,category:content" \
"CRITICAL"

# Issue 3: Completar proyectos del portfolio
create_issue \
"🔴 CRÍTICO: Completar proyectos pendientes del portfolio" \
"## 🚨 Problema
4 de 6 proyectos muestran \"Próximamente\" o tienen enlaces a \`#\`, lo que hace que el portfolio parezca incompleto.

## 💥 Impacto
- **ALTO**: Portfolio no demuestra capacidades reales ❌
- Reduce credibilidad profesional
- No hay evidencia de trabajo realizado

## ✅ Solución Propuesta
1. Completar las páginas de proyecto faltantes
2. Añadir enlaces a repositorios GitHub de cada proyecto
3. Crear demos en vivo o capturas de pantalla
4. Documentar tecnologías utilizadas y desafíos resueltos

## 📝 Tareas
Por cada proyecto:
- [ ] Crear página de detalle del proyecto
- [ ] Añadir descripción completa del proyecto
- [ ] Incluir capturas de pantalla o demo en vivo
- [ ] Enlazar repositorio GitHub si es público
- [ ] Documentar stack tecnológico utilizado
- [ ] Añadir sección de desafíos y soluciones
- [ ] Actualizar enlaces en \`portfolio.html\`

## 📍 Proyectos a Completar
Según el análisis, completar los proyectos que actualmente muestran \"Próximamente\"

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Problema Crítico #3
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #3

## ⏱️ Estimación
6-8 horas de desarrollo (1-2 horas por proyecto)

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:critical,type:feature,category:content" \
"CRITICAL"

# Issue 4: Descarga de CV
create_issue \
"🔴 CRÍTICO: Añadir funcionalidad de descarga de CV/Resume" \
"## 🚨 Problema
No existe forma de descargar el currículum vitae, una herramienta esencial para búsqueda de empleo.

## 💥 Impacto
- **ALTO**: Herramienta esencial para búsqueda de empleo faltante ❌
- Empleadores no pueden obtener CV fácilmente
- Pérdida de oportunidades profesionales

## ✅ Solución Propuesta
1. Crear CV profesional en formato PDF
2. Añadir botón de descarga visible en:
   - Página principal (hero section)
   - Página About
   - Página de contacto
3. Considerar versiones en español e inglés

## 📝 Tareas
- [ ] Diseñar y crear CV en PDF (versión español)
- [ ] Diseñar y crear CV en PDF (versión inglés - opcional)
- [ ] Añadir archivos PDF al repositorio o hosting externo
- [ ] Implementar botón de descarga con ícono apropiado
- [ ] Añadir botón en página principal
- [ ] Añadir botón en página About
- [ ] Añadir analytics para tracking de descargas (opcional)
- [ ] Probar descarga en diferentes navegadores

## 💡 Sugerencias
- Usar diseño profesional y moderno
- Incluir: experiencia, educación, habilidades, proyectos destacados
- Mantener coherencia con el diseño del sitio web
- Actualizar regularmente

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Problema Crítico #4
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #6

## ⏱️ Estimación
3-4 horas (incluyendo creación de CV)

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:critical,type:feature,category:content" \
"CRITICAL"

# Issue 5: Sección de testimonios
create_issue \
"🔴 CRÍTICO: Añadir sección de testimonios de clientes/colegas" \
"## 🚨 Problema
No existe sección de testimonios, lo que reduce la credibilidad social del portfolio.

## 💥 Impacto
- **ALTO**: Falta de credibilidad social ❌
- No hay validación de terceros sobre habilidades
- Reduce confianza de potenciales clientes/empleadores

## ✅ Solución Propuesta
1. Recopilar testimonios reales de:
   - Clientes anteriores
   - Colegas de trabajo
   - Colaboradores de proyectos open source
2. Crear sección de testimonios atractiva
3. Incluir foto, nombre, cargo y empresa de cada testimonio

## 📝 Tareas
- [ ] Contactar personas para solicitar testimonios
- [ ] Recopilar al menos 3-5 testimonios
- [ ] Diseñar componente de testimonio (card design)
- [ ] Crear sección en página principal o About
- [ ] Implementar carousel o grid de testimonios
- [ ] Añadir fotos (con permiso) o avatars
- [ ] Optimizar para responsive design

## 💡 Estructura Sugerida para Testimonios
- Foto de la persona
- Nombre completo
- Cargo y empresa
- Testimonio (2-3 líneas)
- LinkedIn (opcional)

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Crítica #5
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #20

## ⏱️ Estimación
4-6 horas de desarrollo (excluyendo recopilación de testimonios)

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:critical,type:feature,category:content" \
"CRITICAL"

# ============================================================================
# PRIORIDAD ALTA - Próximos 30 días
# ============================================================================

echo -e "\n${YELLOW}🟡 === PRIORIDAD ALTA === ${NC}\n"

# Issue 6: Funcionalidad de búsqueda
create_issue \
"🟡 ALTA: Implementar funcionalidad de búsqueda en blog" \
"## 📋 Descripción
Añadir funcionalidad de búsqueda para permitir a los usuarios encontrar artículos de blog fácilmente.

## 💥 Impacto
- **MEDIO**: Mejora significativa de experiencia de usuario
- Facilita navegación en contenido
- Aumenta engagement con el blog

## ✅ Solución Propuesta
1. Implementar búsqueda con JavaScript puro o Fuse.js
2. Búsqueda en títulos, descripciones y tags de artículos
3. Mostrar resultados en tiempo real
4. Resaltar términos de búsqueda en resultados

## 📝 Tareas
- [ ] Diseñar componente de búsqueda (search bar)
- [ ] Implementar lógica de búsqueda (JavaScript o Fuse.js)
- [ ] Crear índice de contenido del blog
- [ ] Implementar búsqueda en tiempo real
- [ ] Diseñar página/modal de resultados
- [ ] Añadir highlights en resultados
- [ ] Optimizar performance para muchos posts
- [ ] Añadir en página de blog

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Alta #6
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #4

## ⏱️ Estimación
4-6 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:high,type:feature,category:functionality" \
"HIGH"

# Issue 7: Newsletter funcional
create_issue \
"🟡 ALTA: Implementar newsletter funcional" \
"## 📋 Descripción
El botón de newsletter actualmente dice \"Próximamente\". Implementar sistema de suscripción real.

## 💥 Impacto
- **MEDIO**: Oportunidad perdida de engagement ❌
- No hay forma de mantener audiencia informada
- Pérdida de oportunidad de construir comunidad

## ✅ Solución Propuesta
1. Integrar con servicio de email marketing:
   - Mailchimp (gratuito hasta 500 contactos)
   - ConvertKit (gratuito hasta 1000 suscriptores)
   - Buttondown (simple y gratuito)
   - EmailOctopus (gratuito hasta 2500 contactos)
2. Crear formulario de suscripción atractivo
3. Añadir confirmación de suscripción (double opt-in)

## 📝 Tareas
- [ ] Elegir servicio de email marketing
- [ ] Crear cuenta y configurar
- [ ] Obtener API key o código de formulario
- [ ] Implementar formulario de suscripción
- [ ] Añadir validación de email
- [ ] Implementar confirmación visual
- [ ] Configurar welcome email
- [ ] Actualizar footer en todas las páginas
- [ ] Probar flujo completo de suscripción

## 💡 Ubicaciones Sugeridas
- Footer de todas las páginas
- Sección dedicada en página principal
- Pop-up no intrusivo (opcional)

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Problema Crítico #5 y Prioridad Alta #7
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #5

## ⏱️ Estimación
3-4 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:high,type:feature,category:functionality" \
"HIGH"

# Issue 8: SEO completo (sitemap, meta tags)
create_issue \
"🟡 ALTA: Implementar SEO completo (sitemap.xml, meta tags, Schema.org)" \
"## 📋 Descripción
Mejorar el SEO del sitio implementando sitemap.xml, meta tags Open Graph, y Schema.org markup.

## 💥 Impacto
- **MEDIO-ALTO**: Mejora significativa en indexación y visibilidad
- Mejor presentación al compartir en redes sociales
- Rich snippets en resultados de búsqueda

## ✅ Componentes a Implementar

### 1. Sitemap.xml
- Sitemap XML para todos los contenidos
- Incluir todas las páginas, posts de blog, proyectos
- Mantener actualizado

### 2. Meta Tags Open Graph
- Implementar en todas las páginas
- Incluir: título, descripción, imagen, URL
- Optimizar para Facebook, LinkedIn, etc.

### 3. Schema.org Structured Data
- JSON-LD para tipo Person (página about)
- JSON-LD para tipo Article (blog posts)
- JSON-LD para tipo WebSite (página principal)

### 4. Robots.txt
- Crear archivo robots.txt básico
- Especificar directrices para crawlers

## 📝 Tareas
- [ ] Generar sitemap.xml (manual o automático)
- [ ] Añadir meta tags Open Graph en todas las páginas
- [ ] Añadir Twitter Card tags
- [ ] Implementar Schema.org JSON-LD en páginas relevantes
- [ ] Crear robots.txt
- [ ] Validar sitemap con Google Search Console
- [ ] Validar meta tags con Facebook Debugger
- [ ] Validar Schema.org con Google Rich Results Test

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Alta #8
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Características #8, #9, #10, #11

## ⏱️ Estimación
5-7 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:high,type:feature,category:seo" \
"HIGH"

# Issue 9: Google Analytics
create_issue \
"🟡 ALTA: Implementar Google Analytics o alternativa de tracking" \
"## 📋 Descripción
Implementar sistema de analytics para entender el tráfico y comportamiento de los usuarios.

## 💥 Impacto
- **MEDIO**: Datos esenciales para optimización
- Entender qué contenido funciona mejor
- Identificar áreas de mejora basadas en datos

## ✅ Solución Propuesta

### Opciones de Analytics:
1. **Google Analytics 4** (recomendado)
   - Gratuito y completo
   - Amplia documentación
   
2. **Plausible Analytics**
   - Privacy-friendly
   - Simple y ligero
   
3. **Simple Analytics**
   - Privacy-focused
   - GDPR compliant

## 📝 Tareas
- [ ] Elegir plataforma de analytics
- [ ] Crear cuenta y propiedad
- [ ] Obtener código de tracking
- [ ] Implementar código en todas las páginas
- [ ] Configurar eventos importantes:
  - Descargas de CV
  - Clics en proyectos
  - Suscripciones a newsletter
  - Envíos de formulario de contacto
- [ ] Configurar goals/conversiones
- [ ] Probar que el tracking funciona
- [ ] Documentar eventos configurados

## 💡 Eventos Importantes a Trackear
- Page views
- Descarga de CV
- Clics en enlaces de proyectos
- Suscripciones a newsletter
- Envíos de formulario de contacto
- Clics en redes sociales
- Lectura de blog posts

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Alta #9
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #12

## ⏱️ Estimación
2-3 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:high,type:feature,category:analytics" \
"HIGH"

# Issue 10: Casos de estudio detallados
create_issue \
"🟡 ALTA: Crear estudios de caso detallados de proyectos" \
"## 📋 Descripción
Transformar las descripciones básicas de proyectos en case studies detallados que demuestren capacidad de resolución de problemas.

## 💥 Impacto
- **ALTO**: Demuestra capacidad profesional real
- Diferenciación de otros portfolios
- Evidencia de pensamiento crítico y resolución de problemas

## ✅ Estructura Propuesta para Case Studies

### Componentes de cada Case Study:
1. **Overview**: Contexto y problema del proyecto
2. **Challenge**: Desafíos específicos enfrentados
3. **Solution**: Approach y decisiones técnicas tomadas
4. **Technologies**: Stack tecnológico utilizado
5. **Results**: Resultados medibles y logros
6. **Learnings**: Aprendizajes y mejoras futuras
7. **Visuals**: Screenshots, diagramas, demos

## 📝 Tareas
Por cada proyecto principal:
- [ ] Escribir sección de Overview
- [ ] Documentar challenges específicos
- [ ] Explicar soluciones implementadas
- [ ] Detallar stack tecnológico
- [ ] Incluir métricas de resultados (si disponible)
- [ ] Añadir screenshots o videos
- [ ] Crear diagramas de arquitectura (si aplica)
- [ ] Link a repositorio o demo
- [ ] Actualizar diseño de páginas de proyecto

## 💡 Proyectos Prioritarios
Enfocarse primero en los proyectos más impactantes o relevantes del portfolio.

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Alta #10
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #24

## ⏱️ Estimación
8-12 horas (2-3 horas por case study)

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:high,type:feature,category:content" \
"HIGH"

# ============================================================================
# PRIORIDAD MEDIA - Próximos 90 días
# ============================================================================

echo -e "\n${GREEN}🟢 === PRIORIDAD MEDIA === ${NC}\n"

# Issue 11: PWA Capabilities
create_issue \
"🟢 MEDIA: Implementar capacidades PWA (Progressive Web App)" \
"## 📋 Descripción
Convertir el sitio en una PWA con manifest.json y service worker para mejor experiencia de usuario.

## 💥 Impacto
- **BAJO-MEDIO**: Experiencia similar a app nativa
- Funcionalidad offline básica
- Instalable en dispositivos móviles

## ✅ Componentes a Implementar

### 1. Web App Manifest
- Crear \`manifest.json\`
- Definir nombre, íconos, colores
- Configurar display mode

### 2. Service Worker
- Implementar caching básico
- Estrategia de cache-first para assets estáticos
- Network-first para contenido dinámico

### 3. Íconos para Instalación
- Crear íconos en diferentes tamaños
- Optimizar para diferentes dispositivos

## 📝 Tareas
- [ ] Crear manifest.json
- [ ] Diseñar y generar íconos PWA (192x192, 512x512)
- [ ] Implementar service worker básico
- [ ] Configurar estrategias de caching
- [ ] Añadir fallback para modo offline
- [ ] Probar instalación en móvil
- [ ] Probar funcionalidad offline
- [ ] Validar con Lighthouse

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Media #11
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Características #13, #14

## ⏱️ Estimación
6-8 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:medium,type:feature,category:pwa" \
"MEDIUM"

# Issue 12: Mejoras de accesibilidad
create_issue \
"🟢 MEDIA: Implementar mejoras de accesibilidad (WCAG 2.1)" \
"## 📋 Descripción
Mejorar la accesibilidad del sitio implementando skip links, mejores ARIA labels e indicadores de foco.

## 💥 Impacto
- **MEDIO**: Mejor experiencia para usuarios con discapacidades
- Cumplimiento de estándares WCAG
- SEO mejorado

## ✅ Componentes a Implementar

### 1. Skip to Content Links
- Enlaces de salto para lectores de pantalla
- Permitir saltar navegación repetitiva

### 2. ARIA Labels Mejorados
- Labels más descriptivos
- Roles apropiados para componentes
- Estados y propiedades ARIA

### 3. Indicadores de Foco Mejorados
- Foco visible en todos los elementos interactivos
- Contraste suficiente
- Orden de tabulación lógico

## 📝 Tareas
- [ ] Implementar skip to content link
- [ ] Auditar y mejorar ARIA labels existentes
- [ ] Añadir ARIA roles donde falten
- [ ] Mejorar estilos de :focus
- [ ] Verificar orden de tabulación
- [ ] Asegurar contraste de colores (WCAG AA)
- [ ] Añadir alt text a todas las imágenes
- [ ] Probar con lector de pantalla
- [ ] Validar con herramientas de accesibilidad

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Media #12
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Características #25, #26, #27

## ⏱️ Estimación
5-7 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:medium,type:feature,category:accessibility" \
"MEDIUM"

# Issue 13: Optimizaciones de performance
create_issue \
"🟢 MEDIA: Optimizar performance del sitio (imágenes, carga, etc.)" \
"## 📋 Descripción
Implementar optimizaciones de performance incluyendo lazy loading, optimización de imágenes y mejora de tiempos de carga.

## 💥 Impacto
- **MEDIO**: Mejora velocidad de carga
- Mejor experiencia de usuario
- SEO mejorado

## ✅ Optimizaciones a Implementar

### 1. Optimización de Imágenes
- Formatos modernos (WebP con fallback)
- Lazy loading de imágenes
- Responsive images (srcset)
- Compresión de imágenes

### 2. Estados de Carga
- Spinners o skeletons durante carga
- Indicadores de progreso
- Smooth transitions

### 3. Optimizaciones de Código
- Minificación de CSS/JS
- Eliminación de código no usado
- Critical CSS inline

## 📝 Tareas
- [ ] Implementar lazy loading de imágenes
- [ ] Convertir imágenes a WebP
- [ ] Añadir srcset para responsive images
- [ ] Implementar skeleton screens
- [ ] Añadir spinners de carga
- [ ] Minificar CSS y JavaScript
- [ ] Optimizar orden de carga de recursos
- [ ] Implementar preload para recursos críticos
- [ ] Probar con Lighthouse
- [ ] Alcanzar score >90 en Lighthouse

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Media #13
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Características #15, #16

## ⏱️ Estimación
6-8 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:medium,type:feature,category:performance" \
"MEDIUM"

# Issue 14: Contenido adicional (logros, conferencias, open source)
create_issue \
"🟢 MEDIA: Añadir contenido adicional (logros, conferencias, open source)" \
"## 📋 Descripción
Crear secciones adicionales para mostrar logros, conferencias/charlas y contribuciones open source.

## 💥 Impacto
- **MEDIO**: Diferenciación profesional
- Demuestra liderazgo técnico
- Muestra compromiso con la comunidad

## ✅ Secciones a Crear

### 1. Galería de Logros
- Premios y reconocimientos
- Certificaciones
- Hitos profesionales

### 2. Sección de Conferencias/Charlas
- DevFest y otros eventos
- Slides o videos de presentaciones
- Temas presentados

### 3. Showcase de Open Source
- Lista de contribuciones con enlaces
- Proyectos propios open source
- Pull requests aceptados en proyectos importantes

## 📝 Tareas
- [ ] Diseñar sección de logros
- [ ] Recopilar información de logros
- [ ] Crear componentes visuales (badges, cards)
- [ ] Diseñar sección de conferencias
- [ ] Documentar cada charla/presentación
- [ ] Añadir enlaces a slides/videos
- [ ] Crear sección de open source
- [ ] Listar contribuciones relevantes
- [ ] Añadir enlaces a repos y PRs
- [ ] Integrar en página About o crear página dedicada

## 💡 Datos a Incluir

### Logros:
- Google Developer Expert (si aplica)
- Premios en hackathons
- Certificaciones profesionales

### Conferencias:
- DevFest Madrid
- Otras charlas técnicas
- Workshops impartidos

### Open Source:
- Contribuciones a proyectos populares
- Proyectos propios
- Estadísticas de GitHub

## 🔗 Referencias
- Ver \`ISSUE_SUMMARY.md\` - Prioridad Media #14
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Características #21, #22, #23

## ⏱️ Estimación
8-10 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:medium,type:feature,category:content" \
"MEDIUM"

# ============================================================================
# FEATURES ADICIONALES DE FUNCIONALIDAD
# ============================================================================

echo -e "\n${GREEN}🔧 === FUNCIONALIDAD === ${NC}\n"

# Issue 15: Sistema de comentarios en blog
create_issue \
"🔧 FUNCIONALIDAD: Implementar sistema de comentarios en blog" \
"## 📋 Descripción
Añadir sistema de comentarios en artículos del blog para fomentar interacción y engagement.

## 💥 Impacto
- **BAJO-MEDIO**: Mayor engagement con contenido
- Construcción de comunidad
- Feedback directo de lectores

## ✅ Opciones de Implementación

### Servicios Recomendados:
1. **Disqus** - Popular y fácil integración
2. **Utterances** - Basado en GitHub Issues (ideal para sitio técnico)
3. **Giscus** - Basado en GitHub Discussions
4. **Commento** - Privacy-focused

## 📝 Tareas
- [ ] Elegir plataforma de comentarios
- [ ] Crear cuenta y configurar
- [ ] Implementar código de integración
- [ ] Añadir a todas las páginas de blog
- [ ] Configurar moderación
- [ ] Probar funcionalidad
- [ ] Añadir política de comentarios

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Categoría Funcionalidad

## ⏱️ Estimación
2-3 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:medium,type:feature,category:functionality" \
"MEDIUM"

# Issue 16: Filtros avanzados en blog
create_issue \
"🔧 FUNCIONALIDAD: Implementar filtros avanzados en blog" \
"## 📋 Descripción
Ampliar los filtros del blog más allá de tags para incluir fecha, categoría y longitud de artículo.

## 💥 Impacto
- **BAJO**: Mejor organización de contenido
- Facilita encontrar contenido específico

## ✅ Filtros a Implementar
- Filtro por fecha (más reciente, más antiguo)
- Filtro por categoría
- Filtro por longitud de lectura
- Filtro por popularidad (si hay analytics)
- Combinación de múltiples filtros

## 📝 Tareas
- [ ] Diseñar UI de filtros
- [ ] Implementar lógica de filtrado
- [ ] Añadir metadata adicional a posts si necesario
- [ ] Implementar ordenamiento
- [ ] Añadir contador de resultados
- [ ] Preservar filtros en URL (query params)
- [ ] Responsive design para filtros
- [ ] Probar todas las combinaciones

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #19

## ⏱️ Estimación
4-5 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:low,type:feature,category:functionality" \
"LOW"

# Issue 17: Página 404 personalizada
create_issue \
"🔧 FUNCIONALIDAD: Crear página 404 personalizada" \
"## 📋 Descripción
Crear página de error 404 personalizada con navegación útil en lugar de la página predeterminada del servidor.

## 💥 Impacto
- **BAJO**: Mejor UX para errores de navegación
- Mantiene usuarios en el sitio

## ✅ Elementos a Incluir
- Mensaje amigable
- Enlaces a páginas principales
- Buscador (si está implementado)
- Diseño consistente con el resto del sitio
- Animación o ilustración divertida

## 📝 Tareas
- [ ] Diseñar página 404 atractiva
- [ ] Crear \`404.html\`
- [ ] Añadir navegación útil
- [ ] Incluir búsqueda si está disponible
- [ ] Añadir enlaces a contenido popular
- [ ] Configurar en GitHub Pages
- [ ] Probar accediendo a URL inválida

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #7

## ⏱️ Estimación
2-3 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:low,type:feature,category:functionality" \
"LOW"

# ============================================================================
# MEJORAS DE UX/UI
# ============================================================================

echo -e "\n${GREEN}🎨 === UX/UI === ${NC}\n"

# Issue 18: Breadcrumbs
create_issue \
"🎨 UX/UI: Implementar breadcrumbs de navegación" \
"## 📋 Descripción
Añadir breadcrumbs en páginas internas para mejor orientación del usuario.

## 💥 Impacto
- **BAJO**: Mejor orientación del usuario
- Facilita navegación hacia atrás
- SEO mejorado

## ✅ Ubicaciones para Breadcrumbs
- Páginas de artículos de blog
- Páginas de detalle de proyectos
- Páginas internas adicionales

## 📝 Tareas
- [ ] Diseñar componente de breadcrumbs
- [ ] Implementar lógica de breadcrumbs
- [ ] Añadir a páginas de blog
- [ ] Añadir a páginas de proyectos
- [ ] Implementar Schema.org BreadcrumbList
- [ ] Responsive design
- [ ] Probar navegación

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #17

## ⏱️ Estimación
3-4 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:low,type:feature,category:ux-ui" \
"LOW"

# Issue 19: Botón "Volver arriba"
create_issue \
"🎨 UX/UI: Implementar botón 'Volver arriba'" \
"## 📋 Descripción
Añadir botón flotante para volver al inicio en páginas largas.

## 💥 Impacto
- **BAJO**: Conveniencia de navegación
- Mejora UX en contenido largo

## ✅ Características del Botón
- Aparece al hacer scroll hacia abajo
- Desaparece al estar en top
- Animación smooth scroll
- Diseño consistente con el sitio
- No intrusivo

## 📝 Tareas
- [ ] Diseñar botón (ícono y estilo)
- [ ] Implementar lógica de aparición/desaparición
- [ ] Añadir smooth scroll
- [ ] Optimizar performance (throttle scroll event)
- [ ] Responsive design
- [ ] Accesibilidad (keyboard navigation)
- [ ] Probar en diferentes dispositivos

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #18

## ⏱️ Estimación
2-3 horas de desarrollo

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:low,type:feature,category:ux-ui" \
"LOW"

# ============================================================================
# SEGURIDAD Y PRIVACIDAD
# ============================================================================

echo -e "\n${GREEN}🔒 === SEGURIDAD === ${NC}\n"

# Issue 20: CSP Headers
create_issue \
"🔒 SEGURIDAD: Implementar Content Security Policy headers" \
"## 📋 Descripción
Configurar Content Security Policy (CSP) headers para mejorar seguridad del sitio.

## 💥 Impacto
- **BAJO**: Mejora seguridad contra XSS
- Protección contra inyección de código malicioso
- Best practice de seguridad web

## ✅ Configuración Sugerida
- Política restrictiva pero funcional
- Permitir recursos propios
- Configurar dominios externos autorizados
- Reportar violaciones

## 📝 Tareas
- [ ] Definir política CSP apropiada
- [ ] Configurar headers en GitHub Pages o CDN
- [ ] Probar que no rompa funcionalidad
- [ ] Configurar CSP reporting (opcional)
- [ ] Documentar política implementada
- [ ] Validar con herramientas online

## 🔗 Referencias
- Ver \`MISSING_FEATURES_ANALYSIS.md\` - Característica #29

## ⏱️ Estimación
2-3 horas de configuración

---
_Creado automáticamente desde ISSUE_SUMMARY.md_" \
"priority:low,type:feature,category:security" \
"LOW"

echo -e "\n${GREEN}✅ Script completado!${NC}"
echo -e "${YELLOW}📊 Total de issues creados: 20${NC}"
echo -e "\n${GREEN}🔗 Ver issues en: https://github.com/${REPO}/issues${NC}\n"
