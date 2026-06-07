import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildApiRouteDatabaseBindingWithoutPublicLookupEnvironment,
  buildCompletePublicResultLookupPageDatabasePreflightEnvironment,
  buildPublicResultLookupPageDatabasePreflightRollbackEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
  resolvePublicResultLookupPageDatabasePreflightDecision,
  summarizePublicResultLookupPageDatabasePreflightRules
} from '../public-link/publicResultLookupPageDatabasePreflight';

export const PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_SCHEMA_VERSION =
  'phase-8.16-public-result-lookup-page-preflight-contract-report-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_ID =
  'phase-8-public-result-lookup-page-preflight-contract' as const;

export interface PublicResultLookupPagePreflightContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultLookupPagePreflightContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-16-public-result-lookup-page-preflight-contract';
    readonly preflightSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly apiRouteDatabaseBindingGatePassed: boolean;
    readonly rollbackFailureEvidencePackPassed: boolean;
    readonly preflightScriptExists: boolean;
    readonly validateScriptRunsPreflight: boolean;
    readonly preflightModuleExists: boolean;
    readonly preflightGuardModuleExists: boolean;
    readonly preflightDocExists: boolean;
    readonly phase816StatusDocExists: boolean;
    readonly publicLookupActivationFlagDefined: boolean;
    readonly publicLookupPreflightFlagDefined: boolean;
    readonly completeDatabaseEnvRequired: boolean;
    readonly apiRouteBindingDoesNotActivatePublicLookup: boolean;
    readonly apiRouteBindingWithoutPublicLookupAllowed: boolean;
    readonly publicLookupDisabledByDefault: boolean;
    readonly missingLookupFlagBlocked: boolean;
    readonly pageContextBlocked: boolean;
    readonly rollbackBlocksLookupPreflight: boolean;
    readonly noPublicPageDatabaseRead: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noNetworkLookupSmoke: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noBlockedIntegrationSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly preflight: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE;
    readonly status: string;
    readonly apiRouteBindingDecisionStatus: string;
    readonly apiRouteBindingCanBeActiveWithoutPublicLookup: boolean;
    readonly actualPublicLookupPageBindingApplied: false;
    readonly publicPageDatabaseReadAllowed: false;
    readonly publicPageDatabaseReadExecuted: false;
    readonly networkQueryExecuted: false;
    readonly requestedPublicLookupActivationFlag: string | undefined;
    readonly requestedPublicLookupPreflightFlag: string | undefined;
    readonly publicLookupActivationEnv: typeof PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV;
    readonly publicLookupActivationRequiredValue: typeof PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
    readonly publicLookupPreflightEnv: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV;
    readonly publicLookupPreflightRequiredValue: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED;
    readonly rules: readonly string[];
  };
  readonly blockedCases: {
    readonly defaultStatus: string;
    readonly apiRouteBindingOnlyStatus: string;
    readonly missingLookupActivationFlagStatus: string;
    readonly missingLookupPreflightFlagStatus: string;
    readonly pageContextStatus: string;
    readonly rollbackStatus: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly databaseReadSignalsInPublicPageFiles: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly persistentRouteCount: number;
    readonly publicPageDatabaseReadSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }

type JsonRecord = Record<string, unknown>;

const PREFLIGHT_MODULE = 'src/core/public-link/publicResultLookupPageDatabasePreflight.ts';
const PREFLIGHT_GUARD_MODULE = 'src/core/release/publicResultLookupPagePreflightContract.ts';
const PREFLIGHT_SCRIPT = 'scripts/public-result-lookup-page-preflight-contract.ts';
const PREFLIGHT_DOC = 'docs/release/phase-8-public-result-lookup-page-preflight-contract.md';
const PHASE_8_16_STATUS_DOC = 'docs/ui/phase-8-16-public-result-lookup-page-preflight-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const PUBLIC_PREVIEW_PAGE = 'src/app/r/preview/page.tsx';
const CHECKED_FILES = [PREFLIGHT_MODULE, PREFLIGHT_SCRIPT, PREFLIGHT_DOC, PHASE_8_16_STATUS_DOC, PHASE_8_TRANSITION_DOC, PUBLIC_PREVIEW_PAGE] as const;
const PERSISTENT_PUBLIC_LOOKUP_ROUTES = ['src/app/r/[publicId]', 'src/app/r/[resultId]', 'src/app/r/[slug]', 'src/app/results/[publicId]', 'src/app/results/[resultId]'] as const;
const PUBLIC_PAGE_DATABASE_READ_SIGNALS = ['handlePublicResultReadRoute(', 'createPublicResultApiRouteDatabaseBindingStorageAdapter(', 'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled', 'publicResultDatabaseStorageAdapter'] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;

export async function runPublicResultLookupPagePreflightContract(
  options: PublicResultLookupPagePreflightContractOptions = {}
): Promise<PublicResultLookupPagePreflightContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const apiRouteEvidence = readEvidence(repoRoot, 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json');
  const rollbackEvidence = readEvidence(repoRoot, 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json');

  const ready = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const defaultDecision = resolvePublicResultLookupPageDatabasePreflightDecision({ env: {}, context: 'public-result-lookup-page-preflight' });
  const apiRouteOnly = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: buildApiRouteDatabaseBindingWithoutPublicLookupEnvironment(),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const missingLookupActivation = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: withoutKey(buildCompletePublicResultLookupPageDatabasePreflightEnvironment(), PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const missingLookupPreflight = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: withoutKey(buildCompletePublicResultLookupPageDatabasePreflightEnvironment(), PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const pageContext = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
    context: 'public-result-page',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const rollback = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: buildPublicResultLookupPageDatabasePreflightRollbackEnvironment(),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const scan = scanImplementation(repoRoot);

  const gates = {
    apiRouteDatabaseBindingGatePassed: evidencePassed(apiRouteEvidence),
    rollbackFailureEvidencePackPassed: evidencePassed(rollbackEvidence),
    preflightScriptExists: existsSync(path.join(repoRoot, PREFLIGHT_SCRIPT)),
    validateScriptRunsPreflight: validateScript.includes('npm run contract:public-lookup-page-preflight'),
    preflightModuleExists: existsSync(path.join(repoRoot, PREFLIGHT_MODULE)),
    preflightGuardModuleExists: existsSync(path.join(repoRoot, PREFLIGHT_GUARD_MODULE)),
    preflightDocExists: existsSync(path.join(repoRoot, PREFLIGHT_DOC)),
    phase816StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_16_STATUS_DOC)),
    publicLookupActivationFlagDefined: ready.requestedPublicLookupActivationFlag === PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
    publicLookupPreflightFlagDefined: ready.requestedPublicLookupPreflightFlag === PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED,
    completeDatabaseEnvRequired: ready.completeDatabaseEnvPresent && missingLookupActivation.completeDatabaseEnvPresent,
    apiRouteBindingDoesNotActivatePublicLookup: ready.apiRouteDatabaseBindingDoesNotActivatePublicLookup,
    apiRouteBindingWithoutPublicLookupAllowed: apiRouteOnly.apiRouteBindingCanBeActiveWithoutPublicLookup && apiRouteOnly.status === 'public-result-lookup-page-preflight-blocked',
    publicLookupDisabledByDefault: defaultDecision.status === 'public-result-lookup-page-preflight-blocked',
    missingLookupFlagBlocked: missingLookupActivation.status === 'public-result-lookup-page-preflight-blocked' && missingLookupPreflight.status === 'public-result-lookup-page-preflight-blocked',
    pageContextBlocked: pageContext.status === 'public-result-lookup-page-preflight-blocked' && pageContext.pageContextBlocked,
    rollbackBlocksLookupPreflight: rollback.status === 'public-result-lookup-page-preflight-blocked' && rollback.rollbackToMemoryRequested,
    noPublicPageDatabaseRead: !ready.publicPageDatabaseReadAllowed && !ready.publicPageDatabaseReadExecuted && scan.databaseReadSignalsInPublicPageFiles.length === 0,
    noPersistentPublicLookupRoute: scan.persistentPublicLookupRouteFiles.length === 0,
    noNetworkLookupSmoke: !ready.networkLookupSmokeAllowed && !ready.networkQueryExecuted,
    noProductionMutationSmoke: !ready.productionMutationSmokeAllowed,
    noBlockedIntegrationSignals: scan.blockedIntegrationSignals.length === 0,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...ready.issues.map((issue) => `ready_preflight:${issue}`),
    ...scan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`),
    ...scan.databaseReadSignalsInPublicPageFiles.map((signal) => `public_page_database_read_signal:${signal}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_LOOKUP_PAGE_PREFLIGHT_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-16-public-result-lookup-page-preflight-contract',
      preflightSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION
    },
    gates: finalGates,
    preflight: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
      status: ready.status,
      apiRouteBindingDecisionStatus: ready.apiRouteBindingDecisionStatus,
      apiRouteBindingCanBeActiveWithoutPublicLookup: apiRouteOnly.apiRouteBindingCanBeActiveWithoutPublicLookup,
      actualPublicLookupPageBindingApplied: ready.actualPublicLookupPageBindingApplied,
      publicPageDatabaseReadAllowed: ready.publicPageDatabaseReadAllowed,
      publicPageDatabaseReadExecuted: ready.publicPageDatabaseReadExecuted,
      networkQueryExecuted: ready.networkQueryExecuted,
      requestedPublicLookupActivationFlag: ready.requestedPublicLookupActivationFlag,
      requestedPublicLookupPreflightFlag: ready.requestedPublicLookupPreflightFlag,
      publicLookupActivationEnv: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
      publicLookupActivationRequiredValue: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
      publicLookupPreflightEnv: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV,
      publicLookupPreflightRequiredValue: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED,
      rules: summarizePublicResultLookupPageDatabasePreflightRules()
    },
    blockedCases: {
      defaultStatus: defaultDecision.status,
      apiRouteBindingOnlyStatus: apiRouteOnly.status,
      missingLookupActivationFlagStatus: missingLookupActivation.status,
      missingLookupPreflightFlagStatus: missingLookupPreflight.status,
      pageContextStatus: pageContext.status,
      rollbackStatus: rollback.status
    },
    implementationScan: scan,
    coverage: {
      checkedFileCount: CHECKED_FILES.length,
      persistentRouteCount: scan.persistentPublicLookupRouteFiles.length,
      publicPageDatabaseReadSignalCount: scan.databaseReadSignalsInPublicPageFiles.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length
    },
    issues
  };
}

export function writePublicResultLookupPagePreflightContractEvidence(report: PublicResultLookupPagePreflightContractReport, evidencePath: string): void {
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
  return (evidence as { overallPassed?: unknown }).overallPassed === true;
}

function scanImplementation(repoRoot: string) {
  const checkedFiles = CHECKED_FILES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const databaseReadSignalsInPublicPageFiles: string[] = [];
  const publicPageFiles = [PUBLIC_PREVIEW_PAGE, ...persistentPublicLookupRouteFiles];
  for (const relativePath of publicPageFiles) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const signal of PUBLIC_PAGE_DATABASE_READ_SIGNALS) {
      if (content.includes(signal)) databaseReadSignalsInPublicPageFiles.push(`${relativePath}:${signal}`);
    }
  }
  const blockedIntegrationSignals: string[] = [];
  for (const relativePath of checkedFiles) {
    const content = readFileSync(path.join(repoRoot, relativePath), 'utf8');
    for (const signal of BLOCKED_INTEGRATION_SIGNALS) {
      if (content.includes(signal)) blockedIntegrationSignals.push(`${relativePath}:${signal}`);
    }
  }
  return { checkedFiles, persistentPublicLookupRouteFiles, databaseReadSignalsInPublicPageFiles, blockedIntegrationSignals };
}

function gateIssues(gates: Record<string, boolean>): string[] {
  return Object.entries(gates).flatMap(([name, passed]) => (passed ? [] : [`gate_failed:${name}`]));
}

function withoutKey<T extends Record<string, string | undefined>>(env: T, key: string): T {
  const next = { ...env };
  delete next[key];
  return next;
}
