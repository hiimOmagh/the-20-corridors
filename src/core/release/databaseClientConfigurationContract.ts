import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE,
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_RULES,
  PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
  PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS,
  PUBLIC_RESULT_DATABASE_URL_ENV,
  assertPublicResultDatabaseClientConfigContractOnly,
  resolvePublicResultDatabaseClientConfigContract,
  summarizePublicResultDatabaseClientConfigRules
} from '../public-link/publicResultDatabaseClientConfig';
import { PUBLIC_RESULT_STORAGE_DATABASE_MODE, PUBLIC_RESULT_STORAGE_MODE_ENV } from '../public-link/publicResultStorageRuntimeSelection';
import { resolvePublicResultStorageAdapterFactoryDecision } from '../public-link/publicResultStorageAdapterFactory';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const DATABASE_CLIENT_CONFIGURATION_CONTRACT_SCHEMA_VERSION =
  'phase-8.3-database-client-configuration-contract-v1' as const;
export const DATABASE_CLIENT_CONFIGURATION_CONTRACT_ID = 'phase-8-database-client-configuration-contract' as const;

export interface DatabaseClientConfigurationContractOptions {
  readonly repoRoot?: string;
}

export interface DatabaseClientConfigurationContractReport {
  readonly schemaVersion: typeof DATABASE_CLIENT_CONFIGURATION_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_CLIENT_CONFIGURATION_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-3-database-client-config-contract-only';
    readonly databaseClientConfigSchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseAdapterContractPassed: boolean;
    readonly runtimeSelectionGuardPassed: boolean;
    readonly adapterFactoryContractPassed: boolean;
    readonly configScriptExists: boolean;
    readonly validateScriptRunsConfigContract: boolean;
    readonly configModuleExists: boolean;
    readonly configGuardModuleExists: boolean;
    readonly configDocExists: boolean;
    readonly phase83StatusDocExists: boolean;
    readonly envNamesCentralized: boolean;
    readonly serverOnlyEnvAccessDefined: boolean;
    readonly clientExposedEnvNamesBlocked: boolean;
    readonly databaseUrlValidationContractOnly: boolean;
    readonly serviceKeyValidationContractOnly: boolean;
    readonly completeConfigIsContractOnly: boolean;
    readonly incompleteConfigFailsClosed: boolean;
    readonly publicEnvFailsClosed: boolean;
    readonly factoryStillCannotCreateDatabaseAdapter: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noDatabaseSdkImportOrMigrationImplementation: boolean;
    readonly noAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseAdapterContract?: string;
    readonly runtimeSelectionGuard?: string;
    readonly adapterFactoryContract?: string;
    readonly databaseClientConfigContract?: string;
  };
  readonly docs: {
    readonly configContract: string;
    readonly phase83Status: string;
    readonly phase8Transition: string;
  };
  readonly config: {
    readonly configMode: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE;
    readonly requiredDatabaseEnvKeys: readonly string[];
    readonly serverOnlyDatabaseEnvKeys: readonly string[];
    readonly forbiddenPublicDatabaseEnvKeys: readonly string[];
    readonly supportedProviders: readonly string[];
    readonly configRules: readonly string[];
    readonly completeConfigStatus: string;
    readonly databaseUrlStatus: string;
    readonly serviceKeyStatus: string;
    readonly databaseClientCreationAllowed: boolean;
    readonly routeBindingAllowed: boolean;
    readonly missingConfigStatus: string;
    readonly publicEnvStatus: string;
    readonly factoryDatabaseStatus: string;
    readonly factoryDatabaseAdapterCreated: boolean;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseAdapterIssueCount: number;
    readonly runtimeSelectionIssueCount: number;
    readonly adapterFactoryIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly configRuleCount: number;
    readonly requiredDatabaseEnvKeyCount: number;
    readonly serverOnlyDatabaseEnvKeyCount: number;
    readonly forbiddenPublicDatabaseEnvKeyCount: number;
    readonly blockedPathCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const CONFIG_MODULE = 'src/core/public-link/publicResultDatabaseClientConfig.ts';
const RUNTIME_SELECTION_MODULE = 'src/core/public-link/publicResultStorageRuntimeSelection.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const CONFIG_GUARD_MODULE = 'src/core/release/databaseClientConfigurationContract.ts';
const CONFIG_SCRIPT = 'scripts/database-client-configuration-contract.ts';
const CONFIG_DOC = 'docs/release/phase-8-database-client-configuration-contract.md';
const PHASE_8_3_STATUS_DOC = 'docs/ui/phase-8-3-database-client-configuration-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  CONFIG_MODULE,
  RUNTIME_SELECTION_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  CONFIG_DOC,
  PHASE_8_3_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [CONFIG_MODULE, RUNTIME_SELECTION_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

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

const BLOCKED_DEPENDENCY_NAMES = ['@supabase/supabase-js', 'prisma', '@prisma/client', 'drizzle-orm', 'mongoose'] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'required DB env names are centralized',
  'server-only env access is enforced',
  'client-exposed DB env names are blocked',
  'database URL/service key validation is contract-only',
  'no production database client',
  'factory still cannot create a database adapter',
  'routes still use memory/dry-run behavior',
  'Phase 8.3'
] as const;

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
  [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'contract-only-service-key-placeholder'
} as const;

export async function runDatabaseClientConfigurationContract(
  options: DatabaseClientConfigurationContractOptions = {}
): Promise<DatabaseClientConfigurationContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseAdapterContract = readEvidence(repoRoot, 'docs/evidence/database-adapter-contract-latest.json', 'database_adapter_contract');
  const runtimeSelectionGuard = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-runtime-selection-guard-latest.json',
    'database_runtime_selection_guard'
  );
  const adapterFactoryContract = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-factory-contract-latest.json',
    'database_adapter_factory_contract'
  );

  const configSource = readOptionalFile(repoRoot, CONFIG_MODULE);
  const runtimeSelectionSource = readOptionalFile(repoRoot, RUNTIME_SELECTION_MODULE);
  const routeHandlersSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const contractDoc = readOptionalFile(repoRoot, CONFIG_DOC);

  const completeConfig = resolvePublicResultDatabaseClientConfigContract(COMPLETE_DATABASE_ENV);
  const missingConfig = resolvePublicResultDatabaseClientConfigContract({});
  const publicEnvConfig = resolvePublicResultDatabaseClientConfigContract({
    ...COMPLETE_DATABASE_ENV,
    [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'client-leaked-service-key-placeholder'
  });
  const completeConfigAssertThrows = didThrow(() => assertPublicResultDatabaseClientConfigContractOnly(missingConfig));
  const factoryDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({ env: COMPLETE_DATABASE_ENV });

  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const blockedIntegrationSignals = [
    ...findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS),
    ...findDependencySignals(packageJson, BLOCKED_DEPENDENCY_NAMES)
  ].sort();
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);

  const gates = {
    databaseAdapterContractPassed: databaseAdapterContract.overallPassed,
    runtimeSelectionGuardPassed: runtimeSelectionGuard.overallPassed,
    adapterFactoryContractPassed: adapterFactoryContract.overallPassed,
    configScriptExists: packageJson.scripts?.['contract:database-client-config'] === 'tsx scripts/database-client-configuration-contract.ts',
    validateScriptRunsConfigContract: validateScript.includes('npm run contract:database-client-config'),
    configModuleExists: existsSync(path.join(repoRoot, CONFIG_MODULE)),
    configGuardModuleExists: existsSync(path.join(repoRoot, CONFIG_GUARD_MODULE)),
    configDocExists: existsSync(path.join(repoRoot, CONFIG_DOC)),
    phase83StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_3_STATUS_DOC)),
    envNamesCentralized:
      configSource.includes('PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS') &&
      configSource.includes('PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS') &&
      runtimeSelectionSource.includes('PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS_FROM_CONFIG'),
    serverOnlyEnvAccessDefined:
      configSource.includes('serverOnly: true') &&
      configSource.includes(PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV) &&
      completeConfig.serverOnly === true,
    clientExposedEnvNamesBlocked:
      PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS.includes(NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV) &&
      publicEnvConfig.issues.includes(`forbidden_public_database_env:${NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV}`),
    databaseUrlValidationContractOnly:
      completeConfig.databaseUrlStatus === 'configured-valid-contract-only' &&
      completeConfig.databaseClientCreationAllowed === false,
    serviceKeyValidationContractOnly:
      completeConfig.serviceKeyStatus === 'configured-valid-contract-only' &&
      completeConfig.databaseClientCreationAllowed === false,
    completeConfigIsContractOnly:
      completeConfig.status === 'configured-contract-only' &&
      completeConfig.routeBindingAllowed === false &&
      completeConfig.databaseClientCreationAllowed === false,
    incompleteConfigFailsClosed: missingConfig.status === 'blocked' && completeConfigAssertThrows,
    publicEnvFailsClosed: publicEnvConfig.status === 'blocked',
    factoryStillCannotCreateDatabaseAdapter:
      factoryDatabaseDecision.status === 'database-factory-contract-only' && factoryDatabaseDecision.databaseAdapterCreated === false,
    routesRemainMemoryDryRun:
      routeHandlersSource.includes(PUBLIC_RESULT_ROUTE_HANDLERS_MODE) &&
      routeHandlersSource.includes('createPublicResultStorageAdapterFromFactory') &&
      routeHandlersSource.includes('handlePublicResultCreateDryRun'),
    noDatabaseSdkImportOrMigrationImplementation: blockedPaths.filter((item) => ['migrations', 'prisma', 'supabase', 'drizzle'].includes(item)).length === 0 && blockedIntegrationSignals.filter((signal) => ['@supabase', 'createClient(', 'new PrismaClient', 'drizzle(', 'mongoose.connect', 'database.write', 'db.insert', 'db.select', '@supabase/supabase-js', 'prisma', '@prisma/client', 'drizzle-orm', 'mongoose'].includes(signal)).length === 0,
    noAuthPaymentAiAnalyticsImplementation: blockedIntegrationSignals.filter((signal) => ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track'].includes(signal)).length === 0,
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: DATABASE_CLIENT_CONFIGURATION_CONTRACT_SCHEMA_VERSION,
    contractId: DATABASE_CLIENT_CONFIGURATION_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-3-database-client-config-contract-only',
      databaseClientConfigSchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    docs: {
      configContract: CONFIG_DOC,
      phase83Status: PHASE_8_3_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    config: {
      configMode: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE,
      requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
      serverOnlyDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
      forbiddenPublicDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS,
      supportedProviders: PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS,
      configRules: summarizePublicResultDatabaseClientConfigRules(),
      completeConfigStatus: completeConfig.status,
      databaseUrlStatus: completeConfig.databaseUrlStatus,
      serviceKeyStatus: completeConfig.serviceKeyStatus,
      databaseClientCreationAllowed: completeConfig.databaseClientCreationAllowed,
      routeBindingAllowed: completeConfig.routeBindingAllowed,
      missingConfigStatus: missingConfig.status,
      publicEnvStatus: publicEnvConfig.status,
      factoryDatabaseStatus: factoryDatabaseDecision.status,
      factoryDatabaseAdapterCreated: factoryDatabaseDecision.databaseAdapterCreated
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      blockedPaths,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      databaseAdapterIssueCount: databaseAdapterContract.issues.length,
      runtimeSelectionIssueCount: runtimeSelectionGuard.issues.length,
      adapterFactoryIssueCount: adapterFactoryContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      configRuleCount: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_RULES.length,
      requiredDatabaseEnvKeyCount: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.length,
      serverOnlyDatabaseEnvKeyCount: PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS.length,
      forbiddenPublicDatabaseEnvKeyCount: PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS.length,
      blockedPathCount: blockedPaths.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues: buildIssues(completeGates, {
      databaseAdapterIssues: databaseAdapterContract.issues,
      runtimeSelectionIssues: runtimeSelectionGuard.issues,
      adapterFactoryIssues: adapterFactoryContract.issues,
      blockedPaths,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    })
  };
}

export function writeDatabaseClientConfigurationContractEvidence(
  report: DatabaseClientConfigurationContractReport,
  outputPath = 'docs/evidence/database-client-configuration-contract-latest.json'
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

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseClientConfigurationContractReport['scripts'] {
  const scripts: {
    validate?: string;
    databaseAdapterContract?: string;
    runtimeSelectionGuard?: string;
    adapterFactoryContract?: string;
    databaseClientConfigContract?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-adapter'] !== undefined) scripts.databaseAdapterContract = packageJson.scripts['contract:database-adapter'];
  if (packageJson.scripts?.['guard:database-runtime-selection'] !== undefined) scripts.runtimeSelectionGuard = packageJson.scripts['guard:database-runtime-selection'];
  if (packageJson.scripts?.['contract:database-adapter-factory'] !== undefined) scripts.adapterFactoryContract = packageJson.scripts['contract:database-adapter-factory'];
  if (packageJson.scripts?.['contract:database-client-config'] !== undefined) scripts.databaseClientConfigContract = packageJson.scripts['contract:database-client-config'];
  return scripts;
}

function buildIssues(
  gates: DatabaseClientConfigurationContractReport['gates'],
  inputs: Readonly<{
    databaseAdapterIssues: readonly string[];
    runtimeSelectionIssues: readonly string[];
    adapterFactoryIssues: readonly string[];
    blockedPaths: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_client_configuration_contract_failed:${key}`);
  }
  for (const issue of inputs.databaseAdapterIssues) issues.push(`database_adapter_contract:${issue}`);
  for (const issue of inputs.runtimeSelectionIssues) issues.push(`database_runtime_selection_guard:${issue}`);
  for (const issue of inputs.adapterFactoryIssues) issues.push(`database_adapter_factory_contract:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`blocked_scope_path:${item}`);
  for (const signal of inputs.blockedIntegrationSignals) issues.push(`blocked_integration_signal:${signal}`);
  for (const item of inputs.persistentPublicLookupRouteFiles) issues.push(`persistent_public_route_present:${item}`);
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

function findDependencySignals(packageJson: PackageJsonSubset, dependencyNames: readonly string[]): readonly string[] {
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  return dependencyNames.filter((name) => dependencies[name] !== undefined).sort();
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
