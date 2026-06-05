import { AXIS_IDS, type AxisId, type AxisScore } from '../methodology/axes';
import type { Tag, TagScoreMap } from '../methodology/tags';
import type { ContradictionId } from '../methodology/contradictions';
import type { TagEvidenceItem } from '../scoring/calculateTagScores';
import type { AxisScoreResult } from '../scoring/calculateAxisScores';
import type { ArchetypeResolution } from '../scoring/resolveArchetype';
import type { DetectedContradiction } from '../scoring/detectContradictions';
import type { ConfidenceBand } from '../scoring/calculateConfidence';
import { QUESTIONS, type OptionKey } from '../methodology/questions';
import type { AnswerMap } from '../scoring/scoreAnswers';
import type { ReportSeed } from './reportContract';
import {
  ARCHETYPE_REPORT_COPY,
  AXIS_INTERPRETATIONS,
  BAND_LABELS,
  CONFIDENCE_COPY,
  CONTRADICTION_REPORT_COPY,
  labelDominantAxis,
  labelTag
} from './reportCopy';

export interface EvidenceReference {
  readonly ref: string;
  readonly questionId: number;
  readonly option: OptionKey;
  readonly answerText: string;
  readonly tags: readonly Tag[];
  readonly points: number;
}

export interface DominantTraitReport {
  readonly tag: Tag;
  readonly label: string;
  readonly score: number;
  readonly evidenceRefs: readonly string[];
}

export interface AxisReportCard {
  readonly id: AxisId;
  readonly label: string;
  readonly band: string;
  readonly dominantKey: string;
  readonly dominantLabel: string;
  readonly interpretation: string;
  readonly evidenceTags: readonly Tag[];
  readonly evidenceRefs: readonly string[];
  readonly leadingScores: readonly {
    readonly key: string;
    readonly score: number;
  }[];
}

export interface ContradictionReportCard {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly tension: string;
  readonly behavioralImplication: string;
  readonly disprovenIf: string;
  readonly evidenceRefs: readonly string[];
}

export interface ReportBullet {
  readonly title: string;
  readonly evidenceRefs: readonly string[];
}

export interface ComposedReport {
  readonly schemaVersion: 'phase-1.2-report-v1';
  readonly overview: {
    readonly archetypeTitle: string;
    readonly patternSummary: string;
    readonly confidenceBand: ConfidenceBand;
    readonly confidenceExplanation: string;
    readonly dominantTraits: readonly DominantTraitReport[];
    readonly primaryAxis: string;
    readonly mainContradiction: string | null;
    readonly deepMotive: string;
  };
  readonly axisCards: readonly AxisReportCard[];
  readonly contradictionMap: readonly ContradictionReportCard[];
  readonly strengths: readonly ReportBullet[];
  readonly failureModes: readonly ReportBullet[];
  readonly growthDirections: readonly ReportBullet[];
  readonly disprovenIf: readonly string[];
  readonly evidenceDigest: readonly EvidenceReference[];
}

export interface ComposeReportInput {
  readonly answers: AnswerMap;
  readonly tagScores: TagScoreMap;
  readonly dominantTags: readonly Tag[];
  readonly tagEvidence: readonly TagEvidenceItem[];
  readonly axisScores: AxisScoreResult;
  readonly archetype: ArchetypeResolution;
  readonly contradictions: readonly DetectedContradiction[];
  readonly confidenceBand: ConfidenceBand;
  readonly reportSeed: ReportSeed;
}

export function composeReport(input: ComposeReportInput): ComposedReport {
  const evidenceDigest = buildEvidenceDigest(input.answers, input.tagEvidence);
  const archetypeCopy = ARCHETYPE_REPORT_COPY[input.archetype.id];
  const topEvidenceRefs = evidenceDigest.slice(0, 6).map((item) => item.ref);
  const contradictionMap = input.contradictions.slice(0, 4).map((contradiction) => {
    const evidenceRefs = evidenceRefsForTags(tagsForContradiction(contradiction.id), evidenceDigest, 4);

    return {
      id: contradiction.id,
      title: contradiction.definition.title,
      explanation: contradiction.definition.explanation,
      tension: CONTRADICTION_REPORT_COPY[contradiction.id],
      behavioralImplication: contradiction.definition.behavioralImplication,
      disprovenIf: contradiction.definition.disprovenIf,
      evidenceRefs
    } satisfies ContradictionReportCard;
  });

  return {
    schemaVersion: 'phase-1.2-report-v1',
    overview: {
      archetypeTitle: input.reportSeed.archetypeTitle,
      patternSummary: input.reportSeed.patternSummary,
      confidenceBand: input.confidenceBand,
      confidenceExplanation: CONFIDENCE_COPY[input.confidenceBand],
      dominantTraits: input.dominantTags.slice(0, 3).map((tag) => ({
        tag,
        label: labelTag(tag),
        score: input.tagScores[tag],
        evidenceRefs: evidenceRefsForTags([tag], evidenceDigest, 3)
      })),
      primaryAxis: input.reportSeed.primaryAxis,
      mainContradiction: input.reportSeed.mainContradiction,
      deepMotive: input.reportSeed.deepMotive
    },
    axisCards: AXIS_IDS.map((axisId) => buildAxisCard(axisId, input.axisScores[axisId], evidenceDigest)),
    contradictionMap,
    strengths: buildReportBullets(archetypeCopy.strengths, topEvidenceRefs),
    failureModes: buildReportBullets(archetypeCopy.failureModes, topEvidenceRefs),
    growthDirections: buildReportBullets(archetypeCopy.growthDirections, topEvidenceRefs),
    disprovenIf: buildDisprovenIf(input, contradictionMap),
    evidenceDigest
  };
}

function buildAxisCard(axisId: AxisId, axisScore: AxisScore, evidenceDigest: readonly EvidenceReference[]): AxisReportCard {
  return {
    id: axisId,
    label: axisScore.label,
    band: BAND_LABELS[axisScore.band],
    dominantKey: axisScore.dominant,
    dominantLabel: labelDominantAxis(axisId, axisScore.dominant),
    interpretation: AXIS_INTERPRETATIONS[axisId][axisScore.dominant] ?? 'This axis is present, but its interpretation needs more evidence.',
    evidenceTags: axisScore.evidenceTags,
    evidenceRefs: evidenceRefsForTags(axisScore.evidenceTags, evidenceDigest, 4),
    leadingScores: Object.entries(axisScore.rawScores)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3)
      .map(([key, score]) => ({ key, score }))
  };
}

function buildEvidenceDigest(answers: AnswerMap, tagEvidence: readonly TagEvidenceItem[]): readonly EvidenceReference[] {
  const evidenceByQuestion = new Map<number, TagEvidenceItem[]>();

  for (const item of tagEvidence) {
    const existing = evidenceByQuestion.get(item.questionId) ?? [];
    evidenceByQuestion.set(item.questionId, [...existing, item]);
  }

  return Array.from(evidenceByQuestion.entries())
    .map(([questionId, items]) => {
      const question = QUESTIONS.find((candidate) => candidate.id === questionId);

      if (!question) {
        throw new Error(`Missing question definition for evidence digest: ${questionId}`);
      }

      const option = answers[question.id];
      const totalPoints = items.reduce((sum, item) => sum + item.points, 0);

      return {
        ref: `Q${questionId}${option}`,
        questionId,
        option,
        answerText: question.options[option].text,
        tags: items.map((item) => item.tag),
        points: roundForReport(totalPoints)
      } satisfies EvidenceReference;
    })
    .sort((left, right) => right.points - left.points || left.questionId - right.questionId);
}

function evidenceRefsForTags(tags: readonly Tag[], evidenceDigest: readonly EvidenceReference[], limit: number): readonly string[] {
  const tagSet = new Set(tags);
  const refs = evidenceDigest
    .filter((item) => item.tags.some((tag) => tagSet.has(tag)))
    .slice(0, limit)
    .map((item) => item.ref);

  if (refs.length > 0) return refs;

  return evidenceDigest.slice(0, Math.max(1, limit)).map((item) => item.ref);
}

function buildReportBullets(items: readonly string[], evidenceRefs: readonly string[]): readonly ReportBullet[] {
  return items.map((title, index) => ({
    title,
    evidenceRefs: evidenceRefs.slice(index, index + 3).length > 0 ? evidenceRefs.slice(index, index + 3) : evidenceRefs.slice(0, 3)
  }));
}

function buildDisprovenIf(
  input: ComposeReportInput,
  contradictionMap: readonly ContradictionReportCard[]
): readonly string[] {
  const entries = [
    input.archetype.definition.disprovenIf,
    ...contradictionMap.slice(0, 2).map((contradiction) => contradiction.disprovenIf),
    'This reading is weaker if the choices were made for aesthetic preference rather than instinctive self-recognition.',
    'This reading is weaker if the answers describe admired fictional traits rather than likely behavior under pressure.'
  ];

  return Array.from(new Set(entries)).slice(0, 4);
}

function roundForReport(value: number): number {
  return Number(value.toFixed(4));
}


function tagsForContradiction(id: ContradictionId): readonly Tag[] {
  const map: Record<ContradictionId, readonly Tag[]> = {
    controlled_explorer: ['EXP', 'SAF', 'CTRL', 'OBS'],
    solitary_leader: ['LEAD', 'CTRL', 'IND'],
    social_watcher: ['SOC', 'OBS', 'ANA'],
    knowledge_without_action: ['MEAN', 'ANA', 'ACT', 'RISK'],
    power_without_exposure: ['CTRL', 'LEAD', 'REC', 'AVD', 'SAF'],
    calm_avoider: ['CALM', 'AVD', 'ACT'],
    recognition_vs_independence: ['REC', 'IND'],
    responsible_avoider: ['RESP', 'AVD', 'SAF']
  };

  return map[id];
}
