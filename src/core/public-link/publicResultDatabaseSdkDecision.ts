import { DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION } from "./databasePublicResultStorage";
import {
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS,
  PUBLIC_RESULT_DATABASE_URL_ENV,
} from "./publicResultDatabaseClientConfig";

export const PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION =
  "phase-8.4-database-sdk-selection-decision-v1" as const;
export const PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE =
  "phase-8.4-database-sdk-selection-decision-record" as const;
export const PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS =
  "sdk-selected-contract-only" as const;

export const PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER = "postgresql" as const;
export const PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME =
  "@neondatabase/serverless" as const;
export const PUBLIC_RESULT_DATABASE_SELECTED_SDK_ROLE =
  "serverless-postgresql-http-client" as const;
export const PUBLIC_RESULT_DATABASE_SELECTED_RUNTIME =
  "next-route-handlers-node-runtime" as const;
export const PUBLIC_RESULT_DATABASE_SELECTED_ADAPTER_STRATEGY =
  "thin-sql-adapter-over-public-result-storage-contract" as const;

export const PUBLIC_RESULT_DATABASE_SDK_INSTALL_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_SDK_IMPORT_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_CREATION_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_ROUTE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_FACTORY_BINDING_ALLOWED = false as const;

export const PUBLIC_RESULT_DATABASE_SDK_DECISION_REASONS = [
  "selected-sdk-targets-serverless-postgresql-access",
  "selected-sdk-keeps-storage-record-schema-explicit",
  "selected-sdk-avoids-orm-schema-abstraction-before-sql-contract",
  "selected-sdk-fits-route-handler-server-only-boundary",
  "selected-sdk-can-use-centralized-server-only-env-contract-later",
  "decision-does-not-install-or-import-the-sdk-in-phase-8-4",
] as const;

export const PUBLIC_RESULT_DATABASE_REJECTED_SDK_ALTERNATIVES = [
  {
    name: "@supabase/supabase-js",
    reason:
      "rejected-for-this-phase-to-avoid-platform-auth-storage-coupling-before-minimal-result-persistence",
  },
  {
    name: "prisma/@prisma-client",
    reason:
      "rejected-for-this-phase-to-avoid-orm-client-and-migration-complexity-before-the-sql-contract",
  },
  {
    name: "drizzle-orm",
    reason:
      "rejected-for-this-phase-to-avoid-schema-abstraction-before-the-storage-query-contract-is-locked",
  },
  {
    name: "pg",
    reason:
      "rejected-for-this-phase-to-avoid-raw-tcp-pooling-assumptions-in-serverless-route-handlers",
  },
  {
    name: "mongoose",
    reason:
      "rejected-because-the-phase-8-storage-record-contract-is-postgresql-oriented-not-document-store-oriented",
  },
] as const;

export const PUBLIC_RESULT_DATABASE_FAILURE_MODE_MODEL = [
  {
    code: "missing-env",
    routeBehavior: "fail-closed-before-adapter-creation",
    publicResponse: "no-public-result-created",
    evidenceSource: "database-client-config-contract",
  },
  {
    code: "invalid-env",
    routeBehavior: "fail-closed-before-adapter-creation",
    publicResponse: "no-public-result-created",
    evidenceSource: "database-client-config-contract",
  },
  {
    code: "database-unavailable",
    routeBehavior: "return-controlled-server-error-without-raw-result-or-token-leakage",
    publicResponse: "generic-temporary-failure-copy",
    evidenceSource: "future-database-adapter-runtime-smoke",
  },
  {
    code: "write-failure",
    routeBehavior: "do-not-issue-public-id-as-persisted-success",
    publicResponse: "generic-create-failure-copy",
    evidenceSource: "future-database-adapter-runtime-smoke",
  },
  {
    code: "read-miss",
    routeBehavior: "return-not-found-null-record",
    publicResponse: "not-found-or-expired-result-copy",
    evidenceSource: "database-adapter-contract",
  },
  {
    code: "read-expired",
    routeBehavior: "return-expired-null-public-dto-response-upstream",
    publicResponse: "expired-result-copy",
    evidenceSource: "database-adapter-contract",
  },
  {
    code: "delete-token-mismatch",
    routeBehavior: "reject-delete-without-mutating-record",
    publicResponse: "generic-delete-failure-copy",
    evidenceSource: "public-storage-contract",
  },
  {
    code: "delete-failure",
    routeBehavior: "preserve-existing-record-state-and-return-controlled-failure",
    publicResponse: "generic-delete-failure-copy",
    evidenceSource: "future-database-adapter-runtime-smoke",
  },
  {
    code: "schema-version-mismatch",
    routeBehavior: "reject-record-before-public-response-mapping",
    publicResponse: "generic-unavailable-result-copy",
    evidenceSource: "database-adapter-contract",
  },
] as const;

export const PUBLIC_RESULT_DATABASE_SECURITY_MODEL = [
  "database-env-vars-are-server-only",
  `service-key-stays-in-${PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV}`,
  "next-public-database-env-vars-are-forbidden",
  "stored-payload-is-minimized-public-result-dto-only",
  "raw-answers-and-private-score-internals-are-not-persisted",
  "raw-delete-token-is-never-persisted",
  "delete-token-hash-is-the-only-delete-token-record-field",
  "public-id-must-remain-anonymous-and-non-sequential",
  "route-responses-must-not-expose-database-errors-or-env-values",
] as const;

export const PUBLIC_RESULT_DATABASE_SDK_DECISION_RULES = [
  "provider-decision-record-exists",
  "selected-sdk-is-documented-but-not-installed",
  "selected-sdk-is-documented-but-not-imported",
  "rejected-alternatives-are-documented",
  "serverless-runtime-assumptions-are-documented",
  "secret-handling-model-is-documented",
  "failure-modes-are-defined-before-client-binding",
  "database-client-creation-remains-blocked",
  "factory-database-adapter-creation-remains-blocked",
  "routes-remain-memory-dry-run",
] as const;

export interface PublicResultDatabaseSdkDecisionRecord {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE;
  readonly status: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS;
  readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
  readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
  readonly selectedSdkRole: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_ROLE;
  readonly selectedRuntime: typeof PUBLIC_RESULT_DATABASE_SELECTED_RUNTIME;
  readonly selectedAdapterStrategy: typeof PUBLIC_RESULT_DATABASE_SELECTED_ADAPTER_STRATEGY;
  readonly supportedProviders: readonly string[];
  readonly serverOnlyEnvKeys: readonly string[];
  readonly requiredUrlEnvKey: typeof PUBLIC_RESULT_DATABASE_URL_ENV;
  readonly serviceKeyEnvKey: typeof PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV;
  readonly databaseRecordSchemaVersion: typeof DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION;
  readonly databaseClientConfigSchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION;
  readonly sdkInstallAllowed: false;
  readonly sdkImportAllowed: false;
  readonly databaseClientCreationAllowed: false;
  readonly routeBindingAllowed: false;
  readonly factoryBindingAllowed: false;
  readonly reasons: readonly string[];
  readonly rejectedAlternatives: typeof PUBLIC_RESULT_DATABASE_REJECTED_SDK_ALTERNATIVES;
  readonly failureModes: typeof PUBLIC_RESULT_DATABASE_FAILURE_MODE_MODEL;
  readonly securityModel: readonly string[];
  readonly decisionRules: readonly string[];
}

export function resolvePublicResultDatabaseSdkDecisionRecord(): PublicResultDatabaseSdkDecisionRecord {
  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE,
    status: PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS,
    selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
    selectedSdkRole: PUBLIC_RESULT_DATABASE_SELECTED_SDK_ROLE,
    selectedRuntime: PUBLIC_RESULT_DATABASE_SELECTED_RUNTIME,
    selectedAdapterStrategy: PUBLIC_RESULT_DATABASE_SELECTED_ADAPTER_STRATEGY,
    supportedProviders: PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS,
    serverOnlyEnvKeys: PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
    requiredUrlEnvKey: PUBLIC_RESULT_DATABASE_URL_ENV,
    serviceKeyEnvKey: PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
    databaseRecordSchemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
    databaseClientConfigSchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
    sdkInstallAllowed: PUBLIC_RESULT_DATABASE_SDK_INSTALL_ALLOWED,
    sdkImportAllowed: PUBLIC_RESULT_DATABASE_SDK_IMPORT_ALLOWED,
    databaseClientCreationAllowed: PUBLIC_RESULT_DATABASE_CLIENT_CREATION_ALLOWED,
    routeBindingAllowed: PUBLIC_RESULT_DATABASE_ROUTE_BINDING_ALLOWED,
    factoryBindingAllowed: PUBLIC_RESULT_DATABASE_FACTORY_BINDING_ALLOWED,
    reasons: PUBLIC_RESULT_DATABASE_SDK_DECISION_REASONS,
    rejectedAlternatives: PUBLIC_RESULT_DATABASE_REJECTED_SDK_ALTERNATIVES,
    failureModes: PUBLIC_RESULT_DATABASE_FAILURE_MODE_MODEL,
    securityModel: PUBLIC_RESULT_DATABASE_SECURITY_MODEL,
    decisionRules: PUBLIC_RESULT_DATABASE_SDK_DECISION_RULES,
  };
}

export function summarizePublicResultDatabaseSdkDecisionRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION}`,
    `selected-sdk:${PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME}`,
    `selected-provider:${PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER}`,
    ...PUBLIC_RESULT_DATABASE_SDK_DECISION_RULES,
  ];
}
