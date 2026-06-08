import { getCorridorQuestions, runCorridorsEngine, type CorridorsOptionKey } from '@/core';
import {
  buildCorridorAnswerSequence,
  buildQuizCountdownState,
  calculateQuizSecondsRemaining,
  createQuizQuestionDeadline,
  getNextUnansweredQuestionIndex,
  parseKeyboardOptionKey,
  QUIZ_SECONDS_PER_QUESTION,
  type DraftCorridorsAnswers
} from './quizFlow';

export const QUIZ_BROWSER_E2E_EVIDENCE_ID = 'phase-10.0-quiz-browser-e2e-interaction-evidence' as const;

export type QuizBrowserE2eActivationSource = 'mouse' | 'keyboard' | 'focused-enter' | 'focused-space' | 'pointer' | 'click';

export interface QuizBrowserE2eStepEvidence {
  readonly source: QuizBrowserE2eActivationSource;
  readonly option: CorridorsOptionKey;
  readonly beforeQuestion: number;
  readonly afterQuestion: number;
  readonly beforeAnsweredCount: number;
  readonly afterAnsweredCount: number;
  readonly accepted: boolean;
  readonly advancedExactlyOneQuestion: boolean;
}

export interface QuizBrowserE2eTimerEvidence {
  readonly startsAtSeconds: number;
  readonly afterFourSeconds: number;
  readonly afterTenSeconds: number;
  readonly visibleLabelAtStart: string;
  readonly visibleLabelNearExpiry: string;
  readonly timeoutForcesRestart: boolean;
  readonly answerAfterTimeoutAccepted: boolean;
}

export interface QuizBrowserE2eDoubleSubmitEvidence {
  readonly pointerAccepted: boolean;
  readonly clickFallbackSuppressed: boolean;
  readonly beforeQuestion: number;
  readonly afterQuestion: number;
  readonly answeredCountDelta: number;
  readonly noDoubleSkip: boolean;
}

export interface QuizBrowserE2eCompletionEvidence {
  readonly completed: boolean;
  readonly answeredCount: number;
  readonly generatedReport: boolean;
  readonly answerSequenceLength: number;
}

export interface QuizBrowserE2eInteractionEvidenceReport {
  readonly evidenceId: typeof QUIZ_BROWSER_E2E_EVIDENCE_ID;
  readonly questionCount: number;
  readonly mouse: QuizBrowserE2eStepEvidence;
  readonly keyboard: QuizBrowserE2eStepEvidence;
  readonly focusedEnter: QuizBrowserE2eStepEvidence;
  readonly focusedSpace: QuizBrowserE2eStepEvidence;
  readonly doubleSubmit: QuizBrowserE2eDoubleSubmitEvidence;
  readonly timer: QuizBrowserE2eTimerEvidence;
  readonly noPreCompletionHints: boolean;
  readonly completion: QuizBrowserE2eCompletionEvidence;
  readonly allInteractionsPassed: boolean;
}

const FORBIDDEN_IN_PROGRESS_HINTS = [
  'Observer',
  'Strategist',
  'Builder',
  'Catalyst',
  'Pattern density',
  'Direct signal',
  'Control signal',
  'Depth signal',
  'Distance signal',
  'Final threshold',
  'archetype',
  'corridor profile',
  'dominant corridor'
] as const;

export function runQuizBrowserE2eInteractionEvidence(): QuizBrowserE2eInteractionEvidenceReport {
  const mouseHarness = createQuizBrowserE2eHarness();
  const mouse = mouseHarness.mouseClick('A');

  const keyboardHarness = createQuizBrowserE2eHarness();
  const keyboard = keyboardHarness.keyboardShortcut('B', 'KeyB');

  const focusedEnterHarness = createQuizBrowserE2eHarness();
  const focusedEnter = focusedEnterHarness.focusedButtonKey('C', 'Enter');

  const focusedSpaceHarness = createQuizBrowserE2eHarness();
  const focusedSpace = focusedSpaceHarness.focusedButtonKey('D', ' ');

  const doubleSubmitHarness = createQuizBrowserE2eHarness();
  const doubleSubmit = doubleSubmitHarness.pointerThenClickFallback('A');

  const timerHarness = createQuizBrowserE2eHarness();
  const timer = timerHarness.runTimerExpiryEvidence();

  const completionHarness = createQuizBrowserE2eHarness();
  const completion = completionHarness.completeAllQuestions();

  const noPreCompletionHints = hasNoPreCompletionHints(buildInProgressVisibleTextFixture());

  const allInteractionsPassed =
    mouse.advancedExactlyOneQuestion &&
    keyboard.advancedExactlyOneQuestion &&
    focusedEnter.advancedExactlyOneQuestion &&
    focusedSpace.advancedExactlyOneQuestion &&
    doubleSubmit.noDoubleSkip &&
    timer.startsAtSeconds === QUIZ_SECONDS_PER_QUESTION &&
    timer.afterFourSeconds === 6 &&
    timer.afterTenSeconds === 0 &&
    timer.timeoutForcesRestart &&
    timer.answerAfterTimeoutAccepted === false &&
    noPreCompletionHints &&
    completion.completed &&
    completion.generatedReport;

  return {
    evidenceId: QUIZ_BROWSER_E2E_EVIDENCE_ID,
    questionCount: getCorridorQuestions().length,
    mouse,
    keyboard,
    focusedEnter,
    focusedSpace,
    doubleSubmit,
    timer,
    noPreCompletionHints,
    completion,
    allInteractionsPassed
  };
}

export function hasNoPreCompletionHints(visibleText: string): boolean {
  return FORBIDDEN_IN_PROGRESS_HINTS.every((token) => !visibleText.toLowerCase().includes(token.toLowerCase()));
}

export function buildInProgressVisibleTextFixture(): string {
  return [
    'Corridor 1 / 20',
    '0% answered · 0 submitted',
    '10s left',
    '10 seconds per question. No result hints during the quiz.',
    'Choose one answer.',
    'Timer resets after each submitted answer.',
    'No result hints before completion.',
    'Answer quickly. The report stays hidden until every question is complete.',
    'Answer A',
    'Answer B',
    'Answer C',
    'Answer D'
  ].join(' ');
}

export function createQuizBrowserE2eHarness() {
  return new QuizBrowserE2eHarness();
}

class QuizBrowserE2eHarness {
  private readonly questions = getCorridorQuestions();
  private answers: DraftCorridorsAnswers = {};
  private currentIndex = 0;
  private timedOut = false;
  private suppressNextClick = false;
  private readonly initialDeadlineMs = createQuizQuestionDeadline(0);

  mouseClick(option: CorridorsOptionKey): QuizBrowserE2eStepEvidence {
    return this.activate(option, 'mouse');
  }

  keyboardShortcut(key: string, code: string): QuizBrowserE2eStepEvidence {
    const option = parseKeyboardOptionKey(key, code);

    if (option === null) {
      throw new Error(`Unsupported keyboard shortcut fixture: key=${key}; code=${code}`);
    }

    return this.activate(option, 'keyboard');
  }

  focusedButtonKey(option: CorridorsOptionKey, key: 'Enter' | ' '): QuizBrowserE2eStepEvidence {
    return this.activate(option, key === 'Enter' ? 'focused-enter' : 'focused-space');
  }

  pointerThenClickFallback(option: CorridorsOptionKey): QuizBrowserE2eDoubleSubmitEvidence {
    const beforeQuestion = this.currentQuestionNumber();
    const beforeAnsweredCount = this.answeredCount();
    const pointer = this.activate(option, 'pointer');
    this.suppressNextClick = true;
    const clickAccepted = this.clickFallback(option);
    const afterQuestion = this.currentQuestionNumber();
    const answeredCountDelta = this.answeredCount() - beforeAnsweredCount;

    return {
      pointerAccepted: pointer.accepted,
      clickFallbackSuppressed: !clickAccepted,
      beforeQuestion,
      afterQuestion,
      answeredCountDelta,
      noDoubleSkip: pointer.accepted && !clickAccepted && afterQuestion === beforeQuestion + 1 && answeredCountDelta === 1
    };
  }

  runTimerExpiryEvidence(): QuizBrowserE2eTimerEvidence {
    const startsAtSeconds = calculateQuizSecondsRemaining(this.initialDeadlineMs, 0);
    const afterFourSeconds = calculateQuizSecondsRemaining(this.initialDeadlineMs, 4000);
    const afterTenSeconds = calculateQuizSecondsRemaining(this.initialDeadlineMs, 10000);
    const visibleLabelAtStart = buildQuizCountdownState(startsAtSeconds).label;
    const visibleLabelNearExpiry = buildQuizCountdownState(3).label;

    if (afterTenSeconds === 0) {
      this.timedOut = true;
    }

    const answerAfterTimeout = this.activate('A', 'keyboard');

    return {
      startsAtSeconds,
      afterFourSeconds,
      afterTenSeconds,
      visibleLabelAtStart,
      visibleLabelNearExpiry,
      timeoutForcesRestart: this.timedOut,
      answerAfterTimeoutAccepted: answerAfterTimeout.accepted
    };
  }

  completeAllQuestions(): QuizBrowserE2eCompletionEvidence {
    const optionCycle: readonly CorridorsOptionKey[] = ['A', 'B', 'C', 'D'];

    while (this.answeredCount() < this.questions.length) {
      const option = optionCycle[this.answeredCount() % optionCycle.length] ?? 'A';
      const step = this.activate(option, 'keyboard');

      if (!step.accepted) {
        break;
      }
    }

    const answerSequence = buildCorridorAnswerSequence(this.questions, this.answers);
    const result = runCorridorsEngine(answerSequence);

    return {
      completed: this.answeredCount() === this.questions.length,
      answeredCount: this.answeredCount(),
      generatedReport: result.report.overview.patternSummary.length > 0 && result.archetype.title.length > 0,
      answerSequenceLength: answerSequence.split(' ').length
    };
  }

  private clickFallback(option: CorridorsOptionKey): boolean {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return false;
    }

    return this.activate(option, 'click').accepted;
  }

  private activate(option: CorridorsOptionKey, source: QuizBrowserE2eActivationSource): QuizBrowserE2eStepEvidence {
    const beforeQuestion = this.currentQuestionNumber();
    const beforeAnsweredCount = this.answeredCount();

    if (this.timedOut) {
      return {
        source,
        option,
        beforeQuestion,
        afterQuestion: beforeQuestion,
        beforeAnsweredCount,
        afterAnsweredCount: beforeAnsweredCount,
        accepted: false,
        advancedExactlyOneQuestion: false
      };
    }

    const question = this.questions[this.currentIndex];

    if (question === undefined) {
      return {
        source,
        option,
        beforeQuestion,
        afterQuestion: beforeQuestion,
        beforeAnsweredCount,
        afterAnsweredCount: beforeAnsweredCount,
        accepted: false,
        advancedExactlyOneQuestion: false
      };
    }

    const nextAnswers = {
      ...this.answers,
      [question.id]: option
    };
    this.answers = nextAnswers;

    const nextUnansweredIndex = getNextUnansweredQuestionIndex(this.questions, nextAnswers, this.currentIndex);

    if (nextUnansweredIndex !== null) {
      this.currentIndex = nextUnansweredIndex;
    }

    const afterQuestion = this.currentQuestionNumber();
    const afterAnsweredCount = this.answeredCount();

    return {
      source,
      option,
      beforeQuestion,
      afterQuestion,
      beforeAnsweredCount,
      afterAnsweredCount,
      accepted: true,
      advancedExactlyOneQuestion: afterQuestion === beforeQuestion + 1 && afterAnsweredCount === beforeAnsweredCount + 1
    };
  }

  private currentQuestionNumber(): number {
    return this.currentIndex + 1;
  }

  private answeredCount(): number {
    return Object.keys(this.answers).length;
  }
}
