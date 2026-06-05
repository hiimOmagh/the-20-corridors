import type { AxisScoreResult } from '../scoring/calculateAxisScores';
import type { ArchetypeResolution } from '../scoring/resolveArchetype';
import type { DetectedContradiction } from '../scoring/detectContradictions';
import type { ConfidenceBand } from '../scoring/calculateConfidence';
import type { Tag } from '../methodology/tags';

export interface ReportSeed {
  readonly archetypeTitle: string;
  readonly patternSummary: string;
  readonly topTraits: readonly Tag[];
  readonly primaryAxis: string;
  readonly mainContradiction: string | null;
  readonly deepMotive: string;
  readonly confidenceBand: ConfidenceBand;
  readonly evidencePointers: readonly string[];
  readonly sectionsRequired: readonly [
    'result_overview',
    'axis_cards',
    'contradiction_map',
    'strengths',
    'failure_modes',
    'disproven_if'
  ];
}

export function buildReportSeed(input: {
  readonly dominantTags: readonly Tag[];
  readonly axisScores: AxisScoreResult;
  readonly archetype: ArchetypeResolution;
  readonly contradictions: readonly DetectedContradiction[];
  readonly confidenceBand: ConfidenceBand;
}): ReportSeed {
  const mainContradiction = input.contradictions[0]?.definition.title ?? null;

  return {
    archetypeTitle: input.archetype.definition.title,
    patternSummary: input.archetype.definition.summary,
    topTraits: input.dominantTags.slice(0, 3),
    primaryAxis: input.axisScores.explorationSafety.dominant,
    mainContradiction,
    deepMotive: input.axisScores.deepMotive.dominant,
    confidenceBand: input.confidenceBand,
    evidencePointers: [
      `archetype_score:${input.archetype.id}:${input.archetype.score}`,
      `runner_up:${input.archetype.runnerUp.id}:${input.archetype.runnerUp.score}`,
      `deep_motive:${input.axisScores.deepMotive.dominant}`,
      `contradiction_count:${input.contradictions.length}`
    ],
    sectionsRequired: [
      'result_overview',
      'axis_cards',
      'contradiction_map',
      'strengths',
      'failure_modes',
      'disproven_if'
    ]
  };
}
