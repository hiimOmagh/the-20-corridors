import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import {
  handlePublicResultCreateDryRun,
  handlePublicResultDeleteDryRun,
  handlePublicResultReadDryRun,
  summarizePublicResultHandlerDryRunBoundaries,
  PUBLIC_RESULT_HANDLER_DRY_RUN_MODE,
  PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION
} from '../../src/core/public-link/publicResultHandlerDryRun';
import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto } from '../../src/core/public-link/publicResultApi';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { createInMemoryPublicResultStorageAdapter } from '../../src/core/public-link/inMemoryPublicResultStorage';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const CREATED_AT = '2026-06-06T12:00:00.000Z';
const PUBLIC_ID = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const DELETE_TOKEN = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';
const WRONG_DELETE_TOKEN = 'delete_WRONGTOKEN_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';

function buildCreateFixture() {
  const expiresAt = buildDefaultPublicResultExpiry(CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
    resultId: PUBLIC_ID,
    createdAt: CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
  return { dto, request: buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_7_2') };
}

describe('public result handler dry-run adapter', () => {
  it('simulates POST/GET/DELETE behavior against the in-memory adapter without route files', async () => {
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => CREATED_AT });
    const { request } = buildCreateFixture();

    const create = await handlePublicResultCreateDryRun({ adapter, nowIso: CREATED_AT, request, deleteToken: DELETE_TOKEN });
    const read = await handlePublicResultReadDryRun({ adapter, nowIso: CREATED_AT, publicId: PUBLIC_ID });
    const wrongDelete = await handlePublicResultDeleteDryRun({
      adapter,
      nowIso: CREATED_AT,
      request: buildPublicResultDeleteRequestDto(PUBLIC_ID, WRONG_DELETE_TOKEN)
    });
    const deleteResult = await handlePublicResultDeleteDryRun({
      adapter,
      nowIso: CREATED_AT,
      request: buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN)
    });
    const readAfterDelete = await handlePublicResultReadDryRun({ adapter, nowIso: CREATED_AT, publicId: PUBLIC_ID });

    expect(create.ok).toBe(true);
    expect(read.ok).toBe(true);
    expect(wrongDelete.ok).toBe(true);
    expect(deleteResult.ok).toBe(true);
    expect(readAfterDelete.ok).toBe(true);

    if (!create.ok || !read.ok || !wrongDelete.ok || !deleteResult.ok || !readAfterDelete.ok) return;

    expect(create.response.publicPath).toBe(`/r/${PUBLIC_ID}`);
    expect(create.response.deleteToken).toBe(DELETE_TOKEN);
    expect(read.response.status).toBe('active');
    expect(read.response.dto?.resultId).toBe(PUBLIC_ID);
    expect(wrongDelete.response.status).toBe('invalid-delete-token');
    expect(deleteResult.response.status).toBe('deleted');
    expect(readAfterDelete.response.status).toBe('deleted');
    expect(readAfterDelete.response.dto).toBeNull();
  });

  it('hides DTOs for expired read responses', async () => {
    const { request } = buildCreateFixture();
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-07-07T12:00:00.000Z' });

    const create = await handlePublicResultCreateDryRun({ adapter, nowIso: CREATED_AT, request, deleteToken: DELETE_TOKEN });
    expect(create.ok).toBe(true);

    const expiredRead = await handlePublicResultReadDryRun({
      adapter,
      nowIso: '2026-07-07T12:00:00.000Z',
      publicId: PUBLIC_ID
    });

    expect(expiredRead.ok).toBe(true);
    if (!expiredRead.ok) return;
    expect(expiredRead.response.status).toBe('expired');
    expect(expiredRead.response.dto).toBeNull();
  });

  it('rejects invalid create/delete inputs with API error DTOs', async () => {
    const { request } = buildCreateFixture();
    const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => CREATED_AT });

    const invalidCreate = await handlePublicResultCreateDryRun({
      adapter,
      nowIso: CREATED_AT,
      request,
      deleteToken: 'short'
    });
    const invalidRead = await handlePublicResultReadDryRun({ adapter, nowIso: CREATED_AT, publicId: '12345' });
    const invalidDelete = await handlePublicResultDeleteDryRun({
      adapter,
      nowIso: CREATED_AT,
      request: buildPublicResultDeleteRequestDto('12345', DELETE_TOKEN)
    });

    expect(invalidCreate.ok).toBe(false);
    expect(invalidRead.ok).toBe(false);
    expect(invalidDelete.ok).toBe(false);
    if (invalidCreate.ok || invalidRead.ok || invalidDelete.ok) return;
    expect(invalidCreate.response.code).toBe('invalid-delete-token');
    expect(invalidRead.response.code).toBe('invalid-public-id');
    expect(invalidDelete.response.code).toBe('invalid-public-id');
  });

  it('documents the handler-only no-route boundary', () => {
    expect(PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION).toBe('phase-7.2-backend-handler-dry-run-v1');
    expect(PUBLIC_RESULT_HANDLER_DRY_RUN_MODE).toBe('handler-logic-only-no-next-route-files');
    expect(summarizePublicResultHandlerDryRunBoundaries()).toEqual(
      expect.arrayContaining([
        'handler-logic-functions-only',
        'no-src-app-api-route-files-created',
        'no-next-response-dependency',
        'minimized-public-result-dto-only'
      ])
    );
  });
});
