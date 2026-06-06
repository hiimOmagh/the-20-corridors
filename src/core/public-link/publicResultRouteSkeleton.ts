import {
  PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
  PUBLIC_RESULT_API_ALLOWED_METHODS,
  PUBLIC_RESULT_API_SCHEMA_VERSION
} from './publicResultApi';

export const PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION = 'phase-7.1-backend-route-skeleton-v1' as const;
export const PUBLIC_RESULT_ROUTE_SKELETON_PHASE = 'phase-7.1-backend-route-skeleton-guard' as const;
export const PUBLIC_RESULT_ROUTE_SKELETON_MODE = 'contract-only-no-route-files-no-request-handlers' as const;

export type PublicResultRouteSkeletonMethod = 'POST' | 'GET' | 'DELETE';
export type PublicResultRouteSkeletonRuntime = 'nodejs';
export type PublicResultRouteSkeletonStatus = 'planned-only' | 'blocked-until-phase-7-2';

export interface PublicResultRouteSkeletonDefinition {
  readonly id: 'public-results-collection' | 'public-results-item';
  readonly routeFile: string;
  readonly publicPath: string;
  readonly methods: readonly PublicResultRouteSkeletonMethod[];
  readonly runtime: PublicResultRouteSkeletonRuntime;
  readonly status: PublicResultRouteSkeletonStatus;
  readonly dtoBoundary: 'public-result-api-dto-only';
  readonly storageBoundary: 'adapter-interface-only';
  readonly blockedUntil: 'phase-7.2-route-implementation';
}

export interface PublicResultRouteSkeletonPolicy {
  readonly schemaVersion: typeof PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_ROUTE_SKELETON_PHASE;
  readonly mode: typeof PUBLIC_RESULT_ROUTE_SKELETON_MODE;
  readonly apiSchemaVersion: typeof PUBLIC_RESULT_API_SCHEMA_VERSION;
  readonly allowedRouteFiles: readonly string[];
  readonly allowedPublicPaths: readonly string[];
  readonly allowedMethods: readonly PublicResultRouteSkeletonMethod[];
  readonly definitions: readonly PublicResultRouteSkeletonDefinition[];
  readonly requestHandlingBoundary: readonly string[];
  readonly blockedBehavior: readonly string[];
  readonly requiredFutureGuards: readonly string[];
}

export const PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS = [
  {
    id: 'public-results-collection',
    routeFile: 'src/app/api/public-results/route.ts',
    publicPath: '/api/public-results',
    methods: ['POST'],
    runtime: 'nodejs',
    status: 'planned-only',
    dtoBoundary: 'public-result-api-dto-only',
    storageBoundary: 'adapter-interface-only',
    blockedUntil: 'phase-7.2-route-implementation'
  },
  {
    id: 'public-results-item',
    routeFile: 'src/app/api/public-results/[publicId]/route.ts',
    publicPath: '/api/public-results/{publicId}',
    methods: ['GET', 'DELETE'],
    runtime: 'nodejs',
    status: 'planned-only',
    dtoBoundary: 'public-result-api-dto-only',
    storageBoundary: 'adapter-interface-only',
    blockedUntil: 'phase-7.2-route-implementation'
  }
] as const satisfies readonly PublicResultRouteSkeletonDefinition[];

export const PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_ROUTE_FILES = PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS.map(
  (definition) => definition.routeFile
);

export const PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_PUBLIC_PATHS = PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS.map(
  (definition) => definition.publicPath
);

export const PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY = [
  'phase-7-1-defines-route-skeletons-only',
  'no-route-ts-files-created-yet',
  'no-exported-POST-GET-DELETE-handlers-yet',
  'no-request-body-parsing-yet',
  'no-response-construction-yet',
  'no-storage-adapter-binding-yet'
] as const;

export const PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR = [
  'no-fetch-or-network-transport',
  'no-database-write-or-read',
  'no-auth-session-lookup',
  'no-payment-or-ai-call',
  'no-analytics-event',
  'no-raw-answer-transport',
  'no-full-result-serialization-transport',
  'no-public-id-lookup-route-page'
] as const;

export const PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS = [
  'body-validation-before-create-handler',
  'public-id-validation-before-read-handler',
  'delete-token-validation-before-delete-handler',
  'dto-size-limit-before-storage-write',
  'rate-limit-before-production-deploy',
  'expiry-null-dto-before-read-response',
  'delete-token-never-returned-on-read-response'
] as const;

export const PUBLIC_RESULT_ROUTE_SKELETON_POLICY: PublicResultRouteSkeletonPolicy = {
  schemaVersion: PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION,
  phase: PUBLIC_RESULT_ROUTE_SKELETON_PHASE,
  mode: PUBLIC_RESULT_ROUTE_SKELETON_MODE,
  apiSchemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION,
  allowedRouteFiles: PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_ROUTE_FILES,
  allowedPublicPaths: PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_PUBLIC_PATHS,
  allowedMethods: PUBLIC_RESULT_API_ALLOWED_METHODS,
  definitions: PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS,
  requestHandlingBoundary: PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY,
  blockedBehavior: PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR,
  requiredFutureGuards: PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS
};

export function listPublicResultRouteSkeletonFiles(): readonly string[] {
  return PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_ROUTE_FILES;
}

export function listPublicResultRouteSkeletonMethods(): readonly PublicResultRouteSkeletonMethod[] {
  return PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS.flatMap((definition) => definition.methods);
}

export function isAllowedPublicResultRouteFile(routeFile: string): boolean {
  return (PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_ROUTE_FILES as readonly string[]).includes(routeFile);
}

export function containsBlockedPublicResultRouteSkeletonText(source: string): boolean {
  return [
    'export async function POST',
    'export async function GET',
    'export async function DELETE',
    'export const POST',
    'export const GET',
    'export const DELETE',
    'NextResponse.json',
    'request.json()',
    'fetch(',
    'PrismaClient',
    'createClient(',
    'rawAnswers',
    'serializeCorridorsResult'
  ].some((signal) => source.includes(signal));
}
