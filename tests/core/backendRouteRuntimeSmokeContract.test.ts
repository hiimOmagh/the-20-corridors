import { describe, expect, it } from 'vitest';
import { runBackendRouteRuntimeSmokeContract } from '../../src/core/release/backendRouteRuntimeSmokeContract';
const report = await runBackendRouteRuntimeSmokeContract();
describe('backend route runtime smoke contract', () => {
  it('passes the Phase 7.4 runtime route smoke gates', () => {
    expect(report.gates).toMatchObject({ backendRouteHandlersContractPassed: true, runtimeSmokeScriptExists: true, validateScriptRunsRuntimeSmoke: true, runtimeSmokeContractDocExists: true, phase74StatusDocExists: true, phase7ClosureCriteriaDocExists: true, actualRouteFilesExist: true, routeFilesUseRouteHelperLayer: true, createReadDeleteRuntimeFlowPassed: true, statusMappingPreserved: true, dtoOnlyRuntimeResponsesPreserved: true, deleteTokenTransportPreserved: true, responseHeadersPreserveDryRunMode: true, malformedCreateHandled: true, unknownReadHandled: true, noRawAnswerOrFullResultTransport: true, noDatabaseAuthPaymentAiAnalyticsImplementation: true, noPersistentPublicLookupRoute: true, routeRuntimeSmokePreparesPhase7Closure: true, overallPassed: true });
    expect(report.issues).toEqual([]);
  });
  it('records runtime status mapping and route-helper alignment', () => {
    expect(report.schemaVersion).toBe('phase-7.4-backend-route-runtime-smoke-v1');
    expect(report.scripts.runtimeSmoke).toBe('tsx scripts/backend-route-runtime-smoke-contract.ts');
    expect(report.scripts.validate).toContain('npm run smoke:backend-routes');
    expect(report.routes.helperSignals).toEqual(['handlePublicResultCreateRouteBody', 'handlePublicResultReadRoute', 'handlePublicResultDeleteRouteBody']);
    expect(report.runtimeFlow).toMatchObject({ createStatus: 201, readStatus: 200, wrongDeleteStatus: 403, deleteStatus: 200, readAfterDeleteStatus: 410, malformedCreateStatus: 400, unknownReadStatus: 404, createHeaderMode: 'next-route-files-dry-run-in-memory-only', readHeaderMode: 'next-route-files-dry-run-in-memory-only', deleteHeaderMode: 'next-route-files-dry-run-in-memory-only' });
  });
  it('preserves DTO-only response and delete-token transport boundaries', () => {
    expect(report.responseSafety.createKeys).toEqual(['deleteToken', 'dto', 'expiresAt', 'publicId', 'publicPath', 'schemaVersion']);
    expect(report.responseSafety.readKeys).toEqual(['dto', 'expiresAt', 'publicId', 'schemaVersion', 'status']);
    expect(report.responseSafety.deleteKeys).toEqual(['publicId', 'schemaVersion', 'status']);
    expect(report.responseSafety).toMatchObject({ createIncludesDeleteToken: true, readIncludesDeleteToken: false, deleteIncludesDeleteToken: false, readAfterDeleteDtoIsNull: true });
  });
  it('keeps implementation scope clean for Phase 7 closure', () => {
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.persistentPublicLookupRouteFiles).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
    expect(report.coverage).toMatchObject({ backendRouteHandlersIssueCount: 0, runtimeStatusCodeCount: 7, routeFileCount: 2 });
  });
});
