import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runEngineReleaseGate } from './releaseGate';
import { runUiImportBoundary } from './uiImportBoundary';

export const PHASE_2_READINESS_SCHEMA_VERSION = 'phase-2.0-ui-scaffold-readiness-v1' as const;
export const PHASE_2_READINESS_ID = 'phase-2-ui-scaffold-readiness' as const;

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
    readonly uiImportBoundarySchemaVersion: string;
  };
  readonly gates: {
    readonly engineReleaseGatePassed: boolean;
    readonly uiImportBoundaryPassed: boolean;
    readonly nextConfigExists: boolean;
    readonly appLayoutExists: boolean;
    readonly landingRouteExists: boolean;
    readonly quizRouteExists: boolean;
    readonly resultsRouteExists: boolean;
    readonly quizClientExists: boolean;
    readonly resultsClientExists: boolean;
    readonly globalStylesExist: boolean;
    readonly publicCoreEntrypointExists: boolean;
    readonly validateScriptRunsReadinessGate: boolean;
    readonly validateScriptRunsUiImportGuard: boolean;
    readonly stillNoBackendAiAuthPaymentScope: boolean;
    readonly routeSkeletonsUsePublicApiOnly: boolean;
    readonly overallPassed: boolean;
  };
  readonly requiredUiFiles: readonly string[];
  readonly blockedScope: readonly string[];
  readonly publicApi: {
    readonly entrypoint: string;
    readonly requiredExports: readonly string[];
    readonly forbiddenUiImports: readonly string[];
  };
  readonly scripts: {
    readonly validate?: string;
    readonly readinessPhase2?: string;
    readonly guardUiImports?: string;
  };
  readonly issues: readonly string[];
}

const REQUIRED_UI_FILES = [
  'next.config.ts',
  'next-env.d.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/quiz/page.tsx',
  'src/app/results/page.tsx',
  'src/app/globals.css',
  'src/features/quiz/QuizClient.tsx',
  'src/features/results/ResultsClient.tsx'
] as const;

const STILL_BLOCKED_SCOPE = [
  'src/server/',
  'src/api/',
  'src/app/api/',
  'pages/',
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
  'src/core/llm/',
  'auth/',
  'payments/'
] as const;

const REQUIRED_PUBLIC_EXPORTS = ['getCorridorQuestions', 'runCorridorsEngine'] as const;

const FORBIDDEN_UI_IMPORT_PREFIXES = [
  '@/core/methodology',
  '@/core/scoring',
  '@/core/report',
  '@/core/audit',
  '@/core/release',
  '@/core/serialization'
] as const;

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

export function runPhase2Readiness(options: Phase2ReadinessOptions = {}): Phase2ReadinessReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const engineReleaseGate = runEngineReleaseGate({ repoRoot });
  const uiImportBoundary = runUiImportBoundary({ repoRoot });
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const publicIndex = readFileIfExists(repoRoot, 'src/core/index.ts');
  const quizClient = readFileIfExists(repoRoot, 'src/features/quiz/QuizClient.tsx');
  const resultsClient = readFileIfExists(repoRoot, 'src/features/results/ResultsClient.tsx');

  const missingBlockedScope = STILL_BLOCKED_SCOPE.filter((blockedPath) => existsInRepo(repoRoot, blockedPath.replace(/\/$/, '')));
  const publicExportsPresent = REQUIRED_PUBLIC_EXPORTS.every((requiredExport) => publicIndex.includes(requiredExport));
  const routeSkeletonsUsePublicApiOnly =
    quizClient.includes("from '@/core'") &&
    resultsClient.includes("from '@/core'") &&
    FORBIDDEN_UI_IMPORT_PREFIXES.every(
      (forbiddenImport) => !quizClient.includes(forbiddenImport) && !resultsClient.includes(forbiddenImport)
    );

  const gates = {
    engineReleaseGatePassed: engineReleaseGate.gates.overallPassed,
    uiImportBoundaryPassed: uiImportBoundary.gates.overallPassed,
    nextConfigExists: existsInRepo(repoRoot, 'next.config.ts'),
    appLayoutExists: existsInRepo(repoRoot, 'src/app/layout.tsx'),
    landingRouteExists: existsInRepo(repoRoot, 'src/app/page.tsx'),
    quizRouteExists: existsInRepo(repoRoot, 'src/app/quiz/page.tsx'),
    resultsRouteExists: existsInRepo(repoRoot, 'src/app/results/page.tsx'),
    quizClientExists: existsInRepo(repoRoot, 'src/features/quiz/QuizClient.tsx'),
    resultsClientExists: existsInRepo(repoRoot, 'src/features/results/ResultsClient.tsx'),
    globalStylesExist: existsInRepo(repoRoot, 'src/app/globals.css'),
    publicCoreEntrypointExists: existsInRepo(repoRoot, 'src/core/index.ts') && publicExportsPresent,
    validateScriptRunsReadinessGate: validateScript.includes('npm run readiness:phase2'),
    validateScriptRunsUiImportGuard: validateScript.includes('npm run guard:ui-imports'),
    stillNoBackendAiAuthPaymentScope: missingBlockedScope.length === 0,
    routeSkeletonsUsePublicApiOnly,
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
      engineReleaseGateSchemaVersion: engineReleaseGate.schemaVersion,
      uiImportBoundarySchemaVersion: uiImportBoundary.schemaVersion
    },
    gates: completeGates,
    requiredUiFiles: REQUIRED_UI_FILES,
    blockedScope: STILL_BLOCKED_SCOPE,
    publicApi: {
      entrypoint: 'src/core/index.ts',
      requiredExports: REQUIRED_PUBLIC_EXPORTS,
      forbiddenUiImports: FORBIDDEN_UI_IMPORT_PREFIXES
    },
    scripts: buildScriptSummary(packageJson),
    issues: buildIssues(completeGates, missingBlockedScope, uiImportBoundary.issues)
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase2ReadinessReport['scripts'] {
  const scripts: { validate?: string; readinessPhase2?: string; guardUiImports?: string } = {};

  const validate = packageJson.scripts?.validate;
  const readinessPhase2 = packageJson.scripts?.['readiness:phase2'];
  const guardUiImports = packageJson.scripts?.['guard:ui-imports'];

  if (validate !== undefined) scripts.validate = validate;
  if (readinessPhase2 !== undefined) scripts.readinessPhase2 = readinessPhase2;
  if (guardUiImports !== undefined) scripts.guardUiImports = guardUiImports;

  return scripts;
}

function buildIssues(
  gates: Phase2ReadinessReport['gates'],
  blockedScope: readonly string[],
  uiImportIssues: readonly string[]
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`phase2_readiness_gate_failed:${key}`);
    }
  }

  for (const blockedPath of blockedScope) {
    issues.push(`blocked_scope_artifact:${blockedPath}`);
  }

  for (const uiIssue of uiImportIssues) {
    issues.push(uiIssue);
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
