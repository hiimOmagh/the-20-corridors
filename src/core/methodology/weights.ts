export const QUESTION_WEIGHTS = {
  1: 1.0,
  2: 1.5,
  3: 1.0,
  4: 1.0,
  5: 1.0,
  6: 1.0,
  7: 1.5,
  8: 0.75,
  9: 1.25,
  10: 1.0,
  11: 1.5,
  12: 0.75,
  13: 1.0,
  14: 1.0,
  15: 1.25,
  16: 1.5,
  17: 0.75,
  18: 1.0,
  19: 2.0,
  20: 2.0
} as const;

export type QuestionId = keyof typeof QUESTION_WEIGHTS;

export function getQuestionWeight(questionId: QuestionId): number {
  return QUESTION_WEIGHTS[questionId];
}
