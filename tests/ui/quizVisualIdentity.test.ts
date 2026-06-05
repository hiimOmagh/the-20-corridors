import { describe, expect, it } from 'vitest';
import { calculateQuizProgress } from '@/features/quiz/quizFlow';
import { buildQuizOptionIdentity, buildQuizVisualFrame } from '@/features/quiz/quizVisualIdentity';

describe('quiz visual identity helpers', () => {
  it('builds opening, middle, late, and completed frame labels', () => {
    expect(buildQuizVisualFrame(calculateQuizProgress(0, 20, 0), 1)).toMatchObject({
      corridorMark: 'C01',
      phaseLabel: 'Opening corridor',
      paceLabel: 'No answers locked yet',
      atmosphereLabel: 'Instinct capture active'
    });

    expect(buildQuizVisualFrame(calculateQuizProgress(9, 20, 9), 10)).toMatchObject({
      corridorMark: 'C10',
      phaseLabel: 'Middle corridor',
      atmosphereLabel: 'Instinct capture active'
    });

    expect(buildQuizVisualFrame(calculateQuizProgress(15, 20, 15), 16)).toMatchObject({
      corridorMark: 'C16',
      phaseLabel: 'Late corridor',
      atmosphereLabel: 'Pattern density rising'
    });

    expect(buildQuizVisualFrame(calculateQuizProgress(19, 20, 20), 20)).toMatchObject({
      corridorMark: 'C20',
      phaseLabel: 'Final threshold',
      paceLabel: 'All answers locked',
      atmosphereLabel: 'Report gate ready'
    });
  });

  it('returns stable class names for visual frame phases', () => {
    expect(buildQuizVisualFrame(calculateQuizProgress(0, 20, 0), 1).frameClassName).toBe(
      'quiz-visual-frame in-progress opening'
    );
    expect(buildQuizVisualFrame(calculateQuizProgress(19, 20, 20), 20).frameClassName).toBe(
      'quiz-visual-frame complete late'
    );
  });

  it('maps each option key to a visual identity signal', () => {
    expect(buildQuizOptionIdentity('A', false)).toMatchObject({
      className: 'option-identity option-tone-threshold',
      signalLabel: 'Direct signal',
      toneLabel: 'threshold'
    });
    expect(buildQuizOptionIdentity('B', false).signalLabel).toBe('Control signal');
    expect(buildQuizOptionIdentity('C', false).toneLabel).toBe('echo');
    expect(buildQuizOptionIdentity('D', false).toneLabel).toBe('void');
  });

  it('adds a selected visual class without changing option behavior', () => {
    expect(buildQuizOptionIdentity('A', true).className).toBe(
      'option-identity option-tone-threshold option-identity-selected'
    );
  });
});
