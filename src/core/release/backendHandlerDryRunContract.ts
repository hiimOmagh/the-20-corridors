import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import {
  buildPublicResultCreateRequestDto,
  buildPublicResultDeleteRequestDto,
  containsForbiddenPublicResultApiPayloadKeys,
  estimatePublicResultApiPayloadBytes,
  PUBLIC_RESULT_API_MAX_DTO_BYTES
} from '../public-link/publicResultApi';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import {
  PUBLIC_RESULT_HANDLER_DRY_RUN_BOUNDARIES,
  PUBLIC_RESULT_HANDLER_DRY_RUN_MODE,
  PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION,
  handlePublicResultCreateDryRun,
  handlePublicResultDeleteDryRun,
  handlePublicResultReadDryRun,
  summarizePublicResultHandlerDryRunBoundaries
} from '../public-link/publicResultHandlerDryRun';
import { createInMemoryPublicResultStorageAdapter } from '../public-link/inMemoryPublicResultStorage';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash
} from '../public-link/publicResultStorage';
import { runBackendRouteSkeletonGuard } from './backendRouteSkeletonGuard';

export const BACKEND_HANDLER_DRY_RUN_CONTRACT_SCHEMA_VERSION = 'phase-7.2-backend-handler-dry-run-contract-v1' as const;
export const BACKEND_HANDLER_DRY_RUN_CONTRACT_ID = 'phase-7-backend-handler-dry-run-contract' as const;

export interface BackendHandlerDryRunContractOptions {
  readonly repoRoot?: string;
}

export interface BackendHandlerDryRunContractReport {
  readonly schemaVersion: typeof BACKEND_HANDLER_DRY_RUN_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof BACKEND_HANDLER_DRY_RUN_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-7-handler-dry-run-only';
    readonly routeSkeletonSchemaVersion: string;
    readonly handlerDryRunSchemaVersion: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION;
    readonly implementationMode: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_MODE;
  };
  readonly gates: {
    readonly backendRouteSkeletonGuardPassed: boolean;
    readonly dryRunScriptExists: boolean;
    readonly validateScriptRunsDryRunContract: boolean;
    readonly dryRunModuleExists: boolean;
    readonly dryRunContractDocExists: boolean;
    readonly phase72StatusDocExists: boolean;
    readonly handlerBoundariesDefined: boolean;
    readonly createReadDeleteDryRunFlowPassed: boolean;
    readonly invalidDeleteTokenHandled: boolean;
    readonly expiredReadHidesDto: boolean;
    readonly deletedReadHidesDto: boolean;
    readonly dtoOnlyResponsesPreserved: boolean;
    readonly payloadSizeWithinLimit: boolean;
    readonly approvedNextRouteFilesCanExist: boolean;
    readonly noRequestObjectOrNextResponseDependency: boolean;
    readonly noDatabaseAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noRawAnswerOrFullResultTransport: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly dryRunContract: string;
    readonly phase72Status: string;
  };
  readonly scripts: {
    readonly validate: string;
    readonly dryRunContract: string | undefined;
    readonly backendRouteSkeletonGuard: string | undefined;
  };
  readonly dryRun: {
    readonly mode: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_MODE;
    readonly boundaryCount: number;
    readonly createStatus: string;
    readonly readStatus: string;
    readonly wrongDeleteStatus: string;
    readonly deleteStatus: string;
    readonly readAfterDeleteStatus: string;
    readonly expiredReadStatus: string;
    readonly responsePayloadBytes: number;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly actualRouteFiles: readonly string[];
    readonly requestObjectOrNextResponseSignals: readonly string[];
    readonly blockedImplementationSignals: readonly string[];
    readonly rawOrFullResultSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly routeSkeletonIssueCount: number;
    readonly checkedFileCount: number;
    readonly actualRouteFileCount: number;
    readonly handlerBoundaryCount: number;
    readonly dryRunMethodCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const DRY_RUN_MODULE = 'src/core/public-link/publicResultHandlerDryRun.ts';
const DRY_RUN_CONTRACT_DOC = 'docs/release/phase-7-backend-handler-dry-run-adapter.md';
const PHASE_7_2_STATUS_DOC = 'docs/ui/phase-7-2-backend-route-handler-dry-run-adapter-status.md';

const CHECKED_FILES = [
  DRY_RUN_MODULE,
  DRY_RUN_CONTRACT_DOC,
  PHASE_7_2_STATUS_DOC,
  'src/core/public-link/publicResultApi.ts',
  'src/core/public-link/publicResultStorage.ts',
  'src/core/public-link/inMemoryPublicResultStorage.ts'
] as const;

const ACTUAL_ROUTE_FILES = [
  'src/app/api/public-results/route.ts',
  'src/app/api/public-results/[publicId]/route.ts'
] as const;

const REQUEST_OBJECT_OR_NEXT_RESPONSE_SIGNALS = [
  'NextRequest',
  'NextResponse',
  'request.json()',
  'export async function POST',
  'export async function GET',
  'export async function DELETE'
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

const REQUIRED_CONTRACT_PHRASES = [
  'handler logic functions only',
  'no Next.js route files in Phase 7.2',
  'simulate POST/GET/DELETE behavior against the in-memory adapter',
  'delete-token and expiry behavior',
  'minimized PublicResultDto only',
  'no database, auth, payment, AI, or analytics'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_CREATED_AT = '2026-06-06T12:00:00.000Z';
const SAMPLE_PUBLIC_ID = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const SAMPLE_DELETE_TOKEN = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';
const SAMPLE_WRONG_DELETE_TOKEN = 'delete_WRONGTOKEN_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';

export async function runBackendHandlerDryRunContract(
  options: BackendHandlerDryRunContractOptions = {}
): Promise<BackendHandlerDryRunContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const routeSkeleton = await runBackendRouteSkeletonGuard({ repoRoot });
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const dryRunSource = readOptionalFile(repoRoot, DRY_RUN_MODULE);
  const contractDoc = readOptionalFile(repoRoot, DRY_RUN_CONTRACT_DOC);
  const actualRouteFiles = existingPaths(repoRoot, ACTUAL_ROUTE_FILES);
  const requestObjectOrNextResponseSignals = findSignals(dryRunSource, REQUEST_OBJECT_OR_NEXT_RESPONSE_SIGNALS);
  const blockedImplementationSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrFullResultSignals = findSignals(dryRunSource, RAW_OR_FULL_RESULT_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const dryRun = await runSampleDryRunFlow();

  const gates = {
    backendRouteSkeletonGuardPassed: routeSkeleton.gates.overallPassed,
    dryRunScriptExists: existsSync(path.join(repoRoot, 'scripts/backend-handler-dry-run-contract.ts')),
    validateScriptRunsDryRunContract: validateScript.includes('npm run dryrun:backend-handlers'),
    dryRunModuleExists: existsSync(path.join(repoRoot, DRY_RUN_MODULE)),
    dryRunContractDocExists: existsSync(path.join(repoRoot, DRY_RUN_CONTRACT_DOC)),
    phase72StatusDocExists: existsSync(path.join(repoRoot, PHASE_7_2_STATUS_DOC)),
    handlerBoundariesDefined: PUBLIC_RESULT_HANDLER_DRY_RUN_BOUNDARIES.length >= 8,
    createReadDeleteDryRunFlowPassed:
      dryRun.create.ok &&
      dryRun.read.ok &&
      dryRun.deleteResult.ok &&
      dryRun.create.response.schemaVersion === dryRun.read.response.schemaVersion &&
      dryRun.deleteResult.response.status === 'deleted',
    invalidDeleteTokenHandled: dryRun.wrongDelete.ok && dryRun.wrongDelete.response.status === 'invalid-delete-token',
    expiredReadHidesDto: dryRun.expiredRead.ok && dryRun.expiredRead.response.status === 'expired' && dryRun.expiredRead.response.dto === null,
    deletedReadHidesDto: dryRun.readAfterDelete.ok && dryRun.readAfterDelete.response.status === 'deleted' && dryRun.readAfterDelete.response.dto === null,
    dtoOnlyResponsesPreserved:
      !containsForbiddenPublicResultApiPayloadKeys(dryRun.create.response) &&
      !containsForbiddenPublicResultApiPayloadKeys(dryRun.read.response) &&
      !containsForbiddenPublicResultApiPayloadKeys(dryRun.deleteResult.response),
    payloadSizeWithinLimit: dryRun.responsePayloadBytes <= PUBLIC_RESULT_API_MAX_DTO_BYTES,
    approvedNextRouteFilesCanExist: actualRouteFiles.length === 2,
    noRequestObjectOrNextResponseDependency: requestObjectOrNextResponseSignals.length === 0,
    noDatabaseAuthPaymentAiAnalyticsImplementation: blockedImplementationSignals.length === 0,
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
    schemaVersion: BACKEND_HANDLER_DRY_RUN_CONTRACT_SCHEMA_VERSION,
    contractId: BACKEND_HANDLER_DRY_RUN_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-7-handler-dry-run-only',
      routeSkeletonSchemaVersion: routeSkeleton.schemaVersion,
      handlerDryRunSchemaVersion: PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION,
      implementationMode: PUBLIC_RESULT_HANDLER_DRY_RUN_MODE
    },
    gates: completeGates,
    docs: {
      dryRunContract: DRY_RUN_CONTRACT_DOC,
      phase72Status: PHASE_7_2_STATUS_DOC
    },
    scripts: {
      validate: validateScript,
      dryRunContract: packageJson.scripts?.['dryrun:backend-handlers'],
      backendRouteSkeletonGuard: packageJson.scripts?.['guard:backend-routes']
    },
    dryRun: {
      mode: PUBLIC_RESULT_HANDLER_DRY_RUN_MODE,
      boundaryCount: summarizePublicResultHandlerDryRunBoundaries().length,
      createStatus: dryRun.create.ok ? 'created' : dryRun.create.response.code,
      readStatus: dryRun.read.ok ? dryRun.read.response.status : dryRun.read.response.code,
      wrongDeleteStatus: dryRun.wrongDelete.ok ? dryRun.wrongDelete.response.status : dryRun.wrongDelete.response.code,
      deleteStatus: dryRun.deleteResult.ok ? dryRun.deleteResult.response.status : dryRun.deleteResult.response.code,
      readAfterDeleteStatus: dryRun.readAfterDelete.ok ? dryRun.readAfterDelete.response.status : dryRun.readAfterDelete.response.code,
      expiredReadStatus: dryRun.expiredRead.ok ? dryRun.expiredRead.response.status : dryRun.expiredRead.response.code,
      responsePayloadBytes: dryRun.responsePayloadBytes
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      actualRouteFiles,
      requestObjectOrNextResponseSignals,
      blockedImplementationSignals,
      rawOrFullResultSignals,
      missingContractPhrases
    },
    coverage: {
      routeSkeletonIssueCount: routeSkeleton.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      actualRouteFileCount: actualRouteFiles.length,
      handlerBoundaryCount: PUBLIC_RESULT_HANDLER_DRY_RUN_BOUNDARIES.length,
      dryRunMethodCount: 3
    },
    issues
  };
}

export function writeBackendHandlerDryRunContractEvidence(
  report: BackendHandlerDryRunContractReport,
  outputPath = 'docs/evidence/backend-handler-dry-run-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function runSampleDryRunFlow() {
  const expiresAt = buildDefaultPublicResultExpiry(SAMPLE_CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN);
  const sourceResult = runCorridorsEngine(SAMPLE_ANSWERS);
  const dto = buildPublicResultDto(sourceResult, {
    resultId: SAMPLE_PUBLIC_ID,
    createdAt: SAMPLE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  });
  const request = buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_7_2');
  const adapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => SAMPLE_CREATED_AT });

  const create = await handlePublicResultCreateDryRun({ adapter, nowIso: SAMPLE_CREATED_AT, request, deleteToken: SAMPLE_DELETE_TOKEN });
  const read = await handlePublicResultReadDryRun({ adapter, nowIso: SAMPLE_CREATED_AT, publicId: SAMPLE_PUBLIC_ID });
  const wrongDelete = await handlePublicResultDeleteDryRun({
    adapter,
    nowIso: SAMPLE_CREATED_AT,
    request: buildPublicResultDeleteRequestDto(SAMPLE_PUBLIC_ID, SAMPLE_WRONG_DELETE_TOKEN)
  });
  const deleteResult = await handlePublicResultDeleteDryRun({
    adapter,
    nowIso: SAMPLE_CREATED_AT,
    request: buildPublicResultDeleteRequestDto(SAMPLE_PUBLIC_ID, SAMPLE_DELETE_TOKEN)
  });
  const readAfterDelete = await handlePublicResultReadDryRun({ adapter, nowIso: SAMPLE_CREATED_AT, publicId: SAMPLE_PUBLIC_ID });

  const expiredAdapter = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-07-07T12:00:00.000Z' });
  await handlePublicResultCreateDryRun({ adapter: expiredAdapter, nowIso: SAMPLE_CREATED_AT, request, deleteToken: SAMPLE_DELETE_TOKEN });
  const expiredRead = await handlePublicResultReadDryRun({
    adapter: expiredAdapter,
    nowIso: '2026-07-07T12:00:00.000Z',
    publicId: SAMPLE_PUBLIC_ID
  });

  const responsePayloadBytes = estimatePublicResultApiPayloadBytes({
    create: create.response,
    read: read.response,
    wrongDelete: wrongDelete.response,
    deleteResult: deleteResult.response,
    readAfterDelete: readAfterDelete.response,
    expiredRead: expiredRead.response
  });

  return { create, read, wrongDelete, deleteResult, readAfterDelete, expiredRead, responsePayloadBytes };
}

function buildIssues(
  gates: BackendHandlerDryRunContractReport['gates'],
  missingContractPhrases: readonly string[]
): readonly string[] {
  const issues: string[] = [];

  if (!gates.backendRouteSkeletonGuardPassed) issues.push('backend_route_skeleton_guard_failed');
  if (!gates.dryRunScriptExists) issues.push('missing_backend_handler_dry_run_script');
  if (!gates.validateScriptRunsDryRunContract) issues.push('validate_missing_backend_handler_dry_run_contract');
  if (!gates.dryRunModuleExists) issues.push('missing_backend_handler_dry_run_module');
  if (!gates.dryRunContractDocExists) issues.push('missing_phase7_2_backend_handler_dry_run_doc');
  if (!gates.phase72StatusDocExists) issues.push('missing_phase7_2_status_doc');
  if (!gates.handlerBoundariesDefined) issues.push('handler_dry_run_boundaries_incomplete');
  if (!gates.createReadDeleteDryRunFlowPassed) issues.push('create_read_delete_dry_run_flow_failed');
  if (!gates.invalidDeleteTokenHandled) issues.push('invalid_delete_token_not_handled');
  if (!gates.expiredReadHidesDto) issues.push('expired_read_does_not_hide_dto');
  if (!gates.deletedReadHidesDto) issues.push('deleted_read_does_not_hide_dto');
  if (!gates.dtoOnlyResponsesPreserved) issues.push('dto_only_response_boundary_failed');
  if (!gates.payloadSizeWithinLimit) issues.push('handler_dry_run_payload_exceeds_limit');
  if (!gates.approvedNextRouteFilesCanExist) issues.push('approved_next_api_route_files_missing');
  if (!gates.noRequestObjectOrNextResponseDependency) issues.push('request_or_next_response_dependency_detected');
  if (!gates.noDatabaseAuthPaymentAiAnalyticsImplementation) issues.push('blocked_backend_dependency_detected');
  if (!gates.noRawAnswerOrFullResultTransport) issues.push('raw_answer_or_full_result_transport_detected');
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
