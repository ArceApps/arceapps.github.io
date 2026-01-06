---
title: "Room Database: Persistencia Robusta en Android"
description: "Guía completa de Room: desde entidades y DAOs hasta migraciones complejas, relaciones one-to-many y uso avanzado de Flow y Coroutines."
pubDate: "2025-10-12"
heroImage: "/images/placeholder-article-room.svg"
tags: ["Android", "Room", "Database", "SQL", "Persistence"]
---
## 🏛️ Teoría: ¿Por qué Room y no SQLite puro?

SQLite es poderoso pero crudo. Escribir SQL a mano en Strings es propenso a errores, y mapear `Cursor` a Objetos es tedioso y repetitivo.

**Room** es una capa de abstracción (ORM - Object Relational Mapper) sobre SQLite que ofrece:
1.  **Validación en tiempo de compilación**: Si escribes mal tu query SQL, la app no compila.
2.  **Integración con Coroutines/Flow**: Operaciones asíncronas sencillas.
3.  **Mapeo automático**: De Columnas a Propiedades.
4.  **Migraciones gestionadas**: Ayuda a evolucionar el esquema sin perder datos.

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

### 3. Database (El Punto de Acceso)
El contenedor principal. Debe ser un Singleton.

```kotlin
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
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

## 🎯 Conclusión

Room es la pieza central de cualquier estrategia "Offline-First". Su capacidad para exponer `Flow` hace que la sincronización UI-Database sea trivial. Aunque requiere configuración inicial, la seguridad de tipos y la robustez que ofrece valen cada línea de código.
