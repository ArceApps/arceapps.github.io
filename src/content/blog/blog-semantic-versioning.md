---
title: "Versionado Semántico en Android: Mejores Prácticas para Desarrolladores"
description: "Una guía completa sobre cómo implementar versionado semántico en aplicaciones Android, desde versionCode hasta Google Play Store."
pubDate: "2025-08-25"
heroImage: "/images/placeholder-article-versioning.svg"
tags: ["Android", "Versionado", "Gradle", "CI/CD"]
---

## Introducción al Versionado Semántico

El versionado semántico (SemVer) es un sistema de versionado que utiliza un formato de tres números: MAJOR.MINOR.PATCH. En el contexto de Android, este sistema cobra especial importancia debido a las particularidades del ecosistema móvil y las políticas de Google Play Store.

### ¿Por qué es importante en Android?
Android maneja dos tipos de versiones diferentes:
- **versionName**: Es la versión que ven los usuarios (ej: "1.2.3")
- **versionCode**: Es un número entero interno que Google Play usa para determinar actualizaciones

## Configuración en build.gradle

```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.arceapps.miapp"
        minSdk 24
        targetSdk 34
        versionCode 10203  // Formato: MMmmpp
        versionName "1.2.3"
    }
}
```

### Estrategias de versionCode
Una estrategia efectiva es usar el formato MMmmpp donde:
- **MM**: Versión major (01-99)
- **mm**: Versión minor (00-99)
- **pp**: Versión patch (00-99)

## Automatización con Gradle

Podemos automatizar el versionado usando propiedades de Gradle:

```gradle
// version.properties
VERSION_MAJOR=1
VERSION_MINOR=2
VERSION_PATCH=3

// build.gradle
def versionPropsFile = file('version.properties')
def versionProps = new Properties()
versionProps.load(new FileInputStream(versionPropsFile))

def vMajor = versionProps['VERSION_MAJOR'].toInteger()
def vMinor = versionProps['VERSION_MINOR'].toInteger()
def vPatch = versionProps['VERSION_PATCH'].toInteger()

android {
    defaultConfig {
        versionCode vMajor * 10000 + vMinor * 100 + vPatch
        versionName "${vMajor}.${vMinor}.${vPatch}"
    }
}
```

## Consideraciones para Google Play

Google Play Store tiene requisitos específicos:

### App Bundle vs APK
Con Android App Bundle, Google genera múltiples APKs optimizados. Cada uno debe tener el mismo versionCode, pero Google maneja internamente los códigos específicos.

### Canales de distribución
- **Interno**: Para testing interno del equipo
- **Alpha**: Para testing cerrado
- **Beta**: Para testing abierto
- **Producción**: Para usuarios finales

## Integración con CI/CD

En un flujo de integración continua, podemos automatizar el versionado:

```yaml
# GitHub Actions example
name: Build and Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Extract version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_ENV
      
      - name: Update version
        run: |
          ./gradlew updateVersion -PnewVersion=$VERSION
```

## Mejores Prácticas

### 1. Consistencia en el equipo
Establecer reglas claras sobre cuándo incrementar cada número:
- **MAJOR**: Cambios incompatibles o rediseños completos
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Corrección de bugs

### 2. Documentación automática
Generar changelogs automáticamente basados en commits y PRs:

```markdown
## [1.2.3] - 2025-08-25
### Added
- Nueva funcionalidad de notificaciones push
- Soporte para modo oscuro

### Fixed
- Corrección de crash al rotar pantalla
- Mejora en la sincronización de datos
```

### 3. Testing por versiones
Implementar tests que verifiquen la compatibilidad entre versiones, especialmente para:
- Migración de bases de datos
- Formato de preferencias guardadas
- APIs internas cambiadas

## Herramientas Recomendadas

- **Gradle Version Plugin**: Automatiza el incremento de versiones desde línea de comandos
- **Fastlane**: Automatización completa del pipeline de despliegue
- **Semantic Release**: Versionado automático basado en commits convencionales

## Conclusión

El versionado semántico en Android requiere un enfoque híbrido que combine las mejores prácticas de SemVer con las particularidades de la plataforma. La clave está en la automatización y la consistencia en el equipo de desarrollo.

Implementar estas prácticas desde el inicio del proyecto ahorra tiempo y reduce errores en el futuro, especialmente cuando la aplicación crece en complejidad y número de usuarios.
