import { describe, expect, it } from 'vitest';
import { runPublicResultLookupPagePreflightContract } from '../../src/core/release/publicResultLookupPagePreflightContract';

const report = await runPublicResultLookupPagePreflightContract();

describe('public result lookup page preflight contract', () => {
  it('passes the Phase 8.16 lookup preflight gate', () => {
    expect(report.gates).toMatchObject({
      apiRouteDatabaseBindingGatePassed: true,
      rollbackFailureEvidencePackPassed: true,
      publicLookupActivationFlagDefined: true,
      publicLookupPreflightFlagDefined: true,
      completeDatabaseEnvRequired: true,
      apiRouteBindingDoesNotActivatePublicLookup: true,
      apiRouteBindingWithoutPublicLookupAllowed: true,
      publicLookupDisabledByDefault: true,
      missingLookupFlagBlocked: true,
      pageContextBlocked: true,
      rollbackBlocksLookupPreflight: true,
      noPublicPageDatabaseRead: true,
      noPersistentPublicLookupRoute: true,
      noNetworkLookupSmoke: true,
      noProductionMutationSmoke: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records ready-but-disabled lookup preflight without applying page binding', () => {
    expect(report.schemaVersion).toBe('phase-8.16-public-result-lookup-page-preflight-contract-report-v1');
    expect(report.preflight.status).toBe('public-result-lookup-page-preflight-ready-but-disabled');
    expect(report.preflight.apiRouteBindingCanBeActiveWithoutPublicLookup).toBe(true);
    expect(report.preflight.actualPublicLookupPageBindingApplied).toBe(false);
    expect(report.preflight.publicPageDatabaseReadAllowed).toBe(false);
    expect(report.coverage.persistentRouteCount).toBe(0);
    expect(report.coverage.publicPageDatabaseReadSignalCount).toBe(0);
  });
});
