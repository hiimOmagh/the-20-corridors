import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPhase4ClosureGate } from '../../src/core/release/phase4ClosureGate';

const report = runPhase4ClosureGate();

describe('Phase 4 closure gate', () => {
  it('passes the formal Phase 4 closure gate', () => {
    expect(report.gates).toMatchObject({
      phase3ClosurePassed: true,
      localExportReadinessPassed: true,
      exportVisualQaPassed: true,
      exportSmokeContractPassed: true,
      closureScriptExists: true,
      validateScriptRunsPhase4ClosureGate: true,
      validateScriptRunsExportSmoke: true,
      phase4ClosureReviewDocExists: true,
      phase5TransitionDocExists: true,
      localOnlyExportScopePreserved: true,
      noFullResultSerializationExportScope: true,
      noBackendAiAuthPaymentPersistenceScope: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records closure metadata, scripts, and export smoke coverage', () => {
    expect(report.schemaVersion).toBe('phase-4.4-closure-gate-v1');
    expect(report.scripts.smokeExport).toBe('tsx scripts/export-smoke-contract.ts');
    expect(report.scripts.closurePhase4).toBe('tsx scripts/phase4-closure-gate.ts');
    expect(report.scripts.validate).toContain('npm run closure:phase4');
    expect(report.coverage).toMatchObject({
      readinessIssueCount: 0,
      visualQaIssueCount: 0,
      exportSmokeIssueCount: 0,
      phase3ClosureIssueCount: 0,
      checkedExportFileCount: 3
    });
    expect(report.coverage.exportRuntimeSignalCount).toBeGreaterThanOrEqual(10);
    expect(report.coverage.exportUiSignalCount).toBeGreaterThanOrEqual(9);
  });

  it('locks the closure review and Phase 5 transition documents', () => {
    expect(report.docs.phase4ClosureReview).toBe('docs/release/phase-4-closure-review.md');
    expect(report.docs.phase5Transition).toBe('docs/ui/phase-5-transition-plan.md');
  });

  it('detects missing Phase 4 closure script wiring', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = runPhase4ClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('phase4_closure_gate_failed:closureScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase4-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
