import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runUiSmokeContract } from '../../src/core/release/uiSmokeContract';

const report = runUiSmokeContract();

describe('Phase 2 UI smoke contract', () => {
  it('passes all static UI smoke gates for the local Phase 2 app', () => {
    expect(report.gates).toMatchObject({
      landingRouteSmokePassed: true,
      quizRouteSmokePassed: true,
      resultsRouteSmokePassed: true,
      localOnlyBoundaryPassed: true,
      publicEngineSmokePassed: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('proves all required routes expose their expected smoke signals', () => {
    expect(report.schemaVersion).toBe('phase-2.8-ui-smoke-contract-v1');
    expect(report.routes).toHaveLength(3);
    expect(report.routes.map((route) => route.route)).toEqual(['/', '/quiz', '/results']);
    expect(report.routes.every((route) => route.exists && route.passed)).toBe(true);
  });

  it('keeps the UI local-only and uses the public engine content contract', () => {
    expect(report.localOnly.violations).toEqual([]);
    expect(report.localOnly.sessionStorageAllowed).toBe(true);
    expect(report.contentContract).toMatchObject({
      questionCount: 20,
      sampleResultHasReport: true,
      sampleResultHasShareSummary: true,
      passed: true
    });
  });

  it('detects missing route smoke signals', () => {
    const tempRoot = makeTempRepoRoot();
    writeFileSync(path.join(tempRoot, 'src/app/page.tsx'), 'export default function Home(){return null;}\n');

    const tempReport = runUiSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.landingRouteSmokePassed).toBe(false);
    expect(tempReport.issues).toContain('ui_smoke_missing_signal:/:landing-title');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects blocked local-only side-effect calls', () => {
    const tempRoot = makeTempRepoRoot();
    writeFileSync(path.join(tempRoot, 'src/features/results/ResultsClient.tsx'), 'window.localStorage.setItem("x", "y");\n');

    const tempReport = runUiSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.localOnlyBoundaryPassed).toBe(false);
    expect(tempReport.issues).toContain('ui_smoke_local_only_violation:src/features/results/ResultsClient.tsx:window.localStorage');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-ui-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(path.join(tempRoot, 'src/app'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'src/features/landing'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'src/features/quiz'), { recursive: true });
  mkdirSync(path.join(tempRoot, 'src/features/results'), { recursive: true });

  for (const [file, source] of Object.entries({
    'src/app/page.tsx': 'landing-title Non-clinical disclaimer Reflective game, not a diagnosis landingTrustCards landingMethodSteps landingScopeGuards href={cta.href}',
    'src/features/landing/landingPresentation.ts': 'landingTrustCards landingMethodSteps landingScopeGuards',
    'src/features/quiz/QuizClient.tsx': 'getCorridorQuestions runCorridorsEngine saveCorridorsResultToSessionStorage buildCompletionPanel buildReviewDots parseKeyboardOptionKey Enter Backspace',
    'src/features/quiz/quizFlow.ts': 'sessionStorage',
    'src/features/results/ResultsClient.tsx': 'readCorridorsResultFromSessionStorage buildResultReportViewModel buildLocalShareCardPreview FeedbackPanel dominant-traits axis-map contradiction-map evidence-digest trust-guard local-feedback share-summary',
    'src/features/results/resultFeedback.ts': 'local feedback',
    'src/features/results/resultShareCard.ts': 'share card'
  })) {
    writeFileSync(path.join(tempRoot, file), `${source}\n`);
  }

  return tempRoot;
}
