import type { CorridorsPublicResultDto, PublicResultDto, PublicResultDtoMetadata } from '@/core';
import { buildPublicResultDto, containsForbiddenPublicResultDtoKeys, findForbiddenPublicResultDtoKeys } from '@/core';

export const LOCAL_PUBLIC_LINK_PREVIEW_ROUTE = '/r/preview' as const;
export const LOCAL_PUBLIC_LINK_PREVIEW_MODE = 'local-session-dto-preview-only' as const;
export const LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE = 'Local preview only. Minimized DTO surface; individual choices and private scoring internals are excluded.' as const;

export type PublicLinkPreviewStateStatus = 'loading' | 'empty' | 'invalid' | 'ready';

export interface LocalPublicLinkPreviewState {
  readonly status: PublicLinkPreviewStateStatus;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}

export interface LocalPublicLinkPreviewModel {
  readonly route: typeof LOCAL_PUBLIC_LINK_PREVIEW_ROUTE;
  readonly mode: typeof LOCAL_PUBLIC_LINK_PREVIEW_MODE;
  readonly boundaryNote: typeof LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE;
  readonly dto: PublicResultDto;
  readonly headline: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly confidence: string;
    readonly expiryLabel: string;
  };
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
    boundaryNote: LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE,
    dto,
    headline: {
      eyebrow: 'Local public-link preview',
      title: dto.archetype.title,
      summary: dto.archetype.summary,
      confidence: formatPreviewText(dto.confidenceBand),
      expiryLabel: `Preview expiry model: ${formatPreviewDate(dto.expiresAt)}`
    },
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
        title: 'Loading local preview.',
        description: 'Reading the local result from this browser session.',
        actionLabel: 'Loading'
      };
    case 'empty':
      return {
        status,
        title: 'No local result to preview.',
        description: 'Complete the 20 corridors first. This preview route does not fetch, persist, or look up remote results.',
        actionLabel: 'Start the corridors'
      };
    case 'invalid':
      return {
        status,
        title: 'Local result could not be parsed.',
        description: detail ?? 'The local session result is invalid. Clear it or complete the quiz again.',
        actionLabel: 'Return to results'
      };
    case 'ready':
      return {
        status,
        title: 'Preview ready.',
        description: 'This is a local-only preview of the minimized public result payload.',
        actionLabel: 'Review minimized payload'
      };
  }
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
