import type { CorridorsPublicResultDto, PublicResultDto, PublicResultDtoMetadata } from '@/core';
import { buildPublicResultDto, containsForbiddenPublicResultDtoKeys, findForbiddenPublicResultDtoKeys } from '@/core';

export const LOCAL_PUBLIC_LINK_PREVIEW_ROUTE = '/r/preview' as const;
export const LOCAL_PUBLIC_LINK_PREVIEW_MODE = 'local-session-dto-preview-only' as const;
export const LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE = 'Local preview only. Minimized DTO surface; individual choices and private scoring internals are excluded.' as const;
export const PUBLIC_LINK_PREVIEW_RENDERING_MODE = 'DTO-only public preview rendering' as const;

export type PublicLinkPreviewStateStatus = 'loading' | 'empty' | 'invalid' | 'ready';
export type PublicLinkPreviewTone = 'neutral' | 'ready' | 'warning' | 'locked';

export interface LocalPublicLinkPreviewState {
  readonly status: PublicLinkPreviewStateStatus;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly secondaryActionLabel: string;
  readonly tone: PublicLinkPreviewTone;
  readonly checklist: readonly string[];
}

export interface LocalPublicLinkPreviewSection {
  readonly id: 'share-card' | 'traits' | 'axis-summary' | 'privacy-boundary';
  readonly index: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

export interface LocalPublicLinkPreviewMetric {
  readonly label: string;
  readonly value: string;
}

export interface LocalPublicLinkPreviewModel {
  readonly route: typeof LOCAL_PUBLIC_LINK_PREVIEW_ROUTE;
  readonly mode: typeof LOCAL_PUBLIC_LINK_PREVIEW_MODE;
  readonly renderingMode: typeof PUBLIC_LINK_PREVIEW_RENDERING_MODE;
  readonly boundaryNote: typeof LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE;
  readonly dto: PublicResultDto;
  readonly headline: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly confidence: string;
    readonly expiryLabel: string;
  };
  readonly sections: readonly LocalPublicLinkPreviewSection[];
  readonly metrics: readonly LocalPublicLinkPreviewMetric[];
  readonly privacyBullets: readonly string[];
  readonly traitLine: string;
  readonly axisCountLabel: string;
  readonly contradictionCountLabel: string;
}

export function buildLocalPublicResultPreview(
  result: CorridorsPublicResultDto,
  metadata: PublicResultDtoMetadata = buildLocalPublicPreviewMetadata()
): LocalPublicLinkPreviewModel {
  const dto = buildPublicResultDto(result, metadata);
  const forbiddenKeys = findForbiddenPublicResultDtoKeys(dto);

  if (forbiddenKeys.length > 0) {
    throw new Error(`Local public-link preview DTO contains forbidden keys: ${forbiddenKeys.join(', ')}`);
  }

  return {
    route: LOCAL_PUBLIC_LINK_PREVIEW_ROUTE,
    mode: LOCAL_PUBLIC_LINK_PREVIEW_MODE,
    renderingMode: PUBLIC_LINK_PREVIEW_RENDERING_MODE,
    boundaryNote: LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE,
    dto,
    headline: {
      eyebrow: 'Local public-link preview',
      title: dto.archetype.title,
      summary: dto.archetype.summary,
      confidence: formatPreviewText(dto.confidenceBand),
      expiryLabel: `Preview expiry model: ${formatPreviewDate(dto.expiresAt)}`
    },
    sections: buildPublicLinkPreviewSections(),
    metrics: buildPublicLinkPreviewMetrics(dto),
    privacyBullets: buildPublicLinkPreviewPrivacyBullets(dto),
    traitLine: buildPreviewTraitLine(dto),
    axisCountLabel: `${dto.axisSummaries.length} minimized axis cards`,
    contradictionCountLabel: `${dto.contradictionSummaries.length} minimized contradiction cards`
  };
}

export function buildLocalPublicPreviewMetadata(now: Date = new Date()): PublicResultDtoMetadata {
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();

  return {
    resultId: 'local_preview_result_0001',
    createdAt,
    expiresAt,
    deleteTokenHash: 'local_preview_delete_token_hash_0001'
  };
}

export function getPublicLinkPreviewStateCopy(status: PublicLinkPreviewStateStatus, detail?: string): LocalPublicLinkPreviewState {
  switch (status) {
    case 'loading':
      return {
        status,
        title: 'Preparing local preview.',
        description: 'Reading the result from this browser session and converting it into the minimized public DTO shape.',
        actionLabel: 'Loading',
        secondaryActionLabel: 'Open results',
        tone: 'neutral',
        checklist: [
          'No remote lookup is attempted.',
          'No public identifier is requested.',
          'No account or payment step is used.'
        ]
      };
    case 'empty':
      return {
        status,
        title: 'No local result to preview.',
        description: 'Complete the 20 corridors first. This preview route does not fetch, persist, or look up remote results.',
        actionLabel: 'Start the corridors',
        secondaryActionLabel: 'Open results',
        tone: 'warning',
        checklist: [
          'Preview source: current browser session only.',
          'Public-link storage is not implemented yet.',
          'The future shared page will use a minimized DTO, not the full result.'
        ]
      };
    case 'invalid':
      return {
        status,
        title: 'Local result could not be parsed.',
        description: detail ?? 'The local session result is invalid. Clear it or complete the quiz again.',
        actionLabel: 'Return to results',
        secondaryActionLabel: 'Retake quiz',
        tone: 'locked',
        checklist: [
          'The invalid payload was not sent anywhere.',
          'Clear the local result or generate a fresh result.',
          'DTO-only public preview remains blocked until parsing succeeds.'
        ]
      };
    case 'ready':
      return {
        status,
        title: 'Preview ready.',
        description: 'This is a local-only preview of the minimized public result payload.',
        actionLabel: 'Review minimized payload',
        secondaryActionLabel: 'Back to result',
        tone: 'ready',
        checklist: [
          'Rendered from PublicResultDto only.',
          'Individual choices are excluded.',
          'Private score internals are excluded.'
        ]
      };
  }
}

export function buildPublicLinkPreviewSections(): readonly LocalPublicLinkPreviewSection[] {
  return [
    {
      id: 'share-card',
      index: '01',
      label: 'Share surface',
      title: 'Public-facing summary card',
      description: 'The share card is the highest-level public surface: archetype, summary, signature, and compact metrics.'
    },
    {
      id: 'traits',
      index: '02',
      label: 'Trait surface',
      title: 'Dominant trait chips',
      description: 'Trait labels are retained, while private score internals and individual choices stay excluded.'
    },
    {
      id: 'axis-summary',
      index: '03',
      label: 'Axis surface',
      title: 'Six minimized axis cards',
      description: 'Axis interpretations remain readable without exposing raw scoring internals.'
    },
    {
      id: 'privacy-boundary',
      index: '04',
      label: 'Boundary surface',
      title: 'Local-only privacy boundary',
      description: 'The route simulates a public result link without persistence, database lookup, or remote API calls.'
    }
  ] as const;
}

export function buildPublicLinkPreviewMetrics(dto: PublicResultDto): readonly LocalPublicLinkPreviewMetric[] {
  return [
    {
      label: 'Schema',
      value: dto.schemaVersion
    },
    {
      label: 'Consistency',
      value: formatPreviewText(dto.confidenceBand)
    },
    {
      label: 'Axes',
      value: String(dto.axisSummaries.length)
    },
    {
      label: 'Tensions',
      value: String(dto.contradictionSummaries.length)
    }
  ] as const;
}

export function buildPublicLinkPreviewPrivacyBullets(dto: PublicResultDto): readonly string[] {
  return [
    `DTO schema: ${dto.schemaVersion}`,
    `Anonymous preview id: ${dto.resultId}`,
    'Individual choices are excluded from this preview surface.',
    'Private score internals are excluded from this preview surface.',
    'No backend request, database write, public lookup, account, or payment is used.'
  ] as const;
}

export function buildPreviewTraitLine(dto: Pick<PublicResultDto, 'dominantTags'>): string {
  return dto.dominantTags.length > 0
    ? dto.dominantTags.map((trait) => `${trait.label} (${trait.code})`).join(' · ')
    : 'No dominant trait signal';
}

export function isPublicLinkPreviewPayloadSafe(dto: PublicResultDto): boolean {
  return !containsForbiddenPublicResultDtoKeys(dto);
}

export function formatPreviewText(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}

function formatPreviewDate(value: string): string {
  return value.slice(0, 10);
}
