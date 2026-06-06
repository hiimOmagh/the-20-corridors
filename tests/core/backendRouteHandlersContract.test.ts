import { describe, expect, it } from 'vitest';
import { runBackendRouteHandlersContract } from '../../src/core/release/backendRouteHandlersContract';

const report = await runBackendRouteHandlersContract();

describe('backend route handlers contract', () => {
  it('passes the Phase 7.3 actual route-file dry-run gates', () => {
    expect(report.gates).toMatchObject({
      backendHandlerDryRunContractPassed: true,
      routeHandlerScriptExists: true,
      validateScriptRunsRouteHandlerContract: true,
      routeHandlerModuleExists: true,
      routeHandlerContractDocExists: true,
      phase73StatusDocExists: true,
      approvedRouteFilesExist: true,
      routeFilesExportExpectedMethods: true,
      routeFilesUseDryRunRouteHelpers: true,
      routeHelpersRunCreateReadDeleteFlow: true,
      invalidDeleteTokenHandled: true,
      dtoOnlyResponsesPreserved: true,
      routeResponseStatusCodesMapped: true,
      noDatabaseAuthPaymentAiAnalyticsImplementation: true,
      noRawAnswerOrFullResultTransport: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records route files, methods, and dry-run HTTP-like status mapping', () => {
    expect(report.schemaVersion).toBe('phase-7.3-backend-route-handlers-contract-v1');
    expect(report.scripts.routeHandlerContract).toBe('tsx scripts/backend-route-handlers-contract.ts');
    expect(report.scripts.validate).toContain('npm run routes:backend-handlers');
    expect(report.routes.exportedMethodSignals).toEqual([
      'export async function POST',
      'export async function GET',
      'export async function DELETE'
    ]);
    expect(report.routes.routeHelperSignals).toEqual([
      'handlePublicResultCreateRouteBody',
      'handlePublicResultReadRoute',
      'handlePublicResultDeleteRouteBody'
    ]);
    expect(report.dryRunRouteFlow).toMatchObject({
      mode: 'next-route-files-dry-run-in-memory-only',
      createStatus: 201,
      readStatus: 200,
      wrongDeleteStatus: 403,
      deleteStatus: 200,
      readAfterDeleteStatus: 410
    });
  });

  it('keeps the implementation surface DTO-only and local-memory only', () => {
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
    expect(report.coverage).toMatchObject({
      dryRunContractIssueCount: 0,
      routeFileCount: 2
    });
    expect(report.coverage.routeHandlerBoundaryCount).toBeGreaterThanOrEqual(8);
  });
});
