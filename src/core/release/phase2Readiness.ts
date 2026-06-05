import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runEngineReleaseGate } from './releaseGate';

export const PHASE_2_READINESS_SCHEMA_VERSION = 'phase-1.8-phase2-readiness-v1' as const;
export const PHASE_2_READINESS_ID = 'phase-2-ui-readiness-contract' as const;

export interface Phase2ReadinessOptions {
  readonly repoRoot?: string;
}

export interface Phase2ReadinessReport {
  readonly schemaVersion: typeof PHASE_2_READINESS_SCHEMA_VERSION;
  readonly readinessId: typeof PHASE_2_READINESS_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly engineReleaseGateSchemaVersion: string;
  };
  readonly gates: {
    readonly engineReleaseGatePassed: boolean;
    readonly closureReviewExists: boolean;
    readonly uiReadinessContractExists: boolean;
    readonly importBoundaryContractExists: boolean;
    readonly transitionPlanExists: boolean;
    readonly publicCoreEntrypointExists: boolean;
    readonly publicEngineWrapperExists: boolean;
    readonly publicTypesExist: boolean;
    readonly readinessScriptExists: boolean;
    readonly validateScriptRunsReadinessGate: boolean;
    readonly transitionKeepsBackendAiBlocked: boolean;
    readonly contractRequiresPublicApiOnly: boolean;
    readonly overallPassed: boolean;
  };
  readonly documents: {
    readonly closureReview: string;
    readonly uiReadinessContract: string;
    readonly importBoundaryContract: string;
    readonly transitionPlan: string;
  };
  readonly allowedPhase2Scope: readonly string[];
  readonly stillBlockedScope: readonly string[];
  readonly publicApi: {
    readonly entrypoint: string;
    readonly requiredExports: readonly string[];
    readonly forbiddenUiImports: readonly string[];
  };
  readonly scripts: {
    readonly validate?: string;
    readonly readinessPhase2?: string;
  };
  readonly issues: readonly string[];
}

const CLOSURE_REVIEW_PATH = 'docs/release/engine-closure-review.md';
const UI_READINESS_CONTRACT_PATH = 'docs/ui/phase-2-ui-readiness-contract.md';
const IMPORT_BOUNDARY_CONTRACT_PATH = 'docs/ui/import-boundary-contract.md';
const TRANSITION_PLAN_PATH = 'docs/ui/phase-2-transition-plan.md';

export const APPROVED_PHASE_2_SCOPE = [
  'app/',
  'src/app/',
  'src/components/',
  'src/components/ui/',
  'src/features/quiz/',
  'src/features/results/',
  'src/styles/',
  'public/'
] as const;

export const STILL_BLOCKED_PHASE_2_SCOPE = [
  'src/server/',
  'src/api/',
  'app/api/',
  'pages/api/',
  'server/',
  'api/',
  'db/',
  'database/',
  'prisma/',
  'supabase/',
  'migrations/',
  'ai/',
  'llm/',
  'prompts/',
  'src/ai/',
  'src/llm/',
  'src/prompts/',
  'src/core/ai/',
  'src/core/llm/'
] as const;

export const REQUIRED_PUBLIC_EXPORTS = ['getCorridorQuestions', 'runCorridorsEngine'] as const;

export const FORBIDDEN_UI_IMPORT_PREFIXES = [
  'src/core/methodology/',
  'src/core/scoring/',
  'src/core/report/',
  'src/core/audit/',
  'src/core/release/',
  'src/core/serialization/'
] as const;

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

export function runPhase2Readiness(options: Phase2ReadinessOptions = {}): Phase2ReadinessReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const engineReleaseGate = runEngineReleaseGate({ repoRoot });
  const packageJson = readPackageJson(repoRoot);

  const documents = {
    closureReview: CLOSURE_REVIEW_PATH,
    uiReadinessContract: UI_READINESS_CONTRACT_PATH,
    importBoundaryContract: IMPORT_BOUNDARY_CONTRACT_PATH,
    transitionPlan: TRANSITION_PLAN_PATH
  };

  const closureReviewExists = existsInRepo(repoRoot, CLOSURE_REVIEW_PATH);
  const uiReadinessContractExists = existsInRepo(repoRoot, UI_READINESS_CONTRACT_PATH);
  const importBoundaryContractExists = existsInRepo(repoRoot, IMPORT_BOUNDARY_CONTRACT_PATH);
  const transitionPlanExists = existsInRepo(repoRoot, TRANSITION_PLAN_PATH);
  const publicCoreEntrypointExists = existsInRepo(repoRoot, 'src/core/index.ts');
  const publicEngineWrapperExists = existsInRepo(repoRoot, 'src/core/engine.ts');
  const publicTypesExist = existsInRepo(repoRoot, 'src/core/publicTypes.ts');
  const readinessScriptExists = packageJson.scripts?.['readiness:phase2'] === 'tsx scripts/phase2-readiness.ts';
  const validateScriptRunsReadinessGate = Boolean(packageJson.scripts?.validate?.includes('npm run readiness:phase2'));
  const transitionPlan = readFileIfExists(repoRoot, TRANSITION_PLAN_PATH);
  const uiReadinessContract = readFileIfExists(repoRoot, UI_READINESS_CONTRACT_PATH);
  const publicIndex = readFileIfExists(repoRoot, 'src/core/index.ts');

  const transitionKeepsBackendAiBlocked = STILL_BLOCKED_PHASE_2_SCOPE.every((blockedPath) =>
    transitionPlan.includes(blockedPath)
  );
  const contractRequiresPublicApiOnly =
    uiReadinessContract.includes('getCorridorQuestions') &&
    uiReadinessContract.includes('runCorridorsEngine') &&
    FORBIDDEN_UI_IMPORT_PREFIXES.every((forbiddenImport) => uiReadinessContract.includes(forbiddenImport));
  const publicExportsPresent = REQUIRED_PUBLIC_EXPORTS.every((requiredExport) => publicIndex.includes(requiredExport));

  const gates = {
    engineReleaseGatePassed: engineReleaseGate.gates.overallPassed,
    closureReviewExists,
    uiReadinessContractExists,
    importBoundaryContractExists,
    transitionPlanExists,
    publicCoreEntrypointExists: publicCoreEntrypointExists && publicExportsPresent,
    publicEngineWrapperExists,
    publicTypesExist,
    readinessScriptExists,
    validateScriptRunsReadinessGate,
    transitionKeepsBackendAiBlocked,
    contractRequiresPublicApiOnly,
    overallPassed: false
  };

  const overallPassed = Object.entries(gates)
    .filter(([key]) => key !== 'overallPassed')
    .every(([, value]) => value === true);

  const completeGates = {
    ...gates,
    overallPassed
  };

  return {
    schemaVersion: PHASE_2_READINESS_SCHEMA_VERSION,
    readinessId: PHASE_2_READINESS_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      engineReleaseGateSchemaVersion: engineReleaseGate.schemaVersion
    },
    gates: completeGates,
    documents,
    allowedPhase2Scope: APPROVED_PHASE_2_SCOPE,
    stillBlockedScope: STILL_BLOCKED_PHASE_2_SCOPE,
    publicApi: {
      entrypoint: 'src/core/index.ts',
      requiredExports: REQUIRED_PUBLIC_EXPORTS,
      forbiddenUiImports: FORBIDDEN_UI_IMPORT_PREFIXES
    },
    scripts: buildScriptSummary(packageJson),
    issues: buildIssues(completeGates)
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase2ReadinessReport['scripts'] {
  const scripts: { validate?: string; readinessPhase2?: string } = {};

  const validate = packageJson.scripts?.validate;
  const readinessPhase2 = packageJson.scripts?.['readiness:phase2'];

  if (validate !== undefined) {
    scripts.validate = validate;
  }

  if (readinessPhase2 !== undefined) {
    scripts.readinessPhase2 = readinessPhase2;
  }

  return scripts;
}

function buildIssues(gates: Phase2ReadinessReport['gates']): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`phase2_readiness_gate_failed:${key}`);
    }
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

function existsInRepo(repoRoot: string, relativePath: string): boolean {
  return existsSync(path.join(repoRoot, relativePath));
}

function readFileIfExists(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === 'string');
}
