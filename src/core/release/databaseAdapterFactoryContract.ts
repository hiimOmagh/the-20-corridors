import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION
} from '../public-link/publicResultStorageRuntimeSelection';
import {
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_RULES,
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
  createPublicResultStorageAdapterFromFactory,
  resolvePublicResultStorageAdapterFactoryDecision,
  summarizePublicResultStorageAdapterFactoryRules
} from '../public-link/publicResultStorageAdapterFactory';
import { DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND } from '../public-link/databasePublicResultStorage';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const DATABASE_ADAPTER_FACTORY_CONTRACT_SCHEMA_VERSION =
  'phase-8.2-database-adapter-factory-contract-v1' as const;
export const DATABASE_ADAPTER_FACTORY_CONTRACT_ID = 'phase-8-database-adapter-factory-contract' as const;

export interface DatabaseAdapterFactoryContractOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterFactoryContractReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_FACTORY_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ADAPTER_FACTORY_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-2-factory-contract-only';
    readonly factorySchemaVersion: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION;
    readonly runtimeSelectionSchemaVersion: typeof PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseAdapterContractPassed: boolean;
    readonly runtimeSelectionGuardPassed: boolean;
    readonly factoryScriptExists: boolean;
    readonly validateScriptRunsFactoryContract: boolean;
    readonly factoryModuleExists: boolean;
    readonly factoryGuardModuleExists: boolean;
    readonly factoryDocExists: boolean;
    readonly phase82StatusDocExists: boolean;
    readonly factoryDefinesExpectedBoundary: boolean;
    readonly unsetModeCreatesMemoryAdapter: boolean;
    readonly explicitMemoryModeCreatesMemoryAdapter: boolean;
    readonly databaseModeIsContractOnly: boolean;
    readonly databaseModeDoesNotCreateAdapter: boolean;
    readonly databaseModeRouteFactoryThrows: boolean;
    readonly missingDatabaseEnvFailsClosed: boolean;
    readonly routeHandlersUseFactoryBoundary: boolean;
    readonly routeHandlersRemainDryRunInMemory: boolean;
    readonly noDatabaseClientOrMigrationImplementation: boolean;
    readonly noAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noRawAnswerOrFullResultTransportExpansion: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseAdapterContract?: string;
    readonly runtimeSelectionGuard?: string;
    readonly factoryContract?: string;
  };
  readonly docs: {
    readonly factoryContract: string;
    readonly phase82Status: string;
    readonly phase8Transition: string;
  };
  readonly factory: {
    readonly modeEnv: typeof PUBLIC_RESULT_STORAGE_MODE_ENV;
    readonly factoryMode: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE;
    readonly factoryRules: readonly string[];
    readonly unsetModeStatus: string;
    readonly explicitMemoryStatus: string;
    readonly completeDatabaseStatus: string;
    readonly completeDatabaseAdapterKind: string;
    readonly completeDatabaseRouteBindingAllowed: boolean;
    readonly completeDatabaseAdapterCreated: boolean;
    readonly missingDatabaseStatus: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly rawOrFullResultSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseAdapterIssueCount: number;
    readonly runtimeSelectionIssueCount: number;
    readonly checkedFileCount: number;
    readonly factoryRuleCount: number;
    readonly blockedPathCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
    readonly rawOrFullResultSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const RUNTIME_SELECTION_MODULE = 'src/core/public-link/publicResultStorageRuntimeSelection.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const FACTORY_GUARD_MODULE = 'src/core/release/databaseAdapterFactoryContract.ts';
const FACTORY_SCRIPT = 'scripts/database-adapter-factory-contract.ts';
const FACTORY_DOC = 'docs/release/phase-8-database-adapter-factory-contract.md';
const PHASE_8_2_STATUS_DOC = 'docs/ui/phase-8-2-database-adapter-factory-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  FACTORY_MODULE,
  RUNTIME_SELECTION_MODULE,
  ROUTE_HANDLERS_MODULE,
  FACTORY_DOC,
  PHASE_8_2_STATUS_DOC,
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

const RAW_OR_FULL_RESULT_SIGNALS = [
  'raw' + 'Answers',
  'question' + 'Answers',
  'selected' + 'Answer',
  'answer' + 'Text',
  'tag' + 'Scores',
  'axis' + 'ScoresRaw',
  'full' + 'Result',
  'session' + 'StorageEnvelope',
  'raw' + 'DeleteToken',
  'delete' + 'TokenHashPlaintext'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'adapter factory interface exists',
  'memory remains the default',
  'database mode remains contract-only',
  'factory cannot bind database mode to route handlers',
  'no production database client',
  'no Supabase, Prisma, Drizzle, migration, auth, payment, AI, or analytics integration',
  'Phase 8.2'
] as const;

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1'
} as const;

export async function runDatabaseAdapterFactoryContract(
  options: DatabaseAdapterFactoryContractOptions = {}
): Promise<DatabaseAdapterFactoryContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseAdapterContract = readEvidence(repoRoot, 'docs/evidence/database-adapter-contract-latest.json', 'database_adapter_contract');
  const runtimeSelectionGuard = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-runtime-selection-guard-latest.json',
    'database_runtime_selection_guard'
  );
  const factorySource = readOptionalFile(repoRoot, FACTORY_MODULE);
  const routeHandlersSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const contractDoc = readOptionalFile(repoRoot, FACTORY_DOC);

  const unsetDecision = resolvePublicResultStorageAdapterFactoryDecision({});
  const memoryDecision = resolvePublicResultStorageAdapterFactoryDecision({
    env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_MEMORY_MODE }
  });
  const missingDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({
    env: { [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE }
  });
  const completeDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({ env: COMPLETE_DATABASE_ENV });
  const databaseFactoryThrows = didThrow(() => createPublicResultStorageAdapterFromFactory({ env: COMPLETE_DATABASE_ENV }));

  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const blockedIntegrationSignals = findSignals(checkedSource, BLOCKED_INTEGRATION_SIGNALS);
  const rawOrFullResultSignals = findSignals(routeHandlersSource, RAW_OR_FULL_RESULT_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const migrationFiles = blockedPaths.filter((item) => ['migrations', 'prisma', 'supabase', 'drizzle'].includes(item));

  const gates = {
    databaseAdapterContractPassed: databaseAdapterContract.overallPassed,
    runtimeSelectionGuardPassed: runtimeSelectionGuard.overallPassed,
    factoryScriptExists: packageJson.scripts?.['contract:database-adapter-factory'] === 'tsx scripts/database-adapter-factory-contract.ts',
    validateScriptRunsFactoryContract: validateScript.includes('npm run contract:database-adapter-factory'),
    factoryModuleExists: existsSync(path.join(repoRoot, FACTORY_MODULE)),
    factoryGuardModuleExists: existsSync(path.join(repoRoot, FACTORY_GUARD_MODULE)),
    factoryDocExists: existsSync(path.join(repoRoot, FACTORY_DOC)),
    phase82StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_2_STATUS_DOC)),
    factoryDefinesExpectedBoundary:
      factorySource.includes(PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION) &&
      factorySource.includes(PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE) &&
      factorySource.includes('database-factory-contract-only') &&
      factorySource.includes('databaseAdapterCreated: false'),
    unsetModeCreatesMemoryAdapter:
      unsetDecision.status === 'memory-adapter-created' &&
      unsetDecision.adapterKind === 'in-memory-public-result-storage-adapter' &&
      unsetDecision.routeBindingAllowed === true &&
      unsetDecision.memoryAdapterCreated === true,
    explicitMemoryModeCreatesMemoryAdapter:
      memoryDecision.status === 'memory-adapter-created' &&
      memoryDecision.effectiveMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE &&
      memoryDecision.adapterCreated === true,
    databaseModeIsContractOnly:
      completeDatabaseDecision.status === 'database-factory-contract-only' &&
      completeDatabaseDecision.adapterKind === DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND &&
      completeDatabaseDecision.failClosed === true,
    databaseModeDoesNotCreateAdapter:
      completeDatabaseDecision.adapterCreated === false &&
      completeDatabaseDecision.databaseAdapterCreated === false &&
      completeDatabaseDecision.databaseClientAllowed === false,
    databaseModeRouteFactoryThrows: databaseFactoryThrows,
    missingDatabaseEnvFailsClosed:
      missingDatabaseDecision.status === 'factory-blocked' &&
      missingDatabaseDecision.failClosed === true &&
      missingDatabaseDecision.routeBindingAllowed === false,
    routeHandlersUseFactoryBoundary:
      routeHandlersSource.includes('createPublicResultStorageAdapterFromFactory') &&
      routeHandlersSource.includes('getPublicResultRouteAdapterFactoryDecision') &&
      routeHandlersSource.includes('phase-8-2-factory-contract-preserves-memory-route-binding'),
    routeHandlersRemainDryRunInMemory:
      routeHandlersSource.includes(PUBLIC_RESULT_ROUTE_HANDLERS_MODE) &&
      routeHandlersSource.includes('createInMemoryPublicResultStorageAdapter') &&
      routeHandlersSource.includes('handlePublicResultCreateDryRun'),
    noDatabaseClientOrMigrationImplementation:
      migrationFiles.length === 0 &&
      blockedIntegrationSignals.filter((signal) =>
        ['@supabase', 'createClient(', 'new PrismaClient', 'drizzle(', 'mongoose.connect', 'database.write', 'db.insert', 'db.select'].includes(signal)
      ).length === 0,
    noAuthPaymentAiAnalyticsImplementation:
      blockedIntegrationSignals.filter((signal) =>
        ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track'].includes(signal)
      ).length === 0,
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    noRawAnswerOrFullResultTransportExpansion: rawOrFullResultSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: DATABASE_ADAPTER_FACTORY_CONTRACT_SCHEMA_VERSION,
    contractId: DATABASE_ADAPTER_FACTORY_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-2-factory-contract-only',
      factorySchemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
      runtimeSelectionSchemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    docs: {
      factoryContract: FACTORY_DOC,
      phase82Status: PHASE_8_2_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    factory: {
      modeEnv: PUBLIC_RESULT_STORAGE_MODE_ENV,
      factoryMode: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
      factoryRules: summarizePublicResultStorageAdapterFactoryRules(),
      unsetModeStatus: unsetDecision.status,
      explicitMemoryStatus: memoryDecision.status,
      completeDatabaseStatus: completeDatabaseDecision.status,
      completeDatabaseAdapterKind: completeDatabaseDecision.adapterKind,
      completeDatabaseRouteBindingAllowed: completeDatabaseDecision.routeBindingAllowed,
      completeDatabaseAdapterCreated: completeDatabaseDecision.adapterCreated,
      missingDatabaseStatus: missingDatabaseDecision.status
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      rawOrFullResultSignals,
      missingContractPhrases
    },
    coverage: {
      databaseAdapterIssueCount: databaseAdapterContract.issues.length,
      runtimeSelectionIssueCount: runtimeSelectionGuard.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      factoryRuleCount: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_RULES.length,
      blockedPathCount: blockedPaths.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length,
      rawOrFullResultSignalCount: rawOrFullResultSignals.length
    },
    issues: buildIssues(completeGates, {
      databaseAdapterIssues: databaseAdapterContract.issues,
      runtimeSelectionIssues: runtimeSelectionGuard.issues,
      blockedPaths,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      rawOrFullResultSignals,
      missingContractPhrases
    })
  };
}

export function writeDatabaseAdapterFactoryContractEvidence(
  report: DatabaseAdapterFactoryContractReport,
  outputPath = 'docs/evidence/database-adapter-factory-contract-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readEvidence(repoRoot: string, relativePath: string, label: string): {
  readonly overallPassed: boolean;
  readonly issues: readonly string[];
} {
  const evidencePath = path.join(repoRoot, relativePath);
  if (!existsSync(evidencePath)) return { overallPassed: false, issues: [`missing_${label}_evidence`] };
  const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) return { overallPassed: false, issues: [`invalid_${label}_evidence`] };
  const gates = isRecord(parsed.gates) ? parsed.gates : {};
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((item): item is string => typeof item === 'string') : [];
  return { overallPassed: gates.overallPassed === true, issues: rawIssues };
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseAdapterFactoryContractReport['scripts'] {
  const scripts: { validate?: string; databaseAdapterContract?: string; runtimeSelectionGuard?: string; factoryContract?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-adapter'] !== undefined) {
    scripts.databaseAdapterContract = packageJson.scripts['contract:database-adapter'];
  }
  if (packageJson.scripts?.['guard:database-runtime-selection'] !== undefined) {
    scripts.runtimeSelectionGuard = packageJson.scripts['guard:database-runtime-selection'];
  }
  if (packageJson.scripts?.['contract:database-adapter-factory'] !== undefined) {
    scripts.factoryContract = packageJson.scripts['contract:database-adapter-factory'];
  }
  return scripts;
}

function buildIssues(
  gates: DatabaseAdapterFactoryContractReport['gates'],
  inputs: Readonly<{
    databaseAdapterIssues: readonly string[];
    runtimeSelectionIssues: readonly string[];
    blockedPaths: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    rawOrFullResultSignals: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_adapter_factory_contract_failed:${key}`);
  }
  for (const issue of inputs.databaseAdapterIssues) issues.push(`database_adapter_contract:${issue}`);
  for (const issue of inputs.runtimeSelectionIssues) issues.push(`database_runtime_selection_guard:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`blocked_scope_path:${item}`);
  for (const signal of inputs.blockedIntegrationSignals) issues.push(`blocked_integration_signal:${signal}`);
  for (const item of inputs.persistentPublicLookupRouteFiles) issues.push(`persistent_public_route_present:${item}`);
  for (const signal of inputs.rawOrFullResultSignals) issues.push(`raw_or_full_result_route_signal:${signal}`);
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

function didThrow(callback: () => unknown): boolean {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
