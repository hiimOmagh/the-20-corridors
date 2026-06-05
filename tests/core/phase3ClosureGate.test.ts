import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPhase3ClosureGate } from '../../src/core/release/phase3ClosureGate';

const report = runPhase3ClosureGate();

describe('Phase 3 closure gate', () => {
  it('passes the formal Phase 3 closure gate', () => {
    expect(report.gates).toMatchObject({
      phase2ClosurePassed: true,
      visualSmokeContractPassed: true,
      closureScriptExists: true,
      validateScriptRunsPhase3ClosureGate: true,
      validateScriptRunsVisualSmoke: true,
      phase3ClosureReviewDocExists: true,
      phase4TransitionDocExists: true,
      localOnlyVisualScopePreserved: true,
      noBackendAiExportScope: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records closure metadata, scripts, and visual smoke coverage', () => {
    expect(report.schemaVersion).toBe('phase-3.6-closure-gate-v1');
    expect(report.scripts.smokeVisual).toBe('tsx scripts/visual-smoke-contract.ts');
    expect(report.scripts.closurePhase3).toBe('tsx scripts/phase3-closure-gate.ts');
    expect(report.coverage).toMatchObject({
      visualFileCount: expect.any(Number),
      visualSmokeIssueCount: 0,
      phase2ClosureIssueCount: 0,
      visualIdentityTokenCount: expect.any(Number),
      reducedMotionRuleCount: expect.any(Number)
    });
  });

  it('locks the closure and Phase 4 transition documents', () => {
    expect(report.docs.phase3ClosureReview).toBe('docs/release/phase-3-closure-review.md');
    expect(report.docs.phase4Transition).toBe('docs/ui/phase-4-transition-plan.md');
  });

  it('detects missing Phase 3 closure scripts and docs', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = runPhase3ClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.phase3ClosureReviewDocExists).toBe(false);
    expect(tempReport.issues).toContain('phase3_closure_gate_failed:closureScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase3-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
