import type { DatabasePublicResultStorageRecord } from './databasePublicResultStorage';
import { PUBLIC_RESULT_DTO_SCHEMA_VERSION } from './publicResultDto';
import {
  PUBLIC_RESULT_DATABASE_PRIMARY_KEY,
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_QUERY_INTENTS,
  PUBLIC_RESULT_DATABASE_TABLE_NAME,
  resolvePublicResultDatabaseQueryContractRecord
} from './publicResultDatabaseQueryContract';
import { PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION } from './publicResultDatabaseClientSmokeBoundary';
import { PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER, PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME } from './publicResultDatabaseSdkDecision';

export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION =
  'phase-8.7-database-client-query-readiness-guard-v1' as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_PHASE =
  'phase-8.7-database-client-query-readiness-guard' as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_MODE =
  'parameterized-query-descriptors-no-execution-no-route-binding' as const;

export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SERVER_ONLY = true as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_EXECUTION_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_NETWORK_SMOKE_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_MUTATION_SMOKE_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_ROUTE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_QUERY_ADAPTER_PERSISTENCE_ALLOWED = false as const;

export type PublicResultDatabaseQueryIntentName = (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number]['name'];
export type PublicResultDatabaseQueryOperation = (typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS)[number]['operation'];

export interface PublicResultDatabaseParameterizedQueryDescriptor {
  readonly intentName: PublicResultDatabaseQueryIntentName;
  readonly operation: PublicResultDatabaseQueryOperation;
  readonly text: string;
  readonly parameterOrder: readonly string[];
  readonly values: readonly unknown[];
  readonly placeholderCount: number;
  readonly valueCount: number;
  readonly parameterized: true;
  readonly usesRawStringInterpolation: false;
  readonly executionAllowed: false;
  readonly networkExecutionAllowed: false;
  readonly mutationSmokeAllowed: false;
}

export interface PublicResultDatabaseQueryReadinessRecord {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_PHASE;
  readonly readinessMode: typeof PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_MODE;
  readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
  readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
  readonly queryContractSchemaVersion: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION;
  readonly clientSmokeSchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION;
  readonly tableName: typeof PUBLIC_RESULT_DATABASE_TABLE_NAME;
  readonly primaryKey: typeof PUBLIC_RESULT_DATABASE_PRIMARY_KEY;
  readonly serverOnly: true;
  readonly sqlExecutionAllowed: false;
  readonly networkSmokeAllowed: false;
  readonly mutationSmokeAllowed: false;
  readonly routeBindingAllowed: false;
  readonly adapterPersistenceAllowed: false;
  readonly queryDescriptors: readonly PublicResultDatabaseParameterizedQueryDescriptor[];
  readonly mappedIntentNames: readonly PublicResultDatabaseQueryIntentName[];
  readonly parameterizationRules: readonly string[];
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_DATABASE_QUERY_READINESS_RULES = [
  'query-readiness-is-server-only',
  'query-helpers-return-parameterized-descriptors-only',
  'query-text-uses-positional-placeholders-only',
  'user-controlled-values-live-in-values-array-only',
  'no-template-string-interpolation-for-user-controlled-values',
  'insert-read-delete-expiry-helpers-map-to-phase-8-5-query-intents',
  'no-sql-execution-in-readiness-guard',
  'no-network-smoke-in-readiness-guard',
  'no-database-backed-adapter-yet',
  'factory-route-binding-remains-blocked',
  'routes-remain-memory-dry-run-behavior'
] as const;

const SELECTED_COLUMNS = [
  'schema_version',
  'public_id',
  'dto',
  'delete_token_hash',
  'created_at',
  'expires_at',
  'deleted_at',
  'status',
  'updated_at'
] as const;

export function buildInsertPublicResultRecordQuery(
  record: DatabasePublicResultStorageRecord,
  updatedAtIso: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'insert-public-result-record',
    operation: 'insert',
    text: [
      `INSERT INTO ${PUBLIC_RESULT_DATABASE_TABLE_NAME} (schema_version, public_id, dto, delete_token_hash, created_at, expires_at, deleted_at, status, updated_at)`,
      'VALUES ($1, $2, $3::jsonb, $4, $5::timestamptz, $6::timestamptz, $7::timestamptz, $8, $9::timestamptz)',
      `RETURNING ${SELECTED_COLUMNS.join(', ')}`
    ].join(' '),
    parameterOrder: ['schema_version', 'public_id', 'dto', 'delete_token_hash', 'created_at', 'expires_at', 'deleted_at', 'status', 'updated_at'],
    values: [
      record.schemaVersion,
      record.publicId,
      record.dto,
      record.deleteTokenHash,
      record.createdAt,
      record.expiresAt,
      record.deletedAt,
      record.status,
      updatedAtIso
    ]
  });
}

export function buildReadActivePublicResultByPublicIdQuery(
  publicId: string,
  nowIso: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'read-active-public-result-by-public-id',
    operation: 'select',
    text: [
      `SELECT ${SELECTED_COLUMNS.join(', ')},`,
      "CASE WHEN deleted_at IS NOT NULL OR status = 'deleted' THEN 'deleted'",
      "WHEN expires_at <= $2::timestamptz THEN 'expired'",
      "ELSE status END AS read_disposition",
      `FROM ${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
      'WHERE public_id = $1',
      'LIMIT 1'
    ].join(' '),
    parameterOrder: ['public_id', 'now_iso'],
    values: [publicId, nowIso]
  });
}

export function buildVerifyDeleteTokenHashForPublicIdQuery(
  publicId: string,
  deleteTokenHash: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'verify-delete-token-hash-for-public-id',
    operation: 'select',
    text: [
      `SELECT public_id FROM ${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
      'WHERE public_id = $1 AND delete_token_hash = $2 AND deleted_at IS NULL',
      'LIMIT 1'
    ].join(' '),
    parameterOrder: ['public_id', 'delete_token_hash'],
    values: [publicId, deleteTokenHash]
  });
}

export function buildSoftDeletePublicResultByPublicIdQuery(
  publicId: string,
  deleteTokenHash: string,
  deletedAtIso: string,
  updatedAtIso: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'soft-delete-public-result-by-public-id',
    operation: 'update',
    text: [
      `UPDATE ${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
      "SET status = 'deleted', deleted_at = $3::timestamptz, updated_at = $4::timestamptz",
      'WHERE public_id = $1 AND delete_token_hash = $2 AND deleted_at IS NULL',
      `RETURNING ${SELECTED_COLUMNS.join(', ')}`
    ].join(' '),
    parameterOrder: ['public_id', 'delete_token_hash', 'deleted_at', 'updated_at'],
    values: [publicId, deleteTokenHash, deletedAtIso, updatedAtIso]
  });
}

export function buildMarkExpiredPublicResultsQuery(
  nowIso: string,
  updatedAtIso: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'mark-expired-public-results',
    operation: 'update',
    text: [
      `UPDATE ${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
      "SET status = 'expired', updated_at = $2::timestamptz",
      "WHERE expires_at <= $1::timestamptz AND deleted_at IS NULL AND status = 'active'",
      'RETURNING public_id'
    ].join(' '),
    parameterOrder: ['now_iso', 'updated_at'],
    values: [nowIso, updatedAtIso]
  });
}

export function buildPruneDeletedOrExpiredPublicResultsQuery(
  retentionCutoffIso: string
): PublicResultDatabaseParameterizedQueryDescriptor {
  return buildDescriptor({
    intentName: 'prune-deleted-or-expired-public-results',
    operation: 'delete',
    text: [
      `DELETE FROM ${PUBLIC_RESULT_DATABASE_TABLE_NAME}`,
      "WHERE (status = 'expired' AND expires_at <= $1::timestamptz)",
      "OR (status = 'deleted' AND deleted_at <= $1::timestamptz)",
      'RETURNING public_id'
    ].join(' '),
    parameterOrder: ['retention_cutoff_iso'],
    values: [retentionCutoffIso]
  });
}

export function buildPublicResultDatabaseQueryReadinessRecord(): PublicResultDatabaseQueryReadinessRecord {
  const sampleRecord = buildSampleDatabaseRecord();
  const descriptors = [
    buildInsertPublicResultRecordQuery(sampleRecord, '2026-01-01T00:00:00.000Z'),
    buildReadActivePublicResultByPublicIdQuery(sampleRecord.publicId, '2026-01-01T00:00:00.000Z'),
    buildVerifyDeleteTokenHashForPublicIdQuery(sampleRecord.publicId, sampleRecord.deleteTokenHash),
    buildSoftDeletePublicResultByPublicIdQuery(
      sampleRecord.publicId,
      sampleRecord.deleteTokenHash,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z'
    ),
    buildMarkExpiredPublicResultsQuery('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
    buildPruneDeletedOrExpiredPublicResultsQuery('2026-01-01T00:00:00.000Z')
  ];
  const queryContract = resolvePublicResultDatabaseQueryContractRecord();
  const mappedIntentNames = descriptors.map((descriptor) => descriptor.intentName);
  const contractIntentNames = queryContract.queryIntents.map((intent) => intent.name);
  const issues = [
    ...contractIntentNames
      .filter((intentName) => !mappedIntentNames.includes(intentName))
      .map((intentName) => `missing_query_readiness_descriptor:${intentName}`),
    ...descriptors.flatMap((descriptor) => validateParameterizedDescriptor(descriptor))
  ];

  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_PHASE,
    readinessMode: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_MODE,
    selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
    queryContractSchemaVersion: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
    clientSmokeSchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
    tableName: PUBLIC_RESULT_DATABASE_TABLE_NAME,
    primaryKey: PUBLIC_RESULT_DATABASE_PRIMARY_KEY,
    serverOnly: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SERVER_ONLY,
    sqlExecutionAllowed: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_EXECUTION_ALLOWED,
    networkSmokeAllowed: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_NETWORK_SMOKE_ALLOWED,
    mutationSmokeAllowed: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_MUTATION_SMOKE_ALLOWED,
    routeBindingAllowed: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_ROUTE_BINDING_ALLOWED,
    adapterPersistenceAllowed: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_ADAPTER_PERSISTENCE_ALLOWED,
    queryDescriptors: descriptors,
    mappedIntentNames,
    parameterizationRules: PUBLIC_RESULT_DATABASE_QUERY_READINESS_RULES,
    issues
  };
}

export function validateParameterizedDescriptor(
  descriptor: PublicResultDatabaseParameterizedQueryDescriptor
): readonly string[] {
  const placeholderCount = countDistinctPositionalPlaceholders(descriptor.text);
  const issues: string[] = [];
  if (placeholderCount !== descriptor.valueCount || placeholderCount !== descriptor.values.length) {
    issues.push(`placeholder_value_count_mismatch:${descriptor.intentName}`);
  }
  if (descriptor.valueCount !== descriptor.parameterOrder.length) {
    issues.push(`parameter_order_value_count_mismatch:${descriptor.intentName}`);
  }
  if (descriptor.text.includes('${') || descriptor.text.includes(' + ')) {
    issues.push(`raw_string_interpolation_signal:${descriptor.intentName}`);
  }
  if (descriptor.executionAllowed || descriptor.networkExecutionAllowed || descriptor.mutationSmokeAllowed) {
    issues.push(`query_execution_not_blocked:${descriptor.intentName}`);
  }
  return issues;
}

function buildDescriptor(input: Readonly<{
  intentName: PublicResultDatabaseQueryIntentName;
  operation: PublicResultDatabaseQueryOperation;
  text: string;
  parameterOrder: readonly string[];
  values: readonly unknown[];
}>): PublicResultDatabaseParameterizedQueryDescriptor {
  const placeholderCount = countDistinctPositionalPlaceholders(input.text);
  return {
    intentName: input.intentName,
    operation: input.operation,
    text: input.text,
    parameterOrder: input.parameterOrder,
    values: input.values,
    placeholderCount,
    valueCount: input.values.length,
    parameterized: true,
    usesRawStringInterpolation: false,
    executionAllowed: false,
    networkExecutionAllowed: false,
    mutationSmokeAllowed: false
  };
}

function countDistinctPositionalPlaceholders(text: string): number {
  const matches = [...text.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
  return new Set(matches).size;
}

function buildSampleDatabaseRecord(): DatabasePublicResultStorageRecord {
  return {
    schemaVersion: 'public-result-database-record-v1',
    publicId: 'pub_1234567890abcdef12345678',
    dto: {
      schemaVersion: PUBLIC_RESULT_DTO_SCHEMA_VERSION,
      resultId: 'pub_1234567890abcdef12345678',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-02-01T00:00:00.000Z',
      archetype: {
        id: 'observer_strategist',
        title: 'Observer Strategist',
        summary: 'Sample minimized DTO for query readiness only.'
      },
      confidenceBand: 'high',
      dominantTags: [],
      deepMotive: { key: 'clarity', label: 'Clarity', band: 'high' },
      axisSummaries: [],
      contradictionSummaries: [],
      shareCard: {
        title: 'Observer Strategist',
        signature: '20 Corridors',
        summary: 'Sample minimized DTO for query readiness only.',
        metrics: [],
        boundaryText: 'Local query readiness only'
      },
      reportOverview: {
        patternSummary: 'Sample minimized DTO for query readiness only.',
        primaryAxis: 'clarity',
        mainContradiction: null
      },
      deleteTokenHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    deleteTokenHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-02-01T00:00:00.000Z',
    deletedAt: null,
    status: 'active'
  };
}
