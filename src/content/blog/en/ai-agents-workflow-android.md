---
title: "Asynchronous Pair Programming with Agents: Sentinel, Bolt, and Palette in Action"
description: "Real Android development cases where delegating to specialized agents beats any standard AI chat. Security, Performance, and UX."
pubDate: 2025-05-22
tags: ["AI", "Kotlin", "Workflow", "Use Cases", "Android"]
heroImage: "/images/placeholder-article-ai-workflow.svg"
reference_id: "69fa58d6-cdb0-4b6c-b299-30a4f305b816"
---
You already have the [theory](/blog/ai-agents-android-theory) and you have the [configuration](/blog/configuring-ai-agents). Now let's see the magic in action. We are going to simulate three real Android development scenarios and see how **Sentinel**, **Bolt**, and **Palette** solve problems that a generalist "chatbot" would likely ignore or solve poorly.

## Case 1: Sentinel vs. The Insecure AndroidManifest 🛡️

**Scenario:** You have an app that uploads photos. You've added permissions "just in case" and fast network configurations for development.

**Prompt to Agent:**
> "Sentinel, review my `AndroidManifest.xml` and my network configuration for production."

**Sentinel's Response (based on its System Prompt):**

```markdown
**SECURITY ANALYSIS - SENTINEL**

[CRITICAL] `android:usesCleartextTraffic="true"` detected.
**Risk:** Allows unencrypted HTTP traffic. An attacker on the same network can intercept session tokens.
**Solution:** Remove the attribute or set it to `false` for production. Use `network_security_config.xml` if you need HTTP only in debug.

[HIGH] `READ_EXTERNAL_STORAGE` permission requested on Android 13+.
**Risk:** Excessive privileges.
**Solution:** Use Android Photo Picker or `READ_MEDIA_IMAGES` for proper granularity on SDK 33+.

[MEDIUM] Activity `DeepLinkActivity` exported without permissions.
**Risk:** Any app can launch this activity.
**Solution:** Add `android:exported="false"` if internal, or protect it with a signature-level permission.
```

*The difference?* A normal chat would have told you "The XML is well formed". Sentinel tells you "You are going to get hacked".

## Case 2: Bolt vs. The RecyclerView Jank ⚡

**Scenario:** You have a complex list of items that stutters (jank) when scrolling.

**Prompt to Agent:**
> "Bolt, here is my `ProductAdapter.kt` and `onBindViewHolder`. Scrolling feels heavy on mid-range devices."

**Bolt's Response:**

```markdown
**PERFORMANCE ANALYSIS - BOLT**

**Problem Detected:** Object creation in `onBindViewHolder`.
Line 45: `val formatter = SimpleDateFormat("dd/MM/yyyy")`
**Impact:** `SimpleDateFormat` is expensive to instantiate. Doing it inside `onBind` executes dozens of times per second during fast scroll, causing GC (Garbage Collection) churn and frame drops.

**Proposed Optimization:**
Move the formatter to a `companion object` or use `java.time.format.DateTimeFormatter` (thread-safe) as a singleton.

**Optimized Code:**
```kotlin
class ProductAdapter : RecyclerView.Adapter<ProductViewHolder>() {
    companion object {
        // Single, reusable instance
        private val DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    }

    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        // ...
        // Direct usage without memory allocation
        holder.dateView.text = item.date.format(DATE_FORMATTER)
    }
}
```

*The difference?* A normal chat would have suggested using Coroutines (unnecessary here). Bolt detects the micro-memory optimization that kills scrolling.

## Case 3: Palette vs. The "Invisible" Button 🎨

**Scenario:** You created a beautiful custom button in Jetpack Compose, but users complain they "can't hit it".

**Prompt to Agent:**
> "Palette, review this `IconButton` Composable. Do you see any usability issues?"

**Palette's Response:**

```markdown
**UX/UI REVIEW - PALETTE**

**Observation:**
Your `Icon` has a size of 24dp and the container `Box` wraps content (`wrapContentSize`).

**Accessibility Issue:**
The resulting touch area is 24x24dp. Material Design and accessibility guidelines require a minimum of **48x48dp**. Users with large fingers or motor impairments will struggle.

**Solution:**
Add `minimumInteractiveComponentSize()` or wrap in a standard `IconButton` which already handles this.

**Improved Code:**
```kotlin
Box(
    modifier = Modifier
        .clickable { onClick() }
        .minimumInteractiveComponentSize() // Palette Magic!
        // Now touch area is 48dp even if visually 24dp
) {
    Icon(
        imageVector = Icons.Default.Add,
        contentDescription = "Add new item", // Added for TalkBack
        modifier = Modifier.size(24.dp)
    )
}
```

## Final Conclusion

Integrating **Sentinel**, **Bolt**, and **Palette** into your workflow isn't about replacing your judgment as a senior developer. It's about **augmenting** it.

These agents act as an extra pair of eyes that never get tired, always remember security rules, are always obsessed with frames per second, and always care about accessibility.

Start today. Create your `agents/` folder, define your `AGENTS.md`, and start programming accompanied.
