---
title: "Gemini Nano en Android: IA On-Device sin Depender de la Nube"
description: "Aprende a integrar Gemini Nano en Android vía Android AI Core. Casos de uso reales, snippets Kotlin y cuándo usar on-device vs. cloud."
pubDate: 2026-03-08
heroImage: "/images/blog-gemini-nano-on-device.svg"
tags: ["Android", "IA", "Gemini Nano", "On-Device AI", "Android AI Core", "LiteRT"]
draft: false
---

> Antes de entrar en materia, si te interesa el contexto arquitectónico más amplio de la IA local en Android, estos dos artículos son lectura obligatoria:
>
> - **[Arquitectura de Inferencia Local: Integrando LiteRT en Clean Architecture](/blog/local-inference-architecture)** — Cómo desacoplar correctamente los modelos on-device usando los principios de Clean Architecture.
> - **[Patrones de Sincronización Offline-First Potenciados por IA](/blog/offline-first-ai-patterns)** — Cómo combinar IA local con estrategias de datos offline-first.

---

En mayo de 2024, Google anunció algo que parecía ciencia ficción hace dos años: **Gemini Nano corriendo directamente en el dispositivo**, sin enviar ningún dato a la nube, en teléfonos Pixel (y progresivamente en más dispositivos Android compatibles). En 2026, con Android AI Core maduro y el ecosistema de modelos on-device creciendo, es el momento de entender cómo integrarlo de verdad en tus apps.

Este artículo no es un overview de marketing. Vamos a ver el código, las limitaciones reales, y cuándo tiene sentido on-device vs. cuándo la nube sigue siendo la respuesta correcta.

## 🧩 Qué es Gemini Nano y cómo llega al dispositivo

Gemini Nano es la versión más pequeña de la familia Gemini de Google, optimizada específicamente para ejecución en hardware móvil. No es un modelo de uso general reducido a la fuerza: está diseñado desde cero para funcionar con las restricciones de memoria, batería y thermal budget de un smartphone.

El modelo no se distribuye con tu APK. Llega al dispositivo a través de **Android AI Core**, un servicio del sistema que gestiona la descarga, actualización y servicio del modelo de forma centralizada. Esto tiene varias implicaciones importantes:

- Tu app no aumenta de tamaño por incluir el modelo.
- El modelo se actualiza de forma independiente a tu app.
- Múltiples apps comparten el mismo modelo en memoria (eficiencia).
- El acceso requiere que el dispositivo sea compatible y que el modelo esté disponible localmente.

> **Runtime:** Gemini Nano usa **LiteRT** (anteriormente TensorFlow Lite) como runtime de inferencia en Android, optimizado con aceleración de hardware vía Neural Networks API (NNAPI) y los NPUs disponibles en el SoC.

## 📱 Dispositivos Compatibles y Requisitos

En el momento de escribir este artículo (marzo 2026), Gemini Nano está disponible en:

- **Pixel 8, 8 Pro, 8a, 9, 9 Pro, 9 Pro XL** (soporte completo via AICore)
- **Samsung Galaxy S24 serie** (vía Samsung AI, subset de capacidades)
- **Dispositivos con Snapdragon 8 Gen 3** (soporte progresivo)

**Requisitos mínimos del sistema:**
- Android 10+ para AICore básico
- Android 14+ para las APIs más recientes de Gemini Nano
- Al menos 6 GB de RAM recomendados
- ~1.7 GB de almacenamiento para el modelo base

Si tu app tiene un target de dispositivos amplio, necesitas manejar el caso donde el modelo *no está disponible* de forma elegante (más sobre esto abajo).

## 🔌 Integración con Android AI Core: El Código Real

Vamos a lo que importa. La API de acceso a Gemini Nano desde Android se hace a través del paquete `com.google.android.gms.ai` (Google Play Services AI).

### Dependencias en `libs.versions.toml`

```kotlin
// libs.versions.toml
[versions]
google-ai-client = "16.0.0"

[libraries]
google-ai-generative = { group = "com.google.android.gms", name = "play-services-mlkit-text-recognition", version.ref = "google-ai-client" }
// Para Android AI Core (Gemini Nano on-device):
google-aicore = { group = "com.google.ai.edge.aicore", name = "aicore", version = "0.0.1-exp01" }
```

### Configuración y comprobación de disponibilidad

```kotlin
// domain/ai/OnDeviceInferenceRepository.kt
interface OnDeviceInferenceRepository {
    suspend fun isAvailable(): Boolean
    suspend fun generateText(prompt: String): Result<String>
    suspend fun generateTextStreaming(prompt: String): Flow<String>
}

// data/ai/GeminiNanoRepository.kt
class GeminiNanoRepository(
    private val context: Context
) : OnDeviceInferenceRepository {

    private var generativeModel: GenerativeModel? = null

    override suspend fun isAvailable(): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val availability = GenerativeModel.checkAvailability(context)
                availability == AvailabilityStatus.AVAILABLE
            } catch (e: Exception) {
                false
            }
        }
    }

    private suspend fun getOrInitModel(): GenerativeModel {
        return generativeModel ?: run {
            val model = GenerativeModel.getInstance(
                modelName = "gemini-nano",
                context = context,
                generationConfig = generationConfig {
                    temperature = 0.7f
                    maxOutputTokens = 512
                    topK = 40
                }
            )
            generativeModel = model
            model
        }
    }

    override suspend fun generateText(prompt: String): Result<String> {
        return withContext(Dispatchers.Default) {
            runCatching {
                val model = getOrInitModel()
                val response = model.generateContent(prompt)
                response.text ?: throw IllegalStateException("Empty response from Gemini Nano")
            }
        }
    }

    override suspend fun generateTextStreaming(prompt: String): Flow<String> {
        return flow {
            val model = getOrInitModel()
            model.generateContentStream(prompt).collect { chunk ->
                chunk.text?.let { emit(it) }
            }
        }.flowOn(Dispatchers.Default)
    }
}
```

### UseCase con manejo del fallback a cloud

```kotlin
// domain/ai/GenerateSmartSummaryUseCase.kt
class GenerateSmartSummaryUseCase(
    private val onDeviceRepo: OnDeviceInferenceRepository,
    private val cloudRepo: CloudInferenceRepository,  // Fallback
    private val userPreferences: UserPreferencesRepository
) {
    sealed class InferenceSource {
        object OnDevice : InferenceSource()
        object Cloud : InferenceSource()
    }

    data class SummaryResult(
        val text: String,
        val source: InferenceSource
    )

    suspend operator fun invoke(content: String): Result<SummaryResult> {
        val privacyModeEnabled = userPreferences.isPrivacyModeEnabled()

        // Si privacy mode está activo, solo usamos on-device
        if (privacyModeEnabled) {
            return onDeviceRepo.generateText(buildSummaryPrompt(content))
                .map { SummaryResult(it, InferenceSource.OnDevice) }
        }

        // Intentamos on-device primero; si falla, cloud como fallback
        return if (onDeviceRepo.isAvailable()) {
            onDeviceRepo.generateText(buildSummaryPrompt(content))
                .map { SummaryResult(it, InferenceSource.OnDevice) }
                .recoverCatching {
                    cloudRepo.generateText(buildSummaryPrompt(content))
                        .getOrThrow()
                        .let { SummaryResult(it, InferenceSource.Cloud) }
                }
        } else {
            cloudRepo.generateText(buildSummaryPrompt(content))
                .map { SummaryResult(it, InferenceSource.Cloud) }
        }
    }

    private fun buildSummaryPrompt(content: String): String {
        return """Summarize the following content in 2-3 sentences, 
            |keeping the key technical points:
            |
            |$content""".trimMargin()
    }
}
```

## 🎯 Casos de Uso donde Gemini Nano Brilla

No todos los casos de uso de IA tienen sentido on-device. Aquí están los que genuinamente se benefician:

### ✅ Funciona muy bien on-device

**Resúmenes de contenido local:** Resumir notas, emails, o artículos directamente en el dispositivo sin que el texto salga a ningún servidor. Ideal para apps de productividad con datos sensibles.

**Smart Compose / Autocompletado contextual:** Sugerencias de texto basadas en el contexto de la pantalla actual, con latencia <100ms que no es posible con una llamada a cloud.

**Clasificación y etiquetado de contenido offline:** Categorizar notas, fotos (con descripción de texto), o tareas cuando no hay conexión.

**Detección de tono/sentimiento local:** Analizar el tono de un mensaje antes de enviarlo, sin que el borrador salga del dispositivo.

**Respuestas rápidas sugeridas:** En apps de mensajería, sugerir respuestas cortas basadas en el mensaje recibido con latencia ultra-baja.

### ❌ Mejor usar cloud

- Tareas que requieren conocimiento actualizado (noticias, precios, datos en tiempo real).
- Generación de código complejo o análisis profundo de lógica de negocio.
- Multimodalidad avanzada (análisis de imágenes complejas, video).
- Cuando el contexto necesita superar los ~2048 tokens (Gemini Nano tiene ventana de contexto limitada).
- Dispositivos no compatibles o con modelo no descargado.

## ⚠️ Limitaciones Reales que Debes Conocer

Ser honesto sobre las limitaciones es fundamental para tomar buenas decisiones arquitectónicas:

**Disponibilidad no garantizada:** El modelo puede no estar descargado cuando el usuario lo necesita por primera vez. La primera ejecución puede requerir descarga de ~1.7 GB.

**Ventana de contexto reducida:** Gemini Nano tiene una ventana de contexto significativamente menor que sus versiones cloud (aprox. 2048 tokens vs. 1M en Gemini 1.5 Pro). No es adecuado para análisis de documentos largos.

**Capacidades razonamiento limitadas:** Para tareas de razonamiento multi-paso complejo (math, código complejo, análisis lógico profundo), la versión cloud supera claramente a Nano.

**No hay Fine-tuning de usuario:** No puedes personalizar Gemini Nano con tus propios datos de entrenamiento (a diferencia de algunos modelos on-device alternativos como MediaPipe con TFLite).

**Thermal throttling:** En sesiones largas de inferencia en dispositivos con thermal management agresivo, la velocidad de inferencia puede degradarse.

## Conclusión

Gemini Nano en Android representa un cambio genuino en cómo podemos construir apps con IA: privacidad por diseño, sin latencia de red, funcionando offline. La integración vía Android AI Core está lo suficientemente madura como para usarla en producción, siempre que diseñes correctamente el flujo de disponibilidad y el fallback.

La regla de oro: **usa on-device cuando la privacidad, la latencia o la disponibilidad offline sean requisitos no negociables; usa cloud cuando necesites máxima capacidad, contexto largo, o reasoning profundo**. El patrón de `UseCase` con fallback explícito que hemos visto es tu mejor amigo para gestionar este tradeoff de forma limpia en Clean Architecture.

## Referencias

1. **Android AI Core — Developer Guide** — Google. *Integrating Gemini Nano with Android AI Core.* [https://developer.android.com/ml/android-ai-core](https://developer.android.com/ml/android-ai-core)

2. **Gemini Nano Overview** — Google DeepMind. *Gemini: A Family of Highly Capable Multimodal Models.* [https://deepmind.google/technologies/gemini/nano/](https://deepmind.google/technologies/gemini/nano/)

3. **LiteRT (TensorFlow Lite) Documentation** — Google. *On-device ML Inference for Android.* [https://ai.google.dev/edge/litert](https://ai.google.dev/edge/litert)

4. **Building AI-powered features with Gemini Nano** — Google I/O 2024. Android Developers Blog. [https://android-developers.googleblog.com](https://android-developers.googleblog.com)

5. **Privacy-Preserving Machine Learning** — Coursera / Google. *On-device AI for Mobile Applications.* [https://developers.google.com/ml-kit](https://developers.google.com/ml-kit)
