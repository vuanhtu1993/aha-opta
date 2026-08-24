# Single Natural Scroll View for Vocab Review Design Spec

## Overview
This design spec outlines the architecture for unifying the `/vocab/review` quiz page layout into a single natural scrollable container. This allows the Top Header Bar (progress bar, close button) to scroll up out of view when the iOS virtual keyboard is active, dedicating 100% of the visible viewport height to the sentence prompt, word explanation, audio controls, cloze input field, and action buttons.

## Problem Statement
When the virtual keyboard appears on iOS Safari:
- The visual viewport shrinks to ~350px.
- Previously, the top header bar was fixed/pinned at the top (`shrink-0`), taking up ~50px of prime screen real estate.
- Previously, the input field was moved outside the card into a fixed bottom zone, which disrupted the visual aesthetic and unity of the Cloze Flashcard.
- Moving the input back into the card while maintaining a separate fixed header left insufficient vertical space for the card content, causing input clipping and jitter when JS-based scroll overrides fought with native browser scroll behaviors.

## Proposed Solution: Single Natural Scroll View

### 1. Unified Container Architecture
In `QuizPlayer.tsx`, eliminate the rigid split between `Header (shrink-0)` and `Main Container (flex-1)`. Instead, nest both the Header and the Card inside a single full-height scrollable element:

```
Outer Container (position: fixed / h-dvh, locked to visual viewport)
  └── Single Scroll Container (flex-1 overflow-y-auto w-full max-w-[480px])
       ├── Top Header Bar (Progress bar, Close button)  ← Natural flow (scrolls up when keyboard opens)
       ├── ClozeCard / MCQCard                         ← Natural flow
       │    ├── Badges & Header
       │    ├── Sentence Prompt ("Once the tech giant adopted...")
       │    ├── Explanation ("Nghĩa: ..."), Audio & Level
       │    ├── Cloze Input Form (<input> + Send button)
       │    └── Give Up Button ("Tôi chưa nhớ từ này")
       └── Feedback Drawer & Next Button (when answered)
```

### 2. ClozeCard Refactoring
Move the input form, `<input>` ref, user input state, and submit/give up event handlers back inside `ClozeCard.tsx`.
- `ClozeCard` manages its own input form state internally.
- `ClozeCard` calls `onSubmitAnswer(userInput, isCorrect)` when submitted or given up.
- The input element has `scroll-margin-bottom` so native focus scrolling leaves comfortable spacing above the keyboard.

### 3. Removal of Jitter-Inducing JS Hacks
- Remove custom `scrollIntoView` timers, `requestAnimationFrame` focus hooks, and `window.scrollTo(0,0)` force-scroll overrides.
- Allow native browser smooth scrolling inside the unified overflow container when an input receives focus.

---

*Made by Anh Tu - Share to be share*
