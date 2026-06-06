import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash
} from '../public-link/publicResultStorage';
import {
  buildCompleteDatabaseAdapterFactoryActivationEnvironment,
  createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultDatabaseAdapterFactoryActivationDecision,
  summarizePublicResultDatabaseAdapterFactoryActivationRules
} from '../public-link/publicResultStorageAdapterFactoryActivation';
import {
  buildDatabaseStorageAdapterImplementationSampleRow,
  type PublicResultDatabaseQueryExecutionResult,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterRow
} from '../public-link/publicResultDatabaseStorageAdapter';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import type { PublicResultDatabaseQueryIntentName } from '../public-link/publicResultDatabaseClientQueryReadiness';

export const DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_SCHEMA_VERSION =
  'phase-8.10-database-adapter-factory-activation-contract-v1' as const;
export const DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_ID =
  'phase-8-database-adapter-factory-activation-contract' as const;

export interface DatabaseAdapterFactoryActivationContractOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterFactoryActivationContractReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-10-database-adapter-factory-activation-contract';
    readonly factoryActivationSchemaVersion: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly activationDryRunGatePassed: boolean;
    readonly adapterImplementationGatePassed: boolean;
    readonly queryReadinessGuardPassed: boolean;
    readonly clientSmokeBoundaryPassed: boolean;
    readonly factoryActivationScriptExists: boolean;
    readonly validateScriptRunsFactoryActivation: boolean;
    readonly factoryActivationModuleExists: boolean;
    readonly factoryActivationGuardModuleExists: boolean;
    readonly factoryActivationDocExists: boolean;
    readonly phase810StatusDocExists: boolean;
    readonly explicitNonRouteFactoryCreatesDatabaseAdapter: boolean;
    readonly databaseModeAloneDoesNotCreateAdapter: boolean;
    readonly routeHandlerContextCannotCreateDatabaseAdapter: boolean;
    readonly missingDatabaseEnvFailsClosed: boolean;
    readonly factoryRouteBindingRemainsDisabled: boolean;
    readonly routeHandlersRemainMemoryDryRun: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly activationDryRun?: string;
    readonly adapterImplementation?: string;
    readonly databaseQueryReadiness?: string;
    readonly databaseClientSmoke?: string;
    readonly factoryActivation?: string;
  };
  readonly activation: {
    readonly phase: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE;
    readonly status: string;
    readonly defaultDatabaseModeStatus: string;
    readonly routeHandlerContextStatus: string;
    readonly missingEnvStatus: string;
    readonly databaseAdapterCreated: boolean;
    readonly routeBindingAllowed: false;
    readonly routeHandlerBindingAllowed: false;
    readonly productionMutationSmokeAllowed: false;
    readonly networkQueryExecuted: false;
    readonly createStatus: string;
    readonly readStatus: string;
    readonly deleteStatus: string;
    readonly pruneDeletedCount: number;
    readonly observedQueryIntents: readonly string[];
    readonly uniqueObservedQueryIntents: readonly string[];
    readonly factoryActivationRules: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly activationDryRunIssueCount: number;
    readonly adapterImplementationIssueCount: number;
    readonly queryReadinessIssueCount: number;
    readonly clientSmokeIssueCount: number;
    readonly checkedFileCount: number;
    readonly observedQueryIntentCount: number;
    readonly uniqueObservedQueryIntentCount: number;
    readonly routeBindingSignalCount: number;
    readonly productionMutationSmokeSignalCount: number;
    readonly networkExecutionSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const FACTORY_ACTIVATION_MODULE = 'src/core/public-link/publicResultStorageAdapterFactoryActivation.ts';
const FACTORY_ACTIVATION_GUARD_MODULE = 'src/core/release/databaseAdapterFactoryActivationContract.ts';
const FACTORY_ACTIVATION_SCRIPT = 'scripts/database-adapter-factory-activation-contract.ts';
const FACTORY_ACTIVATION_DOC = 'docs/release/phase-8-database-adapter-factory-activation-contract.md';
const PHASE_8_10_STATUS_DOC = 'docs/ui/phase-8-10-database-adapter-factory-activation-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const BASE_FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';

const CHECKED_FILES = [
  FACTORY_ACTIVATION_MODULE,
  FACTORY_ACTIVATION_GUARD_MODULE,
  FACTORY_ACTIVATION_SCRIPT,
  FACTORY_ACTIVATION_DOC,
  PHASE_8_10_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  ROUTE_HANDLERS_MODULE,
  BASE_FACTORY_MODULE
] as const;

const ROUTE_BINDING_SIGNALS = [
  'createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation(',
  'createPublicResultDatabaseStorageAdapterImplementation({ executeQuery:'
] as const;
const PRODUCTION_MUTATION_SMOKE_SIGNALS = ['productionMutationSmokeAllowed: true', 'sqlMutationExecuted: true'];
const NETWORK_EXECUTION_SIGNALS = ['networkQueryExecuted: true', '.query(', 'sql`'];
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
  'Factory can create database adapter only in explicit non-route activation context',
  'Factory still refuses database adapter for route handlers',
  'PUBLIC_RESULT_STORAGE_MODE=database alone is not enough to bind routes',
  'No production mutation smoke yet',
  'No persistent /r/[publicId] lookup yet',
  'Phase 8.10'
] as const;

export async function runDatabaseAdapterFactoryActivationContract(
  options: DatabaseAdapterFactoryActivationContractOptions = {}
): Promise<DatabaseAdapterFactoryActivationContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const activationDryRunEvidence = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-activation-dry-run-gate-latest.json',
    'database_adapter_activation_dry_run_gate'
  );
  const adapterImplementationEvidence = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json',
    'database_adapter_implementation_disabled_factory_gate'
  );
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

  const activation = await simulateFactoryActivation();
  const defaultDatabaseModeDecision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
    env: buildCompleteDatabaseAdapterFactoryActivationEnvironment()
  });
  const routeHandlerContextDecision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
    env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
    context: 'route-handler',
    acknowledgeNoRouteBinding: true,
    executeQuery: async () => ({ rows: [], rowCount: 0 })
  });
  const missingEnvDecision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
    env: { PUBLIC_RESULT_STORAGE_MODE: 'database' },
    context: 'explicit-non-route-database-activation',
    acknowledgeNoRouteBinding: true,
    executeQuery: async () => ({ rows: [], rowCount: 0 })
  });

  const routeSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const baseFactorySource = readOptionalFile(repoRoot, BASE_FACTORY_MODULE);
  const runtimeRouteBindingSource = `${routeSource}\n${baseFactorySource}`;
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const docSource = readOptionalFile(repoRoot, FACTORY_ACTIVATION_DOC);
  const routeBindingSignals = findSignals(runtimeRouteBindingSource, ROUTE_BINDING_SIGNALS);
  const productionMutationSmokeSignals = findSignals(runtimeRouteBindingSource, PRODUCTION_MUTATION_SMOKE_SIGNALS);
  const networkExecutionSignals = findSignals(runtimeRouteBindingSource, NETWORK_EXECUTION_SIGNALS);
  const blockedIntegrationSignals = findSignals(runtimeRouteBindingSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = REQUIRED_CONTRACT_PHRASES.filter((phrase) => !docSource.includes(phrase));
  const scripts = buildScriptSummary(packageJson);

  const gates = {
    activationDryRunGatePassed: evidencePassed(activationDryRunEvidence),
    adapterImplementationGatePassed: evidencePassed(adapterImplementationEvidence),
    queryReadinessGuardPassed: evidencePassed(queryReadinessEvidence),
    clientSmokeBoundaryPassed: evidencePassed(clientSmokeEvidence),
    factoryActivationScriptExists: existsSync(path.join(repoRoot, FACTORY_ACTIVATION_SCRIPT)),
    validateScriptRunsFactoryActivation: validateScript.includes('npm run contract:database-factory-activation'),
    factoryActivationModuleExists: existsSync(path.join(repoRoot, FACTORY_ACTIVATION_MODULE)),
    factoryActivationGuardModuleExists: existsSync(path.join(repoRoot, FACTORY_ACTIVATION_GUARD_MODULE)),
    factoryActivationDocExists: existsSync(path.join(repoRoot, FACTORY_ACTIVATION_DOC)),
    phase810StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_10_STATUS_DOC)),
    explicitNonRouteFactoryCreatesDatabaseAdapter:
      activation.status === 'database-adapter-created-non-route-factory-context' && activation.databaseAdapterCreated,
    databaseModeAloneDoesNotCreateAdapter: defaultDatabaseModeDecision.databaseAdapterCreated === false,
    routeHandlerContextCannotCreateDatabaseAdapter: routeHandlerContextDecision.databaseAdapterCreated === false,
    missingDatabaseEnvFailsClosed: missingEnvDecision.databaseAdapterCreated === false,
    factoryRouteBindingRemainsDisabled: activation.routeBindingAllowed === false && routeBindingSignals.length === 0,
    routeHandlersRemainMemoryDryRun: PUBLIC_RESULT_ROUTE_HANDLERS_MODE === 'next-route-files-dry-run-in-memory-only',
    noProductionMutationSmoke: activation.productionMutationSmokeAllowed === false && productionMutationSmokeSignals.length === 0,
    noNetworkQueryExecution: activation.networkQueryExecuted === false && networkExecutionSignals.length === 0,
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    noAuthPaymentAiAnalyticsTelemetryImplementation: blockedIntegrationSignals.length === 0,
    overallPassed: false
  };
  const finalGates = {
    ...gates,
    overallPassed:
      Object.entries(gates)
        .filter(([key]) => key !== 'overallPassed')
        .every(([, value]) => value === true) && missingContractPhrases.length === 0
  };

  const issues = buildIssues(finalGates, {
    missingContractPhrases,
    routeBindingSignals,
    productionMutationSmokeSignals,
    networkExecutionSignals,
    blockedIntegrationSignals,
    persistentPublicLookupRouteFiles,
    activationIssues: activation.issues,
    defaultDatabaseModeIssues: defaultDatabaseModeDecision.issues,
    routeHandlerContextIssues: routeHandlerContextDecision.issues,
    missingEnvIssues: missingEnvDecision.issues
  });

  return {
    schemaVersion: DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_SCHEMA_VERSION,
    contractId: DATABASE_ADAPTER_FACTORY_ACTIVATION_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-10-database-adapter-factory-activation-contract',
      factoryActivationSchemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: finalGates,
    scripts,
    activation: {
      phase: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE,
      status: activation.status,
      defaultDatabaseModeStatus: defaultDatabaseModeDecision.status,
      routeHandlerContextStatus: routeHandlerContextDecision.status,
      missingEnvStatus: missingEnvDecision.status,
      databaseAdapterCreated: activation.databaseAdapterCreated,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      createStatus: activation.createStatus,
      readStatus: activation.readStatus,
      deleteStatus: activation.deleteStatus,
      pruneDeletedCount: activation.pruneDeletedCount,
      observedQueryIntents: activation.observedQueryIntents,
      uniqueObservedQueryIntents: activation.uniqueObservedQueryIntents,
      factoryActivationRules: summarizePublicResultDatabaseAdapterFactoryActivationRules()
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      routeBindingSignals,
      productionMutationSmokeSignals,
      networkExecutionSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      activationDryRunIssueCount: activationDryRunEvidence.issues.length,
      adapterImplementationIssueCount: adapterImplementationEvidence.issues.length,
      queryReadinessIssueCount: queryReadinessEvidence.issues.length,
      clientSmokeIssueCount: clientSmokeEvidence.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      observedQueryIntentCount: activation.observedQueryIntents.length,
      uniqueObservedQueryIntentCount: activation.uniqueObservedQueryIntents.length,
      routeBindingSignalCount: routeBindingSignals.length,
      productionMutationSmokeSignalCount: productionMutationSmokeSignals.length,
      networkExecutionSignalCount: networkExecutionSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues
  };
}

export function writeDatabaseAdapterFactoryActivationContractEvidence(
  report: DatabaseAdapterFactoryActivationContractReport,
  outputPath: string
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function simulateFactoryActivation(): Promise<{
  readonly status: string;
  readonly databaseAdapterCreated: boolean;
  readonly routeBindingAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly createStatus: string;
  readonly readStatus: string;
  readonly deleteStatus: string;
  readonly pruneDeletedCount: number;
  readonly observedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly uniqueObservedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly issues: readonly string[];
}> {
  const createdAt = '2026-06-06T12:00:00.000Z';
  const publicId = 'pub_Phase810FactoryActivation7Kf9sQ2mN8xR4vB';
  const deleteToken = 'delete_Phase810FactoryActivation7Kf9sQ2mN8xR4vB_123456789';
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
  const dto = buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), {
    resultId: publicId,
    createdAt,
    expiresAt,
    deleteTokenHash
  });
  const activeRow = buildDatabaseStorageAdapterImplementationSampleRow({ publicId, dto, createdAt, expiresAt, deleteTokenHash }, createdAt);
  const deletedRow: PublicResultDatabaseStorageAdapterRow = {
    ...activeRow,
    deleted_at: createdAt,
    status: 'deleted'
  };
  const observedQueryIntents: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor): Promise<PublicResultDatabaseQueryExecutionResult> => {
    observedQueryIntents.push(descriptor.intentName);
    switch (descriptor.intentName) {
      case 'insert-public-result-record':
      case 'read-active-public-result-by-public-id':
      case 'verify-delete-token-hash-for-public-id':
      case 'mark-expired-public-results':
        return { rows: [activeRow], rowCount: 1 };
      case 'soft-delete-public-result-by-public-id':
      case 'prune-deleted-or-expired-public-results':
        return { rows: [deletedRow], rowCount: 1 };
      default:
        return { rows: [], rowCount: 0 };
    }
  };

  const env = buildCompleteDatabaseAdapterFactoryActivationEnvironment();
  const decision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
    env,
    context: 'explicit-non-route-database-activation',
    acknowledgeNoRouteBinding: true,
    executeQuery
  });
  const adapter = createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({
    env,
    context: 'explicit-non-route-database-activation',
    acknowledgeNoRouteBinding: true,
    executeQuery,
    nowIso: () => createdAt
  });
  const created = await adapter.create({ publicId, dto, createdAt, expiresAt, deleteTokenHash });
  const read = await adapter.read(publicId);
  const deleted = await adapter.delete({ publicId, deleteToken });
  const pruned = await adapter.pruneExpired(createdAt);
  const uniqueObservedQueryIntents = Array.from(new Set(observedQueryIntents));

  return {
    status: decision.status,
    databaseAdapterCreated: decision.databaseAdapterCreated,
    routeBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    createStatus: created.status,
    readStatus: read.status,
    deleteStatus: deleted.status,
    pruneDeletedCount: pruned.deletedCount,
    observedQueryIntents,
    uniqueObservedQueryIntents,
    issues: [
      ...decision.issues,
      ...(created.status === 'active' ? [] : [`unexpected_create_status:${created.status}`]),
      ...(read.status === 'active' ? [] : [`unexpected_read_status:${read.status}`]),
      ...(deleted.status === 'deleted' ? [] : [`unexpected_delete_status:${deleted.status}`]),
      ...(pruned.deletedCount === 1 ? [] : [`unexpected_prune_deleted_count:${pruned.deletedCount}`])
    ]
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseAdapterFactoryActivationContractReport['scripts'] {
  const scripts: Record<string, string> = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['dryrun:database-adapter-activation'] !== undefined) {
    scripts.activationDryRun = packageJson.scripts['dryrun:database-adapter-activation'];
  }
  if (packageJson.scripts?.['guard:database-adapter-implementation'] !== undefined) {
    scripts.adapterImplementation = packageJson.scripts['guard:database-adapter-implementation'];
  }
  if (packageJson.scripts?.['guard:database-query-readiness'] !== undefined) {
    scripts.databaseQueryReadiness = packageJson.scripts['guard:database-query-readiness'];
  }
  if (packageJson.scripts?.['smoke:database-client'] !== undefined) {
    scripts.databaseClientSmoke = packageJson.scripts['smoke:database-client'];
  }
  if (packageJson.scripts?.['contract:database-factory-activation'] !== undefined) {
    scripts.factoryActivation = packageJson.scripts['contract:database-factory-activation'];
  }
  return scripts;
}

function buildIssues(
  gates: DatabaseAdapterFactoryActivationContractReport['gates'],
  details: {
    readonly missingContractPhrases: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly activationIssues: readonly string[];
    readonly defaultDatabaseModeIssues: readonly string[];
    readonly routeHandlerContextIssues: readonly string[];
    readonly missingEnvIssues: readonly string[];
  }
): readonly string[] {
  return [
    ...Object.entries(gates)
      .filter(([key, value]) => key !== 'overallPassed' && value !== true)
      .map(([key]) => `database_adapter_factory_activation_contract_failed:${key}`),
    ...details.missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`),
    ...details.routeBindingSignals.map((signal) => `route_binding_signal:${signal}`),
    ...details.productionMutationSmokeSignals.map((signal) => `production_mutation_smoke_signal:${signal}`),
    ...details.networkExecutionSignals.map((signal) => `network_execution_signal:${signal}`),
    ...details.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...details.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route:${file}`),
    ...details.activationIssues.map((issue) => `activation_issue:${issue}`),
    ...(details.defaultDatabaseModeIssues.includes('explicit_non_route_context_required:unspecified') ? [] : ['database_mode_alone_not_blocked']),
    ...(details.routeHandlerContextIssues.includes('route_handler_context_database_factory_activation_blocked')
      ? []
      : ['route_handler_context_not_blocked']),
    ...(details.missingEnvIssues.some((issue) => issue.startsWith('base_factory_not_database_contract_only:factory-blocked'))
      ? []
      : ['missing_env_not_blocked_by_base_factory'])
  ];
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
}

function readEvidence(repoRoot: string, relativePath: string, label: string): { readonly overallPassed: boolean; readonly issues: readonly string[] } {
  const filePath = path.join(repoRoot, relativePath);
  if (!existsSync(filePath)) return { overallPassed: false, issues: [`missing_evidence:${label}`] };
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    readonly gates?: { readonly overallPassed?: boolean };
    readonly issues?: readonly string[];
  };
  return { overallPassed: parsed.gates?.overallPassed === true, issues: parsed.issues ?? [] };
}

function evidencePassed(evidence: { readonly overallPassed: boolean; readonly issues: readonly string[] }): boolean {
  return evidence.overallPassed && evidence.issues.length === 0;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const filePath = path.join(repoRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): readonly string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}
