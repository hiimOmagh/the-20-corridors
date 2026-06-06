import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core';
import {
  buildPublicResultDto,
  containsForbiddenPublicResultDtoKeys,
  findForbiddenPublicResultDtoKeys,
  listPublicResultDtoKeys,
  PUBLIC_RESULT_DTO_ALLOWED_KEYS,
  PUBLIC_RESULT_DTO_FORBIDDEN_KEYS,
  PUBLIC_RESULT_DTO_SCHEMA_VERSION
} from '../../src/core/public-link/publicResultDto';

const source = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
const dto = buildPublicResultDto(source, {
  resultId: 'pub_20corridors_sample_0001',
  createdAt: '2026-06-05T00:00:00.000Z',
  expiresAt: '2026-07-05T00:00:00.000Z',
  deleteTokenHash: 'delete_token_hash_sample_0001'
});

describe('public result DTO builder', () => {
  it('builds a minimized phase 5.1 public DTO from the public engine result', () => {
    expect(dto.schemaVersion).toBe(PUBLIC_RESULT_DTO_SCHEMA_VERSION);
    expect(dto.resultId).toBe('pub_20corridors_sample_0001');
    expect(dto.archetype.title).toBe(source.archetype.title);
    expect(dto.confidenceBand).toBe(source.confidenceBand);
    expect(dto.axisSummaries).toHaveLength(6);
    expect(dto.shareCard.boundaryText).toContain('Raw choices');
  });

  it('exposes only the approved top-level public fields', () => {
    expect(listPublicResultDtoKeys(dto)).toEqual([...PUBLIC_RESULT_DTO_ALLOWED_KEYS].sort());
    expect(Object.keys(dto)).not.toContain('answers');
    expect(Object.keys(dto)).not.toContain('report');
  });

  it('removes raw answer evidence and private scoring internals', () => {
    expect(containsForbiddenPublicResultDtoKeys(dto)).toBe(false);
    expect(findForbiddenPublicResultDtoKeys(dto)).toEqual([]);
    const serialized = JSON.stringify(dto);
    for (const forbiddenKey of PUBLIC_RESULT_DTO_FORBIDDEN_KEYS) {
      expect(serialized).not.toContain(`"${forbiddenKey}"`);
    }
    expect(serialized).not.toContain('تراقبه أولًا');
    expect(serialized).not.toContain('المخارج والاتجاهات');
  });

  it('rejects unsafe metadata before DTO creation', () => {
    expect(() =>
      buildPublicResultDto(source, {
        resultId: 'short',
        createdAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-07-05T00:00:00.000Z',
        deleteTokenHash: 'delete_token_hash_sample_0001'
      })
    ).toThrow(/anonymous result id/);
  });
});
