import type { PublicResultDto } from './publicResultDto';

export const PUBLIC_RESULT_STORAGE_SCHEMA_VERSION = 'phase-6.0-public-result-storage-v1' as const;
export const PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS = 30 as const;
export const PUBLIC_RESULT_STORAGE_MIN_ID_LENGTH = 24 as const;
export const PUBLIC_RESULT_STORAGE_DELETE_TOKEN_MIN_LENGTH = 32 as const;

export type PublicResultStorageSchemaVersion = typeof PUBLIC_RESULT_STORAGE_SCHEMA_VERSION;
export type PublicResultStorageStatus = 'active' | 'expired' | 'deleted';

export interface PublicResultStorageRecord {
  readonly schemaVersion: PublicResultStorageSchemaVersion;
  readonly publicId: string;
  readonly dto: PublicResultDto;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deleteTokenHash: string;
  readonly status: PublicResultStorageStatus;
}

export interface PublicResultStorageCreateInput {
  readonly publicId: string;
  readonly dto: PublicResultDto;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deleteTokenHash: string;
}

export interface PublicResultStorageReadResult {
  readonly status: PublicResultStorageStatus | 'not-found';
  readonly record: PublicResultStorageRecord | null;
}

export interface PublicResultDeleteRequest {
  readonly publicId: string;
  readonly deleteToken: string;
}

export interface PublicResultStorageAdapter {
  readonly create: (input: PublicResultStorageCreateInput) => Promise<PublicResultStorageRecord>;
  readonly read: (publicId: string) => Promise<PublicResultStorageReadResult>;
  readonly delete: (request: PublicResultDeleteRequest) => Promise<PublicResultStorageReadResult>;
  readonly pruneExpired: (nowIso: string) => Promise<{ readonly deletedCount: number }>;
}

export const PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS = [
  'schemaVersion',
  'publicId',
  'dto',
  'createdAt',
  'expiresAt',
  'deleteTokenHash',
  'status'
] as const;

export const PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS = [
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
  'email',
  'name',
  'user' + 'Id',
  'ip' + 'Address',
  'device' + 'Fingerprint'
] as const;

export function buildPublicResultStorageRecord(input: PublicResultStorageCreateInput): PublicResultStorageRecord {
  assertPublicResultStorageCreateInput(input);
  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
    publicId: input.publicId,
    dto: input.dto,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    deleteTokenHash: input.deleteTokenHash,
    status: isExpiredAt(input.expiresAt, input.createdAt) ? 'expired' : 'active'
  };
}

export function assertPublicResultStorageCreateInput(input: PublicResultStorageCreateInput): void {
  if (!isSafeAnonymousPublicResultId(input.publicId)) {
    throw new Error('Public result storage requires an anonymous non-sequential public id.');
  }

  if (!isIsoDateLike(input.createdAt) || !isIsoDateLike(input.expiresAt)) {
    throw new Error('Public result storage requires ISO-like createdAt and expiresAt values.');
  }

  if (!isSafeDeleteTokenHash(input.deleteTokenHash)) {
    throw new Error('Public result storage requires a safe delete-token hash.');
  }

  if (input.dto.resultId !== input.publicId) {
    throw new Error('Public result storage public id must match the minimized DTO id.');
  }

  if (input.dto.expiresAt !== input.expiresAt || input.dto.createdAt !== input.createdAt) {
    throw new Error('Public result storage dates must match the minimized DTO dates.');
  }

  if (input.dto.deleteTokenHash !== input.deleteTokenHash) {
    throw new Error('Public result storage delete-token hash must match the minimized DTO hash.');
  }

  if (containsForbiddenPublicResultStorageKeys(input.dto)) {
    throw new Error('Public result storage accepts minimized DTO payloads only.');
  }
}

export function isSafeAnonymousPublicResultId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{24,80}$/.test(value) && !looksSequential(value);
}

export function isSafeDeleteToken(value: string): boolean {
  return /^[a-zA-Z0-9_-]{32,160}$/.test(value);
}

export function isSafeDeleteTokenHash(value: string): boolean {
  return /^[a-zA-Z0-9_-]{32,160}$/.test(value);
}

export function buildDefaultPublicResultExpiry(createdAtIso: string): string {
  if (!isIsoDateLike(createdAtIso)) {
    throw new Error('Default public result expiry requires an ISO-like createdAt value.');
  }

  const createdAt = new Date(createdAtIso);
  const expiresAt = new Date(createdAt.getTime() + PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

export function containsForbiddenPublicResultStorageKeys(value: unknown): boolean {
  return findForbiddenPublicResultStorageKeys(value).length > 0;
}

export function findForbiddenPublicResultStorageKeys(value: unknown): readonly string[] {
  const found = new Set<string>();
  collectForbiddenKeys(value, found);
  return [...found].sort();
}

export function listPublicResultStorageRecordKeys(record: PublicResultStorageRecord): readonly string[] {
  return Object.keys(record).sort();
}

function isExpiredAt(expiresAtIso: string, nowIso: string): boolean {
  return new Date(expiresAtIso).getTime() <= new Date(nowIso).getTime();
}

function isIsoDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function looksSequential(value: string): boolean {
  return /^(\d{6,}|[a-z]{6,}|[A-Z]{6,})$/.test(value);
}

function collectForbiddenKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found);
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if ((PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectForbiddenKeys(nestedValue, found);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
