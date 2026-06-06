import { describe, expect, it } from 'vitest';
import { createInMemoryPublicResultStorageAdapter } from '../../src/core/public-link/inMemoryPublicResultStorage';
import {
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE
} from '../../src/core/public-link/publicResultStorageRuntimeSelection';
import {
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
  createPublicResultStorageAdapterFromFactory,
  resolvePublicResultStorageAdapterFactoryDecision,
  summarizePublicResultStorageAdapterFactoryRules
} from '../../src/core/public-link/publicResultStorageAdapterFactory';

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1'
} as const;

describe('public result storage adapter factory contract', () => {
  it('creates the memory adapter for unset and explicit memory modes', () => {
    const unsetDecision = resolvePublicResultStorageAdapterFactoryDecision({});
    const memoryDecision = resolvePublicResultStorageAdapterFactoryDecision({
      env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_MEMORY_MODE }
    });

    expect(unsetDecision).toMatchObject({
      schemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
      factoryMode: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
      status: 'memory-adapter-created',
      adapterKind: 'in-memory-public-result-storage-adapter',
      adapterCreated: true,
      memoryAdapterCreated: true,
      databaseAdapterCreated: false,
      routeBindingAllowed: true,
      databaseClientAllowed: false,
      failClosed: false
    });
    expect(memoryDecision.status).toBe('memory-adapter-created');
    expect(memoryDecision.effectiveMode).toBe(PUBLIC_RESULT_STORAGE_MEMORY_MODE);

    const suppliedAdapter = createInMemoryPublicResultStorageAdapter();
    expect(createPublicResultStorageAdapterFromFactory({ memoryAdapter: suppliedAdapter })).toBe(suppliedAdapter);
  });

  it('keeps configured database mode contract-only with no adapter creation or route binding', () => {
    const decision = resolvePublicResultStorageAdapterFactoryDecision({ env: COMPLETE_DATABASE_ENV });

    expect(decision).toMatchObject({
      status: 'database-factory-contract-only',
      adapterKind: 'server-only-public-result-database-adapter',
      adapterCreated: false,
      memoryAdapterCreated: false,
      databaseAdapterCreated: false,
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      failClosed: true
    });
    expect(decision.issues).toContain('database_adapter_factory_contract_only_route_binding_blocked');
    expect(() => createPublicResultStorageAdapterFromFactory({ env: COMPLETE_DATABASE_ENV })).toThrow(/failed closed/i);
  });

  it('fails closed when runtime selection blocks invalid or incomplete modes', () => {
    const missingEnvDecision = resolvePublicResultStorageAdapterFactoryDecision({
      env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE }
    });
    const invalidModeDecision = resolvePublicResultStorageAdapterFactoryDecision({
      env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'supabase' }
    });
    const publicEnvDecision = resolvePublicResultStorageAdapterFactoryDecision({
      env: {
        [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_MEMORY_MODE,
        NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL: 'postgresql://leaked.invalid/db'
      }
    });

    expect(missingEnvDecision).toMatchObject({ status: 'factory-blocked', routeBindingAllowed: false, failClosed: true });
    expect(missingEnvDecision.issues).toContain('missing_database_env:PUBLIC_RESULT_DATABASE_URL');
    expect(invalidModeDecision).toMatchObject({ status: 'factory-blocked', routeBindingAllowed: false, failClosed: true });
    expect(invalidModeDecision.issues).toContain('invalid_storage_mode:supabase');
    expect(publicEnvDecision.issues).toContain('forbidden_public_database_env:NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL');
  });

  it('summarizes factory rules for release evidence', () => {
    expect(summarizePublicResultStorageAdapterFactoryRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.2-database-adapter-factory-contract',
        `schema:${PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION}`,
        `mode:${PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE}`,
        'database-mode-is-contract-only',
        'database-mode-cannot-bind-to-route-handlers'
      ])
    );
  });
});
