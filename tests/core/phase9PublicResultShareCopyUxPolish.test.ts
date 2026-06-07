import { describe, expect, it } from 'vitest';
import {
  PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_ID,
  PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_SCHEMA_VERSION,
  runPhase9PublicResultShareCopyUxPolishGate
} from '../../src/core/release/phase9PublicResultShareCopyUxPolish';

describe('phase 9.1 public result share/copy UX polish gate', () => {
  it('passes when share/copy guidance is polished without persistence, binding, or smoke changes', () => {
    const report = runPhase9PublicResultShareCopyUxPolishGate();

    expect(report.schemaVersion).toBe(PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_SCHEMA_VERSION);
    expect(report.gateId).toBe(PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_ID);
    expect(report.gates).toMatchObject({
      gateScriptExists: true,
      gateModuleExists: true,
      shareCopyModuleExists: true,
      pageRouteExists: true,
      shareCopyTestsExist: true,
      gateTestsExist: true,
      packageScriptExists: true,
      validateRunsShareCopyGate: true,
      phase9CopyGateEvidenceCurrent: true,
      phase9StatusDocExists: true,
      phase9ReleaseDocExists: true,
      phase9TransitionPlanUpdated: true,
      pageUsesShareCopyBuilder: true,
      pageExposesShareCopyAvailability: true,
      pageRendersShareCopyPanelOnlyWhenAvailable: true,
      copyLinkAffordanceTextClear: true,
      manualCopyGuidanceExists: true,
      unavailableStatesBlockCopyAction: true,
      rawAnswersRemainBlocked: true,
      rawDeleteTokensRemainBlocked: true,
      noPersistenceChangeSignals: true,
      noDatabaseBindingChangeSignals: true,
      noNetworkSmokeChangeSignals: true,
      overallPassed: true
    });
    expect(report.coverage).toMatchObject({
      forbiddenPageSignalCount: 0,
      persistenceChangeSignalCount: 0,
      databaseBindingChangeSignalCount: 0,
      networkSmokeChangeSignalCount: 0
    });
    expect(report.issues).toEqual([]);
  });
});
