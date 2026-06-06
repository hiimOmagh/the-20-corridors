import { DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION } from './databasePublicResultStorage';
import {
  PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
  PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION
} from './publicResultDatabaseSdkDecision';

export const PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION =
  'phase-8.5-database-query-contract-v1' as const;
export const PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_PHASE = 'phase-8.5-database-query-contract' as const;
export const PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS = 'query-contract-only-no-sql-execution' as const;

export const PUBLIC_RESULT_DATABASE_TABLE_NAME = 'public_result_links' as const;
export const PUBLIC_RESULT_DATABASE_PRIMARY_KEY = 'public_id' as const;
export const PUBLIC_RESULT_DATABASE_DELETE_TOKEN_HASH_INDEX = 'idx_public_result_links_delete_token_hash' as const;
export const PUBLIC_RESULT_DATABASE_EXPIRY_INDEX = 'idx_public_result_links_expires_at' as const;
export const PUBLIC_RESULT_DATABASE_STATUS_INDEX = 'idx_public_result_links_status' as const;

export const PUBLIC_RESULT_DATABASE_QUERY_EXECUTION_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_SQL_CLIENT_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_SDK_INSTALL_ALLOWED_IN_QUERY_PHASE = false as const;
export const PUBLIC_RESULT_DATABASE_SDK_IMPORT_ALLOWED_IN_QUERY_PHASE = false as const;
export const PUBLIC_RESULT_DATABASE_ROUTE_BINDING_ALLOWED_IN_QUERY_PHASE = false as const;
export const PUBLIC_RESULT_DATABASE_FACTORY_DATABASE_ADAPTER_ALLOWED_IN_QUERY_PHASE = false as const;

export const PUBLIC_RESULT_DATABASE_COLUMNS = [
  {
    name: 'schema_version',
    type: 'text',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.schemaVersion',
    constraints: ['equals-current-database-record-schema-version']
  },
  {
    name: 'public_id',
    type: 'text',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.publicId',
    constraints: ['primary-key', 'anonymous-non-sequential-id']
  },
  {
    name: 'dto',
    type: 'jsonb',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.dto',
    constraints: ['minimized-public-result-dto-only', 'no-raw-answers', 'no-private-score-internals']
  },
  {
    name: 'delete_token_hash',
    type: 'text',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.deleteTokenHash',
    constraints: ['hash-only', 'raw-delete-token-never-stored']
  },
  {
    name: 'created_at',
    type: 'timestamptz',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.createdAt',
    constraints: ['iso-timestamp']
  },
  {
    name: 'expires_at',
    type: 'timestamptz',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.expiresAt',
    constraints: ['iso-timestamp', 'read-time-expiry-check']
  },
  {
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    source: 'DatabasePublicResultStorageRecord.deletedAt',
    constraints: ['null-until-soft-delete', 'deleted-at-wins-over-active-status']
  },
  {
    name: 'status',
    type: 'text',
    nullable: false,
    source: 'DatabasePublicResultStorageRecord.status',
    constraints: ['active-expired-deleted-only']
  },
  {
    name: 'updated_at',
    type: 'timestamptz',
    nullable: false,
    source: 'database-maintained-metadata',
    constraints: ['mutation-timestamp', 'not-exposed-in-public-dto']
  }
] as const;

export const PUBLIC_RESULT_DATABASE_INDEXES = [
  {
    name: 'pk_public_result_links_public_id',
    columns: ['public_id'],
    unique: true,
    purpose: 'read-by-public-id-and-idempotent-create-conflict-control'
  },
  {
    name: PUBLIC_RESULT_DATABASE_DELETE_TOKEN_HASH_INDEX,
    columns: ['delete_token_hash'],
    unique: false,
    purpose: 'delete-token-hash-verification-without-raw-token-storage'
  },
  {
    name: PUBLIC_RESULT_DATABASE_EXPIRY_INDEX,
    columns: ['expires_at'],
    unique: false,
    purpose: 'expired-record-prune-and-read-time-expiry-check'
  },
  {
    name: PUBLIC_RESULT_DATABASE_STATUS_INDEX,
    columns: ['status'],
    unique: false,
    purpose: 'active-expired-deleted-lifecycle-filtering'
  }
] as const;

export const PUBLIC_RESULT_DATABASE_QUERY_INTENTS = [
  {
    name: 'insert-public-result-record',
    operation: 'insert',
    parameters: ['schema_version', 'public_id', 'dto', 'delete_token_hash', 'created_at', 'expires_at', 'deleted_at', 'status', 'updated_at'],
    returns: 'inserted-record-row',
    behavior: 'create-one-minimized-public-result-record-or-fail-without-issuing-success',
    executionAllowed: false
  },
  {
    name: 'read-active-public-result-by-public-id',
    operation: 'select',
    parameters: ['public_id', 'now_iso'],
    returns: 'record-or-null-with-read-disposition',
    behavior: 'missing-returns-null-expired-returns-expired-deleted-returns-deleted-active-returns-dto',
    executionAllowed: false
  },
  {
    name: 'verify-delete-token-hash-for-public-id',
    operation: 'select',
    parameters: ['public_id', 'delete_token_hash'],
    returns: 'match-or-null',
    behavior: 'hash-match-required-before-soft-delete',
    executionAllowed: false
  },
  {
    name: 'soft-delete-public-result-by-public-id',
    operation: 'update',
    parameters: ['public_id', 'delete_token_hash', 'deleted_at', 'updated_at'],
    returns: 'updated-record-or-null',
    behavior: 'set-status-deleted-and-deleted-at-only-when-delete-token-hash-matches',
    executionAllowed: false
  },
  {
    name: 'mark-expired-public-results',
    operation: 'update',
    parameters: ['now_iso', 'updated_at'],
    returns: 'expired-row-count',
    behavior: 'mark-non-deleted-expired-records-with-status-expired-without-removing-dto',
    executionAllowed: false
  },
  {
    name: 'prune-deleted-or-expired-public-results',
    operation: 'delete',
    parameters: ['retention_cutoff_iso'],
    returns: 'deleted-row-count',
    behavior: 'future-retention-cleanup-only-not-route-read-path',
    executionAllowed: false
  }
] as const;

export const PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES = [
  'query-contract-is-static-and-non-executable-in-phase-8-5',
  'table-contract-is-defined-before-sdk-installation',
  'column-names-and-types-are-explicit',
  'insert-read-delete-update-expiry-query-intents-are-defined',
  'soft-delete-sets-deleted-at-and-status-deleted',
  'deleted-at-wins-over-active-status',
  'expired-records-return-expired-disposition-at-read-time',
  'delete-token-hash-is-used-for-delete-verification',
  'raw-delete-token-is-never-persisted-or-selected',
  'dto-column-stores-minimized-public-result-dto-only',
  'no-sql-execution-or-client-binding-is-allowed',
  'database-sdk-remains-not-installed-and-not-imported'
] as const;

export interface PublicResultDatabaseQueryColumnContract {
  readonly name: (typeof PUBLIC_RESULT_DATABASE_COLUMNS)[number]['name'];
  readonly type: (typeof PUBLIC_RESULT_DATABASE_COLUMNS)[number]['type'];
  readonly nullable: boolean;
  readonly source: string;
  readonly constraints: readonly string[];
}

export interface PublicResultDatabaseQueryIntentContract {
  readonly name: (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number]['name'];
  readonly operation: (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number]['operation'];
  readonly parameters: readonly string[];
  readonly returns: string;
  readonly behavior: string;
  readonly executionAllowed: false;
}

export interface PublicResultDatabaseQueryContractRecord {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_PHASE;
  readonly status: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS;
  readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
  readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
  readonly sdkDecisionSchemaVersion: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION;
  readonly databaseRecordSchemaVersion: typeof DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION;
  readonly tableName: typeof PUBLIC_RESULT_DATABASE_TABLE_NAME;
  readonly primaryKey: typeof PUBLIC_RESULT_DATABASE_PRIMARY_KEY;
  readonly columns: typeof PUBLIC_RESULT_DATABASE_COLUMNS;
  readonly indexes: typeof PUBLIC_RESULT_DATABASE_INDEXES;
  readonly queryIntents: typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS;
  readonly behaviorRules: typeof PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES;
  readonly queryExecutionAllowed: false;
  readonly sqlClientAllowed: false;
  readonly sdkInstallAllowed: false;
  readonly sdkImportAllowed: false;
  readonly routeBindingAllowed: false;
  readonly factoryDatabaseAdapterAllowed: false;
}

export function resolvePublicResultDatabaseQueryContractRecord(): PublicResultDatabaseQueryContractRecord {
  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_PHASE,
    status: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS,
    selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
    sdkDecisionSchemaVersion: PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION,
    databaseRecordSchemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
    tableName: PUBLIC_RESULT_DATABASE_TABLE_NAME,
    primaryKey: PUBLIC_RESULT_DATABASE_PRIMARY_KEY,
    columns: PUBLIC_RESULT_DATABASE_COLUMNS,
    indexes: PUBLIC_RESULT_DATABASE_INDEXES,
    queryIntents: PUBLIC_RESULT_DATABASE_QUERY_INTENTS,
    behaviorRules: PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES,
    queryExecutionAllowed: PUBLIC_RESULT_DATABASE_QUERY_EXECUTION_ALLOWED,
    sqlClientAllowed: PUBLIC_RESULT_DATABASE_SQL_CLIENT_ALLOWED,
    sdkInstallAllowed: PUBLIC_RESULT_DATABASE_SDK_INSTALL_ALLOWED_IN_QUERY_PHASE,
    sdkImportAllowed: PUBLIC_RESULT_DATABASE_SDK_IMPORT_ALLOWED_IN_QUERY_PHASE,
    routeBindingAllowed: PUBLIC_RESULT_DATABASE_ROUTE_BINDING_ALLOWED_IN_QUERY_PHASE,
    factoryDatabaseAdapterAllowed: PUBLIC_RESULT_DATABASE_FACTORY_DATABASE_ADAPTER_ALLOWED_IN_QUERY_PHASE
  };
}

export function summarizePublicResultDatabaseQueryContractRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION}`,
    `status:${PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS}`,
    `table:${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
    ...PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES
  ];
}

export function findPublicResultDatabaseQueryIntent(
  name: (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number]['name']
): (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number] {
  const intent = PUBLIC_RESULT_DATABASE_QUERY_INTENTS.find((item) => item.name === name);
  if (intent === undefined) {
    throw new Error(`Unknown public result database query intent: ${name}`);
  }
  return intent;
}
