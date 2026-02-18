---
title: "AI Agent Skills: Dynamic Context Injection"
description: "How to inject dynamic context into AI agent prompts. Techniques for providing memory, skills, and tools on-the-fly."
pubDate: 2025-10-25
heroImage: "/images/placeholder-article-ai-skills.svg"
tags: ["AI", "Context", "Agents", "Memory", "LLM", "Prompt Engineering"]
reference_id: "c8b07a57-31a7-459e-94af-fc4d60d827e7"
---
## 🧠 The Context Limit Problem

LLMs have a fixed context window (e.g., 32k, 128k tokens). You cannot feed them your entire codebase, your user's history, and every possible API doc on every request. It's slow and expensive.

## 💉 Dynamic Injection Strategy

Instead of a static system prompt, we build the prompt dynamically based on the user's current query. This is **Retrieval-Augmented Generation (RAG)** applied to instructions, not just documents.

### 1. Intent Classification
First, determine what the user wants.
- User: "Book a flight to Paris."
- Classifier: Intent = `TRAVEL_BOOKING`.

### 2. Skill Retrieval
Fetch the relevant instructions (skills) for that intent.
- Skill: `FlightBookingService.yaml` (API schema).
- Memory: User prefers aisle seats (from User Profile).

### 3. Prompt Assembly
Combine these into the final prompt sent to the LLM.

```
SYSTEM: You are a travel assistant.
CONTEXT: User prefers aisle seats.
TOOLS:
- search_flights(origin, dest, date)
- book_flight(flight_id)

USER: Book a flight to Paris tomorrow.
```

## 🛠️ Implementation: Vector Search for Skills

Store your agent's skills as embeddings in a vector database (Chroma, Pinecone). When a query comes in:
1.  Embed the query.
2.  Search for similar skills.
3.  Inject the top 3 matches into the prompt context.

### Example: Code Assistant
- User: "Fix the bug in the login screen."
- Search: Finds `LoginScreen.kt`, `AuthRepository.kt`, and `LoginViewModel.kt` content.
- Result: Highly relevant context without loading the whole project.

## 🚀 Optimization: Summarization

If context is still too large, use an LLM to summarize previous turns or documents before injection.
- **Map-Reduce**: Summarize chunks in parallel.
- **Refine**: Iteratively improve the summary.

## 🏁 Conclusion

Dynamic context injection is the key to building scalable, smart agents. It turns a generic LLM into a specialized expert that knows exactly what it needs to know, exactly when it needs to know it.
