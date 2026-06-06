import { describe, expect, it } from 'vitest';
import { runPublicLinkPreviewContract } from '@/core/release/publicLinkPreviewContract';

const report = runPublicLinkPreviewContract();

describe('public-link preview contract', () => {
  it('passes the Phase 5.2 local public-link preview gates', () => {
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
      overallPassed: true
    });
  });

  it('records preview route and minimized DTO coverage', () => {
    expect(report.metadata.route).toBe('/r/preview');
    expect(report.samplePreview.axisSummaryCount).toBe(6);
    expect(report.samplePreview.dtoKeyCount).toBe(13);
    expect(report.signalScan.forbiddenPrivateKeyCount).toBe(0);
  });
});
