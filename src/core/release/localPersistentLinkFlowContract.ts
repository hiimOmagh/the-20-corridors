import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { createInMemoryPublicResultStorageAdapter } from '../public-link/inMemoryPublicResultStorage';
import {
  LOCAL_PERSISTENT_LINK_FLOW_PHASE,
  LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE,
  buildLocalPersistentLinkFlowSummary,
  runLocalPersistentLinkFlowLifecycle
} from '../public-link/localPersistentLinkFlow';
import { runInMemoryPublicResultStorageContract } from './inMemoryPublicResultStorageContract';

export const LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_SCHEMA_VERSION = 'phase-6.2-local-persistent-link-flow-stub-v1' as const;
export const LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_ID = 'phase-6-local-persistent-link-flow-stub' as const;

export interface LocalPersistentLinkFlowContractOptions {
  readonly repoRoot?: string;
}

export interface LocalPersistentLinkFlowContractReport {
  readonly schemaVersion: typeof LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-6-local-flow-helper-only';
    readonly inMemoryAdapterSchemaVersion: string;
  };
  readonly gates: {
    readonly inMemoryAdapterContractPassed: boolean;
    readonly flowHelperExists: boolean;
    readonly flowScriptExists: boolean;
    readonly validateScriptRunsFlowContract: boolean;
    readonly contractDocExists: boolean;
    readonly phase62StatusDocExists: boolean;
    readonly createReadDeleteLifecyclePassed: boolean;
    readonly wrongDeleteTokenRejected: boolean;
    readonly pruneDeletedRecordPassed: boolean;
    readonly dtoOnlyStoragePreserved: boolean;
    readonly deleteTokenBehaviorPassed: boolean;
    readonly previewRouteIsLocalOnlyStub: boolean;
    readonly noRouteApiDatabaseOrPersistentLookup: boolean;
    readonly noAuthPaymentAiAnalytics: boolean;
    readonly noRawChoiceOrPrivateScoreLeakage: boolean;
    readonly noBrowserPersistenceOrNetworkSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly contract: string;
    readonly phase62Status: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly localFlowContract?: string;
    readonly inMemoryAdapterContract?: string;
  };
  readonly lifecycle: {
    readonly phase: typeof LOCAL_PERSISTENT_LINK_FLOW_PHASE;
    readonly previewRoute: typeof LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE;
    readonly createdStatus: string;
    readonly readAfterCreateStatus: string;
    readonly wrongDeleteStatus: string;
    readonly deleteStatus: string;
    readonly readAfterDeleteStatus: string;
    readonly prunedDeletedCount: number;
    readonly rawAnswerLeakageCount: number;
    readonly fullResultLeakageCount: number;
    readonly summary: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly browserPersistenceOrNetworkSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly inMemoryAdapterIssueCount: number;
    readonly checkedFileCount: number;
    readonly lifecycleOperationCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const FLOW_HELPER_PATH = 'src/core/public-link/localPersistentLinkFlow.ts';
const CONTRACT_DOC = 'docs/release/phase-6-local-persistent-link-flow-stub.md';
const PHASE_6_2_STATUS_DOC = 'docs/ui/phase-6-2-local-persistent-link-flow-stub-status.md';

const CHECKED_FILES = [
  FLOW_HELPER_PATH,
  CONTRACT_DOC,
  PHASE_6_2_STATUS_DOC
] as const;

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
  'src/analytics',
  'src/llm'
] as const;

const PERSISTENT_ROUTE_PATHS = [
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

const BROWSER_PERSISTENCE_OR_NETWORK_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem',
  'sessionStorage.setItem',
  'indexedDB.open',
  'caches.open('
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'local persistent-link flow stub',
  'in-memory adapter',
  'no backend API route',
  'no database',
  'no persistent public ID lookup route',
  'minimized PublicResultDto-only records',
  'delete-token behavior'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_PUBLIC_ID = 'pub_6Lk8qP2zR5xT9vN3mB7cY4hA';
const SAMPLE_DELETE_TOKEN = 'tok_6Lk8qP2zR5xT9vN3mB7cY4hA_secret';
const SAMPLE_WRONG_DELETE_TOKEN = 'tok_wrongDeleteTokenForPhase62_localOnly';
const SAMPLE_CREATED_AT = '2026-06-06T12:00:00.000Z';
const SAMPLE_PRUNE_NOW = '2026-08-01T12:00:00.000Z';

export async function runLocalPersistentLinkFlowContract(
  options: LocalPersistentLinkFlowContractOptions = {}
): Promise<LocalPersistentLinkFlowContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const inMemoryAdapterContract = await runInMemoryPublicResultStorageContract({ repoRoot });
  const flowHelperSource = readOptionalFile(repoRoot, FLOW_HELPER_PATH);
  const contractDoc = readOptionalFile(repoRoot, CONTRACT_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const lifecycle = await runSampleLifecycle();
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_ROUTE_PATHS);
  const blockedSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrPrivateSignals = findSignals(flowHelperSource, RAW_OR_PRIVATE_SIGNALS);
  const browserPersistenceOrNetworkSignals = findSignals(flowHelperSource, BROWSER_PERSISTENCE_OR_NETWORK_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);

  const gates = {
    inMemoryAdapterContractPassed: inMemoryAdapterContract.gates.overallPassed,
    flowHelperExists: existsSync(path.join(repoRoot, FLOW_HELPER_PATH)),
    flowScriptExists: packageJson.scripts?.['flow:public-link-memory'] === 'tsx scripts/local-persistent-link-flow-contract.ts',
    validateScriptRunsFlowContract: validateScript.includes('npm run flow:public-link-memory'),
    contractDocExists: existsSync(path.join(repoRoot, CONTRACT_DOC)),
    phase62StatusDocExists: existsSync(path.join(repoRoot, PHASE_6_2_STATUS_DOC)),
    createReadDeleteLifecyclePassed:
      lifecycle.readAfterCreate.status === 'active' &&
      lifecycle.deleteResult.status === 'deleted' &&
      lifecycle.readAfterDelete.status === 'deleted',
    wrongDeleteTokenRejected: lifecycle.wrongDeleteAttempt.status === 'active',
    pruneDeletedRecordPassed: lifecycle.pruneResult.deletedCount === 1,
    dtoOnlyStoragePreserved: lifecycle.rawAnswerLeakageCount === 0 && lifecycle.fullResultLeakageCount === 0,
    deleteTokenBehaviorPassed: lifecycle.wrongDeleteAttempt.status === 'active' && lifecycle.deleteResult.status === 'deleted',
    previewRouteIsLocalOnlyStub: lifecycle.previewRoute === LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE,
    noRouteApiDatabaseOrPersistentLookup: blockedPaths.length === 0 && persistentRouteFiles.length === 0,
    noAuthPaymentAiAnalytics: blockedSignals.length === 0,
    noRawChoiceOrPrivateScoreLeakage: rawOrPrivateSignals.length === 0,
    noBrowserPersistenceOrNetworkSignals: browserPersistenceOrNetworkSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_SCHEMA_VERSION,
    contractId: LOCAL_PERSISTENT_LINK_FLOW_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-6-local-flow-helper-only',
      inMemoryAdapterSchemaVersion: inMemoryAdapterContract.schemaVersion
    },
    gates: completeGates,
    docs: {
      contract: CONTRACT_DOC,
      phase62Status: PHASE_6_2_STATUS_DOC
    },
    scripts: buildScriptSummary(packageJson),
    lifecycle: {
      phase: lifecycle.phase,
      previewRoute: lifecycle.previewRoute,
      createdStatus: lifecycle.created.record.status,
      readAfterCreateStatus: lifecycle.readAfterCreate.status,
      wrongDeleteStatus: lifecycle.wrongDeleteAttempt.status,
      deleteStatus: lifecycle.deleteResult.status,
      readAfterDeleteStatus: lifecycle.readAfterDelete.status,
      prunedDeletedCount: lifecycle.pruneResult.deletedCount,
      rawAnswerLeakageCount: lifecycle.rawAnswerLeakageCount,
      fullResultLeakageCount: lifecycle.fullResultLeakageCount,
      summary: buildLocalPersistentLinkFlowSummary(lifecycle)
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      persistentRouteFiles,
      blockedSignals,
      rawOrPrivateSignals,
      browserPersistenceOrNetworkSignals,
      missingContractPhrases
    },
    coverage: {
      inMemoryAdapterIssueCount: inMemoryAdapterContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      lifecycleOperationCount: 5
    },
    issues: buildIssues(completeGates, {
      inMemoryAdapterIssues: inMemoryAdapterContract.issues,
      blockedPaths,
      persistentRouteFiles,
      blockedSignals,
      rawOrPrivateSignals,
      browserPersistenceOrNetworkSignals,
      missingContractPhrases
    })
  };
}

async function runSampleLifecycle() {
  const sourceResult = runCorridorsEngine(SAMPLE_ANSWERS);
  const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => SAMPLE_CREATED_AT });
  return runLocalPersistentLinkFlowLifecycle(
    adapter,
    {
      sourceResult,
      publicId: SAMPLE_PUBLIC_ID,
      deleteToken: SAMPLE_DELETE_TOKEN,
      createdAt: SAMPLE_CREATED_AT
    },
    SAMPLE_WRONG_DELETE_TOKEN,
    SAMPLE_PRUNE_NOW
  );
}

function buildScriptSummary(packageJson: PackageJsonSubset): LocalPersistentLinkFlowContractReport['scripts'] {
  const scripts: Record<string, string> = {};
  if (packageJson.scripts?.validate) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['flow:public-link-memory']) {
    scripts.localFlowContract = packageJson.scripts['flow:public-link-memory'];
  }
  if (packageJson.scripts?.['adapter:public-storage-memory']) {
    scripts.inMemoryAdapterContract = packageJson.scripts['adapter:public-storage-memory'];
  }
  return scripts;
}

function buildIssues(
  gates: LocalPersistentLinkFlowContractReport['gates'],
  details: {
    readonly inMemoryAdapterIssues: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly browserPersistenceOrNetworkSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  }
): readonly string[] {
  const issues: string[] = [];

  for (const [gate, passed] of Object.entries(gates)) {
    if (gate !== 'overallPassed' && passed === false) {
      issues.push(`local_persistent_link_flow_contract_failed:${gate}`);
    }
  }

  for (const issue of details.inMemoryAdapterIssues) issues.push(`upstream_in_memory_adapter:${issue}`);
  for (const blockedPath of details.blockedPaths) issues.push(`blocked_scope_path_present:${blockedPath}`);
  for (const persistentRoute of details.persistentRouteFiles) issues.push(`persistent_public_route_present:${persistentRoute}`);
  for (const signal of details.blockedSignals) issues.push(`blocked_implementation_signal:${signal}`);
  for (const signal of details.rawOrPrivateSignals) issues.push(`raw_or_private_signal:${signal}`);
  for (const signal of details.browserPersistenceOrNetworkSignals) issues.push(`browser_or_network_persistence_signal:${signal}`);
  for (const phrase of details.missingContractPhrases) issues.push(`missing_contract_phrase:${phrase}`);

  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packagePath = path.join(repoRoot, 'package.json');
  if (!existsSync(packagePath)) return {};
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): readonly string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function missingSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => !source.includes(signal));
}
