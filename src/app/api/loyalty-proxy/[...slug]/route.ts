import { NextRequest, NextResponse } from 'next/server';

const LOYALTY_BACKEND = (
  process.env.NEXT_PUBLIC_LOYALTY_API_URL ?? 'https://api-loyalty.coffeeexchange.ru'
).replace(/\/$/, '');

async function proxy(request: NextRequest, slug: string[]): Promise<NextResponse> {
  const path = slug.join('/');
  if (!path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const target = `${LOYALTY_BACKEND}/api/v1/${path}${request.nextUrl.search}`;
  const headers: HeadersInit = {
    Accept: request.headers.get('Accept') ?? 'application/json',
  };

  const auth = request.headers.get('Authorization');
  if (auth) headers['Authorization'] = auth;

  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const ct = request.headers.get('Content-Type');
    if (ct) headers['Content-Type'] = ct;
  }

  const init: RequestInit = { method, headers, cache: 'no-store' };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    // multipart и бинарные тела нельзя читать как text()
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const resCt = res.headers.get('Content-Type') ?? '';
  const isJson =
    resCt.includes('application/json') || resCt.includes('text/');
  const body = isJson ? await res.text() : await res.arrayBuffer();
  const outHeaders = new Headers();
  const ct = res.headers.get('Content-Type');
  if (ct) outHeaders.set('Content-Type', ct);
  const retryAfter = res.headers.get('Retry-After');
  if (retryAfter) outHeaders.set('Retry-After', retryAfter);
  const contentDisposition = res.headers.get('Content-Disposition');
  if (contentDisposition) outHeaders.set('Content-Disposition', contentDisposition);

  return new NextResponse(body, { status: res.status, headers: outHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: { slug: string[] } },
) {
  return proxy(request, context.params.slug);
}

export async function POST(
  request: NextRequest,
  context: { params: { slug: string[] } },
) {
  return proxy(request, context.params.slug);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string[] } },
) {
  return proxy(request, context.params.slug);
}

export async function PUT(
  request: NextRequest,
  context: { params: { slug: string[] } },
) {
  return proxy(request, context.params.slug);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { slug: string[] } },
) {
  return proxy(request, context.params.slug);
}
