import type { PublicResultDto } from './publicResultDto';
import type { PublicResultLookupPageImplementationStatus } from './publicResultLookupPageImplementation';

export const PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION =
  'phase-9.1-public-result-share-copy-ux-polish-v1' as const;
export const PUBLIC_RESULT_SHARE_COPY_UX_PHASE =
  'phase-9.1-public-result-share-copy-ux-polish' as const;

export type PublicResultShareCopyUxAvailability = 'available' | 'unavailable';

export interface PublicResultShareCopyUxInput {
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dto: PublicResultDto | null;
  readonly publicPath?: string;
}

export interface PublicResultShareCopyUxModel {
  readonly schemaVersion: typeof PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_SHARE_COPY_UX_PHASE;
  readonly availability: PublicResultShareCopyUxAvailability;
  readonly heading: string;
  readonly primaryActionLabel: string;
  readonly instruction: string;
  readonly fallbackInstruction: string;
  readonly manualCopyLabel: string;
  readonly manualCopyValue: string | null;
  readonly unavailableReason: string | null;
  readonly canOfferCopyAction: boolean;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
}

export const PUBLIC_RESULT_SHARE_COPY_UX_RULES = [
  'share-copy-ux-only-no-persistence-change',
  'share-copy-visible-only-for-renderable-public-result',
  'copy-link-affordance-text-is-explicit',
  'manual-copy-fallback-guidance-exists',
  'unavailable-states-do-not-offer-copy-action',
  'raw-answers-remain-blocked',
  'raw-delete-token-remains-blocked',
  'database-binding-unchanged',
  'operational-smoke-unchanged'
] as const;

const UNAVAILABLE_STATE_REASONS: Partial<Record<PublicResultLookupPageImplementationStatus, string>> = {
  'public-result-page-not-found': 'Sharing is unavailable because no public result was resolved for this link.',
  'public-result-page-deleted-unavailable': 'Sharing is unavailable because this public result was deleted.',
  'public-result-page-expired-unavailable': 'Sharing is unavailable because this public result expired.',
  'public-result-page-disabled': 'Sharing is unavailable while public lookup is disabled by safety or rollback controls.',
  'public-result-page-configuration-error': 'Sharing is unavailable because public lookup is not configured for this environment.',
  'public-result-page-storage-unavailable': 'Sharing is unavailable while the public lookup storage boundary is unavailable.'
};

export function buildPublicResultShareCopyUx(input: PublicResultShareCopyUxInput): PublicResultShareCopyUxModel {
  const base = {
    schemaVersion: PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_SHARE_COPY_UX_PHASE,
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false
  } as const;

  if (input.status === 'public-result-page-renderable' && input.dto !== null) {
    return {
      ...base,
      availability: 'available',
      heading: 'Share this public result',
      primaryActionLabel: 'Copy public result link',
      instruction:
        'Share the public link when you want someone to see this limited DTO-only result summary.',
      fallbackInstruction:
        'If automatic copy is unavailable, manually copy this page path from the browser address bar.',
      manualCopyLabel: 'Manual copy path',
      manualCopyValue: input.publicPath ?? `/r/${input.dto.resultId}`,
      unavailableReason: null,
      canOfferCopyAction: true
    };
  }

  return {
    ...base,
    availability: 'unavailable',
    heading: 'Sharing unavailable for this state',
    primaryActionLabel: 'Copy action unavailable',
    instruction:
      'This page state should not offer a copy action because there is no renderable public result to share.',
    fallbackInstruction:
      'Ask for a fresh public result link after the result is restored, recreated, or re-enabled.',
    manualCopyLabel: 'Manual copy path unavailable',
    manualCopyValue: null,
    unavailableReason:
      UNAVAILABLE_STATE_REASONS[input.status] ??
      `Sharing is unavailable for this public lookup state. HTTP model ${input.httpStatus}.`,
    canOfferCopyAction: false
  };
}

export function summarizePublicResultShareCopyUxRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_SHARE_COPY_UX_PHASE}`,
    `schema:${PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_SHARE_COPY_UX_RULES
  ];
}
