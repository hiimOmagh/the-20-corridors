import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase4ClosureGate } from './phase4ClosureGate';
import { runPublicLinkPreviewContract } from './publicLinkPreviewContract';
import { runPublicLinkPrivacy } from './publicLinkPrivacy';
import { runPublicResultDtoContract } from './publicResultDtoContract';

export const PHASE_5_PREVIEW_CLOSURE_SCHEMA_VERSION = 'phase-5.4-preview-closure-gate-v1' as const;
export const PHASE_5_PREVIEW_CLOSURE_ID = 'phase-5-public-link-preview-closure-gate' as const;

export interface Phase5PreviewClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase5PreviewClosureGateReport {
  readonly schemaVersion: typeof PHASE_5_PREVIEW_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_5_PREVIEW_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-5-preview-closure';
    readonly phase4ClosureSchemaVersion: string;
    readonly publicLinkPrivacySchemaVersion: string;
    readonly publicResultDtoSchemaVersion: string;
    readonly publicLinkPreviewSchemaVersion: string;
  };
  readonly gates: {
    readonly phase4ClosurePassed: boolean;
    readonly publicLinkPrivacyPassed: boolean;
    readonly publicResultDtoContractPassed: boolean;
    readonly publicLinkPreviewContractPassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase5ClosureGate: boolean;
    readonly validateScriptRunsPublicLinkPrivacy: boolean;
    readonly validateScriptRunsPublicResultDto: boolean;
    readonly validateScriptRunsPublicLinkPreview: boolean;
    readonly phase5ClosureReviewDocExists: boolean;
    readonly phase6TransitionDocExists: boolean;
    readonly dtoOnlyPreviewScopePreserved: boolean;
    readonly localPreviewRouteOnly: boolean;
    readonly noPersistentPublicIdLookupScope: boolean;
    readonly noBackendApiDatabaseAuthPaymentAiScope: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase5ClosureReview: string;
    readonly phase6Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly privacyPublicLink?: string;
    readonly contractPublicDto?: string;
    readonly previewPublicLink?: string;
    readonly closurePhase5?: string;
  };
  readonly coverage: {
    readonly phase4IssueCount: number;
    readonly privacyIssueCount: number;
    readonly dtoIssueCount: number;
    readonly previewIssueCount: number;
    readonly previewRouteCount: number;
    readonly previewDtoKeyCount: number;
    readonly previewSectionCount: number;
    readonly checkedPreviewFileCount: number;
    readonly blockedSignalCount: number;
    readonly persistentRouteFileCount: number;
  };
  readonly files: {
    readonly previewRoute: string;
    readonly previewClient: string;
    readonly previewHelper: string;
    readonly phase5ClosureReview: string;
    readonly phase6Transition: string;
  };
  readonly signalScan: {
    readonly blockedScopeSignals: readonly string[];
    readonly persistentPublicRouteFiles: readonly string[];
    readonly missingDtoBoundarySignals: readonly string[];
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PHASE_5_CLOSURE_REVIEW_DOC = 'docs/release/phase-5-preview-closure-review.md';
const PHASE_6_TRANSITION_DOC = 'docs/ui/phase-6-transition-plan.md';

const PREVIEW_ROUTE = 'src/app/r/preview/page.tsx';
const PREVIEW_CLIENT = 'src/features/public-link/PublicLinkPreviewClient.tsx';
const PREVIEW_HELPER = 'src/features/public-link/publicLinkPreview.ts';

const PREVIEW_SCOPE_FILES = [PREVIEW_ROUTE, PREVIEW_CLIENT, PREVIEW_HELPER, 'src/features/results/ResultsClient.tsx'] as const;

const DTO_BOUNDARY_SIGNALS = [
  'DTO-only public preview rendering',
  'Minimized DTO only',
  'individual choices and private scoring internals are excluded',
  'No backend request',
  'local-session-dto-preview-only'
] as const;

const BLOCKED_SCOPE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'drizzle(',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'publicResultStorage',
  'resultIdLookup',
  'lookupPublicResult',
  'persistPublicResult',
  'savePublicResult',
  'database.write(',
  'db.'
] as const;

const PERSISTENT_ROUTE_PATTERNS = ['src/app/r/[', 'src/app/r/[resultId]', 'src/app/r/[slug]'] as const;

export function runPhase5PreviewClosureGate(options: Phase5PreviewClosureGateOptions = {}): Phase5PreviewClosureGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase4Closure = runPhase4ClosureGate({ repoRoot });
  const publicLinkPrivacy = runPublicLinkPrivacy({ repoRoot });
  const publicResultDto = runPublicResultDtoContract({ repoRoot });
  const publicLinkPreview = runPublicLinkPreviewContract({ repoRoot });

  const previewSource = PREVIEW_SCOPE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedScopeSignals = findSignals(previewSource, BLOCKED_SCOPE_SIGNALS);
  const missingDtoBoundarySignals = missingSignals(previewSource, DTO_BOUNDARY_SIGNALS);
  const persistentPublicRouteFiles = findExistingPersistentRouteFiles(repoRoot);

  const gates = {
    phase4ClosurePassed: phase4Closure.gates.overallPassed,
    publicLinkPrivacyPassed: publicLinkPrivacy.gates.overallPassed,
    publicResultDtoContractPassed: publicResultDto.gates.overallPassed,
    publicLinkPreviewContractPassed: publicLinkPreview.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase5'] === 'tsx scripts/phase5-preview-closure-gate.ts',
    validateScriptRunsPhase5ClosureGate: validateScript.includes('npm run closure:phase5'),
    validateScriptRunsPublicLinkPrivacy: validateScript.includes('npm run privacy:public-link'),
    validateScriptRunsPublicResultDto: validateScript.includes('npm run contract:public-dto'),
    validateScriptRunsPublicLinkPreview: validateScript.includes('npm run preview:public-link'),
    phase5ClosureReviewDocExists: existsSync(path.join(repoRoot, PHASE_5_CLOSURE_REVIEW_DOC)),
    phase6TransitionDocExists: existsSync(path.join(repoRoot, PHASE_6_TRANSITION_DOC)),
    dtoOnlyPreviewScopePreserved: missingDtoBoundarySignals.length === 0 && publicLinkPreview.gates.localDtoPreviewPassed,
    localPreviewRouteOnly: existsSync(path.join(repoRoot, PREVIEW_ROUTE)) && persistentPublicRouteFiles.length === 0,
    noPersistentPublicIdLookupScope: persistentPublicRouteFiles.length === 0,
    noBackendApiDatabaseAuthPaymentAiScope: blockedScopeSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_5_PREVIEW_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_5_PREVIEW_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-5-preview-closure',
      phase4ClosureSchemaVersion: phase4Closure.schemaVersion,
      publicLinkPrivacySchemaVersion: publicLinkPrivacy.schemaVersion,
      publicResultDtoSchemaVersion: publicResultDto.schemaVersion,
      publicLinkPreviewSchemaVersion: publicLinkPreview.schemaVersion
    },
    gates: completeGates,
    docs: {
      phase5ClosureReview: PHASE_5_CLOSURE_REVIEW_DOC,
      phase6Transition: PHASE_6_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      phase4IssueCount: phase4Closure.issues.length,
      privacyIssueCount: publicLinkPrivacy.issues.length,
      dtoIssueCount: publicResultDto.issues.length,
      previewIssueCount: publicLinkPreview.issues.length,
      previewRouteCount: 1,
      previewDtoKeyCount: publicLinkPreview.samplePreview.dtoKeyCount,
      previewSectionCount: publicLinkPreview.samplePreview.sectionCount,
      checkedPreviewFileCount: PREVIEW_SCOPE_FILES.length,
      blockedSignalCount: blockedScopeSignals.length,
      persistentRouteFileCount: persistentPublicRouteFiles.length
    },
    files: {
      previewRoute: PREVIEW_ROUTE,
      previewClient: PREVIEW_CLIENT,
      previewHelper: PREVIEW_HELPER,
      phase5ClosureReview: PHASE_5_CLOSURE_REVIEW_DOC,
      phase6Transition: PHASE_6_TRANSITION_DOC
    },
    signalScan: {
      blockedScopeSignals,
      persistentPublicRouteFiles,
      missingDtoBoundarySignals
    },
    issues: buildIssues(completeGates, {
      phase4Issues: phase4Closure.issues,
      privacyIssues: publicLinkPrivacy.issues,
      dtoIssues: publicResultDto.issues,
      previewIssues: publicLinkPreview.issues,
      blockedScopeSignals,
      persistentPublicRouteFiles,
      missingDtoBoundarySignals
    })
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase5PreviewClosureGateReport['scripts'] {
  const scripts: {
    validate?: string;
    privacyPublicLink?: string;
    contractPublicDto?: string;
    previewPublicLink?: string;
    closurePhase5?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['privacy:public-link'] !== undefined) scripts.privacyPublicLink = packageJson.scripts['privacy:public-link'];
  if (packageJson.scripts?.['contract:public-dto'] !== undefined) scripts.contractPublicDto = packageJson.scripts['contract:public-dto'];
  if (packageJson.scripts?.['preview:public-link'] !== undefined) scripts.previewPublicLink = packageJson.scripts['preview:public-link'];
  if (packageJson.scripts?.['closure:phase5'] !== undefined) scripts.closurePhase5 = packageJson.scripts['closure:phase5'];
  return scripts;
}

function buildIssues(
  gates: Phase5PreviewClosureGateReport['gates'],
  inputs: Readonly<{
    phase4Issues: readonly string[];
    privacyIssues: readonly string[];
    dtoIssues: readonly string[];
    previewIssues: readonly string[];
    blockedScopeSignals: readonly string[];
    persistentPublicRouteFiles: readonly string[];
    missingDtoBoundarySignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`phase5_preview_closure_gate_failed:${key}`);
  }

  for (const issue of inputs.phase4Issues) issues.push(`phase5_preview_closure_phase4_issue:${issue}`);
  for (const issue of inputs.privacyIssues) issues.push(`phase5_preview_closure_privacy_issue:${issue}`);
  for (const issue of inputs.dtoIssues) issues.push(`phase5_preview_closure_dto_issue:${issue}`);
  for (const issue of inputs.previewIssues) issues.push(`phase5_preview_closure_preview_issue:${issue}`);
  for (const signal of inputs.blockedScopeSignals) issues.push(`phase5_preview_closure_blocked_scope:${signal}`);
  for (const file of inputs.persistentPublicRouteFiles) issues.push(`phase5_preview_closure_persistent_route:${file}`);
  for (const signal of inputs.missingDtoBoundarySignals) issues.push(`phase5_preview_closure_missing_dto_boundary:${signal}`);

  return issues;
}

function findExistingPersistentRouteFiles(repoRoot: string): string[] {
  return PERSISTENT_ROUTE_PATTERNS.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}

function findSignals(source: string, signals: readonly string[]): string[] {
  const lowerSource = source.toLowerCase();
  return signals.filter((signal) => lowerSource.includes(signal.toLowerCase()));
}

function missingSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => !source.includes(signal));
}

function readOptionalFile(repoRoot: string, relativeFile: string): string {
  const absolutePath = path.join(repoRoot, relativeFile);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};

  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;
  if (!isRecord(parsed) || !isRecordOfStrings(parsed.scripts)) return {};

  return { scripts: parsed.scripts };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}
