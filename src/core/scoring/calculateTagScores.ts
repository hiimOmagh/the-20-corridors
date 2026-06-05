import { QUESTIONS } from '../methodology/questions';
import { createEmptyTagScores, type Tag, type TagScoreMap } from '../methodology/tags';
import type { AnswerMap } from './scoreAnswers';

const POSITION_MULTIPLIERS = [1.0, 0.6, 0.4, 0.3] as const;

export interface TagEvidenceItem {
  readonly questionId: number;
  readonly option: string;
  readonly tag: Tag;
  readonly points: number;
  readonly position: 'primary' | 'secondary';
}

export interface TagScoreResult {
  readonly tagScores: TagScoreMap;
  readonly evidence: readonly TagEvidenceItem[];
}

export function calculateTagScores(answers: AnswerMap): TagScoreResult {
  const tagScores = createEmptyTagScores();
  const evidence: TagEvidenceItem[] = [];

  for (const question of QUESTIONS) {
    const selectedOption = answers[question.id];
    const optionDefinition = question.options[selectedOption];

    optionDefinition.tags.forEach((tag, index) => {
      const multiplier = POSITION_MULTIPLIERS[index] ?? 0.2;
      const points = roundScore(question.weight * multiplier);
      tagScores[tag] = roundScore(tagScores[tag] + points);
      evidence.push({
        questionId: question.id,
        option: selectedOption,
        tag,
        points,
        position: index === 0 ? 'primary' : 'secondary'
      });
    });
  }

  return {
    tagScores,
    evidence
  };
}

export function roundScore(value: number): number {
  return Number(value.toFixed(4));
}
