import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPublicResultApiBoundaryContract } from '../../src/core/release/publicResultApiBoundaryContract';

const report = await runPublicResultApiBoundaryContract();

describe('backend API boundary contract', () => {
  it('passes the Phase 7.0 backend API boundary gates', () => {
    expect(report.gates).toMatchObject({
      phase6ClosurePassed: true,
      publicStorageContractPassed: true,
      apiBoundaryScriptExists: true,
      validateScriptRunsApiBoundaryContract: true,
      apiBoundaryModuleExists: true,
      apiBoundaryDocExists: true,
      phase70StatusDocExists: true,
      createDtoContractDefined: true,
      readDtoContractDefined: true,
      deleteDtoContractDefined: true,
      errorDtoContractDefined: true,
      publicLookupResponseMinimized: true,
      deleteTokenTransportRulesDefined: true,
      expirySemanticsDefined: true,
      abuseControlExpectationsDefined: true,
      noActualApiRouteYet: true,
      noDatabaseBackendAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRouteYet: true,
      noRawAnswerOrPrivateScoreLeakage: true,
      noFullResultSerializationTransport: true,
      samplePayloadWithinSizeLimit: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records endpoint, token, expiry, abuse-control, and implementation-boundary coverage', () => {
    expect(report.schemaVersion).toBe('phase-7.0-backend-api-boundary-contract-v1');
    expect(report.scripts.apiBoundaryContract).toBe('tsx scripts/backend-api-boundary-contract.ts');
    expect(report.scripts.validate).toContain('npm run contract:backend-api');
    expect(report.apiContract.allowedEndpoints).toHaveLength(3);
    expect(report.apiContract.allowedMethods).toEqual(['POST', 'GET', 'DELETE']);
    expect(report.apiContract.deleteTokenTransport).toBe('response-on-create-request-on-delete-only');
    expect(report.apiContract.defaultExpiryDays).toBe(30);
    expect(report.coverage).toMatchObject({
      phase6IssueCount: 0,
      storageIssueCount: 0,
      endpointCount: 3,
      methodCount: 3,
      deleteTokenRuleCount: 5,
      expiryRuleCount: 5,
      abuseExpectationCount: 7,
      implementationBoundaryCount: 5
    });
    expect(report.coverage.samplePayloadBytes).toBeLessThanOrEqual(report.apiContract.maxDtoBytes);
  });

  it('keeps the contract-only implementation boundary locked', () => {
    expect(report.docs.apiBoundaryContract).toBe('docs/release/phase-7-backend-api-boundary-contract.md');
    expect(report.docs.phase70Status).toBe('docs/ui/phase-7-0-backend-api-boundary-contract-status.md');
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.persistentLookupRouteFiles).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.fullResultTransportSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects missing backend API contract script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runPublicResultApiBoundaryContract({ repoRoot: tempRoot });

    expect(tempReport.gates.apiBoundaryScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('missing_contract_backend_api_script');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase7-api-boundary-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
