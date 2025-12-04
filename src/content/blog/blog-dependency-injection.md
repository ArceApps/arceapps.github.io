---
title: "Inyección de Dependencias en Android: Dagger y Hilt para Expertos"
description: "Domina la inyección de dependencias desde los fundamentos hasta implementaciones avanzadas con Dagger y Hilt. Descubre módulos, componentes, subcomponentes y scopes para crear grafos de dependencias robustos."
pubDate: "2025-10-15"
heroImage: "/images/placeholder-article-dependency-injection.svg"
tags: ["Android", "Dependency Injection", "Dagger", "Hilt", "Kotlin"]
---

## 🎯 ¿Qué es la Inyección de Dependencias y por qué necesitas dominarla?

Imagina que estás construyendo una aplicación de chat como WhatsApp. Tu `ChatViewModel` necesita un repositorio de mensajes, un servicio de autenticación, un cliente de red, y un manejador de notificaciones. Si creas estas dependencias manualmente, tu código se convierte en una **pesadilla de acoplamiento** 🔗 que es imposible de testear y mantener.

**La Inyección de Dependencias (DI)** es el patrón que resuelve este problema: en lugar de que tus clases creen sus propias dependencias, se las **"inyectas" desde el exterior**. Es como tener un mayordomo personal que te trae exactamente lo que necesitas, cuando lo necesitas.

### 🚀 ¿Por qué la DI es tu superpoder secreto?

- **Testing Sin Dolor**: Mockea cualquier dependencia fácilmente para tests unitarios
- **Flexibilidad Total**: Cambia implementaciones sin modificar el código cliente
- **Construcción Automática**: El framework resuelve automáticamente las dependencias
- **Reutilización Inteligente**: Comparte instancias según el scope configurado
- **Depuración Simple**: Visualiza y debuggea el grafo de dependencias fácilmente
- **Modularización Perfecta**: Organiza dependencias por módulos y características

## 🗡️ Dagger vs Hilt: La Batalla de los Titanes

### ⚔️ Dagger
**El veterano poderoso**
- **✅ Ventajas**: Control total, sin magic, rendimiento compile-time.
- **❌ Desventajas**: Curva de aprendizaje empinada, mucho boilerplate.

### 🗡️ Hilt
**El elegido moderno**
- **✅ Ventajas**: Simplicidad, best practices, integración con Jetpack, menos boilerplate.
- **❌ Desventajas**: Menos control granular, específico para Android.

### 🎯 ¿Cuál elegir?
- **Elige Hilt si**: Estás creando una app Android moderna, usas Architecture Components, quieres productividad.
- **Elige Dagger si**: Necesitas control total, trabajas con módulos Java puros, tienes configuraciones muy específicas.

## 🏗️ Hilt en Acción: Construyendo ChatFlow

Vamos a implementar **ChatFlow**, una aplicación de mensajería que demuestra todos los conceptos avanzados.

### 📱 Configuración Inicial

```kotlin
@HiltAndroidApp
class ChatFlowApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Hilt maneja automáticamente la inicialización del grafo
    }
}
```

### 🔧 Módulos: Los Bloques de Construcción

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .build()
    }
}
```

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideChatDatabase(@ApplicationContext context: Context): ChatDatabase {
        return Room.databaseBuilder(
            context,
            ChatDatabase::class.java,
            "chat_database"
        ).build()
    }
    
    @Provides
    fun provideMessageDao(database: ChatDatabase): MessageDao = database.messageDao()
}
```

### 🏛️ Repository Pattern con DI

```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    @Binds
    abstract fun bindChatRepository(
        chatRepositoryImpl: ChatRepositoryImpl
    ): ChatRepository
}

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val chatApiService: ChatApiService,
    private val chatDao: ChatDao,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ChatRepository {
    // Implementación...
}
```

## 🎯 Scopes: Controlando el Ciclo de Vida

- **@Singleton**: Una instancia para toda la app (Repositories, Network clients).
- **@ActivityScoped**: Vive durante toda la Activity (Navigation, Analytics).
- **@ViewModelScoped**: Ligado al ciclo de vida del ViewModel (Use Cases, State).

### 🔧 Scopes Customizados

```kotlin
@Scope
@MustBeDocumented
@Retention(AnnotationRetention.RUNTIME)
annotation class FeatureScoped

@FeatureScoped
@DefineComponent(parent = SingletonComponent::class)
interface ChatFeatureComponent {
    // ...
}
```

## 🧪 Testing con Dependencias Inyectadas

```kotlin
@HiltAndroidTest
class ChatViewModelTest {
    
    @get:Rule
    var hiltRule = HiltAndroidRule(this)
    
    @BindValue
    @JvmField
    val mockChatRepository: ChatRepository = mockk()
    
    @Before
    fun setup() {
        hiltRule.inject()
        // Configurar mocks
    }
    
    @Test
    fun `when sending message then repository is called`() = runTest {
        // Test logic
    }
}
```

## 🔍 Alternativas: Koin y Manual DI

- **Koin**: DI ligero, Kotlin-first, resolución en runtime. Ideal para proyectos más simples o si prefieres evitar generación de código.
- **Manual DI**: Control total, pero difícil de escalar. Útil para apps muy pequeñas o educativas.

## 🎯 Best Practices

1. **Organización de Módulos**: Agrupa por responsabilidad (Network, Database, UI).
2. **Qualifiers Inteligentes**: Usa `@Qualifier` para distinguir instancias del mismo tipo.
3. **Lazy Injection**: Usa `Lazy<T>` para retrasar la creación de dependencias pesadas.
4. **Provider Pattern**: Usa `Provider<T>` para crear múltiples instancias.

## 🏃‍♀️ Migración: De Manual a Hilt

1. **Prepara la Base**: Añade dependencias y `@HiltAndroidApp`.
2. **Migra Capa por Capa**: Empieza por Repositories, luego Use Cases, finalmente ViewModels.
3. **Reemplaza Factory Manual**: Elimina factories custom y usa `@Inject`.
4. **Optimiza y Limpia**: Revisa scopes y elimina código muerto.
