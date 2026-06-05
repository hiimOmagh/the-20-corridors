import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase2Readiness } from './phase2Readiness';
import { runUiSmokeContract } from './uiSmokeContract';

export const PHASE_2_CLOSURE_SCHEMA_VERSION = 'phase-2.8-closure-gate-v1' as const;
export const PHASE_2_CLOSURE_ID = 'phase-2-closure-gate' as const;

export interface Phase2ClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase2ClosureGateReport {
  readonly schemaVersion: typeof PHASE_2_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_2_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-2-closure';
    readonly readinessSchemaVersion: string;
    readonly uiSmokeSchemaVersion: string;
  };
  readonly gates: {
    readonly phase2ReadinessPassed: boolean;
    readonly uiSmokeContractPassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsClosureGate: boolean;
    readonly validateScriptRunsUiSmoke: boolean;
    readonly closureReviewDocExists: boolean;
    readonly phase3TransitionDocExists: boolean;
    readonly localOnlyScopePreserved: boolean;
    readonly noBlockedScopeArtifacts: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly closureReview: string;
    readonly phase3Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly smokeUi?: string;
    readonly closurePhase2?: string;
  };
  readonly coverage: {
    readonly smokeRouteCount: number;
    readonly smokeCheckedLocalOnlyFileCount: number;
    readonly uiSmokeIssueCount: number;
    readonly readinessIssueCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const CLOSURE_REVIEW_DOC = 'docs/release/phase-2-closure-review.md';
const PHASE3_TRANSITION_DOC = 'docs/ui/phase-3-transition-plan.md';

export function runPhase2ClosureGate(options: Phase2ClosureGateOptions = {}): Phase2ClosureGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const phase2Readiness = runPhase2Readiness({ repoRoot });
  const uiSmokeContract = runUiSmokeContract({ repoRoot });
  const packageJson = readPackageJson(repoRoot);

  const validateScript = packageJson.scripts?.validate ?? '';
  const blockedScopeArtifacts = phase2Readiness.issues.filter((issue) => issue.startsWith('blocked_scope_artifact:'));

  const gates = {
    phase2ReadinessPassed: phase2Readiness.gates.overallPassed,
    uiSmokeContractPassed: uiSmokeContract.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase2'] === 'tsx scripts/phase2-closure-gate.ts',
    validateScriptRunsClosureGate: validateScript.includes('npm run closure:phase2'),
    validateScriptRunsUiSmoke: validateScript.includes('npm run smoke:ui'),
    closureReviewDocExists: existsSync(path.join(repoRoot, CLOSURE_REVIEW_DOC)),
    phase3TransitionDocExists: existsSync(path.join(repoRoot, PHASE3_TRANSITION_DOC)),
    localOnlyScopePreserved: uiSmokeContract.localOnly.passed,
    noBlockedScopeArtifacts: blockedScopeArtifacts.length === 0,
    overallPassed: false
  };
  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_2_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_2_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-2-closure',
      readinessSchemaVersion: phase2Readiness.schemaVersion,
      uiSmokeSchemaVersion: uiSmokeContract.schemaVersion
    },
    gates: completeGates,
    docs: {
      closureReview: CLOSURE_REVIEW_DOC,
      phase3Transition: PHASE3_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      smokeRouteCount: uiSmokeContract.routes.length,
      smokeCheckedLocalOnlyFileCount: uiSmokeContract.localOnly.checkedFiles.length,
      uiSmokeIssueCount: uiSmokeContract.issues.length,
      readinessIssueCount: phase2Readiness.issues.length
    },
    issues: buildIssues(completeGates, phase2Readiness.issues, uiSmokeContract.issues)
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase2ClosureGateReport['scripts'] {
  const scripts: { validate?: string; smokeUi?: string; closurePhase2?: string } = {};

  const validate = packageJson.scripts?.validate;
  const smokeUi = packageJson.scripts?.['smoke:ui'];
  const closurePhase2 = packageJson.scripts?.['closure:phase2'];

  if (validate !== undefined) scripts.validate = validate;
  if (smokeUi !== undefined) scripts.smokeUi = smokeUi;
  if (closurePhase2 !== undefined) scripts.closurePhase2 = closurePhase2;

  return scripts;
}

function buildIssues(
  gates: Phase2ClosureGateReport['gates'],
  readinessIssues: readonly string[],
  uiSmokeIssues: readonly string[]
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`phase2_closure_gate_failed:${key}`);
    }
  }

  for (const issue of readinessIssues) {
    issues.push(`phase2_closure_readiness_issue:${issue}`);
  }

  for (const issue of uiSmokeIssues) {
    issues.push(`phase2_closure_ui_smoke_issue:${issue}`);
  }

  return issues;
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
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === 'string');
}
