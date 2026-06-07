import type { PublicResultDto } from './publicResultDto';

export const PUBLIC_RESULT_API_SCHEMA_VERSION = 'phase-7.0-backend-api-boundary-v1' as const;
export const PUBLIC_RESULT_API_CONTRACT_PHASE = 'phase-7.0-backend-api-boundary-contract' as const;
export const PUBLIC_RESULT_API_DEFAULT_EXPIRY_DAYS = 30 as const;
export const PUBLIC_RESULT_API_MAX_DTO_BYTES = 12_000 as const;
export const PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT = 'response-on-create-request-on-delete-only' as const;

export type PublicResultApiSchemaVersion = typeof PUBLIC_RESULT_API_SCHEMA_VERSION;
export type PublicResultApiStatus = 'active' | 'expired' | 'deleted' | 'not-found';
export type PublicResultApiDeleteStatus = 'deleted' | 'not-found' | 'invalid-delete-token' | 'expired';
export type PublicResultApiErrorCode =
  | 'invalid-request'
  | 'invalid-public-id'
  | 'invalid-delete-token'
  | 'expired-result'
  | 'deleted-result'
  | 'not-found'
  | 'rate-limited'
  | 'storage-unavailable';

export interface PublicResultCreateRequestDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly dto: PublicResultDto;
  readonly clientNonce?: string;
}

export interface PublicResultCreateResponseDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly publicId: string;
  readonly publicPath: `/r/${string}`;
  readonly expiresAt: string;
  readonly deleteToken: string;
  readonly dto: PublicResultDto;
}

export interface PublicResultReadResponseDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly publicId: string;
  readonly status: PublicResultApiStatus;
  readonly expiresAt: string | null;
  readonly dto: PublicResultDto | null;
}

export interface PublicResultDeleteRequestDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly publicId: string;
  readonly deleteToken: string;
}

export interface PublicResultDeleteResponseDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly publicId: string;
  readonly status: PublicResultApiDeleteStatus;
}

export interface PublicResultApiErrorResponseDto {
  readonly schemaVersion: PublicResultApiSchemaVersion;
  readonly code: PublicResultApiErrorCode;
  readonly message: string;
}

export interface PublicResultApiBoundaryPolicy {
  readonly phase: typeof PUBLIC_RESULT_API_CONTRACT_PHASE;
  readonly allowedEndpoints: readonly string[];
  readonly allowedMethods: readonly string[];
  readonly createRequestAllowedKeys: readonly string[];
  readonly createResponseAllowedKeys: readonly string[];
  readonly readResponseAllowedKeys: readonly string[];
  readonly deleteRequestAllowedKeys: readonly string[];
  readonly deleteResponseAllowedKeys: readonly string[];
  readonly forbiddenPayloadKeys: readonly string[];
  readonly deleteTokenTransportRules: readonly string[];
  readonly expiryRules: readonly string[];
  readonly abuseControlExpectations: readonly string[];
  readonly implementationBoundary: readonly string[];
}

export const PUBLIC_RESULT_API_ALLOWED_ENDPOINTS = [
  'POST /api/public-results',
  'GET /api/public-results/{publicId}',
  'DELETE /api/public-results/{publicId}'
] as const;

export const PUBLIC_RESULT_API_ALLOWED_METHODS = ['POST', 'GET', 'DELETE'] as const;

export const PUBLIC_RESULT_CREATE_REQUEST_ALLOWED_KEYS = [
  'schemaVersion',
  'dto',
  'clientNonce'
] as const;

export const PUBLIC_RESULT_CREATE_RESPONSE_ALLOWED_KEYS = [
  'schemaVersion',
  'publicId',
  'publicPath',
  'expiresAt',
  'deleteToken',
  'dto'
] as const;

export const PUBLIC_RESULT_READ_RESPONSE_ALLOWED_KEYS = [
  'schemaVersion',
  'publicId',
  'status',
  'expiresAt',
  'dto'
] as const;

export const PUBLIC_RESULT_DELETE_REQUEST_ALLOWED_KEYS = [
  'schemaVersion',
  'publicId',
  'deleteToken'
] as const;

export const PUBLIC_RESULT_DELETE_RESPONSE_ALLOWED_KEYS = [
  'schemaVersion',
  'publicId',
  'status'
] as const;

export const PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS = [
  'answer' + 's',
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
  'e' + 'mail',
  'n' + 'ame',
  'user' + 'Id',
  'device' + 'Fingerprint',
  'user' + 'Agent',
  'analytics' + 'Id'
] as const;

export const PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES = [
  'delete-token-returned-on-create-response-only',
  'delete-token-never-returned-on-read-response',
  'delete-token-required-on-delete-request',
  'delete-token-hash-only-in-storage-record',
  'invalid-delete-token-does-not-reveal-dto'
] as const;

export const PUBLIC_RESULT_API_EXPIRY_RULES = [
  'default-expiry-30-days',
  'expired-results-render-expired-state',
  'expired-results-do-not-return-dto',
  'deleted-results-render-deleted-state',
  'deleted-results-do-not-return-dto'
] as const;

export const PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS = [
  'per-ip-rate-limit-required-before-production',
  'max-public-dto-bytes-enforced',
  'anonymous-non-sequential-public-id-required',
  'request-body-validation-required',
  'delete-token-min-length-required',
  'no-auth-required-for-public-read',
  'no-analytics-required-for-core-flow'
] as const;

export const PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY = [
  'contract-only-in-phase-7-0',
  'no-api-route-implementation-yet',
  'no-database-implementation-yet',
  'no-auth-payment-ai-analytics-implementation',
  'no-public-id-lookup-route-yet'
] as const;

export const PUBLIC_RESULT_API_BOUNDARY_POLICY: PublicResultApiBoundaryPolicy = {
  phase: PUBLIC_RESULT_API_CONTRACT_PHASE,
  allowedEndpoints: PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
  allowedMethods: PUBLIC_RESULT_API_ALLOWED_METHODS,
  createRequestAllowedKeys: PUBLIC_RESULT_CREATE_REQUEST_ALLOWED_KEYS,
  createResponseAllowedKeys: PUBLIC_RESULT_CREATE_RESPONSE_ALLOWED_KEYS,
  readResponseAllowedKeys: PUBLIC_RESULT_READ_RESPONSE_ALLOWED_KEYS,
  deleteRequestAllowedKeys: PUBLIC_RESULT_DELETE_REQUEST_ALLOWED_KEYS,
  deleteResponseAllowedKeys: PUBLIC_RESULT_DELETE_RESPONSE_ALLOWED_KEYS,
  forbiddenPayloadKeys: PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS,
  deleteTokenTransportRules: PUBLIC_RESULT_API_DELETE_TOKEN_TRANSPORT_RULES,
  expiryRules: PUBLIC_RESULT_API_EXPIRY_RULES,
  abuseControlExpectations: PUBLIC_RESULT_API_ABUSE_CONTROL_EXPECTATIONS,
  implementationBoundary: PUBLIC_RESULT_API_IMPLEMENTATION_BOUNDARY
};

export function buildPublicResultCreateRequestDto(dto: PublicResultDto, clientNonce?: string): PublicResultCreateRequestDto {
  return clientNonce
    ? { schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION, dto, clientNonce }
    : { schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION, dto };
}

export function buildPublicResultCreateResponseDto(input: {
  readonly publicId: string;
  readonly expiresAt: string;
  readonly deleteToken: string;
  readonly dto: PublicResultDto;
}): PublicResultCreateResponseDto {
  return {
    schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
    publicId: input.publicId,
    publicPath: `/r/${input.publicId}`,
    expiresAt: input.expiresAt,
    deleteToken: input.deleteToken,
    dto: input.dto
  };
}

export function buildPublicResultReadResponseDto(input: {
  readonly publicId: string;
  readonly status: PublicResultApiStatus;
  readonly expiresAt: string | null;
  readonly dto: PublicResultDto | null;
}): PublicResultReadResponseDto {
  const dto = input.status === 'active' ? input.dto : null;
  return {
    schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
    publicId: input.publicId,
    status: input.status,
    expiresAt: input.expiresAt,
    dto
  };
}

export function buildPublicResultDeleteRequestDto(publicId: string, deleteToken: string): PublicResultDeleteRequestDto {
  return {
    schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
    publicId,
    deleteToken
  };
}

export function buildPublicResultDeleteResponseDto(
  publicId: string,
  status: PublicResultApiDeleteStatus
): PublicResultDeleteResponseDto {
  return {
    schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
    publicId,
    status
  };
}

export function buildPublicResultApiErrorResponseDto(
  code: PublicResultApiErrorCode,
  message: string
): PublicResultApiErrorResponseDto {
  return {
    schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
    code,
    message
  };
}

export function listPublicResultApiPayloadKeys(value: object): readonly string[] {
  return Object.keys(value).sort();
}

export function containsForbiddenPublicResultApiPayloadKeys(value: unknown): boolean {
  return findForbiddenPublicResultApiPayloadKeys(value).length > 0;
}

export function findForbiddenPublicResultApiPayloadKeys(value: unknown): readonly string[] {
  const found = new Set<string>();
  collectForbiddenKeys(value, found);
  return [...found].sort();
}

export function estimatePublicResultApiPayloadBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function collectForbiddenKeys(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found);
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if ((PUBLIC_RESULT_API_FORBIDDEN_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectForbiddenKeys(nestedValue, found);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
