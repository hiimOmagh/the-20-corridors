import { describe, expect, it } from 'vitest';
import { getCorridorQuestions, runCorridorsEngine, stableStringify, type CorridorsOptionKey } from '@/core';
import {
  buildCorridorAnswerSequence,
  calculateQuizProgress,
  clearCorridorsResultFromSessionStorage,
  CORRIDORS_SESSION_STORAGE_KEY,
  getLastAnsweredQuestionIndex,
  getNextQuestionIndex,
  getPreviousQuestionIndex,
  parseKeyboardOptionKey,
  readCorridorsResultFromSessionStorage,
  removeAnswerForQuestion,
  saveCorridorsResultToSessionStorage,
  type DraftCorridorsAnswers,
  type StorageLike
} from '@/features/quiz/quizFlow';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const QUESTIONS = getCorridorQuestions();
const COMPLETE_ANSWERS = Object.fromEntries(
  QUESTIONS.map((question, index) => [question.id, (index % 2 === 0 ? 'A' : 'B') satisfies CorridorsOptionKey])
) as DraftCorridorsAnswers;

describe('quiz flow helpers', () => {
  it('builds deterministic public answer sequences from question order', () => {
    const sequence = buildCorridorAnswerSequence(QUESTIONS, COMPLETE_ANSWERS);

    expect(sequence.split(' ')).toHaveLength(20);
    expect(sequence.startsWith('1A 2B 3A')).toBe(true);
  });

  it('rejects incomplete answer sequences before final submission', () => {
    expect(() => buildCorridorAnswerSequence(QUESTIONS, { 1: 'A' })).toThrow(/missing answers/i);
  });

  it('calculates clamped quiz progress', () => {
    expect(calculateQuizProgress(2, 20, 5)).toMatchObject({
      currentCorridor: 3,
      totalCorridors: 20,
      answeredCount: 5,
      progressPercent: 25,
      isFirst: false,
      isLast: false,
      isComplete: false
    });

    expect(calculateQuizProgress(99, 20, 99)).toMatchObject({
      currentCorridor: 20,
      answeredCount: 20,
      progressPercent: 100,
      isLast: true,
      isComplete: true
    });
  });

  it('parses only A/B/C/D keyboard shortcuts', () => {
    expect(parseKeyboardOptionKey('a')).toBe('A');
    expect(parseKeyboardOptionKey('D')).toBe('D');
    expect(parseKeyboardOptionKey(' ArrowLeft ')).toBeNull();
    expect(parseKeyboardOptionKey('E')).toBeNull();
  });

  it('calculates bounded previous and next navigation indexes', () => {
    expect(getPreviousQuestionIndex(0)).toBe(0);
    expect(getPreviousQuestionIndex(4)).toBe(3);
    expect(getNextQuestionIndex(18, 20)).toBe(19);
    expect(getNextQuestionIndex(19, 20)).toBe(19);
  });

  it('finds and removes the last answered question for undo behavior', () => {
    const answers: DraftCorridorsAnswers = { 1: 'A', 3: 'C', 7: 'D' };
    const lastIndex = getLastAnsweredQuestionIndex(QUESTIONS, answers);

    expect(lastIndex).toBe(6);

    const nextAnswers = removeAnswerForQuestion(answers, 7);
    expect(nextAnswers[7]).toBeUndefined();
    expect(answers[7]).toBe('D');
  });
});

describe('corridor session storage helpers', () => {
  it('saves and reads versioned serialized public results', () => {
    const storage = new MemoryStorage();
    const result = runCorridorsEngine(buildCorridorAnswerSequence(QUESTIONS, COMPLETE_ANSWERS));

    saveCorridorsResultToSessionStorage(storage, result);

    const stored = storage.getItem(CORRIDORS_SESSION_STORAGE_KEY);
    expect(stored).toContain('serializationVersion');

    const readState = readCorridorsResultFromSessionStorage(storage);
    expect(readState.status).toBe('ok');

    if (readState.status === 'ok') {
      expect(readState.result.archetype.id).toBe(result.archetype.id);
      expect(stableStringify(readState.result)).toBe(stableStringify(result));
    }
  });

  it('accepts legacy raw public result JSON from the Phase 2.0 scaffold', () => {
    const storage = new MemoryStorage();
    const result = runCorridorsEngine(buildCorridorAnswerSequence(QUESTIONS, COMPLETE_ANSWERS));

    storage.setItem(CORRIDORS_SESSION_STORAGE_KEY, JSON.stringify(result));

    const readState = readCorridorsResultFromSessionStorage(storage);
    expect(readState.status).toBe('ok');

    if (readState.status === 'ok') {
      expect(readState.result.apiVersion).toBe(result.apiVersion);
    }
  });

  it('returns invalid state for corrupt local result data instead of throwing', () => {
    const storage = new MemoryStorage();
    storage.setItem(CORRIDORS_SESSION_STORAGE_KEY, '{not json');

    const readState = readCorridorsResultFromSessionStorage(storage);
    expect(readState.status).toBe('invalid');

    if (readState.status === 'invalid') {
      expect(readState.message).toMatch(/invalid/i);
    }
  });

  it('clears local result data', () => {
    const storage = new MemoryStorage();
    storage.setItem(CORRIDORS_SESSION_STORAGE_KEY, 'value');

    clearCorridorsResultFromSessionStorage(storage);

    expect(readCorridorsResultFromSessionStorage(storage)).toEqual({ status: 'empty' });
  });
});
