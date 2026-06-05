import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_PHASE_2_SCOPE,
  REQUIRED_PUBLIC_EXPORTS,
  STILL_BLOCKED_PHASE_2_SCOPE,
  runPhase2Readiness
} from '../../src/core/release/phase2Readiness';

const report = runPhase2Readiness();

describe('Phase 2 readiness contract', () => {
  it('passes the repository-level Phase 2 readiness gates', () => {
    expect(report.gates).toMatchObject({
      engineReleaseGatePassed: true,
      closureReviewExists: true,
      uiReadinessContractExists: true,
      importBoundaryContractExists: true,
      transitionPlanExists: true,
      publicCoreEntrypointExists: true,
      publicEngineWrapperExists: true,
      publicTypesExist: true,
      readinessScriptExists: true,
      validateScriptRunsReadinessGate: true,
      transitionKeepsBackendAiBlocked: true,
      contractRequiresPublicApiOnly: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records the canonical Phase 2 transition scope', () => {
    expect(report.schemaVersion).toBe('phase-1.8-phase2-readiness-v1');
    expect(report.readinessId).toBe('phase-2-ui-readiness-contract');
    expect(report.allowedPhase2Scope).toEqual([...APPROVED_PHASE_2_SCOPE]);
    expect(report.stillBlockedScope).toEqual([...STILL_BLOCKED_PHASE_2_SCOPE]);
  });

  it('locks the UI-facing public API surface', () => {
    expect(report.publicApi.entrypoint).toBe('src/core/index.ts');
    expect(report.publicApi.requiredExports).toEqual([...REQUIRED_PUBLIC_EXPORTS]);
    expect(report.publicApi.forbiddenUiImports).toEqual([
      'src/core/methodology/',
      'src/core/scoring/',
      'src/core/report/',
      'src/core/audit/',
      'src/core/release/',
      'src/core/serialization/'
    ]);
  });

  it('fails when the readiness contract documents are missing', () => {
    const tempRoot = makeTempRepoRoot();
    const tempReport = runPhase2Readiness({ repoRoot: tempRoot });

    expect(tempReport.gates.uiReadinessContractExists).toBe(false);
    expect(tempReport.gates.transitionPlanExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('phase2_readiness_gate_failed:uiReadinessContractExists');
    expect(tempReport.issues).toContain('phase2_readiness_gate_failed:transitionPlanExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase2-readiness-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'package.json'),
    JSON.stringify(
      {
        scripts: {
          validate: 'npm run typecheck && npm test && npm run release:engine && npm run readiness:phase2',
          'release:engine': 'tsx scripts/engine-release-gate.ts',
          'readiness:phase2': 'tsx scripts/phase2-readiness.ts'
        }
      },
      null,
      2
    )
  );
  return tempRoot;
}
