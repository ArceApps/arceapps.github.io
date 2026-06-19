---
title: "Semantic Versioning en CD/CI: La Ciencia Entre Versiones"
description: "Domina el versionado semántico en pipelines de CI/CD. Aprende a calcular versiones automáticamente y garantizar la trazabilidad total en tus despliegues Android."
pubDate: 2025-12-05
lastmod: 2025-12-05
author: ArceApps
keywords:
  - "Semantic Versioning"
  - "CD/CI"
  - "Versionado"
  - "Release"
  - "Automatización"
canonical: "https://arceapps.com/es/blog/cde-semantic-versioning/"
heroImage: "/images/placeholder-article-cde-semver.svg"
tags: ["DevOps", "CI/CD", "Semantic Versioning", "Android", "GitHub Actions"]
reference_id: "0d37152d-08bf-43c6-8f5d-3372660e90a5"
---


## 📐 Teoría: El Contrato Social del Versionado

El **Semantic Versioning (SemVer)** no es solo una convención de nombrado (`X.Y.Z`); es un **contrato social** entre el desarrollador y el consumidor del software (ya sea otro desarrollador o el usuario final).

En el formato `MAJOR.MINOR.PATCH`:
- **MAJOR**: Cambios incompatibles (Breaking Changes). El contrato se rompe.
- **MINOR**: Funcionalidad nueva compatible hacia atrás. El contrato se expande.
- **PATCH**: Corrección de bugs compatible hacia atrás. El contrato se mantiene.

### El Reto en CI/CD (Continuous Delivery)
En un entorno de CD, los humanos no deberían decidir versiones. Si un humano decide "esta es la versión 2.0", introduce subjetividad y error. **La versión debe ser una función determinista del historial de cambios.**

`Versión(t) = Versión(t-1) + Impacto(Commit_t)`

## 🔄 El Bucle de Retroalimentación de Versiones

Un pipeline de CI/CD moderno para Android debe seguir este bucle estrictamente:

1.  **Code Change**: Desarrollador hace commit siguiendo [Conventional Commits](blog-conventional-commits.md).
2.  **Analysis**: CI analiza el commit. ¿Es `feat`? ¿Es `fix`? ¿Es `BREAKING CHANGE`?
3.  **Calculation**: CI calcula la nueva versión basándose en la última etiqueta (tag) y el impacto del cambio.
4.  **Release**: CI genera el artefacto (APK/AAB) con esa versión.
5.  **Tagging**: CI etiqueta el commit con la nueva versión, cerrando el ciclo.

## 🛠️ Implementación Práctica en GitHub Actions

Vamos a construir un pipeline que implemente esta teoría usando la herramienta `semantic-release` o equivalentes.

### Paso 1: Análisis de Commits (The Parser)

Necesitamos una herramienta que entienda Conventional Commits. Usaremos `PaulHatch/semantic-version`.

```yaml
      - name: Calculate Semantic Version
        id: semver
        uses: PaulHatch/semantic-version@v5.3.0
        with:
          # Define la raíz del código fuente para ignorar cambios en docs/readme
          change_path: "app/src"
          # Mapeo de tipos de commit a incrementos de versión
          major_pattern: "(MAJOR|BREAKING CHANGE)"
          minor_pattern: "feat:"
          # Formato de salida
          version_format: "${major}.${minor}.${patch}"
```

### Paso 2: Cálculo de VersionCode (Android Specific)

Como vimos en [Automatización de Versionado](blog-automated-versioning.md), Android necesita un entero. Aquí aplicamos la teoría de conjuntos: el `versionCode` debe ser una proyección inyectiva del `versionName`.

```yaml
      - name: Compute Android Version Code
        id: compute_code
        run: |
          # Extraer componentes semánticos
          MAJOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f1)
          MINOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f2)
          PATCH=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f3)

          # Algoritmo de Posicionamiento Decimal
          # Permite: 21 Major, 99 Minor, 99 Patch -> 219999
          CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

          echo "android_code=$CODE" >> $GITHUB_OUTPUT
```

### Paso 3: Inmutabilidad del Artefacto

Una regla de oro en DevOps es: **Construye una vez, despliega en todas partes**.
El APK que se prueba en QA debe ser **bit a bit idéntico** al que va a Producción.

Esto significa que la versión se inyecta en el momento del build, y ese artefacto "viaja" por los entornos. No reconstruimos para producción.

```yaml
      - name: Build Once
        run: ./gradlew bundleRelease -PversionName=${{ steps.semver.outputs.version }} -PversionCode=${{ steps.compute_code.outputs.android_code }}
        
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: app/build/outputs/bundle/release/*.aab
```

## ⚠️ Manejo de Pre-Releases (Alpha/Beta)

El versionado semántico también cubre ciclos de vida inestables.

- `1.0.0-alpha.1`: Primera alpha.
- `1.0.0-beta.1`: Feature freeze.
- `1.0.0-rc.1`: Release Candidate.

### Estrategia de Ramas
- `feature/*` -> Genera versiones alpha (`1.1.0-alpha.x`).
- `develop` -> Genera versiones beta (`1.1.0-beta.x`).
- `main` -> Genera versiones finales (`1.1.0`).

Configuración del Action para manejar prereleases:

```yaml
      - name: Determine Prerelease Label
        id: prerelease
        run: |
          if [[ $GITHUB_REF == *"feature/"* ]]; then
            echo "label=alpha" >> $GITHUB_OUTPUT
          elif [[ $GITHUB_REF == *"develop"* ]]; then
            echo "label=beta" >> $GITHUB_OUTPUT
          else
            echo "label=" >> $GITHUB_OUTPUT
          fi
```

## 📉 Errores Comunes y Cómo Evitarlos

### 1. El "Tag Manual"
Desarrollador hace `git tag v1.0.0` manualmente.
**Problema**: Rompe la fuente única de verdad. Si el CI intenta generar `v1.0.0` después, fallará.
**Solución**: Bloquear la creación de tags manuales en GitHub para todos excepto el bot de CI.

### 2. Commits "Sucios"
Mensajes como "wip", "fix bug", "changes".
**Problema**: El analizador semántico no sabe qué hacer (default a PATCH o ignora).
**Solución**: Usar un *commit-msg hook* o un *lint action* que obligue al formato Conventional Commits.

```yaml
      - name: Lint Commit Messages
        uses: wagoid/commitlint-github-action@v5
```

### 3. Explosión del VersionCode
Si usas timestamps o números de build de GitHub (`GITHUB_RUN_NUMBER`) directamente.
**Problema**: Si cambias de proveedor de CI (de GitHub a GitLab), el contador se reinicia y Google Play rechaza actualizaciones (Error: Version code 1 < 500).
**Solución**: Usar siempre el cálculo derivado de SemVer (`Major*10000...`). Es agnóstico a la plataforma de CI.

## 🎯 Conclusión

Implementar Semantic Versioning en tu CI/CD no es burocracia; es **ingeniería de confiabilidad**. Transformas el acto subjetivo y peligroso de "versionar" en un proceso matemático, determinista y completamente automatizado.

Cuando un manager pregunte "¿Qué hay en la versión 2.1.0?", no necesitas buscar en emails. El sistema te dirá exactamente: "Contiene todas las `feat` desde la 2.0.0 y es compatible hacia atrás". Eso es poder.
