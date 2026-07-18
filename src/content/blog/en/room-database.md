---
title: "Room Database: Robust Persistence in Android"
description: "Complete guide to Room: from entities and DAOs to complex migrations, one-to-many relationships, and advanced Flow and Coroutines usage."
pubDate: 2025-10-12
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "Room Database"
  - "Persistence"
  - "Robust"
  - "Android"
  - "Database"
canonical: "https://arceapps.com/blog/room-database/"
heroImage: "/images/placeholder-article-room.svg"
tags: ["Android", "Room", "Database", "SQL", "Persistence"]
category: memory
reference_id: "33bf7911-98a8-491c-b685-eb741eda08b5"
---


## 🏛️ Theory: Why Room and Not Pure SQLite?

SQLite is powerful but raw. Writing SQL by hand in Strings is error-prone, and mapping `Cursor` to Objects is tedious and repetitive.

**Room** is an abstraction layer (ORM - Object Relational Mapper) over SQLite that offers:

1. **Compile-time validation**: If you write your SQL query wrong, the app won't compile. This is brutal: it catches errors you used to only see at runtime (typos in column names, mis-mapped types, queries with broken references).
2. **Integration with Coroutines/Flow**: Easy async operations.
3. **Automatic mapping**: From Columns to Properties.
4. **Managed migrations**: Helps evolve the schema without losing data.

> **This article is the introduction to Room.** It covers the fundamentals you need to start: entities, DAOs, database, relationships, and migrations. If you already have Room working and are suffering from slowness, ANRs, or want to explore SQLDelight and Realm, read the continuation: [Room Database: Scalability and Performance in Android](/blog/room-performance-issues).

This distinction is important because Room has **two lives**: the first where everything works magically (this article), and the second where you start optimizing queries and real trade-offs appear. If you read the advanced article without these fundamentals, you'll lose context.

## 🏗️ The 3 Major Components

### 1. Entity (The Table)

Defines the table structure.

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "full_name") val name: String,
    val age: Int // by default the column is called "age"
)
```

Three details that seem minor and save hours:

- **`tableName`**: without it, Room uses the class name (`UserEntity`). This gives ugly table names. Always set it.
- **`@ColumnInfo(name = ...)`**: lets you decouple the Kotlin name from the SQL name. Useful when the backend returns `full_name` but you want `name` in Kotlin.
- **Types**: Room supports primitives, Strings, Date (with TypeConverter), enums (with TypeConverter), and complex types via TypeConverter. If you need lists or maps, also via TypeConverter, but evaluate whether it should be a real relation (see below).

### 2. DAO (Data Access Object)

Defines operations. It's an interface; Room generates the code.

```kotlin
@Dao
interface UserDao {
    // 1. Reactive Read (Flow)
    // Emits a new value every time the table changes.
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<UserEntity>>

    // 2. Suspended Write (One-shot)
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)
    
    @Delete
    suspend fun delete(user: UserEntity)
}
```

There are three DAO styles worth knowing:

| Style | Use | Example |
|---|---|---|
| `@Query` with raw SQL | Most common and flexible | `SELECT * FROM users WHERE age > :min` |
| `@Insert`, `@Update`, `@Delete` | Standard operations without SQL | `insertUser(user)` |
| **Convenience methods** (`@Insert` without SQL) | Multiple insertion, upserts | `@Upsert` (Room 2.5+) |

For complex queries, always `@Query`. For basic CRUD, the dedicated annotations are more readable.

### 3. Database (The Access Point)

The main container. Must be a Singleton.

```kotlin
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

**Why Singleton?** Opening a database is expensive (allocate buffers, load pages). If each ViewModel opens its own connection, on a screen with 5 ViewModels you have 5 simultaneous connections, which degrades performance. The canonical convention: inject `AppDatabase` with Hilt/Koin, which already guarantees a single instance.

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

## 🔄 Relationships

Room doesn't directly support lists of objects (because SQL doesn't). You have two options.

### Option A: TypeConverters (For Simple Data)

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

**When to use**: simple data, with no queries on it. Post tags, permission lists, etc. The price: you can't filter or JOIN on the serialized field.

### Option B: @Relation (For Real Relational Data)

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

**When to use**: when you need to query the relationships (`WHERE`, `ORDER BY`). The price: more complex queries and potentially slower if you don't index well (hence the existence of the [advanced article](/blog/room-performance-issues)).

### The rule almost nobody follows

`@Relation` should be your **default option** for data that has real cardinality (1-N, N-M). `@TypeConverter` with JSON is tempting because it's fast to write, but it blows up in your face when you need to "give me all posts with tag X" and have to load EVERYTHING to filter in memory.

## ⚠️ Migrations: The Production Terror

If you change your Entity (add a field) and bump the DB version without providing a migration, the app will crash for existing users (or wipe data if you use `fallbackToDestructiveMigration`).

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
    }
}

// When building the DB
Room.databaseBuilder(...)
    .addMigrations(MIGRATION_1_2)
    .build()
```

**Pro Tip**: Use Room's automatic migration tests to verify your migration works before shipping.

```kotlin
@Test
fun migrate1To2_containsAgeColumn() {
    helper.createDatabase(TEST_DB, 1).apply {
        close()
    }
    helper.runMigrationsAndValidate(TEST_DB, 2, true, MIGRATION_1_2).apply {
        // Verify the column exists
        query("SELECT * FROM users LIMIT 1").use { cursor ->
            val columnIndex = cursor.getColumnIndex("age")
            assertTrue(columnIndex >= 0)
        }
        close()
    }
}
```

### Common Migration Errors

**1. Forgetting `NOT NULL DEFAULT` on new columns**. If you add `age` without a default and the table already has rows, the migration fails because existing rows wouldn't have a value for `age`.

**2. Renaming columns without migration**. Room detects it as "new column, old column disappears". If the old column had important data, you lose it. Use `@RenameColumn` explicitly.

**3. Not testing migrations with real data**. Migrations break with data you didn't anticipate. A test with 1 empty row doesn't catch the bug.

**4. `fallbackToDestructiveMigration()` in production**. Wipes all user data. Useful in development, suicidal in production. Use `fallbackToDestructiveMigrationOnDowngrade()` only for specific cases (testing, QA).

## 🎯 Reactive Flows with Room

One of the features that makes Room shine is native integration with `Flow`. When you insert or update a row, all Flows depending on that table automatically emit a new value.

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE active = 1")
    fun observeActiveUsers(): Flow<List<UserEntity>>
}

// In the ViewModel
viewModelScope.launch {
    dao.observeActiveUsers().collect { users ->
        _uiState.value = UiState.Success(users)
    }
}
```

This is **Single Source of Truth** working in practice: UI always shows what's in the DB. If you update a row in background, UI updates itself. If you want to dive deeper into this pattern, check out [Repository Pattern: The Real Data Abstraction](/blog/repository-pattern).

## 🧪 Testing Room: Three Patterns You Need

Once you have Room in production, testing it becomes critical. There are three patterns I use consistently:

### Pattern 1: In-Memory Database for Unit Tests

For fast tests that don't need disk persistence:

```kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: UserDao

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries() // OK for tests
         .build()

        dao = db.userDao()
    }

    @After
    fun teardown() {
        db.close()
    }

    @Test
    fun `insertUser then getAllUsers returns the user`() = runTest {
        val user = UserEntity(id = "1", name = "Alice", age = 30)
        dao.insertUser(user)

        val users = dao.getAllUsers().first()

        assertEquals(1, users.size)
        assertEquals(user, users[0])
    }
}
```

The in-memory DB is created fresh for each test, runs in milliseconds, and doesn't touch disk. Perfect for the inner loop.

### Pattern 2: Robolectric for Compose-Based Tests

When you want to test Room + Compose flows together, Robolectric gives you an Android context on JVM:

```kotlin
@RunWith(RobolectricTestRunner::class)
class UserListViewModelTest {

    private lateinit var db: AppDatabase
    private lateinit var viewModel: UserListViewModel

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).build()

        viewModel = UserListViewModel(db.userDao())
    }

    @Test
    fun `viewModel exposes users from database`() = runTest {
        db.userDao().insertUser(testUser())

        viewModel.uiState.test {
            assertEquals(UiState.Loading, awaitItem())
            assertEquals(UiState.Success(listOf(testUser())), awaitItem())
        }
    }
}
```

Robolectric adds ~500ms startup but lets you use `Context` and `Application` without a real device. Worth the trade-off for integration tests.

### Pattern 3: Migration Tests

Already shown above, but worth emphasizing: **migration tests are non-negotiable for production**. A failed migration = lost user data = 1-star reviews. Write them before the migration, run them in CI.

## 🎯 Conclusion

Room is the central piece of any "Offline-First" strategy. Its ability to expose `Flow` makes UI-Database sync trivial. Although it requires initial configuration, the type safety and robustness it offers are worth every line of code.

If your app has 100 users and a few thousand rows, this article is all you need. If your app has 100k users and the DB is starting to hurt, you need the next level.

**When to leave this article and read the advanced one**:
- Queries go from milliseconds to seconds.
- You see ANRs in Play Console related to queries.
- You start considering "manual" indexes.
- You consider migrating to SQLDelight or Realm.

The advanced article covers all that: indexes, query plans, FTS, SQLDelight vs Realm vs Room, and patterns for expensive queries. Read it when it hurts, not before: [Room Database: Scalability and Performance in Android](/blog/room-performance-issues).

## Bibliography and References

- [Room Database: Scalability and Performance in Android](/blog/room-performance-issues) — The natural continuation of this article. Covers indexes, native queries, SQLDelight, and Realm.
- [Repository Pattern: The Real Data Abstraction](/blog/repository-pattern) — How Room fits within the Repository Pattern and Offline-First strategy.
- [StateFlow vs SharedFlow: The Definitive Guide for Android](/blog/stateflow-sharedflow) — To combine Room with reactive flows correctly.
- [Official Room documentation](https://developer.android.com/training/data-storage/room) — The canonical reference. Last migration guide update was 2025.
- [Now in Android: Persistence](https://github.com/android/nowinandroid) — Google's reference implementation with Room + SQLDelight hybrid.
- [SQLite Query Planner](https://www.sqlite.org/queryplanner.html) — To understand why some queries are slow. Dense reading but revealing.
