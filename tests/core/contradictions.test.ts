import { describe, expect, it } from 'vitest';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { buildResult } from '../../src/core/scoring/buildResult';

describe('contradiction detection', () => {
  it.each(GOLDEN_PROFILES.filter((profile) => profile.expectedContradictions.length > 0))(
    '$id includes expected contradiction evidence',
    (profile) => {
      const result = buildResult(profile.sequence);
      const ids = result.contradictions.map((contradiction) => contradiction.id);

      for (const expected of profile.expectedContradictions) {
        expect(ids).toContain(expected);
      }
    }
  );

  it('triggers at least six contradiction rules across golden profiles', () => {
    const triggered = new Set(
      GOLDEN_PROFILES.flatMap((profile) => buildResult(profile.sequence).contradictions.map((contradiction) => contradiction.id))
    );

    expect(triggered.size).toBeGreaterThanOrEqual(6);
  });

  it('caps displayed contradictions at four per result', () => {
    for (const profile of GOLDEN_PROFILES) {
      const result = buildResult(profile.sequence);
      expect(result.contradictions.length).toBeLessThanOrEqual(4);
    }
  });
});
