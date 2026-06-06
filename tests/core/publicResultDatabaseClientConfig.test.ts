import { describe, expect, it } from 'vitest';
import {
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  assertPublicResultDatabaseClientConfigContractOnly,
  resolvePublicResultDatabaseClientConfigContract,
  summarizePublicResultDatabaseClientConfigRules
} from '../../src/core/public-link/publicResultDatabaseClientConfig';

const COMPLETE_DATABASE_ENV = {
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
  [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'contract-only-service-key-placeholder'
} as const;

describe('public result database client configuration contract', () => {
  it('centralizes server-only database env names without creating a client', () => {
    const config = resolvePublicResultDatabaseClientConfigContract(COMPLETE_DATABASE_ENV);

    expect(config).toMatchObject({
      schemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
      status: 'configured-contract-only',
      provider: 'postgresql',
      databaseUrlStatus: 'configured-valid-contract-only',
      providerStatus: 'configured-valid-contract-only',
      recordSchemaVersionStatus: 'configured-valid-contract-only',
      serviceKeyStatus: 'configured-valid-contract-only',
      databaseClientCreationAllowed: false,
      routeBindingAllowed: false,
      serverOnly: true,
      issues: []
    });
    expect(config.requiredDatabaseEnvKeys).toEqual(PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS);
    expect(config.serverOnlyDatabaseEnvKeys).toEqual(PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS);
    expect(() => assertPublicResultDatabaseClientConfigContractOnly(config)).not.toThrow();
  });

  it('fails closed when required database env is missing', () => {
    const config = resolvePublicResultDatabaseClientConfigContract({});

    expect(config).toMatchObject({
      status: 'blocked',
      databaseUrlStatus: 'missing',
      providerStatus: 'missing',
      recordSchemaVersionStatus: 'missing',
      serviceKeyStatus: 'not-configured-contract-only',
      databaseClientCreationAllowed: false,
      routeBindingAllowed: false
    });
    expect(config.missingDatabaseEnvKeys).toEqual([
      'PUBLIC_RESULT_DATABASE_URL',
      'PUBLIC_RESULT_DATABASE_PROVIDER',
      'PUBLIC_RESULT_DATABASE_SCHEMA_VERSION'
    ]);
    expect(() => assertPublicResultDatabaseClientConfigContractOnly(config)).toThrow(/failed closed/);
  });

  it('blocks client-exposed database env names including service keys', () => {
    const config = resolvePublicResultDatabaseClientConfigContract({
      ...COMPLETE_DATABASE_ENV,
      [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'client-leaked-service-key-placeholder'
    });

    expect(config.status).toBe('blocked');
    expect(config.configuredForbiddenPublicDatabaseEnvKeys).toEqual([NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]);
    expect(config.issues).toContain(`forbidden_public_database_env:${NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV}`);
  });

  it('keeps URL, provider, schema, and service-key validation contract-only', () => {
    const config = resolvePublicResultDatabaseClientConfigContract({
      PUBLIC_RESULT_DATABASE_URL: 'https://example.invalid/not-postgres',
      PUBLIC_RESULT_DATABASE_PROVIDER: 'sqlite',
      PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'wrong-version',
      [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'short'
    });

    expect(config.status).toBe('blocked');
    expect(config.databaseUrlStatus).toBe('invalid');
    expect(config.providerStatus).toBe('invalid');
    expect(config.recordSchemaVersionStatus).toBe('invalid');
    expect(config.serviceKeyStatus).toBe('invalid');
    expect(config.databaseClientCreationAllowed).toBe(false);
  });

  it('summarizes Phase 8.3 database-client configuration rules', () => {
    expect(summarizePublicResultDatabaseClientConfigRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.3-database-client-configuration-contract',
        'schema:phase-8.3-database-client-configuration-contract-v1',
        'database-env-names-are-centralized',
        'database-service-key-shape-is-validated-without-creating-a-client',
        'database-client-creation-remains-blocked'
      ])
    );
  });
});
