import {
  assertPublicResult,
  deserializeCorridorsResult,
  serializeCorridorsResult,
  type CorridorsOptionKey,
  type CorridorsPublicResultDto,
  type CorridorsQuestionDto,
  type CorridorsQuestionId
} from '@/core';

export const CORRIDORS_SESSION_STORAGE_KEY = 'the-20-corridors:last-result';

export type DraftCorridorsAnswers = Partial<Record<CorridorsQuestionId, CorridorsOptionKey>>;

export const QUIZ_SECONDS_PER_QUESTION = 10;

export interface QuizCountdownState {
  readonly secondsRemaining: number;
  readonly isExpired: boolean;
  readonly label: string;
  readonly urgency: 'steady' | 'urgent' | 'expired';
}

export function createQuizQuestionDeadline(nowMs: number, secondsPerQuestion: number = QUIZ_SECONDS_PER_QUESTION): number {
  return nowMs + Math.max(1, secondsPerQuestion) * 1000;
}

export function calculateQuizSecondsRemaining(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export function buildQuizCountdownState(secondsRemaining: number): QuizCountdownState {
  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));

  return {
    secondsRemaining: safeSeconds,
    isExpired: safeSeconds === 0,
    label: safeSeconds === 0 ? 'Time expired' : `${safeSeconds}s left`,
    urgency: safeSeconds === 0 ? 'expired' : safeSeconds <= 3 ? 'urgent' : 'steady'
  };
}

export function shouldBlockQuizInteractionForTimeout(secondsRemaining: number): boolean {
  return buildQuizCountdownState(secondsRemaining).isExpired;
}

export interface QuizProgressState {
  readonly currentCorridor: number;
  readonly totalCorridors: number;
  readonly answeredCount: number;
  readonly progressPercent: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly isComplete: boolean;
}

export type StoredCorridorsResultState =
  | { readonly status: 'empty' }
  | { readonly status: 'invalid'; readonly message: string }
  | { readonly status: 'ok'; readonly result: CorridorsPublicResultDto };

export interface StorageLike {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
}

export function buildCorridorAnswerSequence(
  questions: readonly CorridorsQuestionDto[],
  answers: DraftCorridorsAnswers
): string {
  const missing = questions.filter((question) => answers[question.id] === undefined).map((question) => question.id);

  if (missing.length > 0) {
    throw new Error(`Cannot build corridor answer sequence; missing answers for Q${missing.join(', Q')}.`);
  }

  return questions.map((question) => `${question.id}${answers[question.id]}`).join(' ');
}

export function calculateQuizProgress(
  currentIndex: number,
  totalCorridors: number,
  answeredCount: number
): QuizProgressState {
  const safeTotal = Math.max(0, totalCorridors);
  const safeCurrentIndex = clamp(currentIndex, 0, Math.max(0, safeTotal - 1));
  const safeAnsweredCount = clamp(answeredCount, 0, safeTotal);
  const progressPercent = safeTotal === 0 ? 0 : Math.round((safeAnsweredCount / safeTotal) * 100);

  return {
    currentCorridor: safeTotal === 0 ? 0 : safeCurrentIndex + 1,
    totalCorridors: safeTotal,
    answeredCount: safeAnsweredCount,
    progressPercent,
    isFirst: safeCurrentIndex === 0,
    isLast: safeTotal === 0 ? true : safeCurrentIndex === safeTotal - 1,
    isComplete: safeTotal > 0 && safeAnsweredCount === safeTotal
  };
}

export function parseKeyboardOptionKey(key: string, code = ''): CorridorsOptionKey | null {
  const normalizedKey = key.trim().toUpperCase();
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedKey === 'A' || normalizedKey === 'B' || normalizedKey === 'C' || normalizedKey === 'D') {
    return normalizedKey;
  }

  if (normalizedCode === 'KEYA') {
    return 'A';
  }

  if (normalizedCode === 'KEYB') {
    return 'B';
  }

  if (normalizedCode === 'KEYC') {
    return 'C';
  }

  if (normalizedCode === 'KEYD') {
    return 'D';
  }

  return null;
}

export function getPreviousQuestionIndex(currentIndex: number): number {
  return Math.max(0, currentIndex - 1);
}

export function getNextQuestionIndex(currentIndex: number, totalCorridors: number): number {
  return Math.min(Math.max(0, totalCorridors - 1), currentIndex + 1);
}

export function getLastAnsweredQuestionIndex(
  questions: readonly CorridorsQuestionDto[],
  answers: DraftCorridorsAnswers
): number | null {
  for (let index = questions.length - 1; index >= 0; index -= 1) {
    const question = questions[index];

    if (question !== undefined && answers[question.id] !== undefined) {
      return index;
    }
  }

  return null;
}


export function getNextUnansweredQuestionIndex(
  questions: readonly CorridorsQuestionDto[],
  answers: DraftCorridorsAnswers,
  currentIndex: number
): number | null {
  if (questions.length === 0) {
    return null;
  }

  for (let offset = 1; offset <= questions.length; offset += 1) {
    const index = (currentIndex + offset) % questions.length;
    const question = questions[index];

    if (question !== undefined && answers[question.id] === undefined) {
      return index;
    }
  }

  return null;
}

export function removeAnswerForQuestion(
  answers: DraftCorridorsAnswers,
  questionId: CorridorsQuestionId
): DraftCorridorsAnswers {
  const nextAnswers: DraftCorridorsAnswers = { ...answers };
  delete nextAnswers[questionId];
  return nextAnswers;
}

export function saveCorridorsResultToSessionStorage(
  storage: StorageLike,
  result: CorridorsPublicResultDto
): void {
  storage.setItem(CORRIDORS_SESSION_STORAGE_KEY, serializeCorridorsResult(result));
}

export function readCorridorsResultFromSessionStorage(storage: StorageLike): StoredCorridorsResultState {
  const stored = storage.getItem(CORRIDORS_SESSION_STORAGE_KEY);

  if (stored === null || stored.trim() === '') {
    return { status: 'empty' };
  }

  try {
    return { status: 'ok', result: deserializeCorridorsResult(stored).result };
  } catch (envelopeError) {
    try {
      const parsed = JSON.parse(stored) as unknown;
      assertPublicResult(parsed);
      return { status: 'ok', result: parsed };
    } catch (legacyError) {
      const envelopeMessage = envelopeError instanceof Error ? envelopeError.message : String(envelopeError);
      const legacyMessage = legacyError instanceof Error ? legacyError.message : String(legacyError);
      return {
        status: 'invalid',
        message: `Stored corridor result is invalid. Envelope parse: ${envelopeMessage}; legacy parse: ${legacyMessage}`
      };
    }
  }
}

export function clearCorridorsResultFromSessionStorage(storage: StorageLike): void {
  storage.removeItem(CORRIDORS_SESSION_STORAGE_KEY);
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (maximum < minimum) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, value));
}
