import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runLocalPersistentLinkFlowContract } from './localPersistentLinkFlowContract';

export const PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_SCHEMA_VERSION = 'phase-6.3-public-link-lifecycle-ui-stub-v1' as const;
export const PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_ID = 'phase-6-public-link-lifecycle-ui-stub' as const;

export interface PublicLinkLifecycleUiContractOptions {
  readonly repoRoot?: string;
}

export interface PublicLinkLifecycleUiContractReport {
  readonly schemaVersion: typeof PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-6-local-public-link-lifecycle-ui-only';
    readonly localFlowSchemaVersion: string;
  };
  readonly gates: {
    readonly localFlowContractPassed: boolean;
    readonly uiHelperExists: boolean;
    readonly resultsClientExists: boolean;
    readonly lifecycleScriptExists: boolean;
    readonly validateScriptRunsLifecycleUi: boolean;
    readonly statusDocExists: boolean;
    readonly lifecycleSectionRendered: boolean;
    readonly lifecycleControlsRendered: boolean;
    readonly usesLocalPreviewRouteOnly: boolean;
    readonly noApiDatabasePersistentRoute: boolean;
    readonly noAuthPaymentAiAnalytics: boolean;
    readonly noNetworkOrBrowserPersistenceSignals: boolean;
    readonly noRawChoiceOrPrivateScoreSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly status: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly lifecyclePublicLinkUi?: string;
    readonly localFlowContract?: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly networkOrPersistenceSignals: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly missingUiSignals: readonly string[];
  };
  readonly coverage: {
    readonly localFlowIssueCount: number;
    readonly checkedFileCount: number;
    readonly requiredUiSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const UI_HELPER_PATH = 'src/features/results/publicLinkLifecycleUi.ts';
const RESULTS_CLIENT_PATH = 'src/features/results/ResultsClient.tsx';
const STATUS_DOC = 'docs/ui/phase-6-3-public-link-lifecycle-ui-stub-status.md';

const CHECKED_FILES = [UI_HELPER_PATH, RESULTS_CLIENT_PATH, STATUS_DOC] as const;

const REQUIRED_UI_SIGNALS = [
  'public-link-lifecycle',
  'Create local link stub',
  'Delete local stub',
  'Reset lifecycle stub',
  'minimized DTO',
  'No backend API route',
  'database',
  'auth',
  'payment',
  'analytics',
  'AI'
] as const;

const BLOCKED_PATHS = [
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/server',
  'src/api',
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

const BLOCKED_SIGNALS = [
  '@supabase',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
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

export async function runPublicLinkLifecycleUiContract(
  options: PublicLinkLifecycleUiContractOptions = {}
): Promise<PublicLinkLifecycleUiContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const localFlow = await runLocalPersistentLinkFlowContract({ repoRoot });
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const uiHelperSource = readOptionalFile(repoRoot, UI_HELPER_PATH);
  const resultsClientSource = readOptionalFile(repoRoot, RESULTS_CLIENT_PATH);
  const blockedPaths = existingPaths(repoRoot, BLOCKED_PATHS);
  const blockedSignals = findSignals(checkedSource, BLOCKED_SIGNALS);
  const networkOrPersistenceSignals = findSignals(uiHelperSource, NETWORK_OR_BROWSER_PERSISTENCE_SIGNALS);
  const rawOrPrivateSignals = findSignals(uiHelperSource, RAW_OR_PRIVATE_SIGNALS);
  const missingUiSignals = missingSignals(`${resultsClientSource}\n${uiHelperSource}\n${readOptionalFile(repoRoot, STATUS_DOC)}`, REQUIRED_UI_SIGNALS);

  const gates = {
    localFlowContractPassed: localFlow.gates.overallPassed,
    uiHelperExists: existsSync(path.join(repoRoot, UI_HELPER_PATH)),
    resultsClientExists: existsSync(path.join(repoRoot, RESULTS_CLIENT_PATH)),
    lifecycleScriptExists: packageJson.scripts?.['lifecycle:public-link-ui'] === 'tsx scripts/public-link-lifecycle-ui-contract.ts',
    validateScriptRunsLifecycleUi: validateScript.includes('npm run lifecycle:public-link-ui'),
    statusDocExists: existsSync(path.join(repoRoot, STATUS_DOC)),
    lifecycleSectionRendered: resultsClientSource.includes('public-link-lifecycle'),
    lifecycleControlsRendered:
      checkedSource.includes('Create local link stub') &&
      checkedSource.includes('Delete local stub') &&
      checkedSource.includes('Reset lifecycle stub'),
    usesLocalPreviewRouteOnly: checkedSource.includes('/r/preview') && !checkedSource.includes('/r/[resultId]'),
    noApiDatabasePersistentRoute: blockedPaths.length === 0,
    noAuthPaymentAiAnalytics: blockedSignals.length === 0,
    noNetworkOrBrowserPersistenceSignals: networkOrPersistenceSignals.length === 0,
    noRawChoiceOrPrivateScoreSignals: rawOrPrivateSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_LINK_LIFECYCLE_UI_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-6-local-public-link-lifecycle-ui-only',
      localFlowSchemaVersion: localFlow.schemaVersion
    },
    gates: completeGates,
    docs: { status: STATUS_DOC },
    scripts: buildScriptSummary(packageJson),
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      blockedSignals,
      networkOrPersistenceSignals,
      rawOrPrivateSignals,
      missingUiSignals
    },
    coverage: {
      localFlowIssueCount: localFlow.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      requiredUiSignalCount: REQUIRED_UI_SIGNALS.length
    },
    issues: buildIssues(completeGates, blockedPaths, blockedSignals, networkOrPersistenceSignals, rawOrPrivateSignals, missingUiSignals)
  };
}

export async function writePublicLinkLifecycleUiEvidence(
  report: PublicLinkLifecycleUiContractReport,
  outputPath = 'docs/evidence/public-link-lifecycle-ui-latest.json'
): Promise<void> {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicLinkLifecycleUiContractReport['scripts'] {
  const scripts: { validate?: string; lifecyclePublicLinkUi?: string; localFlowContract?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['lifecycle:public-link-ui'] !== undefined) scripts.lifecyclePublicLinkUi = packageJson.scripts['lifecycle:public-link-ui'];
  if (packageJson.scripts?.['flow:public-link-memory'] !== undefined) scripts.localFlowContract = packageJson.scripts['flow:public-link-memory'];
  return scripts;
}

function buildIssues(
  gates: PublicLinkLifecycleUiContractReport['gates'],
  blockedPaths: readonly string[],
  blockedSignals: readonly string[],
  networkOrPersistenceSignals: readonly string[],
  rawOrPrivateSignals: readonly string[],
  missingUiSignals: readonly string[]
): string[] {
  const issues: string[] = [];
  if (!gates.localFlowContractPassed) issues.push('local_persistent_link_flow_contract_failed');
  if (!gates.uiHelperExists) issues.push(`missing_ui_helper:${UI_HELPER_PATH}`);
  if (!gates.resultsClientExists) issues.push(`missing_results_client:${RESULTS_CLIENT_PATH}`);
  if (!gates.lifecycleScriptExists) issues.push('missing_lifecycle_public_link_ui_script');
  if (!gates.validateScriptRunsLifecycleUi) issues.push('validate_does_not_run_lifecycle_public_link_ui_contract');
  if (!gates.statusDocExists) issues.push(`missing_status_doc:${STATUS_DOC}`);
  if (!gates.lifecycleSectionRendered) issues.push('results_client_missing_public_link_lifecycle_section');
  if (!gates.lifecycleControlsRendered) issues.push('results_client_missing_public_link_lifecycle_controls');
  if (!gates.usesLocalPreviewRouteOnly) issues.push('public_link_lifecycle_does_not_use_local_preview_route_only');
  for (const item of blockedPaths) issues.push(`blocked_path:${item}`);
  for (const item of blockedSignals) issues.push(`blocked_signal:${item}`);
  for (const item of networkOrPersistenceSignals) issues.push(`network_or_browser_persistence_signal:${item}`);
  for (const item of rawOrPrivateSignals) issues.push(`raw_or_private_signal:${item}`);
  for (const item of missingUiSignals) issues.push(`missing_ui_signal:${item}`);
  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};
  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;
  if (!isRecord(parsed) || !isRecordOfStrings(parsed.scripts)) return {};
  return { scripts: parsed.scripts };
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath))).sort();
}

function findSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => source.includes(signal)).sort();
}

function missingSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => !source.includes(signal)).sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}
