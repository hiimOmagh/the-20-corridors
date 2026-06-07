import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_SCHEMA_VERSION,
  runPhase8PublicLookupReleaseClosureGate
} from '../../src/core/release/phase8PublicLookupReleaseClosureGate';

const report = runPhase8PublicLookupReleaseClosureGate();

describe('Phase 8 public lookup release closure gate', () => {
  it('passes the full Phase 8 closure gate', () => {
    expect(report.schemaVersion).toBe(PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_SCHEMA_VERSION);
    expect(report.gates).toMatchObject({
      closureScriptExists: true,
      validateScriptRunsPhase8ClosureGate: true,
      phase8ClosureDocExists: true,
      phase822StatusDocExists: true,
      phase9TransitionPlanExists: true,
      databaseAdapterEvidenceCurrent: true,
      apiRouteDatabaseBindingEvidenceCurrent: true,
      publicLookupEvidenceCurrent: true,
      operationalSmokeEvidenceCurrent: true,
      rollbackDrillEvidenceCurrent: true,
      allPhase8EvidenceCurrentAndPassed: true,
      publicLookupRouteImplementationExists: true,
      buildRouteListExpectedToIncludePublicLookup: true,
      rawAnswersRemainBlocked: true,
      rawDeleteTokensRemainBlocked: true,
      productionNetworkLookupSmokeDisabledByDefault: true,
      productionMutationSmokeDisabledByDefault: true,
      noBlockedIntegrationSignals: true,
      phase9TransitionScopeSeparated: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records evidence coverage across database, API, public lookup, and operations', () => {
    expect(report.coverage).toMatchObject({
      evidenceFileCount: 22,
      passedEvidenceFileCount: 22,
      databaseEvidenceCount: 11,
      apiRouteBindingEvidenceCount: 5,
      publicLookupEvidenceCount: 4,
      operationalEvidenceCount: 2,
      blockedIntegrationSignalCount: 0,
      rawAnswerSignalCount: 0,
      rawDeleteTokenSignalCount: 0
    });
    expect(report.evidence.map((item) => item.key)).toContain('public-lookup-rollback-drill');
    expect(report.evidence.every((item) => item.exists && item.passed)).toBe(true);
  });

  it('locks the closure and transition documents', () => {
    expect(report.docs).toMatchObject({
      phase8Closure: 'docs/release/phase-8-public-lookup-release-closure-gate.md',
      phase822Status: 'docs/ui/phase-8-22-public-lookup-release-closure-gate-status.md',
      phase9Transition: 'docs/ui/phase-9-transition-plan.md',
      phase8Transition: 'docs/ui/phase-8-transition-plan.md'
    });
    expect(report.scripts.closurePhase8).toBe('tsx scripts/phase8-public-lookup-release-closure-gate.ts');
    expect(report.scripts.validate).toContain('npm run closure:phase8');
  });

  it('detects missing Phase 8 closure wiring and evidence', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = runPhase8PublicLookupReleaseClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.allPhase8EvidenceCurrentAndPassed).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('gate_failed:closureScriptExists');
    expect(tempReport.issues.some((issue) => issue.startsWith('missing_evidence:docs/evidence/database-adapter-contract-latest.json'))).toBe(true);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase8-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
