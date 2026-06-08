import { describe, expect, it } from 'vitest';
import {
  buildInProgressVisibleTextFixture,
  createQuizBrowserE2eHarness,
  hasNoPreCompletionHints,
  runQuizBrowserE2eInteractionEvidence
} from '@/features/quiz/quizBrowserE2eEvidence';


describe('quiz browser E2E evidence scenario runner', () => {
  it('proves mouse, keyboard, focused button, timer, and completion paths', () => {
    const report = runQuizBrowserE2eInteractionEvidence();

    expect(report.questionCount).toBe(20);
    expect(report.mouse).toMatchObject({ source: 'mouse', accepted: true, advancedExactlyOneQuestion: true });
    expect(report.keyboard).toMatchObject({ source: 'keyboard', accepted: true, advancedExactlyOneQuestion: true });
    expect(report.focusedEnter).toMatchObject({ source: 'focused-enter', accepted: true, advancedExactlyOneQuestion: true });
    expect(report.focusedSpace).toMatchObject({ source: 'focused-space', accepted: true, advancedExactlyOneQuestion: true });
    expect(report.doubleSubmit).toMatchObject({ pointerAccepted: true, clickFallbackSuppressed: true, noDoubleSkip: true });
    expect(report.timer).toMatchObject({
      startsAtSeconds: 10,
      afterFourSeconds: 6,
      afterTenSeconds: 0,
      timeoutForcesRestart: true,
      answerAfterTimeoutAccepted: false
    });
    expect(report.noPreCompletionHints).toBe(true);
    expect(report.completion).toMatchObject({ completed: true, answeredCount: 20, generatedReport: true, answerSequenceLength: 20 });
    expect(report.allInteractionsPassed).toBe(true);
  });

  it('blocks pre-completion result hints in visible quiz copy fixtures', () => {
    expect(hasNoPreCompletionHints(buildInProgressVisibleTextFixture())).toBe(true);
    expect(hasNoPreCompletionHints('Pattern density rising before completion')).toBe(false);
    expect(hasNoPreCompletionHints('Dominant corridor: Strategist')).toBe(false);
  });

  it('suppresses pointer followed by click fallback as one browser interaction', () => {
    const harness = createQuizBrowserE2eHarness();
    const evidence = harness.pointerThenClickFallback('A');

    expect(evidence).toMatchObject({
      pointerAccepted: true,
      clickFallbackSuppressed: true,
      beforeQuestion: 1,
      afterQuestion: 2,
      answeredCountDelta: 1,
      noDoubleSkip: true
    });
  });
});
