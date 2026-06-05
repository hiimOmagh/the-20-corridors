import { describe, expect, it } from 'vitest';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { buildResult } from '../../src/core/scoring/buildResult';

describe('golden profile resolution', () => {
  it.each(GOLDEN_PROFILES)('$id resolves to $expectedArchetype', (profile) => {
    const result = buildResult(profile.sequence);

    expect(result.archetype.id).toBe(profile.expectedArchetype);
    expect(result.dominantTags.length).toBeGreaterThanOrEqual(3);

    for (const expectedTag of profile.expectedDominantTags.slice(0, 3)) {
      expect(result.dominantTags).toContain(expectedTag);
    }
  });

  it('does not collapse all profiles into one archetype', () => {
    const resolved = new Set(GOLDEN_PROFILES.map((profile) => buildResult(profile.sequence).archetype.id));

    expect(resolved.size).toBe(8);
  });
});
