---
title: "Room Database: Persistencia Robusta en Android"
description: "Guía completa de Room: desde entidades y DAOs hasta migraciones complejas, relaciones one-to-many y uso avanzado de Flow y Coroutines."
pubDate: 2025-10-12
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "Room Database"
  - "Persistencia"
  - "Robusta"
  - "Android"
  - "Base de Datos"
canonical: "https://arceapps.com/es/blog/room-database/"
heroImage: "/images/placeholder-article-room.svg"
tags: ["Android", "Room", "Database", "SQL", "Persistence"]
reference_id: "33bf7911-98a8-491c-b685-eb741eda08b5"
---


## 🏛️ Teoría: ¿Por qué Room y no SQLite puro?

SQLite es poderoso pero crudo. Escribir SQL a mano en Strings es propenso a errores, y mapear `Cursor` a Objetos es tedioso y repetitivo.

**Room** es una capa de abstracción (ORM - Object Relational Mapper) sobre SQLite que ofrece:

1. **Validación en tiempo de compilación**: Si escribes mal tu query SQL, la app no compila. Esto es brutal: atrapa errores que antes solo veías en runtime (typos en nombres de columnas, tipos mal mapeados, queries con referencias rotas).
2. **Integración con Coroutines/Flow**: Operaciones asíncronas sencillas.
3. **Mapeo automático**: De Columnas a Propiedades.
4. **Migraciones gestionadas**: Ayuda a evolucionar el esquema sin perder datos.

> **Este artículo es la introducción a Room.** Cubre los fundamentos que necesitas para empezar: entidades, DAOs, base, relaciones y migraciones. Si ya tienes Room funcionando y estás sufriendo lentitud, ANRs, o quieres explorar SQLDelight y Realm, lee la continuación: [Room Database: Escalabilidad y Rendimiento en Android](/es/blog/room-performance-issues).

Esta distinción es importante porque Room tiene **dos vidas**: la primera donde todo funciona mágicamente (este artículo), y la segunda donde empiezas a optimizar consultas y aparecen trade-offs reales. Si lees el artículo avanzado sin estos fundamentos, vas a perder contexto.

## 🏗️ Los 3 Componentes Mayores

### 1. Entity (La Tabla)

Define la estructura de la tabla.

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    val age: Int // Por defecto la columna se llama "age"
)
```

Tres detalles que parecen menores y ahorran horas:

- **`tableName`**: sin él, Room usa el nombre de la clase (`UserEntity`). Esto da nombres de tabla feos. Ponlo siempre.
- **`@ColumnInfo(name = ...)`**: te permite desacoplar el nombre en Kotlin del nombre en SQL. Útil cuando el backend te devuelve `full_name` pero tú quieres `name` en Kotlin.
- **Tipos**: Room soporta primitivos, Strings, Date (con TypeConverter), enums (con TypeConverter), y tipos complejos via TypeConverter. Si necesitas listas o mapas, también via TypeConverter, pero evalúa si debería ser una relación real (ver más abajo).

### 2. DAO (Data Access Object)

Define las operaciones. Es una interfaz; Room genera el código.

```kotlin
@Dao
interface UserDao {
    // 1. Lectura Reactiva (Flow)
    // Emite un nuevo valor cada vez que la tabla cambia.
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<UserEntity>>

    // 2. Escritura Suspendida (One-shot)
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)
    
    @Delete
    suspend fun delete(user: UserEntity)
}
```

Hay tres estilos de DAO que vale la pena conocer:

| Estilo | Uso | Ejemplo |
|---|---|---|
| `@Query` con SQL crudo | Lo más común y flexible | `SELECT * FROM users WHERE age > :min` |
| `@Insert`, `@Update`, `@Delete` | Operaciones estándar sin SQL | `insertUser(user)` |
| **Convenience methods** (`@Insert` sin SQL) | Inserción múltiple, upserts | `@Upsert` (Room 2.5+) |

Para queries complejos, siempre `@Query`. Para CRUD básico, las anotaciones dedicate son más legibles.

### 3. Database (El Punto de Acceso)

El contenedor principal. Debe ser un Singleton.

```kotlin
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

**¿Por qué Singleton?** Abrir una base de datos es caro (allocate buffers, cargar páginas). Si cada ViewModel abre su propia conexión, en una pantalla con 5 ViewModels tienes 5 conexiones simultáneas, lo cual degrada el rendimiento. La convención canónica: inyecta el `AppDatabase` con Hilt/Koin, que ya garantiza una sola instancia.

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app-database"
        ).build()
    }

    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()
}
```

## 🔄 Relaciones (Relationships)

Room no soporta listas de objetos directamente (porque SQL no lo hace). Tienes dos opciones.

### Opción A: TypeConverters (Para datos simples)

Convierte una `List<String>` a un JSON String para guardarlo, y viceversa al leerlo.

```kotlin
class Converters {
    @TypeConverter
    fun fromString(value: String): List<String> {
        return Json.decodeFromString(value)
    }
    @TypeConverter
    fun fromList(list: List<String>): String {
        return Json.encodeToString(list)
    }
}
```

**Cuándo usarlo**: datos simples, sin queries sobre ellos. Tags de un post, lista de permisos, etc. El precio: no puedes filtrar ni hacer JOIN sobre el campo serializado.

### Opción B: @Relation (Para datos relacionales reales)

Si un `User` tiene muchos `Posts`.

```kotlin
data class UserWithPosts(
    @Embedded val user: UserEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "user_id"
    )
    val posts: List<PostEntity>
)

// En DAO
@Transaction // Importante para consistencia
@Query("SELECT * FROM users")
fun getUsersWithPosts(): Flow<List<UserWithPosts>>
```

**Cuándo usarlo**: cuando necesitas consultar las relaciones (`WHERE`, `ORDER BY`). El precio: queries más complejos y potencialmente más lentos si no indexas bien (de ahí la existencia del [artículo avanzado](/es/blog/room-performance-issues)).

### La regla que casi nadie sigue

`@Relation` debería ser tu **opción por defecto** para datos que tienen cardinalidad real (1-N, N-M). `@TypeConverter` con JSON es tentador porque es rápido de escribir, pero te explota en la cara cuando necesitas hacer "dame todos los posts con tag X" y tienes que cargar TODO para filtrar en memoria.

## ⚠️ Migraciones: El Terror de Producción

Si cambias tu Entity (añades un campo) y subes la versión de la DB sin proveer una migración, la app crasheará en los usuarios existentes (o borrará los datos si usas `fallbackToDestructiveMigration`).

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
    }
}

// Al construir la DB
Room.databaseBuilder(...)
    .addMigrations(MIGRATION_1_2)
    .build()
```

**Tip de Pro**: Usa los tests automáticos de migraciones de Room para verificar que tu migración funciona antes de liberar.

```kotlin
@Test
fun migrate1To2_containsAgeColumn() {
    helper.createDatabase(TEST_DB, 1).apply {
        close()
    }
    helper.runMigrationsAndValidate(TEST_DB, 2, true, MIGRATION_1_2).apply {
        // Verificar que la columna existe
        query("SELECT * FROM users LIMIT 1").use { cursor ->
            val columnIndex = cursor.getColumnIndex("age")
            assertTrue(columnIndex >= 0)
        }
        close()
    }
}
```

### Errores comunes en migraciones

**1. Olvidar `NOT NULL DEFAULT` en columnas nuevas**. Si añades `age` sin default y la tabla ya tiene filas, la migración falla porque las filas existentes no tendrían valor para `age`.

**2. Renombrar columnas sin migración**. Room lo detecta como "nueva columna, columna vieja desaparece". Si la columna vieja tenía datos importantes, los pierdes. Usa `@RenameColumn` explícitamente.

**3. No probar migraciones con datos reales**. Las migraciones se rompen con datos que no anticipaste. Un test con 1 fila vacía no atrapa el bug.

**4. `fallbackToDestructiveMigration()` en producción**. Borra todos los datos del usuario. Útil en desarrollo, suicida en producción. Usa `fallbackToDestructiveMigrationOnDowngrade()` solo para casos específicos (testing, QA).

## 🎯 Flujos reactivos con Room

Una de las features que hace que Room brille es la integración nativa con `Flow`. Cuando insertas o actualizas una fila, todos los Flows que dependen de esa tabla emiten un nuevo valor automáticamente.

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE active = 1")
    fun observeActiveUsers(): Flow<List<UserEntity>>
}

// En el ViewModel
viewModelScope.launch {
    dao.observeActiveUsers().collect { users ->
        _uiState.value = UiState.Success(users)
    }
}
```

Esto es **Single Source of Truth** funcionando en la práctica: la UI siempre muestra lo que está en la DB. Si actualizas una fila en background, la UI se actualiza sola. Si quieres profundizar en este patrón, mira [Repository Pattern: La Verdadera Abstracción de Datos](/es/blog/repository-pattern).

## 🎯 Conclusión

Room es la pieza central de cualquier estrategia "Offline-First". Su capacidad para exponer `Flow` hace que la sincronización UI-Database sea trivial. Aunque requiere configuración inicial, la seguridad de tipos y la robustez que ofrece valen cada línea de código.

Si tu app tiene 100 usuarios y unas miles de filas, este artículo es todo lo que necesitas. Si tu app tiene 100k usuarios y la DB empieza a sufrir, necesitas el siguiente nivel.

**Cuándo dejar este artículo y leer el avanzado**:
- Las queries pasan de milisegundos a segundos.
- Ves ANRs en Play Console relacionados con queries.
- Empiezas a considerar índices "manuales".
- Consideras migrar a SQLDelight o Realm.

El artículo avanzado cubre todo eso: índices, query plans, FTS, SQLDelight vs Realm vs Room, y patrones para queries costosas. Léelo cuando duela, no antes: [Room Database: Escalabilidad y Rendimiento en Android](/es/blog/room-performance-issues).

## Bibliografía y Referencias

- [Room Database: Escalabilidad y Rendimiento en Android](/es/blog/room-performance-issues) — La continuación natural de este artículo. Cubre índices, queries nativas, SQLDelight y Realm.
- [Repository Pattern: La Verdadera Abstracción de Datos](/es/blog/repository-pattern) — Cómo encaja Room dentro del Repository Pattern y la estrategia Offline-First.
- [StateFlow vs SharedFlow: Guía Definitiva para Android](/es/blog/stateflow-sharedflow) — Para combinar Room con flows reactivos correctamente.
- [Documentación oficial de Room](https://developer.android.com/training/data-storage/room) — La referencia canónica. Última actualización de la guía de migraciones está en 2025.
- [Now in Android: Persistencia](https://github.com/android/nowinandroid) — Implementación de referencia de Google con Room + SQLDelight híbrido.
- [SQLite Query Planner](https://www.sqlite.org/queryplanner.html) — Para entender por qué algunas queries son lentas. Lectura densa pero reveladora.
