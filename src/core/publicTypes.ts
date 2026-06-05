import type { AxisId } from './methodology/axes';
import type { ArchetypeId } from './methodology/archetypes';
import type { ContradictionId } from './methodology/contradictions';
import type { OptionKey } from './methodology/questions';
import type { Tag } from './methodology/tags';
import type { QuestionId } from './methodology/weights';
import type { ConfidenceBand } from './scoring/calculateConfidence';

export const CORRIDORS_ENGINE_API_VERSION = 'phase-1.5-engine-public-v1' as const;

export type CorridorsEngineApiVersion = typeof CORRIDORS_ENGINE_API_VERSION;
export type CorridorsQuestionId = QuestionId;
export type CorridorsOptionKey = OptionKey;
export type CorridorsAnswerMap = Readonly<Record<CorridorsQuestionId, CorridorsOptionKey>>;
export type CorridorsAnswerInput = CorridorsAnswerMap | string;
export type CorridorsConfidenceBand = ConfidenceBand;
export type CorridorsArchetypeId = ArchetypeId;
export type CorridorsContradictionId = ContradictionId;
export type CorridorsTraitCode = Tag;

export interface CorridorsQuestionOptionDto {
  readonly key: CorridorsOptionKey;
  readonly text: string;
}

export interface CorridorsQuestionDto {
  readonly id: CorridorsQuestionId;
  readonly text: string;
  readonly weight: number;
  readonly options: readonly CorridorsQuestionOptionDto[];
}

export interface CorridorsSelectedAnswerDto {
  readonly questionId: CorridorsQuestionId;
  readonly option: CorridorsOptionKey;
  readonly answerText: string;
}

export interface CorridorsArchetypeDto {
  readonly id: CorridorsArchetypeId;
  readonly title: string;
  readonly summary: string;
  readonly strength: string;
  readonly failureMode: string;
  readonly disprovenIf: string;
}

export interface CorridorsRunnerUpDto {
  readonly id: CorridorsArchetypeId;
  readonly title: string;
  readonly gapBand: 'clear' | 'close' | 'tied';
}

export interface CorridorsDominantTraitDto {
  readonly code: CorridorsTraitCode;
  readonly label: string;
  readonly evidenceRefs: readonly string[];
}

export interface CorridorsAxisCardDto {
  readonly id: AxisId;
  readonly label: string;
  readonly band: string;
  readonly dominantKey: string;
  readonly dominantLabel: string;
  readonly interpretation: string;
  readonly evidenceRefs: readonly string[];
}

export interface CorridorsContradictionCardDto {
  readonly id: CorridorsContradictionId;
  readonly title: string;
  readonly explanation: string;
  readonly tension: string;
  readonly behavioralImplication: string;
  readonly disprovenIf: string;
  readonly evidenceRefs: readonly string[];
}

export interface CorridorsEvidenceReferenceDto {
  readonly ref: string;
  readonly questionId: CorridorsQuestionId;
  readonly option: CorridorsOptionKey;
  readonly answerText: string;
}

export interface CorridorsReportBulletDto {
  readonly title: string;
  readonly evidenceRefs: readonly string[];
}

export interface CorridorsPublicReportDto {
  readonly overview: {
    readonly archetypeTitle: string;
    readonly patternSummary: string;
    readonly confidenceBand: CorridorsConfidenceBand;
    readonly confidenceExplanation: string;
    readonly dominantTraits: readonly CorridorsDominantTraitDto[];
    readonly primaryAxis: string;
    readonly mainContradiction: string | null;
    readonly deepMotive: string;
  };
  readonly axisCards: readonly CorridorsAxisCardDto[];
  readonly contradictionMap: readonly CorridorsContradictionCardDto[];
  readonly strengths: readonly CorridorsReportBulletDto[];
  readonly failureModes: readonly CorridorsReportBulletDto[];
  readonly growthDirections: readonly CorridorsReportBulletDto[];
  readonly disprovenIf: readonly string[];
  readonly evidenceDigest: readonly CorridorsEvidenceReferenceDto[];
}

export interface CorridorsPublicResultDto {
  readonly schemaVersion: CorridorsEngineApiVersion;
  readonly apiVersion: CorridorsEngineApiVersion;
  readonly answers: readonly CorridorsSelectedAnswerDto[];
  readonly archetype: CorridorsArchetypeDto;
  readonly runnerUp: CorridorsRunnerUpDto;
  readonly confidenceBand: CorridorsConfidenceBand;
  readonly dominantTraits: readonly CorridorsDominantTraitDto[];
  readonly axes: readonly CorridorsAxisCardDto[];
  readonly contradictions: readonly CorridorsContradictionCardDto[];
  readonly deepMotive: {
    readonly key: string;
    readonly label: string;
    readonly band: string;
    readonly evidenceRefs: readonly string[];
  };
  readonly report: CorridorsPublicReportDto;
}
