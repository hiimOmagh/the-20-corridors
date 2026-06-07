import { describe, expect, it } from 'vitest';
import {
  PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_ID,
  PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_SCHEMA_VERSION,
  runPhase9PublicResultPageUxCopyPolishGate
} from '../../src/core/release/phase9PublicResultPageUxCopyPolish';

describe('phase 9 public result page UX copy polish gate', () => {
  it('passes when public page copy is polished without persistence or smoke changes', () => {
    const report = runPhase9PublicResultPageUxCopyPolishGate();

    expect(report.schemaVersion).toBe(PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_SCHEMA_VERSION);
    expect(report.gateId).toBe(PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_ID);
    expect(report.gates).toMatchObject({
      gateScriptExists: true,
      gateModuleExists: true,
      copyModuleExists: true,
      pageRouteExists: true,
      copyTestsExist: true,
      gateTestsExist: true,
      packageScriptExists: true,
      validateRunsPhase9CopyGate: true,
      phase8ClosureEvidenceCurrent: true,
      phase9StatusDocExists: true,
      phase9ReleaseDocExists: true,
      phase9TransitionPlanUpdated: true,
      pageUsesCopyBuilder: true,
      pageExposesCopyToneAttribute: true,
      renderableCopyPolished: true,
      notFoundCopyPolished: true,
      deletedCopyPolished: true,
      expiredCopyPolished: true,
      disabledRollbackCopyPolished: true,
      configurationCopyPolished: true,
      storageUnavailableCopyPolished: true,
      rawAnswersRemainBlocked: true,
      rawDeleteTokensRemainBlocked: true,
      noPersistenceChangeSignals: true,
      noNetworkSmokeChangeSignals: true,
      overallPassed: true
    });
    expect(report.coverage).toMatchObject({
      forbiddenPageSignalCount: 0,
      persistenceChangeSignalCount: 0,
      networkSmokeChangeSignalCount: 0
    });
    expect(report.issues).toEqual([]);
  });
});
