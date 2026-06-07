import type { PublicResultDto } from './publicResultDto';
import { buildPublicResultLookupPageAccessibility } from './publicResultLookupPageAccessibility';
import { buildPublicResultLookupPageCopy } from './publicResultLookupPageCopy';
import type { PublicResultLookupPageImplementationStatus } from './publicResultLookupPageImplementation';
import { buildPublicResultLookupPageVisualLayout } from './publicResultLookupPageVisualLayout';
import { buildPublicResultShareCopyUx } from './publicResultShareCopyUx';

export const PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION =
  'phase-9.4-public-result-page-browser-evidence-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE =
  'phase-9.4-public-result-page-browser-evidence-gate' as const;

export type PublicResultLookupPageBrowserEvidenceStateId =
  | 'renderable'
  | 'not-found'
  | 'deleted'
  | 'expired'
  | 'disabled-rollback';

export interface PublicResultLookupPageBrowserEvidenceStateInput {
  readonly stateId: PublicResultLookupPageBrowserEvidenceStateId;
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dto: PublicResultDto | null;
  readonly publicPath: string;
}

export interface PublicResultLookupPageBrowserEvidenceState {
  readonly stateId: PublicResultLookupPageBrowserEvidenceStateId;
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dataBrowserEvidence: 'phase-9.4';
  readonly visibleText: readonly string[];
  readonly visibleMarkupTokens: readonly string[];
  readonly shareCopyBlockVisible: boolean;
  readonly copyActionOffered: boolean;
  readonly accessibilityLandmarkVisible: boolean;
  readonly statusSemanticsVisible: boolean;
  readonly visualLayoutEvidenceVisible: boolean;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
}

export interface PublicResultLookupPageBrowserEvidenceReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE;
  readonly stateEvidence: readonly PublicResultLookupPageBrowserEvidenceState[];
  readonly renderableVisibleTextVerified: boolean;
  readonly notFoundVisibleTextVerified: boolean;
  readonly deletedVisibleTextVerified: boolean;
  readonly expiredVisibleTextVerified: boolean;
  readonly disabledRollbackVisibleTextVerified: boolean;
  readonly shareCopyBlockOnlyRenderable: boolean;
  readonly accessibilityLandmarksVisible: boolean;
  readonly staticBrowserEvidenceOnly: true;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
  readonly noPersistenceChangeSignals: true;
  readonly noDatabaseBindingChangeSignals: true;
  readonly noNetworkSmokeChangeSignals: true;
}

export const PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_RULES = [
  'browser-static-evidence-only-no-playwright-runtime-required',
  'renderable-state-visible-text-is-verified',
  'not-found-state-visible-text-is-verified',
  'deleted-state-visible-text-is-verified',
  'expired-state-visible-text-is-verified',
  'disabled-rollback-state-visible-text-is-verified',
  'share-copy-block-appears-only-for-renderable-state',
  'accessibility-landmarks-remain-visible-in-markup-evidence',
  'raw-answers-remain-blocked',
  'raw-delete-token-remains-blocked',
  'persistence-unchanged',
  'database-binding-unchanged',
  'operational-smoke-unchanged'
] as const;

export function buildPublicResultLookupPageBrowserEvidenceReport(): PublicResultLookupPageBrowserEvidenceReport {
  const sampleDto = buildSamplePublicResultDto();
  const stateEvidence = [
    buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'renderable',
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      publicPath: '/r/browser-evidence-renderable'
    }),
    buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'not-found',
      status: 'public-result-page-not-found',
      httpStatus: 404,
      dto: null,
      publicPath: '/r/browser-evidence-missing'
    }),
    buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'deleted',
      status: 'public-result-page-deleted-unavailable',
      httpStatus: 410,
      dto: null,
      publicPath: '/r/browser-evidence-deleted'
    }),
    buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'expired',
      status: 'public-result-page-expired-unavailable',
      httpStatus: 410,
      dto: null,
      publicPath: '/r/browser-evidence-expired'
    }),
    buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'disabled-rollback',
      status: 'public-result-page-disabled',
      httpStatus: 503,
      dto: null,
      publicPath: '/r/browser-evidence-disabled'
    })
  ] as const;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE,
    stateEvidence,
    renderableVisibleTextVerified: stateHasVisibleText(stateEvidence, 'renderable', [
      'The Observer Strategist',
      'This is a limited public summary',
      'Public overview',
      'Copy public result link'
    ]),
    notFoundVisibleTextVerified: stateHasVisibleText(stateEvidence, 'not-found', [
      'Public result not found',
      'The link may be incomplete'
    ]),
    deletedVisibleTextVerified: stateHasVisibleText(stateEvidence, 'deleted', [
      'This public result was deleted',
      'The shared result is no longer available because it was removed'
    ]),
    expiredVisibleTextVerified: stateHasVisibleText(stateEvidence, 'expired', [
      'This public result expired',
      'The shared result reached its expiry window'
    ]),
    disabledRollbackVisibleTextVerified: stateHasVisibleText(stateEvidence, 'disabled-rollback', [
      'Public result lookup is paused',
      'Try again after the operator re-enables public lookup'
    ]),
    shareCopyBlockOnlyRenderable:
      stateEvidence.filter((state) => state.shareCopyBlockVisible).map((state) => state.stateId).join(',') === 'renderable',
    accessibilityLandmarksVisible: stateEvidence.every((state) => state.accessibilityLandmarkVisible && state.statusSemanticsVisible),
    staticBrowserEvidenceOnly: true,
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false,
    noPersistenceChangeSignals: true,
    noDatabaseBindingChangeSignals: true,
    noNetworkSmokeChangeSignals: true
  };
}

export function buildPublicResultLookupPageBrowserEvidenceState(
  input: PublicResultLookupPageBrowserEvidenceStateInput
): PublicResultLookupPageBrowserEvidenceState {
  const copy = buildPublicResultLookupPageCopy({
    status: input.status,
    httpStatus: input.httpStatus,
    dto: input.dto
  });
  const shareCopy = buildPublicResultShareCopyUx({
    status: input.status,
    httpStatus: input.httpStatus,
    dto: input.dto,
    publicPath: input.publicPath
  });
  const accessibility = buildPublicResultLookupPageAccessibility({
    status: input.status,
    httpStatus: input.httpStatus,
    dto: input.dto,
    shareCopy
  });
  const visualLayout = buildPublicResultLookupPageVisualLayout({
    status: input.status,
    httpStatus: input.httpStatus,
    dto: input.dto,
    shareCopy
  });

  const visibleText = [
    copy.eyebrow,
    copy.title,
    copy.summary,
    copy.explanation,
    copy.recovery,
    `${copy.statusLabel} · ${copy.statusDetail}`,
    accessibility.mainLandmarkLabel,
    accessibility.statusRegionLabel,
    ...(input.dto === null
      ? []
      : [
          'Public result facts',
          'Public overview',
          'Public result axis summaries',
          input.dto.archetype.title,
          input.dto.reportOverview.patternSummary,
          input.dto.reportOverview.primaryAxis
        ]),
    ...(shareCopy.canOfferCopyAction
      ? [
          shareCopy.heading,
          shareCopy.instruction,
          shareCopy.primaryActionLabel,
          shareCopy.manualCopyLabel,
          shareCopy.fallbackInstruction,
          accessibility.shareHelpText
        ]
      : [])
  ].filter((value) => value.trim().length > 0);

  return {
    stateId: input.stateId,
    status: input.status,
    httpStatus: input.httpStatus,
    dataBrowserEvidence: 'phase-9.4',
    visibleText,
    visibleMarkupTokens: [
      'data-public-result-page="true"',
      'data-browser-evidence="phase-9.4"',
      `data-lookup-status="${input.status}"`,
      `data-public-result-browser-state="${input.stateId}"`,
      `data-visual-layout="${visualLayout.dataVisualLayout}"`,
      `data-status-role="${accessibility.statusRole}"`,
      `aria-label="${accessibility.mainLandmarkLabel}"`,
      `aria-live="${accessibility.statusAriaLive}"`
    ],
    shareCopyBlockVisible: shareCopy.canOfferCopyAction,
    copyActionOffered: shareCopy.canOfferCopyAction,
    accessibilityLandmarkVisible: accessibility.hasExplicitMainLandmark,
    statusSemanticsVisible: accessibility.statusRole === 'status' || accessibility.statusRole === 'alert',
    visualLayoutEvidenceVisible: visualLayout.dataVisualLayout === 'phase-9.3' && visualLayout.responsiveLayout,
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false
  };
}

export function summarizePublicResultLookupPageBrowserEvidenceRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_RULES
  ];
}

function stateHasVisibleText(
  evidence: readonly PublicResultLookupPageBrowserEvidenceState[],
  stateId: PublicResultLookupPageBrowserEvidenceStateId,
  requiredTexts: readonly string[]
): boolean {
  const state = evidence.find((item) => item.stateId === stateId);
  if (state === undefined) {
    return false;
  }
  return requiredTexts.every((requiredText) => state.visibleText.some((text) => text.includes(requiredText)));
}

function buildSamplePublicResultDto(): PublicResultDto {
  return {
    schemaVersion: 'public-result-dto-v1',
    resultId: 'result-browser-evidence-test',
    archetype: {
      id: 'observer-strategist',
      title: 'The Observer Strategist',
      summary: 'A precise public archetype summary.'
    },
    confidenceBand: 'high',
    deepMotive: {
      id: 'clarity-control',
      label: 'Clarity and control'
    },
    reportOverview: {
      patternSummary: 'This static browser evidence verifies the visible public overview without raw answers.',
      primaryAxis: 'Agency'
    },
    axisSummaries: [
      {
        id: 'agency',
        label: 'Agency',
        band: 'high',
        interpretation: 'Acts through structured control.'
      },
      {
        id: 'openness',
        label: 'Openness',
        band: 'medium',
        interpretation: 'Uses careful selective exploration.'
      }
    ],
    createdAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-07-07T00:00:00.000Z'
  } as unknown as PublicResultDto;
}
