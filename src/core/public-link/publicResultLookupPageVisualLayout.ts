import type { PublicResultDto } from './publicResultDto';
import type { PublicResultLookupPageImplementationStatus } from './publicResultLookupPageImplementation';
import type { PublicResultShareCopyUxModel } from './publicResultShareCopyUx';

export const PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION =
  'phase-9.3-public-result-page-visual-layout-polish-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE = 'phase-9.3-public-result-page-visual-layout-polish' as const;

export type PublicResultLookupPageVisualLayoutTone =
  | 'renderable'
  | 'not-found'
  | 'deleted'
  | 'expired'
  | 'disabled'
  | 'configuration-error'
  | 'storage-unavailable';

export interface PublicResultLookupPageVisualLayoutInput {
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly dto: PublicResultDto | null;
  readonly shareCopy: PublicResultShareCopyUxModel;
}

export interface PublicResultLookupPageVisualLayoutModel {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE;
  readonly tone: PublicResultLookupPageVisualLayoutTone;
  readonly dataVisualLayout: 'phase-9.3';
  readonly responsiveLayout: true;
  readonly readableHierarchy: true;
  readonly mobileLayoutUsable: true;
  readonly shareBlockVisuallyDistinct: boolean;
  readonly unavailableStateReadable: boolean;
  readonly shellClassName: string;
  readonly renderableArticleClassName: string;
  readonly unavailablePanelClassName: string;
  readonly eyebrowClassName: string;
  readonly renderableTitleClassName: string;
  readonly unavailableTitleClassName: string;
  readonly summaryClassName: string;
  readonly explanationClassName: string;
  readonly recoveryClassName: string;
  readonly statusPillClassName: string;
  readonly factsGridClassName: string;
  readonly factCardClassName: string;
  readonly sectionCardClassName: string;
  readonly axisGridClassName: string;
  readonly axisCardClassName: string;
  readonly sharePanelClassName: string;
  readonly shareCodeClassName: string;
  readonly rawAnswersExposed: false;
  readonly rawDeleteTokenExposed: false;
}

export const PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_RULES = [
  'visual-layout-only-no-persistence-change',
  'responsive-shell-spacing-is-explicit',
  'renderable-result-uses-clear-card-hierarchy',
  'unavailable-states-use-readable-centered-panel',
  'mobile-layout-remains-usable-with-stacked-content',
  'share-copy-block-is-visually-distinct',
  'accessibility-semantics-from-phase-9.2-remain-intact',
  'raw-answers-remain-blocked',
  'raw-delete-token-remains-blocked',
  'database-binding-unchanged',
  'operational-smoke-unchanged'
] as const;

export function buildPublicResultLookupPageVisualLayout(
  input: PublicResultLookupPageVisualLayoutInput
): PublicResultLookupPageVisualLayoutModel {
  const tone = toVisualLayoutTone(input.status);
  const canOfferCopyAction = input.status === 'public-result-page-renderable' && input.dto !== null && input.shareCopy.canOfferCopyAction;
  const unavailableStateReadable = input.dto === null;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE,
    tone,
    dataVisualLayout: 'phase-9.3',
    responsiveLayout: true,
    readableHierarchy: true,
    mobileLayoutUsable: true,
    shareBlockVisuallyDistinct: canOfferCopyAction,
    unavailableStateReadable,
    shellClassName:
      'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),_transparent_34rem)] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-14',
    renderableArticleClassName:
      'mx-auto flex max-w-5xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 sm:p-8 lg:p-10',
    unavailablePanelClassName:
      'mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10',
    eyebrowClassName: 'text-xs font-semibold uppercase tracking-[0.32em] text-white/50',
    renderableTitleClassName: 'mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl',
    unavailableTitleClassName: 'mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl',
    summaryClassName: 'mt-4 max-w-3xl text-base leading-8 text-white/78 sm:text-lg',
    explanationClassName: 'mt-3 max-w-3xl text-sm leading-7 text-white/64',
    recoveryClassName: 'mt-3 text-sm leading-7 text-white/60',
    statusPillClassName:
      'mt-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-6 text-white/58 sm:px-5',
    factsGridClassName: 'grid gap-4 md:grid-cols-3',
    factCardClassName:
      'rounded-2xl border border-white/10 bg-black/25 p-4 shadow-inner shadow-white/[0.03] sm:p-5',
    sectionCardClassName: 'rounded-2xl border border-white/10 bg-black/25 p-5 shadow-inner shadow-white/[0.03] sm:p-6',
    axisGridClassName: 'grid gap-4 md:grid-cols-2',
    axisCardClassName: 'rounded-2xl border border-white/10 bg-black/25 p-5 shadow-inner shadow-white/[0.03]',
    sharePanelClassName:
      'rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-5 shadow-inner shadow-emerald-300/[0.04] sm:p-6',
    shareCodeClassName:
      'mt-2 block break-all rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/78',
    rawAnswersExposed: false,
    rawDeleteTokenExposed: false
  };
}

export function summarizePublicResultLookupPageVisualLayoutRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_RULES
  ];
}

function toVisualLayoutTone(status: PublicResultLookupPageImplementationStatus): PublicResultLookupPageVisualLayoutTone {
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
