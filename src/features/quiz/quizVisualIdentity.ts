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
  A: { signal: 'Direct signal', tone: 'threshold' },
  B: { signal: 'Control signal', tone: 'signal' },
  C: { signal: 'Depth signal', tone: 'echo' },
  D: { signal: 'Distance signal', tone: 'void' }
};

export function buildQuizVisualFrame(progress: QuizProgressState, currentQuestionId: number): QuizVisualFrameViewModel {
  const phaseLabel = progress.isComplete
    ? 'Final threshold'
    : progress.progressPercent >= 70
      ? 'Late corridor'
      : progress.progressPercent >= 35
        ? 'Middle corridor'
        : 'Opening corridor';

  const paceLabel = progress.isComplete
    ? 'All answers locked'
    : progress.answeredCount === 0
      ? 'No answers locked yet'
      : `${progress.answeredCount} choices locked`;

  const atmosphereLabel = progress.isComplete
    ? 'Report gate ready'
    : progress.progressPercent >= 50
      ? 'Pattern density rising'
      : 'Instinct capture active';

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
