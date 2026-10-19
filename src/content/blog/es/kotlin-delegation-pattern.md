---
title: "Delegación en Kotlin: El poder del patrón 'by'"
description: "Escribe menos código y reutiliza lógica de forma elegante con los Delegados de Kotlin. Lazy, Observable, Vetoable y cómo crear tus propios Custom Delegates."
pubDate: 2025-10-25
lastmod: 2025-10-25
author: ArceApps
keywords:
  - "Delegación Kotlin"
  - "Patrón"
  - "Clean Code"
  - "Kotlin"
  - "Diseño"
canonical: "https://arceapps.com/es/blog/kotlin-delegation/"
heroImage: "/images/placeholder-article-delegation.svg"
tags: ["Kotlin", "Delegation", "Design Patterns", "Clean Code", "Android"]
category: android-kotlin
reference_id: "f80704ef-54c1-481a-9d85-bd50b43cabc2"
---


## 🎭 ¿Qué es la Delegación?

En el diseño de software, la delegación es un patrón donde un objeto maneja una solicitud delegándola a un segundo objeto (el delegado). Kotlin tiene soporte de **primer nivel** para esto, lo que lo hace increíblemente potente y evita el boilerplate clásico de Java.

Kotlin soporta dos tipos:
1.  **Delegación de Propiedades** (`val prop by ...`)
2.  **Delegación de Clases** (`class MyClass : Interface by ...`)

## ⚡ Delegados de Propiedad Estándar

La librería estándar de Kotlin ya incluye joyas que deberías usar.

### 1. `by lazy`: Inicialización Perezosa
El valor se calcula solo la primera vez que se accede a él. Es *thread-safe* por defecto.

```kotlin
val heavyObject: HeavyObject by lazy {
    println("Calculando...")
    HeavyObject()
}

fun main() {
    // Aún no se ha creado nada
    println(heavyObject) // Imprime "Calculando..." y luego el objeto
    println(heavyObject) // Solo imprime el objeto (ya cacheado)
}
```

**Uso en Android**: Inicializar componentes pesados o lecturas de configuración.

### 2. `by observable`: Reaccionar a cambios
Te permite ejecutar código cada vez que una propiedad cambia su valor. Ideal para invalidar UI o logs.

```kotlin
var user: User by Delegates.observable(User.Empty) { property, oldValue, newValue ->
    Log.d("UserTag", "${property.name} cambió de $oldValue a $newValue")
    updateUi(newValue)
}
```

### 3. `by vetoable`: Validar cambios
Permite "vetar" (rechazar) el cambio de un valor si no cumple una condición.

```kotlin
var age: Int by Delegates.vetoable(0) { _, _, newValue ->
    newValue >= 0 // Solo acepta el cambio si es positivo
}
```

## 🏗️ Delegación de Clases: Composición sobre Herencia

Kotlin nos permite implementar una interfaz delegando la implementación real a otro objeto. Esto es la definición de libro de "Composition over Inheritance".

```kotlin
interface Base {
    fun print()
}

class BaseImpl(val x: Int) : Base {
    override fun print() { print(x) }
}

class Derived(b: Base) : Base by b {
    // No necesito implementar print(), se delega automáticamente a 'b'
    // Pero PUEDO sobrescribirlo si quiero modificar el comportamiento
}

fun main() {
    val b = BaseImpl(10)
    Derived(b).print() // Imprime 10
}
```

Esto es brutal para patrones como **Decorator** o **Adapter** sin escribir métodos puente manuales.

## 🛠️ Creando tus propios Custom Delegates en Android

Lo más potente es crear tus propios delegados para encapsular lógica de Android repetitiva.

### Ejemplo: Delegado para Argumentos de Fragmentos

¿Harto de leer `arguments?.getString("KEY")`?

```kotlin
class FragmentArgumentDelegate<T : Any> : ReadOnlyProperty<Fragment, T> {
    override fun getValue(thisRef: Fragment, property: KProperty<*>): T {
        val key = property.name // Usa el nombre de la variable como clave
        return thisRef.arguments?.get(key) as T
            ?: throw IllegalStateException("Argument ${property.name} not found")
    }
}

// Extension function para usarlo bonito
fun <T : Any> argument() = FragmentArgumentDelegate<T>()

// Uso en el Fragment
class UserFragment : Fragment() {
    // Automáticamente busca en arguments con key "userId"
    private val userId: String by argument()
}
```

### Ejemplo: SharedPreferences

Imagina guardar preferencias así:

```kotlin
var isDarkModeEnabled: Boolean by SharedPreferenceDelegate(context, "dark_mode", false)

// Al asignar, se guarda en disco. Al leer, se lee de disco.
isDarkModeEnabled = true
```

## 🧠 ¿Cómo funciona bajo el capó?

Cuando escribes `val p by Delegate()`, el compilador genera un campo oculto para el delegado y redirige los `get()` y `set()` a los métodos `getValue()` y `setValue()` del delegado. No hay magia, solo código generado inteligentemente.

## 🎯 Conclusión

La delegación es una de las características que hace que Kotlin sea "Conciso y Expresivo".
- Usa `lazy` para optimizar recursos.
- Usa `observable` para reacciones simples de UI.
- Usa **Custom Delegates** para abstraer lógica de infraestructura (Bundles, Intents, SharedPreferences) y mantener tus clases limpias.
