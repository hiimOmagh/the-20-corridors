import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
  import path from 'node:path';
  import {
    containsBlockedPublicResultRouteSkeletonText,
    listPublicResultRouteSkeletonFiles,
    listPublicResultRouteSkeletonMethods,
    PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_PUBLIC_PATHS,
    PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR,
    PUBLIC_RESULT_ROUTE_SKELETON_MODE,
    PUBLIC_RESULT_ROUTE_SKELETON_POLICY,
    PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS,
    PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY,
    PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION
  } from '../public-link/publicResultRouteSkeleton';
  import { runPublicResultApiBoundaryContract } from './publicResultApiBoundaryContract';

  export const BACKEND_ROUTE_SKELETON_GUARD_SCHEMA_VERSION = 'phase-7.1-backend-route-skeleton-guard-v1' as const;
  export const BACKEND_ROUTE_SKELETON_GUARD_ID = 'phase-7-backend-route-skeleton-guard' as const;

  export interface BackendRouteSkeletonGuardOptions {
    readonly repoRoot?: string;
  }

  export interface BackendRouteSkeletonGuardReport {
    readonly schemaVersion: typeof BACKEND_ROUTE_SKELETON_GUARD_SCHEMA_VERSION;
    readonly guardId: typeof BACKEND_ROUTE_SKELETON_GUARD_ID;
    readonly metadata: {
      readonly checkedAt: 'static';
      readonly repoRootName: string;
      readonly phaseScope: 'phase-7-route-skeleton-guard-only';
      readonly apiBoundarySchemaVersion: string;
      readonly routeSkeletonSchemaVersion: typeof PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION;
      readonly implementationMode: typeof PUBLIC_RESULT_ROUTE_SKELETON_MODE;
    };
    readonly gates: {
      readonly backendApiBoundaryPassed: boolean;
      readonly routeSkeletonGuardScriptExists: boolean;
      readonly validateScriptRunsRouteSkeletonGuard: boolean;
      readonly routeSkeletonModuleExists: boolean;
      readonly routeSkeletonDocExists: boolean;
      readonly phase71StatusDocExists: boolean;
      readonly plannedRouteFilesDefined: boolean;
      readonly plannedMethodsMatchApiContract: boolean;
      readonly requestHandlingBoundaryDefined: boolean;
      readonly futureGuardExpectationsDefined: boolean;
      readonly noActualRouteFilesYet: boolean;
      readonly noRequestHandlersYet: boolean;
      readonly noBackendApiDatabaseAuthPaymentAiAnalyticsImplementation: boolean;
      readonly noPersistentPublicLookupRoute: boolean;
      readonly noRawAnswerOrFullResultTransport: boolean;
      readonly overallPassed: boolean;
    };
    readonly docs: {
      readonly routeSkeletonGuard: string;
      readonly phase71Status: string;
    };
    readonly scripts: {
      readonly validate?: string;
      readonly routeSkeletonGuard: string | undefined;
      readonly backendApiBoundary: string | undefined;
    };
    readonly routeSkeleton: {
      readonly plannedRouteFiles: readonly string[];
      readonly plannedPublicPaths: readonly string[];
      readonly plannedMethods: readonly string[];
      readonly requestHandlingBoundaryCount: number;
      readonly blockedBehaviorCount: number;
      readonly futureGuardCount: number;
    };
    readonly implementationScan: {
      readonly checkedFiles: readonly string[];
      readonly actualRouteFiles: readonly string[];
      readonly blockedScopePaths: readonly string[];
      readonly persistentRouteFiles: readonly string[];
      readonly requestHandlerSignals: readonly string[];
      readonly blockedImplementationSignals: readonly string[];
      readonly rawOrFullResultSignals: readonly string[];
      readonly missingContractPhrases: readonly string[];
    };
    readonly coverage: {
      readonly backendApiBoundaryIssueCount: number;
      readonly plannedRouteFileCount: number;
      readonly plannedMethodCount: number;
      readonly checkedFileCount: number;
      readonly actualRouteFileCount: number;
    };
    readonly issues: readonly string[];
  }

  interface PackageJsonSubset {
    readonly scripts?: Record<string, string>;
  }

  const ROUTE_SKELETON_MODULE = 'src/core/public-link/publicResultRouteSkeleton.ts';
  const ROUTE_SKELETON_DOC = 'docs/release/phase-7-backend-route-skeleton-guard.md';
  const PHASE_7_1_STATUS_DOC = 'docs/ui/phase-7-1-backend-route-skeleton-guard-status.md';

  const CHECKED_FILES = [
    ROUTE_SKELETON_MODULE,
    ROUTE_SKELETON_DOC,
    PHASE_7_1_STATUS_DOC,
    'src/core/public-link/publicResultApi.ts',
    'src/core/release/publicResultApiBoundaryContract.ts'
  ] as const;

  const BLOCKED_SCOPE_PATHS = [
    'src/server',
    'src/backend',
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

  const PERSISTENT_PUBLIC_LOOKUP_ROUTE_PATHS = [
    'src/app/r/[resultId]',
    'src/app/r/[publicId]',
    'src/app/r/[slug]',
    'src/app/results/[resultId]'
  ] as const;

  const REQUEST_HANDLER_SIGNALS = [
    'export async function POST',
    'export async function GET',
    'export async function DELETE',
    'export const POST',
    'export const GET',
    'export const DELETE',
    'NextResponse.json',
    'request.json()',
    'headers()',
    'cookies()'
  ] as const;

  const BLOCKED_IMPLEMENTATION_SIGNALS = [
    'fetch(',
    'XMLHttpRequest',
    'navigator.sendBeacon',
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
    'tag' + 'Scores',
    'evidence' + 'Digest',
    'SerializedCorridorsResultEnvelope',
    'serializeCorridorsResult',
    'sourceResult',
    'runCorridorsEngine(input)'
  ] as const;

  const REQUIRED_CONTRACT_PHRASES = [
    'allowed route files',
    'blocked request handling behavior',
    'no request handlers in Phase 7.1',
    'no database writes in Phase 7.1',
    'no raw-answer transport',
    'future route implementation guards'
  ] as const;

  export async function runBackendRouteSkeletonGuard(
    options: BackendRouteSkeletonGuardOptions = {}
  ): Promise<BackendRouteSkeletonGuardReport> {
    const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
    const packageJson = readPackageJson(repoRoot);
    const validateScript = packageJson.scripts?.validate ?? '';
    const apiBoundary = await runPublicResultApiBoundaryContract({ repoRoot });
    const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
    const skeletonSource = readOptionalFile(repoRoot, ROUTE_SKELETON_MODULE);
    const contractDoc = readOptionalFile(repoRoot, ROUTE_SKELETON_DOC);
    const actualRouteFiles = existingPaths(repoRoot, listPublicResultRouteSkeletonFiles());
    const blockedScopePaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
    const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTE_PATHS);
    const actualRouteSource = actualRouteFiles.map((file) => readOptionalFile(repoRoot, file)).join('\n');
    const requestHandlerSignals = findSignals(actualRouteSource, REQUEST_HANDLER_SIGNALS);
    const blockedImplementationSignals = findSignals(actualRouteSource, BLOCKED_IMPLEMENTATION_SIGNALS);
    const rawOrFullResultSignals = findSignals(actualRouteSource, RAW_OR_FULL_RESULT_SIGNALS);
    const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);

    const plannedMethods = listPublicResultRouteSkeletonMethods();
    const gates = {
      backendApiBoundaryPassed: apiBoundary.gates.overallPassed,
      routeSkeletonGuardScriptExists: packageJson.scripts?.['guard:backend-routes'] === 'tsx scripts/backend-route-skeleton-guard.ts',
      validateScriptRunsRouteSkeletonGuard: validateScript.includes('npm run guard:backend-routes'),
      routeSkeletonModuleExists: existsSync(path.join(repoRoot, ROUTE_SKELETON_MODULE)),
      routeSkeletonDocExists: existsSync(path.join(repoRoot, ROUTE_SKELETON_DOC)),
      phase71StatusDocExists: existsSync(path.join(repoRoot, PHASE_7_1_STATUS_DOC)),
      plannedRouteFilesDefined:
        PUBLIC_RESULT_ROUTE_SKELETON_POLICY.definitions.length === 2 &&
        listPublicResultRouteSkeletonFiles().every((file) => file.startsWith('src/app/api/public-results')),
      plannedMethodsMatchApiContract: plannedMethods.join('|') === ['POST', 'GET', 'DELETE'].join('|'),
      requestHandlingBoundaryDefined:
        PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY.length >= 6 &&
        PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR.length >= 8,
      futureGuardExpectationsDefined: PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS.length >= 7,
      noActualRouteFilesYet: actualRouteFiles.length === 0,
      noRequestHandlersYet: requestHandlerSignals.length === 0 && !containsBlockedPublicResultRouteSkeletonText(actualRouteSource),
      noBackendApiDatabaseAuthPaymentAiAnalyticsImplementation: blockedScopePaths.length === 0 && blockedImplementationSignals.length === 0,
      noPersistentPublicLookupRoute: persistentRouteFiles.length === 0,
      noRawAnswerOrFullResultTransport: rawOrFullResultSignals.length === 0,
      overallPassed: false
    };

    const completeGates = {
      ...gates,
      overallPassed: Object.entries(gates)
        .filter(([key]) => key !== 'overallPassed')
        .every(([, value]) => value === true)
    };

    const issues = buildIssues(completeGates, missingContractPhrases);

    return {
      schemaVersion: BACKEND_ROUTE_SKELETON_GUARD_SCHEMA_VERSION,
      guardId: BACKEND_ROUTE_SKELETON_GUARD_ID,
      metadata: {
        checkedAt: 'static',
        repoRootName: path.basename(repoRoot) || 'repository',
        phaseScope: 'phase-7-route-skeleton-guard-only',
        apiBoundarySchemaVersion: apiBoundary.schemaVersion,
        routeSkeletonSchemaVersion: PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION,
        implementationMode: PUBLIC_RESULT_ROUTE_SKELETON_MODE
      },
      gates: completeGates,
      docs: {
        routeSkeletonGuard: ROUTE_SKELETON_DOC,
        phase71Status: PHASE_7_1_STATUS_DOC
      },
      scripts: {
        validate: validateScript,
        routeSkeletonGuard: packageJson.scripts?.['guard:backend-routes'],
        backendApiBoundary: packageJson.scripts?.['contract:backend-api']
      },
      routeSkeleton: {
        plannedRouteFiles: listPublicResultRouteSkeletonFiles(),
        plannedPublicPaths: PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_PUBLIC_PATHS,
        plannedMethods,
        requestHandlingBoundaryCount: PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY.length,
        blockedBehaviorCount: PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR.length,
        futureGuardCount: PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS.length
      },
      implementationScan: {
        checkedFiles: CHECKED_FILES,
        actualRouteFiles,
        blockedScopePaths,
        persistentRouteFiles,
        requestHandlerSignals,
        blockedImplementationSignals,
        rawOrFullResultSignals,
        missingContractPhrases
      },
      coverage: {
        backendApiBoundaryIssueCount: apiBoundary.issues.length,
        plannedRouteFileCount: listPublicResultRouteSkeletonFiles().length,
        plannedMethodCount: plannedMethods.length,
        checkedFileCount: CHECKED_FILES.length,
        actualRouteFileCount: actualRouteFiles.length
      },
      issues
    };
  }

  export function writeBackendRouteSkeletonGuardEvidence(
    report: BackendRouteSkeletonGuardReport,
    outputPath = 'docs/evidence/backend-route-skeleton-latest.json'
  ): void {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}
`);
  }

  function buildIssues(
    gates: BackendRouteSkeletonGuardReport['gates'],
    missingContractPhrases: readonly string[]
  ): readonly string[] {
    const issues: string[] = [];
    if (!gates.backendApiBoundaryPassed) issues.push('backend_api_boundary_failed');
    if (!gates.routeSkeletonGuardScriptExists) issues.push('missing_guard_backend_routes_script');
    if (!gates.validateScriptRunsRouteSkeletonGuard) issues.push('validate_missing_backend_route_skeleton_guard');
    if (!gates.routeSkeletonModuleExists) issues.push('missing_public_result_route_skeleton_module');
    if (!gates.routeSkeletonDocExists) issues.push('missing_phase_7_1_route_skeleton_doc');
    if (!gates.phase71StatusDocExists) issues.push('missing_phase_7_1_status_doc');
    if (!gates.plannedRouteFilesDefined) issues.push('planned_route_files_not_defined');
    if (!gates.plannedMethodsMatchApiContract) issues.push('planned_methods_do_not_match_api_contract');
    if (!gates.requestHandlingBoundaryDefined) issues.push('request_handling_boundary_not_defined');
    if (!gates.futureGuardExpectationsDefined) issues.push('future_route_guards_not_defined');
    if (!gates.noActualRouteFilesYet) issues.push('actual_route_files_created_too_early');
    if (!gates.noRequestHandlersYet) issues.push('request_handlers_created_too_early');
    if (!gates.noBackendApiDatabaseAuthPaymentAiAnalyticsImplementation) issues.push('blocked_backend_scope_detected');
    if (!gates.noPersistentPublicLookupRoute) issues.push('persistent_public_lookup_route_created_too_early');
    if (!gates.noRawAnswerOrFullResultTransport) issues.push('raw_or_full_result_route_transport_detected');
    for (const phrase of missingContractPhrases) issues.push(`missing_contract_phrase:${phrase}`);
    return issues;
  }

  function readPackageJson(repoRoot: string): PackageJsonSubset {
    const packagePath = path.join(repoRoot, 'package.json');
    if (!existsSync(packagePath)) return {};
    return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonSubset;
  }

  function readOptionalFile(repoRoot: string, relativePath: string): string {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) return '';
    return readFileSync(absolutePath, 'utf8');
  }

  function existingPaths(repoRoot: string, relativePaths: readonly string[]): readonly string[] {
    return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  }

  function findSignals(source: string, signals: readonly string[]): readonly string[] {
    return signals.filter((signal) => source.includes(signal));
  }

  function missingSignals(source: string, signals: readonly string[]): readonly string[] {
    return signals.filter((signal) => !source.includes(signal));
  }
