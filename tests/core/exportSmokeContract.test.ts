import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runExportSmokeContract } from '../../src/core/release/exportSmokeContract';

const report = runExportSmokeContract();

describe('Phase 4.4 export smoke contract', () => {
  it('passes the export smoke contract for local share-card PNG export', () => {
    expect(report.gates).toMatchObject({
      localExportReadinessPassed: true,
      exportVisualQaPassed: true,
      smokeScriptExists: true,
      validateScriptRunsExportSmoke: true,
      exportSmokeStatusDocExists: true,
      phase4ClosureCriteriaDocExists: true,
      shareImageExportRuntimeExists: true,
      shareCardActionSurfaceExists: true,
      downloadContractVisibleInUi: true,
      localOnlyRuntimeSignalsPreserved: true,
      noRawAnswerLeakageInExportSmoke: true,
      noFullResultSerializationExport: true,
      noBackendAiAuthPaymentPersistenceScope: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records export smoke coverage and scripts', () => {
    expect(report.schemaVersion).toBe('phase-4.4-export-smoke-contract-v1');
    expect(report.scripts.smokeExport).toBe('tsx scripts/export-smoke-contract.ts');
    expect(report.scripts.validate).toContain('npm run smoke:export');
    expect(report.coverage).toMatchObject({
      localExportReadinessIssueCount: 0,
      exportVisualQaIssueCount: 0,
      checkedFileCount: 3,
      rawLeakageIssueCount: 0,
      blockedScopeIssueCount: 0
    });
    expect(report.coverage.runtimeSignalCount).toBe(report.surfaces.runtimeSignals.length);
    expect(report.coverage.uiSignalCount).toBe(report.surfaces.uiSignals.length);
  });

  it('detects missing export smoke script wiring', () => {
    const tempRoot = makeMinimalTempRepoRoot({ includeSmokeScript: false });
    const tempReport = runExportSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.smokeScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('export_smoke_gate_failed:smokeScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects raw-answer leakage in export surfaces', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    writeFileSync(
      path.join(tempRoot, 'src/features/results/resultShareImageExport.ts'),
      `${baseShareImageExportSource()}\nexport const leak = 'result.answers';\n`
    );

    const tempReport = runExportSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.noRawAnswerLeakageInExportSmoke).toBe(false);
    expect(tempReport.issues).toContain('export_smoke_raw_answer_leakage:result.answers');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(options: { includeSmokeScript?: boolean } = {}): string {
  const includeSmokeScript = options.includeSmokeScript ?? true;
  const tempRoot = path.join(os.tmpdir(), `t20-export-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const scripts: Record<string, string> = {
    validate: 'npm run readiness:export && npm run qa:export-visual',
    'readiness:export': 'tsx scripts/local-export-readiness.ts',
    'qa:export-visual': 'tsx scripts/export-visual-qa.ts'
  };
  if (includeSmokeScript) {
    scripts.validate += ' && npm run smoke:export';
    scripts['smoke:export'] = 'tsx scripts/export-smoke-contract.ts';
  }

  const files: Record<string, string> = {
    'package.json': JSON.stringify({ scripts }, null, 2),
    'docs/release/phase-4-local-result-export-readiness-contract.md': '# Contract\n',
    'docs/release/phase-4-export-visual-qa-download-contract.md': '# QA Contract\n',
    'docs/release/phase-4-closure-criteria.md': '# Closure Criteria\n',
    'docs/ui/phase-4-0-local-result-export-readiness-contract-status.md': '# Status\n',
    'docs/ui/phase-4-2-export-ux-hardening-failure-state-polish-status.md': '# Status\n',
    'docs/ui/phase-4-3-export-visual-qa-download-contract-status.md': '# Status\n',
    'docs/ui/phase-4-4-phase-4-closure-gate-export-smoke-contract-status.md': '# Status\n',
    'src/app/results/page.tsx': 'export default function ResultsPage(){ return null; }\n',
    'src/features/results/resultShareCard.ts': 'export const SHARE_CARD_COPY_BOUNDARY_NOTE = "local"; export interface LocalShareCardPreview { readonly title: string; readonly subtitle: string; readonly pattern: string; readonly signature: string; readonly traitLine: string; readonly mainTension: string; readonly confidence: string; readonly deepMotive: string; } export function buildLocalShareCardPreview(){ return { title: "The Observer Strategist", subtitle: "sub", pattern: "pattern", signature: "signature", traitLine: "traits", mainTension: "tension", confidence: "High", deepMotive: "Knowledge" }; }\n',
    'src/features/results/ResultsClient.tsx': baseResultsClientSource(),
    'src/features/results/resultShareImageExport.ts': baseShareImageExportSource()
  };

  for (const [file, source] of Object.entries(files)) {
    const absolutePath = path.join(tempRoot, file);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }

  return tempRoot;
}

function baseResultsClientSource(): string {
  return [
    'import { buildLocalShareCardPreview } from "./resultShareCard";',
    'import { exportLocalShareCardPng } from "./resultShareImageExport";',
    'function exportShareCardImage(){ return exportLocalShareCardPng(buildLocalShareCardPreview()); }',
    'export const ui = `Export PNG locally Copy card text Filename Size Capability Local PNG export details Local export privacy boundary PNG export is generated locally from this share-card summary only It does not export the answer list, full result JSON, or a public URL`;'
  ].join('\n');
}

function baseShareImageExportSource(): string {
  return [
    'import type { LocalShareCardPreview } from "./resultShareCard";',
    'export const LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION = "test";',
    'export const LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE = "Local PNG export only. No upload, account, public URL, or answer-level data.";',
    'export const LOCAL_SHARE_IMAGE_EXPORT_WIDTH = 1200;',
    'export const LOCAL_SHARE_IMAGE_EXPORT_HEIGHT = 1600;',
    'export function buildLocalShareCardExportSvg(card: LocalShareCardPreview){ return `<svg width="1200" height="1600" viewBox="0 0 1200 1600">The 20 Corridors Corridor signature Dominant traits Main tension Consistency Motive Local PNG export only. No upload, account, public URL, or answer-level data. &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; A &amp; B &lt; C &gt; D ${card.title}</svg>`; }',
    'export function buildLocalShareImageFileName(){ return "the-20-corridors-the-observer-strategist.png"; }',
    'export function buildLocalShareImageExportUxDetails(){}',
    'export function getLocalShareImageExportCapability(){}',
    'export function exportLocalShareCardPng(){ const canvas = document.createElement("canvas"); canvas.toBlob(() => null); new Blob(["svg"]); window.URL.createObjectURL(new Blob()); const anchor = document.createElement("a"); anchor.download = "test.png"; window.URL.revokeObjectURL("blob:test"); }'
  ].join('\n');
}
