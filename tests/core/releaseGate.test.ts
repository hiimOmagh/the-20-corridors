import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runEngineReleaseGate } from '../../src/core/release/releaseGate';

const report = runEngineReleaseGate();

describe('engine release gate', () => {
  it('passes the repository-level Phase 2 UI-scaffold release gates', () => {
    expect(report.gates).toMatchObject({
      methodologyAuditPassed: true,
      methodologyEvidenceCurrent: true,
      goldenSnapshotsCurrent: true,
      noForbiddenGeneratedArtifacts: true,
      approvedUiScopeAllowed: true,
      noBlockedBackendDatabaseAiScope: true,
      validateScriptRunsReleaseGate: true,
      releaseScriptExists: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records stable release-gate metadata and coverage facts', () => {
    expect(report.schemaVersion).toBe('phase-2.0-engine-release-gate-v1');
    expect(report.gateId).toBe('engine-release-gate-phase-2.0');
    expect(report.metadata.phaseScope).toBe('phase-2-ui-scaffold');
    expect(report.coverage).toMatchObject({
      triggeredContradictionCount: 7,
      contradictionRuleCount: 8,
      goldenProfileCount: 8,
      edgeCaseProfileCount: 8
    });
  });

  it('allows approved Phase 2 UI scaffold paths', () => {
    expect(report.hygiene.approvedUiScopeArtifacts).toEqual(
      expect.arrayContaining(['next.config.ts', 'next-env.d.ts', 'public', 'src/app', 'src/components', 'src/features'])
    );
    expect(report.hygiene.blockedScopeArtifacts).toEqual([]);
  });

  it('detects blocked backend/database/AI scope files', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/server'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/server/route.ts'), 'export function GET() { return Response.json({}); }\n');

    const tempReport = runEngineReleaseGate({ repoRoot: tempRoot });

    expect(tempReport.gates.noBlockedBackendDatabaseAiScope).toBe(false);
    expect(tempReport.hygiene.blockedScopeArtifacts).toContain('src/server');
    expect(tempReport.issues).toContain('blocked_scope_artifact:src/server');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects forbidden generated artifacts', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, '.next'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.next/build-id'), 'generated\n');

    const tempReport = runEngineReleaseGate({ repoRoot: tempRoot });

    expect(tempReport.gates.noForbiddenGeneratedArtifacts).toBe(false);
    expect(tempReport.hygiene.forbiddenGeneratedArtifacts).toContain('.next');
    expect(tempReport.issues).toContain('forbidden_generated_artifact:.next');

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
