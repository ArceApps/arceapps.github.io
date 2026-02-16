---
title: "GitHub Actions para Google Play Store: La Guía Definitiva de CD en Android"
description: "Aprende a configurar un pipeline de Continuous Deployment robusto que compile, firme y publique tu App Android automáticamente en Google Play Store."
pubDate: 2025-10-30
heroImage: "/images/placeholder-article-github-actions-play-store.svg"
tags: ["GitHub Actions", "Android", "Google Play Store", "CI/CD", "DevOps"]
---
## 🚀 El Santo Grial del Desarrollo Android

Imagina este escenario: terminas una feature, haces merge a `main`, y te vas a tomar un café. 20 minutos después, tu Project Manager te dice: "Ya lo estoy probando en mi teléfono".
Sin abrir Android Studio, sin generar APKs manualmente, sin pelear con Keystores, y sin entrar a la consola de Google Play.

Esto no es magia; es **Continuous Deployment (CD)** bien configurado. Hoy vamos a construir ese pipeline paso a paso.

## 🏗️ Requisitos Previos (La Burocracia)

Antes de tocar código, necesitamos permisos. Google Play es muy estricto con la seguridad (y con razón).

### 1. Google Play Console API Access
Necesitamos una "Service Account" (un usuario robot) que tenga permiso para subir builds.

1.  Ve a **Google Play Console** -> **Setup** -> **API access**.
2.  Crea un nuevo proyecto de Google Cloud (o selecciona uno existente).
3.  Ve a **Google Cloud Console** -> **IAM & Admin** -> **Service Accounts**.
4.  Crea una Service Account y dale el rol de **Service Account User**.
5.  Crea una **Key JSON** para esa cuenta y descárgala. **¡GUÁRDALA COMO ORO!**
6.  Vuelve a Play Console, busca la cuenta (email) en "Users & permissions" y dale permisos de **Admin** (o al menos Release Manager).

### 2. Secretos en GitHub
Nunca subas el JSON o tu Keystore al repo. Usa **GitHub Secrets**.

Ve a `Settings -> Secrets and variables -> Actions` y añade:
- `PLAY_STORE_JSON_KEY`: El contenido del JSON que descargaste.
- `KEYSTORE_FILE_BASE64`: Tu archivo `.jks` convertido a Base64.
    - *Tip:* Usa `base64 -w 0 my-key.jks > key_b64.txt` en Linux/Mac.
- `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`: Los datos de tu firma.

## ⚙️ El Workflow: `deploy.yml`

Vamos a usar la excelente acción `r0adkll/upload-google-play` (o la oficial si prefieres `gradle-play-publisher`).

```yaml
name: Deploy to Play Store

on:
  push:
    tags:
      - 'v*' # Solo despliega cuando creas un tag como v1.0.0

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      # 1. Decodificar Keystore
      - name: Decode Keystore
        run: |
          echo "${{ secrets.KEYSTORE_FILE_BASE64 }}" | base64 -d > app/release.keystore

      # 2. Build App Bundle (AAB)
      # Nota: Inyectamos los secretos como variables de entorno
      - name: Build Release AAB
        run: ./gradlew bundleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      # 3. Subir a Play Store
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_JSON_KEY }}
          packageName: com.tudominio.app
          releaseFiles: app/build/outputs/bundle/release/app-release.aab
          track: internal # O 'production', 'alpha', 'beta'
          status: completed
          whatsNewDirectory: distribution/whatsnew
```

## 🔐 Firma de APKs en Gradle (Sin Hardcodear)

Tu `build.gradle` debe estar preparado para leer variables de entorno, no archivos locales que no existen en el CI.

```kotlin
// app/build.gradle.kts
signingConfigs {
    create("release") {
        // En CI leemos el archivo generado. En local, puedes tener un archivo dummy o properties.
        storeFile = file("release.keystore")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}
```

## 🧪 Estrategias de Release (Tracks)

Google Play tiene "carriles" (tracks). Tu estrategia de CD debe usarlos inteligentemente.

### 1. Internal Track (`internal`)
- **Uso**: Para QA y el equipo de desarrollo.
- **Disponibilidad**: Inmediata (minutos).
- **Trigger**: Cada merge a `develop` o cada noche (`cron`).

### 2. Alpha/Beta Track
- **Uso**: Para "Dogfooding" (empleados de la empresa) o Beta Testers públicos.
- **Disponibilidad**: Requiere revisión de Google (horas/días).
- **Trigger**: Merge a rama `release/*`.

### 3. Production Track
- **Uso**: El mundo entero.
- **Disponibilidad**: Revisión exhaustiva.
- **Trigger**: Tag de versión (`v1.0.0`) + Aprobación manual (GitHub Environments).

## ⚡ Automatización de "What's New"

¿Odias escribir las notas de la versión en la consola de Google? Puedes automatizarlo.
Crea una carpeta `distribution/whatsnew` y pon archivos como `whatsnew-en-US.txt`.

**Truco Pro**: Genera este archivo dinámicamente en el CI basándote en los commits.

```yaml
      - name: Generate What's New
        run: |
          git log --format="- %s" $(git describe --tags --abbrev=0 HEAD^)..HEAD > distribution/whatsnew/whatsnew-en-US.txt
```

## 🛑 Errores Comunes (Troubleshooting)

1.  **Error 403 (Permission Denied)**: Tu Service Account no tiene permisos en la Play Console. Revisa el paso 1.6.
2.  **Version Code Conflict**: Intentas subir el `versionCode: 10` cuando ya existe uno igual o mayor.
    *   *Solución*: Automatiza el versionado (ver [artículo de versionado](blog-automated-versioning.md)).
3.  **Keystore Corrupto**: El base64 se copió mal (con saltos de línea extra).
    *   *Solución*: Usa `base64 -w 0` para que sea una sola línea.

## 🎯 Conclusión

Automatizar el despliegue a Google Play Store es la diferencia entre un proceso "artesanal" y uno de "ingeniería industrial". Eliminas el error humano, aseguras la reproducibilidad de los builds y, lo más importante, recuperas tu tiempo para seguir creando valor, no moviendo archivos.
