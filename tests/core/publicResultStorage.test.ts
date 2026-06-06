import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import { buildPublicResultDto, type PublicResultDtoMetadata } from '../../src/core/public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultStorageRecord,
  containsForbiddenPublicResultStorageKeys,
  findForbiddenPublicResultStorageKeys,
  isSafeAnonymousPublicResultId,
  isSafeDeleteToken,
  isSafeDeleteTokenHash,
  listPublicResultStorageRecordKeys,
  PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
  PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS,
  PUBLIC_RESULT_STORAGE_SCHEMA_VERSION
} from '../../src/core/public-link/publicResultStorage';

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

function buildSampleDto() {
  const createdAt = '2026-06-06T00:00:00.000Z';
  const metadata: PublicResultDtoMetadata = {
    resultId: 'pub_7Kf9sQ2mN8xR4vB6tY3cH1pZ',
    createdAt,
    expiresAt: buildDefaultPublicResultExpiry(createdAt),
    deleteTokenHash: 'del_7Kf9sQ2mN8xR4vB6tY3cH1pZ_hash'
  };
  return { metadata, dto: buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata) };
}

describe('public result storage contract helpers', () => {
  it('builds a minimized DTO-only storage record', () => {
    const { metadata, dto } = buildSampleDto();
    const record = buildPublicResultStorageRecord({
      publicId: metadata.resultId,
      dto,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      deleteTokenHash: metadata.deleteTokenHash
    });

    expect(record.schemaVersion).toBe(PUBLIC_RESULT_STORAGE_SCHEMA_VERSION);
    expect(record.status).toBe('active');
    expect(listPublicResultStorageRecordKeys(record)).toEqual([...PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS].sort());
    expect(containsForbiddenPublicResultStorageKeys(record)).toBe(false);
  });

  it('enforces anonymous non-sequential public id and delete token constraints', () => {
    expect(isSafeAnonymousPublicResultId('pub_7Kf9sQ2mN8xR4vB6tY3cH1pZ')).toBe(true);
    expect(isSafeAnonymousPublicResultId('123456789012345678901234')).toBe(false);
    expect(isSafeAnonymousPublicResultId('short')).toBe(false);
    expect(isSafeDeleteToken('tok_7Kf9sQ2mN8xR4vB6tY3cH1pZ_secret')).toBe(true);
    expect(isSafeDeleteTokenHash('del_7Kf9sQ2mN8xR4vB6tY3cH1pZ_hash')).toBe(true);
  });

  it('uses the locked default expiry window', () => {
    const createdAt = '2026-06-06T00:00:00.000Z';
    const expiresAt = buildDefaultPublicResultExpiry(createdAt);
    const deltaDays = (new Date(expiresAt).getTime() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);

    expect(PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS).toBe(30);
    expect(deltaDays).toBe(30);
  });

  it('detects forbidden private fields recursively', () => {
    const forbidden = { report: { ['tag' + 'Scores']: { ANA: 12 } } };
    expect(findForbiddenPublicResultStorageKeys(forbidden)).toEqual(['tagScores']);
  });
});
