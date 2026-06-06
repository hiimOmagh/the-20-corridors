import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash
} from '../public-link/publicResultStorage';
import {
  buildPublicResultApiErrorResponseDto,
  buildPublicResultCreateRequestDto,
  buildPublicResultCreateResponseDto,
  buildPublicResultDeleteRequestDto,
  buildPublicResultDeleteResponseDto,
  buildPublicResultReadResponseDto,
  containsForbiddenPublicResultApiPayloadKeys,
  estimatePublicResultApiPayloadBytes,
  listPublicResultApiPayloadKeys,
  PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS,
  PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
  PUBLIC_RESULT_API_ALLOWED_METHODS,
  PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS,
  PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT,
  PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES,
  PUBLIC_RESULT_API_EXPIRY_RULES,
  PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS,
  PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY,
  PUBLIC_RESULT_API_MAX_DTO_BYTES,
  PUBLIC_RESULT_API_SCHEMA_VERSION
} from '../public-link/publicResultApi';
import { runPhase6ClosureGate } from './phase6ClosureGate';
import { runPublicResultStorageContract } from './publicResultStorageContract';

export const PUBLIC_RESULT_API_BOUNDARY_CONTRACT_SCHEMA_VERSION = 'phase-7.0-backend-api-boundary-contract-v1' as const;
export const PUBLIC_RESULT_API_BOUNDARY_CONTRACT_ID = 'phase-7-backend-api-boundary-contract' as const;

export interface PublicResultApiBoundaryContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultApiBoundaryContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_API_BOUNDARY_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_API_BOUNDARY_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-7-api-boundary-contract-only';
    readonly phase6ClosureSchemaVersion: string;
    readonly publicStorageSchemaVersion: string;
    readonly publicResultApiSchemaVersion: typeof PUBLIC_RESULT_API_SCHEMA_VERSION;
    readonly implementationMode: 'contract-only-no-route-no-database';
  };
  readonly gates: {
    readonly phase6ClosurePassed: boolean;
    readonly publicStorageContractPassed: boolean;
    readonly apiBoundaryScriptExists: boolean;
    readonly validateScriptRunsApiBoundaryContract: boolean;
    readonly apiBoundaryModuleExists: boolean;
    readonly apiBoundaryDocExists: boolean;
    readonly phase70StatusDocExists: boolean;
    readonly createDtoContractDefined: boolean;
    readonly readDtoContractDefined: boolean;
    readonly deleteDtoContractDefined: boolean;
    readonly errorDtoContractDefined: boolean;
    readonly publicLookupResponseMinimized: boolean;
    readonly deleteTokenTransportRulesDefined: boolean;
    readonly expirySemanticsDefined: boolean;
    readonly abuseControlExpectationsDefined: boolean;
    readonly noActualApiRouteYet: boolean;
    readonly noDatabaseBackendAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRouteYet: boolean;
    readonly noRawAnswerOrPrivateScoreLeakage: boolean;
    readonly noFullResultSerializationTransport: boolean;
    readonly samplePayloadWithinSizeLimit: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly apiBoundaryContract: string;
    readonly phase70Status: string;
  };
  readonly scripts: {
    readonly validate: string;
    readonly apiBoundaryContract: string | undefined;
    readonly phase6Closure: string | undefined;
    readonly publicStorageContract: string | undefined;
  };
  readonly apiContract: {
    readonly allowedEndpoints: readonly string[];
    readonly allowedMethods: readonly string[];
    readonly deleteTokenTransport: typeof PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT;
    readonly defaultExpiryDays: typeof PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS;
    readonly maxDtoBytes: typeof PUBLIC_RESULT_API_MAX_DTO_BYTES;
    readonly createRequestKeys: readonly string[];
    readonly createResponseKeys: readonly string[];
    readonly readResponseKeys: readonly string[];
    readonly deleteRequestKeys: readonly string[];
    readonly deleteResponseKeys: readonly string[];
    readonly errorResponseKeys: readonly string[];
    readonly forbiddenPayloadKeyCount: number;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly blockedImplementationSignals: readonly string[];
    readonly persistentLookupRouteFiles: readonly string[];
    readonly rawOrPrivateSignals: readonly string[];
    readonly fullResultTransportSignals: readonly string[];
    readonly missingContractPhrases: readonly string[];
  };
  readonly coverage: {
    readonly phase6IssueCount: number;
    readonly storageIssueCount: number;
    readonly endpointCount: number;
    readonly methodCount: number;
    readonly deleteTokenRuleCount: number;
    readonly expiryRuleCount: number;
    readonly abuseExpectationCount: number;
    readonly implementationBoundaryCount: number;
    readonly samplePayloadBytes: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const API_BOUNDARY_MODULE = 'src/core/public-link/publicResultApi.ts';
const API_BOUNDARY_CONTRACT_DOC = 'docs/release/phase-7-backend-api-boundary-contract.md';
const PHASE_7_0_STATUS_DOC = 'docs/ui/phase-7-0-backend-api-boundary-contract-status.md';

const CHECKED_FILES = [
  API_BOUNDARY_MODULE,
  API_BOUNDARY_CONTRACT_DOC,
  PHASE_7_0_STATUS_DOC,
  'src/core/public-link/publicResultStorage.ts',
  'src/core/public-link/publicResultDto.ts'
] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/app/api',
  'src/pages/api',
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
  'src/app/results/[resultId]',
  'src/features/publicResultRoute'
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
  'analytics.track',
  'localStorage.setItem',
  'indexedDB.open'
] as const;

const RAW_OR_PRIVATE_SIGNALS = [
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
  'ip' + 'Address',
  'email',
  'name',
  'user' + 'Id',
  'device' + 'Fingerprint',
  'userAgent',
  'analyticsId'
] as const;

const FULL_RESULT_TRANSPORT_SIGNALS = [
  'CorridorsPublicResultDto',
  'SerializedCorridorsResultEnvelope',
  'serializeCorridorsResult',
  'serializeCorridorsResultEnvelope',
  'sourceResult',
  'runCorridorsEngine(input)'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'create/read/delete public-result API DTOs',
  'delete-token transport rules',
  'expiry semantics',
  'abuse-control expectations',
  'public lookup response minimization',
  'no actual API route in Phase 7.0',
  'no database implementation in Phase 7.0'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const SAMPLE_CREATED_AT = '2026-06-06T12:00:00.000Z';
const SAMPLE_PUBLIC_ID = 'pub_7aBcDeFgHiJkLmNoPqRsTuVwXyZ';
const SAMPLE_DELETE_TOKEN = 'delete_7aBcDeFgHiJkLmNoPqRsTuVwXyZ_123456789';

export async function runPublicResultApiBoundaryContract(
  options: PublicResultApiBoundaryContractOptions = {}
): Promise<PublicResultApiBoundaryContractReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase6Closure = await runPhase6ClosureGate({ repoRoot });
  const storageContract = runPublicResultStorageContract({ repoRoot });
  const apiSource = readOptionalFile(repoRoot, API_BOUNDARY_MODULE);
  const contractDoc = readOptionalFile(repoRoot, API_BOUNDARY_CONTRACT_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const persistentLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTE_PATHS);
  const blockedImplementationSignals = findSignals(checkedSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawOrPrivateSignals = findSignals(apiSource, RAW_OR_PRIVATE_SIGNALS);
  const fullResultTransportSignals = findSignals(apiSource, FULL_RESULT_TRANSPORT_SIGNALS);
  const missingContractPhrases = missingSignals(contractDoc, REQUIRED_CONTRACT_PHRASES);
  const sample = buildSamplePayloads();
  const samplePayloadBytes = estimatePublicResultApiPayloadBytes(sample);

  const createRequestKeys = listPublicResultApiPayloadKeys(sample.createRequest);
  const createResponseKeys = listPublicResultApiPayloadKeys(sample.createResponse);
  const readResponseKeys = listPublicResultApiPayloadKeys(sample.readResponse);
  const deleteRequestKeys = listPublicResultApiPayloadKeys(sample.deleteRequest);
  const deleteResponseKeys = listPublicResultApiPayloadKeys(sample.deleteResponse);
  const errorResponseKeys = listPublicResultApiPayloadKeys(sample.errorResponse);

  const gates = {
    phase6ClosurePassed: phase6Closure.gates.overallPassed,
    publicStorageContractPassed: storageContract.gates.overallPassed,
    apiBoundaryScriptExists: packageJson.scripts?.['contract:backend-api'] === 'tsx scripts/backend-api-boundary-contract.ts',
    validateScriptRunsApiBoundaryContract: validateScript.includes('npm run contract:backend-api'),
    apiBoundaryModuleExists: existsSync(path.join(repoRoot, API_BOUNDARY_MODULE)),
    apiBoundaryDocExists: existsSync(path.join(repoRoot, API_BOUNDARY_CONTRACT_DOC)),
    phase70StatusDocExists: existsSync(path.join(repoRoot, PHASE_7_0_STATUS_DOC)),
    createDtoContractDefined:
      createRequestKeys.join('|') === ['clientNonce', 'dto', 'schemaVersion'].join('|') &&
      createResponseKeys.join('|') === ['deleteToken', 'dto', 'expiresAt', 'publicId', 'publicPath', 'schemaVersion'].join('|'),
    readDtoContractDefined:
      readResponseKeys.join('|') === ['dto', 'expiresAt', 'publicId', 'schemaVersion', 'status'].join('|') &&
      sample.expiredReadResponse.dto === null,
    deleteDtoContractDefined:
      deleteRequestKeys.join('|') === ['deleteToken', 'publicId', 'schemaVersion'].join('|') &&
      deleteResponseKeys.join('|') === ['publicId', 'schemaVersion', 'status'].join('|'),
    errorDtoContractDefined: errorResponseKeys.join('|') === ['code', 'message', 'schemaVersion'].join('|'),
    publicLookupResponseMinimized:
      sample.readResponse.dto !== null &&
      sample.expiredReadResponse.dto === null &&
      !('deleteToken' in sample.readResponse) &&
      !('deleteToken' in sample.expiredReadResponse),
    deleteTokenTransportRulesDefined:
      PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT === 'response-on-create-request-on-delete-only' &&
      PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES.length >= 5,
    expirySemanticsDefined:
      PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS === 30 &&
      PUBLIC_RESULT_API_EXPIRY_RULES.length >= 5,
    abuseControlExpectationsDefined: PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS.length >= 7,
    noActualApiRouteYet: blockedPaths.filter((item) => item.includes('src/app/api') || item.includes('src/pages/api')).length === 0,
    noDatabaseBackendAuthPaymentAiAnalyticsImplementation: blockedPaths.length === 0 && blockedImplementationSignals.length === 0,
    noPersistentPublicLookupRouteYet: persistentLookupRouteFiles.length === 0,
    noRawAnswerOrPrivateScoreLeakage:
      rawOrPrivateSignals.length === 0 &&
      !containsForbiddenPublicResultApiPayloadKeys(sample),
    noFullResultSerializationTransport: fullResultTransportSignals.length === 0,
    samplePayloadWithinSizeLimit: samplePayloadBytes <= PUBLIC_RESULT_API_MAX_DTO_BYTES,
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
    schemaVersion: PUBLIC_RESULT_API_BOUNDARY_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_API_BOUNDARY_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-7-api-boundary-contract-only',
      phase6ClosureSchemaVersion: phase6Closure.schemaVersion,
      publicStorageSchemaVersion: storageContract.schemaVersion,
      publicResultApiSchemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
      implementationMode: 'contract-only-no-route-no-database'
    },
    gates: completeGates,
    docs: {
      apiBoundaryContract: API_BOUNDARY_CONTRACT_DOC,
      phase70Status: PHASE_7_0_STATUS_DOC
    },
    scripts: {
      validate: validateScript,
      apiBoundaryContract: packageJson.scripts?.['contract:backend-api'],
      phase6Closure: packageJson.scripts?.['closure:phase6'],
      publicStorageContract: packageJson.scripts?.['contract:public-storage']
    },
    apiContract: {
      allowedEndpoints: PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
      allowedMethods: PUBLIC_RESULT_API_ALLOWED_METHODS,
      deleteTokenTransport: PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT,
      defaultExpiryDays: PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS,
      maxDtoBytes: PUBLIC_RESULT_API_MAX_DTO_BYTES,
      createRequestKeys,
      createResponseKeys,
      readResponseKeys,
      deleteRequestKeys,
      deleteResponseKeys,
      errorResponseKeys,
      forbiddenPayloadKeyCount: PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS.length
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      blockedPaths,
      blockedImplementationSignals,
      persistentLookupRouteFiles,
      rawOrPrivateSignals,
      fullResultTransportSignals,
      missingContractPhrases
    },
    coverage: {
      phase6IssueCount: phase6Closure.issues.length,
      storageIssueCount: storageContract.issues.length,
      endpointCount: PUBLIC_RESULT_API_ALLOWED_ENDPOINTS.length,
      methodCount: PUBLIC_RESULT_API_ALLOWED_METHODS.length,
      deleteTokenRuleCount: PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES.length,
      expiryRuleCount: PUBLIC_RESULT_API_EXPIRY_RULES.length,
      abuseExpectationCount: PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS.length,
      implementationBoundaryCount: PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY.length,
      samplePayloadBytes
    },
    issues
  };
}

export function writePublicResultApiBoundaryContractEvidence(
  report: PublicResultApiBoundaryContractReport,
  outputPath = 'docs/evidence/backend-api-boundary-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function buildSamplePayloads() {
  const result = runCorridorsEngine(SAMPLE_ANSWERS);
  const expiresAt = buildDefaultPublicResultExpiry(SAMPLE_CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(SAMPLE_DELETE_TOKEN);
  const dto = buildPublicResultDto(result, {
    resultId: SAMPLE_PUBLIC_ID,
    createdAt: SAMPLE_CREATED_AT,
    expiresAt,
    deleteTokenHash
  });

  const createRequest = buildPublicResultCreateRequestDto(dto, 'client_nonce_demo_12345');
  const createResponse = buildPublicResultCreateResponseDto({
    publicId: SAMPLE_PUBLIC_ID,
    expiresAt,
    deleteToken: SAMPLE_DELETE_TOKEN,
    dto
  });
  const readResponse = buildPublicResultReadResponseDto({
    publicId: SAMPLE_PUBLIC_ID,
    status: 'active',
    expiresAt,
    dto
  });
  const expiredReadResponse = buildPublicResultReadResponseDto({
    publicId: SAMPLE_PUBLIC_ID,
    status: 'expired',
    expiresAt,
    dto
  });
  const deleteRequest = buildPublicResultDeleteRequestDto(SAMPLE_PUBLIC_ID, SAMPLE_DELETE_TOKEN);
  const deleteResponse = buildPublicResultDeleteResponseDto(SAMPLE_PUBLIC_ID, 'deleted');
  const errorResponse = buildPublicResultApiErrorResponseDto('invalid-request', 'Request body failed validation.');

  return {
    createRequest,
    createResponse,
    readResponse,
    expiredReadResponse,
    deleteRequest,
    deleteResponse,
    errorResponse
  };
}

function buildIssues(
  gates: PublicResultApiBoundaryContractReport['gates'],
  missingContractPhrases: readonly string[]
): readonly string[] {
  const issues: string[] = [];

  if (!gates.phase6ClosurePassed) issues.push('phase6_closure_failed');
  if (!gates.publicStorageContractPassed) issues.push('public_storage_contract_failed');
  if (!gates.apiBoundaryScriptExists) issues.push('missing_contract_backend_api_script');
  if (!gates.validateScriptRunsApiBoundaryContract) issues.push('validate_missing_backend_api_contract');
  if (!gates.apiBoundaryModuleExists) issues.push('missing_public_result_api_boundary_module');
  if (!gates.apiBoundaryDocExists) issues.push('missing_phase7_api_boundary_contract_doc');
  if (!gates.phase70StatusDocExists) issues.push('missing_phase7_api_boundary_status_doc');
  if (!gates.createDtoContractDefined) issues.push('create_dto_contract_incomplete');
  if (!gates.readDtoContractDefined) issues.push('read_dto_contract_incomplete');
  if (!gates.deleteDtoContractDefined) issues.push('delete_dto_contract_incomplete');
  if (!gates.errorDtoContractDefined) issues.push('error_dto_contract_incomplete');
  if (!gates.publicLookupResponseMinimized) issues.push('public_lookup_response_not_minimized');
  if (!gates.deleteTokenTransportRulesDefined) issues.push('delete_token_transport_rules_incomplete');
  if (!gates.expirySemanticsDefined) issues.push('expiry_semantics_incomplete');
  if (!gates.abuseControlExpectationsDefined) issues.push('abuse_control_expectations_incomplete');
  if (!gates.noActualApiRouteYet) issues.push('api_route_implemented_too_early');
  if (!gates.noDatabaseBackendAuthPaymentAiAnalyticsImplementation) issues.push('blocked_backend_database_auth_payment_ai_analytics_scope_detected');
  if (!gates.noPersistentPublicLookupRouteYet) issues.push('persistent_public_lookup_route_detected_too_early');
  if (!gates.noRawAnswerOrPrivateScoreLeakage) issues.push('raw_answer_or_private_score_leakage_detected');
  if (!gates.noFullResultSerializationTransport) issues.push('full_result_serialization_transport_detected');
  if (!gates.samplePayloadWithinSizeLimit) issues.push('sample_payload_exceeds_size_limit');
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
