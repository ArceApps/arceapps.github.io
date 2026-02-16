---
title: "MVVM ViewModel: El Cerebro de la Operación"
description: "Profundiza en el componente ViewModel: Gestión de estado, ciclo de vida, corrutinas y cómo evitar los errores más comunes de diseño."
pubDate: 2025-10-04
heroImage: "/images/placeholder-article-viewmodel.svg"
tags: ["Android", "MVVM", "ViewModel", "StateFlow", "Coroutines"]
---
## 🧠 Teoría: ¿Qué hace a un ViewModel un ViewModel?

El `ViewModel` de Android es una clase diseñada con un superpoder específico: **sobrevivir a cambios de configuración**.

Cuando rotas el teléfono:
1.  `Activity` muere (onDestroy).
2.  `Activity` renace (onCreate).
3.  `ViewModel` **se queda quieto**.

Esto lo convierte en el lugar perfecto para mantener el estado (datos) y las operaciones asíncronas en curso. Si no usáramos ViewModel, al rotar la pantalla mientras cargamos datos de red, la petición se cancelaría o perderíamos el resultado.

## 🏗️ Estructura Canónica de un ViewModel Moderno

Hoy en día, un ViewModel profesional sigue un patrón estricto basado en **StateFlow**.

```kotlin
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase // Inyección de dependencias
) : ViewModel() {

    // 1. Backing Property: Estado mutable privado
    private val _uiState = MutableStateFlow<ProductUiState>(ProductUiState.Loading)
    
    // 2. Estado inmutable público (Read-only)
    val uiState: StateFlow<ProductUiState> = _uiState.asStateFlow()

    init {
        // 3. Carga inicial automática
        loadProducts()
    }

    // 4. Funciones públicas (User Intents)
    fun refresh() {
        loadProducts()
    }

    private fun loadProducts() {
        // 5. viewModelScope: Corrutinas atadas a la vida del VM
        viewModelScope.launch {
            _uiState.value = ProductUiState.Loading
            
            getProductsUseCase()
                .catch { e ->
                    _uiState.value = ProductUiState.Error(e.message)
                }
                .collect { products ->
                    _uiState.value = ProductUiState.Success(products)
                }
        }
    }
}
```

## 🚦 Modelando el Estado (State Modeling)

¿Cómo representamos la UI? Tenemos dos escuelas de pensamiento.

### 1. Sealed Interface (Recomendado para pantallas completas)
Representa estados mutuamente excluyentes. No puedes estar cargando y tener éxito a la vez.

```kotlin
sealed interface ProductUiState {
    object Loading : ProductUiState
    data class Success(val products: List<Product>) : ProductUiState
    data class Error(val msg: String?) : ProductUiState
}
```

### 2. Data Class con Flags (Recomendado para formularios complejos)
Útil cuando los campos son independientes.

```kotlin
data class FormUiState(
    val email: String = "",
    val isEmailValid: Boolean = false,
    val isLoading: Boolean = false,
    val errors: List<String> = emptyList()
)
```

## ⚠️ El Problema de los "One-Off Events" (Eventos Únicos)

¿Cómo manejamos un Toast o una Navegación? No son estado, son eventos efímeros. Si usas un `StateFlow` para mostrar un Toast de error, al rotar la pantalla, el Toast volverá a salir (porque el estado sigue siendo "Error").

### La Solución Moderna: Canales (Channels)

Usa un `Channel` para eventos de "disparar y olvidar".

```kotlin
private val _events = Channel<ProductEvent>()
val events = _events.receiveAsFlow()

fun deleteProduct() {
    viewModelScope.launch {
        try {
            repo.delete()
            _events.send(ProductEvent.ShowUndoSnackBar) // Se consume una vez
        } catch (e: Exception) {
            _events.send(ProductEvent.ShowToast("Error"))
        }
    }
}
```

## 🚫 Anti-Patrones en ViewModels

1.  **Context en ViewModel**:
    ❌ `class MyVM(context: Context)`
    Nunca. Si rotas la pantalla, el `Activity` context se destruye, pero el VM sigue vivo -> **Memory Leak**. Si necesitas recursos, usa `AndroidViewModel(application)` o mejor, inyecta un wrapper.

2.  **Exponer MutableState**:
    ❌ `val state = MutableStateFlow(...)`
    La View podría modificar el estado accidentalmente (`viewModel.state.value = ...`). Rompe el flujo unidireccional. Siempre expón `StateFlow` o `LiveData` inmutable.

3.  **Lógica de Negocio Masiva**:
    El VM es un orquestador. Si tienes `if` anidados de 50 líneas validando reglas de negocio, muévelo a un **Use Case**. El VM debe ser ligero.

## 🎯 Conclusión

El ViewModel es el cerebro de la UI, pero debe ser un cerebro enfocado. Su trabajo es transformar datos crudos en estado listo para la UI y manejar la concurrencia. Si mantienes tus ViewModels limpios, agnósticos del framework Android y bien testados, tendrás la mitad de la batalla de la arquitectura ganada.
