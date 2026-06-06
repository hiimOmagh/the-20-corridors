import {
  PUBLIC_RESULT_API_ALLOWED_ENDPOINTS,
  PUBLIC_RESULT_API_ALLOWED_METHODS,
  PUBLIC_RESULT_API_SCHEMA_VERSION
} from './publicResultApi';

export const PUBLIC_RESULT_ROUTE_SKELETON_SCHEMA_VERSION = 'phase-7.3-backend-route-skeleton-v2' as const;
export const PUBLIC_RESULT_ROUTE_SKELETON_PHASE = 'phase-7.3-backend-route-files-with-dry-run-handlers' as const;
export const PUBLIC_RESULT_ROUTE_SKELETON_MODE = 'approved-route-files-dry-run-handlers-only' as const;

export type PublicResultRouteSkeletonMethod = 'POST' | 'GET' | 'DELETE';
export type PublicResultRouteSkeletonRuntime = 'nodejs';
export type PublicResultRouteSkeletonStatus = 'implemented-dry-run-only';

export interface PublicResultRouteSkeletonDefinition {
  readonly id: 'public-results-collection' | 'public-results-item';
  readonly routeFile: string;
  readonly publicPath: string;
  readonly methods: readonly PublicResultRouteSkeletonMethod[];
  readonly runtime: PublicResultRouteSkeletonRuntime;
  readonly status: PublicResultRouteSkeletonStatus;
  readonly dtoBoundary: 'public-result-api-dto-only';
  readonly storageBoundary: 'in-memory-adapter-only';
  readonly implementationBoundary: 'dry-run-handler-adapter-only';
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
    status: 'implemented-dry-run-only',
    dtoBoundary: 'public-result-api-dto-only',
    storageBoundary: 'in-memory-adapter-only',
    implementationBoundary: 'dry-run-handler-adapter-only'
  },
  {
    id: 'public-results-item',
    routeFile: 'src/app/api/public-results/[publicId]/route.ts',
    publicPath: '/api/public-results/{publicId}',
    methods: ['GET', 'DELETE'],
    runtime: 'nodejs',
    status: 'implemented-dry-run-only',
    dtoBoundary: 'public-result-api-dto-only',
    storageBoundary: 'in-memory-adapter-only',
    implementationBoundary: 'dry-run-handler-adapter-only'
  }
] as const satisfies readonly PublicResultRouteSkeletonDefinition[];

export const PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_ROUTE_FILES = PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS.map(
  (definition) => definition.routeFile
);

export const PUBLIC_RESULT_ROUTE_SKELETON_ALLOWED_PUBLIC_PATHS = PUBLIC_RESULT_ROUTE_SKELETON_DEFINITIONS.map(
  (definition) => definition.publicPath
);

export const PUBLIC_RESULT_ROUTE_SKELETON_REQUEST_HANDLING_BOUNDARY = [
  'approved-route-ts-files-created-in-phase-7-3',
  'only-approved-POST-GET-DELETE-handlers-exported',
  'request-body-parsing-limited-to-public-api-dto',
  'responses-built-from-dry-run-handler-results-only',
  'storage-binding-limited-to-in-memory-adapter',
  'no-database-client-binding',
  'no-raw-answer-or-full-result-transport'
] as const;

export const PUBLIC_RESULT_ROUTE_SKELETON_BLOCKED_BEHAVIOR = [
  'no-fetch-or-network-transport',
  'no-database-write-or-read',
  'no-auth-session-lookup',
  'no-payment-or-ai-call',
  'no-analytics-event',
  'no-raw-answer-transport',
  'no-full-result-serialization-transport',
  'no-persistent-public-id-page-route',
  'no-production-storage-adapter'
] as const;

export const PUBLIC_RESULT_ROUTE_SKELETON_REQUIRED_FUTURE_GUARDS = [
  'body-validation-before-create-handler',
  'public-id-validation-before-read-handler',
  'delete-token-validation-before-delete-handler',
  'dto-size-limit-before-storage-write',
  'rate-limit-before-production-deploy',
  'expiry-null-dto-before-read-response',
  'delete-token-never-returned-on-read-response',
  'replace-in-memory-adapter-before-production'
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
    'fetch(',
    'XMLHttpRequest',
    'navigator.sendBeacon',
    'PrismaClient',
    'createClient(',
    'drizzle(',
    'mongoose.connect',
    'rawAnswers',
    'serializeCorridorsResult',
    'runCorridorsEngine(input)',
    'OpenAI(',
    'generateText(',
    'streamText(',
    'stripe.checkout',
    'posthog.capture',
    'analytics.track'
  ].some((signal) => source.includes(signal));
}
