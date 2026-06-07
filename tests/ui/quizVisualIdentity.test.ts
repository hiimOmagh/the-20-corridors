import { describe, expect, it } from 'vitest';
import { buildQuizOptionIdentity, buildQuizVisualFrame } from '@/features/quiz/quizVisualIdentity';
import { calculateQuizProgress } from '@/features/quiz/quizFlow';

describe('quiz visual identity helpers', () => {
  it('keeps in-progress quiz labels neutral and result-hint-free', () => {
    const frame = buildQuizVisualFrame(calculateQuizProgress(5, 20, 6), 6);

    expect(frame.phaseLabel).toBe('Timed question');
    expect(frame.atmosphereLabel).toBe('No result hints during quiz');
    expect(frame.paceLabel).not.toMatch(/pattern|archetype|result|threshold|depth|control/i);
  });

  it('uses generic option labels instead of interpretive signals', () => {
    expect(buildQuizOptionIdentity('A', false).signalLabel).toBe('Answer A');
    expect(buildQuizOptionIdentity('B', false).signalLabel).toBe('Answer B');
    expect(buildQuizOptionIdentity('C', false).signalLabel).toBe('Answer C');
    expect(buildQuizOptionIdentity('D', false).signalLabel).toBe('Answer D');
  });
});
