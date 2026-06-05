import { AXIS_IDS } from './methodology/axes';
import { ARCHETYPES } from './methodology/archetypes';
import type { ContradictionId } from './methodology/contradictions';
import { OPTION_KEYS, QUESTIONS } from './methodology/questions';
import type { QuestionId } from './methodology/weights';
import { buildResult } from './scoring/buildResult';
import { normalizeAnswers, parseAnswerSequence } from './scoring/scoreAnswers';
import { labelDominantAxis } from './report/reportCopy';
import {
  CORRIDORS_ENGINE_API_VERSION,
  type CorridorsAnswerInput,
  type CorridorsAnswerMap,
  type CorridorsAxisCardDto,
  type CorridorsContradictionCardDto,
  type CorridorsDominantTraitDto,
  type CorridorsEvidenceReferenceDto,
  type CorridorsPublicReportDto,
  type CorridorsPublicResultDto,
  type CorridorsQuestionDto,
  type CorridorsQuestionOptionDto,
  type CorridorsReportBulletDto,
  type CorridorsRunnerUpDto,
  type CorridorsSelectedAnswerDto
} from './publicTypes';

export { CORRIDORS_ENGINE_API_VERSION };

export function getCorridorQuestions(): readonly CorridorsQuestionDto[] {
  return QUESTIONS.map((question) => ({
    id: question.id,
    text: question.text,
    weight: question.weight,
    options: OPTION_KEYS.map(
      (optionKey): CorridorsQuestionOptionDto => ({
        key: optionKey,
        text: question.options[optionKey].text
      })
    )
  }));
}

export function parseCorridorAnswerSequence(sequence: string): CorridorsAnswerMap {
  return parseAnswerSequence(sequence);
}

export function normalizeCorridorAnswers(input: CorridorsAnswerInput): CorridorsAnswerMap {
  return normalizeAnswers(input);
}

export function runCorridorsEngine(input: CorridorsAnswerInput): CorridorsPublicResultDto {
  const result = buildResult(input);
  const answers = buildSelectedAnswers(result.answers);
  const report = buildPublicReport(result);
  const deepMotiveCard = result.report.axisCards.find((card) => card.id === 'deepMotive');

  if (!deepMotiveCard) {
    throw new Error('Public API result cannot be built without a deep motive axis card.');
  }

  return {
    schemaVersion: CORRIDORS_ENGINE_API_VERSION,
    apiVersion: CORRIDORS_ENGINE_API_VERSION,
    answers,
    archetype: {
      id: result.archetype.id,
      title: result.archetype.definition.title,
      summary: result.archetype.definition.summary,
      strength: result.archetype.definition.strength,
      failureMode: result.archetype.definition.failureMode,
      disprovenIf: result.archetype.definition.disprovenIf
    },
    runnerUp: buildRunnerUp(result.archetype.score, result.archetype.runnerUp),
    confidenceBand: result.confidenceBand,
    dominantTraits: report.overview.dominantTraits,
    axes: report.axisCards,
    contradictions: report.contradictionMap,
    deepMotive: {
      key: result.axisScores.deepMotive.dominant,
      label: labelDominantAxis('deepMotive', result.axisScores.deepMotive.dominant),
      band: deepMotiveCard.band,
      evidenceRefs: deepMotiveCard.evidenceRefs
    },
    report
  };
}

function buildSelectedAnswers(answers: CorridorsAnswerMap): readonly CorridorsSelectedAnswerDto[] {
  return QUESTIONS.map((question): CorridorsSelectedAnswerDto => {
    const option = answers[question.id];

    return {
      questionId: question.id,
      option,
      answerText: question.options[option].text
    };
  });
}

type InternalEngineResult = ReturnType<typeof buildResult>;
type InternalRunnerUp = InternalEngineResult['archetype']['runnerUp'];

function buildRunnerUp(winnerScore: number, runnerUp: InternalRunnerUp): CorridorsRunnerUpDto {
  const gap = winnerScore - runnerUp.score;
  const gapBand: CorridorsRunnerUpDto['gapBand'] = gap <= 0.5 ? 'tied' : gap <= 3 ? 'close' : 'clear';
  const definition = ARCHETYPES[runnerUp.id];

  return {
    id: runnerUp.id,
    title: definition.title,
    gapBand
  };
}

function buildPublicReport(result: InternalEngineResult): CorridorsPublicReportDto {
  return {
    overview: {
      archetypeTitle: result.report.overview.archetypeTitle,
      patternSummary: result.report.overview.patternSummary,
      confidenceBand: result.report.overview.confidenceBand,
      confidenceExplanation: result.report.overview.confidenceExplanation,
      dominantTraits: result.report.overview.dominantTraits.map(
        (trait): CorridorsDominantTraitDto => ({
          code: trait.tag,
          label: trait.label,
          evidenceRefs: trait.evidenceRefs
        })
      ),
      primaryAxis: result.report.overview.primaryAxis,
      mainContradiction: result.report.overview.mainContradiction,
      deepMotive: result.report.overview.deepMotive
    },
    axisCards: AXIS_IDS.map((axisId): CorridorsAxisCardDto => {
      const card = result.report.axisCards.find((candidate) => candidate.id === axisId);

      if (!card) {
        throw new Error(`Missing public axis card: ${axisId}`);
      }

      return {
        id: card.id,
        label: card.label,
        band: card.band,
        dominantKey: card.dominantKey,
        dominantLabel: card.dominantLabel,
        interpretation: card.interpretation,
        evidenceRefs: card.evidenceRefs
      };
    }),
    contradictionMap: result.report.contradictionMap.map(
      (contradiction): CorridorsContradictionCardDto => ({
        id: contradiction.id as ContradictionId,
        title: contradiction.title,
        explanation: contradiction.explanation,
        tension: contradiction.tension,
        behavioralImplication: contradiction.behavioralImplication,
        disprovenIf: contradiction.disprovenIf,
        evidenceRefs: contradiction.evidenceRefs
      })
    ),
    strengths: result.report.strengths.map(toPublicBullet),
    failureModes: result.report.failureModes.map(toPublicBullet),
    growthDirections: result.report.growthDirections.map(toPublicBullet),
    disprovenIf: result.report.disprovenIf,
    evidenceDigest: result.report.evidenceDigest.map(
      (item): CorridorsEvidenceReferenceDto => ({
        ref: item.ref,
        questionId: item.questionId as QuestionId,
        option: item.option,
        answerText: item.answerText
      })
    )
  };
}

function toPublicBullet(item: { readonly title: string; readonly evidenceRefs: readonly string[] }): CorridorsReportBulletDto {
  return {
    title: item.title,
    evidenceRefs: item.evidenceRefs
  };
}
