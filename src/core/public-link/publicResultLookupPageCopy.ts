import type { PublicResultDto } from './publicResultDto';
import type { PublicResultLookupPageImplementationStatus } from './publicResultLookupPageImplementation';

export const PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION =
  'phase-9.0-public-result-page-ux-copy-polish-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE =
  'phase-9.0-public-result-page-ux-copy-polish' as const;

export type PublicResultLookupPageCopyTone =
  | 'renderable'
  | 'not-found'
  | 'deleted'
  | 'expired'
  | 'disabled'
  | 'configuration-error'
  | 'storage-unavailable';

export interface PublicResultLookupPageCopyInput {
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dto: PublicResultDto | null;
}

export interface PublicResultLookupPageCopy {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE;
  readonly tone: PublicResultLookupPageCopyTone;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly explanation: string;
  readonly recovery: string;
  readonly statusLabel: string;
  readonly statusDetail: string;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
}

export const PUBLIC_RESULT_LOOKUP_PAGE_COPY_RULES = [
  'copy-polish-only-no-persistence-change',
  'renderable-state-explains-that-public-view-is-limited',
  'not-found-state-is-user-readable',
  'deleted-state-is-user-readable',
  'expired-state-is-user-readable',
  'disabled-rollback-state-is-user-readable',
  'configuration-error-state-does-not-leak-internal-secrets',
  'storage-unavailable-state-does-not-claim-data-loss',
  'raw-answers-remain-blocked',
  'raw-delete-token-remains-blocked',
  'operational-smoke-remains-opt-in-only'
] as const;

export function buildPublicResultLookupPageCopy(input: PublicResultLookupPageCopyInput): PublicResultLookupPageCopy {
  const base = {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE,
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false
  } as const;

  if (input.status === 'public-result-page-renderable') {
    return {
      ...base,
      tone: 'renderable',
      eyebrow: 'The 20 Corridors · Public result',
      title: input.dto?.archetype.title ?? 'Public result',
      summary: input.dto?.archetype.summary ?? 'A public result is available.',
      explanation:
        'This is a limited public summary. It shows the shareable pattern, not the private answer trail used to generate it.',
      recovery:
        'Use it as a conversation artifact, not as a clinical assessment or final identity label.',
      statusLabel: 'Visible public result',
      statusDetail: `Renderable public view · HTTP model ${input.httpStatus}`
    };
  }

  if (input.status === 'public-result-page-not-found') {
    return {
      ...base,
      tone: 'not-found',
      eyebrow: 'The 20 Corridors · Public link',
      title: 'Public result not found',
      summary: 'No public result matches this link.',
      explanation:
        'The link may be incomplete, mistyped, or no longer mapped to a stored public result.',
      recovery:
        'Check the link and ask the sender to share a fresh public result if the problem persists.',
      statusLabel: 'Not found',
      statusDetail: `No public result was resolved · HTTP model ${input.httpStatus}`
    };
  }

  if (input.status === 'public-result-page-deleted-unavailable') {
    return {
      ...base,
      tone: 'deleted',
      eyebrow: 'The 20 Corridors · Public link',
      title: 'This public result was deleted',
      summary: 'The shared result is no longer available because it was removed.',
      explanation:
        'Deleted public results are intentionally unavailable and cannot expose the old public DTO.',
      recovery:
        'Create or request a new share link if the result should be visible again.',
      statusLabel: 'Deleted',
      statusDetail: `Result unavailable by deletion · HTTP model ${input.httpStatus}`
    };
  }

  if (input.status === 'public-result-page-expired-unavailable') {
    return {
      ...base,
      tone: 'expired',
      eyebrow: 'The 20 Corridors · Public link',
      title: 'This public result expired',
      summary: 'The shared result reached its expiry window and is no longer shown.',
      explanation:
        'Expiry limits how long a public result remains available and reduces stale public sharing.',
      recovery:
        'Run the experience again or ask the sender to generate a new public link.',
      statusLabel: 'Expired',
      statusDetail: `Result unavailable by expiry · HTTP model ${input.httpStatus}`
    };
  }

  if (input.status === 'public-result-page-configuration-error') {
    return {
      ...base,
      tone: 'configuration-error',
      eyebrow: 'The 20 Corridors · Public link',
      title: 'Public result lookup is not configured',
      summary: 'This page is present, but the lookup path is not ready to serve the result.',
      explanation:
        'The system failed closed before reading public result storage. No private answer data is exposed.',
      recovery:
        'Try again later or contact the operator if this is a deployment environment.',
      statusLabel: 'Configuration required',
      statusDetail: `Lookup failed closed · HTTP model ${input.httpStatus}`
    };
  }

  if (input.status === 'public-result-page-storage-unavailable') {
    return {
      ...base,
      tone: 'storage-unavailable',
      eyebrow: 'The 20 Corridors · Public link',
      title: 'Public result temporarily unavailable',
      summary: 'The public lookup path could not reach the storage boundary.',
      explanation:
        'This does not confirm data loss. The page is withholding the public result until the storage path is available.',
      recovery:
        'Retry later. Operators should inspect the public lookup evidence and storage boundary logs.',
      statusLabel: 'Storage unavailable',
      statusDetail: `Storage boundary unavailable · HTTP model ${input.httpStatus}`
    };
  }

  return {
    ...base,
    tone: 'disabled',
    eyebrow: 'The 20 Corridors · Public link',
    title: 'Public result lookup is paused',
    summary: 'This public result page is currently disabled by a safety or rollback control.',
    explanation:
      'Rollback mode prevents public lookup rendering and avoids serving stale database DTOs.',
    recovery:
      'Try again after the operator re-enables public lookup, or request a new public result link.',
    statusLabel: 'Lookup disabled',
    statusDetail: `Public lookup disabled · HTTP model ${input.httpStatus}`
  };
}

export function summarizePublicResultLookupPageCopyRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_COPY_RULES
  ];
}
