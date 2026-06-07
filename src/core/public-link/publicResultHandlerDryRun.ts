import {
  buildPublicResultApiErrorResponseDto,
  buildPublicResultCreateResponseDto,
  buildPublicResultDeleteResponseDto,
  buildPublicResultReadResponseDto,
  containsForbiddenPublicResultApiPayloadKeys,
  estimatePublicResultApiPayloadBytes,
  PUBLIC_RESULT_API_MAX_DTO_BYTES,
  PUBLIC_RESULT_API_SCHEMA_VERSION,
  type PublicResultApiErrorResponseDto,
  type PublicResultCreateRequestDto,
  type PublicResultCreateResponseDto,
  type PublicResultDeleteRequestDto,
  type PublicResultDeleteResponseDto,
  type PublicResultReadResponseDto
} from './publicResultApi';
import {
  buildPublicResultDeleteTokenHash,
  isSafeAnonymousPublicResultId,
  isSafeDeleteToken,
  type PublicResultStorageAdapter,
  type PublicResultStorageReadResult
} from './publicResultStorage';

export const PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION = 'phase-7.2-backend-handler-dry-run-v1' as const;
export const PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE = 'phase-7.2-backend-route-handler-dry-run-adapter' as const;
export const PUBLIC_RESULT_HANDLER_DRY_RUN_MODE = 'handler-logic-only-no-next-route-files' as const;

export type PublicResultHandlerDryRunMethod = 'POST' | 'GET' | 'DELETE';
export type PublicResultHandlerDryRunKind = 'create' | 'read' | 'delete';

export interface PublicResultHandlerDryRunContext {
  readonly adapter: PublicResultStorageAdapter;
  readonly nowIso: string;
}

export interface PublicResultHandlerDryRunCreateInput extends PublicResultHandlerDryRunContext {
  readonly request: PublicResultCreateRequestDto;
  readonly deleteToken: string;
}

export interface PublicResultHandlerDryRunReadInput extends PublicResultHandlerDryRunContext {
  readonly publicId: string;
}

export interface PublicResultHandlerDryRunDeleteInput extends PublicResultHandlerDryRunContext {
  readonly request: PublicResultDeleteRequestDto;
}

export type PublicResultHandlerDryRunSuccessResponse =
  | PublicResultCreateResponseDto
  | PublicResultReadResponseDto
  | PublicResultDeleteResponseDto;

export interface PublicResultHandlerDryRunSuccess<TResponse extends PublicResultHandlerDryRunSuccessResponse> {
  readonly ok: true;
  readonly phase: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE;
  readonly mode: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_MODE;
  readonly method: PublicResultHandlerDryRunMethod;
  readonly kind: PublicResultHandlerDryRunKind;
  readonly response: TResponse;
}

export interface PublicResultHandlerDryRunFailure {
  readonly ok: false;
  readonly phase: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE;
  readonly mode: typeof PUBLIC_RESULT_HANDLER_DRY_RUN_MODE;
  readonly method: PublicResultHandlerDryRunMethod;
  readonly kind: PublicResultHandlerDryRunKind;
  readonly response: PublicResultApiErrorResponseDto;
}

export type PublicResultHandlerDryRunResult<TResponse extends PublicResultHandlerDryRunSuccessResponse> =
  | PublicResultHandlerDryRunSuccess<TResponse>
  | PublicResultHandlerDryRunFailure;

export const PUBLIC_RESULT_HANDLER_DRY_RUN_BOUNDARIES = [
  'handler-logic-functions-only',
  'no-src-app-api-route-files-created',
  'no-next-response-dependency',
  'no-request-object-parsing',
  'no-database-client-binding',
  'no-auth-payment-ai-analytics',
  'minimized-public-result-dto-only',
  'delete-token-returned-on-create-only'
] as const;

export async function handlePublicResultCreateDryRun(
  input: PublicResultHandlerDryRunCreateInput
): Promise<PublicResultHandlerDryRunResult<PublicResultCreateResponseDto>> {
  const invalid = validateCreateInput(input.request, input.deleteToken);
  if (invalid) return fail('POST', 'create', invalid.code, invalid.message);

  try {
    const deleteTokenHash = buildPublicResultDeleteTokenHash(input.deleteToken);
    if (deleteTokenHash !== input.request.dto.deleteTokenHash) {
      return fail('POST', 'create', 'invalid-delete-token', 'Delete token does not match the minimized DTO hash.');
    }

    const record = await input.adapter.create({
      publicId: input.request.dto.resultId,
      dto: input.request.dto,
      createdAt: input.request.dto.createdAt,
      expiresAt: input.request.dto.expiresAt,
      deleteTokenHash
    });

    if (record.status !== 'active') {
      return fail('POST', 'create', 'expired-result', 'Create dry-run refused an already expired result.');
    }

    return succeed('POST', 'create', buildPublicResultCreateResponseDto({
      publicId: record.publicId,
      expiresAt: record.expiresAt,
      deleteToken: input.deleteToken,
      dto: record.dto
    }));
  } catch (error) {
    return fail('POST', 'create', 'storage-unavailable', error instanceof Error ? error.message : 'Create dry-run storage operation failed.');
  }
}

export async function handlePublicResultReadDryRun(
  input: PublicResultHandlerDryRunReadInput
): Promise<PublicResultHandlerDryRunResult<PublicResultReadResponseDto>> {
  if (!isSafeAnonymousPublicResultId(input.publicId)) {
    return fail('GET', 'read', 'invalid-public-id', 'Public id failed anonymous id validation.');
  }

  const readResult = await input.adapter.read(input.publicId);
  return succeed('GET', 'read', buildReadResponse(input.publicId, readResult));
}

export async function handlePublicResultDeleteDryRun(
  input: PublicResultHandlerDryRunDeleteInput
): Promise<PublicResultHandlerDryRunResult<PublicResultDeleteResponseDto>> {
  const invalid = validateDeleteInput(input.request);
  if (invalid) return fail('DELETE', 'delete', invalid.code, invalid.message);

  const before = await input.adapter.read(input.request.publicId);
  if (before.status === 'not-found' || !before.record) {
    return succeed('DELETE', 'delete', buildPublicResultDeleteResponseDto(input.request.publicId, 'not-found'));
  }

  if (before.status === 'expired') {
    return succeed('DELETE', 'delete', buildPublicResultDeleteResponseDto(input.request.publicId, 'expired'));
  }

  if (before.status === 'deleted') {
    return succeed('DELETE', 'delete', buildPublicResultDeleteResponseDto(input.request.publicId, 'deleted'));
  }

  const deleted = await input.adapter.delete({ publicId: input.request.publicId, deleteToken: input.request.deleteToken });
  if (deleted.status === 'deleted') {
    return succeed('DELETE', 'delete', buildPublicResultDeleteResponseDto(input.request.publicId, 'deleted'));
  }

  return succeed('DELETE', 'delete', buildPublicResultDeleteResponseDto(input.request.publicId, 'invalid-delete-token'));
}

export function summarizePublicResultHandlerDryRunBoundaries(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE}`,
    `schema:${PUBLIC_RESULT_HANDLER_DRY_RUN_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_HANDLER_DRY_RUN_MODE}`,
    ...PUBLIC_RESULT_HANDLER_DRY_RUN_BOUNDARIES
  ];
}

function validateCreateInput(
  request: PublicResultCreateRequestDto,
  deleteToken: string
): { readonly code: PublicResultApiErrorResponseDto['code']; readonly message: string } | null {
  if (request.schemaVersion !== PUBLIC_RESULT_API_SCHEMA_VERSION) {
    return { code: 'invalid-request', message: 'Create request schema version is invalid.' };
  }

  if (!isSafeDeleteToken(deleteToken)) {
    return { code: 'invalid-delete-token', message: 'Create dry-run requires a safe delete token.' };
  }

  if (!isSafeAnonymousPublicResultId(request.dto.resultId)) {
    return { code: 'invalid-public-id', message: 'Create request DTO result id is invalid.' };
  }

  if (containsForbiddenPublicResultApiPayloadKeys(request)) {
    return { code: 'invalid-request', message: 'Create request contains forbidden private payload keys.' };
  }

  if (estimatePublicResultApiPayloadBytes(request) > PUBLIC_RESULT_API_MAX_DTO_BYTES) {
    return { code: 'invalid-request', message: 'Create request exceeds the public DTO size limit.' };
  }

  return null;
}

function validateDeleteInput(
  request: PublicResultDeleteRequestDto): { readonly code: PublicResultApiErrorResponseDto['code']; readonly message: string } | null {
  if (request.schemaVersion !== PUBLIC_RESULT_API_SCHEMA_VERSION) {
    return { code: 'invalid-request', message: 'Delete request schema version is invalid.' };
  }

  if (!isSafeAnonymousPublicResultId(request.publicId)) {
    return { code: 'invalid-public-id', message: 'Delete request public id is invalid.' };
  }

  if (!isSafeDeleteToken(request.deleteToken)) {
    return { code: 'invalid-delete-token', message: 'Delete request token is invalid.' };
  }

  if (containsForbiddenPublicResultApiPayloadKeys(request)) {
    return { code: 'invalid-request', message: 'Delete request contains forbidden private payload keys.' };
  }

  return null;
}

function buildReadResponse(publicId: string, readResult: PublicResultStorageReadResult): PublicResultReadResponseDto {
  if (!readResult.record) {
    return buildPublicResultReadResponseDto({ publicId, status: 'not-found', expiresAt: null, dto: null });
  }

  return buildPublicResultReadResponseDto({
    publicId,
    status: readResult.status,
    expiresAt: readResult.record.expiresAt,
    dto: readResult.record.dto
  });
}

function succeed<TResponse extends PublicResultHandlerDryRunSuccessResponse>(
  method: PublicResultHandlerDryRunMethod,
  kind: PublicResultHandlerDryRunKind,
  response: TResponse
): PublicResultHandlerDryRunSuccess<TResponse> {
  return {
    ok: true,
    phase: PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_HANDLER_DRY_RUN_MODE,
    method,
    kind,
    response
  };
}

function fail(
  method: PublicResultHandlerDryRunMethod,
  kind: PublicResultHandlerDryRunKind,
  code: PublicResultApiErrorResponseDto['code'],
  message: string
): PublicResultHandlerDryRunFailure {
  return {
    ok: false,
    phase: PUBLIC_RESULT_HANDLER_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_HANDLER_DRY_RUN_MODE,
    method,
    kind,
    response: buildPublicResultApiErrorResponseDto(code, message)
  };
}
