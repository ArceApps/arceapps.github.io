---
title: "Principios SOLID en Android: Guía Completa para Desarrolladores Kotlin"
description: "Domina los 5 principios fundamentales del desarrollo de software aplicados específicamente al ecosistema Android con ejemplos prácticos en Kotlin."
pubDate: "2025-08-30"
heroImage: "/images/placeholder-article-solid.svg"
tags: ["Android", "SOLID", "Kotlin", "Clean Code", "Architecture"]
---

## 🏗️ Introducción a los Principios SOLID

Los principios SOLID son cinco reglas fundamentales del diseño de software que nos ayudan a crear código más **mantenible**, **escalable** y **testeable**. En el contexto de Android con Kotlin, estos principios cobran especial relevancia debido a la complejidad inherente del desarrollo móvil.

### ¿Qué significan las siglas SOLID?
- **S**ingle Responsibility: Una clase debe tener una sola razón para cambiar.
- **O**pen/Closed: Abierto para extensión, cerrado para modificación.
- **L**iskov Substitution: Los objetos derivados deben ser sustituibles por sus bases.
- **I**nterface Segregation: Múltiples interfaces específicas mejor que una general.
- **D**ependency Inversion: Depender de abstracciones, no de concreciones.

## 🎯 S - Single Responsibility Principle (SRP)

El primer principio establece que **una clase debe tener una sola razón para cambiar**. En Android, esto significa que cada componente debe tener una responsabilidad bien definida.

### ❌ Ejemplo problemático: Activity monolítica

```kotlin
// ❌ MAL: Activity que hace demasiadas cosas
class UserProfileActivity : AppCompatActivity() {
    // Maneja networking, cache, UI, notificaciones, analytics...
}
```

### ✅ Solución: Separación de responsabilidades

```kotlin
// ✅ BIEN: Activity con una sola responsabilidad (Coordinación)
class UserProfileActivity : AppCompatActivity() {
    @Inject lateinit var viewModel: UserProfileViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Solo maneja la coordinación entre componentes
        viewModel.loadUserProfile()
    }
}

// ✅ ViewModel con responsabilidad específica (Estado y Lógica de Presentación)
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {
    // ...
}
```

## 🔓 O - Open/Closed Principle (OCP)

Las entidades de software deben estar **abiertas para extensión, pero cerradas para modificación**.

### ✅ Ejemplo: Sistema de notificaciones extensible

```kotlin
interface NotificationSender {
    fun sendNotification(message: String, recipient: String)
}

class PushNotificationSender @Inject constructor(...) : NotificationSender { ... }
class EmailNotificationSender @Inject constructor(...) : NotificationSender { ... }

// ✅ Manager que puede extenderse sin modificación
class NotificationManager @Inject constructor(
    private val notificationSenders: Set<@JvmSuppressWildcards NotificationSender>
) {
    fun sendToAllChannels(message: String, recipient: String) {
        notificationSenders.forEach { it.sendNotification(message, recipient) }
    }
}
```

## 🔄 L - Liskov Substitution Principle (LSP)

Los objetos de una superclase deben ser **sustituibles por objetos de sus subclases** sin alterar el funcionamiento del programa.

### ✅ Ejemplo: Jerarquía de ViewModels

```kotlin
abstract class BaseViewModel : ViewModel() {
    abstract fun loadData()
}

class UserProfileViewModel : BaseViewModel() {
    override fun loadData() { /* Carga perfil */ }
}

class ProductListViewModel : BaseViewModel() {
    override fun loadData() { /* Carga productos */ }
}

// ✅ Fragment base que puede trabajar con cualquier BaseViewModel
abstract class BaseFragment<T : BaseViewModel> : Fragment() {
    protected abstract val viewModel: T
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.loadData() // Funciona igual para cualquier subclase
    }
}
```

## 🔌 I - Interface Segregation Principle (ISP)

Es mejor tener **múltiples interfaces específicas** que una sola interfaz de propósito general.

### ❌ Ejemplo problemático

```kotlin
interface MediaPlayer {
    fun play()
    fun record() // ❌ No todos los players graban
}
```

### ✅ Solución: Interfaces segregadas

```kotlin
interface Playable {
    fun play()
}

interface Recordable {
    fun record()
}

class SimplePlayer : Playable {
    override fun play() { ... }
}

class AdvancedRecorder : Recordable {
    override fun record() { ... }
}
```

## 🔄 D - Dependency Inversion Principle (DIP)

Los módulos de alto nivel no deben depender de módulos de bajo nivel. **Ambos deben depender de abstracciones**.

### ❌ Ejemplo problemático

```kotlin
class UserProfileViewModel {
    // ❌ Dependencia directa de implementación concreta
    private val database = Room.databaseBuilder(...).build()
}
```

### ✅ Solución con Hilt

```kotlin
@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository // ✅ Depende de abstracción (Interface o Clase Repository)
) : ViewModel() {
    // ...
}
```
