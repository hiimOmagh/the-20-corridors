import { describe, expect, it } from 'vitest';
import { runMethodologyAudit } from '../../src/core/audit/methodologyAudit';
import { ARCHETYPE_IDS } from '../../src/core/methodology/archetypes';
import { CONTRADICTION_IDS } from '../../src/core/methodology/contradictions';

const audit = runMethodologyAudit();

describe('methodology audit', () => {
  it('passes all locked gates', () => {
    expect(audit.gates).toMatchObject({
      allQuestionsPresent: true,
      allOptionsTagged: true,
      allTagsKnown: true,
      allGoldenProfilesPassed: true,
      allReportsPassedQuality: true,
      contradictionCoverageAtLeastSix: true,
      allArchetypesReachableByGoldenProfiles: true,
      noEmptyResults: true,
      overallPassed: true
    });
    expect(audit.issues).toEqual([]);
  });

  it('keeps all eight archetypes reachable through golden profiles', () => {
    expect(audit.coverage.goldenArchetypes).toEqual(ARCHETYPE_IDS);
    expect(audit.coverage.missingGoldenArchetypes).toEqual([]);
  });

  it('covers at least six contradiction rules across audit profiles', () => {
    expect(audit.coverage.triggeredContradictions.length).toBeGreaterThanOrEqual(6);
    for (const id of audit.coverage.triggeredContradictions) {
      expect(CONTRADICTION_IDS).toContain(id);
    }
  });

  it('creates stable deterministic audit output for identical inputs', () => {
    expect(runMethodologyAudit()).toEqual(runMethodologyAudit());
  });

  it('records compact profile snapshots for every golden and edge-case fixture', () => {
    expect(audit.profiles.golden).toHaveLength(8);
    expect(audit.profiles.edgeCases).toHaveLength(8);

    for (const profile of [...audit.profiles.golden, ...audit.profiles.edgeCases]) {
      expect(profile.dominantTags.length).toBeGreaterThan(0);
      expect(Object.keys(profile.axisDominants)).toHaveLength(6);
      expect(profile.reportSchemaVersion).toBe('phase-1.2-report-v1');
      expect(profile.qualityPassed).toBe(true);
    }
  });
});
