import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_DATABASE_COLUMNS,
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS,
  findPublicResultDatabaseQueryIntent,
  resolvePublicResultDatabaseQueryContractRecord,
  summarizePublicResultDatabaseQueryContractRules
} from '../../src/core/public-link/publicResultDatabaseQueryContract';

const record = resolvePublicResultDatabaseQueryContractRecord();

describe('public result database query contract', () => {
  it('defines the table, columns, indexes, and non-executable query intents', () => {
    expect(record).toMatchObject({
      status: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS,
      selectedProvider: 'postgresql',
      selectedSdkName: '@neondatabase/serverless',
      tableName: 'public_result_links',
      primaryKey: 'public_id',
      queryExecutionAllowed: false,
      sqlClientAllowed: false,
      sdkInstallAllowed: false,
      sdkImportAllowed: false,
      routeBindingAllowed: false,
      factoryDatabaseAdapterAllowed: false
    });

    expect(record.columns.map((column) => column.name)).toEqual([
      'schema_version',
      'public_id',
      'dto',
      'delete_token_hash',
      'created_at',
      'expires_at',
      'deleted_at',
      'status',
      'updated_at'
    ]);
    expect(record.queryIntents).toHaveLength(6);
    expect(record.queryIntents.every((intent) => intent.executionAllowed === false)).toBe(true);
  });

  it('preserves DTO-only, hash-only, soft-delete, and expiry semantics', () => {
    const dtoColumn = PUBLIC_RESULT_DATABASE_COLUMNS.find((column) => column.name === 'dto');
    const deleteTokenHashColumn = PUBLIC_RESULT_DATABASE_COLUMNS.find((column) => column.name === 'delete_token_hash');
    const softDeleteIntent = findPublicResultDatabaseQueryIntent('soft-delete-public-result-by-public-id');
    const readIntent = findPublicResultDatabaseQueryIntent('read-active-public-result-by-public-id');

    expect(dtoColumn?.constraints).toContain('minimized-public-result-dto-only');
    expect(dtoColumn?.constraints).toContain('no-raw-answers');
    expect(deleteTokenHashColumn?.constraints).toContain('hash-only');
    expect(deleteTokenHashColumn?.constraints).toContain('raw-delete-token-never-stored');
    expect(softDeleteIntent.parameters).toContain('delete_token_hash');
    expect(softDeleteIntent.behavior).toContain('status-deleted');
    expect(readIntent.behavior).toContain('expired');
    expect(record.behaviorRules).toContain('expired-records-return-expired-disposition-at-read-time');
  });

  it('summarizes the Phase 8.5 query contract rules', () => {
    expect(summarizePublicResultDatabaseQueryContractRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.5-database-query-contract',
        'schema:phase-8.5-database-query-contract-v1',
        'table:public_result_links',
        'query-contract-is-static-and-non-executable-in-phase-8-5',
        'database-sdk-remains-not-installed-and-not-imported'
      ])
    );
  });

  it('fails loudly for unknown query intent names', () => {
    expect(() => findPublicResultDatabaseQueryIntent('unknown-intent' as never)).toThrow(/Unknown public result database query intent/);
  });
});
