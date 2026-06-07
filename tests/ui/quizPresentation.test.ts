import { describe, expect, it } from 'vitest';
import { getCorridorQuestions, type CorridorsOptionKey } from '@/core';
import { calculateQuizProgress, type DraftCorridorsAnswers } from '@/features/quiz/quizFlow';
import {
  buildCompletionPanel,
  buildOptionButtonClassName,
  buildQuizStatusSummary,
  buildReviewDots
} from '@/features/quiz/quizPresentation';

const QUESTIONS = getCorridorQuestions();

function buildAnswers(count: number): DraftCorridorsAnswers {
  return Object.fromEntries(
    QUESTIONS.slice(0, count).map((question, index) => [
      question.id,
      (index % 2 === 0 ? 'A' : 'B') satisfies CorridorsOptionKey
    ])
  ) as DraftCorridorsAnswers;
}

describe('quiz presentation helpers', () => {
  it('builds mobile-ready progress labels for incomplete quizzes', () => {
    const progress = calculateQuizProgress(4, 20, 7);
    const summary = buildQuizStatusSummary(progress);

    expect(summary.answeredLabel).toBe('7/20 answered');
    expect(summary.remainingLabel).toBe('13 remaining');
    expect(summary.modeLabel).toBe('Timed input');
    expect(summary.keyboardHint).toContain('10s');
  });

  it('switches labels when the quiz is complete', () => {
    const progress = calculateQuizProgress(19, 20, 20);
    const summary = buildQuizStatusSummary(progress);
    const panel = buildCompletionPanel(progress);

    expect(summary.remainingLabel).toBe('Ready to generate');
    expect(summary.modeLabel).toBe('Ready for report');
    expect(panel.isVisible).toBe(true);
    expect(panel.primaryActionLabel).toMatch(/generate/i);
    expect(panel.keyboardHint).toMatch(/enter/i);
  });

  it('hides the completion panel until all corridors are answered', () => {
    const progress = calculateQuizProgress(10, 20, 19);
    const panel = buildCompletionPanel(progress);

    expect(panel.isVisible).toBe(false);
    expect(panel.body).toMatch(/all 20/i);
  });

  it('builds review dot labels, accessibility text, and classes', () => {
    const dots = buildReviewDots(QUESTIONS, buildAnswers(3), 1);

    expect(dots).toHaveLength(20);
    expect(dots[0]).toMatchObject({ label: '1', isAnswered: true, isCurrent: false });
    expect(dots[1]).toMatchObject({ label: '2', isAnswered: true, isCurrent: true });
    expect(dots[3]?.label).toBe('4');
    expect(dots[1]?.className).toContain('answered');
    expect(dots[1]?.className).toContain('current');
    expect(dots[3]?.ariaLabel).toMatch(/unanswered/i);
  });



  it('reveals answer keys only after completion', () => {
    const hiddenDots = buildReviewDots(QUESTIONS, buildAnswers(2), 1, false);
    const revealedDots = buildReviewDots(QUESTIONS, buildAnswers(2), 1, true);

    expect(hiddenDots[0]?.label).toBe('1');
    expect(hiddenDots[0]?.title).not.toContain('A');
    expect(revealedDots[0]?.label).toBe('1A');
    expect(revealedDots[1]?.ariaLabel).toContain('B');
  });

  it('returns stable option button class names', () => {
    expect(buildOptionButtonClassName(true)).toBe('option-button selected');
    expect(buildOptionButtonClassName(false)).toBe('option-button');
  });
});
