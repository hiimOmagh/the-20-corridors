import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto, containsForbiddenPublicResultApiPayloadKeys } from '../public-link/publicResultApi';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import { createInMemoryPublicResultStorageAdapter } from '../public-link/inMemoryPublicResultStorage';
import {
  PUBLIC_RESULT_ROUTE_HANDLER_BOUNDARIES,
  PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
  PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION,
  handlePublicResultCreateRouteBody,
  handlePublicResultDeleteRouteBody,
  handlePublicResultReadRoute,
  summarizePublicResultRouteHandlerBoundaries
} from '../public-link/publicResultRouteHandlers';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../public-link/publicResultStorage';
import { runBackendHandlerDryRunContract } from './backendHandlerDryRunContract';

export const BACKEND_ROUTE_HANDLERS_CONTRACT_SCHEMA_VERSION = 'phase-7.3-backend-route-handlers-contract-v1' as const;
export const BACKEND_ROUTE_HANDLERS_CONTRACT_ID = 'phase-7-backend-route-handlers-contract' as const;

export interface BackendRouteHandlersContractOptions {
  readonly repoRoot?: string;
}

export interface BackendRouteHandlersContractReport {
  readonly schemaVersion: typeof BACKEND_ROUTE_HANDLERS_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof BACKEND_ROUTE_HANDLERS_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-7-actual-route-files-dry-run-handlers';
    readonly dryRunContractSchemaVersion: string;
    readonly routeHandlerSchemaVersion: typeof PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION;
    readonly implementationMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly backendHandlerDryRunContractPassed: boolean;
    readonly routeHandlerScriptExists: boolean;
    readonly validateScriptRunsRouteHandlerContract: boolean;
    readonly routeHandlerModuleExists: boolean;
    readonly routeHandlerContractDocExists: boolean;
    readonly phase73StatusDocExists: boolean;
    readonly approvedRouteFilesExist: boolean;
    readonly routeFilesExportExpectedMethods: boolean;
    readonly routeFilesUseDryRunRouteHelpers: boolean;
    readonly routeHelpersRunCreateReadDeleteFlow: boolean;
    readonly invalidDeleteTokenHandled: boolean;
    readonly dtoOnlyResponsesPreserved: boolean;
    readonly routeResponseStatusCodesMapped: boolean;
    readonly noDatabaseAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noRawAnswerOrFullResultTransport: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly routeHandlerContract: string;
    readonly phase73Status: string;
  };
  readonly scripts: {
    readonly validate: string;
    readonly routeHandlerContract: string | undefined;
    readonly backendHandlerDryRun: string | undefined;
  };
  readonly routes: {
    readonly collectionRouteFile: string;
    readonly itemRouteFile: string;
    readonly exportedMethodSignals: readonly string[];
    readonly routeHelperSignals: readonly string[];
  };
  readonly dryRunRouteFlow: {
    readonly mode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
    readonly boundaryCount: number;
    readonly createStatus: number;
    readonly readStatus: number;
    readonly wrongDeleteStatus: number;
    readonly deleteStatus: number;
    readonly readAfterDeleteStatus: number;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedImplementationSignals: readonly string[];
    readonly rawOrFullResultSignals: readonly string[];
    readonly persistentRouteFiles: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly dryRunContractIssueCount: number;
    readonly checkedFileCount: number;
    readonly routeFileCount: number;
    readonly routeHandlerBoundaryCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const ROUTE_HANDLER_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const COLLECTION_ROUTE_FILE = 'src/app/api/public-results/route.ts';
const ITEM_ROUTE_FILE = 'src/app/api/public-results/[publicId]/route.ts';
const ROUTE_HANDLER_CONTRACT_DOC = 'docs/release/phase-7-backend-route-handlers-dry-run.md';
const PHASE_7_3_STATUS_DOC = 'docs/ui/phase-7-3-backend-route-files-with-dry-run-handlers-status.md';

const CHECKED_FILES = [
  ROUTE_HANDLER_MODULE,
  COLLECTION_ROUTE_FILE,
  ITEM_ROUTE_FILE,
  ROUTE_HANDLER_CONTRACT_DOC,
  PHASE_7_3_STATUS_DOC,
  'src/core/public-link/publicResultHandlerDryRun.ts',
  'src/core/public-link/publicResultApi.ts'
] as const;

const EXPORTED_METHOD_SIGNALS = [
  'export async function POST',
  'export async function GET',
  'export async function DELETE'
] as const;

const ROUTE_HELPER_SIGNALS = [
  'handlePublicResultCreateRouteBody',
  'handlePublicResultReadRoute',
  'handlePublicResultDeleteRouteBody'
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
  'analytics.track',
  'localStorage.setItem',
  'indexedDB.open'
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
  'evidence' + 'Digest',
  'evidence' + 'Refs',
  'serializeCorridorsResult',
  'SerializedCorridorsResultEnvelope'
] as const;

const PERSISTENT_PUBLIC_LOOKUP_ROUTE_PATHS = [
  'src/app/r/[resultId]',
  'src/app/r/[publicId]',
  'src/app/r/[slug]',
  'src/app/results/[resultId]'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'actual Next.js route files',
  'dry-run handler functions',
  'in-memory adapter only',
  'DTO-safe responses',
  'no raw answers or full result transport',
  'no database, auth, payment, AI, or analytics'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_CREATED_AT = '2026-06-06T12:00:00.000Z';
const SAMPLE_PUBLIC_ID = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const SAMPLE_DELETE_TOKEN = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';
const SAMPLE_WRONG_DELETE_TOKEN = 'delete_WRONGTOKEN_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';

export async function runBackendRouteHandlersContract(
  options: BackendRouteHandlersContractOptions = {}
): Promise<BackendRouteHandlersContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const dryRunContract = await runBackendHandlerDryRunContract({ repoRoot });
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const routeSource = [COLLECTION_ROUTE_FILE, ITEM_ROUTE_FILE].map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const contractDoc = readOptionalFile(repoRoot, ROUTE_HANDLER_CONTRACT_DOC);
  const flow = await runSampleRouteHandlerFlow();
  const exportedMethodSignals = findSignals(routeSource, EXPORTED_METHOD_SIGNALS);
  const routeHelperSignals = findSignals(routeSource, ROUTE_HELPER_SIGNALS);
  const blockedImplementationSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrFullResultSignals = findSignals(checkedSource, RAW_OR_FULL_RESULT_SIGNALS);
  const persistentRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTE_PATHS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);

  const gates = {
    backendHandlerDryRunContractPassed: dryRunContract.gates.overallPassed,
    routeHandlerScriptExists: packageJson.scripts?.['routes:backend-handlers'] === 'tsx scripts/backend-route-handlers-contract.ts',
    validateScriptRunsRouteHandlerContract: validateScript.includes('npm run routes:backend-handlers'),
    routeHandlerModuleExists: existsSync(path.join(repoRoot, ROUTE_HANDLER_MODULE)),
    routeHandlerContractDocExists: existsSync(path.join(repoRoot, ROUTE_HANDLER_CONTRACT_DOC)),
    phase73StatusDocExists: existsSync(path.join(repoRoot, PHASE_7_3_STATUS_DOC)),
    approvedRouteFilesExist: existsSync(path.join(repoRoot, COLLECTION_ROUTE_FILE)) && existsSync(path.join(repoRoot, ITEM_ROUTE_FILE)),
    routeFilesExportExpectedMethods: exportedMethodSignals.join('|') === EXPORTED_METHOD_SIGNALS.join('|'),
    routeFilesUseDryRunRouteHelpers: routeHelperSignals.join('|') === ROUTE_HELPER_SIGNALS.join('|'),
    routeHelpersRunCreateReadDeleteFlow:
      flow.create.status === 201 &&
      flow.read.status === 200 &&
      flow.deleteResult.status === 200 &&
      flow.readAfterDelete.status === 410,
    invalidDeleteTokenHandled: flow.wrongDelete.status === 403,
    dtoOnlyResponsesPreserved:
      !containsForbiddenPublicResultApiPayloadKeys(flow.create.body) &&
      !containsForbiddenPublicResultApiPayloadKeys(flow.read.body) &&
      !containsForbiddenPublicResultApiPayloadKeys(flow.deleteResult.body),
    routeResponseStatusCodesMapped:
      flow.create.status === 201 &&
      flow.read.status === 200 &&
      flow.wrongDelete.status === 403 &&
      flow.deleteResult.status === 200 &&
      flow.readAfterDelete.status === 410,
    noDatabaseAuthPaymentAiAnalyticsImplementation: blockedImplementationSignals.length === 0,
    noRawAnswerOrFullResultTransport: rawOrFullResultSignals.length === 0,
    noPersistentPublicLookupRoute: persistentRouteFiles.length === 0,
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
    schemaVersion: BACKEND_ROUTE_HANDLERS_CONTRACT_SCHEMA_VERSION,
    contractId: BACKEND_ROUTE_HANDLERS_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-7-actual-route-files-dry-run-handlers',
      dryRunContractSchemaVersion: dryRunContract.schemaVersion,
      routeHandlerSchemaVersion: PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION,
      implementationMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    docs: {
      routeHandlerContract: ROUTE_HANDLER_CONTRACT_DOC,
      phase73Status: PHASE_7_3_STATUS_DOC
    },
    scripts: {
      validate: validateScript,
      routeHandlerContract: packageJson.scripts?.['routes:backend-handlers'],
      backendHandlerDryRun: packageJson.scripts?.['dryrun:backend-handlers']
    },
    routes: {
      collectionRouteFile: COLLECTION_ROUTE_FILE,
      itemRouteFile: ITEM_ROUTE_FILE,
      exportedMethodSignals,
      routeHelperSignals
    },
    dryRunRouteFlow: {
      mode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
      boundaryCount: summarizePublicResultRouteHandlerBoundaries().length,
      createStatus: flow.create.status,
      readStatus: flow.read.status,
      wrongDeleteStatus: flow.wrongDelete.status,
      deleteStatus: flow.deleteResult.status,
      readAfterDeleteStatus: flow.readAfterDelete.status
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedImplementationSignals,
      rawOrFullResultSignals,
      persistentRouteFiles,
      missingContractPhrases
    },
    coverage: {
      dryRunContractIssueCount: dryRunContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      routeFileCount: 2,
      routeHandlerBoundaryCount: PUBLIC_RESULT_ROUTE_HANDLER_BOUNDARIES.length
    },
    issues
  };
}

export function writeBackendRouteHandlersContractEvidence(
  report: BackendRouteHandlersContractReport,
  outputPath = 'docs/evidence/backend-route-handlers-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function runSampleRouteHandlerFlow() {
  const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => SAMPLE_CREATED_AT });
  const expiresAt = buildDefaultPublicResultExpiry(SAMPLE_CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
    resultId: SAMPLE_PUBLIC_ID,
    createdAt: SAMPLE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
  const createBody = { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_7_3'), deleteToken: SAMPLE_DELETE_TOKEN };
  const create = await handlePublicResultCreateRouteBody(createBody, { adapter, nowIso: SAMPLE_CREATED_AT });
  const read = await handlePublicResultReadRoute(SAMPLE_PUBLIC_ID, { adapter, nowIso: SAMPLE_CREATED_AT });
  const wrongDelete = await handlePublicResultDeleteRouteBody(
    SAMPLE_PUBLIC_ID,
    buildPublicResultDeleteRequestDto(SAMPLE_PUBLIC_ID, SAMPLE_WRONG_DELETE_TOKEN),
    { adapter, nowIso: SAMPLE_CREATED_AT }
  );
  const deleteResult = await handlePublicResultDeleteRouteBody(
    SAMPLE_PUBLIC_ID,
    buildPublicResultDeleteRequestDto(SAMPLE_PUBLIC_ID, SAMPLE_DELETE_TOKEN),
    { adapter, nowIso: SAMPLE_CREATED_AT }
  );
  const readAfterDelete = await handlePublicResultReadRoute(SAMPLE_PUBLIC_ID, { adapter, nowIso: SAMPLE_CREATED_AT });
  return { create, read, wrongDelete, deleteResult, readAfterDelete };
}

function buildIssues(
  gates: BackendRouteHandlersContractReport['gates'],
  missingContractPhrases: readonly string[]
): readonly string[] {
  const issues: string[] = [];
  if (!gates.backendHandlerDryRunContractPassed) issues.push('backend_handler_dry_run_contract_failed');
  if (!gates.routeHandlerScriptExists) issues.push('missing_backend_route_handlers_script');
  if (!gates.validateScriptRunsRouteHandlerContract) issues.push('validate_missing_backend_route_handlers_contract');
  if (!gates.routeHandlerModuleExists) issues.push('missing_backend_route_handler_module');
  if (!gates.routeHandlerContractDocExists) issues.push('missing_phase7_3_route_handler_doc');
  if (!gates.phase73StatusDocExists) issues.push('missing_phase7_3_status_doc');
  if (!gates.approvedRouteFilesExist) issues.push('approved_route_files_missing');
  if (!gates.routeFilesExportExpectedMethods) issues.push('route_files_do_not_export_expected_methods');
  if (!gates.routeFilesUseDryRunRouteHelpers) issues.push('route_files_not_wired_to_dry_run_helpers');
  if (!gates.routeHelpersRunCreateReadDeleteFlow) issues.push('route_handler_create_read_delete_flow_failed');
  if (!gates.invalidDeleteTokenHandled) issues.push('invalid_delete_token_not_handled_by_route_helper');
  if (!gates.dtoOnlyResponsesPreserved) issues.push('route_handler_dto_boundary_failed');
  if (!gates.routeResponseStatusCodesMapped) issues.push('route_response_status_codes_not_mapped');
  if (!gates.noDatabaseAuthPaymentAiAnalyticsImplementation) issues.push('blocked_backend_dependency_detected');
  if (!gates.noRawAnswerOrFullResultTransport) issues.push('raw_answer_or_full_result_transport_detected');
  if (!gates.noPersistentPublicLookupRoute) issues.push('persistent_public_lookup_route_detected');
  for (const phrase of missingContractPhrases) issues.push(`missing_contract_phrase:${phrase}`);
  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packagePath = path.join(repoRoot, 'package.json');
  if (!existsSync(packagePath)) return {};
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
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
