import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
  runPublicResultRouteDatabaseBindingDryRun,
  summarizePublicResultRouteDatabaseBindingDryRunRules
} from '../public-link/publicResultRouteDatabaseBindingDryRun';
import { buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment } from '../public-link/publicResultRouteDatabaseBindingPreflight';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import type { PublicResultStorageRuntimeEnvironment } from '../public-link/publicResultStorageRuntimeSelection';

export const PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_SCHEMA_VERSION =
  'phase-8.12-public-route-database-binding-dry-run-contract-v1' as const;
export const PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_ID =
  'phase-8-public-route-database-binding-dry-run-contract' as const;

export interface PublicRouteDatabaseBindingDryRunContractOptions {
  readonly repoRoot?: string;
}

export interface PublicRouteDatabaseBindingDryRunContractReport {
  readonly schemaVersion: typeof PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-12-public-route-database-binding-dry-run-contract';
    readonly dryRunSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly preflightContractPassed: boolean;
    readonly factoryActivationContractPassed: boolean;
    readonly adapterActivationDryRunGatePassed: boolean;
    readonly adapterImplementationGatePassed: boolean;
    readonly queryReadinessGuardPassed: boolean;
    readonly clientSmokeBoundaryPassed: boolean;
    readonly dryRunScriptExists: boolean;
    readonly validateScriptRunsDryRun: boolean;
    readonly dryRunModuleExists: boolean;
    readonly dryRunGuardModuleExists: boolean;
    readonly dryRunDocExists: boolean;
    readonly phase812StatusDocExists: boolean;
    readonly dryRunFlagRequired: boolean;
    readonly routeBindingDryRunPassed: boolean;
    readonly fakeRouteBoundDatabaseAdapterCreated: boolean;
    readonly routeHandlerCreateReadDeletePruneSimulationPassed: boolean;
    readonly databaseModeAloneStillBlocked: boolean;
    readonly routeHandlerContextStillBlocked: boolean;
    readonly actualRouteHandlersRemainMemoryDryRun: boolean;
    readonly productionRouteBindingStillBlocked: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly routeBindingPreflight?: string;
    readonly routeBindingDryRun?: string;
    readonly factoryActivation?: string;
    readonly activationDryRun?: string;
    readonly adapterImplementation?: string;
    readonly queryReadiness?: string;
    readonly databaseClientSmoke?: string;
  };
  readonly dryRun: {
    readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE;
    readonly status: string;
    readonly databaseModeAloneStatus: string;
    readonly missingDryRunFlagStatus: string;
    readonly routeHandlerContextStatus: string;
    readonly createStatusCode: number | null;
    readonly readStatusCode: number | null;
    readonly deleteStatusCode: number | null;
    readonly readAfterDeleteStatusCode: number | null;
    readonly pruneDeletedCount: number | null;
    readonly queryIntentExecutionCount: number;
    readonly uniqueExecutedQueryIntents: readonly string[];
    readonly routeBindingAllowed: false;
    readonly productionMutationSmokeAllowed: false;
    readonly networkQueryExecuted: false;
    readonly persistentPublicLookupAllowed: false;
    readonly dryRunFlagEnv: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV;
    readonly dryRunFlagRequiredValue: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED;
    readonly dryRunRules: readonly string[];
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
    readonly preflightIssueCount: number;
    readonly factoryActivationIssueCount: number;
    readonly activationDryRunIssueCount: number;
    readonly adapterImplementationIssueCount: number;
    readonly queryReadinessIssueCount: number;
    readonly clientSmokeIssueCount: number;
    readonly checkedFileCount: number;
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

const DRY_RUN_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingDryRun.ts';
const DRY_RUN_GUARD_MODULE = 'src/core/release/publicRouteDatabaseBindingDryRunContract.ts';
const DRY_RUN_SCRIPT = 'scripts/public-route-database-binding-dry-run-contract.ts';
const DRY_RUN_DOC = 'docs/release/phase-8-public-route-database-binding-dry-run-contract.md';
const PHASE_8_12_STATUS_DOC = 'docs/ui/phase-8-12-public-route-database-binding-dry-run-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const PREFLIGHT_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingPreflight.ts';
const FACTORY_ACTIVATION_MODULE = 'src/core/public-link/publicResultStorageAdapterFactoryActivation.ts';

const CHECKED_FILES = [
  DRY_RUN_MODULE,
  DRY_RUN_GUARD_MODULE,
  DRY_RUN_SCRIPT,
  DRY_RUN_DOC,
  PHASE_8_12_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  ROUTE_HANDLERS_MODULE,
  PREFLIGHT_MODULE,
  FACTORY_ACTIVATION_MODULE
] as const;

const ROUTE_BINDING_SIGNALS = [
  'PUBLIC_RESULT_ROUTE_HANDLERS_MODE = \'database\'',
  'createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({ env: process.env',
  'routeHandlerBindingAllowed: true',
  'routeBindingAllowed: true'
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
  'Route database binding dry-run contract exists',
  'Fake route-bound database adapter can execute create/read/delete/prune simulation',
  'Actual public route handlers still use memory/dry-run behavior',
  'No production mutation smoke',
  'No network SQL execution',
  'No persistent /r/[publicId] lookup yet',
  'Phase 8.12'
] as const;

export async function runPublicRouteDatabaseBindingDryRunContract(
  options: PublicRouteDatabaseBindingDryRunContractOptions = {}
): Promise<PublicRouteDatabaseBindingDryRunContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';

  const preflightEvidence = readEvidence(
    repoRoot,
    'docs/evidence/public-route-database-binding-preflight-contract-latest.json',
    'public_route_database_binding_preflight_contract'
  );
  const factoryActivationEvidence = readEvidence(
    repoRoot,
    'docs/evidence/database-adapter-factory-activation-contract-latest.json',
    'database_adapter_factory_activation_contract'
  );
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

  const completeEnv = buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment();
  const dryRun = await runPublicResultRouteDatabaseBindingDryRun({
    env: completeEnv,
    context: 'route-binding-dry-run-contract',
    acknowledgeFakeExecutorOnly: true
  });
  const databaseModeAlone = await runPublicResultRouteDatabaseBindingDryRun({
    env: buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment()
  });
  const missingDryRunFlag = await runPublicResultRouteDatabaseBindingDryRun({
    env: buildEnvWithoutDryRunFlag(completeEnv),
    context: 'route-binding-dry-run-contract',
    acknowledgeFakeExecutorOnly: true
  });
  const routeHandlerContext = await runPublicResultRouteDatabaseBindingDryRun({
    env: completeEnv,
    context: 'public-api-route-handler',
    acknowledgeFakeExecutorOnly: true
  });

  const routeSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const checkedSource = [
    routeSource,
    readOptionalFile(repoRoot, PREFLIGHT_MODULE),
    readOptionalFile(repoRoot, FACTORY_ACTIVATION_MODULE)
  ].join('\n');
  const routeBindingSignals = findSignals(checkedSource, ROUTE_BINDING_SIGNALS);
  const productionMutationSmokeSignals = findSignals(checkedSource, PRODUCTION_MUTATION_SMOKE_SIGNALS);
  const networkExecutionSignals = findSignals(checkedSource, NETWORK_EXECUTION_SIGNALS);
  const blockedIntegrationSignals = findSignals(checkedSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const missingContractPhrases = findMissingContractPhrases(repoRoot, REQUIRED_CONTRACT_PHRASES);

  const gates = {
    preflightContractPassed: evidencePassed(preflightEvidence),
    factoryActivationContractPassed: evidencePassed(factoryActivationEvidence),
    adapterActivationDryRunGatePassed: evidencePassed(activationDryRunEvidence),
    adapterImplementationGatePassed: evidencePassed(adapterImplementationEvidence),
    queryReadinessGuardPassed: evidencePassed(queryReadinessEvidence),
    clientSmokeBoundaryPassed: evidencePassed(clientSmokeEvidence),
    dryRunScriptExists: existsSync(path.join(repoRoot, DRY_RUN_SCRIPT)),
    validateScriptRunsDryRun: validateScript.includes('npm run dryrun:route-database-binding'),
    dryRunModuleExists: existsSync(path.join(repoRoot, DRY_RUN_MODULE)),
    dryRunGuardModuleExists: existsSync(path.join(repoRoot, DRY_RUN_GUARD_MODULE)),
    dryRunDocExists: existsSync(path.join(repoRoot, DRY_RUN_DOC)),
    phase812StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_12_STATUS_DOC)),
    dryRunFlagRequired: dryRun.dryRunFlagPresent && missingDryRunFlag.status === 'route-database-binding-dry-run-blocked',
    routeBindingDryRunPassed: dryRun.status === 'route-database-binding-dry-run-passed' && dryRun.issues.length === 0,
    fakeRouteBoundDatabaseAdapterCreated: dryRun.fakeRouteBoundDatabaseAdapterCreated,
    routeHandlerCreateReadDeletePruneSimulationPassed: dryRun.routeHandlerCreateReadDeletePruneSimulationPassed,
    databaseModeAloneStillBlocked: databaseModeAlone.status === 'route-database-binding-dry-run-blocked',
    routeHandlerContextStillBlocked: routeHandlerContext.status === 'route-database-binding-dry-run-blocked',
    actualRouteHandlersRemainMemoryDryRun: PUBLIC_RESULT_ROUTE_HANDLERS_MODE === 'next-route-files-dry-run-in-memory-only' && routeSource.includes('createInMemoryPublicResultStorageAdapter'),
    productionRouteBindingStillBlocked: dryRun.routeBindingAllowed === false && routeBindingSignals.length === 0,
    noProductionMutationSmoke: dryRun.productionMutationSmokeAllowed === false && productionMutationSmokeSignals.length === 0,
    noNetworkQueryExecution: dryRun.networkQueryExecuted === false && networkExecutionSignals.length === 0,
    noPersistentPublicLookupRoute: dryRun.persistentPublicLookupAllowed === false && persistentPublicLookupRouteFiles.length === 0,
    noAuthPaymentAiAnalyticsTelemetryImplementation: blockedIntegrationSignals.length === 0,
    overallPassed: false
  };

  const issues = buildIssues(gates, {
    missingContractPhrases,
    routeBindingSignals,
    productionMutationSmokeSignals,
    networkExecutionSignals,
    blockedIntegrationSignals,
    persistentPublicLookupRouteFiles,
    dryRunIssues: dryRun.issues,
    databaseModeAloneIssues: databaseModeAlone.issues,
    missingDryRunFlagIssues: missingDryRunFlag.issues,
    routeHandlerContextIssues: routeHandlerContext.issues
  });
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_ROUTE_DATABASE_BINDING_DRY_RUN_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-12-public-route-database-binding-dry-run-contract',
      dryRunSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: finalGates,
    scripts: buildScriptSummary(packageJson),
    dryRun: {
      phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
      status: dryRun.status,
      databaseModeAloneStatus: databaseModeAlone.status,
      missingDryRunFlagStatus: missingDryRunFlag.status,
      routeHandlerContextStatus: routeHandlerContext.status,
      createStatusCode: dryRun.createStatusCode,
      readStatusCode: dryRun.readStatusCode,
      deleteStatusCode: dryRun.deleteStatusCode,
      readAfterDeleteStatusCode: dryRun.readAfterDeleteStatusCode,
      pruneDeletedCount: dryRun.pruneDeletedCount,
      queryIntentExecutionCount: dryRun.queryIntentExecutionCount,
      uniqueExecutedQueryIntents: dryRun.uniqueExecutedQueryIntents,
      routeBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      persistentPublicLookupAllowed: false,
      dryRunFlagEnv: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV,
      dryRunFlagRequiredValue: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED,
      dryRunRules: summarizePublicResultRouteDatabaseBindingDryRunRules()
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
      preflightIssueCount: preflightEvidence.issues.length,
      factoryActivationIssueCount: factoryActivationEvidence.issues.length,
      activationDryRunIssueCount: activationDryRunEvidence.issues.length,
      adapterImplementationIssueCount: adapterImplementationEvidence.issues.length,
      queryReadinessIssueCount: queryReadinessEvidence.issues.length,
      clientSmokeIssueCount: clientSmokeEvidence.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      routeBindingSignalCount: routeBindingSignals.length,
      productionMutationSmokeSignalCount: productionMutationSmokeSignals.length,
      networkExecutionSignalCount: networkExecutionSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues
  };
}

export function writePublicRouteDatabaseBindingDryRunContractEvidence(
  report: PublicRouteDatabaseBindingDryRunContractReport,
  outputPath: string
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildEnvWithoutDryRunFlag(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  const { [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV]: _removed, ...rest } = env;
  return rest;
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicRouteDatabaseBindingDryRunContractReport['scripts'] {
  const scripts: Record<string, string> = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:route-database-binding-preflight'] !== undefined) {
    scripts.routeBindingPreflight = packageJson.scripts['contract:route-database-binding-preflight'];
  }
  if (packageJson.scripts?.['dryrun:route-database-binding'] !== undefined) {
    scripts.routeBindingDryRun = packageJson.scripts['dryrun:route-database-binding'];
  }
  if (packageJson.scripts?.['contract:database-factory-activation'] !== undefined) {
    scripts.factoryActivation = packageJson.scripts['contract:database-factory-activation'];
  }
  if (packageJson.scripts?.['dryrun:database-adapter-activation'] !== undefined) {
    scripts.activationDryRun = packageJson.scripts['dryrun:database-adapter-activation'];
  }
  if (packageJson.scripts?.['guard:database-adapter-implementation'] !== undefined) {
    scripts.adapterImplementation = packageJson.scripts['guard:database-adapter-implementation'];
  }
  if (packageJson.scripts?.['guard:database-query-readiness'] !== undefined) {
    scripts.queryReadiness = packageJson.scripts['guard:database-query-readiness'];
  }
  if (packageJson.scripts?.['smoke:database-client'] !== undefined) {
    scripts.databaseClientSmoke = packageJson.scripts['smoke:database-client'];
  }
  return scripts;
}

function buildIssues(
  gates: PublicRouteDatabaseBindingDryRunContractReport['gates'],
  details: {
    readonly missingContractPhrases: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly dryRunIssues: readonly string[];
    readonly databaseModeAloneIssues: readonly string[];
    readonly missingDryRunFlagIssues: readonly string[];
    readonly routeHandlerContextIssues: readonly string[];
  }
): readonly string[] {
  return [
    ...Object.entries(gates)
      .filter(([key, value]) => key !== 'overallPassed' && value !== true)
      .map(([key]) => `public_route_database_binding_dry_run_contract_failed:${key}`),
    ...details.missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`),
    ...details.routeBindingSignals.map((signal) => `route_binding_signal:${signal}`),
    ...details.productionMutationSmokeSignals.map((signal) => `production_mutation_smoke_signal:${signal}`),
    ...details.networkExecutionSignals.map((signal) => `network_execution_signal:${signal}`),
    ...details.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...details.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route:${file}`),
    ...details.dryRunIssues.map((issue) => `dry_run_issue:${issue}`),
    ...(details.databaseModeAloneIssues.includes('fake_executor_only_acknowledgement_required')
      ? []
      : ['database_mode_alone_not_blocked_for_route_binding_dry_run']),
    ...(details.missingDryRunFlagIssues.some((issue) => issue.startsWith('route_database_binding_dry_run_flag_required:'))
      ? []
      : ['missing_route_binding_dry_run_flag_not_blocked']),
    ...(details.routeHandlerContextIssues.includes('public_api_route_handler_context_database_binding_dry_run_blocked')
      ? []
      : ['route_handler_context_not_blocked_for_route_binding_dry_run'])
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

function findMissingContractPhrases(repoRoot: string, phrases: readonly string[]): readonly string[] {
  const sources = [
    readOptionalFile(repoRoot, DRY_RUN_DOC),
    readOptionalFile(repoRoot, PHASE_8_12_STATUS_DOC),
    readOptionalFile(repoRoot, PHASE_8_TRANSITION_DOC)
  ].join('\n');
  return phrases.filter((phrase) => !sources.includes(phrase));
}
