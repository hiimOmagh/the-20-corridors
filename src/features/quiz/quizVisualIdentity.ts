import type { CorridorsOptionKey } from '@/core';
import type { QuizProgressState } from './quizFlow';

export interface QuizVisualFrameViewModel {
  readonly corridorMark: string;
  readonly phaseLabel: string;
  readonly paceLabel: string;
  readonly atmosphereLabel: string;
  readonly frameClassName: string;
}

export interface QuizOptionIdentityViewModel {
  readonly optionKey: CorridorsOptionKey;
  readonly className: string;
  readonly signalLabel: string;
  readonly toneLabel: string;
}

const OPTION_TONES: Record<CorridorsOptionKey, { readonly signal: string; readonly tone: string }> = {
  A: { signal: 'Answer A', tone: 'threshold' },
  B: { signal: 'Answer B', tone: 'signal' },
  C: { signal: 'Answer C', tone: 'echo' },
  D: { signal: 'Answer D', tone: 'void' }
};

export function buildQuizVisualFrame(progress: QuizProgressState, currentQuestionId: number): QuizVisualFrameViewModel {
  const phaseLabel = progress.isComplete ? 'Report step ready' : 'Timed question';

  const paceLabel = progress.isComplete
    ? 'All answers submitted'
    : progress.answeredCount === 0
      ? 'No answers submitted yet'
      : `${progress.answeredCount} answers submitted`;

  const atmosphereLabel = progress.isComplete ? 'Report available after submission' : 'No result hints during quiz';

  const frameClassName = [
    'quiz-visual-frame',
    progress.isComplete ? 'complete' : 'in-progress',
    progress.progressPercent >= 70 ? 'late' : progress.progressPercent >= 35 ? 'middle' : 'opening'
  ].join(' ');

  return {
    corridorMark: `C${String(currentQuestionId).padStart(2, '0')}`,
    phaseLabel,
    paceLabel,
    atmosphereLabel,
    frameClassName
  };
}

export function buildQuizOptionIdentity(optionKey: CorridorsOptionKey, isSelected: boolean): QuizOptionIdentityViewModel {
  const tone = OPTION_TONES[optionKey];

  return {
    optionKey,
    className: [
      'option-identity',
      `option-tone-${tone.tone}`,
      isSelected ? 'option-identity-selected' : ''
    ].filter(Boolean).join(' '),
    signalLabel: tone.signal,
    toneLabel: tone.tone
  };
}
