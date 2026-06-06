import { neon } from '@neondatabase/serverless';
import {
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_PROVIDER_ENV,
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV,
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_URL_ENV,
  resolvePublicResultDatabaseClientConfigContract,
  type PublicResultDatabaseClientConfigEnvironment
} from './publicResultDatabaseClientConfig';
import {
  PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
  PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION
} from './publicResultDatabaseSdkDecision';
import {
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
  resolvePublicResultDatabaseQueryContractRecord
} from './publicResultDatabaseQueryContract';
import { resolvePublicResultStorageAdapterFactoryDecision } from './publicResultStorageAdapterFactory';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  resolvePublicResultStorageRuntimeSelection,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION =
  'phase-8.6-database-sdk-client-smoke-boundary-v1' as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_PHASE =
  'phase-8.6-database-sdk-install-client-smoke-boundary' as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_MODE =
  'server-only-sdk-import-non-network-client-smoke' as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE =
  'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts' as const;

export const PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_RULES = [
  'sdk-import-is-confined-to-server-only-smoke-boundary',
  'client-smoke-requires-public-result-storage-mode-database',
  'missing-database-env-fails-closed-before-client-creation',
  'invalid-database-env-fails-closed-before-client-creation',
  'valid-database-env-may-create-neon-query-function-without-executing-sql',
  'non-network-smoke-only-no-query-is-invoked',
  'sql-mutation-execution-remains-blocked',
  'database-adapter-factory-route-binding-remains-blocked',
  'routes-continue-to-use-memory-dry-run-behavior',
  'raw-database-url-and-service-key-are-never-exposed-in-evidence'
] as const;

export type PublicResultDatabaseClientSmokeStatus =
  | 'memory-mode-no-client-created'
  | 'blocked'
  | 'client-created-smoke-only';

export interface PublicResultDatabaseClientSmokeEnvironment
  extends PublicResultDatabaseClientConfigEnvironment,
    PublicResultStorageRuntimeEnvironment {}

export interface PublicResultDatabaseClientSmokeBoundaryResult {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_PHASE;
  readonly smokeMode: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_MODE;
  readonly status: PublicResultDatabaseClientSmokeStatus;
  readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
  readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
  readonly sdkDecisionSchemaVersion: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION;
  readonly clientConfigSchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION;
  readonly queryContractSchemaVersion: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION;
  readonly requestedStorageMode: 'unset' | 'memory' | 'database' | 'invalid';
  readonly runtimeSelectionStatus: string;
  readonly clientConfigStatus: string;
  readonly databaseUrlStatus: string;
  readonly databaseUrlRedacted: string | null;
  readonly providerStatus: string;
  readonly recordSchemaVersionStatus: string;
  readonly serviceKeyStatus: string;
  readonly sdkImportAvailable: boolean;
  readonly clientCreatedSmokeOnly: boolean;
  readonly clientCreationAttempted: boolean;
  readonly nonNetworkSmokePassed: boolean;
  readonly queryFunctionCreated: boolean;
  readonly sqlExecutionAllowed: false;
  readonly sqlMutationExecuted: false;
  readonly networkQueryExecuted: false;
  readonly databaseAdapterCreated: false;
  readonly routeBindingAllowed: false;
  readonly factoryRouteBindingAllowed: false;
  readonly factoryDatabaseStatus: string;
  readonly queryIntentCount: number;
  readonly smokeRules: readonly string[];
  readonly issues: readonly string[];
}

export function resolvePublicResultDatabaseClientSmokeBoundary(
  env: PublicResultDatabaseClientSmokeEnvironment = process.env
): PublicResultDatabaseClientSmokeBoundaryResult {
  const runtimeSelection = resolvePublicResultStorageRuntimeSelection(env);
  const clientConfig = resolvePublicResultDatabaseClientConfigContract(env);
  const queryContract = resolvePublicResultDatabaseQueryContractRecord();
  const factoryDecision = resolvePublicResultStorageAdapterFactoryDecision({ env });
  const databaseUrl = normalizeOptionalEnvValue(env[PUBLIC_RESULT_DATABASE_URL_ENV]);
  const sdkImportAvailable = typeof neon === 'function';
  const requestedStorageMode = normalizeRequestedStorageMode(env[PUBLIC_RESULT_STORAGE_MODE_ENV]);

  const base = {
    schemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_PHASE,
    smokeMode: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_MODE,
    selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
    sdkDecisionSchemaVersion: PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION,
    clientConfigSchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
    queryContractSchemaVersion: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
    requestedStorageMode,
    runtimeSelectionStatus: runtimeSelection.status,
    clientConfigStatus: clientConfig.status,
    databaseUrlStatus: clientConfig.databaseUrlStatus,
    databaseUrlRedacted: databaseUrl === undefined ? null : redactDatabaseUrl(databaseUrl),
    providerStatus: clientConfig.providerStatus,
    recordSchemaVersionStatus: clientConfig.recordSchemaVersionStatus,
    serviceKeyStatus: clientConfig.serviceKeyStatus,
    sdkImportAvailable,
    sqlExecutionAllowed: false as const,
    sqlMutationExecuted: false as const,
    networkQueryExecuted: false as const,
    databaseAdapterCreated: false as const,
    routeBindingAllowed: false as const,
    factoryRouteBindingAllowed: false as const,
    factoryDatabaseStatus: factoryDecision.status,
    queryIntentCount: queryContract.queryIntents.length,
    smokeRules: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_RULES
  };

  if (requestedStorageMode !== PUBLIC_RESULT_STORAGE_DATABASE_MODE) {
    return {
      ...base,
      status: 'memory-mode-no-client-created',
      clientCreatedSmokeOnly: false,
      clientCreationAttempted: false,
      nonNetworkSmokePassed: true,
      queryFunctionCreated: false,
      issues:
        requestedStorageMode === 'invalid'
          ? [`invalid_storage_mode:${env[PUBLIC_RESULT_STORAGE_MODE_ENV]}`]
          : []
    };
  }

  const blockingIssues = [
    ...clientConfig.issues,
    ...runtimeSelection.issues.filter(
      (issue) => issue !== 'database_runtime_configured_but_route_binding_blocked_until_database_client_phase'
    )
  ];

  if (blockingIssues.length > 0 || databaseUrl === undefined || !sdkImportAvailable) {
    return {
      ...base,
      status: 'blocked',
      clientCreatedSmokeOnly: false,
      clientCreationAttempted: false,
      nonNetworkSmokePassed: false,
      queryFunctionCreated: false,
      issues: [
        ...blockingIssues,
        ...(databaseUrl === undefined ? [`missing_database_env:${PUBLIC_RESULT_DATABASE_URL_ENV}`] : []),
        ...(sdkImportAvailable ? [] : [`sdk_import_unavailable:${PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME}`])
      ]
    };
  }

  const queryFunction = neon(databaseUrl, { disableWarningInBrowsers: true });
  const queryFunctionCreated = typeof queryFunction === 'function';

  return {
    ...base,
    status: queryFunctionCreated ? 'client-created-smoke-only' : 'blocked',
    clientCreatedSmokeOnly: queryFunctionCreated,
    clientCreationAttempted: true,
    nonNetworkSmokePassed: queryFunctionCreated,
    queryFunctionCreated,
    issues: queryFunctionCreated ? [] : ['neon_query_function_not_created']
  };
}

export function summarizePublicResultDatabaseClientSmokeBoundaryRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_MODE}`,
    ...PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_RULES
  ];
}

export function buildCompleteDatabaseClientSmokeEnvironment(): PublicResultDatabaseClientSmokeEnvironment {
  return {
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    [PUBLIC_RESULT_DATABASE_URL_ENV]: 'postgresql://contract_user:contract_password@example.invalid/the_20_corridors?sslmode=require',
    [PUBLIC_RESULT_DATABASE_PROVIDER_ENV]: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    [PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV]: 'public-result-database-record-v1',
    [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'contract-only-service-key-placeholder'
  };
}

function normalizeRequestedStorageMode(value: string | undefined): 'unset' | 'memory' | 'database' | 'invalid' {
  const normalized = normalizeOptionalEnvValue(value);
  if (normalized === undefined) return 'unset';
  if (normalized === PUBLIC_RESULT_STORAGE_MEMORY_MODE) return PUBLIC_RESULT_STORAGE_MEMORY_MODE;
  if (normalized === PUBLIC_RESULT_STORAGE_DATABASE_MODE) return PUBLIC_RESULT_STORAGE_DATABASE_MODE;
  return 'invalid';
}

function normalizeOptionalEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function redactDatabaseUrl(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.username !== '') parsed.username = 'redacted';
    if (parsed.password !== '') parsed.password = 'redacted';
    return parsed.toString();
  } catch {
    return 'invalid-database-url-redacted';
  }
}
