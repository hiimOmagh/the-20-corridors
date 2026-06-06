import { NextResponse, type NextRequest } from 'next/server';
import { handlePublicResultDeleteRouteBody, handlePublicResultReadRoute } from '@/core/public-link/publicResultRouteHandlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PublicResultRouteContext {
  readonly params: Promise<{ readonly publicId: string }>;
}

export async function GET(_request: NextRequest, context: PublicResultRouteContext): Promise<NextResponse> {
  const { publicId } = await context.params;
  const result = await handlePublicResultReadRoute(publicId);
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}

export async function DELETE(request: NextRequest, context: PublicResultRouteContext): Promise<NextResponse> {
  const { publicId } = await context.params;
  const body = await request.json().catch(() => null);
  const result = await handlePublicResultDeleteRouteBody(publicId, body);
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
