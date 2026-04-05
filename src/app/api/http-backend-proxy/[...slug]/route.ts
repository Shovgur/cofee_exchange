import { NextRequest, NextResponse } from 'next/server';

/**
 * Временный обход mixed content: страница на HTTPS не может дергать API по HTTP из браузера.
 * Прокси на сервере Next не ограничен этим правилом.
 *
 * Когда у API будет свой домен с HTTPS — удалить этот route и логику прокси в src/lib/api/index.ts
 * (искать комментарий «mixed-content» / http-backend-proxy).
 */
const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

function isAllowedProxyPath(path: string): boolean {
  if (!path.startsWith('v1/')) return false;
  if (path === 'v1/prices' || path.startsWith('v1/prices/')) return true;
  if (path === 'v1/sales' || path.startsWith('v1/sales/')) return true;
  return false;
}

async function proxy(request: NextRequest, slug: string[]): Promise<NextResponse> {
  const path = slug.join('/');
  if (!isAllowedProxyPath(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!BACKEND) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 });
  }

  const target = `${BACKEND}/api/${path}${request.nextUrl.search}`;
  const headers: HeadersInit = {
    Accept: request.headers.get('Accept') ?? 'application/json',
  };
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const ct = request.headers.get('Content-Type');
    if (ct) headers['Content-Type'] = ct;
  }

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    init.body = await request.text();
  }

  const res = await fetch(target, init);
  const body = await res.text();
  const outHeaders = new Headers();
  const ct = res.headers.get('Content-Type');
  if (ct) outHeaders.set('Content-Type', ct);
  return new NextResponse(body, { status: res.status, headers: outHeaders });
}

export async function GET(request: NextRequest, context: { params: { slug: string[] } }) {
  return proxy(request, context.params.slug);
}

export async function POST(request: NextRequest, context: { params: { slug: string[] } }) {
  return proxy(request, context.params.slug);
}
