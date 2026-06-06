import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_GUARDS,
  PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
  resolvePublicResultRouteStorageAdapter,
  resolvePublicResultStorageRuntimeSelection,
  summarizePublicResultStorageRuntimeSelectionGuards
} from '../public-link/publicResultStorageRuntimeSelection';
import { DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND } from '../public-link/databasePublicResultStorage';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_SCHEMA_VERSION =
  'phase-8.1-database-adapter-runtime-selection-guard-v1' as const;
export const DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_ID =
  'phase-8-database-adapter-runtime-selection-guard' as const;

export interface DatabaseAdapterRuntimeSelectionGuardOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterRuntimeSelectionGuardReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_SCHEMA_VERSION;
  readonly guardId: typeof DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-1-runtime-selection-guard-only';
    readonly databaseAdapterContractSchemaVersion: string;
    readonly runtimeSelectionSchemaVersion: typeof PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseAdapterContractPassed: boolean;
    readonly runtimeSelectionScriptExists: boolean;
    readonly validateScriptRunsRuntimeSelectionGuard: boolean;
    readonly runtimeSelectionModuleExists: boolean;
    readonly runtimeSelectionGuardModuleExists: boolean;
    readonly runtimeSelectionDocExists: boolean;
    readonly phase81StatusDocExists: boolean;
    readonly runtimeSelectionDefinesExpectedEnvMode: boolean;
    readonly defaultUnsetModeSelectsMemory: boolean;
    readonly explicitMemoryModeSelectsMemory: boolean;
    readonly invalidModeFailsClosed: boolean;
    readonly databaseModeWithoutEnvFailsClosed: boolean;
    readonly databaseModeWithCompleteEnvIsContractOnly: boolean;
    readonly routeAdapterFailsClosedForDatabaseMode: boolean;
    readonly clientExposedDatabaseEnvBlocked: boolean;
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
  };
  readonly docs: {
    readonly runtimeSelectionGuard: string;
    readonly phase81Status: string;
    readonly phase8Transition: string;
  };
  readonly runtimeSelection: {
    readonly modeEnv: typeof PUBLIC_RESULT_STORAGE_MODE_ENV;
    readonly allowedModes: readonly string[];
    readonly requiredDatabaseEnvKeys: readonly string[];
    readonly forbiddenPublicDatabaseEnvKeys: readonly string[];
    readonly guardRules: readonly string[];
    readonly defaultStatus: string;
    readonly defaultAdapterKind: string;
    readonly explicitMemoryStatus: string;
    readonly invalidModeStatus: string;
    readonly missingDatabaseEnvStatus: string;
    readonly completeDatabaseEnvStatus: string;
    readonly completeDatabaseAdapterKind: string;
    readonly completeDatabaseRouteBindingAllowed: boolean;
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
    readonly checkedFileCount: number;
    readonly guardRuleCount: number;
    readonly requiredDatabaseEnvKeyCount: number;
    readonly forbiddenPublicDatabaseEnvKeyCount: number;
    readonly blockedPathCount: number;
    readonly blockedIntegrationSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const RUNTIME_SELECTION_MODULE = 'src/core/public-link/publicResultStorageRuntimeSelection.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const RUNTIME_SELECTION_GUARD_MODULE = 'src/core/release/databaseAdapterRuntimeSelectionGuard.ts';
const RUNTIME_SELECTION_SCRIPT = 'scripts/database-adapter-runtime-selection-guard.ts';
const RUNTIME_SELECTION_DOC = 'docs/release/phase-8-database-adapter-runtime-selection-guard.md';
const PHASE_8_1_STATUS_DOC = 'docs/ui/phase-8-1-database-adapter-runtime-selection-guard-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  RUNTIME_SELECTION_MODULE,
  ROUTE_HANDLERS_MODULE,
  RUNTIME_SELECTION_DOC,
  PHASE_8_1_STATUS_DOC,
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
  'PUBLIC_RESULT_STORAGE_MODE=memory',
  'PUBLIC_RESULT_STORAGE_MODE=database',
  'fails closed',
  'route handlers remain dry-run in-memory',
  'database mode is contract-only',
  'client-exposed database environment variables are blocked',
  'no production database client',
  'Phase 8.1'
] as const;

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1'
} as const;

export async function runDatabaseAdapterRuntimeSelectionGuard(
  options: DatabaseAdapterRuntimeSelectionGuardOptions = {}
): Promise<DatabaseAdapterRuntimeSelectionGuardReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseAdapterContract = readDatabaseAdapterContractEvidence(repoRoot);
  const runtimeSelectionSource = readOptionalFile(repoRoot, RUNTIME_SELECTION_MODULE);
  const routeHandlersSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const contractDoc = readOptionalFile(repoRoot, RUNTIME_SELECTION_DOC);

  const defaultSelection = resolvePublicResultStorageRuntimeSelection({});
  const memorySelection = resolvePublicResultStorageRuntimeSelection({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_MEMORY_MODE });
  const invalidSelection = resolvePublicResultStorageRuntimeSelection({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: 'supabase' });
  const missingDatabaseEnvSelection = resolvePublicResultStorageRuntimeSelection({
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE
  });
  const completeDatabaseSelection = resolvePublicResultStorageRuntimeSelection(COMPLETE_DATABASE_ENV);
  const publicEnvSelection = resolvePublicResultStorageRuntimeSelection({
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_MEMORY_MODE,
    NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL: 'postgresql://leaked.invalid/db'
  });

  const databaseModeRouteThrows = didThrow(() => resolvePublicResultRouteStorageAdapter({ env: COMPLETE_DATABASE_ENV }));
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const blockedIntegrationSignals = findSignals(checkedSource, BLOCKED_INTEGRATION_SIGNALS);
  const rawOrFullResultSignals = findSignals(routeHandlersSource, RAW_OR_FULL_RESULT_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const migrationFiles = blockedPaths.filter((item) => ['migrations', 'prisma', 'supabase', 'drizzle'].includes(item));

  const gates = {
    databaseAdapterContractPassed: databaseAdapterContract.gates.overallPassed,
    runtimeSelectionScriptExists:
      packageJson.scripts?.['guard:database-runtime-selection'] === 'tsx scripts/database-adapter-runtime-selection-guard.ts',
    validateScriptRunsRuntimeSelectionGuard: validateScript.includes('npm run guard:database-runtime-selection'),
    runtimeSelectionModuleExists: existsSync(path.join(repoRoot, RUNTIME_SELECTION_MODULE)),
    runtimeSelectionGuardModuleExists: existsSync(path.join(repoRoot, RUNTIME_SELECTION_GUARD_MODULE)),
    runtimeSelectionDocExists: existsSync(path.join(repoRoot, RUNTIME_SELECTION_DOC)),
    phase81StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_1_STATUS_DOC)),
    runtimeSelectionDefinesExpectedEnvMode:
      runtimeSelectionSource.includes(PUBLIC_RESULT_STORAGE_MODE_ENV) &&
      runtimeSelectionSource.includes(PUBLIC_RESULT_STORAGE_MEMORY_MODE) &&
      runtimeSelectionSource.includes(PUBLIC_RESULT_STORAGE_DATABASE_MODE) &&
      runtimeSelectionSource.includes('PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS'),
    defaultUnsetModeSelectsMemory:
      defaultSelection.status === 'memory-selected' &&
      defaultSelection.effectiveMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE &&
      defaultSelection.adapterKind === PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND &&
      defaultSelection.routeBindingAllowed === true &&
      defaultSelection.failClosed === false,
    explicitMemoryModeSelectsMemory:
      memorySelection.status === 'memory-selected' &&
      memorySelection.effectiveMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE &&
      memorySelection.adapterKind === PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND &&
      memorySelection.issues.length === 0,
    invalidModeFailsClosed:
      invalidSelection.status === 'invalid-mode-blocked' &&
      invalidSelection.effectiveMode === 'blocked' &&
      invalidSelection.routeBindingAllowed === false &&
      invalidSelection.failClosed === true &&
      invalidSelection.issues.includes('invalid_storage_mode:supabase'),
    databaseModeWithoutEnvFailsClosed:
      missingDatabaseEnvSelection.status === 'database-blocked' &&
      missingDatabaseEnvSelection.missingDatabaseEnvKeys.length === PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.length &&
      missingDatabaseEnvSelection.routeBindingAllowed === false &&
      missingDatabaseEnvSelection.failClosed === true,
    databaseModeWithCompleteEnvIsContractOnly:
      completeDatabaseSelection.status === 'database-configured-contract-only' &&
      completeDatabaseSelection.adapterKind === DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND &&
      completeDatabaseSelection.routeBindingAllowed === false &&
      completeDatabaseSelection.databaseClientAllowed === false &&
      completeDatabaseSelection.adapterFactoryImplemented === false &&
      completeDatabaseSelection.failClosed === true,
    routeAdapterFailsClosedForDatabaseMode: databaseModeRouteThrows,
    clientExposedDatabaseEnvBlocked:
      publicEnvSelection.status === 'database-blocked' &&
      publicEnvSelection.forbiddenPublicDatabaseEnvKeys.includes('NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL') &&
      publicEnvSelection.routeBindingAllowed === false,
    routeHandlersRemainDryRunInMemory:
      routeHandlersSource.includes(PUBLIC_RESULT_ROUTE_HANDLERS_MODE) &&
      routeHandlersSource.includes('createInMemoryPublicResultStorageAdapter') &&
      routeHandlersSource.includes('getPublicResultRouteAdapter') &&
      routeHandlersSource.includes('database-runtime-selection-fails-closed-before-client-binding') &&
      routeHandlersSource.includes('dry-run-in-memory-only'),
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
    schemaVersion: DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_SCHEMA_VERSION,
    guardId: DATABASE_ADAPTER_RUNTIME_SELECTION_GUARD_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-1-runtime-selection-guard-only',
      databaseAdapterContractSchemaVersion: databaseAdapterContract.schemaVersion,
      runtimeSelectionSchemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    docs: {
      runtimeSelectionGuard: RUNTIME_SELECTION_DOC,
      phase81Status: PHASE_8_1_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    runtimeSelection: {
      modeEnv: PUBLIC_RESULT_STORAGE_MODE_ENV,
      allowedModes: [PUBLIC_RESULT_STORAGE_MEMORY_MODE, PUBLIC_RESULT_STORAGE_DATABASE_MODE],
      requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
      forbiddenPublicDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS,
      guardRules: summarizePublicResultStorageRuntimeSelectionGuards(),
      defaultStatus: defaultSelection.status,
      defaultAdapterKind: defaultSelection.adapterKind,
      explicitMemoryStatus: memorySelection.status,
      invalidModeStatus: invalidSelection.status,
      missingDatabaseEnvStatus: missingDatabaseEnvSelection.status,
      completeDatabaseEnvStatus: completeDatabaseSelection.status,
      completeDatabaseAdapterKind: completeDatabaseSelection.adapterKind,
      completeDatabaseRouteBindingAllowed: completeDatabaseSelection.routeBindingAllowed
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
      checkedFileCount: CHECKED_FILES.length,
      guardRuleCount: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_GUARDS.length,
      requiredDatabaseEnvKeyCount: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.length,
      forbiddenPublicDatabaseEnvKeyCount: PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS.length,
      blockedPathCount: blockedPaths.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length
    },
    issues: buildIssues(completeGates, {
      databaseAdapterIssues: databaseAdapterContract.issues,
      blockedPaths,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      rawOrFullResultSignals,
      missingContractPhrases
    })
  };
}

export function writeDatabaseAdapterRuntimeSelectionGuardEvidence(
  report: DatabaseAdapterRuntimeSelectionGuardReport,
  outputPath = 'docs/evidence/database-adapter-runtime-selection-guard-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readDatabaseAdapterContractEvidence(repoRoot: string): {
  readonly schemaVersion: string;
  readonly gates: { readonly overallPassed: boolean };
  readonly issues: readonly string[];
} {
  const evidencePath = path.join(repoRoot, 'docs/evidence/database-adapter-contract-latest.json');
  if (!existsSync(evidencePath)) {
    return {
      schemaVersion: 'missing-database-adapter-contract-evidence',
      gates: { overallPassed: false },
      issues: ['missing_database_adapter_contract_evidence']
    };
  }

  const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) {
    return {
      schemaVersion: 'invalid-database-adapter-contract-evidence',
      gates: { overallPassed: false },
      issues: ['invalid_database_adapter_contract_evidence']
    };
  }

  const gates = isRecord(parsed.gates) ? parsed.gates : {};
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((item): item is string => typeof item === 'string') : [];
  return {
    schemaVersion: typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : 'unknown-database-adapter-contract-schema',
    gates: { overallPassed: gates.overallPassed === true },
    issues: rawIssues
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseAdapterRuntimeSelectionGuardReport['scripts'] {
  const scripts: { validate?: string; databaseAdapterContract?: string; runtimeSelectionGuard?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-adapter'] !== undefined) {
    scripts.databaseAdapterContract = packageJson.scripts['contract:database-adapter'];
  }
  if (packageJson.scripts?.['guard:database-runtime-selection'] !== undefined) {
    scripts.runtimeSelectionGuard = packageJson.scripts['guard:database-runtime-selection'];
  }
  return scripts;
}

function buildIssues(
  gates: DatabaseAdapterRuntimeSelectionGuardReport['gates'],
  inputs: Readonly<{
    databaseAdapterIssues: readonly string[];
    blockedPaths: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    rawOrFullResultSignals: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_runtime_selection_guard_failed:${key}`);
  }
  for (const issue of inputs.databaseAdapterIssues) issues.push(`database_adapter_contract:${issue}`);
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
