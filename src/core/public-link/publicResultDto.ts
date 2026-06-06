import type {
  CorridorsAxisCardDto,
  CorridorsConfidenceBand,
  CorridorsContradictionCardDto,
  CorridorsDominantTraitDto,
  CorridorsPublicResultDto,
  CorridorsTraitCode
} from '../publicTypes';

export const PUBLIC_RESULT_DTO_SCHEMA_VERSION = 'phase-5.1-public-result-dto-v1' as const;

export type PublicResultDtoSchemaVersion = typeof PUBLIC_RESULT_DTO_SCHEMA_VERSION;

export interface PublicResultDtoMetadata {
  readonly resultId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deleteTokenHash: string;
}

export interface PublicResultTraitDto {
  readonly code: CorridorsTraitCode;
  readonly label: string;
}

export interface PublicResultAxisSummaryDto {
  readonly id: CorridorsAxisCardDto['id'];
  readonly label: string;
  readonly band: string;
  readonly dominantLabel: string;
  readonly interpretation: string;
}

export interface PublicResultContradictionSummaryDto {
  readonly id: CorridorsContradictionCardDto['id'];
  readonly title: string;
  readonly tension: string;
}

export interface PublicResultShareCardDto {
  readonly title: string;
  readonly signature: string;
  readonly summary: string;
  readonly metrics: readonly string[];
  readonly boundaryText: string;
}

export interface PublicResultDto {
  readonly schemaVersion: PublicResultDtoSchemaVersion;
  readonly resultId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly archetype: {
    readonly id: CorridorsPublicResultDto['archetype']['id'];
    readonly title: string;
    readonly summary: string;
  };
  readonly confidenceBand: CorridorsConfidenceBand;
  readonly dominantTags: readonly PublicResultTraitDto[];
  readonly deepMotive: {
    readonly key: string;
    readonly label: string;
    readonly band: string;
  };
  readonly axisSummaries: readonly PublicResultAxisSummaryDto[];
  readonly contradictionSummaries: readonly PublicResultContradictionSummaryDto[];
  readonly shareCard: PublicResultShareCardDto;
  readonly reportOverview: {
    readonly patternSummary: string;
    readonly primaryAxis: string;
    readonly mainContradiction: string | null;
  };
  readonly deleteTokenHash: string;
}

export const PUBLIC_RESULT_DTO_ALLOWED_KEYS = [
  'schemaVersion',
  'resultId',
  'createdAt',
  'expiresAt',
  'archetype',
  'confidenceBand',
  'dominantTags',
  'deepMotive',
  'axisSummaries',
  'contradictionSummaries',
  'shareCard',
  'reportOverview',
  'deleteTokenHash'
] as const;

export const PUBLIC_RESULT_DTO_FORBIDDEN_KEYS = [
  'answer' + 's',
  'raw' + 'Answers',
  'question' + 'Answers',
  'selected' + 'Answer',
  'question' + 'Id',
  'answer' + 'Text',
  'tag' + 'Scores',
  'axis' + 'ScoresRaw',
  'private' + 'ReportSeed',
  'session' + 'StorageEnvelope',
  'evidence' + 'Digest',
  'evidence' + 'Refs',
  'ip' + 'Address',
  'email',
  'name',
  'user' + 'Id',
  'device' + 'Fingerprint'
] as const;

export function buildPublicResultDto(
  source: CorridorsPublicResultDto,
  metadata: PublicResultDtoMetadata
): PublicResultDto {
  assertPublicResultDtoMetadata(metadata);

  const dominantTags = source.dominantTraits.map(toPublicTrait);
  const axisSummaries = source.axes.map(toPublicAxisSummary);
  const contradictionSummaries = source.contradictions.map(toPublicContradictionSummary);

  return {
    schemaVersion: PUBLIC_RESULT_DTO_SCHEMA_VERSION,
    resultId: metadata.resultId,
    createdAt: metadata.createdAt,
    expiresAt: metadata.expiresAt,
    archetype: {
      id: source.archetype.id,
      title: source.archetype.title,
      summary: source.archetype.summary
    },
    confidenceBand: source.confidenceBand,
    dominantTags,
    deepMotive: {
      key: source.deepMotive.key,
      label: source.deepMotive.label,
      band: source.deepMotive.band
    },
    axisSummaries,
    contradictionSummaries,
    shareCard: {
      title: source.archetype.title,
      signature: buildPublicResultSignature(source),
      summary: source.report.overview.patternSummary,
      metrics: buildPublicResultMetrics(source),
      boundaryText: 'Public link preview: minimized result only. Raw choices and private scoring internals are excluded.'
    },
    reportOverview: {
      patternSummary: source.report.overview.patternSummary,
      primaryAxis: source.report.overview.primaryAxis,
      mainContradiction: source.report.overview.mainContradiction
    },
    deleteTokenHash: metadata.deleteTokenHash
  };
}

export function assertPublicResultDtoMetadata(metadata: PublicResultDtoMetadata): void {
  if (!isSafePublicId(metadata.resultId)) {
    throw new Error('Public result DTO metadata requires a safe anonymous result id.');
  }

  if (!isIsoDateLike(metadata.createdAt) || !isIsoDateLike(metadata.expiresAt)) {
    throw new Error('Public result DTO metadata requires ISO-like createdAt and expiresAt values.');
  }

  if (!isSafeHash(metadata.deleteTokenHash)) {
    throw new Error('Public result DTO metadata requires a non-empty delete token hash.');
  }
}

export function listPublicResultDtoKeys(dto: PublicResultDto): readonly string[] {
  return Object.keys(dto).sort();
}

export function containsForbiddenPublicResultDtoKeys(dto: unknown): boolean {
  return findForbiddenPublicResultDtoKeys(dto).length > 0;
}

export function findForbiddenPublicResultDtoKeys(dto: unknown): readonly string[] {
  const found = new Set<string>();
  collectForbiddenKeys(dto, found);
  return [...found].sort();
}

function toPublicTrait(trait: CorridorsDominantTraitDto): PublicResultTraitDto {
  return {
    code: trait.code,
    label: trait.label
  };
}

function toPublicAxisSummary(axis: CorridorsAxisCardDto): PublicResultAxisSummaryDto {
  return {
    id: axis.id,
    label: axis.label,
    band: axis.band,
    dominantLabel: axis.dominantLabel,
    interpretation: axis.interpretation
  };
}

function toPublicContradictionSummary(contradiction: CorridorsContradictionCardDto): PublicResultContradictionSummaryDto {
  return {
    id: contradiction.id,
    title: contradiction.title,
    tension: contradiction.tension
  };
}

function buildPublicResultSignature(source: CorridorsPublicResultDto): string {
  const motive = source.deepMotive.label;
  const contradiction = source.report.overview.mainContradiction ?? 'No dominant tension';
  return `${source.confidenceBand} consistency · ${motive} · ${contradiction}`;
}

function buildPublicResultMetrics(source: CorridorsPublicResultDto): readonly string[] {
  return [
    `Archetype: ${source.archetype.title}`,
    `Confidence: ${source.confidenceBand}`,
    `Axes: ${source.axes.length}`,
    `Contradictions: ${source.contradictions.length}`
  ];
}

function isSafePublicId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{12,80}$/.test(value);
}

function isSafeHash(value: string): boolean {
  return /^[a-zA-Z0-9_-]{16,160}$/.test(value);
}

function isIsoDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function collectForbiddenKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found);
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if ((PUBLIC_RESULT_DTO_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectForbiddenKeys(nestedValue, found);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
