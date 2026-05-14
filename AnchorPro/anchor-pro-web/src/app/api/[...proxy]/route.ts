import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://anchorpro-production.up.railway.app';

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${BACKEND}${pathname}${search}`;

  const headers = new Headers();

  // Forward only safe, relevant headers — skip host, content-length (recomputed), connection
  const skipHeaders = new Set(['host', 'content-length', 'connection', 'transfer-encoding']);
  req.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? body : undefined,
    redirect: 'manual',
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Forward response headers, stripping Domain= from Set-Cookie so the
  // cookie binds to the Vercel domain instead of Railway's domain.
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const cleaned = value.replace(/;\s*domain=[^;]*/i, '');
      response.headers.append('set-cookie', cleaned);
    } else if (key.toLowerCase() !== 'content-encoding') {
      // Skip content-encoding — Next.js handles compression itself
      response.headers.set(key, value);
    }
  });

  return response;
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
