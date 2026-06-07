import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildPublicResultDatabaseRouteRollbackFailureEvidenceReport,
  PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE,
  PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION
} from '../public-link/publicResultDatabaseRouteRollbackFailureEvidence';

export const DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_SCHEMA_VERSION =
  'phase-8.15-database-route-rollback-failure-evidence-pack-v1' as const;
export const DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_ID =
  'phase-8-database-route-rollback-failure-evidence-pack' as const;

export interface DatabaseRouteRollbackFailureEvidencePackOptions {
  readonly repoRoot?: string;
}

export interface DatabaseRouteRollbackFailureEvidencePackReport {
  readonly schemaVersion: typeof DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: typeof PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE;
    readonly coreSchemaVersion: typeof PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly apiRouteDatabaseBindingGatePassed: boolean;
    readonly rollbackFailureScriptExists: boolean;
    readonly rollbackFailureCoreModuleExists: boolean;
    readonly rollbackFailureReleaseModuleExists: boolean;
    readonly rollbackFailureDocExists: boolean;
    readonly rollbackFailureStatusDocExists: boolean;
    readonly validateRunsRollbackFailureEvidence: boolean;
    readonly routeHandlersNormalizeStorageFailures: boolean;
    readonly databaseAdapterDeleteFailureThrowsAfterVerifiedToken: boolean;
    readonly rollbackEvidencePassed: boolean;
    readonly missingEnvFailsClosed: boolean;
    readonly invalidEnvFailsClosed: boolean;
    readonly partialActivationFailsClosed: boolean;
    readonly databaseUnavailableModeled: boolean;
    readonly writeFailureModeled: boolean;
    readonly readMissModeled: boolean;
    readonly deleteTokenMismatchModeled: boolean;
    readonly deleteFailureModeled: boolean;
    readonly publicLookupStillBlocked: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryExecution: boolean;
    readonly noRawDeleteTokenPersistence: boolean;
    readonly noRawAnswersExposure: boolean;
    readonly overallPassed: boolean;
  };
  readonly evidence: Awaited<ReturnType<typeof buildPublicResultDatabaseRouteRollbackFailureEvidenceReport>>;
  readonly scan: {
    readonly checkedFiles: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly failureModeCount: number;
    readonly uniqueExecutedQueryIntentCount: number;
    readonly persistentRouteCount: number;
    readonly blockedIntegrationSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }

type EvidenceReport = Awaited<ReturnType<typeof buildPublicResultDatabaseRouteRollbackFailureEvidenceReport>>;

const SCRIPT_FILE = 'scripts/database-route-rollback-failure-evidence-pack.ts';
const CORE_MODULE = 'src/core/public-link/publicResultDatabaseRouteRollbackFailureEvidence.ts';
const RELEASE_MODULE = 'src/core/release/databaseRouteRollbackFailureEvidencePack.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const DATABASE_ADAPTER_MODULE = 'src/core/public-link/publicResultDatabaseStorageAdapter.ts';
const PUBLIC_HANDLER_DRY_RUN_MODULE = 'src/core/public-link/publicResultHandlerDryRun.ts';
const RELEASE_DOC = 'docs/release/phase-8-database-route-rollback-failure-evidence-pack.md';
const STATUS_DOC = 'docs/ui/phase-8-15-database-route-rollback-failure-evidence-pack-status.md';
const API_ROUTE_BINDING_EVIDENCE = 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json';
const CHECKED_FILES = [SCRIPT_FILE, CORE_MODULE, RELEASE_MODULE, ROUTE_HANDLERS_MODULE, DATABASE_ADAPTER_MODULE, PUBLIC_HANDLER_DRY_RUN_MODULE, RELEASE_DOC, STATUS_DOC] as const;
const PERSISTENT_PUBLIC_LOOKUP_ROUTES = ['src/app/r/[publicId]', 'src/app/r/[resultId]', 'src/app/r/[slug]', 'src/app/results/[publicId]', 'src/app/results/[resultId]'] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;

export async function runDatabaseRouteRollbackFailureEvidencePack(
  options: DatabaseRouteRollbackFailureEvidencePackOptions = {}
): Promise<DatabaseRouteRollbackFailureEvidencePackReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const apiRouteBindingEvidence = readEvidence(repoRoot, API_ROUTE_BINDING_EVIDENCE);
  const evidence = await buildPublicResultDatabaseRouteRollbackFailureEvidenceReport();
  const scan = scanRepo(repoRoot);
  const routeHandlersSource = readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE);
  const adapterSource = readOptionalFile(repoRoot, DATABASE_ADAPTER_MODULE);
  const handlerDryRunSource = readOptionalFile(repoRoot, PUBLIC_HANDLER_DRY_RUN_MODULE);

  const gates = {
    apiRouteDatabaseBindingGatePassed: evidencePassed(apiRouteBindingEvidence),
    rollbackFailureScriptExists: existsSync(path.join(repoRoot, SCRIPT_FILE)),
    rollbackFailureCoreModuleExists: existsSync(path.join(repoRoot, CORE_MODULE)),
    rollbackFailureReleaseModuleExists: existsSync(path.join(repoRoot, RELEASE_MODULE)),
    rollbackFailureDocExists: existsSync(path.join(repoRoot, RELEASE_DOC)),
    rollbackFailureStatusDocExists: existsSync(path.join(repoRoot, STATUS_DOC)),
    validateRunsRollbackFailureEvidence: validateScript.includes('npm run evidence:database-route-failures'),
    routeHandlersNormalizeStorageFailures: routeHandlersSource.includes('storageUnavailableRouteResponse') && handlerDryRunSource.includes("'storage-unavailable'"),
    databaseAdapterDeleteFailureThrowsAfterVerifiedToken: adapterSource.includes('delete returned no deleted row after token verification'),
    rollbackEvidencePassed: evidence.rollbackEvidencePassed,
    missingEnvFailsClosed: evidence.missingEnvCreateStatus === 500 && evidence.missingEnvStatus === 'api-route-database-binding-implementation-blocked',
    invalidEnvFailsClosed: evidence.invalidEnvCreateStatus === 500 && evidence.invalidEnvStatus === 'api-route-database-binding-implementation-blocked',
    partialActivationFailsClosed: evidence.partialActivationCreateStatus === 500 && evidence.partialActivationStatus === 'api-route-database-binding-implementation-blocked',
    databaseUnavailableModeled: evidence.databaseUnavailableCreateStatus === 500,
    writeFailureModeled: evidence.writeFailureCreateStatus === 500,
    readMissModeled: evidence.readMissStatus === 404,
    deleteTokenMismatchModeled: evidence.deleteTokenMismatchStatus === 403,
    deleteFailureModeled: evidence.deleteFailureStatus === 500,
    publicLookupStillBlocked: evidence.publicLookupStillBlocked,
    noProductionMutationSmoke: evidence.productionMutationSmokeAllowed === false,
    noNetworkQueryExecution: evidence.networkQueryExecuted === false,
    noRawDeleteTokenPersistence: evidence.rawDeleteTokenPersisted === false,
    noRawAnswersExposure: evidence.rawAnswersExposed === false,
    overallPassed: false
  };

  const gateEntries = Object.entries({ ...gates, overallPassed: true }).filter(([key]) => key !== 'overallPassed');
  const issues = [
    ...gateEntries.filter(([, value]) => value !== true).map(([key]) => `gate_failed:${key}`),
    ...evidence.issues.map((issue) => `evidence:${issue}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...scan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`)
  ];

  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_SCHEMA_VERSION,
    contractId: DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PACK_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE,
      coreSchemaVersion: PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION
    },
    gates: finalGates,
    evidence,
    scan,
    coverage: {
      checkedFileCount: scan.checkedFiles.length,
      failureModeCount: evidence.failureModes.length,
      uniqueExecutedQueryIntentCount: evidence.uniqueExecutedQueryIntents.length,
      persistentRouteCount: scan.persistentPublicLookupRouteFiles.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length
    },
    issues
  };
}

export function assertDatabaseRouteRollbackFailureEvidencePackPassed(
  report: DatabaseRouteRollbackFailureEvidencePackReport
): asserts report is DatabaseRouteRollbackFailureEvidencePackReport & { readonly issues: [] } {
  if (!report.gates.overallPassed || report.issues.length > 0) {
    throw new Error(`Database route rollback/failure evidence pack failed: ${report.issues.join(', ') || 'unknown'}`);
  }
}

export function writeDatabaseRouteRollbackFailureEvidencePack(
  report: DatabaseRouteRollbackFailureEvidencePackReport,
  repoRoot = process.cwd()
): string {
  const evidencePath = path.join(repoRoot, 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json');
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return evidencePath;
}

function scanRepo(repoRoot: string) {
  const checkedFiles = CHECKED_FILES.filter((file) => existsSync(path.join(repoRoot, file)));
  const persistentPublicLookupRouteFiles = PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((file) => existsSync(path.join(repoRoot, file)));
  const checkedContent = checkedFiles.filter((file) => file !== RELEASE_MODULE).map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedIntegrationSignals = BLOCKED_INTEGRATION_SIGNALS.filter((signal) => checkedContent.includes(signal));
  return { checkedFiles, persistentPublicLookupRouteFiles, blockedIntegrationSignals };
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
  } catch {
    return {};
  }
}

function readEvidence(repoRoot: string, relativePath: string): unknown {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8')) as unknown;
  } catch {
    return null;
  }
}

function evidencePassed(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.gates && typeof record.gates === 'object') {
    return (record.gates as Record<string, unknown>).overallPassed === true;
  }
  return record.overallPassed === true || (Array.isArray(record.issues) && record.issues.length === 0);
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  try {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}
