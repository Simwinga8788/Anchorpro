import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://anchorpro-production.up.railway.app';

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = new URL(pathname + search, BACKEND).toString();

  const headers = new Headers();
  const skipHeaders = new Set(['host', 'content-length', 'connection', 'transfer-encoding']);
  req.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers,
    });

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
    });

    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (error: any) {
    return new NextResponse(`Proxy error: ${error.message}`, { status: 502 });
  }
}

export const GET = proxy;
