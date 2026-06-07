import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultLookupPageDatabaseActivationEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_RULES,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultLookupPageDatabaseActivationDecision,
  summarizePublicResultLookupPageDatabaseActivationRules
} from '../public-link/publicResultLookupPageDatabaseActivation';
import {
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV
} from '../public-link/publicResultApiRouteDatabaseBindingImplementation';

export const PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_SCHEMA_VERSION =
  'phase-8.18-public-result-lookup-page-activation-contract-release-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID =
  'phase-8.18-public-result-lookup-page-activation-contract' as const;

export interface PublicResultLookupPageActivationContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultLookupPageActivationContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID;
    readonly activationSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly preflightContractPassed: boolean;
    readonly dryRunContractPassed: boolean;
    readonly apiRouteDatabaseBindingGatePassed: boolean;
    readonly rollbackFailureEvidencePackPassed: boolean;
    readonly activationScriptExists: boolean;
    readonly validateScriptRunsActivation: boolean;
    readonly activationModuleExists: boolean;
    readonly activationGuardModuleExists: boolean;
    readonly activationDocExists: boolean;
    readonly phase818StatusDocExists: boolean;
    readonly activationFlagDefined: boolean;
    readonly activationDecisionReady: boolean;
    readonly activationRequiresCompleteDatabaseEnv: boolean;
    readonly activationRequiresApiRouteDatabaseBinding: boolean;
    readonly activationDoesNotBypassRollback: boolean;
    readonly actualPublicLookupPageBindingNotApplied: boolean;
    readonly noRealPublicPageDatabaseRead: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noNetworkLookupSmoke: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly publicPageRouteImplementationSeparate: boolean;
    readonly noBlockedIntegrationSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly activation: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE;
    readonly status: string;
    readonly preflightStatus: string;
    readonly dryRunStatus: string;
    readonly completeDatabaseEnvPresent: boolean;
    readonly apiRouteDatabaseBindingGateValid: boolean;
    readonly activationDecisionReady: boolean;
    readonly actualPublicLookupPageBindingApplied: false;
    readonly publicPageDatabaseReadAllowed: false;
    readonly realPublicResultPageDatabaseReadExecuted: false;
    readonly networkLookupExecuted: false;
    readonly publicPageRouteImplementationAllowed: false;
    readonly apiRoutePersistenceRollbackStillAvailable: true;
    readonly activationFlagEnv: typeof PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV;
    readonly activationFlagRequiredValue: typeof PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
    readonly rules: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly publicPageDatabaseReadSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly persistentRouteCount: number;
    readonly publicPageDatabaseReadSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly activationRuleCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }
type JsonRecord = Record<string, unknown>;

const ACTIVATION_MODULE = 'src/core/public-link/publicResultLookupPageDatabaseActivation.ts';
const ACTIVATION_GUARD_MODULE = 'src/core/release/publicResultLookupPageActivationContract.ts';
const ACTIVATION_SCRIPT = 'scripts/public-result-lookup-page-activation-contract.ts';
const ACTIVATION_DOC = 'docs/release/phase-8-public-result-lookup-page-activation-contract.md';
const PHASE_8_18_STATUS_DOC = 'docs/ui/phase-8-18-public-result-lookup-page-activation-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const PUBLIC_PREVIEW_PAGE = 'src/app/r/preview/page.tsx';
const CHECKED_FILES = [ACTIVATION_MODULE, ACTIVATION_SCRIPT, ACTIVATION_DOC, PHASE_8_18_STATUS_DOC, PHASE_8_TRANSITION_DOC, PUBLIC_PREVIEW_PAGE] as const;
const PERSISTENT_PUBLIC_LOOKUP_ROUTES = ['src/app/r/[publicId]', 'src/app/r/[resultId]', 'src/app/r/[slug]', 'src/app/results/[publicId]', 'src/app/results/[resultId]'] as const;
const PUBLIC_PAGE_DATABASE_READ_SIGNALS = ['resolvePublicResultLookupPageDatabaseActivationDecision({ context: \'public-result-page\'', 'publicPageDatabaseReadAllowed: true', 'realPublicResultPageDatabaseReadExecuted: true', 'createPublicResultApiRouteDatabaseBindingStorageAdapter('] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;

export async function runPublicResultLookupPageActivationContract(
  options: PublicResultLookupPageActivationContractOptions = {}
): Promise<PublicResultLookupPageActivationContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const preflightEvidence = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-preflight-contract-latest.json');
  const dryRunEvidence = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-dry-run-contract-latest.json');
  const apiRouteEvidence = readEvidence(repoRoot, 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json');
  const rollbackEvidence = readEvidence(repoRoot, 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json');
  const activation = await resolvePublicResultLookupPageDatabaseActivationDecision({
    env: buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
    context: 'public-result-lookup-page-activation-contract',
    acknowledgeActivationDecisionOnly: true,
    acknowledgeNoRealPageDatabaseRead: true,
    acknowledgePageRouteImplementationSeparate: true,
    acknowledgeRollbackBlocksLookupActivation: true
  });
  const rollbackDecision = await resolvePublicResultLookupPageDatabaseActivationDecision({
    env: {
      ...buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
      PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK: 'memory'
    },
    context: 'public-result-lookup-page-activation-contract',
    acknowledgeActivationDecisionOnly: true,
    acknowledgeNoRealPageDatabaseRead: true,
    acknowledgePageRouteImplementationSeparate: true,
    acknowledgeRollbackBlocksLookupActivation: true
  });
  const scan = scanImplementation(repoRoot);

  const gates = {
    preflightContractPassed: evidencePassed(preflightEvidence),
    dryRunContractPassed: evidencePassed(dryRunEvidence),
    apiRouteDatabaseBindingGatePassed: evidencePassed(apiRouteEvidence),
    rollbackFailureEvidencePackPassed: evidencePassed(rollbackEvidence),
    activationScriptExists: existsSync(path.join(repoRoot, ACTIVATION_SCRIPT)),
    validateScriptRunsActivation: validateScript.includes('npm run contract:public-lookup-page-activation'),
    activationModuleExists: existsSync(path.join(repoRoot, ACTIVATION_MODULE)),
    activationGuardModuleExists: existsSync(path.join(repoRoot, ACTIVATION_GUARD_MODULE)),
    activationDocExists: existsSync(path.join(repoRoot, ACTIVATION_DOC)),
    phase818StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_18_STATUS_DOC)),
    activationFlagDefined: activation.publicLookupActivationFlagPresent,
    activationDecisionReady: activation.status === 'public-result-lookup-page-activation-ready-not-applied' && activation.activationDecisionReady,
    activationRequiresCompleteDatabaseEnv: activation.completeDatabaseEnvPresent,
    activationRequiresApiRouteDatabaseBinding: activation.apiRouteDatabaseBindingGateValid,
    activationDoesNotBypassRollback: rollbackDecision.status === 'public-result-lookup-page-activation-blocked' && !rollbackDecision.publicLookupActivationDoesNotBypassRollback,
    actualPublicLookupPageBindingNotApplied: !activation.actualPublicLookupPageBindingApplied,
    noRealPublicPageDatabaseRead: !activation.publicPageDatabaseReadAllowed && !activation.realPublicResultPageDatabaseReadExecuted && scan.publicPageDatabaseReadSignals.length === 0,
    noPersistentPublicLookupRoute: scan.persistentPublicLookupRouteFiles.length === 0,
    noNetworkLookupSmoke: !activation.productionNetworkLookupSmokeAllowed && !activation.networkLookupExecuted,
    noProductionMutationSmoke: !activation.productionMutationSmokeAllowed,
    publicPageRouteImplementationSeparate: !activation.publicPageRouteImplementationAllowed,
    noBlockedIntegrationSignals: scan.blockedIntegrationSignals.length === 0,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...activation.issues.map((issue) => `activation:${issue}`),
    ...scan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`),
    ...scan.publicPageDatabaseReadSignals.map((signal) => `public_page_database_read_signal:${signal}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID,
      activationSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION
    },
    gates: finalGates,
    activation: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
      status: activation.status,
      preflightStatus: activation.preflightStatus.status,
      dryRunStatus: activation.dryRunStatus.status,
      completeDatabaseEnvPresent: activation.completeDatabaseEnvPresent,
      apiRouteDatabaseBindingGateValid: activation.apiRouteDatabaseBindingGateValid,
      activationDecisionReady: activation.activationDecisionReady,
      actualPublicLookupPageBindingApplied: activation.actualPublicLookupPageBindingApplied,
      publicPageDatabaseReadAllowed: activation.publicPageDatabaseReadAllowed,
      realPublicResultPageDatabaseReadExecuted: activation.realPublicResultPageDatabaseReadExecuted,
      networkLookupExecuted: activation.networkLookupExecuted,
      publicPageRouteImplementationAllowed: activation.publicPageRouteImplementationAllowed,
      apiRoutePersistenceRollbackStillAvailable: activation.apiRoutePersistenceRollbackStillAvailable,
      activationFlagEnv: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
      activationFlagRequiredValue: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
      rules: summarizePublicResultLookupPageDatabaseActivationRules()
    },
    implementationScan: scan,
    coverage: {
      checkedFileCount: CHECKED_FILES.length,
      persistentRouteCount: scan.persistentPublicLookupRouteFiles.length,
      publicPageDatabaseReadSignalCount: scan.publicPageDatabaseReadSignals.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length,
      activationRuleCount: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_RULES.length
    },
    issues
  };
}

export function writePublicResultLookupPageActivationContractEvidence(report: PublicResultLookupPageActivationContractReport, evidencePath: string): void {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
}

function readEvidence(repoRoot: string, relativePath: string): JsonRecord | null {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return null;
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as JsonRecord;
}

function evidencePassed(evidence: JsonRecord | null): boolean {
  if (evidence === null) return false;
  const gates = evidence.gates;
  if (typeof gates === 'object' && gates !== null && 'overallPassed' in gates) {
    return (gates as { overallPassed?: unknown }).overallPassed === true;
  }
  return evidence.overallPassed === true;
}

function gateIssues(gates: Record<string, boolean>): readonly string[] {
  return Object.entries(gates)
    .filter(([, passed]) => passed !== true)
    .map(([gate]) => `gate_failed:${gate}`);
}

function scanImplementation(repoRoot: string): PublicResultLookupPageActivationContractReport['implementationScan'] {
  const checkedFiles = CHECKED_FILES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const checkedContent = checkedFiles.map((relativePath) => readFileSync(path.join(repoRoot, relativePath), 'utf8')).join('\n');
  const publicPageDatabaseReadSignals = PUBLIC_PAGE_DATABASE_READ_SIGNALS.filter((signal) => checkedContent.includes(signal));
  const blockedIntegrationSignals = BLOCKED_INTEGRATION_SIGNALS.filter((signal) => checkedContent.includes(signal));
  return {
    checkedFiles,
    persistentPublicLookupRouteFiles,
    publicPageDatabaseReadSignals,
    blockedIntegrationSignals
  };
}
