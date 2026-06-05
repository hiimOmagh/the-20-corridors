# UI Import Boundary Contract

## Canonical import

Future UI code must treat `src/core/index.ts` as the only supported public engine API.

Allowed:

```ts
import { getCorridorQuestions, runCorridorsEngine } from '@/core';
```

Allowed if aliases are not configured yet:

```ts
import { getCorridorQuestions, runCorridorsEngine } from '../core';
```

Forbidden in UI/app files:

```ts
import { QUESTIONS } from '../core/methodology/questions';
import { buildResult } from '../core/scoring/buildResult';
import { composeReport } from '../core/report/composeReport';
import { runMethodologyAudit } from '../core/audit/methodologyAudit';
```

## Reason

The methodology engine is allowed to evolve internally. The public DTO boundary protects the UI from internal scoring changes and prevents duplicate scoring logic in components.

## Future guard

When Phase 2 creates UI directories, add a source scan test that fails if any file under UI/app paths imports forbidden internal modules.
