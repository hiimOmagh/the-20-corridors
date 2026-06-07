import {
  DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
  DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
  DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
  buildDatabasePublicResultStorageRecord,
  databaseRecordToPublicResultStorageReadResult,
  type DatabasePublicResultStorageAdapterContract,
  type DatabasePublicResultStorageRecord
} from './databasePublicResultStorage';
import {
  buildInsertPublicResultRecordQuery,
  buildMarkExpiredPublicResultsQuery,
  buildPruneDeletedOrExpiredPublicResultsQuery,
  buildReadActivePublicResultByPublicIdQuery,
  buildSoftDeletePublicResultByPublicIdQuery,
  buildVerifyDeleteTokenHashForPublicIdQuery,
  type PublicResultDatabaseParameterizedQueryDescriptor,
  type PublicResultDatabaseQueryIntentName
} from './publicResultDatabaseClientQueryReadiness';
import {
  buildPublicResultDeleteTokenHash,
  isSafeAnonymousPublicResultId,
  isSafeDeleteToken,
  type PublicResultDeleteRequest,
  type PublicResultStorageCreateInput,
  type PublicResultStorageReadResult,
  type PublicResultStorageRecord,
  type PublicResultStorageStatus
} from './publicResultStorage';

export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION =
  'phase-8.8-database-adapter-implementation-disabled-factory-gate-v1' as const;
export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE =
  'phase-8.8-database-adapter-implementation-behind-disabled-factory-gate' as const;
export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_MODE =
  'implemented-server-only-adapter-not-route-bound' as const;

export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_ROUTE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_FACTORY_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_PRODUCTION_SMOKE_ALLOWED = false as const;

export interface PublicResultDatabaseStorageAdapterRow {
  readonly schema_version: string;
  readonly public_id: string;
  readonly dto: unknown;
  readonly delete_token_hash: string;
  readonly created_at: string | Date;
  readonly expires_at: string | Date;
  readonly deleted_at: string | Date | null;
  readonly status: PublicResultStorageStatus;
  readonly updated_at?: string | Date;
  readonly read_disposition?: PublicResultStorageStatus | 'not-found';
}

export interface PublicResultDatabaseQueryExecutionResult {
  readonly rows: readonly PublicResultDatabaseStorageAdapterRow[];
  readonly rowCount: number;
}

export type PublicResultDatabaseQueryExecutor = (
  descriptor: PublicResultDatabaseParameterizedQueryDescriptor
) => Promise<PublicResultDatabaseQueryExecutionResult>;

export interface PublicResultDatabaseStorageAdapterOptions {
  readonly executeQuery: PublicResultDatabaseQueryExecutor;
  readonly nowIso?: () => string;
}

export interface PublicResultDatabaseStorageAdapterDiagnostics {
  readonly phase: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE;
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION;
  readonly mode: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_MODE;
  readonly adapterKind: typeof DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND;
  readonly queryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly routeBindingAllowed: false;
  readonly factoryBindingAllowed: false;
  readonly productionSmokeAllowed: false;
}

export type PublicResultDatabaseStorageAdapterImplementation = DatabasePublicResultStorageAdapterContract & {
  readonly implementationSchemaVersion: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION;
  readonly implementationPhase: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE;
  readonly implementationMode: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_MODE;
  readonly diagnostics: () => PublicResultDatabaseStorageAdapterDiagnostics;
};

const ADAPTER_QUERY_INTENTS = [
  'insert-public-result-record',
  'read-active-public-result-by-public-id',
  'verify-delete-token-hash-for-public-id',
  'soft-delete-public-result-by-public-id',
  'mark-expired-public-results',
  'prune-deleted-or-expired-public-results'
] as const satisfies readonly PublicResultDatabaseQueryIntentName[];

export function createPublicResultDatabaseStorageAdapterImplementation(
  options: PublicResultDatabaseStorageAdapterOptions
): PublicResultDatabaseStorageAdapterImplementation {
  const nowIso = options.nowIso ?? (() => new Date().toISOString());
  const executeQuery = options.executeQuery;

  return {
    adapterKind: DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
    contractSchemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
    recordSchemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
    implementationSchemaVersion: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
    implementationPhase: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
    implementationMode: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_MODE,

    create: async (input: PublicResultStorageCreateInput): Promise<PublicResultStorageRecord> => {
      const databaseRecord = buildDatabasePublicResultStorageRecord(input);
      const descriptor = buildInsertPublicResultRecordQuery(databaseRecord, nowIso());
      const result = await executeQuery(descriptor);
      const insertedRow = firstRow(result);
      if (insertedRow === null) {
        throw new Error('Database public result adapter create returned no inserted row.');
      }
      const insertedRecord = databaseRowToDatabasePublicResultStorageRecord(insertedRow);
      return databaseRecordToPublicResultStorageReadResult(insertedRecord, nowIso()).record ?? databaseRecordToPublicStorageRecord(insertedRecord, nowIso());
    },

    read: async (publicId: string): Promise<PublicResultStorageReadResult> => {
      if (!isSafeAnonymousPublicResultId(publicId)) return { status: 'not-found', record: null };
      const descriptor = buildReadActivePublicResultByPublicIdQuery(publicId, nowIso());
      const result = await executeQuery(descriptor);
      return databaseRecordToPublicResultStorageReadResult(firstDatabaseRecord(result), nowIso());
    },

    delete: async (request: PublicResultDeleteRequest): Promise<PublicResultStorageReadResult> => {
      const current = await readCurrentRecord(executeQuery, request.publicId, nowIso());
      if (current.record === null) return current;
      if (!isSafeDeleteToken(request.deleteToken)) return current;

      const deleteTokenHash = buildPublicResultDeleteTokenHash(request.deleteToken);
      const verifyDescriptor = buildVerifyDeleteTokenHashForPublicIdQuery(request.publicId, deleteTokenHash);
      const verifyResult = await executeQuery(verifyDescriptor);
      if (verifyResult.rowCount === 0 || verifyResult.rows.length === 0) return current;

      const deletedAtIso = nowIso();
      const deleteDescriptor = buildSoftDeletePublicResultByPublicIdQuery(
        request.publicId,
        deleteTokenHash,
        deletedAtIso,
        deletedAtIso
      );
      const deleteResult = await executeQuery(deleteDescriptor);
      const deletedRecord = firstDatabaseRecord(deleteResult);
      if (deletedRecord === null) {
        throw new Error('Database public result adapter delete returned no deleted row after token verification.');
      }
      return databaseRecordToPublicResultStorageReadResult(deletedRecord, deletedAtIso);
    },

    pruneExpired: async (pruneNowIso: string): Promise<{ readonly deletedCount: number }> => {
      const markExpiredDescriptor = buildMarkExpiredPublicResultsQuery(pruneNowIso, pruneNowIso);
      await executeQuery(markExpiredDescriptor);
      const pruneDescriptor = buildPruneDeletedOrExpiredPublicResultsQuery(pruneNowIso);
      const pruneResult = await executeQuery(pruneDescriptor);
      return { deletedCount: pruneResult.rowCount };
    },

    diagnostics: (): PublicResultDatabaseStorageAdapterDiagnostics => ({
      phase: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
      schemaVersion: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_MODE,
      adapterKind: DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
      queryIntents: ADAPTER_QUERY_INTENTS,
      routeBindingAllowed: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_ROUTE_BINDING_ALLOWED,
      factoryBindingAllowed: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_FACTORY_BINDING_ALLOWED,
      productionSmokeAllowed: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_PRODUCTION_SMOKE_ALLOWED
    })
  };
}

export function databaseRowToDatabasePublicResultStorageRecord(
  row: PublicResultDatabaseStorageAdapterRow
): DatabasePublicResultStorageRecord {
  return {
    schemaVersion: row.schema_version as DatabasePublicResultStorageRecord['schemaVersion'],
    publicId: row.public_id,
    dto: row.dto as DatabasePublicResultStorageRecord['dto'],
    deleteTokenHash: row.delete_token_hash,
    createdAt: normalizeDatabaseTimestamp(row.created_at),
    expiresAt: normalizeDatabaseTimestamp(row.expires_at),
    deletedAt: row.deleted_at === null ? null : normalizeDatabaseTimestamp(row.deleted_at),
    status: row.status
  };
}

function databasePublicResultStorageRecordToRow(
  record: DatabasePublicResultStorageRecord,
  updatedAtIso: string
): PublicResultDatabaseStorageAdapterRow {
  return {
    schema_version: record.schemaVersion,
    public_id: record.publicId,
    dto: record.dto,
    delete_token_hash: record.deleteTokenHash,
    created_at: record.createdAt,
    expires_at: record.expiresAt,
    deleted_at: record.deletedAt,
    status: record.status,
    updated_at: updatedAtIso
  };
}

export function buildDatabaseStorageAdapterImplementationSampleRow(
  input: PublicResultStorageCreateInput,
  updatedAtIso: string
): PublicResultDatabaseStorageAdapterRow {
  return databasePublicResultStorageRecordToRow(buildDatabasePublicResultStorageRecord(input), updatedAtIso);
}

async function readCurrentRecord(
  executeQuery: PublicResultDatabaseQueryExecutor,
  publicId: string,
  nowIso: string
): Promise<PublicResultStorageReadResult> {
  if (!isSafeAnonymousPublicResultId(publicId)) return { status: 'not-found', record: null };
  const descriptor = buildReadActivePublicResultByPublicIdQuery(publicId, nowIso);
  const result = await executeQuery(descriptor);
  return databaseRecordToPublicResultStorageReadResult(firstDatabaseRecord(result), nowIso);
}

function firstDatabaseRecord(
  result: PublicResultDatabaseQueryExecutionResult
): DatabasePublicResultStorageRecord | null {
  const row = firstRow(result);
  return row === null ? null : databaseRowToDatabasePublicResultStorageRecord(row);
}

function firstRow(result: PublicResultDatabaseQueryExecutionResult): PublicResultDatabaseStorageAdapterRow | null {
  return result.rows[0] ?? null;
}

function databasePublicResultStorageRecordToPublicStorageRecord(
  record: DatabasePublicResultStorageRecord,
  nowIso: string
): PublicResultStorageRecord {
  const result = databaseRecordToPublicResultStorageReadResult(record, nowIso);
  if (result.record === null) {
    throw new Error('Database public result adapter cannot map a null public storage record.');
  }
  return result.record;
}

const databaseRecordToPublicStorageRecord = databasePublicResultStorageRecordToPublicStorageRecord;

function normalizeDatabaseTimestamp(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
