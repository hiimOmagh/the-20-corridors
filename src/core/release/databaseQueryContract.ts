import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_COLUMNS,
  PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES,
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_PHASE,
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS,
  PUBLIC_RESULT_DATABASE_QUERY_INTENTS,
  PUBLIC_RESULT_DATABASE_TABLE_NAME,
  resolvePublicResultDatabaseQueryContractRecord,
  summarizePublicResultDatabaseQueryContractRules
} from '../public-link/publicResultDatabaseQueryContract';
import { resolvePublicResultStorageAdapterFactoryDecision } from '../public-link/publicResultStorageAdapterFactory';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import { PUBLIC_RESULT_STORAGE_DATABASE_MODE, PUBLIC_RESULT_STORAGE_MODE_ENV } from '../public-link/publicResultStorageRuntimeSelection';
import { PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV } from '../public-link/publicResultDatabaseClientConfig';
import { PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME } from '../public-link/publicResultDatabaseSdkDecision';

export const DATABASE_QUERY_CONTRACT_SCHEMA_VERSION = 'phase-8.5-database-query-contract-v1' as const;
export const DATABASE_QUERY_CONTRACT_ID = 'phase-8-database-query-contract' as const;

export interface DatabaseQueryContractOptions {
  readonly repoRoot?: string;
}

export interface DatabaseQueryContractReport {
  readonly schemaVersion: typeof DATABASE_QUERY_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_QUERY_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-5-database-query-contract-only';
    readonly queryContractSchemaVersion: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseSdkDecisionPassed: boolean;
    readonly queryScriptExists: boolean;
    readonly validateScriptRunsQueryContract: boolean;
    readonly queryModuleExists: boolean;
    readonly queryGuardModuleExists: boolean;
    readonly queryDocExists: boolean;
    readonly phase85StatusDocExists: boolean;
    readonly tableContractDefined: boolean;
    readonly columnsAndTypesDefined: boolean;
    readonly queryIntentsDefined: boolean;
    readonly softDeleteBehaviorDefined: boolean;
    readonly expiredRecordBehaviorDefined: boolean;
    readonly deleteTokenHashLookupDefined: boolean;
    readonly noSqlExecutionYet: boolean;
    readonly noSdkInstallationOrImportYet: boolean;
    readonly factoryStillCannotCreateDatabaseAdapter: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noDatabaseClientMigrationAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseSdkDecision?: string;
    readonly databaseQueryContract?: string;
  };
  readonly docs: {
    readonly queryContract: string;
    readonly phase85Status: string;
    readonly phase8Transition: string;
  };
  readonly queryContract: {
    readonly status: typeof PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_STATUS;
    readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
    readonly tableName: typeof PUBLIC_RESULT_DATABASE_TABLE_NAME;
    readonly columns: typeof PUBLIC_RESULT_DATABASE_COLUMNS;
    readonly queryIntents: typeof PUBLIC_RESULT_DATABASE_QUERY_INTENTS;
    readonly behaviorRules: typeof PUBLIC_RESULT_DATABASE_QUERY_BEHAVIOR_RULES;
    readonly summarizedRules: readonly string[];
    readonly queryExecutionAllowed: false;
    readonly sqlClientAllowed: false;
    readonly sdkInstallAllowed: false;
    readonly sdkImportAllowed: false;
    readonly routeBindingAllowed: false;
    readonly factoryDatabaseAdapterAllowed: false;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly installedDatabasePackages: readonly string[];
    readonly importedDatabaseSdkSignals: readonly string[];
    readonly executableSqlSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseSdkDecisionIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly columnCount: number;
    readonly queryIntentCount: number;
    readonly behaviorRuleCount: number;
    readonly blockedPathCount: number;
    readonly installedDatabasePackageCount: number;
    readonly importedDatabaseSdkSignalCount: number;
    readonly executableSqlSignalCount: number;
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

const QUERY_MODULE = 'src/core/public-link/publicResultDatabaseQueryContract.ts';
const QUERY_GUARD_MODULE = 'src/core/release/databaseQueryContract.ts';
const SDK_DECISION_MODULE = 'src/core/public-link/publicResultDatabaseSdkDecision.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const QUERY_SCRIPT = 'scripts/database-query-contract.ts';
const QUERY_DOC = 'docs/release/phase-8-database-query-contract.md';
const PHASE_8_5_STATUS_DOC = 'docs/ui/phase-8-5-database-query-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  QUERY_MODULE,
  SDK_DECISION_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  QUERY_DOC,
  PHASE_8_5_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [QUERY_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

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

const DATABASE_PACKAGES_TO_BLOCK_UNTIL_CLIENT_PHASE = [
  '@neondatabase/serverless',
  '@supabase/supabase-js',
  'prisma',
  '@prisma/client',
  'drizzle-orm',
  'pg',
  'postgres',
  'mongoose'
] as const;

const DATABASE_IMPORT_SIGNALS_TO_BLOCK_UNTIL_CLIENT_PHASE = [
  'from "@neondatabase/serverless"',
  "from '@neondatabase/serverless'",
  'require("@neondatabase/serverless")',
  "require('@neondatabase/serverless')",
  'from "@supabase/supabase-js"',
  "from '@supabase/supabase-js'",
  'new PrismaClient',
  'drizzle(',
  'from "pg"',
  "from 'pg'",
  'from "postgres"',
  "from 'postgres'",
  'mongoose.connect'
] as const;

const EXECUTABLE_SQL_SIGNALS = [
  'sql`',
  'query(',
  'execute(',
  'transaction(',
  '.insert(',
  '.select(',
  '.update(',
  '.delete(',
  'database.write',
  'db.insert',
  'db.select'
] as const;

const BLOCKED_INTEGRATION_SIGNALS = [
  'createClient(',
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

const REQUIRED_CONTRACT_PHRASES = [
  'Table contract is defined',
  'Column names and types are defined',
  'Insert/read/delete/update-expiry query intents are defined',
  'Soft-delete behavior is defined',
  'Expired-record behavior is defined',
  'Delete-token-hash lookup behavior is defined',
  'No SQL execution yet',
  'No SDK installation/import yet',
  'Factory still cannot create database adapter',
  'Routes still use memory/dry-run behavior',
  'Phase 8.5'
] as const;

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
  [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'contract-only-service-key-placeholder'
} as const;

export async function runDatabaseQueryContract(options: DatabaseQueryContractOptions = {}): Promise<DatabaseQueryContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseSdkDecision = readEvidence(
    repoRoot,
    'docs/evidence/database-sdk-selection-decision-record-latest.json',
    'database_sdk_selection_decision_record'
  );
  const queryContract = resolvePublicResultDatabaseQueryContractRecord();
  const queryDoc = readOptionalFile(repoRoot, QUERY_DOC);
  const statusDoc = readOptionalFile(repoRoot, PHASE_8_5_STATUS_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const factoryDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({ env: COMPLETE_DATABASE_ENV });

  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const installedDatabasePackages = findDependencySignals(packageJson, DATABASE_PACKAGES_TO_BLOCK_UNTIL_CLIENT_PHASE);
  const importedDatabaseSdkSignals = findSignals(implementationSource, DATABASE_IMPORT_SIGNALS_TO_BLOCK_UNTIL_CLIENT_PHASE);
  const executableSqlSignals = findSignals(implementationSource, EXECUTABLE_SQL_SIGNALS);
  const blockedIntegrationSignals = findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = missingSignals(queryDoc + '\n' + statusDoc + '\n' + checkedSource, REQUIRED_CONTRACT_PHRASES);

  const columnNames = queryContract.columns.map((column) => column.name);
  const queryIntentNames = queryContract.queryIntents.map((intent) => intent.name);

  const gates: DatabaseQueryContractReport['gates'] = {
    databaseSdkDecisionPassed: databaseSdkDecision.overallPassed,
    queryScriptExists: existsSync(path.join(repoRoot, QUERY_SCRIPT)),
    validateScriptRunsQueryContract: validateScript.includes('npm run contract:database-query'),
    queryModuleExists: existsSync(path.join(repoRoot, QUERY_MODULE)),
    queryGuardModuleExists: existsSync(path.join(repoRoot, QUERY_GUARD_MODULE)),
    queryDocExists: queryDoc.includes('Phase 8.5') && queryDoc.includes('Database Query Contract'),
    phase85StatusDocExists: statusDoc.includes('Phase 8.5') && statusDoc.includes('Database Query Contract'),
    tableContractDefined: queryContract.tableName === PUBLIC_RESULT_DATABASE_TABLE_NAME && queryContract.primaryKey === 'public_id',
    columnsAndTypesDefined:
      queryContract.columns.length >= 9 &&
      columnNames.includes('public_id') &&
      columnNames.includes('dto') &&
      columnNames.includes('delete_token_hash') &&
      columnNames.includes('expires_at') &&
      columnNames.includes('deleted_at') &&
      queryContract.columns.every((column) => column.type.length > 0 && column.constraints.length > 0),
    queryIntentsDefined:
      queryContract.queryIntents.length >= 6 &&
      queryIntentNames.includes('insert-public-result-record') &&
      queryIntentNames.includes('read-active-public-result-by-public-id') &&
      queryIntentNames.includes('verify-delete-token-hash-for-public-id') &&
      queryIntentNames.includes('soft-delete-public-result-by-public-id') &&
      queryIntentNames.includes('mark-expired-public-results') &&
      queryContract.queryIntents.every((intent) => intent.executionAllowed === false),
    softDeleteBehaviorDefined:
      queryContract.behaviorRules.includes('soft-delete-sets-deleted-at-and-status-deleted') &&
      queryContract.queryIntents.some((intent) => intent.name === 'soft-delete-public-result-by-public-id' && intent.behavior.includes('status-deleted')),
    expiredRecordBehaviorDefined:
      queryContract.behaviorRules.includes('expired-records-return-expired-disposition-at-read-time') &&
      queryContract.queryIntents.some((intent) => intent.name === 'mark-expired-public-results'),
    deleteTokenHashLookupDefined:
      queryContract.behaviorRules.includes('delete-token-hash-is-used-for-delete-verification') &&
      queryContract.queryIntents.some((intent) => intent.name === 'verify-delete-token-hash-for-public-id'),
    noSqlExecutionYet:
      queryContract.queryExecutionAllowed === false && queryContract.sqlClientAllowed === false && executableSqlSignals.length === 0,
    noSdkInstallationOrImportYet:
      queryContract.sdkInstallAllowed === false &&
      queryContract.sdkImportAllowed === false &&
      installedDatabasePackages.length === 0 &&
      importedDatabaseSdkSignals.length === 0,
    factoryStillCannotCreateDatabaseAdapter:
      queryContract.factoryDatabaseAdapterAllowed === false &&
      factoryDatabaseDecision.status === 'database-factory-contract-only' &&
      factoryDatabaseDecision.databaseAdapterCreated === false,
    routesRemainMemoryDryRun:
      queryContract.routeBindingAllowed === false &&
      checkedSource.includes('routes still use memory/dry-run behavior') &&
      readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE).includes('handlePublicResultCreateDryRun'),
    noDatabaseClientMigrationAuthPaymentAiAnalyticsImplementation:
      blockedPaths.filter((item) => ['migrations', 'prisma', 'supabase', 'drizzle'].includes(item)).length === 0 &&
      blockedIntegrationSignals.length === 0,
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
    schemaVersion: DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
    contractId: DATABASE_QUERY_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-5-database-query-contract-only',
      queryContractSchemaVersion: PUBLIC_RESULT_DATABASE_QUERY_CONTRACT_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    docs: {
      queryContract: QUERY_DOC,
      phase85Status: PHASE_8_5_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    queryContract: {
      status: queryContract.status,
      selectedSdkName: queryContract.selectedSdkName,
      tableName: queryContract.tableName,
      columns: queryContract.columns,
      queryIntents: queryContract.queryIntents,
      behaviorRules: queryContract.behaviorRules,
      summarizedRules: summarizePublicResultDatabaseQueryContractRules(),
      queryExecutionAllowed: queryContract.queryExecutionAllowed,
      sqlClientAllowed: queryContract.sqlClientAllowed,
      sdkInstallAllowed: queryContract.sdkInstallAllowed,
      sdkImportAllowed: queryContract.sdkImportAllowed,
      routeBindingAllowed: queryContract.routeBindingAllowed,
      factoryDatabaseAdapterAllowed: queryContract.factoryDatabaseAdapterAllowed
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      blockedPaths,
      installedDatabasePackages,
      importedDatabaseSdkSignals,
      executableSqlSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      databaseSdkDecisionIssueCount: databaseSdkDecision.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      columnCount: queryContract.columns.length,
      queryIntentCount: queryContract.queryIntents.length,
      behaviorRuleCount: queryContract.behaviorRules.length,
      blockedPathCount: blockedPaths.length,
      installedDatabasePackageCount: installedDatabasePackages.length,
      importedDatabaseSdkSignalCount: importedDatabaseSdkSignals.length,
      executableSqlSignalCount: executableSqlSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues: buildIssues(completeGates, {
      databaseSdkDecisionIssues: databaseSdkDecision.issues,
      blockedPaths,
      installedDatabasePackages,
      importedDatabaseSdkSignals,
      executableSqlSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    })
  };
}

export function writeDatabaseQueryContractEvidence(
  report: DatabaseQueryContractReport,
  outputPath = 'docs/evidence/database-query-contract-latest.json'
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

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseQueryContractReport['scripts'] {
  const scripts: {
    validate?: string;
    databaseSdkDecision?: string;
    databaseQueryContract?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-sdk-decision'] !== undefined) scripts.databaseSdkDecision = packageJson.scripts['contract:database-sdk-decision'];
  if (packageJson.scripts?.['contract:database-query'] !== undefined) scripts.databaseQueryContract = packageJson.scripts['contract:database-query'];
  return scripts;
}

function buildIssues(
  gates: DatabaseQueryContractReport['gates'],
  inputs: Readonly<{
    databaseSdkDecisionIssues: readonly string[];
    blockedPaths: readonly string[];
    installedDatabasePackages: readonly string[];
    importedDatabaseSdkSignals: readonly string[];
    executableSqlSignals: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_query_contract_failed:${key}`);
  }
  for (const issue of inputs.databaseSdkDecisionIssues) issues.push(`database_sdk_selection_decision_record:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`blocked_scope_path:${item}`);
  for (const item of inputs.installedDatabasePackages) issues.push(`installed_database_package:${item}`);
  for (const signal of inputs.importedDatabaseSdkSignals) issues.push(`imported_database_sdk_signal:${signal}`);
  for (const signal of inputs.executableSqlSignals) issues.push(`executable_sql_signal:${signal}`);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
