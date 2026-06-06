import { createInMemoryPublicResultStorageAdapter } from './inMemoryPublicResultStorage';
import { DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND } from './databasePublicResultStorage';
import {
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS as PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS_FROM_CONFIG,
  PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS as PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS_FROM_CONFIG,
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  resolvePublicResultDatabaseClientConfigContract
} from './publicResultDatabaseClientConfig';
import type { PublicResultStorageAdapter } from './publicResultStorage';

export const PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION =
  'phase-8.1-database-adapter-runtime-selection-guard-v1' as const;
export const PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE =
  'phase-8.1-database-adapter-runtime-selection-guard' as const;
export const PUBLIC_RESULT_STORAGE_MODE_ENV = 'PUBLIC_RESULT_STORAGE_MODE' as const;
export const PUBLIC_RESULT_STORAGE_MEMORY_MODE = 'memory' as const;
export const PUBLIC_RESULT_STORAGE_DATABASE_MODE = 'database' as const;
export const PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND = 'in-memory-public-result-storage-adapter' as const;
export const PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND = 'no-runtime-adapter-selected' as const;

export type PublicResultStorageRuntimeMode =
  | typeof PUBLIC_RESULT_STORAGE_MEMORY_MODE
  | typeof PUBLIC_RESULT_STORAGE_DATABASE_MODE;

export type PublicResultStorageRuntimeStatus =
  | 'memory-selected'
  | 'database-configured-contract-only'
  | 'database-blocked'
  | 'invalid-mode-blocked';

export type PublicResultStorageRuntimeAdapterKind =
  | typeof PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND
  | typeof DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND
  | typeof PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND;

export interface PublicResultStorageRuntimeEnvironment {
  readonly [key: string]: string | undefined;
  readonly [PUBLIC_RESULT_STORAGE_MODE_ENV]?: string;
  readonly PUBLIC_RESULT_DATABASE_URL?: string;
  readonly PUBLIC_RESULT_DATABASE_PROVIDER?: string;
  readonly PUBLIC_RESULT_DATABASE_SCHEMA_VERSION?: string;
  readonly [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]?: string;
  readonly NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL?: string;
  readonly NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER?: string;
  readonly NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION?: string;
  readonly [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]?: string;
}

export interface PublicResultStorageRuntimeSelection {
  readonly schemaVersion: typeof PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE;
  readonly requestedMode: PublicResultStorageRuntimeMode | 'unset' | 'invalid';
  readonly effectiveMode: PublicResultStorageRuntimeMode | 'blocked';
  readonly status: PublicResultStorageRuntimeStatus;
  readonly adapterKind: PublicResultStorageRuntimeAdapterKind;
  readonly routeBindingAllowed: boolean;
  readonly databaseClientAllowed: boolean;
  readonly adapterFactoryImplemented: boolean;
  readonly failClosed: boolean;
  readonly requiredDatabaseEnvKeys: readonly string[];
  readonly missingDatabaseEnvKeys: readonly string[];
  readonly forbiddenPublicDatabaseEnvKeys: readonly string[];
  readonly configuredDatabaseEnvKeys: readonly string[];
  readonly issues: readonly string[];
}

export interface PublicResultStorageRuntimeAdapterResolutionOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly memoryAdapter?: PublicResultStorageAdapter;
}

export const PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS = PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS_FROM_CONFIG;

export const PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS = PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS_FROM_CONFIG;

export const PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_GUARDS = [
  'unset-storage-mode-defaults-to-memory',
  'explicit-memory-mode-selects-in-memory-adapter',
  'invalid-storage-mode-fails-closed',
  'database-mode-requires-explicit-env-contract',
  'database-mode-with-missing-env-fails-closed',
  'client-exposed-database-env-vars-are-blocked',
  'database-client-config-env-names-are-centralized',
  'database-mode-is-contract-only-before-client-binding',
  'route-handlers-must-not-silently-switch-to-database',
  'route-handlers-remain-dry-run-in-memory-by-default'
] as const;

export function resolvePublicResultStorageRuntimeSelection(
  env: PublicResultStorageRuntimeEnvironment = process.env
): PublicResultStorageRuntimeSelection {
  const rawMode = normalizeOptionalEnvValue(env[PUBLIC_RESULT_STORAGE_MODE_ENV]);
  const forbiddenPublicDatabaseEnvKeys = PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS.filter(
    (key) => normalizeOptionalEnvValue(env[key]) !== undefined
  );
  const configuredDatabaseEnvKeys = PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.filter(
    (key) => normalizeOptionalEnvValue(env[key]) !== undefined
  );
  const missingDatabaseEnvKeys = PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.filter(
    (key) => normalizeOptionalEnvValue(env[key]) === undefined
  );

  if (rawMode === undefined || rawMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE) {
    const issues = forbiddenPublicDatabaseEnvKeys.map((key) => `forbidden_public_database_env:${key}`);
    return {
      schemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE,
      requestedMode: rawMode === undefined ? 'unset' : PUBLIC_RESULT_STORAGE_MEMORY_MODE,
      effectiveMode: issues.length === 0 ? PUBLIC_RESULT_STORAGE_MEMORY_MODE : 'blocked',
      status: issues.length === 0 ? 'memory-selected' : 'database-blocked',
      adapterKind: issues.length === 0 ? PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND : PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND,
      routeBindingAllowed: issues.length === 0,
      databaseClientAllowed: false,
      adapterFactoryImplemented: true,
      failClosed: issues.length > 0,
      requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
      missingDatabaseEnvKeys: [],
      forbiddenPublicDatabaseEnvKeys,
      configuredDatabaseEnvKeys,
      issues
    };
  }

  if (rawMode !== PUBLIC_RESULT_STORAGE_DATABASE_MODE) {
    return {
      schemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE,
      requestedMode: 'invalid',
      effectiveMode: 'blocked',
      status: 'invalid-mode-blocked',
      adapterKind: PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND,
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      adapterFactoryImplemented: false,
      failClosed: true,
      requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
      missingDatabaseEnvKeys: [],
      forbiddenPublicDatabaseEnvKeys,
      configuredDatabaseEnvKeys,
      issues: [`invalid_storage_mode:${rawMode}`, ...forbiddenPublicDatabaseEnvKeys.map((key) => `forbidden_public_database_env:${key}`)]
    };
  }

  const databaseClientConfig = resolvePublicResultDatabaseClientConfigContract(env);
  const issues = [...databaseClientConfig.issues];

  if (issues.length > 0) {
    return {
      schemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE,
      requestedMode: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
      effectiveMode: 'blocked',
      status: 'database-blocked',
      adapterKind: PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND,
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      adapterFactoryImplemented: false,
      failClosed: true,
      requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
      missingDatabaseEnvKeys,
      forbiddenPublicDatabaseEnvKeys,
      configuredDatabaseEnvKeys,
      issues
    };
  }

  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE,
    requestedMode: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    effectiveMode: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    status: 'database-configured-contract-only',
    adapterKind: DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
    routeBindingAllowed: false,
    databaseClientAllowed: false,
    adapterFactoryImplemented: false,
    failClosed: true,
    requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
    missingDatabaseEnvKeys: [],
    forbiddenPublicDatabaseEnvKeys: [],
    configuredDatabaseEnvKeys,
    issues: ['database_runtime_configured_but_route_binding_blocked_until_database_client_phase']
  };
}

export function assertPublicResultRouteStorageRuntimeSelectionAllowed(
  selection: PublicResultStorageRuntimeSelection
): asserts selection is PublicResultStorageRuntimeSelection & {
  readonly status: 'memory-selected';
  readonly effectiveMode: typeof PUBLIC_RESULT_STORAGE_MEMORY_MODE;
  readonly routeBindingAllowed: true;
} {
  if (selection.status !== 'memory-selected' || selection.effectiveMode !== PUBLIC_RESULT_STORAGE_MEMORY_MODE || !selection.routeBindingAllowed) {
    throw new Error(
      `Public result route storage runtime selection failed closed: ${selection.issues.join(', ') || selection.status}`
    );
  }
}

export function resolvePublicResultRouteStorageAdapter(
  options: PublicResultStorageRuntimeAdapterResolutionOptions = {}
): PublicResultStorageAdapter {
  const selection = resolvePublicResultStorageRuntimeSelection(options.env);
  assertPublicResultRouteStorageRuntimeSelectionAllowed(selection);
  return options.memoryAdapter ?? createInMemoryPublicResultStorageAdapter();
}

export function summarizePublicResultStorageRuntimeSelectionGuards(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_PHASE}`,
    `schema:${PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION}`,
    ...PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_GUARDS
  ];
}

function normalizeOptionalEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
