import { describe, expect, it } from 'vitest';
import {
  containsBlockedPublicResultRouteSkeletonText,
  isAllowedPublicResultRouteFile,
  listPublicResultRouteSkeletonFiles,
  listPublicResultRouteSkeletonMethods,
  PUBLIC_RESULT_ROUTE_SKELETON_POLICY
} from '../../src/core/public-link/publicResultRouteSkeleton';

describe('public result route skeleton policy', () => {
  it('defines only the planned public-result API route files', () => {
    expect(listPublicResultRouteSkeletonFiles()).toEqual([
      'src/app/api/public-results/route.ts',
      'src/app/api/public-results/[publicId]/route.ts'
    ]);
    expect(PUBLIC_RESULT_ROUTE_SKELETON_POLICY.allowedPublicPaths).toEqual([
      '/api/public-results',
      '/api/public-results/{publicId}'
    ]);
    expect(PUBLIC_RESULT_ROUTE_SKELETON_POLICY.mode).toBe('contract-only-no-route-files-no-request-handlers');
  });

  it('keeps planned methods aligned with the API DTO contract', () => {
    expect(listPublicResultRouteSkeletonMethods()).toEqual(['POST', 'GET', 'DELETE']);
    expect(PUBLIC_RESULT_ROUTE_SKELETON_POLICY.definitions[0]?.methods).toEqual(['POST']);
    expect(PUBLIC_RESULT_ROUTE_SKELETON_POLICY.definitions[1]?.methods).toEqual(['GET', 'DELETE']);
  });

  it('accepts only approved route file paths', () => {
    expect(isAllowedPublicResultRouteFile('src/app/api/public-results/route.ts')).toBe(true);
    expect(isAllowedPublicResultRouteFile('src/app/api/public-results/[publicId]/route.ts')).toBe(true);
    expect(isAllowedPublicResultRouteFile('src/app/api/private-results/route.ts')).toBe(false);
  });

  it('detects blocked request handler and private transport text', () => {
    expect(containsBlockedPublicResultRouteSkeletonText('export async function POST() { return NextResponse.json({}); }')).toBe(true);
    expect(containsBlockedPublicResultRouteSkeletonText('const rawAnswers = [];')).toBe(true);
    expect(containsBlockedPublicResultRouteSkeletonText('const plannedRoute = "POST /api/public-results";')).toBe(false);
  });
});
