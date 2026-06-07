import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultLookupPageDatabaseActivationEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
  resolvePublicResultLookupPageDatabaseActivationDecision
} from '../public-link/publicResultLookupPageDatabaseActivation';
import {
  createPublicResultLookupPageImplementationFixtureAdapter,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_RULES,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION,
  resolvePublicResultLookupPageImplementationView,
  summarizePublicResultLookupPageImplementationRules
} from '../public-link/publicResultLookupPageImplementation';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
} from '../public-link/publicResultApiRouteDatabaseBindingImplementation';

export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_SCHEMA_VERSION =
  'phase-8.19-public-result-lookup-page-implementation-gate-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID =
  'phase-8-public-result-lookup-page-implementation-gate' as const;

export interface PublicResultLookupPageImplementationGateOptions {
  readonly repoRoot?: string;
}

export interface PublicResultLookupPageImplementationGateReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_SCHEMA_VERSION;
  readonly gateId: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID;
    readonly implementationSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly activationContractPassed: boolean;
    readonly dryRunContractPassed: boolean;
    readonly rollbackFailureEvidencePassed: boolean;
    readonly implementationScriptExists: boolean;
    readonly validateScriptRunsImplementationGate: boolean;
    readonly implementationModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly routeUsesImplementationResolver: boolean;
    readonly defaultBehaviorSafeFallback: boolean;
    readonly activationDecisionReady: boolean;
    readonly rollbackBlocksLookup: boolean;
    readonly activeRenderable: boolean;
    readonly readMissNotFound: boolean;
    readonly deletedUnavailable: boolean;
    readonly expiredUnavailable: boolean;
    readonly dtoOnlyRenderableResult: boolean;
    readonly noRawAnswersExposed: boolean;
    readonly noRawDeleteTokenExposed: boolean;
    readonly noProductionNetworkLookupSmoke: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noBlockedIntegrationSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly implementation: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE;
    readonly routePath: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH;
    readonly activationPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE;
    readonly activeStatus: string;
    readonly activeHttpStatus: number;
    readonly readMissStatus: string;
    readonly readMissHttpStatus: number;
    readonly deletedStatus: string;
    readonly deletedHttpStatus: number;
    readonly expiredStatus: string;
    readonly expiredHttpStatus: number;
    readonly defaultStatus: string;
    readonly rollbackStatus: string;
    readonly actualPublicLookupPageBindingApplied: boolean;
    readonly databaseReadExecuted: boolean;
    readonly networkLookupSmokeExecuted: boolean;
    readonly productionMutationSmokeExecuted: boolean;
    readonly rules: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly rawAnswerSignals: readonly string[];
    readonly rawDeleteTokenSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly rawAnswerSignalCount: number;
    readonly rawDeleteTokenSignalCount: number;
    readonly implementationRuleCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }
type JsonRecord = Record<string, unknown>;

const IMPLEMENTATION_MODULE = 'src/core/public-link/publicResultLookupPageImplementation.ts';
const IMPLEMENTATION_GUARD_MODULE = 'src/core/release/publicResultLookupPageImplementationGate.ts';
const IMPLEMENTATION_SCRIPT = 'scripts/public-result-lookup-page-implementation-gate.ts';
const IMPLEMENTATION_DOC = 'docs/release/phase-8-public-result-lookup-page-implementation-gate.md';
const PHASE_8_19_STATUS_DOC = 'docs/ui/phase-8-19-public-result-lookup-page-implementation-gate-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const CHECKED_FILES = [
  IMPLEMENTATION_MODULE,
  IMPLEMENTATION_GUARD_MODULE,
  IMPLEMENTATION_SCRIPT,
  IMPLEMENTATION_DOC,
  PHASE_8_19_STATUS_DOC,
  PHASE_8_TRANSITION_DOC,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH
] as const;
const SCANNED_SOURCE_FILES = [IMPLEMENTATION_MODULE, PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;
const RAW_ANSWER_SIGNALS = ['\"raw' + 'Answers\"', 'raw' + 'Answers:', 'question' + 'Answers:', 'selected' + 'Answer:', 'answer' + 'Text:'] as const;
const RAW_DELETE_TOKEN_SIGNALS = ['deleteToken:', 'delete_token', 'rawDeleteTokenExposed: true'] as const;

export async function runPublicResultLookupPageImplementationGate(
  options: PublicResultLookupPageImplementationGateOptions = {}
): Promise<PublicResultLookupPageImplementationGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const activationEvidence = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-activation-contract-latest.json');
  const dryRunEvidence = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-dry-run-contract-latest.json');
  const rollbackEvidence = readEvidence(repoRoot, 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json');
  const routeSource = readOptionalFile(repoRoot, PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH);
  const scan = scanImplementation(repoRoot);
  const env = buildCompletePublicResultLookupPageDatabaseActivationEnvironment();
  const fixtureAdapter = createPublicResultLookupPageImplementationFixtureAdapter();

  const activationDecision = await resolvePublicResultLookupPageDatabaseActivationDecision({
    env,
    context: 'public-result-lookup-page-activation-contract',
    acknowledgeActivationDecisionOnly: true,
    acknowledgeNoRealPageDatabaseRead: true,
    acknowledgePageRouteImplementationSeparate: true,
    acknowledgeRollbackBlocksLookupActivation: true
  });
  const defaultView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env: {},
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });
  const rollbackView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env: { ...env, [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY },
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });
  const activeView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });
  const readMissView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });
  const deletedView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });
  const expiredView = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter: fixtureAdapter
  });

  const gates = {
    activationContractPassed: evidencePassed(activationEvidence),
    dryRunContractPassed: evidencePassed(dryRunEvidence),
    rollbackFailureEvidencePassed: evidencePassed(rollbackEvidence),
    implementationScriptExists: packageJson.scripts?.['gate:public-lookup-page-implementation'] === 'tsx scripts/public-result-lookup-page-implementation-gate.ts',
    validateScriptRunsImplementationGate: validateScript.includes('npm run gate:public-lookup-page-implementation'),
    implementationModuleExists: existsSync(path.join(repoRoot, IMPLEMENTATION_MODULE)),
    pageRouteExists: existsSync(path.join(repoRoot, PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH)),
    routeUsesImplementationResolver: routeSource.includes('resolvePublicResultLookupPageImplementationView'),
    defaultBehaviorSafeFallback: defaultView.status === 'public-result-page-disabled' && !defaultView.databaseReadExecuted,
    activationDecisionReady: activationDecision.status === 'public-result-lookup-page-activation-ready-not-applied',
    rollbackBlocksLookup: rollbackView.status === 'public-result-page-disabled' && rollbackView.httpStatus === 503 && !rollbackView.databaseReadExecuted,
    activeRenderable: activeView.status === 'public-result-page-renderable' && activeView.httpStatus === 200 && activeView.dto !== null,
    readMissNotFound: readMissView.status === 'public-result-page-not-found' && readMissView.httpStatus === 404 && readMissView.dto === null,
    deletedUnavailable: deletedView.status === 'public-result-page-deleted-unavailable' && deletedView.httpStatus === 410 && deletedView.dto === null,
    expiredUnavailable: expiredView.status === 'public-result-page-expired-unavailable' && expiredView.httpStatus === 410 && expiredView.dto === null,
    dtoOnlyRenderableResult: activeView.publicDtoOnly && activeView.dto !== null,
    noRawAnswersExposed: !activeView.rawAnswersExposed && scan.rawAnswerSignals.length === 0,
    noRawDeleteTokenExposed: !activeView.rawDeleteTokenExposed && scan.rawDeleteTokenSignals.length === 0,
    noProductionNetworkLookupSmoke: !activeView.networkLookupSmokeExecuted,
    noProductionMutationSmoke: !activeView.productionMutationSmokeExecuted,
    noBlockedIntegrationSignals: scan.blockedIntegrationSignals.length === 0,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...scan.rawAnswerSignals.map((signal) => `raw_answer_signal:${signal}`),
    ...scan.rawDeleteTokenSignals.map((signal) => `raw_delete_token_signal:${signal}`),
    ...activeView.issues.map((issue) => `active_view:${issue}`),
    ...readMissView.issues.map((issue) => `read_miss_view:${issue}`),
    ...deletedView.issues.map((issue) => `deleted_view:${issue}`),
    ...expiredView.issues.map((issue) => `expired_view:${issue}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_SCHEMA_VERSION,
    gateId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_GATE_ID,
      implementationSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION
    },
    gates: finalGates,
    implementation: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE,
      routePath: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH,
      activationPhase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
      activeStatus: activeView.status,
      activeHttpStatus: activeView.httpStatus,
      readMissStatus: readMissView.status,
      readMissHttpStatus: readMissView.httpStatus,
      deletedStatus: deletedView.status,
      deletedHttpStatus: deletedView.httpStatus,
      expiredStatus: expiredView.status,
      expiredHttpStatus: expiredView.httpStatus,
      defaultStatus: defaultView.status,
      rollbackStatus: rollbackView.status,
      actualPublicLookupPageBindingApplied: activeView.actualPublicLookupPageBindingApplied,
      databaseReadExecuted: activeView.databaseReadExecuted,
      networkLookupSmokeExecuted: activeView.networkLookupSmokeExecuted,
      productionMutationSmokeExecuted: activeView.productionMutationSmokeExecuted,
      rules: summarizePublicResultLookupPageImplementationRules()
    },
    implementationScan: scan,
    coverage: {
      checkedFileCount: CHECKED_FILES.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length,
      rawAnswerSignalCount: scan.rawAnswerSignals.length,
      rawDeleteTokenSignalCount: scan.rawDeleteTokenSignals.length,
      implementationRuleCount: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_RULES.length
    },
    issues
  };
}

export function writePublicResultLookupPageImplementationGateEvidence(
  report: PublicResultLookupPageImplementationGateReport,
  evidencePath: string
): void {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
}

function readEvidence(repoRoot: string, relativePath: string): JsonRecord | null {
  const fullPath = path.join(repoRoot, relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf8')) as JsonRecord;
}

function evidencePassed(evidence: JsonRecord | null): boolean {
  if (evidence === null) return false;
  const gates = evidence.gates;
  if (isRecord(gates) && gates.overallPassed === true) return true;
  return evidence.overallPassed === true;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function scanImplementation(repoRoot: string): PublicResultLookupPageImplementationGateReport['implementationScan'] {
  const source = SCANNED_SOURCE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  return {
    checkedFiles: CHECKED_FILES,
    blockedIntegrationSignals: findSignals(source, BLOCKED_INTEGRATION_SIGNALS),
    rawAnswerSignals: findSignals(source, RAW_ANSWER_SIGNALS),
    rawDeleteTokenSignals: findSignals(source, RAW_DELETE_TOKEN_SIGNALS)
  };
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function gateIssues(gates: Record<string, boolean>): readonly string[] {
  return Object.entries(gates)
    .filter(([, passed]) => passed !== true)
    .map(([name]) => `gate_failed:${name}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
