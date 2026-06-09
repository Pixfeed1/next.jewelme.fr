import { NextRequest } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://test4.jewelme.fr/api';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '5KC84V1MI8YJR54U4HSZWFK4IQG2RS28';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string; imageId: string }> }
) {
  const { productId, imageId } = await params;

  // Whitelist : refuser tout autre que digits pour éviter SSRF/path traversal
  if (!/^\d+$/.test(productId) || !/^\d+$/.test(imageId)) {
    return new Response('Bad request', { status: 400 });
  }

  const url = `${PRESTA_API_URL}/images/products/${productId}/${imageId}?ws_key=${PRESTA_API_KEY}`;

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) {
      return new Response('Image not found', { status: 404 });
    }
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Image fetch error', { status: 500 });
  }
}
