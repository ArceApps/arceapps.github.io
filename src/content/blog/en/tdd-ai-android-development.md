---
title: "TDD in the Era of AI: Red, Green, Refactor, Prompt"
description: "Test Driven Development is not dead. In fact, with AI, it's more powerful than ever. Learn the new workflow: Red, Green, Refactor, Prompt."
pubDate: 2025-11-25
heroImage: "/images/placeholder-article-tdd-ia.svg"
tags: ["TDD", "AI", "Testing", "Android", "Workflow"]
reference_id: "90950ef3-af51-4b8a-a1e5-b44351692cf0"
---
## 🧪 Is TDD Dead?

Some say that with AI writing code, we don't need tests. **They are wrong.**
If AI writes the code, **you** must verify it. And the only way to verify logic at scale is with automated tests.

TDD (Test Driven Development) is the perfect safety net for AI-generated code.

## 🔄 The New Cycle: Red, Green, Prompt, Refactor

The classic cycle was:
1.  **Red**: Write a failing test.
2.  **Green**: Write minimum code to pass.
3.  **Refactor**: Clean up.

The **AI-Enhanced Cycle** is:
1.  **Red (Human)**: You write the test (The Specification). This defines "Done".
2.  **Green (AI)**: You ask Copilot/Gemini: "Implement the function to pass this test."
3.  **Refactor (AI + Human)**: "Optimize this solution."

## 📝 Example: Validation

**Step 1: The Test (Human)**
```kotlin
@Test
fun `should return error when password lacks uppercase`() {
    val validator = PasswordValidator()
    val result = validator.validate("password123")
    assert(result is ValidationResult.Error)
}
```

**Step 2: The Prompt (Human)**
"Generate `PasswordValidator` that passes this test."

**Step 3: The Code (AI)**
```kotlin
class PasswordValidator {
    fun validate(input: String): ValidationResult {
        if (!input.any { it.isUpperCase() }) {
            return ValidationResult.Error("Must contain uppercase")
        }
        return ValidationResult.Success
    }
}
```

## 🚀 Why this is faster

*   You don't think about implementation details ("how do I check uppercase in regex?").
*   You only think about **Behavior** and **Edge Cases**.
*   The AI guarantees the syntax is correct.
*   The Test guarantees the logic is correct.

## 🎯 Conclusion

Don't let AI write code without a spec. **The Test is the Spec.**
Write the test first, and you will become the Architect of the AI, not just its reviewer.
