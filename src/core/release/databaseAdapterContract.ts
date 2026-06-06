import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto, type PublicResultDtoMetadata } from '../public-link/publicResultDto';
import {
  buildDatabasePublicResultStorageRecord,
  containsForbiddenDatabasePublicResultStorageKeys,
  databaseRecordToPublicResultStorageReadResult,
  DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
  DATABASE_PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
  DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS,
  DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR,
  DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
  DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY,
  listDatabasePublicResultStorageRecordKeys,
  markDatabasePublicResultStorageRecordDeleted,
  type DatabasePublicResultStorageRecord
} from '../public-link/databasePublicResultStorage';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash,
  isSafeAnonymousPublicResultId
} from '../public-link/publicResultStorage';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const DATABASE_ADAPTER_CONTRACT_SCHEMA_VERSION = 'phase-8.0-database-adapter-contract-v1' as const;
export const DATABASE_ADAPTER_CONTRACT_ID = 'phase-8-database-adapter-contract' as const;

export interface DatabaseAdapterContractOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterContractReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ADAPTER_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-database-adapter-contract-only';
    readonly phase7ClosureSchemaVersion: string;
    readonly databaseStorageSchemaVersion: typeof DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly phase7ClosurePassed: boolean;
    readonly databaseAdapterScriptExists: boolean;
    readonly validateScriptRunsDatabaseAdapterContract: boolean;
    readonly databaseContractModuleExists: boolean;
    readonly databaseContractDocExists: boolean;
    readonly phase80StatusDocExists: boolean;
    readonly adapterContractExtendsPublicResultStorageAdapter: boolean;
    readonly databaseRecordShapeDefined: boolean;
    readonly resultIdDeleteHashDateExpiryDeletedAtSchemaFieldsDefined: boolean;
    readonly minimizedDtoOnlyRecord: boolean;
    readonly rawDeleteTokenNeverStored: boolean;
    readonly migrationExpectationsDefinedWithoutMigrationFiles: boolean;
    readonly serverOnlyAccessBoundaryDefined: boolean;
    readonly expiredAndDeletedReadBehaviorSpecified: boolean;
    readonly routeHandlersRemainDryRunInMemory: boolean;
    readonly noDatabaseClientOrMigrationImplementation: boolean;
    readonly noAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noRawAnswerOrPrivateScoreLeakage: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly databaseAdapterContract: string;
    readonly phase80Status: string;
    readonly phase8Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseAdapterContract?: string;
    readonly phase7Closure?: string;
  };
  readonly databaseContract: {
    readonly allowedRecordKeys: readonly string[];
    readonly forbiddenRecordKeys: readonly string[];
    readonly sampleRecordKeys: readonly string[];
    readonly migrationExpectations: readonly string[];
    readonly serverOnlyBoundary: readonly string[];
    readonly readBehavior: readonly string[];
    readonly samplePublicIdSafe: boolean;
    readonly sampleRecordBytes: number;
    readonly deletedReadStatus: string;
    readonly expiredReadStatus: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedClientSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentLookupRouteFiles: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly phase7IssueCount: number;
    readonly checkedFileCount: number;
    readonly allowedRecordKeyCount: number;
    readonly forbiddenRecordKeyCount: number;
    readonly migrationExpectationCount: number;
    readonly serverOnlyBoundaryCount: number;
    readonly readBehaviorRuleCount: number;
    readonly blockedPathCount: number;
    readonly blockedSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const DATABASE_CONTRACT_MODULE = 'src/core/public-link/databasePublicResultStorage.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const DATABASE_ADAPTER_CONTRACT_DOC = 'docs/release/phase-8-database-adapter-contract.md';
const PHASE_8_0_STATUS_DOC = 'docs/ui/phase-8-0-database-adapter-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  DATABASE_CONTRACT_MODULE,
  ROUTE_HANDLERS_MODULE,
  DATABASE_ADAPTER_CONTRACT_DOC,
  PHASE_8_0_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/server/database',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'drizzle',
  'src/auth',
  'src/payments',
  'src/ai',
  'src/analytics'
] as const;

const PERSISTENT_PUBLIC_LOOKUP_ROUTES = [
  'src/app/r/[publicId]',
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[publicId]',
  'src/app/results/[resultId]'
] as const;

const BLOCKED_CLIENT_SIGNALS = [
  'localStorage.setItem',
  'indexedDB.open',
  'navigator.sendBeacon',
  'XMLHttpRequest',
  'window.fetch'
] as const;

const BLOCKED_INTEGRATION_SIGNALS = [
  '@supabase',
  'createClient(',
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
  'posthog.capture',
  'analytics.track'
] as const;

const RAW_OR_PRIVATE_SIGNALS = [
  'raw' + 'Answers',
  'question' + 'Answers',
  'selected' + 'Answer',
  'answer' + 'Text',
  'question' + 'Id',
  'tag' + 'Scores',
  'axis' + 'ScoresRaw',
  'private' + 'ReportSeed',
  'session' + 'StorageEnvelope',
  'evidence' + 'Digest',
  'evidence' + 'Refs',
  'delete' + 'Token:',
  'raw' + 'DeleteToken',
  'ip' + 'Address',
  'email',
  'user' + 'Id',
  'device' + 'Fingerprint'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'DatabasePublicResultStorageAdapterContract',
  'PublicResultStorageAdapter',
  'minimized PublicResultDto only',
  'delete-token hash is stored',
  'raw delete token is never stored',
  'deletedAt',
  'schema version',
  'migration expectations',
  'server-only access boundary',
  'route handlers remain dry-run in-memory'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_CREATED_AT = '2026-06-06T12:00:00.000Z';
const SAMPLE_PUBLIC_ID = 'pub_Phase80DbAdapter7Kf9sQ2mN8xR4vB';
const SAMPLE_DELETE_TOKEN = 'delete_Phase80DbAdapter7Kf9sQ2mN8xR4vB_123456789';

export async function runDatabaseAdapterContract(
  options: DatabaseAdapterContractOptions = {}
): Promise<DatabaseAdapterContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase7Closure = readPhase7ClosureEvidence(repoRoot);
  const databaseSource = readOptionalFile(repoRoot, DATABASE_CONTRACT_MODULE);
  const routeHandlersSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const contractDoc = readOptionalFile(repoRoot, DATABASE_ADAPTER_CONTRACT_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const sampleRecord = buildSampleDatabaseRecord();
  const deletedRecord = markDatabasePublicResultStorageRecordDeleted(sampleRecord, '2026-06-07T00:00:00.000Z');
  const activeRead = databaseRecordToPublicResultStorageReadResult(sampleRecord, SAMPLE_CREATED_AT);
  const deletedRead = databaseRecordToPublicResultStorageReadResult(deletedRecord, '2026-06-07T00:00:00.000Z');
  const expiredRead = databaseRecordToPublicResultStorageReadResult(sampleRecord, '2026-08-01T00:00:00.000Z');
  const sampleRecordKeys = listDatabasePublicResultStorageRecordKeys(sampleRecord);
  const allowedKeys = [...DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS].sort();
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const blockedClientSignals = findSignals(checkedSource, BLOCKED_CLIENT_SIGNALS);
  const blockedIntegrationSignals = findSignals(checkedSource, BLOCKED_INTEGRATION_SIGNALS);
  const rawOrPrivateSignals = findSignals(databaseSource, RAW_OR_PRIVATE_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const migrationFiles = blockedPaths.filter((item) => item === 'migrations' || item === 'prisma' || item === 'supabase' || item === 'drizzle');

  const gates = {
    phase7ClosurePassed: phase7Closure.gates.overallPassed,
    databaseAdapterScriptExists: packageJson.scripts?.['contract:database-adapter'] === 'tsx scripts/database-adapter-contract.ts',
    validateScriptRunsDatabaseAdapterContract: validateScript.includes('npm run contract:database-adapter'),
    databaseContractModuleExists: existsSync(path.join(repoRoot, DATABASE_CONTRACT_MODULE)),
    databaseContractDocExists: existsSync(path.join(repoRoot, DATABASE_ADAPTER_CONTRACT_DOC)),
    phase80StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_0_STATUS_DOC)),
    adapterContractExtendsPublicResultStorageAdapter:
      databaseSource.includes('DatabasePublicResultStorageAdapterContract') &&
      databaseSource.includes('extends PublicResultStorageAdapter') &&
      databaseSource.includes('create:') &&
      databaseSource.includes('read:') &&
      databaseSource.includes('delete:') &&
      databaseSource.includes('pruneExpired:'),
    databaseRecordShapeDefined:
      sampleRecordKeys.join('|') === allowedKeys.join('|') &&
      sampleRecord.schemaVersion === 'public-result-database-record-v1',
    resultIdDeleteHashDateExpiryDeletedAtSchemaFieldsDefined:
      ['schemaVersion', 'publicId', 'deleteTokenHash', 'createdAt', 'expiresAt', 'deletedAt'].every((key) => sampleRecordKeys.includes(key)),
    minimizedDtoOnlyRecord: !containsForbiddenDatabasePublicResultStorageKeys(sampleRecord) && activeRead.status === 'active' && activeRead.record?.dto.resultId === sampleRecord.publicId,
    rawDeleteTokenNeverStored:
      !('deleteToken' in sampleRecord) &&
      sampleRecord.deleteTokenHash === sampleRecord.dto.deleteTokenHash &&
      sampleRecord.deleteTokenHash === buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN),
    migrationExpectationsDefinedWithoutMigrationFiles:
      DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS.length >= 6 &&
      databaseSource.includes('DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS') &&
      migrationFiles.length === 0,
    serverOnlyAccessBoundaryDefined:
      DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY.length >= 6 &&
      contractDoc.includes('server-only access boundary') &&
      databaseSource.includes('DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY'),
    expiredAndDeletedReadBehaviorSpecified:
      DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR.length >= 6 &&
      deletedRead.status === 'deleted' &&
      expiredRead.status === 'expired' &&
      contractDoc.includes('expired/deleted read behavior'),
    routeHandlersRemainDryRunInMemory:
      routeHandlersSource.includes(PUBLIC_RESULT_ROUTE_HANDLERS_MODE) &&
      routeHandlersSource.includes('createInMemoryPublicResultStorageAdapter') &&
      routeHandlersSource.includes('dry-run-in-memory-only'),
    noDatabaseClientOrMigrationImplementation: migrationFiles.length === 0 && blockedIntegrationSignals.filter((signal) => ['@supabase', 'createClient(', 'new PrismaClient', 'drizzle(', 'mongoose.connect', 'database.write', 'db.insert', 'db.select'].includes(signal)).length === 0,
    noAuthPaymentAiAnalyticsImplementation: blockedIntegrationSignals.filter((signal) => ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track'].includes(signal)).length === 0,
    noPersistentPublicLookupRoute: persistentLookupRouteFiles.length === 0,
    noRawAnswerOrPrivateScoreLeakage: rawOrPrivateSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  const allBlockedSignalCount = blockedClientSignals.length + blockedIntegrationSignals.length;

  return {
    schemaVersion: DATABASE_ADAPTER_CONTRACT_SCHEMA_VERSION,
    contractId: DATABASE_ADAPTER_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-database-adapter-contract-only',
      phase7ClosureSchemaVersion: phase7Closure.schemaVersion,
      databaseStorageSchemaVersion: DATABASE_PUBLIC_RESULT_STORAGE_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    docs: {
      databaseAdapterContract: DATABASE_ADAPTER_CONTRACT_DOC,
      phase80Status: PHASE_8_0_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    databaseContract: {
      allowedRecordKeys: DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS,
      forbiddenRecordKeys: DATABASE_PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS,
      sampleRecordKeys,
      migrationExpectations: DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS,
      serverOnlyBoundary: DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY,
      readBehavior: DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR,
      samplePublicIdSafe: isSafeAnonymousPublicResultId(sampleRecord.publicId),
      sampleRecordBytes: JSON.stringify(sampleRecord).length,
      deletedReadStatus: deletedRead.status,
      expiredReadStatus: expiredRead.status
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      blockedClientSignals,
      blockedIntegrationSignals,
      persistentLookupRouteFiles,
      rawOrPrivateSignals,
      missingContractPhrases
    },
    coverage: {
      phase7IssueCount: phase7Closure.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      allowedRecordKeyCount: DATABASE_PUBLIC_RESULT_STORAGE_ALLOWED_RECORD_KEYS.length,
      forbiddenRecordKeyCount: DATABASE_PUBLIC_RESULT_STORAGE_FORBIDDEN_RECORD_KEYS.length,
      migrationExpectationCount: DATABASE_PUBLIC_RESULT_STORAGE_MIGRATION_EXPECTATIONS.length,
      serverOnlyBoundaryCount: DATABASE_PUBLIC_RESULT_STORAGE_SERVER_ONLY_BOUNDARY.length,
      readBehaviorRuleCount: DATABASE_PUBLIC_RESULT_STORAGE_READ_BEHAVIOR.length,
      blockedPathCount: blockedPaths.length,
      blockedSignalCount: allBlockedSignalCount
    },
    issues: buildIssues(completeGates, {
      phase7Issues: phase7Closure.issues,
      blockedPaths,
      blockedClientSignals,
      blockedIntegrationSignals,
      persistentLookupRouteFiles,
      rawOrPrivateSignals,
      missingContractPhrases
    })
  };
}

export function writeDatabaseAdapterContractEvidence(
  report: DatabaseAdapterContractReport,
  outputPath = 'docs/evidence/database-adapter-contract-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}


function readPhase7ClosureEvidence(repoRoot: string): { readonly schemaVersion: string; readonly gates: { readonly overallPassed: boolean }; readonly issues: readonly string[] } {
  const evidencePath = path.join(repoRoot, 'docs/evidence/phase7-closure-latest.json');
  if (!existsSync(evidencePath)) {
    return { schemaVersion: 'missing-phase7-closure-evidence', gates: { overallPassed: false }, issues: ['missing_phase7_closure_evidence'] };
  }

  const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) {
    return { schemaVersion: 'invalid-phase7-closure-evidence', gates: { overallPassed: false }, issues: ['invalid_phase7_closure_evidence'] };
  }

  const gates = isRecord(parsed.gates) ? parsed.gates : {};
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((item): item is string => typeof item === 'string') : [];
  return {
    schemaVersion: typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : 'unknown-phase7-closure-schema',
    gates: { overallPassed: gates.overallPassed === true },
    issues: rawIssues
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildSampleDatabaseRecord(): DatabasePublicResultStorageRecord {
  const expiresAt = buildDefaultPublicResultExpiry(SAMPLE_CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN);
  const metadata: PublicResultDtoMetadata = {
    resultId: SAMPLE_PUBLIC_ID,
    createdAt: SAMPLE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  };
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata);
  return buildDatabasePublicResultStorageRecord({
    publicId: SAMPLE_PUBLIC_ID,
    dto,
    createdAt: SAMPLE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseAdapterContractReport['scripts'] {
  const scripts: { validate?: string; databaseAdapterContract?: string; phase7Closure?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-adapter'] !== undefined) scripts.databaseAdapterContract = packageJson.scripts['contract:database-adapter'];
  if (packageJson.scripts?.['closure:phase7'] !== undefined) scripts.phase7Closure = packageJson.scripts['closure:phase7'];
  return scripts;
}

function buildIssues(
  gates: DatabaseAdapterContractReport['gates'],
  inputs: Readonly<{
    phase7Issues: readonly string[];
    blockedPaths: readonly string[];
    blockedClientSignals: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentLookupRouteFiles: readonly string[];
    rawOrPrivateSignals: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_adapter_contract_failed:${key}`);
  }
  for (const issue of inputs.phase7Issues) issues.push(`phase7:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`blocked_scope_path:${item}`);
  for (const signal of inputs.blockedClientSignals) issues.push(`blocked_client_signal:${signal}`);
  for (const signal of inputs.blockedIntegrationSignals) issues.push(`blocked_integration_signal:${signal}`);
  for (const item of inputs.persistentLookupRouteFiles) issues.push(`persistent_public_route_present:${item}`);
  for (const signal of inputs.rawOrPrivateSignals) issues.push(`raw_or_private_database_record_signal:${signal}`);
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
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath))).sort();
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal)).sort();
}

function missingSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => !source.includes(signal)).sort();
}
