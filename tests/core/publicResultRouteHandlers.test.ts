import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto } from '../../src/core/public-link/publicResultApi';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { createInMemoryPublicResultStorageAdapter } from '../../src/core/public-link/inMemoryPublicResultStorage';
import {
  PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
  PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION,
  handlePublicResultCreateRouteBody,
  handlePublicResultDeleteRouteBody,
  handlePublicResultReadRoute,
  summarizePublicResultRouteHandlerBoundaries
} from '../../src/core/public-link/publicResultRouteHandlers';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const CREATED_AT = '2026-06-06T12:00:00.000Z';
const PUBLIC_ID = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const DELETE_TOKEN = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';
const WRONG_DELETE_TOKEN = 'delete_WRONGTOKEN_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';

function buildCreateRouteBody() {
  const expiresAt = buildDefaultPublicResultExpiry(CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
    resultId: PUBLIC_ID,
    createdAt: CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
  return { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_7_3'), deleteToken: DELETE_TOKEN };
}

describe('public result route handlers', () => {
  it('maps create/read/delete dry-run flow to HTTP-like route responses', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => CREATED_AT });
    const create = await handlePublicResultCreateRouteBody(buildCreateRouteBody(), { adapter, nowIso: CREATED_AT });
    const read = await handlePublicResultReadRoute(PUBLIC_ID, { adapter, nowIso: CREATED_AT });
    const wrongDelete = await handlePublicResultDeleteRouteBody(
      PUBLIC_ID,
      buildPublicResultDeleteRequestDto(PUBLIC_ID, WRONG_DELETE_TOKEN),
      { adapter, nowIso: CREATED_AT }
    );
    const deleteResult = await handlePublicResultDeleteRouteBody(
      PUBLIC_ID,
      buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN),
      { adapter, nowIso: CREATED_AT }
    );
    const readAfterDelete = await handlePublicResultReadRoute(PUBLIC_ID, { adapter, nowIso: CREATED_AT });

    expect(create.status).toBe(201);
    expect(read.status).toBe(200);
    expect(wrongDelete.status).toBe(403);
    expect(deleteResult.status).toBe(200);
    expect(readAfterDelete.status).toBe(410);
    expect(create.headers['Cache-Control']).toBe('no-store');
    expect(readAfterDelete.body).toMatchObject({ status: 'deleted', dto: null });
  });

  it('rejects invalid JSON-like bodies with DTO-safe error responses', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => CREATED_AT });
    const invalidCreate = await handlePublicResultCreateRouteBody(null, { adapter, nowIso: CREATED_AT });
    const invalidDelete = await handlePublicResultDeleteRouteBody(PUBLIC_ID, { schemaVersion: 'bad' }, { adapter, nowIso: CREATED_AT });

    expect(invalidCreate.status).toBe(400);
    expect(invalidCreate.body).toMatchObject({ code: 'invalid-request' });
    expect(invalidDelete.status).toBe(400);
    expect(invalidDelete.body).toMatchObject({ code: 'invalid-request' });
  });

  it('documents the Phase 7.3 route-handler boundary', () => {
    expect(PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION).toBe('phase-7.3-backend-route-handlers-v1');
    expect(PUBLIC_RESULT_ROUTE_HANDLERS_MODE).toBe('next-route-files-dry-run-in-memory-only');
    expect(summarizePublicResultRouteHandlerBoundaries()).toEqual(
      expect.arrayContaining([
        'actual-next-route-files-created-in-phase-7-3',
        'dry-run-handler-functions-only',
        'in-memory-adapter-only',
        'public-result-api-dto-only'
      ])
    );
  });
});
