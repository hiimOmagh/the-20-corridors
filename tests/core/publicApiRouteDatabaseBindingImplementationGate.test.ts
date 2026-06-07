import { describe, expect, it } from 'vitest';
import { runPublicApiRouteDatabaseBindingImplementationGate } from '../../src/core/release/publicApiRouteDatabaseBindingImplementationGate';

const report = await runPublicApiRouteDatabaseBindingImplementationGate();

describe('public API route database binding implementation gate', () => {
  it('passes the Phase 8.14 implementation gate', () => {
    expect(report.gates).toMatchObject({
      routeBindingActivationContractPassed: true,
      routeBindingDryRunContractPassed: true,
      defaultMemoryModePreserved: true,
      rollbackMemoryModePreserved: true,
      databaseBindingCanBeSelected: true,
      databaseModeAloneBlocked: true,
      missingImplementationFlagBlocked: true,
      publicLookupActivationStillBlocked: true,
      routeHandlersUseImplementationResolver: true,
      routeFlowDatabaseBindingSimulationPassed: true,
      noPersistentPublicLookupRoute: true,
      noProductionMutationSmoke: true,
      noNetworkQueryDuringSelection: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records API-only activation while keeping public page lookup separate', () => {
    expect(report.schemaVersion).toBe('phase-8.14-public-api-route-database-binding-implementation-gate-v1');
    expect(report.implementation.databaseStatus).toBe('database-adapter-selected-for-public-api-route');
    expect(report.implementation.routeBindingAppliedInDecision).toBe(true);
    expect(report.routeSimulation).toMatchObject({ createStatus: 201, readStatus: 200, deleteStatus: 200, readAfterDeleteStatus: 410 });
    expect(report.coverage.uniqueExecutedQueryIntentCount).toBeGreaterThanOrEqual(4);
  });
});
