# Phase 4.3 — Export Visual QA + Download Contract

## Purpose

This contract verifies the local share-card PNG export surface before Phase 4 is closed.

The export must stay local-only, visually bounded, and limited to the share-card summary. It must not expose raw answers, full result JSON, account data, backend persistence, AI generation, public links, analytics, or payment scope.

## Required export visual contract

The generated SVG source used for local PNG conversion must include:

- `width="1200"`
- `height="1600"`
- `viewBox="0 0 1200 1600"`
- product label: `The 20 Corridors`
- `Corridor signature`
- `Dominant traits`
- `Main tension`
- `Consistency`
- `Motive`
- local-only boundary note

## Required download contract

The canonical observer-strategist fixture must export with this filename:

```text
the-20-corridors-the-observer-strategist.png
```

The filename must be generated from the share-card title and must not include raw answer data, user data, timestamps, or full-result serialization.

## Required escaping contract

Unsafe text must be XML-escaped before being inserted into the SVG. At minimum:

```text
<script>alert("x")</script> → &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;
A & B < C > D → A &amp; B &lt; C &gt; D
```

The SVG output must not contain executable `<script>` tags.

## Required local-only contract

The implementation may use:

- `document.createElement('canvas')`
- `canvas.toBlob`
- `new Blob([svg])`
- `window.URL.createObjectURL`
- `anchor.download`
- `window.URL.revokeObjectURL`

The implementation must not use:

- `fetch`
- `XMLHttpRequest`
- `navigator.sendBeacon`
- analytics libraries
- Supabase/Prisma/database clients
- AI/LLM generation calls
- Stripe/payment calls
- `localStorage` or IndexedDB persistence

## Phase 4 closure dependency

Phase 4 closure may proceed only after:

1. local export readiness passes,
2. export visual QA passes,
3. image export remains local-only,
4. raw-answer leakage remains blocked,
5. full-result export remains blocked,
6. build and validation remain green.
