---
title: "Arquitectura de Inferencia Local: Integrando LiteRT en Clean Architecture"
description: "Guía para desacoplar modelos de IA on-device como Gemini Nano utilizando los principios de Clean Architecture en Android 16."
pubDate: 2026-02-05
heroImage: "/images/tech-edge-ai-arch.svg"
tags: ["Android", "AI", "Clean Architecture", "LiteRT", "Gemini Nano", "On-Device AI"]
---

Con el lanzamiento de **Android 16 (Baklava)** y la estabilización de **LiteRT** (anteriormente TensorFlow Lite), ejecutar modelos de IA de alto rendimiento directamente en los dispositivos de los usuarios se ha convertido en la norma más que en la excepción. Ya sea utilizando **Gemini Nano** para resumir textos o un modelo personalizado cuantizado para segmentación de imágenes, el desafío para los ingenieros Android ha pasado de "¿cómo ejecuto esto?" a "¿cómo arquitecturo esto de manera mantenible?".

En este artículo, exploraremos cómo integrar motores de inferencia local en una configuración robusta de **Clean Architecture**, asegurando que tu UI permanezca desacoplada de la implementación subyacente del modelo.

> **Lectura Relacionada:** Si eres nuevo en Clean Architecture o DI, echa un vistazo a mis artículos anteriores sobre [Clean Architecture](/es/blog/clean-architecture) e [Inyección de Dependencias](/es/blog/dependency-injection).

## El Problema: Abstracciones con Fugas

Es tentador instanciar un `GenerativeModel` o un `Interpreter` directamente en un `ViewModel`. Sin embargo, esto conduce a varios problemas:
1.  **Vendor Lock-in:** Cambiar de TFLite a ONNX Runtime o MediaPipe se convierte en una pesadilla de refactorización.
2.  **Testing:** Hacer mock de un intérprete nativo en pruebas unitarias es difícil y lento.
3.  **Gestión del Ciclo de Vida:** Los modelos a menudo necesitan una gestión cuidadosa de recursos (carga/cierre) que no debería ensuciar la capa de UI.

## La Solución: Capas Arquitectónicas

Podemos tratar el Modelo de IA simplemente como otra **Fuente de Datos**.

### 1. Capa de Dominio: Abstracciones Puras

La capa de dominio debe definir *qué* hace el modelo, no *cómo* lo hace.

```kotlin
// domain/models/SentimentResult.kt
sealed class SentimentResult {
    data class Success(val score: Float, val label: String) : SentimentResult()
    data class Error(val message: String) : SentimentResult()
}

// domain/repository/InferenceRepository.kt
interface InferenceRepository {
    suspend fun analyzeSentiment(text: String): SentimentResult
}
```

### 2. Capa de Datos: La Implementación (LiteRT)

Aquí es donde vive el framework específico de IA. Ocultamos la complejidad de la manipulación de `ByteBuffer` y la ejecución del intérprete detrás de la implementación del repositorio.

```kotlin
// data/datasource/LiteRTDataSource.kt
class LiteRTDataSource(
    context: Context,
    private val modelPath: String = "sentiment_v2.tflite"
) {
    private var interpreter: Interpreter? = null

    suspend fun predict(input: String): FloatArray = withContext(Dispatchers.IO) {
        ensureInitialized()
        val inputBuffer = preprocess(input)
        val outputBuffer = Array(1) { FloatArray(2) } // [Negativo, Positivo]

        interpreter?.run(inputBuffer, outputBuffer)

        return@withContext outputBuffer[0]
    }

    private fun ensureInitialized() {
        if (interpreter == null) {
            val options = Interpreter.Options().apply {
                addDelegate(GpuDelegate()) // Aprovechar aceleración por hardware
            }
            interpreter = Interpreter(FileUtil.loadMappedFile(context, modelPath), options)
        }
    }
}
```

Luego, el Repositorio mapea estos datos crudos a objetos de Dominio.

```kotlin
// data/repository/RealInferenceRepository.kt
class RealInferenceRepository(
    private val dataSource: LiteRTDataSource
) : InferenceRepository {

    override suspend fun analyzeSentiment(text: String): SentimentResult {
        return try {
            val rawOutput = dataSource.predict(text)
            val score = rawOutput[1] // Probabilidad Positiva
            val label = if (score > 0.7) "Positivo" else "Neutral/Negativo"
            SentimentResult.Success(score, label)
        } catch (e: Exception) {
            SentimentResult.Error(e.message ?: "Error de inferencia desconocido")
        }
    }
}
```

### 3. Capa de Presentación: Conocimiento Cero

El `ViewModel` simplemente llama a un Caso de Uso, completamente ajeno a si el resultado provino de una API en la nube o de una ejecución local en la NPU.

```kotlin
// presentation/AnalysisViewModel.kt
@HiltViewModel
class AnalysisViewModel @Inject constructor(
    private val analyzeUseCase: AnalyzeSentimentUseCase
) : ViewModel() {

    fun onAnalyzeClick(text: String) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            val result = analyzeUseCase(text)
            _uiState.value = when(result) {
                is SentimentResult.Success -> UiState.Result(result.label)
                is SentimentResult.Error -> UiState.Error(result.message)
            }
        }
    }
}
```

## Consideraciones de Rendimiento

Ejecutar modelos en el borde (edge) requiere respetar las limitaciones del dispositivo:
*   **Offload a NPU:** Usa siempre delegados como NNAPI o el nuevo Google AI Edge Delegate cuando sea posible.
*   **Fuera del Hilo Principal:** La inferencia puede tardar desde 100ms hasta varios segundos.
*   **Batching:** Si procesas múltiples elementos, agrúpalos para reducir la sobrecarga.

## Conclusión

Al tratar los motores de inferencia local como Fuentes de Datos, ganamos la flexibilidad para cambiar modelos, actualizar librerías (ej., migrar a **LiteRT**) o recurrir a APIs en la nube sin tocar nuestro código de UI. Esta es la esencia de una arquitectura Android sostenible en la era de la IA.

## Bibliografía y Referencias

1.  [Google AI Edge Documentation](https://ai.google.dev/edge)
2.  [LiteRT Guide](https://ai.google.dev/edge/litert)
3.  [Android Clean Architecture Guide](/es/blog/clean-architecture)
