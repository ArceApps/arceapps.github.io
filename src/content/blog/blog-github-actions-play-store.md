---
title: "GitHub Actions + Google Play Store: Automatización Completa de Deployments Android"
description: "Guía paso a paso para configurar deployments automáticos a Google Play Store usando GitHub Actions, desde la configuración inicial hasta estrategias avanzadas de rollout."
pubDate: "2025-09-05"
heroImage: "/images/placeholder-article-github-actions-play-store.svg"
tags: ["GitHub Actions", "Google Play Store", "Android", "CI/CD", "DevOps", "Automatización", "Deployment"]
---

Imagínate esto: pusheas un tag, GitHub Actions toma el control, construye tu app, la firma, ejecuta tests, y la publica automáticamente en Google Play Store. Todo mientras tomas café. ☕

Si llegaste aquí desde nuestro [artículo principal sobre GitHub Actions](blog-github-actions.md), ya conoces el poder de la automatización. Ahora vamos a profundizar en el caso de uso más complejo y valioso: **deployment automático a Google Play Store**.

> **⚠️ Antes de Empezar**
> Este proceso involucra credenciales sensibles y puede afectar directamente a tus usuarios. Sigue cada paso cuidadosamente y prueba primero en un proyecto de testing.

## 🎯 Lo Que Vas a Lograr

Al final de este artículo tendrás un workflow completo que:
- ✅ Construye tu app automáticamente cuando creas un release tag
- ✅ Ejecuta tests de calidad antes del deployment
- ✅ Firma tu AAB con credenciales seguras
- ✅ Sube a Google Play Store al track que elijas
- ✅ Notifica al equipo del resultado
- ✅ Incluye rollback automático en caso de errores

## 🔐 Paso 1: Configuración de Google Play Console

Antes de tocar GitHub, necesitamos preparar Google Play Console para aceptar deployments automáticos.

### Crear Service Account
Primero, necesitas crear un Service Account en Google Cloud Console:
1. Ve a **Google Cloud Console** → IAM & Admin → Service Accounts
2. Crea un nuevo Service Account
3. Descarga el archivo JSON con las credenciales
4. En Google Play Console, ve a Setup → API access
5. Enlaza el Service Account creado
6. Otorga permisos: `Admin (all permissions)` o permisos específicos de releases

```yaml
# Ejemplo de permisos mínimos requeridos:
- View app information and download bulk reports
- View financial data, orders, and cancellation survey responses  
- Manage store presence
- Manage production releases
- Manage testing releases
```

### ⚠️ Seguridad del Service Account
- Nunca commitees el archivo JSON al repositorio
- Usa GitHub Secrets para almacenar credenciales
- Considera crear Service Accounts específicos por app
- Revisa y rota credenciales regularmente
- Habilita logging para auditar accesos

## 🏗️ Paso 2: Configuración del Proyecto Android

Tu proyecto Android necesita algunas configuraciones específicas para funcionar con deployments automáticos.

### Configurar Gradle para Play Store

```gradle
// build.gradle (Project level)
plugins {
    id 'com.github.triplet.play' version '3.8.4' apply false
}

// build.gradle (App level)
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'com.github.triplet.play'
}

// Configuración del plugin Play
play {
    track.set('internal') // o 'alpha', 'beta', 'production'
    defaultToAppBundles.set(true)
    serviceAccountCredentials.set(file('service-account.json'))
}
```

### Configurar Signing

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 🔑 Paso 3: Configurar GitHub Secrets

GitHub Secrets es donde almacenamos toda la información sensible de forma segura.

### Secrets Requeridos
Ve a tu repositorio → Settings → Secrets and variables → Actions, y añade:

```yaml
# Credenciales de Google Play Store
PLAY_STORE_JSON_KEY: [contenido completo del archivo JSON del Service Account]

# Credenciales de firma de Android
KEYSTORE_FILE: [archivo keystore codificado en base64]
KEYSTORE_PASSWORD: [contraseña del keystore]
KEY_ALIAS: [alias de la key]
KEY_PASSWORD: [contraseña de la key]

# Notificaciones (opcional)
SLACK_WEBHOOK_URL: [webhook de Slack para notificaciones]
```

### Preparar Keystore para GitHub Secrets

```bash
# Codificar keystore en base64
base64 -i your-keystore.jks -o keystore-base64.txt

# El contenido de keystore-base64.txt va en KEYSTORE_FILE secret
```

## ⚙️ Paso 4: Crear el Workflow de GitHub Actions

Ahora viene la magia. Creamos el workflow que automatizará todo el proceso.

### Workflow Completo
Crea `.github/workflows/deploy-play-store.yml`:

```yaml
name: Deploy to Google Play Store

on:
  push:
    tags:
      - 'v*'  # Triggers on version tags like v1.0.0

env:
  JAVA_VERSION: 17

jobs:
  deploy:
    name: Deploy to Play Store
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Full history for better context

    - name: Set up JDK ${{ env.JAVA_VERSION }}
      uses: actions/setup-java@v4
      with:
        java-version: ${{ env.JAVA_VERSION }}
        distribution: 'temurin'

    - name: Cache Gradle Dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
          ~/.android/build-cache
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-

    - name: Decode Keystore
      run: |
        echo "${{ secrets.KEYSTORE_FILE }}" | base64 -d > app/keystore.jks
        
    - name: Create Service Account JSON
      run: |
        echo '${{ secrets.PLAY_STORE_JSON_KEY }}' > service-account.json

    - name: Extract Version Info
      id: version
      run: |
        VERSION=${GITHUB_REF#refs/tags/v}
        echo "version=$VERSION" >> $GITHUB_OUTPUT
        echo "tag=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
        
    - name: Update Version in Build
      run: |
        # Update version in build.gradle or version.properties
        ./gradlew updateVersionFromTag -PnewVersion=${{ steps.version.outputs.version }}

    - name: Run Tests
      run: |
        ./gradlew test lint
        
    - name: Build Release AAB
      env:
        KEYSTORE_FILE: app/keystore.jks
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: |
        ./gradlew bundleRelease

    - name: Upload to Google Play Store
      env:
        PLAY_STORE_JSON_KEY: service-account.json
      run: |
        ./gradlew publishBundle --track=internal
        
    - name: Upload Build Artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: build-artifacts
        path: |
          app/build/outputs/bundle/release/*.aab
          app/build/reports/

    - name: Create GitHub Release
      uses: softprops/action-gh-release@v1
      with:
        files: app/build/outputs/bundle/release/*.aab
        generate_release_notes: true
        prerelease: false

    - name: Cleanup Sensitive Files
      if: always()
      run: |
        rm -f app/keystore.jks
        rm -f service-account.json

    - name: Notify Success
      if: success()
      uses: 8398a7/action-slack@v3
      with:
        status: success
        text: |
          🚀 Deployment exitoso a Google Play Store!
          📱 App: ${{ github.repository }}
          🏷️ Versión: ${{ steps.version.outputs.version }}
          🔗 Release: ${{ github.server_url }}/${{ github.repository }}/releases/tag/${{ steps.version.outputs.tag }}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

    - name: Notify Failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: |
          ❌ Deployment falló en Google Play Store
          📱 App: ${{ github.repository }}
          🏷️ Versión: ${{ steps.version.outputs.version }}
          🔍 Logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🎛️ Paso 5: Estrategias de Deployment

No todos los deployments son iguales. Dependiendo de tu estrategia, puedes configurar diferentes tracks.

### Deployment Conditional por Branch

```yaml
- name: Deploy to Internal (develop branch)
  if: startsWith(github.ref, 'refs/heads/develop')
  run: ./gradlew publishBundle --track=internal

- name: Deploy to Alpha (alpha tags)
  if: contains(github.ref, 'alpha')
  run: ./gradlew publishBundle --track=alpha

- name: Deploy to Beta (beta tags)  
  if: contains(github.ref, 'beta')
  run: ./gradlew publishBundle --track=beta

- name: Deploy to Production (release tags)
  if: startsWith(github.ref, 'refs/tags/v') && !contains(github.ref, 'alpha') && !contains(github.ref, 'beta')
  run: ./gradlew publishBundle --track=production
```

### Rollout Gradual

Para releases importantes, configura rollout gradual:

```gradle
// En tu build.gradle
play {
    track.set('production')
    userFraction.set(0.1) // Comienza con 10% de usuarios
    defaultToAppBundles.set(true)
    
    releaseStatus.set(com.github.triplet.gradle.androidpublisher.ReleaseStatus.IN_PROGRESS)
}
```

## 🔍 Paso 6: Monitoreo y Troubleshooting

### Logging Avanzado

```yaml
- name: Debug Info
  run: |
    echo "Repository: ${{ github.repository }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    echo "Actor: ${{ github.actor }}"
    ./gradlew tasks --group publishing
```

### Verificación Post-Deployment

```yaml
- name: Verify Upload
  run: |
    # Verificar que el AAB se subió correctamente
    ./gradlew validateUpload
```

### Problemas Comunes y Soluciones

- **❌ Error: "Invalid key file"**: Verifica que el JSON del Service Account está correctamente formateado en GitHub Secrets
- **❌ Error: "Version code already exists"**: Implementa auto-incremento de versionCode basado en timestamp o build number
- **❌ Error: "Keystore was tampered"**: Re-codifica el keystore en base64 asegurándote de no añadir espacios o saltos de línea extra

## 🚀 Paso 7: Funcionalidades Avanzadas

### Auto-incremento de Version Code

```gradle
# En build.gradle
android {
    defaultConfig {
        def buildNumber = System.getenv("GITHUB_RUN_NUMBER") ?: "1"
        versionCode Integer.parseInt(buildNumber)
        versionName version
    }
}
```

### Release Notes Automáticas

```yaml
- name: Generate Release Notes
  id: release_notes
  run: |
    # Obtener cambios desde el último tag
    PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "")
    if [ -n "$PREVIOUS_TAG" ]; then
      CHANGES=$(git log --pretty=format:"• %s" $PREVIOUS_TAG..HEAD)
    else
      CHANGES=$(git log --pretty=format:"• %s" --max-count=10)
    fi
    
    echo "changes<<EOF" >> $GITHUB_OUTPUT
    echo "$CHANGES" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Update Play Store Listing
  run: |
    echo "${{ steps.release_notes.outputs.changes }}" > whatsnew-en-US.txt
    ./gradlew publishListing
```

### Rollback Automático

```yaml
- name: Monitor for Critical Issues
  if: success()
  run: |
    # Esperar 5 minutos y verificar crash rate
    sleep 300
    
    # Aquí integrarías con Firebase Crashlytics o similar
    # Si crash rate > threshold, ejecutar rollback
    
- name: Emergency Rollback
  if: failure()
  run: |
    # Revertir a la versión anterior en producción
    ./gradlew rollbackRelease
```

## Conclusión

Implementar deployment automático a Google Play Store con GitHub Actions puede parecer complejo al principio, pero una vez configurado, transformará completamente tu workflow de desarrollo.

Ya no más deployments manuales propensos a errores, no más "se me olvidó actualizar la versión", no más quedarte despierto esperando que termine el build. GitHub Actions se encarga de todo mientras tú te enfocas en crear features increíbles.

### 🎯 Próximos Pasos
1. Configura un proyecto de prueba antes de implementar en producción
2. Comienza con deployment a track 'internal' para validar el flujo
3. Gradualmente añade más funcionalidades como release notes automáticas
4. Documenta tu workflow para otros miembros del equipo
5. Considera implementar métricas de deployment y monitoreo

Recuerda: la automatización no es solo sobre conveniencia, es sobre consistencia, confiabilidad y calidad. Tu futuro yo (y tu equipo) te lo agradecerán.
