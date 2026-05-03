import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  clearSessionCookie(cookies);
  return new Response(null, {
    status: 302,
    headers: { Location: '/' },
  });
};
