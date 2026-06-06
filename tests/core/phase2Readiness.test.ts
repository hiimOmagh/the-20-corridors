import { describe, expect, it } from 'vitest';
import { runPhase2Readiness } from '../../src/core/release/phase2Readiness';

const report = runPhase2Readiness();

describe('Phase 2 UI scaffold readiness', () => {
  it('passes all Phase 2.0 readiness gates', () => {
    expect(report.gates).toMatchObject({
      engineReleaseGatePassed: true,
      uiImportBoundaryPassed: true,
      nextConfigExists: true,
      appLayoutExists: true,
      landingRouteExists: true,
      quizRouteExists: true,
      resultsRouteExists: true,
      quizClientExists: true,
      resultsClientExists: true,
      globalStylesExist: true,
      publicCoreEntrypointExists: true,
      validateScriptRunsReadinessGate: true,
      validateScriptRunsUiImportGuard: true,
      stillNoBackendAiAuthPaymentScope: true,
      routeSkeletonsUsePublicApiOnly: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records the required UI files and blocked scope', () => {
    expect(report.schemaVersion).toBe('phase-2.0-ui-scaffold-readiness-v1');
    expect(report.requiredUiFiles).toContain('src/app/page.tsx');
    expect(report.requiredUiFiles).toContain('src/features/quiz/QuizClient.tsx');
    expect(report.blockedScope).not.toContain('src/app/api/');
    expect(report.blockedScope).toContain('src/ai/');
    expect(report.publicApi.requiredExports).toEqual(['getCorridorQuestions', 'runCorridorsEngine']);
  });

  it('keeps validation wired to release and UI import gates', () => {
    expect(report.scripts.validate).toContain('npm run guard:ui-imports');
    expect(report.scripts.validate).toContain('npm run release:engine');
    expect(report.scripts.validate).toContain('npm run readiness:phase2');
    expect(report.scripts.guardUiImports).toBe('tsx scripts/ui-import-boundary.ts');
  });
});
