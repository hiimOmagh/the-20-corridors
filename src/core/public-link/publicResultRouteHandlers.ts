import {
  buildPublicResultApiErrorResponseDto,
  buildPublicResultCreateRequestDto,
  buildPublicResultDeleteRequestDto,
  containsForbiddenPublicResultApiPayloadKeys,
  PUBLIC_RESULT_API_SCHEMA_VERSION,
  type PublicResultApiErrorResponseDto,
  type PublicResultCreateRequestDto,
  type PublicResultCreateResponseDto,
  type PublicResultDeleteRequestDto,
  type PublicResultDeleteResponseDto,
  type PublicResultReadResponseDto
} from './publicResultApi';
import { createInMemoryPublicResultStorageAdapter } from './inMemoryPublicResultStorage';
import {
  createPublicResultApiRouteDatabaseBindingStorageAdapter,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision
} from './publicResultApiRouteDatabaseBindingImplementation';
import type { PublicResultDatabaseQueryExecutor } from './publicResultDatabaseStorageAdapter';
import {
  createPublicResultStorageAdapterFromFactory,
  resolvePublicResultStorageAdapterFactoryDecision
} from './publicResultStorageAdapterFactory';
import {
  resolvePublicResultStorageRuntimeSelection,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';
import {
  handlePublicResultCreateDryRun,
  handlePublicResultDeleteDryRun,
  handlePublicResultReadDryRun
} from './publicResultHandlerDryRun';
import type { PublicResultStorageAdapter } from './publicResultStorage';

export const PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION = 'phase-7.3-backend-route-handlers-v1' as const;
export const PUBLIC_RESULT_ROUTE_HANDLERS_PHASE = 'phase-7.3-backend-route-files-with-dry-run-handlers' as const;
export const PUBLIC_RESULT_ROUTE_HANDLERS_MODE = 'next-route-files-dry-run-in-memory-only' as const;

export type PublicResultRouteStatusCode = 200 | 201 | 400 | 403 | 404 | 410 | 413 | 429 | 500;
export type PublicResultRouteResponseBody =
  | PublicResultCreateResponseDto
  | PublicResultReadResponseDto
  | PublicResultDeleteResponseDto
  | PublicResultApiErrorResponseDto;

export interface PublicResultRouteResponse<TBody extends PublicResultRouteResponseBody = PublicResultRouteResponseBody> {
  readonly status: PublicResultRouteStatusCode;
  readonly body: TBody;
  readonly headers: Record<string, string>;
}

export interface PublicResultRouteOptions {
  readonly adapter?: PublicResultStorageAdapter;
  readonly nowIso?: string;
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly databaseExecuteQuery?: PublicResultDatabaseQueryExecutor;
}

export interface PublicResultCreateRouteBody extends PublicResultCreateRequestDto {
  readonly deleteToken: string;
}

export interface PublicResultDeleteRouteBody extends PublicResultDeleteRequestDto {}

const routeAdapter = createInMemoryPublicResultStorageAdapter();

export const PUBLIC_RESULT_ROUTE_HANDLER_BOUNDARIES = [
  'actual-next-route-files-created-in-phase-7-3',
  'dry-run-handler-functions-only',
  'in-memory-adapter-only',
  'database-runtime-selection-fails-closed-before-client-binding',
  'phase-8-2-factory-contract-preserves-memory-route-binding',
  'phase-8-14-database-route-binding-behind-explicit-activation-gate',
  'memory-default-and-rollback-remain-available',
  'public-result-api-dto-only',
  'no-database-client',
  'no-auth-payment-ai-analytics',
  'no-raw-answer-or-full-result-transport',
  'delete-token-returned-only-on-create'
] as const;

export function getPublicResultRouteAdapter(options: PublicResultRouteOptions = {}): PublicResultStorageAdapter {
  return createPublicResultApiRouteDatabaseBindingStorageAdapter({
    env: options.env ?? process.env,
    context: 'public-api-route-handler',
    memoryAdapter: routeAdapter,
    ...(options.databaseExecuteQuery === undefined ? {} : { executeQuery: options.databaseExecuteQuery }),
    ...(options.nowIso === undefined ? {} : { nowIso: () => options.nowIso as string })
  });
}

export function getPublicResultRouteDatabaseBindingImplementationDecision(options: PublicResultRouteOptions = {}) {
  return resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
    env: options.env ?? process.env,
    context: 'public-api-route-handler',
    memoryAdapter: routeAdapter,
    ...(options.databaseExecuteQuery === undefined ? {} : { executeQuery: options.databaseExecuteQuery })
  });
}

export function getPublicResultRouteRuntimeSelection() {
  return resolvePublicResultStorageRuntimeSelection(process.env);
}

export function getPublicResultRouteAdapterFactoryDecision() {
  return resolvePublicResultStorageAdapterFactoryDecision({ env: process.env, purpose: 'route-handler' });
}

export async function handlePublicResultCreateRouteBody(
  body: unknown,
  options: PublicResultRouteOptions = {}
): Promise<PublicResultRouteResponse> {
  const parsed = parsePublicResultCreateRouteBody(body);
  if (!parsed.ok) return errorRouteResponse(parsed.code, parsed.message);

  const adapter = resolvePublicResultRouteAdapterOrError(options);
  if (!adapter.ok) return adapter.response;

  const request = buildPublicResultCreateRequestDto(parsed.body.dto, parsed.body.clientNonce);
  try {
    const result = await handlePublicResultCreateDryRun({
      adapter: adapter.value,
      nowIso: options.nowIso ?? new Date().toISOString(),
      request,
      deleteToken: parsed.body.deleteToken
    });

    if (!result.ok) return routeResponse(statusForError(result.response.code), result.response);
    return routeResponse(201, result.response);
  } catch {
    return storageUnavailableRouteResponse();
  }
}

export async function handlePublicResultReadRoute(
  publicId: string,
  options: PublicResultRouteOptions = {}
): Promise<PublicResultRouteResponse> {
  const adapter = resolvePublicResultRouteAdapterOrError(options);
  if (!adapter.ok) return adapter.response;

  try {
    const result = await handlePublicResultReadDryRun({
      adapter: adapter.value,
      nowIso: options.nowIso ?? new Date().toISOString(),
      publicId
    });

    if (!result.ok) return routeResponse(statusForError(result.response.code), result.response);
    return routeResponse(statusForRead(result.response.status), result.response);
  } catch {
    return storageUnavailableRouteResponse();
  }
}

export async function handlePublicResultDeleteRouteBody(
  publicId: string,
  body: unknown,
  options: PublicResultRouteOptions = {}
): Promise<PublicResultRouteResponse> {
  const parsed = parsePublicResultDeleteRouteBody(publicId, body);
  if (!parsed.ok) return errorRouteResponse(parsed.code, parsed.message);

  const adapter = resolvePublicResultRouteAdapterOrError(options);
  if (!adapter.ok) return adapter.response;

  try {
    const result = await handlePublicResultDeleteDryRun({
      adapter: adapter.value,
      nowIso: options.nowIso ?? new Date().toISOString(),
      request: parsed.body
    });

    if (!result.ok) return routeResponse(statusForError(result.response.code), result.response);
    return routeResponse(statusForDelete(result.response.status), result.response);
  } catch {
    return storageUnavailableRouteResponse();
  }
}

export function summarizePublicResultRouteHandlerBoundaries(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_ROUTE_HANDLERS_PHASE}`,
    `schema:${PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_ROUTE_HANDLERS_MODE}`,
    ...PUBLIC_RESULT_ROUTE_HANDLER_BOUNDARIES
  ];
}


function resolvePublicResultRouteAdapterOrError(
  options: PublicResultRouteOptions
):
  | { readonly ok: true; readonly value: PublicResultStorageAdapter }
  | { readonly ok: false; readonly response: PublicResultRouteResponse<PublicResultApiErrorResponseDto> } {
  if (options.adapter !== undefined) return { ok: true, value: options.adapter };
  try {
    return { ok: true, value: getPublicResultRouteAdapter(options) };
  } catch {
    return {
      ok: false,
      response: routeResponse(500, buildPublicResultApiErrorResponseDto('storage-unavailable', 'Public result storage is unavailable.'))
    };
  }
}


function storageUnavailableRouteResponse(): PublicResultRouteResponse<PublicResultApiErrorResponseDto> {
  return routeResponse(500, buildPublicResultApiErrorResponseDto('storage-unavailable', 'Public result storage is unavailable.'));
}

function parsePublicResultCreateRouteBody(
  body: unknown
):
  | { readonly ok: true; readonly body: PublicResultCreateRouteBody }
  | { readonly ok: false; readonly code: PublicResultApiErrorResponseDto['code']; readonly message: string } {
  if (!isRecord(body)) return { ok: false, code: 'invalid-request', message: 'Create route requires a JSON object.' };
  if (containsForbiddenPublicResultApiPayloadKeys(body)) {
    return { ok: false, code: 'invalid-request', message: 'Create route payload contains forbidden private keys.' };
  }
  if (body.schemaVersion !== PUBLIC_RESULT_API_SCHEMA_VERSION) {
    return { ok: false, code: 'invalid-request', message: 'Create route schema version is invalid.' };
  }
  if (!isRecord(body.dto)) return { ok: false, code: 'invalid-request', message: 'Create route requires a minimized dto object.' };
  if (typeof body.deleteToken !== 'string') {
    return { ok: false, code: 'invalid-delete-token', message: 'Create route requires a delete token.' };
  }

  return {
    ok: true,
    body: {
      schemaVersion: body.schemaVersion,
      dto: body.dto as unknown as PublicResultCreateRouteBody['dto'],
      deleteToken: body.deleteToken,
      ...(typeof body.clientNonce === 'string' ? { clientNonce: body.clientNonce } : {})
    }
  };
}

function parsePublicResultDeleteRouteBody(
  publicId: string,
  body: unknown
):
  | { readonly ok: true; readonly body: PublicResultDeleteRouteBody }
  | { readonly ok: false; readonly code: PublicResultApiErrorResponseDto['code']; readonly message: string } {
  if (!isRecord(body)) return { ok: false, code: 'invalid-request', message: 'Delete route requires a JSON object.' };
  if (containsForbiddenPublicResultApiPayloadKeys(body)) {
    return { ok: false, code: 'invalid-request', message: 'Delete route payload contains forbidden private keys.' };
  }
  if (body.schemaVersion !== PUBLIC_RESULT_API_SCHEMA_VERSION) {
    return { ok: false, code: 'invalid-request', message: 'Delete route schema version is invalid.' };
  }
  if (typeof body.deleteToken !== 'string') {
    return { ok: false, code: 'invalid-delete-token', message: 'Delete route requires a delete token.' };
  }
  if (typeof body.publicId === 'string' && body.publicId !== publicId) {
    return { ok: false, code: 'invalid-public-id', message: 'Delete route public id mismatch.' };
  }

  return { ok: true, body: buildPublicResultDeleteRequestDto(publicId, body.deleteToken) };
}

function routeResponse<TBody extends PublicResultRouteResponseBody>(
  status: PublicResultRouteStatusCode,
  body: TBody
): PublicResultRouteResponse<TBody> {
  return {
    status,
    body,
    headers: {
      'Cache-Control': 'no-store',
      'X-20C-Route-Mode': PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    }
  };
}

function errorRouteResponse(
  code: PublicResultApiErrorResponseDto['code'],
  message: string
): PublicResultRouteResponse<PublicResultApiErrorResponseDto> {
  return routeResponse(statusForError(code), buildPublicResultApiErrorResponseDto(code, message));
}

function statusForRead(status: PublicResultReadResponseDto['status']): PublicResultRouteStatusCode {
  if (status === 'active') return 200;
  if (status === 'not-found') return 404;
  return 410;
}

function statusForDelete(status: PublicResultDeleteResponseDto['status']): PublicResultRouteStatusCode {
  if (status === 'deleted') return 200;
  if (status === 'not-found') return 404;
  if (status === 'invalid-delete-token') return 403;
  return 410;
}

function statusForError(code: PublicResultApiErrorResponseDto['code']): PublicResultRouteStatusCode {
  if (code === 'invalid-delete-token') return 403;
  if (code === 'invalid-public-id' || code === 'invalid-request') return 400;
  if (code === 'not-found') return 404;
  if (code === 'expired-result' || code === 'deleted-result') return 410;
  if (code === 'rate-limited') return 429;
  return 500;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
