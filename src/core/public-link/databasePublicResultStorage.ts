import {
  assertPublicResultStorageCreateInput,
  containsForbiddenPublicResultStorageKeys,
  isSafeAnonymousPublicResultId,
  isSafeDeleteTokenHash,
  resolvePublicResultStorageStatus,
  PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
  PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
  type PublicResultDeleteRequest,
  type PublicResultStorageAdapter,
  type PublicResultStorageCreateInput,
  type PublicResultStorageReadResult,
  type PublicResultStorageRecord,
  type PublicResultStorageStatus
} from './publicResultStorage';

export const DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION = 'phase-8.0-database-adapter-contract-v1' as const;
export const DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION = 'public-result-database-record-v1' as const;
export const DATABASE_PUBLIC_RESULT_STORAGE_PHASE = 'phase-8.0-database-adapter-contract' as const;
export const DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND = 'server-only-public-result-database-adapter' as const;

export type DatabasePublicResultStorageSchemaVersion = typeof DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION;
export type DatabasePublicResultStorageReadDisposition = PublicResultStorageStatus | 'not-found';

export interface DatabasePublicResultStorageRecord {
  readonly schemaVersion: DatabasePublicResultStorageSchemaVersion;
  readonly publicId: string;
  readonly dto: PublicResultStorageRecord['dto'];
  readonly deleteTokenHash: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deletedAt: string | null;
  readonly status: PublicResultStorageStatus;
}

export interface DatabasePublicResultStorageAdapterContract extends PublicResultStorageAdapter {
  readonly adapterKind: typeof DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND;
  readonly contractSchemaVersion: typeof DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION;
  readonly recordSchemaVersion: typeof DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION;
  readonly create: (input: PublicResultStorageCreateInput) => Promise<PublicResultStorageRecord>;
  readonly read: (publicId: string) => Promise<PublicResultStorageReadResult>;
  readonly delete: (request: PublicResultDeleteRequest) => Promise<PublicResultStorageReadResult>;
  readonly pruneExpired: (nowIso: string) => Promise<{ readonly deletedCount: number }>;
}

export const DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS = [
  'schemaVersion',
  'publicId',
  'dto',
  'deleteTokenHash',
  'createdAt',
  'expiresAt',
  'deletedAt',
  'status'
] as const;

export const DATABASE_PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS = [
  ...PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
  'delete' + 'Token',
  'raw' + 'DeleteToken',
  'token' + 'Plaintext',
  'full' + 'Result',
  'serialized' + 'Result',
  'score' + 'Internals',
  'request' + 'Body',
  'user' + 'Agent'
] as const;

export const DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS = [
  'no-migration-files-in-phase-8-0',
  'schema-version-stored-on-every-record',
  'future-schema-changes-require-explicit-version-bump',
  'future-migrations-must-define-forward-and-rollback-expectations-before-client-binding',
  'adapter-must-reject-unsupported-record-schema-version',
  'dto-payload-remains-minimized-public-result-dto-only'
] as const;

export const DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY = [
  'adapter-contract-is-server-only',
  'no-client-component-imports',
  'no-browser-storage-or-network-persistence',
  'no-production-database-client-in-phase-8-0',
  'route-handlers-remain-dry-run-in-memory-until-later-phase',
  'public-lookup-route-remains-blocked'
] as const;

export const DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR = [
  'missing-record-returns-not-found-null-record',
  'deleted-record-returns-deleted-disposition-and-null-public-dto-response-upstream',
  'expired-record-returns-expired-disposition-and-null-public-dto-response-upstream',
  'active-record-returns-minimized-public-result-dto-only',
  'deleted-at-timestamp-wins-over-active-status',
  'expiry-check-runs-at-read-time-before-public-response-mapping'
] as const;

export function buildDatabasePublicResultStorageRecord(
  input: PublicResultStorageCreateInput
): DatabasePublicResultStorageRecord {
  assertPublicResultStorageCreateInput(input);
  const status = isExpiredAt(input.expiresAt, input.createdAt) ? 'expired' : 'active';
  const record: DatabasePublicResultStorageRecord = {
    schemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
    publicId: input.publicId,
    dto: input.dto,
    deleteTokenHash: input.deleteTokenHash,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    deletedAt: null,
    status
  };
  assertDatabasePublicResultStorageRecord(record);
  return record;
}

export function assertDatabasePublicResultStorageRecord(record: DatabasePublicResultStorageRecord): void {
  const keys = listDatabasePublicResultStorageRecordKeys(record);
  const expectedKeys = [...DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS].sort();
  if (keys.join('|') !== expectedKeys.join('|')) {
    throw new Error('Database public result record shape must stay minimized and explicit.');
  }

  if (record.schemaVersion !== DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION) {
    throw new Error('Database public result record schema version is unsupported.');
  }

  if (!isSafeAnonymousPublicResultId(record.publicId)) {
    throw new Error('Database public result record requires an anonymous non-sequential result id.');
  }

  if (!isIsoDateLike(record.createdAt) || !isIsoDateLike(record.expiresAt)) {
    throw new Error('Database public result record requires ISO-like createdAt and expiresAt values.');
  }

  if (record.deletedAt !== null && !isIsoDateLike(record.deletedAt)) {
    throw new Error('Database public result deletedAt must be null or ISO-like.');
  }

  if (!isSafeDeleteTokenHash(record.deleteTokenHash)) {
    throw new Error('Database public result record stores only a safe delete-token hash.');
  }

  if (record.dto.resultId !== record.publicId) {
    throw new Error('Database public result record public id must match the minimized DTO result id.');
  }

  if (record.dto.createdAt !== record.createdAt || record.dto.expiresAt !== record.expiresAt) {
    throw new Error('Database public result record dates must match the minimized DTO dates.');
  }

  if (record.dto.deleteTokenHash !== record.deleteTokenHash) {
    throw new Error('Database public result record delete-token hash must match the minimized DTO hash.');
  }

  if (containsForbiddenDatabasePublicResultStorageKeys(record)) {
    throw new Error('Database public result record cannot contain raw answers, private internals, or raw delete tokens.');
  }

  if (record.deletedAt !== null && record.status !== 'deleted') {
    throw new Error('Database public result deletedAt may only be present for deleted records.');
  }
}

export function databaseRecordToPublicResultStorageRecord(
  record: DatabasePublicResultStorageRecord,
  nowIso: string
): PublicResultStorageRecord {
  assertDatabasePublicResultStorageRecord(record);
  const status = resolveDatabasePublicResultStorageDisposition(record, nowIso);
  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
    publicId: record.publicId,
    dto: record.dto,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    deleteTokenHash: record.deleteTokenHash,
    status
  };
}

export function databaseRecordToPublicResultStorageReadResult(
  record: DatabasePublicResultStorageRecord | null,
  nowIso: string
): PublicResultStorageReadResult {
  if (record === null) return { status: 'not-found', record: null };
  const publicRecord = databaseRecordToPublicResultStorageRecord(record, nowIso);
  return { status: publicRecord.status, record: publicRecord };
}

export function markDatabasePublicResultStorageRecordDeleted(
  record: DatabasePublicResultStorageRecord,
  deletedAtIso: string
): DatabasePublicResultStorageRecord {
  assertDatabasePublicResultStorageRecord(record);
  if (!isIsoDateLike(deletedAtIso)) {
    throw new Error('Database public result deletion requires an ISO-like deletedAt timestamp.');
  }
  const deletedRecord: DatabasePublicResultStorageRecord = {
    ...record,
    deletedAt: deletedAtIso,
    status: 'deleted'
  };
  assertDatabasePublicResultStorageRecord(deletedRecord);
  return deletedRecord;
}

export function resolveDatabasePublicResultStorageDisposition(
  record: DatabasePublicResultStorageRecord,
  nowIso: string
): PublicResultStorageStatus {
  assertDatabasePublicResultStorageRecord(record);
  if (record.deletedAt !== null || record.status === 'deleted') return 'deleted';
  if (record.status === 'expired') return 'expired';
  return resolvePublicResultStorageStatus(databaseRecordToStoredStatusInput(record), nowIso);
}

export function listDatabasePublicResultStorageRecordKeys(
  record: DatabasePublicResultStorageRecord
): readonly string[] {
  return Object.keys(record).sort();
}

export function containsForbiddenDatabasePublicResultStorageKeys(value: unknown): boolean {
  return findForbiddenDatabasePublicResultStorageKeys(value).length > 0;
}

export function findForbiddenDatabasePublicResultStorageKeys(value: unknown): readonly string[] {
  const found = new Set<string>();
  collectForbiddenKeys(value, found);
  return [...found].sort();
}

function databaseRecordToStoredStatusInput(record: DatabasePublicResultStorageRecord): PublicResultStorageRecord {
  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
    publicId: record.publicId,
    dto: record.dto,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    deleteTokenHash: record.deleteTokenHash,
    status: record.status
  };
}

function collectForbiddenKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found);
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if ((DATABASE_PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectForbiddenKeys(nestedValue, found);
  }
}

function isIsoDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function isExpiredAt(expiresAtIso: string, nowIso: string): boolean {
  return new Date(expiresAtIso).getTime() <= new Date(nowIso).getTime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
