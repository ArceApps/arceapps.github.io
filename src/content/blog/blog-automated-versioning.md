---
title: "Automatización de Versionado con GitHub Actions: La Revolución del Desarrollador Android"
description: "Descubre cómo automatizar completamente el versionado de tu app Android con GitHub Actions: desde commits hasta Google Play Store, sin intervención manual."
pubDate: "2025-12-10"
heroImage: "/images/placeholder-article-automated-versioning.svg"
tags: ["Android", "GitHub Actions", "CI/CD", "Automatización", "Versionado", "DevOps"]
---

## 🧠 Teoría: La Matemática del Versionado

El versionado de software no es un arte arbitrario; es una ciencia precisa necesaria para manejar la complejidad en sistemas distribuidos. En el ecosistema Android, este problema tiene dos dimensiones distintas que a menudo se confunden:

1.  **Versionado Semántico (Humanos)**: `versionName` (ej. 1.2.0). Comunica el impacto de los cambios (Breaking, Feature, Fix) a los usuarios y desarrolladores.
2.  **Versionado Monotónico (Máquinas)**: `versionCode` (ej. 10200). Un entero estrictamente creciente que el ecosistema de Google Play utiliza para determinar qué APK es más nuevo.

### El Conflicto de las Dos Escalas
El problema fundamental es mantener sincronizados estos dos mundos.
- Si subes `v1.2.0` (code 10) y luego corriges un bug crítico (`v1.2.1`), el código debe subir a 11.
- Si olvidas subir el código a 11, Google Play rechazará el artefacto, rompiendo tu pipeline de CI/CD.

La automatización no es solo conveniencia; es un mecanismo de **consistencia garantizada**.

## 🚀 Estrategia de Versionado Automatizado

Para resolver esto, implementaremos un sistema basado en **Git History**. La fuente de la verdad debe ser el historial de commits, no un número hardcodeado en un archivo `build.gradle` que los humanos olvidan editar.

### Conventional Commits como Protocolo
Usaremos [Conventional Commits](https://www.conventionalcommits.org/) como el protocolo de comunicación entre el desarrollador y el sistema de CI.

- `fix: ...` -> Patch Bump (1.0.0 -> 1.0.1)
- `feat: ...` -> Minor Bump (1.0.0 -> 1.1.0)
- `feat!: ...` o `BREAKING CHANGE` -> Major Bump (1.0.0 -> 2.0.0)

El sistema de CI analizará el grafo de commits desde el último tag para calcular determinísticamente la siguiente versión.

## 🔧 Configuración Técnica: El Cerebro del Workflow

A diferencia de scripts básicos, aquí construiremos un pipeline inteligente que calcula tanto el `versionName` semántico como un `versionCode` compuesto.

### Paso 1: El Cálculo Determinista

Crea `.github/workflows/calculate-version.yml`. Usaremos una lógica donde el `versionCode` se deriva matemáticamente del `versionName` para evitar colisiones.

**Fórmula de VersionCode Canónica:**
`VersionCode = MAJOR * 10000 + MINOR * 100 + PATCH`
Ejemplo: v2.1.5 -> 20105.
*Nota: Esto soporta hasta 99 parches y 99 minors, lo cual es suficiente para la mayoría. Para apps gigantes, se ajustan los multiplicadores.*

```yaml
jobs:
  calculate-version:
    runs-on: ubuntu-latest
    outputs:
      new_tag: ${{ steps.semver.outputs.new_tag }}
      version_code: ${{ steps.semver.outputs.version_code }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Vital para leer todo el historial de git

      - name: Git Semantic Version
        id: semver
        uses: PaulHatch/semantic-version@v5.3.0
        with:
          # Define qué dispara cada cambio
          change_path: "app/src"
          major_pattern: "(MAJOR|BREAKING CHANGE)"
          minor_pattern: "feat:"
          version_format: "${major}.${minor}.${patch}"

      - name: Calculate Android Version Code
        run: |
          # Extraemos partes
          MAJOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f1)
          MINOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f2)
          PATCH=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f3)

          # Matemática bash para el código
          CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

          echo "Calculated Code: $CODE"
          echo "version_code=$CODE" >> $GITHUB_OUTPUT
```

### Paso 2: Inyección en Tiempo de Compilación

No edites el archivo `build.gradle` físicamente en el repo (eso genera "commits de versión" ruidosos). En su lugar, inyecta las versiones como variables de entorno o parámetros de Gradle en el momento del build.

**En `app/build.gradle`:**
```groovy
android {
    defaultConfig {
        // Si no hay params (dev local), usa defaults. Si hay (CI), usa los inyectados.
        versionCode = project.hasProperty('versionCode') ? project.versionCode.toInteger() : 1
        versionName = project.hasProperty('versionName') ? project.versionName : "1.0.0-dev"
    }
}
```

**En el Workflow de Build:**
```yaml
      - name: Build Release AAB
        run: ./gradlew bundleRelease -PversionCode=${{ needs.calc.outputs.version_code }} -PversionName=${{ needs.calc.outputs.new_tag }}
```

## ⚡ Estrategias Avanzadas para Equipos Grandes

### Versionado por Ramas (Branch-based Versioning)
En equipos grandes, `develop` y `main` pueden divergir.
- **Main (Producción)**: v1.2.0 (Code: 10200)
- **Develop (Beta)**: v1.3.0-beta.1 (Code: 103001) -> Usamos un dígito extra al final para pre-releases.

### Generación Automática de Changelog
Ya que usamos Conventional Commits, podemos generar notas de lanzamiento automáticamente agrupadas por tipo.

```yaml
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true # GitHub sabe leer conventional commits nativamente ahora
          tag_name: ${{ needs.calc.outputs.new_tag }}
```

## ⚠️ Riesgos y Mitigaciones

### El Problema de la "Carrera de Versiones"
Si dos PRs se fusionan a `main` muy rápido, ambos podrían intentar generar la versión `v1.3.0`.
**Solución**: Configura `concurrency` en tu workflow de GitHub Actions para asegurar que los deploys sean secuenciales, nunca paralelos.

```yaml
concurrency:
  group: production_release
  cancel-in-progress: false # Espera a que termine el anterior
```

### Límites del VersionCode
Android tiene un límite de `2100000000` para versionCode. Nuestra fórmula `Major * 10000` es segura por años, pero si usas el `github.run_number` o timestamp, podrías agotar los números o romper la monotonicidad si migras de CI. La fórmula matemática determinista basada en SemVer es la más robusta a largo plazo.

## 🎯 Conclusión

Automatizar el versionado no es solo "ahorrar 5 minutos". Es implementar una **infraestructura de confianza**. Eliminas la pregunta "¿Qué versión es esta?" y el error "¿Por qué falló el upload a Play Store?".

Transformas el versionado de una tarea manual y propensa a errores, a una consecuencia lógica y matemática de tu trabajo de desarrollo.

**Resumen de la implementación:**
1.  Adopta **Conventional Commits**.
2.  Usa una acción para **calcular SemVer** basado en el grafo de git.
3.  Calcula el **VersionCode** matemáticamente.
4.  Inyecta ambos vía **Gradle Properties** (-P) en CI.
5.  Disfruta de tus fines de semana.
