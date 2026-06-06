import { describe, expect, it } from 'vitest';
import report from '../../docs/evidence/database-sdk-selection-decision-record-latest.json';

describe('database SDK selection decision record', () => {
  it('passes the Phase 8.4 SDK decision record gates', () => {
    expect(report.gates).toMatchObject({
      databaseClientConfigContractPassed: true,
      decisionScriptExists: true,
      validateScriptRunsDecisionRecord: true,
      decisionModuleExists: true,
      decisionGuardModuleExists: true,
      decisionDocExists: true,
      phase84StatusDocExists: true,
      providerDecisionRecordExists: true,
      selectedSdkDocumented: true,
      selectedSdkNotInstalled: true,
      selectedSdkNotImported: true,
      rejectedAlternativesDocumented: true,
      serverlessRuntimeAssumptionsDocumented: true,
      secretHandlingModelDocumented: true,
      failureModesDefined: true,
      databaseClientCreationStillBlocked: true,
      factoryStillCannotCreateDatabaseAdapter: true,
      routesRemainMemoryDryRun: true,
      noDatabaseSdkImportOrMigrationImplementation: true,
      noAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
  });

  it('records SDK decision, failure model, and implementation-boundary coverage', () => {
    expect(report.decision).toMatchObject({
      status: 'sdk-selected-contract-only',
      selectedProvider: 'postgresql',
      selectedSdkName: '@neondatabase/serverless',
      selectedRuntime: 'next-route-handlers-node-runtime',
      sdkInstallAllowed: false,
      sdkImportAllowed: false,
      databaseClientCreationAllowed: false,
      routeBindingAllowed: false,
      factoryBindingAllowed: false
    });
    expect(report.decision.rejectedAlternatives).toHaveLength(5);
    expect(report.decision.failureModes.map((item) => item.code)).toContain('database-unavailable');
    expect(report.decision.failureModes.map((item) => item.code)).toContain('delete-failure');
    expect(report.implementationScan.installedDatabasePackages).toEqual([]);
    expect(report.implementationScan.importedDatabaseSdkSignals).toEqual([]);
    expect(report.implementationScan.persistentPublicLookupRouteFiles).toEqual([]);
    expect(report.implementationScan.missingDecisionPhrases).toEqual([]);
    expect(report.coverage).toMatchObject({
      databaseClientConfigIssueCount: 0,
      decisionRuleCount: 10,
      rejectedAlternativeCount: 5,
      failureModeCount: 9,
      securityRuleCount: 9,
      blockedPathCount: 0,
      installedDatabasePackageCount: 0,
      importedDatabaseSdkSignalCount: 0,
      persistentRouteCount: 0
    });
  });
});
