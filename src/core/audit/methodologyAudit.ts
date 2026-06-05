import { ARCHETYPE_IDS, type ArchetypeId } from '../methodology/archetypes';
import { AXIS_IDS, type AxisId } from '../methodology/axes';
import { CONTRADICTION_IDS, type ContradictionId } from '../methodology/contradictions';
import { EDGE_CASE_PROFILES, type EdgeCaseProfile } from '../methodology/edgeCaseProfiles';
import { GOLDEN_PROFILES, type GoldenProfile } from '../methodology/goldenProfiles';
import { OPTION_KEYS, QUESTIONS } from '../methodology/questions';
import { TAGS, isTag } from '../methodology/tags';
import { buildResult, type ScoringResult } from '../scoring/buildResult';
import { evaluateReportQuality } from '../report/qualityGuards';

export interface MethodologyAuditProfileResult {
  readonly id: string;
  readonly name: string;
  readonly group: 'golden' | 'edge';
  readonly sequence: string;
  readonly archetype: ArchetypeId;
  readonly expectedArchetype?: ArchetypeId;
  readonly archetypePassed?: boolean;
  readonly dominantTags: readonly string[];
  readonly deepMotive: string;
  readonly confidenceBand: string;
  readonly contradictions: readonly ContradictionId[];
  readonly expectedContradictions?: readonly ContradictionId[];
  readonly expectedContradictionsCovered?: boolean;
  readonly axisDominants: Record<AxisId, string>;
  readonly qualityPassed: boolean;
  readonly qualityErrorCount: number;
  readonly qualityWarningCount: number;
  readonly reportSchemaVersion: string;
}

export interface MethodologyAuditReport {
  readonly schemaVersion: 'phase-1.4-methodology-audit-v1';
  readonly auditId: 'methodology-lock-phase-1.4';
  readonly metadata: {
    readonly questionCount: number;
    readonly optionCount: number;
    readonly tagCount: number;
    readonly archetypeCount: number;
    readonly contradictionRuleCount: number;
    readonly goldenProfileCount: number;
    readonly edgeCaseProfileCount: number;
  };
  readonly gates: {
    readonly allQuestionsPresent: boolean;
    readonly allOptionsTagged: boolean;
    readonly allTagsKnown: boolean;
    readonly allGoldenProfilesPassed: boolean;
    readonly allReportsPassedQuality: boolean;
    readonly contradictionCoverageAtLeastSix: boolean;
    readonly allArchetypesReachableByGoldenProfiles: boolean;
    readonly noEmptyResults: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly goldenArchetypes: readonly ArchetypeId[];
    readonly allProfileArchetypes: readonly ArchetypeId[];
    readonly missingGoldenArchetypes: readonly ArchetypeId[];
    readonly triggeredContradictions: readonly ContradictionId[];
    readonly missingContradictions: readonly ContradictionId[];
    readonly goldenArchetypeDistribution: Record<ArchetypeId, number>;
    readonly allProfileArchetypeDistribution: Record<ArchetypeId, number>;
    readonly confidenceDistribution: Record<string, number>;
  };
  readonly profiles: {
    readonly golden: readonly MethodologyAuditProfileResult[];
    readonly edgeCases: readonly MethodologyAuditProfileResult[];
  };
  readonly issues: readonly string[];
}

export function runMethodologyAudit(): MethodologyAuditReport {
  const golden = GOLDEN_PROFILES.map(auditGoldenProfile);
  const edgeCases = EDGE_CASE_PROFILES.map(auditEdgeCaseProfile);
  const allProfiles = [...golden, ...edgeCases];

  const methodologyIssues = auditQuestionMethodology();
  const goldenArchetypes = uniqueSorted(golden.map((profile) => profile.archetype), ARCHETYPE_IDS);
  const allProfileArchetypes = uniqueSorted(allProfiles.map((profile) => profile.archetype), ARCHETYPE_IDS);
  const missingGoldenArchetypes = ARCHETYPE_IDS.filter((id) => !goldenArchetypes.includes(id));
  const triggeredContradictions = uniqueSorted(
    allProfiles.flatMap((profile) => profile.contradictions),
    CONTRADICTION_IDS
  );
  const missingContradictions = CONTRADICTION_IDS.filter((id) => !triggeredContradictions.includes(id));

  const allGoldenProfilesPassed = golden.every(
    (profile) => profile.archetypePassed === true && profile.expectedContradictionsCovered === true
  );
  const allReportsPassedQuality = allProfiles.every((profile) => profile.qualityPassed);
  const noEmptyResults = allProfiles.every(
    (profile) => profile.archetype && profile.dominantTags.length > 0 && Object.keys(profile.axisDominants).length === AXIS_IDS.length
  );
  const contradictionCoverageAtLeastSix = triggeredContradictions.length >= 6;
  const allArchetypesReachableByGoldenProfiles = missingGoldenArchetypes.length === 0;
  const allQuestionsPresent = QUESTIONS.length === 20;
  const allOptionsTagged = methodologyIssues.every((issue) => !issue.startsWith('missing_tags'));
  const allTagsKnown = methodologyIssues.every((issue) => !issue.startsWith('unknown_tag'));

  const issues = [
    ...methodologyIssues,
    ...golden
      .filter((profile) => profile.archetypePassed === false)
      .map((profile) => `golden_archetype_mismatch:${profile.id}:${profile.expectedArchetype}->${profile.archetype}`),
    ...golden
      .filter((profile) => profile.expectedContradictionsCovered === false)
      .map((profile) => `golden_contradiction_missing:${profile.id}`),
    ...allProfiles
      .filter((profile) => !profile.qualityPassed)
      .map((profile) => `report_quality_failed:${profile.id}:errors=${profile.qualityErrorCount}`),
    ...missingGoldenArchetypes.map((id) => `missing_golden_archetype:${id}`),
    ...(contradictionCoverageAtLeastSix ? [] : [`insufficient_contradiction_coverage:${triggeredContradictions.length}`])
  ];

  const gates = {
    allQuestionsPresent,
    allOptionsTagged,
    allTagsKnown,
    allGoldenProfilesPassed,
    allReportsPassedQuality,
    contradictionCoverageAtLeastSix,
    allArchetypesReachableByGoldenProfiles,
    noEmptyResults,
    overallPassed:
      allQuestionsPresent &&
      allOptionsTagged &&
      allTagsKnown &&
      allGoldenProfilesPassed &&
      allReportsPassedQuality &&
      contradictionCoverageAtLeastSix &&
      allArchetypesReachableByGoldenProfiles &&
      noEmptyResults
  };

  return {
    schemaVersion: 'phase-1.4-methodology-audit-v1',
    auditId: 'methodology-lock-phase-1.4',
    metadata: {
      questionCount: QUESTIONS.length,
      optionCount: QUESTIONS.length * OPTION_KEYS.length,
      tagCount: TAGS.length,
      archetypeCount: ARCHETYPE_IDS.length,
      contradictionRuleCount: CONTRADICTION_IDS.length,
      goldenProfileCount: GOLDEN_PROFILES.length,
      edgeCaseProfileCount: EDGE_CASE_PROFILES.length
    },
    gates,
    coverage: {
      goldenArchetypes,
      allProfileArchetypes,
      missingGoldenArchetypes,
      triggeredContradictions,
      missingContradictions,
      goldenArchetypeDistribution: countByArchetype(golden),
      allProfileArchetypeDistribution: countByArchetype(allProfiles),
      confidenceDistribution: countByString(allProfiles.map((profile) => profile.confidenceBand))
    },
    profiles: {
      golden,
      edgeCases
    },
    issues
  };
}

function auditGoldenProfile(profile: GoldenProfile): MethodologyAuditProfileResult {
  const result = buildResult(profile.sequence);
  const base = summarizeProfile('golden', profile.id, profile.name, profile.sequence, result);
  const contradictions = result.contradictions.map((contradiction) => contradiction.id);

  return {
    ...base,
    expectedArchetype: profile.expectedArchetype,
    archetypePassed: result.archetype.id === profile.expectedArchetype,
    expectedContradictions: profile.expectedContradictions,
    expectedContradictionsCovered: profile.expectedContradictions.every((id) => contradictions.includes(id))
  };
}

function auditEdgeCaseProfile(profile: EdgeCaseProfile): MethodologyAuditProfileResult {
  return summarizeProfile('edge', profile.id, profile.name, String(profile.sequence), buildResult(profile.sequence));
}

function summarizeProfile(
  group: 'golden' | 'edge',
  id: string,
  name: string,
  sequence: string,
  result: ScoringResult
): MethodologyAuditProfileResult {
  const quality = evaluateReportQuality(result);

  return {
    id,
    name,
    group,
    sequence,
    archetype: result.archetype.id,
    dominantTags: result.dominantTags,
    deepMotive: result.deepMotive,
    confidenceBand: result.confidenceBand,
    contradictions: result.contradictions.map((contradiction) => contradiction.id),
    axisDominants: Object.fromEntries(
      AXIS_IDS.map((axisId) => [axisId, result.axisScores[axisId].dominant])
    ) as Record<AxisId, string>,
    qualityPassed: quality.passed,
    qualityErrorCount: quality.errorCount,
    qualityWarningCount: quality.warningCount,
    reportSchemaVersion: result.report.schemaVersion
  };
}

function auditQuestionMethodology(): readonly string[] {
  const issues: string[] = [];
  const questionIds = new Set<number>();

  for (const question of QUESTIONS) {
    questionIds.add(question.id);

    for (const option of OPTION_KEYS) {
      const definition = question.options[option];
      if (!definition.tags || definition.tags.length === 0) {
        issues.push(`missing_tags:Q${question.id}${option}`);
        continue;
      }

      for (const tag of definition.tags) {
        if (!isTag(tag)) {
          issues.push(`unknown_tag:Q${question.id}${option}:${tag}`);
        }
      }
    }
  }

  for (let questionId = 1; questionId <= 20; questionId += 1) {
    if (!questionIds.has(questionId)) {
      issues.push(`missing_question:${questionId}`);
    }
  }

  return issues.sort();
}

function countByArchetype(profiles: readonly MethodologyAuditProfileResult[]): Record<ArchetypeId, number> {
  const counts = Object.fromEntries(ARCHETYPE_IDS.map((id) => [id, 0])) as Record<ArchetypeId, number>;
  for (const profile of profiles) {
    counts[profile.archetype] += 1;
  }
  return counts;
}

function countByString(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function uniqueSorted<T extends string>(values: readonly T[], order: readonly T[]): readonly T[] {
  const set = new Set(values);
  return order.filter((item) => set.has(item));
}
