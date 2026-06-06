import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core';
import { buildPublicResultDto } from '../../src/core/public-link/publicResultDto';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../../src/core/public-link/publicResultStorage';
import {
  buildPublicResultApiErrorResponseDto,
  buildPublicResultCreateRequestDto,
  buildPublicResultCreateResponseDto,
  buildPublicResultDeleteRequestDto,
  buildPublicResultDeleteResponseDto,
  buildPublicResultReadResponseDto,
  containsForbiddenPublicResultApiPayloadKeys,
  estimatePublicResultApiPayloadBytes,
  listPublicResultApiPayloadKeys,
  PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS,
  PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
  PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS,
  PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT,
  PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES,
  PUBLIC_RESULT_API_EXPIRY_RULES,
  PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS,
  PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY,
  PUBLIC_RESULT_API_MAX_DTO_BYTES,
  PUBLIC_RESULT_API_SCHEMA_VERSION
} from '../../src/core/public-link/publicResultApi';

const createdAt = '2026-06-06T12:00:00.000Z';
const publicId = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const deleteToken = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';
const sourceResult = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
const expiresAt = buildDefaultPublicResultExpiry(createdAt);
const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
const dto = buildPublicResultDto(sourceResult, { resultId: publicId, createdAt, expiresAt, deleteTokenHash });

describe('public result API boundary DTOs', () => {
  it('defines create/read/delete/error DTO shapes without raw answers', () => {
    const createRequest = buildPublicResultCreateRequestDto(dto, 'client_nonce_demo_12345');
    const createResponse = buildPublicResultCreateResponseDto({ publicId, expiresAt, deleteToken, dto });
    const readResponse = buildPublicResultReadResponseDto({ publicId, status: 'active', expiresAt, dto });
    const deleteRequest = buildPublicResultDeleteRequestDto(publicId, deleteToken);
    const deleteResponse = buildPublicResultDeleteResponseDto(publicId, 'deleted');
    const errorResponse = buildPublicResultApiErrorResponseDto('invalid-request', 'Request body failed validation.');

    expect(listPublicResultApiPayloadKeys(createRequest)).toEqual(['clientNonce', 'dto', 'schemaVersion']);
    expect(listPublicResultApiPayloadKeys(createResponse)).toEqual(['deleteToken', 'dto', 'expiresAt', 'publicId', 'publicPath', 'schemaVersion']);
    expect(listPublicResultApiPayloadKeys(readResponse)).toEqual(['dto', 'expiresAt', 'publicId', 'schemaVersion', 'status']);
    expect(listPublicResultApiPayloadKeys(deleteRequest)).toEqual(['deleteToken', 'publicId', 'schemaVersion']);
    expect(listPublicResultApiPayloadKeys(deleteResponse)).toEqual(['publicId', 'schemaVersion', 'status']);
    expect(listPublicResultApiPayloadKeys(errorResponse)).toEqual(['code', 'message', 'schemaVersion']);
    expect(containsForbiddenPublicResultApiPayloadKeys({ createRequest, createResponse, readResponse, deleteRequest, deleteResponse, errorResponse })).toBe(false);
  });

  it('minimizes non-active read responses and never returns delete token on read', () => {
    const expired = buildPublicResultReadResponseDto({ publicId, status: 'expired', expiresAt, dto });
    const deleted = buildPublicResultReadResponseDto({ publicId, status: 'deleted', expiresAt, dto });
    const missing = buildPublicResultReadResponseDto({ publicId, status: 'not-found', expiresAt: null, dto });

    expect(expired.dto).toBeNull();
    expect(deleted.dto).toBeNull();
    expect(missing.dto).toBeNull();
    expect('deleteToken' in expired).toBe(false);
    expect('deleteToken' in deleted).toBe(false);
    expect('deleteToken' in missing).toBe(false);
  });

  it('locks endpoint, expiry, token, and abuse-control policy constants', () => {
    expect(PUBLIC_RESULT_API_SCHEMA_VERSION).toBe('phase-7.0-backend-api-boundary-v1');
    expect(PUBLIC_RESULT_API_ALLOWED_ENDPOINTS).toEqual([
      'POST /api/public-results',
      'GET /api/public-results/{publicId}',
      'DELETE /api/public-results/{publicId}'
    ]);
    expect(PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT).toBe('response-on-create-request-on-delete-only');
    expect(PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS).toBe(30);
    expect(PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES.length).toBeGreaterThanOrEqual(5);
    expect(PUBLIC_RESULT_API_EXPIRY_RULES.length).toBeGreaterThanOrEqual(5);
    expect(PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS.length).toBeGreaterThanOrEqual(7);
    expect(PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY).toContain('no-api-route-implementation-yet');
  });

  it('keeps sample payload size inside the boundary limit', () => {
    const payload = {
      createRequest: buildPublicResultCreateRequestDto(dto),
      createResponse: buildPublicResultCreateResponseDto({ publicId, expiresAt, deleteToken, dto }),
      readResponse: buildPublicResultReadResponseDto({ publicId, status: 'active', expiresAt, dto })
    };

    expect(estimatePublicResultApiPayloadBytes(payload)).toBeLessThanOrEqual(PUBLIC_RESULT_API_MAX_DTO_BYTES);
    expect(PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS).toContain('rawAnswers');
    expect(containsForbiddenPublicResultApiPayloadKeys({ rawAnswers: [] })).toBe(true);
  });
});
