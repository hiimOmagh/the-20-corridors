import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE,
  PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION,
  runPublicResultDatabaseAdapterActivationDryRun
} from '../public-link/publicResultDatabaseAdapterActivationDryRun';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_SCHEMA_VERSION =
  'phase-8.9-database-adapter-activation-dry-run-gate-v1' as const;
export const DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_ID =
  'phase-8-database-adapter-activation-dry-run-gate' as const;

export interface DatabaseAdapterActivationDryRunGateOptions {
  readonly repoRoot?: string;
}

export interface DatabaseAdapterActivationDryRunGateReport {
  readonly schemaVersion: typeof DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-9-database-adapter-activation-dry-run-gate';
    readonly activationDryRunSchemaVersion: typeof PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly adapterImplementationGatePassed: boolean;
    readonly queryReadinessGuardPassed: boolean;
    readonly clientSmokeBoundaryPassed: boolean;
    readonly activationDryRunScriptExists: boolean;
    readonly validateScriptRunsActivationDryRun: boolean;
    readonly activationDryRunModuleExists: boolean;
    readonly activationDryRunGuardModuleExists: boolean;
    readonly activationDryRunDocExists: boolean;
    readonly phase89StatusDocExists: boolean;
    readonly databaseAdapterSelectedInControlledSimulation: boolean;
    readonly factoryRouteBindingRemainsDisabled: boolean;
    readonly factoryDatabaseAdapterStillNotCreated: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly adapterImplementation?: string;
    readonly databaseQueryReadiness?: string;
    readonly databaseClientSmoke?: string;
    readonly activationDryRun?: string;
  };
  readonly activation: {
    readonly phase: typeof PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE;
    readonly status: string;
    readonly requestedFactoryStatus: string;
    readonly requestedFactoryAdapterKind: string;
    readonly dryRunAdapterCreated: boolean;
    readonly dryRunExecutorUsed: boolean;
    readonly factoryDatabaseAdapterCreated: false;
    readonly factoryRouteBindingAllowed: false;
    readonly routeBindingAllowed: false;
    readonly productionMutationSmokeAllowed: false;
    readonly networkQueryExecuted: false;
    readonly sqlMutationExecuted: false;
    readonly createStatus: string;
    readonly readStatus: string;
    readonly deleteStatus: string;
    readonly pruneDeletedCount: number;
    readonly observedQueryIntents: readonly string[];
    readonly uniqueObservedQueryIntents: readonly string[];
    readonly missingQueryIntents: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly factoryBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly adapterImplementationIssueCount: number;
    readonly queryReadinessIssueCount: number;
    readonly clientSmokeIssueCount: number;
    readonly checkedFileCount: number;
    readonly observedQueryIntentCount: number;
    readonly uniqueObservedQueryIntentCount: number;
    readonly missingQueryIntentCount: number;
    readonly routeBindingSignalCount: number;
    readonly factoryBindingSignalCount: number;
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

const ACTIVATION_MODULE = 'src/core/public-link/publicResultDatabaseAdapterActivationDryRun.ts';
const ACTIVATION_GUARD_MODULE = 'src/core/release/databaseAdapterActivationDryRunGate.ts';
const ACTIVATION_SCRIPT = 'scripts/database-adapter-activation-dry-run-gate.ts';
const ACTIVATION_DOC = 'docs/release/phase-8-database-adapter-activation-dry-run-gate.md';
const PHASE_8_9_STATUS_DOC = 'docs/ui/phase-8-9-database-adapter-activation-dry-run-gate-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';

const CHECKED_FILES = [
  ACTIVATION_MODULE,
  ACTIVATION_GUARD_MODULE,
  ACTIVATION_SCRIPT,
  ACTIVATION_DOC,
  PHASE_8_9_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  ROUTE_HANDLERS_MODULE,
  FACTORY_MODULE
] as const;

const ROUTE_BINDING_SIGNALS = [
  'createPublicResultDatabaseStorageAdapterImplementation({ executeQuery:',
  'PUBLIC_RESULT_STORAGE_DATABASE_MODE'
] as const;
const FACTORY_BINDING_SIGNALS = ['createPublicResultDatabaseStorageAdapterImplementation', 'publicResultDatabaseStorageAdapter'] as const;
const PRODUCTION_MUTATION_SMOKE_SIGNALS = ['productionMutationSmokeAllowed: true', 'sqlMutationExecuted: true'] as const;
const NETWORK_EXECUTION_SIGNALS = ['networkQueryExecuted: true', '.query(', 'sql`'] as const;
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
  'Activation dry-run gate exists',
  'Database adapter can be selected in a controlled simulation',
  'Factory route binding remains disabled',
  'Route handlers still use memory/dry-run behavior',
  'No real production mutation smoke',
  'Phase 8.9'
] as const;

export async function runDatabaseAdapterActivationDryRunGate(
  options: DatabaseAdapterActivationDryRunGateOptions = {}
): Promise<DatabaseAdapterActivationDryRunGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
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
  const activation = await runPublicResultDatabaseAdapterActivationDryRun();
  const routeSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const factorySource = readOptionalFile(repoRoot, FACTORY_MODULE);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const runtimeBindingSource = `${routeSource}\n${factorySource}`;
  const docSource = readOptionalFile(repoRoot, ACTIVATION_DOC);

  const routeBindingSignals = findSignals(routeSource, ROUTE_BINDING_SIGNALS);
  const factoryBindingSignals = findSignals(factorySource, FACTORY_BINDING_SIGNALS);
  const productionMutationSmokeSignals = findSignals(runtimeBindingSource, PRODUCTION_MUTATION_SMOKE_SIGNALS);
  const networkExecutionSignals = findSignals(runtimeBindingSource, NETWORK_EXECUTION_SIGNALS);
  const blockedIntegrationSignals = findSignals(runtimeBindingSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = findExistingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingContractPhrases = REQUIRED_CONTRACT_PHRASES.filter((phrase) => !docSource.includes(phrase));

  const scripts = {
    validate: validateScript,
    ...(packageJson.scripts?.['guard:database-adapter-implementation'] === undefined
      ? {}
      : { adapterImplementation: packageJson.scripts['guard:database-adapter-implementation'] }),
    ...(packageJson.scripts?.['guard:database-query-readiness'] === undefined
      ? {}
      : { databaseQueryReadiness: packageJson.scripts['guard:database-query-readiness'] }),
    ...(packageJson.scripts?.['smoke:database-client'] === undefined
      ? {}
      : { databaseClientSmoke: packageJson.scripts['smoke:database-client'] }),
    ...(packageJson.scripts?.['dryrun:database-adapter-activation'] === undefined
      ? {}
      : { activationDryRun: packageJson.scripts['dryrun:database-adapter-activation'] })
  };

  const gates = {
    adapterImplementationGatePassed: evidencePassed(adapterImplementationEvidence),
    queryReadinessGuardPassed: evidencePassed(queryReadinessEvidence),
    clientSmokeBoundaryPassed: evidencePassed(clientSmokeEvidence),
    activationDryRunScriptExists: existsSync(path.join(repoRoot, ACTIVATION_SCRIPT)),
    validateScriptRunsActivationDryRun: validateScript.includes('npm run dryrun:database-adapter-activation'),
    activationDryRunModuleExists: existsSync(path.join(repoRoot, ACTIVATION_MODULE)),
    activationDryRunGuardModuleExists: existsSync(path.join(repoRoot, ACTIVATION_GUARD_MODULE)),
    activationDryRunDocExists: existsSync(path.join(repoRoot, ACTIVATION_DOC)),
    phase89StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_9_STATUS_DOC)),
    databaseAdapterSelectedInControlledSimulation:
      activation.status === 'database-adapter-selected-dry-run' && activation.dryRunAdapterCreated,
    factoryRouteBindingRemainsDisabled: !activation.factoryRouteBindingAllowed && routeBindingSignals.length === 0,
    factoryDatabaseAdapterStillNotCreated: !activation.factoryDatabaseAdapterCreated && factoryBindingSignals.length === 0,
    routesRemainMemoryDryRun: PUBLIC_RESULT_ROUTE_HANDLERS_MODE === 'next-route-files-dry-run-in-memory-only',
    noProductionMutationSmoke:
      !activation.productionMutationSmokeAllowed && !activation.sqlMutationExecuted && productionMutationSmokeSignals.length === 0,
    noNetworkQueryExecution: !activation.networkQueryExecuted && networkExecutionSignals.length === 0,
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    noAuthPaymentAiAnalyticsTelemetryImplementation: blockedIntegrationSignals.length === 0,
    overallPassed: false
  };

  const preliminaryGates = { ...gates };
  const gateIssues = Object.entries(preliminaryGates)
    .filter(([key, value]) => key !== 'overallPassed' && value !== true)
    .map(([key]) => `database_adapter_activation_dry_run_gate_failed:${key}`);
  const issues = [...gateIssues, ...activation.issues, ...missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`)];
  const overallPassed = issues.length === 0;

  return {
    schemaVersion: DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_SCHEMA_VERSION,
    contractId: DATABASE_ADAPTER_ACTIVATION_DRY_RUN_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-9-database-adapter-activation-dry-run-gate',
      activationDryRunSchemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: { ...preliminaryGates, overallPassed },
    scripts,
    activation: {
      phase: activation.phase,
      status: activation.status,
      requestedFactoryStatus: activation.requestedFactoryStatus,
      requestedFactoryAdapterKind: activation.requestedFactoryAdapterKind,
      dryRunAdapterCreated: activation.dryRunAdapterCreated,
      dryRunExecutorUsed: activation.dryRunExecutorUsed,
      factoryDatabaseAdapterCreated: activation.factoryDatabaseAdapterCreated,
      factoryRouteBindingAllowed: activation.factoryRouteBindingAllowed,
      routeBindingAllowed: activation.routeBindingAllowed,
      productionMutationSmokeAllowed: activation.productionMutationSmokeAllowed,
      networkQueryExecuted: activation.networkQueryExecuted,
      sqlMutationExecuted: activation.sqlMutationExecuted,
      createStatus: activation.createStatus,
      readStatus: activation.readStatus,
      deleteStatus: activation.deleteStatus,
      pruneDeletedCount: activation.pruneDeletedCount,
      observedQueryIntents: activation.observedQueryIntents,
      uniqueObservedQueryIntents: activation.uniqueObservedQueryIntents,
      missingQueryIntents: activation.missingQueryIntents
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      routeBindingSignals,
      factoryBindingSignals,
      productionMutationSmokeSignals,
      networkExecutionSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingContractPhrases
    },
    coverage: {
      adapterImplementationIssueCount: evidenceIssues(adapterImplementationEvidence).length,
      queryReadinessIssueCount: evidenceIssues(queryReadinessEvidence).length,
      clientSmokeIssueCount: evidenceIssues(clientSmokeEvidence).length,
      checkedFileCount: CHECKED_FILES.length,
      observedQueryIntentCount: activation.observedQueryIntents.length,
      uniqueObservedQueryIntentCount: activation.uniqueObservedQueryIntents.length,
      missingQueryIntentCount: activation.missingQueryIntents.length,
      routeBindingSignalCount: routeBindingSignals.length,
      factoryBindingSignalCount: factoryBindingSignals.length,
      productionMutationSmokeSignalCount: productionMutationSmokeSignals.length,
      networkExecutionSignalCount: networkExecutionSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues
  };
}

export function writeDatabaseAdapterActivationDryRunGateEvidence(
  report: DatabaseAdapterActivationDryRunGateReport,
  outputPath = path.join(process.cwd(), 'docs/evidence/database-adapter-activation-dry-run-gate-latest.json')
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
  } catch {
    return {};
  }
}

function readEvidence(repoRoot: string, relativePath: string, fallbackContractId: string): unknown {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8')) as unknown;
  } catch {
    return { contractId: fallbackContractId, gates: { overallPassed: false }, issues: [`missing_evidence:${relativePath}`] };
  }
}

function evidencePassed(value: unknown): boolean {
  const record = value as { readonly gates?: { readonly overallPassed?: boolean }; readonly issues?: readonly unknown[] };
  return record.gates?.overallPassed === true && evidenceIssues(value).length === 0;
}

function evidenceIssues(value: unknown): readonly string[] {
  const record = value as { readonly issues?: readonly unknown[] };
  return Array.isArray(record.issues) ? record.issues.map(String) : [];
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  try {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function findExistingPaths(repoRoot: string, pathsToCheck: readonly string[]): readonly string[] {
  const direct = pathsToCheck.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const recursive = collectExistingDynamicRouteDirectories(path.join(repoRoot, 'src/app')).filter((relativePath) =>
    pathsToCheck.includes(relativePath)
  );
  return Array.from(new Set([...direct, ...recursive]));
}

function collectExistingDynamicRouteDirectories(root: string, prefix = 'src/app'): readonly string[] {
  if (!existsSync(root)) return [];
  const entries = readdirSync(root);
  const matches: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry);
    const relativePath = `${prefix}/${entry}`;
    const stat = statSync(fullPath);
    if (!stat.isDirectory()) continue;
    if (/\[[^\]]+\]/.test(entry)) matches.push(relativePath.replaceAll('\\', '/'));
    matches.push(...collectExistingDynamicRouteDirectories(fullPath, relativePath));
  }
  return matches;
}
