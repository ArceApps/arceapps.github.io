---
title: "Room Database: Robust Persistence in Android"
description: "Complete guide to Room: from entities and DAOs to complex migrations, one-to-many relationships, and advanced usage of Flow and Coroutines."
pubDate: 2025-10-12
heroImage: "/images/placeholder-article-room.svg"
tags: ["Android", "Room", "Database", "SQL", "Persistence"]
reference_id: "33bf7911-98a8-491c-b685-eb741eda08b5"
---
## 🏛️ Theory: Why Room and not pure SQLite?

SQLite is powerful but raw. Writing SQL by hand in Strings is error-prone, and mapping `Cursor` to Objects is tedious and repetitive.

**Room** is an abstraction layer (ORM - Object Relational Mapper) over SQLite that offers:
1.  **Compile-time validation**: If you miswrite your SQL query, the app won't build.
2.  **Coroutines/Flow integration**: Simple asynchronous operations.
3.  **Automatic mapping**: From Columns to Properties.
4.  **Managed migrations**: Helps evolve the schema without losing data.

## 🏗️ The 3 Major Components

### 1. Entity (The Table)
Defines the table structure.

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    val age: Int // Default column name is "age"
)
```

### 2. DAO (Data Access Object)
Defines operations. It's an interface; Room generates the code.

```kotlin
@Dao
interface UserDao {
    // 1. Reactive Read (Flow)
    // Emits a new value every time the table changes.
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<UserEntity>>

    // 2. Suspend Write (One-shot)
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)
}
```

### 3. Database (The Access Point)
The main container. Must be a Singleton.

```kotlin
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

## 🔄 Relationships

Room doesn't support object lists directly (because SQL doesn't). You have two options.

### Option A: TypeConverters (For simple data)
Convert a `List<String>` to a JSON String to save it, and vice versa when reading.

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

### Option B: @Relation (For real relational data)
If a `User` has many `Posts`.

```kotlin
data class UserWithPosts(
    @Embedded val user: UserEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "user_id"
    )
    val posts: List<PostEntity>
)

// In DAO
@Transaction // Important for consistency
@Query("SELECT * FROM users")
fun getUsersWithPosts(): Flow<List<UserWithPosts>>
```

## ⚠️ Migrations: The Production Terror

If you change your Entity (add a field) and bump the DB version without providing a migration, the app will crash for existing users (or wipe data if you use `fallbackToDestructiveMigration`).

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
    }
}

// When building DB
Room.databaseBuilder(...)
    .addMigrations(MIGRATION_1_2)
    .build()
```

**Pro Tip**: Use Room's automated migration tests to verify your migration works before releasing.

## 🎯 Conclusion

Room is the centerpiece of any "Offline-First" strategy. Its ability to expose `Flow` makes UI-Database synchronization trivial. Although it requires initial setup, the type safety and robustness it offers are worth every line of code.
