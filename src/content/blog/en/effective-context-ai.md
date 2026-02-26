---
title: "Effective Context for AI: Prompt Engineering"
description: "How to craft prompts that work. From simple instructions to complex multi-step reasoning. Optimizing context windows."
pubDate: 2025-10-25
heroImage: "/images/placeholder-article-prompt-context.svg"
tags: ["AI", "Prompt Engineering", "Context", "Productivity", "GitHub Copilot", "Gemini", "Android"]
reference_id: "0f3f40cf-3a5d-481d-b211-b372ac4a2298"
---
## 🧠 Context is King

The single biggest factor in the quality of AI output is the quality of the input (context). An LLM is a completion engine. If you give it vague context, it hallucinates. If you give it specific context, it reasons.

### The 4 C's of Context

1.  **Capacity**: The role (Act as a Senior Android Engineer).
2.  **Context**: The background (Project is MVVM, Hilt, Room).
3.  **Constraints**: The rules (Use Kotlin, no Java, handle errors with Result).
4.  **Chain of Thought**: The process (Think step-by-step).

## 📝 Example: The Bad Prompt

> "Create a login screen."

**Result**: A generic XML layout, probably using `RelativeLayout` or `LinearLayout`, maybe in Java.

## 🚀 Example: The Good Prompt

> "Act as a Senior Android Developer. Create a Login Screen using Jetpack Compose (Material 3).
>
> **Context**:
> - Use Hilt for DI.
> - ViewModel should expose `StateFlow<LoginUiState>`.
> - Handle loading, success, and error states.
>
> **Constraints**:
> - Use `OutlinedTextField` for inputs.
> - Validate email format.
> - Do NOT use LiveData.
>
> **Steps**:
> 1. Define `LoginUiState`.
> 2. Create `LoginViewModel`.
> 3. Implement `LoginScreen` composable."

**Result**: Production-ready code that fits your architecture.

## 🛠️ Optimizing Context Windows

Don't paste 50 files. Be selective.
- **Relevant Files Only**: Paste the ViewModel and the Repository interface, not the whole `data` layer.
- **Summarize**: Instead of pasting a 2000-line file, say "User model has id, name, email."

## 🤖 Advanced Technique: Few-Shot Prompting

Show, don't just tell. Give examples of desired output.

> "Convert this JSON to a Kotlin Data Class.
>
> Example:
> Input: `{"id": 1, "name": "John"}`
> Output:
> ```kotlin
> @Serializable
> data class User(val id: Int, val name: String)
> ```
>
> Now convert this: ..."

## 🏁 Conclusion

Prompt Engineering is the new coding. Writing effective prompts is a skill that separates average developers from 10x AI-augmented engineers.
