import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runLocalExportReadiness } from '../../src/core/release/localExportReadiness';

const report = runLocalExportReadiness();

describe('local export readiness contract', () => {
  it('passes the Phase 4.1 local share-card image export gate', () => {
    expect(report.gates).toMatchObject({
      phase3ClosurePassed: true,
      readinessScriptExists: true,
      validateScriptRunsExportReadiness: true,
      exportReadinessContractDocExists: true,
      phase4StatusDocExists: true,
      localOnlyExportSurfacesDefined: true,
      noRawAnswerLeakageInExportSurface: true,
      noFullResultSerializationExport: true,
      localImageExportPrototypeExists: true,
      approvedLocalImageExportImplementation: true,
      noDisallowedImageExportImplementation: true,
      noBackendAiAuthPaymentPersistenceScope: true,
      allowedExportSurfaceUsesShareCardModel: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records export boundary docs, scripts, and allowed local surfaces', () => {
    expect(report.schemaVersion).toBe('phase-4.1-local-export-readiness-v1');
    expect(report.metadata.exportMode).toBe('local-share-card-image-export-prototype');
    expect(report.scripts.readinessExport).toBe('tsx scripts/local-export-readiness.ts');
    expect(report.scripts.validate).toContain('npm run readiness:export');
    expect(report.docs.exportReadinessContract).toBe('docs/release/phase-4-local-result-export-readiness-contract.md');
    expect(report.surfaces.allowedLocalExportSurfaces).toContain('local-image-export-from-share-card-only');
    expect(report.coverage).toMatchObject({
      checkedFileCount: 4,
      phase3ClosureIssueCount: 0,
      rawLeakageIssueCount: 0,
      implementationIssueCount: 0,
      blockedScopeIssueCount: 0
    });
    expect(report.coverage.approvedImageExportSignalCount).toBeGreaterThanOrEqual(5);
  });

  it('keeps the export surface free from raw answers, full-result serialization, and blocked scope', () => {
    expect(report.privacy.rawAnswerLeakageSignals).toEqual([]);
    expect(report.privacy.serializationExportSignals).toEqual([]);
    expect(report.privacy.disallowedImageExportSignals).toEqual([]);
    expect(report.privacy.backendAiAuthPaymentPersistenceSignals).toEqual([]);
    expect(report.privacy.approvedImageExportSignals.length).toBeGreaterThanOrEqual(5);
  });

  it('detects raw answer leakage in a candidate share-card export file', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    writeFileSync(
      path.join(tempRoot, 'src/features/results/resultShareImageExport.ts'),
      'import type { LocalShareCardPreview } from "./resultShareCard"; export function leak(result: any) { return result.answers.map((item: any) => item.answerText).join(","); } export function buildLocalShareCardExportSvg(card: LocalShareCardPreview){ return card.title; } export function exportLocalShareCardPng(){}\n'
    );

    const tempReport = runLocalExportReadiness({ repoRoot: tempRoot });

    expect(tempReport.gates.noRawAnswerLeakageInExportSurface).toBe(false);
    expect(tempReport.issues.some((issue) => issue.startsWith('local_export_raw_answer_leakage:'))).toBe(true);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects disallowed image export libraries in candidate export files', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    writeFileSync(
      path.join(tempRoot, 'src/features/results/resultShareImageExport.ts'),
      'import type { LocalShareCardPreview } from "./resultShareCard"; import html2canvas from "html2canvas"; export function buildLocalShareCardExportSvg(card: LocalShareCardPreview){ return card.title; } export function exportLocalShareCardPng(){ return html2canvas; }\n'
    );

    const tempReport = runLocalExportReadiness({ repoRoot: tempRoot });

    expect(tempReport.gates.noDisallowedImageExportImplementation).toBe(false);
    expect(tempReport.issues.some((issue) => issue.startsWith('local_export_disallowed_image_export_signal:'))).toBe(true);

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
  writeFileSync(
    path.join(tempRoot, 'src/features/results/resultShareCard.ts'),
    'export const SHARE_CARD_COPY_BOUNDARY_NOTE = "local"; export interface LocalShareCardPreview { readonly title: string; } export function buildLocalShareCardPreview(){ return { title: "test" }; }\n'
  );
  writeFileSync(
    path.join(tempRoot, 'src/features/results/ResultsClient.tsx'),
    'import { buildLocalShareCardPreview } from "./resultShareCard"; import { exportLocalShareCardPng } from "./resultShareImageExport"; export const value = [buildLocalShareCardPreview, exportLocalShareCardPng];\n'
  );
  writeFileSync(
    path.join(tempRoot, 'src/features/results/resultShareImageExport.ts'),
    'import type { LocalShareCardPreview } from "./resultShareCard"; export const LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION = "test"; export function buildLocalShareCardExportSvg(card: LocalShareCardPreview){ return card.title; } export function exportLocalShareCardPng(){ const canvas = document.createElement("canvas"); canvas.toBlob(() => null); URL.createObjectURL(new Blob()); const anchor = document.createElement("a"); anchor.download = "test.png"; }\n'
  );
  writeFileSync(path.join(tempRoot, 'src/app/results/page.tsx'), 'export default function ResultsPage(){ return null; }\n');
  return tempRoot;
}
