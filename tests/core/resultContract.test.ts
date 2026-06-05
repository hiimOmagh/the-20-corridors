import { describe, expect, it } from 'vitest';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { AXIS_IDS } from '../../src/core/methodology/axes';
import { buildResult } from '../../src/core/scoring/buildResult';

const FORBIDDEN_REPORT_SEED_WORDS = [
  'clinical',
  'diagnostic',
  'diagnosis',
  'disorder',
  'therapy',
  'pathology',
  'scientifically validated'
];

describe('result contract', () => {
  it.each(GOLDEN_PROFILES)('$id returns a complete result object', (profile) => {
    const result = buildResult(profile.sequence);

    expect(result.answers).toBeDefined();
    expect(result.tagScores).toBeDefined();
    expect(result.dominantTags.length).toBeGreaterThan(0);
    expect(result.axisScores).toBeDefined();
    expect(result.archetype.id).toBe(profile.expectedArchetype);
    expect(result.deepMotive.length).toBeGreaterThan(0);
    expect(result.confidenceBand).toMatch(/^(low|moderate|high)$/);
    expect(result.reportSeed.sectionsRequired).toEqual([
      'result_overview',
      'axis_cards',
      'contradiction_map',
      'strengths',
      'failure_modes',
      'disproven_if'
    ]);
    expect(result.report.schemaVersion).toBe('phase-1.2-report-v1');
    expect(result.report.axisCards).toHaveLength(AXIS_IDS.length);
    expect(result.report.evidenceDigest).toHaveLength(20);

    for (const axisId of AXIS_IDS) {
      expect(result.axisScores[axisId]).toBeDefined();
      expect(result.axisScores[axisId].dominant.length).toBeGreaterThan(0);
    }
  });

  it('keeps forbidden authority wording out of reportSeed', () => {
    for (const profile of GOLDEN_PROFILES) {
      const result = buildResult(profile.sequence);
      const serializedReportSeed = JSON.stringify(result.reportSeed).toLowerCase();

      for (const forbidden of FORBIDDEN_REPORT_SEED_WORDS) {
        expect(serializedReportSeed).not.toContain(forbidden);
      }
    }
  });
});
