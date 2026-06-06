import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
  buildCompleteDatabaseClientSmokeEnvironment,
  resolvePublicResultDatabaseClientSmokeBoundary
} from '../../src/core/public-link/publicResultDatabaseClientSmokeBoundary';
import { PUBLIC_RESULT_STORAGE_DATABASE_MODE, PUBLIC_RESULT_STORAGE_MODE_ENV } from '../../src/core/public-link/publicResultStorageRuntimeSelection';

const completeEnv = buildCompleteDatabaseClientSmokeEnvironment();

describe('public result database client smoke boundary', () => {
  it('does not create a client for unset or memory storage mode', () => {
    const unset = resolvePublicResultDatabaseClientSmokeBoundary({});
    const memory = resolvePublicResultDatabaseClientSmokeBoundary({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'memory' });

    expect(unset).toMatchObject({
      schemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
      status: 'memory-mode-no-client-created',
      clientCreatedSmokeOnly: false,
      clientCreationAttempted: false,
      networkQueryExecuted: false,
      sqlMutationExecuted: false,
      routeBindingAllowed: false
    });
    expect(memory.status).toBe('memory-mode-no-client-created');
  });

  it('fails closed before client creation when database env is missing or invalid', () => {
    const missing = resolvePublicResultDatabaseClientSmokeBoundary({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE });
    const invalid = resolvePublicResultDatabaseClientSmokeBoundary({
      ...completeEnv,
      PUBLIC_RESULT_DATABASE_URL: 'not-a-valid-url'
    });
    const publicEnv = resolvePublicResultDatabaseClientSmokeBoundary({
      ...completeEnv,
      NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL: 'postgresql://leak.invalid/db'
    });

    expect(missing).toMatchObject({ status: 'blocked', clientCreationAttempted: false, clientCreatedSmokeOnly: false });
    expect(invalid).toMatchObject({ status: 'blocked', clientCreationAttempted: false, clientCreatedSmokeOnly: false });
    expect(publicEnv).toMatchObject({ status: 'blocked', clientCreationAttempted: false, clientCreatedSmokeOnly: false });
  });

  it('creates a non-network smoke-only Neon query function for complete database env', () => {
    const result = resolvePublicResultDatabaseClientSmokeBoundary(completeEnv);

    expect(result).toMatchObject({
      status: 'client-created-smoke-only',
      selectedSdkName: '@neondatabase/serverless',
      sdkImportAvailable: true,
      clientCreatedSmokeOnly: true,
      clientCreationAttempted: true,
      nonNetworkSmokePassed: true,
      queryFunctionCreated: true,
      sqlExecutionAllowed: false,
      sqlMutationExecuted: false,
      networkQueryExecuted: false,
      databaseAdapterCreated: false,
      routeBindingAllowed: false,
      factoryRouteBindingAllowed: false,
      queryIntentCount: 6,
      issues: []
    });
    expect(result.databaseUrlRedacted).toContain('redacted');
    expect(result.databaseUrlRedacted).not.toContain('contract_password');
  });
});
