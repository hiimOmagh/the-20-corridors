import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_SCHEMA_VERSION,
  runPublicResultLookupPageImplementationGate
} from '../../src/core/release/publicResultLookupPageImplementationGate';

describe('public result lookup page implementation gate', () => {
  it('passes when the public lookup page is implemented behind activation and rollback guards', async () => {
    const report = await runPublicResultLookupPageImplementationGate();

    expect(report.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_SCHEMA_VERSION);
    expect(report.gateId).toBe(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID);
    expect(report.gates).toMatchObject({
      activationContractPassed: true,
      dryRunContractPassed: true,
      rollbackFailureEvidencePassed: true,
      implementationScriptExists: true,
      validateScriptRunsImplementationGate: true,
      implementationModuleExists: true,
      pageRouteExists: true,
      routeUsesImplementationResolver: true,
      defaultBehaviorSafeFallback: true,
      activationDecisionReady: true,
      rollbackBlocksLookup: true,
      activeRenderable: true,
      readMissNotFound: true,
      deletedUnavailable: true,
      expiredUnavailable: true,
      dtoOnlyRenderableResult: true,
      noRawAnswersExposed: true,
      noRawDeleteTokenExposed: true,
      noProductionNetworkLookupSmoke: true,
      noProductionMutationSmoke: true,
      noBlockedIntegrationSignals: true,
      overallPassed: true
    });
    expect(report.implementation).toMatchObject({
      routePath: 'src/app/r/(public)/[publicId]/page.tsx',
      activeStatus: 'public-result-page-renderable',
      activeHttpStatus: 200,
      readMissStatus: 'public-result-page-not-found',
      readMissHttpStatus: 404,
      deletedStatus: 'public-result-page-deleted-unavailable',
      deletedHttpStatus: 410,
      expiredStatus: 'public-result-page-expired-unavailable',
      expiredHttpStatus: 410,
      defaultStatus: 'public-result-page-disabled',
      rollbackStatus: 'public-result-page-disabled',
      networkLookupSmokeExecuted: false,
      productionMutationSmokeExecuted: false
    });
    expect(report.issues).toEqual([]);
  });
});
