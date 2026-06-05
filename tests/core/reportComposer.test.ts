import { describe, expect, it } from 'vitest';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { AXIS_IDS } from '../../src/core/methodology/axes';
import { buildResult } from '../../src/core/scoring/buildResult';

const FORBIDDEN_REPORT_WORDS = [
  'clinical',
  'diagnostic',
  'diagnosis',
  'disorder',
  'therapy',
  'pathology',
  'scientifically validated'
];

describe('deterministic report composer', () => {
  it.each(GOLDEN_PROFILES)('$id produces a complete composed report', (profile) => {
    const result = buildResult(profile.sequence);
    const report = result.report;

    expect(report.schemaVersion).toBe('phase-1.2-report-v1');
    expect(report.overview.archetypeTitle).toBe(result.archetype.definition.title);
    expect(report.overview.patternSummary.length).toBeGreaterThan(0);
    expect(report.overview.dominantTraits).toHaveLength(3);
    expect(report.axisCards).toHaveLength(AXIS_IDS.length);
    expect(report.strengths.length).toBeGreaterThanOrEqual(3);
    expect(report.failureModes.length).toBeGreaterThanOrEqual(3);
    expect(report.growthDirections.length).toBeGreaterThanOrEqual(2);
    expect(report.disprovenIf.length).toBeGreaterThanOrEqual(2);
    expect(report.evidenceDigest).toHaveLength(20);

    for (const axisId of AXIS_IDS) {
      expect(report.axisCards.map((card) => card.id)).toContain(axisId);
    }
  });

  it('is deterministic for identical input', () => {
    const sequence = GOLDEN_PROFILES[0]!.sequence;

    expect(buildResult(sequence).report).toEqual(buildResult(sequence).report);
  });

  it('links report claims to question-answer evidence references', () => {
    for (const profile of GOLDEN_PROFILES) {
      const report = buildResult(profile.sequence).report;
      const allEvidenceRefs = new Set(report.evidenceDigest.map((item) => item.ref));

      for (const trait of report.overview.dominantTraits) {
        expect(trait.evidenceRefs.length).toBeGreaterThan(0);
        for (const ref of trait.evidenceRefs) {
          expect(ref).toMatch(/^Q\d{1,2}[ABCD]$/);
          expect(allEvidenceRefs.has(ref)).toBe(true);
        }
      }

      for (const axisCard of report.axisCards) {
        expect(axisCard.evidenceRefs.length).toBeGreaterThan(0);
        for (const ref of axisCard.evidenceRefs) {
          expect(ref).toMatch(/^Q\d{1,2}[ABCD]$/);
          expect(allEvidenceRefs.has(ref)).toBe(true);
        }
      }
    }
  });

  it('caps contradiction report cards at four and keeps them evidence-linked', () => {
    for (const profile of GOLDEN_PROFILES) {
      const report = buildResult(profile.sequence).report;
      const allEvidenceRefs = new Set(report.evidenceDigest.map((item) => item.ref));

      expect(report.contradictionMap.length).toBeLessThanOrEqual(4);

      for (const contradiction of report.contradictionMap) {
        expect(contradiction.title.length).toBeGreaterThan(0);
        expect(contradiction.tension.length).toBeGreaterThan(0);
        expect(contradiction.evidenceRefs.length).toBeGreaterThan(0);

        for (const ref of contradiction.evidenceRefs) {
          expect(allEvidenceRefs.has(ref)).toBe(true);
        }
      }
    }
  });

  it('keeps forbidden authority wording out of the composed report', () => {
    for (const profile of GOLDEN_PROFILES) {
      const serializedReport = JSON.stringify(buildResult(profile.sequence).report).toLowerCase();

      for (const forbidden of FORBIDDEN_REPORT_WORDS) {
        expect(serializedReport).not.toContain(forbidden);
      }
    }
  });
});
