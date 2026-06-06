import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import {
  buildPublicResultDto,
  type PublicResultDto,
  type PublicResultDtoMetadata
} from '../public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultStorageRecord,
  containsForbiddenPublicResultStorageKeys,
  isSafeAnonymousPublicResultId,
  listPublicResultStorageRecordKeys,
  PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
  PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS,
  PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
  PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
  type PublicResultStorageRecord
} from '../public-link/publicResultStorage';
import { runPhase5PreviewClosureGate } from './phase5PreviewClosureGate';
import { runPublicResultDtoContract } from './publicResultDtoContract';

export const PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION = 'phase-6.0-public-result-storage-contract-v1' as const;
export const PUBLIC_RESULT_STORAGE_CONTRACT_ID = 'phase-6-persistent-public-result-link-storage-contract' as const;

export interface PublicResultStorageContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultStorageContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_STORAGE_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-6-storage-contract-only';
    readonly phase5ClosureSchemaVersion: string;
    readonly publicResultDtoContractSchemaVersion: string;
    readonly storageSchemaVersion: typeof PUBLIC_RESULT_STORAGE_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly phase5ClosurePassed: boolean;
    readonly publicResultDtoContractPassed: boolean;
    readonly storageContractScriptExists: boolean;
    readonly validateScriptRunsStorageContract: boolean;
    readonly storageInterfaceExists: boolean;
    readonly storageContractDocExists: boolean;
    readonly phase60StatusDocExists: boolean;
    readonly adapterInterfaceDefined: boolean;
    readonly minimizedDtoOnlyStorage: boolean;
    readonly anonymousNonSequentialIdPolicyDefined: boolean;
    readonly deleteTokenAndExpiryPolicyDefined: boolean;
    readonly noBackendApiDatabaseAuthPaymentAiImplementation: boolean;
    readonly noRawChoiceOrPrivateScoreLeakage: boolean;
    readonly noPublicPersistentRouteYet: boolean;
    readonly noStorageImplementationYet: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly storageContract: string;
    readonly phase60Status: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly publicStorageContract?: string;
    readonly phase5Closure?: string;
    readonly publicDtoContract?: string;
  };
  readonly storageContract: {
    readonly allowedRecordKeys: readonly string[];
    readonly forbiddenRecordKeys: readonly string[];
    readonly sampleRecordKeys: readonly string[];
    readonly defaultExpiryDays: number;
    readonly sampleRecordBytes: number;
    readonly samplePublicIdSafe: boolean;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly storageImplementationSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly phase5IssueCount: number;
    readonly dtoIssueCount: number;
    readonly allowedRecordKeyCount: number;
    readonly forbiddenRecordKeyCount: number;
    readonly checkedFileCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const STORAGE_CONTRACT_DOC = 'docs/release/phase-6-persistent-public-result-link-storage-contract.md';
const PHASE_6_0_STATUS_DOC = 'docs/ui/phase-6-0-persistent-public-result-link-storage-contract-status.md';
const STORAGE_INTERFACE_PATH = 'src/core/public-link/publicResultStorage.ts';

const CHECKED_STORAGE_FILES = [
  STORAGE_INTERFACE_PATH,
  STORAGE_CONTRACT_DOC,
  PHASE_6_0_STATUS_DOC
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
  'src/llm'
] as const;

const PERSISTENT_ROUTE_PATHS = [
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[resultId]',
  'src/features/publicResultRoute'
] as const;

const BLOCKED_IMPLEMENTATION_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  '@supabase',
  'createClient(',
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
  'signOut(',
  'localStorage.setItem',
  'indexedDB.open'
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

const STORAGE_IMPLEMENTATION_SIGNALS = [
  'class Supabase',
  'PrismaPublicResult',
  'writePublicResult',
  'readPublicResultFromDb',
  'deletePublicResultFromDb',
  'database.write',
  'db.insert',
  'db.select',
  'adapter = {'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'PublicResultStorageAdapter',
  'minimized PublicResultDto only',
  'anonymous non-sequential result id',
  'delete-token hash',
  'default expiry',
  'no backend implementation in Phase 6.0',
  'no database implementation in Phase 6.0'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export function runPublicResultStorageContract(options: PublicResultStorageContractOptions = {}): PublicResultStorageContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase5Closure = runPhase5PreviewClosureGate({ repoRoot });
  const dtoContract = runPublicResultDtoContract({ repoRoot });
  const storageSource = readOptionalFile(repoRoot, STORAGE_INTERFACE_PATH);
  const contractDoc = readOptionalFile(repoRoot, STORAGE_CONTRACT_DOC);
  const sampleRecord = buildSampleStorageRecord();
  const sampleRecordKeys = listPublicResultStorageRecordKeys(sampleRecord);
  const checkedSource = CHECKED_STORAGE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_ROUTE_PATHS);
  const blockedSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrPrivateSignals = findSignals(storageSource, RAW_OR_PRIVATE_SIGNALS);
  const storageImplementationSignals = findSignals(storageSource, STORAGE_IMPLEMENTATION_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const sampleKeysMinimized = sampleRecordKeys.every((key) => (PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS as readonly string[]).includes(key))
    && sampleRecordKeys.length === PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS.length;

  const gates = {
    phase5ClosurePassed: phase5Closure.gates.overallPassed,
    publicResultDtoContractPassed: dtoContract.gates.overallPassed,
    storageContractScriptExists: packageJson.scripts?.['contract:public-storage'] === 'tsx scripts/public-result-storage-contract.ts',
    validateScriptRunsStorageContract: validateScript.includes('npm run contract:public-storage'),
    storageInterfaceExists: existsSync(path.join(repoRoot, STORAGE_INTERFACE_PATH)),
    storageContractDocExists: existsSync(path.join(repoRoot, STORAGE_CONTRACT_DOC)),
    phase60StatusDocExists: existsSync(path.join(repoRoot, PHASE_6_0_STATUS_DOC)),
    adapterInterfaceDefined: storageSource.includes('PublicResultStorageAdapter') && storageSource.includes('create:') && storageSource.includes('read:') && storageSource.includes('delete:'),
    minimizedDtoOnlyStorage: sampleKeysMinimized && !containsForbiddenPublicResultStorageKeys(sampleRecord),
    anonymousNonSequentialIdPolicyDefined: contractDoc.includes('anonymous non-sequential result id') && isSafeAnonymousPublicResultId(sampleRecord.publicId),
    deleteTokenAndExpiryPolicyDefined: contractDoc.includes('delete-token hash') && contractDoc.includes('default expiry') && sampleRecord.expiresAt !== sampleRecord.createdAt,
    noBackendApiDatabaseAuthPaymentAiImplementation: blockedPaths.length === 0 && blockedSignals.length === 0,
    noRawChoiceOrPrivateScoreLeakage: rawOrPrivateSignals.length === 0,
    noPublicPersistentRouteYet: persistentRouteFiles.length === 0,
    noStorageImplementationYet: storageImplementationSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_STORAGE_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-6-storage-contract-only',
      phase5ClosureSchemaVersion: phase5Closure.schemaVersion,
      publicResultDtoContractSchemaVersion: dtoContract.schemaVersion,
      storageSchemaVersion: PUBLIC_RESULT_STORAGE_SCHEMA_VERSION
    },
    gates: completeGates,
    docs: {
      storageContract: STORAGE_CONTRACT_DOC,
      phase60Status: PHASE_6_0_STATUS_DOC
    },
    scripts: buildScriptSummary(packageJson),
    storageContract: {
      allowedRecordKeys: PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
      forbiddenRecordKeys: PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
      sampleRecordKeys,
      defaultExpiryDays: PUBLIC_RESULT_STORAGE_DEFAULT_EXPIRY_DAYS,
      sampleRecordBytes: JSON.stringify(sampleRecord).length,
      samplePublicIdSafe: isSafeAnonymousPublicResultId(sampleRecord.publicId)
    },
    implementationScan: {
      checkedFiles: CHECKED_STORAGE_FILES,
      blockedPaths,
      blockedSignals,
      rawOrPrivateSignals,
      persistentRouteFiles,
      storageImplementationSignals,
      missingContractPhrases
    },
    coverage: {
      phase5IssueCount: phase5Closure.issues.length,
      dtoIssueCount: dtoContract.issues.length,
      allowedRecordKeyCount: PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS.length,
      forbiddenRecordKeyCount: PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS.length,
      checkedFileCount: CHECKED_STORAGE_FILES.length
    },
    issues: buildIssues(completeGates, {
      phase5Issues: phase5Closure.issues,
      dtoIssues: dtoContract.issues,
      blockedPaths,
      blockedSignals,
      rawOrPrivateSignals,
      persistentRouteFiles,
      storageImplementationSignals,
      missingContractPhrases
    })
  };
}

function buildSampleStorageRecord(): PublicResultStorageRecord {
  const createdAt = '2026-06-06T00:00:00.000Z';
  const publicId = 'pub_7Kf9sQ2mN8xR4vB6tY3cH1pZ';
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const metadata: PublicResultDtoMetadata = {
    resultId: publicId,
    createdAt,
    expiresAt,
    deleteTokenHash: 'del_7Kf9sQ2mN8xR4vB6tY3cH1pZ_hash'
  };
  const dto: PublicResultDto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata);
  return buildPublicResultStorageRecord({
    publicId,
    dto,
    createdAt,
    expiresAt,
    deleteTokenHash: metadata.deleteTokenHash
  });
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicResultStorageContractReport['scripts'] {
  const scripts: {
    validate?: string;
    publicStorageContract?: string;
    phase5Closure?: string;
    publicDtoContract?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:public-storage'] !== undefined) scripts.publicStorageContract = packageJson.scripts['contract:public-storage'];
  if (packageJson.scripts?.['closure:phase5'] !== undefined) scripts.phase5Closure = packageJson.scripts['closure:phase5'];
  if (packageJson.scripts?.['contract:public-dto'] !== undefined) scripts.publicDtoContract = packageJson.scripts['contract:public-dto'];
  return scripts;
}

function buildIssues(
  gates: PublicResultStorageContractReport['gates'],
  inputs: Readonly<{
    phase5Issues: readonly string[];
    dtoIssues: readonly string[];
    blockedPaths: readonly string[];
    blockedSignals: readonly string[];
    rawOrPrivateSignals: readonly string[];
    persistentRouteFiles: readonly string[];
    storageImplementationSignals: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`public_result_storage_contract_failed:${key}`);
  }
  for (const issue of inputs.phase5Issues) issues.push(`phase5:${issue}`);
  for (const issue of inputs.dtoIssues) issues.push(`public_dto:${issue}`);
  for (const pathName of inputs.blockedPaths) issues.push(`blocked_scope_path:${pathName}`);
  for (const signal of inputs.blockedSignals) issues.push(`blocked_scope_signal:${signal}`);
  for (const signal of inputs.rawOrPrivateSignals) issues.push(`raw_or_private_storage_signal:${signal}`);
  for (const pathName of inputs.persistentRouteFiles) issues.push(`persistent_public_route_present:${pathName}`);
  for (const signal of inputs.storageImplementationSignals) issues.push(`storage_implementation_signal:${signal}`);
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
