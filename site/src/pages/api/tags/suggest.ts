import type { APIRoute } from 'astro';
import { getDB, suggestTags } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  if (q.length < 1) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDB(locals);
  const tags = await suggestTags(db, q);

  return new Response(JSON.stringify(tags), {
    headers: { 'Content-Type': 'application/json' },
  });
};
