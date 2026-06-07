import { describe, expect, it } from 'vitest';
import {
  PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_SCHEMA_VERSION,
  runPublicLookupOperationalRollbackDrillGate
} from '../../src/core/release/publicLookupOperationalRollbackDrill';

describe('public lookup operational rollback drill gate', () => {
  it('passes only when API persistence and public lookup rollback are proven together', async () => {
    const report = await runPublicLookupOperationalRollbackDrillGate();

    expect(report.schemaVersion).toBe(PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_SCHEMA_VERSION);
    expect(report.gates).toMatchObject({
      operationalSmokeEvidencePassed: true,
      drillScriptExists: true,
      validateScriptRunsRollbackDrill: true,
      drillOptInPassed: true,
      apiRouteBindingActiveBeforeRollback: true,
      publicLookupRenderableBeforeRollback: true,
      operationalSmokeGreenBeforeRollback: true,
      rollbackForcesApiRouteStorageToMemory: true,
      rollbackDisablesPublicLookupRendering: true,
      rollbackDoesNotExposeStaleDatabaseDto: true,
      unavailableStatesRemainDtoFreeAfterRollback: true,
      noRawAnswersExposed: true,
      noRawDeleteTokenExposed: true,
      noProductionNetworkLookupSmoke: true,
      noProductionMutationSmoke: true,
      overallPassed: true
    });
    expect(report.drill).toMatchObject({
      status: 'public-lookup-operational-rollback-drill-passed',
      apiRouteBeforeRollbackStatus: 'database-adapter-selected-for-public-api-route',
      publicLookupBeforeRollbackStatus: 'public-result-page-renderable',
      publicLookupBeforeRollbackHttpStatus: 200,
      apiRouteAfterRollbackStatus: 'memory-adapter-selected-rollback',
      publicLookupAfterRollbackStatus: 'public-result-page-disabled',
      publicLookupAfterRollbackHttpStatus: 503,
      networkLookupSmokeExecuted: false,
      productionNetworkLookupSmokeExecuted: false,
      productionMutationSmokeExecuted: false
    });
    expect(report.issues).toEqual([]);
  });
});
