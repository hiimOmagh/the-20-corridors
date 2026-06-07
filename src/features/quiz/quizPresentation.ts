import type { CorridorsQuestionDto } from '@/core';
import type { DraftCorridorsAnswers, QuizProgressState } from './quizFlow';

export interface QuizReviewDotViewModel {
  readonly questionId: number;
  readonly label: string;
  readonly title: string;
  readonly className: string;
  readonly ariaLabel: string;
  readonly isAnswered: boolean;
  readonly isCurrent: boolean;
}

export interface QuizCompletionPanelViewModel {
  readonly isVisible: boolean;
  readonly headline: string;
  readonly body: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string;
  readonly keyboardHint: string;
}

export interface QuizStatusSummaryViewModel {
  readonly answeredLabel: string;
  readonly remainingLabel: string;
  readonly modeLabel: string;
  readonly keyboardHint: string;
}

export function buildQuizStatusSummary(progress: QuizProgressState): QuizStatusSummaryViewModel {
  const remaining = Math.max(0, progress.totalCorridors - progress.answeredCount);

  return {
    answeredLabel: `${progress.answeredCount}/${progress.totalCorridors} answered`,
    remainingLabel: remaining === 0 ? 'Ready to generate' : `${remaining} remaining`,
    modeLabel: progress.isComplete ? 'Ready for report' : 'Timed input',
    keyboardHint: progress.isComplete ? 'Enter builds the report' : 'A/B/C/D select · 10s per question'
  };
}

export function buildCompletionPanel(progress: QuizProgressState): QuizCompletionPanelViewModel {
  if (!progress.isComplete) {
    return {
      isVisible: false,
      headline: 'Corridor map still incomplete',
      body: 'Answer all 20 corridors before the report is available.',
      primaryActionLabel: 'Complete all corridors',
      secondaryActionLabel: 'Review answers',
      keyboardHint: 'A/B/C/D select answers.'
    };
  }

  return {
    isVisible: true,
    headline: 'All 20 corridors are mapped.',
    body: 'Review any answer if needed, or generate the deterministic result. No account, backend, or AI layer is involved.',
    primaryActionLabel: 'Generate my report',
    secondaryActionLabel: 'Review from start',
    keyboardHint: 'Press Enter to generate the report.'
  };
}

export function buildReviewDots(
  questions: readonly CorridorsQuestionDto[],
  answers: DraftCorridorsAnswers,
  currentIndex: number,
  revealAnswerKeys = false
): readonly QuizReviewDotViewModel[] {
  return questions.map((question, index) => {
    const answer = answers[question.id];
    const isAnswered = answer !== undefined;
    const isCurrent = index === currentIndex;
    const label = isAnswered && revealAnswerKeys ? `${question.id}${answer}` : `${question.id}`;
    const className = [
      'review-dot',
      isAnswered ? 'answered' : 'unanswered',
      isCurrent ? 'current' : ''
    ].filter(Boolean).join(' ');

    return {
      questionId: question.id,
      label,
      title: isAnswered
        ? revealAnswerKeys
          ? `Corridor ${question.id}: answered ${answer}`
          : `Corridor ${question.id}: answered`
        : `Corridor ${question.id}: unanswered`,
      className,
      ariaLabel: isAnswered
        ? revealAnswerKeys
          ? `Review corridor ${question.id}, answered ${answer}`
          : `Review corridor ${question.id}, answered`
        : `Review corridor ${question.id}, unanswered`,
      isAnswered,
      isCurrent
    };
  });
}

export function buildOptionButtonClassName(isSelected: boolean): string {
  return isSelected ? 'option-button selected' : 'option-button';
}
