import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase2ClosureGate } from './phase2ClosureGate';
import { runVisualSmokeContract } from './visualSmokeContract';

export const PHASE_3_CLOSURE_SCHEMA_VERSION = 'phase-3.6-closure-gate-v1' as const;
export const PHASE_3_CLOSURE_ID = 'phase-3-closure-gate' as const;

export interface Phase3ClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase3ClosureGateReport {
  readonly schemaVersion: typeof PHASE_3_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_3_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-3-closure';
    readonly phase2ClosureSchemaVersion: string;
    readonly visualSmokeSchemaVersion: string;
  };
  readonly gates: {
    readonly phase2ClosurePassed: boolean;
    readonly visualSmokeContractPassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase3ClosureGate: boolean;
    readonly validateScriptRunsVisualSmoke: boolean;
    readonly phase3ClosureReviewDocExists: boolean;
    readonly phase4TransitionDocExists: boolean;
    readonly localOnlyVisualScopePreserved: boolean;
    readonly noBackendAiExportScope: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase3ClosureReview: string;
    readonly phase4Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly smokeVisual?: string;
    readonly closurePhase3?: string;
  };
  readonly coverage: {
    readonly visualFileCount: number;
    readonly visualSmokeIssueCount: number;
    readonly phase2ClosureIssueCount: number;
    readonly visualIdentityTokenCount: number;
    readonly reducedMotionRuleCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PHASE_3_CLOSURE_REVIEW_DOC = 'docs/release/phase-3-closure-review.md';
const PHASE_4_TRANSITION_DOC = 'docs/ui/phase-4-transition-plan.md';

const BLOCKED_PHASE_3_SCOPE_SIGNALS = [
  '@supabase',
  'new PrismaClient',
  'OpenAI(',
  'generateText(',
  'streamText(',
  'posthog.capture',
  'analytics.track',
  'navigator.sendBeacon',
  'html2canvas',
  'toDataURL',
  'canvas.toBlob',
  '@stripe',
  'stripe.checkout'
] as const;

const PHASE_3_SCOPE_FILES = [
  'src/app/page.tsx',
  'src/features/landing/landingVisualConsistency.ts',
  'src/features/quiz/QuizClient.tsx',
  'src/features/quiz/quizVisualIdentity.ts',
  'src/features/results/ResultsClient.tsx',
  'src/features/results/resultShareCard.ts',
  'src/features/results/resultVisualConsistency.ts',
  'src/features/visual/visualIdentity.ts',
  'src/features/visual/motionPolish.ts'
] as const;

export function runPhase3ClosureGate(options: Phase3ClosureGateOptions = {}): Phase3ClosureGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const phase2Closure = runPhase2ClosureGate({ repoRoot });
  const visualSmoke = runVisualSmokeContract({ repoRoot });
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const blockedScopeViolations = findBlockedPhase3ScopeViolations(repoRoot);

  const gates = {
    phase2ClosurePassed: phase2Closure.gates.overallPassed,
    visualSmokeContractPassed: visualSmoke.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase3'] === 'tsx scripts/phase3-closure-gate.ts',
    validateScriptRunsPhase3ClosureGate: validateScript.includes('npm run closure:phase3'),
    validateScriptRunsVisualSmoke: validateScript.includes('npm run smoke:visual'),
    phase3ClosureReviewDocExists: existsSync(path.join(repoRoot, PHASE_3_CLOSURE_REVIEW_DOC)),
    phase4TransitionDocExists: existsSync(path.join(repoRoot, PHASE_4_TRANSITION_DOC)),
    localOnlyVisualScopePreserved: visualSmoke.localOnlyVisualBoundary.passed,
    noBackendAiExportScope: blockedScopeViolations.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_3_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_3_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-3-closure',
      phase2ClosureSchemaVersion: phase2Closure.schemaVersion,
      visualSmokeSchemaVersion: visualSmoke.schemaVersion
    },
    gates: completeGates,
    docs: {
      phase3ClosureReview: PHASE_3_CLOSURE_REVIEW_DOC,
      phase4Transition: PHASE_4_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      visualFileCount: visualSmoke.files.length,
      visualSmokeIssueCount: visualSmoke.issues.length,
      phase2ClosureIssueCount: phase2Closure.issues.length,
      visualIdentityTokenCount: visualSmoke.visualIdentity.tokenCount,
      reducedMotionRuleCount: visualSmoke.visualIdentity.reducedMotionRuleCount
    },
    issues: buildIssues(completeGates, phase2Closure.issues, visualSmoke.issues, blockedScopeViolations)
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase3ClosureGateReport['scripts'] {
  const scripts: { validate?: string; smokeVisual?: string; closurePhase3?: string } = {};

  const validate = packageJson.scripts?.validate;
  const smokeVisual = packageJson.scripts?.['smoke:visual'];
  const closurePhase3 = packageJson.scripts?.['closure:phase3'];

  if (validate !== undefined) scripts.validate = validate;
  if (smokeVisual !== undefined) scripts.smokeVisual = smokeVisual;
  if (closurePhase3 !== undefined) scripts.closurePhase3 = closurePhase3;

  return scripts;
}

function buildIssues(
  gates: Phase3ClosureGateReport['gates'],
  phase2ClosureIssues: readonly string[],
  visualSmokeIssues: readonly string[],
  blockedScopeViolations: readonly string[]
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`phase3_closure_gate_failed:${key}`);
    }
  }

  for (const issue of phase2ClosureIssues) {
    issues.push(`phase3_closure_phase2_issue:${issue}`);
  }

  for (const issue of visualSmokeIssues) {
    issues.push(`phase3_closure_visual_smoke_issue:${issue}`);
  }

  for (const violation of blockedScopeViolations) {
    issues.push(`phase3_closure_blocked_scope_violation:${violation}`);
  }

  return issues;
}

function findBlockedPhase3ScopeViolations(repoRoot: string): string[] {
  const violations: string[] = [];

  for (const relativeFile of PHASE_3_SCOPE_FILES) {
    const absolutePath = path.join(repoRoot, relativeFile);
    if (!existsSync(absolutePath)) continue;

    const source = readFileSync(absolutePath, 'utf8').toLowerCase();
    for (const signal of BLOCKED_PHASE_3_SCOPE_SIGNALS) {
      if (source.includes(signal.toLowerCase())) {
        violations.push(`${relativeFile}:${signal}`);
      }
    }
  }

  return violations;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {};
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;

  if (!isRecord(parsed) || !isRecordOfStrings(parsed.scripts)) {
    return {};
  }

  return { scripts: parsed.scripts };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}
