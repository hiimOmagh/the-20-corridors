import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultRouteDatabaseBindingActivationEnvironment,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultRouteDatabaseBindingActivationDecision,
  summarizePublicResultRouteDatabaseBindingActivationRules
} from '../public-link/publicResultRouteDatabaseBindingActivation';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';

export const PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_SCHEMA_VERSION =
  'phase-8.13-public-route-database-binding-activation-contract-v1' as const;
export const PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_ID =
  'phase-8-public-route-database-binding-activation-contract' as const;

export interface PublicRouteDatabaseBindingActivationContractOptions {
  readonly repoRoot?: string;
}

export interface PublicRouteDatabaseBindingActivationContractReport {
  readonly schemaVersion: typeof PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-13-public-route-database-binding-activation-contract';
    readonly activationSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly routeBindingDryRunContractPassed: boolean;
    readonly routeBindingPreflightContractPassed: boolean;
    readonly factoryActivationContractPassed: boolean;
    readonly activationScriptExists: boolean;
    readonly validateScriptRunsActivation: boolean;
    readonly activationModuleExists: boolean;
    readonly activationGuardModuleExists: boolean;
    readonly activationDocExists: boolean;
    readonly phase813StatusDocExists: boolean;
    readonly activationFlagRequired: boolean;
    readonly activationDecisionReady: boolean;
    readonly databaseModeAloneStillBlocked: boolean;
    readonly missingActivationFlagStillBlocked: boolean;
    readonly publicApiRouteHandlerContextStillBlocked: boolean;
    readonly publicLookupContextStillBlocked: boolean;
    readonly publicLookupActivationFlagStillBlocked: boolean;
    readonly apiRouteActivationSeparatedFromPublicLookup: boolean;
    readonly actualRouteHandlersRemainMemoryDryRun: boolean;
    readonly productionRouteBindingNotApplied: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noAuthPaymentAiAnalyticsTelemetryImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly routeBindingActivation?: string;
    readonly routeBindingDryRun?: string;
    readonly routeBindingPreflight?: string;
  };
  readonly activation: {
    readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE;
    readonly status: string;
    readonly databaseModeAloneStatus: string;
    readonly missingActivationFlagStatus: string;
    readonly publicApiRouteHandlerContextStatus: string;
    readonly publicLookupContextStatus: string;
    readonly publicLookupFlagEnabledStatus: string;
    readonly dryRunStatus: string;
    readonly preflightStatus: string;
    readonly fakeRouteBoundAdapterCreatedInDryRun: boolean;
    readonly routeFlowSimulationPassed: boolean;
    readonly apiRouteDatabaseBindingActivationReady: boolean;
    readonly actualRouteBindingApplied: false;
    readonly actualRouteHandlersRemainMemoryDryRun: true;
    readonly publicResultPageLookupActivationAllowed: false;
    readonly productionMutationSmokeAllowed: false;
    readonly networkQueryExecuted: false;
    readonly persistentPublicLookupAllowed: false;
    readonly activationFlagEnv: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV;
    readonly activationFlagRequiredValue: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED;
    readonly publicLookupActivationEnv: typeof PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV;
    readonly activationRules: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly appliedRouteBindingSignals: readonly string[];
    readonly productionMutationSmokeSignals: readonly string[];
    readonly networkExecutionSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly dryRunIssueCount: number;
    readonly activationIssueCount: number;
    readonly databaseModeAloneIssueCount: number;
    readonly missingActivationFlagIssueCount: number;
    readonly publicApiRouteHandlerIssueCount: number;
    readonly publicLookupContextIssueCount: number;
    readonly publicLookupFlagIssueCount: number;
    readonly checkedFileCount: number;
    readonly appliedRouteBindingSignalCount: number;
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

const ACTIVATION_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingActivation.ts';
const ACTIVATION_GUARD_MODULE = 'src/core/release/publicRouteDatabaseBindingActivationContract.ts';
const ACTIVATION_SCRIPT = 'scripts/public-route-database-binding-activation-contract.ts';
const ACTIVATION_DOC = 'docs/release/phase-8-public-route-database-binding-activation-contract.md';
const PHASE_8_13_STATUS_DOC = 'docs/ui/phase-8-13-public-route-database-binding-activation-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const DRY_RUN_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingDryRun.ts';
const PREFLIGHT_MODULE = 'src/core/public-link/publicResultRouteDatabaseBindingPreflight.ts';

const CHECKED_FILES = [
  ACTIVATION_MODULE,
  ACTIVATION_SCRIPT,
  ACTIVATION_DOC,
  PHASE_8_13_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  ROUTE_HANDLERS_MODULE,
  DRY_RUN_MODULE,
  PREFLIGHT_MODULE
] as const;

const APPLIED_ROUTE_BINDING_SIGNALS = [
  "PUBLIC_RESULT_ROUTE_HANDLERS_MODE = 'database'",
  'getPublicResultRouteAdapter() { return createPublicResultDatabase',
  'actualRouteBindingApplied: true',
  'publicApiRoutesRemainMemoryDryRun: false'
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
  'Public Route Database Binding Activation Contract',
  'API route database binding activation decision',
  'Actual route handlers remain memory/dry-run',
  'Public /r/[publicId] page lookup remains separate',
  'No production mutation smoke',
  'No network SQL execution',
  'Phase 8.13'
] as const;

export async function runPublicRouteDatabaseBindingActivationContract(
  options: PublicRouteDatabaseBindingActivationContractOptions = {}
): Promise<PublicRouteDatabaseBindingActivationContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const dryRunEvidence = readEvidence(
    repoRoot,
    'docs/evidence/public-route-database-binding-dry-run-contract-latest.json',
    'public_route_database_binding_dry_run_contract'
  );
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

  const completeEnv = buildCompletePublicResultRouteDatabaseBindingActivationEnvironment();
  const activation = await resolvePublicResultRouteDatabaseBindingActivationDecision({
    env: completeEnv,
    context: 'route-binding-activation-contract',
    acknowledgeApiRouteOnlyActivation: true,
    acknowledgeActualRouteHandlersRemainUnchanged: true
  });
  const databaseModeAlone = await resolvePublicResultRouteDatabaseBindingActivationDecision({
    env: buildEnvWithout(completeEnv, PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV),
    context: 'route-binding-activation-contract',
    acknowledgeApiRouteOnlyActivation: true,
    acknowledgeActualRouteHandlersRemainUnchanged: true
  });
  const missingActivationFlag = databaseModeAlone;
  const routeHandlerContext = await resolvePublicResultRouteDatabaseBindingActivationDecision({
    env: completeEnv,
    context: 'public-api-route-handler',
    acknowledgeApiRouteOnlyActivation: true,
    acknowledgeActualRouteHandlersRemainUnchanged: true
  });
  const publicLookupContext = await resolvePublicResultRouteDatabaseBindingActivationDecision({
    env: completeEnv,
    context: 'public-result-page-lookup',
    acknowledgeApiRouteOnlyActivation: true,
    acknowledgeActualRouteHandlersRemainUnchanged: true
  });
  const publicLookupFlagEnabled = await resolvePublicResultRouteDatabaseBindingActivationDecision({
    env: { ...completeEnv, [PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV]: 'enabled' },
    context: 'route-binding-activation-contract',
    acknowledgeApiRouteOnlyActivation: true,
    acknowledgeActualRouteHandlersRemainUnchanged: true
  });

  const implementationScan = scanImplementation(repoRoot);

  const gates = {
    routeBindingDryRunContractPassed: evidencePassed(dryRunEvidence),
    routeBindingPreflightContractPassed: evidencePassed(preflightEvidence),
    factoryActivationContractPassed: evidencePassed(factoryActivationEvidence),
    activationScriptExists: existsSync(path.join(repoRoot, ACTIVATION_SCRIPT)),
    validateScriptRunsActivation: validateScript.includes('npm run contract:route-database-binding-activation'),
    activationModuleExists: existsSync(path.join(repoRoot, ACTIVATION_MODULE)),
    activationGuardModuleExists: existsSync(path.join(repoRoot, ACTIVATION_GUARD_MODULE)),
    activationDocExists: existsSync(path.join(repoRoot, ACTIVATION_DOC)),
    phase813StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_13_STATUS_DOC)),
    activationFlagRequired: activation.activationFlagPresent,
    activationDecisionReady: activation.status === 'api-route-database-binding-activation-ready-not-applied',
    databaseModeAloneStillBlocked: databaseModeAlone.status === 'api-route-database-binding-activation-blocked',
    missingActivationFlagStillBlocked: missingActivationFlag.status === 'api-route-database-binding-activation-blocked',
    publicApiRouteHandlerContextStillBlocked: routeHandlerContext.status === 'api-route-database-binding-activation-blocked',
    publicLookupContextStillBlocked: publicLookupContext.status === 'api-route-database-binding-activation-blocked',
    publicLookupActivationFlagStillBlocked: publicLookupFlagEnabled.status === 'api-route-database-binding-activation-blocked',
    apiRouteActivationSeparatedFromPublicLookup:
      activation.apiRouteDatabaseBindingActivationReady && !activation.publicResultPageLookupActivationAllowed,
    actualRouteHandlersRemainMemoryDryRun: activation.actualRouteHandlersRemainMemoryDryRun,
    productionRouteBindingNotApplied: activation.actualRouteBindingApplied === false,
    noProductionMutationSmoke: !activation.productionMutationSmokeAllowed && implementationScan.productionMutationSmokeSignals.length === 0,
    noNetworkQueryExecution: !activation.networkQueryExecuted && implementationScan.networkExecutionSignals.length === 0,
    noPersistentPublicLookupRoute: !activation.persistentPublicLookupAllowed && implementationScan.persistentPublicLookupRouteFiles.length === 0,
    noAuthPaymentAiAnalyticsTelemetryImplementation: implementationScan.blockedIntegrationSignals.length === 0,
    overallPassed: false
  };

  const { overallPassed: _initialOverallPassed, ...gatesBeforeOverall } = gates;

  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...activation.issues.map((issue) => `activation:${issue}`),
    ...implementationScan.missingContractPhrases.map((phrase) => `missing_contract_phrase:${phrase}`),
    ...implementationScan.appliedRouteBindingSignals.map((signal) => `applied_route_binding_signal:${signal}`),
    ...implementationScan.productionMutationSmokeSignals.map((signal) => `production_mutation_smoke_signal:${signal}`),
    ...implementationScan.networkExecutionSignals.map((signal) => `network_execution_signal:${signal}`),
    ...implementationScan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...implementationScan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`)
  ];

  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_ROUTE_DATABASE_BINDING_ACTIVATION_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-13-public-route-database-binding-activation-contract',
      activationSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: finalGates,
    scripts: buildScriptsReport(packageJson),
    activation: {
      phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE,
      status: activation.status,
      databaseModeAloneStatus: databaseModeAlone.status,
      missingActivationFlagStatus: missingActivationFlag.status,
      publicApiRouteHandlerContextStatus: routeHandlerContext.status,
      publicLookupContextStatus: publicLookupContext.status,
      publicLookupFlagEnabledStatus: publicLookupFlagEnabled.status,
      dryRunStatus: activation.dryRunStatus,
      preflightStatus: activation.preflightStatus,
      fakeRouteBoundAdapterCreatedInDryRun: activation.fakeRouteBoundAdapterCreatedInDryRun,
      routeFlowSimulationPassed: activation.routeFlowSimulationPassed,
      apiRouteDatabaseBindingActivationReady: activation.apiRouteDatabaseBindingActivationReady,
      actualRouteBindingApplied: false,
      actualRouteHandlersRemainMemoryDryRun: true,
      publicResultPageLookupActivationAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      persistentPublicLookupAllowed: false,
      activationFlagEnv: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV,
      activationFlagRequiredValue: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED,
      publicLookupActivationEnv: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
      activationRules: summarizePublicResultRouteDatabaseBindingActivationRules()
    },
    implementationScan,
    coverage: {
      dryRunIssueCount: Array.isArray((dryRunEvidence as { issues?: unknown }).issues) ? ((dryRunEvidence as { issues: unknown[] }).issues.length) : 0,
      activationIssueCount: activation.issues.length,
      databaseModeAloneIssueCount: databaseModeAlone.issues.length,
      missingActivationFlagIssueCount: missingActivationFlag.issues.length,
      publicApiRouteHandlerIssueCount: routeHandlerContext.issues.length,
      publicLookupContextIssueCount: publicLookupContext.issues.length,
      publicLookupFlagIssueCount: publicLookupFlagEnabled.issues.length,
      checkedFileCount: implementationScan.checkedFiles.length,
      appliedRouteBindingSignalCount: implementationScan.appliedRouteBindingSignals.length,
      productionMutationSmokeSignalCount: implementationScan.productionMutationSmokeSignals.length,
      networkExecutionSignalCount: implementationScan.networkExecutionSignals.length,
      blockedIntegrationSignalCount: implementationScan.blockedIntegrationSignals.length,
      persistentRouteCount: implementationScan.persistentPublicLookupRouteFiles.length
    },
    issues
  };
}

export function writePublicRouteDatabaseBindingActivationContractEvidence(
  report: PublicRouteDatabaseBindingActivationContractReport,
  evidencePath: string
): void {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function buildScriptsReport(packageJson: PackageJsonSubset): PublicRouteDatabaseBindingActivationContractReport['scripts'] {
  return {
    ...(packageJson.scripts?.validate === undefined ? {} : { validate: packageJson.scripts.validate }),
    ...(packageJson.scripts?.['contract:route-database-binding-activation'] === undefined
      ? {}
      : { routeBindingActivation: packageJson.scripts['contract:route-database-binding-activation'] }),
    ...(packageJson.scripts?.['dryrun:route-database-binding'] === undefined
      ? {}
      : { routeBindingDryRun: packageJson.scripts['dryrun:route-database-binding'] }),
    ...(packageJson.scripts?.['contract:route-database-binding-preflight'] === undefined
      ? {}
      : { routeBindingPreflight: packageJson.scripts['contract:route-database-binding-preflight'] })
  };
}

function buildEnvWithout(
  env: ReturnType<typeof buildCompletePublicResultRouteDatabaseBindingActivationEnvironment>,
  key: string
): ReturnType<typeof buildCompletePublicResultRouteDatabaseBindingActivationEnvironment> {
  const copy = { ...env };
  delete (copy as Record<string, unknown>)[key];
  return copy;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
}

function readEvidence(repoRoot: string, relativePath: string, expectedContractId: string): unknown {
  const evidencePath = path.join(repoRoot, relativePath);
  if (!existsSync(evidencePath)) return { contractId: expectedContractId, gates: { overallPassed: false }, issues: ['missing_evidence'] };
  return JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
}

function evidencePassed(evidence: unknown): boolean {
  if (!isRecord(evidence)) return false;
  if (isRecord(evidence.gates) && evidence.gates.overallPassed === true) return true;
  return evidence.overallPassed === true;
}

function scanImplementation(repoRoot: string): PublicRouteDatabaseBindingActivationContractReport['implementationScan'] {
  const checkedFiles = CHECKED_FILES.filter((file) => existsSync(path.join(repoRoot, file)));
  const combined = checkedFiles.map((file) => readFileSync(path.join(repoRoot, file), 'utf8')).join('\n');
  return {
    checkedFiles,
    appliedRouteBindingSignals: APPLIED_ROUTE_BINDING_SIGNALS.filter((signal) => combined.includes(signal)),
    productionMutationSmokeSignals: PRODUCTION_MUTATION_SMOKE_SIGNALS.filter((signal) => combined.includes(signal)),
    networkExecutionSignals: NETWORK_EXECUTION_SIGNALS.filter((signal) => combined.includes(signal)),
    blockedIntegrationSignals: BLOCKED_INTEGRATION_SIGNALS.filter((signal) => combined.includes(signal)),
    persistentPublicLookupRouteFiles: PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((file) => existsSync(path.join(repoRoot, file))),
    missingContractPhrases: REQUIRED_CONTRACT_PHRASES.filter((phrase) => !combined.includes(phrase))
  };
}

function gateIssues(gates: Omit<PublicRouteDatabaseBindingActivationContractReport['gates'], 'overallPassed'>): readonly string[] {
  return Object.entries(gates)
    .filter(([, value]) => value !== true)
    .map(([name]) => `gate_failed:${name}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
