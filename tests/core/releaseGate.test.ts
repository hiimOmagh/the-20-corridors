import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runEngineReleaseGate } from '../../src/core/release/releaseGate';

const report = runEngineReleaseGate();

describe('engine release gate', () => {
  it('passes the repository-level pre-UI engine release gates', () => {
    expect(report.gates).toMatchObject({
      methodologyAuditPassed: true,
      methodologyEvidenceCurrent: true,
      goldenSnapshotsCurrent: true,
      noForbiddenGeneratedArtifacts: true,
      noPrematureUiBackendAiScope: true,
      validateScriptRunsReleaseGate: true,
      releaseScriptExists: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records stable release-gate metadata and coverage facts', () => {
    expect(report.schemaVersion).toBe('phase-1.7-engine-release-gate-v1');
    expect(report.gateId).toBe('engine-release-gate-phase-1.7');
    expect(report.coverage).toMatchObject({
      triggeredContradictionCount: 7,
      contradictionRuleCount: 8,
      goldenProfileCount: 8,
      edgeCaseProfileCount: 8
    });
  });

  it('detects premature UI/backend/AI scope files', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/app'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/app/page.tsx'), 'export default function Page() { return null; }\n');

    const tempReport = runEngineReleaseGate({ repoRoot: tempRoot });

    expect(tempReport.gates.noPrematureUiBackendAiScope).toBe(false);
    expect(tempReport.hygiene.prematureScopeArtifacts).toContain('src/app');
    expect(tempReport.issues).toContain('premature_scope_artifact:src/app');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects forbidden generated artifacts', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'dist'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'dist/output.js'), 'console.log("generated");\n');

    const tempReport = runEngineReleaseGate({ repoRoot: tempRoot });

    expect(tempReport.gates.noForbiddenGeneratedArtifacts).toBe(false);
    expect(tempReport.hygiene.forbiddenGeneratedArtifacts).toContain('dist');
    expect(tempReport.issues).toContain('forbidden_generated_artifact:dist');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-release-gate-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'package.json'),
    JSON.stringify(
      {
        scripts: {
          validate: 'npm run typecheck && npm test && npm run release:engine',
          'release:engine': 'tsx scripts/engine-release-gate.ts'
        }
      },
      null,
      2
    )
  );
  return tempRoot;
}
