# ArceApps Portfolio & Blog

**Web:** <https://arceapps.com> | <https://arceapps.github.io/>

Portfolio personal y blog de desarrollo Android con diseño moderno, construido con **Astro**, **Tailwind CSS** y **DaisyUI**. Un sitio web profesional que muestra aplicaciones móviles y comparte conocimiento técnico sobre desarrollo Android.

![Homepage](https://github.com/user-attachments/assets/ccc2a494-8686-46e6-bc7a-633211babf2a)

## 🚀 Tecnologías Utilizadas

- **[Astro 5.16.3](https://astro.build/)** - Framework web moderno para sitios de contenido
- **[Tailwind CSS 4.x](https://tailwindcss.com/)** - Framework CSS utility-first
- **[DaisyUI](https://daisyui.com/)** - Librería de componentes para Tailwind
- **[Material Icons](https://fonts.google.com/icons)** - Sistema de iconos
- **GitHub Pages** - Hosting y despliegue automático

## 📋 Estructura del Proyecto

```
arceapps.github.io/
├── src/
│   ├── components/        # Componentes Astro reutilizables
│   │   ├── Header.astro   # Navegación principal
│   │   ├── Footer.astro   # Footer con enlaces
│   │   ├── Hero.astro     # Hero section de la home
│   │   ├── AppCard.astro  # Card para mostrar apps
│   │   └── BlogCard.astro # Card para posts del blog
│   ├── content/           # Contenido en Markdown
│   │   ├── apps/          # 4 aplicaciones Android
│   │   ├── blog/          # 24 artículos técnicos
│   │   └── config.ts      # Schemas de contenido
│   ├── layouts/
│   │   └── Layout.astro   # Layout base del sitio
│   ├── pages/             # Páginas del sitio
│   │   ├── index.astro    # Página principal
│   │   ├── apps/          # Portfolio de aplicaciones
│   │   ├── blog/          # Blog de desarrollo
│   │   └── about.astro    # Página sobre mí
│   └── styles/            # Estilos globales
├── public/                # Archivos estáticos
│   └── images/            # Imágenes del sitio
├── astro.config.mjs       # Configuración de Astro
├── package.json           # Dependencias del proyecto
└── CNAME                  # Dominio personalizado
```

## 📱 Aplicaciones Android

![Apps Portfolio](https://github.com/user-attachments/assets/1b40fd99-9b86-4ad3-9da0-2a80751cbfd2)

El sitio muestra **4 aplicaciones Android** publicadas en Google Play Store:

### 1. **PuzzleHub** 🧩
- Colección definitiva con 10 juegos de lógica
- Puzzle clásicos y modernos en una app
- Integración con Google Play Games
- [Ver en Google Play](https://play.google.com/store/apps/details?id=com.arceapps.puzzlehub)

### 2. **4Line for Color Lines** 🎨
- Juego de lógica y rompecabezas colorido
- Forma líneas de 4+ fichas del mismo color
- Sistema de puntuación y niveles progresivos
- [Ver en Google Play](https://play.google.com/store/apps/details?id=com.arceapps.a4line)

### 3. **2048 Puzzle Challenge** 🔢
- Clásico juego de rompecabezas numérico
- Diseños personalizables y temas coloridos
- Logros y competición global
- [Ver en Google Play](https://play.google.com/store/apps/details?id=com.arceapps.a2048)

### 4. **Sudoku+** ✏️
- Experiencia de Sudoku definitiva
- Múltiples niveles de dificultad
- Tutoriales y sistema de ayuda
- [Ver en Google Play](https://play.google.com/store/apps/details?id=com.arceapps.sudoku)

## 📝 Blog de Desarrollo Android

![Blog](https://github.com/user-attachments/assets/4d4e2e59-7859-4cef-adf8-65bfd488ce46)

El blog contiene **24 artículos técnicos** sobre desarrollo Android, arquitectura de software y mejores prácticas:

### Temas Principales

#### 🏗️ Arquitectura y Patrones
- **Clean Architecture en Android**: Implementación completa con capas
- **Arquitectura MVVM**: Guía desde cero con ejemplos prácticos
- **Patrón Repository**: Abstracción de datos y fuentes
- **Use Cases**: Lógica de negocio limpia y reutilizable
- **Inyección de Dependencias**: Dagger y Hilt para expertos
- **Principios SOLID**: Aplicados al desarrollo Android

#### 🔧 Kotlin y Programación
- **Null Safety en Kotlin**: Adiós NullPointerException
- **Uso de .let**: Cuándo usarlo y cuándo evitarlo
- **Kotlin Coroutines**: Programación asíncrona moderna
- **StateFlow y SharedFlow**: Gestión de estado y eventos

#### 💾 Persistencia y Datos
- **Room Database**: Persistencia moderna en Android
- **Patrón Repository**: La base de arquitectura sólida

#### 🔄 CI/CD y Automatización
- **GitHub Actions**: Automatiza tu workflow completo
- **Versionado Semántico**: Mejores prácticas para Android
- **Conventional Commits**: Historial Git poderoso
- **Automatización de Versionado**: De commits a Google Play
- **GitHub Actions + Play Store**: Deployments automáticos
- **CDE + Semantic Versioning**: Workflow definitivo

#### 📚 Documentación y Calidad
- **KDoc y Dokka**: Documentación profesional
- **Firebase Crashlytics**: Análisis y resolución de crashes

#### 🌐 Web y Hosting
- **GitHub Pages**: Hosting gratuito premium

*Todos los artículos incluyen ejemplos de código real en Kotlin, diagramas explicativos y casos de uso prácticos.*

## ✨ Características Técnicas del Sitio

### 🎨 Diseño Moderno
- **Material Design 3**: Sistema de diseño consistente
- **Tema Claro/Oscuro**: Toggle de tema con persistencia
- **Responsive Design**: Optimizado para móvil, tablet y desktop
- **Animaciones Suaves**: Transiciones y efectos visuales
- **Tipografía**: Roboto con escalado fluido
- **Iconos**: Material Icons integrados

### ⚡ Performance y SEO
- **Astro Islands**: Hidratación parcial para máxima velocidad
- **Generación Estática**: SSG para tiempos de carga ultra rápidos
- **Meta Tags Optimizados**: SEO completo en todas las páginas
- **Imágenes Optimizadas**: Lazy loading y formatos modernos
- **Lighthouse Score**: 95+ en todas las métricas

### 🔍 Gestión de Contenido
- **Content Collections**: Sistema de Astro para gestionar contenido
- **Markdown con Frontmatter**: Escribir contenido de forma sencilla
- **Schemas de Validación**: Zod para validación de datos
- **Type Safety**: TypeScript para mayor seguridad

### 📱 Componentes Reutilizables
- **Header**: Navegación responsive con menú móvil
- **Footer**: Enlaces y redes sociales
- **Hero**: Sección principal llamativa
- **AppCard**: Tarjetas para mostrar aplicaciones
- **BlogCard**: Tarjetas para artículos del blog
- **Layout**: Template base con SEO

## 🚀 Desarrollo Local

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/ArceApps/arceapps.github.io.git
cd arceapps.github.io

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# El sitio estará disponible en http://localhost:4321
```

### Comandos Disponibles

```bash
npm run dev       # Inicia servidor de desarrollo
npm run build     # Genera build de producción en /dist
npm run preview   # Vista previa del build de producción
```

## 📝 Añadir Contenido Nuevo

### ➕ Añadir Nueva Aplicación

1. Crear archivo en `src/content/apps/nombre-app.md`:

```markdown
---
title: "Nombre de la App"
description: "Descripción breve y atractiva"
pubDate: "2025-01-15"
heroImage: "/images/app-hero.svg"
icon: "android"
realIconUrl: "https://..."
screenshots: ["url1", "url2"]
tags: ["Puzzle", "Logic"]
googlePlayUrl: "https://play.google.com/..."
---

Contenido en Markdown...
```

2. Guardar y recargar - Astro detecta automáticamente el nuevo contenido

### 📰 Añadir Nuevo Artículo del Blog

1. Crear archivo en `src/content/blog/nombre-post.md`:

```markdown
---
title: "Título del Artículo"
description: "Descripción para SEO"
pubDate: "2025-01-15"
heroImage: "/images/blog-hero.svg"
tags: ["Android", "Kotlin"]
---

Tu contenido en Markdown aquí...
```

2. El artículo aparecerá automáticamente en la página del blog

## 🌐 Despliegue

### GitHub Pages

El sitio se despliega automáticamente en **GitHub Pages** mediante GitHub Actions:

1. Cada push a `main` dispara el workflow de build
2. Astro genera el sitio estático en `/dist`
3. Los archivos se despliegan en la rama `gh-pages`
4. El sitio está disponible en:
   - https://arceapps.github.io
   - https://arceapps.com (dominio personalizado)

### Dominio Personalizado

El archivo `CNAME` contiene el dominio personalizado `arceapps.com`, configurado con:
- DNS apuntando a GitHub Pages
- HTTPS automático mediante GitHub
- Redirección de www a dominio principal

## 📊 Estadísticas del Proyecto

- **Archivos fuente**: 45 archivos en `src/`
- **Aplicaciones**: 4 apps Android publicadas
- **Artículos de blog**: 24 posts técnicos
- **Componentes Astro**: 6 componentes reutilizables
- **Páginas generadas**: 34 páginas estáticas
- **Dependencias**: Astro, Tailwind CSS, DaisyUI
- **Performance**: Lighthouse 95+ en todas las métricas
- **Dominio personalizado**: arceapps.com
- **Idioma**: Español 🇪🇸

## 🎯 Características Destacadas

### Para Visitantes
- ✅ Diseño moderno y profesional con Material Design
- ✅ Navegación intuitiva y experiencia fluida
- ✅ Contenido técnico de calidad sobre Android
- ✅ Enlaces directos a Google Play Store
- ✅ Blog actualizado con artículos útiles
- ✅ Tema claro/oscuro adaptativo

### Para Desarrolladores
- ✅ Código limpio y bien estructurado
- ✅ Componentes reutilizables con Astro
- ✅ Type safety con TypeScript
- ✅ Content Collections para gestión de contenido
- ✅ Builds ultra rápidos con Astro
- ✅ Despliegue automático con GitHub Actions

## 🔄 Roadmap y Mejoras Futuras

- [ ] Añadir más aplicaciones al portfolio
- [ ] Sistema de búsqueda de artículos
- [ ] Newsletter subscription
- [ ] Comentarios en posts del blog (Giscus)
- [ ] Analytics con Google Analytics o Plausible
- [ ] RSS feed para el blog
- [ ] Soporte multiidioma (inglés)
- [ ] PWA capabilities
- [ ] Sitemap XML automatizado
- [ ] Schema.org markup para mejor SEO

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ por ArceApps**  
**Stack:** Astro · Tailwind CSS · TypeScript · GitHub Pages  
**Última actualización:** Diciembre 2025
