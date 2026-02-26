---
title: "Android 16 (Baklava): Todo lo que necesitas saber de la Developer Preview y Beta"
description: "Android 16 rompe el ciclo tradicional con un lanzamiento anticipado. Descubre las novedades de 'Baklava', desde el Photo Picker embebido hasta la revolución de Health Connect."
pubDate: 2025-01-20
heroImage: "/images/placeholder-article-android-16.svg"
tags: ["Android", "Android 16", "Baklava", "Privacy", "Health Connect", "News"]
reference_id: "be5f8f27-9428-4735-a643-d081c334aeee"
---

## 🚀 Un Cambio de Paradigma: Trunk Stable Project

Si llevas años en el desarrollo de Android, sabes que el Q3 (agosto-septiembre) siempre ha sido la fecha sagrada para el lanzamiento de la nueva versión. **Android 16 rompe esta tradición**. Google ha movido el lanzamiento principal al Q2 (junio de 2025), una decisión impulsada por el proyecto "Trunk Stable".

### ¿Por qué el cambio?
El objetivo es alinear el lanzamiento del sistema operativo con los ciclos de lanzamiento de hardware (Pixel, Galaxy Foldables, etc.). Al tener la API estable antes, los fabricantes pueden integrar la nueva versión en sus dispositivos insignia del año sin esperar meses.

Esto significa que como desarrolladores, **nuestro tiempo de adaptación se ha reducido**. La Beta ya está aquí (enero/febrero 2025), y la estabilidad de la plataforma se espera para marzo.

## 🍰 Baklava: Adiós a los Postres Alfabéticos (Casi)

Internamente, Android 16 se conoce como "Baklava". Si eres observador, notarás que esto rompe el orden alfabético que seguíamos desde Cupcake (Android 15 era "Vanilla Ice Cream"). Esto se debe a un cambio en la infraestructura de compilación interna de Google, donde las ramas de desarrollo ahora siguen nombres de postres sin ataduras alfabéticas estrictas para facilitar el desarrollo continuo.

## 📸 El Nuevo Photo Picker Embebido

Hasta ahora, usar el Photo Picker del sistema significaba lanzar un `Intent` y esperar a que el sistema mostrara una actividad superpuesta. Funcional, pero rompía la inmersión de tu UI.

En Android 16, Google introduce APIs para **embeber el Photo Picker directamente en tu jerarquía de Vistas o Composable**.

```kotlin
// Ejemplo conceptual con Jetpack Compose (Simplificado)
@Composable
fun EmbeddedPickerExample() {
    AndroidView(factory = { context ->
        // Nueva API para crear una vista de selección segura
        PhotoPickerView(context).apply {
            setSelectionMode(SelectionMode.MULTI)
            setOnPhotosSelectedListener { uris ->
                // Manejar URIs sin permisos de READ_EXTERNAL_STORAGE
                processImages(uris)
            }
        }
    })
}
```

Esto mantiene la privacidad (tu app no tiene permiso de lectura a toda la galería) pero se siente como parte nativa de tu aplicación.

## 🏥 Health Connect: Historiales Clínicos en FHIR

Health Connect ha sido una gran adición para compartir pasos y calorías. Android 16 lleva esto al nivel profesional permitiendo a las apps leer y escribir registros médicos en formato **FHIR (Fast Healthcare Interoperability Resources)**.

Imagina una app que no solo cuenta pasos, sino que puede (con permiso explícito del usuario) leer resultados de laboratorio o historiales de vacunación de otras apps médicas certificadas, todo estandarizado.

```kotlin
val record = ImmunizationRecord(
    vaccineCode = "COVID-19",
    occurrenceDateTime = Instant.now(),
    patientId = "patient-123"
)
// Escribir en Health Connect de forma segura
healthConnectClient.insertRecords(listOf(record))
```

## 🔒 Privacy Sandbox: El Fin del Advertising ID

Android 16 acelera la adopción de **Privacy Sandbox**. Si tu modelo de negocio depende del tracking de usuarios entre apps, es hora de preocuparse. Las nuevas APIs restringen aún más el acceso a identificadores persistentes, empujando a los desarrolladores hacia las *Protected Audience APIs* y *Attribution Reporting APIs*.

El mensaje es claro: **La privacidad no es negociable**.

## ☕ Java 21: Records y Pattern Matching

Aunque Kotlin es el rey, el runtime de Android 16 se actualiza para soportar completamente las características de **OpenJDK 21**. Esto beneficia indirectamente a Kotlin (mejor interoperabilidad y rendimiento) y directamente a las librerías que aún dependen de Java.

Ahora podemos ver optimizaciones en el compilador D8/R8 que aprovechan estas nuevas instrucciones de la JVM.

## ⚠️ Lo que debes hacer AHORA

1.  **Instala la Preview:** Configura el emulador "Baklava" en Android Studio.
2.  **Revisa `targetSdk 36`:** Aunque no sea obligatorio todavía, compila tu app contra la SDK 36 (o "Baklava" preview) para ver qué se rompe.
3.  **Audita tus Permisos:** Especialmente si accedes a fotos o salud.

## 🎯 Conclusión

Android 16 no es solo "otra versión". Es el comienzo de una era más ágil y orientada a la privacidad y la salud. El calendario acelerado nos obliga a estar más atentos que nunca. No esperes a agosto; el futuro llega en junio.

---

## 📚 Bibliografía y Referencias

Para la redacción de este artículo, se han consultado las siguientes fuentes oficiales y de actualidad:

*   **Android Developers Blog:** *The First Developer Preview of Android 16* - [Enlace Oficial](https://android-developers.googleblog.com/)
*   **Android 16 Release Timeline:** Documentación sobre el nuevo ciclo de releases Q2 - [Developer.android.com](https://developer.android.com/about/versions/16)
*   **Privacy Sandbox on Android:** Documentación técnica sobre las nuevas APIs de privacidad - [Privacy Sandbox](https://developer.android.com/design-for-safety/privacy-sandbox)
*   **Health Connect FHIR Support:** Guía de integración de registros médicos - [Android Health](https://developer.android.com/health-and-fitness/health-connect)
