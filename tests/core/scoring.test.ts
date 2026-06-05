import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../../src/core/methodology/questions';
import { TAGS } from '../../src/core/methodology/tags';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';
import { buildResult } from '../../src/core/scoring/buildResult';
import { parseAnswerSequence } from '../../src/core/scoring/scoreAnswers';

describe('methodology integrity', () => {
  it('defines exactly 20 questions', () => {
    expect(QUESTIONS).toHaveLength(20);
  });

  it('defines all 80 options with at least one scoring tag', () => {
    let optionCount = 0;

    for (const question of QUESTIONS) {
      expect(question.weight).toBeGreaterThan(0);

      for (const optionKey of ['A', 'B', 'C', 'D'] as const) {
        const option = question.options[optionKey];
        optionCount += 1;
        expect(option.text.length).toBeGreaterThan(0);
        expect(option.tags.length).toBeGreaterThan(0);

        for (const tag of option.tags) {
          expect(TAGS).toContain(tag);
        }
      }
    }

    expect(optionCount).toBe(80);
  });
});

describe('answer parsing and determinism', () => {
  it('parses a complete answer sequence into a 20-answer map', () => {
    const firstProfile = GOLDEN_PROFILES[0];
    expect(firstProfile).toBeDefined();
    const parsed = parseAnswerSequence(firstProfile!.sequence);

    expect(Object.keys(parsed)).toHaveLength(20);
    expect(parsed[1]).toBe('D');
    expect(parsed[20]).toBe('D');
  });

  it('produces identical output for identical input', () => {
    const firstProfile = GOLDEN_PROFILES[0];
    expect(firstProfile).toBeDefined();
    const sequence = firstProfile!.sequence;
    const first = buildResult(sequence);
    const second = buildResult(sequence);

    expect(second).toEqual(first);
  });

  it('rejects incomplete answer sequences', () => {
    expect(() => buildResult('1A 2B')).toThrow(/Missing answer/);
  });
});
