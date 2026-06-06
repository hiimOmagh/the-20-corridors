import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
  PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
  resolvePublicResultDatabaseSdkDecisionRecord,
  summarizePublicResultDatabaseSdkDecisionRules
} from '../../src/core/public-link/publicResultDatabaseSdkDecision';

describe('public result database SDK selection decision record', () => {
  it('documents the selected PostgreSQL SDK without allowing installation or import yet', () => {
    const decision = resolvePublicResultDatabaseSdkDecisionRecord();

    expect(decision).toMatchObject({
      status: 'sdk-selected-contract-only',
      selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
      selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
      selectedRuntime: 'next-route-handlers-node-runtime',
      selectedAdapterStrategy: 'thin-sql-adapter-over-public-result-storage-contract',
      sdkInstallAllowed: false,
      sdkImportAllowed: false,
      databaseClientCreationAllowed: false,
      routeBindingAllowed: false,
      factoryBindingAllowed: false
    });
  });

  it('locks rejected alternatives, failure modes, and the secret-handling model', () => {
    const decision = resolvePublicResultDatabaseSdkDecisionRecord();

    expect(decision.rejectedAlternatives.map((item) => item.name)).toEqual([
      '@supabase/supabase-js',
      'prisma/@prisma-client',
      'drizzle-orm',
      'pg',
      'mongoose'
    ]);
    expect(decision.failureModes.map((item) => item.code)).toEqual([
      'missing-env',
      'invalid-env',
      'database-unavailable',
      'write-failure',
      'read-miss',
      'read-expired',
      'delete-token-mismatch',
      'delete-failure',
      'schema-version-mismatch'
    ]);
    expect(decision.securityModel).toContain('database-env-vars-are-server-only');
    expect(decision.securityModel).toContain('raw-delete-token-is-never-persisted');
  });

  it('summarizes decision rules for release evidence', () => {
    expect(summarizePublicResultDatabaseSdkDecisionRules()).toContain(
      `selected-sdk:${PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME}`
    );
    expect(summarizePublicResultDatabaseSdkDecisionRules()).toContain(
      'failure-modes-are-defined-before-client-binding'
    );
  });
});
