import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { motionPolishSurfaces, reducedMotionRules } from '@/features/visual/motionPolish';
import { visualIdentityPrinciples, visualIdentityTokens } from '@/features/visual/visualIdentity';

export const VISUAL_SMOKE_CONTRACT_SCHEMA_VERSION = 'phase-3.6-visual-smoke-contract-v1' as const;
export const VISUAL_SMOKE_CONTRACT_ID = 'phase-3-visual-smoke-contract' as const;

export interface VisualSmokeContractOptions {
  readonly repoRoot?: string;
}

export interface VisualSmokeFileStatus {
  readonly file: string;
  readonly label: string;
  readonly exists: boolean;
  readonly requiredSignals: readonly string[];
  readonly missingSignals: readonly string[];
  readonly passed: boolean;
}

export interface VisualSmokeContractReport {
  readonly schemaVersion: typeof VISUAL_SMOKE_CONTRACT_SCHEMA_VERSION;
  readonly smokeId: typeof VISUAL_SMOKE_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-3-visual-identity';
  };
  readonly files: readonly VisualSmokeFileStatus[];
  readonly visualIdentity: {
    readonly tokenCount: number;
    readonly principleCount: number;
    readonly motionSurfaceCount: number;
    readonly reducedMotionRuleCount: number;
    readonly passed: boolean;
  };
  readonly reducedMotion: {
    readonly cssFile: string;
    readonly requiredSignals: readonly string[];
    readonly missingSignals: readonly string[];
    readonly passed: boolean;
  };
  readonly localOnlyVisualBoundary: {
    readonly checkedFiles: readonly string[];
    readonly forbiddenSignals: readonly string[];
    readonly violations: readonly string[];
    readonly passed: boolean;
  };
  readonly gates: {
    readonly landingVisualSmokePassed: boolean;
    readonly quizVisualSmokePassed: boolean;
    readonly resultVisualSmokePassed: boolean;
    readonly shareCardVisualSmokePassed: boolean;
    readonly feedbackVisualSmokePassed: boolean;
    readonly visualIdentitySmokePassed: boolean;
    readonly reducedMotionSmokePassed: boolean;
    readonly localOnlyVisualBoundaryPassed: boolean;
    readonly overallPassed: boolean;
  };
  readonly issues: readonly string[];
}

const VISUAL_FILE_REQUIREMENTS: readonly Omit<VisualSmokeFileStatus, 'exists' | 'missingSignals' | 'passed'>[] = [
  {
    label: 'landing',
    file: 'src/app/page.tsx',
    requiredSignals: [
      'landingSectionIndex',
      'landingContinuityMarkers',
      'landingTrustSignals',
      'landing-visual-system-panel',
      'landing-index-panel',
      'landing-continuity-strip',
      'Non-clinical disclaimer'
    ]
  },
  {
    label: 'quiz',
    file: 'src/features/quiz/QuizClient.tsx',
    requiredSignals: [
      'buildQuizVisualFrame',
      'buildQuizOptionIdentity',
      'buildQuizVisualFrame',
      'buildQuizOptionIdentity',
      'visualFrame.frameClassName',
      'buildCompletionPanel'
    ]
  },
  {
    label: 'results',
    file: 'src/features/results/ResultsClient.tsx',
    requiredSignals: [
      'buildResultSectionIndex',
      'getAxisVisualTone',
      'getContradictionVisualTone',
      'getPracticalVisualTone',
      'visual-jump-nav',
      'section-index-card',
      'visual-tone'
    ]
  },
  {
    label: 'share-card',
    file: 'src/features/results/resultShareCard.ts',
    requiredSignals: [
      'buildLocalShareCardPreview',
      'buildShareCardSignature',
      'buildShareCardMetrics',
      'buildShareCardVisualCues',
      'SHARE_CARD_COPY_BOUNDARY_NOTE'
    ]
  },
  {
    label: 'feedback',
    file: 'src/features/results/resultFeedback.ts',
    requiredSignals: [
      'feedback',
      'rating',
      'submitted',
      'local'
    ]
  },
  {
    label: 'visual-identity',
    file: 'src/features/visual/visualIdentity.ts',
    requiredSignals: [
      'visualIdentityTokens',
      'visualIdentityPrinciples',
      'Motion must be optional',
      '--color-signal',
      '--color-threshold'
    ]
  },
  {
    label: 'motion-polish',
    file: 'src/features/visual/motionPolish.ts',
    requiredSignals: [
      'motionPolishSurfaces',
      'reducedMotionRules',
      'No large transform motion',
      'No looping decorative sweeps',
      'No product-scope expansion'
    ]
  },
  {
    label: 'css-visual-system',
    file: 'src/app/globals.css',
    requiredSignals: [
      'Phase 3.0 visual identity system',
      'Phase 3.1',
      'Phase 3.2',
      'Phase 3.2',
      'Phase 3.4',
      'Phase 3.5',
      '@media (prefers-reduced-motion: reduce)',
      '.local-share-card',
      '.quiz-visual-frame',
      '.visual-jump-nav',
      '.landing-index-panel'
    ]
  }
] as const;

const LOCAL_ONLY_VISUAL_FILES = [
  'src/app/page.tsx',
  'src/features/landing/landingVisualConsistency.ts',
  'src/features/quiz/QuizClient.tsx',
  'src/features/quiz/quizVisualIdentity.ts',
  'src/features/results/ResultsClient.tsx',
  'src/features/results/resultShareCard.ts',
  'src/features/results/resultVisualConsistency.ts',
  'src/features/results/resultFeedback.ts',
  'src/features/visual/visualIdentity.ts',
  'src/features/visual/motionPolish.ts'
] as const;

const FORBIDDEN_VISUAL_SCOPE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'new PrismaClient',
  'OpenAI(',
  'generateText(',
  'streamText(',
  'toDataURL',
  'html2canvas',
  'canvas.toBlob',
  'URL.createObjectURL'
] as const;

const REDUCED_MOTION_REQUIRED_SIGNALS = [
  '@media (prefers-reduced-motion: reduce)',
  'animation: none',
  'transition-duration',
  'transform: none',
  '.button'
] as const;

export function runVisualSmokeContract(options: VisualSmokeContractOptions = {}): VisualSmokeContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const files = VISUAL_FILE_REQUIREMENTS.map((requirement) => checkVisualFile(repoRoot, requirement));
  const visualIdentity = checkVisualIdentityIntegrity();
  const reducedMotion = checkReducedMotion(repoRoot);
  const localOnlyVisualBoundary = checkLocalOnlyVisualBoundary(repoRoot);

  const fileByLabel = new Map(files.map((file) => [file.label, file]));
  const gates = {
    landingVisualSmokePassed: Boolean(fileByLabel.get('landing')?.passed),
    quizVisualSmokePassed: Boolean(fileByLabel.get('quiz')?.passed),
    resultVisualSmokePassed: Boolean(fileByLabel.get('results')?.passed),
    shareCardVisualSmokePassed: Boolean(fileByLabel.get('share-card')?.passed),
    feedbackVisualSmokePassed: Boolean(fileByLabel.get('feedback')?.passed),
    visualIdentitySmokePassed: Boolean(fileByLabel.get('visual-identity')?.passed) && visualIdentity.passed,
    reducedMotionSmokePassed: Boolean(fileByLabel.get('motion-polish')?.passed) && reducedMotion.passed,
    localOnlyVisualBoundaryPassed: localOnlyVisualBoundary.passed,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: VISUAL_SMOKE_CONTRACT_SCHEMA_VERSION,
    smokeId: VISUAL_SMOKE_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-3-visual-identity'
    },
    files,
    visualIdentity,
    reducedMotion,
    localOnlyVisualBoundary,
    gates: completeGates,
    issues: buildIssues(files, visualIdentity, reducedMotion, localOnlyVisualBoundary, completeGates)
  };
}

function checkVisualFile(
  repoRoot: string,
  requirement: Omit<VisualSmokeFileStatus, 'exists' | 'missingSignals' | 'passed'>
): VisualSmokeFileStatus {
  const absolutePath = path.join(repoRoot, requirement.file);
  const exists = existsSync(absolutePath);
  const source = exists ? readFileSync(absolutePath, 'utf8') : '';
  const missingSignals = requirement.requiredSignals.filter((signal) => !source.includes(signal));

  return {
    ...requirement,
    exists,
    missingSignals,
    passed: exists && missingSignals.length === 0
  };
}

function checkVisualIdentityIntegrity(): VisualSmokeContractReport['visualIdentity'] {
  const tokenCount = visualIdentityTokens.length;
  const principleCount = visualIdentityPrinciples.length;
  const motionSurfaceCount = motionPolishSurfaces.length;
  const reducedMotionRuleCount = reducedMotionRules.length;

  return {
    tokenCount,
    principleCount,
    motionSurfaceCount,
    reducedMotionRuleCount,
    passed: tokenCount >= 8 && principleCount >= 4 && motionSurfaceCount >= 5 && reducedMotionRuleCount >= 4
  };
}

function checkReducedMotion(repoRoot: string): VisualSmokeContractReport['reducedMotion'] {
  const cssFile = 'src/app/globals.css';
  const absolutePath = path.join(repoRoot, cssFile);
  const source = existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
  const missingSignals = REDUCED_MOTION_REQUIRED_SIGNALS.filter((signal) => !source.includes(signal));

  return {
    cssFile,
    requiredSignals: REDUCED_MOTION_REQUIRED_SIGNALS,
    missingSignals,
    passed: missingSignals.length === 0
  };
}

function checkLocalOnlyVisualBoundary(repoRoot: string): VisualSmokeContractReport['localOnlyVisualBoundary'] {
  const checkedFiles = LOCAL_ONLY_VISUAL_FILES.filter((file) => existsSync(path.join(repoRoot, file)));
  const violations: string[] = [];

  for (const file of checkedFiles) {
    const source = readFileSync(path.join(repoRoot, file), 'utf8').toLowerCase();

    for (const signal of FORBIDDEN_VISUAL_SCOPE_SIGNALS) {
      if (source.includes(signal.toLowerCase())) {
        violations.push(`${file}:${signal}`);
      }
    }
  }

  return {
    checkedFiles,
    forbiddenSignals: FORBIDDEN_VISUAL_SCOPE_SIGNALS,
    violations,
    passed: checkedFiles.length === LOCAL_ONLY_VISUAL_FILES.length && violations.length === 0
  };
}

function buildIssues(
  files: readonly VisualSmokeFileStatus[],
  visualIdentity: VisualSmokeContractReport['visualIdentity'],
  reducedMotion: VisualSmokeContractReport['reducedMotion'],
  localOnlyVisualBoundary: VisualSmokeContractReport['localOnlyVisualBoundary'],
  gates: VisualSmokeContractReport['gates']
): string[] {
  const issues: string[] = [];

  for (const file of files) {
    if (!file.exists) {
      issues.push(`visual_smoke_missing_file:${file.label}:${file.file}`);
    }

    for (const missingSignal of file.missingSignals) {
      issues.push(`visual_smoke_missing_signal:${file.label}:${missingSignal}`);
    }
  }

  if (!visualIdentity.passed) {
    issues.push('visual_smoke_identity_integrity_failed');
  }

  for (const missingSignal of reducedMotion.missingSignals) {
    issues.push(`visual_smoke_reduced_motion_missing_signal:${missingSignal}`);
  }

  for (const violation of localOnlyVisualBoundary.violations) {
    issues.push(`visual_smoke_local_only_violation:${violation}`);
  }

  if (localOnlyVisualBoundary.checkedFiles.length !== LOCAL_ONLY_VISUAL_FILES.length) {
    issues.push('visual_smoke_local_only_file_set_incomplete');
  }

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`visual_smoke_gate_failed:${key}`);
    }
  }

  return issues;
}
