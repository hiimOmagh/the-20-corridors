import { NextResponse, type NextRequest } from 'next/server';
import { handlePublicResultCreateRouteBody } from '@/core/public-link/publicResultRouteHandlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const result = await handlePublicResultCreateRouteBody(body);
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
