import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import {
  buildDatabasePublicResultStorageRecord,
  containsForbiddenDatabasePublicResultStorageKeys,
  databaseRecordToPublicResultStorageReadResult,
  DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
  DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS,
  DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR,
  DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY,
  listDatabasePublicResultStorageRecordKeys,
  markDatabasePublicResultStorageRecordDeleted
} from '../../src/core/public-link/databasePublicResultStorage';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const createdAt = '2026-06-06T12:00:00.000Z';
const publicId = 'pub_DatabaseContractTest7Kf9sQ2mN8xR4vB';
const deleteToken = 'delete_DatabaseContractTest7Kf9sQ2mN8xR4vB_123456789';
const expiresAt = buildDefaultPublicResultExpiry(createdAt);
const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
  resultId: publicId,
  createdAt,
  expiresAt,
  deleteTokenHash
});

describe('database public result storage contract primitives', () => {
  it('builds a minimized database record from PublicResultStorageCreateInput', () => {
    const record = buildDatabasePublicResultStorageRecord({ publicId, dto, createdAt, expiresAt, deleteTokenHash });

    expect(listDatabasePublicResultStorageRecordKeys(record)).toEqual([...DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS].sort());
    expect(record).toMatchObject({
      schemaVersion: 'public-result-database-record-v1',
      publicId,
      deleteTokenHash,
      createdAt,
      expiresAt,
      deletedAt: null,
      status: 'active'
    });
    expect('deleteToken' in record).toBe(false);
    expect(containsForbiddenDatabasePublicResultStorageKeys(record)).toBe(false);
  });

  it('maps active, expired, deleted, and missing database records to storage read results', () => {
    const activeRecord = buildDatabasePublicResultStorageRecord({ publicId, dto, createdAt, expiresAt, deleteTokenHash });
    const deletedRecord = markDatabasePublicResultStorageRecordDeleted(activeRecord, '2026-06-07T00:00:00.000Z');
    expect(databaseRecordToPublicResultStorageReadResult(activeRecord, createdAt)).toMatchObject({ status: 'active' });
    expect(databaseRecordToPublicResultStorageReadResult(activeRecord, '2026-08-01T00:00:00.000Z')).toMatchObject({ status: 'expired' });
    expect(databaseRecordToPublicResultStorageReadResult(deletedRecord, '2026-06-07T00:00:00.000Z')).toMatchObject({ status: 'deleted' });
    expect(databaseRecordToPublicResultStorageReadResult(null, createdAt)).toEqual({ status: 'not-found', record: null });
  });

  it('defines migration expectations and server-only read boundaries without implementation', () => {
    expect(DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS.length).toBeGreaterThanOrEqual(6);
    expect(DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY).toContain('route-handlers-remain-dry-run-in-memory-until-later-phase');
    expect(DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR).toContain('deleted-at-timestamp-wins-over-active-status');
  });

  it('rejects raw delete tokens inside database records', () => {
    const record = buildDatabasePublicResultStorageRecord({ publicId, dto, createdAt, expiresAt, deleteTokenHash });
    expect(containsForbiddenDatabasePublicResultStorageKeys({ ...record, deleteToken })).toBe(true);
  });
});
