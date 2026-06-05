import { describe, expect, it } from 'vitest';
import { EDGE_CASE_PROFILES } from '../../src/core/methodology/edgeCaseProfiles';
import { buildResult } from '../../src/core/scoring/buildResult';
import { evaluateReportQuality } from '../../src/core/report/qualityGuards';

const ARCHETYPE_COLLISION_MAX_MARGIN = 5;

describe('edge-case fixture pack', () => {
  it.each(EDGE_CASE_PROFILES)('$id builds a complete deterministic result', (profile) => {
    const first = buildResult(profile.sequence);
    const second = buildResult(profile.sequence);

    expect(first).toEqual(second);
    expect(first.archetype.id.length).toBeGreaterThan(0);
    expect(first.dominantTags.length).toBeGreaterThanOrEqual(3);
    expect(first.report.evidenceDigest).toHaveLength(20);
    expect(first.report.axisCards).toHaveLength(6);
  });

  it('keeps repeated-letter profiles answer-specific instead of enforcing global letter meaning', () => {
    const repeatedLetterProfiles = EDGE_CASE_PROFILES.filter((profile) => profile.id.match(/^EC[2-5]$/));
    const resolvedArchetypes = new Set(repeatedLetterProfiles.map((profile) => buildResult(profile.sequence).archetype.id));
    const dominantTagSignatures = new Set(
      repeatedLetterProfiles.map((profile) => buildResult(profile.sequence).dominantTags.slice(0, 3).join('|'))
    );

    expect(resolvedArchetypes.size).toBeGreaterThanOrEqual(3);
    expect(dominantTagSignatures.size).toBeGreaterThanOrEqual(3);
  });

  it('does not let Q20 power override a behaviorally low-exposure pattern by itself', () => {
    const motiveSplit = EDGE_CASE_PROFILES.find((profile) => profile.id === 'EC6');

    expect(motiveSplit).toBeDefined();

    const result = buildResult(motiveSplit!.sequence);

    expect(['security', 'power']).toContain(result.deepMotive);
    expect(result.archetype.id).not.toBe('direct_initiator');
    expect(result.archetype.id).not.toBe('power_analyst');
    expect(result.tagScores.SAF + result.tagScores.AVD + result.tagScores.WAIT).toBeGreaterThan(result.tagScores.RISK + result.tagScores.ACT);
  });

  it('marks broad mixed profiles as low or moderate confidence when evidence is spread out', () => {
    const broadMixed = EDGE_CASE_PROFILES.find((profile) => profile.id === 'EC7');

    expect(broadMixed).toBeDefined();

    const result = buildResult(broadMixed!.sequence);

    expect(['low', 'moderate']).toContain(result.confidenceBand);
  });

  it('keeps close archetype collisions deterministic and visible in score margins', () => {
    const collision = EDGE_CASE_PROFILES.find((profile) => profile.id === 'EC8');

    expect(collision).toBeDefined();

    const result = buildResult(collision!.sequence);
    const margin = result.archetype.score - result.archetype.runnerUp.score;

    expect(margin).toBeGreaterThanOrEqual(0);
    expect(margin).toBeLessThanOrEqual(ARCHETYPE_COLLISION_MAX_MARGIN);
    expect(buildResult(collision!.sequence).archetype.id).toBe(result.archetype.id);
  });
});
