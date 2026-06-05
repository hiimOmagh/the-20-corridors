import type { AxisScoreResult } from './calculateAxisScores';
import { calculateAxisScores } from './calculateAxisScores';
import type { ConfidenceBand } from './calculateConfidence';
import { calculateConfidence } from './calculateConfidence';
import { calculateTagScores, type TagEvidenceItem } from './calculateTagScores';
import type { DetectedContradiction } from './detectContradictions';
import { detectContradictions } from './detectContradictions';
import { normalizeAnswers, type AnswerInput, type AnswerMap } from './scoreAnswers';
import type { ArchetypeResolution } from './resolveArchetype';
import { resolveArchetype } from './resolveArchetype';
import type { Tag, TagScoreMap } from '../methodology/tags';
import { buildReportSeed, type ReportSeed } from '../report/reportContract';
import { composeReport, type ComposedReport } from '../report/composeReport';

export interface ScoringResult {
  readonly answers: AnswerMap;
  readonly tagScores: TagScoreMap;
  readonly dominantTags: readonly Tag[];
  readonly tagEvidence: readonly TagEvidenceItem[];
  readonly axisScores: AxisScoreResult;
  readonly archetype: ArchetypeResolution;
  readonly contradictions: readonly DetectedContradiction[];
  readonly deepMotive: string;
  readonly confidenceBand: ConfidenceBand;
  readonly reportSeed: ReportSeed;
  readonly report: ComposedReport;
}

export function buildResult(input: AnswerInput): ScoringResult {
  const answers = normalizeAnswers(input);
  const { tagScores, evidence } = calculateTagScores(answers);
  const dominantTags = calculateDominantTags(tagScores);
  const axisScores = calculateAxisScores(tagScores, answers);
  const archetype = resolveArchetype(tagScores, answers);
  const contradictions = detectContradictions(tagScores);
  const confidenceBand = calculateConfidence(tagScores, archetype, contradictions);
  const reportSeed = buildReportSeed({
    dominantTags,
    axisScores,
    archetype,
    contradictions,
    confidenceBand
  });
  const report = composeReport({
    answers,
    tagScores,
    dominantTags,
    tagEvidence: evidence,
    axisScores,
    archetype,
    contradictions,
    confidenceBand,
    reportSeed
  });

  return {
    answers,
    tagScores,
    dominantTags,
    tagEvidence: evidence,
    axisScores,
    archetype,
    contradictions,
    deepMotive: axisScores.deepMotive.dominant,
    confidenceBand,
    reportSeed,
    report
  };
}

function calculateDominantTags(tagScores: TagScoreMap): readonly Tag[] {
  return (Object.entries(tagScores) as [Tag, number][])
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([tag]) => tag);
}
