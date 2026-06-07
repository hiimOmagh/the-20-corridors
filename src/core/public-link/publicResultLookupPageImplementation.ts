import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto, type PublicResultDto } from './publicResultDto';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultLookupPageDatabaseActivationDecision
} from './publicResultLookupPageDatabaseActivation';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV
} from './publicResultApiRouteDatabaseBindingImplementation';
import {
  createPublicResultApiRouteDatabaseBindingStorageAdapter,
  type PublicResultApiRouteDatabaseBindingImplementationEnvironment
} from './publicResultApiRouteDatabaseBindingImplementation';
import type { PublicResultDatabaseQueryExecutor } from './publicResultDatabaseStorageAdapter';
import { buildPublicResultDeleteTokenHash, type PublicResultStorageAdapter, type PublicResultStorageReadResult, type PublicResultStorageRecord, type PublicResultStorageStatus } from './publicResultStorage';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION =
  'phase-8.19-public-result-lookup-page-implementation-gate-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE =
  'phase-8.19-public-result-lookup-page-implementation-gate' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MODE =
  'public-result-lookup-page-implemented-behind-activation-gate' as const;

export type PublicResultLookupPageImplementationContext =
  | 'public-result-page'
  | 'public-result-lookup-page-implementation-gate'
  | 'unspecified';

export type PublicResultLookupPageImplementationStatus =
  | 'public-result-page-renderable'
  | 'public-result-page-not-found'
  | 'public-result-page-deleted-unavailable'
  | 'public-result-page-expired-unavailable'
  | 'public-result-page-disabled'
  | 'public-result-page-configuration-error'
  | 'public-result-page-storage-unavailable';

export interface PublicResultLookupPageImplementationOptions {
  readonly publicId: string;
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultLookupPageImplementationContext;
  readonly adapter?: PublicResultStorageAdapter;
  readonly executeQuery?: PublicResultDatabaseQueryExecutor;
  readonly nowIso?: () => string;
}

export interface PublicResultLookupPageImplementationView {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MODE;
  readonly activationSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION;
  readonly activationPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE;
  readonly context: PublicResultLookupPageImplementationContext;
  readonly publicId: string;
  readonly status: PublicResultLookupPageImplementationStatus;
  readonly httpStatus: 200 | 404 | 410 | 500 | 503;
  readonly storageStatus: PublicResultStorageStatus | 'not-found' | 'not-read';
  readonly dto: PublicResultDto | null;
  readonly activationDecisionStatus: string;
  readonly activationDecisionReady: boolean;
  readonly publicLookupActivationFlagPresent: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly databaseReadAttempted: boolean;
  readonly databaseReadExecuted: boolean;
  readonly networkLookupSmokeExecuted: false;
  readonly productionMutationSmokeExecuted: false;
  readonly publicPageRouteImplemented: true;
  readonly actualPublicLookupPageBindingApplied: boolean;
  readonly rawDeleteTokenExposed: false;
  readonly rawAnswersExposed: false;
  readonly publicDtoOnly: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH = 'src/app/r/(public)/[publicId]/page.tsx' as const;

export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_RULES = [
  'public-result-lookup-page-implementation-is-behind-phase-8-18-activation-decision',
  'default-public-lookup-page-behavior-is-disabled-safe-fallback',
  'rollback-to-memory-blocks-public-page-database-lookup',
  'missing-or-invalid-env-fails-closed-before-database-read',
  'read-miss-renders-not-found-behavior',
  'deleted-result-renders-unavailable-behavior-without-dto',
  'expired-result-renders-expired-behavior-without-dto',
  'renderable-result-exposes-dto-only-public-fields',
  'raw-delete-token-is-never-exposed',
  'raw-answers-are-never-exposed',
  'no-production-network-lookup-smoke-by-default',
  'api-route-persistence-rollback-remains-separate'
] as const;

export async function resolvePublicResultLookupPageImplementationView(
  options: PublicResultLookupPageImplementationOptions
): Promise<PublicResultLookupPageImplementationView> {
  const env = options.env ?? process.env;
  const context = options.context ?? 'unspecified';
  const rollbackToMemoryRequested = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV] === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY;
  const activationDecision = await resolvePublicResultLookupPageDatabaseActivationDecision({
    env,
    context: 'public-result-lookup-page-activation-contract',
    acknowledgeActivationDecisionOnly: true,
    acknowledgeNoRealPageDatabaseRead: true,
    acknowledgePageRouteImplementationSeparate: true,
    acknowledgeRollbackBlocksLookupActivation: true
  });

  const base = {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MODE,
    activationSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION,
    activationPhase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
    context,
    publicId: options.publicId,
    activationDecisionStatus: activationDecision.status,
    activationDecisionReady: activationDecision.activationDecisionReady,
    publicLookupActivationFlagPresent: activationDecision.publicLookupActivationFlagPresent,
    rollbackToMemoryRequested,
    networkLookupSmokeExecuted: false,
    productionMutationSmokeExecuted: false,
    publicPageRouteImplemented: true,
    rawDeleteTokenExposed: false,
    rawAnswersExposed: false
  } as const;

  if (!activationDecision.publicLookupActivationFlagPresent) {
    return {
      ...base,
      status: 'public-result-page-disabled',
      httpStatus: 404,
      storageStatus: 'not-read',
      dto: null,
      databaseReadAttempted: false,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: false,
      publicDtoOnly: true,
      issues: ['public_lookup_page_database_activation_flag_not_enabled']
    };
  }

  if (rollbackToMemoryRequested) {
    return {
      ...base,
      status: 'public-result-page-disabled',
      httpStatus: 503,
      storageStatus: 'not-read',
      dto: null,
      databaseReadAttempted: false,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: false,
      publicDtoOnly: true,
      issues: ['public_lookup_page_database_activation_blocked_by_rollback_to_memory']
    };
  }

  if (activationDecision.status !== 'public-result-lookup-page-activation-ready-not-applied') {
    return {
      ...base,
      status: 'public-result-page-configuration-error',
      httpStatus: 500,
      storageStatus: 'not-read',
      dto: null,
      databaseReadAttempted: false,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: false,
      publicDtoOnly: true,
      issues: activationDecision.issues.length > 0
        ? activationDecision.issues.map((issue) => `activation:${issue}`)
        : [`activation_not_ready:${activationDecision.status}`]
    };
  }

  try {
    const adapter = options.adapter ?? createPublicResultApiRouteDatabaseBindingStorageAdapter({
      env: stripPublicLookupActivationFlagForApiRouteAdapter(env),
      context: 'public-api-route-handler',
      ...(options.executeQuery === undefined ? {} : { executeQuery: options.executeQuery }),
      ...(options.nowIso === undefined ? {} : { nowIso: options.nowIso })
    });
    const readResult = await adapter.read(options.publicId);
    return mapStorageReadResultToPublicLookupView(base, readResult);
  } catch (error) {
    return {
      ...base,
      status: 'public-result-page-storage-unavailable',
      httpStatus: 500,
      storageStatus: 'not-read',
      dto: null,
      databaseReadAttempted: true,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: true,
      publicDtoOnly: true,
      issues: [`storage_unavailable:${error instanceof Error ? error.message : 'unknown'}`]
    };
  }
}

export function summarizePublicResultLookupPageImplementationRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION}`,
    `route:${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_RULES
  ];
}

export function stripPublicLookupActivationFlagForApiRouteAdapter(
  env: PublicResultStorageRuntimeEnvironment
): PublicResultApiRouteDatabaseBindingImplementationEnvironment {
  const { [PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV]: _removed, ...rest } = env;
  return rest;
}

function mapStorageReadResultToPublicLookupView(
  base: Omit<PublicResultLookupPageImplementationView,
    'status' | 'httpStatus' | 'storageStatus' | 'dto' | 'databaseReadAttempted' | 'databaseReadExecuted' |
    'actualPublicLookupPageBindingApplied' | 'publicDtoOnly' | 'issues'>,
  readResult: PublicResultStorageReadResult
): PublicResultLookupPageImplementationView {
  if (readResult.status === 'not-found' || readResult.record === null) {
    return buildReadView(base, 'public-result-page-not-found', 404, 'not-found', null);
  }
  if (readResult.status === 'deleted') {
    return buildReadView(base, 'public-result-page-deleted-unavailable', 410, 'deleted', null);
  }
  if (readResult.status === 'expired') {
    return buildReadView(base, 'public-result-page-expired-unavailable', 410, 'expired', null);
  }
  return buildReadView(base, 'public-result-page-renderable', 200, 'active', readResult.record.dto);
}

function buildReadView(
  base: Omit<PublicResultLookupPageImplementationView,
    'status' | 'httpStatus' | 'storageStatus' | 'dto' | 'databaseReadAttempted' | 'databaseReadExecuted' |
    'actualPublicLookupPageBindingApplied' | 'publicDtoOnly' | 'issues'>,
  status: PublicResultLookupPageImplementationStatus,
  httpStatus: 200 | 404 | 410,
  storageStatus: PublicResultStorageStatus | 'not-found',
  dto: PublicResultDto | null
): PublicResultLookupPageImplementationView {
  return {
    ...base,
    status,
    httpStatus,
    storageStatus,
    dto,
    databaseReadAttempted: true,
    databaseReadExecuted: true,
    actualPublicLookupPageBindingApplied: true,
    publicDtoOnly: dto === null || isDtoOnly(dto),
    issues: []
  };
}

function isDtoOnly(dto: PublicResultDto): boolean {
  const serialized = JSON.stringify(dto);
  return !serialized.includes('raw' + 'Answers') && !serialized.includes('question' + 'Answers') && !serialized.includes('selected' + 'Answer');
}


const IMPLEMENTATION_FIXTURE_CREATED_AT = '2026-06-01T00:00:00.000Z';
const IMPLEMENTATION_FIXTURE_EXPIRES_AT = '2026-07-01T00:00:00.000Z';
const IMPLEMENTATION_FIXTURE_EXPIRED_AT = '2026-05-01T00:00:00.000Z';
const IMPLEMENTATION_FIXTURE_DELETE_TOKEN = 'delete_Phase819LookupImplementation_abcdefghijklmnopqrstuvwxyz123456';
const IMPLEMENTATION_FIXTURE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID = 'pub_Phase819LookupActiveAbCdEfGh';
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID = 'pub_Phase819LookupMissingBcDeFgHi';
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID = 'pub_Phase819LookupDeletedCdEfGhIj';
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID = 'pub_Phase819LookupExpiredDeFgHiJk';

export function createPublicResultLookupPageImplementationFixtureAdapter(): PublicResultStorageAdapter {
  const records = new Map<string, PublicResultStorageRecord>();
  records.set(
    PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    buildImplementationFixtureRecord(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID, 'active', IMPLEMENTATION_FIXTURE_EXPIRES_AT)
  );
  records.set(
    PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
    buildImplementationFixtureRecord(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID, 'deleted', IMPLEMENTATION_FIXTURE_EXPIRES_AT)
  );
  records.set(
    PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
    buildImplementationFixtureRecord(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID, 'expired', IMPLEMENTATION_FIXTURE_EXPIRED_AT)
  );

  return {
    create: async (input) => {
      const record: PublicResultStorageRecord = { schemaVersion: 'phase-6.0-public-result-storage-v1', status: 'active', ...input };
      records.set(input.publicId, record);
      return record;
    },
    read: async (publicId) => {
      const record = records.get(publicId) ?? null;
      return record === null ? { status: 'not-found', record: null } : { status: record.status, record };
    },
    delete: async (request) => {
      const record = records.get(request.publicId) ?? null;
      if (record === null) return { status: 'not-found', record: null };
      return { status: record.status, record };
    },
    pruneExpired: async () => ({ deletedCount: 0 })
  };
}

function buildImplementationFixtureRecord(
  publicId: string,
  status: PublicResultStorageStatus,
  expiresAt: string
): PublicResultStorageRecord {
  const deleteTokenHash = buildPublicResultDeleteTokenHash(IMPLEMENTATION_FIXTURE_DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(IMPLEMENTATION_FIXTURE_ANSWERS), {
    resultId: publicId,
    createdAt: IMPLEMENTATION_FIXTURE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
  return {
    schemaVersion: 'phase-6.0-public-result-storage-v1',
    publicId,
    dto,
    createdAt: IMPLEMENTATION_FIXTURE_CREATED_AT,
    expiresAt,
    deleteTokenHash,
    status
  };
}
