import { env } from 'cloudflare:workers';

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  if (!key.length || key.some(part => !part || part === '.' || part === '..' || part.includes('\0'))) return new Response(null, { status: 404 });
  const object = await env.MEDIA.get(key.join('/'));
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=86400',
    'ETag': object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.headers.get('if-none-match') === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(object.body as unknown as ReadableStream, { headers });
}
