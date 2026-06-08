import { describe, expect, it } from 'vitest';
import { runPhase9PublicResultPageUxReleaseClosureGate } from '../../src/core/release/phase9PublicResultPageUxReleaseClosureGate';

describe('Phase 9.5 public result page UX release closure gate', () => {
  it('passes the Phase 9 closure gate', () => {
    const report = runPhase9PublicResultPageUxReleaseClosureGate();

    expect(report.gates.overallPassed).toBe(true);
    expect(report.gates.phase8ClosureEvidenceCurrent).toBe(true);
    expect(report.gates.phase90CopyEvidenceCurrent).toBe(true);
    expect(report.gates.phase91ShareCopyEvidenceCurrent).toBe(true);
    expect(report.gates.phase92AccessibilityEvidenceCurrent).toBe(true);
    expect(report.gates.phase93VisualLayoutEvidenceCurrent).toBe(true);
    expect(report.gates.phase94BrowserEvidenceCurrent).toBe(true);
    expect(report.gates.phase941QuizTimerNoHintsEvidenceCurrent).toBe(true);
    expect(report.gates.phase942QuizBrowserInteractionEvidenceCurrent).toBe(true);
    expect(report.gates.manualBrowserCheckRecorded).toBe(true);
    expect(report.gates.deeperUxInvestigationDeferredToNextTrack).toBe(true);
    expect(report.gates.quizTimerVisibleContractPresent).toBe(true);
    expect(report.gates.mouseTouchAnswerSelectionHardened).toBe(true);
    expect(report.gates.keyboardAnswerSelectionHardened).toBe(true);
    expect(report.gates.noQuizResultHintsBeforeCompletion).toBe(true);
    expect(report.gates.unavailableStatesRemainNonActionable).toBe(true);
    expect(report.gates.shareCopyRenderableOnly).toBe(true);
    expect(report.gates.accessibilitySemanticsRemainIntact).toBe(true);
    expect(report.gates.rawAnswersRemainBlocked).toBe(true);
    expect(report.gates.rawDeleteTokensRemainBlocked).toBe(true);
    expect(report.gates.noPersistenceChangeSignals).toBe(true);
    expect(report.gates.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.gates.noNetworkSmokeChangeSignals).toBe(true);
    expect(report.gates.phase10TransitionPlanExists).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
