import { OPTION_KEYS, QUESTIONS, type OptionKey } from '../methodology/questions';
import type { QuestionId } from '../methodology/weights';
export type AnswerMap = Record<QuestionId, OptionKey>;
export type AnswerInput = AnswerMap | string;

export function parseAnswerSequence(sequence: string): AnswerMap {
  const answers: Partial<Record<QuestionId, OptionKey>> = {};
  const tokens = sequence.trim().split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const match = /^(\d{1,2})([ABCD])$/.exec(token);
    if (!match) {
      throw new Error(`Invalid answer token: ${token}`);
    }

    const questionId = Number(match[1]) as QuestionId;
    const option = match[2] as OptionKey;
    answers[questionId] = option;
  }

  return validateAnswerMap(answers);
}

export function normalizeAnswers(input: AnswerInput): AnswerMap {
  if (typeof input === 'string') {
    return parseAnswerSequence(input);
  }

  return validateAnswerMap(input);
}

export function validateAnswerMap(input: Partial<Record<QuestionId, OptionKey>>): AnswerMap {
  const normalized: Partial<Record<QuestionId, OptionKey>> = {};

  for (const question of QUESTIONS) {
    const answer = input[question.id];

    if (!answer) {
      throw new Error(`Missing answer for question ${question.id}`);
    }

    if (!OPTION_KEYS.includes(answer)) {
      throw new Error(`Invalid option for question ${question.id}: ${answer}`);
    }

    normalized[question.id] = answer;
  }

  return normalized as AnswerMap;
}
