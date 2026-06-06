import { describe, expect, it } from 'vitest';
import {
  buildInsertPublicResultRecordQuery,
  buildMarkExpiredPublicResultsQuery,
  buildPruneDeletedOrExpiredPublicResultsQuery,
  buildPublicResultDatabaseQueryReadinessRecord,
  buildReadActivePublicResultByPublicIdQuery,
  buildSoftDeletePublicResultByPublicIdQuery,
  buildVerifyDeleteTokenHashForPublicIdQuery,
  validateParameterizedDescriptor
} from '../../src/core/public-link/publicResultDatabaseClientQueryReadiness';
import { PUBLIC_RESULT_DTO_SCHEMA_VERSION } from '../../src/core/public-link/publicResultDto';
import type { DatabasePublicResultStorageRecord } from '../../src/core/public-link/databasePublicResultStorage';

const sampleRecord: DatabasePublicResultStorageRecord = {
  schemaVersion: 'public-result-database-record-v1',
  publicId: 'pub_1234567890abcdef12345678',
  dto: {
    schemaVersion: PUBLIC_RESULT_DTO_SCHEMA_VERSION,
    resultId: 'pub_1234567890abcdef12345678',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-02-01T00:00:00.000Z',
    archetype: {
      id: 'observer_strategist',
      title: 'The Observer Strategist',
      summary: 'Sample minimized DTO for query readiness only.'
    },
    confidenceBand: 'high',
    dominantTags: [],
    deepMotive: { key: 'clarity', label: 'Clarity', band: 'high' },
    axisSummaries: [],
    contradictionSummaries: [],
    shareCard: {
      title: 'The Observer Strategist',
      signature: '20 Corridors',
      summary: 'Sample minimized DTO for query readiness only.',
      metrics: [],
      boundaryText: 'Local query readiness only'
    },
    reportOverview: {
      patternSummary: 'Sample minimized DTO for query readiness only.',
      primaryAxis: 'clarity',
      mainContradiction: null
    },
    deleteTokenHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  deleteTokenHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-02-01T00:00:00.000Z',
  deletedAt: null,
  status: 'active'
};

describe('public result database client query readiness descriptors', () => {
  it('maps all Phase 8.5 query intents with parameterized descriptors', () => {
    const record = buildPublicResultDatabaseQueryReadinessRecord();
    expect(record).toMatchObject({
      schemaVersion: 'phase-8.7-database-client-query-readiness-guard-v1',
      phase: 'phase-8.7-database-client-query-readiness-guard',
      serverOnly: true,
      sqlExecutionAllowed: false,
      networkSmokeAllowed: false,
      mutationSmokeAllowed: false,
      routeBindingAllowed: false,
      adapterPersistenceAllowed: false,
      tableName: 'public_result_links',
      primaryKey: 'public_id'
    });
    expect(record.queryDescriptors).toHaveLength(6);
    expect(record.mappedIntentNames).toEqual([
      'insert-public-result-record',
      'read-active-public-result-by-public-id',
      'verify-delete-token-hash-for-public-id',
      'soft-delete-public-result-by-public-id',
      'mark-expired-public-results',
      'prune-deleted-or-expired-public-results'
    ]);
    expect(record.issues).toEqual([]);
  });

  it('keeps query text parameterized and values separate', () => {
    const descriptors = [
      buildInsertPublicResultRecordQuery(sampleRecord, '2026-01-01T00:00:00.000Z'),
      buildReadActivePublicResultByPublicIdQuery(sampleRecord.publicId, '2026-01-01T00:00:00.000Z'),
      buildVerifyDeleteTokenHashForPublicIdQuery(sampleRecord.publicId, sampleRecord.deleteTokenHash),
      buildSoftDeletePublicResultByPublicIdQuery(sampleRecord.publicId, sampleRecord.deleteTokenHash, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
      buildMarkExpiredPublicResultsQuery('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
      buildPruneDeletedOrExpiredPublicResultsQuery('2026-01-01T00:00:00.000Z')
    ];

    for (const descriptor of descriptors) {
      expect(descriptor.parameterized).toBe(true);
      expect(descriptor.usesRawStringInterpolation).toBe(false);
      expect(descriptor.placeholderCount).toBe(descriptor.values.length);
      expect(descriptor.valueCount).toBe(descriptor.parameterOrder.length);
      expect(descriptor.text).not.toContain('${');
      expect(validateParameterizedDescriptor(descriptor)).toEqual([]);
    }
  });

  it('keeps SQL execution and network/mutation smoke disabled', () => {
    const record = buildPublicResultDatabaseQueryReadinessRecord();
    expect(record.queryDescriptors.every((descriptor) => descriptor.executionAllowed === false)).toBe(true);
    expect(record.queryDescriptors.every((descriptor) => descriptor.networkExecutionAllowed === false)).toBe(true);
    expect(record.queryDescriptors.every((descriptor) => descriptor.mutationSmokeAllowed === false)).toBe(true);
  });
});
