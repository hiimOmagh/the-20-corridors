import type { PublicResultDto } from './publicResultDto';
import type { PublicResultLookupPageImplementationStatus } from './publicResultLookupPageImplementation';
import type { PublicResultShareCopyUxModel } from './publicResultShareCopyUx';

export const PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION =
  'phase-9.2-public-result-page-accessibility-semantics-polish-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE =
  'phase-9.2-public-result-page-accessibility-semantics-polish' as const;

export type PublicResultLookupPageAccessibilityTone =
  | 'renderable'
  | 'not-found'
  | 'deleted'
  | 'expired'
  | 'disabled'
  | 'configuration-error'
  | 'storage-unavailable';

export type PublicResultLookupPageStatusRole = 'status' | 'alert';
export type PublicResultLookupPageAriaLive = 'polite' | 'assertive';

export interface PublicResultLookupPageAccessibilityInput {
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dto: PublicResultDto | null;
  readonly shareCopy: PublicResultShareCopyUxModel;
}

export interface PublicResultLookupPageAccessibilityModel {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE;
  readonly tone: PublicResultLookupPageAccessibilityTone;
  readonly mainLandmarkLabel: string;
  readonly pageTitleId: string;
  readonly pageSummaryId: string;
  readonly pageExplanationId: string;
  readonly pageRecoveryId: string;
  readonly statusRegionId: string;
  readonly statusRegionLabel: string;
  readonly statusRole: PublicResultLookupPageStatusRole;
  readonly statusAriaLive: PublicResultLookupPageAriaLive;
  readonly factsRegionId: string;
  readonly factsHeadingId: string;
  readonly factsRegionLabel: string;
  readonly overviewRegionId: string;
  readonly overviewHeadingId: string;
  readonly overviewRegionLabel: string;
  readonly axisRegionId: string;
  readonly axisHeadingId: string;
  readonly axisRegionLabel: string;
  readonly shareRegionId: string;
  readonly shareHeadingId: string;
  readonly shareHelpId: string;
  readonly shareRegionLabel: string;
  readonly shareActionAriaLabel: string;
  readonly shareHelpText: string;
  readonly unavailableStateNonActionable: boolean;
  readonly hasExplicitMainLandmark: true;
  readonly hasAccessibleHeadingHierarchy: true;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
}

export const PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_RULES = [
  'accessibility-semantics-only-no-persistence-change',
  'main-landmark-is-explicitly-labelled',
  'page-title-and-summary-are-addressable-by-id',
  'status-and-error-states-use-semantic-status-region',
  'configuration-and-storage-failures-use-assertive-alert-semantics',
  'renderable-result-regions-have-accessible-labels',
  'share-copy-panel-has-accessible-label-and-help-text',
  'unavailable-states-remain-non-actionable',
  'raw-answers-remain-blocked',
  'raw-delete-token-remains-blocked',
  'database-binding-unchanged',
  'operational-smoke-unchanged'
] as const;

const BASE_IDS = {
  pageTitleId: 'public-result-title',
  pageSummaryId: 'public-result-summary',
  pageExplanationId: 'public-result-explanation',
  pageRecoveryId: 'public-result-recovery',
  statusRegionId: 'public-result-status-region',
  factsRegionId: 'public-result-facts-region',
  factsHeadingId: 'public-result-facts-heading',
  overviewRegionId: 'public-result-overview-region',
  overviewHeadingId: 'public-result-overview-heading',
  axisRegionId: 'public-result-axis-region',
  axisHeadingId: 'public-result-axis-heading',
  shareRegionId: 'public-result-share-region',
  shareHeadingId: 'public-result-share-heading',
  shareHelpId: 'public-result-share-help'
} as const;

export function buildPublicResultLookupPageAccessibility(
  input: PublicResultLookupPageAccessibilityInput
): PublicResultLookupPageAccessibilityModel {
  const tone = toAccessibilityTone(input.status);
  const failureIsOperational =
    input.status === 'public-result-page-configuration-error' ||
    input.status === 'public-result-page-storage-unavailable';
  const canOfferCopyAction = input.status === 'public-result-page-renderable' && input.dto !== null && input.shareCopy.canOfferCopyAction;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE,
    tone,
    mainLandmarkLabel: 'Public result lookup page',
    ...BASE_IDS,
    statusRegionLabel: failureIsOperational ? 'Public result lookup error status' : 'Public result lookup status',
    statusRole: failureIsOperational ? 'alert' : 'status',
    statusAriaLive: failureIsOperational ? 'assertive' : 'polite',
    factsRegionLabel: 'Public result facts',
    overviewRegionLabel: 'Public result overview',
    axisRegionLabel: 'Public result axis summaries',
    shareRegionLabel: canOfferCopyAction ? 'Share public result' : 'Share action unavailable',
    shareActionAriaLabel:
      'Copy public result link. This shares only the DTO-only public summary, not private answers or delete tokens.',
    shareHelpText:
      'This share section is available only for renderable public results. Unavailable, deleted, expired, disabled, or failed states do not expose a copy action.',
    unavailableStateNonActionable: !canOfferCopyAction,
    hasExplicitMainLandmark: true,
    hasAccessibleHeadingHierarchy: true,
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false
  };
}

export function summarizePublicResultLookupPageAccessibilityRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_RULES
  ];
}

function toAccessibilityTone(status: PublicResultLookupPageImplementationStatus): PublicResultLookupPageAccessibilityTone {
  if (status === 'public-result-page-renderable') {
    return 'renderable';
  }
  if (status === 'public-result-page-not-found') {
    return 'not-found';
  }
  if (status === 'public-result-page-deleted-unavailable') {
    return 'deleted';
  }
  if (status === 'public-result-page-expired-unavailable') {
    return 'expired';
  }
  if (status === 'public-result-page-configuration-error') {
    return 'configuration-error';
  }
  if (status === 'public-result-page-storage-unavailable') {
    return 'storage-unavailable';
  }
  return 'disabled';
}
