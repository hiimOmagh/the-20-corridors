import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultLookupPageDatabaseDryRunEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
  runPublicResultLookupPageDatabaseDryRun,
  summarizePublicResultLookupPageDatabaseDryRunRules
} from '../public-link/publicResultLookupPageDatabaseDryRun';

export const PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_SCHEMA_VERSION =
  'phase-8.17-public-result-lookup-page-dry-run-contract-report-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_ID =
  'phase-8-public-result-lookup-page-dry-run-contract' as const;

export interface PublicResultLookupPageDryRunContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultLookupPageDryRunContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-17-public-result-lookup-page-dry-run-contract';
    readonly dryRunSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly preflightContractPassed: boolean;
    readonly apiRouteDatabaseBindingGatePassed: boolean;
    readonly rollbackFailureEvidencePackPassed: boolean;
    readonly dryRunScriptExists: boolean;
    readonly validateScriptRunsDryRun: boolean;
    readonly dryRunModuleExists: boolean;
    readonly dryRunGuardModuleExists: boolean;
    readonly dryRunDocExists: boolean;
    readonly phase817StatusDocExists: boolean;
    readonly dryRunFlagDefined: boolean;
    readonly preflightReady: boolean;
    readonly fakeExecutorOnly: boolean;
    readonly fakeLookupAdapterCreated: boolean;
    readonly activeLookupRenderable: boolean;
    readonly readMissReturnsNotFound: boolean;
    readonly deletedResultUnavailable: boolean;
    readonly expiredResultUnavailable: boolean;
    readonly actualPublicLookupPageBindingNotApplied: boolean;
    readonly noRealPublicPageDatabaseRead: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noNetworkLookupSmoke: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noPrivateDataExposure: boolean;
    readonly noBlockedIntegrationSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly dryRun: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE;
    readonly status: string;
    readonly preflightStatus: string;
    readonly activeLookupStatus: string | null;
    readonly activeLookupHttpStatus: number | null;
    readonly readMissStatus: string | null;
    readonly readMissHttpStatus: number | null;
    readonly deletedLookupStatus: string | null;
    readonly deletedLookupHttpStatus: number | null;
    readonly expiredLookupStatus: string | null;
    readonly expiredLookupHttpStatus: number | null;
    readonly lookupSimulationPassed: boolean;
    readonly executedQueryIntents: readonly string[];
    readonly queryIntentExecutionCount: number;
    readonly actualPublicLookupPageBindingApplied: false;
    readonly realPublicResultPageDatabaseReadExecuted: false;
    readonly networkQueryExecuted: false;
    readonly dryRunFlagEnv: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV;
    readonly dryRunFlagRequiredValue: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED;
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
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }
type JsonRecord = Record<string, unknown>;

const DRY_RUN_MODULE = 'src/core/public-link/publicResultLookupPageDatabaseDryRun.ts';
const DRY_RUN_GUARD_MODULE = 'src/core/release/publicResultLookupPageDryRunContract.ts';
const DRY_RUN_SCRIPT = 'scripts/public-result-lookup-page-dry-run-contract.ts';
const DRY_RUN_DOC = 'docs/release/phase-8-public-result-lookup-page-dry-run-contract.md';
const PHASE_8_17_STATUS_DOC = 'docs/ui/phase-8-17-public-result-lookup-page-dry-run-contract-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const PUBLIC_PREVIEW_PAGE = 'src/app/r/preview/page.tsx';
const CHECKED_FILES = [DRY_RUN_MODULE, DRY_RUN_SCRIPT, DRY_RUN_DOC, PHASE_8_17_STATUS_DOC, PHASE_8_TRANSITION_DOC, PUBLIC_PREVIEW_PAGE] as const;
const PERSISTENT_PUBLIC_LOOKUP_ROUTES = ['src/app/r/[publicId]', 'src/app/r/[resultId]', 'src/app/r/[slug]', 'src/app/results/[publicId]', 'src/app/results/[resultId]'] as const;
const PUBLIC_PAGE_DATABASE_READ_SIGNALS = ['handlePublicResultReadRoute(', 'createPublicResultApiRouteDatabaseBindingStorageAdapter(', 'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled', 'publicResultDatabaseStorageAdapter'] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;

export async function runPublicResultLookupPageDryRunContract(
  options: PublicResultLookupPageDryRunContractOptions = {}
): Promise<PublicResultLookupPageDryRunContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const preflightEvidence = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-preflight-contract-latest.json');
  const apiRouteEvidence = readEvidence(repoRoot, 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json');
  const rollbackEvidence = readEvidence(repoRoot, 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json');
  const dryRun = await runPublicResultLookupPageDatabaseDryRun({
    env: buildCompletePublicResultLookupPageDatabaseDryRunEnvironment(),
    context: 'public-result-lookup-page-dry-run-contract',
    acknowledgeFakeExecutorOnly: true,
    acknowledgeActualPageLookupRemainsDisabled: true
  });
  const scan = scanImplementation(repoRoot);

  const gates = {
    preflightContractPassed: evidencePassed(preflightEvidence),
    apiRouteDatabaseBindingGatePassed: evidencePassed(apiRouteEvidence),
    rollbackFailureEvidencePackPassed: evidencePassed(rollbackEvidence),
    dryRunScriptExists: existsSync(path.join(repoRoot, DRY_RUN_SCRIPT)),
    validateScriptRunsDryRun: validateScript.includes('npm run dryrun:public-lookup-page'),
    dryRunModuleExists: existsSync(path.join(repoRoot, DRY_RUN_MODULE)),
    dryRunGuardModuleExists: existsSync(path.join(repoRoot, DRY_RUN_GUARD_MODULE)),
    dryRunDocExists: existsSync(path.join(repoRoot, DRY_RUN_DOC)),
    phase817StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_17_STATUS_DOC)),
    dryRunFlagDefined: dryRun.dryRunFlagPresent,
    preflightReady: dryRun.preflightReady && dryRun.preflightStatus === 'public-result-lookup-page-preflight-ready-but-disabled',
    fakeExecutorOnly: dryRun.fakeExecutorOnlyAcknowledged && !dryRun.networkQueryExecuted,
    fakeLookupAdapterCreated: dryRun.fakeLookupAdapterCreated,
    activeLookupRenderable: dryRun.activeLookup?.viewStatus === 'renderable' && dryRun.activeLookup.httpStatus === 200 && dryRun.activeLookup.dto !== null,
    readMissReturnsNotFound: dryRun.readMissLookup?.viewStatus === 'not-found' && dryRun.readMissLookup.httpStatus === 404 && dryRun.readMissLookup.dto === null,
    deletedResultUnavailable: dryRun.deletedLookup?.viewStatus === 'deleted-unavailable' && dryRun.deletedLookup.httpStatus === 410 && dryRun.deletedLookup.dto === null,
    expiredResultUnavailable: dryRun.expiredLookup?.viewStatus === 'expired-unavailable' && dryRun.expiredLookup.httpStatus === 410 && dryRun.expiredLookup.dto === null,
    actualPublicLookupPageBindingNotApplied: !dryRun.actualPublicLookupPageBindingApplied,
    noRealPublicPageDatabaseRead: !dryRun.realPublicResultPageDatabaseReadAllowed && !dryRun.realPublicResultPageDatabaseReadExecuted && scan.publicPageDatabaseReadSignals.length === 0,
    noPersistentPublicLookupRoute: scan.persistentPublicLookupRouteFiles.length === 0,
    noNetworkLookupSmoke: !dryRun.productionNetworkLookupSmokeAllowed && !dryRun.networkQueryExecuted,
    noProductionMutationSmoke: !dryRun.productionMutationSmokeAllowed,
    noPrivateDataExposure: !dryRun.rawDeleteTokenExposed && !dryRun.rawAnswersExposed,
    noBlockedIntegrationSignals: scan.blockedIntegrationSignals.length === 0,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...dryRun.issues.map((issue) => `dry_run:${issue}`),
    ...scan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`),
    ...scan.publicPageDatabaseReadSignals.map((signal) => `public_page_database_read_signal:${signal}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-17-public-result-lookup-page-dry-run-contract',
      dryRunSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION
    },
    gates: finalGates,
    dryRun: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
      status: dryRun.status,
      preflightStatus: dryRun.preflightStatus,
      activeLookupStatus: dryRun.activeLookup?.viewStatus ?? null,
      activeLookupHttpStatus: dryRun.activeLookup?.httpStatus ?? null,
      readMissStatus: dryRun.readMissLookup?.viewStatus ?? null,
      readMissHttpStatus: dryRun.readMissLookup?.httpStatus ?? null,
      deletedLookupStatus: dryRun.deletedLookup?.viewStatus ?? null,
      deletedLookupHttpStatus: dryRun.deletedLookup?.httpStatus ?? null,
      expiredLookupStatus: dryRun.expiredLookup?.viewStatus ?? null,
      expiredLookupHttpStatus: dryRun.expiredLookup?.httpStatus ?? null,
      lookupSimulationPassed: dryRun.lookupSimulationPassed,
      executedQueryIntents: dryRun.executedQueryIntents,
      queryIntentExecutionCount: dryRun.queryIntentExecutionCount,
      actualPublicLookupPageBindingApplied: dryRun.actualPublicLookupPageBindingApplied,
      realPublicResultPageDatabaseReadExecuted: dryRun.realPublicResultPageDatabaseReadExecuted,
      networkQueryExecuted: dryRun.networkQueryExecuted,
      dryRunFlagEnv: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV,
      dryRunFlagRequiredValue: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED,
      rules: summarizePublicResultLookupPageDatabaseDryRunRules()
    },
    implementationScan: scan,
    coverage: {
      checkedFileCount: CHECKED_FILES.length,
      persistentRouteCount: scan.persistentPublicLookupRouteFiles.length,
      publicPageDatabaseReadSignalCount: scan.publicPageDatabaseReadSignals.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length
    },
    issues
  };
}

export function writePublicResultLookupPageDryRunContractEvidence(report: PublicResultLookupPageDryRunContractReport, evidencePath: string): void {
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
  if (isRecord(gates) && gates.overallPassed === true) return true;
  if (evidence.overallPassed === true) return true;
  return false;
}

function scanImplementation(repoRoot: string): PublicResultLookupPageDryRunContractReport['implementationScan'] {
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const checkedContents = CHECKED_FILES.map((relativePath) => ({ relativePath, content: readIfExists(path.join(repoRoot, relativePath)) }));
  const publicPreviewContent = readIfExists(path.join(repoRoot, PUBLIC_PREVIEW_PAGE));
  const publicPageDatabaseReadSignals = PUBLIC_PAGE_DATABASE_READ_SIGNALS.filter((signal) => publicPreviewContent.includes(signal));
  const blockedIntegrationSignals = BLOCKED_INTEGRATION_SIGNALS.filter((signal) =>
    checkedContents.some(({ content }) => content.includes(signal))
  );

  return {
    checkedFiles: CHECKED_FILES,
    persistentPublicLookupRouteFiles,
    publicPageDatabaseReadSignals,
    blockedIntegrationSignals
  };
}

function readIfExists(absolutePath: string): string {
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function gateIssues(gates: Record<string, boolean>): readonly string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([name]) => `gate_failed:${name}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
