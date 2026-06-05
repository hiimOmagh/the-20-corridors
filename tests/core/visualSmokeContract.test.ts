import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runVisualSmokeContract } from '../../src/core/release/visualSmokeContract';

const report = runVisualSmokeContract();

describe('Phase 3 visual smoke contract', () => {
  it('passes all visual identity smoke gates', () => {
    expect(report.gates).toMatchObject({
      landingVisualSmokePassed: true,
      quizVisualSmokePassed: true,
      resultVisualSmokePassed: true,
      shareCardVisualSmokePassed: true,
      feedbackVisualSmokePassed: true,
      visualIdentitySmokePassed: true,
      reducedMotionSmokePassed: true,
      localOnlyVisualBoundaryPassed: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records visual identity, motion, and reduced-motion coverage', () => {
    expect(report.schemaVersion).toBe('phase-3.6-visual-smoke-contract-v1');
    expect(report.files.length).toBeGreaterThanOrEqual(8);
    expect(report.visualIdentity).toMatchObject({
      tokenCount: expect.any(Number),
      principleCount: expect.any(Number),
      motionSurfaceCount: expect.any(Number),
      reducedMotionRuleCount: expect.any(Number),
      passed: true
    });
    expect(report.reducedMotion.passed).toBe(true);
    expect(report.localOnlyVisualBoundary.violations).toEqual([]);
  });

  it('detects missing required visual smoke signals', () => {
    const tempRoot = makeTempRepoRoot();
    writeFileSync(path.join(tempRoot, 'src/features/quiz/QuizClient.tsx'), 'export function QuizClient(){return null;}\n');

    const tempReport = runVisualSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.quizVisualSmokePassed).toBe(false);
    expect(tempReport.issues).toContain('visual_smoke_missing_signal:quiz:buildQuizVisualFrame');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('detects visual-scope backend, AI, analytics, or export leakage', () => {
    const tempRoot = makeTempRepoRoot();
    writeFileSync(path.join(tempRoot, 'src/features/results/resultShareCard.ts'), 'export const leak = html2canvas;\n');

    const tempReport = runVisualSmokeContract({ repoRoot: tempRoot });

    expect(tempReport.gates.localOnlyVisualBoundaryPassed).toBe(false);
    expect(tempReport.issues).toContain('visual_smoke_local_only_violation:src/features/results/resultShareCard.ts:html2canvas');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-visual-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const files: Record<string, string> = {
    'src/app/page.tsx': 'landingSectionIndex landingContinuityMarkers landingTrustSignals landing-visual-system-panel landing-section-index landing-continuity-strip Non-clinical disclaimer',
    'src/features/landing/landingVisualConsistency.ts': 'landingSectionIndex landingContinuityMarkers landingTrustSignals local',
    'src/features/quiz/QuizClient.tsx': 'buildQuizVisualFrame buildQuizOptionIdentity quiz-visual-frame quiz-corridor-mark option-identity buildCompletionPanel',
    'src/features/quiz/quizVisualIdentity.ts': 'buildQuizVisualFrame buildQuizOptionIdentity local',
    'src/features/results/ResultsClient.tsx': 'buildResultSectionIndex getAxisVisualTone getContradictionVisualTone getPracticalVisualTone visual-jump-nav section-index-card visual-tone',
    'src/features/results/resultShareCard.ts': 'buildLocalShareCardPreview buildShareCardSignature buildShareCardMetrics buildShareCardVisualCues SHARE_CARD_COPY_BOUNDARY_NOTE',
    'src/features/results/resultVisualConsistency.ts': 'buildResultSectionIndex visual-tone local',
    'src/features/results/resultFeedback.ts': 'feedback rating submitted local',
    'src/features/visual/visualIdentity.ts': 'visualIdentityTokens visualIdentityPrinciples Motion must be optional --color-signal --color-threshold',
    'src/features/visual/motionPolish.ts': 'motionPolishSurfaces reducedMotionRules No large transform motion No looping decorative sweeps No product-scope expansion',
    'src/app/globals.css': 'Phase 3.0 visual identity system Phase 3.1 Phase 3.2 Phase 3.3 Phase 3.4 Phase 3.5 @media (prefers-reduced-motion: reduce) animation: none transition-duration transform: none .button .local-share-card .quiz-visual-frame .visual-jump-nav .landing-section-index'
  };

  for (const [file, source] of Object.entries(files)) {
    const absolutePath = path.join(tempRoot, file);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `${source}\n`);
  }

  return tempRoot;
}
