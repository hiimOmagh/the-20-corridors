import { describe, expect, it } from 'vitest';
import {
  PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_ID,
  PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_SCHEMA_VERSION,
  runPhase10QuizBrowserE2eInteractionEvidenceGate
} from '@/core/release/phase10QuizBrowserE2eInteractionEvidence';

describe('phase 10 quiz browser E2E interaction evidence gate', () => {
  it('passes when browser interaction evidence is executable and Phase 9 remains closed', () => {
    const report = runPhase10QuizBrowserE2eInteractionEvidenceGate();

    expect(report.schemaVersion).toBe(PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_SCHEMA_VERSION);
    expect(report.gateId).toBe(PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_ID);
    expect(report.gates).toMatchObject({
      gateScriptExists: true,
      gateModuleExists: true,
      e2eHelperExists: true,
      gateTestsExist: true,
      packageScriptExists: true,
      validateRunsGate: true,
      phase9ClosureEvidenceCurrent: true,
      mouseClickAdvancesExactlyOneQuestion: true,
      keyboardShortcutAdvancesExactlyOneQuestion: true,
      focusedEnterAdvancesExactlyOneQuestion: true,
      focusedSpaceAdvancesExactlyOneQuestion: true,
      timerStartsAtTenSeconds: true,
      timerCountsDown: true,
      timeoutForcesRestart: true,
      noDoubleSkipFromPointerClickFallback: true,
      noPreCompletionResultHints: true,
      completionStillGeneratesReport: true,
      sourceHasVisibleCountdownContract: true,
      sourceHasPointerAndClickInteractionPaths: true,
      sourceHasKeyboardInteractionPath: true,
      sourceHasTimeoutRestartUi: true,
      sourceBlocksPreCompletionHints: true,
      noPersistenceChangeSignals: true,
      noDatabaseBindingChangeSignals: true,
      noNetworkSmokeChangeSignals: true,
      docsExist: true,
      overallPassed: true
    });
    expect(report.scenario.allInteractionsPassed).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
