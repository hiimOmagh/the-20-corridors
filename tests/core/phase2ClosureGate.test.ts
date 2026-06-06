import { describe, expect, it } from 'vitest';
import { runPhase2ClosureGate } from '../../src/core/release/phase2ClosureGate';

const report = runPhase2ClosureGate();

describe('Phase 2 closure gate', () => {
  it('passes the formal Phase 2 closure gate', () => {
    expect(report.gates).toMatchObject({
      phase2ReadinessPassed: true,
      uiSmokeContractPassed: true,
      closureScriptExists: true,
      validateScriptRunsClosureGate: true,
      validateScriptRunsUiSmoke: true,
      closureReviewDocExists: true,
      phase3TransitionDocExists: true,
      localOnlyScopePreserved: true,
      noBlockedScopeArtifacts: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records closure metadata, scripts, and smoke coverage', () => {
    expect(report.schemaVersion).toBe('phase-2.8-closure-gate-v1');
    expect(report.closureId).toBe('phase-2-closure-gate');
    expect(report.metadata.phaseScope).toBe('phase-2-closure');
    expect(report.scripts.validate).toContain('npm run smoke:ui');
    expect(report.scripts.validate).toContain('npm run closure:phase2');
    expect(report.scripts.smokeUi).toBe('tsx scripts/ui-smoke-contract.ts');
    expect(report.scripts.closurePhase2).toBe('tsx scripts/phase2-closure-gate.ts');
    expect(report.coverage).toMatchObject({
      smokeRouteCount: 4,
      uiSmokeIssueCount: 0,
      readinessIssueCount: 0
    });
  });

  it('locks the closure and Phase 3 transition documents', () => {
    expect(report.docs.closureReview).toBe('docs/release/phase-2-closure-review.md');
    expect(report.docs.phase3Transition).toBe('docs/ui/phase-3-transition-plan.md');
  });
});
