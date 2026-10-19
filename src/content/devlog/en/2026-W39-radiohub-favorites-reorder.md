---
title: "RadioHub: drag to reorder favorites without losing order"
description: "How RadioHub turned favorites into a persistent list and why dropping the full-screen-intent permission was the only way to ship."
pubDate: 2026-09-21
lastmod: 2026-10-19
author: "ArceApps"
keywords: ["RadioHub", "Android", "favorites", "Room", "drag-and-drop"]
heroImage: "/images/devlog/radiohub-favorites-reorder.svg"
tags: ["Android", "Compose", "Room", "devlog", "permissions"]
draft: false
reference_id: "radiohub-favorites-reorder-w39"
---

A favorites list in a radio app sounds like one of the dullest features you could ship until you actually live with it for a couple of weeks and discover that the order in which stations appear defines your entire relationship with the product. If your six a.m. favorite is always at the bottom, you stop using it. You start opening search every morning instead of tapping a button. The difference between an app that knows you and an app that merely stores data is exactly that order.

RadioHub had been carrying that problem for several months. Version 1.7.0 already let you save favorites, but the order was decided by the database's internal row identifier: a stable rowid, no human criteria. Version 1.8.1, shipped on September 21, 2026, changed three things at once. It made favorites reorderable through a press-and-hold drag gesture. It persisted that order across sessions. And, as an unexpected cherry on top, it stopped asking for a permission that Google Play had decided we could no longer declare.

These three changes landed together because they had more in common than they looked. They were all decisions about persistence and presentation: in the database, on screen, and in the manifest. This article explains each one, the intermediate options that were rejected, and why the second pass of the iteration ended up changing details that initially felt minor.

## The need underneath the feature

Saving a favorite in RadioHub is trivial: one tap on the star icon from Explore or from the player. But that favorite entered a list rendered by `StationDao.getFavoritesFlow()`, and that list ordered by `stationuuid ASC`. It is a stable, deterministic order, but completely arbitrary from the perspective of the person who is going to use the app. If you discover a station at three p.m. it shows up at the top. If you discover it at eleven p.m. it shows up somewhere in the middle.

The behavior had an internal logic: every row in the database had an implicit order by rowid, and the query simply delegated to SQLite. But "order by rowid" is not an experience, it is a lottery. When someone builds a collection — saved favorites, saved reads, playlists — they expect to impose a human order. The expectation is not new, but it sometimes stays invisible until it bites you.

The first real symptom was a comment during an internal test: "why is my morning favorite always last?" The technical answer was correct and entirely useless: "because its identifier is higher." What the person actually meant was "I have lost the ability to decide what I see first when I open the app."

The decision was to add an explicit order column, keep the default order for stations that had not been reordered yet, and let the gesture update the order in place.

## A new column on a table with real data

The schema change is the easiest to explain and the riskiest to execute. RadioHub has used Room for several releases, so the `favoriteOrder` column had to come in through a real migration.

MIGRATION_5_6 lives in `AppMigrations.kt`:

```kotlin
val MIGRATION_5_6: Migration = object : Migration(5, 6) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE station_cache ADD COLUMN favoriteOrder INTEGER")
        db.execSQL("UPDATE station_cache SET favoriteOrder = rowid WHERE isFavorite = 1")
    }
}
```

Two statements. The first adds a nullable column. The second assigns the current rowid as the order value for every pre-existing favorite. This is deliberately simple: any favorite that existed before the migration gets an order that matches the previous implicit order. A person who opens the app after the migration sees exactly the same stations in the same order they did before. Nobody notices the schema change.

The choice of `rowid` is not trivial. It could have been `lastPlayedAt`, name, or marking date. Choosing `rowid` means the human order, when it eventually arrives, does not compete with a calculated one. When a person decides that "Radio Three" belongs on top, that replaces the original `rowid`. Until someone reorders, the order is the one that already exists.

The second detail is that the column is nullable. A favorite marked before the migration has an integer value. A favorite marked on a cache row that was not previously a favorite could have null until it gets an order assigned. The favorites query reflects that:

```sql
SELECT * FROM station_cache
WHERE isFavorite = 1
ORDER BY
    CASE WHEN favoriteOrder IS NULL THEN 1 ELSE 0 END,
    favoriteOrder ASC,
    stationuuid ASC
```

Nulls go to the end. Non-null values are ordered by the column. And as a final tie-breaker, `stationuuid ASC` keeps the list stable if two favorites end up with the same order because of some bug. That third key is not paranoia: it is the difference between a list that jumps when there is a tie and a list that stays put.

The migration is registered in the Koin builder, added to the four before it:

```kotlin
AppMigrations.MIGRATION_2_3,
AppMigrations.MIGRATION_3_4,
AppMigrations.MIGRATION_4_5,
AppMigrations.MIGRATION_5_6
```

This matters because Room compares the version persisted on the device against the version declared by the code. If the list is incomplete, the app crashes on first boot. The `KoinModuleMigrationsTest` verifies exactly that: after the migration was added, the test confirms that the registered production version is 6. Skipping that test means trusting that the next person who adds a migration will remember to update the list. Trusting manual discipline when there is an automatic way to check is exactly what the RadioHub release pipeline tries to avoid.

## The DAO as a contract between gesture and disk

Once the schema is decided, the DAO design is what defines the cost of maintaining this feature in the future. There are three methods worth a closer look.

The first is the automatic order assignment when a new favorite is marked:

```kotlin
@Query("SELECT COALESCE(MAX(favoriteOrder), -1) + 1 FROM station_cache WHERE isFavorite = 1")
suspend fun nextFavoriteOrder(): Int
```

A new favorite receives `MAX(favoriteOrder) + 1`, which places it at the end of the list. The `-1` when there are no favorites means the first one will get `0`, not `1`. That detail does not affect the person using the app, but it makes `UPDATE favoriteOrder = 0` stable and predictable in the database.

The second method is the operation the drag gesture executes:

```kotlin
@Transaction
suspend fun reorderFavorites(orderedUuids: List<String>) {
    orderedUuids.forEachIndexed { index, uuid ->
        updateFavoriteOrder(uuid, index)
    }
}
```

The `@Transaction` annotation guarantees atomicity: if the app dies halfway through a long reorder, the database is not left with half-written indices. The function receives the list of UUIDs in the visible order from the UI and reassigns indices `0, 1, 2, ...` consecutively.

That choice — reassigning consecutive indices — has a consequence that only becomes apparent weeks later. The `favoriteOrder` column does not accumulate gaps. A deleted favorite does not leave a `favoriteOrder = 5` orphan in the middle of the list. Subsequent inserts can use `MAX + 1` without worrying about reindexing. It is a dense schema.

The third method is the separation between "save favorite" and "update favorite state." `saveFavorite` receives an entity, looks up whether it already exists, and depending on the case either does an `insert` with a new order or an `update` that keeps the previous order. The key branch is this:

```kotlin
if (existing == null) {
    insert(entity.copy(isFavorite = true, favoriteOrder = favoriteOrder))
} else if (!existing.isFavorite || existing.favoriteOrder == null) {
    updateFavorite(entity.stationuuid, true, favoriteOrder)
}
```

If the row exists and is already a favorite with an assigned order, nothing is rewritten. If it exists but does not yet have an order, it gets one now. That covers two real cases: a favorite marked on an older version (without order) and a favorite marked on a newer version (with order). The DAO does not need to know about versions: it distinguishes by the state of the data.

## The screen, where persistence becomes a gesture

PR #24 added 144 lines to `FavoritesScreen.kt` and removed 19. PR #25, the next day, added 108 more and removed 23. Together, 252 lines of changes in the same file. The screen went through two review rounds and it is worth understanding why.

The gesture structure rests on four local states:

```kotlin
var draggingUuid by remember { mutableStateOf<String?>(null) }
var dragOffsetPx by remember { mutableStateOf(0f) }
var dragStartOrder by remember { mutableStateOf<List<Station>>(emptyList()) }
var dragMoved by remember { mutableStateOf(false) }
```

`draggingUuid` identifies the row being dragged. `dragOffsetPx` is the vertical offset in pixels since the gesture started. `dragStartOrder` saves a copy of the list at the moment the drag started — it is used to restore the list if the gesture is cancelled. `dragMoved` is the signal that decides whether the reorder is persisted at the end or discarded.

The gesture begins with an `onDragStarted` that captures the current order, marks the row as dragged, and fires a long-press vibration to confirm the gesture has been recognized. `onDragBy` updates the offset. `onDragFinished` decides: if the user moved the row at least one position, persist; otherwise, restore the original order.

The animation follows the finger with three components:

```kotlin
translationY = if (isDragging) dragOffsetPx else 0f
scaleX = dragScale
scaleY = dragScale
shadowElevation = dragElevation
```

The dragged row lifts visually above the rest (higher shadow, slight scale) and follows the finger. The rows that are not being dragged stay in place until the active row crosses their position.

## The hysteresis that prevents indecision

The first version of the gesture had a subtle problem: every time the finger crossed 60% of a row's height, that row moved. If someone dragged from top to bottom, they reached 60% of the first row, that row moved up, the geometry changed, and as the drag continued it could cross 60% of the next row and move again. In a continuous and decisive gesture this does not happen. In a hesitant gesture, the list vibrates forward and back.

The fix was hysteresis: use a different threshold depending on the direction of motion:

```kotlin
val direction = if (dragOffsetPx > 0f) 1 else -1
val isReversing = (lastDirection != 0 && lastDirection != direction)
val threshold = slotSizePx * if (isReversing) 0.72f else 0.62f
```

Forward, it takes crossing 62% of the row height for the jumped row to swap. To reverse direction, it takes 72%. That extra 10% is the buffer that prevents a small tremor in the finger from oscillating the list.

The visible consequence is that the list feels solid. Decisions to move are harder to undo accidentally, but easier to complete when they are intentional. It is a change that you only notice when you remove it: during internal testing, the version without hysteresis produced feedback like "sometimes the favorites move by themselves." With hysteresis, nobody says anything, which is usually the best signal that a detail works.

## Haptic feedback in two moments, not in every frame

The screen fires two kinds of vibration during a drag. A `LongPress` at the start of the gesture, confirming that the long press has been recognized. A `TextHandleMove` every time a row swaps position, marking the threshold crossing.

The decision was not to vibrate at other moments. Not when starting a cancelled drag. Not when restoring the original order. Not when reordering automatically at the end. The reason is simple: vibration becomes noise when it fires on every frame or every transition. A haptic is information when it fires rarely, in the moments where the user needs to know something has changed.

`HapticFeedbackType.TextHandleMove` exists in the Compose API precisely for this: telling the user that a text or list handle has jumped position. It is a constant designed for text editors, but it fits a reorderable list perfectly. Reusing a semantically correct value from the platform is better than inventing a new channel that the system does not know how to interpret.

The corresponding test does not need a real device to verify the decision. The Compose `HapticFeedback` unit exposes the type as data; it is enough to assert that `performHapticFeedback` is called with `TextHandleMove` when appropriate and with nothing when it is not.

## Cancelling a gesture and returning to the prior state

There is a category of gestures that never end in `onDragFinished` with persistence: gestures where the finger never moved any row. In that case `dragMoved` stays at `false` and `dragStartOrder` holds the list from before the gesture.

The cancellation flow is this: if `dragMoved` is `false`, `onDragFinished` does not call `viewModel.reorderFavorites`. The list returns to its original state because the rendered values depend on `dragStartOrder` while `draggingUuid` is not `null`. When `draggingUuid` becomes `null` and `dragMoved` is `false`, the list recomposes with the prior order.

It is an almost invisible but important UX decision. If someone taps a row by accident and releases without moving, the list is not altered. That distinguishes a real drag from an accidental tap. Without that cancellation branch, opening the favorites section and tapping a row would reorganize the list for every future launch.

## TalkBack: move up and move down

The drag gesture is only one of the two ways to reorder. The second is TalkBack's native actions: "move up" and "move down."

The strings live in `values/strings.xml` and `values-es/strings.xml`:

```xml
<string name="favorites_move_up">Move up</string>
<string name="favorites_move_down">Move down</string>
<string name="favorites_reorder_description">Reorder %1$s. Press and hold, then drag.</string>
```

The pattern is the accessibility standard for reorderable lists. A screen reader user focuses a row, triggers the contextual action "move up," and the row moves up one position. Each action produces the same change in the database as a drag: a call to `viewModel.reorderFavorites`.

The accessible description of the row includes "Press and hold, then drag," which tells TalkBack that the row has drag behavior. The person navigating with gestures can decide whether to use the screen reader or direct drag; both paths arrive at the same state.

The detail matters because the temptation when adding a new interaction is to forget about people who cannot use touch gestures. A reorderable without accessible actions is an incomplete feature for a significant fraction of users.

## Why Google Play blocked 1.8.0

On the same day the reorder was integrated, another PR — #23 — removed a permission from the manifest. It was a decision forced by Google Play review, not an aesthetic optimization.

The permission removed was `android.permission.USE_FULL_SCREEN_INTENT`. Until 1.8.0, RadioHub declared this permission in order to show the alarm screen on top of the lock screen using a full-screen intent. The API has existed since Android 10 and lets you launch an activity when a high-priority notification is received, ideal for alarms.

The problem is that, since Android 14, Google Play tightened the policy on this permission. Apps that declare it must justify it in the store listing review form. If the justification is not convincing, the app can be rejected before the update goes through.

RadioHub already had the `AlarmRingingActivity` screen. But the review question was not "do you have it?" but "is it essential to your alarm functionality?" The honest answer was "no." An alarm can be handled perfectly well from a high-priority notification with "Stop" and "Snooze" actions, without needing to launch an activity that takes over the entire display. The lock screen of the operating system itself takes care of presenting the notification in the right format.

Removing the permission required three coordinated changes.

The first was the manifest: drop the permission line. The second was `AlarmService.kt`: stop attaching the full-screen-intent to the alarm notification. The third was the alarms screen: it no longer showed the Android 14 banner asking for the permission. The file `FullScreenAlarmPermissionBanner.kt`, 72 lines, ceased to exist.

## The test that verifies the removal

A PR that removes a permission needs a test that proves the removal is real. If the test passes and the permission is still declared, there is a contradiction that can be detected.

`AlarmNotificationTest.kt` was updated with this explicit assertion:

```kotlin
@Test
fun alarmNotificationDoesNotUseFullScreenIntent() {
    val notification = buildAlarmNotification(...)
    assertNull(notification.fullScreenIntent)
}
```

The notification built by the service does not have `fullScreenIntent` set. If someone in the future accidentally adds `setFullScreenIntent` to the alarm notification, this test fails. It is a verifiable invariant, not a convention.

The test does not need a device. `Notification` is a POJO with a boolean field. Building a test notification with the real constructor and asserting that the field is `null` is trivial and robust. What it verifies is the decision, not the compilation.

## The trade-off of not asking for a permission

Removing `USE_FULL_SCREEN_INTENT` changes the alarm experience in two ways.

The first: on Android 14+, the banner that asked the user to grant the permission the first time the app used it no longer appears. That reduces friction and avoids a step where many people tap "no" without understanding what they were rejecting.

The second: when the alarm sounds, the person sees a standard high-priority notification instead of a full-screen activity. On most devices with a lock screen, the visible result is very similar: the notification appears on top of the clock with big Stop and Snooze buttons. But on devices where the OS was specifically optimizing for full-screen intents, the presentation can be slightly less prominent.

RadioHub accepted the trade-off because the visual difference is marginal and the Google Play review cost was real. Every app update waited while a reviewer decided whether the justification was sufficient. For an indie app, that risk is not worth the marginal benefit of a full-screen activity.

The 1.8.1 release describes the change exactly that way in the CHANGELOG:

> Alarms now use a high-priority lock-screen notification with Stop and Snooze instead of requesting full-screen intent access.

Short sentences, no marketing jargon. A person updating the app knows exactly what changed in their experience.

## The 1.8.1 release as the close of the cycle

The branch that integrated the reorder — PR #24 — also closed PR #22, which had been left open during the alarm changes. #22 proposed the first version of the reorder; when the work was reopened against main, the alarm commits and the new migration already existed. Applying #22 on top required a rebase. The fix was to reapply the work against the current main — PR #24 — with the right migration and updated tests.

The CHANGELOG reflects the chronological order of the product, not the order of merges:

```markdown
## [1.8.1] - 2026-09-21

### Added
- Favorites can now be reordered by dragging and keep the chosen order between app sessions.

### Changed
- Redesigned the Favorites section to make saved stations clearer and easier to organize.
- Alarms now use a high-priority lock-screen notification with Stop and Snooze instead of requesting full-screen intent access.
```

The "Added" section contains the new functionality. The "Changed" section contains adjustments that affect someone who already had the app installed. The alarms note lives in "Changed" because it is not a new feature: it is a decision about how an existing feature is presented.

The `v1.8.1` git tag was created after the tests passed and the AAB was built. It was not created as an intent marker at the start of the work, but as confirmation at the end. A small discipline that keeps the meaning of the tags.

## What this release does not try to solve

Drag reorder does not solve several problems that are out of its scope.

It does not sync the order across devices. If a person saves favorites on their phone and opens the app on a tablet, the order is independent. RadioHub has no user account and no cloud sync; adding that would be a separate project.

It does not auto-reorder by usage. The `lastPlayedAt` column has existed for several releases, but it does not influence the list order. A favorite that you listen to every morning does not automatically rise to the first position. That decision is deliberate: if reordering were automatic, a person could not impose their own criteria.

It does not allow dragging between lists. The "Recently Played" section is independent of the "Favorites" section. Moving a row from one to the other is not a supported gesture; it requires unmarking and remarking.

It does not export the order. There is no "share my favorites list in this order" button. If someone wants to recommend a list, they have to type it out.

Each of these absences is a decision, not a limitation. A favorites section that tries to do everything ends up being confusing. RadioHub keeps the scope small and predictable.

## Why the PR #24 → PR #25 iteration was necessary

PR #24 integrated the reorder. PR #25 refined it. Without #25, the gesture worked, but the list felt jittery in certain edges.

The specific changes in #25:

The thresholds came to depend on the measured row height (`slotSizePx`) instead of a fixed 44 dp value. This matters on very high or very low density screens: 44 dp can be too sensitive on some devices and too sluggish on others.

The hysteresis became explicit through `lastDirection`, a variable that remembers the direction of the last movement. That formalized the behavior that had been implicit before: reversing direction requires a bit more displacement before it actually reverses.

Elevation and scale started to use `animateFloatAsState`. Before, the values appeared and disappeared abruptly. Now, the row lifts smoothly when the drag starts and returns to its place with the same animation when it ends.

Persistence only runs after a completed movement. `dragMoved` activates with the first threshold crossing and does not deactivate until the gesture ends. A person who moves a row two positions and then cancels sees the list return to its original state, not get stuck halfway.

Each of these changes is small. Together, they turn a gesture that "works" into one that feels finished. The difference between the two PRs is the class of polish that distinguishes an indie app that cares about details from one that only implements the minimum.

## Lessons from the cycle

The first lesson is that a touch gesture does not end when "it does what it says." It ends when the list feels solid under the finger. Hysteresis, animation, and conditional persistence are part of the same design as the SQL query.

The second is that a DAO is not just a persistence layer. It is a contract about how the UI and storage talk to each other. Method signatures like `nextFavoriteOrder` or `reorderFavorites` impose constraints that make certain bugs impossible by design.

The third is that a permission declared in the manifest is a commitment. It is not static: it has to be justified every release cycle if Google Play demands it. If the justification weakens, removing the permission is better than maintaining patch after patch of review.

The fourth is that accessibility is not an extra layer. TalkBack's "move up" and "move down" actions are half of the reorder contract. Without them, the feature only exists for part of the people.

The fifth is that an honest CHANGELOG fits in two sentences per change. No marketing, no epic. A person updating the app wants to know what changed in their experience; the rest lives in commits, PRs, and devlogs like this one.

## Result

After this cycle, RadioHub offers a favorites section that respects human order, preserves it across sessions, stays accessible via TalkBack, and removes a permission commitment Google Play had stopped accepting.

The 1.8.1 release, dated September 21, 2026, includes:

- Room v5 → v6 migration with a dense `favoriteOrder`;
- DAO with an explicit contract for atomic reordering;
- drag gesture with hysteresis, haptic feedback at two points, and conditional persistence;
- native TalkBack actions for move up and move down;
- removal of the `USE_FULL_SCREEN_INTENT` permission;
- high-priority alarm notifications with Stop and Snooze;
- CHANGELOG with two Added entries and two Changed entries, no editorial noise.

None of this changes the experience for someone who just wants to listen to the radio. But anyone who uses the favorites section every day notices that the app now does what they expected.

## References

- [PR #22 — feat(favorites): add persistent drag reordering (closed)](https://github.com/ArceApps/RadioHub/pull/22)
- [PR #23 — fix(alarms): remove full-screen intent permission](https://github.com/ArceApps/RadioHub/pull/23)
- [PR #24 — feat(favorites): integrate persistent drag reordering](https://github.com/ArceApps/RadioHub/pull/24)
- [PR #25 — Improve favorite reorder feedback](https://github.com/ArceApps/RadioHub/pull/25)
- [Android Developers — Build accessible apps with Compose](https://developer.android.com/develop/ui/compose/accessibility)
- [Android Developers — Permissions on Android: USE_FULL_SCREEN_INTENT](https://developer.android.com/reference/android/Manifest.permission#USE_FULL_SCREEN_INTENT)
- [Android Developers — Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
- [Compose — LocalHapticFeedback](https://developer.android.com/reference/kotlin/androidx/compose/ui/hapticfeedback/package-summary)
- [Previous devlog — RadioHub: audio delay and recording pipeline (2026-W38)](https://arceapps.github.io/devlog/2026-W38-radiohub-audio-delay-clock/)
- [Previous devlog — RadioHub: self-contained release gate (2026-W38)](https://arceapps.github.io/devlog/2026-W38-radiohub-release-gate/)