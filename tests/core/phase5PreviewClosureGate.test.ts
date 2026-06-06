import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPhase5PreviewClosureGate } from '../../src/core/release/phase5PreviewClosureGate';

const report = runPhase5PreviewClosureGate();

describe('Phase 5 public-link preview closure gate', () => {
  it('passes the formal Phase 5 preview closure gate', () => {
    expect(report.gates).toMatchObject({
      phase4ClosurePassed: true,
      publicLinkPrivacyPassed: true,
      publicResultDtoContractPassed: true,
      publicLinkPreviewContractPassed: true,
      closureScriptExists: true,
      validateScriptRunsPhase5ClosureGate: true,
      validateScriptRunsPublicLinkPrivacy: true,
      validateScriptRunsPublicResultDto: true,
      validateScriptRunsPublicLinkPreview: true,
      phase5ClosureReviewDocExists: true,
      phase6TransitionDocExists: true,
      dtoOnlyPreviewScopePreserved: true,
      localPreviewRouteOnly: true,
      noPersistentPublicIdLookupScope: true,
      noBackendApiDatabaseAuthPaymentAiScope: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records preview closure metadata, scripts, and coverage', () => {
    expect(report.schemaVersion).toBe('phase-5.4-preview-closure-gate-v1');
    expect(report.scripts.privacyPublicLink).toBe('tsx scripts/public-link-privacy.ts');
    expect(report.scripts.contractPublicDto).toBe('tsx scripts/public-result-dto-contract.ts');
    expect(report.scripts.previewPublicLink).toBe('tsx scripts/public-link-preview-contract.ts');
    expect(report.scripts.closurePhase5).toBe('tsx scripts/phase5-preview-closure-gate.ts');
    expect(report.scripts.validate).toContain('npm run closure:phase5');
    expect(report.coverage).toMatchObject({
      phase4IssueCount: 0,
      privacyIssueCount: 0,
      dtoIssueCount: 0,
      previewIssueCount: 0,
      previewRouteCount: 1,
      previewDtoKeyCount: 13,
      previewSectionCount: 4,
      checkedPreviewFileCount: 4,
      blockedSignalCount: 0,
      persistentRouteFileCount: 0
    });
  });

  it('locks the closure review and Phase 6 transition documents', () => {
    expect(report.docs.phase5ClosureReview).toBe('docs/release/phase-5-preview-closure-review.md');
    expect(report.docs.phase6Transition).toBe('docs/ui/phase-6-transition-plan.md');
    expect(report.files.previewRoute).toBe('src/app/r/preview/page.tsx');
  });

  it('detects missing Phase 5 closure script wiring', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = runPhase5PreviewClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('phase5_preview_closure_gate_failed:closureScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase5-preview-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
