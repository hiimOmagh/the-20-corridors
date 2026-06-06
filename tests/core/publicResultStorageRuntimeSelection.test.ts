import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
  resolvePublicResultRouteStorageAdapter,
  resolvePublicResultStorageRuntimeSelection,
  summarizePublicResultStorageRuntimeSelectionGuards
} from '../../src/core/public-link/publicResultStorageRuntimeSelection';
import { DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND } from '../../src/core/public-link/databasePublicResultStorage';

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'database',
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1'
} as const;

describe('public result storage runtime selection', () => {
  it('defaults to memory without requiring database env vars', () => {
    const selection = resolvePublicResultStorageRuntimeSelection({});

    expect(selection).toMatchObject({
      schemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      requestedMode: 'unset',
      effectiveMode: 'memory',
      status: 'memory-selected',
      adapterKind: PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
      routeBindingAllowed: true,
      databaseClientAllowed: false,
      adapterFactoryImplemented: true,
      failClosed: false,
      issues: []
    });
    expect(resolvePublicResultRouteStorageAdapter({ env: {} })).toBeDefined();
  });

  it('keeps explicit memory mode on the in-memory adapter boundary', () => {
    const selection = resolvePublicResultStorageRuntimeSelection({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'memory' });

    expect(selection).toMatchObject({
      requestedMode: 'memory',
      effectiveMode: 'memory',
      status: 'memory-selected',
      adapterKind: PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
      routeBindingAllowed: true,
      failClosed: false
    });
  });

  it('fails closed for invalid runtime mode values', () => {
    const selection = resolvePublicResultStorageRuntimeSelection({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'supabase' });

    expect(selection).toMatchObject({
      requestedMode: 'invalid',
      effectiveMode: 'blocked',
      status: 'invalid-mode-blocked',
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      adapterFactoryImplemented: false,
      failClosed: true
    });
    expect(selection.issues).toContain('invalid_storage_mode:supabase');
    expect(() => resolvePublicResultRouteStorageAdapter({ env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'supabase' } })).toThrow(
      /failed closed/
    );
  });

  it('fails closed when database mode is requested without the required server-only env contract', () => {
    const selection = resolvePublicResultStorageRuntimeSelection({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'database' });

    expect(selection).toMatchObject({
      requestedMode: 'database',
      effectiveMode: 'blocked',
      status: 'database-blocked',
      adapterKind: 'no-runtime-adapter-selected',
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      adapterFactoryImplemented: false,
      failClosed: true
    });
    expect(selection.missingDatabaseEnvKeys).toEqual([
      'PUBLIC_RESULT_DATABASE_URL',
      'PUBLIC_RESULT_DATABASE_PROVIDER',
      'PUBLIC_RESULT_DATABASE_SCHEMA_VERSION'
    ]);
    expect(() => resolvePublicResultRouteStorageAdapter({ env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'database' } })).toThrow(
      /missing_database_env/
    );
  });

  it('recognizes complete database configuration but keeps route binding blocked before client integration', () => {
    const selection = resolvePublicResultStorageRuntimeSelection(COMPLETE_DATABASE_ENV);

    expect(selection).toMatchObject({
      requestedMode: 'database',
      effectiveMode: 'database',
      status: 'database-configured-contract-only',
      adapterKind: DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      adapterFactoryImplemented: false,
      failClosed: true,
      missingDatabaseEnvKeys: []
    });
    expect(selection.issues).toEqual(['database_runtime_configured_but_route_binding_blocked_until_database_client_phase']);
    expect(() => resolvePublicResultRouteStorageAdapter({ env: COMPLETE_DATABASE_ENV })).toThrow(/route_binding_blocked/);
  });

  it('blocks client-exposed database env vars even when memory mode is requested', () => {
    const selection = resolvePublicResultStorageRuntimeSelection({
      [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'memory',
      NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL: 'postgresql://leaked.invalid/db'
    });

    expect(selection).toMatchObject({
      effectiveMode: 'blocked',
      status: 'database-blocked',
      routeBindingAllowed: false,
      failClosed: true
    });
    expect(selection.forbiddenPublicDatabaseEnvKeys).toEqual(['NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL']);
    expect(selection.issues).toContain('forbidden_public_database_env:NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL');
  });

  it('summarizes the Phase 8.1 runtime-selection guards', () => {
    expect(summarizePublicResultStorageRuntimeSelectionGuards()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.1-database-adapter-runtime-selection-guard',
        'schema:phase-8.1-database-adapter-runtime-selection-guard-v1',
        'unset-storage-mode-defaults-to-memory',
        'database-mode-with-missing-env-fails-closed',
        'route-handlers-must-not-silently-switch-to-database'
      ])
    );
  });
});
