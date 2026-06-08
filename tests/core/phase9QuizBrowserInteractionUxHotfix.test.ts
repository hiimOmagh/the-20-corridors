import { describe, expect, it } from 'vitest';
import { runPhase9QuizBrowserInteractionUxHotfixGate } from '../../src/core/release/phase9QuizBrowserInteractionUxHotfix';

describe('Phase 9.4.2 quiz browser interaction UX hotfix gate', () => {
  it('passes the real browser interaction hardening gate', () => {
    const report = runPhase9QuizBrowserInteractionUxHotfixGate();

    expect(report.gates.overallPassed).toBe(true);
    expect(report.gates.nextDevOriginAllowsUserNetworkHost).toBe(true);
    expect(report.gates.clientHydrationMarkerExists).toBe(true);
    expect(report.gates.countdownVisibleMarkerExists).toBe(true);
    expect(report.gates.pointerActivationPathExists).toBe(true);
    expect(report.gates.clickFallbackDoesNotDoubleSubmit).toBe(true);
    expect(report.gates.keyboardShortcutUsesKeyAndCode).toBe(true);
    expect(report.gates.staleClosureProtectionExists).toBe(true);
    expect(report.gates.timeoutStillForcesRestart).toBe(true);
    expect(report.gates.noPersistenceChangeSignals).toBe(true);
    expect(report.gates.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.gates.noNetworkSmokeChangeSignals).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
