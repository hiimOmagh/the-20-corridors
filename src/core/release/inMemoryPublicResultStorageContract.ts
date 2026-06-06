import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { createInMemoryPublicResultStorageAdapter } from '../public-link/inMemoryPublicResultStorage';
import { buildPublicResultDto, type PublicResultDtoMetadata } from '../public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash,
  containsForbiddenPublicResultStorageKeys,
  type PublicResultStorageCreateInput
} from '../public-link/publicResultStorage';
import { runPublicResultStorageContract } from './publicResultStorageContract';

export const IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION = 'phase-6.1-in-memory-public-result-storage-adapter-v1' as const;
export const IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_ID = 'phase-6-in-memory-public-result-storage-adapter' as const;

export interface InMemoryPublicResultStorageContractOptions {
  readonly repoRoot?: string;
}

export interface InMemoryPublicResultStorageContractReport {
  readonly schemaVersion: typeof IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-6-in-memory-adapter-only';
    readonly publicStorageContractSchemaVersion: string;
  };
  readonly gates: {
    readonly publicStorageContractPassed: boolean;
    readonly adapterFileExists: boolean;
    readonly adapterContractScriptExists: boolean;
    readonly validateScriptRunsAdapterContract: boolean;
    readonly contractDocExists: boolean;
    readonly phase61StatusDocExists: boolean;
    readonly createReadDeletePruneFlowPassed: boolean;
    readonly duplicateIdGuardPassed: boolean;
    readonly dtoOnlyRecordsPreserved: boolean;
    readonly inMemoryDiagnosticsPassed: boolean;
    readonly noBackendApiDatabaseAuthPaymentAiImplementation: boolean;
    readonly noRawChoiceOrPrivateScoreLeakage: boolean;
    readonly noPersistentPublicRouteYet: boolean;
    readonly noExternalNetworkOrBrowserPersistenceSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly contract: string;
    readonly phase61Status: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly publicStorageContract?: string;
    readonly inMemoryAdapterContract?: string;
  };
  readonly adapterFlow: {
    readonly createdStatus: string;
    readonly readStatus: string;
    readonly wrongDeleteStatus: string;
    readonly deletedStatus: string;
    readonly prunedDeletedCount: number;
    readonly duplicateRejected: boolean;
    readonly diagnosticsRecordCountBeforePrune: number;
    readonly diagnosticsRecordCountAfterPrune: number;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly externalNetworkOrBrowserPersistenceSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly publicStorageIssueCount: number;
    readonly checkedFileCount: number;
    readonly adapterOperationCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const IN_MEMORY_ADAPTER_PATH = 'src/core/public-link/inMemoryPublicResultStorage.ts';
const CONTRACT_DOC = 'docs/release/phase-6-in-memory-public-result-storage-adapter.md';
const PHASE_6_1_STATUS_DOC = 'docs/ui/phase-6-1-in-memory-public-result-storage-adapter-status.md';

const CHECKED_FILES = [
  IN_MEMORY_ADAPTER_PATH,
  CONTRACT_DOC,
  PHASE_6_1_STATUS_DOC
] as const;

const BLOCKED_SCOPE_PATHS = [
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
  'signOut('
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

const EXTERNAL_NETWORK_OR_BROWSER_PERSISTENCE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'localStorage.setItem',
  'sessionStorage.setItem',
  'indexedDB.open',
  'caches.open('
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'in-memory adapter only',
  'no database',
  'no backend API route',
  'minimized PublicResultDto-only records',
  'create/read/delete/prune',
  'not a persistence layer'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_PUBLIC_ID = 'pub_7Kf9sQ2mN8xR4vB6tY3cH1pZ';
const SAMPLE_DELETE_TOKEN = 'tok_7Kf9sQ2mN8xR4vB6tY3cH1pZ_secret';

export async function runInMemoryPublicResultStorageContract(
  options: InMemoryPublicResultStorageContractOptions = {}
): Promise<InMemoryPublicResultStorageContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const publicStorageContract = runPublicResultStorageContract({ repoRoot });
  const adapterSource = readOptionalFile(repoRoot, IN_MEMORY_ADAPTER_PATH);
  const contractDoc = readOptionalFile(repoRoot, CONTRACT_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const flow = await runAdapterFlow();
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_ROUTE_PATHS);
  const blockedSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrPrivateSignals = findSignals(adapterSource, RAW_OR_PRIVATE_SIGNALS);
  const externalNetworkOrBrowserPersistenceSignals = findSignals(adapterSource, EXTERNAL_NETWORK_OR_BROWSER_PERSISTENCE_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);

  const gates = {
    publicStorageContractPassed: publicStorageContract.gates.overallPassed,
    adapterFileExists: existsSync(path.join(repoRoot, IN_MEMORY_ADAPTER_PATH)),
    adapterContractScriptExists: packageJson.scripts?.['adapter:public-storage-memory'] === 'tsx scripts/in-memory-public-result-storage-contract.ts',
    validateScriptRunsAdapterContract: validateScript.includes('npm run adapter:public-storage-memory'),
    contractDocExists: existsSync(path.join(repoRoot, CONTRACT_DOC)),
    phase61StatusDocExists: existsSync(path.join(repoRoot, PHASE_6_1_STATUS_DOC)),
    createReadDeletePruneFlowPassed: flow.createdStatus === 'active' && flow.readStatus === 'active' && flow.deletedStatus === 'deleted' && flow.prunedDeletedCount === 1,
    duplicateIdGuardPassed: flow.duplicateRejected,
    dtoOnlyRecordsPreserved: flow.dtoOnlyRecordsPreserved,
    inMemoryDiagnosticsPassed: flow.diagnosticsRecordCountBeforePrune === 1 && flow.diagnosticsRecordCountAfterPrune === 0,
    noBackendApiDatabaseAuthPaymentAiImplementation: blockedPaths.length === 0 && blockedSignals.length === 0,
    noRawChoiceOrPrivateScoreLeakage: rawOrPrivateSignals.length === 0,
    noPersistentPublicRouteYet: persistentRouteFiles.length === 0,
    noExternalNetworkOrBrowserPersistenceSignals: externalNetworkOrBrowserPersistenceSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION,
    contractId: IN_MEMORY_PUBLIC_RESULT_STORAGE_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-6-in-memory-adapter-only',
      publicStorageContractSchemaVersion: publicStorageContract.schemaVersion
    },
    gates: completeGates,
    docs: {
      contract: CONTRACT_DOC,
      phase61Status: PHASE_6_1_STATUS_DOC
    },
    scripts: buildScriptSummary(packageJson),
    adapterFlow: {
      createdStatus: flow.createdStatus,
      readStatus: flow.readStatus,
      wrongDeleteStatus: flow.wrongDeleteStatus,
      deletedStatus: flow.deletedStatus,
      prunedDeletedCount: flow.prunedDeletedCount,
      duplicateRejected: flow.duplicateRejected,
      diagnosticsRecordCountBeforePrune: flow.diagnosticsRecordCountBeforePrune,
      diagnosticsRecordCountAfterPrune: flow.diagnosticsRecordCountAfterPrune
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      persistentRouteFiles,
      blockedSignals,
      rawOrPrivateSignals,
      externalNetworkOrBrowserPersistenceSignals,
      missingContractPhrases
    },
    coverage: {
      publicStorageIssueCount: publicStorageContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      adapterOperationCount: 5
    },
    issues: buildIssues(completeGates, {
      publicStorageIssues: publicStorageContract.issues,
      blockedPaths,
      persistentRouteFiles,
      blockedSignals,
      rawOrPrivateSignals,
      externalNetworkOrBrowserPersistenceSignals,
      missingContractPhrases
    })
  };
}

async function runAdapterFlow(): Promise<Readonly<{
  createdStatus: string;
  readStatus: string;
  wrongDeleteStatus: string;
  deletedStatus: string;
  prunedDeletedCount: number;
  duplicateRejected: boolean;
  dtoOnlyRecordsPreserved: boolean;
  diagnosticsRecordCountBeforePrune: number;
  diagnosticsRecordCountAfterPrune: number;
}>> {
  const storage = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-06-07T00:00:00.000Z' });
  const input = buildSampleCreateInput();
  const created = await storage.create(input);
  const read = await storage.read(input.publicId);
  let duplicateRejected = false;
  try {
    await storage.create(input);
  } catch {
    duplicateRejected = true;
  }
  const wrongDelete = await storage.delete({ publicId: input.publicId, deleteToken: 'tok_wrongWrongWrongWrongWrongWrongWrong' });
  const deleted = await storage.delete({ publicId: input.publicId, deleteToken: SAMPLE_DELETE_TOKEN });
  const diagnosticsBeforePrune = storage.diagnostics();
  const pruned = await storage.pruneExpired('2026-06-08T00:00:00.000Z');
  const diagnosticsAfterPrune = storage.diagnostics();

  return {
    createdStatus: created.status,
    readStatus: read.status,
    wrongDeleteStatus: wrongDelete.status,
    deletedStatus: deleted.status,
    prunedDeletedCount: pruned.deletedCount,
    duplicateRejected,
    dtoOnlyRecordsPreserved: !containsForbiddenPublicResultStorageKeys(created) && !containsForbiddenPublicResultStorageKeys(read.record) && !containsForbiddenPublicResultStorageKeys(deleted.record),
    diagnosticsRecordCountBeforePrune: diagnosticsBeforePrune.recordCount,
    diagnosticsRecordCountAfterPrune: diagnosticsAfterPrune.recordCount
  };
}

function buildSampleCreateInput(): PublicResultStorageCreateInput {
  const createdAt = '2026-06-06T00:00:00.000Z';
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN);
  const metadata: PublicResultDtoMetadata = {
    resultId: SAMPLE_PUBLIC_ID,
    createdAt,
    expiresAt,
    deleteTokenHash
  };
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata);

  return {
    publicId: SAMPLE_PUBLIC_ID,
    dto,
    createdAt,
    expiresAt,
    deleteTokenHash
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): InMemoryPublicResultStorageContractReport['scripts'] {
  const scripts: {
    validate?: string;
    publicStorageContract?: string;
    inMemoryAdapterContract?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:public-storage'] !== undefined) scripts.publicStorageContract = packageJson.scripts['contract:public-storage'];
  if (packageJson.scripts?.['adapter:public-storage-memory'] !== undefined) scripts.inMemoryAdapterContract = packageJson.scripts['adapter:public-storage-memory'];
  return scripts;
}

function buildIssues(
  gates: InMemoryPublicResultStorageContractReport['gates'],
  inputs: Readonly<{
    publicStorageIssues: readonly string[];
    blockedPaths: readonly string[];
    persistentRouteFiles: readonly string[];
    blockedSignals: readonly string[];
    rawOrPrivateSignals: readonly string[];
    externalNetworkOrBrowserPersistenceSignals: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`in_memory_public_storage_contract_failed:${key}`);
  }
  for (const issue of inputs.publicStorageIssues) issues.push(`public_storage:${issue}`);
  for (const pathName of inputs.blockedPaths) issues.push(`blocked_scope_path:${pathName}`);
  for (const pathName of inputs.persistentRouteFiles) issues.push(`persistent_public_route_present:${pathName}`);
  for (const signal of inputs.blockedSignals) issues.push(`blocked_scope_signal:${signal}`);
  for (const signal of inputs.rawOrPrivateSignals) issues.push(`raw_or_private_adapter_signal:${signal}`);
  for (const signal of inputs.externalNetworkOrBrowserPersistenceSignals) issues.push(`external_or_browser_persistence_signal:${signal}`);
  for (const phrase of inputs.missingContractPhrases) issues.push(`missing_contract_phrase:${phrase}`);
  return [...new Set(issues)].sort();
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return '';
  return readFileSync(absolutePath, 'utf8');
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
