---
title: "W23: Enhancing Testing and Documentation Sync (ArceApps)"
description: "Engineering chronicle on adding comprehensive tests for search functionality and syncing visual hierarchy documentation with CSS in the ArceApps portfolio."
pubDate: 2026-06-09
lastmod: 2026-06-09
author: "ArceApps"
keywords: ["ArceApps", "devlog", "testing", "documentation", "vitest"]
canonical: "https://arceapps.com/devlog/2026-w23-testing-documentation/"
tags: ["devlog", "arceapps", "testing", "documentation", "css", "vitest"]
heroImage: "/images/devlog-default.svg"
reference_id: "2026-w23-testing-documentation"
---

## State of the Art: Building in Public

Hello everyone! Welcome to a new installment of the devlog for **ArceApps**, the portfolio and agent ecosystem we are building in public. The last three weeks have seen a targeted effort to improve our test coverage and ensure our documentation stays perfectly synchronized with our actual codebase implementation. While PuzzleHub focuses on game logic, this [ArceApps Portfolio] devlog is all about maintaining a robust, well-documented, and thoroughly tested web platform.

We tackled some technical debt in our test suites by removing deprecated APIs and added crucial unit tests to ensure our search modal behaves correctly under all conditions. Additionally, we synchronized our visual hierarchy documentation with our global CSS, maintaining the Single Source of Truth principle. Let's dive into the technical details of these changes.

## Milestone 1: Comprehensive Unit Tests for Search Modal State Transitions

The ArceApps portfolio features a dynamic search modal that relies heavily on client-side state manipulation. Ensuring that opening, and specifically closing, this modal correctly cleans up the state is vital for a smooth user experience. We noticed a gap in our test coverage for the `closeModal` function in `src/scripts/search.ts`.

To rectify this, we introduced a suite of unit tests focusing on the observable side-effects of closing the modal. Rather than just testing if the function executes without throwing errors, we wanted to ensure the DOM is manipulated exactly as expected.

### Verifying DOM Side-Effects

Our testing strategy involved setting up a mock DOM environment using Vitest and JSDOM, simulating an open modal state, calling `closeModal`, and then asserting the final DOM state.

```typescript
// src/scripts/search.test.ts (Snippet demonstrating test approach)
it('should clear input value and results container when closing modal', () => {
  // 1. Arrange: Set up initial state (modal open with content)
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchResults = document.getElementById('search-results');
  searchInput.value = 'query';
  searchResults.innerHTML = '<li>Result 1</li>';

  // 2. Act: Call closeModal
  closeModal();

  // 3. Assert: Verify expected state changes
  expect(searchInput.value).toBe('');
  expect(searchResults.innerHTML).toBe('');
  expect(document.body.style.overflow).toBe(''); // Verify body scroll restoration
});
```

These tests verify critical state transitions:
1.  **Clearing Inputs:** The search input must be emptied so the next time the modal opens, it's a fresh slate.
2.  **Resetting Visibility:** The results container needs to be cleared or hidden.
3.  **Restoring Body Overflow:** Crucially, when the modal opens, we prevent background scrolling by setting `document.body.style.overflow = 'hidden'`. When closing, we must ensure this is reverted so the user can scroll the main page again.
4.  **Handling Edge Cases:** We also added tests to ensure `closeModal` doesn't throw exceptions if DOM elements are missing (e.g., if called before the DOM is fully loaded or if the HTML structure changes unexpectedly), ensuring robustness.

## Milestone 2: Refactoring Tests to Remove Deprecated APIs

While working on the test suite, we identified an opportunity to clean up technical debt in `src/scripts/layout.test.ts`. We were using a mock for `matchMedia` that included deprecated listener methods.

### Modernizing matchMedia Mocks

The older `addListener` and `removeListener` methods on `MediaQueryList` are deprecated. Modern browsers, and consequently our up-to-date testing environments, expect the standard EventTarget methods: `addEventListener` and `removeEventListener`.

```typescript
// src/scripts/layout.test.ts (Before refactoring)
// Mock setup (deprecated approach)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

We refactored this to align strictly with modern standards, removing the deprecated methods entirely from our mock setup. This ensures our tests accurately reflect how the code will execute in a modern browser context and prevents future warnings or breakages as testing libraries update to strictly enforce modern APIs.

```typescript
// src/scripts/layout.test.ts (After refactoring)
// Mock setup (modern approach)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```
This seemingly small change is part of our commitment to maintaining a clean, warning-free, and forward-compatible codebase.

## Milestone 3: Synchronizing Visual Hierarchy Documentation with CSS

A significant challenge in any evolving software project is keeping documentation synchronized with the actual implementation. In the ArceApps portfolio, we have specific devlogs detailing our design philosophy, such as the "Responsive Visual Hierarchy 2024" article (`src/content/devlog/en/responsive-visual-hierarchy-2024.md` and its Spanish counterpart).

### The Challenge of Outdated Docs

We realized that comments within our `src/styles/global.css`, which define crucial aspects of our visual hierarchy (like `max-inline-size` constraints for Markdown content), had become out of sync with the explanations provided in our devlogs. This creates a confusing experience for any developer (or agent) trying to understand the system.

### The Solution: Manual Sync and Future Automation Ideas

We manually synchronized the CSS comments with the devlog text to ensure consistency.

```css
/* src/styles/global.css (Synchronized Comment) */
.prose img, .prose video, .prose iframe {
  /* Restricting media to prevent breaking layout on large screens.
     See: src/content/devlog/.../responsive-visual-hierarchy-2024.md */
  max-inline-size: min(100%, 500px);
}
```

While a manual sync solves the immediate issue, this highlights a potential future project: automating the synchronization between code comments and documentation, perhaps using a script that extracts specific comments and injects them into Markdown files during the build process. For now, maintaining this discipline is key.

## Conclusion

The past three weeks have been focused on the invisible but crucial parts of software engineering: writing robust tests, cleaning up technical debt, and ensuring documentation accuracy. By adding comprehensive unit tests for our search modal, removing deprecated testing APIs, and synchronizing our visual hierarchy documentation, we are building a more stable and maintainable ArceApps portfolio.

These incremental improvements ensure that as we add more complex features or integrate new agents into our ecosystem, the foundational layer remains solid. Until the next update, happy coding!

### Deep Dive: The Importance of Accurate Mocks in Modern Web Development

When testing frontend applications, especially those that interact closely with browser APIs like the DOM or window object, the fidelity of your test environment is paramount. Using obsolete mocks, such as those relying on deprecated `matchMedia` listener methods, can create a false sense of security. Your tests might pass locally, but the code could behave unpredictably in production environments where those older APIs might be completely removed or behave differently in edge cases. By proactively updating our testing infrastructure to align with current web standards, we not only prevent future breakages but also ensure that our development practices remain sharp and relevant. This proactive maintenance is a cornerstone of our engineering philosophy at ArceApps. We believe that tests are not just a safety net; they are living documentation of how the system is expected to function. Therefore, keeping the test suite itself clean and modern is just as important as the application code it verifies. The effort spent refactoring these tests pays dividends in developer confidence and system stability over the long term.

### Expanding on Documentation Synchronization Strategies

The challenge of keeping documentation in sync with code is a well-known problem in software engineering. While our manual synchronization of the visual hierarchy documentation and CSS comments was a necessary first step, it is inherently fragile. Human error is inevitable, and as the codebase grows, remembering to update multiple locations for a single conceptual change becomes increasingly difficult. We are actively exploring architectural solutions to this problem. One approach is "Documentation as Code," where the source of truth for both the implementation and the explanation resides in a single, verifiable location. For styling, this could mean using design tokens defined in a central configuration file, which are then consumed by both our CSS build pipeline and a documentation generator. This would guarantee that the values discussed in our devlogs perfectly match the CSS applied in production. Another avenue is developing custom linters or pre-commit hooks that scan our CSS files and warn developers if corresponding devlog entries are not updated. These types of automated safeguards are essential for scaling a project like the ArceApps portfolio while maintaining high standards of quality and consistency.

### Architectural Implications of Search Modal State Management

The search modal in our portfolio, while seemingly simple, represents a micro-architecture of state management. The decision to extensively test the `closeModal` function stems from the recognition that modal dialogs are frequent sources of state leaks in single-page applications (SPAs) or highly interactive sites like ours. When a modal opens, it typically alters the global state—such as modifying the body's overflow property to prevent background scrolling. If the modal closes unexpectedly (e.g., due to an error in another component, or an unhandled user interaction), and the cleanup function isn't perfectly robust, the application can be left in an inconsistent state, such as the user being unable to scroll the main page. By writing tests that specifically verify these cleanup side-effects, we are codifying the contract of our modal component. This contract guarantees that regardless of how the modal is dismissed, the application returns to a clean, usable baseline. This rigorous approach to state management, even for localized UI components, is what differentiates a merely functional portfolio from a truly professional engineering showcase. It demonstrates a deep understanding of browser mechanics and a commitment to delivering a flawless user experience under all conditions. As we continue to develop the ArceApps ecosystem, these foundational patterns of robust state management and rigorous testing will serve as a blueprint for more complex features and agent interactions. We are not just building features; we are building a resilient platform capable of supporting our future ambitions.
