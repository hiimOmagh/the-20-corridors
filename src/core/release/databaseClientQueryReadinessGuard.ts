import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_PHASE,
  PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION,
  buildPublicResultDatabaseQueryReadinessRecord,
  validateParameterizedDescriptor
} from '../public-link/publicResultDatabaseClientQueryReadiness';
import { PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE } from '../public-link/publicResultDatabaseClientSmokeBoundary';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import { PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME } from '../public-link/publicResultDatabaseSdkDecision';

export const DATABASE_CLIENT_QUERY_READINESS_GUARD_SCHEMA_VERSION =
  'phase-8.7-database-client-query-readiness-guard-v1' as const;
export const DATABASE_CLIENT_QUERY_READINESS_GUARD_ID = 'phase-8-database-client-query-readiness-guard' as const;

export interface DatabaseClientQueryReadinessGuardOptions {
  readonly repoRoot?: string;
}

export interface DatabaseClientQueryReadinessGuardReport {
  readonly schemaVersion: typeof DATABASE_CLIENT_QUERY_READINESS_GUARD_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_CLIENT_QUERY_READINESS_GUARD_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-7-database-client-query-readiness-guard';
    readonly readinessSchemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseClientSmokePassed: boolean;
    readonly databaseQueryContractPassed: boolean;
    readonly readinessScriptExists: boolean;
    readonly validateScriptRunsQueryReadiness: boolean;
    readonly readinessModuleExists: boolean;
    readonly readinessGuardModuleExists: boolean;
    readonly readinessDocExists: boolean;
    readonly phase87StatusDocExists: boolean;
    readonly parameterizedQueryHelpersDefined: boolean;
    readonly allQueryIntentsMapped: boolean;
    readonly placeholderValueAlignmentPassed: boolean;
    readonly noRawStringInterpolationForUserValues: boolean;
    readonly queryHelpersServerOnly: boolean;
    readonly noSqlExecutionInReadinessGuard: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noMutationSmokeAgainstDatabase: boolean;
    readonly selectedSdkImportStillConfinedToSmokeBoundary: boolean;
    readonly noDatabaseBackedAdapterYet: boolean;
    readonly factoryStillRefusesRouteBoundDatabaseAdapter: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseClientSmoke?: string;
    readonly databaseQueryContract?: string;
    readonly databaseQueryReadiness?: string;
  };
  readonly readiness: ReturnType<typeof buildPublicResultDatabaseQueryReadinessRecord>;
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly importedDatabaseSdkFiles: readonly string[];
    readonly unapprovedDatabaseSdkImportFiles: readonly string[];
    readonly executionSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly rawInterpolationSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseClientSmokeIssueCount: number;
    readonly databaseQueryIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly queryDescriptorCount: number;
    readonly mappedIntentCount: number;
    readonly placeholderMismatchCount: number;
    readonly importedDatabaseSdkFileCount: number;
    readonly unapprovedDatabaseSdkImportFileCount: number;
    readonly executionSignalCount: number;
    readonly networkExecutionSignalCount: number;
    readonly rawInterpolationSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const READINESS_MODULE = 'src/core/public-link/publicResultDatabaseClientQueryReadiness.ts';
const READINESS_GUARD_MODULE = 'src/core/release/databaseClientQueryReadinessGuard.ts';
const CLIENT_SMOKE_MODULE = PUBLIC_RESULT_DATABASE_CLIENT_SMOKE_BOUNDARY_FILE;
const QUERY_CONTRACT_MODULE = 'src/core/public-link/publicResultDatabaseQueryContract.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const READINESS_SCRIPT = 'scripts/database-client-query-readiness-guard.ts';
const READINESS_DOC = 'docs/release/phase-8-database-client-query-readiness-guard.md';
const PHASE_8_7_STATUS_DOC = 'docs/ui/phase-8-7-database-client-query-readiness-guard-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  READINESS_MODULE,
  CLIENT_SMOKE_MODULE,
  QUERY_CONTRACT_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  READINESS_DOC,
  PHASE_8_7_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [READINESS_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

const DATABASE_IMPORT_SIGNALS = [
  'from "@neondatabase/serverless"',
  "from '@neondatabase/serverless'",
  'require("@neondatabase/serverless")',
  "require('@neondatabase/serverless')"
] as const;

const EXECUTION_SIGNALS = ['await sql', 'await query', '.execute(', '.transaction(', 'neon('] as const;
const NETWORK_EXECUTION_SIGNALS = ['fetch(', 'http.request', 'https.request', 'networkQueryExecuted: true'] as const;
const RAW_INTERPOLATION_SIGNALS = ['${publicId}', '${deleteTokenHash}', '${nowIso}', '${retentionCutoffIso}', '+ publicId', '+ deleteTokenHash'] as const;
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
  'Parameterized query helpers are defined',
  'No raw string interpolation for user-controlled values',
  'Insert/read/delete/expiry query helpers map to Phase 8.5 intents',
  'Query helpers are server-only',
  'No route binding yet',
  'No adapter persistence yet',
  'No mutation smoke against production DB',
  'Phase 8.7'
] as const;

export async function runDatabaseClientQueryReadinessGuard(
  options: DatabaseClientQueryReadinessGuardOptions = {}
): Promise<DatabaseClientQueryReadinessGuardReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseClientSmoke = readEvidence(repoRoot, 'docs/evidence/database-client-smoke-boundary-latest.json', 'database_client_smoke');
  const databaseQueryContract = readEvidence(repoRoot, 'docs/evidence/database-query-contract-latest.json', 'database_query_contract');
  const readiness = buildPublicResultDatabaseQueryReadinessRecord();
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const allSourceFiles = listSourceFiles(repoRoot, ['src/core/public-link', 'src/app']);
  const importedDatabaseSdkFiles = allSourceFiles
    .filter((file) => DATABASE_IMPORT_SIGNALS.some((signal) => readOptionalFile(repoRoot, file).includes(signal)))
    .sort();
  const unapprovedDatabaseSdkImportFiles = importedDatabaseSdkFiles.filter((file) => file !== CLIENT_SMOKE_MODULE);
  const descriptorIssues = readiness.queryDescriptors.flatMap((descriptor) => validateParameterizedDescriptor(descriptor));
  const placeholderMismatchCount = descriptorIssues.filter((issue) => issue.includes('mismatch')).length;
  const executionSignals = findSignals(implementationSource, EXECUTION_SIGNALS);
  const networkExecutionSignals = findSignals(implementationSource, NETWORK_EXECUTION_SIGNALS);
  const rawInterpolationSignals = findSignals(implementationSource, RAW_INTERPOLATION_SIGNALS);
  const blockedIntegrationSignals = findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = missingSignals(checkedSource, REQUIRED_CONTRACT_PHRASES);

  const gates: DatabaseClientQueryReadinessGuardReport['gates'] = {
    databaseClientSmokePassed: databaseClientSmoke.overallPassed,
    databaseQueryContractPassed: databaseQueryContract.overallPassed,
    readinessScriptExists: packageJson.scripts?.['guard:database-query-readiness'] === 'tsx scripts/database-client-query-readiness-guard.ts',
    validateScriptRunsQueryReadiness: validateScript.includes('npm run guard:database-query-readiness'),
    readinessModuleExists: existsSync(path.join(repoRoot, READINESS_MODULE)),
    readinessGuardModuleExists: existsSync(path.join(repoRoot, READINESS_GUARD_MODULE)),
    readinessDocExists: existsSync(path.join(repoRoot, READINESS_DOC)),
    phase87StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_7_STATUS_DOC)),
    parameterizedQueryHelpersDefined:
      readiness.queryDescriptors.length === 6 && readiness.queryDescriptors.every((descriptor) => descriptor.parameterized === true),
    allQueryIntentsMapped: readiness.issues.filter((issue) => issue.startsWith('missing_query_readiness_descriptor:')).length === 0,
    placeholderValueAlignmentPassed: placeholderMismatchCount === 0,
    noRawStringInterpolationForUserValues: rawInterpolationSignals.length === 0 && descriptorIssues.every((issue) => !issue.startsWith('raw_string_interpolation_signal:')),
    queryHelpersServerOnly: readiness.serverOnly === true,
    noSqlExecutionInReadinessGuard:
      readiness.sqlExecutionAllowed === false && executionSignals.length === 0 && readiness.queryDescriptors.every((descriptor) => descriptor.executionAllowed === false),
    noNetworkQueryExecution:
      readiness.networkSmokeAllowed === false && networkExecutionSignals.length === 0 && readiness.queryDescriptors.every((descriptor) => descriptor.networkExecutionAllowed === false),
    noMutationSmokeAgainstDatabase:
      readiness.mutationSmokeAllowed === false && readiness.queryDescriptors.every((descriptor) => descriptor.mutationSmokeAllowed === false),
    selectedSdkImportStillConfinedToSmokeBoundary:
      importedDatabaseSdkFiles.length === 1 && importedDatabaseSdkFiles[0] === CLIENT_SMOKE_MODULE,
    noDatabaseBackedAdapterYet: readiness.adapterPersistenceAllowed === false && implementationSource.includes('databaseAdapterCreated: false'),
    factoryStillRefusesRouteBoundDatabaseAdapter: readiness.routeBindingAllowed === false && implementationSource.includes('routeBindingAllowed: false'),
    routesRemainMemoryDryRun:
      checkedSource.includes('Routes still use memory/dry-run behavior') && readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE).includes('handlePublicResultCreateDryRun'),
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
    schemaVersion: DATABASE_CLIENT_QUERY_READINESS_GUARD_SCHEMA_VERSION,
    contractId: DATABASE_CLIENT_QUERY_READINESS_GUARD_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-7-database-client-query-readiness-guard',
      readinessSchemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_QUERY_READINESS_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    readiness,
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      importedDatabaseSdkFiles,
      unapprovedDatabaseSdkImportFiles,
      executionSignals,
      networkExecutionSignals,
      rawInterpolationSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      databaseClientSmokeIssueCount: databaseClientSmoke.issues.length,
      databaseQueryIssueCount: databaseQueryContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      queryDescriptorCount: readiness.queryDescriptors.length,
      mappedIntentCount: readiness.mappedIntentNames.length,
      placeholderMismatchCount,
      importedDatabaseSdkFileCount: importedDatabaseSdkFiles.length,
      unapprovedDatabaseSdkImportFileCount: unapprovedDatabaseSdkImportFiles.length,
      executionSignalCount: executionSignals.length,
      networkExecutionSignalCount: networkExecutionSignals.length,
      rawInterpolationSignalCount: rawInterpolationSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues: buildIssues(completeGates, {
      databaseClientSmokeIssues: databaseClientSmoke.issues,
      databaseQueryIssues: databaseQueryContract.issues,
      readinessIssues: readiness.issues,
      descriptorIssues,
      unapprovedDatabaseSdkImportFiles,
      executionSignals,
      networkExecutionSignals,
      rawInterpolationSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    })
  };
}

export function writeDatabaseClientQueryReadinessGuardEvidence(
  report: DatabaseClientQueryReadinessGuardReport,
  outputPath = 'docs/evidence/database-client-query-readiness-guard-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseClientQueryReadinessGuardReport['scripts'] {
  const scripts: { validate?: string; databaseClientSmoke?: string; databaseQueryContract?: string; databaseQueryReadiness?: string } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['smoke:database-client'] !== undefined) scripts.databaseClientSmoke = packageJson.scripts['smoke:database-client'];
  if (packageJson.scripts?.['contract:database-query'] !== undefined) scripts.databaseQueryContract = packageJson.scripts['contract:database-query'];
  if (packageJson.scripts?.['guard:database-query-readiness'] !== undefined) scripts.databaseQueryReadiness = packageJson.scripts['guard:database-query-readiness'];
  return scripts;
}

function buildIssues(
  gates: DatabaseClientQueryReadinessGuardReport['gates'],
  inputs: Readonly<{
    databaseClientSmokeIssues: readonly string[];
    databaseQueryIssues: readonly string[];
    readinessIssues: readonly string[];
    descriptorIssues: readonly string[];
    unapprovedDatabaseSdkImportFiles: readonly string[];
    executionSignals: readonly string[];
    networkExecutionSignals: readonly string[];
    rawInterpolationSignals: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    missingContractPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_client_query_readiness_failed:${key}`);
  }
  for (const issue of inputs.databaseClientSmokeIssues) issues.push(`database_client_smoke:${issue}`);
  for (const issue of inputs.databaseQueryIssues) issues.push(`database_query_contract:${issue}`);
  for (const issue of inputs.readinessIssues) issues.push(`query_readiness:${issue}`);
  for (const issue of inputs.descriptorIssues) issues.push(`query_descriptor:${issue}`);
  for (const file of inputs.unapprovedDatabaseSdkImportFiles) issues.push(`unapproved_database_sdk_import:${file}`);
  for (const signal of inputs.executionSignals) issues.push(`execution_signal:${signal}`);
  for (const signal of inputs.networkExecutionSignals) issues.push(`network_execution_signal:${signal}`);
  for (const signal of inputs.rawInterpolationSignals) issues.push(`raw_interpolation_signal:${signal}`);
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
