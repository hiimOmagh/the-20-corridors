import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildDatabasePublicResultStorageRecord, markDatabasePublicResultStorageRecordDeleted } from '../public-link/databasePublicResultStorage';
import {
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
  buildDatabaseStorageAdapterImplementationSampleRow,
  createPublicResultDatabaseStorageAdapterImplementation,
  type PublicResultDatabaseQueryExecutionResult,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterRow
} from '../public-link/publicResultDatabaseStorageAdapter';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../public-link/publicResultStorage';
import { buildCompleteDatabaseClientSmokeEnvironment } from '../public-link/publicResultDatabaseClientSmokeBoundary';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import { resolvePublicResultStorageAdapterFactoryDecision } from '../public-link/publicResultStorageAdapterFactory';

export const DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_SCHEMA_VERSION =
  'phase-8.8-database-adapter-implementation-disabled-factory-gate-v1' as const;
export const DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_ID =
  'phase-8-database-adapter-implementation-disabled-factory-gate' as const;

export interface DatabaseAdapterImplementationDisabledFactoryGateOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterImplementationDisabledFactoryGateReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-8-database-adapter-implementation-disabled-factory-gate';
    readonly adapterImplementationSchemaVersion: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseClientQueryReadinessPassed: boolean;
    readonly databaseClientSmokePassed: boolean;
    readonly implementationScriptExists: boolean;
    readonly validateScriptRunsAdapterImplementation: boolean;
    readonly adapterImplementationModuleExists: boolean;
    readonly implementationGuardModuleExists: boolean;
    readonly implementationDocExists: boolean;
    readonly phase88StatusDocExists: boolean;
    readonly adapterImplementsDatabaseStorageContract: boolean;
    readonly adapterMethodsMapToQueryIntents: boolean;
    readonly allSixQueryIntentsCovered: boolean;
    readonly sqlExecutionBehindExplicitAdapterMethods: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly factoryStillRefusesDatabaseAdapterBinding: boolean;
    readonly factoryDoesNotImportDatabaseAdapterImplementation: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly selectedSdkImportStillConfinedToSmokeBoundary: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseClientSmoke?: string;
    readonly databaseQueryReadiness?: string;
    readonly databaseAdapterImplementation?: string;
  };
  readonly adapter: {
    readonly phase: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE;
    readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION;
    readonly adapterKind: string;
    readonly contractSchemaVersion: string;
    readonly recordSchemaVersion: string;
    readonly routeBindingAllowed: false;
    readonly factoryBindingAllowed: false;
    readonly productionSmokeAllowed: false;
    readonly methodNames: readonly string[];
    readonly observedQueryIntents: readonly string[];
    readonly createStatus: string;
    readonly readStatus: string;
    readonly deleteStatus: string;
    readonly pruneDeletedCount: number;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly importedDatabaseSdkFiles: readonly string[];
    readonly unapprovedDatabaseSdkImportFiles: readonly string[];
    readonly adapterExecutionSignals: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly factoryImportSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseClientQueryReadinessIssueCount: number;
    readonly databaseClientSmokeIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly observedQueryIntentCount: number;
    readonly expectedQueryIntentCount: number;
    readonly importedDatabaseSdkFileCount: number;
    readonly unapprovedDatabaseSdkImportFileCount: number;
    readonly adapterExecutionSignalCount: number;
    readonly routeBindingSignalCount: number;
    readonly factoryImportSignalCount: number;
    readonly productionMutationSmokeSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const ADAPTER_MODULE = 'src/core/public-link/publicResultDatabaseStorageAdapter.ts';
const ADAPTER_GUARD_MODULE = 'src/core/release/databaseAdapterImplementationDisabledFactoryGate.ts';
const ADAPTER_SCRIPT = 'scripts/database-adapter-implementation-disabled-factory-gate.ts';
const ADAPTER_DOC = 'docs/release/phase-8-database-adapter-implementation-disabled-factory-gate.md';
const PHASE_8_8_STATUS_DOC = 'docs/ui/phase-8-8-database-adapter-implementation-disabled-factory-gate-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const CLIENT_SMOKE_MODULE = 'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts';
const QUERY_READINESS_MODULE = 'src/core/public-link/publicResultDatabaseClientQueryReadiness.ts';

const CHECKED_FILES = [
  ADAPTER_MODULE,
  QUERY_READINESS_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  ADAPTER_DOC,
  PHASE_8_8_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [ADAPTER_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

const EXPECTED_QUERY_INTENTS = [
  'insert-public-result-record',
  'read-active-public-result-by-public-id',
  'verify-delete-token-hash-for-public-id',
  'soft-delete-public-result-by-public-id',
  'mark-expired-public-results',
  'prune-deleted-or-expired-public-results'
] as const;

const DATABASE_IMPORT_SIGNALS = [
  'from "@neondatabase/serverless"',
  "from '@neondatabase/serverless'",
  'require("@neondatabase/serverless")',
  "require('@neondatabase/serverless')"
] as const;

const ADAPTER_EXECUTION_SIGNALS = ['await executeQuery', 'executeQuery('] as const;
const ROUTE_BINDING_SIGNALS = ['createPublicResultDatabaseStorageAdapterImplementation(', 'PUBLIC_RESULT_STORAGE_DATABASE_MODE'];
const FACTORY_IMPORT_SIGNALS = ['publicResultDatabaseStorageAdapter', 'createPublicResultDatabaseStorageAdapterImplementation'];
const PRODUCTION_MUTATION_SMOKE_SIGNALS = ['networkQueryExecuted: true', 'sqlMutationExecuted: true', 'productionSmokeAllowed: true'];
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
  'Database adapter implementation exists',
  'Adapter maps create/read/delete/prune methods to Phase 8.5 query intents',
  'All SQL execution remains behind explicit adapter methods',
  'Factory still refuses database adapter binding by default',
  'Routes still use memory/dry-run behavior',
  'No production mutation smoke yet',
  'Phase 8.8'
] as const;

export async function runDatabaseAdapterImplementationDisabledFactoryGate(
  options: DatabaseAdapterImplementationDisabledFactoryGateOptions = {}
): Promise<DatabaseAdapterImplementationDisabledFactoryGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const queryReadinessEvidence = readEvidence(
    repoRoot,
    'docs/evidence/database-client-query-readiness-guard-latest.json',
    'database_client_query_readiness_guard'
  );
  const clientSmokeEvidence = readEvidence(
    repoRoot,
    'docs/evidence/database-client-smoke-boundary-latest.json',
    'database_client_smoke_boundary'
  );
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const adapterSource = readOptionalFile(repoRoot, ADAPTER_MODULE);
  const routeSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const factorySource = readOptionalFile(repoRoot, FACTORY_MODULE);
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const factoryDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({ env: buildCompleteDatabaseClientSmokeEnvironment() });
  const adapterSimulation = await simulateAdapterImplementationFlow();

  const allSourceFiles = listSourceFiles(repoRoot, ['src/core/public-link', 'src/app']);
  const importedDatabaseSdkFiles = allSourceFiles
    .filter((file) => DATABASE_IMPORT_SIGNALS.some((signal) => readOptionalFile(repoRoot, file).includes(signal)))
    .sort();
  const unapprovedDatabaseSdkImportFiles = importedDatabaseSdkFiles.filter((file) => file !== CLIENT_SMOKE_MODULE);
  const adapterExecutionSignals = findSignals(adapterSource, ADAPTER_EXECUTION_SIGNALS);
  const routeBindingSignals = findSignals(routeSource, ROUTE_BINDING_SIGNALS);
  const factoryImportSignals = findSignals(factorySource, FACTORY_IMPORT_SIGNALS);
  const productionMutationSmokeSignals = findSignals(implementationSource, PRODUCTION_MUTATION_SMOKE_SIGNALS);
  const blockedIntegrationSignals = findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = missingSignals(checkedSource, REQUIRED_CONTRACT_PHRASES);

  const observedIntentSet = new Set(adapterSimulation.observedQueryIntents);
  const allExpectedIntentsCovered = EXPECTED_QUERY_INTENTS.every((intent) => observedIntentSet.has(intent));

  const gates: DatabaseAdapterImplementationDisabledFactoryGateReport['gates'] = {
    databaseClientQueryReadinessPassed: queryReadinessEvidence.overallPassed,
    databaseClientSmokePassed: clientSmokeEvidence.overallPassed,
    implementationScriptExists:
      packageJson.scripts?.['guard:database-adapter-implementation'] ===
      'tsx scripts/database-adapter-implementation-disabled-factory-gate.ts',
    validateScriptRunsAdapterImplementation: validateScript.includes('npm run guard:database-adapter-implementation'),
    adapterImplementationModuleExists: existsSync(path.join(repoRoot, ADAPTER_MODULE)),
    implementationGuardModuleExists: existsSync(path.join(repoRoot, ADAPTER_GUARD_MODULE)),
    implementationDocExists: existsSync(path.join(repoRoot, ADAPTER_DOC)),
    phase88StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_8_STATUS_DOC)),
    adapterImplementsDatabaseStorageContract:
      adapterSimulation.adapterKind === 'server-only-public-result-database-adapter' &&
      adapterSimulation.contractSchemaVersion === 'phase-8.0-database-adapter-contract-v1' &&
      adapterSimulation.recordSchemaVersion === 'public-result-database-record-v1',
    adapterMethodsMapToQueryIntents:
      adapterSimulation.methodNames.includes('create') &&
      adapterSimulation.methodNames.includes('read') &&
      adapterSimulation.methodNames.includes('delete') &&
      adapterSimulation.methodNames.includes('pruneExpired') &&
      adapterSimulation.observedQueryIntents.length >= EXPECTED_QUERY_INTENTS.length,
    allSixQueryIntentsCovered: allExpectedIntentsCovered,
    sqlExecutionBehindExplicitAdapterMethods:
      adapterExecutionSignals.includes('await executeQuery') && adapterExecutionSignals.includes('executeQuery('),
    noProductionMutationSmoke: productionMutationSmokeSignals.length === 0 && adapterSimulation.productionSmokeAllowed === false,
    factoryStillRefusesDatabaseAdapterBinding:
      factoryDatabaseDecision.status === 'database-factory-contract-only' &&
      factoryDatabaseDecision.databaseAdapterCreated === false &&
      factoryDatabaseDecision.routeBindingAllowed === false,
    factoryDoesNotImportDatabaseAdapterImplementation: factoryImportSignals.length === 0,
    routesRemainMemoryDryRun:
      checkedSource.includes('Routes still use memory/dry-run behavior') && routeSource.includes('handlePublicResultCreateDryRun'),
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    selectedSdkImportStillConfinedToSmokeBoundary:
      importedDatabaseSdkFiles.length === 1 && importedDatabaseSdkFiles[0] === CLIENT_SMOKE_MODULE,
    noAuthPaymentAiAnalyticsTelemetryImplementation: blockedIntegrationSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_SCHEMA_VERSION,
    contractId: DATABASE_ADAPTER_IMPLEMENTATION_DISABLED_FACTORY_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-8-database-adapter-implementation-disabled-factory-gate',
      adapterImplementationSchemaVersion: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    adapter: {
      phase: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
      schemaVersion: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
      adapterKind: adapterSimulation.adapterKind,
      contractSchemaVersion: adapterSimulation.contractSchemaVersion,
      recordSchemaVersion: adapterSimulation.recordSchemaVersion,
      routeBindingAllowed: false,
      factoryBindingAllowed: false,
      productionSmokeAllowed: false,
      methodNames: adapterSimulation.methodNames,
      observedQueryIntents: adapterSimulation.observedQueryIntents,
      createStatus: adapterSimulation.createStatus,
      readStatus: adapterSimulation.readStatus,
      deleteStatus: adapterSimulation.deleteStatus,
      pruneDeletedCount: adapterSimulation.pruneDeletedCount
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      importedDatabaseSdkFiles,
      unapprovedDatabaseSdkImportFiles,
      adapterExecutionSignals,
      routeBindingSignals,
      factoryImportSignals,
      productionMutationSmokeSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      databaseClientQueryReadinessIssueCount: queryReadinessEvidence.issues.length,
      databaseClientSmokeIssueCount: clientSmokeEvidence.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      observedQueryIntentCount: adapterSimulation.observedQueryIntents.length,
      expectedQueryIntentCount: EXPECTED_QUERY_INTENTS.length,
      importedDatabaseSdkFileCount: importedDatabaseSdkFiles.length,
      unapprovedDatabaseSdkImportFileCount: unapprovedDatabaseSdkImportFiles.length,
      adapterExecutionSignalCount: adapterExecutionSignals.length,
      routeBindingSignalCount: routeBindingSignals.length,
      factoryImportSignalCount: factoryImportSignals.length,
      productionMutationSmokeSignalCount: productionMutationSmokeSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues: buildIssues(completeGates, {
      missingContractPhrases,
      unapprovedDatabaseSdkImportFiles,
      productionMutationSmokeSignals,
      persistentPublicLookupRouteFiles,
      factoryImportSignals,
      routeBindingSignals,
      blockedIntegrationSignals
    })
  };
}

export function writeDatabaseAdapterImplementationDisabledFactoryGateEvidence(
  report: DatabaseAdapterImplementationDisabledFactoryGateReport,
  outputPath: string
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function simulateAdapterImplementationFlow(): Promise<{
  readonly adapterKind: string;
  readonly contractSchemaVersion: string;
  readonly recordSchemaVersion: string;
  readonly methodNames: readonly string[];
  readonly observedQueryIntents: readonly string[];
  readonly createStatus: string;
  readonly readStatus: string;
  readonly deleteStatus: string;
  readonly pruneDeletedCount: number;
  readonly productionSmokeAllowed: false;
}> {
  const createdAt = '2026-06-06T12:00:00.000Z';
  const publicId = 'pub_Phase88AdapterImpl7Kf9sQ2mN8xR4vB';
  const deleteToken = 'delete_Phase88AdapterImpl7Kf9sQ2mN8xR4vB_123456789';
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
  const dto = buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), {
    resultId: publicId,
    createdAt,
    expiresAt,
    deleteTokenHash
  });
  const input = { publicId, dto, createdAt, expiresAt, deleteTokenHash };
  const activeRecord = buildDatabasePublicResultStorageRecord(input);
  const deletedRecord = markDatabasePublicResultStorageRecordDeleted(activeRecord, createdAt);
  const observedQueryIntents: string[] = [];
  const rowFor = (record: ReturnType<typeof buildDatabasePublicResultStorageRecord>): PublicResultDatabaseStorageAdapterRow =>
    buildDatabaseStorageAdapterImplementationSampleRow(
      {
        publicId: record.publicId,
        dto: record.dto,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        deleteTokenHash: record.deleteTokenHash
      },
      createdAt
    );
  const deletedRow: PublicResultDatabaseStorageAdapterRow = {
    ...rowFor(deletedRecord),
    deleted_at: createdAt,
    status: 'deleted'
  };

  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor): Promise<PublicResultDatabaseQueryExecutionResult> => {
    observedQueryIntents.push(descriptor.intentName);
    switch (descriptor.intentName) {
      case 'insert-public-result-record':
        return { rows: [rowFor(activeRecord)], rowCount: 1 };
      case 'read-active-public-result-by-public-id':
        return { rows: [rowFor(activeRecord)], rowCount: 1 };
      case 'verify-delete-token-hash-for-public-id':
        return { rows: [rowFor(activeRecord)], rowCount: 1 };
      case 'soft-delete-public-result-by-public-id':
        return { rows: [deletedRow], rowCount: 1 };
      case 'mark-expired-public-results':
        return { rows: [rowFor(activeRecord)], rowCount: 1 };
      case 'prune-deleted-or-expired-public-results':
        return { rows: [deletedRow], rowCount: 1 };
      default:
        return { rows: [], rowCount: 0 };
    }
  };

  const adapter = createPublicResultDatabaseStorageAdapterImplementation({ executeQuery, nowIso: () => createdAt });
  const created = await adapter.create(input);
  const read = await adapter.read(publicId);
  const deleted = await adapter.delete({ publicId, deleteToken });
  const pruned = await adapter.pruneExpired(createdAt);
  const diagnostics = adapter.diagnostics();

  return {
    adapterKind: adapter.adapterKind,
    contractSchemaVersion: adapter.contractSchemaVersion,
    recordSchemaVersion: adapter.recordSchemaVersion,
    methodNames: ['create', 'read', 'delete', 'pruneExpired'],
    observedQueryIntents,
    createStatus: created.status,
    readStatus: read.status,
    deleteStatus: deleted.status,
    pruneDeletedCount: pruned.deletedCount,
    productionSmokeAllowed: diagnostics.productionSmokeAllowed
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseAdapterImplementationDisabledFactoryGateReport['scripts'] {
  const scripts: Record<string, string> = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['smoke:database-client'] !== undefined) {
    scripts.databaseClientSmoke = packageJson.scripts['smoke:database-client'];
  }
  if (packageJson.scripts?.['guard:database-query-readiness'] !== undefined) {
    scripts.databaseQueryReadiness = packageJson.scripts['guard:database-query-readiness'];
  }
  if (packageJson.scripts?.['guard:database-adapter-implementation'] !== undefined) {
    scripts.databaseAdapterImplementation = packageJson.scripts['guard:database-adapter-implementation'];
  }
  return scripts;
}

function buildIssues(
  gates: DatabaseAdapterImplementationDisabledFactoryGateReport['gates'],
  details: {
    readonly missingContractPhrases: readonly string[];
    readonly unapprovedDatabaseSdkImportFiles: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly factoryImportSignals: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
  }
): readonly string[] {
  return [
    ...Object.entries(gates)
      .filter(([key, value]) => key !== 'overallPassed' && value !== true)
      .map(([key]) => `database_adapter_implementation_gate_failed:${key}`),
    ...details.missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`),
    ...details.unapprovedDatabaseSdkImportFiles.map((file) => `unapproved_database_sdk_import:${file}`),
    ...details.productionMutationSmokeSignals.map((signal) => `production_mutation_smoke_signal:${signal}`),
    ...details.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route:${file}`),
    ...details.factoryImportSignals.map((signal) => `factory_imports_database_adapter:${signal}`),
    ...details.routeBindingSignals.map((signal) => `route_binding_signal:${signal}`),
    ...details.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`)
  ];
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const filePath = path.join(repoRoot, 'package.json');
  return JSON.parse(readFileSync(filePath, 'utf8')) as PackageJsonSubset;
}

function readEvidence(repoRoot: string, relativePath: string, label: string): { readonly overallPassed: boolean; readonly issues: readonly string[] } {
  const filePath = path.join(repoRoot, relativePath);
  if (!existsSync(filePath)) {
    return { overallPassed: false, issues: [`missing_evidence:${label}`] };
  }
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    readonly gates?: { readonly overallPassed?: boolean };
    readonly issues?: readonly string[];
  };
  return {
    overallPassed: parsed.gates?.overallPassed === true,
    issues: parsed.issues ?? []
  };
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const filePath = path.join(repoRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function listSourceFiles(repoRoot: string, directories: readonly string[]): readonly string[] {
  return directories.flatMap((directory) => walkFiles(path.join(repoRoot, directory), repoRoot)).sort();
}

function walkFiles(directory: string, repoRoot: string): readonly string[] {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory);
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) return walkFiles(absolutePath, repoRoot);
    if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) return [];
    return [path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/')];
  });
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): readonly string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}

function missingSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => !source.includes(signal));
}
