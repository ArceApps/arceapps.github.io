---
title: "SLMs vs LLMs para Android: Cuándo Ejecutar la IA en el Dispositivo"
description: "Guía práctica para elegir entre modelos pequeños on-device (Gemini Nano, Phi-3 Mini) y LLMs en la nube para tu app Android: latencia, privacidad, coste y batería."
pubDate: 2026-03-09
heroImage: "/images/blog-slms-vs-llms-android.svg"
tags: ["Android", "IA", "SLM", "LLM", "On-Device AI", "Gemini Nano", "LiteRT", "Eficiencia"]
draft: false
---

> Este artículo asume familiaridad con inferencia de modelos en Android. Si aún no conoces los patrones de arquitectura para IA local, te recomiendo estos artículos antes de continuar:
>
> - **[Arquitectura para Inferencia Local en Android](/blog/local-inference-architecture)** — Cómo estructurar tu app para soportar modelos on-device.
> - **[Gemini Nano en Android: IA On-Device Práctica](/blog/blog-gemini-nano-android-on-device)** — Implementación paso a paso con la AICore API de Google.
> - **[Patrones Offline-First con IA en Android](/blog/offline-first-ai-patterns)** — Estrategias para apps que funcionan sin conexión usando modelos locales.

---

La pregunta lleva meses rondando en las conversaciones de equipos Android: *¿lanzamos nuestras inferencias a la nube o las ejecutamos en el dispositivo?* Y la respuesta honesta es que **no hay una respuesta única**. Depende de tu caso de uso, de tus usuarios, de tu modelo de negocio, y de cuánta complejidad estás dispuesto a asumir en tu arquitectura.

Este artículo te da el framework de decisión que necesitas para responder esa pregunta en tu contexto específico.

## 🧠 El Espacio del Problema: SLMs vs LLMs

Antes de la comparativa, alineemos terminología porque el sector la usa de forma bastante laxa.

**LLM (Large Language Model):** Modelos con miles de millones de parámetros (7B+), generalmente accedidos via API en la nube. GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet. Potentes, versátiles, caros por inferencia.

**SLM (Small Language Model):** Modelos más pequeños (1B-7B parámetros), optimizados para ejecutarse en hardware limitado. Gemini Nano (~1.8B), Phi-3 Mini (3.8B), Llama 3.2 1B/3B. Más limitados en capacidad, pero ejecutables directamente en tu teléfono.

> **La distinción clave no es solo el tamaño, es *dónde* ejecutas la inferencia.** Un LLM también podría ejecutarse on-device si el hardware lo permite (y hay teléfonos gaming con 16GB de RAM donde esto empieza a ser viable). Pero en práctica, en 2026, on-device = SLM para la mayoría de los dispositivos Android.

## ⚖️ Los Cinco Ejes de Decisión

Para elegir entre on-device (SLM) y cloud (LLM), evalúa tu caso de uso en estos cinco ejes:

### 1. Latencia

Los LLMs en la nube tienen una latencia de red que ronda los 300-1500ms para el primer token, más el tiempo de generación. Para apps conversacionales o de asistencia en tiempo real, esto se nota.

Los SLMs on-device arrancan en 50-200ms y generan tokens a 10-40 tokens/segundo en hardware moderno (Tensor G4, Snapdragon 8 Gen 3). Sin variabilidad de red, sin dependencia de la carga del servidor.

**Elige on-device si:** La respuesta debe aparecer mientras el usuario escribe, o si la percepción de velocidad es crítica para la UX.

### 2. Privacidad

Con un LLM en la nube, los datos del usuario (su consulta, su contexto) salen del dispositivo. Aunque los proveedores tienen políticas de no almacenamiento, el dato viaja por la red y pasa por su infraestructura.

Con un SLM on-device, los datos nunca abandonan el dispositivo. La inferencia ocurre completamente local.

**Elige on-device si:** Tu app procesa datos sensibles (salud, finanzas, mensajes privados, datos biométricos). También si tu mercado objetivo incluye usuarios con restricciones corporativas o regulatorias (GDPR, HIPAA).

### 3. Coste por Inferencia

Los LLMs de API cobran por token. GPT-4o: ~$0.005/1K input tokens. Para una app con un millón de usuarios activos que hace 10 consultas diarias de 500 tokens cada una, estás hablando de $25,000/día. Los números escalan rápido.

Los SLMs on-device tienen coste marginal cero por inferencia adicional. El coste es el tiempo de ingeniería para integrarlos y el impacto en el tamaño del APK.

**Elige on-device si:** Tu modelo de negocio no incluye monetización por inferencia, o si el volumen de consultas hace que el coste de API sea prohibitivo.

### 4. Capacidad del Modelo

Aquí los LLMs ganan sin discusión. Razonamiento complejo, generación de código largo, análisis de documentos extensos, comprensión multimodal avanzada — los modelos grandes son significativamente mejores.

Los SLMs son buenos para: clasificación de intenciones, extracción de entidades, resúmenes cortos, completado de texto simple, reescritura de frases, respuestas a preguntas con contexto acotado.

**Elige cloud si:** La tarea requiere razonamiento profundo, knowledge general amplio, o generación de contenido extenso y complejo.

### 5. Consumo de Batería

La inferencia on-device consume CPU/GPU/NPU del dispositivo. Un SLM de 3B parámetros ejecutando 100 tokens puede consumir entre 50-200mJ dependiendo del hardware, lo que se acumula si las inferencias son frecuentes.

Los LLMs en la nube consumen solo el radio (WiFi/5G) para enviar y recibir datos — generalmente menor que ejecutar el modelo localmente.

**Elige cloud si:** Tu app hace inferencias muy frecuentes en segundo plano, o si tus usuarios son especialmente sensibles a la duración de la batería.

## 📊 Tabla Comparativa de SLMs para Android

| Modelo | Parámetros | RAM mínima | Tokens/seg (Pixel 8) | Ventana contexto | Licencia |
|--------|-----------|------------|---------------------|-----------------|---------|
| **Gemini Nano** | ~1.8B | 4GB | 20-40 | 512 tokens | Propietaria (via AICore) |
| **Phi-3 Mini** | 3.8B | 4GB | 15-25 | 4K tokens | MIT |
| **Llama 3.2 1B** | 1B | 2GB | 30-50 | 128K tokens | Llama 3 Community |
| **Llama 3.2 3B** | 3B | 4GB | 18-30 | 128K tokens | Llama 3 Community |
| **Gemma 2 2B** | 2B | 3GB | 22-35 | 8K tokens | Gemma Terms |

> **Nota sobre Gemini Nano:** Al usar la API de AICore de Google, no descargas el modelo tú mismo — Google lo gestiona en el sistema. Esto significa menor control sobre la versión y disponibilidad (solo dispositivos certificados Android con feature level 35+), pero también zero overhead de descarga para el usuario.

## 🏗️ Selector Dinámico: Cloud o Local Según Contexto

El patrón más robusto no es elegir uno para siempre, sino **implementar ambos y decidir en tiempo de ejecución** según las condiciones del momento.

```kotlin
// InferenceRouter.kt
class InferenceRouter(
    private val onDeviceProvider: OnDeviceInferenceProvider,
    private val cloudProvider: CloudInferenceProvider,
    private val networkMonitor: NetworkMonitor,
    private val deviceCapabilityChecker: DeviceCapabilityChecker
) {
    
    suspend fun route(request: InferenceRequest): InferenceProvider {
        return when {
            // Datos sensibles → siempre local
            request.containsSensitiveData -> {
                onDeviceProvider.takeIf { it.isAvailable() }
                    ?: throw InferenceException("On-device required for sensitive data but not available")
            }
            
            // Sin conexión → local o error
            !networkMonitor.isConnected() -> {
                onDeviceProvider.takeIf { it.isAvailable() }
                    ?: throw InferenceException("No network and on-device not available")
            }
            
            // Tarea compleja → nube
            request.complexity == Complexity.HIGH -> cloudProvider
            
            // Batería baja + inferencia frecuente → nube (menos consumo local)
            deviceCapabilityChecker.batteryLevel < 20 && request.isFrequent -> cloudProvider
            
            // On-device disponible y tarea simple → local
            onDeviceProvider.isAvailable() && request.complexity == Complexity.LOW -> onDeviceProvider
            
            // Default → nube
            else -> cloudProvider
        }
    }
}

// Uso en ViewModel
class AssistantViewModel(
    private val router: InferenceRouter,
    private val localModel: GeminiNanoClient,
    private val cloudModel: GeminiProClient
) : ViewModel() {
    
    fun processUserInput(input: String, isSensitive: Boolean = false) {
        viewModelScope.launch {
            val request = InferenceRequest(
                prompt = input,
                containsSensitiveData = isSensitive,
                complexity = estimateComplexity(input)
            )
            
            val provider = router.route(request)
            val response = provider.generate(request.prompt)
            
            _uiState.update { it.copy(response = response) }
        }
    }
    
    private fun estimateComplexity(input: String): Complexity {
        // Heurística simple: longitud + palabras clave de razonamiento
        return when {
            input.length > 500 -> Complexity.HIGH
            input.contains(Regex("analiza|compara|explica detalladamente|razona")) -> Complexity.HIGH
            else -> Complexity.LOW
        }
    }
}
```

## 📱 Casos de Uso Reales: ¿Qué Usan las Apps?

**Google Messages (Reply Suggestions):** On-device. Las sugerencias de respuesta rápida usan un modelo local pequeño porque deben ser instantáneas y la privacidad de las conversaciones es crítica.

**Grammarly Mobile:** Híbrido. Correcciones básicas (gramática, puntuación) on-device para latencia cero; sugerencias de estilo complejas van a la nube.

**GitHub Copilot para Android Studio:** Cloud. La generación de código complejo requiere un modelo grande; la latencia de red es aceptable porque el developer está pensando entre sugerencias.

**App de salud mental con chatbot:** On-device obligatorio. Los datos de salud mental son extremadamente sensibles; una brecha de privacidad destruiría la confianza del usuario.

**Buscador semántico en app de notas:** On-device. Búsqueda local sobre el contenido del usuario, sin enviar sus notas a ningún servidor. Llama 3.2 1B con embeddings es suficiente para esto.

## 🔧 Integración Técnica: El Stack en Kotlin

Para on-device, tienes tres opciones principales en el ecosistema Android:

```kotlin
// Opción 1: AICore API (Gemini Nano via Google)
val generativeModel = GenerativeModel(
    modelName = "gemini-nano",
    // Sin API key — el modelo está en el sistema
)

// Opción 2: LiteRT (sucesor de TensorFlow Lite) para modelos personalizados
val interpreter = LiteRtInferenceSession.create(
    modelPath = "models/phi3-mini-q4.bin",
    options = InferenceOptions.builder()
        .setNumThreads(4)
        .setUseNnApi(true) // delegado a NPU si está disponible
        .build()
)

// Opción 3: MediaPipe LLM Inference API (multiplataforma)
val llmInference = LlmInference.createFromOptions(
    context,
    LlmInference.LlmInferenceOptions.builder()
        .setModelPath("/data/local/tmp/llama_3_2_1b_q8.bin")
        .setMaxTokens(1024)
        .setTopK(40)
        .setTemperature(0.8f)
        .build()
)
```

Para cloud, la elección obvia sigue siendo la Gemini API de Google para el ecosistema Android, con el SDK oficial:

```kotlin
// Cloud inference con Gemini Pro
val cloudModel = GenerativeModel(
    modelName = "gemini-1.5-pro",
    apiKey = BuildConfig.GEMINI_API_KEY
)
val response = cloudModel.generateContent(prompt)
```

## Conclusión

La decisión SLM vs LLM no es binaria ni permanente. El mejor enfoque para apps Android en 2026 es **asumir un diseño híbrido desde el principio**: una interfaz común para proveedores de inferencia que permita cambiar entre local y nube según el contexto en tiempo de ejecución.

Si tuvieras que empezar con una sola regla: **usa on-device por defecto para datos sensibles y tareas simples; usa cloud para tareas complejas donde la calidad del modelo marca la diferencia**. Y mide continuamente — los SLMs están mejorando rápidamente, y lo que hoy requiere un LLM grande, quizás en seis meses lo resuelve Gemini Nano.

El usuario raramente se preocupa por dónde corre el modelo. Se preocupa por si la app es rápida, privada, y funciona sin internet. Ese es el norte correcto para tomar esta decisión.

## Referencias

- [Android AI — AICore y Gemini Nano](https://developer.android.com/ai/aicore)
- [LiteRT (TensorFlow Lite successor)](https://ai.google.dev/edge/litert)
- [MediaPipe LLM Inference API for Android](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/android)
- [Phi-3 Mini — Microsoft Research](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/)
- [Llama 3.2 on-device — Meta AI](https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/)
- [MLPerf Mobile Inference Benchmarks](https://mlcommons.org/benchmarks/inference-mobile/)
