import { describe, expect, it } from 'vitest';
import {
  buildPublicResultDatabaseRouteRollbackFailureEvidenceReport,
  PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION
} from '../../src/core/public-link/publicResultDatabaseRouteRollbackFailureEvidence';

const report = await buildPublicResultDatabaseRouteRollbackFailureEvidenceReport();

describe('public result database route rollback/failure evidence', () => {
  it('records rollback and fail-closed evidence', () => {
    expect(report.schemaVersion).toBe(PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION);
    expect(report.defaultStatus).toBe('memory-adapter-selected-default');
    expect(report.rollbackStatus).toBe('memory-adapter-selected-rollback');
    expect(report.activeDatabaseStatus).toBe('database-adapter-selected-for-public-api-route');
    expect(report.rollbackEvidencePassed).toBe(true);
    expect(report.failClosedEvidencePassed).toBe(true);
    expect(report.missingEnvCreateStatus).toBe(500);
    expect(report.invalidEnvCreateStatus).toBe(500);
    expect(report.partialActivationCreateStatus).toBe(500);
  });

  it('models database route failure modes without public lookup activation', () => {
    expect(report.failureModeEvidencePassed).toBe(true);
    expect(report).toMatchObject({
      databaseUnavailableCreateStatus: 500,
      writeFailureCreateStatus: 500,
      readMissStatus: 404,
      deleteTokenMismatchStatus: 403,
      deleteFailureStatus: 500,
      publicLookupActivationAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      rawDeleteTokenPersisted: false,
      rawAnswersExposed: false
    });
    expect(report.issues).toEqual([]);
  });
});
