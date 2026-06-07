import { describe, expect, it } from 'vitest';
import { buildPublicResultDeleteRequestDto } from '../../src/core/public-link/publicResultApi';
import {
  buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment,
  buildPublicResultApiRouteDatabaseBindingRollbackEnvironment,
  createPublicResultApiRouteDatabaseBindingStorageAdapter,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision
} from '../../src/core/public-link/publicResultApiRouteDatabaseBindingImplementation';
import type { PublicResultDatabaseQueryExecutor, PublicResultDatabaseStorageAdapterRow } from '../../src/core/public-link/publicResultDatabaseStorageAdapter';
import type { PublicResultDatabaseParameterizedQueryDescriptor } from '../../src/core/public-link/publicResultDatabaseClientQueryReadiness';
import { buildPublicResultCreateRequestDto } from '../../src/core/public-link/publicResultApi';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { runCorridorsEngine } from '../../src/core/engine';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';
import { handlePublicResultCreateRouteBody, handlePublicResultDeleteRouteBody, handlePublicResultReadRoute } from '../../src/core/public-link/publicResultRouteHandlers';

const CREATED_AT = '2026-06-06T12:00:00.000Z';
const PUBLIC_ID = 'pub_8A14DatabaseBinding12345678';
const DELETE_TOKEN = 'delete_8A14DatabaseBinding_123456789';
const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

describe('public API route database binding implementation', () => {
  it('keeps memory as default and exposes immediate memory rollback', () => {
    const defaultDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: {}, context: 'public-api-route-handler' });
    const rollbackDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
      env: buildPublicResultApiRouteDatabaseBindingRollbackEnvironment(),
      context: 'public-api-route-handler'
    });

    expect(defaultDecision).toMatchObject({ status: 'memory-adapter-selected-default', memoryAdapterSelected: true, routeBindingApplied: false });
    expect(rollbackDecision).toMatchObject({ status: 'memory-adapter-selected-rollback', memoryAdapterSelected: true, routeBindingApplied: false, rollbackAvailable: true });
  });

  it('requires both the activation and implementation flags before selecting database binding', () => {
    const env = buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
    const active = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env, context: 'public-api-route-handler' });
    const missingImplementation = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
      env: withoutKey(env, PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV),
      context: 'public-api-route-handler'
    });

    expect(env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV]).toBe(PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED);
    expect(active).toMatchObject({ status: 'database-adapter-selected-for-public-api-route', routeBindingApplied: true, publicResultPageLookupActivationAllowed: false });
    expect(missingImplementation.status).toBe('api-route-database-binding-implementation-blocked');
  });

  it('routes create/read/delete through the database adapter when the explicit implementation gate is active', async () => {
    const fake = createFakeExecutor();
    const env = buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
    const options = { env, databaseExecuteQuery: fake.executeQuery, nowIso: CREATED_AT };

    const create = await handlePublicResultCreateRouteBody(buildCreateBody(), options);
    const read = await handlePublicResultReadRoute(PUBLIC_ID, options);
    const deleted = await handlePublicResultDeleteRouteBody(PUBLIC_ID, buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN), options);
    const readAfterDelete = await handlePublicResultReadRoute(PUBLIC_ID, options);

    expect(create.status).toBe(201);
    expect(read.status).toBe(200);
    expect(deleted.status).toBe(200);
    expect(readAfterDelete.status).toBe(410);
    expect(fake.executedQueryIntents()).toEqual(expect.arrayContaining(['insert-public-result-record', 'read-active-public-result-by-public-id', 'verify-delete-token-hash-for-public-id', 'soft-delete-public-result-by-public-id']));
    expect(JSON.stringify(fake.rows())).not.toContain(DELETE_TOKEN);
  });

  it('fails closed instead of silently using memory when database activation is partial', () => {
    expect(() => createPublicResultApiRouteDatabaseBindingStorageAdapter({ env: { PUBLIC_RESULT_STORAGE_MODE: 'database' }, context: 'public-api-route-handler' })).toThrow(/failed closed/);
  });
});

function buildCreateBody() {
  const expiresAt = buildDefaultPublicResultExpiry(CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), { resultId: PUBLIC_ID, createdAt: CREATED_AT, expiresAt, deleteTokenHash });
  return { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_8_14_route_binding_implementation_test'), deleteToken: DELETE_TOKEN };
}

function createFakeExecutor(): { readonly executeQuery: PublicResultDatabaseQueryExecutor; readonly executedQueryIntents: () => readonly string[]; readonly rows: () => readonly PublicResultDatabaseStorageAdapterRow[] } {
  let row: PublicResultDatabaseStorageAdapterRow | null = null;
  const executed: string[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    if (descriptor.intentName === 'insert-public-result-record') {
      row = rowFromInsertDescriptor(descriptor);
      return { rows: [row], rowCount: 1 };
    }
    if (descriptor.intentName === 'read-active-public-result-by-public-id') {
      if (row === null || row.public_id !== descriptor.values[0]) return emptyResult();
      return { rows: [row.deleted_at === null ? { ...row, read_disposition: row.status } : { ...row, read_disposition: 'deleted' }], rowCount: 1 };
    }
    if (descriptor.intentName === 'verify-delete-token-hash-for-public-id') {
      const [publicId, deleteTokenHash] = descriptor.values;
      return row !== null && row.public_id === publicId && row.delete_token_hash === deleteTokenHash ? { rows: [row], rowCount: 1 } : emptyResult();
    }
    if (descriptor.intentName === 'soft-delete-public-result-by-public-id') {
      const [publicId, deleteTokenHash, deletedAtIso, updatedAtIso] = descriptor.values;
      if (row === null || row.public_id !== publicId || row.delete_token_hash !== deleteTokenHash) return emptyResult();
      row = { ...row, deleted_at: String(deletedAtIso), updated_at: String(updatedAtIso), status: 'deleted' };
      return { rows: [row], rowCount: 1 };
    }
    return emptyResult();
  };
  return { executeQuery, executedQueryIntents: () => [...executed], rows: () => (row === null ? [] : [row]) };
}

function rowFromInsertDescriptor(descriptor: PublicResultDatabaseParameterizedQueryDescriptor): PublicResultDatabaseStorageAdapterRow {
  return {
    schema_version: String(valueByName(descriptor, 'schema_version')),
    public_id: String(valueByName(descriptor, 'public_id')),
    dto: valueByName(descriptor, 'dto'),
    delete_token_hash: String(valueByName(descriptor, 'delete_token_hash')),
    created_at: String(valueByName(descriptor, 'created_at')),
    expires_at: String(valueByName(descriptor, 'expires_at')),
    deleted_at: null,
    status: 'active',
    updated_at: String(valueByName(descriptor, 'updated_at'))
  };
}

function valueByName(descriptor: PublicResultDatabaseParameterizedQueryDescriptor, name: string): unknown {
  const index = descriptor.parameterOrder.indexOf(name);
  if (index < 0) throw new Error(`Missing descriptor parameter: ${name}`);
  return descriptor.values[index];
}

function emptyResult() { return { rows: [], rowCount: 0 } as const; }
function withoutKey<T extends Record<string, string | undefined>>(input: T, key: string): T { const copy = { ...input }; delete copy[key]; return copy; }
