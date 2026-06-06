import { describe, expect, it } from 'vitest';
import { runPublicResultDtoContract } from '../../src/core/release/publicResultDtoContract';

const report = runPublicResultDtoContract();

describe('public result DTO builder contract', () => {
  it('passes all Phase 5.1 DTO contract gates', () => {
    expect(report.gates).toMatchObject({
      publicLinkPrivacyPassed: true,
      dtoBuilderExists: true,
      dtoContractScriptExists: true,
      validateScriptRunsDtoContract: true,
      dtoStatusDocExists: true,
      dtoContractDocExists: true,
      dtoShapeIsMinimized: true,
      dtoExcludesForbiddenFields: true,
      dtoUsesPublicEngineResultOnly: true,
      noPublicRouteYet: true,
      noBackendDatabaseAuthPaymentAi: true,
      noRawAnswerLeakage: true,
      noFullResultSerializationExport: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records minimized DTO coverage and implementation boundaries', () => {
    expect(report.coverage.allowedKeyCount).toBeGreaterThanOrEqual(10);
    expect(report.coverage.forbiddenKeyCount).toBeGreaterThanOrEqual(10);
    expect(report.coverage.sampleAxisSummaryCount).toBe(6);
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.rawLeakSignals).toEqual([]);
    expect(report.implementationScan.fullSerializationSignals).toEqual([]);
  });
});
