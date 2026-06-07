import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED,
  resolvePublicResultRouteDatabaseBindingPreflightDecision,
  summarizePublicResultRouteDatabaseBindingPreflightRules
} from '../public-link/publicResultRouteDatabaseBindingPreflight';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import type { PublicResultStorageRuntimeEnvironment } from '../public-link/publicResultStorageRuntimeSelection';

export const PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_SCHEMA_VERSION =
  'phase-8.11-public-route-database-binding-preflight-contract-v1' as const;
export const PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_ID =
  'phase-8-public-route-database-binding-preflight-contract' as const;

export interface PublicRouteDatabaseBindingPreflightContractOptions {
  readonly repoRoot?: string;
}

export interface PublicRouteDatabaseBindingPreflightContractReport {
  readonly schemaVersion: typeof PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-11-public-route-database-binding-preflight-contract';
    readonly preflightSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly factoryActivationContractPassed: boolean;
    readonly adapterActivationDryRunGatePassed: boolean;
    readonly adapterImplementationGatePassed: boolean;
    readonly queryReadinessGuardPassed: boolean;
    readonly clientSmokeBoundaryPassed: boolean;
    readonly preflightScriptExists: boolean;
    readonly validateScriptRunsPreflight: boolean;
    readonly preflightModuleExists: boolean;
    readonly preflightGuardModuleExists: boolean;
    readonly preflightDocExists: boolean;
    readonly phase811StatusDocExists: boolean;
    readonly routeBindingFlagRequired: boolean;
    readonly completeDatabaseEnvRequired: boolean;
    readonly databaseModeAloneInsufficient: boolean;
    readonly explicitFlagStillDoesNotActivateRoutes: boolean;
    readonly routeHandlerContextCannotBindDatabase: boolean;
    readonly routeBindingRemainsDisabled: boolean;
    readonly routeHandlersRemainMemoryDryRun: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly factoryActivation?: string;
    readonly activationDryRun?: string;
    readonly adapterImplementation?: string;
    readonly queryReadiness?: string;
    readonly databaseClientSmoke?: string;
    readonly routeBindingPreflight?: string;
  };
  readonly preflight: {
    readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE;
    readonly status: string;
    readonly databaseModeAloneStatus: string;
    readonly missingFlagStatus: string;
    readonly routeHandlerContextStatus: string;
    readonly missingEnvStatus: string;
    readonly preflightReady: boolean;
    readonly routeBindingAllowed: false;
    readonly routeHandlerBindingAllowed: false;
    readonly productionMutationSmokeAllowed: false;
    readonly networkQueryAllowed: false;
    readonly persistentPublicLookupAllowed: false;
    readonly routeBindingFlagEnv: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV;
    readonly routeBindingFlagRequiredValue: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED;
    readonly preflightRules: readonly string[];
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

const PREFLIGHT_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingPreflight.ts';
const PREFLIGHT_GUARD_MODULE = 'src/core/release/publicRouteDatabaseBindingPreflightContract.ts';
const PREFLIGHT_SCRIPT = 'scripts/public-route-database-binding-preflight-contract.ts';
const PREFLIGHT_DOC = 'docs/release/phase-8-public-route-database-binding-preflight-contract.md';
const PHASE_8_11_STATUS_DOC = 'docs/ui/phase-8-11-public-route-database-binding-preflight-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const BASE_FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const FACTORY_ACTIVATION_MODULE = 'src/core/public-link/publicResultStorageAdapterFactoryActivation.ts';

const CHECKED_FILES = [
  PREFLIGHT_MODULE,
  PREFLIGHT_GUARD_MODULE,
  PREFLIGHT_SCRIPT,
  PREFLIGHT_DOC,
  PHASE_8_11_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  ROUTE_HANDLERS_MODULE,
  BASE_FACTORY_MODULE,
  FACTORY_ACTIVATION_MODULE
] as const;

const ROUTE_BINDING_SIGNALS = [
  'createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({',
  'createPublicResultDatabaseStorageAdapterImplementation({ executeQuery:',
  'routeHandlerBindingAllowed: true',
  'PUBLIC_RESULT_ROUTE_HANDLERS_MODE = \'database\''
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
  'Route binding preflight contract exists',
  'PUBLIC_RESULT_STORAGE_MODE=database alone is still insufficient',
  'Explicit route-binding flag is required but still does not activate routes',
  'Complete DB env is required',
  'Route handlers still use memory/dry-run behavior',
  'No production mutation smoke yet',
  'No persistent /r/[publicId] lookup yet',
  'Phase 8.11'
] as const;

export async function runPublicRouteDatabaseBindingPreflightContract(
  options: PublicRouteDatabaseBindingPreflightContractOptions = {}
): Promise<PublicRouteDatabaseBindingPreflightContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';

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

  const completeEnv = buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment();
  const preflightReadyDecision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env: completeEnv,
    context: 'preflight-contract',
    acknowledgeNoProductionRouteBinding: true
  });
  const databaseModeAloneDecision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env: completeEnv
  });
  const missingFlagDecision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env: buildEnvWithoutRouteBindingFlag(completeEnv),
    context: 'preflight-contract',
    acknowledgeNoProductionRouteBinding: true
  });
  const routeHandlerContextDecision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env: completeEnv,
    context: 'public-api-route-handler',
    acknowledgeNoProductionRouteBinding: true
  });
  const missingEnvDecision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env: { PUBLIC_RESULT_STORAGE_MODE: 'database', [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED },
    context: 'preflight-contract',
    acknowledgeNoProductionRouteBinding: true
  });

  const routeSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const baseFactorySource = readOptionalFile(repoRoot, BASE_FACTORY_MODULE);
  const preflightSource = readOptionalFile(repoRoot, PREFLIGHT_MODULE);
  const combinedRouteSources = `${routeSource}\n${baseFactorySource}`;
  const routeBindingSignals = findSignals(combinedRouteSources, ROUTE_BINDING_SIGNALS);
  const productionMutationSmokeSignals = findSignals(preflightSource, PRODUCTION_MUTATION_SMOKE_SIGNALS);
  const networkExecutionSignals = findSignals(preflightSource, NETWORK_EXECUTION_SIGNALS);
  const blockedIntegrationSignals = findSignals(preflightSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const missingContractPhrases = findMissingContractPhrases(repoRoot, REQUIRED_CONTRACT_PHRASES);

  const gates: PublicRouteDatabaseBindingPreflightContractReport['gates'] = {
    factoryActivationContractPassed: evidencePassed(factoryActivationEvidence),
    adapterActivationDryRunGatePassed: evidencePassed(activationDryRunEvidence),
    adapterImplementationGatePassed: evidencePassed(adapterImplementationEvidence),
    queryReadinessGuardPassed: evidencePassed(queryReadinessEvidence),
    clientSmokeBoundaryPassed: evidencePassed(clientSmokeEvidence),
    preflightScriptExists: existsSync(path.join(repoRoot, PREFLIGHT_SCRIPT)),
    validateScriptRunsPreflight: validateScript.includes('npm run contract:route-database-binding-preflight'),
    preflightModuleExists: existsSync(path.join(repoRoot, PREFLIGHT_MODULE)),
    preflightGuardModuleExists: existsSync(path.join(repoRoot, PREFLIGHT_GUARD_MODULE)),
    preflightDocExists: existsSync(path.join(repoRoot, PREFLIGHT_DOC)),
    phase811StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_11_STATUS_DOC)),
    routeBindingFlagRequired: missingFlagDecision.status === 'route-database-binding-preflight-blocked',
    completeDatabaseEnvRequired: missingEnvDecision.status === 'route-database-binding-preflight-blocked',
    databaseModeAloneInsufficient: databaseModeAloneDecision.status === 'route-database-binding-preflight-blocked',
    explicitFlagStillDoesNotActivateRoutes: preflightReadyDecision.preflightReady && !preflightReadyDecision.routeBindingAllowed,
    routeHandlerContextCannotBindDatabase: routeHandlerContextDecision.status === 'route-database-binding-preflight-blocked',
    routeBindingRemainsDisabled: preflightReadyDecision.routeBindingAllowed === false && routeBindingSignals.length === 0,
    routeHandlersRemainMemoryDryRun: PUBLIC_RESULT_ROUTE_HANDLERS_MODE === 'next-route-files-dry-run-in-memory-only' && routeSource.includes('createInMemoryPublicResultStorageAdapter'),
    noProductionMutationSmoke: preflightReadyDecision.productionMutationSmokeAllowed === false && productionMutationSmokeSignals.length === 0,
    noNetworkQueryExecution: preflightReadyDecision.networkQueryAllowed === false && networkExecutionSignals.length === 0,
    noPersistentPublicLookupRoute: preflightReadyDecision.persistentPublicLookupAllowed === false && persistentPublicLookupRouteFiles.length === 0,
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
    preflightReadyIssues: preflightReadyDecision.issues,
    databaseModeAloneIssues: databaseModeAloneDecision.issues,
    missingFlagIssues: missingFlagDecision.issues,
    routeHandlerContextIssues: routeHandlerContextDecision.issues,
    missingEnvIssues: missingEnvDecision.issues
  });
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_ROUTE_DATABASE_BINDING_PREFLIGHT_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-11-public-route-database-binding-preflight-contract',
      preflightSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: finalGates,
    scripts: buildScriptSummary(packageJson),
    preflight: {
      phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
      status: preflightReadyDecision.status,
      databaseModeAloneStatus: databaseModeAloneDecision.status,
      missingFlagStatus: missingFlagDecision.status,
      routeHandlerContextStatus: routeHandlerContextDecision.status,
      missingEnvStatus: missingEnvDecision.status,
      preflightReady: preflightReadyDecision.preflightReady,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryAllowed: false,
      persistentPublicLookupAllowed: false,
      routeBindingFlagEnv: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV,
      routeBindingFlagRequiredValue: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED,
      preflightRules: summarizePublicResultRouteDatabaseBindingPreflightRules()
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

export function writePublicRouteDatabaseBindingPreflightContractEvidence(
  report: PublicRouteDatabaseBindingPreflightContractReport,
  outputPath: string
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildEnvWithoutRouteBindingFlag(
  env: PublicResultStorageRuntimeEnvironment
): PublicResultStorageRuntimeEnvironment {
  const { [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV]: _removed, ...rest } = env;
  return rest;
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicRouteDatabaseBindingPreflightContractReport['scripts'] {
  const scripts: Record<string, string> = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
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
  if (packageJson.scripts?.['contract:route-database-binding-preflight'] !== undefined) {
    scripts.routeBindingPreflight = packageJson.scripts['contract:route-database-binding-preflight'];
  }
  return scripts;
}

function buildIssues(
  gates: PublicRouteDatabaseBindingPreflightContractReport['gates'],
  details: {
    readonly missingContractPhrases: readonly string[];
    readonly routeBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly preflightReadyIssues: readonly string[];
    readonly databaseModeAloneIssues: readonly string[];
    readonly missingFlagIssues: readonly string[];
    readonly routeHandlerContextIssues: readonly string[];
    readonly missingEnvIssues: readonly string[];
  }
): readonly string[] {
  return [
    ...Object.entries(gates)
      .filter(([key, value]) => key !== 'overallPassed' && value !== true)
      .map(([key]) => `public_route_database_binding_preflight_contract_failed:${key}`),
    ...details.missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`),
    ...details.routeBindingSignals.map((signal) => `route_binding_signal:${signal}`),
    ...details.productionMutationSmokeSignals.map((signal) => `production_mutation_smoke_signal:${signal}`),
    ...details.networkExecutionSignals.map((signal) => `network_execution_signal:${signal}`),
    ...details.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...details.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route:${file}`),
    ...details.preflightReadyIssues.map((issue) => `preflight_ready_issue:${issue}`),
    ...(details.databaseModeAloneIssues.includes('preflight_contract_context_required:unspecified')
      ? []
      : ['database_mode_alone_not_blocked']),
    ...(details.missingFlagIssues.some((issue) => issue.startsWith('route_binding_preflight_flag_required:'))
      ? []
      : ['missing_route_binding_preflight_flag_not_blocked']),
    ...(details.routeHandlerContextIssues.includes('public_api_route_handler_context_database_binding_blocked')
      ? []
      : ['route_handler_context_not_blocked']),
    ...(details.missingEnvIssues.some((issue) => issue.startsWith('complete_database_env_required:'))
      ? []
      : ['missing_database_env_not_blocked'])
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
    readOptionalFile(repoRoot, PREFLIGHT_DOC),
    readOptionalFile(repoRoot, PHASE_8_11_STATUS_DOC),
    readOptionalFile(repoRoot, PHASE_8_TRANSITION_DOC)
  ].join('\n');
  return phrases.filter((phrase) => !sources.includes(phrase));
}
