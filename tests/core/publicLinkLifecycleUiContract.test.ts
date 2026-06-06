import { describe, expect, it } from 'vitest';
import { runPublicLinkLifecycleUiContract } from '../../src/core/release/publicLinkLifecycleUiContract';

const report = await runPublicLinkLifecycleUiContract();

describe('public link lifecycle UI contract', () => {
  it('passes all Phase 6.3 lifecycle UI gates', () => {
    expect(report.gates).toMatchObject({
      localFlowContractPassed: true,
      uiHelperExists: true,
      resultsClientExists: true,
      lifecycleScriptExists: true,
      validateScriptRunsLifecycleUi: true,
      statusDocExists: true,
      lifecycleSectionRendered: true,
      lifecycleControlsRendered: true,
      usesLocalPreviewRouteOnly: true,
      noApiDatabasePersistentRoute: true,
      noAuthPaymentAiAnalytics: true,
      noNetworkOrBrowserPersistenceSignals: true,
      noRawChoiceOrPrivateScoreSignals: true,
      overallPassed: true
    });
  });

  it('records the expected local-only implementation coverage', () => {
    expect(report.implementationScan.checkedFiles).toContain('src/features/results/publicLinkLifecycleUi.ts');
    expect(report.implementationScan.checkedFiles).toContain('src/features/results/ResultsClient.tsx');
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.blockedSignals).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.networkOrPersistenceSignals).toEqual([]);
    expect(report.coverage.requiredUiSignalCount).toBeGreaterThanOrEqual(8);
  });
});
