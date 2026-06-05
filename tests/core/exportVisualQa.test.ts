import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runExportVisualQa } from '../../src/core/release/exportVisualQa';

const report = runExportVisualQa();

describe('Phase 4.3 export visual QA and download contract', () => {
  it('passes the visual QA gate for local share-card image export', () => {
    expect(report.gates).toMatchObject({
      localExportReadinessPassed: true,
      qaScriptExists: true,
      validateScriptRunsExportVisualQa: true,
      qaContractDocExists: true,
      phase43StatusDocExists: true,
      phase4ClosureCriteriaPrepared: true,
      shareImageExportFileExists: true,
      svgDimensionsCorrect: true,
      svgViewBoxCorrect: true,
      svgContainsRequiredLabels: true,
      svgContainsBoundaryNote: true,
      svgEscapesUnsafeText: true,
      svgDoesNotExposeRawAnswers: true,
      downloadFilenameContractStable: true,
      localOnlyBehaviorPreserved: true,
      noBackendAiAuthPaymentPersistenceScope: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records SVG, download, privacy, and coverage metadata', () => {
    expect(report.schemaVersion).toBe('phase-4.3-export-visual-qa-v1');
    expect(report.metadata.exportMode).toBe('local-share-card-image-export-visual-qa');
    expect(report.scripts.exportVisualQa).toBe('tsx scripts/export-visual-qa.ts');
    expect(report.scripts.validate).toContain('npm run qa:export-visual');
    expect(report.visual).toMatchObject({
      width: 1200,
      height: 1600,
      viewBox: '0 0 1200 1600',
      missingLabels: []
    });
    expect(report.visual.requiredLabels).toContain('Corridor signature');
    expect(report.visual.requiredLabels).toContain('Dominant traits');
    expect(report.visual.boundaryNote).toContain('Local PNG export only');
    expect(report.download).toMatchObject({
      sampleTitle: 'The Observer Strategist',
      expectedFileName: 'the-20-corridors-the-observer-strategist.png',
      actualFileName: 'the-20-corridors-the-observer-strategist.png',
      stable: true
    });
    expect(report.coverage).toMatchObject({
      localExportReadinessIssueCount: 0,
      missingLabelCount: 0,
      rawLeakageIssueCount: 0,
      blockedScopeIssueCount: 0
    });
    expect(report.coverage.localOnlySignalCount).toBeGreaterThanOrEqual(6);
  });

  it('detects missing QA contract documentation in a candidate repo', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    rmSync(path.join(tempRoot, 'docs/release/phase-4-export-visual-qa-download-contract.md'), { force: true });

    const tempReport = runExportVisualQa({ repoRoot: tempRoot });

    expect(tempReport.gates.qaContractDocExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('export_visual_qa_gate_failed:qaContractDocExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects blocked network or persistence signals in export implementation', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    writeFileSync(
      path.join(tempRoot, 'src/features/results/resultShareImageExport.ts'),
      `${baseShareImageExportSource()}\nexport function leak(){ return fetch('/api/export'); }\n`
    );

    const tempReport = runExportVisualQa({ repoRoot: tempRoot });

    expect(tempReport.gates.noBackendAiAuthPaymentPersistenceScope).toBe(false);
    expect(tempReport.issues).toContain('export_visual_qa_blocked_scope:fetch(');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-export-qa-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const files: Record<string, string> = {
    'package.json': JSON.stringify({ scripts: { validate: 'npm run readiness:export && npm run qa:export-visual', 'readiness:export': 'tsx scripts/local-export-readiness.ts', 'qa:export-visual': 'tsx scripts/export-visual-qa.ts' } }, null, 2),
    'docs/release/phase-4-local-result-export-readiness-contract.md': '# Contract\n',
    'docs/release/phase-4-export-visual-qa-download-contract.md': '# QA Contract\n',
    'docs/release/phase-4-closure-criteria.md': '# Closure Criteria\n',
    'docs/ui/phase-4-0-local-result-export-readiness-contract-status.md': '# Status\n',
    'docs/ui/phase-4-2-export-ux-hardening-failure-state-polish-status.md': '# Status\n',
    'docs/ui/phase-4-3-export-visual-qa-download-contract-status.md': '# Status\n',
    'src/app/results/page.tsx': 'export default function ResultsPage(){ return null; }\n',
    'src/features/results/resultShareCard.ts': 'export const SHARE_CARD_COPY_BOUNDARY_NOTE = "local"; export interface LocalShareCardPreview { readonly title: string; readonly subtitle: string; readonly pattern: string; readonly signature: string; readonly traitLine: string; readonly mainTension: string; readonly confidence: string; readonly deepMotive: string; } export function buildLocalShareCardPreview(){ return { title: "The Observer Strategist", subtitle: "sub", pattern: "pattern", signature: "signature", traitLine: "traits", mainTension: "tension", confidence: "High", deepMotive: "Knowledge" }; }\n',
    'src/features/results/ResultsClient.tsx': 'import { buildLocalShareCardPreview } from "./resultShareCard"; import { exportLocalShareCardPng } from "./resultShareImageExport"; export const value = [buildLocalShareCardPreview, exportLocalShareCardPng];\n',
    'src/features/results/resultShareImageExport.ts': baseShareImageExportSource()
  };

  for (const [file, source] of Object.entries(files)) {
    const absolutePath = path.join(tempRoot, file);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }

  return tempRoot;
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
    'export function exportLocalShareCardPng(){ const canvas = document.createElement("canvas"); canvas.toBlob(() => null); new Blob(["svg"]); window.URL.createObjectURL(new Blob()); const anchor = document.createElement("a"); anchor.download = "test.png"; window.URL.revokeObjectURL("blob:test"); }'
  ].join('\n');
}
