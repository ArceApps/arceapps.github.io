---
title: "Room Database en Android: Persistencia de Datos Moderna"
description: "Domina la biblioteca de persistencia más poderosa de Android: desde configuración básica hasta técnicas avanzadas con corrutinas y migraciones."
pubDate: "2025-09-15"
heroImage: "/images/placeholder-article-room.svg"
tags: ["Android", "Room Database", "Persistence", "Kotlin", "Coroutines"]
---

## 🗄️ Introducción a Room Database

Room es la **biblioteca de persistencia oficial de Android** que proporciona una capa de abstracción sobre SQLite, ofreciendo una forma más robusta y declarativa de trabajar con bases de datos locales. Forma parte de Android Jetpack y está diseñada para trabajar perfectamente con Kotlin y corrutinas.

A diferencia de SQLite directo, Room nos proporciona **validación en tiempo de compilación**, **integración nativa con LiveData y Flow**, y **migración automática de esquemas**. Es la solución recomendada por Google para cualquier aplicación que necesite persistencia local. 🚀

### ¿Por qué elegir Room sobre SQLite directo?

- **Type Safety**: Validación de queries en tiempo de compilación
- **Observabilidad**: Integración nativa con LiveData y Flow
- **Migraciones**: Sistema robusto de versionado de esquemas
- **Performance**: Optimizaciones automáticas y threading inteligente

## 🏗️ Configuración Básica de Room

Configurar Room en tu proyecto Android es sencillo pero requiere entender tres componentes principales: **Entity**, **DAO** y **Database**.

### 1. Dependencias en build.gradle

```kotlin
dependencies {
    val room_version = "2.6.1"
    
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    ksp("androidx.room:room-compiler:$room_version")
    
    // Para testing
    testImplementation("androidx.room:room-testing:$room_version")
}
```

### 2. Definir una Entity

```kotlin
@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    
    @ColumnInfo(name = "user_name")
    val userName: String,
    
    @ColumnInfo(name = "email")
    val email: String,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @ColumnInfo(name = "is_active")
    val isActive: Boolean = true
)
```

### 3. Crear el DAO (Data Access Object)

```kotlin
@Dao
interface UserDao {
    
    @Query("SELECT * FROM users WHERE is_active = 1")
    fun getAllActiveUsers(): Flow<List<User>>
    
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: Long): User?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User): Long
    
    @Delete
    suspend fun deleteUser(user: User)
}
```

### 4. Configurar la Database

```kotlin
@Database(
    entities = [User::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun userDao(): UserDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

## 🔄 TypeConverters: Manejo de Tipos Complejos

Room solo puede manejar tipos primitivos por defecto. Para tipos complejos como Date, List o objetos custom, necesitamos TypeConverters:

```kotlin
class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }
    
    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }
}
```

## 🚀 Integración con Repository Pattern

Room funciona perfectamente con el patrón Repository, proporcionando una capa de abstracción limpia entre la UI y los datos:

```kotlin
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: ApiService
) {
    fun getAllUsers(): Flow<List<User>> = userDao.getAllActiveUsers()
    
    suspend fun refreshUsers() {
        try {
            val remoteUsers = apiService.getUsers()
            userDao.insertUsers(remoteUsers)
        } catch (e: Exception) {
            // Manejo de errores - los datos locales siguen disponibles
            Timber.e(e, "Error refreshing users")
        }
    }
}
```

## ⚡ Queries Avanzadas y Relaciones

### Relaciones One-to-Many

```kotlin
data class UserWithPosts(
    @Embedded val user: User,
    @Relation(
        parentColumn = "id",
        entityColumn = "user_id"
    )
    val posts: List<Post>
)

@Transaction
@Query("SELECT * FROM users WHERE id = :userId")
suspend fun getUserWithPosts(userId: Long): UserWithPosts?
```

## 🔄 Migraciones de Base de Datos

Las migraciones son cruciales para mantener la integridad de los datos cuando evoluciona tu esquema:

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN profile_image_url TEXT")
    }
}

Room.databaseBuilder(context, AppDatabase::class.java, "database")
    .addMigrations(MIGRATION_1_2)
    .build()
```

## 🧪 Testing con Room

Room facilita enormemente el testing con una base de datos en memoria:

```kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    
    private lateinit var database: AppDatabase
    private lateinit var userDao: UserDao
    
    @Before
    fun createDb() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(
            context, AppDatabase::class.java
        ).build()
        userDao = database.userDao()
    }
    
    @Test
    fun insertAndGetUser() = runTest {
        val user = User(userName = "testuser", email = "test@example.com")
        val userId = userDao.insertUser(user)
        val retrievedUser = userDao.getUserById(userId)
        assertThat(retrievedUser?.userName).isEqualTo("testuser")
    }
}
```

## 🔧 Mejores Prácticas

1. **Uso correcto de Threading**: Nunca bloquees el Main Thread. Usa `suspend functions` y `Flow`.
2. **Optimización de Queries**: Crea índices para columnas usadas en `WHERE` y `ORDER BY`.
3. **Inyección de Dependencias**: Usa Hilt para proveer tu Database y DAOs como singletons.

## 🎯 Conclusión

Room Database representa la evolución natural de la persistencia en Android. Al adoptar Room, reduces errores, aumentas productividad y mejoras la mantenibilidad de tu código.
