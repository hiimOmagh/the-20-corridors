import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE,
  PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_PHASE,
  PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_RULES,
  PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
  buildCompleteDatabaseClientSmokeEnvironment,
  resolvePublicResultDatabaseClientSmokeBoundary,
  summarizePublicResultDatabaseClientSmokeBoundaryRules
} from '../public-link/publicResultDatabaseClientSmokeBoundary';
import {
  PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
  PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER
} from '../public-link/publicResultDatabaseSdkDecision';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import { PUBLIC_RESULT_STORAGE_DATABASE_MODE, PUBLIC_RESULT_STORAGE_MODE_ENV } from '../public-link/publicResultStorageRuntimeSelection';

export const DATABASE_CLIENT_SMOKE_BOUNDARY_SCHEMA_VERSION =
  'phase-8.6-database-sdk-client-smoke-boundary-v1' as const;
export const DATABASE_CLIENT_SMOKE_BOUNDARY_ID =
  'phase-8-database-sdk-client-smoke-boundary' as const;

export interface DatabaseClientSmokeBoundaryOptions {
  readonly repoRoot?: string;
}

export interface DatabaseClientSmokeBoundaryReport {
  readonly schemaVersion: typeof DATABASE_CLIENT_SMOKE_BOUNDARY_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_CLIENT_SMOKE_BOUNDARY_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-6-database-sdk-install-client-smoke-boundary';
    readonly smokeBoundarySchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseQueryContractPassed: boolean;
    readonly smokeScriptExists: boolean;
    readonly validateScriptRunsClientSmoke: boolean;
    readonly selectedSdkInstalledAndLocked: boolean;
    readonly selectedSdkImportedOnlyInSmokeBoundary: boolean;
    readonly clientSmokeModuleExists: boolean;
    readonly clientSmokeGuardModuleExists: boolean;
    readonly clientSmokeDocExists: boolean;
    readonly phase86StatusDocExists: boolean;
    readonly memoryModeDoesNotCreateClient: boolean;
    readonly missingEnvFailsClosedBeforeClientCreation: boolean;
    readonly invalidEnvFailsClosedBeforeClientCreation: boolean;
    readonly publicEnvFailsClosedBeforeClientCreation: boolean;
    readonly completeEnvCreatesSmokeClientWithoutNetwork: boolean;
    readonly nonNetworkSmokeOnly: boolean;
    readonly noSqlMutationExecution: boolean;
    readonly noDatabaseBackedAdapterExists: boolean;
    readonly factoryStillRefusesRouteBoundDatabaseAdapter: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseQueryContract?: string;
    readonly databaseClientSmoke?: string;
  };
  readonly smoke: {
    readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
    readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
    readonly selectedSdkVersionRange: string | null;
    readonly packageLockVersion: string | null;
    readonly boundaryFile: typeof PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE;
    readonly defaultStatus: string;
    readonly missingEnvStatus: string;
    readonly invalidEnvStatus: string;
    readonly publicEnvStatus: string;
    readonly completeEnvStatus: string;
    readonly completeEnvClientCreatedSmokeOnly: boolean;
    readonly completeEnvNetworkQueryExecuted: boolean;
    readonly completeEnvSqlMutationExecuted: boolean;
    readonly completeEnvRouteBindingAllowed: boolean;
    readonly completeEnvFactoryRouteBindingAllowed: boolean;
    readonly smokeRules: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly installedDatabasePackages: readonly string[];
    readonly packageLockDatabasePackages: readonly string[];
    readonly importedDatabaseSdkFiles: readonly string[];
    readonly unapprovedDatabaseSdkImportFiles: readonly string[];
    readonly executableSqlSignals: readonly string[];
    readonly sqlMutationSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseQueryIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly installedDatabasePackageCount: number;
    readonly packageLockDatabasePackageCount: number;
    readonly importedDatabaseSdkFileCount: number;
    readonly unapprovedDatabaseSdkImportFileCount: number;
    readonly executableSqlSignalCount: number;
    readonly sqlMutationSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
    readonly smokeRuleCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const CLIENT_SMOKE_MODULE = PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE;
const CLIENT_SMOKE_GUARD_MODULE = 'src/core/release/databaseClientSmokeBoundary.ts';
const CLIENT_SMOKE_SCRIPT = 'scripts/database-client-smoke-boundary.ts';
const CLIENT_SMOKE_DOC = 'docs/release/phase-8-database-sdk-client-smoke-boundary.md';
const PHASE_8_6_STATUS_DOC = 'docs/ui/phase-8-6-database-sdk-client-smoke-boundary-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const QUERY_CONTRACT_MODULE = 'src/core/public-link/publicResultDatabaseQueryContract.ts';
const SDK_DECISION_MODULE = 'src/core/public-link/publicResultDatabaseSdkDecision.ts';

const CHECKED_FILES = [
  CLIENT_SMOKE_MODULE,
  QUERY_CONTRACT_MODULE,
  SDK_DECISION_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  CLIENT_SMOKE_DOC,
  PHASE_8_6_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [CLIENT_SMOKE_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

const DATABASE_PACKAGES = [
  '@neondatabase/serverless',
  '@supabase/supabase-js',
  'prisma',
  '@prisma/client',
  'drizzle-orm',
  'pg',
  'postgres',
  'mongoose'
] as const;

const DATABASE_IMPORT_SIGNALS = [
  'from "@neondatabase/serverless"',
  "from '@neondatabase/serverless'",
  'require("@neondatabase/serverless")',
  "require('@neondatabase/serverless')"
] as const;

const EXECUTABLE_SQL_SIGNALS = ['sql`', 'await sql', '.query(', '.execute(', '.transaction('] as const;
const SQL_MUTATION_SIGNALS = ['insert into', 'update ', 'delete from', '.insert(', '.update(', '.delete('] as const;
const BLOCKED_INTEGRATION_SIGNALS = [
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'posthog.capture',
  'analytics.track',
  'telemetry.capture'
] as const;

const PERSISTENT_PUBLIC_LOOKUP_ROUTES = [
  'src/app/r/[publicId]',
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[publicId]',
  'src/app/results/[resultId]'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'SDK import exists only in server-only client smoke boundary',
  'Client smoke supports non-network validation first',
  'No SQL mutation is executed',
  'No database-backed adapter exists yet',
  'Factory still refuses route-bound database adapter',
  'Routes still use memory/dry-run behavior',
  'Phase 8.6'
] as const;

export async function runDatabaseClientSmokeBoundary(
  options: DatabaseClientSmokeBoundaryOptions = {}
): Promise<DatabaseClientSmokeBoundaryReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const packageLock = readPackageLock(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseQueryContract = readEvidence(repoRoot, 'docs/evidence/database-query-contract-latest.json', 'database_query_contract');
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');

  const defaultSmoke = resolvePublicResultDatabaseClientSmokeBoundary({});
  const missingEnvSmoke = resolvePublicResultDatabaseClientSmokeBoundary({ [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE });
  const invalidEnvSmoke = resolvePublicResultDatabaseClientSmokeBoundary({
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    PUBLIC_RESULT_DATABASE_URL: 'not-a-url',
    PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
    PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1'
  });
  const publicEnvSmoke = resolvePublicResultDatabaseClientSmokeBoundary({
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    PUBLIC_RESULT_DATABASE_URL: 'postgresql://contract_user:contract_password@example.invalid/the_20_corridors?sslmode=require',
    PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
    PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
    NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL: 'postgresql://leak.invalid/db'
  });
  const completeEnvSmoke = resolvePublicResultDatabaseClientSmokeBoundary(buildCompleteDatabaseClientSmokeEnvironment());

  const allSourceFiles = listSourceFiles(repoRoot, ['src/core/public-link', 'src/app']);
  const importedDatabaseSdkFiles = allSourceFiles
    .filter((file) => DATABASE_IMPORT_SIGNALS.some((signal) => readOptionalFile(repoRoot, file).includes(signal)))
    .sort();
  const unapprovedDatabaseSdkImportFiles = importedDatabaseSdkFiles.filter((file) => file !== CLIENT_SMOKE_MODULE);
  const installedDatabasePackages = findDependencySignals(packageJson, DATABASE_PACKAGES);
  const packageLockDatabasePackages = findPackageLockSignals(packageLock, DATABASE_PACKAGES);
  const executableSqlSignals = findSignals(implementationSource, EXECUTABLE_SQL_SIGNALS);
  const sqlMutationSignals = findSignals(implementationSource.toLowerCase(), SQL_MUTATION_SIGNALS);
  const blockedIntegrationSignals = findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = missingSignals(checkedSource, REQUIRED_CONTRACT_PHRASES);
  const selectedSdkVersionRange = packageJson.dependencies?.[PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME] ?? null;
  const packageLockVersion = readPackageLockPackageVersion(packageLock, `node_modules/${PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME}`);

  const gates: DatabaseClientSmokeBoundaryReport['gates'] = {
    databaseQueryContractPassed: databaseQueryContract.overallPassed,
    smokeScriptExists: packageJson.scripts?.['smoke:database-client'] === 'tsx scripts/database-client-smoke-boundary.ts',
    validateScriptRunsClientSmoke: validateScript.includes('npm run smoke:database-client'),
    selectedSdkInstalledAndLocked:
      packageJson.dependencies?.[PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME] !== undefined &&
      packageLockVersion !== null,
    selectedSdkImportedOnlyInSmokeBoundary:
      importedDatabaseSdkFiles.length === 1 && importedDatabaseSdkFiles[0] === CLIENT_SMOKE_MODULE,
    clientSmokeModuleExists: existsSync(path.join(repoRoot, CLIENT_SMOKE_MODULE)),
    clientSmokeGuardModuleExists: existsSync(path.join(repoRoot, CLIENT_SMOKE_GUARD_MODULE)),
    clientSmokeDocExists: existsSync(path.join(repoRoot, CLIENT_SMOKE_DOC)),
    phase86StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_6_STATUS_DOC)),
    memoryModeDoesNotCreateClient:
      defaultSmoke.status === 'memory-mode-no-client-created' &&
      defaultSmoke.clientCreatedSmokeOnly === false,
    missingEnvFailsClosedBeforeClientCreation:
      missingEnvSmoke.status === 'blocked' &&
      missingEnvSmoke.clientCreationAttempted === false,
    invalidEnvFailsClosedBeforeClientCreation:
      invalidEnvSmoke.status === 'blocked' &&
      invalidEnvSmoke.clientCreationAttempted === false,
    publicEnvFailsClosedBeforeClientCreation:
      publicEnvSmoke.status === 'blocked' &&
      publicEnvSmoke.clientCreationAttempted === false,
    completeEnvCreatesSmokeClientWithoutNetwork:
      completeEnvSmoke.status === 'client-created-smoke-only' &&
      completeEnvSmoke.clientCreatedSmokeOnly === true &&
      completeEnvSmoke.nonNetworkSmokePassed === true &&
      completeEnvSmoke.networkQueryExecuted === false,
    nonNetworkSmokeOnly:
      completeEnvSmoke.sqlExecutionAllowed === false &&
      completeEnvSmoke.sqlMutationExecuted === false &&
      completeEnvSmoke.networkQueryExecuted === false,
    noSqlMutationExecution: executableSqlSignals.length === 0 && sqlMutationSignals.length === 0,
    noDatabaseBackedAdapterExists:
      implementationSource.includes('databaseAdapterCreated: false') || completeEnvSmoke.databaseAdapterCreated === false,
    factoryStillRefusesRouteBoundDatabaseAdapter:
      completeEnvSmoke.factoryRouteBindingAllowed === false && completeEnvSmoke.routeBindingAllowed === false,
    routesRemainMemoryDryRun:
      checkedSource.includes('Routes still use memory/dry-run behavior') &&
      readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE).includes('handlePublicResultCreateDryRun'),
    noAuthPaymentAiAnalyticsTelemetryImplementation: blockedIntegrationSignals.length === 0,
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
    schemaVersion: DATABASE_CLIENT_SMOKE_BOUNDARY_SCHEMA_VERSION,
    contractId: DATABASE_CLIENT_SMOKE_BOUNDARY_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-6-database-sdk-install-client-smoke-boundary',
      smokeBoundarySchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    smoke: {
      selectedProvider: PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
      selectedSdkName: PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
      selectedSdkVersionRange,
      packageLockVersion,
      boundaryFile: CLIENT_SMOKE_MODULE,
      defaultStatus: defaultSmoke.status,
      missingEnvStatus: missingEnvSmoke.status,
      invalidEnvStatus: invalidEnvSmoke.status,
      publicEnvStatus: publicEnvSmoke.status,
      completeEnvStatus: completeEnvSmoke.status,
      completeEnvClientCreatedSmokeOnly: completeEnvSmoke.clientCreatedSmokeOnly,
      completeEnvNetworkQueryExecuted: completeEnvSmoke.networkQueryExecuted,
      completeEnvSqlMutationExecuted: completeEnvSmoke.sqlMutationExecuted,
      completeEnvRouteBindingAllowed: completeEnvSmoke.routeBindingAllowed,
      completeEnvFactoryRouteBindingAllowed: completeEnvSmoke.factoryRouteBindingAllowed,
      smokeRules: summarizePublicResultDatabaseClientSmokeBoundaryRules()
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      installedDatabasePackages,
      packageLockDatabasePackages,
      importedDatabaseSdkFiles,
      unapprovedDatabaseSdkImportFiles,
      executableSqlSignals,
      sqlMutationSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      databaseQueryIssueCount: databaseQueryContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      installedDatabasePackageCount: installedDatabasePackages.length,
      packageLockDatabasePackageCount: packageLockDatabasePackages.length,
      importedDatabaseSdkFileCount: importedDatabaseSdkFiles.length,
      unapprovedDatabaseSdkImportFileCount: unapprovedDatabaseSdkImportFiles.length,
      executableSqlSignalCount: executableSqlSignals.length,
      sqlMutationSignalCount: sqlMutationSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length,
      smokeRuleCount: PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_RULES.length
    },
    issues: buildIssues(completeGates, {
      databaseQueryIssues: databaseQueryContract.issues,
      unapprovedDatabaseSdkImportFiles,
      executableSqlSignals,
      sqlMutationSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    })
  };
}

export function writeDatabaseClientSmokeBoundaryEvidence(
  report: DatabaseClientSmokeBoundaryReport,
  outputPath = 'docs/evidence/database-client-smoke-boundary-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseClientSmokeBoundaryReport['scripts'] {
  const scripts: { validate?: string; databaseQueryContract?: string; databaseClientSmoke?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-query'] !== undefined) scripts.databaseQueryContract = packageJson.scripts['contract:database-query'];
  if (packageJson.scripts?.['smoke:database-client'] !== undefined) scripts.databaseClientSmoke = packageJson.scripts['smoke:database-client'];
  return scripts;
}

function buildIssues(
  gates: DatabaseClientSmokeBoundaryReport['gates'],
  inputs: Readonly<{
    databaseQueryIssues: readonly string[];
    unapprovedDatabaseSdkImportFiles: readonly string[];
    executableSqlSignals: readonly string[];
    sqlMutationSignals: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_client_smoke_boundary_failed:${key}`);
  }
  for (const issue of inputs.databaseQueryIssues) issues.push(`database_query_contract:${issue}`);
  for (const file of inputs.unapprovedDatabaseSdkImportFiles) issues.push(`unapproved_database_sdk_import:${file}`);
  for (const signal of inputs.executableSqlSignals) issues.push(`executable_sql_signal:${signal}`);
  for (const signal of inputs.sqlMutationSignals) issues.push(`sql_mutation_signal:${signal}`);
  for (const signal of inputs.blockedIntegrationSignals) issues.push(`blocked_integration_signal:${signal}`);
  for (const file of inputs.persistentPublicLookupRouteFiles) issues.push(`persistent_public_lookup_route:${file}`);
  for (const phrase of inputs.missingContractPhrases) issues.push(`missing_contract_phrase:${phrase}`);
  return [...new Set(issues)].sort();
}

function readEvidence(repoRoot: string, relativePath: string, label: string): { readonly overallPassed: boolean; readonly issues: readonly string[] } {
  const evidencePath = path.join(repoRoot, relativePath);
  if (!existsSync(evidencePath)) return { overallPassed: false, issues: [`missing_${label}_evidence`] };
  const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) return { overallPassed: false, issues: [`invalid_${label}_evidence`] };
  const gates = isRecord(parsed.gates) ? parsed.gates : {};
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((item): item is string => typeof item === 'string') : [];
  return { overallPassed: gates.overallPassed === true, issues: rawIssues };
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonSubset;
}

function readPackageLock(repoRoot: string): unknown {
  const packageLockPath = path.join(repoRoot, 'package-lock.json');
  if (!existsSync(packageLockPath)) return {};
  return JSON.parse(readFileSync(packageLockPath, 'utf8')) as unknown;
}

function readPackageLockPackageVersion(packageLock: unknown, packagePath: string): string | null {
  if (!isRecord(packageLock) || !isRecord(packageLock.packages)) return null;
  const packages = packageLock.packages;
  const entry = packages[packagePath];
  if (!isRecord(entry) || typeof entry.version !== 'string') return null;
  return entry.version;
}

function findPackageLockSignals(packageLock: unknown, packageNames: readonly string[]): readonly string[] {
  if (!isRecord(packageLock) || !isRecord(packageLock.packages)) return [];
  const packages = packageLock.packages;
  return packageNames
    .filter((name) => isRecord(packages[`node_modules/${name}`]))
    .sort();
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

function findDependencySignals(packageJson: PackageJsonSubset, dependencyNames: readonly string[]): readonly string[] {
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  return dependencyNames.filter((name) => dependencies[name] !== undefined).sort();
}

function listSourceFiles(repoRoot: string, roots: readonly string[]): readonly string[] {
  const files: string[] = [];
  for (const rootName of roots) {
    const absoluteRoot = path.join(repoRoot, rootName);
    if (existsSync(absoluteRoot)) collectSourceFiles(repoRoot, absoluteRoot, files);
  }
  return files.sort();
}

function collectSourceFiles(repoRoot: string, absolutePath: string, files: string[]): void {
  const status = statSync(absolutePath);
  if (status.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === '.next') continue;
      collectSourceFiles(repoRoot, path.join(absolutePath, entry), files);
    }
    return;
  }
  if (!/\.(ts|tsx|js|mjs|cjs|md)$/.test(absolutePath)) return;
  files.push(path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
