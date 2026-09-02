---
title: "Firebase Crashlytics: Monitorización Proactiva de Errores"
description: "Pasa de reactivo a proactivo. Configura Firebase Crashlytics para detectar, agrupar y solucionar errores críticos antes de que tus usuarios se quejen."
pubDate: 2025-09-25
lastmod: 2025-09-25
author: ArceApps
keywords:
  - "Firebase Crashlytics"
  - "Monitorización"
  - "Errores"
  - "Android"
  - "Proactiva"
canonical: "https://arceapps.com/es/blog/firebase-crashlytics/"
heroImage: "/images/placeholder-article-firebase.svg"
tags: ["Firebase", "Crashlytics", "Monitoring", "DevOps", "Quality"]
category: cicd
reference_id: "d50cb3e0-09c6-48eb-a2e9-cb9758d2f149"
---


## 🚨 Teoría: La Pirámide de la Observabilidad

En DevOps, la monitorización no es binaria (funciona/no funciona). Existen niveles:

1.  **Crashes (Fatal)**: La app se cerró. Prioridad 0.
2.  **Non-Fatals (Errores lógicos)**: La app no se cerró, pero falló el pago o no cargó la lista. Silenciosos y mortales para el negocio.
3.  **ANRs (Application Not Responding)**: La UI se congeló por más de 5 segundos. Destruye la UX.

Firebase Crashlytics cubre los tres, pero solo si lo configuras correctamente.

## 🛠️ Configuración Avanzada: Más allá del Plugin

Instalar el plugin es fácil. Lo difícil es hacer que los reportes sean **accionables**.

### 1. Custom Keys: El Contexto es Todo
Cuando ves un crash `NullPointerException` en `UserProfileFragment`, te preguntas: "¿Qué estaba haciendo el usuario?".

Usa Custom Keys para inyectar estado en el reporte:

```kotlin
FirebaseCrashlytics.getInstance().apply {
    setCustomKey("current_screen", "UserProfile")
    setCustomKey("user_tier", "Premium")
    setCustomKey("device_orientation", "Landscape")
    setCustomKey("has_connectivity", false)
}
```

Ahora, en la consola, puedes filtrar: "Muéstrame todos los crashes que ocurren a usuarios Premium sin conectividad".

### 2. Custom Logs: La Caja Negra
A veces el stacktrace no es suficiente. Necesitas saber los pasos previos (breadcrumbs).

```kotlin
fun logBreadcrumb(message: String) {
    // Esto no se envía inmediatamente. Se guarda en memoria circular.
    // Solo se envía SI ocurre un crash después.
    FirebaseCrashlytics.getInstance().log(message)
}

// Uso
logBreadcrumb("User clicked Buy Button")
logBreadcrumb("Starting payment transaction")
// CRASH! -> El reporte incluirá estos logs.
```

### 3. Reportando Non-Fatals (Errores Silenciosos)
Usa `recordException` para errores capturados en `try-catch` que son críticos para el negocio.

```kotlin
try {
    processPayment()
} catch (e: PaymentException) {
    // No dejamos que la app crashee, mostramos un dialog.
    // PERO, avisamos a Crashlytics.
    FirebaseCrashlytics.getInstance().recordException(e)
    showErrorDialog()
}
```

## 🔍 De-obfuscation y ProGuard

Si usas R8/ProGuard (y deberías), tus stacktraces en producción se verán así:
`at a.b.c.d(SourceFile:1)`

Para ver el código real, necesitas subir el archivo `mapping.txt` a Firebase.
El plugin de Gradle lo hace automáticamente, pero en CI/CD a veces falla.

**Tip de CI**: Asegúrate de ejecutar la tarea `uploadCrashlyticsMappingFileRelease` en tu pipeline de GitHub Actions después de compilar el release.

## 📊 Integración con BigQuery

Crashlytics te da dashboards bonitos, pero limitados. Para análisis profundo, exporta a BigQuery.

**Preguntas que BigQuery puede responder:**
- "¿Cuál es la tasa de crashes por versión de Android específica?"
- "¿Los usuarios que sufren este crash abandonan la app para siempre?"
- "¿Este crash está correlacionado con una versión específica de WebView?"

## 🛡️ Crash Free Users vs Crash Free Sessions

Entiende la métrica:
- **Crash Free Users (99%)**: El 1% de tus usuarios tuvo un crash. Si tienes 1M usuarios, 10,000 personas tuvieron una mala experiencia.
- **Crash Free Sessions (99.9%)**: Parece mejor, pero puede ser engañoso si un usuario tiene un crash loop al inicio.

**Objetivo**: Apunta a >99.9% de Crash Free Users para apps estables.

## 🎯 Conclusión

Crashlytics no es solo para ver stacktraces. Es tu ventana a la salud de tu aplicación en el mundo real. Configura Custom Keys y Logs hoy mismo; el próximo bug difícil de reproducir te lo agradecerá.
