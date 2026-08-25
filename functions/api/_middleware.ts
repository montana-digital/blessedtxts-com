import { corsPreflight } from '../../src/lib/bible-api';

export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  if (context.request.method === 'OPTIONS') {
    return corsPreflight();
  }
  if (context.request.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Use GET (or OPTIONS for CORS preflight).',
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Allow: 'GET, OPTIONS',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
  return context.next();
}
