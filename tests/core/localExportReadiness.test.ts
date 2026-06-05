import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runLocalExportReadiness } from '../../src/core/release/localExportReadiness';

const report = runLocalExportReadiness();

describe('local export readiness contract', () => {
  it('passes the Phase 4.0 local export readiness gate', () => {
    expect(report.gates).toMatchObject({
      phase3ClosurePassed: true,
      readinessScriptExists: true,
      validateScriptRunsExportReadiness: true,
      exportReadinessContractDocExists: true,
      phase4StatusDocExists: true,
      localOnlyExportSurfacesDefined: true,
      noRawAnswerLeakageInShareCard: true,
      noFullResultSerializationExport: true,
      noActualImageExportImplementation: true,
      noBackendAiAuthPaymentPersistenceScope: true,
      allowedExportSurfaceUsesShareCardModel: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records export boundary docs, scripts, and allowed local surfaces', () => {
    expect(report.schemaVersion).toBe('phase-4.0-local-export-readiness-v1');
    expect(report.scripts.readinessExport).toBe('tsx scripts/local-export-readiness.ts');
    expect(report.scripts.validate).toContain('npm run readiness:export');
    expect(report.docs.exportReadinessContract).toBe('docs/release/phase-4-local-result-export-readiness-contract.md');
    expect(report.surfaces.allowedLocalExportSurfaces).toContain('future-local-image-export-from-share-card-only');
    expect(report.coverage).toMatchObject({
      checkedFileCount: 3,
      phase3ClosureIssueCount: 0,
      rawLeakageIssueCount: 0,
      implementationIssueCount: 0,
      blockedScopeIssueCount: 0
    });
  });

  it('keeps the share-card export surface free from raw answer leakage', () => {
    expect(report.privacy.rawAnswerLeakageSignals).toEqual([]);
    expect(report.privacy.serializationExportSignals).toEqual([]);
    expect(report.privacy.actualImageExportSignals).toEqual([]);
    expect(report.privacy.backendAiAuthPaymentPersistenceSignals).toEqual([]);
  });

  it('detects raw answer leakage in a candidate share card file', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    writeFileSync(
      path.join(tempRoot, 'src/features/results/resultShareCard.ts'),
      'export function leak(result: any) { return result.answers.map((answer: any) => answer.answerText).join(","); }\n'
    );
    writeFileSync(
      path.join(tempRoot, 'src/features/results/ResultsClient.tsx'),
      'import { buildLocalShareCardPreview } from "./resultShareCard"; export const value = buildLocalShareCardPreview;\n'
    );
    writeFileSync(path.join(tempRoot, 'src/app/results/page.tsx'), 'export default function ResultsPage(){ return null; }\n');

    const tempReport = runLocalExportReadiness({ repoRoot: tempRoot });

    expect(tempReport.gates.noRawAnswerLeakageInShareCard).toBe(false);
    expect(tempReport.issues.some((issue) => issue.startsWith('local_export_raw_answer_leakage:'))).toBe(true);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-local-export-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(path.join(tempRoot, 'src/features/results'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'src/app/results'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'docs/release'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'docs/ui'), { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'package.json'),
    JSON.stringify(
      {
        scripts: {
          validate: 'npm run readiness:export',
          'readiness:export': 'tsx scripts/local-export-readiness.ts'
        }
      },
      null,
      2
    )
  );
  writeFileSync(path.join(tempRoot, 'docs/release/phase-4-local-result-export-readiness-contract.md'), '# Contract\n');
  writeFileSync(path.join(tempRoot, 'docs/ui/phase-4-0-local-result-export-readiness-contract-status.md'), '# Status\n');
  return tempRoot;
}
