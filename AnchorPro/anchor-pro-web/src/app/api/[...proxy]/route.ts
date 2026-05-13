import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://anchorpro-production.up.railway.app';

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${BACKEND}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    // @ts-expect-error — Node 18 fetch supports duplex for streaming bodies
    duplex: 'half',
    redirect: 'manual',
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Forward all response headers, stripping Domain= from Set-Cookie so the
  // cookie binds to the Next.js/Vercel domain instead of Railway's domain.
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const cleaned = value.replace(/;\s*domain=[^;]*/i, '');
      response.headers.append('set-cookie', cleaned);
    } else {
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
