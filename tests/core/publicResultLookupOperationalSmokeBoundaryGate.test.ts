import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_SCHEMA_VERSION,
  runPublicResultLookupOperationalSmokeBoundaryGate
} from '../../src/core/release/publicResultLookupOperationalSmokeBoundary';

describe('public result lookup operational smoke boundary gate', () => {
  it('passes only with opt-in non-production smoke and disabled production network lookup', async () => {
    const report = await runPublicResultLookupOperationalSmokeBoundaryGate();

    expect(report.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_SCHEMA_VERSION);
    expect(report.gates).toMatchObject({
      implementationGateEvidencePassed: true,
      smokeScriptExists: true,
      validateScriptRunsSmokeBoundary: true,
      defaultSmokeBlocked: true,
      productionSmokeRejected: true,
      rollbackBlocksSmoke: true,
      missingInvalidEnvFailsClosed: true,
      optInSmokePassed: true,
      dtoOnlyRenderingVerified: true,
      unavailableStatesVerified: true,
      noRawAnswersExposed: true,
      noRawDeleteTokenExposed: true,
      networkSmokeDisabledByDefault: true,
      noProductionMutationSmoke: true,
      overallPassed: true
    });
    expect(report.smoke).toMatchObject({
      optInStatus: 'public-result-lookup-operational-smoke-passed',
      activeLookupStatus: 'public-result-page-renderable',
      activeLookupHttpStatus: 200,
      readMissStatus: 'public-result-page-not-found',
      readMissHttpStatus: 404,
      deletedStatus: 'public-result-page-deleted-unavailable',
      deletedHttpStatus: 410,
      expiredStatus: 'public-result-page-expired-unavailable',
      expiredHttpStatus: 410,
      networkLookupSmokeExecuted: false,
      productionNetworkLookupSmokeExecuted: false
    });
    expect(report.issues).toEqual([]);
  });
});
