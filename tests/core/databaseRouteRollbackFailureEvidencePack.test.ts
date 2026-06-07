import { describe, expect, it } from 'vitest';
import { runDatabaseRouteRollbackFailureEvidencePack } from '../../src/core/release/databaseRouteRollbackFailureEvidencePack';

const report = await runDatabaseRouteRollbackFailureEvidencePack();

describe('database route rollback and failure-mode evidence pack', () => {
  it('passes the Phase 8.15 evidence pack', () => {
    expect(report.gates).toMatchObject({
      apiRouteDatabaseBindingGatePassed: true,
      rollbackFailureScriptExists: true,
      rollbackFailureCoreModuleExists: true,
      rollbackFailureReleaseModuleExists: true,
      rollbackFailureDocExists: true,
      rollbackFailureStatusDocExists: true,
      validateRunsRollbackFailureEvidence: true,
      routeHandlersNormalizeStorageFailures: true,
      databaseAdapterDeleteFailureThrowsAfterVerifiedToken: true,
      rollbackEvidencePassed: true,
      missingEnvFailsClosed: true,
      invalidEnvFailsClosed: true,
      partialActivationFailsClosed: true,
      databaseUnavailableModeled: true,
      writeFailureModeled: true,
      readMissModeled: true,
      deleteTokenMismatchModeled: true,
      deleteFailureModeled: true,
      publicLookupStillBlocked: true,
      noProductionMutationSmoke: true,
      noNetworkQueryExecution: true,
      noRawDeleteTokenPersistence: true,
      noRawAnswersExposure: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('keeps coverage focused on rollback and failure modes', () => {
    expect(report.coverage.failureModeCount).toBeGreaterThanOrEqual(8);
    expect(report.coverage.uniqueExecutedQueryIntentCount).toBeGreaterThanOrEqual(3);
    expect(report.coverage.persistentRouteCount).toBe(0);
    expect(report.coverage.blockedIntegrationSignalCount).toBe(0);
  });
});
