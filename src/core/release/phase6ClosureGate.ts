import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runInMemoryPublicResultStorageContract } from './inMemoryPublicResultStorageContract';
import { runLocalPersistentLinkFlowContract } from './localPersistentLinkFlowContract';
import { runPublicLinkLifecycleUiContract } from './publicLinkLifecycleUiContract';
import { runPublicResultStorageContract } from './publicResultStorageContract';

export const PHASE_6_CLOSURE_SCHEMA_VERSION = 'phase-6.4-public-link-lifecycle-closure-gate-v1' as const;
export const PHASE_6_CLOSURE_ID = 'phase-6-public-link-lifecycle-closure-gate' as const;

export interface Phase6ClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase6ClosureGateReport {
  readonly schemaVersion: typeof PHASE_6_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_6_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-6-public-link-lifecycle-closure';
    readonly publicStorageSchemaVersion: string;
    readonly inMemoryStorageSchemaVersion: string;
    readonly localFlowSchemaVersion: string;
    readonly lifecycleUiSchemaVersion: string;
  };
  readonly gates: {
    readonly publicStorageContractPassed: boolean;
    readonly inMemoryAdapterContractPassed: boolean;
    readonly localPersistentFlowContractPassed: boolean;
    readonly lifecycleUiContractPassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase6ClosureGate: boolean;
    readonly validateScriptRunsPublicStorageContract: boolean;
    readonly validateScriptRunsInMemoryAdapterContract: boolean;
    readonly validateScriptRunsLocalFlowContract: boolean;
    readonly validateScriptRunsLifecycleUiContract: boolean;
    readonly phase6ClosureReviewDocExists: boolean;
    readonly phase7TransitionDocExists: boolean;
    readonly noBackendApiDatabaseAuthPaymentAiAnalyticsScope: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noNetworkPersistenceSignalsInLifecycleScope: boolean;
    readonly dtoOnlyLifecyclePreserved: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase6ClosureReview: string;
    readonly phase7Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly publicStorageContract?: string;
    readonly inMemoryAdapterContract?: string;
    readonly localFlowContract?: string;
    readonly lifecycleUiContract?: string;
    readonly closurePhase6?: string;
  };
  readonly coverage: {
    readonly publicStorageIssueCount: number;
    readonly inMemoryIssueCount: number;
    readonly localFlowIssueCount: number;
    readonly lifecycleUiIssueCount: number;
    readonly lifecycleCheckedFileCount: number;
    readonly blockedPathCount: number;
    readonly persistentRouteCount: number;
    readonly blockedSignalCount: number;
    readonly networkPersistenceSignalCount: number;
    readonly rawPrivateSignalCount: number;
  };
  readonly files: {
    readonly lifecycleUiHelper: string;
    readonly resultsClient: string;
    readonly phase6ClosureReview: string;
    readonly phase7Transition: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly networkPersistenceSignals: readonly string[];
    readonly rawPrivateSignals: readonly string[];
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PHASE_6_CLOSURE_REVIEW_DOC = 'docs/release/phase-6-closure-review.md';
const PHASE_7_TRANSITION_DOC = 'docs/ui/phase-7-transition-plan.md';
const LIFECYCLE_UI_HELPER = 'src/features/results/publicLinkLifecycleUi.ts';
const RESULTS_CLIENT = 'src/features/results/ResultsClient.tsx';
const PUBLIC_STORAGE = 'src/core/public-link/publicResultStorage.ts';
const IN_MEMORY_STORAGE = 'src/core/public-link/inMemoryPublicResultStorage.ts';
const LOCAL_FLOW = 'src/core/public-link/localPersistentLinkFlow.ts';
const LIFECYCLE_UI_CONTRACT = 'src/core/release/publicLinkLifecycleUiContract.ts';

const CHECKED_FILES = [
  LIFECYCLE_UI_HELPER,
  RESULTS_CLIENT,
  PUBLIC_STORAGE,
  IN_MEMORY_STORAGE,
  LOCAL_FLOW,
  LIFECYCLE_UI_CONTRACT,
  'docs/release/phase-6-public-link-lifecycle-ui-stub.md',
  'docs/release/phase-6-local-persistent-link-flow-stub.md',
  'docs/release/phase-6-in-memory-public-result-storage-adapter.md',
  'docs/release/phase-6-persistent-public-result-link-storage-contract.md'
] as const;

const IMPLEMENTATION_SCOPE_FILES = [
  LIFECYCLE_UI_HELPER,
  RESULTS_CLIENT,
  PUBLIC_STORAGE,
  IN_MEMORY_STORAGE,
  LOCAL_FLOW
] as const;

const LIFECYCLE_DTO_SCOPE_FILES = [LIFECYCLE_UI_HELPER, LOCAL_FLOW, IN_MEMORY_STORAGE] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/app/api',
  'src/server',
  'src/backend',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'src/auth',
  'src/payments',
  'src/ai',
  'src/analytics'
] as const;

const PERSISTENT_PUBLIC_ROUTE_PATHS = [
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[resultId]',
  'src/features/publicResultRoute'
] as const;

const BLOCKED_IMPLEMENTATION_SIGNALS = [
  '@supabase',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect',
  'database.write',
  'db.insert',
  'db.select',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'posthog',
  'analytics.track'
] as const;

const NETWORK_OR_BROWSER_PERSISTENCE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem',
  'sessionStorage.setItem',
  'indexedDB.open',
  'caches.open('
] as const;

const RAW_OR_PRIVATE_SIGNALS = [
  'rawAnswers',
  'questionAnswers',
  'selectedAnswer',
  'answerText',
  'questionId',
  'tagScores',
  'axisScoresRaw',
  'privateReportSeed',
  'sessionStorageEnvelope',
  'evidenceDigest',
  'evidenceRefs'
] as const;

export async function runPhase6ClosureGate(options: Phase6ClosureGateOptions = {}): Promise<Phase6ClosureGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const publicStorage = runPublicResultStorageContract({ repoRoot });
  const inMemory = await runInMemoryPublicResultStorageContract({ repoRoot });
  const localFlow = await runLocalPersistentLinkFlowContract({ repoRoot });
  const lifecycleUi = await runPublicLinkLifecycleUiContract({ repoRoot });
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_SCOPE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const lifecycleSource = LIFECYCLE_DTO_SCOPE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_ROUTE_PATHS);
  void checkedSource;
  const blockedSignals = findSignals(implementationSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const networkPersistenceSignals = findSignals(lifecycleSource, NETWORK_OR_BROWSER_PERSISTENCE_SIGNALS);
  const rawPrivateSignals = findSignals(lifecycleSource, RAW_OR_PRIVATE_SIGNALS);

  const gates = {
    publicStorageContractPassed: publicStorage.gates.overallPassed,
    inMemoryAdapterContractPassed: inMemory.gates.overallPassed,
    localPersistentFlowContractPassed: localFlow.gates.overallPassed,
    lifecycleUiContractPassed: lifecycleUi.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase6'] === 'tsx scripts/phase6-closure-gate.ts',
    validateScriptRunsPhase6ClosureGate: validateScript.includes('npm run closure:phase6'),
    validateScriptRunsPublicStorageContract: validateScript.includes('npm run contract:public-storage'),
    validateScriptRunsInMemoryAdapterContract: validateScript.includes('npm run adapter:public-storage-memory'),
    validateScriptRunsLocalFlowContract: validateScript.includes('npm run flow:public-link-memory'),
    validateScriptRunsLifecycleUiContract: validateScript.includes('npm run lifecycle:public-link-ui'),
    phase6ClosureReviewDocExists: existsSync(path.join(repoRoot, PHASE_6_CLOSURE_REVIEW_DOC)),
    phase7TransitionDocExists: existsSync(path.join(repoRoot, PHASE_7_TRANSITION_DOC)),
    noBackendApiDatabaseAuthPaymentAiAnalyticsScope: blockedPaths.length === 0 && blockedSignals.length === 0,
    noPersistentPublicLookupRoute: persistentRouteFiles.length === 0,
    noNetworkPersistenceSignalsInLifecycleScope: networkPersistenceSignals.length === 0,
    dtoOnlyLifecyclePreserved:
      lifecycleUi.gates.noRawChoiceOrPrivateScoreSignals &&
      localFlow.gates.dtoOnlyStoragePreserved &&
      inMemory.gates.dtoOnlyRecordsPreserved &&
      rawPrivateSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_6_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_6_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-6-public-link-lifecycle-closure',
      publicStorageSchemaVersion: publicStorage.schemaVersion,
      inMemoryStorageSchemaVersion: inMemory.schemaVersion,
      localFlowSchemaVersion: localFlow.schemaVersion,
      lifecycleUiSchemaVersion: lifecycleUi.schemaVersion
    },
    gates: completeGates,
    docs: {
      phase6ClosureReview: PHASE_6_CLOSURE_REVIEW_DOC,
      phase7Transition: PHASE_7_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      publicStorageIssueCount: publicStorage.issues.length,
      inMemoryIssueCount: inMemory.issues.length,
      localFlowIssueCount: localFlow.issues.length,
      lifecycleUiIssueCount: lifecycleUi.issues.length,
      lifecycleCheckedFileCount: CHECKED_FILES.length,
      blockedPathCount: blockedPaths.length,
      persistentRouteCount: persistentRouteFiles.length,
      blockedSignalCount: blockedSignals.length,
      networkPersistenceSignalCount: networkPersistenceSignals.length,
      rawPrivateSignalCount: rawPrivateSignals.length
    },
    files: {
      lifecycleUiHelper: LIFECYCLE_UI_HELPER,
      resultsClient: RESULTS_CLIENT,
      phase6ClosureReview: PHASE_6_CLOSURE_REVIEW_DOC,
      phase7Transition: PHASE_7_TRANSITION_DOC
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      persistentRouteFiles,
      blockedSignals,
      networkPersistenceSignals,
      rawPrivateSignals
    },
    issues: buildIssues(completeGates, blockedPaths, persistentRouteFiles, blockedSignals, networkPersistenceSignals, rawPrivateSignals, {
      publicStorageIssues: publicStorage.issues,
      inMemoryIssues: inMemory.issues,
      localFlowIssues: localFlow.issues,
      lifecycleUiIssues: lifecycleUi.issues
    })
  };
}

export async function writePhase6ClosureEvidence(
  report: Phase6ClosureGateReport,
  outputPath = 'docs/evidence/phase6-closure-latest.json'
): Promise<void> {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase6ClosureGateReport['scripts'] {
  const scripts: {
    validate?: string;
    publicStorageContract?: string;
    inMemoryAdapterContract?: string;
    localFlowContract?: string;
    lifecycleUiContract?: string;
    closurePhase6?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:public-storage'] !== undefined) scripts.publicStorageContract = packageJson.scripts['contract:public-storage'];
  if (packageJson.scripts?.['adapter:public-storage-memory'] !== undefined) scripts.inMemoryAdapterContract = packageJson.scripts['adapter:public-storage-memory'];
  if (packageJson.scripts?.['flow:public-link-memory'] !== undefined) scripts.localFlowContract = packageJson.scripts['flow:public-link-memory'];
  if (packageJson.scripts?.['lifecycle:public-link-ui'] !== undefined) scripts.lifecycleUiContract = packageJson.scripts['lifecycle:public-link-ui'];
  if (packageJson.scripts?.['closure:phase6'] !== undefined) scripts.closurePhase6 = packageJson.scripts['closure:phase6'];
  return scripts;
}

function buildIssues(
  gates: Phase6ClosureGateReport['gates'],
  blockedPaths: readonly string[],
  persistentRouteFiles: readonly string[],
  blockedSignals: readonly string[],
  networkPersistenceSignals: readonly string[],
  rawPrivateSignals: readonly string[],
  nestedIssues: {
    readonly publicStorageIssues: readonly string[];
    readonly inMemoryIssues: readonly string[];
    readonly localFlowIssues: readonly string[];
    readonly lifecycleUiIssues: readonly string[];
  }
): string[] {
  const issues: string[] = [];
  if (!gates.publicStorageContractPassed) issues.push(...nestedIssues.publicStorageIssues.map((issue) => `public_storage:${issue}`));
  if (!gates.inMemoryAdapterContractPassed) issues.push(...nestedIssues.inMemoryIssues.map((issue) => `in_memory:${issue}`));
  if (!gates.localPersistentFlowContractPassed) issues.push(...nestedIssues.localFlowIssues.map((issue) => `local_flow:${issue}`));
  if (!gates.lifecycleUiContractPassed) issues.push(...nestedIssues.lifecycleUiIssues.map((issue) => `lifecycle_ui:${issue}`));
  if (!gates.closureScriptExists) issues.push('missing_closure_phase6_script');
  if (!gates.validateScriptRunsPhase6ClosureGate) issues.push('validate_does_not_run_phase6_closure_gate');
  if (!gates.validateScriptRunsPublicStorageContract) issues.push('validate_does_not_run_public_storage_contract');
  if (!gates.validateScriptRunsInMemoryAdapterContract) issues.push('validate_does_not_run_in_memory_adapter_contract');
  if (!gates.validateScriptRunsLocalFlowContract) issues.push('validate_does_not_run_local_persistent_link_flow_contract');
  if (!gates.validateScriptRunsLifecycleUiContract) issues.push('validate_does_not_run_public_link_lifecycle_ui_contract');
  if (!gates.phase6ClosureReviewDocExists) issues.push(`missing_phase6_closure_review:${PHASE_6_CLOSURE_REVIEW_DOC}`);
  if (!gates.phase7TransitionDocExists) issues.push(`missing_phase7_transition_plan:${PHASE_7_TRANSITION_DOC}`);
  for (const item of blockedPaths) issues.push(`blocked_path:${item}`);
  for (const item of persistentRouteFiles) issues.push(`persistent_public_lookup_route:${item}`);
  for (const item of blockedSignals) issues.push(`blocked_signal:${item}`);
  for (const item of networkPersistenceSignals) issues.push(`network_or_browser_persistence_signal:${item}`);
  for (const item of rawPrivateSignals) issues.push(`raw_or_private_lifecycle_signal:${item}`);
  if (!gates.dtoOnlyLifecyclePreserved) issues.push('dto_only_lifecycle_not_preserved');
  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}

function findSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => source.includes(signal));
}
