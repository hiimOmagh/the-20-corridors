import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runBackendHandlerDryRunContract } from './backendHandlerDryRunContract';
import { runBackendRouteHandlersContract } from './backendRouteHandlersContract';
import { runBackendRouteRuntimeSmokeContract } from './backendRouteRuntimeSmokeContract';
import { runBackendRouteSkeletonGuard } from './backendRouteSkeletonGuard';
import { runPublicResultApiBoundaryContract } from './publicResultApiBoundaryContract';

export const PHASE_7_CLOSURE_SCHEMA_VERSION = 'phase-7.5-backend-route-closure-gate-v1' as const;
export const PHASE_7_CLOSURE_ID = 'phase-7-backend-route-closure-gate' as const;

export interface Phase7ClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase7ClosureGateReport {
  readonly schemaVersion: typeof PHASE_7_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_7_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-7-backend-route-closure';
    readonly backendApiBoundarySchemaVersion: string;
    readonly backendRouteSkeletonSchemaVersion: string;
    readonly backendHandlerDryRunSchemaVersion: string;
    readonly backendRouteHandlersSchemaVersion: string;
    readonly backendRuntimeSmokeSchemaVersion: string;
  };
  readonly gates: {
    readonly backendApiBoundaryPassed: boolean;
    readonly backendRouteSkeletonPassed: boolean;
    readonly backendHandlerDryRunPassed: boolean;
    readonly backendRouteHandlersPassed: boolean;
    readonly backendRouteRuntimeSmokePassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase7ClosureGate: boolean;
    readonly validateScriptRunsBackendApiBoundary: boolean;
    readonly validateScriptRunsBackendRouteSkeleton: boolean;
    readonly validateScriptRunsBackendDryRun: boolean;
    readonly validateScriptRunsBackendRouteHandlers: boolean;
    readonly validateScriptRunsBackendRuntimeSmoke: boolean;
    readonly phase7ClosureReviewDocExists: boolean;
    readonly phase7ClosureCriteriaDocExists: boolean;
    readonly phase8TransitionDocExists: boolean;
    readonly approvedApiRouteSurfacePreserved: boolean;
    readonly dtoOnlyRuntimeTransportPreserved: boolean;
    readonly noRawAnswerOrFullResultTransport: boolean;
    readonly noDatabaseAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly routeResponseStatusMappingPreserved: boolean;
    readonly deleteTokenTransportPreserved: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase7ClosureReview: string;
    readonly phase7ClosureCriteria: string;
    readonly phase8Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly backendApiBoundary?: string;
    readonly backendRouteSkeleton?: string;
    readonly backendDryRun?: string;
    readonly backendRouteHandlers?: string;
    readonly backendRuntimeSmoke?: string;
    readonly closurePhase7?: string;
  };
  readonly coverage: {
    readonly backendApiBoundaryIssueCount: number;
    readonly backendRouteSkeletonIssueCount: number;
    readonly backendHandlerDryRunIssueCount: number;
    readonly backendRouteHandlersIssueCount: number;
    readonly backendRuntimeSmokeIssueCount: number;
    readonly checkedFileCount: number;
    readonly apiRouteFileCount: number;
    readonly blockedPathCount: number;
    readonly persistentPublicLookupRouteCount: number;
    readonly blockedSignalCount: number;
    readonly rawOrFullResultSignalCount: number;
  };
  readonly files: {
    readonly collectionRoute: string;
    readonly itemRoute: string;
    readonly routeHandlers: string;
    readonly runtimeSmoke: string;
    readonly phase7ClosureReview: string;
    readonly phase8Transition: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly apiRouteFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrFullResultSignals: readonly string[];
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const COLLECTION_ROUTE = 'src/app/api/public-results/route.ts';
const ITEM_ROUTE = 'src/app/api/public-results/[publicId]/route.ts';
const ROUTE_HANDLERS = 'src/core/public-link/publicResultRouteHandlers.ts';
const DRY_RUN_HANDLERS = 'src/core/public-link/publicResultHandlerDryRun.ts';
const API_DTOS = 'src/core/public-link/publicResultApi.ts';
const STORAGE_ADAPTER = 'src/core/public-link/inMemoryPublicResultStorage.ts';
const RUNTIME_SMOKE = 'src/core/release/backendRouteRuntimeSmokeContract.ts';
const PHASE_7_CLOSURE_REVIEW_DOC = 'docs/release/phase-7-closure-review.md';
const PHASE_7_CLOSURE_CRITERIA_DOC = 'docs/release/phase-7-closure-criteria.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  COLLECTION_ROUTE,
  ITEM_ROUTE,
  ROUTE_HANDLERS,
  DRY_RUN_HANDLERS,
  API_DTOS,
  STORAGE_ADAPTER,
  RUNTIME_SMOKE,
  'docs/release/phase-7-backend-api-boundary-contract.md',
  'docs/release/phase-7-backend-route-skeleton-guard.md',
  'docs/release/phase-7-backend-handler-dry-run-adapter.md',
  'docs/release/phase-7-backend-route-handlers-dry-run.md',
  'docs/release/phase-7-backend-route-runtime-smoke-contract.md',
  PHASE_7_CLOSURE_CRITERIA_DOC,
  PHASE_7_CLOSURE_REVIEW_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const API_ROUTE_FILES = [COLLECTION_ROUTE, ITEM_ROUTE] as const;
const IMPLEMENTATION_SCAN_FILES = [COLLECTION_ROUTE, ITEM_ROUTE, ROUTE_HANDLERS, DRY_RUN_HANDLERS, API_DTOS, STORAGE_ADAPTER] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/server/database',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'src/auth',
  'src/payments',
  'src/ai',
  'src/analytics'
] as const;

const PERSISTENT_PUBLIC_LOOKUP_ROUTES = [
  'src/app/r/[publicId]',
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[publicId]',
  'src/app/results/[resultId]'
] as const;

const BLOCKED_IMPLEMENTATION_SIGNALS = [
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect',
  'database.write',
  'db.insert',
  'db.select',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'posthog.capture',
  'analytics.track'
] as const;

const RAW_OR_FULL_RESULT_SIGNALS = [
  'raw' + 'Answers',
  'question' + 'Answers',
  'selected' + 'Answer',
  'answer' + 'Text',
  'question' + 'Id',
  'tag' + 'Scores',
  'axis' + 'ScoresRaw',
  'private' + 'ReportSeed',
  'session' + 'StorageEnvelope',
  'serializeCorridorsResult',
  'SerializedCorridorsResultEnvelope'
] as const;

export async function runPhase7ClosureGate(options: Phase7ClosureGateOptions = {}): Promise<Phase7ClosureGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validate = packageJson.scripts?.validate ?? '';
  const backendApi = await runPublicResultApiBoundaryContract({ repoRoot });
  const routeSkeleton = await runBackendRouteSkeletonGuard({ repoRoot });
  const dryRun = await runBackendHandlerDryRunContract({ repoRoot });
  const routeHandlers = await runBackendRouteHandlersContract({ repoRoot });
  const runtimeSmoke = await runBackendRouteRuntimeSmokeContract({ repoRoot });
  const source = IMPLEMENTATION_SCAN_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const blockedSignals = findSignals(source, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrFullResultSignals = findSignals(source, RAW_OR_FULL_RESULT_SIGNALS);
  const apiRouteFiles = API_ROUTE_FILES.filter((file) => existsSync(path.join(repoRoot, file)));

  const gates = {
    backendApiBoundaryPassed: backendApi.gates.overallPassed,
    backendRouteSkeletonPassed: routeSkeleton.gates.overallPassed,
    backendHandlerDryRunPassed: dryRun.gates.overallPassed,
    backendRouteHandlersPassed: routeHandlers.gates.overallPassed,
    backendRouteRuntimeSmokePassed: runtimeSmoke.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase7'] === 'tsx scripts/phase7-closure-gate.ts',
    validateScriptRunsPhase7ClosureGate: validate.includes('npm run closure:phase7'),
    validateScriptRunsBackendApiBoundary: validate.includes('npm run contract:backend-api'),
    validateScriptRunsBackendRouteSkeleton: validate.includes('npm run guard:backend-routes'),
    validateScriptRunsBackendDryRun: validate.includes('npm run dryrun:backend-handlers'),
    validateScriptRunsBackendRouteHandlers: validate.includes('npm run routes:backend-handlers'),
    validateScriptRunsBackendRuntimeSmoke: validate.includes('npm run smoke:backend-routes'),
    phase7ClosureReviewDocExists: existsSync(path.join(repoRoot, PHASE_7_CLOSURE_REVIEW_DOC)),
    phase7ClosureCriteriaDocExists: existsSync(path.join(repoRoot, PHASE_7_CLOSURE_CRITERIA_DOC)),
    phase8TransitionDocExists: existsSync(path.join(repoRoot, PHASE_8_TRANSITION_DOC)),
    approvedApiRouteSurfacePreserved: apiRouteFiles.length === 2 && routeSkeleton.implementationScan.actualRouteFiles.length === 2 && routeSkeleton.implementationScan.requestHandlerSignals.length === 3,
    dtoOnlyRuntimeTransportPreserved: runtimeSmoke.gates.dtoOnlyRuntimeResponsesPreserved === true,
    noRawAnswerOrFullResultTransport: runtimeSmoke.gates.noRawAnswerOrFullResultTransport === true && rawOrFullResultSignals.length === 0,
    noDatabaseAuthPaymentAiAnalyticsImplementation: runtimeSmoke.gates.noDatabaseAuthPaymentAiAnalyticsImplementation === true && blockedPaths.length === 0 && blockedSignals.length === 0,
    noPersistentPublicLookupRoute: runtimeSmoke.gates.noPersistentPublicLookupRoute === true && persistentPublicLookupRouteFiles.length === 0,
    routeResponseStatusMappingPreserved: runtimeSmoke.gates.statusMappingPreserved === true && runtimeSmoke.gates.createReadDeleteRuntimeFlowPassed === true,
    deleteTokenTransportPreserved: runtimeSmoke.gates.deleteTokenTransportPreserved === true,
    overallPassed: false
  };

  const complete = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_7_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_7_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-7-backend-route-closure',
      backendApiBoundarySchemaVersion: backendApi.schemaVersion,
      backendRouteSkeletonSchemaVersion: routeSkeleton.schemaVersion,
      backendHandlerDryRunSchemaVersion: dryRun.schemaVersion,
      backendRouteHandlersSchemaVersion: routeHandlers.schemaVersion,
      backendRuntimeSmokeSchemaVersion: runtimeSmoke.schemaVersion
    },
    gates: complete,
    docs: {
      phase7ClosureReview: PHASE_7_CLOSURE_REVIEW_DOC,
      phase7ClosureCriteria: PHASE_7_CLOSURE_CRITERIA_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      backendApiBoundaryIssueCount: backendApi.issues.length,
      backendRouteSkeletonIssueCount: routeSkeleton.issues.length,
      backendHandlerDryRunIssueCount: dryRun.issues.length,
      backendRouteHandlersIssueCount: routeHandlers.issues.length,
      backendRuntimeSmokeIssueCount: runtimeSmoke.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      apiRouteFileCount: apiRouteFiles.length,
      blockedPathCount: blockedPaths.length,
      persistentPublicLookupRouteCount: persistentPublicLookupRouteFiles.length,
      blockedSignalCount: blockedSignals.length,
      rawOrFullResultSignalCount: rawOrFullResultSignals.length
    },
    files: {
      collectionRoute: COLLECTION_ROUTE,
      itemRoute: ITEM_ROUTE,
      routeHandlers: ROUTE_HANDLERS,
      runtimeSmoke: RUNTIME_SMOKE,
      phase7ClosureReview: PHASE_7_CLOSURE_REVIEW_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      apiRouteFiles,
      blockedPaths,
      persistentPublicLookupRouteFiles,
      blockedSignals,
      rawOrFullResultSignals
    },
    issues: buildIssues(complete, {
      backendApiIssues: backendApi.issues,
      routeSkeletonIssues: routeSkeleton.issues,
      dryRunIssues: dryRun.issues,
      routeHandlerIssues: routeHandlers.issues,
      runtimeSmokeIssues: runtimeSmoke.issues,
      blockedPaths,
      persistentPublicLookupRouteFiles,
      blockedSignals,
      rawOrFullResultSignals
    })
  };
}

export function writePhase7ClosureEvidence(report: Phase7ClosureGateReport, outputPath = 'docs/evidence/phase7-closure-latest.json'): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase7ClosureGateReport['scripts'] {
  const scripts: {
    validate?: string;
    backendApiBoundary?: string;
    backendRouteSkeleton?: string;
    backendDryRun?: string;
    backendRouteHandlers?: string;
    backendRuntimeSmoke?: string;
    closurePhase7?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:backend-api'] !== undefined) scripts.backendApiBoundary = packageJson.scripts['contract:backend-api'];
  if (packageJson.scripts?.['guard:backend-routes'] !== undefined) scripts.backendRouteSkeleton = packageJson.scripts['guard:backend-routes'];
  if (packageJson.scripts?.['dryrun:backend-handlers'] !== undefined) scripts.backendDryRun = packageJson.scripts['dryrun:backend-handlers'];
  if (packageJson.scripts?.['routes:backend-handlers'] !== undefined) scripts.backendRouteHandlers = packageJson.scripts['routes:backend-handlers'];
  if (packageJson.scripts?.['smoke:backend-routes'] !== undefined) scripts.backendRuntimeSmoke = packageJson.scripts['smoke:backend-routes'];
  if (packageJson.scripts?.['closure:phase7'] !== undefined) scripts.closurePhase7 = packageJson.scripts['closure:phase7'];
  return scripts;
}

function buildIssues(
  gates: Phase7ClosureGateReport['gates'],
  nested: {
    readonly backendApiIssues: readonly string[];
    readonly routeSkeletonIssues: readonly string[];
    readonly dryRunIssues: readonly string[];
    readonly routeHandlerIssues: readonly string[];
    readonly runtimeSmokeIssues: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawOrFullResultSignals: readonly string[];
  }
): string[] {
  const issues: string[] = [];
  if (!gates.backendApiBoundaryPassed) issues.push(...nested.backendApiIssues.map((issue) => `backend_api:${issue}`));
  if (!gates.backendRouteSkeletonPassed) issues.push(...nested.routeSkeletonIssues.map((issue) => `route_skeleton:${issue}`));
  if (!gates.backendHandlerDryRunPassed) issues.push(...nested.dryRunIssues.map((issue) => `dry_run:${issue}`));
  if (!gates.backendRouteHandlersPassed) issues.push(...nested.routeHandlerIssues.map((issue) => `route_handlers:${issue}`));
  if (!gates.backendRouteRuntimeSmokePassed) issues.push(...nested.runtimeSmokeIssues.map((issue) => `runtime_smoke:${issue}`));
  if (!gates.closureScriptExists) issues.push('missing_closure_phase7_script');
  if (!gates.validateScriptRunsPhase7ClosureGate) issues.push('validate_does_not_run_phase7_closure_gate');
  if (!gates.validateScriptRunsBackendApiBoundary) issues.push('validate_does_not_run_backend_api_boundary_contract');
  if (!gates.validateScriptRunsBackendRouteSkeleton) issues.push('validate_does_not_run_backend_route_skeleton_guard');
  if (!gates.validateScriptRunsBackendDryRun) issues.push('validate_does_not_run_backend_handler_dry_run_contract');
  if (!gates.validateScriptRunsBackendRouteHandlers) issues.push('validate_does_not_run_backend_route_handlers_contract');
  if (!gates.validateScriptRunsBackendRuntimeSmoke) issues.push('validate_does_not_run_backend_runtime_smoke_contract');
  if (!gates.phase7ClosureReviewDocExists) issues.push(`missing_phase7_closure_review:${PHASE_7_CLOSURE_REVIEW_DOC}`);
  if (!gates.phase7ClosureCriteriaDocExists) issues.push(`missing_phase7_closure_criteria:${PHASE_7_CLOSURE_CRITERIA_DOC}`);
  if (!gates.phase8TransitionDocExists) issues.push(`missing_phase8_transition_plan:${PHASE_8_TRANSITION_DOC}`);
  if (!gates.approvedApiRouteSurfacePreserved) issues.push('approved_api_route_surface_not_preserved');
  if (!gates.dtoOnlyRuntimeTransportPreserved) issues.push('dto_only_runtime_transport_not_preserved');
  for (const item of nested.blockedPaths) issues.push(`blocked_path:${item}`);
  for (const item of nested.persistentPublicLookupRouteFiles) issues.push(`persistent_public_lookup_route:${item}`);
  for (const item of nested.blockedSignals) issues.push(`blocked_signal:${item}`);
  for (const item of nested.rawOrFullResultSignals) issues.push(`raw_or_full_result_signal:${item}`);
  if (!gates.routeResponseStatusMappingPreserved) issues.push('route_response_status_mapping_not_preserved');
  if (!gates.deleteTokenTransportPreserved) issues.push('delete_token_transport_not_preserved');
  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packagePath = path.join(repoRoot, 'package.json');
  return existsSync(packagePath) ? (JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonSubset) : {};
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
}

function findSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => source.includes(signal));
}
