import { describe, expect, it } from 'vitest';
import { runPhase9PublicResultPageBrowserEvidenceGate } from '../../src/core/release/phase9PublicResultPageBrowserEvidenceGate';

describe('Phase 9.4 public result page browser evidence gate', () => {
  it('passes the browser evidence release gate', () => {
    const report = runPhase9PublicResultPageBrowserEvidenceGate();

    expect(report.gates.overallPassed).toBe(true);
    expect(report.gates.pageExposesBrowserEvidenceTokens).toBe(true);
    expect(report.gates.renderableStateVisibleTextVerified).toBe(true);
    expect(report.gates.notFoundStateVisibleTextVerified).toBe(true);
    expect(report.gates.deletedStateVisibleTextVerified).toBe(true);
    expect(report.gates.expiredStateVisibleTextVerified).toBe(true);
    expect(report.gates.disabledRollbackStateVisibleTextVerified).toBe(true);
    expect(report.gates.shareCopyBlockOnlyRenderable).toBe(true);
    expect(report.gates.accessibilityLandmarksVisible).toBe(true);
    expect(report.gates.staticBrowserEvidenceOnly).toBe(true);
    expect(report.gates.rawAnswersRemainBlocked).toBe(true);
    expect(report.gates.rawDeleteTokensRemainBlocked).toBe(true);
    expect(report.gates.noPersistenceChangeSignals).toBe(true);
    expect(report.gates.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.gates.noNetworkSmokeChangeSignals).toBe(true);
    expect(report.gates.phase8ClosureEvidenceCurrent).toBe(true);
    expect(report.gates.phase9CopyGateEvidenceCurrent).toBe(true);
    expect(report.gates.phase9ShareCopyGateEvidenceCurrent).toBe(true);
    expect(report.gates.phase9AccessibilityGateEvidenceCurrent).toBe(true);
    expect(report.gates.phase9VisualLayoutGateEvidenceCurrent).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
