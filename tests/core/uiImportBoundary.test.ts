import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runUiImportBoundary } from '../../src/core/release/uiImportBoundary';

const report = runUiImportBoundary();

describe('UI import boundary guard', () => {
  it('passes current UI scaffold imports', () => {
    expect(report.gates).toMatchObject({
      uiRootsExist: true,
      noForbiddenCoreImports: true,
      noBlockedScopeImports: true,
      overallPassed: true
    });
    expect(report.violations).toEqual([]);
  });

  it('allows public core entrypoint imports', () => {
    expect(report.allowedCoreEntrypoints).toContain('@/core');
    expect(report.summary.scannedFileCount).toBeGreaterThanOrEqual(5);
  });

  it('detects internal core imports from UI files', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/app'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/app/page.tsx'), "import { QUESTIONS } from '@/core/methodology/questions';\nexport default function Page() { return null; }\n");

    const tempReport = runUiImportBoundary({ repoRoot: tempRoot });

    expect(tempReport.gates.noForbiddenCoreImports).toBe(false);
    expect(tempReport.issues[0]).toContain('ui_import_boundary_violation:internal_core_import');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects blocked backend/AI imports from UI files', () => {
    const tempRoot = makeTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/features/quiz'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/features/quiz/BadClient.tsx'), "import { run } from '@/ai/report';\nexport function BadClient() { return null; }\n");

    const tempReport = runUiImportBoundary({ repoRoot: tempRoot });

    expect(tempReport.gates.noBlockedScopeImports).toBe(false);
    expect(tempReport.issues[0]).toContain('ui_import_boundary_violation:blocked_scope_import');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-ui-boundary-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  return tempRoot;
}
