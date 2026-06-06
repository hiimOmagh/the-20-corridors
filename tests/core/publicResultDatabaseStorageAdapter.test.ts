import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import {
  buildDatabaseStorageAdapterImplementationSampleRow,
  createPublicResultDatabaseStorageAdapterImplementation,
  databaseRowToDatabasePublicResultStorageRecord,
  type PublicResultDatabaseQueryExecutionResult,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterRow
} from '../../src/core/public-link/publicResultDatabaseStorageAdapter';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';

const createdAt = '2026-06-06T12:00:00.000Z';
const publicId = 'pub_Phase88AdapterTest7Kf9sQ2mN8xR4vB';
const deleteToken = 'delete_Phase88AdapterTest7Kf9sQ2mN8xR4vB_123456789';
const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
const expiresAt = buildDefaultPublicResultExpiry(createdAt);
const dto = buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), {
  resultId: publicId,
  createdAt,
  expiresAt,
  deleteTokenHash
});
const input = { publicId, dto, createdAt, expiresAt, deleteTokenHash };
const activeRow = buildDatabaseStorageAdapterImplementationSampleRow(input, createdAt);
const deletedRow: PublicResultDatabaseStorageAdapterRow = {
  ...activeRow,
  deleted_at: createdAt,
  status: 'deleted'
};

describe('database public result storage adapter implementation', () => {
  it('implements the database storage contract behind a disabled factory gate', () => {
    const adapter = createPublicResultDatabaseStorageAdapterImplementation({ executeQuery: async () => ({ rows: [], rowCount: 0 }) });
    expect(adapter).toMatchObject({
      adapterKind: 'server-only-public-result-database-adapter',
      contractSchemaVersion: 'phase-8.0-database-adapter-contract-v1',
      recordSchemaVersion: 'public-result-database-record-v1',
      implementationPhase: 'phase-8.8-database-adapter-implementation-behind-disabled-factory-gate'
    });
    expect(adapter.diagnostics()).toMatchObject({
      routeBindingAllowed: false,
      factoryBindingAllowed: false,
      productionSmokeAllowed: false
    });
  });

  it('maps create/read/delete/prune methods to parameterized query descriptors without route binding', async () => {
    const observedIntents: string[] = [];
    const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor): Promise<PublicResultDatabaseQueryExecutionResult> => {
      observedIntents.push(descriptor.intentName);
      expect(descriptor.parameterized).toBe(true);
      expect(descriptor.placeholderCount).toBe(descriptor.valueCount);
      switch (descriptor.intentName) {
        case 'insert-public-result-record':
        case 'read-active-public-result-by-public-id':
          return { rows: [activeRow], rowCount: 1 };
        case 'verify-delete-token-hash-for-public-id':
          return { rows: [activeRow], rowCount: 1 };
        case 'soft-delete-public-result-by-public-id':
          return { rows: [deletedRow], rowCount: 1 };
        case 'mark-expired-public-results':
          return { rows: [activeRow], rowCount: 1 };
        case 'prune-deleted-or-expired-public-results':
          return { rows: [deletedRow], rowCount: 1 };
        default:
          return { rows: [], rowCount: 0 };
      }
    };
    const adapter = createPublicResultDatabaseStorageAdapterImplementation({ executeQuery, nowIso: () => createdAt });

    await expect(adapter.create(input)).resolves.toMatchObject({ publicId, status: 'active' });
    await expect(adapter.read(publicId)).resolves.toMatchObject({ status: 'active' });
    await expect(adapter.delete({ publicId, deleteToken })).resolves.toMatchObject({ status: 'deleted' });
    await expect(adapter.pruneExpired(createdAt)).resolves.toEqual({ deletedCount: 1 });

    expect(new Set(observedIntents)).toEqual(
      new Set([
        'insert-public-result-record',
        'read-active-public-result-by-public-id',
        'verify-delete-token-hash-for-public-id',
        'soft-delete-public-result-by-public-id',
        'mark-expired-public-results',
        'prune-deleted-or-expired-public-results'
      ])
    );
  });

  it('returns the current record when delete-token verification fails', async () => {
    const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor): Promise<PublicResultDatabaseQueryExecutionResult> => {
      if (descriptor.intentName === 'read-active-public-result-by-public-id') return { rows: [activeRow], rowCount: 1 };
      if (descriptor.intentName === 'verify-delete-token-hash-for-public-id') return { rows: [], rowCount: 0 };
      throw new Error(`unexpected descriptor:${descriptor.intentName}`);
    };
    const adapter = createPublicResultDatabaseStorageAdapterImplementation({ executeQuery, nowIso: () => createdAt });
    await expect(adapter.delete({ publicId, deleteToken })).resolves.toMatchObject({ status: 'active' });
  });

  it('maps database rows to database records with ISO timestamps', () => {
    const record = databaseRowToDatabasePublicResultStorageRecord({
      ...activeRow,
      created_at: new Date(createdAt),
      expires_at: new Date(expiresAt),
      deleted_at: null
    });
    expect(record).toMatchObject({
      schemaVersion: 'public-result-database-record-v1',
      publicId,
      createdAt,
      expiresAt,
      deletedAt: null,
      status: 'active'
    });
  });
});
