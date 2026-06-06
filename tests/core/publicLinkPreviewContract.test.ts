import { describe, expect, it } from 'vitest';
import { runPublicLinkPreviewContract } from '@/core/release/publicLinkPreviewContract';

const report = runPublicLinkPreviewContract();

describe('public-link preview contract', () => {
  it('passes the Phase 5.3 local public-link preview polish gates', () => {
    expect(report.gates).toMatchObject({
      publicDtoContractPassed: true,
      previewScriptExists: true,
      validateScriptRunsPreviewContract: true,
      previewRouteExists: true,
      previewClientExists: true,
      previewHelperExists: true,
      resultPageLinksToPreview: true,
      routeRequiredSignalsPresent: true,
      clientRequiredSignalsPresent: true,
      helperRequiredSignalsPresent: true,
      localDtoPreviewPassed: true,
      rawAnswerPreviewLeakageAbsent: true,
      noBackendDatabaseApiLookupSignals: true,
      statusDocExists: true,
      publicPreviewSectionModelPassed: true,
      stateCopyPolishPassed: true,
      routeSmokeUpgradePassed: true,
      overallPassed: true
    });
  });

  it('records preview route, minimized DTO coverage, and polish model coverage', () => {
    expect(report.schemaVersion).toBe('phase-5.3-public-link-preview-v1');
    expect(report.metadata.route).toBe('/r/preview');
    expect(report.samplePreview.axisSummaryCount).toBe(6);
    expect(report.samplePreview.dtoKeyCount).toBe(13);
    expect(report.samplePreview.sectionCount).toBe(4);
    expect(report.samplePreview.metricCount).toBe(4);
    expect(report.signalScan.forbiddenPrivateKeyCount).toBe(0);
  });
});
