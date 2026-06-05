import { describe, expect, it } from 'vitest';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { EDGE_CASE_PROFILES } from '../../src/core/methodology/edgeCaseProfiles';
import { buildResult } from '../../src/core/scoring/buildResult';
import { evaluateReportQuality } from '../../src/core/report/qualityGuards';

const ALL_PROFILE_SEQUENCES = [...GOLDEN_PROFILES, ...EDGE_CASE_PROFILES];

describe('report quality guards', () => {
  it.each(ALL_PROFILE_SEQUENCES)('$id passes the report quality gate', (profile) => {
    const result = buildResult(profile.sequence);
    const quality = evaluateReportQuality(result);

    expect(quality.issues).toEqual([]);
    expect(quality.errorCount).toBe(0);
    expect(quality.passed).toBe(true);
  });

  it('detects forbidden generic flattery phrases when report copy is corrupted', () => {
    const result = buildResult(GOLDEN_PROFILES[0]!.sequence);
    const corrupted = {
      ...result,
      report: {
        ...result.report,
        overview: {
          ...result.report.overview,
          patternSummary: 'You are special and different from everyone.'
        }
      }
    };

    const quality = evaluateReportQuality(corrupted);

    expect(quality.passed).toBe(false);
    expect(quality.issues.map((issue) => issue.code)).toContain('generic_flattery_phrase');
  });

  it('detects broken evidence references when report evidence is corrupted', () => {
    const result = buildResult(GOLDEN_PROFILES[0]!.sequence);
    const corrupted = {
      ...result,
      report: {
        ...result.report,
        overview: {
          ...result.report.overview,
          dominantTraits: [
            {
              ...result.report.overview.dominantTraits[0]!,
              evidenceRefs: ['Q999Z']
            },
            ...result.report.overview.dominantTraits.slice(1)
          ]
        }
      }
    };

    const quality = evaluateReportQuality(corrupted);

    expect(quality.passed).toBe(false);
    expect(quality.issues.map((issue) => issue.code)).toContain('invalid_evidence_ref_format');
    expect(quality.issues.map((issue) => issue.code)).toContain('unknown_evidence_ref');
  });
});
