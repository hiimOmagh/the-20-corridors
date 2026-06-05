# Phase 2 Transition Plan

## Current state

Phase 1.7 intentionally blocks premature UI/backend/AI artifacts through the engine release gate. Phase 1.8 does not remove that guard yet; it defines the contract for relaxing it.

## Transition step for Phase 2.0

The first UI package must explicitly modify the release gate from:

```text
no UI/backend/AI artifacts allowed
```

to:

```text
UI artifacts allowed only in approved Phase 2 paths; backend, database, AI, auth, payment, and analytics artifacts still blocked unless explicitly scoped.
```

## Approved initial UI paths

Recommended Phase 2 paths:

```text
app/
src/app/
src/components/
src/components/ui/
src/features/quiz/
src/features/results/
src/styles/
public/
```

The actual paths should be chosen once the Next.js project scaffold is introduced.

## Still-blocked paths in Phase 2

```text
src/server/
src/api/
app/api/
pages/api/
server/
api/
db/
database/
prisma/
supabase/
migrations/
ai/
llm/
prompts/
src/ai/
src/llm/
src/prompts/
src/core/ai/
src/core/llm/
```

## Required Phase 2.0 package behavior

The Phase 2.0 package must include:

- Next.js/app scaffold or equivalent UI scaffold.
- Updated release gate allowing approved UI paths.
- UI import-boundary scanner test.
- Basic landing and quiz route skeletons.
- No backend, AI, auth, payment, or database implementation.
