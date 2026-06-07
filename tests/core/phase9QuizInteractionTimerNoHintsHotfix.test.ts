import { describe, expect, it } from 'vitest';
import { runPhase9QuizInteractionTimerNoHintsHotfixGate } from '../../src/core/release/phase9QuizInteractionTimerNoHintsHotfix';

describe('Phase 9.4.1 quiz interaction timer no-hints hotfix gate', () => {
  it('passes the quiz interaction and no-hints hotfix gate', () => {
    const report = runPhase9QuizInteractionTimerNoHintsHotfixGate();

    expect(report.gates.overallPassed).toBe(true);
    expect(report.gates.mouseClickSelectionHardened).toBe(true);
    expect(report.gates.keyboardSelectionHardened).toBe(true);
    expect(report.gates.perQuestionTimerIsTenSeconds).toBe(true);
    expect(report.gates.timeoutForcesRestart).toBe(true);
    expect(report.gates.answerButtonsDisableAfterTimeout).toBe(true);
    expect(report.gates.reviewDotsHideAnswerKeysBeforeCompletion).toBe(true);
    expect(report.gates.inProgressResultHintsRemoved).toBe(true);
    expect(report.gates.noPersistenceChangeSignals).toBe(true);
    expect(report.gates.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.gates.noNetworkSmokeChangeSignals).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
